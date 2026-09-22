import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && <CheckCircle size={18} color="var(--color-success)" />}
          {t.type === 'error' && <AlertCircle size={18} color="var(--color-danger)" />}
          {t.type === 'warning' && <AlertTriangle size={18} color="var(--color-warning)" />}
          {t.type === 'info' && <Info size={18} color="var(--color-info)" />}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)' }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
