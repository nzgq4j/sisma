// One-line summaries of an alert rule for the rule cards (Me → Alerts): what it watches, its minimum and quiet hours.
import type { Rule } from './useAlerts';

type Msgs = Record<string, string>;
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
export const minutesToTime = hhmm;
export const timeToMinutes = (v: string) => { const [h, m] = v.split(':').map(Number); return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null; };

/** "Your saved places within 300 mi · Japan · Europe +2"; areas are named by the caller (countries / regions). */
export function watchingLine(r: Rule, k: Msgs, dist: (km: number) => string, areaNames: string[], max = 2) {
  const parts: string[] = [];
  if (r.nearPlaces) parts.push(r.radiusKm ? k.near.replace('{d}', dist(r.radiusKm)) : k.near_any);
  parts.push(...areaNames.slice(0, max));
  if (!parts.length) return k.nothing;
  const extra = areaNames.length - max;
  return parts.join(' · ') + (extra > 0 ? ' ' + k.more.replace('{n}', String(extra)) : '');
}

export function quietLine(r: Rule, k: Msgs) {
  if (!r.quiet) return k.off;
  return (r.quietMajor ? k.quiet_major_line : k.quiet_line).replace('{from}', hhmm(r.quietFrom)).replace('{to}', hhmm(r.quietTo));
}
