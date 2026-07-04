/* Тосты кабинета: тонкая обёртка над дизайн-паковым Toast.
   useToasts() возвращает { toasts, toast, dismiss }; <ToastStack> рендерит их
   фиксированно снизу (над нижней навигацией на мобильном). */

import { useCallback, useRef, useState } from 'react';
import { Toast } from '../../design/components/feedback/Toast.jsx';

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const toast = useCallback((t) => {
    const id = ++seq.current;
    setToasts((list) => [...list, { id, ...t }]);
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), t.duration || 3600);
    return id;
  }, []);

  return { toasts, toast, dismiss };
}

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div
      style={{
        position: 'fixed', left: '50%', transform: 'translateX(-50%)',
        bottom: 'calc(84px + env(safe-area-inset-bottom))', zIndex: 200,
        display: 'flex', flexDirection: 'column', gap: 10, width: 'min(420px, calc(100vw - 32px))',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }} onClick={() => onDismiss && onDismiss(t.id)}>
          <Toast variant={t.variant} title={t.title} text={t.text} style={{ maxWidth: 'none' }} />
        </div>
      ))}
    </div>
  );
}
