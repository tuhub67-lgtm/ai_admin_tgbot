import React from 'react';

/* Статус лида: каждому — цвет И форма (различимо без цвета).
   новый ◆ / в диалоге ··· / записан ✓ / срочно — фацетный маркер / потерян × */

const M = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'square', strokeLinejoin: 'miter' };

const SHAPES = {
  new:    <svg viewBox="0 0 12 12" width="12" height="12" {...M}><polygon points="6,1.5 10.5,6 6,10.5 1.5,6" /></svg>,
  dialog: <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor"><rect x="0.6" y="4.8" width="2.4" height="2.4" /><rect x="4.8" y="4.8" width="2.4" height="2.4" /><rect x="9" y="4.8" width="2.4" height="2.4" /></svg>,
  booked: <svg viewBox="0 0 12 12" width="12" height="12" {...M}><path d="M2 6.4l2.6 2.6L10 3.4" /></svg>,
  urgent: <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor"><path d="M1.5 1.5h6l3 3v6h-9z" /></svg>,
  lost:   <svg viewBox="0 0 12 12" width="12" height="12" {...M}><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" /></svg>,
};

export const STATUS_META = {
  new:    { label: 'Новый' },
  dialog: { label: 'В диалоге' },
  booked: { label: 'Записан' },
  urgent: { label: 'Срочно' },
  lost:   { label: 'Потерян' },
};

export function StatusBadge({ status = 'new', label, solid = false, style }) {
  const meta = STATUS_META[status] || STATUS_META.new;
  const isUrgent = status === 'urgent';
  const bg = solid ? 'var(--urgent)' : `var(--st-${status}-tint)`;
  const color = solid ? '#FFFFFF' : `var(--st-${status}-text)`;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '4px 12px', minHeight: 28, boxSizing: 'border-box',
        background: bg, color,
        borderRadius: isUrgent ? 0 : 'var(--r-badge)',
        clipPath: isUrgent ? 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' : undefined,
        fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, lineHeight: 1.25,
        whiteSpace: 'nowrap', ...style,
      }}
    >
      {SHAPES[status] || SHAPES.new}
      {label || meta.label}
    </span>
  );
}
