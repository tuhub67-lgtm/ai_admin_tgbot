/**
 * Кнопка системы: золотой CTA, винная, контурная, ghost, danger. 3 размера × 4 состояния.
 * @startingPoint section="Контролы" subtitle="Кнопки: 5 вариантов, 3 размера" viewport="700x420"
 */
export interface ButtonProps {
  children?: React.ReactNode;
  /** primary — золотой CTA (главное действие, ≤1 на экран); brand — винный; secondary — контурная; ghost — текстовая; danger — тревожная */
  variant?: 'primary' | 'brand' | 'secondary' | 'ghost' | 'danger';
  /** sm 40 / md 48 / lg 56 px */
  size?: 'sm' | 'md' | 'lg';
  /** Имя иконки слева (из Icon) */
  icon?: string;
  disabled?: boolean;
  /** Растянуть на всю ширину */
  full?: boolean;
  /** Зафиксировать состояние для спесименов: hover | pressed | disabled */
  forceState?: 'default' | 'hover' | 'pressed' | 'disabled';
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;
