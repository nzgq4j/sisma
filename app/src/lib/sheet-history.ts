// Open sheets as a stack, so that Escape and the Android back button each close only the top one.
//
// No browser history is used: an earlier version added a history entry per open sheet so that the browser's Back
// closed it, but stepping through those entries fought with the page lock behind an open sheet (the feed jumped to the
// top, and on iPhone could stay blank until the app was restarted). The browser's Back leaves the page, as it always
// did. In the Android app the hardware back button closes the top sheet first; with no sheet open it goes back in the
// app's history, or closes the app on its first page (what the button does without a listener).

type Entry = { id: number; close: () => void };

const stack: Entry[] = [];
let seq = 0;
let installed = false;

interface NativeApp {
  addListener: (e: 'backButton', cb: (d: { canGoBack: boolean }) => void) => unknown;
  exitApp: () => Promise<void>;
}
function nativeApp(): NativeApp | null {
  const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { App?: NativeApp } } }).Capacitor;
  return cap?.isNativePlatform?.() ? cap.Plugins?.App ?? null : null;
}

function install() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !stack.length || e.defaultPrevented) return;
    e.preventDefault();
    stack[stack.length - 1].close();
  });
  const app = nativeApp();
  if (app) {
    try {
      app.addListener('backButton', ({ canGoBack }) => {
        if (stack.length) stack[stack.length - 1].close();
        else if (canGoBack) history.back();
        else void app.exitApp();
      });
    } catch { /* older app without the App plugin: Android's default back behaviour stays */ }
  }
}

/** Registers an open sheet; returns the function to call when it closes (for any reason). */
export function pushSheet(close: () => void): () => void {
  install();
  const entry: Entry = { id: ++seq, close };
  stack.push(entry);
  return () => {
    const i = stack.indexOf(entry);
    if (i >= 0) stack.splice(i, 1);
  };
}

/** The number of open sheets (for tests). */
export const openSheets = () => stack.length;
