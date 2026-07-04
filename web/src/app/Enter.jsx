import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../design/components/controls/Button.jsx';
import { Icon } from '../design/components/core/Icon.jsx';
import { BearMark } from '../design/components/core/BearMark.jsx';
import { api } from './lib/api.js';
import { BOT_LOGIN_URL } from '../config.js';

/* /app/enter?token=<magic> — проверяем ссылку, сохраняем JWT, уходим в кабинет. */
export default function Enter() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState('loading'); // loading | error
  const token = params.get('token');

  useEffect(() => {
    let alive = true;
    if (!token) { setState('error'); return undefined; }
    // verify выставляет HttpOnly-cookie сессии на сервере; токен в JS не попадает.
    api.verify(token)
      .then(() => { if (alive) navigate('/app', { replace: true }); })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [token, navigate]);

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 'min(420px, 100%)', textAlign: 'center', color: 'var(--text)' }}>
        {state === 'loading' ? (
          <>
            <BearMark size={72} strokeWidth={3} style={{ color: 'var(--border-strong)', margin: '0 auto 20px' }} />
            <div className="h3" style={{ fontSize: 22 }}>Проверяем ссылку…</div>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 10 }}>Секунду — открываем ваш кабинет.</p>
          </>
        ) : (
          <div
            style={{
              position: 'relative', background: 'var(--surface)', boxShadow: 'var(--shadow-raised)',
              clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)',
              borderRadius: '16px 0 16px 16px', padding: '28px 24px',
            }}
          >
            <Icon name="urgent" size={40} color="var(--urgent)" style={{ margin: '0 auto 14px' }} />
            <div className="h3" style={{ fontSize: 22 }}>Ссылка устарела</div>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 10 }}>
              Одноразовые ссылки живут недолго и работают один раз. Запросите новую в боте — придёт свежая.
            </p>
            <a href={BOT_LOGIN_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', marginTop: 20 }}>
              <Button variant="primary" size="lg" icon="telegram" full>Запросить новую ссылку</Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
