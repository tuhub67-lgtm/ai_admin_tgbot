import React from 'react';

/* Подхват AI+ — фирменный сет иконок: 24px, штрих 2px, квадратные окончания,
   miter-углы, гранёные срезы 45° — геометрия логотипа. */

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'square', strokeLinejoin: 'miter' };

const GLYPHS = {
  call: <path d="M5 4h4l1.5 4.5-2.2 1.8c1.3 2.7 2.7 4.1 5.4 5.4l1.8-2.2L20 15v4l-1.5 1.5C11 20 4 13 3.5 5.5L5 4z" />,
  'call-missed': (
    <g>
      <path d="M5 7.5l1 4.3c1.6 4.4 5 7.3 9.7 8.2l4.3.5 1.5-3.5-4.5-1.5-1.8 2.2c-2.7-1.3-4.1-2.7-5.4-5.4l2.2-1.8L10.5 6 7 6.5 5 7.5z" />
      <path d="M14.5 3l6 6M20.5 3l-6 6" />
    </g>
  ),
  patient: (
    <g>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M4.5 20l.7-3 3-2.5h7.6l3 2.5.7 3" />
    </g>
  ),
  booking: (
    <g>
      <path d="M4 5.5h13l3 3v11.5H4z" />
      <path d="M8 3v4M16 3v4M4 10.5h16" />
      <path d="M9.3 15.5l2 2 3.8-4.2" />
    </g>
  ),
  ruble: (
    <g>
      <path d="M9.5 20V4h5l2.5 2.5v3L14.5 12h-5" />
      <path d="M7 15.5h7.5" />
    </g>
  ),
  report: (
    <g>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v3h3" />
      <path d="M9.5 17v-3M12.5 17v-6.5M15.5 17v-4.5" />
    </g>
  ),
  settings: (
    <g>
      <polygon points="9.2,3.5 14.8,3.5 20.5,9.2 20.5,14.8 14.8,20.5 9.2,20.5 3.5,14.8 3.5,9.2" />
      <circle cx="12" cy="12" r="3" />
    </g>
  ),
  max: (
    <g>
      <path d="M4 4h13l3 3v9h-7.5L8 20v-4H4z" />
      <path d="M8.5 12.5V7.5l3.5 3 3.5-3v5" />
    </g>
  ),
  telegram: (
    <g>
      <path d="M21 3.5L3.5 10.5l6 2.5 2 6.5 3.2-4.6L21 3.5z" />
      <path d="M9.5 13L21 3.5" />
    </g>
  ),
  sms: (
    <g>
      <path d="M4 4h16v12h-9l-4 3.5V16H4z" />
      <path d="M8 8.5h8M8 11.5h5" />
    </g>
  ),
  shield: (
    <g>
      <path d="M12 3l7 2.5V12l-7 9-7-9V5.5L12 3z" />
      <path d="M9 10.5l2.2 2.2 4.3-4.7" />
    </g>
  ),
  clock: (
    <g>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.5 2" />
    </g>
  ),
  urgent: (
    <g>
      <path d="M12 2.8L21.2 12 12 21.2 2.8 12 12 2.8z" />
      <path d="M12 8v5M12 16v1" />
    </g>
  ),
  check: <path d="M4.5 12.8l4.7 4.7L19.5 7" />,
  dialog: (
    <g>
      <path d="M4 4h16v12h-8.5L7 19.5V16H4z" />
      <g fill="currentColor" stroke="none">
        <rect x="7.2" y="9" width="2" height="2" />
        <rect x="11" y="9" width="2" height="2" />
        <rect x="14.8" y="9" width="2" height="2" />
      </g>
    </g>
  ),
  return: (
    <g>
      <path d="M19 5v8H8" />
      <path d="M11.5 9.5L8 13l3.5 3.5" />
    </g>
  ),
  bell: (
    <g>
      <path d="M12 3.5l3.5 2 .7 5.5 2.3 4.5h-13l2.3-4.5.7-5.5 3.5-2z" />
      <path d="M10.5 19h3" />
    </g>
  ),
  search: (
    <g>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5.5 5.5" />
    </g>
  ),
  server: (
    <g>
      <path d="M4 4h13l3 3v4H4z" />
      <path d="M4 13h16v7H4z" />
      <path d="M7 7.5h2M7 16.5h2" />
    </g>
  ),
  lock: (
    <g>
      <path d="M5 10h14v10H5z" />
      <path d="M8 10V6.5L9.5 4h5L16 6.5V10" />
      <path d="M12 14v3" />
    </g>
  ),
};

export const ICON_NAMES = Object.keys(GLYPHS);

export function Icon({ name, size = 24, color, strokeWidth = 2, title, style }) {
  const glyph = GLYPHS[name];
  if (!glyph) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      style={{ display: 'block', flex: 'none', color: color || 'currentColor', ...style }}
      {...S}
      strokeWidth={strokeWidth}
    >
      {glyph}
    </svg>
  );
}
