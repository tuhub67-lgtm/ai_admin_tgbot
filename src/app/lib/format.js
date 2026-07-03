/* Форматтеры кабинета в голосе Анны: телефон +7 912 345-67-89, «сегодня/вчера»,
   короткие дни недели. Рубли — только через fmtRub из дизайн-системы. */

const MONTHS = ['янв.', 'февр.', 'марта', 'апр.', 'мая', 'июня', 'июля', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

export function fmtPhone(raw) {
  if (!raw) return '';
  let d = String(raw).replace(/\D/g, '');
  if (d.length === 11 && (d[0] === '7' || d[0] === '8')) d = '7' + d.slice(1);
  if (d.length === 10) d = '7' + d;
  if (d.length !== 11) return String(raw); // не распознали — показываем как есть
  const p = d.slice(1);
  return `+7 ${p.slice(0, 3)} ${p.slice(3, 6)}-${p.slice(6, 8)}-${p.slice(8, 10)}`;
}

export function fmtWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const isYest = d.toDateString() === yest.toDateString();
  if (sameDay) return fmtTime(iso);
  if (isYest) return 'вчера';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function fmtTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function weekdayShort(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return WEEKDAYS[d.getDay()];
}
