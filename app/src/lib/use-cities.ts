'use client';
// The cities for the map's and globe's names (lib/cities.ts), fetched once from public/data/cities.json when first needed. Kept
// apart from lib/cities.ts, which the server also uses (share card names, lib/share-map.ts).
import { useEffect, useState } from 'react';
import { parseCities, type Box, type City, type CityData } from './cities';

let promise: Promise<City[] | null> | null = null;
let cache: City[] | null = null;

/** The cities, fetched once (later calls share the same request). Most important first; null if it failed. */
export function loadCities(): Promise<City[] | null> {
  promise ??= fetch('/data/cities.json')
    .then(r => (r.ok ? (r.json() as Promise<CityData>) : null))
    .then(d => (cache = d ? parseCities(d) : null))
    .catch(() => null);
  return promise;
}

/** The cities, fetched the first time `wanted` (zoomed in far enough). Most important first. */
export function useCities(wanted: boolean): City[] | null {
  const [data, setData] = useState<City[] | null>(cache);
  useEffect(() => {
    if (!wanted || data) return;
    let alive = true;
    loadCities().then(d => { if (alive) setData(d); });
    return () => { alive = false; };
  }, [wanted, data]);
  return data;
}

/** Screen areas taken by controls over a map (elements marked data-map-overlay inside `root`), relative to `base`
 *  (the canvas the names are drawn on), with a little room; city names keep clear of them. */
export function overlayBoxes(root: Element | null | undefined, base: Element): Box[] {
  if (!root) return [];
  const b = base.getBoundingClientRect();
  return [...root.querySelectorAll('[data-map-overlay]')].map(el => {
    const r = el.getBoundingClientRect();
    return [r.left - b.left - 4, r.top - b.top - 4, r.right - b.left + 4, r.bottom - b.top + 4] as Box;
  }).filter(x => x[2] > x[0] && x[3] > x[1]);
}
