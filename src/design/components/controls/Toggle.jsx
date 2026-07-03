import React, { useState } from 'react';

/* Тумблер: трек 52×32, зона нажатия ≥44px. Вкл: винный (светлая) / золотой (тёмная) — токен --control-on. */

export function Toggle({ checked, defaultChecked = false, label, description, disabled = false, onChange, style }) {
  const [inner, setInner] = useState(defaultChecked);
  const isOn = checked !== undefined ? checked : inner;
  const flip = () => {
    if (disabled) return;
    if (checked === undefined) setInner(!isOn);
    if (onChange) onChange(!isOn);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      disabled={disabled}
      onClick={flip}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, minHeight: 44, padding: '6px 0',
        background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, textAlign: 'left', fontFamily: 'var(--font-body)', ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flex: 'none', width: 52, height: 32, borderRadius: 999, position: 'relative',
          background: isOn ? 'var(--control-on)' : 'var(--neutral-300)',
          transition: 'background var(--motion-base)',
        }}
      >
        <span
          style={{
            position: 'absolute', top: 3, left: isOn ? 23 : 3, width: 26, height: 26, borderRadius: 999,
            background: isOn ? 'var(--control-on-knob)' : '#FFFFFF',
            boxShadow: '0 1px 3px rgba(28,26,23,.25)',
            transition: 'left var(--motion-base), background var(--motion-base)',
          }}
        />
      </span>
      {(label || description) ? (
        <span>
          {label ? <span style={{ display: 'block', fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{label}</span> : null}
          {description ? <span style={{ display: 'block', fontSize: 16, color: 'var(--text-secondary)', marginTop: 2 }}>{description}</span> : null}
        </span>
      ) : null}
    </button>
  );
}
