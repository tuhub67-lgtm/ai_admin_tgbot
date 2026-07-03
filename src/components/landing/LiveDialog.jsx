import React from 'react';
import { Icon } from '../../design/components/core/Icon.jsx';
import { Section } from './Section.jsx';

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
  return (
    <Section>
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
        <div className="lp-chat">
          {chat.map((m, i) => (
            <div key={i} className={`lp-bubble lp-bubble--${m.who === 'a' ? 'anna' : 'patient'}`}>
              {m.who === 'a' ? (
                <div className="lp-bubble__who" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="max" size={14} /> Анна
                </div>
              ) : (
                <div className="lp-bubble__who">Пациент{m.time ? ` · ${m.time}` : ''}</div>
              )}
              {m.text}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
