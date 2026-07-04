/* Мок-данные кабинета «Подхват AI+».
   Используются lib/api.js, когда бэкенд недоступен (dev/preview без сервера)
   или при VITE_API_MOCK=1. Данные реалистичные — кабинет полностью просматриваемый.
   Состояние мутируется в памяти сессии (смена статуса лида, сохранение настроек). */

const clinic = { slug: 'demo-dent', name: 'Демо-Дент' };

let leads = [
  {
    id: 'l1', name: 'Марина Соколова', phone: '+7 912 118-04-77', service: 'Острая боль — скол',
    preferred_time: 'как можно раньше', slot: '', urgency: 'high', status: 'new',
    is_urgent: true, is_night: true, wants_human: false, wants_callback: false, recovered_from_miss: true,
    est_sum: 8000, source: 'call', channel: 'call',
    resume: 'Пишет ночью: откололся кусок зуба, ноет. Предложила приехать к открытию, ждёт подтверждения времени.',
    created_at: '2026-07-04T02:14:00',
  },
  {
    id: 'l2', name: 'Ольга Ветрова', phone: '+7 903 245-67-89', service: 'Профгигиена',
    preferred_time: 'утро', slot: 'чт 09:30', urgency: 'normal', status: 'pending',
    is_urgent: false, is_night: true, wants_human: false, wants_callback: false, recovered_from_miss: true,
    est_sum: 6000, source: 'call', channel: 'max',
    resume: 'Не дозвонилась вечером, написала в MAX. Подобрала слот чт 09:30 — нужно подтвердить запись.',
    created_at: '2026-07-04T07:41:00',
  },
  {
    id: 'l3', name: 'Игорь Панфилов', phone: '+7 916 502-31-10', service: 'Консультация ортопеда',
    preferred_time: 'вечер буднего дня', slot: '', urgency: 'normal', status: 'new',
    is_urgent: false, is_night: false, wants_human: false, wants_callback: false, recovered_from_miss: true,
    est_sum: 4500, source: 'telegram', channel: 'telegram',
    resume: 'Спрашивает про коронки. Уточняю удобное время, готова предложить слоты на вечер.',
    created_at: '2026-07-04T10:05:00',
  },
  {
    id: 'l4', name: 'Светлана Дорн', phone: '+7 905 771-22-64', service: 'Имплантация',
    preferred_time: 'пятница', slot: 'пт 12:00', urgency: 'normal', status: 'booked',
    is_urgent: false, is_night: false, wants_human: false, wants_callback: false, recovered_from_miss: false,
    est_sum: 42000, source: 'max', channel: 'max',
    resume: 'Записана на консультацию по имплантации, пт 12:00. Прислала снимок заранее.',
    created_at: '2026-07-03T13:22:00',
  },
  {
    id: 'l5', name: 'Дмитрий Ким', phone: '+7 926 044-19-08', service: 'Лечение кариеса',
    preferred_time: 'просит перезвонить', slot: '', urgency: 'normal', status: 'callback',
    is_urgent: false, is_night: false, wants_human: true, wants_callback: true, recovered_from_miss: true,
    est_sum: 3500, source: 'call', channel: 'call',
    resume: 'Хочет обсудить голосом, просил перезвонить после 17:00. Передаю администратору.',
    created_at: '2026-07-04T09:12:00',
  },
  {
    id: 'l6', name: 'Анна Кравец', phone: '+7 912 337-58-41', service: 'Отбеливание',
    preferred_time: 'суббота', slot: 'сб 15:00', urgency: 'normal', status: 'confirmed',
    is_urgent: false, is_night: false, wants_human: false, wants_callback: false, recovered_from_miss: false,
    est_sum: 9000, source: 'sms', channel: 'sms',
    resume: 'Подтвердила слот сб 15:00 по SMS. Напоминание уйдёт накануне.',
    created_at: '2026-07-03T18:40:00',
  },
  {
    id: 'l7', name: 'Пётр Ялов', phone: '+7 900 512-73-66', service: 'Удаление зуба',
    preferred_time: '', slot: '', urgency: 'normal', status: 'lost',
    is_urgent: false, is_night: false, wants_human: false, wants_callback: false, recovered_from_miss: true,
    est_sum: 5000, source: 'call', channel: 'call',
    resume: 'Дважды не ответил на сообщения за сутки. Отметила как потерянного — можно вернуть офером.',
    created_at: '2026-07-02T20:03:00',
  },
  {
    id: 'l8', name: 'Наталья Ежова', phone: '+7 917 806-45-12', service: 'Брекеты — консультация',
    preferred_time: 'вторник вечер', slot: 'вт 18:00', urgency: 'normal', status: 'pending',
    is_urgent: false, is_night: true, wants_human: false, wants_callback: false, recovered_from_miss: true,
    est_sum: 7000, source: 'telegram', channel: 'telegram',
    resume: 'Ночной запрос про брекеты. Подобрала вт 18:00 — ждёт подтверждения записи.',
    created_at: '2026-07-04T01:28:00',
  },
  {
    id: 'l9', name: 'Елена Рой', phone: '+7 903 900-16-25', service: 'Острая боль — флюс',
    preferred_time: 'сегодня', slot: '', urgency: 'high', status: 'new',
    is_urgent: true, is_night: false, wants_human: true, wants_callback: true, recovered_from_miss: true,
    est_sum: 15000, source: 'call', channel: 'call',
    resume: 'Сильная боль, отёк щеки. Просит принять сегодня — нужен срочный звонок и место в графике.',
    created_at: '2026-07-04T11:47:00',
  },
  {
    id: 'l10', name: 'Кирилл Осин', phone: '+7 927 611-38-90', service: 'Профгигиена',
    preferred_time: 'на неделе', slot: '', urgency: 'normal', status: 'new',
    is_urgent: false, is_night: false, wants_human: false, wants_callback: false, recovered_from_miss: true,
    est_sum: 6000, source: 'max', channel: 'max',
    resume: 'Пропущенный днём, Анна написала в MAX и вернула в диалог. Выбирает день для чистки.',
    created_at: '2026-07-04T12:31:00',
  },
];

