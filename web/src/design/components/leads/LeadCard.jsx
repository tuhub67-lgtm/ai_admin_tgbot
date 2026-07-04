import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { Button } from '../controls/Button.jsx';
import { StatusBadge } from './StatusBadge.jsx';

/* Карточка лида — главный компонент системы.
   Имя, телефон, услуга, время, канал, статус, действия.
   Вариант «СРОЧНО — острая боль»: фацетный маркер, тревожная рамка, тёплая тень. */

const CHANNEL = {
  call: { icon: 'call', label: 'Звонок' },
  max: { icon: 'max', label: 'MAX' },
  telegram: { icon: 'telegram', label: 'Telegram' },
  sms: { icon: 'sms', label: 'SMS' },
};

function fmtRub(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

export function LeadCard({
  name, phone, service, time, source = 'call', status = 'new',
  sum, note, urgentText = 'Срочно — острая боль',
  onBook, onCall, onLost, actions = true, style,
}) {
  const isUrgent = status === 'urgent';
  const ch = CHANNEL[source] || CHANNEL.call;

  return (
    <article
      style={{
        position: 'relative', background: 'var(--surface)',
        border: `1.5px solid ${isUrgent ? 'var(--urgent)' : 'var(--border)'}`,
        borderRadius: 'var(--r-card)', padding: '16px 16px 16px 20px',
        boxShadow: isUrgent ? 'var(--shadow-urgent)' : 'var(--shadow-card)',
        fontFamily: 'var(--font-body)', color: 'var(--text)', overflow: 'hidden', ...style,
      }}
    >
      {/* Акцентная планка 4px — вторая толщина линии */}
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: isUrgent ? 'var(--urgent)' : status === 'booked' ? 'var(--success)' : 'var(--border-strong)' }} />

      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>{name}</div>
          <div className="tnum" style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 2, fontFeatureSettings: "'tnum' 1" }}>{phone}</div>
        </div>
        {isUrgent
          ? <StatusBadge status="urgent" solid label={urgentText} />
          : <StatusBadge status={status} />}
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 20px', marginTop: 12, fontSize: 16 }}>
        <span style={{ fontWeight: 500 }}>{service}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
          <Icon name="clock" size={18} />{time}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
          <Icon name={ch.icon} size={18} />{ch.label}
        </span>
        {sum ? (
          <span className="tnum" style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-gold)', fontFeatureSettings: "'tnum' 1" }}>
            {fmtRub(sum)}&nbsp;₽
          </span>
        ) : null}
      </div>

      {note ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, padding: '10px 12px', background: 'var(--surface-subtle)', borderRadius: 'var(--r-card-sm)', fontSize: 16, color: 'var(--text-secondary)' }}>
          <Icon name="dialog" size={18} style={{ marginTop: 2 }} />
          <span><strong style={{ color: 'var(--text)', fontWeight: 600 }}>Анна:</strong> {note}</span>
        </div>
      ) : null}

      {actions ? (
        <footer style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {status !== 'booked' && status !== 'lost' ? (
            <>
              {isUrgent
                ? <Button variant="danger" size="sm" icon="call" onClick={onCall}>Перезвонить сейчас</Button>
                : <Button variant="primary" size="sm" icon="check" onClick={onBook}>Записан ✓</Button>}
              {isUrgent
                ? <Button variant="secondary" size="sm" icon="check" onClick={onBook}>Записан ✓</Button>
                : <Button variant="secondary" size="sm" icon="call" onClick={onCall}>Перезвонить</Button>}
              <Button variant="ghost" size="sm" onClick={onLost} style={{ color: 'var(--text-secondary)' }}>Потерян</Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" icon="report" onClick={onCall}>Подробности</Button>
          )}
        </footer>
      ) : null}
    </article>
  );
}
