import React, { useEffect } from 'react';

/**
 * Toast de notificação temporária.
 *
 * Props:
 *   toast    { tipo: 'success'|'error', mensagem: string } | null
 *   onDismiss () => void
 *   timeout  number (ms) — padrão 4000
 */
export default function Toast({ toast, onDismiss, timeout = 4000 }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, timeout);
    return () => clearTimeout(timer);
  }, [toast, onDismiss, timeout]);

  if (!toast) return null;

  const className = toast.tipo === 'success' ? 'toast toast-success' : 'toast toast-error';

  return (
    <div className="toast-container">
      <div
        className={className}
        role="alert"
        aria-live="assertive"
        onClick={onDismiss}
        style={{ cursor: 'pointer' }}
        title="Clique para fechar"
      >
        {toast.mensagem}
      </div>
    </div>
  );
}
