import { useEffect, useMemo, useState } from 'react';
import { LeadCard } from '../design/components/leads/LeadCard.jsx';
import { EmptyState } from '../design/components/feedback/EmptyState.jsx';
import { Button } from '../design/components/controls/Button.jsx';
import { Icon } from '../design/components/core/Icon.jsx';
import { BearMark } from '../design/components/core/BearMark.jsx';
import { Reveal } from '../lib/anim.jsx';
import { api } from './lib/api.js';
import { useToasts, ToastStack } from './lib/toast.jsx';

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'urgent', label: 'Срочные' },
  { key: 'pending', label: 'Ждут подтверждения' },
  { key: 'booked', label: 'Записаны' },
];

function matchesFilter(lead, key) {
  if (key === 'urgent') return lead.is_urgent;
  if (key === 'pending') return lead.status === 'pending';
  if (key === 'booked') return lead.status === 'booked' || lead.status === 'confirmed';
  return true;
}

/* Статус бэкенда → статус карточки дизайн-пака (new|dialog|booked|urgent|lost). */
function cardStatus(lead) {
  if (lead.is_urgent) return 'urgent';
  switch (lead.status) {
    case 'booked':
    case 'confirmed': return 'booked';
    case 'lost': return 'lost';
    case 'pending':
    case 'callback': return 'dialog';
    default: return 'new';
  }
}

const CHANNELS = new Set(['call', 'max', 'telegram', 'sms']);
function leadTime(lead) {
  return lead.slot || lead.preferred_time || 'время уточняется';
}

