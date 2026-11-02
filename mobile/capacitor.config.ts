import type { CapacitorConfig } from '@capacitor/cli';

/** Loads the live /app so web releases ship without a store update. www/ holds only the offline page. */
const config: CapacitorConfig = {
  appId: 'io.sisma.app',
  appName: 'sisma',
  webDir: 'www',
  server: {
    url: 'https://sisma.io/app',
    allowNavigation: ['sisma.io', 'www.sisma.io'],
    errorPath: 'offline.html',
  },
  android: { allowMixedContent: false, backgroundColor: '#6C4BF4' },
  plugins: {
    // Hidden by the web splash (app/src/components/splash/Splash.tsx) once it is painted; 10 s is only the fallback.
    SplashScreen: { launchShowDuration: 10000, launchAutoHide: true, launchFadeOutDuration: 0, backgroundColor: '#6C4BF4', showSpinner: false },
    SystemBars: { insetsHandling: 'native', initialViewportFitValueHint: 'cover' },
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
  },
};

export default config;
