import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Privacy from './pages/Privacy.jsx';
import AppCabinet from './app/index.jsx';
import { initMetrika } from './lib/analytics.js';

export default function App() {
  useEffect(() => { initMetrika(); }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/privacy" element={<Privacy />} />
      {/* Кабинет владельца /app — Этап B: вход, лента, деньги, настройки, онбординг. */}
      <Route path="/app/*" element={<AppCabinet />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
