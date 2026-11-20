// Server only: attaches the official tsunami alert (lib/tsunami/alerts.ts) to earthquakes, for every place that serves
// or draws them — GET /api/quakes, the share card, Bluesky posts. Without a database, the quakes are returned as they are.
import { adminClient } from '@/lib/auth';
import type { Quake } from '@/lib/quakes/types';
import { alertFor } from './alerts';
import { loadIncidents } from './poll';

export async function withTsunami<T extends Quake>(quakes: T[], days = 30): Promise<T[]> {
  const db = adminClient();
  if (!db || !quakes.length) return quakes;
  const list = await loadIncidents(db, days).catch(() => []);
  if (!list.length) return quakes;
  return quakes.map(q => { const a = alertFor(q, list); return a ? { ...q, tsunamiAlert: a } : q; });
}
