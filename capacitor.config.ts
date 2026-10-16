import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pdftoolspro.app',
  appName: 'PDF Tools Pro',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
