export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

/** Degrees–minutes–seconds, e.g. 51°33'25.2"N 016°02'24.4"E (longitude padded to 3 digits). */
export function formatDms(lat: number, lon: number) {
  const part = (v: number, pos: string, neg: string, pad: number) => {
    const a = Math.abs(v);
    const mFloat = (a - Math.floor(a)) * 60;
    let d = Math.floor(a), m = Math.floor(mFloat), s = Math.round((mFloat - m) * 600) / 10;
    if (s >= 60) { s = 0; m += 1; }
    if (m >= 60) { m = 0; d += 1; }
    return `${String(d).padStart(pad, '0')}°${String(m).padStart(2, '0')}'${s.toFixed(1).padStart(4, '0')}"${v >= 0 ? pos : neg}`;
  };
  return `${part(lat, 'N', 'S', 2)} ${part(lon, 'E', 'W', 3)}`;
}
