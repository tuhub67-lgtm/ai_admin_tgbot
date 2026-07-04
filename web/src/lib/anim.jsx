import { useEffect, useRef, useState } from 'react';

/* Оркестрованный reveal на IntersectionObserver — Firefox-safe, без CSS scroll-timeline.
   Контент виден всегда (см. app.css .reveal); анимация — прогрессивное улучшение.
   Один и тот же механизм даёт и scroll-reveal секций, и staggered page-load hero
   (для hero — каскад через transition-delay у элементов, уже во вьюпорте на загрузке). */

let animEnabled = false;
function ensureAnimClass() {
  if (animEnabled || typeof document === 'undefined') return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // reduce-motion: оставляем контент статично видимым
  document.documentElement.classList.add('js-anim');
  animEnabled = true;
}

export function useInView({ threshold = 0, rootMargin = '0px 0px -40px 0px', once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            if (once) io.unobserve(e.target);
          } else if (!once) {
            setInView(false);
          }
        });
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, once]);
  return [ref, inView];
}

/* Обёртка секции/элемента: fade-in-up при попадании во вьюпорт.
   delay — для каскада (мс). as — тег обёртки. */
export function Reveal({ children, delay = 0, as = 'div', className = '', style, ...rest }) {
  useEffect(() => { ensureAnimClass(); }, []);
  const [ref, inView] = useInView();
  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'is-visible' : ''} ${className}`.trim()}
      style={{ '--reveal-delay': `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
