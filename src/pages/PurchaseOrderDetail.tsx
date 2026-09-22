import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Printer,
  DollarSign,
  Package,
  Building,
  Calendar,
  CreditCard,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { PurchaseOrder } from '../types';
import { Badge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const PurchaseOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status modal / confirm
  const [confirmReceiveOpen, setConfirmReceiveOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment update modal
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [newPaidAmount, setNewPaidAmount] = useState<number>(0);

  const fetchPo = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.get<PurchaseOrder>(`/purchases/${id}`);
      setPo(data);
      setNewPaidAmount(Number(data.paid_amount) || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load purchase order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPo();
  }, [id]);

  const handleReceiveStock = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await api.put(`/purchases/${id}/status`, { status: 'received' });
      setConfirmReceiveOpen(false);
      await fetchPo();
    } catch (err: any) {
      alert(err.message || 'Failed to mark PO received');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setActionLoading(true);
      await api.put(`/purchases/${id}/payment`, { paid_amount: Number(newPaidAmount) });
      setPaymentDialogOpen(false);
      await fetchPo();
    } catch (err: any) {
      alert(err.message || 'Failed to update payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p className="text-secondary">Loading purchase order details...</p>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p className="text-error" style={{ marginBottom: 'var(--space-4)' }}>{error || 'Purchase order not found'}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/purchases')}>
          Back to Purchase Orders
        </button>
      </div>
    );
  }

  const due = Math.max(0, Number(po.total_amount) - Number(po.paid_amount));

  return (
    <div>
      {/* Top action bar */}
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/purchases')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h1 className="page-title">{po.po_number}</h1>
              <Badge
                variant={po.status === 'received' ? 'success' : po.status === 'cancelled' ? 'danger' : 'warning'}
              >
                {po.status.toUpperCase()}
              </Badge>
              <Badge
                variant={po.payment_status === 'paid' ? 'success' : po.payment_status === 'partial' ? 'warning' : 'danger'}
              >
                PAYMENT: {po.payment_status.toUpperCase()}
              </Badge>
            </div>
            <p className="page-subtitle">
              Order Date: {new Date(po.order_date).toLocaleDateString()} &bull; Supplier: <strong>{po.supplier_name}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Print PO
          </button>
          {po.status !== 'received' && (
            <button className="btn btn-primary" onClick={() => setConfirmReceiveOpen(true)}>
              <CheckCircle size={16} /> Mark Received & Restock
            </button>
          )}
          <button className="btn btn-outline" onClick={() => setPaymentDialogOpen(true)}>
            <DollarSign size={16} /> Record Payment
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
        {/* Left Column: PO Items & Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Package size={18} /> Ordered Items
              </h2>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th style={{ textAlign: 'right' }}>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Unit Cost (₹)</th>
                      <th style={{ textAlign: 'right' }}>Line Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.items && po.items.length > 0 ? (
                      po.items.map((item, index) => (
                        <tr key={item.id || index}>
                          <td style={{ color: 'var(--text-tertiary)' }}>{index + 1}</td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                            {item.product_id && (
                              <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>
                                Product ID: {item.product_id}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right' }} className="tabular-nums">
                            ₹{Number(item.unit_price).toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }} className="tabular-nums">
                            ₹{Number(item.total).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                          No items in this purchase order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          {po.notes && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <FileText size={16} /> Remarks & Instructions
                </h3>
              </div>
              <div className="card-body">
                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{po.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Financial & Supplier Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Financial Breakdown */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <CreditCard size={18} /> Financial Summary
              </h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-secondary">Subtotal</span>
                  <span className="tabular-nums font-semibold">₹{Number(po.subtotal).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-secondary">Tax Amount</span>
                  <span className="tabular-nums font-semibold">₹{Number(po.tax_amount).toFixed(2)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 'var(--space-2)',
                    borderTop: '1px solid var(--border)',
                    fontSize: 'var(--font-base)',
                    fontWeight: 700
                  }}
                >
                  <span>Grand Total</span>
                  <span className="tabular-nums text-primary" style={{ fontSize: 'var(--font-lg)' }}>
                    ₹{Number(po.total_amount).toFixed(2)}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 'var(--space-2)',
                    padding: 'var(--space-2)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <span className="text-secondary">Paid Amount</span>
                  <span className="tabular-nums font-semibold text-success">
                    ₹{Number(po.paid_amount).toFixed(2)}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: 'var(--space-2)',
                    background: due > 0 ? 'var(--color-danger-bg, #fee2e2)' : 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <span style={{ fontWeight: 600, color: due > 0 ? 'var(--color-danger)' : 'inherit' }}>
                    Outstanding Due
                  </span>
                  <span
                    className="tabular-nums"
                    style={{ fontWeight: 700, color: due > 0 ? 'var(--color-danger)' : 'inherit' }}
                  >
                    ₹{due.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Building size={18} /> Supplier Details
              </h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{po.supplier_name}</div>
                {po.supplier_phone && (
                  <div className="text-secondary" style={{ fontSize: 'var(--font-sm)' }}>
                    Phone: {po.supplier_phone}
                  </div>
                )}
                {po.supplier_invoice_no && (
                  <div className="text-secondary" style={{ fontSize: 'var(--font-sm)', marginTop: 'var(--space-1)' }}>
                    Supplier Bill #: <strong>{po.supplier_invoice_no}</strong>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 'var(--space-2)' }}>
                <Link to={`/suppliers/${po.supplier_id}/edit`} className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
                  View Supplier Profile &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Receive Stock Modal */}
      <ConfirmDialog
        isOpen={confirmReceiveOpen}
        title="Confirm Stock Receipt"
        message={`Are you sure you want to mark PO #${po.po_number} as RECEIVED? This will automatically increment inventory stock for all matched products and record a purchase stock movement.`}
        confirmText="Confirm & Increment Stock"
        cancelText="Cancel"
        variant="primary"
        loading={actionLoading}
        onConfirm={handleReceiveStock}
        onClose={() => setConfirmReceiveOpen(false)}
      />

      {/* Payment Update Modal */}
      {paymentDialogOpen && (
        <div className="modal-backdrop" onClick={() => setPaymentDialogOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Record Supplier Payment</h3>
            </div>
            <form onSubmit={handleUpdatePayment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <p className="text-secondary" style={{ fontSize: 'var(--font-sm)' }}>
                  Total PO Amount: <strong>₹{Number(po.total_amount).toFixed(2)}</strong>
                </p>
                <div className="form-group">
                  <label className="form-label">Total Amount Paid (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={po.total_amount}
                    className="form-input"
                    value={newPaidAmount}
                    onChange={e => setNewPaidAmount(Number(e.target.value))}
                    required
                  />
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                  Remaining due will be: ₹{Math.max(0, Number(po.total_amount) - Number(newPaidAmount)).toFixed(2)}
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPaymentDialogOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Update Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
