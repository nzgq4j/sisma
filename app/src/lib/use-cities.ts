'use client';
// The cities for the map's names (lib/cities.ts), fetched once from public/data/cities.json when first needed. Kept
// apart from lib/cities.ts, which the server also uses (share card names, lib/share-map.ts).
import { useEffect, useState } from 'react';
import { parseCities, type City, type CityData } from './cities';

let promise: Promise<City[] | null> | null = null;
let cache: City[] | null = null;

/** The cities, fetched the first time `wanted` (zoomed in far enough). Most important first. */
export function useCities(wanted: boolean): City[] | null {
  const [data, setData] = useState<City[] | null>(cache);
  useEffect(() => {
    if (!wanted || data) return;
    let alive = true;
    promise ??= fetch('/data/cities.json')
      .then(r => (r.ok ? (r.json() as Promise<CityData>) : null))
      .then(d => (cache = d ? parseCities(d) : null))
      .catch(() => null);
    promise.then(d => { if (alive) setData(d); });
    return () => { alive = false; };
  }, [wanted, data]);
  return data;
}
