// How an official tsunami alert looks in the app (client-safe): a tone for the badge on pins and the icon on rows.
// Only active messages that say there may be a hazard get a tone; information statements, JMA forecasts, cancelled
// and ended messages are shown in neutral ink.
import { TSUNAMI_HAZARD, type TsunamiAlert } from './types';

export type TsunamiTone = 'warning' | 'threat' | 'watch';

export function tsunamiTone(a: TsunamiAlert | undefined | null): TsunamiTone | null {
  if (!a || a.status !== 'active' || !TSUNAMI_HAZARD.has(a.level)) return null;
  return a.level === 'major_warning' || a.level === 'warning' ? 'warning' : a.level === 'threat' ? 'threat' : 'watch';
}
export const toneVar = (t: TsunamiTone) => `var(--tsu-${t})`;
