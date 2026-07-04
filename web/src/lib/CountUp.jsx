import { useEffect, useRef, useState } from 'react';
import { useInView } from './anim.jsx';

/* «Золотой динг» + count-up для денежных сумм.
   - Число считается от 0 до value через requestAnimationFrame, запуск один раз по IntersectionObserver.
   - Доступность: aria-label с финальной суммой сразу; анимированное число aria-hidden
     (скринридер читает итог, а не мельтешение). НЕ @property.
   - В конце — короткая золотая вспышка яркости (класс .pk-ding).
   - prefers-reduced-motion: сразу показываем финал, без анимации. */

function formatRub(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function CountUp({
  value = 0,
  duration = 900,
  prefix = '',
  suffix = ' ₽',
  className = '',
  style,
  ariaLabel,
}) {
  const [ref, inView] = useInView({ threshold: 0.25 });
  const [shown, setShown] = useState(0);
  const [ding, setDing] = useState(false);
  const raf = useRef(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Уже отыграли (или reduce-motion) → число следует за value вживую (слайдеры калькулятора).
    if (reduce || started.current) { setShown(value); return; }
    started.current = true;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(value * eased);
      if (p < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        setShown(value);
        setDing(true);
        setTimeout(() => setDing(false), 700);
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [inView, value, duration]);

  const label = ariaLabel ?? `${prefix}${formatRub(value)}${suffix.trim()}`;

  return (
    <span
      ref={ref}
      className={`tnum ${ding ? 'pk-ding' : ''} ${className}`.trim()}
      style={style}
      aria-label={label}
      role="text"
    >
      <span aria-hidden="true">
        {prefix}
        {formatRub(shown)}
        <span className="money-rub">{suffix}</span>
      </span>
    </span>
  );
}
