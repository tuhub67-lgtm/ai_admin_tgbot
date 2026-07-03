import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { OnboardingStepper } from '../../design/components/feedback/OnboardingStepper.jsx';
import { Button } from '../../design/components/controls/Button.jsx';
import { Input } from '../../design/components/controls/Input.jsx';
import { Icon } from '../../design/components/core/Icon.jsx';
import { fmtRub } from '../../design/components/money/MoneyFigure.jsx';
import { useToast, ToastHost } from '../components/ToastHost.jsx';
import { API_BASE, SITE_URL } from '../../config.js';

/* Онбординг клиники — 4 шага: телефония, расписание, прайс и голос Анны, тестовый прогон. */

const STEPS = ['Телефония', 'Расписание', 'Прайс и Анна', 'Тестовый прогон'];

const PRESET_SERVICES = [
  { name: 'Консультация', price_from: 0, price_to: 1000 },
  { name: 'Профгигиена (чистка)', price_from: 3500, price_to: 6000 },
  { name: 'Лечение кариеса', price_from: 4000, price_to: 9000 },
  { name: 'Удаление зуба', price_from: 2500, price_to: 8000 },
  { name: 'Имплантация', price_from: 35000, price_to: 70000 },
];

const DEMO_DIALOGUE = [
  { role: 'assistant', text: 'Здравствуйте! Это Анна из клиники. Вы звонили — подскажите, что вас беспокоит?' },
  { role: 'user', text: 'Хочу записаться на чистку.' },
  { role: 'assistant', text: 'С удовольствием запишу. Вам удобнее в будни вечером или в субботу днём?' },
  { role: 'user', text: 'Давайте в субботу.' },
  { role: 'assistant', text: 'Записала на субботу, 12:00. Напомню за день. Хорошего дня!' },
];

