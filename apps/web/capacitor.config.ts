import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV !== 'production';
const isLiveReload = isDev && process.env.CAPACITOR_LIVE_RELOAD === 'true';
const liveReloadUrl = process.env.CAPACITOR_LIVE_RELOAD_URL || 'http://localhost:3000';

const config: CapacitorConfig = {
  appId: 'com.kridha.homemind',
  appName: 'HomeMind.AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    ...(isLiveReload && {
      url: liveReloadUrl,
      cleartext: true,
    }),
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
    },
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
    },
  },
};

export default config;
