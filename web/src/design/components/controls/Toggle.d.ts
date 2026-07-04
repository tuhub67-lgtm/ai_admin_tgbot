/**
 * Тумблер 52×32 с подписью; вкл — винный (светлая тема) / золотой (тёмная).
 */
export interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  label?: string;
  /** Вторая строка — что именно включается, словами Анны */
  description?: string;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
  style?: React.CSSProperties;
}
export declare function Toggle(props: ToggleProps): JSX.Element;
