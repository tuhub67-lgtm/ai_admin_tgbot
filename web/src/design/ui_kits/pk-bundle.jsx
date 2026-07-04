/* AUTO-GENERATED: собрано из components/ и ui_kits/ — не редактировать руками.
   Источник правды — исходные .jsx файлы (ES-модули). Все экспорты — в window.PK. */
window.PK = window.PK || {};

/* ═══ components/core/Icon.jsx ═══ */
(function(){

/* Подхват AI+ — фирменный сет иконок: 24px, штрих 2px, квадратные окончания,
   miter-углы, гранёные срезы 45° — геометрия логотипа. */

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'square', strokeLinejoin: 'miter' };

const GLYPHS = {
  call: <path d="M5 4h4l1.5 4.5-2.2 1.8c1.3 2.7 2.7 4.1 5.4 5.4l1.8-2.2L20 15v4l-1.5 1.5C11 20 4 13 3.5 5.5L5 4z" />,
  'call-missed': (
    <g>
      <path d="M5 7.5l1 4.3c1.6 4.4 5 7.3 9.7 8.2l4.3.5 1.5-3.5-4.5-1.5-1.8 2.2c-2.7-1.3-4.1-2.7-5.4-5.4l2.2-1.8L10.5 6 7 6.5 5 7.5z" />
      <path d="M14.5 3l6 6M20.5 3l-6 6" />
    </g>
  ),
  patient: (
    <g>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M4.5 20l.7-3 3-2.5h7.6l3 2.5.7 3" />
    </g>
  ),
  booking: (
    <g>
      <path d="M4 5.5h13l3 3v11.5H4z" />
      <path d="M8 3v4M16 3v4M4 10.5h16" />
      <path d="M9.3 15.5l2 2 3.8-4.2" />
    </g>
  ),
  ruble: (
    <g>
      <path d="M9.5 20V4h5l2.5 2.5v3L14.5 12h-5" />
      <path d="M7 15.5h7.5" />
    </g>
  ),
  report: (
    <g>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v3h3" />
      <path d="M9.5 17v-3M12.5 17v-6.5M15.5 17v-4.5" />
    </g>
  ),
  settings: (
    <g>
      <polygon points="9.2,3.5 14.8,3.5 20.5,9.2 20.5,14.8 14.8,20.5 9.2,20.5 3.5,14.8 3.5,9.2" />
      <circle cx="12" cy="12" r="3" />
    </g>
  ),
  max: (
    <g>
      <path d="M4 4h13l3 3v9h-7.5L8 20v-4H4z" />
      <path d="M8.5 12.5V7.5l3.5 3 3.5-3v5" />
    </g>
  ),
  telegram: (
    <g>
      <path d="M21 3.5L3.5 10.5l6 2.5 2 6.5 3.2-4.6L21 3.5z" />
      <path d="M9.5 13L21 3.5" />
    </g>
  ),
  sms: (
    <g>
      <path d="M4 4h16v12h-9l-4 3.5V16H4z" />
      <path d="M8 8.5h8M8 11.5h5" />
    </g>
  ),
  shield: (
    <g>
      <path d="M12 3l7 2.5V12l-7 9-7-9V5.5L12 3z" />
      <path d="M9 10.5l2.2 2.2 4.3-4.7" />
    </g>
  ),
  clock: (
    <g>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.5 2" />
    </g>
  ),
  urgent: (
    <g>
      <path d="M12 2.8L21.2 12 12 21.2 2.8 12 12 2.8z" />
      <path d="M12 8v5M12 16v1" />
    </g>
  ),
  check: <path d="M4.5 12.8l4.7 4.7L19.5 7" />,
  dialog: (
    <g>
      <path d="M4 4h16v12h-8.5L7 19.5V16H4z" />
      <g fill="currentColor" stroke="none">
        <rect x="7.2" y="9" width="2" height="2" />
        <rect x="11" y="9" width="2" height="2" />
        <rect x="14.8" y="9" width="2" height="2" />
      </g>
    </g>
  ),
  return: (
    <g>
      <path d="M19 5v8H8" />
      <path d="M11.5 9.5L8 13l3.5 3.5" />
    </g>
  ),
  bell: (
    <g>
      <path d="M12 3.5l3.5 2 .7 5.5 2.3 4.5h-13l2.3-4.5.7-5.5 3.5-2z" />
      <path d="M10.5 19h3" />
    </g>
  ),
  search: (
    <g>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5.5 5.5" />
    </g>
  ),
  server: (
    <g>
      <path d="M4 4h13l3 3v4H4z" />
      <path d="M4 13h16v7H4z" />
      <path d="M7 7.5h2M7 16.5h2" />
    </g>
  ),
  lock: (
    <g>
      <path d="M5 10h14v10H5z" />
      <path d="M8 10V6.5L9.5 4h5L16 6.5V10" />
      <path d="M12 14v3" />
    </g>
  ),
};

const ICON_NAMES = Object.keys(GLYPHS);

function Icon({ name, size = 24, color, strokeWidth = 2, title, style }) {
  const glyph = GLYPHS[name];
  if (!glyph) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      style={{ display: 'block', flex: 'none', color: color || 'currentColor', ...style }}
      {...S}
      strokeWidth={strokeWidth}
    >
      {glyph}
    </svg>
  );
}

Object.assign(window.PK, { ICON_NAMES, Icon });
})();

/* ═══ components/core/BearMark.jsx ═══ */
(function(){

/* Медведь-знак линией — упрощённый контур логотипа для пустых состояний,
   обложек и водяных знаков. Гранёная геометрия, miter, квадратные окончания.
   НЕ замена логотипу: в шапках и на плашках — только утверждённые тайлы assets/logo-tile-*.png */

const L = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'square', strokeLinejoin: 'miter' };

function BearMark({ size = 96, strokeWidth = 3, detail = true, style }) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} role="presentation" style={{ display: 'block', flex: 'none', ...style }} {...L} strokeWidth={strokeWidth}>
      {/* внешний контур: уши + гранёная морда */}
      <polygon points="48,90 27,77 13,52 17,29 23,10 37,7 40,19 48,16 56,19 59,7 73,10 79,29 83,52 69,77" />
      {detail ? (
        <g>
          {/* глаза — угловые клинья к переносице */}
          <polygon fill="currentColor" stroke="none" points="29,41 43,38 40,46 31,45" />
          <polygon fill="currentColor" stroke="none" points="67,41 53,38 56,46 65,45" />
          {/* нос-пятиугольник + подбородочная линия */}
          <polygon points="41,55 55,55 57,62 48,70 39,62" />
          <path d="M48 70v7" />
          {/* фацетные штрихи скул — вторая толщина линии */}
          <path d="M22 51l9 8M74 51l-9 8" strokeWidth={strokeWidth * 0.75} />
        </g>
      ) : null}
    </svg>
  );
}

/* Солярный медальон линией — ТОЛЬКО пустые состояния и обложки, прозрачность 4–6% */
function OrnamentSolar({ size = 240, strokeWidth = 1.5, style }) {
  return (
    <svg viewBox="0 0 240 240" width={size} height={size} role="presentation" style={{ display: 'block', flex: 'none', ...style }} {...L} strokeWidth={strokeWidth}>
      <circle cx="120" cy="120" r="22" />
      <circle cx="120" cy="120" r="8" />
      <g>
        <line x1="120" y1="86" x2="120" y2="66" /><line x1="120" y1="174" x2="120" y2="154" />
        <line x1="86" y1="120" x2="66" y2="120" /><line x1="174" y1="120" x2="154" y2="120" />
        <line x1="96" y1="96" x2="82" y2="82" /><line x1="144" y1="144" x2="158" y2="158" />
        <line x1="144" y1="96" x2="158" y2="82" /><line x1="96" y1="144" x2="82" y2="158" />
        <line x1="103" y1="88" x2="95" y2="73" /><line x1="137" y1="88" x2="145" y2="73" />
        <line x1="103" y1="152" x2="95" y2="167" /><line x1="137" y1="152" x2="145" y2="167" />
        <line x1="88" y1="103" x2="73" y2="95" /><line x1="88" y1="137" x2="73" y2="145" />
        <line x1="152" y1="103" x2="167" y2="95" /><line x1="152" y1="137" x2="167" y2="145" />
      </g>
      <polygon points="120,34 180,58 206,120 180,182 120,206 60,182 34,120 60,58" />
      <g strokeWidth={strokeWidth * 1.33}>
        <line x1="120" y1="24" x2="120" y2="14" /><line x1="120" y1="226" x2="120" y2="216" />
        <line x1="24" y1="120" x2="14" y2="120" /><line x1="226" y1="120" x2="216" y2="120" />
      </g>
      <polygon points="120,110 130,120 120,130 110,120" />
    </svg>
  );
}

Object.assign(window.PK, { BearMark, OrnamentSolar });
})();

