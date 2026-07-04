import { useState } from 'react';
import { Icon } from '../design/components/core/Icon.jsx';
import { Reveal } from '../lib/anim.jsx';

const QA = [
  {
    q: 'Анна заменит моего администратора?',
    a: 'Нет. Она подхватывает то, что администратор физически не успевает: пропущенные звонки, ночь, выходные, час пик. Ваш человек остаётся — Анна снимает с него потерянные звонки и рутину.',
  },
  {
    q: 'Сложно ли подключить? Нужно менять телефонию?',
    a: 'Настройка занимает около 15 минут, менять АТС не нужно. Если у вас умная телефония (Novofon, Mango, UIS) — подключаем по вебхуку. Если обычный номер — настроим переадресацию по неответу, с картинками в мастере.',
  },
  {
    q: 'Безопасны ли данные пациентов?',
    a: 'Да. Серверы в России, работаем по 152-ФЗ. Записи разговоров и база пациентов не покидают страну, диалоги ведёт российская модель GigaChat. В карточку лида не попадают диагнозы.',
  },
  {
    q: 'А если ИИ ошибётся?',
    a: 'Рядом основатель, лично. Анна не ставит диагнозов, не обещает результат лечения и не выдаёт цен вне вашего прайса. В спорных случаях она вежливо передаёт разговор человеку, а вы видите все диалоги в кабинете.',
  },
  {
    q: 'Пациентам нужно ставить приложение?',
    a: 'Нет. Анна сама пишет пациенту в MAX, Telegram или SMS — туда, где ему удобно. Ставить ничего не нужно. Приложение в RuStore — только для вас, чтобы видеть лиды и рубли.',
  },
];

function Item({ item, open, onToggle, id }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`faq-panel-${id}`}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between',
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '20px 4px',
          textAlign: 'left', color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h4)', fontWeight: 600,
        }}
      >
        {item.q}
        <span
          aria-hidden="true"
          style={{
            flex: 'none', width: 32, height: 32, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: open ? 'var(--wine-800)' : 'var(--surface-subtle)', color: open ? 'var(--gold-300)' : 'var(--text-secondary)',
            transition: 'transform var(--motion-base), background var(--motion-base), color var(--motion-base)',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        >
          <Icon name="return" size={18} style={{ transform: 'rotate(-90deg)' }} />
        </span>
      </button>
      <div
        id={`faq-panel-${id}`}
        role="region"
        style={{
          overflow: 'hidden', maxHeight: open ? 400 : 0, opacity: open ? 1 : 0,
          transition: 'max-height var(--motion-enter), opacity var(--motion-base)',
        }}
      >
        <p className="caption" style={{ fontSize: 16, lineHeight: 1.55, margin: 0, padding: '0 4px 22px', maxWidth: 720 }}>
          {item.a}
        </p>
      </div>
    </div>
  );
}

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="section" style={{ background: 'var(--surface-subtle)' }}>
      <div className="container" style={{ maxWidth: 820 }}>
        <Reveal>
          <div className="overline" style={{ color: 'var(--text-secondary)' }}>Вопросы</div>
          <h2 className="h2" style={{ marginTop: 8 }}>Коротко о главном</h2>
        </Reveal>
        <Reveal delay={80}>
          <div style={{ marginTop: 20, borderTop: '1px solid var(--border)' }}>
            {QA.map((item, i) => (
              <Item key={i} id={i} item={item} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
