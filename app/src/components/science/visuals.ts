// Canvas visuals for the science articles, ported from design/SismaApp.dc.html
// (drawPlates, drawFaults, drawWaves, drawTsunami). Geometry and timing match the design;
// text comes from the `sci.lbl` messages so the diagrams are translated.
import type { SciencePalette } from '@/lib/theme';

type Ctx = CanvasRenderingContext2D;
export interface VisualLabels {
  surface: string; direction: string; top_view: string; footwall: string; hanging_wall: string; oceanic: string;
  continental: string; volcano: string; ridge: string; magma: string; coast: string; depth_m: string; speed: string;
}
export interface DrawArgs { ctx: Ctx; W: number; H: number; t: number; mode: string; P: SciencePalette; L: VisualLabels; nf: Intl.NumberFormat }

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

function arrow(ctx: Ctx, x: number, y: number, dx: number, dy: number, len: number, col: string) {
  const x2 = x + dx * len, y2 = y + dy * len, a = Math.atan2(dy, dx);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2 + Math.cos(a) * 3, y2 + Math.sin(a) * 3);
  ctx.lineTo(x2 - 7 * Math.cos(a - 0.55), y2 - 7 * Math.sin(a - 0.55));
  ctx.lineTo(x2 - 7 * Math.cos(a + 0.55), y2 - 7 * Math.sin(a + 0.55));
  ctx.closePath(); ctx.fill();
}
function label(ctx: Ctx, txt: string, x: number, y: number, col: string) {
  ctx.fillStyle = col; ctx.font = '700 11px Figtree, system-ui, sans-serif'; ctx.fillText(txt, x, y);
}
/** Label on a light chip so it reads over the coloured bands in both themes. */
function chipLabel(ctx: Ctx, txt: string, x: number, y: number) {
  ctx.font = '700 11px Figtree, system-ui, sans-serif';
  const w = ctx.measureText(txt).width + 12;
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(x - 6, y - 13, w, 18);
  label(ctx, txt, x, y, '#1B1530');
}

