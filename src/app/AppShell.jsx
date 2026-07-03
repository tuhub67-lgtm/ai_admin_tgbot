import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Icon } from '../design/components/core/Icon.jsx';
import { useAuth } from './auth/AuthContext.jsx';
import { useTheme } from './theme.jsx';
import logoTile from '../design/assets/logo-tile-wine.png';

/* Каркас кабинета: шапка (логотип-плашка + имя клиники + смена темы + выход)
   и нижняя навигация Сегодня / Деньги / Настройки. Контент — через <Outlet/>.
   Ширина колонки как у телефона (мотив «смотрю с телефона»), но тянется на десктопе. */

const TABS = [
  { to: '/app', end: true, icon: 'booking', label: 'Сегодня' },
  { to: '/app/money', end: false, icon: 'ruble', label: 'Деньги' },
  { to: '/app/settings', end: false, icon: 'settings', label: 'Настройки' },
];

function ThemeButton() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Светлая тема' : 'Тёмная тема'}
      title={dark ? 'Светлая тема' : 'Тёмная тема'}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 44, height: 44, flex: 'none', border: '1.5px solid var(--border-strong)',
        borderRadius: 'var(--r-btn)', background: 'transparent', color: 'var(--text-secondary)',
        cursor: 'pointer',
      }}
    >
      {/* Контраст-метка «оформление»: полукруг заполнен — читается в обеих темах */}
      <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true" style={{ display: 'block' }}>
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
      </svg>
    </button>
  );
}

function TabItem({ to, end, icon, label }) {
  return (
    <NavLink to={to} end={end} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <span
          style={{
            position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 4, padding: '10px 4px 8px', minHeight: 56,
            color: isActive ? 'var(--control-on)' : 'var(--text-secondary)',
          }}
        >
          {isActive ? (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute', top: 0, width: 28, height: 4, background: 'var(--control-on)',
                clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)',
              }}
            />
          ) : null}
          <Icon name={icon} size={24} />
          <span style={{ fontSize: 16, fontWeight: isActive ? 600 : 500 }}>{label}</span>
        </span>
      )}
    </NavLink>
  );
}

export default function AppShell() {
  const { clinic, logout } = useAuth();
  const navigate = useNavigate();
  const clinicName = clinic?.name || clinic?.title || 'Ваша клиника';

  const doLogout = () => {
    logout();
    navigate('/app/login', { replace: true });
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 5,
        }}
      >
        <img src={logoTile} alt="Подхват AI+" width="32" height="35" style={{ display: 'block', borderRadius: 8, flex: 'none' }} />
        <span
          style={{
            fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, flex: 1, minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {clinicName}
        </span>
        <ThemeButton />
        <button
          type="button"
          onClick={doLogout}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            height: 44, padding: '0 14px', border: '1.5px solid var(--border-strong)',
            borderRadius: 'var(--r-btn)', background: 'transparent', color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Icon name="return" size={18} />
          Выход
        </button>
      </header>

      <main style={{ flex: 1, minWidth: 0, padding: '16px 16px 24px' }}>
        <Outlet />
      </main>

      <nav
        style={{
          flex: 'none', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: '1px solid var(--border)', background: 'var(--surface)',
          position: 'sticky', bottom: 0, zIndex: 5, paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {TABS.map((t) => <TabItem key={t.to} {...t} />)}
      </nav>
    </div>
  );
}
