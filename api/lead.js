/* Vercel serverless-функция приёма заявки с сайта.
   POST JSON { name, clinic, phone, city, source, hp } → сообщение владельцу в Telegram.
   Секреты — только env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID. Валидация и honeypot — на сервере. */

function normalizePhone(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  let n = d;
  if (n.length === 11 && (n[0] === '8' || n[0] === '7')) n = '7' + n.slice(1);
  else if (n.length === 10) n = '7' + n;
  else return null;
  return '+' + n;
}

function escapeHtml(s) {
  return String(s || '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot: скрытое поле заполнено — это бот. Тихо принимаем и ничего не шлём.
  if (body.hp || body.company || body.website) {
    return res.status(200).json({ ok: true });
  }

  const name = String(body.name || '').trim();
  const clinic = String(body.clinic || '').trim();
  const phone = normalizePhone(body.phone);
  const city = String(body.city || '').trim();
  const source = String(body.source || 'landing').trim().slice(0, 40);

  if (!name || name.length > 120 || !clinic || clinic.length > 200 || !phone) {
    return res.status(400).json({ ok: false, error: 'validation' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const text =
    'Новая заявка с сайта\n\n' +
    `Имя: ${escapeHtml(name)}\n` +
    `Клиника: ${escapeHtml(clinic)}\n` +
    `Телефон: ${escapeHtml(phone)}\n` +
    (city ? `Город: ${escapeHtml(city)}\n` : '') +
    `Источник: ${escapeHtml(source)}`;

  if (!token || !chatId) {
    // Не настроено — не теряем заявку молча: пишем в лог функции, форме отвечаем успехом.
    console.warn('[api/lead] TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID не заданы. Заявка:', { name, clinic, phone, city, source });
    return res.status(200).json({ ok: true, delivered: false });
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!tgRes.ok) {
      const detail = await tgRes.text().catch(() => '');
      console.error('[api/lead] Telegram error', tgRes.status, detail);
      return res.status(502).json({ ok: false, error: 'delivery' });
    }
    return res.status(200).json({ ok: true, delivered: true });
  } catch (err) {
    console.error('[api/lead] fetch failed', err?.message);
    return res.status(502).json({ ok: false, error: 'delivery' });
  }
}