/* ═══ components/controls/Button.jsx ═══ */
(function(){
const { useState } = React;
const { Icon } = window.PK;
/* Кнопка: 3 размера × 4 состояния. Радиус 10, зона нажатия ≥44px.
   primary = золотой CTA; brand = винный; secondary = контурная; ghost; danger. */

const SIZES = {
  sm: { height: 40, padding: '0 16px', fontSize: 16, icon: 18 },
  md: { height: 48, padding: '0 20px', fontSize: 16, icon: 20 },
  lg: { height: 56, padding: '0 28px', fontSize: 18, icon: 22 },
};

const VARIANTS = {
  primary:   { bg: 'var(--cta-surface)', color: 'var(--cta-text)', hoverBg: 'var(--cta-surface-hover)', border: 'none' },
  brand:     { bg: 'var(--surface-brand)', color: 'var(--text-on-brand)', hoverBg: 'var(--surface-brand-hover)', border: 'none' },
  secondary: { bg: 'transparent', color: 'var(--text)', hoverBg: 'color-mix(in srgb, var(--text) 7%, transparent)', border: '1.5px solid var(--border-strong)' },
  ghost:     { bg: 'transparent', color: 'var(--text-gold)', hoverBg: 'color-mix(in srgb, currentColor 9%, transparent)', border: 'none' },
  danger:    { bg: 'var(--urgent)', color: '#FFFFFF', hoverBg: 'color-mix(in srgb, var(--urgent) 88%, #000)', border: 'none' },
};

function Button({ children, variant = 'primary', size = 'md', icon, disabled = false, full = false, forceState, onClick, style }) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const st = forceState || (disabled ? 'disabled' : press ? 'pressed' : hover ? 'hover' : 'default');

  const filled = variant === 'primary' || variant === 'brand' || variant === 'danger';
  let bg = v.bg, color = v.color, filter = 'none';
  if (st === 'hover') bg = v.hoverBg;
  if (st === 'pressed') { bg = v.hoverBg; filter = 'brightness(.93)'; }
  if (st === 'disabled') {
    bg = filled ? 'var(--neutral-200)' : 'transparent';
    color = 'var(--text-disabled)';
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: s.height, padding: s.padding, width: full ? '100%' : undefined,
        fontFamily: 'var(--font-body)', fontSize: s.fontSize, fontWeight: 600, lineHeight: 1,
        background: bg, color, border: st === 'disabled' && v.border !== 'none' ? '1.5px solid var(--border)' : v.border,
        borderRadius: 'var(--r-btn)', cursor: st === 'disabled' ? 'not-allowed' : 'pointer',
        transition: 'background var(--motion-fast), filter var(--motion-fast)', filter,
        userSelect: 'none', whiteSpace: 'nowrap', ...style,
      }}
    >
      {icon ? <Icon name={icon} size={s.icon} /> : null}
      {children}
    </button>
  );
}

Object.assign(window.PK, { Button });
})();

/* ═══ components/controls/Input.jsx ═══ */
(function(){
const { useState } = React;
const { Icon } = window.PK;
/* Поле ввода: 48px, кегль 16, радиус 10. Состояния: default / focus / error / disabled. */

function Input({ label, placeholder, value, defaultValue, hint, error, icon, disabled = false, suffix, type = 'text', onChange, forceFocus = false, style }) {
  const [focus, setFocus] = useState(false);
  const focused = forceFocus || focus;
  const borderColor = error ? 'var(--urgent)' : focused ? 'var(--focus-ring)' : 'var(--border-strong)';

  return (
    <label style={{ display: 'block', fontFamily: 'var(--font-body)', ...style }}>
      {label ? (
        <span style={{ display: 'block', fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{label}</span>
      ) : null}
      <span
        style={{
          display: 'flex', alignItems: 'center', gap: 10, height: 48, padding: '0 14px',
          background: disabled ? 'var(--surface-subtle)' : 'var(--surface)',
          border: `1.5px solid ${disabled ? 'var(--border)' : borderColor}`,
          borderRadius: 'var(--r-input)',
          boxShadow: focused && !error ? '0 0 0 3px color-mix(in srgb, var(--focus-ring) 22%, transparent)' : 'none',
          transition: 'border-color var(--motion-fast), box-shadow var(--motion-fast)',
        }}
      >
        {icon ? <Icon name={icon} size={20} color={disabled ? 'var(--text-disabled)' : 'var(--text-secondary)'} /> : null}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={onChange}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'var(--font-body)', fontSize: 16, color: disabled ? 'var(--text-disabled)' : 'var(--text)',
            fontFeatureSettings: type === 'tel' || type === 'number' ? "'tnum' 1" : undefined,
          }}
        />
        {suffix ? <span style={{ fontSize: 16, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{suffix}</span> : null}
      </span>
      {(error || hint) ? (
        <span style={{ display: 'block', fontSize: 16, marginTop: 6, color: error ? 'var(--urgent-text)' : 'var(--text-secondary)' }}>
          {error || hint}
        </span>
      ) : null}
    </label>
  );
}

Object.assign(window.PK, { Input });
})();

/* ═══ components/controls/Toggle.jsx ═══ */
(function(){
const { useState } = React;
/* Тумблер: трек 52×32, зона нажатия ≥44px. Вкл: винный (светлая) / золотой (тёмная) — токен --control-on. */

function Toggle({ checked, defaultChecked = false, label, description, disabled = false, onChange, style }) {
  const [inner, setInner] = useState(defaultChecked);
  const isOn = checked !== undefined ? checked : inner;
  const flip = () => {
    if (disabled) return;
    if (checked === undefined) setInner(!isOn);
    if (onChange) onChange(!isOn);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      disabled={disabled}
      onClick={flip}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, minHeight: 44, padding: '6px 0',
        background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, textAlign: 'left', fontFamily: 'var(--font-body)', ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flex: 'none', width: 52, height: 32, borderRadius: 999, position: 'relative',
          background: isOn ? 'var(--control-on)' : 'var(--neutral-300)',
          transition: 'background var(--motion-base)',
        }}
      >
        <span
          style={{
            position: 'absolute', top: 3, left: isOn ? 23 : 3, width: 26, height: 26, borderRadius: 999,
            background: isOn ? 'var(--control-on-knob)' : '#FFFFFF',
            boxShadow: '0 1px 3px rgba(28,26,23,.25)',
            transition: 'left var(--motion-base), background var(--motion-base)',
          }}
        />
      </span>
      {(label || description) ? (
        <span>
          {label ? <span style={{ display: 'block', fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{label}</span> : null}
          {description ? <span style={{ display: 'block', fontSize: 16, color: 'var(--text-secondary)', marginTop: 2 }}>{description}</span> : null}
        </span>
      ) : null}
    </button>
  );
}

Object.assign(window.PK, { Toggle });
})();

/* ═══ components/leads/StatusBadge.jsx ═══ */
(function(){

/* Статус лида: каждому — цвет И форма (различимо без цвета).
   новый ◆ / в диалоге ··· / записан ✓ / срочно — фацетный маркер / потерян × */

const M = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'square', strokeLinejoin: 'miter' };

const SHAPES = {
  new:    <svg viewBox="0 0 12 12" width="12" height="12" {...M}><polygon points="6,1.5 10.5,6 6,10.5 1.5,6" /></svg>,
  dialog: <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor"><rect x="0.6" y="4.8" width="2.4" height="2.4" /><rect x="4.8" y="4.8" width="2.4" height="2.4" /><rect x="9" y="4.8" width="2.4" height="2.4" /></svg>,
  booked: <svg viewBox="0 0 12 12" width="12" height="12" {...M}><path d="M2 6.4l2.6 2.6L10 3.4" /></svg>,
  urgent: <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor"><path d="M1.5 1.5h6l3 3v6h-9z" /></svg>,
  lost:   <svg viewBox="0 0 12 12" width="12" height="12" {...M}><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" /></svg>,
};

const STATUS_META = {
  new:    { label: 'Новый' },
  dialog: { label: 'В диалоге' },
  booked: { label: 'Записан' },
  urgent: { label: 'Срочно' },
  lost:   { label: 'Потерян' },
};

function StatusBadge({ status = 'new', label, solid = false, style }) {
  const meta = STATUS_META[status] || STATUS_META.new;
  const isUrgent = status === 'urgent';
  const bg = solid ? 'var(--urgent)' : `var(--st-${status}-tint)`;
  const color = solid ? '#FFFFFF' : `var(--st-${status}-text)`;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '4px 12px', minHeight: 28, boxSizing: 'border-box',
        background: bg, color,
        borderRadius: isUrgent ? 0 : 'var(--r-badge)',
        clipPath: isUrgent ? 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' : undefined,
        fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, lineHeight: 1.25,
        whiteSpace: 'nowrap', ...style,
      }}
    >
      {SHAPES[status] || SHAPES.new}
      {label || meta.label}
    </span>
  );
}

Object.assign(window.PK, { STATUS_META, StatusBadge });
})();

