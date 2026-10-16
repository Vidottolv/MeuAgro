import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { offlineShell } from './scripts/offline-shell.mjs';

export default defineConfig({
  base: '/',
  plugins: [vue(), offlineShell()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});
