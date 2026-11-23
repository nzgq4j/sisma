// The map view that shows a set of events (desktop overview: the place chosen in the top-right picker): their centre and a
// span in degrees of longitude across the map's shorter side (WorldMap `focus.span`, Mercator). Longitudes are taken
// the short way round, so a place across the antimeridian (Fiji, the Aleutians) stays one area.
import { REGION_SPAN } from './world-regions';

/** Width of the map relative to its height; the dashboard map is about 1.9 : 1, so 1.6 leaves room. */
const ASPECT = 1.6;
/** Margin around the events. */
const PAD = 1.35;

/** Where the middle of the events sits on the map (0 top, 1 bottom): a little low, as pins stand above their point. */
export const FIT_Y = 0.55;

export function fitArea(points: { lat: number; lon: number }[]): { lat: number; lon: number; span: number } | null {
  if (!points.length) return null;
  const lats = points.map(p => p.lat);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  // Longitudes: the arc that leaves out the largest gap between neighbouring events.
  const lons = points.map(p => ((p.lon % 360) + 540) % 360 - 180).sort((a, b) => a - b);
  let gap = lons[0] + 360 - lons[lons.length - 1], start = lons[0];
  for (let i = 1; i < lons.length; i++) if (lons[i] - lons[i - 1] > gap) { gap = lons[i] - lons[i - 1]; start = lons[i]; }
  const lonRange = 360 - gap;
  const lon = ((start + lonRange / 2 + 540) % 360) - 180;
  // Mercator: the vertical extent in the same units as longitude (degrees), and the latitude at its middle.
  const y = (d: number) => (Math.log(Math.tan(Math.PI / 4 + (Math.max(-85, Math.min(85, d)) * Math.PI) / 360)) * 180) / Math.PI;
  const y1 = y(minLat), y2 = y(maxLat);
  const lat = (Math.atan(Math.exp((((y1 + y2) / 2) * Math.PI) / 180)) * 360) / Math.PI - 90;
  const span = Math.min(160, Math.max(REGION_SPAN, PAD * Math.max(y2 - y1, lonRange / ASPECT)));
  return { lat, lon, span };
}
