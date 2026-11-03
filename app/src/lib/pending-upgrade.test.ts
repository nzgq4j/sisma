import { beforeEach, describe, expect, it } from 'vitest';
import { clearPendingUpgrade, setPendingUpgrade, takePendingUpgrade } from './pending-upgrade';

// Minimal localStorage for the node test environment.
const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: k => store.get(k) ?? null, setItem: (k, v) => void store.set(k, String(v)), removeItem: k => void store.delete(k),
  clear: () => store.clear(), key: i => [...store.keys()][i] ?? null, get length() { return store.size; },
} as Storage;

describe('pending upgrade', () => {
  beforeEach(() => localStorage.clear());
  it('returns the saved plan once', () => {
    setPendingUpgrade('yearly');
    expect(takePendingUpgrade()).toBe('yearly');
    expect(takePendingUpgrade()).toBeNull();
  });
  it('expires after an hour', () => {
    setPendingUpgrade('monthly');
    expect(takePendingUpgrade(Date.now() + 61 * 60 * 1000)).toBeNull();
  });
  it('can be cleared', () => {
    setPendingUpgrade('monthly');
    clearPendingUpgrade();
    expect(takePendingUpgrade()).toBeNull();
  });
  it('ignores bad data', () => {
    localStorage.setItem('sisma.pendingUpgrade', '{"billing":"weekly","at":1}');
    expect(takePendingUpgrade()).toBeNull();
  });
});
