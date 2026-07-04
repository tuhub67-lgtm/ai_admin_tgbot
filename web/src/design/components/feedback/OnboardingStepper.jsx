import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Степпер онбординга — 4 шага. Пройден: винный квадрат с галочкой.
   Текущий: золотой фацетный маркер (грань медвежьей морды). Впереди: контур. */

export const DEFAULT_STEPS = ['Номер клиники', 'Каналы', 'Голос Анны', 'Готово'];

export function OnboardingStepper({ steps = DEFAULT_STEPS, current = 0, compact = false, style }) {
  return (
    <div style={{ fontFamily: 'var(--font-body)', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {steps.map((label, i) => {
          const done = i < current, cur = i === current;
          return (
            <React.Fragment key={i}>
              {i > 0 ? <span aria-hidden="true" style={{ flex: 1, height: done || cur ? 2 : 1.5, background: done || cur ? 'var(--wine-800)' : 'var(--border-strong)', minWidth: 12 }} /> : null}
              <span
                aria-current={cur ? 'step' : undefined}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, flex: 'none', boxSizing: 'border-box',
                  fontSize: 16, fontWeight: 600,
                  background: done ? 'var(--wine-800)' : cur ? 'var(--gold-400)' : 'transparent',
                  color: done ? 'var(--ivory)' : cur ? '#1C1A17' : 'var(--text-secondary)',
                  border: done || cur ? 'none' : '1.5px solid var(--border-strong)',
                  borderRadius: cur ? 0 : 8,
                  clipPath: cur ? 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' : undefined,
                }}
              >
                {done ? <Icon name="check" size={16} /> : i + 1}
              </span>
            </React.Fragment>
          );
        })}
      </div>
      {!compact ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
          {steps.map((label, i) => (
            <span key={i} style={{ flex: 1, fontSize: 16, lineHeight: 1.3, textAlign: i === 0 ? 'left' : i === steps.length - 1 ? 'right' : 'center', color: i === current ? 'var(--text)' : 'var(--text-secondary)', fontWeight: i === current ? 600 : 400 }}>
              {label}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 8, fontSize: 16, color: 'var(--text-secondary)' }}>
          Шаг {current + 1} из {steps.length} — <span style={{ color: 'var(--text)', fontWeight: 600 }}>{steps[current]}</span>
        </div>
      )}
    </div>
  );
}
