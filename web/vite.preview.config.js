import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Сборка витрины в ОДИН самодостаточный HTML (всё инлайнится: JS, CSS, шрифты, картинки).
// Используется для быстрого просмотра без запуска сервера (npm run build:preview).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'preview-dist',
    rollupOptions: { input: 'preview.html' },
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
});
