import React from 'react';
import { AlertTriangle, Info, Trash2, X, Loader2 } from 'lucide-react';

interface DeleteModuleModalProps {
  isOpen: boolean;
  moduleName: string;
  moduleSlug?: string;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export const DeleteModuleModal: React.FC<DeleteModuleModalProps> = ({
  isOpen,
  moduleName,
  moduleSlug,
  isDeleting = false,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="dialog-overlay"
      onClick={() => !isDeleting && onClose()}
      style={{ zIndex: 1000 }}
    >
      <div
        className="dialog-content"
        style={{ maxWidth: '480px', borderRadius: '16px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="dialog-header"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.01em'
                }}
              >
                Remove Inventory Module
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Action confirmation
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              background: 'none',
              border: 'none',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              color: 'var(--color-text-muted)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background var(--transition-fast)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          className="dialog-body"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--color-text-primary)',
              margin: 0,
              lineHeight: 1.5
            }}
          >
            Are you sure you want to remove the{' '}
            <strong style={{ color: 'var(--color-danger-text, #dc2626)' }}>
              "{moduleName}"
            </strong>{' '}
            inventory module?
          </p>

          {/* Safe removal informative callout */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-bg-surface-subtle)',
              border: '1px solid var(--color-border)',
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.45
            }}
          >
            <Info
              size={16}
              style={{ color: 'var(--color-botanical-600)', flexShrink: 0, marginTop: '2px' }}
            />
            <div>
              <strong>Safe Removal:</strong> Products categorized under this module will{' '}
              <strong>NOT</strong> be deleted. They will remain fully accessible in{' '}
              <strong>All Products</strong> and search.
            </div>
          </div>

          {/* Impact bullet points */}
          <div
            style={{
              fontSize: '0.76rem',
              color: 'var(--color-text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              paddingLeft: '4px'
            }}
          >
            {moduleSlug && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--color-danger)' }}>•</span>
                <span>
                  Removes dedicated page{' '}
                  <code style={{ fontSize: '0.72rem', padding: '1px 4px', background: 'var(--color-bg-surface-subtle)', borderRadius: '4px' }}>
                    /inventory/custom/{moduleSlug}
                  </code>
                </span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--color-danger)' }}>•</span>
              <span>Removes navigation link from the main sidebar</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--color-danger)' }}>•</span>
              <span>Removes filter pill from POS Cashier Register</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="dialog-footer"
          style={{
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: '1px solid var(--color-border)'
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
            style={{ fontSize: '0.84rem', padding: '7px 16px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              fontSize: '0.84rem',
              padding: '7px 16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Removing...
              </>
            ) : (
              <>
                <Trash2 size={15} /> Yes, Remove Module
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