const transcripts = {
  l1: [
    { role: 'user', content: 'Здравствуйте! Ночью откололся кусок зуба, теперь ноет. Можно к вам?', created_at: '2026-07-04T02:14:00' },
    { role: 'assistant', content: 'Здравствуйте! Сочувствую — это неприятно. Мы поможем. Боль сильная или терпимая сейчас?', created_at: '2026-07-04T02:14:00' },
    { role: 'user', content: 'Терпимо, но неприятно. Утром работаете?', created_at: '2026-07-04T02:15:00' },
    { role: 'assistant', content: 'Да, открываемся в 09:00. Могу поставить вас первой на 09:15 к дежурному врачу — он посмотрит и снимет боль. Подойдёт?', created_at: '2026-07-04T02:15:00' },
    { role: 'user', content: 'Да, давайте.', created_at: '2026-07-04T02:16:00' },
    { role: 'assistant', content: 'Записала предварительно на 09:15. Утром администратор подтвердит и пришлёт адрес. Держитесь, до встречи!', created_at: '2026-07-04T02:16:00' },
  ],
  l2: [
    { role: 'assistant', content: 'Здравствуйте! Вы звонили в «Демо-Дент», но мы не успели ответить. Подскажу свободное время — вам на профгигиену?', created_at: '2026-07-04T07:40:00' },
    { role: 'user', content: 'Да, на чистку. Лучше утром.', created_at: '2026-07-04T07:41:00' },
    { role: 'assistant', content: 'Есть четверг 09:30 и пятница 08:45. Какой вариант удобнее?', created_at: '2026-07-04T07:41:00' },
    { role: 'user', content: 'Четверг 09:30.', created_at: '2026-07-04T07:42:00' },
    { role: 'assistant', content: 'Отметила чт 09:30. Администратор подтвердит запись и пришлёт напоминание накануне.', created_at: '2026-07-04T07:42:00' },
  ],
  l9: [
    { role: 'user', content: 'Очень болит, щёку раздуло. Мне нужно срочно!', created_at: '2026-07-04T11:46:00' },
    { role: 'assistant', content: 'Понимаю, это срочно. Похоже на флюс — вас нужно принять сегодня. Уточню окно у администратора и мы вам перезвоним в течение нескольких минут. Ваш номер верный, +7 903 900-16-25?', created_at: '2026-07-04T11:47:00' },
    { role: 'user', content: 'Да, верный. Жду звонка.', created_at: '2026-07-04T11:47:00' },
  ],
};

function fallbackTranscript(lead) {
  return [
    { role: 'assistant', content: `Здравствуйте! Вы обращались в «Демо-Дент» по вопросу «${lead.service}». Подскажу свободное время?`, created_at: lead.created_at },
    { role: 'user', content: 'Да, подскажите, пожалуйста.', created_at: lead.created_at },
    { role: 'assistant', content: lead.resume, created_at: lead.created_at },
  ];
}

