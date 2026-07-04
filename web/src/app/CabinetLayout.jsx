import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Icon } from '../design/components/core/Icon.jsx';
import logoWine from '../assets/logo-tile-wine.png';
import { authEvents, clearToken, getClinic, getToken } from './lib/api.js';
import { useTheme } from './lib/theme.js';
import Login from './Login.jsx';

const TABS = [
  { to: '/app', end: true, icon: 'bell', label: 'Сегодня' },
  { to: '/app/money', icon: 'ruble', label: 'Деньги' },
  { to: '/app/settings', icon: 'settings', label: 'Настройки' },
];
const ONBOARDING_TAB = { to: '/app/onboarding', icon: 'max', label: 'Онбординг' };

function useOnboarded() {
  const [done, setDone] = useState(() => {
    try { return localStorage.getItem('pk_onboarded') === '1'; } catch { return false; }
  });
  useEffect(() => {
    const onChange = () => {
      try { setDone(localStorage.getItem('pk_onboarded') === '1'); } catch { /* ignore */ }
    };
    window.addEventListener('pk-onboarded', onChange);
    return () => window.removeEventListener('pk-onboarded', onChange);
  }, []);
  return done;
}

/* Регистрация PWA: манифест инжектим на монтировании кабинета (index.html общий с витриной),
   service worker — только в проде (в dev мешал бы HMR Vite). */
function usePWA() {
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.webmanifest';
      document.head.appendChild(link);
    }
    // В демо-превью (мок-режим) service worker не регистрируем — файла /sw.js там нет.
    if (import.meta.env.PROD && import.meta.env.VITE_API_MOCK !== '1' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* офлайн-режим необязателен */ });
    }
  }, []);
}

function NavTab({ tab, variant }) {
  const bottom = variant === 'bottom';
  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      style={({ isActive }) => ({
        display: 'flex', flexDirection: bottom ? 'column' : 'row', alignItems: 'center',
        justifyContent: 'center', gap: bottom ? 3 : 8, textDecoration: 'none',
        flex: bottom ? 1 : 'none', minHeight: bottom ? 52 : 40, padding: bottom ? '6px 4px' : '8px 14px',
        borderRadius: bottom ? 10 : 999, whiteSpace: 'nowrap',
        fontFamily: 'var(--font-body)', fontSize: bottom ? 13 : 16, fontWeight: 600,
        color: isActive ? (bottom ? 'var(--text)' : 'var(--text-on-brand)') : 'var(--text-secondary)',
        background: isActive ? (bottom ? 'var(--surface-subtle)' : 'var(--surface-brand)') : 'transparent',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon name={tab.icon} size={bottom ? 22 : 18} color={isActive && !bottom ? 'var(--gold-400)' : undefined} />
          {tab.label}
        </>
      )}
    </NavLink>
  );
}

export default function CabinetLayout() {
  const [token, setToken] = useState(getToken);
  const [theme, toggleTheme] = useTheme();
  const onboarded = useOnboarded();
  const clinic = getClinic();
  const location = useLocation();
  usePWA();

  // Реакция на login / logout / 401.
  useEffect(() => {
    if (!authEvents) return undefined;
    const onChange = () => setToken(getToken());
    authEvents.addEventListener('change', onChange);
    return () => authEvents.removeEventListener('change', onChange);
  }, []);

  if (!token) return <Login />;

  const tabs = onboarded ? TABS : [...TABS, ONBOARDING_TAB];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Верхняя панель */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, minHeight: 64 }}>
          <NavLink to="/app" end style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flex: 'none' }}>
            <img src={logoWine} alt="" width={34} height={37} style={{ display: 'block', borderRadius: 8 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>
              {clinic?.name || 'Подхват AI+'}
            </span>
          </NavLink>

          {/* Навигация — десктоп */}
          <nav className="pk-cab-topnav" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
            {tabs.map((t) => <NavTab key={t.to} tab={t} variant="top" />)}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <IconButton onClick={clearToken} title="Выйти" icon="lock" label="Выйти" />
          </div>
        </div>
      </header>

      {/* Контент */}
      <main className="pk-cab-main container" key={location.pathname} style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Навигация — мобильная (нижняя) */}
      <nav className="pk-cab-botnav">
        {tabs.map((t) => <NavTab key={t.to} tab={t} variant="bottom" />)}
      </nav>
    </div>
  );
}

/* Переключатель темы: луна (перейти в тёмную) / солнце (перейти в светлую). */
function ThemeToggle({ theme, onToggle }) {
  const [hover, setHover] = useState(false);
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={onToggle}
      title={dark ? 'Светлая тема' : 'Тёмная тема'}
      aria-label={dark ? 'Светлая тема' : 'Тёмная тема'}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44,
        border: '1.5px solid var(--border-strong)', borderRadius: 'var(--r-btn)',
        background: hover ? 'color-mix(in srgb, var(--text) 7%, transparent)' : 'transparent',
        color: 'var(--text)', cursor: 'pointer', transition: 'background var(--motion-fast)',
      }}
    >
      {dark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2 2M16.8 16.8l2 2M18.8 5.2l-2 2M7.2 16.8l-2 2" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
          <path d="M20 14.5A8 8 0 019.5 4 7 7 0 1020 14.5z" />
        </svg>
      )}
    </button>
  );
}

/* Компактная кнопка-иконка в шапке: подпись видна на десктопе, скрыта на мобильном. */
function IconButton({ onClick, title, icon, label }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 12px',
        border: '1.5px solid var(--border-strong)', borderRadius: 'var(--r-btn)',
        background: hover ? 'color-mix(in srgb, var(--text) 7%, transparent)' : 'transparent',
        color: 'var(--text)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600,
        transition: 'background var(--motion-fast)',
      }}
    >
      <Icon name={icon} size={18} />
      <span className="pk-hide-mobile">{label}</span>
    </button>
  );
}
