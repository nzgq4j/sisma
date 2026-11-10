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

/** The pending choice if there is a fresh one, left in place. */
export function peekPendingUpgrade(now = Date.now()): Billing | null {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { return null; }
  return parse(raw, now);
}

/** The pending choice if there is a fresh one; it is removed either way. */
export function takePendingUpgrade(now = Date.now()): Billing | null {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); localStorage.removeItem(KEY); } catch { return null; }
  return parse(raw, now);
}

function parse(raw: string | null, now: number): Billing | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { billing?: unknown; at?: unknown };
    const fresh = typeof v.at === 'number' && now - v.at >= 0 && now - v.at < TTL_MS;
    // 'monthly' may still be stored from before sisma+ became yearly only: it continues as yearly.
    return fresh && (v.billing === 'monthly' || v.billing === 'yearly') ? 'yearly' : null;
  } catch { return null; }
}

// The 1-year range chosen before upgrading: applied once the account has sisma+ (same one-hour window).
const RANGE_KEY = 'sisma.pendingRange';
export function setPendingYearRange() {
  try { localStorage.setItem(RANGE_KEY, JSON.stringify({ at: Date.now() })); } catch { /* storage unavailable */ }
}
/** True if a fresh 1-year choice was waiting; it is removed either way. */
export function takePendingYearRange(now = Date.now()): boolean {
  try {
    const raw = localStorage.getItem(RANGE_KEY);
    localStorage.removeItem(RANGE_KEY);
    const at = raw ? (JSON.parse(raw) as { at?: unknown }).at : null;
    return typeof at === 'number' && now - at >= 0 && now - at < TTL_MS;
  } catch { return false; }
}
