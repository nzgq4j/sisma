// Alert radius choices (stored in km; 0 = anywhere). In miles they are round numbers of miles: 50, 150, 300, 600.
import { KM_PER_MI, type Units } from './units';

export const ALERT_RADII: Record<Units, number[]> = {
  km: [100, 250, 500, 1000, 0],
  mi: [50, 150, 300, 600, 0].map(r => Math.round(r * KM_PER_MI)),
};

/** The choice in `units` closest to a stored radius (by ratio), so a radius saved in the other units still matches
 *  one of the options shown; 0 (anywhere) stays 0. */
export function snapRadius(km: number, units: Units): number {
  if (!km) return 0;
  return ALERT_RADII[units].filter(Boolean)
    .reduce((a, b) => (Math.abs(Math.log(b / km)) < Math.abs(Math.log(a / km)) ? b : a));
}
