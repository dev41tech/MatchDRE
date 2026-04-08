import React, { useEffect } from 'react';

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IconAlertCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

/**
 * Toast de notificação temporária. Sem uso de alert/confirm nativo.
 *
 * Props:
 *   toast    { tipo: 'success'|'error', mensagem: string } | null
 *   onDismiss () => void
 *   timeout  number (ms) — padrão 4500
 */
export default function Toast({ toast, onDismiss, timeout = 4500 }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, timeout);
    return () => clearTimeout(timer);
  }, [toast, onDismiss, timeout]);

  if (!toast) return null;

  const isSuccess = toast.tipo === 'success';

  return (
    <div className="toast-container">
      <div
        className={`toast ${isSuccess ? 'toast-success' : 'toast-error'}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="toast-icon">
          {isSuccess ? <IconCheck /> : <IconAlertCircle />}
        </div>
        <span className="toast-message">{toast.mensagem}</span>
        <button
          className="toast-close"
          onClick={onDismiss}
          aria-label="Fechar notificação"
        >
          <IconClose />
        </button>
      </div>
    </div>
  );
}
