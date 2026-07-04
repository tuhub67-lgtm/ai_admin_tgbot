import React from 'react';
import { Button } from '../../design/components/controls/Button.jsx';
import { Icon } from '../../design/components/core/Icon.jsx';
import { MoneyFigure } from '../../design/components/money/MoneyFigure.jsx';
import { OrnamentSolar } from '../../design/components/core/BearMark.jsx';
import { CtaGlow } from '../common/CtaGlow.jsx';
import { scrollToId } from './Section.jsx';
import { CITY } from '../../config.js';

// Атмосфера героя: тёплое золотое сияние справа-сверху + едва заметный винный слева,
// поверх слоновой кости. Только CSS-градиенты из токенов, текст остаётся тёмным по светлому.
const HERO_ATMOSPHERE = {
  background:
    'radial-gradient(90% 65% at 80% -10%, color-mix(in srgb, var(--gold-300) 30%, transparent), transparent 58%),' +
    ' radial-gradient(70% 55% at 4% 6%, color-mix(in srgb, var(--wine-800) 9%, transparent), transparent 55%),' +
    ' var(--bg)',
  position: 'relative',
  overflow: 'hidden',
};

const chips = [
  { icon: 'shield', text: '152-ФЗ' },
  { icon: 'server', text: 'Данные — в России' },
  { icon: 'clock', text: 'Ответ за 30 секунд' },
];

export function Hero() {
  return (
    <section style={HERO_ATMOSPHERE}>
      {/* Солнечный орнамент — едва заметная фактура в пустом углу (декор, currentColor) */}
      <OrnamentSolar
        aria-hidden="true"
        size={440}
        style={{ position: 'absolute', top: -80, right: -90, color: 'var(--gold-500)', opacity: 0.06, pointerEvents: 'none', zIndex: 0 }}
      />
      <div className="lp-container lp-section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="lp-hero-grid">
          {/* Левая колонка — оффер */}
          <div className="lp-hero-in">
            <p className="lp-overline" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)', color: 'var(--wine-800)' }}>
              <span className="lp-gold-metal" aria-hidden="true" style={{ width: 20, height: 4, borderRadius: 'var(--r-pill)' }} />
              ИИ-администратор для стоматологии · {CITY}
            </p>

            <h1 className="lp-h1">
              Клиника теряет 100–150 тыс. ₽ в месяц на пропущенных звонках.
              Подхват AI+ возвращает этих пациентов.
            </h1>

            <p className="lp-lead">
              ИИ-администратор отвечает за 30 секунд — в MAX, SMS и Telegram, круглосуточно.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-3)', marginTop: 'var(--sp-6)' }}>
              <CtaGlow>
                <Button variant="primary" size="lg" onClick={() => scrollToId('lead')}>Подключить клинику</Button>
              </CtaGlow>
              <CtaGlow>
                <Button variant="secondary" size="lg" icon="ruble" onClick={() => scrollToId('calc')}>Посчитать мои потери</Button>
              </CtaGlow>
            </div>

            <button
              type="button"
              onClick={() => scrollToId('rustore')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)',
                minHeight: 'var(--hit-min)',
                background: 'none', border: 'none', padding: '8px 0', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: 'var(--fs-body)', fontFamily: 'var(--font-body)',
              }}
            >
              Скоро — приложение в RuStore
              <Icon name="return" size={18} style={{ transform: 'scaleX(-1)' }} />
            </button>

            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-4)', listStyle: 'none', padding: 0, margin: 'var(--sp-6) 0 0', color: 'var(--text-secondary)', fontSize: 'var(--fs-body)' }}>
              {chips.map((c) => (
                <li key={c.text} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <Icon name={c.icon} size={18} color="var(--success-text)" />{c.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Правая колонка — доказательство (белая карточка, фацет) */}
          <aside
            className="facet-card lp-hero-in lp-hero-in--delay"
            style={{
              background: 'var(--surface)', boxShadow: 'var(--shadow-raised)',
              borderRadius: 'var(--r-card)', padding: 'var(--sp-6)', minWidth: 0,
            }}
          >
            <MoneyFigure label="Возвращено за неделю" value={47200} size="lg" color="gold" animate />
            <div style={{ borderTop: '1px solid var(--border)', margin: 'var(--sp-5) 0', height: 0 }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)' }}>
              <span
                aria-hidden="true"
                style={{ display: 'inline-flex', flex: 'none', width: 40, height: 40, alignItems: 'center', justifyContent: 'center', background: 'var(--surface-brand)', color: 'var(--gold-300)', borderRadius: 'var(--r-badge)' }}
              >
                <Icon name="max" size={22} />
              </span>
              <div>
                <p style={{ margin: 0, fontSize: 'var(--fs-body)', lineHeight: 1.5, color: 'var(--text)' }}>
                  «Марина не дозвонилась в 14:02. Я написала ей в MAX — записала на чистку, четверг 16:00.»
                </p>
                <p style={{ margin: 'var(--sp-2) 0 0', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)' }}>
                  — Анна, ваш ИИ-администратор
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
