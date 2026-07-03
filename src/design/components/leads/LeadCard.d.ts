/**
 * Карточка лида — главный компонент системы: кто, что, когда, откуда, статус, действия.
 * @startingPoint section="Лиды" subtitle="Карточка лида со статусами и действиями" viewport="700x560"
 */
export interface LeadCardProps {
  /** Имя пациента */
  name: string;
  /** +7 912 345-67-89 */
  phone: string;
  /** Услуга: «Чистка», «Имплантация»… */
  service: string;
  /** «Сегодня 14:02», «Вчера 18:40» */
  time: string;
  /** Канал: откуда пришёл/куда написала Анна */
  source?: 'call' | 'max' | 'telegram' | 'sms';
  status?: 'new' | 'dialog' | 'booked' | 'urgent' | 'lost';
  /** Ожидаемая сумма, число в рублях — покажется золотом с tnum */
  sum?: number;
  /** Строка Анны: «написала в MAX 14:05, жду ответа» */
  note?: string;
  /** Подпись фацетного маркера (по умолч. «Срочно — острая боль») */
  urgentText?: string;
  /** Показывать ряд действий */
  actions?: boolean;
  onBook?: () => void;
  onCall?: () => void;
  onLost?: () => void;
  style?: React.CSSProperties;
}
export declare function LeadCard(props: LeadCardProps): JSX.Element;
