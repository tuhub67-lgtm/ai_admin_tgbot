import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/* Тема кабинета. Светлая по умолчанию. Сохраняем выбор в localStorage podhvat_theme.
   Применяем data-theme на внешней обёртке — так весь раздел /app (вход, онбординг,
   экраны) наследует переменные нужной темы. */

const THEME_KEY = 'podhvat_theme';
const ThemeCtx = createContext(null);

function readTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === 'dark' || t === 'light' ? t : 'light';
  } catch { return 'light'; }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* тихо */ }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, toggle }}>
      <div
        data-theme={theme}
        style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}
      >
        {children}
      </div>
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const v = useContext(ThemeCtx);
  if (!v) throw new Error('useTheme должен вызываться внутри <ThemeProvider>');
  return v;
}
