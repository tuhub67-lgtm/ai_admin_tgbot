import { useEffect } from 'react';

/* Пер-роутовый title/description без внешних зависимостей.
   Базовые OG-теги живут в index.html; здесь обновляем title и description. */
export function Seo({ title, description }) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute('name', 'description');
        document.head.appendChild(m);
      }
      m.setAttribute('content', description);
    }
  }, [title, description]);
  return null;
}
