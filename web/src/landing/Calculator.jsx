import { useMemo, useState } from 'react';
import { Button } from '../design/components/controls/Button.jsx';
import { Icon } from '../design/components/core/Icon.jsx';
import { Reveal } from '../lib/anim.jsx';
import { CountUp } from '../lib/CountUp.jsx';

function fmt(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function Slider({ id, label, value, min, max, step, display, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <label htmlFor={id} style={{ fontSize: 16, fontWeight: 500 }}>{label}</label>
        <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>{display}</span>
      </div>
      <input
        id={id}
        className="pk-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={display}
      />
    </div>
  );
}

export function Calculator() {
  const [calls, setCalls] = useState(15);
  const [missed, setMissed] = useState(25);
  const [check, setCheck] = useState(6000);

  // Формула (meta): звонки/день × %пропущенных × 30 дней × 0.4 × средний чек
  const loss = useMemo(() => calls * (missed / 100) * 30 * 0.4 * check, [calls, missed, check]);

  function scrollToLead(e) {
    e.preventDefault();
    document.getElementById('lead')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section id="calc" className="section" style={{ background: 'var(--surface-subtle)' }}>
      <div className="container">
        <Reveal>
          <div className="overline" style={{ color: 'var(--text-secondary)' }}>Прибыль</div>
          <h2 className="h2" style={{ marginTop: 8, maxWidth: 640 }}>Посчитайте, сколько уносят пропущенные</h2>
          <p className="body-lg caption" style={{ marginTop: 12, maxWidth: 620 }}>
            Правда требует доказательства — вот открытая математика, без сносок мелким шрифтом.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div
            className="pk-calc-grid"
            style={{
              display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 32, marginTop: 28,
              background: 'var(--surface)', boxShadow: 'var(--shadow-raised)',
              clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)',
              borderRadius: '16px 0 16px 16px', padding: 28,
            }}
          >
            {/* Контролы */}
            <div style={{ display: 'grid', gap: 22, alignContent: 'start' }}>
              <Slider id="calc-calls" label="Звонков в день" value={calls} min={10} max={100} step={1}
                display={fmt(calls)} onChange={setCalls} />
              <Slider id="calc-missed" label="Пропущенных" value={missed} min={10} max={40} step={1}
                display={`${missed}%`} onChange={setMissed} />
              <Slider id="calc-check" label="Средний чек" value={check} min={3000} max={15000} step={500}
                display={`${fmt(check)} ₽`} onChange={setCheck} />
              <div style={{ display: 'flex', gap: 8, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.45, marginTop: 2 }}>
                <Icon name="report" size={18} style={{ marginTop: 1, flex: 'none' }} color="var(--text-secondary)" />
                <span>
                  {fmt(calls)} звонков × {missed}% пропущенных × 30 дней × 40% ушедших к соседям × {fmt(check)}&nbsp;₽
                </span>
              </div>
            </div>

            {/* Итог */}
            <div
              style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                background: 'var(--urgent-tint)', borderRadius: 'var(--r-card)', padding: '28px 26px',
              }}
            >
              <div className="overline" style={{ color: 'var(--urgent-text)' }}>Вы теряете</div>
              <CountUp
                value={loss}
                duration={1000}
                prefix={'≈ '}
                className="pk-loss"
                style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--urgent-text)',
                  fontSize: 'clamp(40px, 7vw, 60px)', lineHeight: 1.05, letterSpacing: '-0.02em',
                  marginTop: 6, display: 'block',
                }}
                ariaLabel={`Вы теряете примерно ${fmt(loss)} рублей в месяц`}
              />
              <div style={{ fontSize: 18, color: 'var(--urgent-text)', fontWeight: 500, marginTop: 2 }}>≈ в месяц</div>
              <a href="#lead" onClick={scrollToLead} style={{ textDecoration: 'none', marginTop: 22 }}>
                <Button variant="primary" size="lg" full icon="return">Вернуть их</Button>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
