import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Toast } from '../../design/components/feedback/Toast.jsx';

/* Показ тостов кабинета: фиксируем над нижней навигацией, авто-скрытие.
   Голос Анны задаётся вызывающим экраном (title/text). */

export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef();

  const showToast = useCallback((t) => {
    setToast(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3600);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toast, showToast };
}

export function ToastHost({ toast }) {
  if (!toast) return null;
  return (
    <div
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 88, zIndex: 20,
        display: 'flex', justifyContent: 'center', padding: '0 16px', pointerEvents: 'none',
      }}
    >
      <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: 420 }}>
        <Toast variant={toast.variant || 'success'} title={toast.title} text={toast.text} />
      </div>
    </div>
  );
}
