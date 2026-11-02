'use client';
import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { AppStateProvider } from '@/components/AppState';
import { SideNav } from '@/components/dash/SideNav';
import styles from '@/components/dash/dash.module.css';

// App shell for /app/*. Phone (< 1024px): bottom nav, content column up to 520px, edge-to-edge on Android.
// Desktop (>= 1024px): side navigation; /app is a full-width dashboard, other tabs sit in a centred column.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <AppStateProvider>
      <SideNav />
      <div className={path === '/app' ? styles.shell : `${styles.shell} ${styles.shellNarrow}`}>
        {children}
      </div>
      <div className={styles.mobileOnly}><BottomNav /></div>
    </AppStateProvider>
  );
}
