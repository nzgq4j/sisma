'use client';
// Shared geography for the map, globe and dashboard: world-atlas 110m countries/land, and the
// PB2002 plate boundaries (public/data/plate-boundaries.json) and Natural Earth lakes (public/data/lakes.json),
// each loaded once when first needed.
import { useEffect, useState } from 'react';
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { MultiLineString, MultiPolygon } from 'geojson';
export { BORDERS, COUNTRIES, LAND, SPHERE } from './world-data';

let platesPromise: Promise<MultiLineString | null> | null = null;
let platesCache: MultiLineString | null = null;
function loadPlates() {
  platesPromise ??= fetch('/data/plate-boundaries.json')
    .then(r => (r.ok ? (r.json() as Promise<MultiLineString>) : null))
    .then(d => (platesCache = d))
    .catch(() => null);
  return platesPromise;
}

/** Plate boundary lines, fetched the first time `wanted` is true. */
export function usePlates(wanted: boolean) {
  const [data, setData] = useState<MultiLineString | null>(platesCache);
  useEffect(() => {
    if (!wanted || data) return;
    let alive = true;
    loadPlates().then(d => { if (alive) setData(d); });
    return () => { alive = false; };
  }, [wanted, data]);
  return data;
}

let lakesPromise: Promise<MultiPolygon | null> | null = null;
let lakesCache: MultiPolygon | null = null;

/** Major lakes (Natural Earth 1:50m), drawn in the sea colour over the land. Fetched once, after first render. */
export function useLakes() {
  const [data, setData] = useState<MultiPolygon | null>(lakesCache);
  useEffect(() => {
    if (data) return;
    let alive = true;
    lakesPromise ??= fetch('/data/lakes.json')
      .then(r => (r.ok ? (r.json() as Promise<MultiPolygon>) : null))
      .then(d => (lakesCache = d))
      .catch(() => null);
    lakesPromise.then(d => { if (alive) setData(d); });
    return () => { alive = false; };
  }, [data]);
  return data;
}

type Detail = { countries: ReturnType<typeof feature>; borders: ReturnType<typeof mesh> };
let detailPromise: Promise<Detail | null> | null = null;
let detailCache: Detail | null = null;

/** world-atlas 1:50m countries (smaller islands, finer coasts) for zoomed-in views; loaded the first time `wanted`. */
export function useDetailedWorld(wanted: boolean) {
  const [data, setData] = useState<Detail | null>(detailCache);
  useEffect(() => {
    if (!wanted || data) return;
    let alive = true;
    detailPromise ??= import('world-atlas/countries-50m.json')
      .then(mod => {
        const t = (mod.default ?? mod) as unknown as Topology<{ countries: GeometryCollection }>;
        return (detailCache = { countries: feature(t, t.objects.countries), borders: mesh(t, t.objects.countries) });
      })
      .catch(() => null);
    detailPromise.then(d => { if (alive) setData(d); });
    return () => { alive = false; };
  }, [wanted, data]);
  return data;
}
