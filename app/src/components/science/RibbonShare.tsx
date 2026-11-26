'use client';
// Share the Pacific Fire Ribbon: a 1080×1350 PNG drawn in the browser from the data on the page (sisma+ data never
// leaves the person's device except in what they choose to share), with an editable post text and image description
// (lib/ribbon/share.ts). The whole route is one ribbon folded into four rows (left to right, back, and so on), from
// the southern Andes to New Zealand: terrain above the line, earthquakes below it as glowing dots by depth, and the
// volcanoes in this week's activity report as coloured triangles. Sharing works as for earthquake cards
// (components/ShareCard.tsx): the text is copied first, because many apps drop text sent with an image.
/* eslint-disable @next/next/no-img-element -- generated PNG preview */
import { useEffect, useMemo, useState } from 'react';
import { Sheet } from '@/components/Sheet';
import { useT } from '@/i18n/I18nProvider';
import { useDistance } from '@/components/Units';
import { copyText } from '@/lib/copy-text';
import { canShareNatively, shareFileNatively, shareTextNatively } from '@/lib/native-share';
import { postWithLink } from '@/lib/share-text';
import { EARTHQUAKE_PATH } from '@/components/logo-path';
import {
  DEPTH_BANDS, depthColour, markerOpacity, markerRadius,
  type MinMag, type Period, type RibbonQuake, type RibbonResponse, type TerrainResponse,
} from '@/lib/ribbon/shared';
import type { RibbonVolcano } from '@/lib/ribbon/volcanoes';
import { CARD_RELIEF, cardRows, ribbonAlt, ribbonFacts, ribbonFileName, ribbonPost, rowOf, type RibbonFacts } from '@/lib/ribbon/share';
import dash from '@/components/dash/dash.module.css';

const W = 1080, H = 1350, PAD = 56;
const PLOT_L = 104, PLOT_R = W - 104, PLOT_W = PLOT_R - PLOT_L;
const ROWS_TOP = 392, PITCH = 186, BAND = 28, ABOVE = 30, DEPTH_PX = 124;
const BG = '#0B1220', INK = '#F2F5FB', MUTED = 'rgba(200, 212, 232, .72)', FAINT = 'rgba(190, 205, 230, .10)';
const ROUTE = 'rgba(255, 170, 110, .75)', LAND_TOP = '#C29A6B', LAND = '#6E523C', SEA = 'rgba(38, 104, 168, .34)', TRENCH = '#5AA9E0';
const VOLC: Record<string, string> = { new_unrest: '#FFC233', new_eruptive: '#FF8A2A', continuing: '#FF4040', other: '#E9EDF5' };
const VIOLET = '#6C4BF4';

export interface CardText {
  title: string; sub: string; quakes: string; largest: string; volc: string; key: string; credit: string; disclaimer: string;
  regions: Record<string, string>;
}

/** Shrinks the font until the text fits (down to 60% of `size`); returns the size used. */
function fit(g: CanvasRenderingContext2D, text: string, maxW: number, size: number, weight: number, family: string) {
  let s = size;
  for (; s > size * 0.6; s -= 1) { g.font = `${weight} ${s}px ${family}`; if (g.measureText(text).width <= maxW) break; }
  return s;
}

