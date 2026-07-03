import React from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/common/Seo.jsx';
import { BearMark } from '../design/components/core/BearMark.jsx';
import { Button } from '../design/components/controls/Button.jsx';
import { BOT_LOGIN_URL, TG_USERNAME, isPlaceholder } from '../config.js';

/* Заглушка входа в кабинет (Этап A). На Этапе B здесь появится реальный вход по magic-link
   через Telegram-бот и сам кабинет /app. */
export default function AppEntry() {
  const noBot = BOT_LOGIN_URL === '#' || isPlaceholder(TG_USERNAME);
  return (
    <>
      <Seo title="Вход в кабинет — Подхват AI+" description="Вход в кабинет владельца клиники через Telegram-бот." />
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--sp-6)', background: 'var(--surface-subtle)' }}>
        <div
          className="facet-card"
          style={{ maxWidth: 460, width: '100%', background: 'var(--surface)', boxShadow: 'var(--shadow-raised)', borderRadius: 'var(--r-card)', padding: 'var(--sp-8)', textAlign: 'center' }}
        >
          <BearMark size={56} style={{ color: 'var(--wine-800)', margin: '0 auto' }} />
          <h1 className="h2" style={{ marginTop: 'var(--sp-4)' }}>Вход в кабинет</h1>
          <p style={{ margin: 'var(--sp-3) 0 0', color: 'var(--text-secondary)', fontSize: 'var(--fs-body-lg)', lineHeight: 1.55 }}>
            Вход через Telegram-бот — скоро. Пока доступ выдаёт основатель вручную: напишите ему, чтобы подключить клинику.
          </p>
          <div style={{ marginTop: 'var(--sp-6)', display: 'grid', gap: 'var(--sp-3)' }}>
            {noBot ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-body)' }}>Бот входа: {TG_USERNAME}</div>
            ) : (
              <Button variant="primary" size="lg" icon="telegram" full onClick={() => window.open(BOT_LOGIN_URL, '_blank', 'noopener')}>
                Открыть бота входа
              </Button>
            )}
            <Link to="/" className="lp-tap" style={{ color: 'var(--text-gold)', textDecoration: 'underline', fontSize: 'var(--fs-body)', justifyContent: 'center' }}>← На главную</Link>
          </div>
        </div>
      </main>
    </>
  );
}
