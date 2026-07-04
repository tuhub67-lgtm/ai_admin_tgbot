import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Витрина + кабинет — единый SPA. В проде билд (web/dist) раздаёт Caddy
// со SPA-фолбэком на index.html (роуты /app/* и /privacy — клиентские).
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    // Ассеты дизайн-пака (логотип-плашки) крупные — не инлайнить в base64.
    assetsInlineLimit: 2048,
  },
});