/** Draws the card. Everything stated comes from the data passed in. */
export function drawRibbonCard(c: HTMLCanvasElement, a: {
  d: RibbonResponse; quakes: RibbonQuake[]; volcanoes: RibbonVolcano[]; terrain: TerrainResponse | null; period: Period; now: number;
  facts: RibbonFacts; text: CardText; family: string; fmt: { int: (n: number) => string; mag: (m: number) => string; depth: (km: number) => string };
}) {
  const { d, quakes, volcanoes, terrain, facts, text, family, fmt } = a;
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;

  // Background: night blue with a warm glow behind the title.
  g.fillStyle = BG; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.78, 150, 10, W * 0.78, 150, 620);
  glow.addColorStop(0, 'rgba(255, 110, 60, .22)'); glow.addColorStop(1, 'rgba(255, 110, 60, 0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  const glow2 = g.createRadialGradient(80, H - 120, 10, 80, H - 120, 700);
  glow2.addColorStop(0, 'rgba(108, 75, 244, .20)'); glow2.addColorStop(1, 'rgba(108, 75, 244, 0)');
  g.fillStyle = glow2; g.fillRect(0, 0, W, H);

  // Brand: the sisma mark and name.
  const R = 16, LX = PAD, LY = PAD, LS = 56;
  g.fillStyle = VIOLET; g.beginPath(); g.roundRect(LX, LY, LS, LS, R); g.fill();
  g.save(); g.translate(LX + LS * 0.18, LY + LS * 0.18 + LS * 0.64); g.scale((LS * 0.64) / 960, (LS * 0.64) / 960);
  g.fillStyle = '#FFFFFF'; g.fill(new Path2D(EARTHQUAKE_PATH)); g.restore();
  g.fillStyle = INK; g.font = `800 34px ${family}`; g.textBaseline = 'middle'; g.fillText('sisma', LX + LS + 16, LY + LS / 2 + 1);

  // Title (fire gradient) and subtitle.
  g.textBaseline = 'alphabetic';
  const ts = fit(g, text.title, W - PAD * 2, 76, 800, family);
  const tg = g.createLinearGradient(PAD, 0, PAD + g.measureText(text.title).width, 0);
  tg.addColorStop(0, '#FFC233'); tg.addColorStop(0.45, '#FF6A3D'); tg.addColorStop(1, '#C77DFF');
  g.fillStyle = tg; g.font = `800 ${ts}px ${family}`; g.fillText(text.title, PAD, 196);
  fit(g, text.sub, W - PAD * 2, 30, 600, family); g.fillStyle = MUTED; g.fillText(text.sub, PAD, 240);

  // Three numbers.
  const stats: [string, string, string][] = [
    [fmt.int(facts.n), text.quakes, INK],
    [facts.largest?.mag != null ? `M${fmt.mag(facts.largest.mag)}` : '—', text.largest, '#FF8A2A'],
    [fmt.int(facts.reported), text.volc, '#FFC233'],
  ];
  const colW = (W - PAD * 2) / 3;
  stats.forEach(([v, l, col], i) => {
    const x = PAD + i * colW;
    g.fillStyle = col; fit(g, v, colW - 20, 58, 800, family); g.fillText(v, x, 318);
    g.fillStyle = MUTED; fit(g, l, colW - 20, 22, 600, family); g.fillText(l, x, 350);
  });

  // The folded ribbon.
  const rows = cardRows(d.lengthKm), len = d.lengthKm / rows.length;
  const depthMax = Math.max(700, ...quakes.map(q => q.depth));
  const kmPx = DEPTH_PX / depthMax, hPx = kmPx * CARD_RELIEF; // px per km of depth; px per km of height (× relief)
  const sea = (r: number) => ROWS_TOP + r * PITCH + BAND + ABOVE;
  const sx = (row: (typeof rows)[number], x: number) => PLOT_L + Math.max(0, Math.min(1, row.px(x))) * PLOT_W;
  const routeAt = (row: (typeof rows)[number], i: number) => row.x0 + (row.rev ? 1 - (i + 0.5) / PLOT_W : (i + 0.5) / PLOT_W) * len;
  const kmPerPx = len / PLOT_W;

  rows.forEach(row => {
    const y0 = sea(row.r);
    // Depth guides every 100 km.
    g.strokeStyle = FAINT; g.lineWidth = 1;
    for (let z = 100; z <= depthMax; z += 100) { const y = Math.round(y0 + z * kmPx) + 0.5; g.beginPath(); g.moveTo(PLOT_L, y); g.lineTo(PLOT_R, y); g.stroke(); }
    if (terrain) {
      // Sea floor (deepest within 400 km) and highest ground near the route, one value per pixel column.
      const sea0: number[] = [], land: number[] = [];
      for (let i = 0; i < PLOT_W; i++) {
        const x = routeAt(row, i), lo = x - kmPerPx / 2, hi = x + kmPerPx / 2;
        let mx = -Infinity, mn = Infinity;
        for (let b = Math.floor(lo / terrain.params.crestStepKm); b <= Math.floor(hi / terrain.params.crestStepKm); b++) { const v = terrain.crest[b]; if (v != null && v > mx) mx = v; }
        for (let b = Math.floor(lo / terrain.params.trenchStepKm); b <= Math.floor(hi / terrain.params.trenchStepKm); b++) { const v = terrain.trench[b]; if (v != null && v < mn) mn = v; }
        land.push(mx); sea0.push(mn);
      }
      g.beginPath(); g.moveTo(PLOT_L, y0);
      sea0.forEach((v, i) => g.lineTo(PLOT_L + i + 0.5, y0 + (Number.isFinite(v) ? Math.max(0, -v / 1000) * hPx : 0)));
      g.lineTo(PLOT_R, y0); g.closePath(); g.fillStyle = SEA; g.fill();
      g.beginPath(); sea0.forEach((v, i) => { const y = y0 + (Number.isFinite(v) ? Math.max(0, -v / 1000) * hPx : 0); if (i) g.lineTo(PLOT_L + i + 0.5, y); else g.moveTo(PLOT_L, y); });
      g.strokeStyle = TRENCH; g.globalAlpha = 0.55; g.lineWidth = 1.5; g.stroke(); g.globalAlpha = 1;
      const lg = g.createLinearGradient(0, y0 - 7 * hPx, 0, y0);
      lg.addColorStop(0, LAND_TOP); lg.addColorStop(1, LAND);
      g.beginPath(); g.moveTo(PLOT_L, y0);
      land.forEach((v, i) => g.lineTo(PLOT_L + i + 0.5, y0 - (Number.isFinite(v) ? Math.max(0, v / 1000) * hPx : 0)));
      g.lineTo(PLOT_R, y0); g.closePath(); g.fillStyle = lg; g.fill();
    }
    // The route line at sea level, dashed where it joins one arc to the next.
    g.strokeStyle = ROUTE; g.lineWidth = 2;
    g.beginPath(); g.moveTo(PLOT_L, y0); g.lineTo(PLOT_R, y0); g.stroke();
    for (const gp of d.gaps) {
      const a = Math.max(gp.x0, row.x0), b = Math.min(gp.x1, row.x1);
      if (b <= a) continue;
      const pa = sx(row, a), pb = sx(row, b);
      g.strokeStyle = BG; g.lineWidth = 4; g.beginPath(); g.moveTo(Math.min(pa, pb), y0); g.lineTo(Math.max(pa, pb), y0); g.stroke();
      g.strokeStyle = ROUTE; g.lineWidth = 2; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(Math.min(pa, pb), y0); g.lineTo(Math.max(pa, pb), y0); g.stroke(); g.setLineDash([]);
    }
    // Region names above the row, where there is room.
    g.font = `700 17px ${family}`; g.fillStyle = MUTED; g.textBaseline = 'alphabetic';
    const placed: [number, number][] = [];
    for (const rg of d.regions) {
      const a = Math.max(rg.x0, row.x0), b = Math.min(rg.x1, row.x1);
      if (b <= a) continue;
      const pa = sx(row, a), pb = sx(row, b), mid = (pa + pb) / 2, name = (text.regions[rg.group] ?? rg.group).toUpperCase();
      const w = g.measureText(name).width;
      if (Math.abs(pb - pa) < Math.min(70, w)) continue;
      const l = Math.max(PLOT_L, Math.min(PLOT_R - w, mid - w / 2));
      if (placed.some(([p0, p1]) => l < p1 + 14 && l + w > p0 - 14)) continue;
      placed.push([l, l + w]); g.fillText(name, l, ROWS_TOP + row.r * PITCH + 18);
    }
  });

  // Folds: the ribbon turns back at the end of each row.
  g.strokeStyle = ROUTE; g.lineWidth = 2;
  for (let r = 0; r < rows.length - 1; r++) {
    const right = !rows[r].rev, xe = right ? PLOT_R : PLOT_L, ya = sea(r), yb = sea(r + 1), ry = (yb - ya) / 2;
    g.beginPath(); g.ellipse(xe, ya + ry, 40, ry, 0, -Math.PI / 2, Math.PI / 2, !right); g.stroke();
    const ax = xe + (right ? 40 : -40), ay = ya + ry; // arrowhead at the turn, pointing down
    g.fillStyle = ROUTE; g.beginPath(); g.moveTo(ax - 7, ay - 5); g.lineTo(ax + 7, ay - 5); g.lineTo(ax, ay + 7); g.closePath(); g.fill();
  }
  // Start and end dots.
  g.fillStyle = ROUTE;
  const last = rows[rows.length - 1];
  for (const [r, x] of [[0, PLOT_L], [last.r, last.rev ? PLOT_L : PLOT_R]] as const) { g.beginPath(); g.arc(x, sea(r), 5, 0, Math.PI * 2); g.fill(); }

  // Volcanoes in this week's report, on their summits.
  for (const v of volcanoes) {
    const col = VOLC[v.status];
    if (!col) continue;
    const row = rows[rowOf(v.x, d.lengthKm)], x = sx(row, v.x);
    const base = sea(row.r) - (terrain ? Math.max(0, (v.elevation ?? 0) / 1000) * hPx : 0) - 1, h = 18;
    g.save();
    if (v.status === 'continuing' || v.status === 'new_eruptive') { g.shadowColor = col; g.shadowBlur = 14; }
    g.beginPath(); g.moveTo(x, base - h); g.lineTo(x + h * 0.6, base); g.lineTo(x - h * 0.6, base); g.closePath();
    g.fillStyle = col; g.fill(); g.shadowBlur = 0; g.lineWidth = 2; g.strokeStyle = BG; g.stroke();
    g.restore();
  }

  // Earthquakes: small first, so the large ones sit on top; each glows in its depth colour.
  const order = [...quakes].sort((p, q) => (p.mag ?? 0) - (q.mag ?? 0));
  for (const q of order) {
    const row = rows[rowOf(q.x, d.lengthKm)], x = sx(row, q.x), y = sea(row.r) + q.depth * kmPx, r = markerRadius(q.mag) * 1.35;
    const col = depthColour(q.depth);
    g.save(); g.globalAlpha = markerOpacity(a.now - q.time, a.period);
    g.shadowColor = col; g.shadowBlur = r * 2.2;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = col; g.fill();
    g.restore();
  }
  // The largest: ringed and labelled.
  if (facts.largest?.mag != null) {
    const q = facts.largest, row = rows[rowOf(q.x, d.lengthKm)], x = sx(row, q.x), y = sea(row.r) + q.depth * kmPx, r = markerRadius(q.mag) * 1.35 + 6;
    g.strokeStyle = '#FFFFFF'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
    const label = `M${fmt.mag(q.mag!)}`;
    g.font = `800 26px ${family}`; g.textBaseline = 'middle';
    const w = g.measureText(label).width, lx = x + r + 8 + w > PLOT_R ? x - r - 8 - w : x + r + 8;
    g.lineWidth = 6; g.strokeStyle = BG; g.strokeText(label, lx, y); g.fillStyle = '#FFFFFF'; g.fillText(label, lx, y);
    g.textBaseline = 'alphabetic';
  }

  // Footer: depth key, how to read it, sources and the disclaimer.
  let fy = ROWS_TOP + rows.length * PITCH + 12;
  g.font = `700 19px ${family}`;
  const keyW = (W - PAD * 2) / DEPTH_BANDS.length;
  DEPTH_BANDS.forEach((b, i) => {
    const x = PAD + i * keyW, lab = i === DEPTH_BANDS.length - 1 ? `> ${fmt.depth(DEPTH_BANDS[i - 1].max)}` : `< ${fmt.depth(b.max)}`;
    g.save(); g.shadowColor = b.color; g.shadowBlur = 10; g.fillStyle = b.color; g.beginPath(); g.arc(x + 9, fy, 8, 0, Math.PI * 2); g.fill(); g.restore();
    g.fillStyle = MUTED; g.textBaseline = 'middle'; fit(g, lab, keyW - 30, 19, 700, family); g.fillText(lab, x + 24, fy + 1);
  });
  g.textBaseline = 'alphabetic';
  fy += 40;
  g.fillStyle = MUTED;
  const words = text.key.split(' '); let line = '';
  g.font = `500 19px ${family}`;
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (g.measureText(t).width > W - PAD * 2 && line) { g.fillText(line, PAD, fy); fy += 26; line = w; } else line = t;
  }
  if (line) { g.fillText(line, PAD, fy); fy += 26; }
  // Sources, then the disclaimer, each on its own line below the key (never closer to the edge than 28 px).
  const credY = Math.min(fy + 10, H - 62);
  g.fillStyle = INK; fit(g, text.credit, W - PAD * 2, 19, 700, family); g.fillText(text.credit, PAD, credY);
  g.fillStyle = MUTED; fit(g, text.disclaimer, W - PAD * 2, 18, 500, family); g.fillText(text.disclaimer, PAD, credY + 28);
}

