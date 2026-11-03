'use client';
// Feed tab. Spec: design/SismaApp.dc.html (isFeed block + detail sheet). Remaining TODOs are marked.
// At >= 1024px this route shows the desktop dashboard (components/dash) instead.
import { RegionFilterChip } from '@/components/stage/StageParts';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useQuakeData, VIEW_RANGES, RANGE_LABEL } from '@/components/QuakeData';
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

const chip = (on: boolean): React.CSSProperties => ({ flex: 'none', height: 34, borderRadius: 17, border: '1px solid var(--line)', background: on ? 'var(--violet)' : 'var(--surface)', color: on ? 'var(--on-violet)' : 'var(--ink)', whiteSpace: 'nowrap', padding: '0 12px', display: 'inline-flex', alignItems: 'center', gap: 4, font: 'inherit', fontSize: 13, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' });

function MobileFeed() {
  const { t } = useT();
  const { plan } = useApp();
  const { range, setRange, region, setRegion, list, regions } = useQuakeData();
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
    <div style={{ padding: '4px 16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* TODO: filter button (sisma+ advanced filters) and the "Nearest recent" card */}
      <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 16, padding: 4, gap: 4 }}>
        {(['time', 'distance', 'mag'] as SortKey[]).map(k => (
          <button key={k} onClick={() => setSort(k)} style={{ flex: 1, height: 40, border: 0, borderRadius: 12, background: sort === k ? 'var(--surface)' : 'transparent', color: sort === k ? 'var(--ink)' : 'var(--ink2)', fontWeight: 700, font: 'inherit', cursor: 'pointer' }}>
            {t(k === 'time' ? 'sort_time' : k === 'distance' ? 'sort_distance' : 'sort_mag')}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {VIEW_RANGES.map(r => (r === '1y' && plan === 'free'
          ? <Link key={r} href="/app/me" style={chip(false)}>{t(RANGE_LABEL[r])}<span className="ms" aria-hidden="true" style={{ fontSize: 15 }}>lock</span></Link>
          : <button key={r} onClick={() => setRange(r)} aria-pressed={range === r} style={chip(range === r)}>{t(RANGE_LABEL[r])}</button>))}
        <RegionFilterChip chipStyle={chip} />
        {[['all', t('all_regions')] as const, ...regions.slice(0, 8).map(([r]) => [r, r] as const)].map(([id, label]) => (
          <button key={id} onClick={() => setRegion(id)} aria-pressed={region === id} style={chip(region === id)}>{label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.slice(0, 60).map(q => <QuakeRow key={q.id} q={q} onOpen={() => setSelId(q.id)} />)}
      </div>
      <Sheet open={!!sel} onClose={() => setSelId(null)} label={sel?.region}>
        {/* TODO: "Report what you felt" → report sheet */}
        {sel && <QuakeDetail q={sel} onClose={() => setSelId(null)} />}
      </Sheet>
    </div>
  );
}
