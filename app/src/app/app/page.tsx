'use client';
// Feed tab. Spec: design/SismaApp.dc.html (isFeed block + detail sheet). Remaining TODOs are marked.
// Filters (time range, magnitude, world region, place) live in the same pull-up panel as on the Map and Globe.
// At >= 1024px this route shows the desktop dashboard (components/dash) instead.
import { FilterPanel, PANEL_PEEK } from '@/components/stage/FilterPanel';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useMemo, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useQuakeData } from '@/components/QuakeData';
import { QuakeRow } from '@/components/QuakeRow';
import { QuakeDetail } from '@/components/QuakeDetail';
import { Sheet } from '@/components/Sheet';
import type { SortKey } from '@/lib/quakes/types';
import { Dashboard } from '@/components/dash/Dashboard';
import { useDesktop } from '@/components/dash/useDesktop';

// Desktop renders the overview dashboard; phones (and the website's phone preview) get the feed.
export default function FeedPage() {
  return useDesktop() ? <Dashboard /> : <MobileFeed />;
}

function MobileFeed() {
  const { t } = useT();
  // mapList = the filtered list including the minimum magnitude (the same events as the Map and Globe).
  const { mapList: list, refresh } = useQuakeData();
  const [sort, setSort] = useState<SortKey>('time');
  const [selId, setSelId] = useState<string | null>(null);
  const sel = list.find(q => q.id === selId) ?? null;

  const rows = useMemo(() => {
    const s = [...list];
    if (sort === 'mag') s.sort((a, b) => b.mag - a.mag);
    else if (sort === 'distance') s.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    else s.sort((a, b) => b.time - a.time);
    return s;
  }, [list, sort]);

  return (
    // Bottom padding keeps the last rows clear of the collapsed filter panel. Pull down at the top to refresh.
    <>
    <PullToRefresh onRefresh={refresh} />
    <div style={{ padding: `4px 16px ${PANEL_PEEK + 20}px`, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* TODO: filter button (sisma+ advanced filters) and the "Nearest recent" card */}
      <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 16, padding: 4, gap: 4 }}>
        {(['time', 'distance', 'mag'] as SortKey[]).map(k => (
          <button key={k} onClick={() => setSort(k)} style={{ flex: 1, height: 40, border: 0, borderRadius: 12, background: sort === k ? 'var(--surface)' : 'transparent', color: sort === k ? 'var(--ink)' : 'var(--ink2)', fontWeight: 700, font: 'inherit', cursor: 'pointer' }}>
            {t(k === 'time' ? 'sort_time' : k === 'distance' ? 'sort_distance' : 'sort_mag')}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.slice(0, 60).map(q => <QuakeRow key={q.id} q={q} onOpen={() => setSelId(q.id)} />)}
      </div>
      {!sel && <FilterPanel fixed />}
      <Sheet open={!!sel} onClose={() => setSelId(null)} label={sel?.region}>
        {/* TODO: "Report what you felt" → report sheet */}
        {sel && <QuakeDetail q={sel} onClose={() => setSelId(null)} />}
      </Sheet>
    </div>
    </>
  );
}