/* ═══ components/leads/LeadCard.jsx ═══ */
(function(){

const { Icon } = window.PK;
const { Button } = window.PK;
const { StatusBadge } = window.PK;
/* Карточка лида — главный компонент системы.
   Имя, телефон, услуга, время, канал, статус, действия.
   Вариант «СРОЧНО — острая боль»: фацетный маркер, тревожная рамка, тёплая тень. */

const CHANNEL = {
  call: { icon: 'call', label: 'Звонок' },
  max: { icon: 'max', label: 'MAX' },
  telegram: { icon: 'telegram', label: 'Telegram' },
  sms: { icon: 'sms', label: 'SMS' },
};

function fmtRub(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

function LeadCard({
  name, phone, service, time, source = 'call', status = 'new',
  sum, note, urgentText = 'Срочно — острая боль',
  onBook, onCall, onLost, actions = true, style,
}) {
  const isUrgent = status === 'urgent';
  const ch = CHANNEL[source] || CHANNEL.call;

  return (
    <article
      style={{
        position: 'relative', background: 'var(--surface)',
        border: `1.5px solid ${isUrgent ? 'var(--urgent)' : 'var(--border)'}`,
        borderRadius: 'var(--r-card)', padding: '16px 16px 16px 20px',
        boxShadow: isUrgent ? 'var(--shadow-urgent)' : 'var(--shadow-card)',
        fontFamily: 'var(--font-body)', color: 'var(--text)', overflow: 'hidden', ...style,
      }}
    >
      {/* Акцентная планка 4px — вторая толщина линии */}
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: isUrgent ? 'var(--urgent)' : status === 'booked' ? 'var(--success)' : 'var(--border-strong)' }} />

      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>{name}</div>
          <div className="tnum" style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 2, fontFeatureSettings: "'tnum' 1" }}>{phone}</div>
        </div>
        {isUrgent
          ? <StatusBadge status="urgent" solid label={urgentText} />
          : <StatusBadge status={status} />}
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 20px', marginTop: 12, fontSize: 16 }}>
        <span style={{ fontWeight: 500 }}>{service}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
          <Icon name="clock" size={18} />{time}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
          <Icon name={ch.icon} size={18} />{ch.label}
        </span>
        {sum ? (
          <span className="tnum" style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-gold)', fontFeatureSettings: "'tnum' 1" }}>
            {fmtRub(sum)}&nbsp;₽
          </span>
        ) : null}
      </div>

      {note ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, padding: '10px 12px', background: 'var(--surface-subtle)', borderRadius: 'var(--r-card-sm)', fontSize: 16, color: 'var(--text-secondary)' }}>
          <Icon name="dialog" size={18} style={{ marginTop: 2 }} />
          <span><strong style={{ color: 'var(--text)', fontWeight: 600 }}>Анна:</strong> {note}</span>
        </div>
      ) : null}

      {actions ? (
        <footer style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {status !== 'booked' && status !== 'lost' ? (
            <>
              {isUrgent
                ? <Button variant="danger" size="sm" icon="call" onClick={onCall}>Перезвонить сейчас</Button>
                : <Button variant="primary" size="sm" icon="check" onClick={onBook}>Записан ✓</Button>}
              {isUrgent
                ? <Button variant="secondary" size="sm" icon="check" onClick={onBook}>Записан ✓</Button>
                : <Button variant="secondary" size="sm" icon="call" onClick={onCall}>Перезвонить</Button>}
              <Button variant="ghost" size="sm" onClick={onLost} style={{ color: 'var(--text-secondary)' }}>Потерян</Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" icon="report" onClick={onCall}>Подробности</Button>
          )}
        </footer>
      ) : null}
    </article>
  );
}

Object.assign(window.PK, { LeadCard });
})();

/* ═══ components/money/MoneyFigure.jsx ═══ */
(function(){
const { useEffect, useRef, useState } = React;
/* «Денежная цифра» — стиль системы: очень крупно, Golos Text, табличные цифры,
   знак ₽ встроен (чуть легче цифры). Главная цифра экрана видна за 1 секунду. */

const SIZES = {
  xl: { fontSize: 72, mobile: 56, lineHeight: 1.05, tracking: '-0.02em' },
  lg: { fontSize: 44, mobile: 44, lineHeight: 1.1, tracking: '-0.01em' },
  md: { fontSize: 28, mobile: 28, lineHeight: 1.15, tracking: '0' },
};

function fmtRub(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

function MoneyFigure({ value = 0, size = 'xl', label, sub, color = 'default', animate = false, mobile = false, style }) {
  const s = SIZES[size] || SIZES.xl;
  const [shown, setShown] = useState(animate ? 0 : value);
  const raf = useRef();

  useEffect(() => {
    if (!animate || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) { setShown(value); return; }
    const t0 = performance.now(), dur = 600, from = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      setShown(from + (value - from) * e);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, animate]);

  const col = color === 'gold' ? 'var(--text-gold-large)' : color === 'onBrand' ? 'var(--gold-400)' : 'var(--text)';

  return (
    <div style={{ fontFamily: 'var(--font-display)', ...style }}>
      {label ? <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div> : null}
      <div className="tnum" style={{ fontSize: mobile ? s.mobile : s.fontSize, lineHeight: s.lineHeight, letterSpacing: s.tracking, fontWeight: 700, color: col, fontFeatureSettings: "'tnum' 1, 'lnum' 1", fontVariantNumeric: 'tabular-nums lining-nums', whiteSpace: 'nowrap' }}>
        {fmtRub(shown)}<span style={{ fontWeight: 600, opacity: .85, marginLeft: '.12em' }}>₽</span>
      </div>
      {sub ? <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</div> : null}
    </div>
  );
}

Object.assign(window.PK, { fmtRub, MoneyFigure });
})();

/* ═══ components/money/RevenueBars.jsx ═══ */
(function(){

const { fmtRub } = window.PK;
/* График «возвращено ₽» по дням. Плоские золотые столбцы, без градиентов.
   Выделенный день — фацетный срез верхнего правого угла (единственный фацет в поле зрения)
   и чип со значением. День окупаемости — маркер-ромб под подписью. */

function RevenueBars({
  data = [], height = 150, highlightIndex = -1, paybackIndex = -1, style,
}) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div style={{ fontFamily: 'var(--font-body)', ...style }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: height + 40 }}>
        {data.map((d, i) => {
          const hl = i === highlightIndex;
          const h = d.value === 0 ? 4 : Math.max(10, Math.round((d.value / max) * height));
          return (
            <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-end', gap: 6 }}>
              {hl ? (
                <div className="tnum" style={{ alignSelf: 'center', padding: '3px 8px', background: 'var(--text)', color: 'var(--bg)', borderRadius: 6, fontSize: 16, fontWeight: 600, fontFeatureSettings: "'tnum' 1", whiteSpace: 'nowrap' }}>
                  {fmtRub(d.value)}&nbsp;₽
                </div>
              ) : null}
              <div
                style={{
                  height: h,
                  background: d.value === 0 ? 'var(--border)' : hl ? 'var(--gold-500)' : 'var(--gold-400)',
                  borderRadius: hl ? 0 : '4px 4px 0 0',
                  clipPath: hl ? 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' : undefined,
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 16, color: i === highlightIndex ? 'var(--text)' : 'var(--text-secondary)', fontWeight: i === highlightIndex ? 600 : 400 }}>
            {d.label}
            {i === paybackIndex ? (
              <svg viewBox="0 0 10 10" width="10" height="10" style={{ display: 'block', margin: '3px auto 0' }} aria-label="день окупаемости">
                <polygon points="5,0 10,5 5,10 0,5" fill="var(--control-on)" />
              </svg>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window.PK, { RevenueBars });
})();

/* ═══ components/feedback/Toast.jsx ═══ */
(function(){

const { Icon } = window.PK;
/* Тост: карточка на var(--surface) с акцентной планкой 4px (вторая толщина линии).
   Работает в обеих темах без условий. Голос Анны: коротко, тепло, без «Ошибка 500». */

const VARIANTS = {
  success: { bar: 'var(--success)', icon: 'check', iconColor: 'var(--success-text)' },
  info:    { bar: 'var(--info)', icon: 'dialog', iconColor: 'var(--info-text)' },
  urgent:  { bar: 'var(--urgent)', icon: 'urgent', iconColor: 'var(--urgent-text)' },
  money:   { bar: 'var(--gold-500)', icon: 'ruble', iconColor: 'var(--text-gold)' },
};

function Toast({ variant = 'success', title, text, actionLabel, onAction, style }) {
  const v = VARIANTS[variant] || VARIANTS.success;
  return (
    <div
      role="status"
      style={{
        position: 'relative', display: 'flex', gap: 12, alignItems: 'flex-start',
        maxWidth: 420, padding: '14px 16px 14px 20px', overflow: 'hidden',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-card-sm)', boxShadow: 'var(--shadow-raised)',
        fontFamily: 'var(--font-body)', color: 'var(--text)', ...style,
      }}
    >
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: v.bar }} />
      <Icon name={v.icon} size={22} color={v.iconColor} style={{ marginTop: 1 }} />
      <div style={{ minWidth: 0 }}>
        {title ? <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.35 }}>{title}</div> : null}
        {text ? <div style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: title ? 2 : 0 }}>{text}</div> : null}
        {actionLabel ? (
          <button type="button" onClick={onAction} style={{ margin: '8px 0 0', padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, color: 'var(--text-gold)' }}>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

Object.assign(window.PK, { Toast });
})();

/* ═══ components/feedback/EmptyState.jsx ═══ */
(function(){

const { BearMark, OrnamentSolar } = window.PK;
const { Button } = window.PK;
/* Пустое состояние: медведь линией + солярный орнамент 5% (единственное место орнамента в приложении).
   Тон покоя: пусто = хорошо, всё подхвачено. */

function EmptyState({
  title = 'Пока тихо. Все звонки подхвачены.',
  text,
  actionLabel, actionIcon, onAction,
  compact = false, style,
}) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: compact ? '32px 24px' : '56px 24px', overflow: 'hidden', fontFamily: 'var(--font-body)', color: 'var(--text)', ...style }}>
      <div aria-hidden="true" style={{ position: 'relative', width: compact ? 148 : 196, height: compact ? 148 : 196, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <OrnamentSolar size={compact ? 148 : 196} style={{ position: 'absolute', inset: 0, color: 'var(--text)', opacity: .05 }} />
        <BearMark size={compact ? 64 : 84} strokeWidth={3} style={{ color: 'var(--border-strong)' }} />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: compact ? 20 : 24, fontWeight: 600, lineHeight: 1.3, maxWidth: 360 }}>{title}</div>
      {text ? <div style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 8, maxWidth: 360 }}>{text}</div> : null}
      {actionLabel ? <Button variant="secondary" size="md" icon={actionIcon} onClick={onAction} style={{ marginTop: 20 }}>{actionLabel}</Button> : null}
    </div>
  );
}

