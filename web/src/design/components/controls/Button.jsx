import React, { useState } from 'react';
import { Icon } from '../core/Icon.jsx';

/* Кнопка: 3 размера × 4 состояния. Радиус 10, зона нажатия ≥44px.
   primary = золотой CTA; brand = винный; secondary = контурная; ghost; danger. */

const SIZES = {
  sm: { height: 40, padding: '0 16px', fontSize: 16, icon: 18 },
  md: { height: 48, padding: '0 20px', fontSize: 16, icon: 20 },
  lg: { height: 56, padding: '0 28px', fontSize: 18, icon: 22 },
};

const VARIANTS = {
  primary:   { bg: 'var(--cta-surface)', color: 'var(--cta-text)', hoverBg: 'var(--cta-surface-hover)', border: 'none' },
  brand:     { bg: 'var(--surface-brand)', color: 'var(--text-on-brand)', hoverBg: 'var(--surface-brand-hover)', border: 'none' },
  secondary: { bg: 'transparent', color: 'var(--text)', hoverBg: 'color-mix(in srgb, var(--text) 7%, transparent)', border: '1.5px solid var(--border-strong)' },
  ghost:     { bg: 'transparent', color: 'var(--text-gold)', hoverBg: 'color-mix(in srgb, currentColor 9%, transparent)', border: 'none' },
  danger:    { bg: 'var(--urgent)', color: '#FFFFFF', hoverBg: 'color-mix(in srgb, var(--urgent) 88%, #000)', border: 'none' },
};

export function Button({ children, variant = 'primary', size = 'md', icon, disabled = false, full = false, forceState, onClick, style }) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const st = forceState || (disabled ? 'disabled' : press ? 'pressed' : hover ? 'hover' : 'default');

  const filled = variant === 'primary' || variant === 'brand' || variant === 'danger';
  let bg = v.bg, color = v.color, filter = 'none';
  if (st === 'hover') bg = v.hoverBg;
  if (st === 'pressed') { bg = v.hoverBg; filter = 'brightness(.93)'; }
  if (st === 'disabled') {
    bg = filled ? 'var(--neutral-200)' : 'transparent';
    color = 'var(--text-disabled)';
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: s.height, padding: s.padding, width: full ? '100%' : undefined,
        fontFamily: 'var(--font-body)', fontSize: s.fontSize, fontWeight: 600, lineHeight: 1,
        background: bg, color, border: st === 'disabled' && v.border !== 'none' ? '1.5px solid var(--border)' : v.border,
        borderRadius: 'var(--r-btn)', cursor: st === 'disabled' ? 'not-allowed' : 'pointer',
        transition: 'background var(--motion-fast), filter var(--motion-fast)', filter,
        userSelect: 'none', whiteSpace: 'nowrap', ...style,
      }}
    >
      {icon ? <Icon name={icon} size={s.icon} /> : null}
      {children}
    </button>
  );
}
