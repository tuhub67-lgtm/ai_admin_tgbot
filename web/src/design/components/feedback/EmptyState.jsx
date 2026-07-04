import React from 'react';
import { BearMark, OrnamentSolar } from '../core/BearMark.jsx';
import { Button } from '../controls/Button.jsx';

/* Пустое состояние: медведь линией + солярный орнамент 5% (единственное место орнамента в приложении).
   Тон покоя: пусто = хорошо, всё подхвачено. */

export function EmptyState({
  title = 'Пока тихо. Все звонки подхвачены.',
  text,
  actionLabel, actionIcon, onAction,
  compact = false, style,
}) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: compact ? '32px 24px' : '56px 24px', overflow: 'hidden', fontFamily: 'var(--font-body)', color: 'var(--text)', ...style }}>
      <div aria-hidden="true" style={{ position: 'relative', width: compact ? 148 : 196, height: compact ? 148 : 196, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <OrnamentSolar size={compact ? 148 : 196} style={{ position: 'absolute', inset: 0, color: 'var(--text)', opacity: .05 }} />
        <BearMark size={compact ? 64 : 84} strokeWidth={3} style={{ color: 'var(--border-strong)' }} />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: compact ? 20 : 24, fontWeight: 600, lineHeight: 1.3, maxWidth: 360 }}>{title}</div>
      {text ? <div style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 8, maxWidth: 360 }}>{text}</div> : null}
      {actionLabel ? <Button variant="secondary" size="md" icon={actionIcon} onClick={onAction} style={{ marginTop: 20 }}>{actionLabel}</Button> : null}
    </div>
  );
}
