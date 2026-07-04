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

// MemoryRouter — маршруты в памяти, не трогают URL (важно для просмотра в iframe-артефакте).
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  </React.StrictMode>,
);
