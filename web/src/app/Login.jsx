import { Button } from '../design/components/controls/Button.jsx';
import { Icon } from '../design/components/core/Icon.jsx';
import logoWine from '../assets/logo-tile-wine.png';
import { Reveal } from '../lib/anim.jsx';
import { BOT_LOGIN_URL } from '../config.js';

/* Вход в кабинет — без пароля. Одноразовая ссылка приходит в Telegram-боте. */
export default function Login() {
  return (
    <div
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 20px', background: 'var(--bg)', minHeight: '100vh',
      }}
    >
      <Reveal>
        <div
          style={{
            position: 'relative', width: 'min(440px, 100%)', background: 'var(--surface)',
            boxShadow: 'var(--shadow-raised)', color: 'var(--text)',
            clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)',
            borderRadius: '16px 0 16px 16px', padding: '32px 28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={logoWine} alt="" width={44} height={48} style={{ display: 'block', borderRadius: 9 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>
              Подхват<span style={{ color: 'var(--text-gold)' }}> AI+</span>
            </span>
          </div>

          <h1 className="h2" style={{ marginTop: 24, fontSize: 26 }}>Вход в кабинет</h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-secondary)', marginTop: 12 }}>
            Пароля нет. Вход — по одноразовой ссылке из Telegram-бота: так безопаснее и ничего
            не нужно запоминать. Откройте бот и нажмите «Войти» — ссылка придёт в чат.
          </p>

          <a href={BOT_LOGIN_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', marginTop: 24 }}>
            <Button variant="primary" size="lg" icon="telegram" full>Получить ссылку в боте</Button>
          </a>

          <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'grid', gap: 12 }}>
            {[
              { icon: 'shield', t: 'Данные — в России, по 152-ФЗ' },
              { icon: 'clock', t: 'Ссылка действует несколько минут и одноразовая' },
              { icon: 'lock', t: 'Без паролей — нечего украсть и нечего забыть' },
            ].map((r) => (
              <li key={r.t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 16, color: 'var(--text-secondary)' }}>
                <Icon name={r.icon} size={20} color="var(--success-text)" style={{ marginTop: 1 }} />
                {r.t}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
