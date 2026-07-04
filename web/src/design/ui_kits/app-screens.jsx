import React from 'react';
import { Icon } from '../components/core/Icon.jsx';
import { Button } from '../components/controls/Button.jsx';
import { Toggle } from '../components/controls/Toggle.jsx';
import { StatusBadge } from '../components/leads/StatusBadge.jsx';
import { LeadCard } from '../components/leads/LeadCard.jsx';
import { MoneyFigure, fmtRub } from '../components/money/MoneyFigure.jsx';
import { RevenueBars } from '../components/money/RevenueBars.jsx';
import { OnboardingStepper } from '../components/feedback/OnboardingStepper.jsx';

/* Экраны мобильного приложения 390×~800 (контент без корпуса телефона).
   Каждый экран отвечает мотиву: Покой (лента, карточка) или Прибыль («Деньги»). */

const TABS = [
  ['dialog', 'Лента'],
  ['ruble', 'Деньги'],
  ['report', 'Отчёты'],
  ['settings', 'Настройки'],
];

function TabBar({ active = 0 }) {
  return (
    <nav style={{ flex: 'none', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid var(--border)', background: 'var(--surface)', paddingBottom: 6 }}>
      {TABS.map(([icon, label], i) => {
        const on = i === active;
        return (
          <span key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 4px 6px', minHeight: 44, color: on ? 'var(--control-on)' : 'var(--text-secondary)', cursor: 'pointer' }}>
            {on ? <span aria-hidden="true" style={{ position: 'absolute', top: 0, width: 28, height: 4, background: 'var(--control-on)', clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)' }} /> : null}
            <Icon name={icon} size={24} />
            <span style={{ fontSize: 13, fontWeight: on ? 600 : 500 }}>{label}</span>
          </span>
        );
      })}
    </nav>
  );
}

function AppBar({ title, back = false, right = null }) {
  return (
    <header style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg)' }}>
      {back
        ? <Icon name="return" size={24} style={{ color: 'var(--text)' }} />
        : <img src="assets/logo-tile-wine.png" alt="" width="32" height="35" style={{ display: 'block', borderRadius: 8 }} />}
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, flex: 1, minWidth: 0 }}>{title}</span>
      {right || <Icon name="bell" size={24} style={{ color: 'var(--text-secondary)' }} />}
    </header>
  );
}

function Screen({ children, dark = false, height = 800 }) {
  return (
    <div
      data-theme={dark ? 'dark' : 'light'}
      style={{ width: '100%', height, display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)', overflow: 'hidden' }}
    >
      {children}
    </div>
  );
}

/* ── 1. Лента карточек ── */
export function FeedScreen({ dark = false, height = 800 }) {
  const chips = [['Все', 5, true], ['Срочно', 1, false], ['Новые', 2, false]];
  return (
    <Screen dark={dark} height={height}>
      <AppBar title="Подхват AI+" />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '4px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* сводка дня — Покой + Прибыль одной строкой */}
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
            <Icon name="check" size={18} color="var(--success-text)" />
            Подхвачено&nbsp;<strong>5 из 5</strong>
          </span>
          <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-gold)', fontFeatureSettings: "'tnum' 1", whiteSpace: 'nowrap' }}>+12 400 ₽</span>
        </div>
        {/* фильтры */}
        <div style={{ flex: 'none', display: 'flex', gap: 8 }}>
          {chips.map(([label, n, on], i) => (
            <span key={i} className="tnum" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, fontSize: 16, fontWeight: on ? 600 : 500, background: on ? 'var(--control-on)' : 'transparent', color: on ? 'var(--control-on-knob)' : 'var(--text-secondary)', border: on ? 'none' : '1.5px solid var(--border-strong)', fontFeatureSettings: "'tnum' 1", cursor: 'pointer' }}>
              {label} · {n}
            </span>
          ))}
        </div>
        {/* карточки */}
        <div style={{ display: 'grid', gap: 12 }}>
          <LeadCard status="urgent" name="Ирина Соколова" phone="+7 912 003-18-44" service="Острая боль" time="14:02" source="call" note="Перезвоните первой — обещала ждать 15 минут." />
          <LeadCard status="dialog" name="Олег Крылов" phone="+7 909 315-77-02" service="Чистка" time="11:15" source="max" actions={false} note="Предложила четверг 16:00 — думает." />
          <LeadCard status="booked" name="Ольга Северова" phone="+7 903 118-24-60" service="Чистка · чт 16:00" time="вчера" source="telegram" sum={3800} actions={false} />
        </div>
      </div>
      <TabBar active={0} />
    </Screen>
  );
}

