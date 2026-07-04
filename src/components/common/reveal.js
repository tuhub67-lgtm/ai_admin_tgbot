/* Scroll-reveal секций лендинга — fallback через IntersectionObserver.
   Запускается ТОЛЬКО когда CSS `animation-timeline: view()` не поддерживается
   (иначе анимацию делает CSS). При reduced-motion или отсутствии IO — ничего
   не трогаем, контент остаётся видимым. */

export function initReveal() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const supportsViewTimeline =
    window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
  if (supportsViewTimeline) return; // CSS сам справится

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return; // оставляем видимым

  const els = document.querySelectorAll('.lp-reveal');
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  // Класс на <html> активирует стартовое скрытое состояние ТОЛЬКО сейчас,
  // когда наблюдатель уже готов проявить секции.
  document.documentElement.classList.add('reveal-js');
  els.forEach((el) => io.observe(el));
}
