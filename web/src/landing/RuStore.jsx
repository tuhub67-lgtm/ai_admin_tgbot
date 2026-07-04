import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Icon } from '../design/components/core/Icon.jsx';
import { Reveal } from '../lib/anim.jsx';
import { RUSTORE_URL } from '../config.js';
import { reachGoal, GOALS } from '../lib/metrika.js';

export function RuStore() {
  const [qr, setQr] = useState('');
  useEffect(() => {
    QRCode.toDataURL(RUSTORE_URL, { margin: 1, width: 220, color: { dark: '#1C1A17', light: '#FFFFFF' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, []);

  return (
    <section id="rustore" className="section" style={{ background: 'var(--bg)' }}>
      <div className="container">
        <Reveal>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap', justifyContent: 'space-between',
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-card)',
              boxShadow: 'var(--shadow-card)', padding: '28px 32px',
            }}
          >
            <div style={{ flex: '1 1 340px' }}>
              <div className="overline" style={{ color: 'var(--text-secondary)' }}>Приложение</div>
              <h2 className="h3" style={{ marginTop: 8, maxWidth: 460 }}>Кабинет всегда в кармане — есть в RuStore</h2>
              <p className="caption" style={{ fontSize: 16, marginTop: 10, maxWidth: 480, lineHeight: 1.5 }}>
                Лиды, статусы и возвращённые рубли — на телефоне. Пациентам ставить ничего не нужно:
                Анна пишет им прямо в мессенджер.
              </p>
              <a
                href={RUSTORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => reachGoal(GOALS.RUSTORE_CLICK)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 12, height: 56, padding: '0 22px', marginTop: 18,
                  background: 'var(--charcoal)', color: 'var(--ivory)', textDecoration: 'none', borderRadius: 'var(--r-btn)',
                }}
              >
                <Icon name="return" size={22} />
                <span style={{ lineHeight: 1.15, textAlign: 'left' }}>
                  <span style={{ display: 'block', fontSize: 12, opacity: .75, letterSpacing: '.04em' }}>СКАЧАЙТЕ В</span>
                  <span style={{ display: 'block', fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)' }}>RuStore</span>
                </span>
              </a>
            </div>

            {/* QR — только десктоп (на телефоне и так под рукой) */}
            <div className="pk-hide-mobile" style={{ textAlign: 'center' }}>
              <div style={{ padding: 12, background: '#FFFFFF', borderRadius: 'var(--r-card-sm)', border: '1px solid var(--border)', display: 'inline-block' }}>
                {qr ? (
                  <img src={qr} alt="QR-код на страницу приложения в RuStore" width={160} height={160} style={{ display: 'block' }} />
                ) : (
                  <div style={{ width: 160, height: 160 }} aria-hidden="true" />
                )}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Наведите камеру телефона</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
