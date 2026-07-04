import React, { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '../lib/api.js';
import { useTheme } from '../theme.jsx';
import { Input } from '../../design/components/controls/Input.jsx';
import { Toggle } from '../../design/components/controls/Toggle.jsx';
import { Button } from '../../design/components/controls/Button.jsx';
import { EmptyState } from '../../design/components/feedback/EmptyState.jsx';
import { useToast, ToastHost } from '../components/ToastHost.jsx';
import { isEnabled as soundEnabled, setEnabled as setSoundEnabled, playSuccess } from '../lib/sound.js';

/* «Настройки»: часы работы, прайс по услугам, тон Анны, каналы, тема, звук. Сохранение → POST. */

function Card({ title, children }) {
  return (
    <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-card)', padding: '16px', boxShadow: 'var(--shadow-card)', display: 'grid', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{title}</div>
      {children}
    </section>
  );
}

export default function Settings() {
  const { theme, toggle } = useTheme();
  const { toast, showToast } = useToast();
  const [sound, setSound] = useState(false);
  useEffect(() => { setSound(soundEnabled()); }, []);
  const onSound = (on) => { setSound(on); setSoundEnabled(on); if (on) playSuccess(); }; // превью «динга» по жесту

  const [form, setForm] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | error
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const d = await api.get('/api/settings');
      setForm({
        work_hours: d.work_hours || '',
        services: Array.isArray(d.services) ? d.services.map((s) => ({ name: s.name || '', price_from: s.price_from ?? '', price_to: s.price_to ?? '' })) : [],
        anna_tone: d.anna_tone || '',
        channels: { max: !!d.channels?.max, telegram: !!d.channels?.telegram, sms: !!d.channels?.sms },
      });
      setState('ready');
    } catch (e) {
      if (e instanceof ApiError && e.kind === 'auth') return;
      setState('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setChannel = (name, value) => setForm((f) => ({ ...f, channels: { ...f.channels, [name]: value } }));
  const setService = (idx, key, value) =>
    setForm((f) => ({ ...f, services: f.services.map((s, i) => (i === idx ? { ...s, [key]: value } : s)) }));

  const toNum = (v) => { const n = parseInt(String(v).replace(/\D/g, ''), 10); return Number.isNaN(n) ? 0 : n; };

  const save = async () => {
    if (saving || !form) return;
    setSaving(true);
    try {
      await api.post('/api/settings', {
        work_hours: form.work_hours,
        services: form.services.map((s) => ({ name: s.name, price_from: toNum(s.price_from), price_to: toNum(s.price_to) })),
        anna_tone: form.anna_tone,
        channels: form.channels,
      });
      showToast({ variant: 'success', title: 'Настройки сохранены' });
    } catch (e) {
      if (!(e instanceof ApiError && e.kind === 'auth')) showToast({ variant: 'urgent', title: 'Что-то пошло не так, уже чиним' });
    } finally { setSaving(false); }
  };

  if (state === 'loading') {
    return <div style={{ padding: '32px 8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 16 }}>Загружаю настройки…</div>;
  }
  if (state === 'error' || !form) {
    return (
      <EmptyState
        title="Что-то пошло не так, уже чиним"
        text="Обновите через минуту — настройки вернутся."
        actionLabel="Обновить"
        actionIcon="return"
        onAction={load}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
      <Card title="Часы работы">
        <Input
          label="Когда клиника принимает"
          placeholder="пн–пт 9:00–20:00, сб 10:00–16:00"
          value={form.work_hours}
          onChange={(e) => setField('work_hours', e.target.value)}
          icon="clock"
        />
      </Card>

      <Card title="Прайс по услугам">
        {form.services.length === 0 ? (
          <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Услуги пока не заданы. Их можно добавить в онбординге.</div>
        ) : (
          form.services.map((s, i) => (
            <div key={i} style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{s.name || `Услуга ${i + 1}`}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Input label="от" type="number" suffix="₽" value={s.price_from} onChange={(e) => setService(i, 'price_from', e.target.value)} />
                <Input label="до" type="number" suffix="₽" value={s.price_to} onChange={(e) => setService(i, 'price_to', e.target.value)} />
              </div>
            </div>
          ))
        )}
      </Card>

      <Card title="Голос Анны">
        <Input
          label="Как Анна говорит с пациентами"
          placeholder="тепло, коротко, на «вы»"
          value={form.anna_tone}
          onChange={(e) => setField('anna_tone', e.target.value)}
        />
      </Card>

      <Card title="Куда писать пациентам">
        <Toggle checked={form.channels.max} onChange={(v) => setChannel('max', v)} label="MAX" description="Основной канал — сюда первым делом" />
        <Toggle checked={form.channels.telegram} onChange={(v) => setChannel('telegram', v)} label="Telegram" description="Если пациент есть в Telegram" />
        <Toggle checked={form.channels.sms} onChange={(v) => setChannel('sms', v)} label="SMS" description="Резерв — когда мессенджеры молчат" />
      </Card>

      <Card title="Оформление">
        <Toggle checked={theme === 'dark'} onChange={toggle} label="Тёмная тема" description="Удобно вечером и при ярком экране" />
        <Toggle checked={sound} onChange={onSound} label="Звуки успеха" description="Тихий сигнал при новой записи. По умолчанию выключено" />
      </Card>

      <div style={{ position: 'sticky', bottom: 12, display: 'grid', gap: 8 }}>
        <Button variant="primary" size="lg" full disabled={saving} onClick={save}>
          {saving ? 'Сохраняю…' : 'Сохранить'}
        </Button>
      </div>

      <ToastHost toast={toast} />
    </div>
  );
}
