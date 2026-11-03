// world-atlas 110m outlines as GeoJSON, without React, so server code (api/share-card via lib/country.ts) can use them.
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';

const topo = world as unknown as Topology<{ countries: GeometryCollection; land: GeometryCollection }>;
export const COUNTRIES = feature(topo, topo.objects.countries);
export const LAND = feature(topo, topo.objects.land);
/** Coastlines and borders as lines (each shared edge once). Stroking these instead of the country polygons
 *  leaves no line along the projection's cut, so wrapped map copies join without a seam. */
export const BORDERS = mesh(topo, topo.objects.countries);
export const SPHERE = { type: 'Sphere' } as const;
