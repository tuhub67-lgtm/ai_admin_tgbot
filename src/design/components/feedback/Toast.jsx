import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Тост: карточка на var(--surface) с акцентной планкой 4px (вторая толщина линии).
   Работает в обеих темах без условий. Голос Анны: коротко, тепло, без «Ошибка 500». */

const VARIANTS = {
  success: { bar: 'var(--success)', icon: 'check', iconColor: 'var(--success-text)' },
  info:    { bar: 'var(--info)', icon: 'dialog', iconColor: 'var(--info-text)' },
  urgent:  { bar: 'var(--urgent)', icon: 'urgent', iconColor: 'var(--urgent-text)' },
  money:   { bar: 'var(--gold-500)', icon: 'ruble', iconColor: 'var(--text-gold)' },
};

export function Toast({ variant = 'success', title, text, actionLabel, onAction, style }) {
  const v = VARIANTS[variant] || VARIANTS.success;
  return (
    <div
      role="status"
      style={{
        position: 'relative', display: 'flex', gap: 12, alignItems: 'flex-start',
        maxWidth: 420, padding: '14px 16px 14px 20px', overflow: 'hidden',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-card-sm)', boxShadow: 'var(--shadow-raised)',
        fontFamily: 'var(--font-body)', color: 'var(--text)', ...style,
      }}
    >
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: v.bar }} />
      <Icon name={v.icon} size={22} color={v.iconColor} style={{ marginTop: 1 }} />
      <div style={{ minWidth: 0 }}>
        {title ? <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.35 }}>{title}</div> : null}
        {text ? <div style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: title ? 2 : 0 }}>{text}</div> : null}
        {actionLabel ? (
          <button type="button" onClick={onAction} style={{ margin: '8px 0 0', padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, color: 'var(--text-gold)' }}>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
