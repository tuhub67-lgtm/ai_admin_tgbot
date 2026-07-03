import React, { useId } from 'react';
import { Icon } from '../../design/components/core/Icon.jsx';

/* Чекбокс согласия на обработку ПДн. В дизайн-системе чекбокса нет
   (Toggle — это switch, семантически неверно для согласия), поэтому — доступный
   нативный input, стилизованный ТОЛЬКО токенами. Зона нажатия ≥44px. */
export function ConsentCheckbox({ checked, onChange, error, children, name = 'consent' }) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)',
          cursor: 'pointer', fontSize: 'var(--fs-body)', lineHeight: 1.45,
          color: 'var(--text-secondary)', minHeight: 'var(--hit-min)',
        }}
      >
        <span style={{ position: 'relative', flex: 'none', width: 24, height: 24, marginTop: 1 }}>
          <input
            id={id}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            aria-invalid={error ? 'true' : undefined}
            style={{
              position: 'absolute', width: 24, height: 24, margin: 0, opacity: 0, cursor: 'pointer',
            }}
          />
          <span
            aria-hidden="true"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 24, height: 24, borderRadius: 6,
              border: `1.5px solid ${error && !checked ? 'var(--urgent)' : checked ? 'var(--control-on)' : 'var(--border-strong)'}`,
              background: checked ? 'var(--control-on)' : 'var(--surface)',
              transition: 'background var(--motion-fast), border-color var(--motion-fast)',
            }}
          >
            {checked ? <Icon name="check" size={16} color="var(--control-on-knob)" /> : null}
          </span>
        </span>
        <span>{children}</span>
      </label>
      {error ? (
        <div style={{ fontSize: 'var(--fs-body)', color: 'var(--urgent-text)', marginTop: 'var(--sp-2)', paddingLeft: 'calc(24px + var(--sp-3))' }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}
