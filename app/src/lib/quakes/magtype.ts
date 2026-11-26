// Magnitude types as seismologists write them (feeds send them in lower case: "mww", "ml", "mb"). Moment and local
// magnitudes take a capital M (Mww, ML); body-wave magnitude keeps its lower-case mb. EMSC's bare "m" (type not
// given) reads as plain M.
const KNOWN: Record<string, string> = { m: 'M', ml: 'ML', mlr: 'MLr', mb: 'mb', mb_lg: 'mbLg', mblg: 'mbLg', mlg: 'mbLg', md: 'Md', ms: 'Ms', ms_20: 'Ms' };

export function magTypeLabel(type: string | undefined | null): string {
  if (!type) return 'M';
  const t = type.trim().toLowerCase();
  return KNOWN[t] ?? (t.startsWith('m') ? 'M' + t.slice(1) : t);
}
