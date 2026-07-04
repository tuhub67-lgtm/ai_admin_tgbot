import React from 'react';

/* Обёртка вокруг read-only Button: hover scale+золотое свечение, active scale.
   Дизайн-компонент не трогаем — анимируем span-обёртку (её inline-стили не мешают). */
export function CtaGlow({ full = false, children, style }) {
  return (
    <span className={`lp-cta${full ? ' lp-cta--full' : ''}`} style={style}>
      {children}
    </span>
  );
}
