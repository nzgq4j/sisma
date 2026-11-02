// Place search adapter. Provider: Nominatim (OpenStreetMap data, ODbL — credit "© OpenStreetMap contributors").
// Usage policy (operations.osmfoundation.org/policies/nominatim): ≤ 1 request/s, identify the app, cache results,
// no search-as-you-type. The app searches on submit through /api/places, which throttles and caches.
// To move to a paid geocoder later, add another `parse…` adapter and switch the URL in the route.

export interface PlaceHit { name: string; detail: string; lat: number; lon: number }

interface NominatimRow {
  lat: string; lon: string; name?: string; display_name?: string;
  address?: Record<string, string | undefined>;
}

const NAME_KEYS = ['city', 'town', 'village', 'hamlet', 'municipality', 'suburb', 'county', 'state', 'country'];

export function parseNominatim(rows: unknown): PlaceHit[] {
  if (!Array.isArray(rows)) return [];
  const seen = new Set<string>();
  const out: PlaceHit[] = [];
  for (const r of rows as NominatimRow[]) {
    const lat = Number(r.lat), lon = Number(r.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    const a = r.address ?? {};
    const name = (r.name || NAME_KEYS.map(k => a[k]).find(Boolean) || r.display_name?.split(',')[0] || '').trim();
    if (!name) continue;
    const region = [a.state, a.region, a.county].find(v => v && v !== name);
    const detail = [region, a.country !== name ? a.country : undefined].filter(Boolean).join(', ');
    const key = `${name}|${detail}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name: name.slice(0, 120), detail: detail.slice(0, 160), lat: Math.round(lat * 1e4) / 1e4, lon: Math.round(lon * 1e4) / 1e4 });
  }
  return out;
}
