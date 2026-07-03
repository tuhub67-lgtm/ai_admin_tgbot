import React from 'react';
import { Link } from 'react-router-dom';
import { BearMark } from '../../design/components/core/BearMark.jsx';
import { Button } from '../../design/components/controls/Button.jsx';
import { scrollToId } from './Section.jsx';
import { CITY, TG_USERNAME, TG_URL, isPlaceholder } from '../../config.js';

export function Footer() {
  const year = 2026; // избегаем недетерминизма сборки; обновляется вручную
  const tgPlaceholder = isPlaceholder(TG_USERNAME);

  return (
    <footer style={{ background: 'var(--surface-brand)', color: 'var(--text-on-brand)' }}>
      <div className="lp-container" style={{ paddingTop: 'var(--sp-12)', paddingBottom: 'var(--sp-8)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-8)', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ maxWidth: '44ch' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <BearMark size={40} strokeWidth={3} style={{ color: 'var(--gold-300)' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h4)', fontWeight: 700 }}>Подхват AI+</span>
            </div>
            <p style={{ margin: 'var(--sp-4) 0 0', color: 'var(--gold-200)', fontSize: 'var(--fs-body)', lineHeight: 1.5 }}>
              ИИ-администратор для частных стоматологий. Возвращает пациентов с пропущенных звонков. Данные — в России, 152-ФЗ.
            </p>
          </div>

          <nav aria-label="Подвал" style={{ display: 'grid', gap: 'var(--sp-3)', fontSize: 'var(--fs-body)' }}>
            <a className="lp-tap" href="#how" onClick={(e) => { e.preventDefault(); scrollToId('how'); }} style={{ color: 'var(--gold-200)', textDecoration: 'none' }}>Как работает</a>
            <a className="lp-tap" href="#price" onClick={(e) => { e.preventDefault(); scrollToId('price'); }} style={{ color: 'var(--gold-200)', textDecoration: 'none' }}>Тариф</a>
            <a className="lp-tap" href="#faq" onClick={(e) => { e.preventDefault(); scrollToId('faq'); }} style={{ color: 'var(--gold-200)', textDecoration: 'none' }}>Вопросы</a>
            <Link className="lp-tap" to="/privacy" style={{ color: 'var(--gold-200)', textDecoration: 'none' }}>Политика конфиденциальности</Link>
          </nav>

          <div style={{ display: 'grid', gap: 'var(--sp-3)' }}>
            <div style={{ color: 'var(--gold-200)', fontSize: 'var(--fs-body)' }}>{CITY}</div>
            {tgPlaceholder ? (
              <div style={{ color: 'var(--gold-200)', fontSize: 'var(--fs-body)' }}>Основатель: {TG_USERNAME}</div>
            ) : (
              <a href={TG_URL} target="_blank" rel="noopener" style={{ color: 'var(--gold-200)', fontSize: 'var(--fs-body)' }}>Написать основателю</a>
            )}
            <Button variant="primary" size="md" onClick={() => scrollToId('lead')} style={{ marginTop: 'var(--sp-2)' }}>Подключить клинику</Button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--wine-700)', marginTop: 'var(--sp-8)', paddingTop: 'var(--sp-5)', color: 'var(--gold-200)', fontSize: 'var(--fs-body)' }}>
          © {year} Подхват AI+
        </div>
      </div>
    </footer>
  );
}
