/* Форматирование по словарю DESIGN_README: рубли «47 200 ₽» (пробел-разряды, ₽ после числа),
   телефоны «+7 912 345-67-89». Денежные цифры — через fmtRub из дизайн-системы. */

export { fmtRub } from '../design/components/money/MoneyFigure.jsx';

// Нормализация ввода телефона к +7XXXXXXXXXX (для отправки на бэкенд).
export function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  let d = digits;
  if (d.length === 11 && (d[0] === '8' || d[0] === '7')) d = '7' + d.slice(1);
  else if (d.length === 10) d = '7' + d;
  else return null;
  return '+' + d;
}

// Красивый вывод телефона: +7 912 345-67-89
export function formatPhone(raw) {
  const n = normalizePhone(raw);
  if (!n) return raw;
  const d = n.slice(2); // без +7
  return `+7 ${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
}

export function isValidPhone(raw) {
  return normalizePhone(raw) !== null;
}
