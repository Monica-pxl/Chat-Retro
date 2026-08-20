import { useState, useEffect } from 'react';
import '../styles/toasts.css';

export default function ToastManager() {
  const [toasts, setToasts] = useState<{ id: number; type: 'error' | 'warning' | 'success'; message: string }[]>([]);

  useEffect(() => {
    const handleToast = (e: CustomEvent) => {
      const newToast = { id: Date.now(), ...e.detail };
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4000);
    };

    window.addEventListener('show-toast', handleToast as EventListener);
    return () => window.removeEventListener('show-toast', handleToast as EventListener);
  }, []);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast-item toast-item--${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'error' && <i className="bi bi-x-octagon-fill" />}
            {toast.type === 'warning' && <i className="bi bi-exclamation-triangle-fill" />}
            {toast.type === 'success' && <i className="bi bi-check-circle-fill" />}
          </div>
          <div className="toast-message">{toast.message}</div>
        </div>
      ))}
    </div>
  );
}