import React, { useState, useRef } from 'react';
import { Button } from '../../design/components/controls/Button.jsx';
import { MoneyFigure, fmtRub } from '../../design/components/money/MoneyFigure.jsx';
import { scrollToId } from './Section.jsx';
import { reachGoal } from '../../lib/analytics.js';

/* Калькулятор потерь. Формула открыто на экране («Правда требует доказательства»):
   звонки/день × %пропущ × 30 × 0,4 × средний чек. Цель calc_used — при первом движении слайдера. */

function Slider({ id, label, min, max, step, value, display, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--sp-3)' }}>
        <label htmlFor={`sl-${id}`} style={{ fontSize: 'var(--fs-body)', fontWeight: 500 }}>{label}</label>
        <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--fs-h4)', fontFeatureSettings: "'tnum' 1", whiteSpace: 'nowrap' }}>{display}</span>
      </div>
      <input
        id={`sl-${id}`}
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', marginTop: 'var(--sp-2)', height: 44, accentColor: 'var(--control-on)', cursor: 'pointer' }}
      />
    </div>
  );
}

export function LossCalculator() {
  const [calls, setCalls] = useState(20);   // звонков/день 10–100
  const [missed, setMissed] = useState(25); // пропущено % 10–40, деф. 25
  const [check, setCheck] = useState(6000); // средний чек 3 000–15 000 ₽
  const used = useRef(false);

  const markUsed = () => { if (!used.current) { used.current = true; reachGoal('calc_used'); } };
  const bind = (setter) => (v) => { markUsed(); setter(v); };

  // звонки × %пропущ × 30 дней × 0,4 (доля ушедших) × чек
  const lostPatients = calls * (missed / 100) * 30 * 0.4;
  const loss = Math.round((lostPatients * check) / 100) * 100;

  return (
    <div
      className="facet-card"
      style={{
        background: 'var(--surface)', boxShadow: 'var(--shadow-raised)',
        borderRadius: 'var(--r-card)', padding: 'var(--sp-6)', maxWidth: 620, margin: '0 auto',
      }}
    >
      <div style={{ display: 'grid', gap: 'var(--sp-6)' }}>
        <Slider id="calls" label="Звонков в день" min={10} max={100} step={5} value={calls} display={String(calls)} onChange={bind(setCalls)} />
        <Slider id="missed" label="Из них пропущено" min={10} max={40} step={5} value={missed} display={`${missed}%`} onChange={bind(setMissed)} />
        <Slider id="check" label="Средний чек" min={3000} max={15000} step={500} value={check} display={`${fmtRub(check)} ₽`} onChange={bind(setCheck)} />
      </div>

      <div
        style={{
          marginTop: 'var(--sp-6)', padding: 'var(--sp-5)', borderRadius: 'var(--r-card-sm)',
          background: 'var(--urgent-tint)',
        }}
      >
        <div className="lp-overline" style={{ color: 'var(--urgent-text)' }}>Мимо кассы в месяц</div>
        <div style={{ marginTop: 'var(--sp-2)' }}>
          <MoneyFigure value={loss} size="lg" sub="уходит к соседям, пока звонки остаются без ответа" />
        </div>
        <p className="tnum" style={{ margin: 'var(--sp-3) 0 0', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', fontFeatureSettings: "'tnum' 1" }}>
          {calls} звонков × {missed}% × 30 дней × 0,4 × {fmtRub(check)} ₽
        </p>
      </div>

      <Button variant="primary" size="lg" full icon="return" style={{ marginTop: 'var(--sp-5)' }} onClick={() => scrollToId('lead')}>
        Вернуть их — подключить клинику
      </Button>
    </div>
  );
}
