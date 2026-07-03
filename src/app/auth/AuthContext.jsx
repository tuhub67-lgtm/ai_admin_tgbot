import React, { createContext, useContext, useState, useCallback } from 'react';
import { getToken, setToken as persistToken, clearToken } from '../lib/api.js';

/* Сессия кабинета: JWT в localStorage (podhvat_jwt), клиника — рядом (podhvat_clinic),
   чтобы после обновления страницы имя клиники в шапке не пропадало. */

const CLINIC_KEY = 'podhvat_clinic';
const AuthCtx = createContext(null);

function readClinic() {
  try {
    const raw = localStorage.getItem(CLINIC_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [token, setTok] = useState(() => getToken());
  const [clinic, setClinic] = useState(() => readClinic());

  const login = useCallback((jwt, clinicObj) => {
    persistToken(jwt);
    setTok(jwt);
    if (clinicObj) {
      try { localStorage.setItem(CLINIC_KEY, JSON.stringify(clinicObj)); } catch { /* тихо */ }
      setClinic(clinicObj);
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTok(null);
    try { localStorage.removeItem(CLINIC_KEY); } catch { /* тихо */ }
    setClinic(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ token, clinic, isAuthed: !!token, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error('useAuth должен вызываться внутри <AuthProvider>');
  return v;
}
