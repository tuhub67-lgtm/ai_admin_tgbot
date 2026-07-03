/* Яндекс.Метрика через env. Пусто — не подключаем, а логируем цели в консоль
   (чтобы цели можно было проверить без счётчика — см. Definition of Done).
   Основное имя счётчика — VITE_YM_ID (спецификация сайта). VITE_METRIKA_ID — синоним. */

const YM_ID = import.meta.env.VITE_YM_ID || import.meta.env.VITE_METRIKA_ID || '';

let inited = false;

export function initMetrika() {
  if (inited || typeof window === 'undefined') return;
  inited = true;
  if (!YM_ID) {
    // Счётчик не задан — цели пойдут в консоль (dev/preview).
    // eslint-disable-next-line no-console
    console.info('[metrika] VITE_YM_ID не задан — цели логируются в консоль, счётчик не подключается.');
    return;
  }
  /* Стандартный инициализатор Метрики. */
  (function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    for (let j = 0; j < e.scripts.length; j++) { if (e.scripts[j].src === r) return; }
    k = e.createElement(t); a = e.getElementsByTagName(t)[0];
    k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

  window.ym(Number(YM_ID), 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: false,
  });
}

/* Цели: lead_submit, rustore_click, login_click, calc_used. */
export function reachGoal(goal, params) {
  if (typeof window !== 'undefined' && YM_ID && typeof window.ym === 'function') {
    window.ym(Number(YM_ID), 'reachGoal', goal, params);
  } else {
    // eslint-disable-next-line no-console
    console.info('[metrika] цель:', goal, params || '');
  }
}
