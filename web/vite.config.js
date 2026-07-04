import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Витрина + кабинет — единый SPA. В проде билд (web/dist) раздаёт Caddy
// со SPA-фолбэком на index.html (роуты /app/* и /privacy — клиентские).
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    // Строго localhost (не 127.0.0.1): бэкенд ставит host-only cookie сессии,
    // и обращаться к фронту нужно с того же хоста, иначе cookie не сохранится.
    host: 'localhost',
    proxy: {
      // Кабинет/витрина ходят на относительный /api → проксируем в backend :8000,
      // сохраняя HttpOnly cookie-сессию без CORS (один origin для браузера).
      // Роуты бэкенда уже /api — rewrite не нужен; Set-Cookie не переписываем.
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    // Ассеты дизайн-пака (логотип-плашки) крупные — не инлайнить в base64.
    assetsInlineLimit: 2048,
  },
});
