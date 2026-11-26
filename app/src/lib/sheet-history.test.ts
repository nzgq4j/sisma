import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A minimal browser: one window for key events, a history that records what is done to it, and optionally the
// Android app's native App plugin.
let win: EventTarget;
let hist: { length: number; pushes: number; backs: number; pushState: () => void; back: () => void };
let backButton: ((d: { canGoBack: boolean }) => void) | null;
let exits: number;
const key = (k: string) => { const e = new Event('keydown', { cancelable: true }); Object.assign(e, { key: k }); win.dispatchEvent(e); };
async function load(native = false) {
  vi.resetModules();
  if (native) {
    (win as unknown as { Capacitor: unknown }).Capacitor = {
      isNativePlatform: () => true,
      Plugins: { App: { addListener: (_: string, cb: typeof backButton) => { backButton = cb; }, exitApp: async () => { exits++; } } },
    };
  }
  return import('./sheet-history');
}
function sheet(push: (close: () => void) => () => void) {
  const s = { open: true, release: () => {} };
  const close = () => { if (!s.open) return; s.open = false; s.release(); };
  s.release = push(close);
  return { get open() { return s.open; }, close };
}

beforeEach(() => {
  win = new EventTarget(); backButton = null; exits = 0;
  hist = { length: 1, pushes: 0, backs: 0, pushState() { this.pushes++; }, back() { this.backs++; } };
  vi.stubGlobal('window', win);
  vi.stubGlobal('history', hist);
});
afterEach(() => vi.unstubAllGlobals());

describe('sheet stack', () => {
  it('Escape closes only the top sheet', async () => {
    const { pushSheet, openSheets } = await load();
    const detail = sheet(pushSheet);
    const share = sheet(pushSheet);
    key('Escape');
    expect(share.open).toBe(false);
    expect(detail.open).toBe(true);
    key('Escape');
    expect(detail.open).toBe(false);
    expect(openSheets()).toBe(0);
  });

  it('never touches the browser history (it fought with the page lock and scroll)', async () => {
    const { pushSheet } = await load();
    const a = sheet(pushSheet); const b = sheet(pushSheet);
    b.close(); key('Escape');
    expect(a.open).toBe(false);
    expect(hist.pushes).toBe(0);
    expect(hist.backs).toBe(0);
  });

  it('Android back button: closes the top sheet, then goes back, then closes the app', async () => {
    const { pushSheet } = await load(true);
    const detail = sheet(pushSheet); const share = sheet(pushSheet);
    expect(backButton).not.toBeNull();
    backButton!({ canGoBack: true });
    expect(share.open).toBe(false); expect(detail.open).toBe(true); expect(hist.backs).toBe(0);
    backButton!({ canGoBack: true });
    expect(detail.open).toBe(false); expect(hist.backs).toBe(0);
    backButton!({ canGoBack: true });
    expect(hist.backs).toBe(1);
    backButton!({ canGoBack: false });
    expect(exits).toBe(1);
  });

  it('in the browser the back button is left alone', async () => {
    const { pushSheet } = await load(false);
    sheet(pushSheet);
    expect(backButton).toBeNull();
  });
});