type CardState = { key: string } & ({ s: 'ready'; file: File; url: string } | { s: 'failed' });

export function RibbonShareSheet({ open, onClose, d, quakes, volcanoes, terrain, period, min, now }: {
  open: boolean; onClose: () => void; d: RibbonResponse; quakes: RibbonQuake[]; volcanoes: RibbonVolcano[];
  terrain: TerrainResponse | null; period: Period; min: MinMag; now: number;
}) {
  const { m, nf, locale } = useT();
  const k = m.ribbon, sc = m.sharecard;
  const dist = useDistance();
  const mag1 = useMemo(() => new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), [locale]);
  const facts = useMemo(() => ribbonFacts(quakes, volcanoes), [quakes, volcanoes]);
  const fmt = useMemo(() => ({ period: k[`period_${period}`], int: (n: number) => nf.format(n), mag: (v: number) => mag1.format(v), depth: dist.depth, place: dist.text }),
    [k, period, nf, mag1, dist.depth, dist.text]);
  const strings = useMemo(() => ({
    post: k.share_post, alt_intro: k.alt_intro, alt_quakes: k.alt_quakes, alt_none: k.alt_none, alt_largest: k.alt_largest, alt_deepest: k.alt_deepest,
    alt_deep: k.alt_deep, alt_volc: k.alt_volc, alt_terrain: terrain ? k.alt_terrain : '', alt_source: k.alt_source, all_mags: k.all_mags,
  }), [k, terrain]);
  const minLabel = min === 0 ? k.all_mags : `M${mag1.format(min)}+`;
  // Everything that changes the picture or the text; drafts and pictures for another key count as stale.
  const key = `${period}|${min}|${locale}|${dist.units}|${d.retrieved}|${terrain ? 1 : 0}|${volcanoes.length}`;
  const [card, setCard] = useState<CardState | null>(null);
  const state = card && card.key === key ? card : { s: 'loading' as const };
  const [draft, setDraft] = useState<{ key: string; text: string; alt: string } | null>(null);
  const path = '/app/science/ribbon';
  const post = draft?.key === key ? draft : {
    key,
    text: postWithLink(ribbonPost(facts, min, strings, fmt), typeof location === 'undefined' ? '' : location.origin + path, sc.tag),
    alt: ribbonAlt(facts, min, strings, fmt),
  };
  const edit = (patch: Partial<{ text: string; alt: string }>) => setDraft({ ...post, ...patch });
  const [copied, setCopied] = useState<null | 'text' | 'alt'>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true, url = '';
    void (async () => {
      try {
        const family = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
        await Promise.all([800, 700, 600, 500].map(w => document.fonts.load(`${w} 32px ${family}`).catch(() => null)));
        const c = document.createElement('canvas');
        drawRibbonCard(c, {
          d, quakes, volcanoes, terrain, period, now, facts, family, fmt,
          text: {
            title: k.h1, sub: k.card_sub.replace('{period}', fmt.period).replace('{min}', minLabel),
            quakes: k.card_quakes, largest: k.card_largest, volc: k.card_volc,
            key: k.card_key.replace('{depth}', dist.depth(Math.max(700, ...quakes.map(q => q.depth)))).replace('{n}', nf.format(CARD_RELIEF)),
            credit: k.card_credit, disclaimer: sc.disclaimer, regions: k.regions,
          },
        });
        const blob = await new Promise<Blob | null>(res => c.toBlob(res, 'image/png'));
        if (!blob) throw new Error('no image');
        if (!alive) return;
        url = URL.createObjectURL(blob);
        setCard({ key, s: 'ready', file: new File([blob], ribbonFileName(period, min), { type: 'image/png' }), url });
      } catch { if (alive) setCard({ key, s: 'failed' }); }
    })();
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
    // The key covers every input that changes the picture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key]);

  const native = canShareNatively();
  const canShareFile = state.s === 'ready' && (native || (typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [state.file] })));
  const canShareLink = !canShareFile && state.s !== 'loading' && (native || (typeof navigator !== 'undefined' && !!navigator.share));
  const copy = async (what: 'text' | 'alt') => {
    if (await copyText(post[what])) { setCopied(what); setTimeout(() => setCopied(c => (c === what ? null : c)), 2500); }
  };
  const copyThenShare = async (data: ShareData, nativeShare: () => Promise<'shared' | 'cancelled' | 'failed'>) => {
    setNote(null);
    const ok = await copyText(post.text);
    if (ok) setCopied('text');
    if (native) { if (await nativeShare() === 'failed') setNote(sc.share_failed); return; }
    try { await navigator.share(data); } catch (e) {
      const name = (e as Error)?.name;
      if (name === 'NotAllowedError' && ok) setNote(sc.tap_again);
      else if (name !== 'AbortError') setNote(sc.share_failed);
    }
  };
  const shareImage = async () => {
    if (state.s !== 'ready') return;
    await copyThenShare({ files: [state.file], title: 'sisma', text: post.text }, () => shareFileNatively(state.file, post.text, k.share_title));
  };
  const shareLink = () => copyThenShare({ title: 'sisma', text: post.text }, () => shareTextNatively(post.text, k.share_title));
  const saveImage = () => {
    if (state.s !== 'ready') return;
    const el = document.createElement('a');
    el.href = state.url; el.download = state.file.name; document.body.appendChild(el); el.click(); el.remove();
  };

  return (
    <Sheet open={open} onClose={onClose} title={k.share_title}>
      <div className={dash.shareCard} aria-busy={state.s === 'loading'}>
        {state.s === 'ready' && <img src={state.url} alt={k.share_preview} width={W} height={H} />}
        {state.s === 'loading' && <span className={dash.shareMsg}><span className="ms" aria-hidden="true">progress_activity</span>{sc.preparing}</span>}
        {state.s === 'failed' && <span className={dash.shareMsg} role="alert">{sc.failed}</span>}
      </div>
      <label className={dash.shareField}>
        <span>{sc.post_label}</span>
        <textarea value={post.text} onChange={e => edit({ text: e.target.value })} rows={5} spellCheck />
      </label>
      <label className={dash.shareField}>
        <span>{sc.alt_label}</span>
        <textarea value={post.alt} onChange={e => edit({ alt: e.target.value })} rows={6} spellCheck />
      </label>
      <div className={dash.shareActions}>
        {canShareFile && (
          <button type="button" className={dash.sharePrimary} onClick={shareImage}>
            <span className="ms" aria-hidden="true">ios_share</span>{sc.share_image}
          </button>
        )}
        {canShareLink && (
          <button type="button" className={dash.sharePrimary} onClick={shareLink}>
            <span className="ms" aria-hidden="true">share</span>{sc.share_link}
          </button>
        )}
        <button type="button" className={dash.regionBtn} onClick={saveImage} disabled={state.s !== 'ready'}>
          <span className="ms" aria-hidden="true">download</span>{sc.save_image}
        </button>
        <button type="button" className={dash.regionBtn} onClick={() => void copy('text')} aria-live="polite">
          <span className="ms" aria-hidden="true">{copied === 'text' ? 'check' : 'content_copy'}</span>{copied === 'text' ? sc.copied : sc.copy_text}
        </button>
        <button type="button" className={`${dash.regionBtn} ${dash.shareWide}`} onClick={() => void copy('alt')} aria-live="polite">
          <span className="ms" aria-hidden="true">{copied === 'alt' ? 'check' : 'content_copy'}</span>{copied === 'alt' ? sc.copied : sc.copy_alt}
        </button>
      </div>
      {note && <p className={dash.shareHint} role="alert">{note}</p>}
      <p className={dash.shareHint}>{sc.hint}</p>
    </Sheet>
  );
}
