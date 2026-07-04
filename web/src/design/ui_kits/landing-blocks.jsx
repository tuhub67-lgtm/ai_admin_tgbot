import React, { useState } from 'react';
import { Icon } from '../components/core/Icon.jsx';
import { Button } from '../components/controls/Button.jsx';
import { fmtRub } from '../components/money/MoneyFigure.jsx';

/* Лендинг-блоки: hero с калькулятором потерь, доверие (152-ФЗ), тариф.
   Калькулятор показывает математику открыто — «Правда требует доказательства». */

export function RuStoreButton({ style }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href="#rustore"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 12, height: 56, padding: '0 20px',
        background: hover ? '#2F2B24' : '#1C1A17', color: '#FCF2DC', textDecoration: 'none',
        borderRadius: 10, fontFamily: 'var(--font-body)', transition: 'background var(--motion-fast)',
        ...style,
      }}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M12 3v10M8 9.5l4 4 4-4" />
        <path d="M4 15v5h16v-5" />
      </svg>
      <span style={{ lineHeight: 1.2, textAlign: 'left' }}>
        <span style={{ display: 'block', fontSize: 13, opacity: .75, letterSpacing: '.04em' }}>СКАЧАЙТЕ В</span>
        <span style={{ display: 'block', fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)' }}>RuStore</span>
      </span>
    </a>
  );
}

/* ── Степпер-контрол калькулятора: −/+, зоны 44px ── */
function CalcStepper({ label, value, display, onMinus, onPlus, hint }) {
  const btn = {
    width: 44, height: 44, flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--surface)', border: '1.5px solid var(--border-strong)', borderRadius: 10,
    fontSize: 22, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', fontFamily: 'var(--font-display)',
    userSelect: 'none', padding: 0,
  };
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" aria-label={`Меньше: ${label}`} style={btn} onClick={onMinus}>−</button>
        <div className="tnum" style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, fontFeatureSettings: "'tnum' 1", whiteSpace: 'nowrap' }}>
          {display !== undefined ? display : value}
        </div>
        <button type="button" aria-label={`Больше: ${label}`} style={btn} onClick={onPlus}>+</button>
      </div>
      {hint ? <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 6 }}>{hint}</div> : null}
    </div>
  );
}

export function LossCalculator({ style }) {
  const [calls, setCalls] = useState(3);
  const [check, setCheck] = useState(8000);
  const lossShare = 0.4; // 4 из 10 не перезвонивших уходят в другую клинику
  const loss = Math.round(calls * 22 * check * lossShare / 100) * 100;

  return (
    <div
      style={{
        background: 'var(--surface)', boxShadow: 'var(--shadow-raised)',
        clipPath: 'polygon(0 0, calc(100% - 32px) 0, 100% 32px, 100% 100%, 0 100%)',
        borderRadius: '16px 0 16px 16px', padding: '28px 28px 24px',
        fontFamily: 'var(--font-body)', color: 'var(--text)', ...style,
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, lineHeight: 1.25 }}>Сколько уносят пропущенные?</div>
      <div style={{ display: 'grid', gap: 20, marginTop: 20 }}>
        <CalcStepper
          label="Пропущенных звонков в день"
          value={calls}
          onMinus={() => setCalls(v => Math.max(1, v - 1))}
          onPlus={() => setCalls(v => Math.min(20, v + 1))}
        />
        <CalcStepper
          label="Средний чек"
          display={`${fmtRub(check)}\u00A0₽`}
          onMinus={() => setCheck(v => Math.max(2000, v - 1000))}
          onPlus={() => setCheck(v => Math.min(30000, v + 1000))}
        />
      </div>
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Мимо кассы в месяц</div>
        <div className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 1.1, fontWeight: 700, color: 'var(--urgent-text)', fontFeatureSettings: "'tnum' 1", marginTop: 6, whiteSpace: 'nowrap' }}>
          ≈ {fmtRub(loss)}<span style={{ fontWeight: 600, opacity: .85, marginLeft: '.12em' }}>₽</span>
        </div>
        <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.45 }}>
          {calls} {calls === 1 ? 'звонок' : calls < 5 ? 'звонка' : 'звонков'} × 22 рабочих дня × {fmtRub(check)} ₽ × 40% — столько пациентов
          не перезванивают сами и уходят в другую клинику.
        </div>
      </div>
      <Button variant="primary" size="lg" full icon="check" style={{ marginTop: 20 }}>Подхватим — 1 590 ₽/мес</Button>
    </div>
  );
}

