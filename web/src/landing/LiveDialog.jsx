import { motion, useReducedMotion } from 'motion/react';
import { Icon } from '../design/components/core/Icon.jsx';
import { Reveal, useInView } from '../lib/anim.jsx';

const MSGS = [
  { who: 'p', t: '02:07', text: 'Здравствуйте, можно записаться на чистку? Звонила вечером — не дозвонилась.' },
  { who: 'a', t: '02:07', text: 'Здравствуйте! Конечно, запишу на профгигиену. Вам удобнее утром или во второй половине дня?' },
  { who: 'p', t: '02:08', text: 'Лучше утром, до работы.' },
  { who: 'a', t: '02:08', text: 'Есть четверг 9:30 и пятница 8:45. Какой вариант берём?' },
  { who: 'p', t: '02:08', text: 'Четверг 9:30 подойдёт.' },
  { who: 'a', t: '02:09', text: 'Записала. Как вас зовут и на какой номер прислать напоминание?' },
  { who: 'p', t: '02:09', text: 'Ольга, +7 912 345-67-89' },
  { who: 'a', t: '02:09', text: 'Готово, Ольга. Ждём в четверг в 9:30 — напоминание пришлю накануне.' },
];

function Bubble({ m, shown, delay, reduced }) {
  const isAnna = m.who === 'a';
  return (
    <div
      style={{
        display: 'flex', gap: 10, justifyContent: isAnna ? 'flex-start' : 'flex-end',
        opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(10px)',
        transition: reduced ? 'none' : 'opacity 420ms cubic-bezier(.16,1,.3,1), transform 420ms cubic-bezier(.16,1,.3,1)',
        transitionDelay: reduced ? '0ms' : `${delay}ms`,
      }}
    >
      {isAnna && (
        <span aria-hidden="true" style={{
          flex: 'none', width: 30, height: 30, borderRadius: '50%', background: 'var(--wine-800)', color: 'var(--gold-300)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, alignSelf: 'flex-end',
        }}>А</span>
      )}
      <div
        style={{
          maxWidth: '78%', padding: '10px 13px', fontSize: 16, lineHeight: 1.45,
          borderRadius: isAnna ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
          background: isAnna ? 'var(--surface-subtle)' : 'var(--wine-800)',
          color: isAnna ? 'var(--text)' : 'var(--ivory)',
          border: isAnna ? '1px solid var(--border)' : 'none',
        }}
      >
        {isAnna && <strong style={{ fontWeight: 600 }}>Анна: </strong>}
        {m.text}
        <span style={{ display: 'block', fontSize: 12, marginTop: 4, opacity: .6 }}>{m.t}</span>
      </div>
    </div>
  );
}

function BookedStamp({ play, reduced }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 6,
        padding: '12px 14px', background: 'var(--success-tint)', borderRadius: 'var(--r-card-sm)',
        opacity: play ? 1 : 0, transform: play ? 'none' : 'translateY(10px)',
        transition: reduced ? 'none' : 'opacity 420ms ease, transform 420ms ease',
        transitionDelay: reduced ? '0ms' : `${MSGS.length * 240 + 120}ms`,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 16, fontWeight: 600, color: 'var(--success-text)' }}>
        <motion.span
          initial={false}
          animate={play ? { scale: [1, 1.18, 1] } : {}}
          transition={reduced ? { duration: 0 } : { delay: MSGS.length * 0.24 + 0.35, duration: 0.5, times: [0, 0.5, 1] }}
          style={{ display: 'inline-flex' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" role="img" aria-label="записан">
            <circle cx="12" cy="12" r="11" fill="var(--success)" />
            <motion.path
              d="M6.5 12.4l3.5 3.5 7-7.4"
              fill="none" stroke="var(--ivory)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
              initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
              animate={play ? { pathLength: 1 } : { pathLength: reduced ? 1 : 0 }}
              transition={reduced ? { duration: 0 } : { delay: MSGS.length * 0.24 + 0.2, duration: 0.4, ease: 'easeInOut' }}
            />
          </svg>
        </motion.span>
        Пациент записан · профгигиена, чт 9:30
      </span>
      <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-gold)', whiteSpace: 'nowrap' }}>
        +4 500&nbsp;<span style={{ fontWeight: 600, opacity: .85 }}>₽</span>
      </span>
    </div>
  );
}

export function LiveDialog() {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView({ threshold: 0.25 });
  const play = inView || reduced;

  return (
    <section id="dialog" className="section" style={{ background: 'var(--surface-subtle)' }}>
      <div className="container pk-dialog-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.9fr) minmax(320px,1fr)', gap: 48, alignItems: 'center' }}>
        <Reveal>
          <div>
            <div className="overline" style={{ color: 'var(--text-secondary)' }}>Живой диалог</div>
            <h2 className="h2" style={{ marginTop: 8, maxWidth: 440 }}>Ночной запрос — запись на утро</h2>
            <p className="body-lg caption" style={{ marginTop: 14, maxWidth: 460 }}>
              Пока клиника спит, Анна ведёт пациента тёплым и коротким тоном: понимает запрос,
              предлагает конкретные слоты, записывает и подтверждает. Никакого «перезвоните в рабочее время».
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', display: 'grid', gap: 12 }}>
              {[
                'Отвечает за 30 секунд, круглосуточно',
                'Только реальные слоты из вашего графика',
                'Цены — диапазоном, точную назовёт врач',
              ].map((t) => (
                <li key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 16 }}>
                  <Icon name="check" size={20} color="var(--success-text)" style={{ marginTop: 1 }} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div
            ref={ref}
            style={{
              background: 'var(--surface)', boxShadow: 'var(--shadow-raised)', borderRadius: 'var(--r-card)',
              padding: 20, display: 'grid', gap: 10, maxWidth: 440, marginLeft: 'auto', width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <Icon name="telegram" size={20} color="var(--wine-800)" />
              <span style={{ fontWeight: 600 }}>Диалог с пациентом</span>
              <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--text-secondary)' }}>сегодня, ночь</span>
            </div>
            {MSGS.map((m, i) => (
              <Bubble key={i} m={m} shown={play} delay={i * 240} reduced={reduced} />
            ))}
            <BookedStamp play={play} reduced={reduced} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
