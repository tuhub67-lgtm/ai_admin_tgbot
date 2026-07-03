import React, { useState } from 'react';
import { Icon, ICON_NAMES } from '../components/core/Icon.jsx';
import { BearMark, OrnamentSolar } from '../components/core/BearMark.jsx';
import { Button } from '../components/controls/Button.jsx';
import { Input } from '../components/controls/Input.jsx';
import { Toggle } from '../components/controls/Toggle.jsx';
import { StatusBadge } from '../components/leads/StatusBadge.jsx';
import { LeadCard } from '../components/leads/LeadCard.jsx';
import { MoneyFigure } from '../components/money/MoneyFigure.jsx';
import { RevenueBars } from '../components/money/RevenueBars.jsx';
import { Toast } from '../components/feedback/Toast.jsx';
import { EmptyState } from '../components/feedback/EmptyState.jsx';
import { OnboardingStepper } from '../components/feedback/OnboardingStepper.jsx';
import { DataTable } from '../components/data/DataTable.jsx';
import { ReportHeader } from '../components/data/ReportHeader.jsx';

/* Демо-кластеры UI-кита: каждый блок показывает компонент в ОБЕИХ темах. */

function Pane({ dark, children, pad = 24 }) {
  return (
    <div
      data-theme={dark ? 'dark' : 'light'}
      style={{
        flex: '1 1 420px', minWidth: 0, padding: pad, borderRadius: 16,
        background: 'var(--bg)', color: 'var(--text)',
        border: dark ? '1px solid #3A352C' : '1px solid var(--neutral-200)',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 16 }}>
        {dark ? 'Тёмная' : 'Светлая'}
      </div>
      {children}
    </div>
  );
}

function ThemePair({ children, pad }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      <Pane pad={pad}>{children}</Pane>
      <Pane dark pad={pad}>{children}</Pane>
    </div>
  );
}

const cap = { fontSize: 16, color: 'var(--text-secondary)', margin: '0 0 8px' };

/* ─── Кнопки: 5 вариантов × 4 состояния + 3 размера ─── */
export function ButtonsDemo() {
  const variants = [
    ['primary', 'Primary — золотой CTA'],
    ['brand', 'Brand — винный'],
    ['secondary', 'Secondary — контурная'],
    ['ghost', 'Ghost'],
    ['danger', 'Danger — только «срочно»'],
  ];
  const states = ['default', 'hover', 'pressed', 'disabled'];
  return (
    <ThemePair>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, max-content)', gap: '14px 12px', alignItems: 'center', overflowX: 'auto', paddingBottom: 4 }}>
        {states.map(s => <div key={s} style={{ fontSize: 16, color: 'var(--text-secondary)' }}>{s}</div>)}
        {variants.map(([v]) => states.map(s => (
          <Button key={v + s} variant={v} size="sm" forceState={s} disabled={s === 'disabled'} icon={v === 'danger' ? 'call' : v === 'primary' ? 'check' : undefined}>
            {v === 'primary' ? 'Записан' : v === 'brand' ? 'Подхватим' : v === 'secondary' ? 'Перезвонить' : v === 'ghost' ? 'Подробнее' : 'Срочно'}
          </Button>
        )))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <Button size="sm">Малая · 40</Button>
        <Button size="md">Средняя · 48</Button>
        <Button size="lg">Большая · 56</Button>
      </div>
    </ThemePair>
  );
}

/* ─── Поля ввода ─── */
export function InputsDemo() {
  return (
    <ThemePair>
      <div style={{ display: 'grid', gap: 16, maxWidth: 420 }}>
        <Input label="Телефон клиники" placeholder="+7 912 345-67-89" icon="call" type="tel" hint="Анна подхватит звонки с этого номера" />
        <Input label="Средний чек" defaultValue="7 800" suffix="₽" type="text" forceFocus />
        <Input label="Название клиники" defaultValue="Жемчуг" error="Анне нужно полное название — как в вывеске" />
        <Input label="Город" defaultValue="Екатеринбург" disabled />
      </div>
    </ThemePair>
  );
}

