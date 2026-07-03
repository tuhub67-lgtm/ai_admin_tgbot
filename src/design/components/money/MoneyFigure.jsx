import React, { useEffect, useRef, useState } from 'react';

/* «Денежная цифра» — стиль системы: очень крупно, Golos Text, табличные цифры,
   знак ₽ встроен (чуть легче цифры). Главная цифра экрана видна за 1 секунду. */

const SIZES = {
  xl: { fontSize: 72, mobile: 56, lineHeight: 1.05, tracking: '-0.02em' },
  lg: { fontSize: 44, mobile: 44, lineHeight: 1.1, tracking: '-0.01em' },
  md: { fontSize: 28, mobile: 28, lineHeight: 1.15, tracking: '0' },
};

export function fmtRub(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

export function MoneyFigure({ value = 0, size = 'xl', label, sub, color = 'default', animate = false, mobile = false, style }) {
  const s = SIZES[size] || SIZES.xl;
  const [shown, setShown] = useState(animate ? 0 : value);
  const raf = useRef();

  useEffect(() => {
    if (!animate || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) { setShown(value); return; }
    const t0 = performance.now(), dur = 600, from = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      setShown(from + (value - from) * e);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, animate]);

  const col = color === 'gold' ? 'var(--text-gold-large)' : color === 'onBrand' ? 'var(--gold-400)' : 'var(--text)';

  return (
    <div style={{ fontFamily: 'var(--font-display)', ...style }}>
      {label ? <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div> : null}
      <div className="tnum" style={{ fontSize: mobile ? s.mobile : s.fontSize, lineHeight: s.lineHeight, letterSpacing: s.tracking, fontWeight: 700, color: col, fontFeatureSettings: "'tnum' 1, 'lnum' 1", fontVariantNumeric: 'tabular-nums lining-nums', whiteSpace: 'nowrap' }}>
        {fmtRub(shown)}<span style={{ fontWeight: 600, opacity: .85, marginLeft: '.12em' }}>₽</span>
      </div>
      {sub ? <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</div> : null}
    </div>
  );
}
