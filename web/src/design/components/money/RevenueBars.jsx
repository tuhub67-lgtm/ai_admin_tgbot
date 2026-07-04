import React from 'react';
import { fmtRub } from './MoneyFigure.jsx';

/* График «возвращено ₽» по дням. Плоские золотые столбцы, без градиентов.
   Выделенный день — фацетный срез верхнего правого угла (единственный фацет в поле зрения)
   и чип со значением. День окупаемости — маркер-ромб под подписью. */

export function RevenueBars({
  data = [], height = 150, highlightIndex = -1, paybackIndex = -1, style,
}) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div style={{ fontFamily: 'var(--font-body)', ...style }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: height + 40 }}>
        {data.map((d, i) => {
          const hl = i === highlightIndex;
          const h = d.value === 0 ? 4 : Math.max(10, Math.round((d.value / max) * height));
          return (
            <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-end', gap: 6 }}>
              {hl ? (
                <div className="tnum" style={{ alignSelf: 'center', padding: '3px 8px', background: 'var(--text)', color: 'var(--bg)', borderRadius: 6, fontSize: 16, fontWeight: 600, fontFeatureSettings: "'tnum' 1", whiteSpace: 'nowrap' }}>
                  {fmtRub(d.value)}&nbsp;₽
                </div>
              ) : null}
              <div
                style={{
                  height: h,
                  background: d.value === 0 ? 'var(--border)' : hl ? 'var(--gold-500)' : 'var(--gold-400)',
                  borderRadius: hl ? 0 : '4px 4px 0 0',
                  clipPath: hl ? 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' : undefined,
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 16, color: i === highlightIndex ? 'var(--text)' : 'var(--text-secondary)', fontWeight: i === highlightIndex ? 600 : 400 }}>
            {d.label}
            {i === paybackIndex ? (
              <svg viewBox="0 0 10 10" width="10" height="10" style={{ display: 'block', margin: '3px auto 0' }} aria-label="день окупаемости">
                <polygon points="5,0 10,5 5,10 0,5" fill="var(--control-on)" />
              </svg>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