function RadioRow({ selected, onSelect, title, description, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', textAlign: 'left',
        minHeight: 44, padding: '12px 14px', borderRadius: 'var(--r-input)', cursor: disabled ? 'not-allowed' : 'pointer',
        background: selected ? 'var(--surface-subtle)' : 'transparent',
        border: `1.5px solid ${selected ? 'var(--control-on)' : 'var(--border-strong)'}`,
        opacity: disabled ? 0.5 : 1, fontFamily: 'var(--font-body)', color: 'var(--text)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flex: 'none', width: 22, height: 22, borderRadius: 999, marginTop: 1,
          border: `2px solid ${selected ? 'var(--control-on)' : 'var(--border-strong)'}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {selected ? <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--control-on)' }} /> : null}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 16, fontWeight: 600 }}>{title}</span>
        {description ? <span style={{ display: 'block', fontSize: 16, color: 'var(--text-secondary)', marginTop: 2 }}>{description}</span> : null}
      </span>
    </button>
  );
}

function CodeBox({ value }) {
  return (
    <div
      className="tnum"
      style={{
        padding: '12px 14px', background: 'var(--surface-subtle)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-input)', fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text)',
        wordBreak: 'break-all', fontFeatureSettings: "'tnum' 1",
      }}
    >
      {value}
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { clinic } = useAuth();
  const { toast, showToast } = useToast();

  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('smart'); // smart | plain
  const [schedule, setSchedule] = useState('manual'); // manual | sheets | yclients
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [services, setServices] = useState(PRESET_SERVICES);
  const [tone, setTone] = useState('тепло, коротко, на «вы»');
  const [demo, setDemo] = useState(false);

  const clinicToken = clinic?.token || clinic?.clinic_token || clinic?.id || '{clinic_token}';
  const webhookUrl = `${API_BASE || SITE_URL}/api/telephony/webhook/${clinicToken}`;

  const setService = (i, key, val) => setServices((arr) => arr.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)));

  const copyWebhook = async () => {
    try { await navigator.clipboard.writeText(webhookUrl); showToast({ variant: 'info', title: 'Скопировано' }); }
    catch { showToast({ variant: 'info', title: 'Скопируйте ссылку вручную' }); }
  };

  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : navigate('/app'));
  const prev = () => setStep(Math.max(0, step - 1));

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minWidth: 0, padding: '20px 20px 0' }}>
        <OnboardingStepper steps={STEPS} current={step} compact />

        {step === 0 ? (
          <div style={{ marginTop: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1.2, fontWeight: 700, margin: 0 }}>Откуда Анне брать звонки?</h2>
            <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--text-secondary)', margin: '10px 0 0' }}>Выберите, как устроена телефония клиники — так Анна узнает о пропущенных звонках.</p>
            <div style={{ display: 'grid', gap: 8, marginTop: 18 }}>
              <RadioRow selected={phone === 'smart'} onSelect={() => setPhone('smart')} title="Умная АТС (Novofon / Mango / UIS)" description="Подключим за пару минут через веб-хук" />
              <RadioRow selected={phone === 'plain'} onSelect={() => setPhone('plain')} title="Обычный или мобильный номер" description="Настроим условную переадресацию" />
            </div>

            {phone === 'smart' ? (
              <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Вставьте эту ссылку в настройки веб-хука вашей АТС:</div>
                <CodeBox value={webhookUrl} />
                <Button variant="secondary" size="md" icon="report" onClick={copyWebhook}>Скопировать ссылку</Button>
                <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: 0 }}>Раздел «Интеграции» → «Веб-хуки» → событие «Пропущенный звонок». Если не найдёте — пришлём инструкцию под вашу АТС.</p>
              </div>
            ) : (
              <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Условная переадресация на номер Анны:</div>
                <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Наберите на телефоне клиники <strong style={{ color: 'var(--text)' }}>**61*номер#</strong> — звонки, оставшиеся без ответа, будут уходить Анне. Точный код под вашего оператора пришлём после подключения.
                </p>
              </div>
            )}
          </div>
        ) : null}

        {step === 1 ? (
          <div style={{ marginTop: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1.2, fontWeight: 700, margin: 0 }}>Откуда брать расписание?</h2>
            <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--text-secondary)', margin: '10px 0 0' }}>Анна предлагает пациентам только свободное время.</p>
            <div style={{ display: 'grid', gap: 8, marginTop: 18 }}>
              <RadioRow selected={schedule === 'manual'} onSelect={() => setSchedule('manual')} title="Вручную (по умолчанию)" description="Задаёте часы работы — Анна предлагает слоты внутри них" />
              <RadioRow selected={schedule === 'sheets'} onSelect={() => setSchedule('sheets')} title="Google Sheets" description="Анна читает занятость из вашей таблицы" />
              <RadioRow selected={schedule === 'yclients'} onSelect={() => {}} disabled title="YClients (скоро)" description="Интеграция готовится" />
            </div>
            {schedule === 'sheets' ? (
              <div style={{ marginTop: 16 }}>
                <Input label="Ссылка на таблицу" placeholder="https://docs.google.com/spreadsheets/…" value={sheetsUrl} onChange={(e) => setSheetsUrl(e.target.value)} />
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div style={{ marginTop: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1.2, fontWeight: 700, margin: 0 }}>Прайс и голос Анны</h2>
            <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--text-secondary)', margin: '10px 0 0' }}>Отредактируйте вилки — Анна называет их пациентам честно, без «от».</p>
            <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
              {services.map((s, i) => (
                <div key={i} style={{ display: 'grid', gap: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Input label="от" type="number" suffix="₽" value={s.price_from} onChange={(e) => setService(i, 'price_from', e.target.value)} />
                    <Input label="до" type="number" suffix="₽" value={s.price_to} onChange={(e) => setService(i, 'price_to', e.target.value)} />
                  </div>
                </div>
              ))}
              <Input label="Тон Анны" placeholder="тепло, коротко, на «вы»" value={tone} onChange={(e) => setTone(e.target.value)} />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div style={{ marginTop: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1.2, fontWeight: 700, margin: 0 }}>Проверим Анну в деле</h2>
            <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--text-secondary)', margin: '10px 0 0' }}>Нажмите — и увидите, как Анна ведёт пациента от звонка до записи.</p>
            <div style={{ marginTop: 18 }}>
              <Button variant="primary" size="lg" icon="call" full onClick={() => setDemo(true)}>Позвонить самому себе</Button>
            </div>
            {demo ? (
              <div style={{ display: 'grid', gap: 10, marginTop: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-card)', padding: '16px', boxShadow: 'var(--shadow-card)' }}>
                {DEMO_DIALOGUE.map((m, i) => {
                  const anna = m.role === 'assistant';
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: anna ? 'flex-start' : 'flex-end' }}>
                      <div style={{ maxWidth: '86%', padding: '10px 12px', borderRadius: 'var(--r-card-sm)', fontSize: 16, lineHeight: 1.4, background: anna ? 'var(--surface-subtle)' : 'var(--st-dialog-tint)', color: 'var(--text)' }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>{anna ? 'Анна' : 'Пациент'}</div>
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, color: 'var(--success-text)' }}>
                  <Icon name="check" size={18} color="var(--success-text)" />
                  Готово — так это и работает с настоящими пациентами.
                </div>
              </div>
            ) : null}
            <p style={{ display: 'flex', gap: 8, fontSize: 16, color: 'var(--text-secondary)', margin: '14px 0 0' }}>
              <Icon name="shield" size={18} color="var(--success-text)" style={{ flex: 'none', marginTop: 2 }} />
              Данные — в России, по 152-ФЗ. Настройки можно менять в любой момент.
            </p>
            {services.length ? (
              <div className="tnum" style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 12, fontFeatureSettings: "'tnum' 1" }}>
                Например, чистка в прайсе — от {fmtRub(services[1]?.price_from || 0)}&nbsp;₽.
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div style={{ flex: 'none', display: 'grid', gap: 8, padding: '16px 20px 24px' }}>
        <Button variant="primary" size="lg" full onClick={next}>{step < STEPS.length - 1 ? 'Дальше' : 'Готово'}</Button>
        <Button variant="ghost" size="md" full disabled={step === 0} onClick={prev}>Назад</Button>
      </div>

      <ToastHost toast={toast} />
    </div>
  );
}
