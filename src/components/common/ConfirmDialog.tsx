import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  variant?: 'primary' | 'danger' | 'warning' | string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  variant,
  loading = false,
  onConfirm,
  onCancel,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleClose = onClose || onCancel || (() => {});
  const isDanger = isDangerous || variant === 'danger';
  const btnClass = isDanger ? 'btn-danger' : variant === 'warning' ? 'btn-warning' : 'btn-primary';

  return (
    <div className="dialog-overlay" onClick={handleClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isDanger && <AlertTriangle size={20} color="var(--color-danger)" />}
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700 }}>{title}</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>{message}</p>
        </div>

        <div className="dialog-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleClose} disabled={loading}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${btnClass}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
