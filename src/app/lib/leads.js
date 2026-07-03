/* Общие соответствия для лидов: канал → иконка/подпись,
   статус API → статус для StatusBadge/LeadCard (различимый цветом и формой). */

export const CHANNEL = {
  call: { icon: 'call', label: 'Звонок' },
  max: { icon: 'max', label: 'MAX' },
  telegram: { icon: 'telegram', label: 'Telegram' },
  sms: { icon: 'sms', label: 'SMS' },
};

export function channelOf(source) {
  return CHANNEL[source] || CHANNEL.call;
}

// Статус лида (new|dialog|pending|booked|lost|nontarget) + флаг срочности →
// один из статусов, которые умеет рисовать дизайн-система.
export function badgeStatus(lead) {
  if (lead?.is_urgent) return 'urgent';
  switch (lead?.status) {
    case 'booked': return 'booked';
    case 'lost': return 'lost';
    case 'nontarget': return 'lost';
    case 'dialog': return 'dialog';
    case 'pending': return 'dialog';
    case 'new':
    default: return 'new';
  }
}
