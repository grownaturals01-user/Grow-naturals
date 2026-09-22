import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  Printer,
  CheckCircle,
  Receipt,
  User,
  Calendar,
  PackageCheck,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { Refund } from '../types';
import { Badge } from '../components/common/Badge';

export const RefundDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [refund, setRefund] = useState<Refund | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRefund = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await api.get<Refund>(`/refunds/${id}`);
        setRefund(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load refund record');
      } finally {
        setLoading(false);
      }
    };
    fetchRefund();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p className="text-secondary">Loading refund details...</p>
      </div>
    );
  }

  if (error || !refund) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p className="text-error" style={{ marginBottom: 'var(--space-4)' }}>{error || 'Refund not found'}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/refunds')}>
          Back to Refunds
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Action Header */}
      <div className="page-header no-print" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/refunds')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h1 className="page-title">{refund.refund_number}</h1>
              <Badge variant="warning">REFUND ISSUED</Badge>
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={12} /> RESTOCKED
              </span>
            </div>
            <p className="page-subtitle">
              Processed: {new Date(refund.created_at).toLocaleString()} &bull; Cashier: {refund.cashier_name || 'Staff'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Print Credit Voucher
          </button>
          <Link to={`/invoices/${refund.invoice_id}`} className="btn btn-ghost">
            <Receipt size={16} /> View Original Invoice &rarr;
          </Link>
        </div>
      </div>

      {/* Refund Voucher Card */}
      <div className="card" style={{ borderTop: '4px solid var(--color-warning)' }}>
        <div className="card-header" style={{ borderBottom: '1px dashed var(--border)', paddingBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>
                CREDIT NOTE & RESTOCK VOUCHER
              </span>
              <h2 style={{ margin: '4px 0 0 0', fontSize: 'var(--font-2xl)', fontWeight: 800 }}>
                {refund.refund_number}
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="text-secondary" style={{ fontSize: 'var(--font-sm)' }}>Original Bill</div>
              <Link
                to={`/invoices/${refund.invoice_id}`}
                style={{ fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}
              >
                #{refund.invoice_number}
              </Link>
            </div>
          </div>
        </div>

        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Metadata Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', background: 'var(--bg-secondary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>Customer</div>
              <div style={{ fontWeight: 600 }}>{refund.customer_name || 'Walk-in Customer'}</div>
            </div>
            <div>
              <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>Disbursement Method</div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{refund.refund_method}</div>
            </div>
            <div>
              <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>Reason</div>
              <div style={{ fontWeight: 500 }}>{refund.reason || 'Not specified'}</div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
              Returned & Restocked Items
            </h3>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Name</th>
                    <th style={{ textAlign: 'right' }}>Restocked Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price (₹)</th>
                    <th style={{ textAlign: 'right' }}>Tax Restocked (₹)</th>
                    <th style={{ textAlign: 'right' }}>Total Refunded (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(refund.items || []).map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td style={{ color: 'var(--text-tertiary)' }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                        {item.product_id && (
                          <div className="text-secondary" style={{ fontSize: 'var(--font-xs)', color: 'var(--color-success)' }}>
                            <PackageCheck size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            Returned to inventory stock
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular-nums">
                        {item.quantity}
                      </td>
                      <td style={{ textAlign: 'right' }} className="tabular-nums">
                        ₹{Number(item.unit_price).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }} className="tabular-nums">
                        ₹{Number(item.tax_refund || 0).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular-nums">
                        ₹{Number(item.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grand Total */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-3)', borderTop: '2px dashed var(--border)' }}>
            <div style={{ textAlign: 'right' }}>
              <span className="text-secondary" style={{ fontSize: 'var(--font-sm)' }}>Total Amount Refunded</span>
              <div className="tabular-nums" style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--color-warning)' }}>
                ₹{Number(refund.total_refund_amount).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
