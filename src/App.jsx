import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Privacy from './pages/Privacy.jsx';
import AppEntry from './pages/AppEntry.jsx';
import { initMetrika } from './lib/analytics.js';

export default function App() {
  useEffect(() => { initMetrika(); }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/privacy" element={<Privacy />} />
      {/* Кабинет /app — заглушка входа на Этапе A; на Этапе B здесь появится реальный кабинет. */}
      <Route path="/app/*" element={<AppEntry />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
