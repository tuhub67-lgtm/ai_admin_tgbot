import React, { useEffect, useRef, useState } from 'react';
import { MoneyFigure, fmtRub } from '../../design/components/money/MoneyFigure.jsx';

/* Счёт от 0 до value (rAF, ease-out), запуск по появлению во вьюпорте (один раз);
   при обновлении value — доанимация + «бамп» (brightness+scale) и опц. частицы.
   При prefers-reduced-motion / без IntersectionObserver — сразу финальное значение. */

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animate(from, to, dur, onUpdate) {
  if (prefersReduced() || dur <= 0 || from === to) { onUpdate(to); return () => {}; }
  let raf;
  const t0 = performance.now();
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3); // ease-out
    onUpdate(from + (to - from) * e);
    if (p < 1) raf = requestAnimationFrame(tick);
    else onUpdate(to);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

/* Общее ядро count-up. Возвращает display + управление бампом/частицами + ref для IO. */
export function useCountUp(value, { particles = false } = {}) {
  const [display, setDisplay] = useState(0);
  const [bumped, setBumped] = useState(false);
  const [burst, setBurst] = useState(0);
  const started = useRef(false);
  const prev = useRef(0);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;
    const run = () => { started.current = true; prev.current = value; animate(0, value, 600, setDisplay); };
    if (!('IntersectionObserver' in window)) { run(); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting && !started.current) { run(); io.unobserve(el); } });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!started.current || value === prev.current) return;
    const from = prev.current;
    prev.current = value;
    const stop = animate(from, value, 500, setDisplay);
    if (!prefersReduced()) {
      setBumped(false);
      requestAnimationFrame(() => setBumped(true));
      if (particles && value > from) setBurst((b) => b + 1);
    }
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return { display, bumped, burst, ref, onAnimationEnd: () => setBumped(false) };
}

// 10 частиц — детерминированный разлёт (без Math.random)
const PARTICLES = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  return { tx: Math.round(Math.cos(a) * 34), ty: Math.round(Math.sin(a) * 34 - 8), d: (i % 5) * 28 };
});

/* Денежная цифра-обёртка вокруг read-only MoneyFigure (его animate выключен).
   aria-label с ФИНАЛЬНОЙ суммой сразу; тикающая цифра — aria-hidden. */
export function AnimatedMoney({ value = 0, size = 'lg', label, sub, color = 'gold', mobile, particles = false, style }) {
  const { display, bumped, burst, ref, onAnimationEnd } = useCountUp(value, { particles });
  return (
    <span
      ref={ref}
      className={`lp-money${bumped ? ' is-bumped' : ''}`}
      role="img"
      aria-label={`${label ? label + ': ' : ''}${fmtRub(value)} ₽`}
      style={style}
      onAnimationEnd={onAnimationEnd}
    >
      <span aria-hidden="true">
        <MoneyFigure value={display} size={size} label={label} sub={sub} color={color} animate={false} mobile={mobile} />
      </span>
      {particles && burst > 0 && !prefersReduced() ? (
        <svg key={burst} className="lp-particles" viewBox="-50 -50 100 100" aria-hidden="true">
          {PARTICLES.map((p, i) => (
            <circle key={i} cx="0" cy="0" r="2.4" fill="var(--gold-400)"
              style={{ '--tx': `${p.tx}px`, '--ty': `${p.ty}px`, animationDelay: `${p.d}ms` }} />
          ))}
        </svg>
      ) : null}
    </span>
  );
}
