import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../lib/api.js';
import { channelOf, badgeStatus } from '../lib/leads.js';
import { fmtPhone, fmtTime } from '../lib/format.js';
import { Icon } from '../../design/components/core/Icon.jsx';
import { Button } from '../../design/components/controls/Button.jsx';
import { StatusBadge } from '../../design/components/leads/StatusBadge.jsx';
import { EmptyState } from '../../design/components/feedback/EmptyState.jsx';
import { fmtRub } from '../../design/components/money/MoneyFigure.jsx';
import { useToast, ToastHost } from '../components/ToastHost.jsx';
import { playSuccess } from '../lib/sound.js';

/* Карточка пациента: шапка + ключевые факты, «Что сделала Анна» с полной перепиской,
   и действия. Для «на подтверждении» — крупное «Подтвердить запись». */

function Fact({ label, children, gold = false }) {
  return (
    <>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span
        className={gold ? 'tnum' : undefined}
        style={{
          textAlign: 'right', fontWeight: gold ? 700 : 600,
          color: gold ? 'var(--text-gold)' : 'var(--text)',
          fontFamily: gold ? 'var(--font-display)' : undefined,
          fontFeatureSettings: gold ? "'tnum' 1" : undefined,
          display: 'inline-flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6,
        }}
      >
        {children}
      </span>
    </>
  );
}

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [lead, setLead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | error | notfound
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [data, tr] = await Promise.all([
        api.get('/api/leads'),
        api.get(`/api/leads/${id}/transcript`).catch(() => ({ messages: [] })),
      ]);
      const found = (data.leads || []).find((l) => String(l.id) === String(id));
      if (!found) { setState('notfound'); return; }
      setLead(found);
      setMessages(Array.isArray(tr.messages) ? tr.messages : []);
      setState('ready');
    } catch (e) {
      if (e instanceof ApiError && e.kind === 'auth') return;
      setState('error');
    }
  }, [id]);

  useEffect(() => { setState('loading'); load(); }, [load]);

  const changeStatus = async (status, successTitle) => {
    if (busy) return;
    setBusy(true);
    try {
      await api.post(`/api/leads/${id}/status`, { status });
      if (status === 'booked') playSuccess(); // «динг» на событии записи (если включён)
      showToast({ variant: 'success', title: successTitle });
      await load();
    } catch (e) {
      if (!(e instanceof ApiError && e.kind === 'auth')) showToast({ variant: 'urgent', title: 'Что-то пошло не так, уже чиним' });
    } finally { setBusy(false); }
  };

  const confirmBooking = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await api.post(`/api/leads/${id}/confirm`);
      playSuccess(); // «динг» на подтверждении записи (если включён в настройках)
      showToast({ variant: 'success', title: 'Пациент записан' });
      await load();
    } catch (e) {
      if (!(e instanceof ApiError && e.kind === 'auth')) showToast({ variant: 'urgent', title: 'Что-то пошло не так, уже чиним' });
    } finally { setBusy(false); }
  };

  const back = (
    <button
      type="button"
      onClick={() => navigate(-1)}
      aria-label="Назад"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '8px 12px 8px 0',
        border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
        fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600,
      }}
    >
      <Icon name="return" size={22} color="var(--text)" />
      Назад
    </button>
  );

  if (state === 'loading') {
    return (<div>{back}<div style={{ padding: '32px 8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 16 }}>Загружаю карточку…</div></div>);
  }
  if (state === 'notfound') {
    return (<div>{back}<EmptyState compact title="Обращение не найдено" text="Возможно, карточку уже перенесли. Вернитесь к ленте." /></div>);
  }
  if (state === 'error') {
    return (<div>{back}<EmptyState title="Что-то пошло не так, уже чиним" text="Обновите через минуту." actionLabel="Обновить" actionIcon="return" onAction={() => { setState('loading'); load(); }} /></div>);
  }

  const ch = channelOf(lead.source);
  const isUrgent = !!lead.is_urgent;

  const flags = [];
  if (lead.is_night) flags.push('ночное обращение');
  if (lead.is_repeat) flags.push('повторное обращение');
  if (lead.recovered_from_miss) flags.push('после пропущенного звонка');
  if (lead.wants_human) flags.push('просит живого администратора');
  if (lead.wants_callback) flags.push('просит перезвонить');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {back}

      <section
        style={{
          position: 'relative', overflow: 'hidden',
          background: 'var(--surface)', borderRadius: 'var(--r-card)',
          border: `1.5px solid ${isUrgent ? 'var(--urgent)' : 'var(--border)'}`,
          boxShadow: isUrgent ? 'var(--shadow-urgent)' : 'var(--shadow-card)',
          padding: '18px 16px 18px 20px',
        }}
      >
        <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: isUrgent ? 'var(--urgent)' : 'var(--border-strong)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, lineHeight: 1.25 }}>{lead.name || 'Без имени'}</div>
            <a
              href={`tel:${String(lead.phone || '').replace(/[^\d+]/g, '')}`}
              className="tnum"
              style={{ display: 'inline-block', fontSize: 16, color: 'var(--text-secondary)', marginTop: 2, fontFeatureSettings: "'tnum' 1", textDecoration: 'none' }}
            >
              {fmtPhone(lead.phone)}
            </a>
          </div>
          {isUrgent ? <StatusBadge status="urgent" solid label="Срочно" /> : <StatusBadge status={badgeStatus(lead)} />}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginTop: 16, fontSize: 16 }}>
          <Fact label="Обращение">{lead.service || '—'}</Fact>
          <Fact label="Канал"><Icon name={ch.icon} size={18} />{ch.label}</Fact>
          {lead.preferred_time ? <Fact label="Удобное время">{lead.preferred_time}</Fact> : null}
          {lead.sum_rub ? <Fact label="Ожидаемый чек" gold>{fmtRub(lead.sum_rub)}&nbsp;₽</Fact> : null}
        </div>

        {flags.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {flags.map((f, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', minHeight: 28, borderRadius: 'var(--r-badge)', background: 'var(--surface-subtle)', color: 'var(--text-secondary)', fontSize: 16 }}>
                {f}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {/* Действия */}
      <section style={{ display: 'grid', gap: 8 }}>
        {lead.status === 'pending' ? (
          <Button variant="primary" size="lg" icon="check" full disabled={busy} onClick={confirmBooking}>Подтвердить запись</Button>
        ) : null}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="md" icon="check" disabled={busy || lead.status === 'booked'} onClick={() => changeStatus('booked', 'Пациент записан')}>Записан</Button>
          <Button variant="secondary" size="md" icon="call" disabled={busy || lead.status === 'dialog'} onClick={() => changeStatus('dialog', 'Отметила: перезвонить')}>Перезвонить</Button>
          <Button variant="ghost" size="md" disabled={busy || lead.status === 'lost'} onClick={() => changeStatus('lost', 'Отметили как потерян')} style={{ color: 'var(--text-secondary)' }}>Потерян</Button>
        </div>
      </section>

      {/* Что сделала Анна */}
      <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-card)', padding: '16px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Что сделала Анна</div>
        {messages.length === 0 ? (
          <div style={{ marginTop: 12, fontSize: 16, color: 'var(--text-secondary)' }}>Переписка появится, когда Анна начнёт диалог с пациентом.</div>
        ) : (
          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            {messages.map((m, i) => {
              const anna = m.role === 'assistant';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: anna ? 'flex-start' : 'flex-end' }}>
                  <div
                    style={{
                      maxWidth: '86%', padding: '10px 12px', borderRadius: 'var(--r-card-sm)', fontSize: 16, lineHeight: 1.4,
                      background: anna ? 'var(--surface-subtle)' : 'var(--st-dialog-tint)',
                      color: 'var(--text)',
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>
                      {anna ? 'Анна' : 'Пациент'}
                      {m.created_at ? <span className="tnum" style={{ fontWeight: 400, marginLeft: 8, fontFeatureSettings: "'tnum' 1" }}>{fmtTime(m.created_at)}</span> : null}
                    </div>
                    {m.content}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ToastHost toast={toast} />
    </div>
  );
}
