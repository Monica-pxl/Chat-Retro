import { useState, useEffect } from 'react';
import '../styles/alertModal.css';

interface AlertDetail {
  title?: string;
  message: string;
  icon?: string;
  variant?: 'info' | 'warning' | 'error' | 'success';
}

export default function AlertModal() {
  const [alert, setAlert] = useState<AlertDetail | null>(null);

  useEffect(() => {
    const handleAlert = (e: CustomEvent<AlertDetail>) => {
      setAlert(e.detail);
    };
    window.addEventListener('show-alert-modal', handleAlert as EventListener);
    return () => window.removeEventListener('show-alert-modal', handleAlert as EventListener);
  }, []);

  if (!alert) return null;

  const variant = alert.variant || 'info';
  const iconoPorDefecto =
    variant === 'error' ? 'bi-x-octagon-fill'
    : variant === 'warning' ? 'bi-exclamation-triangle-fill'
    : variant === 'success' ? 'bi-check-circle-fill'
    : 'bi-info-circle-fill';

  return (
    <div className="rs-alert-overlay" onClick={() => setAlert(null)}>
      <div
        className={`rs-alert-modal rs-alert-modal--${variant}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="rs-alert-modal__close" onClick={() => setAlert(null)} title="Cerrar">
          <i className="bi bi-x-lg" />
        </button>
        <div className="rs-alert-modal__icon">
          <i className={`bi ${alert.icon || iconoPorDefecto}`} />
        </div>
        {alert.title && <h3 className="rs-alert-modal__title">{alert.title}</h3>}
        <p className="rs-alert-modal__message">{alert.message}</p>
      </div>
    </div>
  );
}
