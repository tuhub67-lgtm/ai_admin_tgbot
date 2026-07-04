import React from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

// Шрифты self-host (@fontsource) — как в main.jsx
import '@fontsource/golos-text/cyrillic-400.css';
import '@fontsource/golos-text/cyrillic-500.css';
import '@fontsource/golos-text/cyrillic-600.css';
import '@fontsource/golos-text/cyrillic-700.css';
import '@fontsource/golos-text/cyrillic-800.css';
import '@fontsource/golos-text/latin-400.css';
import '@fontsource/golos-text/latin-600.css';
import '@fontsource/golos-text/latin-700.css';
import '@fontsource/inter/cyrillic-400.css';
import '@fontsource/inter/cyrillic-500.css';
import '@fontsource/inter/cyrillic-600.css';
import '@fontsource/inter/cyrillic-700.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';

import './design/styles.css';
import './app.css';

import App from './App.jsx';

// Демо-превью кабинета: мок-режим (VITE_API_MOCK=1), сразу открываем /app с
// демо-сессией. Выход («Выйти») покажет экран входа. Маршруты — в памяти (iframe).
try {
  localStorage.setItem('pk_jwt', 'demo-preview');
  localStorage.setItem('pk_clinic', JSON.stringify({ slug: 'demo-dent', name: 'Демо-Дент' }));
} catch { /* ignore */ }

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MemoryRouter initialEntries={['/app']}>
      <App />
    </MemoryRouter>
  </React.StrictMode>,
);
