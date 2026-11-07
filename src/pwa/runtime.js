import { Capacitor } from '@capacitor/core';
import { createPwaController } from './controller.js';
export const pwa = createPwaController({
  win: window,
  nav: navigator,
  native: Capacitor.isNativePlatform(),
  enabled: import.meta.env.PROD,
});
