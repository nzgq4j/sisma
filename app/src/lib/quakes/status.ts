import type { ReviewStatus, SourceId } from './types';

/**
 * Normalises an agency's own review flag. Returns `null` for events the agency has deleted (drop them) and
 * `undefined` when the source does not publish one (EMSC's FDSN JSON and JMA's list carry no review flag).
 * USGS `properties.status`: automatic | reviewed | deleted.
 * GeoNet `properties.quality`: automatic | preliminary | best | deleted.
 */
export function reviewStatus(source: SourceId, raw: unknown): ReviewStatus | null | undefined {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!v) return undefined;
  if (v === 'deleted') return null;
  if (source === 'usgs') return v === 'reviewed' ? 'reviewed' : v === 'automatic' ? 'automatic' : undefined;
  if (source === 'geonet') return v === 'best' ? 'reviewed' : v === 'preliminary' ? 'preliminary' : v === 'automatic' ? 'automatic' : undefined;
  return undefined;
}
