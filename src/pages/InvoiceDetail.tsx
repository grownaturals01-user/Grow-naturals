import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  RotateCcw,
  FileText,
  CreditCard,
  User,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { Invoice } from '../types';
import { A4InvoiceView } from '../components/print/A4InvoiceView';
import { Receipt80mmView } from '../components/print/Receipt80mmView';
import { Badge } from '../components/common/Badge';

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<'a4' | 'thermal'>('a4');

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await api.get<Invoice>(`/invoices/${id}`);
        setInvoice(data);

        // Auto print if query param passed
        if (searchParams.get('autoPrint') === 'true') {
          setTimeout(() => {
            window.print();
          }, 400);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p className="text-secondary">Loading invoice details...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p className="text-error" style={{ marginBottom: 'var(--space-4)' }}>{error || 'Invoice not found'}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/invoices')}>
          Back to Invoices
        </button>
      </div>
    );
  }

  const isGrowNaturals = invoice.business_id === 'grow-naturals';

  return (
    <div>
      {/* Top Action Header */}
      <div className="page-header no-print" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/invoices')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h1 className="page-title">{invoice.invoice_number}</h1>
              <Badge variant={invoice.payment_status === 'paid' ? 'success' : 'warning'}>
                {invoice.payment_status.toUpperCase()}
              </Badge>
              <Badge variant={isGrowNaturals ? 'info' : 'secondary'}>
                {isGrowNaturals ? 'GROW NATURALS (GST)' : 'NIKHLESH NURSERY'}
              </Badge>
            </div>
            <p className="page-subtitle">
              Date: {new Date(invoice.created_at).toLocaleString()} &bull; Cashier: {invoice.cashier_name || 'Counter'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {/* Format Switcher */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
            <button
              className={`btn btn-sm ${activeFormat === 'a4' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveFormat('a4')}
            >
              A4 Format
            </button>
            <button
              className={`btn btn-sm ${activeFormat === 'thermal' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveFormat('thermal')}
            >
              80mm Thermal
            </button>
          </div>

          {/* Refund CTA */}
          <Link
            to={`/refunds/new?invoice_id=${invoice.id}`}
            className="btn btn-warning"
            title="Process item refund and auto-restock inventory"
          >
            <RotateCcw size={16} /> Process Refund
          </Link>
        </div>
      </div>

      {/* Invoice Presentation Sheet */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {activeFormat === 'a4' ? (
          <div style={{ width: '100%', maxWidth: '850px' }}>
            <A4InvoiceView invoice={invoice} />
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '420px' }}>
            <Receipt80mmView invoice={invoice} />
          </div>
        )}
      </div>
    </div>
  );
};
