import React, { useState } from 'react';
import { Input } from '../../design/components/controls/Input.jsx';
import { Button } from '../../design/components/controls/Button.jsx';
import { Icon } from '../../design/components/core/Icon.jsx';
import { Section } from './Section.jsx';
import { ConsentCheckbox } from '../common/ConsentCheckbox.jsx';
import { reachGoal } from '../../lib/analytics.js';
import { isValidPhone, normalizePhone } from '../../lib/format.js';
import { LEAD_ENDPOINT, CITY } from '../../config.js';

const WEBHOOK_CONFIGURED = Boolean(import.meta.env.VITE_LEAD_WEBHOOK_URL);

const empty = { name: '', clinic: '', phone: '', city: CITY, consent: false, hp: '' };

export function LeadForm() {
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const set = (k) => (eOrVal) => {
    const val = typeof eOrVal === 'object' && eOrVal?.target ? eOrVal.target.value : eOrVal;
    setF((s) => ({ ...s, [k]: val }));
  };

  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Как к вам обращаться?';
    if (!f.clinic.trim()) e.clinic = 'Название клиники';
    if (!isValidPhone(f.phone)) e.phone = 'Телефон в формате +7 912 345-67-89';
    if (!f.consent) e.consent = 'Нужно согласие на обработку данных';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    // Защита от двойной отправки (повторный Enter, пока запрос в полёте).
    if (status === 'sending') return;
    // Honeypot: бот заполнил скрытое поле — тихо «успех», ничего не отправляем.
    if (f.hp) { setStatus('success'); return; }
    if (!validate()) return;

    reachGoal('lead_submit');
    setStatus('sending');

    const payload = {
      name: f.name.trim(),
      clinic: f.clinic.trim(),
      phone: normalizePhone(f.phone),
      city: f.city.trim(),
      source: 'landing',
    };

    try {
      const res = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('success');
    } catch (err) {
      if (WEBHOOK_CONFIGURED) {
        // Настроенный вебхук не ответил — это настоящая ошибка, даём повтор.
        setStatus('error');
      } else {
        // TODO: backend /api/lead ещё не поднят. По Решениям — показываем успех и логируем заявку.
        // eslint-disable-next-line no-console
        console.info('[lead-request] бэкенд недоступен, заявка (TODO отправить вручную):', payload, err?.message);
        setStatus('success');
      }
    }
  };

  if (status === 'success') {
    return (
      <Section id="lead" bg="var(--surface-subtle)">
        <div
          className="facet-card"
          role="status"
          aria-live="polite"
          style={{ maxWidth: 620, margin: '0 auto', background: 'var(--surface)', boxShadow: 'var(--shadow-raised)', borderRadius: 'var(--r-card)', padding: 'var(--sp-8)', textAlign: 'center' }}
        >
          <span style={{ display: 'inline-flex', width: 56, height: 56, alignItems: 'center', justifyContent: 'center', background: 'var(--success-tint)', borderRadius: 'var(--r-pill)' }}>
            <Icon name="check" size={28} color="var(--success-text)" />
          </span>
          <h2 className="lp-h2" style={{ marginTop: 'var(--sp-4)' }}>Заявка принята</h2>
          <p className="lp-lead" style={{ margin: 'var(--sp-3) auto 0' }}>
            Спасибо, {f.name.trim() || 'коллега'}! Свяжусь в течение 15 минут в рабочее время.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section id="lead" bg="var(--surface-subtle)">
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <p className="lp-overline">Заявка</p>
        <h2 className="lp-h2">Подключить клинику</h2>
        <p className="lp-lead">Оставьте контакты — основатель свяжется, покажет кабинет и подключит за 15 минут. Без предоплаты за подключение.</p>

        <form onSubmit={onSubmit} noValidate style={{ marginTop: 'var(--sp-6)', display: 'grid', gap: 'var(--sp-4)' }}>
          <div className="lp-form-grid">
            <Input label="Ваше имя" placeholder="Анна" value={f.name} onChange={set('name')} error={errors.name} />
            <Input label="Клиника" placeholder="Стоматология «Жемчуг»" value={f.clinic} onChange={set('clinic')} error={errors.clinic} />
            <Input label="Телефон" type="tel" placeholder="+7 912 345-67-89" icon="call" value={f.phone} onChange={set('phone')} error={errors.phone} />
            <Input label="Город" placeholder={CITY} value={f.city} onChange={set('city')} />
          </div>

          {/* Honeypot: скрыто от людей, видно ботам. Клип-паттерн (без отрицательного left — не создаёт прокрутку). */}
          <div aria-hidden="true" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clipPath: 'inset(50%)', border: 0 }}>
            <label>Не заполняйте это поле
              <input tabIndex={-1} autoComplete="off" value={f.hp} onChange={set('hp')} />
            </label>
          </div>

          <ConsentCheckbox checked={f.consent} onChange={set('consent')} error={errors.consent}>
            Даю согласие на обработку персональных данных согласно{' '}
            <a href="/privacy" target="_blank" rel="noopener" style={{ color: 'var(--text-gold)', textDecoration: 'underline' }}>
              политике конфиденциальности
            </a>.
          </ConsentCheckbox>

          {status === 'error' ? (
            <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', background: 'var(--urgent-tint)', color: 'var(--urgent-text)', padding: 'var(--sp-3) var(--sp-4)', borderRadius: 'var(--r-card-sm)', fontSize: 'var(--fs-body)' }}>
              <Icon name="urgent" size={18} />
              Что-то пошло не так, уже чиним. Попробуйте ещё раз или напишите основателю.
            </div>
          ) : null}

          {/* Скрытая submit-кнопка: даёт отправку по Enter (дизайн-Button всегда type=button) */}
          <button type="submit" aria-hidden="true" tabIndex={-1} style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clipPath: 'inset(50%)', border: 0 }}>Отправить</button>

          <Button variant="primary" size="lg" full disabled={status === 'sending'} onClick={onSubmit}>
            {status === 'sending' ? 'Отправляю…' : 'Оставить заявку'}
          </Button>
        </form>
      </div>
    </Section>
  );
}
