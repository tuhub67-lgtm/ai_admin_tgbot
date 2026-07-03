import React, { useState } from 'react';
import { Icon } from '../core/Icon.jsx';

/* Поле ввода: 48px, кегль 16, радиус 10. Состояния: default / focus / error / disabled. */

export function Input({ label, placeholder, value, defaultValue, hint, error, icon, disabled = false, suffix, type = 'text', onChange, forceFocus = false, style }) {
  const [focus, setFocus] = useState(false);
  const focused = forceFocus || focus;
  const borderColor = error ? 'var(--urgent)' : focused ? 'var(--focus-ring)' : 'var(--border-strong)';

  return (
    <label style={{ display: 'block', fontFamily: 'var(--font-body)', ...style }}>
      {label ? (
        <span style={{ display: 'block', fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{label}</span>
      ) : null}
      <span
        style={{
          display: 'flex', alignItems: 'center', gap: 10, height: 48, padding: '0 14px',
          background: disabled ? 'var(--surface-subtle)' : 'var(--surface)',
          border: `1.5px solid ${disabled ? 'var(--border)' : borderColor}`,
          borderRadius: 'var(--r-input)',
          boxShadow: focused && !error ? '0 0 0 3px color-mix(in srgb, var(--focus-ring) 22%, transparent)' : 'none',
          transition: 'border-color var(--motion-fast), box-shadow var(--motion-fast)',
        }}
      >
        {icon ? <Icon name={icon} size={20} color={disabled ? 'var(--text-disabled)' : 'var(--text-secondary)'} /> : null}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={onChange}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'var(--font-body)', fontSize: 16, color: disabled ? 'var(--text-disabled)' : 'var(--text)',
            fontFeatureSettings: type === 'tel' || type === 'number' ? "'tnum' 1" : undefined,
          }}
        />
        {suffix ? <span style={{ fontSize: 16, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{suffix}</span> : null}
      </span>
      {(error || hint) ? (
        <span style={{ display: 'block', fontSize: 16, marginTop: 6, color: error ? 'var(--urgent-text)' : 'var(--text-secondary)' }}>
          {error || hint}
        </span>
      ) : null}
    </label>
  );
}
