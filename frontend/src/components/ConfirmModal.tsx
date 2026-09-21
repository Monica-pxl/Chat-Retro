import '../styles/alertModal.css';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirming?: boolean;
}

export default function ConfirmModal({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  confirming = false,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="rs-alert-overlay" onClick={onCancel}>
      <div
        className="rs-alert-modal rs-alert-modal--warning rs-confirm-modal"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="rs-alert-modal__icon">
          <i className="bi bi-trash3-fill" />
        </div>
        <h3 id="confirm-modal-title" className="rs-alert-modal__title">{title}</h3>
        <p className="rs-alert-modal__message">{message}</p>
        <div className="rp-confirm-actions">
          <button className="rs-confirm-btn rs-confirm-btn--cancel" onClick={onCancel} disabled={confirming}>
            Cancelar
          </button>
          <button className="rs-confirm-btn rs-confirm-btn--danger" onClick={onConfirm} disabled={confirming}>
            {confirming ? <i className="bi bi-arrow-repeat rs-spin" /> : <i className="bi bi-trash3" />}
            {confirming ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
