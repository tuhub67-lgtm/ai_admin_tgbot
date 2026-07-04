import React from 'react';
import { Icon } from '../../design/components/core/Icon.jsx';
import { Button } from '../../design/components/controls/Button.jsx';
import { fmtRub } from '../../design/components/money/MoneyFigure.jsx';
import { CtaGlow } from '../common/CtaGlow.jsx';
import { Section, scrollToId } from './Section.jsx';

const feats = [
  'Подхват пропущенных — круглосуточно',
  'Анна пишет в MAX, Telegram и SMS',
  'Запись в ваш график и напоминания',
  'Отчёт недели: возвращённые рубли',
];

function FeatureList() {
  return (
    <ul style={{ listStyle: 'none', margin: 'var(--sp-4) 0 0', padding: 0, display: 'grid', gap: 'var(--sp-3)' }}>
      {feats.map((f) => (
        <li key={f} style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start', fontSize: 'var(--fs-body)', lineHeight: 1.4 }}>
          <Icon name="check" size={18} color="var(--success-text)" style={{ marginTop: 2, flex: 'none' }} />
          {f}
        </li>
      ))}
    </ul>
  );
}

export function Pricing() {
  return (
    <Section id="price">
      <p className="lp-overline">Тариф</p>
      <h2 className="lp-h2">Начните с пилота. Подписка — только если окупился</h2>

      <div className="lp-grid-2" style={{ marginTop: 'var(--sp-8)', alignItems: 'stretch' }}>
        {/* Пилот */}
        <div
          className="facet-card lp-lift"
          style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-raised)', borderRadius: 'var(--r-card)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ background: 'var(--surface-brand)', color: 'var(--text-on-brand)', padding: 'var(--sp-5) var(--sp-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-3)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h4)', fontWeight: 700 }}>Пилот · 14 дней</span>
              <span
                style={{ fontSize: 'var(--fs-body)', fontWeight: 600, color: 'var(--cta-text)', background: 'var(--gold-400)', padding: '3px 10px', borderRadius: 'var(--r-badge)' }}
              >
                в честь запуска
              </span>
            </div>
          </div>
          <div style={{ padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
              <span className="tnum" style={{ fontSize: 'var(--fs-h4)', color: 'var(--text-secondary)', textDecoration: 'line-through', textDecorationThickness: '1.5px' }}>
                {fmtRub(4900)} ₽
              </span>
              <span className="money-lg">
                {fmtRub(1590)}<span className="money-rub">₽</span>
              </span>
              <span style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)' }}>за 14 дней</span>
            </div>
            <div style={{ fontSize: 'var(--fs-body)', color: 'var(--success-text)', fontWeight: 500, marginTop: 'var(--sp-1)' }}>
              Окупается одной записью на чистку
            </div>
            <FeatureList />
            <div style={{ flex: 1 }} />
            <CtaGlow full style={{ marginTop: 'var(--sp-6)' }}>
              <Button variant="primary" size="lg" full onClick={() => scrollToId('lead')}>
                Подключить клинику
              </Button>
            </CtaGlow>
          </div>
        </div>

        {/* Подписка */}
        <div
          className="lp-lift"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ padding: 'var(--sp-5) var(--sp-6)', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h4)', fontWeight: 700 }}>Подписка</span>
          </div>
          <div style={{ padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
              <span className="money-lg">
                {fmtRub(14900)}<span className="money-rub">₽</span>
              </span>
              <span style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)' }}>в месяц</span>
            </div>
            <div style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', marginTop: 'var(--sp-1)' }}>
              Отмена в любой месяц. Без договора на год.
            </div>
            <FeatureList />
            <div style={{ flex: 1 }} />
            <CtaGlow full style={{ marginTop: 'var(--sp-6)' }}>
              <Button variant="secondary" size="lg" full onClick={() => scrollToId('lead')}>
                Подключить клинику
              </Button>
            </CtaGlow>
          </div>
        </div>
      </div>

      <p style={{ margin: 'var(--sp-6) 0 0', fontSize: 'var(--fs-body-lg)', lineHeight: 1.5, color: 'var(--text)', textAlign: 'center', maxWidth: '60ch', marginInline: 'auto' }}>
        Подписка — только если пилот окупился. Не окупился — расстаёмся без обид.
      </p>
    </Section>
  );
}
