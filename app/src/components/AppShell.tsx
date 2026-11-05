'use client';
import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { AppBar } from '@/components/AppBar';
import { AppStateProvider } from '@/components/AppState';
import { QuakeDataProvider } from '@/components/QuakeData';
import { FeltReportProvider } from '@/components/FeltReport';
import { SideNav } from '@/components/dash/SideNav';
import { Splash } from '@/components/splash/Splash';
import { AccountProvider } from '@/components/Account';
import { PaywallSheet } from '@/components/Paywall';
import { Onboarding } from '@/components/onboarding/Onboarding';
import { PushSync } from '@/components/PushDevice';
import styles from '@/components/dash/dash.module.css';

// App shell for /app/* (rendered by app/app/layout.tsx, which carries the page metadata). Phone (< 1024px): top app bar + bottom nav, content column up to 520px, edge-to-edge on Android.
// Desktop (>= 1024px): side navigation; the dashboard, Map, Globe and Me (account dashboard) use the full width,
// Science a centred column. Onboarding (first run) sits under the splash; the paywall sheet is shared by every tab.
const FULL_WIDTH = ['/app', '/app/map', '/app/globe', '/app/me'];
const BLEED = ['/app/map', '/app/globe']; // edge to edge on phones and tablets too

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <AccountProvider>
    <AppStateProvider>
      <QuakeDataProvider>
      <FeltReportProvider>
        <SideNav />
        <div className={[styles.shell, !FULL_WIDTH.includes(path) && styles.shellNarrow, BLEED.includes(path) && styles.shellBleed].filter(Boolean).join(' ')}>
          <div className={styles.mobileOnly}><AppBar /></div>
          {children}
        </div>
        <div className={styles.mobileOnly}><BottomNav /></div>
        <PaywallSheet />
        <PushSync />
        <Onboarding />
        <Splash />
      </FeltReportProvider>
      </QuakeDataProvider>
    </AppStateProvider>
    </AccountProvider>
  );
}