/* ── 2. Карточка лида (детально) ── */
export function LeadDetailScreen({ dark = false, height = 800 }) {
  const timeline = [
    { icon: 'call-missed', time: '14:02', text: 'Звонок пропущен — обе линии заняты', tone: 'var(--urgent-text)' },
    { icon: 'max', time: '14:03', text: 'Написала Ирине в MAX: предложила приехать сегодня', tone: 'var(--text-secondary)' },
    { icon: 'dialog', time: '14:07', text: 'Ирина ответила: сильная боль, ждёт звонка 15 минут', tone: 'var(--text-secondary)' },
  ];
  return (
    <Screen dark={dark} height={height}>
      <AppBar title="Карточка пациента" back right={<span />} />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: '1.5px solid var(--urgent)', borderRadius: 16, boxShadow: 'var(--shadow-urgent)', padding: '18px 16px', position: 'relative', overflow: 'hidden' }}>
          <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'var(--urgent)' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingLeft: 4 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Ирина Соколова</div>
              <div className="tnum" style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 2, fontFeatureSettings: "'tnum' 1" }}>+7 912 003-18-44</div>
            </div>
            <StatusBadge status="urgent" solid label="Срочно — боль" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginTop: 16, paddingLeft: 4, fontSize: 16 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Обращение</span><strong style={{ textAlign: 'right' }}>Острая боль</strong>
            <span style={{ color: 'var(--text-secondary)' }}>Канал</span><span style={{ textAlign: 'right', display: 'inline-flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}><Icon name="call" size={18} />Звонок</span>
            <span style={{ color: 'var(--text-secondary)' }}>Ожидаемый чек</span><strong className="tnum" style={{ textAlign: 'right', color: 'var(--text-gold)', fontFamily: 'var(--font-display)', fontFeatureSettings: "'tnum' 1" }}>4 500 ₽</strong>
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 18, paddingLeft: 4 }}>
            <Button variant="danger" size="md" full icon="call">Перезвонить сейчас</Button>
            <Button variant="secondary" size="md" full icon="check">Записан ✓</Button>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 16px 8px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Что сделала Анна</div>
          <div style={{ marginTop: 12 }}>
            {timeline.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: i < timeline.length - 1 ? 18 : 10 }}>
                {i < timeline.length - 1 ? <span aria-hidden="true" style={{ position: 'absolute', left: 11, top: 26, bottom: 0, width: 1.5, background: 'var(--border)' }} /> : null}
                <Icon name={t.icon} size={22} color={t.tone} style={{ flex: 'none', marginTop: 1 }} />
                <div style={{ fontSize: 16, lineHeight: 1.4 }}>
                  <span className="tnum" style={{ color: 'var(--text-secondary)', fontFeatureSettings: "'tnum' 1", marginRight: 8 }}>{t.time}</span>
                  {t.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* ── 3. Экран «Деньги» ── */
export function MoneyScreen({ dark = true, height = 800 }) {
  const week = [
    { label: 'пн', value: 0 }, { label: 'вт', value: 3800 }, { label: 'ср', value: 8400 },
    { label: 'чт', value: 12400 }, { label: 'пт', value: 9800 }, { label: 'сб', value: 12800 }, { label: 'вс', value: 0 },
  ];
  return (
    <Screen dark={dark} height={height}>
      <AppBar title="Деньги" />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '4px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 16px 16px', boxShadow: 'var(--shadow-card)' }}>
          <MoneyFigure value={47200} size="xl" mobile label="Возвращено за неделю" sub="6 пациентов записаны" color="gold" />
          <div style={{ marginTop: 18 }}>
            <RevenueBars data={week} highlightIndex={5} paybackIndex={3} height={96} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 16 }}>
            <svg viewBox="0 0 10 10" width="10" height="10" style={{ flex: 'none' }}><polygon points="5,0 10,5 5,10 0,5" fill="var(--control-on)" /></svg>
            Пилот окупился в четверг — <strong>на 9-й день</strong>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
            <MoneyFigure value={12800} size="md" label="Лучший день" />
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
            <MoneyFigure value={7867} size="md" label="Средний чек" />
          </div>
        </div>
      </div>
      <TabBar active={1} />
    </Screen>
  );
}

/* ── 4. Шаг онбординга (2 из 4 — «Каналы») ── */
export function OnboardingScreen({ dark = false, height = 800 }) {
  return (
    <Screen dark={dark} height={height}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '20px 20px 0' }}>
        <OnboardingStepper current={1} compact />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 1.2, fontWeight: 700, margin: '28px 0 0', textWrap: 'balance' }}>Куда Анне писать пациентам?</h2>
        <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--text-secondary)', margin: '10px 0 0' }}>
          Если пациент не дозвонился, Анна напишет ему сама — туда, где его удобнее застать.
        </p>
        <div style={{ display: 'grid', gap: 4, marginTop: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '10px 16px', boxShadow: 'var(--shadow-card)' }}>
          <Toggle defaultChecked label="MAX" description="Основной канал — сюда первым делом" />
          <Toggle defaultChecked label="Telegram" description="Если пациент есть в Telegram" />
          <Toggle label="SMS" description="Резерв — когда мессенджеры молчат" />
        </div>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: '14px 0 0', display: 'flex', gap: 8 }}>
          <Icon name="shield" size={18} color="var(--success-text)" style={{ flex: 'none', marginTop: 2 }} />
          Каналы можно менять в любой момент. Данные — в России, по 152-ФЗ.
        </p>
      </div>
      <div style={{ flex: 'none', display: 'grid', gap: 8, padding: '16px 20px 24px' }}>
        <Button variant="primary" size="lg" full>Дальше</Button>
        <Button variant="ghost" size="md" full>Назад</Button>
      </div>
    </Screen>
  );
}