export default function Today() {
  const [leads, setLeads] = useState(null); // null = загрузка
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [transcripts, setTranscripts] = useState({}); // id → messages | 'loading'
  const [error, setError] = useState(false);
  const { toasts, toast, dismiss } = useToasts();

  useEffect(() => {
    let alive = true;
    api.leads()
      .then((res) => { if (alive) setLeads(res.leads || []); })
      .catch(() => { if (alive) { setError(true); setLeads([]); } });
    return () => { alive = false; };
  }, []);

  const counts = useMemo(() => {
    const src = leads || [];
    return FILTERS.reduce((acc, f) => {
      acc[f.key] = f.key === 'all' ? src.length : src.filter((l) => matchesFilter(l, f.key)).length;
      return acc;
    }, {});
  }, [leads]);

  const visible = useMemo(() => {
    const src = (leads || []).filter((l) => matchesFilter(l, filter));
    // Срочные — всегда сверху, затем по времени создания (свежие выше).
    return [...src].sort((a, b) => {
      if (a.is_urgent !== b.is_urgent) return a.is_urgent ? -1 : 1;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  }, [leads, filter]);

  function patchLead(id, patch) {
    setLeads((list) => (list || []).map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  async function runAction(lead, kind) {
    const prev = { status: lead.status, is_urgent: lead.is_urgent, slot: lead.slot };
    const done = {
      confirm: { patch: { status: 'confirmed', is_urgent: false }, toast: { variant: 'success', title: 'Запись подтверждена', text: `${lead.name} — ${leadTime(lead)}` }, call: () => api.confirm(lead.id) },
      book: { patch: { status: 'booked', is_urgent: false }, toast: { variant: 'success', title: 'Пациент записан', text: lead.name }, call: () => api.setStatus(lead.id, 'booked') },
      call: { patch: { status: 'callback' }, toast: { variant: 'info', title: 'Передали на звонок', text: `Перезвоните ${lead.name}` }, call: () => api.setStatus(lead.id, 'callback') },
      lost: { patch: { status: 'lost', is_urgent: false }, toast: { variant: 'urgent', title: 'Отметили потерянным', text: 'Можно вернуть офером позже' }, call: () => api.setStatus(lead.id, 'lost') },
    }[kind];
    if (!done) return;
    patchLead(lead.id, done.patch); // оптимистично
    toast(done.toast);
    try {
      await done.call();
    } catch {
      patchLead(lead.id, prev); // откат
      toast({ variant: 'urgent', title: 'Не удалось сохранить', text: 'Попробуйте ещё раз' });
    }
  }

  function toggleTranscript(lead) {
    const next = expanded === lead.id ? null : lead.id;
    setExpanded(next);
    if (next && transcripts[lead.id] === undefined) {
      setTranscripts((t) => ({ ...t, [lead.id]: 'loading' }));
      api.transcript(lead.id)
        .then((res) => setTranscripts((t) => ({ ...t, [lead.id]: res.messages || [] })))
        .catch(() => setTranscripts((t) => ({ ...t, [lead.id]: [] })));
    }
  }

  return (
    <>
      <Reveal>
        <header style={{ paddingTop: 24 }}>
          <div className="overline" style={{ color: 'var(--text-secondary)' }}>Сегодня</div>
          <h1 className="h2" style={{ marginTop: 6 }}>Лента обращений</h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 8 }}>
            Срочные — сверху. Нажмите на карточку, чтобы посмотреть переписку.
          </p>
        </header>
      </Reveal>

      {/* Фильтры */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '20px 0 4px' }}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 14px',
                borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600,
                border: `1.5px solid ${active ? 'transparent' : 'var(--border-strong)'}`,
                background: active ? 'var(--surface-brand)' : 'transparent',
                color: active ? 'var(--text-on-brand)' : 'var(--text)',
                transition: 'background var(--motion-fast)',
              }}
            >
              {f.label}
              <span
                className="tnum"
                style={{
                  fontSize: 14, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
                  background: active ? 'color-mix(in srgb, var(--gold-400) 90%, transparent)' : 'var(--surface-subtle)',
                  color: active ? '#1C1A17' : 'var(--text-secondary)',
                }}
              >
                {counts[f.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Список */}
      <div style={{ marginTop: 16 }}>
        {leads === null ? (
          <Loading />
        ) : visible.length === 0 ? (
          <EmptyState
            title={filter === 'all' ? 'Пока тихо. Все звонки подхвачены.' : 'Здесь пусто'}
            text={error
              ? 'Не удалось загрузить ленту — показываем демо-данные, когда бэкенд недоступен.'
              : filter === 'all' ? 'Как только кто-то позвонит или напишет — Анна подхватит и покажет карточку здесь.' : 'В этом фильтре сейчас нет обращений.'}
          />
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 16 }}>
            {visible.map((lead) => (
              <li key={lead.id}>
                <LeadRow
                  lead={lead}
                  open={expanded === lead.id}
                  transcript={transcripts[lead.id]}
                  onToggle={() => toggleTranscript(lead)}
                  onAction={(kind) => runAction(lead, kind)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

function LeadRow({ lead, open, transcript, onToggle, onAction }) {
  const status = cardStatus(lead);
  const source = CHANNELS.has(lead.channel) ? lead.channel : CHANNELS.has(lead.source) ? lead.source : 'call';
  const closed = lead.status === 'booked' || lead.status === 'confirmed' || lead.status === 'lost';

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        style={{ cursor: 'pointer', borderRadius: 'var(--r-card)' }}
      >
        <LeadCard
          name={lead.name}
          phone={lead.phone}
          service={lead.service}
          time={leadTime(lead)}
          source={source}
          status={status}
          sum={lead.est_sum}
          note={lead.resume}
          actions={false}
        />
      </div>

      {/* Действия под карточкой */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'center' }}>
        {!closed && (
          <>
            {lead.status === 'pending' ? (
              <Button variant="primary" size="sm" icon="check" onClick={() => onAction('confirm')}>Подтвердить запись</Button>
            ) : lead.is_urgent ? (
              <Button variant="danger" size="sm" icon="call" onClick={() => onAction('call')}>Перезвонить сейчас</Button>
            ) : (
              <Button variant="primary" size="sm" icon="check" onClick={() => onAction('book')}>Записан</Button>
            )}
            {lead.status !== 'pending' && !lead.is_urgent && (
              <Button variant="secondary" size="sm" icon="call" onClick={() => onAction('call')}>Перезвонить</Button>
            )}
            {(lead.status === 'pending' || lead.is_urgent) && (
              <Button variant="secondary" size="sm" icon="check" onClick={() => onAction('book')}>Записан</Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onAction('lost')} style={{ color: 'var(--text-secondary)' }}>Потерян</Button>
          </>
        )}
        <button
          type="button"
          onClick={onToggle}
          style={{
            marginLeft: closed ? 0 : 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
            minHeight: 40, padding: '0 12px', border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, color: 'var(--text-gold)',
          }}
        >
          <Icon name="dialog" size={18} />
          {open ? 'Скрыть переписку' : 'Переписка'}
        </button>
      </div>

      {open && <Transcript messages={transcript} />}
    </div>
  );
}

function Transcript({ messages }) {
  return (
    <div
      style={{
        marginTop: 10, padding: 14, background: 'var(--surface-subtle)',
        border: '1px solid var(--border)', borderRadius: 'var(--r-card-sm)', display: 'grid', gap: 10,
      }}
    >
      {messages === undefined || messages === 'loading' ? (
        <div style={{ fontSize: 16, color: 'var(--text-secondary)', padding: '6px 2px' }}>Загружаем переписку…</div>
      ) : messages.length === 0 ? (
        <div style={{ fontSize: 16, color: 'var(--text-secondary)', padding: '6px 2px' }}>Переписки пока нет.</div>
      ) : (
        messages.map((m, i) => {
          const isAnna = m.role === 'assistant' || m.role === 'anna' || m.role === 'bot';
          return (
            <div key={i} style={{ display: 'flex', gap: 10, justifyContent: isAnna ? 'flex-start' : 'flex-end' }}>
              {isAnna && (
                <span aria-hidden="true" style={{
                  flex: 'none', width: 28, height: 28, borderRadius: '50%', background: 'var(--wine-800)', color: 'var(--gold-300)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, alignSelf: 'flex-end',
                }}>А</span>
              )}
              <div style={{
                maxWidth: '80%', padding: '9px 12px', fontSize: 16, lineHeight: 1.45,
                borderRadius: isAnna ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                background: isAnna ? 'var(--surface)' : 'var(--wine-800)',
                color: isAnna ? 'var(--text)' : 'var(--ivory)',
                border: isAnna ? '1px solid var(--border)' : 'none',
              }}>
                {isAnna && <strong style={{ fontWeight: 600 }}>Анна: </strong>}
                {m.content}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
      <BearMark size={64} strokeWidth={3} style={{ color: 'var(--border-strong)', marginBottom: 16 }} />
      <div style={{ fontSize: 16 }}>Загружаем ленту…</div>
    </div>
  );
}
