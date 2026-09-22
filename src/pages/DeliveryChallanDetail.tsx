import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import type { DeliveryChallan } from '../types';
import { Badge } from '../components/common/Badge';
import gnLogo from '../assets/grownaturalslogo.jpeg';
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  Truck,
  Building,
  User,
  Calendar,
  IndianRupee,
  FileCheck,
  Receipt,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2
} from 'lucide-react';

export const DeliveryChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { businessId, isTaxable } = useBusiness();
  const navigate = useNavigate();

  const [challan, setChallan] = useState<DeliveryChallan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [convertToInvoice, setConvertToInvoice] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  const fetchChallan = () => {
    setIsLoading(true);
    api
      .get(`/delivery-challans/${id}`)
      .then((data) => {
        setChallan(data);
        const due = Number(data.due_amount) || Math.max(0, (Number(data.total_amount) || 0) - (Number(data.paid_amount) || 0));
        setPaymentAmount(String(due));
        setPaymentNotes(`Payment for DC #${data.challan_number}`);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchChallan();
  }, [id]);

  const handleMarkDelivered = async () => {
    setIsUpdating(true);
    try {
      await api.put(`/delivery-challans/${id}/status`, { status: 'delivered' });
      fetchChallan();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(paymentAmount);
    if (!amountVal || amountVal <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const res = await api.post(`/delivery-challans/${id}/payments`, {
        amount: amountVal,
        payment_method: paymentMethod,
        notes: paymentNotes,
        create_invoice: convertToInvoice,
      });

      if (convertToInvoice && res.invoice_id) {
        navigate(`/invoices/${res.invoice_id}`);
        return;
      }

      setPaymentModalOpen(false);
      fetchChallan();
    } catch (err: any) {
      alert(`Payment recording failed: ${err.message}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading || !challan) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px', color: 'var(--color-text-muted)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--module-sell-accent)' }} />
        <p style={{ fontSize: 'var(--font-sm)' }}>Loading delivery challan...</p>
      </div>
    );
  }

  const total = Number(challan.total_amount) || 0;
  const paid = Number(challan.paid_amount) || 0;
  const due = Number(challan.due_amount) || Math.max(0, total - paid);

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header Actions */}
      <div className="page-header no-print" style={{ marginBottom: '16px' }}>
        <div className="page-title-group">
          <Link
            to="/delivery-challans"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              marginBottom: '6px'
            }}
          >
            <ArrowLeft size={15} /> Back to Delivery Challans
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ fontSize: '1.35rem', margin: 0 }}>
              <span>Delivery Challan #{challan.challan_number}</span>
            </h1>
            <Badge variant={challan.status === 'delivered' ? 'success' : 'warning'}>
              {challan.status === 'delivered' ? 'Delivered to Site' : 'In Transit'}
            </Badge>
            {challan.payment_status === 'billed' ? (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 9px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--module-inv-subtle)', color: 'var(--module-inv-text)' }}>
                Billed / Invoiced
              </span>
            ) : due > 0 ? (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 9px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-danger-subtle)', color: 'var(--color-danger-text)' }}>
                ₹{due.toFixed(2)} Due Pending
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 9px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-botanical-100)', color: 'var(--color-botanical-800)' }}>
                Fully Paid
              </span>
            )}
          </div>
          <p className="page-description" style={{ fontSize: '0.8125rem', marginTop: '3px' }}>
            Site dispatch note for {challan.customer_name}.
          </p>
        </div>

        <div className="page-actions" style={{ gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.print()}
            style={{ fontSize: '0.8125rem', padding: '8px 16px' }}
          >
            <Printer size={15} /> Print Challan
          </button>

          {due > 0 && (
            <button
              type="button"
              className="btn btn-inv"
              onClick={() => setPaymentModalOpen(true)}
              style={{ fontSize: '0.8125rem', padding: '8px 18px', fontWeight: 700, gap: '5px' }}
            >
              <IndianRupee size={15} /> Clear Due / Collect Payment
            </button>
          )}

          {challan.status !== 'delivered' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleMarkDelivered}
              disabled={isUpdating}
              style={{ fontSize: '0.8125rem', padding: '8px 16px' }}
            >
              <CheckCircle size={15} /> Mark Delivered
            </button>
          )}
        </div>
      </div>

      {/* Due Banner if unpaid */}
      {due > 0 && (
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '12px 18px',
            backgroundColor: 'var(--module-sell-subtle)',
            color: 'var(--module-sell-text)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--module-sell-border)',
            marginBottom: '18px',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} />
            <div>
              <strong style={{ fontSize: '0.875rem' }}>Bill is Pending Payment:</strong>
              <span style={{ fontSize: '0.8125rem', marginLeft: '6px' }}>
                Goods have been dispatched, but an outstanding balance of <strong>₹{due.toFixed(2)}</strong> remains unpaid for {challan.customer_name}.
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-inv btn-sm"
            onClick={() => setPaymentModalOpen(true)}
            style={{ fontWeight: 700 }}
          >
            Clear Due Now
          </button>
        </div>
      )}

      {/* Printable Challan Sheet */}
      <div className="a4-invoice-sheet a4-invoice-container" style={{ boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-xl)' }}>
        <div className="invoice-branding-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', maxWidth: '65%' }}>
            <img
              src={gnLogo}
              alt="Grow Naturals Logo"
              className="invoice-header-logo"
              loading="eager"
            />
            <div>
              <h1 className="invoice-biz-title">
                {challan.legal_name || challan.business_name || (isTaxable ? 'Grow Naturals Private Limited' : 'Nikhlesh Nursery & Farm')}
              </h1>
              <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                {challan.business_address || 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu'}
              </p>
              <p style={{ fontSize: '13px', color: '#475569' }}>
                Phone: {challan.business_phone}
              </p>
              {isTaxable && challan.business_gstin && (
                <p style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>
                  GSTIN: {challan.business_gstin}
                </p>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
              DELIVERY CHALLAN
            </h2>
            <div className="invoice-tax-badge">Supply of Goods / Dispatch Note</div>
            <p style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px' }}>
              DC #: <span className="tabular">{challan.challan_number}</span>
            </p>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Date: {new Date(challan.dispatch_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Consignee & Transport Grid */}
        <div className="invoice-details-grid">
          <div className="invoice-detail-block">
            <h4>Consignee / Site Location:</h4>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{challan.customer_name}</p>
            {challan.customer_phone && <p style={{ fontSize: '13px', color: '#475569' }}>Phone: {challan.customer_phone}</p>}
            {challan.project_name && <p style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>Project: {challan.project_name}</p>}
          </div>

          <div className="invoice-detail-block" style={{ textAlign: 'right' }}>
            <h4>Transport Details:</h4>
            <p style={{ fontSize: '13px', color: '#475569' }}>
              Vehicle No: <strong>{challan.vehicle_no || 'Local Handover'}</strong>
            </p>
            {challan.driver_name && (
              <p style={{ fontSize: '13px', color: '#475569' }}>
                Driver: <strong>{challan.driver_name}</strong>
              </p>
            )}
            <p style={{ fontSize: '13px', color: '#475569' }}>
              Status: <strong>{challan.status.toUpperCase()}</strong>
            </p>
          </div>
        </div>

        {/* Challan Items Table with Rates & Totals */}
        <table className="invoice-items-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>Material / Item Description</th>
              <th style={{ textAlign: 'center', width: '100px' }}>Quantity</th>
              <th style={{ textAlign: 'center', width: '90px' }}>Unit</th>
              <th style={{ textAlign: 'right', width: '120px' }}>Rate (₹)</th>
              <th style={{ textAlign: 'right', width: '130px' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {challan.items?.map((it, idx) => {
              const qty = Number(it.quantity) || 1;
              const rate = Number(it.unit_price) || 0;
              const itemTotal = Number(it.total) || qty * rate;

              return (
                <tr key={it.id || idx}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{it.product_name}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }} className="tabular">{qty}</td>
                  <td style={{ textAlign: 'center', color: '#64748b' }}>{it.unit || 'Nos'}</td>
                  <td style={{ textAlign: 'right' }} className="tabular">₹{rate.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular">₹{itemTotal.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Financial Settlement & Totals Grid */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            {challan.notes && (
              <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                <strong>Dispatch Notes:</strong> {challan.notes}
              </div>
            )}
            {challan.payment_notes && (
              <div style={{ padding: '8px 14px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '12px', marginTop: '8px', color: '#14532d' }}>
                <strong>Payment Notes:</strong> {challan.payment_notes}
              </div>
            )}
          </div>

          <div style={{ width: '280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
              <span style={{ color: '#64748b' }}>Total Dispatched Value:</span>
              <strong className="tabular">₹{total.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0', fontSize: '13px', color: '#16a34a' }}>
              <span>Paid Amount:</span>
              <strong className="tabular">₹{paid.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '15px', color: due > 0 ? '#dc2626' : '#16a34a' }}>
              <strong>Due Balance:</strong>
              <strong className="tabular" style={{ fontSize: '17px' }}>₹{due.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Declarations & Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <div style={{ borderBottom: '1px solid #0f172a', height: '40px' }}></div>
            <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px', color: '#475569' }}>
              Receiver's Signature / Stamp
            </p>
          </div>

          <div style={{ textAlign: 'center', width: '200px' }}>
            <div style={{ borderBottom: '1px solid #0f172a', height: '40px' }}></div>
            <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px', color: '#475569' }}>
              Authorized Dispatcher Signature
            </p>
          </div>
        </div>
      </div>

      {/* Payment Clearance Modal */}
      {paymentModalOpen && (
        <div className="dialog-overlay" onClick={() => setPaymentModalOpen(false)}>
          <div className="dialog-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IndianRupee size={18} style={{ color: 'var(--module-inv-accent)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  Record Payment for DC #{challan.challan_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProcessPayment}>
              <div className="dialog-body" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-bg-surface-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Current Outstanding Due:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-danger)' }} className="tabular">
                    ₹{due.toFixed(2)}
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Payment Amount to Collect (₹) <span className="required">*</span>
                  </label>
                  <div className="input-addon-group">
                    <span className="input-addon-prefix">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={due}
                      className="form-input tabular"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">💵 Cash Received</option>
                    <option value="upi">📱 UPI / QR Code</option>
                    <option value="bank_transfer">🏦 Direct Bank Transfer</option>
                    <option value="card">💳 Card Swipe</option>
                    <option value="cheque">📝 Cheque</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Transaction Note</label>
                  <input
                    type="text"
                    className="form-input"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    backgroundColor: 'var(--color-bg-surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <input
                    type="checkbox"
                    id="convertSingleToInvoiceCheck"
                    checked={convertToInvoice}
                    onChange={(e) => setConvertToInvoice(e.target.checked)}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <label htmlFor="convertSingleToInvoiceCheck" style={{ fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <strong>Convert to Formal Paid Invoice</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      Creates an official paid tax invoice record linked to this delivery challan.
                    </div>
                  </label>
                </div>
              </div>

              <div className="dialog-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPaymentModalOpen(false)}
                  style={{ padding: '7px 16px', fontSize: '0.8125rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-inv"
                  disabled={isProcessingPayment}
                  style={{ padding: '7px 20px', fontSize: '0.8125rem', fontWeight: 700 }}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Recording...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Clear Due
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
