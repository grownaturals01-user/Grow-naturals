import React from 'react';
import type { HeldBill } from '../../types';
import { Clock, Play, Trash2, X } from 'lucide-react';

interface PosHoldBillsProps {
  isOpen: boolean;
  onClose: () => void;
  heldBills: HeldBill[];
  onResumeBill: (bill: HeldBill) => void;
  onDeleteBill: (id: string) => void;
}

export const PosHoldBills: React.FC<PosHoldBillsProps> = ({
  isOpen,
  onClose,
  heldBills,
  onResumeBill,
  onDeleteBill,
}) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="dialog-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="var(--module-sell-accent)" />
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700 }}>Held Bills ({heldBills.length})</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {heldBills.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px 0' }}>
              No held bills on this counter.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {heldBills.map((bill) => {
                const total = bill.items.reduce((acc, i) => acc + (i.quantity * i.unit_price - i.discount), 0);
                return (
                  <div
                    key={bill.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-surface-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--color-text-primary)' }}>
                        {bill.hold_number} — {bill.customer_name || 'Walk-in'}
                      </div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                        {bill.items.length} items | Saved {new Date(bill.saved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 'var(--font-md)', color: 'var(--module-sell-accent)', marginTop: '2px' }} className="tabular">
                        ₹{total.toFixed(2)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-sell btn-sm"
                        onClick={() => {
                          onResumeBill(bill);
                          onClose();
                        }}
                      >
                        <Play size={14} /> Resume
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-subtle btn-sm btn-icon-only"
                        onClick={() => onDeleteBill(bill.id)}
                        title="Discard held bill"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
