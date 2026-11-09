// The Pacific Ring of Fire as a rough outline for counting earthquakes (science article "The Ring of Fire"): the
// subduction zones and plate boundaries around the Pacific, from New Zealand, Tonga and Indonesia through the
// Philippines, Japan and Kamchatka, across the Aleutians and Alaska, and down the west of the Americas to Chile.
// Hawaii (a hotspot) and the East Pacific Rise (a spreading ridge, e.g. Easter Island) lie inside the Pacific and are
// left out, as are the Caribbean and Scotia arcs on the Atlantic side. It is a set of latitude / longitude boxes, so
// it is approximate at the edges.

/** [south, north, west, east] in degrees; west > east wraps across 180°. */
type Box = [number, number, number, number];

const BOXES: Box[] = [
  [-15, 8, 95, 180],      // Sumatra and Java to Papua, Solomons, Vanuatu, Fiji
  [8, 62, 119, 180],      // Philippines, Taiwan, Ryukyu, Japan, Kurils, Kamchatka
  [-52, -15, 160, 180],   // New Zealand, Kermadec (west of 180°)
  [-52, 8, -180, -170],   // Tonga, Kermadec, Samoa (east of 180°)
  [50, 66, -180, -130],   // Aleutians, Alaska
  [25, 60, -135, -110],   // Pacific coast of Canada and the United States, Cascadia, California
  [5, 25, -118, -83],     // Mexico and Central America
  [-60, 5, -90, -63],     // Andes: Colombia, Ecuador, Peru, Chile, Argentina
];

/** True when a point lies in the rough outline of the Pacific Ring of Fire. */
export function onRingOfFire(lat: number, lon: number): boolean {
  const x = ((lon + 540) % 360) - 180;
  return BOXES.some(([s, n, w, e]) => lat >= s && lat <= n && (w <= e ? x >= w && x <= e : x >= w || x <= e));
}
