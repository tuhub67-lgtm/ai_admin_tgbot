import React from 'react';
import { Icon } from '../../design/components/core/Icon.jsx';
import { Section } from './Section.jsx';

const steps = [
  {
    icon: 'call-missed',
    title: 'Пропущенный звонок',
    text: 'Пациент не дозвонился — раньше это был потерянный пациент. Теперь Анна видит пропущенный за секунды.',
  },
  {
    icon: 'booking',
    title: 'Анна пишет за 30 секунд',
    text: 'В MAX, Telegram или SMS: отвечает, подбирает удобное время и доводит до записи. Круглосуточно.',
  },
  {
    icon: 'ruble',
    title: 'Карточка и отчёт в рублях',
    text: 'Вам приходит карточка пациента, а в конце недели — отчёт: сколько пациентов и рублей вернули.',
  },
];

export function HowItWorks() {
  return (
    <Section id="how" bg="var(--surface-subtle)">
      <p className="lp-overline">Как работает</p>
      <h2 className="lp-h2">Три шага — и пропущенный звонок снова пациент</h2>

      <ol className="lp-grid-3" style={{ listStyle: 'none', padding: 0, margin: 'var(--sp-8) 0 0' }}>
        {steps.map((s, i) => (
          <li
            key={s.title}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-card)', padding: 'var(--sp-6)', boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <span
                aria-hidden="true"
                style={{ display: 'inline-flex', flex: 'none', width: 48, height: 48, alignItems: 'center', justifyContent: 'center', background: 'var(--surface-brand)', color: 'var(--gold-300)', borderRadius: 'var(--r-card-sm)' }}
              >
                <Icon name={s.icon} size={24} />
              </span>
              <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {i + 1}
              </span>
            </div>
            <h3 className="h4" style={{ marginTop: 'var(--sp-4)' }}>{s.title}</h3>
            <p style={{ margin: 'var(--sp-2) 0 0', fontSize: 'var(--fs-body)', lineHeight: 1.5, color: 'var(--text-secondary)' }}>{s.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
