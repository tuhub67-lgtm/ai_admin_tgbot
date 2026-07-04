import React from 'react';

/* Медведь-знак линией — упрощённый контур логотипа для пустых состояний,
   обложек и водяных знаков. Гранёная геометрия, miter, квадратные окончания.
   НЕ замена логотипу: в шапках и на плашках — только утверждённые тайлы assets/logo-tile-*.png */

const L = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'square', strokeLinejoin: 'miter' };

export function BearMark({ size = 96, strokeWidth = 3, detail = true, style }) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} role="presentation" style={{ display: 'block', flex: 'none', ...style }} {...L} strokeWidth={strokeWidth}>
      {/* внешний контур: уши + гранёная морда */}
      <polygon points="48,90 27,77 13,52 17,29 23,10 37,7 40,19 48,16 56,19 59,7 73,10 79,29 83,52 69,77" />
      {detail ? (
        <g>
          {/* глаза — угловые клинья к переносице */}
          <polygon fill="currentColor" stroke="none" points="29,41 43,38 40,46 31,45" />
          <polygon fill="currentColor" stroke="none" points="67,41 53,38 56,46 65,45" />
          {/* нос-пятиугольник + подбородочная линия */}
          <polygon points="41,55 55,55 57,62 48,70 39,62" />
          <path d="M48 70v7" />
          {/* фацетные штрихи скул — вторая толщина линии */}
          <path d="M22 51l9 8M74 51l-9 8" strokeWidth={strokeWidth * 0.75} />
        </g>
      ) : null}
    </svg>
  );
}

/* Солярный медальон линией — ТОЛЬКО пустые состояния и обложки, прозрачность 4–6% */
export function OrnamentSolar({ size = 240, strokeWidth = 1.5, style }) {
  return (
    <svg viewBox="0 0 240 240" width={size} height={size} role="presentation" style={{ display: 'block', flex: 'none', ...style }} {...L} strokeWidth={strokeWidth}>
      <circle cx="120" cy="120" r="22" />
      <circle cx="120" cy="120" r="8" />
      <g>
        <line x1="120" y1="86" x2="120" y2="66" /><line x1="120" y1="174" x2="120" y2="154" />
        <line x1="86" y1="120" x2="66" y2="120" /><line x1="174" y1="120" x2="154" y2="120" />
        <line x1="96" y1="96" x2="82" y2="82" /><line x1="144" y1="144" x2="158" y2="158" />
        <line x1="144" y1="96" x2="158" y2="82" /><line x1="96" y1="144" x2="82" y2="158" />
        <line x1="103" y1="88" x2="95" y2="73" /><line x1="137" y1="88" x2="145" y2="73" />
        <line x1="103" y1="152" x2="95" y2="167" /><line x1="137" y1="152" x2="145" y2="167" />
        <line x1="88" y1="103" x2="73" y2="95" /><line x1="88" y1="137" x2="73" y2="145" />
        <line x1="152" y1="103" x2="167" y2="95" /><line x1="152" y1="137" x2="167" y2="145" />
      </g>
      <polygon points="120,34 180,58 206,120 180,182 120,206 60,182 34,120 60,58" />
      <g strokeWidth={strokeWidth * 1.33}>
        <line x1="120" y1="24" x2="120" y2="14" /><line x1="120" y1="226" x2="120" y2="216" />
        <line x1="24" y1="120" x2="14" y2="120" /><line x1="226" y1="120" x2="216" y2="120" />
      </g>
      <polygon points="120,110 130,120 120,130 110,120" />
    </svg>
  );
}
