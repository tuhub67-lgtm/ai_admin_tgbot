/**
 * Поле ввода: 48px, кегль 16, состояния default/focus/error/disabled, иконка и суффикс.
 */
export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  /** Подсказка под полем (16px, вторичный цвет) */
  hint?: string;
  /** Текст ошибки — тёплым тревожным, не винным */
  error?: string;
  /** Иконка слева (имя из Icon) */
  icon?: string;
  /** Суффикс справа, напр. «₽» или «звонков/день» */
  suffix?: string;
  disabled?: boolean;
  type?: string;
  onChange?: (e: any) => void;
  /** Зафиксировать focus-состояние для спесименов */
  forceFocus?: boolean;
  style?: React.CSSProperties;
}
export declare function Input(props: InputProps): JSX.Element;
