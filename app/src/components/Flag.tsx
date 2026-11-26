'use client';
// A small round country flag for an event (the country containing it, or the nearest within 300 km: lib/country.ts,
// worked out by the server for each event in GET /api/quakes), shown before the place in the detail sheet, the summary
// card and the feed rows. Bundled SVGs in public/flags/.
/* eslint-disable @next/next/no-img-element -- small bundled flag SVGs */
import type { Quake } from '@/lib/quakes/types';

/** Country code (lowercase ISO alpha-2) of an event, or null at sea far from any country. */
export function countryCode(q: Pick<Quake, 'country'>): string | null {
  return q.country?.code ?? null;
}

export function Flag({ code, size = 20 }: { code: string; size?: number }) {
  return <img src={`/flags/${code}.svg`} alt="" width={size} height={size} loading="lazy" decoding="async"
    style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flex: 'none', boxShadow: '0 0 0 1px var(--line)' }} />;
}
