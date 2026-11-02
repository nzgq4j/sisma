'use client';
import type { ReactNode } from 'react';

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'var(--scrim)' }} />
      <div style={{ position: 'relative', background: 'var(--surface)', borderRadius: '28px 28px 0 0', maxHeight: '90%', overflowY: 'auto', padding: '10px 20px calc(28px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520, width: '100%', margin: '0 auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line)', alignSelf: 'center' }} />
        {children}
      </div>
    </div>
  );
}
