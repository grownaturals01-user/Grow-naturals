import React, { useEffect, useState } from 'react';
import { X, Download, ExternalLink, ZoomIn, ZoomOut, RotateCw, Receipt, Calendar, DollarSign, Tag, Briefcase, CreditCard, User } from 'lucide-react';
import { Expense } from '../../types';

interface ExpenseReceiptModalProps {
  expense: Expense | null;
  onClose: () => void;
}

export const ExpenseReceiptModal: React.FC<ExpenseReceiptModalProps> = ({ expense, onClose }) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!expense || !expense.image_url) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = expense.image_url!;
    link.download = `Expense-Receipt-${expense.reference_no || expense.id}-${expense.date}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    window.open(expense.image_url, '_blank');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Receipt size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Expense Receipt / Bill Proof
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                <span>Date: <strong>{new Date(expense.date).toLocaleDateString()}</strong></span>
                {expense.reference_no && <span>Ref: <strong>{expense.reference_no}</strong></span>}
                <span>Payee: <strong>{expense.recipient || 'N/A'}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '2px 6px',
                gap: '4px',
              }}
            >
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom In"
                className="btn btn-ghost btn-icon btn-sm"
                style={{ padding: '4px', color: '#334155' }}
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                title="Zoom Out"
                className="btn btn-ghost btn-icon btn-sm"
                style={{ padding: '4px', color: '#334155' }}
              >
                <ZoomOut size={16} />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                title="Rotate 90°"
                className="btn btn-ghost btn-icon btn-sm"
                style={{ padding: '4px', color: '#334155' }}
              >
                <RotateCw size={16} />
              </button>
              {(zoom !== 1 || rotation !== 0) && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', padding: '2px 6px', color: '#0284c7' }}
                >
                  Reset
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleDownload}
              title="Download Receipt Image"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Download size={14} /> Download
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              title="Open Full Image in New Tab"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <ExternalLink size={14} /> Open
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              className="btn btn-ghost btn-icon"
              style={{ width: '32px', height: '32px', color: '#64748b' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body - Image Canvas */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            minHeight: '380px',
            maxHeight: '62vh',
            userSelect: 'none',
          }}
        >
          <img
            src={expense.image_url}
            alt={`Receipt for ${expense.recipient || 'Expense'}`}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '8px',
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              background: '#ffffff',
            }}
          />
        </div>

        {/* Modal Footer - Expense Summary Details */}
        <div
          style={{
            padding: '12px 20px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: '#64748b', marginRight: '6px' }}>Category:</span>
              <span style={{ fontWeight: 600, color: '#0f172a', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                {expense.category_name || 'General Overhead'}
              </span>
            </div>
            {expense.project_name && (
              <div>
                <span style={{ color: '#64748b', marginRight: '6px' }}>Project:</span>
                <span style={{ fontWeight: 600, color: '#4338ca', background: '#e0e7ff', padding: '2px 8px', borderRadius: '4px' }}>
                  {expense.project_name}
                </span>
              </div>
            )}
            <div>
              <span style={{ color: '#64748b', marginRight: '6px' }}>Payment Mode:</span>
              <span style={{ fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>
                {expense.payment_method}
              </span>
            </div>
            {expense.notes && (
              <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ color: '#64748b', marginRight: '6px' }}>Notes:</span>
                <span style={{ color: '#334155' }}>{expense.notes}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Expense Amount:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>
              ₹{Number(expense.amount).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
