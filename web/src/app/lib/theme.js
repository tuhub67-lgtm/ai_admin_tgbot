/* Тема кабинета: light (по умолчанию) / dark.
   Хранится в localStorage['pk_theme'], применяется на <html data-theme>. */

import { useCallback, useEffect, useState } from 'react';

const KEY = 'pk_theme';

export function getTheme() {
  try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
}

export function applyTheme(theme) {
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'light';
  try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
  applyTheme(t);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('pk-theme', { detail: t }));
  return t;
}

/* Хук темы: [theme, toggle, set]. Применяет сохранённую тему и держит инстансы в синхроне. */
export function useTheme() {
  const [theme, setThemeState] = useState(getTheme);

  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    const onTheme = (e) => setThemeState(e.detail === 'dark' ? 'dark' : 'light');
    window.addEventListener('pk-theme', onTheme);
    return () => window.removeEventListener('pk-theme', onTheme);
  }, []);

  const set = useCallback((t) => setThemeState(setTheme(t)), []);
  const toggle = useCallback(() => setThemeState((cur) => setTheme(cur === 'dark' ? 'light' : 'dark')), []);

  return [theme, toggle, set];
}
