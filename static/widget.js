/* Виджет «Подхват» — чат с ИИ-администратором клиники.
 *
 * Подключение на сайте клиники:
 *   <script src="https://ДОМЕН/static/widget.js" data-clinic="demo-dent" defer></script>
 *
 * Ванильный JS, стили в Shadow DOM — не трогает CSS сайта клиники.
 * Сессия — uuid (localStorage + cookie), REST-поллинг каждые 2 с при
 * открытом окне. Дизайн-токены лендинга: текст #16212B, акцент #1F9D6B.
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;
  var CLINIC = script.getAttribute('data-clinic');
  if (!CLINIC) { console.warn('[podkhvat] нет data-clinic'); return; }
  var BASE = new URL(script.src).origin;
  var API = BASE + '/api/chat';
  var SID_KEY = 'podkhvat_sid_' + CLINIC;

  var accent = script.getAttribute('data-color') || '#1F9D6B';
  var sid = null, lastId = 0, open = false, pollTimer = null, busy = false;
  var clinicName = 'Онлайн-запись';

  /* ---------- DOM ---------- */
  var host = document.createElement('div');
  var root = host.attachShadow({ mode: 'closed' });
  document.addEventListener('DOMContentLoaded', mount);
  if (document.readyState !== 'loading') mount();
  function mount() { if (!host.isConnected) document.body.appendChild(host); }

  var css = [
    ':host{all:initial}',
    '*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}',
    '.bubble{position:fixed;right:20px;bottom:20px;width:56px;height:56px;border-radius:50%;',
    'background:var(--acc);border:none;cursor:pointer;box-shadow:0 4px 16px rgba(22,33,43,.25);',
    'display:flex;align-items:center;justify-content:center;z-index:2147483000;transition:transform .15s}',
    '.bubble:hover{transform:scale(1.06)}',
    '.win{position:fixed;right:20px;bottom:88px;width:340px;max-width:calc(100vw - 32px);height:480px;',
    'max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(22,33,43,.28);',
    'display:none;flex-direction:column;overflow:hidden;z-index:2147483000}',
    '.win.open{display:flex}',
    '.head{background:var(--acc);color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between}',
    '.head b{font-size:15px}',
    '.head small{display:block;font-weight:400;font-size:12px;opacity:.85}',
    '.x{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1;padding:4px}',
    '.msgs{flex:1;overflow-y:auto;padding:12px;background:#F5F7F8}',
    '.m{max-width:82%;margin:0 0 8px;padding:9px 12px;border-radius:12px;font-size:14px;line-height:1.4;',
    'color:#16212B;white-space:pre-wrap;word-wrap:break-word}',
    '.m.a{background:#fff;border-bottom-left-radius:4px;box-shadow:0 1px 2px rgba(22,33,43,.08)}',
    '.m.u{background:var(--acc);color:#fff;margin-left:auto;border-bottom-right-radius:4px}',
    '.typing{opacity:.6;font-style:italic}',
    '.human{background:none;border:none;color:#5B6B7A;font-size:12px;cursor:pointer;',
    'padding:4px 12px 8px;text-decoration:underline;text-align:left}',
    '.row{display:flex;border-top:1px solid #E3E8EC;background:#fff}',
    '.inp{flex:1;border:none;outline:none;padding:12px 14px;font-size:14px;color:#16212B;resize:none}',
    '.send{background:none;border:none;color:var(--acc);font-weight:700;font-size:14px;cursor:pointer;padding:0 16px}',
    '.send:disabled{opacity:.4;cursor:default}'
  ].join('');

  var icon = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none">' +
    '<path d="M12 3C7 3 3 6.6 3 11c0 2.2 1 4.1 2.6 5.5L5 21l4-1.6c.9.3 1.9.4 3 .4 5 0 9-3.6 9-8s-4-8.8-9-8.8z" fill="#fff"/></svg>';

  root.innerHTML = '<style>' + css + '</style>' +
    '<button class="bubble" aria-label="Открыть чат">' + icon + '</button>' +
    '<div class="win" role="dialog" aria-label="Чат с администратором">' +
    '<div class="head"><div><b class="t">Онлайн-запись</b><small>Отвечаем в течение минуты</small></div>' +
    '<button class="x" aria-label="Закрыть">×</button></div>' +
    '<div class="msgs"></div>' +
    '<button class="human">Позвать живого администратора</button>' +
    '<div class="row"><textarea class="inp" rows="1" placeholder="Напишите сообщение…"></textarea>' +
    '<button class="send">➤</button></div></div>';

  host.style.setProperty('--acc', accent);
  root.querySelector('.bubble').style.setProperty('--acc', accent);
  var win = root.querySelector('.win');
  win.style.setProperty('--acc', accent);
  var msgs = root.querySelector('.msgs');
  var inp = root.querySelector('.inp');
  var sendBtn = root.querySelector('.send');

  root.querySelector('.bubble').addEventListener('click', toggle);
  root.querySelector('.x').addEventListener('click', toggle);
  sendBtn.addEventListener('click', send);
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  root.querySelector('.human').addEventListener('click', callHuman);

  /* ---------- API ---------- */
  function req(path, opts) {
    opts = opts || {};
    opts.headers = { 'Content-Type': 'application/json' };
    opts.credentials = 'include';
    return fetch(API + path, opts).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function start() {
    var body = { clinic: CLINIC };
    if (sid) body.session_id = sid;
    return req('/start', { method: 'POST', body: JSON.stringify(body) })
      .then(function (d) {
        sid = d.session_id;
        try { localStorage.setItem(SID_KEY, sid); } catch (e) {}
        if (d.clinic) {
          clinicName = d.clinic.name;
          root.querySelector('.t').textContent = clinicName;
          if (!script.getAttribute('data-color') && d.clinic.color) setAccent(d.clinic.color);
        }
        d.messages.forEach(function (m) {
          render(m.role, m.content);
          if (m.id > lastId) lastId = m.id;
        });
      });
  }

  function setAccent(c) {
    root.querySelector('.bubble').style.setProperty('--acc', c);
    win.style.setProperty('--acc', c);
  }

  function poll() {
    if (!sid || !open) return;
    req('/poll?session_id=' + encodeURIComponent(sid) + '&after_id=' + lastId, { method: 'GET' })
      .then(function (d) {
        d.messages.forEach(function (m) { render('assistant', m.content); });
        if (d.last_id > lastId) lastId = d.last_id;
      })
      .catch(function () {});
  }

  function send() {
    var text = inp.value.trim();
    if (!text || busy || !sid) return;
    inp.value = '';
    render('user', text);
    setBusy(true);
    req('/message', { method: 'POST', body: JSON.stringify({ session_id: sid, text: text }) })
      .then(function () { poll(); })
      .catch(function () { render('assistant', 'Не получилось отправить. Попробуйте ещё раз.'); })
      .finally(function () { setBusy(false); });
  }

  function callHuman() {
    if (!sid || busy) return;
    setBusy(true);
    req('/human', { method: 'POST', body: JSON.stringify({ session_id: sid }) })
      .then(function () { poll(); })
      .catch(function () {})
      .finally(function () { setBusy(false); });
  }

  /* ---------- UI ---------- */
  function toggle() {
    open = !open;
    win.classList.toggle('open', open);
    if (open) {
      if (!sid) {
        var saved = null;
        try { saved = localStorage.getItem(SID_KEY); } catch (e) {}
        if (saved) sid = saved;
        start().catch(function () {
          sid = null;
          try { localStorage.removeItem(SID_KEY); } catch (e) {}
          render('assistant', 'Чат временно недоступен. Позвоните нам — номер на сайте.');
        });
      }
      pollTimer = setInterval(poll, 2000);
      inp.focus();
    } else if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function render(role, text) {
    var div = document.createElement('div');
    div.className = 'm ' + (role === 'user' ? 'u' : 'a');
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function setBusy(b) {
    busy = b;
    sendBtn.disabled = b;
    var t = root.querySelector('.typing');
    if (b) {
      if (!t) {
        t = document.createElement('div');
        t.className = 'm a typing';
        t.textContent = 'Анна печатает…';
        msgs.appendChild(t);
        msgs.scrollTop = msgs.scrollHeight;
      }
    } else if (t) t.remove();
  }
})();