Object.assign(window.PK, { EmptyState });
})();

/* ═══ components/feedback/OnboardingStepper.jsx ═══ */
(function(){

const { Icon } = window.PK;
/* Степпер онбординга — 4 шага. Пройден: винный квадрат с галочкой.
   Текущий: золотой фацетный маркер (грань медвежьей морды). Впереди: контур. */

const DEFAULT_STEPS = ['Номер клиники', 'Каналы', 'Голос Анны', 'Готово'];

function OnboardingStepper({ steps = DEFAULT_STEPS, current = 0, compact = false, style }) {
  return (
    <div style={{ fontFamily: 'var(--font-body)', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {steps.map((label, i) => {
          const done = i < current, cur = i === current;
          return (
            <React.Fragment key={i}>
              {i > 0 ? <span aria-hidden="true" style={{ flex: 1, height: done || cur ? 2 : 1.5, background: done || cur ? 'var(--wine-800)' : 'var(--border-strong)', minWidth: 12 }} /> : null}
              <span
                aria-current={cur ? 'step' : undefined}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, flex: 'none', boxSizing: 'border-box',
                  fontSize: 16, fontWeight: 600,
                  background: done ? 'var(--wine-800)' : cur ? 'var(--gold-400)' : 'transparent',
                  color: done ? 'var(--ivory)' : cur ? '#1C1A17' : 'var(--text-secondary)',
                  border: done || cur ? 'none' : '1.5px solid var(--border-strong)',
                  borderRadius: cur ? 0 : 8,
                  clipPath: cur ? 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' : undefined,
                }}
              >
                {done ? <Icon name="check" size={16} /> : i + 1}
              </span>
            </React.Fragment>
          );
        })}
      </div>
      {!compact ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
          {steps.map((label, i) => (
            <span key={i} style={{ flex: 1, fontSize: 16, lineHeight: 1.3, textAlign: i === 0 ? 'left' : i === steps.length - 1 ? 'right' : 'center', color: i === current ? 'var(--text)' : 'var(--text-secondary)', fontWeight: i === current ? 600 : 400 }}>
              {label}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 8, fontSize: 16, color: 'var(--text-secondary)' }}>
          Шаг {current + 1} из {steps.length} — <span style={{ color: 'var(--text)', fontWeight: 600 }}>{steps[current]}</span>
        </div>
      )}
    </div>
  );
}

Object.assign(window.PK, { DEFAULT_STEPS, OnboardingStepper });
})();

/* ═══ components/data/DataTable.jsx ═══ */
(function(){

/* Таблица: строки 52px, разделители-волоски, цифры табличные (tnum), суммы — Golos Text.
   Колонка денег может быть золотой (money: 'gold'). render(row) — для бейджей статуса. */

function DataTable({ columns = [], rows = [], footer, dense = false, style }) {
  const rowH = dense ? 44 : 52;
  const cellPad = '0 12px';
  const align = c => c.align || (c.money ? 'right' : 'left');
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-card-sm)', overflow: 'hidden', fontFamily: 'var(--font-body)', color: 'var(--text)', ...style }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
        <thead>
          <tr style={{ background: 'var(--surface-subtle)' }}>
            {columns.map((c, i) => (
              <th key={i} scope="col" style={{ height: rowH - 8, padding: cellPad, textAlign: align(c), fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)', width: c.width }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {columns.map((c, ci) => {
                const raw = c.render ? c.render(r) : r[c.key];
                return (
                  <td
                    key={ci}
                    className={c.money || c.tnum ? 'tnum' : undefined}
                    style={{
                      height: rowH, padding: cellPad, textAlign: align(c),
                      borderBottom: ri < rows.length - 1 || footer ? '1px solid var(--border)' : 'none',
                      fontFeatureSettings: c.money || c.tnum ? "'tnum' 1" : undefined,
                      fontFamily: c.money ? 'var(--font-display)' : undefined,
                      fontWeight: c.money ? 700 : c.strong ? 600 : 400,
                      color: c.money === 'gold' ? 'var(--text-gold)' : c.secondary ? 'var(--text-secondary)' : 'var(--text)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: c.maxWidth,
                    }}
                  >
                    {raw}
                  </td>
                );
              })}
            </tr>
          ))}
          {footer ? (
            <tr style={{ background: 'var(--surface-subtle)' }}>
              {columns.map((c, ci) => (
                <td key={ci} className="tnum" style={{ height: rowH, padding: cellPad, textAlign: align(c), fontWeight: ci === 0 ? 600 : 700, fontFamily: ci === 0 ? undefined : 'var(--font-display)', color: c.money === 'gold' ? 'var(--text-gold)' : 'var(--text)', fontFeatureSettings: "'tnum' 1" }}>
                  {footer[c.key] ?? ''}
                </td>
              ))}
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

Object.assign(window.PK, { DataTable });
})();