export function drawWaves({ ctx, W, H, t, mode, P, L }: DrawArgs) {
  const cols = 22, rows = 7, px = 22, top = 30, bot = H - 48, gx = (W - 2 * px) / (cols - 1), gy = (bot - top) / (rows - 1);
  const k = (2 * Math.PI) / (W * 0.55), w = 2 * Math.PI * 0.5, A = 6.5;
  if (mode === 'R') { ctx.fillStyle = P.ink2; ctx.globalAlpha = 0.12; ctx.fillRect(0, 0, W, top - 12); ctx.globalAlpha = 1; label(ctx, L.surface, px, top - 16, P.ink2); }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x0 = px + i * gx, y0 = top + j * gy, ph = k * x0 - w * t;
    let dx = 0, dy = 0;
    if (mode === 'P') dx = A * Math.sin(ph);
    else if (mode === 'S') dy = A * Math.sin(ph);
    else { const d = Math.exp(-j / 2.2); dx = A * d * Math.sin(ph); dy = -A * d * Math.cos(ph); }
    const tr = i === 8;
    ctx.fillStyle = tr ? P.warm : P.a;
    ctx.globalAlpha = tr ? 1 : mode === 'P' ? 0.3 + 0.7 * (0.5 + 0.5 * Math.cos(ph)) : 0.85;
    ctx.beginPath(); ctx.arc(x0 + dx, y0 + dy, tr ? 3.8 : 2.8, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  label(ctx, L.direction, px, H - 18, P.ink2);
  ctx.font = '700 11px Figtree, system-ui, sans-serif';
  const lw = ctx.measureText(L.direction).width + 12;
  arrow(ctx, px + lw, H - 22, 1, 0, Math.max(20, W - 2 * px - lw - 10), P.ink2);
}

export function drawFaults({ ctx, W, H, t, mode, P, L }: DrawArgs) {
  const s = (1 - Math.cos(t * 1.4)) / 2, d = s * 22;
  if (mode === 'strike') {
    const mid = W / 2, top = 14, bot = H - 14, cy = (top + bot) / 2;
    ([[0, -1], [1, 1]] as const).forEach(([side, dir]) => {
      const x0 = side ? mid : 0, off = (dir * d) / 2;
      ctx.save(); ctx.beginPath(); ctx.rect(x0, top, mid, bot - top); ctx.clip();
      ctx.fillStyle = P.bands[2]; ctx.fillRect(x0, top, mid, bot - top);
      ctx.strokeStyle = P.bands[side ? 0 : 4]; ctx.lineWidth = 7;
      for (let y = top - 44; y < bot + 44; y += 22) { ctx.beginPath(); ctx.moveTo(x0, y + off); ctx.lineTo(x0 + mid, y + off); ctx.stroke(); }
      ctx.fillStyle = P.road; ctx.fillRect(x0, cy - 10 + off, mid, 20);
      ctx.strokeStyle = P.lane; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(x0, cy + off); ctx.lineTo(x0 + mid, cy + off); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      arrow(ctx, x0 + mid / 2, cy + (dir < 0 ? -36 : 36), 0, dir, 24, P.ink);
    });
    ctx.strokeStyle = P.warm; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(mid, top); ctx.lineTo(mid, bot); ctx.stroke(); ctx.setLineDash([]);
    chipLabel(ctx, L.top_view, 16, top + 19);
    return;
  }
  const top = 46, bot = H - 12, fx1 = W * 0.4, fx2 = W * 0.6, len = Math.hypot(fx2 - fx1, bot - top);
  const ux = (fx2 - fx1) / len, uy = (bot - top) / len, dir = mode === 'normal' ? 1 : -1, ox = ux * d * dir, oy = uy * d * dir, ex = 60;
  const block = (poly: [number, number][], dx: number, dy: number) => {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, bot); ctx.clip(); ctx.translate(dx, dy);
    ctx.beginPath(); poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
    ctx.save(); ctx.clip();
    const bh = (bot - top) / 5;
    for (let i = -2; i < 8; i++) { ctx.fillStyle = P.bands[(i + 10) % 5]; ctx.fillRect(-60, top + i * bh, W + 120, bh + 1); }
    ctx.restore();
    ctx.strokeStyle = P.ink; ctx.globalAlpha = 0.3; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.restore();
  };
  const fb: [number, number] = [fx2 + (ux * ex) / uy, bot + ex];
  block([[-ex, top], [fx1, top], fb, [-ex, bot + ex]], 0, 0);
  block([[fx1, top], [W + ex, top], [W + ex, bot + ex], fb], ox, oy);
  ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(fx1 - ux * 14, top - uy * 14); ctx.lineTo(fx2, bot); ctx.stroke(); ctx.setLineDash([]);
  const mx = (fx1 + fx2) / 2, my = (top + bot) / 2;
  arrow(ctx, mx + 22 - ux * 14 * dir, my - uy * 14 * dir, ux * dir, uy * dir, 26, P.ink);
  arrow(ctx, mx - 22 + ux * 14 * dir, my + uy * 14 * dir, -ux * dir, -uy * dir, 26, P.ink);
  if (mode === 'normal') { arrow(ctx, 70, top - 22, -1, 0, 40, P.warm); arrow(ctx, W - 70, top - 22, 1, 0, 40, P.warm); }
  else { arrow(ctx, 20, top - 22, 1, 0, 40, P.warm); arrow(ctx, W - 20, top - 22, -1, 0, 40, P.warm); }
  label(ctx, L.footwall, 14, bot - 10, '#1B1530');
  ctx.font = '700 11px Figtree, system-ui, sans-serif';
  label(ctx, L.hanging_wall, W - 14 - ctx.measureText(L.hanging_wall).width, bot - 10, '#1B1530');
}

