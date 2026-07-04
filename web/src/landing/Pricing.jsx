import { Button } from '../design/components/controls/Button.jsx';
import { Icon } from '../design/components/core/Icon.jsx';
import { Reveal } from '../lib/anim.jsx';

const PILOT_FEATS = [
  'Полная работа Анны 14 дней',
  'Подхват пропущенных круглосуточно',
  'Настройка под вашу клинику и график',
  'Отчёт в рублях — видно, окупилось ли',
];
const SUB_FEATS = [
  'Анна пишет в MAX, Telegram и SMS',
  'Запись в ваш график и напоминания',
  'Кабинет и карточки лидов',
  'Еженедельный отчёт возвращённых рублей',
];

function scrollToLead(e) {
  e.preventDefault();
  document.getElementById('lead')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function Feat({ children }) {
  return (
    <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 16, lineHeight: 1.4 }}>
      <Icon name="check" size={18} color="var(--success-text)" style={{ marginTop: 2 }} />
      {children}
    </li>
  );
}

export function Pricing() {
  return (
    <section id="price" className="section" style={{ background: 'var(--bg)' }}>
      <div className="container">
        <Reveal>
          <div className="overline" style={{ color: 'var(--text-secondary)' }}>Тариф</div>
          <h2 className="h2" style={{ marginTop: 8, maxWidth: 640 }}>Сначала окупаемость — потом подписка</h2>
          <p className="body-lg caption" style={{ marginTop: 12, maxWidth: 620 }}>
            Начинаем с пилота. Подписка — только если пилот окупился. Не окупился — расстаёмся без обид.
          </p>
        </Reveal>

        <div className="pk-price-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginTop: 28, alignItems: 'start' }}>
          {/* Пилот — акцентная карточка */}
          <Reveal>
            <div
              style={{
                background: 'var(--surface)', boxShadow: 'var(--shadow-raised)', overflow: 'hidden',
                clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)',
                borderRadius: '16px 0 16px 16px',
              }}
            >
              <div style={{ background: 'var(--wine-800)', color: 'var(--ivory)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Пилот · 14 дней</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--charcoal)', background: 'var(--gold-400)', padding: '4px 11px', clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}>
                  В честь запуска
                </span>
              </div>
              <div style={{ padding: '22px 24px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                  <span className="tnum" style={{ fontSize: 22, color: 'var(--text-secondary)', textDecoration: 'line-through', textDecorationThickness: '1.5px' }}>4 900 ₽</span>
                  <span className="money-lg tnum" style={{ color: 'var(--text)' }}>
                    1 590<span className="money-rub">₽</span>
                  </span>
                </div>
                <div style={{ fontSize: 16, color: 'var(--success-text)', fontWeight: 500, marginTop: 4 }}>Окупается одной записью на чистку</div>
                <ul style={{ listStyle: 'none', margin: '18px 0 0', padding: 0, display: 'grid', gap: 10 }}>
                  {PILOT_FEATS.map((f) => <Feat key={f}>{f}</Feat>)}
                </ul>
                <a href="#lead" onClick={scrollToLead} style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="lg" full icon="return" style={{ marginTop: 22 }}>Подключить клинику</Button>
                </a>
              </div>
            </div>
          </Reveal>

          {/* Подписка */}
          <Reveal delay={90}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Подписка</span>
              </div>
              <div style={{ padding: '22px 24px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span className="money-lg tnum" style={{ color: 'var(--text)' }}>
                    14 900<span className="money-rub">₽</span>
                  </span>
                  <span style={{ fontSize: 16, color: 'var(--text-secondary)' }}>в месяц</span>
                </div>
                <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 4 }}>Отмена в любой месяц. Без договора на год.</div>
                <ul style={{ listStyle: 'none', margin: '18px 0 0', padding: 0, display: 'grid', gap: 10 }}>
                  {SUB_FEATS.map((f) => <Feat key={f}>{f}</Feat>)}
                </ul>
                <a href="#lead" onClick={scrollToLead} style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" size="lg" full style={{ marginTop: 22 }}>Начать с пилота</Button>
                </a>
                <div style={{ display: 'flex', gap: 8, marginTop: 14, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  <Icon name="shield" size={18} color="var(--success-text)" style={{ marginTop: 1, flex: 'none' }} />
                  <span>Подписка — только если пилот окупился. Не окупился — расстаёмся без обид.</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
