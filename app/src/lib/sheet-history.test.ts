import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A minimal browser: one window for key and popstate events, and a session history whose back() completes later,
// as in browsers.
class FakeHistory {
  entries: unknown[] = [{ router: 'feed' }];
  i = 0;
  constructor(private win: EventTarget) {}
  get state() { return this.entries[this.i]; }
  get length() { return this.entries.length; }
  pushState(s: unknown) { this.entries = [...this.entries.slice(0, this.i + 1), s]; this.i++; }
  back() { setTimeout(() => { if (this.i === 0) return; this.i--; this.win.dispatchEvent(Object.assign(new Event('popstate'), { state: this.state })); }, 1); }
}

let win: EventTarget, hist: FakeHistory;
const tick = () => new Promise(r => setTimeout(r, 5));
const key = (k: string) => { const e = new Event('keydown', { cancelable: true }); Object.assign(e, { key: k }); win.dispatchEvent(e); };
async function load() { vi.resetModules(); return import('./sheet-history'); }

/** A sheet as Sheet.tsx uses it: registered while open; closing (from the stack or its own controls) releases it. */
function sheet(push: (close: () => void) => () => void) {
  const s = { open: true, release: () => {} };
  const close = () => { if (!s.open) return; s.open = false; s.release(); };
  s.release = push(close);
  return { get open() { return s.open; }, close };
}

beforeEach(() => {
  win = new EventTarget();
  hist = new FakeHistory(win);
  vi.stubGlobal('window', win);
  vi.stubGlobal('history', hist);
});
afterEach(() => vi.unstubAllGlobals());

describe('sheet stack', () => {
  it('Escape closes only the top sheet', async () => {
    const { pushSheet } = await load();
    const detail = sheet(pushSheet); await tick();
    const share = sheet(pushSheet); await tick();
    key('Escape'); await tick();
    expect(share.open).toBe(false);
    expect(detail.open).toBe(true);
    key('Escape'); await tick();
    expect(detail.open).toBe(false);
    expect(hist.i).toBe(0); // both history entries taken back off
  });

  it('Back closes the top sheet and keeps the page', async () => {
    const { pushSheet } = await load();
    const detail = sheet(pushSheet); await tick();
    const share = sheet(pushSheet); await tick();
    expect(hist.length).toBe(3);
    hist.back(); await tick();
    expect(share.open).toBe(false);
    expect(detail.open).toBe(true);
    hist.back(); await tick();
    expect(detail.open).toBe(false);
    expect(hist.i).toBe(0);
    expect(hist.state).toEqual({ router: 'feed' });
  });

  it('keeps the router state on its entries', async () => {
    const { pushSheet } = await load();
    sheet(pushSheet); await tick();
    expect(hist.state).toMatchObject({ router: 'feed' });
  });

  it('closing with its own controls removes its entry, without closing anything else', async () => {
    const { pushSheet } = await load();
    const detail = sheet(pushSheet); await tick();
    const share = sheet(pushSheet); await tick();
    share.close(); await tick();
    expect(detail.open).toBe(true);
    expect(hist.i).toBe(1);
    hist.back(); await tick();
    expect(detail.open).toBe(false);
    expect(hist.i).toBe(0);
  });

  it('skips the entry of a sheet that closed after a navigation from inside it', async () => {
    const { pushSheet } = await load();
    const detail = sheet(pushSheet); await tick();
    hist.pushState({ router: 'map' });   // "Show region" navigates…
    detail.close(); await tick();         // …and the feed (with its sheet) goes away
    expect(hist.i).toBe(2);
    hist.back(); await tick(); await tick();
    expect(hist.state).toEqual({ router: 'feed' }); // one Back from the map reaches the feed itself
  });

  it('turns the browser’s scroll restoration off while sheets are open, and back on after the last one closes', async () => {
    const { pushSheet } = await load();
    const h = hist as FakeHistory & { scrollRestoration?: string };
    h.scrollRestoration = 'auto';
    const detail = sheet(pushSheet); await tick();
    expect(h.scrollRestoration).toBe('manual');
    const share = sheet(pushSheet); await tick();
    share.close(); await tick();
    expect(h.scrollRestoration).toBe('manual'); // the detail is still open
    detail.close();
    expect(h.scrollRestoration).toBe('manual'); // until our step back has happened
    await tick();
    expect(h.scrollRestoration).toBe('auto');
    sheet(pushSheet); await tick();
    hist.back(); await tick(); // closed with Back
    expect(h.scrollRestoration).toBe('auto');
  });

  it('a sheet that opens and closes at once leaves no entry', async () => {
    const { pushSheet } = await load();
    const release = pushSheet(() => {});
    release(); await tick();
    expect(hist.length).toBe(1);
  });
});
