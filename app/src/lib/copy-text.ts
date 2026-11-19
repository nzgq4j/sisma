// Copies text in the same tap, synchronously, before anything else happens (e.g. a share menu opening). iOS Safari
// rejects an asynchronous clipboard write that is still pending when the share sheet takes focus, so the classic
// synchronous copy (a selected, off-screen text area) runs first; the Clipboard API is the fallback.
export function copyTextNow(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  // Off-screen, 16 px so iOS doesn't zoom, and kept out of the accessibility tree.
  ta.setAttribute('aria-hidden', 'true');
  Object.assign(ta.style, { position: 'fixed', top: '0', left: '-9999px', opacity: '0', fontSize: '16px' });
  document.body.appendChild(ta);
  const active = document.activeElement as HTMLElement | null;
  let ok = false;
  try {
    ta.focus({ preventScroll: true });
    ta.select();
    ta.setSelectionRange(0, text.length); // iOS needs an explicit range
    ok = document.execCommand('copy');
  } catch { ok = false; }
  ta.remove();
  active?.focus?.({ preventScroll: true });
  return ok;
}

/** Copies text: synchronously when possible, else with the Clipboard API. Resolves to whether it worked. */
export async function copyText(text: string): Promise<boolean> {
  if (copyTextNow(text)) return true;
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