/* ═══ components/data/ReportHeader.jsx ═══ */
(function(){

const { fmtRub } = window.PK;
/* Шапка отчёта PDF: винная плашка с фацетным срезом (правый верхний, 32),
   утверждённый тайл логотипа, итог недели золотом. Плоские цвета — печать безопасна. */

function ReportHeader({
  clinic = 'Стоматология «Жемчуг»',
  period = '23–29 июня 2026',
  total = 47200,
  stats = [{ label: 'подхвачено звонков', value: 12 }, { label: 'пациентов записано', value: 6 }],
  logoSrc = 'assets/logo-tile-wine.png',
  style,
}) {
  return (
    <header
      style={{
        background: 'var(--wine-800)', color: 'var(--ivory)',
        clipPath: 'polygon(0 0, calc(100% - 32px) 0, 100% 32px, 100% 100%, 0 100%)',
        padding: '28px 32px 24px', fontFamily: 'var(--font-body)', ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <img src={logoSrc} alt="Подхват AI+" width="52" height="52" style={{ display: 'block', borderRadius: 12, border: '1px solid rgba(231,194,88,.45)' }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--gold-300)' }}>Подхват AI+ · Отчёт недели</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, lineHeight: 1.25, marginTop: 2 }}>{clinic}</div>
            <div style={{ fontSize: 16, color: 'rgba(252,242,220,.75)', marginTop: 2 }}>{period}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 1.1, fontWeight: 700, color: 'var(--gold-400)', fontFeatureSettings: "'tnum' 1", whiteSpace: 'nowrap' }}>
            {fmtRub(total)}<span style={{ fontWeight: 600, opacity: .85, marginLeft: '.12em' }}>₽</span>
          </div>
          <div style={{ fontSize: 16, color: 'rgba(252,242,220,.75)', marginTop: 2 }}>возвращено за неделю</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(231,194,88,.35)' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, fontFeatureSettings: "'tnum' 1" }}>{s.value}</span>
            <span style={{ fontSize: 16, color: 'rgba(252,242,220,.75)' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </header>
  );
}

Object.assign(window.PK, { ReportHeader });
})();

/* ═══ ui_kits/kit-demos.jsx ═══ */
(function(){
const { useState } = React;
const { Icon, ICON_NAMES } = window.PK;
const { BearMark, OrnamentSolar } = window.PK;
const { Button } = window.PK;
const { Input } = window.PK;
const { Toggle } = window.PK;
const { StatusBadge } = window.PK;
const { LeadCard } = window.PK;
const { MoneyFigure } = window.PK;
const { RevenueBars } = window.PK;
const { Toast } = window.PK;
const { EmptyState } = window.PK;
const { OnboardingStepper } = window.PK;
const { DataTable } = window.PK;
const { ReportHeader } = window.PK;
/* Демо-кластеры UI-кита: каждый блок показывает компонент в ОБЕИХ темах. */

function Pane({ dark, children, pad = 24 }) {
  return (
    <div
      data-theme={dark ? 'dark' : 'light'}
      style={{
        flex: '1 1 420px', minWidth: 0, padding: pad, borderRadius: 16,
        background: 'var(--bg)', color: 'var(--text)',
        border: dark ? '1px solid #3A352C' : '1px solid var(--neutral-200)',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 16 }}>
        {dark ? 'Тёмная' : 'Светлая'}
      </div>
      {children}
    </div>
  );
}

function ThemePair({ children, pad }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      <Pane pad={pad}>{children}</Pane>
      <Pane dark pad={pad}>{children}</Pane>
    </div>
  );
}

const cap = { fontSize: 16, color: 'var(--text-secondary)', margin: '0 0 8px' };

/* ─── Кнопки: 5 вариантов × 4 состояния + 3 размера ─── */
function ButtonsDemo() {
  const variants = [
    ['primary', 'Primary — золотой CTA'],
    ['brand', 'Brand — винный'],
    ['secondary', 'Secondary — контурная'],
    ['ghost', 'Ghost'],
    ['danger', 'Danger — только «срочно»'],
  ];
  const states = ['default', 'hover', 'pressed', 'disabled'];
  return (
    <ThemePair>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, max-content)', gap: '14px 12px', alignItems: 'center', overflowX: 'auto', paddingBottom: 4 }}>
        {states.map(s => <div key={s} style={{ fontSize: 16, color: 'var(--text-secondary)' }}>{s}</div>)}
        {variants.map(([v]) => states.map(s => (
          <Button key={v + s} variant={v} size="sm" forceState={s} disabled={s === 'disabled'} icon={v === 'danger' ? 'call' : v === 'primary' ? 'check' : undefined}>
            {v === 'primary' ? 'Записан' : v === 'brand' ? 'Подхватим' : v === 'secondary' ? 'Перезвонить' : v === 'ghost' ? 'Подробнее' : 'Срочно'}
          </Button>
        )))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <Button size="sm">Малая · 40</Button>
        <Button size="md">Средняя · 48</Button>
        <Button size="lg">Большая · 56</Button>
      </div>
    </ThemePair>
  );
}

/* ─── Поля ввода ─── */
function InputsDemo() {
  return (
    <ThemePair>
      <div style={{ display: 'grid', gap: 16, maxWidth: 420 }}>
        <Input label="Телефон клиники" placeholder="+7 912 345-67-89" icon="call" type="tel" hint="Анна подхватит звонки с этого номера" />
        <Input label="Средний чек" defaultValue="7 800" suffix="₽" type="text" forceFocus />
        <Input label="Название клиники" defaultValue="Жемчуг" error="Анне нужно полное название — как в вывеске" />
        <Input label="Город" defaultValue="Екатеринбург" disabled />
      </div>
    </ThemePair>
  );
}

/* ─── Тумблеры ─── */
function TogglesDemo() {
  return (
    <ThemePair>
      <div style={{ display: 'grid', gap: 4 }}>
        <Toggle defaultChecked label="MAX" description="Основной канал — Анна пишет сюда первым делом" />
        <Toggle defaultChecked label="Telegram" description="Если пациент есть в Telegram" />
        <Toggle label="SMS" description="Резерв — когда мессенджеры молчат" />
        <Toggle disabled label="Голосовой перезвон" description="Скоро" />
      </div>
    </ThemePair>
  );
}

/* ─── Статус-бейджи: цвет + форма ─── */
function BadgesDemo() {
  return (
    <ThemePair>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <StatusBadge status="new" />
        <StatusBadge status="dialog" />
        <StatusBadge status="booked" />
        <StatusBadge status="urgent" />
        <StatusBadge status="lost" />
        <StatusBadge status="urgent" solid label="Срочно — острая боль" />
      </div>
      <p style={{ ...cap, margin: '14px 0 0', maxWidth: 460 }}>
        Каждому статусу — цвет <strong style={{ color: 'var(--text)' }}>и форма</strong>: ромб / три точки / галочка / фацетный маркер / крест. Различимо без цвета.
      </p>
    </ThemePair>
  );
}

/* ─── Карточка лида: все состояния ─── */
function LeadCardsDemo() {
  return (
    <ThemePair>
      <div style={{ display: 'grid', gap: 12, maxWidth: 460 }}>
        <LeadCard status="urgent" name="Ирина Соколова" phone="+7 912 003-18-44" service="Острая боль" time="14:02, не дозвонилась" source="call" note="Перезвоните первой — обещала ждать 15 минут." />
        <LeadCard status="new" name="Марина Ковалёва" phone="+7 922 480-55-17" service="Имплантация" time="12:40" source="call" sum={12400} />
        <LeadCard status="dialog" name="Олег Крылов" phone="+7 909 315-77-02" service="Чистка" time="11:15" source="max" note="Предложила четверг 16:00 — думает." />
        <LeadCard status="booked" name="Ольга Северова" phone="+7 903 118-24-60" service="Чистка · чт 16:00" time="вчера" source="telegram" sum={3800} />
        <LeadCard status="lost" name="Номер скрыт" phone="+7 ··· ···-··-··" service="Не назвался" time="понедельник" source="sms" />
      </div>
    </ThemePair>
  );
}

/* ─── Денежная цифра + график ─── */
function MoneyDemo() {
  const week = [
    { label: 'пн', value: 0 }, { label: 'вт', value: 3800 }, { label: 'ср', value: 8400 },
    { label: 'чт', value: 12400 }, { label: 'пт', value: 9800 }, { label: 'сб', value: 12800 }, { label: 'вс', value: 0 },
  ];
  return (
    <ThemePair>
      <div style={{ maxWidth: 460 }}>
        <MoneyFigure value={47200} size="xl" mobile label="Возвращено за неделю" sub="6 пациентов записаны" />
        <div style={{ marginTop: 24 }}>
          <RevenueBars data={week} highlightIndex={5} paybackIndex={3} height={120} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 16 }}>
          <svg viewBox="0 0 10 10" width="10" height="10"><polygon points="5,0 10,5 5,10 0,5" fill="var(--control-on)" /></svg>
          <span>Пилот окупился в четверг — <strong>на 9-й день</strong></span>
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <MoneyFigure value={12400} size="md" label="Лучший день" />
          <MoneyFigure value={7867} size="md" label="Средний чек" />
        </div>
      </div>
    </ThemePair>
  );
}

/* ─── Таблица ─── */
function TableDemo() {
  const cols = [
    { key: 'name', label: 'Пациент', strong: true },
    { key: 'service', label: 'Услуга', secondary: true },
    { key: 'status', label: 'Статус', render: r => <StatusBadge status={r.status} /> },
    { key: 'sum', label: 'Возвращено', money: 'gold', align: 'right' },
  ];
  const rows = [
    { name: 'Марина Ковалёва', service: 'Имплантация', status: 'booked', sum: '12 400 ₽' },
    { name: 'Ольга Северова', service: 'Чистка', status: 'booked', sum: '3 800 ₽' },
    { name: 'Олег Крылов', service: 'Чистка', status: 'dialog', sum: '—' },
    { name: 'Ирина Соколова', service: 'Острая боль', status: 'urgent', sum: '—' },
    { name: 'Пётр Аникин', service: 'Коронка', status: 'booked', sum: '8 900 ₽' },
  ];
  return (
    <ThemePair pad={16}>
      <DataTable columns={cols} rows={rows} footer={{ name: 'Итого за неделю', sum: '25 100 ₽' }} />
    </ThemePair>
  );
}

/* ─── Тосты ─── */
function ToastsDemo() {
  return (
    <ThemePair>
      <div style={{ display: 'grid', gap: 12 }}>
        <Toast variant="success" title="Ольга записана" text="Чистка, четверг 16:00. Напомню ей за день." />
        <Toast variant="money" title="Возвращено 12 400 ₽" text="Марина подтвердила имплантацию." />
        <Toast variant="info" title="Анна пишет Олегу в MAX" text="Не дозвонился в 11:15 — предлагаю время." />
        <Toast variant="urgent" title="Что-то пошло не так, уже чиним" text="Звонки принимаем как обычно. Записи не потеряны." actionLabel="Подробнее" />
      </div>
    </ThemePair>
  );
}

/* ─── Пустые состояния ─── */
function EmptyDemo() {
  return (
    <ThemePair pad={16}>
      <EmptyState text="Если кто-то не дозвонится — карточка появится здесь, а я уже буду писать пациенту." />
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <EmptyState compact title="За эту неделю отчёта ещё нет" text="Соберу его в воскресенье вечером." actionLabel="Отчёт за прошлую неделю" actionIcon="report" />
      </div>
    </ThemePair>
  );
}

/* ─── Степпер онбординга ─── */
function StepperDemo() {
  return (
    <ThemePair>
      <div style={{ display: 'grid', gap: 28, maxWidth: 460 }}>
        <OnboardingStepper current={1} />
        <OnboardingStepper current={3} compact />
      </div>
    </ThemePair>
  );
}

/* ─── Шапка отчёта PDF (печать — всегда светлая) ─── */
function ReportHeaderDemo() {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid var(--neutral-200)', borderRadius: 16, overflow: 'hidden' }}>
      <ReportHeader />
      <div style={{ padding: '20px 32px', fontSize: 16, color: 'var(--text-secondary)' }}>
        …тело отчёта: таблица пациентов, график по дням. Минимальный кегль печати — 12 pt.
      </div>
    </div>
  );
}

