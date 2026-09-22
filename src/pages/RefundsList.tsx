import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Search,
  Eye,
  Plus,
  ArrowRight,
  Receipt,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { Refund } from '../types';
import { useBusiness } from '../context/BusinessContext';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';

export const RefundsList: React.FC = () => {
  const navigate = useNavigate();
  const { activeBusiness } = useBusiness();

  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const data = await api.get<Refund[]>('/refunds', {
        search: search || undefined
      });
      setRefunds(data);
    } catch (err: any) {
      console.error('Failed to load refunds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [activeBusiness.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRefunds();
  };

  const totalRefundAmount = refunds.reduce((sum, r) => sum + Number(r.total_refund_amount || 0), 0);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Refunds & Returns</h1>
          <p className="page-subtitle">
            Audit trail of customer returns and inventory restocks for <strong>{activeBusiness.name}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Link to="/refunds/new" className="btn btn-warning">
            <Plus size={16} /> Process New Refund
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div className="card stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="stat-label">Total Refund Transactions</div>
          <div className="stat-value tabular-nums">{refunds.length}</div>
          <div className="stat-helper">All recorded returns</div>
        </div>
        <div className="card stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-label">Total Value Refunded</div>
          <div className="stat-value tabular-nums" style={{ color: '#d97706' }}>
            ₹{totalRefundAmount.toFixed(2)}
          </div>
          <div className="stat-helper">Inventory automatically restocked</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div className="input-icon-wrapper" style={{ flex: '1 1 300px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Search refund #, original invoice #, or customer name..."
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setSearch('');
                fetchRefunds();
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Refunds Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }} className="text-secondary">
            Loading refund records...
          </div>
        ) : refunds.length === 0 ? (
          <EmptyState
            title="No Refunds Processed"
            description="No customer returns or refunds have been recorded for this business."
            actionLabel="Process a Return"
            onAction={() => navigate('/refunds/new')}
          />
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Refund #</th>
                  <th>Original Invoice</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Refund Mode</th>
                  <th>Reason</th>
                  <th style={{ textAlign: 'right' }}>Refund Amount (₹)</th>
                  <th style={{ textAlign: 'right' }}>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map(ref => (
                  <tr key={ref.id}>
                    <td>
                      <Link
                        to={`/refunds/${ref.id}`}
                        style={{ fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}
                      >
                        {ref.refund_number}
                      </Link>
                    </td>
                    <td>
                      <Link
                        to={`/invoices/${ref.invoice_id}`}
                        style={{ textDecoration: 'none', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Receipt size={14} />
                        {ref.invoice_number}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {ref.customer_name || 'Walk-in Customer'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge variant="neutral">
                        {ref.items?.length || 1} items
                      </Badge>
                    </td>
                    <td>
                      <span className="badge" style={{ textTransform: 'capitalize' }}>
                        {ref.refund_method}
                      </span>
                    </td>
                    <td className="text-secondary" style={{ fontSize: 'var(--font-sm)', maxWidth: '200px' }}>
                      <div className="text-truncate">{ref.reason}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-warning)' }} className="tabular-nums">
                      ₹{Number(ref.total_refund_amount).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {new Date(ref.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/refunds/${ref.id}`}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="View Refund Details"
                      >
                        <Eye size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
