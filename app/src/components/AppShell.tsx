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
import { InstallPrompt } from '@/components/InstallPrompt';
import { useDesktop } from '@/components/dash/useDesktop';
import { useT } from '@/i18n/I18nProvider';
import styles from '@/components/dash/dash.module.css';

// App shell for /app/* (rendered by app/app/layout.tsx, which carries the page metadata). Phone (< 1024px): top app bar + bottom nav, content column up to 520px, edge-to-edge on Android.
// Desktop (>= 1024px): side navigation; the dashboard, Map, Globe and Me (account dashboard) use the full width,
// Science a centred column. Onboarding (first run) sits under the splash; the paywall sheet is shared by every tab.
// On iPhone / iPad in the browser, InstallPrompt explains Add to Home Screen once (needed for web push on iOS).
const FULL_WIDTH = ['/app', '/app/map', '/app/globe', '/app/me'];
const BLEED = ['/app/map', '/app/globe']; // edge to edge on phones and tablets too

/** Screens whose page has no heading of its own (on phones the app bar shows the name): a heading for screen readers. */
function useHiddenHeading(path: string) {
  const { t } = useT();
  const desktop = useDesktop();
  if (path === '/app/map') return t('tab_map');
  if (path === '/app/globe') return t('tab_globe');
  if (path === '/app/science') return t('sci_title');
  if (desktop) return null; // the dashboard and Me show their own h1 on desktop
  if (path === '/app') return t('tab_feed');
  if (path === '/app/me') return t('tab_me');
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const heading = useHiddenHeading(path);
  return (
    <AccountProvider>
    <AppStateProvider>
      <QuakeDataProvider>
      <FeltReportProvider>
        <SideNav />
        <div className={[styles.shell, !FULL_WIDTH.includes(path) && styles.shellNarrow, BLEED.includes(path) && styles.shellBleed].filter(Boolean).join(' ')}>
          <div className={styles.mobileOnly}><AppBar /></div>
          <main id="main">
            {heading && <h1 className="sr-only">{heading}</h1>}
            {children}
          </main>
        </div>
        <div className={styles.mobileOnly}><BottomNav /></div>
        <PaywallSheet />
        <PushSync />
        <InstallPrompt />
        <Onboarding />
        <Splash />
      </FeltReportProvider>
      </QuakeDataProvider>
    </AppStateProvider>
    </AccountProvider>
  );
}
