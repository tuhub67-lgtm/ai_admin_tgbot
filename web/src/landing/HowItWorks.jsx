import { Icon } from '../design/components/core/Icon.jsx';
import { Reveal } from '../lib/anim.jsx';

const STEPS = [
  {
    icon: 'call-missed',
    n: '1',
    title: 'Пропущенный звонок',
    text: 'Пациент не дозвонился. Обычно он набирает соседнюю клинику — и уже не возвращается.',
  },
  {
    icon: 'dialog',
    n: '2',
    title: 'Анна пишет за 30 секунд',
    text: 'В MAX, Telegram или SMS. Тёплый короткий диалог, 2–3 удобных слота, запись — круглосуточно.',
  },
  {
    icon: 'report',
    n: '3',
    title: 'Карточка и отчёт в рублях',
    text: 'Лид падает вам в кабинет и Telegram. В конце недели видно, сколько рублей Анна вернула.',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="section" style={{ background: 'var(--bg)' }}>
      <div className="container">
        <Reveal>
          <div className="overline" style={{ color: 'var(--text-secondary)' }}>Как работает</div>
          <h2 className="h2" style={{ marginTop: 8, maxWidth: 640 }}>Три шага — и пациент записан, пока клиника спит</h2>
        </Reveal>

        <div className="pk-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 32, alignItems: 'stretch' }}>
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 110} style={{ display: 'flex' }}>
              <article
                style={{
                  position: 'relative', flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-card)', padding: '26px 24px 24px', boxShadow: 'var(--shadow-card)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-flex', width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
                    background: 'var(--wine-800)', color: 'var(--gold-300)',
                    clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)',
                    borderRadius: '12px 0 12px 12px',
                  }}
                >
                  <Icon name={s.icon} size={26} />
                </span>
                <div
                  className="tnum"
                  style={{
                    position: 'absolute', top: 22, right: 24, fontFamily: 'var(--font-display)',
                    fontSize: 40, fontWeight: 800, lineHeight: 1, color: 'var(--neutral-200)',
                  }}
                >
                  {s.n}
                </div>
                <h3 className="h4" style={{ marginTop: 16 }}>{s.title}</h3>
                <p className="caption" style={{ fontSize: 16, lineHeight: 1.5, marginTop: 8 }}>{s.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
