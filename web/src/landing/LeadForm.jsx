import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../design/components/controls/Input.jsx';
import { Button } from '../design/components/controls/Button.jsx';
import { Icon } from '../design/components/core/Icon.jsx';
import { Reveal } from '../lib/anim.jsx';
import { LEAD_WEBHOOK_URL } from '../config.js';
import { reachGoal, GOALS } from '../lib/metrika.js';

const REASSURE = [
  { icon: 'clock', text: 'Отвечу в течение 15 минут в рабочее время' },
  { icon: 'shield', text: 'Без давления — сначала покажу, как это работает' },
  { icon: 'ruble', text: 'Настрою пилот за 15 минут, без смены АТС' },
];

function digits(s) {
  return (s.match(/\d/g) || []).length;
}

async function sendLead(payload) {
  if (!LEAD_WEBHOOK_URL) {
    // TODO(ЭТАП B): бэкенд POST /api/public/lead-request. До него — лог + оптимистичный успех.
    console.log('[lead-request] VITE_LEAD_WEBHOOK_URL не задан — заявка не отправлена, только лог:', payload);
    return true;
  }
  try {
    const res = await fetch(LEAD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.error('[lead-request] ошибка отправки:', e);
    return false;
  }
}

export function LeadForm() {
  const [form, setForm] = useState({ name: '', clinic: '', phone: '', city: '' });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const err = {};
    if (form.name.trim().length < 2) err.name = 'Как к вам обращаться?';
    if (digits(form.phone) < 10) err.phone = 'Укажите телефон для связи';
    if (!consent) err.consent = 'Нужно согласие на обработку данных';
    setErrors(err);
    return Object.keys(err).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFailed(false);
    if (!validate()) return;
    setSending(true);
    const ok = await sendLead({
      name: form.name.trim(),
      clinic: form.clinic.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      source: 'landing',
    });
    setSending(false);
    if (ok) {
      reachGoal(GOALS.LEAD_SUBMIT);
      setDone(true);
    } else {
      setFailed(true);
    }
  }

  return (
    <section id="lead" className="section" style={{ background: 'var(--surface-subtle)' }}>
      <div className="container pk-lead-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.9fr) minmax(340px,1fr)', gap: 48, alignItems: 'center' }}>
        <Reveal>
          <div>
            <div className="overline" style={{ color: 'var(--wine-800)' }}>Подключить клинику</div>
            <h2 className="h2" style={{ marginTop: 8, maxWidth: 460 }}>Оставьте заявку — остальное беру на себя</h2>
            <p className="body-lg caption" style={{ marginTop: 14, maxWidth: 480 }}>
              Никакой регистрации и паролей. Оставьте контакты — я свяжусь, покажу Анну в деле
              на вашей клинике и помогу с настройкой.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '22px 0 0', display: 'grid', gap: 14 }}>
              {REASSURE.map((r) => (
                <li key={r.text} style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 16 }}>
                  <span style={{ flex: 'none', width: 40, height: 40, borderRadius: 'var(--r-btn)', background: 'var(--surface)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={r.icon} size={20} color="var(--wine-800)" />
                  </span>
                  {r.text}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={90}>
          <div
            style={{
              background: 'var(--surface)', boxShadow: 'var(--shadow-raised)',
              clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)',
              borderRadius: '16px 0 16px 16px', padding: 28,
            }}
          >
            {done ? (
              <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                <span style={{ display: 'inline-flex', width: 64, height: 64, borderRadius: '50%', background: 'var(--success-tint)', color: 'var(--success-text)', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <Icon name="check" size={34} />
                </span>
                <h3 className="h3" style={{ marginTop: 16 }}>Спасибо!</h3>
                <p className="caption" style={{ fontSize: 16, marginTop: 8, maxWidth: 340, marginInline: 'auto', lineHeight: 1.5 }}>
                  Свяжусь с вами в течение 15 минут в рабочее время.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                <h3 className="h3" style={{ marginBottom: 18 }}>Заявка на подключение</h3>
                <div style={{ display: 'grid', gap: 14 }}>
                  <Input label="Ваше имя" placeholder="Как к вам обращаться" icon="patient" value={form.name} onChange={set('name')} error={errors.name} />
                  <Input label="Клиника" placeholder="Название клиники" icon="booking" value={form.clinic} onChange={set('clinic')} />
                  <Input label="Телефон" type="tel" placeholder="+7 912 345-67-89" icon="call" value={form.phone} onChange={set('phone')} error={errors.phone} />
                  <Input label="Город" placeholder="Город клиники" icon="server" value={form.city} onChange={set('city')} />
                </div>

                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16, fontSize: 15, lineHeight: 1.45, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    style={{ width: 20, height: 20, marginTop: 1, flex: 'none', accentColor: 'var(--control-on)' }}
                  />
                  <span>
                    Согласен на обработку персональных данных по 152-ФЗ и с{' '}
                    <Link to="/privacy" style={{ color: 'var(--text-gold)', textDecoration: 'underline' }}>политикой конфиденциальности</Link>.
                  </span>
                </label>
                {errors.consent && <div style={{ color: 'var(--urgent-text)', fontSize: 15, marginTop: 6 }}>{errors.consent}</div>}

                {/* Enter в поле отправляет форму (стилизованная кнопка — type=button) */}
                <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">Отправить</button>
                <Button variant="primary" size="lg" full icon="return" disabled={sending} style={{ marginTop: 18 }} onClick={onSubmit}>
                  {sending ? 'Отправляю…' : 'Подхватим клинику'}
                </Button>

                {failed && (
                  <div style={{ color: 'var(--urgent-text)', fontSize: 15, marginTop: 12, textAlign: 'center' }}>
                    Что-то пошло не так, уже чиним. Напишите основателю в Telegram — ссылка ниже.
                  </div>
                )}
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 12 }}>
                  Это заявка, а не регистрация. Пароли не нужны.
                </p>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
