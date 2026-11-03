// Upgrade chosen by a signed-out user: kept on this device while they sign in or create an account (including
// the round trip through Google or an email confirmation link), so checkout continues afterwards. Expires after an
// hour; cleared when they close sign-in without signing in.
import type { Billing } from './entitlements';

const KEY = 'sisma.pendingUpgrade';
const TTL_MS = 60 * 60 * 1000;

export function setPendingUpgrade(billing: Billing) {
  try { localStorage.setItem(KEY, JSON.stringify({ billing, at: Date.now() })); } catch { /* storage unavailable */ }
}

export function clearPendingUpgrade() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}

/** The pending choice if there is a fresh one; it is removed either way. */
export function takePendingUpgrade(now = Date.now()): Billing | null {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); localStorage.removeItem(KEY); } catch { return null; }
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { billing?: unknown; at?: unknown };
    const fresh = typeof v.at === 'number' && now - v.at >= 0 && now - v.at < TTL_MS;
    return fresh && (v.billing === 'monthly' || v.billing === 'yearly') ? v.billing : null;
  } catch { return null; }
}