/* ─── Тумблеры ─── */
export function TogglesDemo() {
  return (
    <ThemePair>
      <div style={{ display: 'grid', gap: 4 }}>
        <Toggle defaultChecked label="MAX" description="Основной канал — Анна пишет сюда первым делом" />
        <Toggle defaultChecked label="Telegram" description="Если пациент есть в Telegram" />
        <Toggle label="SMS" description="Резерв — когда мессенджеры молчат" />
        <Toggle disabled label="Голосовой перезвон" description="Скоро" />
      </div>
    </ThemePair>
  );
}

/* ─── Статус-бейджи: цвет + форма ─── */
export function BadgesDemo() {
  return (
    <ThemePair>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <StatusBadge status="new" />
        <StatusBadge status="dialog" />
        <StatusBadge status="booked" />
        <StatusBadge status="urgent" />
        <StatusBadge status="lost" />
        <StatusBadge status="urgent" solid label="Срочно — острая боль" />
      </div>
      <p style={{ ...cap, margin: '14px 0 0', maxWidth: 460 }}>
        Каждому статусу — цвет <strong style={{ color: 'var(--text)' }}>и форма</strong>: ромб / три точки / галочка / фацетный маркер / крест. Различимо без цвета.
      </p>
    </ThemePair>
  );
}

/* ─── Карточка лида: все состояния ─── */
export function LeadCardsDemo() {
  return (
    <ThemePair>
      <div style={{ display: 'grid', gap: 12, maxWidth: 460 }}>
        <LeadCard status="urgent" name="Ирина Соколова" phone="+7 912 003-18-44" service="Острая боль" time="14:02, не дозвонилась" source="call" note="Перезвоните первой — обещала ждать 15 минут." />
        <LeadCard status="new" name="Марина Ковалёва" phone="+7 922 480-55-17" service="Имплантация" time="12:40" source="call" sum={12400} />
        <LeadCard status="dialog" name="Олег Крылов" phone="+7 909 315-77-02" service="Чистка" time="11:15" source="max" note="Предложила четверг 16:00 — думает." />
        <LeadCard status="booked" name="Ольга Северова" phone="+7 903 118-24-60" service="Чистка · чт 16:00" time="вчера" source="telegram" sum={3800} />
        <LeadCard status="lost" name="Номер скрыт" phone="+7 ··· ···-··-··" service="Не назвался" time="понедельник" source="sms" />
      </div>
    </ThemePair>
  );
}

/* ─── Денежная цифра + график ─── */
export function MoneyDemo() {
  const week = [
    { label: 'пн', value: 0 }, { label: 'вт', value: 3800 }, { label: 'ср', value: 8400 },
    { label: 'чт', value: 12400 }, { label: 'пт', value: 9800 }, { label: 'сб', value: 12800 }, { label: 'вс', value: 0 },
  ];
  return (
    <ThemePair>
      <div style={{ maxWidth: 460 }}>
        <MoneyFigure value={47200} size="xl" mobile label="Возвращено за неделю" sub="6 пациентов записаны" />
        <div style={{ marginTop: 24 }}>
          <RevenueBars data={week} highlightIndex={5} paybackIndex={3} height={120} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 16 }}>
          <svg viewBox="0 0 10 10" width="10" height="10"><polygon points="5,0 10,5 5,10 0,5" fill="var(--control-on)" /></svg>
          <span>Пилот окупился в четверг — <strong>на 9-й день</strong></span>
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <MoneyFigure value={12400} size="md" label="Лучший день" />
          <MoneyFigure value={7867} size="md" label="Средний чек" />
        </div>
      </div>
    </ThemePair>
  );
}

/* ─── Таблица ─── */
export function TableDemo() {
  const cols = [
    { key: 'name', label: 'Пациент', strong: true },
    { key: 'service', label: 'Услуга', secondary: true },
    { key: 'status', label: 'Статус', render: r => <StatusBadge status={r.status} /> },
    { key: 'sum', label: 'Возвращено', money: 'gold', align: 'right' },
  ];
  const rows = [
    { name: 'Марина Ковалёва', service: 'Имплантация', status: 'booked', sum: '12 400 ₽' },
    { name: 'Ольга Северова', service: 'Чистка', status: 'booked', sum: '3 800 ₽' },
    { name: 'Олег Крылов', service: 'Чистка', status: 'dialog', sum: '—' },
    { name: 'Ирина Соколова', service: 'Острая боль', status: 'urgent', sum: '—' },
    { name: 'Пётр Аникин', service: 'Коронка', status: 'booked', sum: '8 900 ₽' },
  ];
  return (
    <ThemePair pad={16}>
      <DataTable columns={cols} rows={rows} footer={{ name: 'Итого за неделю', sum: '25 100 ₽' }} />
    </ThemePair>
  );
}

