import React from 'react';

/* Обёртка секции лендинга: фон + вертикальные отступы + контейнер по центру. */
export function Section({ id, bg, tight, containerStyle, children, style }) {
  return (
    <section id={id} style={{ background: bg || 'var(--bg)', ...style }}>
      <div
        className={`lp-container lp-section${tight ? ' lp-section--tight' : ''}`}
        style={containerStyle}
      >
        {children}
      </div>
    </section>
  );
}

// Плавная прокрутка к якорю (учитывает sticky-шапку через scroll-margin в CSS).
export function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
