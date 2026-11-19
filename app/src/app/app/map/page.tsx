'use client';
// Map tab. Spec: design/SismaApp.dc.html (isMap block + drawMap): Mercator rotated to the user's longitude,
// zoom 1–40, tap a pin for the selected-quake card. Filters, layers and the legend live in the pull-up filter panel;
// choosing a world region there zooms the map to that region.
// /app/map?focus=<quake id> ("Show region") zooms to ~7.5° across the shorter side of the view around that quake,
// marks it as the event in focus (pulsing marker, summary card below) and draws its felt reports. Tapping a nearby
// event there opens a callout on the map; tapping the callout makes that event the focus. The Layers button beside
// "Back to world map" shows or hides each felt layer and the plate boundaries (remembered on the device).
// The My location button (under the zoom buttons) zooms to the device position; the location chosen in Me stays as it is.
import { Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/components/AppState';
import { useQuakeData } from '@/components/QuakeData';
import { useFeltCells } from '@/components/FeltReport';
import { FeltMapInfoSheet, useFeltMap } from '@/components/FeltMap';
import { useDyfi } from '@/components/Dyfi';
import { useEmscFelt } from '@/components/EmscFelt';
import { emscUnid } from '@/lib/quakes/emsc-felt';
import { usgsEventId } from '@/lib/quakes/dyfi';
import { regionHref } from '@/components/QuakeDetail';
import { WorldMap } from '@/components/dash/WorldMap';
import { MagBadge } from '@/components/MagBadge';
import { timeAgo } from '@/components/QuakeRow';
import { useDistance } from '@/components/Units';
import type { Quake } from '@/lib/quakes/types';
import { hasId } from '@/lib/quakes/merge';
import { FitLine } from '@/components/FitLine';
import { Legend, LocateNote, Selection, useLocateHere } from '@/components/stage/StageParts';
import { FilterPanel, LayerToggle } from '@/components/stage/FilterPanel';
import { Sheet } from '@/components/Sheet';
import { REGION_VIEW } from '@/lib/world-regions';
import { HEAT_COLORS, MMI_COLORS, ROMAN } from '@/lib/theme';
import styles from '@/components/stage/stage.module.css';
import dash from '@/components/dash/dash.module.css';

type FeltLayer = 'reports' | 'auto' | 'dyfi' | 'emsc';
const LAYERS_KEY = 'sisma.feltLayers';
const ALL_SHOWN: Record<FeltLayer, boolean> = { reports: true, auto: true, dyfi: true, emsc: true };

/** Region view: degrees of longitude across the shorter side of the map (~800 km at the equator). */
const REGION_SPAN = 7.5;

export default function MapPage() {
  return <Suspense><MapView /></Suspense>;
}

function MapView() {
  const { t, m, nf } = useT();
  const router = useRouter();
  const focusId = useSearchParams().get('focus');
  const { locations, active } = useApp();
  const locate = useLocateHere();
  const device = locations.find(l => l.fromDevice) ?? null;
  const { mapList: list, all, loaded, worldReg } = useQuakeData();
  const [plates, setPlates] = useState(false);
  // Felt layers shown in the region view (Layers sheet); remembered on this device.
  const [shown, setShownState] = useState<Record<FeltLayer, boolean>>(ALL_SHOWN);
  const [layersOpen, setLayersOpen] = useState(false);
  useEffect(() => {
    let saved: unknown = null;
    try { saved = JSON.parse(localStorage.getItem(LAYERS_KEY) ?? 'null'); } catch { /* storage unavailable */ }
    if (!saved || typeof saved !== 'object') return;
    const keep = { ...ALL_SHOWN };
    for (const k of Object.keys(ALL_SHOWN) as FeltLayer[]) { const v = (saved as Record<string, unknown>)[k]; if (typeof v === 'boolean') keep[k] = v; }
    void Promise.resolve().then(() => setShownState(keep));
  }, []);
  const setShown = (l: FeltLayer, on: boolean) => setShownState(v => {
    const next = { ...v, [l]: on };
    try { localStorage.setItem(LAYERS_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    return next;
  });
  const [picked, setPicked] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const focusQuake = focusId ? all.find(q => hasId(q, focusId)) ?? null : null;
  // A chosen world region frames the map on it (the event in focus of "Show region" comes first).
  const regionView = worldReg ? REGION_VIEW[worldReg] : null;
  // In the region view the card below always shows the event in focus; other events open a callout instead.
  const selId = focusQuake ? focusQuake.id : picked;
  const sel = list.find(q => q.id === selId) ?? all.find(q => q.id === selId) ?? null;
  const [callout, setCallout] = useState<string | null>(null);
  const calloutQuake = focusQuake && callout ? list.find(q => q.id === callout) ?? null : null;
  const felt = useFeltCells(focusQuake ? focusQuake.id : null);
  const auto = useFeltMap(focusQuake ? focusQuake.id : null);
  // USGS "Did You Feel It?" for the event in focus, when USGS has a record of it.
  const usgsId = focusQuake ? usgsEventId(focusQuake) : null;
  const dyfi = useDyfi(usgsId);
  // EMSC felt reports (websites and LastQuake app) for the event in focus, when EMSC has a record of it.
  const unid = focusQuake ? emscUnid(focusQuake) : null;
  const emsc = useEmscFelt(unid);
  const [howOpen, setHowOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  // Map area covered by the region card (top) and the event card or filter panel (bottom), measured when a callout opens.
  const safeArea = () => {
    const st = stageRef.current?.getBoundingClientRect();
    if (!st) return { top: 0, bottom: 0 };
    const tops = [...stageRef.current!.querySelectorAll(`.${styles.feltCard}`)].map(e => e.getBoundingClientRect().bottom - st.top);
    const card = stageRef.current!.querySelector('aside, [data-filter-panel]')?.getBoundingClientRect();
    return { top: Math.max(0, ...tops), bottom: card ? Math.max(0, st.bottom - card.top) : 0 };
  };

  // Keeps the map's OpenStreetMap credit (bottom right) just above the filter panel or event card when one covers
  // that corner: --map-bottom-inset follows the card's height as it is dragged, snaps or is replaced.
  useEffect(() => {
    const st = stageRef.current;
    if (!st) return;
    let card: Element | null = null;
    const update = () => {
      const next = st.querySelector('aside, [data-filter-panel]');
      if (next !== card) { if (card) ro.unobserve(card); card = next; if (card) ro.observe(card); }
      const s = st.getBoundingClientRect(), c = card?.getBoundingClientRect();
      const covers = c && c.height > 0 && c.right > s.right - 200 && c.left < s.right - 8 && c.bottom > s.bottom - 48;
      st.style.setProperty('--map-bottom-inset', covers ? `${Math.max(0, Math.round(s.bottom - c.top))}px` : '0px');
    };
    const ro = new ResizeObserver(update);
    const mo = new MutationObserver(update);
    ro.observe(st);
    mo.observe(st, { childList: true });
    // The event card slides in (CSS animation) and the panel snaps (transition): measure again when they finish.
    st.addEventListener('animationend', update);
    st.addEventListener('transitionend', update);
    update();
    return () => { ro.disconnect(); mo.disconnect(); st.removeEventListener('animationend', update); st.removeEventListener('transitionend', update); };
  }, []);

  const clear = () => { setPicked(null); setCallout(null); if (focusId) router.replace('/app/map', { scroll: false }); };
  const exitRegion = () => { setPicked(null); setCallout(null); setSheet(false); router.replace('/app/map', { scroll: false }); };
  // Escape leaves the region view (unless a sheet is open: Escape closes that first).
  useEffect(() => {
    if (!focusId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('[role=dialog]')) return;
      if (document.querySelector('[data-callout]')) { setCallout(null); return; }
      router.replace('/app/map', { scroll: false });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [focusId, router]);
  const showRegion = (id: string) => { setPicked(null); setCallout(null); setSheet(false); router.replace(regionHref(id), { scroll: false }); };
  const onSelect = (q: Quake | null) => {
    setSheet(false);
    if (focusQuake) { setCallout(q && q.id !== focusQuake.id ? q.id : null); return; }
    if (q) setPicked(q.id); else clear();
  };

  // The combined felt legend: reports from sisma, USGS and EMSC (total and highest intensity), and the automatic map.
  const legend = (() => {
    const items: { key: 'reports' | 'dyfi' | 'emsc' | 'auto'; label: string; on: boolean }[] = [];
    const maxes: number[] = [];
    let total = 0;
    if (!felt.loading && felt.total > 0) { items.push({ key: 'reports', label: `sisma ${nf.format(felt.total)}`, on: shown.reports }); total += felt.total; if (felt.range) maxes.push(felt.range.max); }
    if (dyfi.data && dyfi.data.cells.length > 0) { items.push({ key: 'dyfi', label: `USGS ${nf.format(dyfi.data.responses)}`, on: shown.dyfi }); total += dyfi.data.responses; if (dyfi.data.maxCdi != null) maxes.push(dyfi.data.maxCdi); }
    if (emsc.data && emsc.data.cells.length > 0) { items.push({ key: 'emsc', label: `EMSC ${nf.format(emsc.data.reports)}`, on: shown.emsc }); total += emsc.data.reports; if (emsc.data.maxMmi != null) maxes.push(emsc.data.maxMmi); }
    if (!auto.loading && auto.map && auto.map.cells.length > 0) items.push({ key: 'auto', label: t('legend_auto'), on: shown.auto });
    const top = maxes.length ? ROMAN[Math.min(10, Math.max(1, Math.round(Math.max(...maxes)))) - 1] : null;
    const summary = total > 0
      ? `${total === 1 ? t('felt_total_1') : t('felt_total_n', { n: nf.format(total) })}${top ? ` · ${t('dyfi_max', { mmi: top })}` : ''}`
      : auto.map ? (auto.map.cells.length === 1 ? m.feltmap.line_areas_1 : m.feltmap.line_areas.replace('{n}', nf.format(auto.map.cells.length))) : '';
    return { items, summary, mmi: total > 0 };
  })();

  return (
    <div className={styles.stage} ref={stageRef}>
      <WorldMap quakes={list.some(q => q.id === focusQuake?.id) || !focusQuake ? list : [...list, focusQuake]}
        center={locations[active]} selectedId={sel?.id ?? null}
        onSelect={onSelect} safeArea={safeArea} focusedId={focusQuake?.id ?? null}
        popup={calloutQuake ? { id: calloutQuake.id, content: <NearbyCallout q={calloutQuake} onOpen={() => showRegion(calloutQuake.id)} /> } : null}
        projection="mercator" plates={plates} toolsClassName={styles.mapTools}
        focus={focusQuake ? { key: focusQuake.id, lat: focusQuake.lat, lon: focusQuake.lon, span: REGION_SPAN, y: 0.42 }
          : regionView ? { key: `wr:${worldReg}`, ...regionView, y: 0.42 } : null}
        cells={focusQuake && shown.reports ? felt.cells : []} heat={focusQuake && shown.auto && auto.map ? auto.map.cells : []} dyfi={focusQuake && shown.dyfi && dyfi.data ? dyfi.data.cells : []} emsc={focusQuake && shown.emsc && emsc.data ? emsc.data.cells : []} onReset={focusId ? exitRegion : undefined}
        onLocate={locate.go} here={device} />
      <LocateNote note={locate.note} onClose={locate.dismiss} />
      {focusId && (
        <div className={styles.feltCard} role="status">
          <div className={styles.regionTop}>
            <button type="button" className={styles.exitBtn} onClick={exitRegion}>
              <span className="ms" aria-hidden="true">arrow_back</span>{t('exit_region')}
            </button>
            <button type="button" className={styles.layersBtn} onClick={() => setLayersOpen(true)} aria-haspopup="dialog" aria-label={t('layers_open')}>
              <span className="ms" aria-hidden="true">layers</span>
            </button>
          </div>
          {/* One legend for all felt layers: totals, the intensity scale and each source's symbol (dimmed when hidden). */}
          {focusQuake && legend.items.length > 0 && (
            <div className={styles.feltLegend}>
              <FitLine min={9} className={styles.feltLegendSum}>{legend.summary}</FitLine>
              {legend.mmi && (
                <span className={styles.feltLegendScale} aria-hidden="true">
                  <span>MMI I</span><i style={{ background: `linear-gradient(90deg, ${MMI_COLORS.join(', ')})` }} /><span>X</span>
                </span>
              )}
              <span className={styles.feltLegendItems}>
                {legend.items.map(it => (
                  <span key={it.key} className={`${styles.feltLegendItem}${it.on ? '' : ` ${styles.lineOff}`}`}>
                    <i className={`${styles.sw} ${styles[`sw_${it.key}`]}`} style={{ '--c': it.key === 'auto' ? HEAT_COLORS[2] : MMI_COLORS[4] } as CSSProperties} aria-hidden="true" />{it.label}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>
      )}
      <FeltMapInfoSheet open={howOpen} onClose={() => setHowOpen(false)} />
      <Sheet open={layersOpen} onClose={() => setLayersOpen(false)} title={t('region_layers')}>
        <div className={styles.layerList}>
          <LayerToggle on={shown.reports} onChange={v => setShown('reports', v)} icon="vibration" label={t('layer_reports')} />
          <LayerToggle on={shown.dyfi} onChange={v => setShown('dyfi', v)} icon="grid_view" label={t('layer_dyfi')} />
          <LayerToggle on={shown.emsc} onChange={v => setShown('emsc', v)} icon="scatter_plot" label={t('layer_emsc')} />
          <LayerToggle on={shown.auto} onChange={v => setShown('auto', v)} icon="sensors" label={t('layer_auto')} />
          <LayerToggle on={plates} onChange={setPlates} icon="texture" label={t('plates')} />
        </div>
        <button type="button" className={styles.layerInfo} onClick={() => { setLayersOpen(false); setHowOpen(true); }}>
          <span className="ms" aria-hidden="true">info</span>{m.feltmap.title}
        </button>
        <p className={styles.layerHint}>{t('layers_hint')}</p>
      </Sheet>
      {!loaded && <div className={styles.loading}>{m.dash.loading}</div>}
      {sel ? <Selection q={sel} open={sheet} setOpen={setSheet} onClear={clear} onShowRegion={() => showRegion(sel.id)} /> : (
        <FilterPanel legend={<Legend plain />}
          layers={<LayerToggle on={plates} onChange={setPlates} icon="texture" label={t('plates')} />}
          hint={<>{t('map_hint')}{plates && <><br />Plates: PB2002, Bird (2003)</>}</>} />
      )}
    </div>
  );
}

/** Callout for a nearby event in the region view; tapping it makes that event the focus. */
function NearbyCallout({ q, onOpen }: { q: Quake; onOpen: () => void }) {
  const { t, locale, m } = useT();
  const u = useDistance();
  const when = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(q.time);
  return (
    <button type="button" className={dash.calloutBtn} onClick={e => { e.stopPropagation(); onOpen(); }} aria-label={`${m.map.focus_event}: M${q.mag.toFixed(1)} ${q.region}`}>
      <MagBadge mag={q.mag} size={40} />
      <span className={dash.calloutText}>
        <strong>{q.region}</strong>
        <span>{when} · {timeAgo(t as never, q.time)}</span>
        <span>{t('depth_deep', { d: u.depth(q.depthKm) })}</span>
      </span>
      <span className={`ms ${dash.calloutGo}`} aria-hidden="true">chevron_right</span>
    </button>
  );
}
