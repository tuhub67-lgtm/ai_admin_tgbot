import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Один самодостаточный HTML кабинета в мок-режиме — для кликабельного превью
// без бэкенда (npm run build:preview:cab).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  define: { 'import.meta.env.VITE_API_MOCK': JSON.stringify('1') },
  build: {
    outDir: 'preview-dist-cab',
    rollupOptions: { input: 'cabinet-preview.html' },
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
});
