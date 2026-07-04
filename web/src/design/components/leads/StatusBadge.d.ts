/**
 * Бейдж статуса лида: цвет + форма маркера (различимо без цвета). «Срочно» — фацетный скос.
 */
export interface StatusBadgeProps {
  status: 'new' | 'dialog' | 'booked' | 'urgent' | 'lost';
  /** Переопределить подпись (по умолчанию: Новый / В диалоге / Записан / Срочно / Потерян) */
  label?: string;
  /** Заливной тревожный вариант — для «СРОЧНО — острая боль» */
  solid?: boolean;
  style?: React.CSSProperties;
}
export declare function StatusBadge(props: StatusBadgeProps): JSX.Element;
export declare const STATUS_META: Record<string, { label: string }>;
