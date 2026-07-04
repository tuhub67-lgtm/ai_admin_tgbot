/* Яндекс.Метрика — подключается только если задан VITE_METRIKA_ID (иначе no-op).
   Цели (meta): отправка заявки, клик RuStore, клик «Войти». */

const ID = import.meta.env.VITE_METRIKA_ID;

let loaded = false;

export function initMetrika() {
  if (loaded || !ID || typeof window === 'undefined') return;
  loaded = true;
  /* eslint-disable */
  (function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    for (let j = 0; j < e.length; j++) { if (e[j] === r) { return; } }
    k = e.createElement(t); a = e.getElementsByTagName(t)[0];
    k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

  window.ym(ID, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: false,
  });
  /* eslint-enable */
}

export function reachGoal(goal, params) {
  if (!ID || typeof window === 'undefined' || typeof window.ym !== 'function') return;
  window.ym(ID, 'reachGoal', goal, params);
}

export const GOALS = {
  LEAD_SUBMIT: 'lead_submit',
  RUSTORE_CLICK: 'rustore_click',
  LOGIN_CLICK: 'login_click',
};
