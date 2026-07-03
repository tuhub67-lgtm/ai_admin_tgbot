import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api.js';
import { badgeStatus } from '../lib/leads.js';
import { fmtPhone, fmtWhen } from '../lib/format.js';
import { LeadCard } from '../../design/components/leads/LeadCard.jsx';
import { EmptyState } from '../../design/components/feedback/EmptyState.jsx';
import { Icon } from '../../design/components/core/Icon.jsx';
import { fmtRub } from '../../design/components/money/MoneyFigure.jsx';

/* «Сегодня» — лента обращений. Срочные закреплены сверху с красным маркером.
   Чипы-фильтры по статусу. Тап по карточке открывает карточку пациента. */

const FILTERS = [
  { key: 'all', label: 'Все', match: () => true },
  { key: 'urgent', label: 'Срочно', match: (l) => l.is_urgent },
  { key: 'new', label: 'Новые', match: (l) => l.status === 'new' },
  { key: 'dialog', label: 'В диалоге', match: (l) => l.status === 'dialog' },
  { key: 'pending', label: 'На подтверждении', match: (l) => l.status === 'pending' },
  { key: 'booked', label: 'Записаны', match: (l) => l.status === 'booked' },
];

function Chip({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tnum"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '10px 14px',
        borderRadius: 'var(--r-btn)', fontFamily: 'var(--font-body)', fontSize: 16,
        fontWeight: active ? 600 : 500, whiteSpace: 'nowrap', cursor: 'pointer',
        background: active ? 'var(--control-on)' : 'transparent',
        color: active ? 'var(--control-on-knob)' : 'var(--text-secondary)',
        border: active ? '1.5px solid transparent' : '1.5px solid var(--border-strong)',
        fontFeatureSettings: "'tnum' 1",
      }}
    >
      {label} · {count}
    </button>
  );
}

export default function Today() {
  const [leads, setLeads] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | error
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const data = await api.get('/api/leads');
      setLeads(Array.isArray(data.leads) ? data.leads : []);
      setState('ready');
    } catch (e) {
      if (e instanceof ApiError && e.kind === 'auth') return; // редирект на вход уже идёт
      setState('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sorted = useMemo(() => {
    return [...leads].sort((a, b) => {
      if (!!a.is_urgent !== !!b.is_urgent) return a.is_urgent ? -1 : 1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [leads]);

  const counts = useMemo(() => {
    const c = {};
    for (const f of FILTERS) c[f.key] = leads.filter(f.match).length;
    return c;
  }, [leads]);

  const active = FILTERS.find((f) => f.key === filter) || FILTERS[0];
  const visible = sorted.filter(active.match);

  const total = leads.length;
  const recovered = leads
    .filter((l) => l.status === 'booked')
    .reduce((s, l) => s + (Number(l.sum_rub) || 0), 0);

  if (state === 'loading') {
    return <div style={{ padding: '32px 8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 16 }}>Загружаю обращения…</div>;
  }

  if (state === 'error') {
    return (
      <EmptyState
        title="Что-то пошло не так, уже чиним"
        text="Обновите через минуту — обращения вернутся."
        actionLabel="Обновить"
        actionIcon="return"
        onAction={load}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {total > 0 ? (
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-card-sm)',
            padding: '12px 16px', boxShadow: 'var(--shadow-card)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
            <Icon name="check" size={18} color="var(--success-text)" />
            Подхвачено&nbsp;<strong>{total}</strong>
          </span>
          {recovered > 0 ? (
            <span
              className="tnum"
              style={{
                fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
                color: 'var(--text-gold)', fontFeatureSettings: "'tnum' 1", whiteSpace: 'nowrap',
              }}
            >
              возвращено {fmtRub(recovered)}&nbsp;₽
            </span>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {FILTERS.filter((f) => f.key === 'all' || counts[f.key] > 0).map((f) => (
          <Chip key={f.key} label={f.label} count={counts[f.key]} active={filter === f.key} onClick={() => setFilter(f.key)} />
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          compact
          title="Пока тихо. Все звонки подхвачены."
          text="Как только появится новое обращение — покажем его здесь."
        />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {visible.map((l) => {
            const isBooked = l.status === 'booked';
            const service = isBooked && l.preferred_time ? `${l.service} · ${l.preferred_time}` : l.service;
            return (
              <Link key={l.id} to={`/app/lead/${l.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <LeadCard
                  status={badgeStatus(l)}
                  name={l.name || 'Без имени'}
                  phone={fmtPhone(l.phone)}
                  service={service}
                  time={fmtWhen(l.created_at)}
                  source={l.source}
                  sum={isBooked && l.sum_rub ? l.sum_rub : undefined}
                  note={l.note}
                  urgentText="Срочно"
                  actions={false}
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
