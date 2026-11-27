// True north along the Pacific Fire Ribbon's route, for the 3D view's compass. Server only (uses the route transform).
import { fromRibbon } from './transform';

/**
 * True north at a point on the route, as a unit vector in route coordinates [along, left]: the direction in which
 * latitude rises fastest, from the latitude change over 20 km along and 20 km across the route (both axes are
 * distances, so the latitude gradient points north). The 3D view turns its compass with it.
 */
export function northAt(x: number): [number, number] {
  const d = 20, p = fromRibbon(x, 0), a = fromRibbon(x + d, 0), l = fromRibbon(x, d);
  const nx = a.lat - p.lat, ny = l.lat - p.lat, n = Math.hypot(nx, ny) || 1;
  return [nx / n, ny / n];
}