/* ─── Тосты ─── */
export function ToastsDemo() {
  return (
    <ThemePair>
      <div style={{ display: 'grid', gap: 12 }}>
        <Toast variant="success" title="Ольга записана" text="Чистка, четверг 16:00. Напомню ей за день." />
        <Toast variant="money" title="Возвращено 12 400 ₽" text="Марина подтвердила имплантацию." />
        <Toast variant="info" title="Анна пишет Олегу в MAX" text="Не дозвонился в 11:15 — предлагаю время." />
        <Toast variant="urgent" title="Что-то пошло не так, уже чиним" text="Звонки принимаем как обычно. Записи не потеряны." actionLabel="Подробнее" />
      </div>
    </ThemePair>
  );
}

/* ─── Пустые состояния ─── */
export function EmptyDemo() {
  return (
    <ThemePair pad={16}>
      <EmptyState text="Если кто-то не дозвонится — карточка появится здесь, а я уже буду писать пациенту." />
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <EmptyState compact title="За эту неделю отчёта ещё нет" text="Соберу его в воскресенье вечером." actionLabel="Отчёт за прошлую неделю" actionIcon="report" />
      </div>
    </ThemePair>
  );
}

/* ─── Степпер онбординга ─── */
export function StepperDemo() {
  return (
    <ThemePair>
      <div style={{ display: 'grid', gap: 28, maxWidth: 460 }}>
        <OnboardingStepper current={1} />
        <OnboardingStepper current={3} compact />
      </div>
    </ThemePair>
  );
}

/* ─── Шапка отчёта PDF (печать — всегда светлая) ─── */
export function ReportHeaderDemo() {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid var(--neutral-200)', borderRadius: 16, overflow: 'hidden' }}>
      <ReportHeader />
      <div style={{ padding: '20px 32px', fontSize: 16, color: 'var(--text-secondary)' }}>
        …тело отчёта: таблица пациентов, график по дням. Минимальный кегль печати — 12 pt.
      </div>
    </div>
  );
}

/* ─── Иконки: весь сет ─── */
export function IconsDemo() {
  return (
    <ThemePair>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))', gap: 8 }}>
        {ICON_NAMES.map(n => (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 6px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <Icon name={n} size={24} />
            <span style={{ fontSize: 14, fontFamily: 'ui-monospace, monospace', color: 'var(--text-secondary)' }}>{n}</span>
          </div>
        ))}
      </div>
    </ThemePair>
  );
}

/* ─── Знаки: медведь линией + солярный медальон ─── */
export function MarksDemo() {
  return (
    <ThemePair>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <figure style={{ margin: 0, flex: '1 1 150px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <BearMark size={84} style={{ color: 'var(--wine-800)' }} />
          <figcaption style={{ fontSize: 16, color: 'var(--text-secondary)', textAlign: 'center' }}>Медведь линией — пустые состояния, обложки</figcaption>
        </figure>
        <figure style={{ margin: 0, flex: '1 1 150px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ position: 'relative', width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <OrnamentSolar size={84} style={{ color: 'var(--text)', opacity: .35 }} />
          </div>
          <figcaption style={{ fontSize: 16, color: 'var(--text-secondary)', textAlign: 'center' }}>Солярный медальон — в макетах ≤6% прозрачности</figcaption>
        </figure>
        <figure style={{ margin: 0, flex: '1 1 150px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <img src="assets/logo-tile-wine.png" alt="Логотип" width="84" height="84" style={{ borderRadius: 18 }} />
          <figcaption style={{ fontSize: 16, color: 'var(--text-secondary)', textAlign: 'center' }}>Утверждённый логотип — шапки и плашки</figcaption>
        </figure>
      </div>
    </ThemePair>
  );
}
