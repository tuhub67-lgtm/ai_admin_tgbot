import { useEffect, useState } from 'react';
import { Input } from '../design/components/controls/Input.jsx';
import { Toggle } from '../design/components/controls/Toggle.jsx';
import { Button } from '../design/components/controls/Button.jsx';
import { Icon } from '../design/components/core/Icon.jsx';
import { BearMark } from '../design/components/core/BearMark.jsx';
import { Reveal } from '../lib/anim.jsx';
import { api } from './lib/api.js';
import { useTheme } from './lib/theme.js';
import { useToasts, ToastStack } from './lib/toast.jsx';

const CHANNELS = [
  { key: 'max', icon: 'max', label: 'MAX', hint: 'Основной канал возврата пациентов' },
  { key: 'telegram', icon: 'telegram', label: 'Telegram', hint: 'Для тех, кому удобнее в Telegram' },
  { key: 'sms', icon: 'sms', label: 'SMS', hint: 'Запасной канал, если мессенджеров нет' },
];

function Section({ icon, title, children }) {
  return (
    <section
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-card)',
        boxShadow: 'var(--shadow-card)', padding: 24, marginTop: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <Icon name={icon} size={20} color="var(--text-secondary)" />
        <h2 className="h4" style={{ fontSize: 18 }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function Settings() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [theme, , setTheme] = useTheme();
  const { toasts, toast, dismiss } = useToasts();

  useEffect(() => {
    let alive = true;
    api.getSettings()
      .then((r) => { if (alive) setForm(r.settings || {}); })
      .catch(() => { if (alive) setForm({}); });
    return () => { alive = false; };
  }, []);

  if (!form) return <Loading />;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setChannel = (key, on) => set({ channels: { ...(form.channels || {}), [key]: on } });
  const setService = (i, patch) => set({ services: form.services.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });
  const removeService = (i) => set({ services: form.services.filter((_, idx) => idx !== i) });
  const addService = () => set({ services: [...(form.services || []), { name: '', price_from: 0 }] });

  async function save() {
    setSaving(true);
    try {
      await api.saveSettings({ ...form, theme });
      toast({ variant: 'success', title: 'Настройки сохранены', text: 'Анна уже работает по-новому' });
    } catch {
      toast({ variant: 'urgent', title: 'Не удалось сохранить', text: 'Проверьте связь и попробуйте ещё раз' });
    } finally {
      setSaving(false);
    }
  }

  const services = form.services || [];

  return (
    <>
      <Reveal>
        <header style={{ paddingTop: 24 }}>
          <div className="overline" style={{ color: 'var(--text-secondary)' }}>Настройки</div>
          <h1 className="h2" style={{ marginTop: 6 }}>Как работает Анна</h1>
        </header>
      </Reveal>

      <Reveal delay={40}>
        <Section icon="clock" title="Клиника и график">
          <div style={{ display: 'grid', gap: 16 }}>
            <Input label="Название клиники" value={form.name || ''} onChange={(e) => set({ name: e.target.value })} placeholder="Демо-Дент" />
            <Input label="Часы работы" icon="clock" value={form.work_hours || ''} onChange={(e) => set({ work_hours: e.target.value })} placeholder="09:00–21:00" hint="Анна предлагает слоты только в это окно" />
            <Input label="Телефон для пациентов" type="tel" icon="call" value={form.phone_display || ''} onChange={(e) => set({ phone_display: e.target.value })} placeholder="+7 912 345-67-89" />
          </div>
        </Section>
      </Reveal>

      <Reveal delay={80}>
        <Section icon="ruble" title="Прайс — диапазоны от">
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
            Анна называет цены диапазоном «от», точную сумму озвучит врач.
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            {services.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <Input value={s.name} onChange={(e) => setService(i, { name: e.target.value })} placeholder="Услуга" style={{ flex: 2 }} />
                <Input type="number" value={String(s.price_from ?? '')} onChange={(e) => setService(i, { price_from: Number(e.target.value) || 0 })} placeholder="0" suffix="₽ от" style={{ flex: 1, minWidth: 120 }} />
                <button
                  type="button"
                  onClick={() => removeService(i)}
                  aria-label={`Удалить «${s.name || 'услугу'}»`}
                  style={{ flex: 'none', width: 48, height: 48, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--border-strong)', borderRadius: 'var(--r-btn)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <Icon name="call-missed" size={18} />
                </button>
              </div>
            ))}
          </div>
          <Button variant="secondary" size="sm" icon="patient" onClick={addService} style={{ marginTop: 14 }}>Добавить услугу</Button>
        </Section>
      </Reveal>

      <Reveal delay={120}>
        <Section icon="dialog" title="Голос Анны">
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: 16, fontWeight: 500, marginBottom: 6 }}>Тон и правила общения</span>
            <textarea
              value={form.tone || ''}
              onChange={(e) => set({ tone: e.target.value })}
              rows={4}
              placeholder="Тёплый и короткий тон, на «вы»…"
              style={{
                width: '100%', resize: 'vertical', minHeight: 96, padding: '12px 14px',
                fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.5, color: 'var(--text)',
                background: 'var(--surface)', border: '1.5px solid var(--border-strong)', borderRadius: 'var(--r-input)',
                outline: 'none',
              }}
            />
          </label>
        </Section>
      </Reveal>

      <Reveal delay={160}>
        <Section icon="return" title="Каналы связи">
          <div style={{ display: 'grid', gap: 4 }}>
            {CHANNELS.map((c) => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icon name={c.icon} size={22} color="var(--text-secondary)" style={{ flex: 'none' }} />
                <Toggle
                  checked={!!(form.channels && form.channels[c.key])}
                  onChange={(v) => setChannel(c.key, v)}
                  label={c.label}
                  description={c.hint}
                  style={{ flex: 1 }}
                />
              </div>
            ))}
          </div>
        </Section>
      </Reveal>

      <Reveal delay={200}>
        <Section icon="settings" title="Кабинет">
          <div style={{ display: 'grid', gap: 4 }}>
            <Toggle
              checked={!!form.sound_success}
              onChange={(v) => set({ sound_success: v })}
              label="Звуки успеха"
              description="Короткий «динь» при записи пациента. По умолчанию выключено."
            />
            <Toggle
              checked={theme === 'dark'}
              onChange={(v) => setTheme(v ? 'dark' : 'light')}
              label="Тёмная тема"
              description="Уголь с винными и золотыми акцентами."
            />
          </div>
        </Section>
      </Reveal>

      <Reveal delay={240}>
        <div style={{ display: 'flex', gap: 12, margin: '20px 0 8px', position: 'sticky', bottom: 0 }}>
          <Button variant="primary" size="lg" icon="check" onClick={save} disabled={saving}>
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </Button>
        </div>
      </Reveal>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px', color: 'var(--text-secondary)' }}>
      <BearMark size={64} strokeWidth={3} style={{ color: 'var(--border-strong)', marginBottom: 16 }} />
      <div style={{ fontSize: 16 }}>Открываем настройки…</div>
    </div>
  );
}
