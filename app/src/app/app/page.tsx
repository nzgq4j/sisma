'use client';
// Feed tab. Spec: design/SismaApp.dc.html (isFeed block + detail sheet). Remaining TODOs are marked.
import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { QuakeRow } from '@/components/QuakeRow';
import { Sheet } from '@/components/Sheet';
import type { Quake, RangeKey, SortKey } from '@/lib/quakes/types';

type Row = Quake & { distanceKm: number | null };

export default function FeedPage() {
  const { t } = useT();
  const { locations, active, plan, setSheet, sheet } = useApp();
  const loc = locations[active];
  const [sort, setSort] = useState<SortKey>('time');
  const [range, setRange] = useState<RangeKey>('7d');
  const [region, setRegion] = useState('all');
  const [rows, setRows] = useState<Row[]>([]);
  const [sel, setSel] = useState<Row | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams({ range, sort, region, lat: String(loc.lat), lon: String(loc.lon) });
    fetch('/api/quakes?' + qs).then(r => (r.status === 402 ? (setSheet('paywall'), null) : r.json())).then(j => j && setRows(j.quakes));
  }, [range, sort, region, loc.lat, loc.lon, setSheet]);

  const regions = useMemo(() => {
    const c = new Map<string, number>(); rows.forEach(r => c.set(r.region, (c.get(r.region) ?? 0) + 1));
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [rows]);

  return (
    <div style={{ padding: '4px 16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* TODO: top app bar (logo, filter button, language pill) and the "Nearest recent" card */}
      <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 16, padding: 4, gap: 4 }}>
        {(['time', 'distance', 'mag'] as SortKey[]).map(k => (
          <button key={k} onClick={() => setSort(k)} style={{ flex: 1, height: 40, border: 0, borderRadius: 12, background: sort === k ? 'var(--surface)' : 'transparent', color: sort === k ? 'var(--ink)' : 'var(--ink2)', fontWeight: 700 }}>
            {t(k === 'time' ? 'sort_time' : k === 'distance' ? 'sort_distance' : 'sort_mag')}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
        {(['24h', '7d', '30d', '1y'] as RangeKey[]).map(r => (
          <button key={r} onClick={() => (r === '1y' && plan === 'free' ? setSheet('paywall') : setRange(r))} style={{ flex: 'none', height: 34, borderRadius: 17, border: '1px solid var(--line)', background: range === r ? 'var(--violet)' : 'var(--surface)', color: range === r ? 'var(--on-violet)' : 'var(--ink)', whiteSpace: 'nowrap', padding: '0 12px' }}>
            {t(r === '24h' ? 'r24' : r === '7d' ? 'r7' : r === '30d' ? 'r30' : 'r1y')}{r === '1y' && plan === 'free' ? ' 🔒' : ''}
          </button>
        ))}
        {[['all', t('all_regions')] as const, ...regions.map(([r]) => [r, r] as const)].map(([id, label]) => (
          <button key={id} onClick={() => setRegion(id)} style={{ flex: 'none', height: 34, borderRadius: 17, border: '1px solid var(--line)', background: region === id ? 'var(--violet)' : 'var(--surface)', color: region === id ? 'var(--on-violet)' : 'var(--ink)', whiteSpace: 'nowrap', padding: '0 12px' }}>{label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.slice(0, 60).map(q => <QuakeRow key={q.id} q={q} onOpen={() => { setSel(q); setSheet('detail'); }} />)}
      </div>
      <Sheet open={sheet === 'detail' && !!sel} onClose={() => setSheet(null)}>
        {/* TODO: detail sheet — stats grid, tsunami banner, DYFI felt count, "Report what you felt" → report sheet */}
        <strong>{sel?.region}</strong>
      </Sheet>
    </div>
  );
}
