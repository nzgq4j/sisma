'use client';
import { BottomNav } from '@/components/BottomNav';
import { AppStateProvider } from '@/components/AppState';

// App shell for /app/*: top app bar lives in each page; bottom nav is shared. Edge-to-edge on Android.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppStateProvider>
      <div style={{ minHeight: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))', maxWidth: 520, margin: '0 auto' }}>
        {children}
      </div>
      <BottomNav />
    </AppStateProvider>
  );
}
