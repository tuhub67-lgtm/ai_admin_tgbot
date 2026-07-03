import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { BearMark } from '../../design/components/core/BearMark.jsx';
import { Button } from '../../design/components/controls/Button.jsx';
import { BOT_LOGIN_URL, TG_USERNAME, isPlaceholder } from '../../config.js';

/* Вход в кабинет. Основной путь — команда /login боту, он присылает magic-ссылку
   на /app/auth?token=…. Здесь этот токен меняем на JWT-сессию. */

export default function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login, isAuthed } = useAuth();
  const token = params.get('token');

  const [status, setStatus] = useState(token ? 'exchanging' : 'idle'); // idle | exchanging | error

  // Уже вошли и токена нет — сразу в кабинет.
  useEffect(() => {
    if (isAuthed && !token) navigate('/app', { replace: true });
  }, [isAuthed, token, navigate]);

  // Обмен magic-токена на сессию.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/api/auth/verify?token=${encodeURIComponent(token)}`, { auth: false });
        if (cancelled) return;
        if (res && res.jwt) {
          login(res.jwt, res.clinic);
          navigate('/app', { replace: true });
        } else {
          setStatus('error');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [token, login, navigate]);

  const noBot = BOT_LOGIN_URL === '#' || isPlaceholder(TG_USERNAME);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
      <div
        style={{
          maxWidth: 460, width: '100%', background: 'var(--surface)', boxShadow: 'var(--shadow-raised)',
          borderRadius: 'var(--r-card)', padding: '32px 24px', textAlign: 'center',
        }}
      >
        <BearMark size={56} style={{ color: 'var(--wine-800)', margin: '0 auto' }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, margin: '16px 0 0' }}>Вход в кабинет</h1>

        {status === 'exchanging' ? (
          <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.55 }}>Проверяю ссылку — секунду…</p>
        ) : status === 'error' ? (
          <>
            <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.55 }}>
              Ссылка устарела или недействительна. Отправьте боту команду <strong style={{ color: 'var(--text)' }}>/login</strong> ещё раз — он пришлёт свежую.
            </p>
            <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
              {noBot ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Бот входа: {TG_USERNAME}</div>
              ) : (
                <Button variant="primary" size="lg" icon="telegram" full onClick={() => window.open(BOT_LOGIN_URL, '_blank', 'noopener')}>Открыть бота входа</Button>
              )}
            </div>
          </>
        ) : (
          <>
            <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.55 }}>
              Откройте нашего бота в Telegram и отправьте команду <strong style={{ color: 'var(--text)' }}>/login</strong> — он пришлёт ссылку для входа в кабинет.
            </p>
            <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
              {noBot ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Бот входа: {TG_USERNAME}</div>
              ) : (
                <Button variant="primary" size="lg" icon="telegram" full onClick={() => window.open(BOT_LOGIN_URL, '_blank', 'noopener')}>Открыть бота входа</Button>
              )}
            </div>
          </>
        )}

        <Link to="/" style={{ display: 'inline-block', marginTop: 20, color: 'var(--text-gold)', textDecoration: 'underline', fontSize: 16 }}>← На главную</Link>
      </div>
    </main>
  );
}