/* ─── Иконки: весь сет ─── */
function IconsDemo() {
  return (
    <ThemePair>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))', gap: 8 }}>
        {ICON_NAMES.map(n => (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 6px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <Icon name={n} size={24} />
            <span style={{ fontSize: 14, fontFamily: 'ui-monospace, monospace', color: 'var(--text-secondary)' }}>{n}</span>
          </div>
        ))}
      </div>
    </ThemePair>
  );
}

/* ─── Знаки: медведь линией + солярный медальон ─── */
function MarksDemo() {
  return (
    <ThemePair>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <figure style={{ margin: 0, flex: '1 1 150px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <BearMark size={84} style={{ color: 'var(--wine-800)' }} />
          <figcaption style={{ fontSize: 16, color: 'var(--text-secondary)', textAlign: 'center' }}>Медведь линией — пустые состояния, обложки</figcaption>
        </figure>
        <figure style={{ margin: 0, flex: '1 1 150px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ position: 'relative', width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <OrnamentSolar size={84} style={{ color: 'var(--text)', opacity: .35 }} />
          </div>
          <figcaption style={{ fontSize: 16, color: 'var(--text-secondary)', textAlign: 'center' }}>Солярный медальон — в макетах ≤6% прозрачности</figcaption>
        </figure>
        <figure style={{ margin: 0, flex: '1 1 150px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <img src="assets/logo-tile-wine.png" alt="Логотип" width="84" height="84" style={{ borderRadius: 18 }} />
          <figcaption style={{ fontSize: 16, color: 'var(--text-secondary)', textAlign: 'center' }}>Утверждённый логотип — шапки и плашки</figcaption>
        </figure>
      </div>
    </ThemePair>
  );
}

Object.assign(window.PK, { ButtonsDemo, InputsDemo, TogglesDemo, BadgesDemo, LeadCardsDemo, MoneyDemo, TableDemo, ToastsDemo, EmptyDemo, StepperDemo, ReportHeaderDemo, IconsDemo, MarksDemo });
})();

/* ═══ ui_kits/landing-blocks.jsx ═══ */
(function(){
const { useState } = React;
const { Icon } = window.PK;
const { Button } = window.PK;
const { fmtRub } = window.PK;
/* Лендинг-блоки: hero с калькулятором потерь, доверие (152-ФЗ), тариф.
   Калькулятор показывает математику открыто — «Правда требует доказательства». */

function RuStoreButton({ style }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href="#rustore"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 12, height: 56, padding: '0 20px',
        background: hover ? '#2F2B24' : '#1C1A17', color: '#FCF2DC', textDecoration: 'none',
        borderRadius: 10, fontFamily: 'var(--font-body)', transition: 'background var(--motion-fast)',
        ...style,
      }}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M12 3v10M8 9.5l4 4 4-4" />
        <path d="M4 15v5h16v-5" />
      </svg>
      <span style={{ lineHeight: 1.2, textAlign: 'left' }}>
        <span style={{ display: 'block', fontSize: 13, opacity: .75, letterSpacing: '.04em' }}>СКАЧАЙТЕ В</span>
        <span style={{ display: 'block', fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)' }}>RuStore</span>
      </span>
    </a>
  );
}

/* ── Степпер-контрол калькулятора: −/+, зоны 44px ── */
function CalcStepper({ label, value, display, onMinus, onPlus, hint }) {
  const btn = {
    width: 44, height: 44, flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--surface)', border: '1.5px solid var(--border-strong)', borderRadius: 10,
    fontSize: 22, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', fontFamily: 'var(--font-display)',
    userSelect: 'none', padding: 0,
  };
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" aria-label={`Меньше: ${label}`} style={btn} onClick={onMinus}>−</button>
        <div className="tnum" style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, fontFeatureSettings: "'tnum' 1", whiteSpace: 'nowrap' }}>
          {display !== undefined ? display : value}
        </div>
        <button type="button" aria-label={`Больше: ${label}`} style={btn} onClick={onPlus}>+</button>
      </div>
      {hint ? <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 6 }}>{hint}</div> : null}
    </div>
  );
}

function LossCalculator({ style }) {
  const [calls, setCalls] = useState(3);
  const [check, setCheck] = useState(8000);
  const lossShare = 0.4; // 4 из 10 не перезвонивших уходят в другую клинику
  const loss = Math.round(calls * 22 * check * lossShare / 100) * 100;

  return (
    <div
      style={{
        background: 'var(--surface)', boxShadow: 'var(--shadow-raised)',
        clipPath: 'polygon(0 0, calc(100% - 32px) 0, 100% 32px, 100% 100%, 0 100%)',
        borderRadius: '16px 0 16px 16px', padding: '28px 28px 24px',
        fontFamily: 'var(--font-body)', color: 'var(--text)', ...style,
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, lineHeight: 1.25 }}>Сколько уносят пропущенные?</div>
      <div style={{ display: 'grid', gap: 20, marginTop: 20 }}>
        <CalcStepper
          label="Пропущенных звонков в день"
          value={calls}
          onMinus={() => setCalls(v => Math.max(1, v - 1))}
          onPlus={() => setCalls(v => Math.min(20, v + 1))}
        />
        <CalcStepper
          label="Средний чек"
          display={`${fmtRub(check)}\u00A0₽`}
          onMinus={() => setCheck(v => Math.max(2000, v - 1000))}
          onPlus={() => setCheck(v => Math.min(30000, v + 1000))}
        />
      </div>
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Мимо кассы в месяц</div>
        <div className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 1.1, fontWeight: 700, color: 'var(--urgent-text)', fontFeatureSettings: "'tnum' 1", marginTop: 6, whiteSpace: 'nowrap' }}>
          ≈ {fmtRub(loss)}<span style={{ fontWeight: 600, opacity: .85, marginLeft: '.12em' }}>₽</span>
        </div>
        <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.45 }}>
          {calls} {calls === 1 ? 'звонок' : calls < 5 ? 'звонка' : 'звонков'} × 22 рабочих дня × {fmtRub(check)} ₽ × 40% — столько пациентов
          не перезванивают сами и уходят в другую клинику.
        </div>
      </div>
      <Button variant="primary" size="lg" full icon="check" style={{ marginTop: 20 }}>Подхватим — 1 590 ₽/мес</Button>
    </div>
  );
}

function LandingHero({ style }) {
  return (
    <section style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)', padding: '0 0 56px', ...style }}>
      {/* Верхняя полоса бренда */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '20px 48px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="assets/logo-tile-wine.png" alt="" width="40" height="43" style={{ display: 'block', borderRadius: 9 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Подхват AI+</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 16 }}>
          <a href="#how" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Как работает</a>
          <a href="#price" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Тариф</a>
          <Button variant="brand" size="sm">Подхватим</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(340px, .9fr)', gap: 56, alignItems: 'center', padding: '56px 48px 0', maxWidth: 1200, margin: '0 auto' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--wine-800)' }}>
            <span aria-hidden="true" style={{ width: 20, height: 4, background: 'var(--gold-400)' }} />
            ИИ-администратор для стоматологии
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 1.1, fontWeight: 800, letterSpacing: '-0.01em', margin: '16px 0 0', maxWidth: 560, textWrap: 'balance' }}>
            Пропущенный звонок — это пациент, который ушёл к соседям
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--text-secondary)', margin: '20px 0 0', maxWidth: 520 }}>
            Анна подхватывает звонок за 30 секунд: пишет пациенту в MAX, Telegram или SMS,
            договаривается и записывает. Вы видите каждый возвращённый рубль.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
            <RuStoreButton />
            <Button variant="secondary" size="lg">Как это работает</Button>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 28, fontSize: 16, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon name="shield" size={18} color="var(--success-text)" />152-ФЗ</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon name="server" size={18} color="var(--success-text)" />Данные — в России</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon name="clock" size={18} color="var(--success-text)" />Подхват за 30 секунд</span>
          </div>
        </div>
        <LossCalculator />
      </div>
    </section>
  );
}

