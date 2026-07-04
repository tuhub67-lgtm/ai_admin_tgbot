import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../../design/components/core/Icon.jsx';
import { Section } from './Section.jsx';

/* Галочка «договорённость достигнута»: stroke-draw + одиночный pulse.
   По умолчанию нарисована (видима); анимацию рисования запускаем, когда чат
   попал во вьюпорт (один раз). */
function AgreementCheck({ play }) {
  return (
    <span
      className={`lp-agreement${play ? ' lp-pulse-once' : ''}`}
      aria-hidden="true"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, marginLeft: 8, verticalAlign: 'middle',
        background: 'var(--success-tint)', borderRadius: 'var(--r-pill)',
      }}
    >
      <svg className={play ? 'lp-check' : undefined} viewBox="0 0 24 24" width="14" height="14"
        fill="none" stroke="var(--success-text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7" />
      </svg>
    </span>
  );
}

/* Живой диалог: ночной запрос → запись на утро. Тон Анны — по DESIGN_README:
   тепло, коротко, по делу; ночью не обещает «записываю сейчас», а придерживает время. */

const chat = [
  { who: 'p', time: '00:41', text: 'Здравствуйте. Можно записаться? Зуб ноет, но терпимо.' },
  { who: 'a', text: 'Здравствуйте! Да, конечно. Подскажите, как вас зовут и к кому удобнее — терапевт или хирург?' },
  { who: 'p', text: 'Ольга. Наверное терапевт, похоже на кариес.' },
  { who: 'a', text: 'Ольга, поняла. Ближайшее удобное время — завтра утром: 9:30 или 11:00. Какое подойдёт?' },
  { who: 'p', text: 'Давайте 11:00.' },
  { who: 'a', text: 'Придержала для вас четверг, 11:00. Утром администратор подтвердит и пришлёт напоминание. Спокойной ночи!' },
];

export function LiveDialog() {
  const chatRef = useRef(null);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const el = chatRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setPlay(true); io.unobserve(el); } });
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Section bg="var(--surface)">
      <p className="lp-overline">Живой диалог</p>
      <h2 className="lp-h2">Ночью пациент не уходит к соседям</h2>
      <p className="lp-lead">Запрос пришёл в 00:41. Анна ответила, подобрала утреннее время и придержала запись — не потеряв пациента до утра.</p>

      <div
        className="facet-card"
        style={{
          background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-card)', padding: 'var(--sp-6)', maxWidth: 620, margin: 'var(--sp-6) auto 0',
        }}
      >
        <div className="lp-chat" ref={chatRef}>
          {chat.map((m, i) => {
            const isAgreement = m.who === 'a' && i === chat.length - 1;
            return (
              <div key={i} className={`lp-bubble lp-bubble--${m.who === 'a' ? 'anna' : 'patient'}`}>
                {m.who === 'a' ? (
                  <div className="lp-bubble__who" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="max" size={14} /> Анна
                  </div>
                ) : (
                  <div className="lp-bubble__who">Пациент{m.time ? ` · ${m.time}` : ''}</div>
                )}
                {m.text}
                {isAgreement ? <AgreementCheck play={play} /> : null}
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