let money = {
  total: 39200,
  leads: 14,
  pilot_price: 15000,
  pilot_paid_back: true,
  payback_day: 5,
  by_day: [
    { day: 'Пн', leads: 1, rub: 3200 },
    { day: 'Вт', leads: 0, rub: 0 },
    { day: 'Ср', leads: 2, rub: 6000 },
    { day: 'Чт', leads: 2, rub: 4500 },
    { day: 'Пт', leads: 3, rub: 8000 },
    { day: 'Сб', leads: 4, rub: 12000 },
    { day: 'Вс', leads: 2, rub: 5500 },
  ],
};

const streak = {
  current_streak_days: 47,
  record_days: 63,
  last_incident: { date: '2026-06-12', resolved_in_minutes: 8 },
};

let settings = {
  name: 'Демо-Дент',
  work_hours: '09:00–21:00',
  tone: 'Тёплый и короткий тон, на «вы». Предлагаю конкретные слоты из графика, цены называю диапазоном — точную назовёт врач. Никакого «перезвоните в рабочее время».',
  phone_display: '+7 912 345-67-89',
  services: [
    { name: 'Консультация', price_from: 0 },
    { name: 'Профгигиена', price_from: 4500 },
    { name: 'Лечение кариеса', price_from: 3500 },
    { name: 'Удаление зуба', price_from: 2500 },
    { name: 'Имплантация', price_from: 35000 },
  ],
  channels: { max: true, telegram: true, sms: false },
  sound_success: false,
  theme: 'light',
};

function json(data) {
  // Небольшая задержка, чтобы UI-состояния загрузки были видимы в демо.
  return new Promise((resolve) => setTimeout(() => resolve(structuredCloneSafe(data)), 220));
}

function structuredCloneSafe(v) {
  return typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v));
}

/* Разбор пути + query без зависимости от базового URL. */
function parse(path) {
  const [p, q = ''] = path.split('?');
  const query = Object.fromEntries(new URLSearchParams(q));
  return { p, query };
}

// Демо-сессия: превью стартует «залогиненным»; «Выйти» → loggedIn=false → вход.
let loggedIn = true;

function need401() {
  return Promise.reject(Object.assign(new Error('unauthorized'), { status: 401 }));
}

export function mockHandle(path, method = 'GET', body = null) {
  const { p, query } = parse(path);

  // --- Авторизация (мок) ---
  if (p === '/api/auth/verify') {
    if (!query.token) return need401();
    loggedIn = true;                       // magic-link «вошёл»
    return json({ clinic });               // токен — как в проде, в теле его нет
  }
  if (p === '/api/auth/session') {
    return loggedIn ? json({ clinic }) : need401();
  }
  if (p === '/api/auth/logout') {
    loggedIn = false;
    return json({ ok: true });
  }
  // Всё ниже — только для авторизованных (как на реальном /api).
  if (!loggedIn) return need401();

  if (p === '/api/leads') {
    const list = query.status ? leads.filter((l) => l.status === query.status) : leads;
    return json({ leads: list });
  }

  const mTranscript = p.match(/^\/api\/leads\/([^/]+)\/transcript$/);
  if (mTranscript) {
    const lead = leads.find((l) => l.id === mTranscript[1]);
    return json({ messages: transcripts[mTranscript[1]] || (lead ? fallbackTranscript(lead) : []) });
  }

  const mStatus = p.match(/^\/api\/leads\/([^/]+)\/status$/);
  if (mStatus) {
    const lead = leads.find((l) => l.id === mStatus[1]);
    if (lead && body && body.status) {
      lead.status = body.status;
      if (body.status === 'booked' || body.status === 'confirmed' || body.status === 'lost') lead.is_urgent = false;
    }
    return json({ lead });
  }

  const mConfirm = p.match(/^\/api\/leads\/([^/]+)\/confirm$/);
  if (mConfirm) {
    const lead = leads.find((l) => l.id === mConfirm[1]);
    if (lead) {
      lead.status = 'confirmed';
      lead.is_urgent = false;
      if (body && body.slot) lead.slot = body.slot;
    }
    return json({ lead });
  }

  if (p === '/api/money/weekly') return json(money);
  if (p === '/api/reliability-streak') return json(streak);

  if (p === '/api/settings') {
    if (method === 'POST') {
      settings = { ...settings, ...(body && body.settings ? body.settings : {}) };
      return json({ ok: true, settings });
    }
    return json({ settings });
  }

  return Promise.reject(Object.assign(new Error('mock: no route ' + p), { status: 404 }));
}