function TrustBlock({ style }) {
  const items = [
    { icon: 'shield', title: 'Работаем по 152-ФЗ', text: 'Согласия, обработка и хранение персональных данных — по закону. Шаблоны документов дадим.' },
    { icon: 'server', title: 'Данные — в России', text: 'Серверы в РФ. Записи разговоров и база пациентов не покидают страну.' },
    { icon: 'lock', title: 'База — только ваша', text: 'Не передаём пациентов третьим лицам. Выгрузка и удаление — в один клик.' },
  ];
  return (
    <section style={{ padding: '48px 48px 56px', background: 'var(--bg)', fontFamily: 'var(--font-body)', color: 'var(--text)', ...style }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Покой</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, margin: '8px 0 0' }}>Ничего не потеряно. И никуда не утекло</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 24 }}>
          {items.map((it, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 24px 22px', boxShadow: 'var(--shadow-card)' }}>
              <span style={{ display: 'inline-flex', width: 48, height: 48, alignItems: 'center', justifyContent: 'center', background: 'var(--wine-800)', color: 'var(--gold-300)', clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)', borderRadius: '10px 0 10px 10px' }}>
                <Icon name={it.icon} size={24} />
              </span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, marginTop: 14 }}>{it.title}</div>
              <div style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--text-secondary)', marginTop: 6 }}>{it.text}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ style }) {
  const feats = [
    'Подхват пропущенных — круглосуточно',
    'Анна пишет в MAX, Telegram и SMS',
    'Запись в ваш график и напоминания',
    'Отчёт недели: возвращённые рубли',
  ];
  return (
    <div
      style={{
        width: 380, maxWidth: '100%', background: 'var(--surface)', boxShadow: 'var(--shadow-raised)',
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
        borderRadius: '16px 0 16px 16px', overflow: 'hidden',
        fontFamily: 'var(--font-body)', color: 'var(--text)', ...style,
      }}
    >
      <div style={{ background: 'var(--wine-800)', color: 'var(--ivory)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Подхват AI+</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#1C1A17', background: 'var(--gold-400)', padding: '3px 10px', clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}>14 дней бесплатно</span>
        </div>
      </div>
      <div style={{ padding: '20px 24px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span className="tnum" style={{ fontSize: 20, color: 'var(--text-secondary)', textDecoration: 'line-through', textDecorationThickness: 1.5, fontFeatureSettings: "'tnum' 1" }}>4 900 ₽</span>
          <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 1.1, fontWeight: 700, fontFeatureSettings: "'tnum' 1" }}>
            1 590<span style={{ fontWeight: 600, opacity: .85, marginLeft: '.12em' }}>₽</span>
          </span>
          <span style={{ fontSize: 16, color: 'var(--text-secondary)' }}>в месяц</span>
        </div>
        <div style={{ fontSize: 16, color: 'var(--success-text)', fontWeight: 500, marginTop: 4 }}>Окупается одной записью на чистку</div>
        <ul style={{ listStyle: 'none', margin: '18px 0 0', padding: 0, display: 'grid', gap: 10 }}>
          {feats.map((f, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 16, lineHeight: 1.4 }}>
              <Icon name="check" size={18} color="var(--success-text)" style={{ marginTop: 2 }} />
              {f}
            </li>
          ))}
        </ul>
        <Button variant="primary" size="lg" full style={{ marginTop: 20 }}>Подхватим</Button>
        <div style={{ fontSize: 16, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 12 }}>Отключить можно в любой день. Без договора на год.</div>
      </div>
    </div>
  );
}

Object.assign(window.PK, { RuStoreButton, LossCalculator, LandingHero, TrustBlock, PricingCard });
})();

/* ═══ ui_kits/social-templates.jsx ═══ */
(function(){

const { OrnamentSolar } = window.PK;
/* Шаблоны постов: 9:16 (1080×1920) и 1:1 (1080×1080).
   Рисуются в натуральном размере, масштабируются обёрткой (scale).
   Орнамент — разрешён: соцсети = «обложки», прозрачность ≤6%. */

function PostFrame({ w, h, scale = 0.3, children, style }) {
  return (
    <div style={{ width: w * scale, height: h * scale, flex: 'none', position: 'relative', ...style }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

/* 9:16 «кейс-цифра» — мотив Прибыль. Винный фон, золотая цифра. */
function SocialPost916({ scale = 0.3, clinic = 'клиника «Жемчуг»', sum = '47 200', note = 'вернул ИИ-администратор за неделю', style }) {
  return (
    <PostFrame w={1080} h={1920} scale={scale} style={style}>
      <div style={{ width: 1080, height: 1920, background: '#6F0D1E', color: '#FCF2DC', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <OrnamentSolar size={880} strokeWidth={2} style={{ position: 'absolute', right: -300, bottom: -260, color: '#FCF2DC', opacity: .05 }} />
        {/* шапка */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '88px 96px 0' }}>
          <img src="assets/logo-tile-ivory.png" alt="" width="112" height="121" style={{ display: 'block', borderRadius: 24 }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 700, letterSpacing: '.02em' }}>Подхват AI+</div>
        </div>
        {/* центр */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 96px', position: 'relative' }}>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#E7C258' }}>{clinic} · неделя</div>
          <div className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 190, lineHeight: 1.02, fontWeight: 800, letterSpacing: '-0.02em', color: '#E7C258', fontFeatureSettings: "'tnum' 1", marginTop: 28, whiteSpace: 'nowrap' }}>
            {sum}<span style={{ fontWeight: 600, opacity: .9, marginLeft: '.1em' }}>₽</span>
          </div>
          <div style={{ width: 128, height: 8, background: '#E7C258', clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)', margin: '44px 0' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 62, lineHeight: 1.22, fontWeight: 600, maxWidth: 760, textWrap: 'balance' }}>{note}</div>
          <div style={{ fontSize: 40, lineHeight: 1.4, color: 'rgba(252,242,220,.72)', marginTop: 36, maxWidth: 720 }}>
            12 пропущенных подхвачено · 6 пациентов записаны
          </div>
        </div>
        {/* подвал */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, padding: '0 96px 88px' }}>
          <div style={{ fontSize: 38, color: 'rgba(252,242,220,.72)' }}>подхватим пропущенные звонки</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, border: '3px solid rgba(231,194,88,.65)', borderRadius: 20, padding: '20px 36px', fontSize: 38, fontWeight: 600, color: '#E7C258' }}>
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M12 3v10M8 9.5l4 4 4-4" /><path d="M4 15v5h16v-5" /></svg>
            RuStore
          </div>
        </div>
      </div>
    </PostFrame>
  );
}

/* 1:1 «боль → решение» — мотив Покой. Слоновая кость, счёт потери. */
function SocialPost11({ scale = 0.3, style }) {
  return (
    <PostFrame w={1080} h={1080} scale={scale} style={style}>
      <div style={{ width: 1080, height: 1080, background: '#FCF2DC', color: '#1C1A17', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <OrnamentSolar size={720} strokeWidth={2} style={{ position: 'absolute', right: -240, top: -220, color: '#1C1A17', opacity: .05 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '80px 88px 0', position: 'relative' }}>
          <img src="assets/logo-tile-wine.png" alt="" width="96" height="104" style={{ display: 'block', borderRadius: 20 }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: '#6F0D1E' }}>Подхват AI+</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 88px', position: 'relative' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 84, lineHeight: 1.12, fontWeight: 800, letterSpacing: '-0.01em', maxWidth: 880, textWrap: 'balance' }}>
            Один пропущенный звонок — <span className="tnum" style={{ color: '#6F0D1E', fontFeatureSettings: "'tnum' 1" }}>−8 000 ₽</span>
          </div>
          <div style={{ fontSize: 44, lineHeight: 1.4, color: '#5C554A', marginTop: 32, maxWidth: 800 }}>
            Анна подхватит за 30 секунд: напишет пациенту, договорится, запишет. Вы — спокойны.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '0 88px 80px', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#E7C258', color: '#1C1A17', clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)', borderRadius: '16px 0 16px 16px', padding: '22px 40px', fontSize: 40, fontWeight: 600, fontFamily: 'var(--font-display)' }}>
            14 дней бесплатно
          </div>
          <div className="tnum" style={{ fontSize: 38, color: '#5C554A', fontFeatureSettings: "'tnum' 1" }}>
            дальше — <span style={{ textDecoration: 'line-through' }}>4 900</span> <strong style={{ color: '#1C1A17' }}>1 590 ₽/мес</strong>
          </div>
        </div>
      </div>
    </PostFrame>
  );
}

Object.assign(window.PK, { SocialPost916, SocialPost11 });
})();

