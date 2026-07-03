import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../design/components/controls/Button.jsx';
import { BearMark } from '../../design/components/core/BearMark.jsx';
import { scrollToId } from './Section.jsx';
import { reachGoal } from '../../lib/analytics.js';

/* Sticky-шапка: логотип + «Подхват AI+»; справа «Войти» (→ /app) и
   «Подключить клинику» (→ форма заявки). */
export function Header() {
  const navigate = useNavigate();

  const onLogin = () => {
    reachGoal('login_click');
    navigate('/app');
  };

  return (
    <header className="lp-header">
      <div className="lp-container">
        <div className="lp-header__row">
          <Link
            to="/"
            aria-label="Подхват AI+ — на главную"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-3)', textDecoration: 'none', color: 'var(--text)', minHeight: 'var(--hit-min)' }}
          >
            <BearMark size={34} strokeWidth={3} style={{ color: 'var(--wine-800)' }} />
            <span className="lp-wordmark" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h4)', fontWeight: 700 }}>
              Подхват AI+
            </span>
          </Link>

          <nav className="lp-nav" aria-label="Разделы">
            <a href="#how" onClick={(e) => { e.preventDefault(); scrollToId('how'); }}>Как работает</a>
            <a href="#price" onClick={(e) => { e.preventDefault(); scrollToId('price'); }}>Тариф</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToId('faq'); }}>Вопросы</a>
          </nav>

          <div className="lp-header__cta">
            <Button variant="secondary" size="md" onClick={onLogin}>Войти</Button>
            <Button variant="primary" size="md" onClick={() => scrollToId('lead')}>
              <span className="lp-hide-sm">Подключить клинику</span>
              <span className="lp-only-sm">Подключить</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
