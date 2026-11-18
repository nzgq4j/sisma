'use client';
// A long admin list folded under a header row (icon, title, item count, chevron). Closed by default; the header is a
// 44 px+ button with aria-expanded, and the list appears below it when opened.
import { useId, useState, type ReactNode } from 'react';
import me from '@/app/app/me/me.module.css';
import styles from '@/app/app/me/admin/admin.module.css';

export function Collapsible({ icon, title, count, children, defaultOpen = false }: { icon: string; title: string; count?: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <>
      <div className={`${me.card} ${styles.foldHead}`}>
        <button type="button" className={me.row} aria-expanded={open} aria-controls={id} onClick={() => setOpen(o => !o)}>
          <span className="ms" aria-hidden="true">{icon}</span>
          <span className={me.grow}>{title}</span>
          {count != null && <span className={me.meta}>{count}</span>}
          <span className={`ms ${me.chev}`} aria-hidden="true">{open ? 'expand_less' : 'expand_more'}</span>
        </button>
      </div>
      <div id={id} hidden={!open}>{open && children}</div>
    </>
  );
}
