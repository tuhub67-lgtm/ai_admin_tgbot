import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { ThemeProvider } from './theme.jsx';
import AppShell from './AppShell.jsx';
import Login from './screens/Login.jsx';
import Today from './screens/Today.jsx';
import LeadDetail from './screens/LeadDetail.jsx';
import Money from './screens/Money.jsx';
import Settings from './screens/Settings.jsx';
import Onboarding from './screens/Onboarding.jsx';

/* Роутер кабинета /app. Пути относительны /app (App.jsx монтирует через /app/*).
   Вход и обмен токена — открыты; остальное — под защитой сессии. */

function RequireAuth() {
  const { isAuthed } = useAuth();
  return isAuthed ? <Outlet /> : <Navigate to="/app/login" replace />;
}

export default function AppCabinet() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route path="auth" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="onboarding" element={<Onboarding />} />
            <Route element={<AppShell />}>
              <Route index element={<Today />} />
              <Route path="lead/:id" element={<LeadDetail />} />
              <Route path="money" element={<Money />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}
