// One line naming an official tsunami alert, for the share card, its image description and posts (client-safe):
// "Tsunami warning · PTWC", with "· Cancelled" / "· No longer in effect" when it no longer applies.
import type { TsunamiAlert } from './types';

export interface TsunamiStrings { cancelled: string; ended: string; [level: `lv_${string}`]: string }

export function tsunamiLine(a: TsunamiAlert, t: TsunamiStrings): string {
  const level = t[`lv_${a.level}`] ?? a.title;
  return `${level} · ${a.center}${a.status === 'cancelled' ? ` · ${t.cancelled}` : a.status === 'ended' ? ` · ${t.ended}` : ''}`;
}
