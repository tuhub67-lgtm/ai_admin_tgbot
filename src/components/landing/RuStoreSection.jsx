import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { RuStoreButton } from '../../design/ui_kits/landing-blocks.jsx';
import { Section } from './Section.jsx';
import { reachGoal } from '../../lib/analytics.js';
import { RUSTORE_URL } from '../../config.js';

/* Вторично, ниже формы: кнопка RuStore + «Скоро в RuStore» + QR.
   Приложение ещё не опубликовано — QR генерируется от плейсхолдера RUSTORE_URL (TODO: заменить ссылку). */
export function RuStoreSection() {
  const [qr, setQr] = useState('');

  useEffect(() => {
    // QR — генерируемый ассет. Цвета берём из токенов (charcoal/white), а не литералами:
    // QRCode.toDataURL требует hex-строки, поэтому читаем значения переменных из :root.
    const css = getComputedStyle(document.documentElement);
    const dark = (css.getPropertyValue('--charcoal') || '#1C1A17').trim();
    const light = (css.getPropertyValue('--neutral-0') || '#FFFFFF').trim();
    QRCode.toDataURL(RUSTORE_URL, { margin: 1, width: 320, color: { dark, light } })
      .then(setQr)
      .catch(() => setQr(''));
  }, []);

  return (
    <Section id="rustore" bg="var(--bg)" tight>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-8)', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ maxWidth: '46ch' }}>
          <p className="lp-overline">Приложение</p>
          <h2 className="lp-h2">Скоро в RuStore</h2>
          <p className="lp-lead" style={{ marginInline: 'auto' }}>
            Кабинет владельца выйдет в RuStore. Отсканируйте QR, чтобы не пропустить, — или подключитесь сейчас, и приложение придёт вам первым.
          </p>
          <div onClickCapture={() => reachGoal('rustore_click')} style={{ display: 'inline-flex', marginTop: 'var(--sp-5)' }}>
            <RuStoreButton />
          </div>
        </div>

        {qr ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-card)', padding: 'var(--sp-4)', boxShadow: 'var(--shadow-card)' }}>
            <img src={qr} alt="QR-код на страницу приложения в RuStore" width="160" height="160" style={{ display: 'block' }} />
          </div>
        ) : null}
      </div>
    </Section>
  );
}
