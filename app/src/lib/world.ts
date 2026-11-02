'use client';
// Shared geography for the map, globe and dashboard: world-atlas 110m countries/land, and the
// PB2002 plate boundaries (public/data/plate-boundaries.json) and Natural Earth lakes (public/data/lakes.json),
// each loaded once when first needed.
import { useEffect, useState } from 'react';
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { MultiLineString, MultiPolygon } from 'geojson';
import world from 'world-atlas/countries-110m.json';

const topo = world as unknown as Topology<{ countries: GeometryCollection; land: GeometryCollection }>;
export const COUNTRIES = feature(topo, topo.objects.countries);
export const LAND = feature(topo, topo.objects.land);
/** Coastlines and borders as lines (each shared edge once). Stroking these instead of the country polygons
 *  leaves no line along the projection's cut, so wrapped map copies join without a seam. */
export const BORDERS = mesh(topo, topo.objects.countries);
export const SPHERE = { type: 'Sphere' } as const;

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