export function drawPlates({ ctx, W, H, t, mode, P, L }: DrawArgs) {
  if (mode === 'convergent') {
    const sl = 96;
    ctx.fillStyle = P.mantle; ctx.fillRect(0, sl, W, H - sl);
    ctx.fillStyle = P.sea; ctx.fillRect(0, sl - 26, W * 0.56, 26);
    const p0 = [W * 0.42, sl + 9], p1 = [W * 0.7, sl + 14], p2 = [W * 0.95, H - 4];
    const q = (u: number) => [(1 - u) ** 2 * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0], (1 - u) ** 2 * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1]];
    ctx.strokeStyle = P.ocean; ctx.lineWidth = 18;
    ctx.beginPath(); ctx.moveTo(-10, sl + 9); ctx.lineTo(p0[0], p0[1]); ctx.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2.5; ctx.setLineDash([3, 13]); ctx.lineDashOffset = -t * 26; ctx.stroke(); ctx.setLineDash([]);
    const m = q(0.55);
    ctx.strokeStyle = P.warm; ctx.lineWidth = 3; ctx.setLineDash([5, 6]); ctx.lineDashOffset = t * 18;
    ctx.beginPath(); ctx.moveTo(m[0] - 6, m[1] - 8); ctx.quadraticCurveTo(W * 0.73, sl + 20, W * 0.72, sl - 40); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = P.sand; ctx.beginPath();
    ctx.moveTo(W * 0.46, sl - 12); ctx.lineTo(W * 0.64, sl - 18); ctx.lineTo(W * 0.72, sl - 50); ctx.lineTo(W * 0.8, sl - 20);
    ctx.lineTo(W, sl - 22); ctx.lineTo(W, sl + 46); ctx.lineTo(W * 0.66, sl + 40); ctx.lineTo(W * 0.5, sl + 2); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 10; i++) {
      const pt = q(0.06 + i * 0.095), a = Math.pow(Math.max(0, Math.sin(t * 1.8 + i * 2.1)), 6);
      ctx.globalAlpha = a; ctx.fillStyle = P.warm; ctx.beginPath(); ctx.arc(pt[0] - 5, pt[1] - 9, 4 + a * 3, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    label(ctx, L.oceanic, 12, sl + 36, P.ink); label(ctx, L.continental, W * 0.62, sl + 62, P.ink); label(ctx, L.volcano, W * 0.66, sl - 58, P.ink2);
    arrow(ctx, 16, sl - 38, 1, 0, 46, P.ink2);
    return;
  }
  if (mode === 'divergent') {
    const top = 76, th = 24, mid = W / 2, g = 8;
    ctx.fillStyle = P.mantle; ctx.fillRect(0, top, W, H - top);
    ctx.fillStyle = P.sea; ctx.fillRect(0, 0, W, top);
    ctx.strokeStyle = P.warm; ctx.lineWidth = 3; ctx.setLineDash([5, 7]);
    for (let i = -1; i <= 1; i++) {
      ctx.lineDashOffset = t * 20 + i * 4;
      ctx.beginPath(); ctx.moveTo(mid + i * 30, H); ctx.quadraticCurveTo(mid + i * 10, top + 60, mid, top + th); ctx.stroke();
    }
    ctx.setLineDash([]);
    const off = (t * 14) % 26, ph = Math.floor((t * 14) / 26);
    for (const side of [-1, 1]) {
      ctx.fillStyle = P.ocean; const x0 = side < 0 ? 0 : mid + g / 2; ctx.fillRect(x0, top, mid - g / 2, th);
      for (let n = 0; n < 16; n++) {
        const dx = off + n * 26, x = side < 0 ? mid - g / 2 - dx - 8 : mid + g / 2 + dx;
        ctx.fillStyle = (n + ph) % 2 ? P.b : P.a; ctx.globalAlpha = 0.9; ctx.fillRect(x, top + 3, 8, th - 6);
      }
      ctx.globalAlpha = 1; arrow(ctx, mid + side * 40, top - 22, side, 0, 48, P.ink2);
    }
    for (let i = 0; i < 4; i++) {
      const a = Math.pow(Math.max(0, Math.sin(t * 2 + i * 1.9)), 6);
      ctx.globalAlpha = a; ctx.fillStyle = P.warm; ctx.beginPath(); ctx.arc(mid, top + 6 + i * 4, 4 + a * 2, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.font = '700 11px Figtree, system-ui, sans-serif';
    label(ctx, L.ridge, mid - ctx.measureText(L.ridge).width / 2, 18, P.ink);
    label(ctx, L.magma, mid + 38, H - 14, P.ink2);
    return;
  }
  const mid = H / 2, off = (t * 16) % 24;
  ctx.fillStyle = P.bands[0]; ctx.fillRect(0, 0, W, mid);
  ctx.fillStyle = P.bands[2]; ctx.fillRect(0, mid, W, H - mid);
  ctx.strokeStyle = P.a; ctx.globalAlpha = 0.35; ctx.lineWidth = 3;
  for (let x = -24; x < W + 24; x += 24) {
    ctx.beginPath(); ctx.moveTo(x + off, 8); ctx.lineTo(x + off, mid - 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - off, mid + 6); ctx.lineTo(x - off, H - 8); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = P.warm; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke(); ctx.setLineDash([]);
  for (let i = 0; i < 6; i++) {
    const a = Math.pow(Math.max(0, Math.sin(t * 1.7 + i * 2.3)), 6);
    ctx.globalAlpha = a; ctx.fillStyle = P.warm; ctx.beginPath(); ctx.arc(30 + (i * (W - 60)) / 5, mid, 4 + a * 3, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  arrow(ctx, W / 2 - 30, mid / 2, 1, 0, 60, '#1B1530'); arrow(ctx, W / 2 + 30, mid * 1.5, -1, 0, 60, '#1B1530');
  chipLabel(ctx, L.top_view, 14, 21);
}

export function drawTsunami({ ctx, W, H, t, P, L, nf }: DrawArgs) {
  const sl = 62, coast = W * 0.84;
  const depthAt = (x: number) => 8 + (H - sl - 22) * (1 - Math.pow(Math.min(1, x / coast), 1.8));
  const floorY = (x: number) => (x <= coast ? sl + depthAt(x) : sl + 8 - (x - coast) * 0.9);
  const cyc = 7, u = (t % cyc) / cyc, xc = coast * (1 - Math.pow(1 - u, 1.7)), d0 = depthAt(0), dc = depthAt(Math.min(xc, coast));
  const A = Math.min(44, 3 * Math.pow(d0 / dc, 0.55)), sig = 12 + 46 * Math.sqrt(dc / d0);
  ctx.fillStyle = P.sea; ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 3) ctx.lineTo(x, sl - A * Math.exp(-(((x - xc) / sig) ** 2)));
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  ctx.fillStyle = P.floor; ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 4) ctx.lineTo(x, floorY(x));
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  if (u < 0.14) {
    ctx.globalAlpha = 1 - u / 0.14; ctx.fillStyle = P.warm;
    ctx.beginPath(); ctx.arc(W * 0.06, floorY(W * 0.06) - 2, 6 + u * 60, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  }
  const dm = 4000 * (dc / d0), v = Math.sqrt(9.81 * dm) * 3.6, g = Math.pow(d0 / dc, 0.25);
  label(ctx, fill(L.depth_m, { m: nf.format(Math.round(dm)) }), 12, 20, P.ink);
  label(ctx, fill(L.speed, { v: nf.format(Math.round(v)), g: g.toFixed(1) }), 12, 36, P.ink2);
  label(ctx, L.coast, coast + 6, sl - 20, P.ink2);
}

export const VISUALS = { plates: drawPlates, faults: drawFaults, waves: drawWaves, tsunami: drawTsunami } as const;
export type CanvasVisual = keyof typeof VISUALS;
