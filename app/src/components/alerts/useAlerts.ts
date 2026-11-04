'use client';
// Data for Me → Alerts: the master switch (alert_settings.enabled), the user's alert rules (alert_rules, up to
// ENTITLEMENTS.plus.maxAlertRules) and their alert history (alert_deliveries). Row-level security limits every query to
// the signed-in user's own rows; the database refuses rules without sisma+ and more than 5 (so does the app).
import { useCallback, useEffect, useState } from 'react';
import { useAccount } from '@/components/Account';
import { supabaseBrowser } from '@/lib/supabase-browser';
import type { WorldRegion } from '@/lib/world-regions';

export interface Rule {
  id: string; position: number; name: string; enabled: boolean; minMagnitude: number;
  nearPlaces: boolean; radiusKm: number; countries: string[]; regions: WorldRegion[];
  quiet: boolean; quietFrom: number; quietTo: number; quietTz: string; quietMajor: boolean;
}
interface RuleRow {
  id: string; position: number; name: string; enabled: boolean; min_magnitude: number | string; near_places: boolean; radius_km: number;
  countries: string[] | null; regions: string[] | null; quiet: boolean; quiet_from: number; quiet_to: number; quiet_tz: string; quiet_major: boolean;
}
const COLS = 'id, position, name, enabled, min_magnitude, near_places, radius_km, countries, regions, quiet, quiet_from, quiet_to, quiet_tz, quiet_major';
const fromRow = (r: RuleRow): Rule => ({
  id: r.id, position: r.position, name: r.name, enabled: r.enabled, minMagnitude: Number(r.min_magnitude), nearPlaces: r.near_places,
  radiusKm: r.radius_km, countries: r.countries ?? [], regions: (r.regions ?? []) as WorldRegion[], quiet: r.quiet, quietFrom: r.quiet_from,
  quietTo: r.quiet_to, quietTz: r.quiet_tz, quietMajor: r.quiet_major,
});
const toRow = (p: Partial<Rule>) => {
  const o: Record<string, unknown> = {};
  if (p.name !== undefined) o.name = p.name;
  if (p.enabled !== undefined) o.enabled = p.enabled;
  if (p.minMagnitude !== undefined) o.min_magnitude = p.minMagnitude;
  if (p.nearPlaces !== undefined) o.near_places = p.nearPlaces;
  if (p.radiusKm !== undefined) o.radius_km = p.radiusKm;
  if (p.countries !== undefined) o.countries = p.countries;
  if (p.regions !== undefined) o.regions = p.regions;
  if (p.quiet !== undefined) o.quiet = p.quiet;
  if (p.quietFrom !== undefined) o.quiet_from = p.quietFrom;
  if (p.quietTo !== undefined) o.quiet_to = p.quietTo;
  if (p.quietTz !== undefined) o.quiet_tz = p.quietTz;
  if (p.quietMajor !== undefined) o.quiet_major = p.quietMajor;
  return o;
};
/** This device's time zone, for quiet hours. */
export const deviceTimeZone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } };

export function useAlertRules() {
  const { user } = useAccount();
  const [state, setState] = useState<{ loading: boolean; enabled: boolean; rules: Rule[] }>({ loading: true, enabled: false, rules: [] });
  const [error, setError] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !user) { void Promise.resolve().then(() => setState({ loading: false, enabled: false, rules: [] })); return; }
    let alive = true;
    void Promise.all([
      sb.from('alert_settings').select('enabled').eq('user_id', user.id).maybeSingle(),
      sb.from('alert_rules').select(COLS).order('position').order('created_at'),
    ]).then(([s, r]) => {
      if (!alive) return;
      setState({ loading: false, enabled: !!s.data?.enabled, rules: ((r.data ?? []) as RuleRow[]).map(fromRow) });
      if (r.error) setError(true);
    });
    return () => { alive = false; };
  }, [user]);

  const setEnabled = useCallback(async (enabled: boolean) => {
    const sb = supabaseBrowser(); if (!sb || !user) return false;
    setState(s => ({ ...s, enabled })); setError(false);
    const { error: e } = await sb.from('alert_settings').upsert({ user_id: user.id, enabled, updated_at: new Date().toISOString() });
    if (e) { setState(s => ({ ...s, enabled: !enabled })); setError(true); return false; }
    return true;
  }, [user]);

  const update = useCallback(async (id: string, patch: Partial<Rule>) => {
    const sb = supabaseBrowser(); if (!sb || !user) return false;
    let before: Rule | undefined;
    setState(s => ({ ...s, rules: s.rules.map(r => { if (r.id !== id) return r; before = r; return { ...r, ...patch }; }) })); setError(false);
    const { error: e } = await sb.from('alert_rules').update(toRow(patch)).eq('id', id);
    if (e) { setState(s => ({ ...s, rules: s.rules.map(r => (r.id === id && before ? before : r)) })); setError(true); return false; }
    return true;
  }, [user]);

  /** Adds a rule with sensible defaults (near the saved places within 500 km, M5+); returns its id. */
  const add = useCallback(async (name: string, position: number) => {
    const sb = supabaseBrowser(); if (!sb || !user) return null;
    setError(false);
    const { data, error: e } = await sb.from('alert_rules').insert({ user_id: user.id, name, position, quiet_tz: deviceTimeZone() }).select(COLS).single();
    if (e || !data) { setError(true); return null; }
    setState(s => ({ ...s, rules: [...s.rules, fromRow(data as RuleRow)] }));
    return (data as RuleRow).id;
  }, [user]);

  const remove = useCallback(async (id: string) => {
    const sb = supabaseBrowser(); if (!sb || !user) return false;
    setError(false);
    const { error: e } = await sb.from('alert_rules').delete().eq('id', id);
    if (e) { setError(true); return false; }
    setState(s => ({ ...s, rules: s.rules.filter(r => r.id !== id) }));
    return true;
  }, [user]);

  return { ...state, error, setEnabled, update, add, remove };
}

export interface Delivery { quakeId: string; quakeTime: number; sentAt: number; mag: number; place: string | null; lat: number; lon: number; ruleName: string | null }

/** The most recent alerts sent to this account (kept 30 days). */
export function useAlertHistory(limit = 50) {
  const { user } = useAccount();
  const [items, setItems] = useState<Delivery[] | null>(null);
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !user) { void Promise.resolve().then(() => setItems([])); return; }
    let alive = true;
    void sb.from('alert_deliveries').select('quake_id, quake_time, sent_at, mag, place, lat, lon, alert_rules(name)')
      .order('sent_at', { ascending: false }).limit(limit)
      .then(({ data }) => {
        if (!alive) return;
        type Row = { quake_id: string; quake_time: string; sent_at: string; mag: number | string; place: string | null; lat: number; lon: number; alert_rules: { name: string } | null };
        setItems(((data ?? []) as unknown as Row[]).map(d => ({
          quakeId: d.quake_id, quakeTime: Date.parse(d.quake_time), sentAt: Date.parse(d.sent_at), mag: Number(d.mag), place: d.place,
          lat: d.lat, lon: d.lon, ruleName: d.alert_rules?.name ?? null,
        })));
      });
    return () => { alive = false; };
  }, [user, limit]);
  return items;
}