export function LandingHero({ style }) {
  return (
    <section style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)', padding: '0 0 56px', ...style }}>
      {/* Верхняя полоса бренда */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '20px 48px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="assets/logo-tile-wine.png" alt="" width="40" height="43" style={{ display: 'block', borderRadius: 9 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Подхват AI+</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 16 }}>
          <a href="#how" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Как работает</a>
          <a href="#price" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Тариф</a>
          <Button variant="brand" size="sm">Подхватим</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(340px, .9fr)', gap: 56, alignItems: 'center', padding: '56px 48px 0', maxWidth: 1200, margin: '0 auto' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--wine-800)' }}>
            <span aria-hidden="true" style={{ width: 20, height: 4, background: 'var(--gold-400)' }} />
            ИИ-администратор для стоматологии
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 1.1, fontWeight: 800, letterSpacing: '-0.01em', margin: '16px 0 0', maxWidth: 560, textWrap: 'balance' }}>
            Пропущенный звонок — это пациент, который ушёл к соседям
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--text-secondary)', margin: '20px 0 0', maxWidth: 520 }}>
            Анна подхватывает звонок за 30 секунд: пишет пациенту в MAX, Telegram или SMS,
            договаривается и записывает. Вы видите каждый возвращённый рубль.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
            <RuStoreButton />
            <Button variant="secondary" size="lg">Как это работает</Button>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 28, fontSize: 16, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon name="shield" size={18} color="var(--success-text)" />152-ФЗ</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon name="server" size={18} color="var(--success-text)" />Данные — в России</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon name="clock" size={18} color="var(--success-text)" />Подхват за 30 секунд</span>
          </div>
        </div>
        <LossCalculator />
      </div>
    </section>
  );
}

export function TrustBlock({ style }) {
  const items = [
    { icon: 'shield', title: 'Работаем по 152-ФЗ', text: 'Согласия, обработка и хранение персональных данных — по закону. Шаблоны документов дадим.' },
    { icon: 'server', title: 'Данные — в России', text: 'Серверы в РФ. Записи разговоров и база пациентов не покидают страну.' },
    { icon: 'lock', title: 'База — только ваша', text: 'Не передаём пациентов третьим лицам. Выгрузка и удаление — в один клик.' },
  ];
  return (
    <section style={{ padding: '48px 48px 56px', background: 'var(--bg)', fontFamily: 'var(--font-body)', color: 'var(--text)', ...style }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Покой</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, margin: '8px 0 0' }}>Ничего не потеряно. И никуда не утекло</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 24 }}>
          {items.map((it, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 24px 22px', boxShadow: 'var(--shadow-card)' }}>
              <span style={{ display: 'inline-flex', width: 48, height: 48, alignItems: 'center', justifyContent: 'center', background: 'var(--wine-800)', color: 'var(--gold-300)', clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)', borderRadius: '10px 0 10px 10px' }}>
                <Icon name={it.icon} size={24} />
              </span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, marginTop: 14 }}>{it.title}</div>
              <div style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--text-secondary)', marginTop: 6 }}>{it.text}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingCard({ style }) {
  const feats = [
    'Подхват пропущенных — круглосуточно',
    'Анна пишет в MAX, Telegram и SMS',
    'Запись в ваш график и напоминания',
    'Отчёт недели: возвращённые рубли',
  ];
  return (
    <div
      style={{
        width: 380, maxWidth: '100%', background: 'var(--surface)', boxShadow: 'var(--shadow-raised)',
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
        borderRadius: '16px 0 16px 16px', overflow: 'hidden',
        fontFamily: 'var(--font-body)', color: 'var(--text)', ...style,
      }}
    >
      <div style={{ background: 'var(--wine-800)', color: 'var(--ivory)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Подхват AI+</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#1C1A17', background: 'var(--gold-400)', padding: '3px 10px', clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}>14 дней бесплатно</span>
        </div>
      </div>
      <div style={{ padding: '20px 24px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span className="tnum" style={{ fontSize: 20, color: 'var(--text-secondary)', textDecoration: 'line-through', textDecorationThickness: 1.5, fontFeatureSettings: "'tnum' 1" }}>4 900 ₽</span>
          <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 1.1, fontWeight: 700, fontFeatureSettings: "'tnum' 1" }}>
            1 590<span style={{ fontWeight: 600, opacity: .85, marginLeft: '.12em' }}>₽</span>
          </span>
          <span style={{ fontSize: 16, color: 'var(--text-secondary)' }}>в месяц</span>
        </div>
        <div style={{ fontSize: 16, color: 'var(--success-text)', fontWeight: 500, marginTop: 4 }}>Окупается одной записью на чистку</div>
        <ul style={{ listStyle: 'none', margin: '18px 0 0', padding: 0, display: 'grid', gap: 10 }}>
          {feats.map((f, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 16, lineHeight: 1.4 }}>
              <Icon name="check" size={18} color="var(--success-text)" style={{ marginTop: 2 }} />
              {f}
            </li>
          ))}
        </ul>
        <Button variant="primary" size="lg" full style={{ marginTop: 20 }}>Подхватим</Button>
        <div style={{ fontSize: 16, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 12 }}>Отключить можно в любой день. Без договора на год.</div>
      </div>
    </div>
  );
}