/* ═══ ui_kits/app-screens.jsx ═══ */
(function(){

const { Icon } = window.PK;
const { Button } = window.PK;
const { Toggle } = window.PK;
const { StatusBadge } = window.PK;
const { LeadCard } = window.PK;
const { MoneyFigure, fmtRub } = window.PK;
const { RevenueBars } = window.PK;
const { OnboardingStepper } = window.PK;
/* Экраны мобильного приложения 390×~800 (контент без корпуса телефона).
   Каждый экран отвечает мотиву: Покой (лента, карточка) или Прибыль («Деньги»). */

const TABS = [
  ['dialog', 'Лента'],
  ['ruble', 'Деньги'],
  ['report', 'Отчёты'],
  ['settings', 'Настройки'],
];

function TabBar({ active = 0 }) {
  return (
    <nav style={{ flex: 'none', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid var(--border)', background: 'var(--surface)', paddingBottom: 6 }}>
      {TABS.map(([icon, label], i) => {
        const on = i === active;
        return (
          <span key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 4px 6px', minHeight: 44, color: on ? 'var(--control-on)' : 'var(--text-secondary)', cursor: 'pointer' }}>
            {on ? <span aria-hidden="true" style={{ position: 'absolute', top: 0, width: 28, height: 4, background: 'var(--control-on)', clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)' }} /> : null}
            <Icon name={icon} size={24} />
            <span style={{ fontSize: 13, fontWeight: on ? 600 : 500 }}>{label}</span>
          </span>
        );
      })}
    </nav>
  );
}

function AppBar({ title, back = false, right = null }) {
  return (
    <header style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg)' }}>
      {back
        ? <Icon name="return" size={24} style={{ color: 'var(--text)' }} />
        : <img src="assets/logo-tile-wine.png" alt="" width="32" height="35" style={{ display: 'block', borderRadius: 8 }} />}
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, flex: 1, minWidth: 0 }}>{title}</span>
      {right || <Icon name="bell" size={24} style={{ color: 'var(--text-secondary)' }} />}
    </header>
  );
}

function Screen({ children, dark = false, height = 800 }) {
  return (
    <div
      data-theme={dark ? 'dark' : 'light'}
      style={{ width: '100%', height, display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)', overflow: 'hidden' }}
    >
      {children}
    </div>
  );
}

/* ── 1. Лента карточек ── */
function FeedScreen({ dark = false, height = 800 }) {
  const chips = [['Все', 5, true], ['Срочно', 1, false], ['Новые', 2, false]];
  return (
    <Screen dark={dark} height={height}>
      <AppBar title="Подхват AI+" />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '4px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* сводка дня — Покой + Прибыль одной строкой */}
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
            <Icon name="check" size={18} color="var(--success-text)" />
            Подхвачено&nbsp;<strong>5 из 5</strong>
          </span>
          <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-gold)', fontFeatureSettings: "'tnum' 1", whiteSpace: 'nowrap' }}>+12 400 ₽</span>
        </div>
        {/* фильтры */}
        <div style={{ flex: 'none', display: 'flex', gap: 8 }}>
          {chips.map(([label, n, on], i) => (
            <span key={i} className="tnum" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, fontSize: 16, fontWeight: on ? 600 : 500, background: on ? 'var(--control-on)' : 'transparent', color: on ? 'var(--control-on-knob)' : 'var(--text-secondary)', border: on ? 'none' : '1.5px solid var(--border-strong)', fontFeatureSettings: "'tnum' 1", cursor: 'pointer' }}>
              {label} · {n}
            </span>
          ))}
        </div>
        {/* карточки */}
        <div style={{ display: 'grid', gap: 12 }}>
          <LeadCard status="urgent" name="Ирина Соколова" phone="+7 912 003-18-44" service="Острая боль" time="14:02" source="call" note="Перезвоните первой — обещала ждать 15 минут." />
          <LeadCard status="dialog" name="Олег Крылов" phone="+7 909 315-77-02" service="Чистка" time="11:15" source="max" actions={false} note="Предложила четверг 16:00 — думает." />
          <LeadCard status="booked" name="Ольга Северова" phone="+7 903 118-24-60" service="Чистка · чт 16:00" time="вчера" source="telegram" sum={3800} actions={false} />
        </div>
      </div>
      <TabBar active={0} />
    </Screen>
  );
}

/* ── 2. Карточка лида (детально) ── */
function LeadDetailScreen({ dark = false, height = 800 }) {
  const timeline = [
    { icon: 'call-missed', time: '14:02', text: 'Звонок пропущен — обе линии заняты', tone: 'var(--urgent-text)' },
    { icon: 'max', time: '14:03', text: 'Написала Ирине в MAX: предложила приехать сегодня', tone: 'var(--text-secondary)' },
    { icon: 'dialog', time: '14:07', text: 'Ирина ответила: сильная боль, ждёт звонка 15 минут', tone: 'var(--text-secondary)' },
  ];
  return (
    <Screen dark={dark} height={height}>
      <AppBar title="Карточка пациента" back right={<span />} />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: '1.5px solid var(--urgent)', borderRadius: 16, boxShadow: 'var(--shadow-urgent)', padding: '18px 16px', position: 'relative', overflow: 'hidden' }}>
          <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'var(--urgent)' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingLeft: 4 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Ирина Соколова</div>
              <div className="tnum" style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 2, fontFeatureSettings: "'tnum' 1" }}>+7 912 003-18-44</div>
            </div>
            <StatusBadge status="urgent" solid label="Срочно — боль" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginTop: 16, paddingLeft: 4, fontSize: 16 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Обращение</span><strong style={{ textAlign: 'right' }}>Острая боль</strong>
            <span style={{ color: 'var(--text-secondary)' }}>Канал</span><span style={{ textAlign: 'right', display: 'inline-flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}><Icon name="call" size={18} />Звонок</span>
            <span style={{ color: 'var(--text-secondary)' }}>Ожидаемый чек</span><strong className="tnum" style={{ textAlign: 'right', color: 'var(--text-gold)', fontFamily: 'var(--font-display)', fontFeatureSettings: "'tnum' 1" }}>4 500 ₽</strong>
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 18, paddingLeft: 4 }}>
            <Button variant="danger" size="md" full icon="call">Перезвонить сейчас</Button>
            <Button variant="secondary" size="md" full icon="check">Записан ✓</Button>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 16px 8px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Что сделала Анна</div>
          <div style={{ marginTop: 12 }}>
            {timeline.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: i < timeline.length - 1 ? 18 : 10 }}>
                {i < timeline.length - 1 ? <span aria-hidden="true" style={{ position: 'absolute', left: 11, top: 26, bottom: 0, width: 1.5, background: 'var(--border)' }} /> : null}
                <Icon name={t.icon} size={22} color={t.tone} style={{ flex: 'none', marginTop: 1 }} />
                <div style={{ fontSize: 16, lineHeight: 1.4 }}>
                  <span className="tnum" style={{ color: 'var(--text-secondary)', fontFeatureSettings: "'tnum' 1", marginRight: 8 }}>{t.time}</span>
                  {t.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* ── 3. Экран «Деньги» ── */
function MoneyScreen({ dark = true, height = 800 }) {
  const week = [
    { label: 'пн', value: 0 }, { label: 'вт', value: 3800 }, { label: 'ср', value: 8400 },
    { label: 'чт', value: 12400 }, { label: 'пт', value: 9800 }, { label: 'сб', value: 12800 }, { label: 'вс', value: 0 },
  ];
  return (
    <Screen dark={dark} height={height}>
      <AppBar title="Деньги" />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '4px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 16px 16px', boxShadow: 'var(--shadow-card)' }}>
          <MoneyFigure value={47200} size="xl" mobile label="Возвращено за неделю" sub="6 пациентов записаны" color="gold" />
          <div style={{ marginTop: 18 }}>
            <RevenueBars data={week} highlightIndex={5} paybackIndex={3} height={96} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 16 }}>
            <svg viewBox="0 0 10 10" width="10" height="10" style={{ flex: 'none' }}><polygon points="5,0 10,5 5,10 0,5" fill="var(--control-on)" /></svg>
            Пилот окупился в четверг — <strong>на 9-й день</strong>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
            <MoneyFigure value={12800} size="md" label="Лучший день" />
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
            <MoneyFigure value={7867} size="md" label="Средний чек" />
          </div>
        </div>
      </div>
      <TabBar active={1} />
    </Screen>
  );
}

/* ── 4. Шаг онбординга (2 из 4 — «Каналы») ── */
function OnboardingScreen({ dark = false, height = 800 }) {
  return (
    <Screen dark={dark} height={height}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '20px 20px 0' }}>
        <OnboardingStepper current={1} compact />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 1.2, fontWeight: 700, margin: '28px 0 0', textWrap: 'balance' }}>Куда Анне писать пациентам?</h2>
        <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--text-secondary)', margin: '10px 0 0' }}>
          Если пациент не дозвонился, Анна напишет ему сама — туда, где его удобнее застать.
        </p>
        <div style={{ display: 'grid', gap: 4, marginTop: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '10px 16px', boxShadow: 'var(--shadow-card)' }}>
          <Toggle defaultChecked label="MAX" description="Основной канал — сюда первым делом" />
          <Toggle defaultChecked label="Telegram" description="Если пациент есть в Telegram" />
          <Toggle label="SMS" description="Резерв — когда мессенджеры молчат" />
        </div>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: '14px 0 0', display: 'flex', gap: 8 }}>
          <Icon name="shield" size={18} color="var(--success-text)" style={{ flex: 'none', marginTop: 2 }} />
          Каналы можно менять в любой момент. Данные — в России, по 152-ФЗ.
        </p>
      </div>
      <div style={{ flex: 'none', display: 'grid', gap: 8, padding: '16px 20px 24px' }}>
        <Button variant="primary" size="lg" full>Дальше</Button>
        <Button variant="ghost" size="md" full>Назад</Button>
      </div>
    </Screen>
  );
}

Object.assign(window.PK, { FeedScreen, LeadDetailScreen, MoneyScreen, OnboardingScreen });
})();

if (typeof module !== 'undefined') { module.exports = window.PK; }
