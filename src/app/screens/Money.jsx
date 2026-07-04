import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { api, ApiError } from '../lib/api.js';
import { weekdayShort, fmtWhen } from '../lib/format.js';
import { MoneyFigure, fmtRub } from '../../design/components/money/MoneyFigure.jsx';
import { AnimatedMoney } from '../../components/common/AnimatedMoney.jsx';
import { RevenueBars } from '../../design/components/money/RevenueBars.jsx';
import { Icon } from '../../design/components/core/Icon.jsx';
import { EmptyState } from '../../design/components/feedback/EmptyState.jsx';

/* «Деньги» — мотив Прибыль. Крупная возвращённая сумма (золото, набегает),
   столбцы по дням, строка окупаемости. Денежный герой всегда на тёмной подложке —
   фирменный вид экрана «Деньги»; остальная страница следует общей теме. */

export default function Money() {
  const [weekly, setWeekly] = useState(null);
  const [streak, setStreak] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | error

  const load = useCallback(async () => {
    setState('loading');
    try {
      const [w, s] = await Promise.all([
        api.get('/api/money/weekly'),
        api.get('/api/reliability-streak').catch(() => null),
      ]);
      setWeekly(w || {});
      setStreak(s);
      setState('ready');
    } catch (e) {
      if (e instanceof ApiError && e.kind === 'auth') return;
      setState('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const bars = useMemo(() => {
    const byDay = Array.isArray(weekly?.by_day) ? weekly.by_day : [];
    return byDay.map((d) => ({ label: weekdayShort(d.date), value: Number(d.sum) || 0 }));
  }, [weekly]);

  const highlightIndex = useMemo(() => {
    if (!bars.length) return -1;
    let idx = -1, max = 0;
    bars.forEach((b, i) => { if (b.value > max) { max = b.value; idx = i; } });
    return idx;
  }, [bars]);

  if (state === 'loading') {
    return <div style={{ padding: '32px 8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 16 }}>Считаю возвращённые рубли…</div>;
  }
  if (state === 'error') {
    return (
      <EmptyState
        title="Что-то пошло не так, уже чиним"
        text="Обновите через минуту — цифры вернутся."
        actionLabel="Обновить"
        actionIcon="return"
        onAction={load}
      />
    );
  }

  const total = Number(weekly?.total) || 0;
  const paybackDay = weekly?.payback_day;
  const subscription = Number(weekly?.subscription_cost) || 0;
  const bestDay = bars.reduce((m, b) => Math.max(m, b.value), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Денежный герой — всегда тёмный, как эталон экрана «Деньги» */}
      <div data-theme="dark" style={{ borderRadius: 'var(--r-card)' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-card)', padding: '20px 16px 16px', boxShadow: 'var(--shadow-card)' }}>
          <AnimatedMoney value={total} size="xl" mobile color="gold" label="Возвращено за неделю" particles />
          {bars.length ? (
            <div style={{ marginTop: 18 }}>
              <RevenueBars data={bars} highlightIndex={highlightIndex} height={96} />
            </div>
          ) : null}
          {paybackDay != null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 16, color: 'var(--text)' }}>
              <svg viewBox="0 0 10 10" width="10" height="10" style={{ flex: 'none' }} aria-hidden="true"><polygon points="5,0 10,5 5,10 0,5" fill="var(--control-on)" /></svg>
              Пилот окупился — <strong>на {paybackDay}-й день</strong>
            </div>
          ) : null}
          {subscription > 0 ? (
            <div className="tnum" style={{ marginTop: 8, fontSize: 16, color: 'var(--text-secondary)', fontFeatureSettings: "'tnum' 1" }}>
              Абонемент — {fmtRub(subscription)}&nbsp;₽ в месяц
            </div>
          ) : null}
        </div>
      </div>

      {bestDay > 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-card-sm)', padding: '14px 16px' }}>
          <MoneyFigure value={bestDay} size="md" label="Лучший день" />
        </div>
      ) : null}

      {/* Надёжность: серия без пропусков или карточка сбоя */}
      {streak ? (
        streak.last_incident ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-card)', padding: '16px', boxShadow: 'var(--shadow-card)' }}>
            <Icon name="shield" size={22} color="var(--success-text)" style={{ flex: 'none', marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Был короткий сбой {fmtWhen(streak.last_incident.date)}</div>
              <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 4 }}>
                Устранили за {streak.last_incident.resolved_in_minutes} мин. Сейчас каждое обращение получает ответ.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-card)', padding: '18px 16px', boxShadow: 'var(--shadow-card)' }}>
            <Icon name="shield" size={28} color="var(--success-text)" style={{ flex: 'none' }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text)', fontFeatureSettings: "'tnum' 1" }}>{Number(streak.current_streak_days) || 0}</span>
                <span style={{ fontSize: 16 }}>дней подряд — каждое обращение получило ответ</span>
              </div>
              {streak.record_days != null ? (
                <div className="tnum" style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 4, fontFeatureSettings: "'tnum' 1" }}>Рекорд: {streak.record_days} дней</div>
              ) : null}
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
