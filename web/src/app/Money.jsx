import { useEffect, useState } from 'react';
import { MoneyFigure } from '../design/components/money/MoneyFigure.jsx';
import { RevenueBars } from '../design/components/money/RevenueBars.jsx';
import { Icon } from '../design/components/core/Icon.jsx';
import { BearMark } from '../design/components/core/BearMark.jsx';
import { Reveal } from '../lib/anim.jsx';
import { api } from './lib/api.js';

/* Склонение слова «день» для чисел (1 день / 2 дня / 5 дней). */
function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
function days(n) { return `${n} ${plural(n, 'день', 'дня', 'дней')}`; }

export default function Money() {
  const [money, setMoney] = useState(null);
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    let alive = true;
    api.money().then((r) => alive && setMoney(r)).catch(() => alive && setMoney({ error: true }));
    api.streak().then((r) => alive && setStreak(r)).catch(() => alive && setStreak(null));
    return () => { alive = false; };
  }, []);

  if (!money) return <Loading />;

  const byDay = money.by_day || [];
  const highlightIndex = byDay.reduce((best, d, i, arr) => (d.rub > (arr[best]?.rub ?? -1) ? i : best), 0);
  const paybackIndex = money.pilot_paid_back && money.payback_day >= 1 && money.payback_day <= byDay.length
    ? money.payback_day - 1
    : -1;

  const card = {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-card)',
    boxShadow: 'var(--shadow-card)', padding: 24,
  };

  return (
    <>
      <Reveal>
        <header style={{ paddingTop: 24 }}>
          <div className="overline" style={{ color: 'var(--text-secondary)' }}>Деньги</div>
          <h1 className="h2" style={{ marginTop: 6 }}>Возвращено за неделю</h1>
        </header>
      </Reveal>

      {/* Главная цифра */}
      <Reveal delay={60}>
        <div
          style={{
            position: 'relative', marginTop: 20, background: 'var(--surface)', boxShadow: 'var(--shadow-raised)',
            clipPath: 'polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 0 100%)',
            borderRadius: '16px 0 16px 16px', padding: '28px 26px',
          }}
        >
          <MoneyFigure
            value={money.total || 0}
            size="xl"
            color="gold"
            animate
            sub={money.leads ? `${money.leads} ${plural(money.leads, 'запись', 'записи', 'записей')} вернулись за неделю` : undefined}
          />
        </div>
      </Reveal>

      {/* График по дням */}
      <Reveal delay={100}>
        <div style={{ ...card, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Icon name="report" size={20} color="var(--text-secondary)" />
            <span style={{ fontSize: 16, fontWeight: 600 }}>По дням</span>
          </div>
          {byDay.length ? (
            <RevenueBars
              data={byDay.map((d) => ({ label: d.day, value: d.rub }))}
              highlightIndex={highlightIndex}
              paybackIndex={paybackIndex}
            />
          ) : (
            <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Данных пока нет.</div>
          )}

          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, padding: '12px 14px',
              background: money.pilot_paid_back ? 'var(--success-tint)' : 'var(--surface-subtle)',
              borderRadius: 'var(--r-card-sm)', fontSize: 16,
            }}
          >
            <Icon name={money.pilot_paid_back ? 'check' : 'clock'} size={20} color={money.pilot_paid_back ? 'var(--success-text)' : 'var(--text-secondary)'} />
            <span style={{ fontWeight: 600, color: money.pilot_paid_back ? 'var(--success-text)' : 'var(--text)' }}>
              {money.pilot_paid_back
                ? `Пилот окупился на ${money.payback_day}-й день`
                : 'Пилот пока не окупился'}
            </span>
            {money.pilot_price ? (
              <span className="tnum" style={{ marginLeft: 'auto', fontSize: 16, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                стоил {String(money.pilot_price).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}&nbsp;₽
              </span>
            ) : null}
          </div>
        </div>
      </Reveal>

      {/* Надёжность */}
      {streak ? (
        <Reveal delay={140}>
          <div style={{ ...card, marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Icon name="shield" size={20} color="var(--success-text)" />
              <span style={{ fontSize: 16, fontWeight: 600 }}>Надёжность</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 700, lineHeight: 1, color: 'var(--text)' }}>
                {streak.current_streak_days}
              </span>
              <span style={{ fontSize: 18, fontWeight: 600 }}>
                {plural(streak.current_streak_days, 'день', 'дня', 'дней')} подряд
              </span>
            </div>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 8 }}>
              Каждое обращение получило ответ. Рекорд: {days(streak.record_days)}.
            </p>

            {streak.last_incident ? (
              <div
                style={{
                  display: 'flex', gap: 10, marginTop: 16, padding: '12px 14px',
                  background: 'var(--surface-subtle)', borderLeft: '4px solid var(--gold-500)',
                  borderRadius: 'var(--r-card-sm)', fontSize: 16, color: 'var(--text-secondary)',
                }}
              >
                <Icon name="clock" size={20} color="var(--text-gold)" style={{ marginTop: 1, flex: 'none' }} />
                <span>
                  Был сбой доставки {formatDate(streak.last_incident.date)} — устранили за{' '}
                  <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{streak.last_incident.resolved_in_minutes} мин</strong>.
                  Новый отсчёт начат.
                </span>
              </div>
            ) : null}
          </div>
        </Reveal>
      ) : null}
    </>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px', color: 'var(--text-secondary)' }}>
      <BearMark size={64} strokeWidth={3} style={{ color: 'var(--border-strong)', marginBottom: 16 }} />
      <div style={{ fontSize: 16 }}>Считаем возвращённые рубли…</div>
    </div>
  );
}
