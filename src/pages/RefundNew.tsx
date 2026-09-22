import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Receipt,
  Package,
  CreditCard
} from 'lucide-react';
import { api } from '../services/api';
import { Invoice, InvoiceItem } from '../types';
import { useBusiness } from '../context/BusinessContext';

interface RefundItemRow {
  product_id?: string | null;
  product_name: string;
  original_quantity: number;
  refund_quantity: number;
  unit_price: number;
  gst_rate: number;
  tax_refund: number;
  total: number;
  selected: boolean;
}

export const RefundNew: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeBusiness } = useBusiness();

  const invoiceIdParam = searchParams.get('invoice_id');

  // Search state if no invoice selected yet
  const [invoiceLookup, setInvoiceLookup] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Active invoice being refunded
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [refundRows, setRefundRows] = useState<RefundItemRow[]>([]);
  const [refundMethod, setRefundMethod] = useState('cash');
  const [reason, setReason] = useState('Customer returned damaged or unwanted items');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadInvoice = async (query: string) => {
    try {
      setSearching(true);
      setSearchError(null);
      const data = await api.get<Invoice>(`/invoices/${query.trim()}`);
      if (!data || !data.id) {
        setSearchError('Invoice not found. Please verify the invoice number.');
        return;
      }
      setInvoice(data);
      setRefundMethod(data.payment_method || 'cash');

      // Populate item rows
      const rows: RefundItemRow[] = (data.items || []).map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        original_quantity: Number(item.quantity) || 1,
        refund_quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        gst_rate: Number(item.gst_rate) || 0,
        tax_refund: Number(item.tax_amount) || 0,
        total: Number(item.total) || 0,
        selected: true
      }));
      setRefundRows(rows);
    } catch (err: any) {
      setSearchError(err.message || 'Invoice not found. Standalone refunds are not permitted.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (invoiceIdParam) {
      loadInvoice(invoiceIdParam);
    }
  }, [invoiceIdParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceLookup.trim()) return;
    loadInvoice(invoiceLookup);
  };

  const handleRowToggle = (index: number) => {
    setRefundRows(prev => {
      const next = [...prev];
      next[index].selected = !next[index].selected;
      return next;
    });
  };

  const handleQtyChange = (index: number, qty: number) => {
    setRefundRows(prev => {
      const next = [...prev];
      const validQty = Math.max(0, Math.min(next[index].original_quantity, qty));
      next[index].refund_quantity = validQty;

      // Recalculate line total & tax proportion
      const baseAmount = validQty * next[index].unit_price;
      const isTaxable = activeBusiness.id === 'grow-naturals';
      const taxPart = isTaxable ? (baseAmount * next[index].gst_rate) / 100 : 0;

      next[index].tax_refund = taxPart;
      next[index].total = baseAmount + taxPart;
      return next;
    });
  };

  const selectedItems = refundRows.filter(r => r.selected && r.refund_quantity > 0);
  const totalRefundAmount = selectedItems.reduce((sum, r) => sum + r.total, 0);

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    if (selectedItems.length === 0) {
      setSubmitError('Please select at least one item to refund with quantity > 0.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const payload = {
        invoice_id: invoice.id,
        refund_method: refundMethod,
        reason: reason.trim() || 'Customer returned items',
        items: selectedItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.refund_quantity,
          unit_price: item.unit_price,
          tax_refund: item.tax_refund,
          total: item.total
        }))
      };

      const res = await api.post('/refunds', payload);
      navigate(`/refunds/${res.refund_id}`);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to process refund');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/refunds')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Process Sales Refund</h1>
            <p className="page-subtitle">
              Refund against an existing invoice and auto-restock returned goods into inventory
            </p>
          </div>
        </div>
      </div>

      {/* Lookup Card if no invoice or switching invoice */}
      {!invoice && (
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Receipt size={18} /> Step 1: Select Original Invoice
            </h2>
          </div>
          <div className="card-body">
            <p className="text-secondary" style={{ marginBottom: 'var(--space-3)' }}>
              Under store compliance rules, all refunds must be directly linked to an existing sales bill. Enter the Invoice Number (e.g. <code>GN-1001</code> or <code>NN-1001</code>) to proceed.
            </p>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 'var(--space-2)', maxWidth: '500px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Enter Invoice Number..."
                value={invoiceLookup}
                onChange={e => setInvoiceLookup(e.target.value)}
                required
                autoFocus
              />
              <button type="submit" className="btn btn-primary" disabled={searching}>
                <Search size={16} /> {searching ? 'Searching...' : 'Find Bill'}
              </button>
            </form>
            {searchError && (
              <div style={{ color: 'var(--color-danger)', marginTop: 'var(--space-3)', fontSize: 'var(--font-sm)', fontWeight: 500 }}>
                {searchError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Found & Item Selector */}
      {invoice && (
        <form onSubmit={handleSubmitRefund}>
          {/* Invoice Summary Banner */}
          <div
            className="card"
            style={{
              marginBottom: 'var(--space-4)',
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-strong)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <h3 style={{ margin: 0, fontSize: 'var(--font-lg)', fontWeight: 700 }}>
                    Invoice #{invoice.invoice_number}
                  </h3>
                  <span className="badge badge-success">Original Bill</span>
                </div>
                <p className="text-secondary" style={{ margin: '4px 0 0 0', fontSize: 'var(--font-sm)' }}>
                  Customer: <strong>{invoice.customer_name || 'Walk-in'}</strong> &bull; Total Paid: <strong>₹{Number(invoice.total_amount).toFixed(2)}</strong> &bull; Date: {new Date(invoice.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setInvoice(null);
                    setRefundRows([]);
                  }}
                >
                  Change Invoice
                </button>
              </div>
            </div>
          </div>

          {/* Restock Guarantee Alert */}
          <div
            className="card"
            style={{
              marginBottom: 'var(--space-4)',
              backgroundColor: 'var(--color-info-bg, #eff6ff)',
              borderColor: 'var(--color-info, #3b82f6)',
              padding: 'var(--space-3)'
            }}
          >
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <Package size={20} style={{ color: 'var(--color-info, #3b82f6)', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 'var(--font-sm)', color: '#1e3a8a' }}>
                <strong>Automatic Restocking:</strong> Selected items will automatically have their inventory count increased upon approval, and an audit trail entry will be written to <code>stock_movements</code>.
              </p>
            </div>
          </div>

          {submitError && (
            <div className="card" style={{ marginBottom: 'var(--space-4)', backgroundColor: 'var(--color-danger-bg, #fef2f2)', borderColor: 'var(--color-danger)' }}>
              <p className="text-error" style={{ margin: 0, fontWeight: 500 }}>{submitError}</p>
            </div>
          )}

          {/* Items to Refund Table */}
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="card-header">
              <h2 className="card-title">Select Items to Refund</h2>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>Include</th>
                      <th>Product</th>
                      <th style={{ textAlign: 'right' }}>Original Qty</th>
                      <th style={{ textAlign: 'right', width: '130px' }}>Refund Qty</th>
                      <th style={{ textAlign: 'right' }}>Unit Price (₹)</th>
                      <th style={{ textAlign: 'right' }}>Tax Refund (₹)</th>
                      <th style={{ textAlign: 'right' }}>Total Refund (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refundRows.map((row, idx) => (
                      <tr key={idx} style={{ opacity: row.selected ? 1 : 0.5 }}>
                        <td>
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => handleRowToggle(idx)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{row.product_name}</div>
                          {row.product_id ? (
                            <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>
                              Auto-restock enabled
                            </div>
                          ) : (
                            <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>
                              Custom line item (no stock tracking)
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }} className="tabular-nums font-semibold">
                          {row.original_quantity}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            min="1"
                            max={row.original_quantity}
                            value={row.refund_quantity}
                            disabled={!row.selected}
                            onChange={e => handleQtyChange(idx, Number(e.target.value))}
                            className="form-input tabular-nums"
                            style={{ width: '80px', textAlign: 'right', padding: 'var(--space-1) var(--space-2)' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }} className="tabular-nums">
                          ₹{row.unit_price.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right' }} className="tabular-nums">
                          ₹{row.tax_refund.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular-nums">
                          ₹{row.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Refund Details Form */}
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="card-header">
              <h2 className="card-title">Refund Method & Reason</h2>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label required">Disbursement Mode</label>
                <select
                  className="form-select"
                  value={refundMethod}
                  onChange={e => setRefundMethod(e.target.value)}
                  required
                >
                  <option value="cash">Cash Out</option>
                  <option value="upi">UPI / Online Refund</option>
                  <option value="card">Card Reversal</option>
                  <option value="store_credit">Store Credit / Note</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Reason for Return</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Plant withered before delivery, broken ceramic pot, wrong species supplied"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div
            className="card"
            style={{
              padding: 'var(--space-4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            <div>
              <span className="text-secondary" style={{ fontSize: 'var(--font-sm)' }}>
                Total Payout to Customer:
              </span>
              <div className="tabular-nums" style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--color-warning)' }}>
                ₹{totalRefundAmount.toFixed(2)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/refunds')}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-warning"
                disabled={submitting || selectedItems.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                <RotateCcw size={16} />
                {submitting ? 'Processing & Restocking...' : 'Confirm Refund & Restock'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
