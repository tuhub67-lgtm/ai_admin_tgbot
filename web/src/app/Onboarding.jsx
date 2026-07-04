import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingStepper } from '../design/components/feedback/OnboardingStepper.jsx';
import { Input } from '../design/components/controls/Input.jsx';
import { Button } from '../design/components/controls/Button.jsx';
import { Icon } from '../design/components/core/Icon.jsx';
import { Reveal } from '../lib/anim.jsx';
import { getClinic } from './lib/api.js';
import { useToasts, ToastStack } from './lib/toast.jsx';

const STEPS = ['Телефония', 'Расписание', 'Прайс и Анна', 'Тест'];

const PRESET_SERVICES = [
  { name: 'Консультация', price_from: 0 },
  { name: 'Профгигиена', price_from: 4500 },
  { name: 'Лечение кариеса', price_from: 3500 },
  { name: 'Удаление зуба', price_from: 2500 },
  { name: 'Имплантация', price_from: 35000 },
];

const PBX = [
  { key: 'novofon', label: 'Novofon' },
  { key: 'mango', label: 'Mango Office' },
  { key: 'uis', label: 'UIS' },
];

const TEST_DIALOG = [
  { role: 'user', content: 'Здравствуйте, звонила по поводу записи, не дозвонилась.' },
  { role: 'assistant', content: 'Здравствуйте! Это Анна из вашей клиники. Помогу записаться. Подскажите, что беспокоит — или на какую услугу вас записать?' },
  { role: 'user', content: 'Хочу на чистку.' },
  { role: 'assistant', content: 'Отлично. Есть завтра 10:00 и четверг 18:30. Какой вариант удобнее?' },
  { role: 'user', content: 'Завтра в 10.' },
  { role: 'assistant', content: 'Записала на завтра 10:00. Пришлю напоминание накануне. Хорошего дня!' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const clinic = getClinic();
  const clinicToken = clinic?.slug || 'clinic_token';
  const { toasts, toast, dismiss } = useToasts();

  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('pbx');
  const [pbx, setPbx] = useState('novofon');
  const [schedule, setSchedule] = useState('manual');
  const [sheetUrl, setSheetUrl] = useState('');
  const [services, setServices] = useState(PRESET_SERVICES);
  const [testPlaying, setTestPlaying] = useState(false);

  const webhook = `https://api.podhvat.ru/webhook/${clinicToken}`;

  function finish() {
    try { localStorage.setItem('pk_onboarded', '1'); } catch { /* ignore */ }
    window.dispatchEvent(new Event('pk-onboarded'));
    navigate('/app', { replace: true });
  }

  function copyWebhook() {
    if (navigator.clipboard) navigator.clipboard.writeText(webhook).then(() => toast({ variant: 'success', title: 'Скопировано', text: 'Вставьте вебхук в настройки АТС' })).catch(() => {});
  }

  const card = {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-card)',
    boxShadow: 'var(--shadow-card)', padding: 24, marginTop: 20,
  };

  return (
    <>
      <Reveal>
        <header style={{ paddingTop: 24 }}>
          <div className="overline" style={{ color: 'var(--text-secondary)' }}>Подключение</div>
          <h1 className="h2" style={{ marginTop: 6 }}>Настроим за 4 шага</h1>
        </header>
      </Reveal>

      <div style={{ marginTop: 20 }}>
        <OnboardingStepper steps={STEPS} current={step} />
      </div>

      <div style={card} key={step}>
        {step === 0 && (
          <StepPhone phone={phone} setPhone={setPhone} pbx={pbx} setPbx={setPbx} webhook={webhook} onCopy={copyWebhook} />
        )}
        {step === 1 && (
          <StepSchedule schedule={schedule} setSchedule={setSchedule} sheetUrl={sheetUrl} setSheetUrl={setSheetUrl} />
        )}
        {step === 2 && (
          <StepPrice services={services} setServices={setServices} />
        )}
        {step === 3 && (
          <StepTest playing={testPlaying} onPlay={() => setTestPlaying(true)} />
        )}
      </div>

      {/* Навигация мастера */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, alignItems: 'center' }}>
        {step > 0 && (
          <Button variant="secondary" size="md" icon="return" onClick={() => setStep((s) => s - 1)}>Назад</Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button variant="primary" size="md" icon="check" onClick={() => setStep((s) => s + 1)} style={{ marginLeft: 'auto' }}>Далее</Button>
        ) : (
          <Button variant="primary" size="lg" icon="check" onClick={finish} style={{ marginLeft: 'auto' }}>Всё готово — в кабинет</Button>
        )}
      </div>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

/* ── Радио-карточка ── контейнер div (внутри могут быть поля/кнопки),
   выбор — по клику на шапку (role="radio"), чтобы не вкладывать кнопки в кнопку. */
function RadioCard({ active, onClick, title, children, badge, disabled }) {
  return (
    <div
      style={{
        padding: 16, borderRadius: 'var(--r-card-sm)', background: active ? 'var(--surface-subtle)' : 'transparent',
        border: `1.5px solid ${active ? 'var(--wine-800)' : 'var(--border-strong)'}`,
        fontFamily: 'var(--font-body)', color: 'var(--text)', opacity: disabled ? 0.7 : 1,
      }}
    >
      <div
        role="radio"
        aria-checked={active}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onClick={disabled ? undefined : onClick}
        onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: disabled ? 'default' : 'pointer', minHeight: 28 }}
      >
        <span aria-hidden="true" style={{
          flex: 'none', width: 20, height: 20, borderRadius: '50%',
          border: `2px solid ${active ? 'var(--wine-800)' : 'var(--border-strong)'}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {active ? <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--wine-800)' }} /> : null}
        </span>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
        {badge ? (
          <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--surface-subtle)', padding: '2px 10px', borderRadius: 999 }}>{badge}</span>
        ) : null}
      </div>
      {children ? <div style={{ marginTop: 12 }}>{children}</div> : null}
    </div>
  );
}

function StepPhone({ phone, setPhone, pbx, setPbx, webhook, onCopy }) {
  return (
    <div>
      <StepHead icon="call" title="Как принимаете звонки?" text="Анне нужен доступ к пропущенным — она подхватит их за 30 секунд." />
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <RadioCard active={phone === 'pbx'} onClick={() => setPhone('pbx')} title="Умная АТС" badge="рекомендуем">
          {phone === 'pbx' && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PBX.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPbx(p.key); }}
                    style={{
                      minHeight: 40, padding: '0 14px', borderRadius: 999, cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600,
                      border: `1.5px solid ${pbx === p.key ? 'transparent' : 'var(--border-strong)'}`,
                      background: pbx === p.key ? 'var(--surface-brand)' : 'transparent',
                      color: pbx === p.key ? 'var(--text-on-brand)' : 'var(--text)',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>Вебхук для пропущенных звонков</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <code
                    className="tnum"
                    style={{
                      flex: 1, minWidth: 220, padding: '12px 14px', background: 'var(--surface-subtle)',
                      border: '1px solid var(--border)', borderRadius: 'var(--r-input)', fontSize: 15,
                      wordBreak: 'break-all', color: 'var(--text)', fontFamily: 'var(--font-body)',
                    }}
                  >
                    {webhook}
                  </code>
                  <Button variant="secondary" size="sm" icon="report" onClick={(e) => { if (e) e.stopPropagation(); onCopy(); }}>Копировать</Button>
                </div>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 10 }}>
                  Вставьте этот адрес в настройки уведомлений {PBX.find((p) => p.key === pbx)?.label} о пропущенных вызовах.
                </p>
              </div>
            </>
          )}
        </RadioCard>

        <RadioCard active={phone === 'plain'} onClick={() => setPhone('plain')} title="Обычный номер">
          {phone === 'plain' && (
            <div style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Подключим переадресацию по условию «не ответили за 20 секунд»:
              <ol style={{ margin: '10px 0 0', paddingLeft: 20, display: 'grid', gap: 6 }}>
                <li>Наберите на телефоне клиники код <strong style={{ color: 'var(--text)' }}>**61*</strong> и номер, который мы пришлём в боте.</li>
                <li>Завершите ввод символом <strong style={{ color: 'var(--text)' }}>#</strong> и нажмите вызов.</li>
                <li>Готово — непринятые звонки будут уходить Анне, она напишет пациенту первой.</li>
              </ol>
            </div>
          )}
        </RadioCard>
      </div>
    </div>
  );
}

function StepSchedule({ schedule, setSchedule, sheetUrl, setSheetUrl }) {
  return (
    <div>
      <StepHead icon="booking" title="Откуда брать свободные слоты?" text="Анна предлагает только реальное время — чтобы не было двойных записей." />
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <RadioCard active={schedule === 'manual'} onClick={() => setSchedule('manual')} title="Вручную" badge="по умолчанию">
          {schedule === 'manual' && (
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: 0 }}>
              Вы указываете рабочие окна в «Настройках», Анна предлагает слоты внутри них. Проще всего для старта.
            </p>
          )}
        </RadioCard>
        <RadioCard active={schedule === 'sheets'} onClick={() => setSchedule('sheets')} title="Google Таблица">
          {schedule === 'sheets' && (
            <Input
              label="Ссылка на таблицу с расписанием"
              icon="report"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/…"
              hint="Дайте доступ на просмотр по ссылке"
            />
          )}
        </RadioCard>
        <RadioCard active={false} disabled onClick={() => {}} title="YClients" badge="скоро">
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: 0 }}>
            Прямая синхронизация с YClients в работе — подключим по запросу.
          </p>
        </RadioCard>
      </div>
    </div>
  );
}

function StepPrice({ services, setServices }) {
  const setService = (i, patch) => setServices(services.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  return (
    <div>
      <StepHead icon="ruble" title="Прайс и голос Анны" text="Готовый набор частых услуг — поправьте цены под себя. Анна называет их диапазоном «от»." />
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {services.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <Input value={s.name} onChange={(e) => setService(i, { name: e.target.value })} placeholder="Услуга" style={{ flex: 2 }} />
            <Input type="number" value={String(s.price_from ?? '')} onChange={(e) => setService(i, { price_from: Number(e.target.value) || 0 })} placeholder="0" suffix="₽ от" style={{ flex: 1, minWidth: 120 }} />
          </div>
        ))}
      </div>
      <p style={{ display: 'flex', gap: 8, fontSize: 15, color: 'var(--text-secondary)', marginTop: 14 }}>
        <Icon name="dialog" size={18} style={{ flex: 'none', marginTop: 1 }} />
        Точную сумму всегда называет врач — Анна честно об этом предупреждает.
      </p>
    </div>
  );
}

function StepTest({ playing, onPlay }) {
  const [shown, setShown] = useState(false);
  const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (!playing) { setShown(false); return undefined; }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [playing]);

  return (
    <div>
      <StepHead icon="check" title="Проверим Анну в деле" text="Запустите тестовый диалог — так вы услышите её тон до первого живого пациента." />
      {!playing ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0 8px' }}>
          <Button variant="primary" size="lg" icon="call" onClick={onPlay}>Позвонить самому себе</Button>
        </div>
      ) : (
        <div
          style={{
            marginTop: 16, padding: 16, background: 'var(--surface-subtle)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-card-sm)', display: 'grid', gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <Icon name="dialog" size={20} color="var(--wine-800)" />
            <span style={{ fontWeight: 600 }}>Тестовый диалог</span>
            <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--text-secondary)' }}>демо</span>
          </div>
          {TEST_DIALOG.map((m, i) => {
            const isAnna = m.role === 'assistant';
            const visible = shown || reduced;
            return (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 10, justifyContent: isAnna ? 'flex-start' : 'flex-end',
                  opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(8px)',
                  transition: reduced ? 'none' : 'opacity 360ms cubic-bezier(.16,1,.3,1), transform 360ms cubic-bezier(.16,1,.3,1)',
                  transitionDelay: reduced ? '0ms' : `${i * 360}ms`,
                }}
              >
                {isAnna && (
                  <span aria-hidden="true" style={{
                    flex: 'none', width: 28, height: 28, borderRadius: '50%', background: 'var(--wine-800)', color: 'var(--gold-300)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, alignSelf: 'flex-end',
                  }}>А</span>
                )}
                <div style={{
                  maxWidth: '80%', padding: '9px 12px', fontSize: 16, lineHeight: 1.45,
                  borderRadius: isAnna ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                  background: isAnna ? 'var(--surface)' : 'var(--wine-800)',
                  color: isAnna ? 'var(--text)' : 'var(--ivory)',
                  border: isAnna ? '1px solid var(--border)' : 'none',
                }}>
                  {isAnna && <strong style={{ fontWeight: 600 }}>Анна: </strong>}
                  {m.content}
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 4, padding: '10px 12px', background: 'var(--success-tint)', borderRadius: 'var(--r-card-sm)', color: 'var(--success-text)', fontSize: 16, fontWeight: 600 }}>
            <Icon name="check" size={20} />
            Пациент записан · чистка, завтра 10:00
          </div>
        </div>
      )}
    </div>
  );
}

function StepHead({ icon, title, text }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span aria-hidden="true" style={{
          flex: 'none', width: 40, height: 40, borderRadius: 'var(--r-card-sm)', background: 'var(--surface-subtle)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={22} color="var(--wine-800)" />
        </span>
        <h2 className="h4" style={{ fontSize: 20 }}>{title}</h2>
      </div>
      {text ? <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 12 }}>{text}</p> : null}
    </div>
  );
}
