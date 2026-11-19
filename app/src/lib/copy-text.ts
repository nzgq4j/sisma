// Copying text reliably, including on iPhone where sharing an image drops the post text (e.g. into Bluesky).
// iOS Safari only copies from an editable text field that is selected with an explicit range (a read-only field
// "succeeds" without copying), and rejects an asynchronous clipboard write still pending when the share menu takes
// focus. So: copyTextNow() copies synchronously with an iOS-safe field; clipboardWrite() is the Clipboard API, which
// share flows await before opening the share menu (components/ShareCard.tsx).

/** Synchronous copy (classic execCommand) from a hidden, editable, range-selected text field. */
export function copyTextNow(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.contentEditable = 'true';
  ta.readOnly = false;
  ta.setAttribute('aria-hidden', 'true');
  // On screen but invisible (iOS ignores off-screen fields), 16 px so iOS doesn't zoom.
  Object.assign(ta.style, { position: 'fixed', top: '0', left: '0', width: '1px', height: '1px', padding: '0', border: '0', opacity: '0', fontSize: '16px', pointerEvents: 'none' });
  // Inside the open dialog when there is one, so focus and selection stay in the active part of the page.
  const host = document.activeElement?.closest('[role="dialog"]') ?? document.body;
  host.appendChild(ta);
  const active = document.activeElement as HTMLElement | null;
  let ok = false;
  try {
    ta.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(ta);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    ta.setSelectionRange(0, text.length);
    ok = document.execCommand('copy');
  } catch { ok = false; }
  window.getSelection()?.removeAllRanges();
  ta.remove();
  active?.focus?.({ preventScroll: true });
  return ok;
}

/** The Clipboard API (ClipboardItem where available, as Safari prefers, else writeText). Resolves to whether it worked. */
export async function clipboardWrite(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
      await navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
    } else {
      await navigator.clipboard.writeText(text);
    }
    return true;
  } catch {
    try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
  }
}

/** Copies text both ways (the synchronous copy can report success on iOS without copying). */
export async function copyText(text: string): Promise<boolean> {
  const now = copyTextNow(text);
  const api = await clipboardWrite(text);
  return now || api;
}
