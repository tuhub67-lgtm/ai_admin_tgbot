import { Icon } from '../design/components/core/Icon.jsx';
import { Reveal } from '../lib/anim.jsx';
import { FOUNDER_TG, FOUNDER_TG_URL } from '../config.js';

const ITEMS = [
  { icon: 'server', title: 'Данные — в России', text: 'Серверы в РФ, работаем по 152-ФЗ. Записи разговоров и база пациентов не покидают страну.' },
  { icon: 'lock', title: 'Карточка без диагнозов', text: 'В лид попадают только повод и контакт. Диагнозы и медицинские подробности вычищаются до записи.' },
  { icon: 'report', title: 'По договору', text: 'Прозрачный договор, согласия и шаблоны документов по персональным данным — передаём при подключении.' },
  { icon: 'dialog', title: 'Российская модель GigaChat', text: 'Диалоги ведёт GigaChat от Сбера — российская модель. Данные не уходят за рубеж.' },
];

// Токены рамп (--wine-*, --gold-*, --ivory) не зависят от темы — секция тёмно-винная всегда.
const ivory = 'var(--ivory)';
const dim = 'color-mix(in srgb, var(--ivory) 72%, transparent)';
const cardBg = 'color-mix(in srgb, var(--ivory) 6%, transparent)';
const cardBorder = 'color-mix(in srgb, var(--ivory) 16%, transparent)';

export function TrustSection() {
  return (
    <section
      id="trust"
      className="section"
      style={{ background: 'var(--wine-800)', color: ivory, position: 'relative', overflow: 'hidden' }}
    >
      <div className="container" style={{ position: 'relative' }}>
        <Reveal>
          <div className="overline" style={{ color: 'var(--gold-300)' }}>Покой · почему доверяют</div>
          <h2 className="h2" style={{ marginTop: 8, color: ivory, maxWidth: 640 }}>
            Ничего не потеряно. И никуда не утекло
          </h2>
        </Reveal>

        <div className="pk-trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 30 }}>
          {ITEMS.map((it, i) => (
            <Reveal key={it.title} delay={i * 90}>
              <article style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 'var(--r-card)', padding: '22px 22px 20px', height: '100%' }}>
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-flex', width: 46, height: 46, alignItems: 'center', justifyContent: 'center',
                    color: 'var(--gold-300)', border: '1.5px solid var(--gold-700)',
                    clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)', borderRadius: '10px 0 10px 10px',
                  }}
                >
                  <Icon name={it.icon} size={24} />
                </span>
                <h3 className="h4" style={{ marginTop: 14, color: ivory }}>{it.title}</h3>
                <p style={{ fontSize: 16, lineHeight: 1.5, color: dim, marginTop: 6 }}>{it.text}</p>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Основатель лично */}
        <Reveal delay={120}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginTop: 20,
              background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 'var(--r-card)',
              padding: '22px 24px', position: 'relative',
            }}
          >
            <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'var(--gold-400)' }} />
            <span
              aria-hidden="true"
              style={{
                flex: 'none', width: 56, height: 56, borderRadius: '50%', background: 'var(--gold-400)', color: 'var(--charcoal)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22,
              }}
            >
              П
            </span>
            <div style={{ flex: '1 1 280px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: ivory }}>
                За каждым подключением — основатель, лично
              </div>
              <div style={{ fontSize: 16, color: dim, marginTop: 4 }}>
                Не колл-центр и не бот-конструктор. Если Анна ошибётся — рядом живой человек, который поправит.
              </div>
            </div>
            <a
              href={FOUNDER_TG_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
                color: 'var(--charcoal)', background: 'var(--gold-400)', fontWeight: 600, fontSize: 16,
                padding: '10px 16px', borderRadius: 'var(--r-btn)', whiteSpace: 'nowrap',
              }}
            >
              <Icon name="telegram" size={18} />
              {FOUNDER_TG}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
