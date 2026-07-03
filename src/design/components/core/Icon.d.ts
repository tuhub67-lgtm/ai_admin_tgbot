/**
 * Фирменная линейная иконка: 24px сетка, штрих 2px, квадратные окончания, miter-углы.
 * @startingPoint section="Основы" subtitle="Сет из 18 гранёных иконок" viewport="700x240"
 */
export interface IconProps {
  /** Имя глифа */
  name:
    | 'call' | 'call-missed' | 'patient' | 'booking' | 'ruble' | 'report'
    | 'settings' | 'max' | 'telegram' | 'sms' | 'shield' | 'clock'
    | 'urgent' | 'check' | 'dialog' | 'return' | 'bell' | 'search';
  /** Размер в px (по умолчанию 24) */
  size?: number;
  /** Цвет; по умолчанию currentColor */
  color?: string;
  /** Толщина штриха (по умолчанию 2) */
  strokeWidth?: number;
  /** Доступное имя (aria-label) */
  title?: string;
  style?: React.CSSProperties;
}

export declare function Icon(props: IconProps): JSX.Element;
export declare const ICON_NAMES: string[];
