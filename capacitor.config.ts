import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.acusound.app',
  appName: 'AcuSound',
  webDir: 'dist',
  server: {
    url: 'http://localhost:5173',
    cleartext: true,
    androidScheme: 'https',
  },
};

export default config;
