// The region view's Felt maps switch (Layers sheet), kept on the device. The Share sheet reads it too, so a share
// card only shows felt squares when they are switched on (GET /api/share-card?felt=0 leaves them out).
export const FELT_KEY = 'sisma.feltMaps';

export function readFeltOn(): boolean {
  try { return localStorage.getItem(FELT_KEY) !== '0'; } catch { return true; }
}
export function writeFeltOn(on: boolean) {
  try { localStorage.setItem(FELT_KEY, on ? '1' : '0'); } catch { /* storage unavailable */ }
}
