// Open sheets as a stack, so that Escape, the browser's Back and the Android back button each close only the top one.
//
// Each sheet adds a history entry for the same address when it opens (the router's own state is kept, so the router
// treats it as the page it already shows). Back then leaves that entry and the sheet closes instead of the page
// changing; the Android app gets this for free, since its back button goes back in the web view's history.
// A sheet closed some other way (Done, a tap outside, a swipe) takes its entry back off when that entry is still the
// current one. If something was added after it (a navigation from inside the sheet), the entry stays behind and is
// skipped when Back reaches it later.

type Entry = { id: number; close: () => void; inHistory: boolean };

const KEY = '__sismaSheet';
/** Tells this page load's entries apart from ones left by an earlier load (after a reload they mean nothing). */
const LOAD = Math.random().toString(36).slice(2, 8);
const stack: Entry[] = [];
const stale = new Set<number>();
let seq = 0;
let ignorePops = 0;
let installed = false;

type Mark = { load: string; id: number };
const markOf = (state: unknown): Mark | null => {
  const m = (state as Record<string, unknown> | null)?.[KEY] as Mark | undefined;
  return m && typeof m.id === 'number' ? m : null;
};

function install() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !stack.length || e.defaultPrevented) return;
    e.preventDefault();
    stack[stack.length - 1].close();
  });
  window.addEventListener('popstate', e => {
    const mark = markOf(e.state);
    // Our own step back after a sheet closed by other means: nothing more to close.
    if (ignorePops > 0) ignorePops--;
    else {
      const here = mark && mark.load === LOAD ? mark.id : 0;
      // Back past one or more open sheets: they close (their entries are already gone).
      const gone = stack.filter(s => s.id > here);
      if (gone.length) {
        for (const s of gone) s.inHistory = false;
        for (const s of gone.reverse()) s.close();
        return;
      }
    }
    // Landed on an entry whose sheet has since closed, or one from before a reload: skip it.
    if (mark && (mark.load !== LOAD || stale.has(mark.id))) {
      stale.delete(mark.id);
      history.back();
    }
  });
}

/** Registers an open sheet; returns the function to call when it closes (for any reason). */
export function pushSheet(close: () => void): () => void {
  install();
  const entry: Entry = { id: ++seq, close, inHistory: false };
  // Added a moment later, so a sheet that opens and closes at once (React's development double run) leaves no trace.
  const timer = setTimeout(() => {
    try {
      history.pushState({ ...(history.state ?? {}), [KEY]: { load: LOAD, id: entry.id } }, '');
      entry.inHistory = true;
    } catch { /* history unavailable: Escape and the sheet's own controls still work */ }
  }, 0);
  stack.push(entry);
  return () => {
    clearTimeout(timer);
    const i = stack.indexOf(entry);
    if (i >= 0) stack.splice(i, 1);
    if (!entry.inHistory) return;
    entry.inHistory = false;
    const mark = markOf(history.state);
    if (mark?.load === LOAD && mark.id === entry.id) { ignorePops++; history.back(); }
    else stale.add(entry.id);
  };
}

/** The number of open sheets (for tests). */
export const openSheets = () => stack.length;
