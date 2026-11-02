'use client';
import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { AppBar } from '@/components/AppBar';
import { AppStateProvider } from '@/components/AppState';
import { QuakeDataProvider } from '@/components/QuakeData';
import { SideNav } from '@/components/dash/SideNav';
import styles from '@/components/dash/dash.module.css';

// App shell for /app/*. Phone (< 1024px): top app bar + bottom nav, content column up to 520px, edge-to-edge on Android.
// Desktop (>= 1024px): side navigation; the dashboard, Map and Globe use the full width, other tabs a centred column.
const FULL_WIDTH = ['/app', '/app/map', '/app/globe'];
const BLEED = ['/app/map', '/app/globe']; // edge to edge on phones and tablets too

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <AppStateProvider>
      <QuakeDataProvider>
        <SideNav />
        <div className={[styles.shell, !FULL_WIDTH.includes(path) && styles.shellNarrow, BLEED.includes(path) && styles.shellBleed].filter(Boolean).join(' ')}>
          <div className={styles.mobileOnly}><AppBar /></div>
          {children}
        </div>
        <div className={styles.mobileOnly}><BottomNav /></div>
      </QuakeDataProvider>
    </AppStateProvider>
  );
}
