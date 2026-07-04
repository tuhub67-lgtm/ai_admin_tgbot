import { Button } from '../design/components/controls/Button.jsx';
import { Icon } from '../design/components/core/Icon.jsx';
import { Reveal } from '../lib/anim.jsx';

const CHIPS = [
  { icon: 'shield', label: '152-ФЗ' },
  { icon: 'server', label: 'Данные — в России' },
  { icon: 'clock', label: 'Ответ за 30 секунд' },
];

function scrollTo(id) {
  return (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}

export function Hero() {
  return (
    <section id="top" style={{ background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden' }}>
      <div
        className="container pk-hero-grid"
        style={{
          display: 'grid', gridTemplateColumns: 'minmax(0, 1.08fr) minmax(320px, .92fr)',
          gap: 56, alignItems: 'center', padding: '64px 24px 80px',
        }}
      >
        {/* Левая колонка — оркестрованный каскад */}
        <div>
          <Reveal delay={0}>
            <div className="overline" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--wine-800)' }}>
              <span aria-hidden="true" style={{ width: 22, height: 4, background: 'var(--gold-400)' }} />
              ИИ-администратор для стоматологии
            </div>
          </Reveal>

          <Reveal delay={90} as="h1"
            style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(34px, 5vw, 52px)', lineHeight: 1.08,
              fontWeight: 800, letterSpacing: '-0.01em', margin: '18px 0 0', maxWidth: 620, textWrap: 'balance',
            }}
          >
            Клиника теряет{' '}
            <span style={{ color: 'var(--wine-800)', whiteSpace: 'nowrap' }}>100–150&nbsp;тыс.&nbsp;₽</span>{' '}
            в месяц на пропущенных звонках. Подхват&nbsp;AI+ возвращает этих пациентов
          </Reveal>

          <Reveal delay={170} as="p"
            style={{ fontSize: 'var(--fs-body-lg)', lineHeight: 1.55, color: 'var(--text-secondary)', margin: '20px 0 0', maxWidth: 540 }}
          >
            Анна отвечает за 30 секунд — в MAX, SMS и Telegram, круглосуточно.
            Доводит пациента до записи и показывает каждый возвращённый рубль.
          </Reveal>

          <Reveal delay={250}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 30 }}>
              <a href="#lead" onClick={scrollTo('lead')} style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="lg" icon="return">Подключить клинику</Button>
              </a>
              <a href="#calc" onClick={scrollTo('calc')} style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="lg" icon="ruble">Посчитать мои потери</Button>
              </a>
            </div>
          </Reveal>

          <Reveal delay={330}>
            <ul style={{ display: 'flex', gap: '12px 24px', flexWrap: 'wrap', listStyle: 'none', padding: 0, margin: '30px 0 0' }}>
              {CHIPS.map((c) => (
                <li key={c.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 16, color: 'var(--text-secondary)' }}>
                  <Icon name={c.icon} size={18} color="var(--success-text)" />
                  {c.label}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Правая колонка — карточка-превью «Анна подхватила» */}
        <Reveal delay={210}>
          <HeroPreview />
        </Reveal>
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div
      style={{
        position: 'relative', background: 'var(--surface)', boxShadow: 'var(--shadow-raised)',
        clipPath: 'polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 0 100%)',
        borderRadius: '16px 0 16px 16px', padding: '22px 22px 20px', color: 'var(--text)',
      }}
    >
      {/* Строка «пропущенный» */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--urgent-text)', fontSize: 16, fontWeight: 600 }}>
        <Icon name="call-missed" size={20} color="var(--urgent)" />
        Пропущенный звонок · 02:14
      </div>

      {/* Реплика Анны */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16, padding: '12px 14px', background: 'var(--surface-subtle)', borderRadius: 'var(--r-card-sm)' }}>
        <span aria-hidden="true" style={{
          flex: 'none', width: 34, height: 34, borderRadius: '50%', background: 'var(--wine-800)', color: 'var(--gold-300)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
        }}>А</span>
        <div style={{ fontSize: 16, lineHeight: 1.45 }}>
          <strong style={{ fontWeight: 600 }}>Анна:</strong> Здравствуйте! Вы звонили в «Демо-Дент».
          Подскажу свободное время — вам удобнее утром или вечером?
        </div>
      </div>

      {/* Итог: записан + возвращено */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 16, fontWeight: 600,
          color: 'var(--success-text)', background: 'var(--success-tint)', padding: '6px 12px', borderRadius: 'var(--r-badge)',
        }}>
          <Icon name="check" size={18} />Записан на чистку · чт 09:30
        </span>
        <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text-gold)' }}>
          +6 000&nbsp;<span style={{ fontWeight: 600, opacity: .85 }}>₽</span>
        </span>
      </div>

      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 15, color: 'var(--text-secondary)' }}>
        Пациент вернулся, пока клиника спала.
      </div>
    </div>
  );
}
