import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  Printer,
  Calendar,
  CreditCard,
  UserCheck,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { Invoice } from '../types';
import { useBusiness } from '../context/BusinessContext';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

export const InvoicesList: React.FC = () => {
  const navigate = useNavigate();
  const { activeBusiness } = useBusiness();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.get<Invoice[]>('/invoices', {
        search: search || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setInvoices(data);
    } catch (err: any) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [activeBusiness.id, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
  const totalTax = invoices.reduce((sum, inv) => sum + Number(inv.tax_amount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Invoices</h1>
          <p className="page-subtitle">
            Browse, print, and manage all customer sales for <strong>{activeBusiness.name}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Link to="/refunds" className="btn btn-secondary">
            <RotateCcw size={16} /> Refunds History
          </Link>
          <Link to="/pos" className="btn btn-primary">
            New POS Sale &rarr;
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div className="card stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="stat-label">Invoices Count</div>
          <div className="stat-value tabular-nums text-primary">{invoices.length}</div>
          <div className="stat-helper">Filtered invoices</div>
        </div>
        <div className="card stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-label">Total Billed Revenue</div>
          <div className="stat-value tabular-nums" style={{ color: 'var(--color-success)' }}>
            ₹{totalRevenue.toFixed(2)}
          </div>
          <div className="stat-helper">{activeBusiness.id === 'grow-naturals' ? 'Gross total including taxes' : 'Total sales value'}</div>
        </div>
        {activeBusiness.id === 'grow-naturals' ? (
          <div className="card stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <div className="stat-label">GST Collected</div>
            <div className="stat-value tabular-nums" style={{ color: '#7c3aed' }}>
              ₹{totalTax.toFixed(2)}
            </div>
            <div className="stat-helper">CGST + SGST total</div>
          </div>
        ) : (
          <div className="card stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <div className="stat-label">Avg Order Value</div>
            <div className="stat-value tabular-nums" style={{ color: '#7c3aed' }}>
              ₹{(invoices.length > 0 ? totalRevenue / invoices.length : 0).toFixed(2)}
            </div>
            <div className="stat-helper">Average bill size</div>
          </div>
        )}
      </div>

      {/* Search & Date Filter Bar */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div className="input-icon-wrapper" style={{ flex: '1 1 240px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Search invoice #, customer name, phone..."
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              title="From Date"
            />
            <span className="text-secondary">to</span>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              title="To Date"
            />
          </div>

          <button type="submit" className="btn btn-secondary">
            <Filter size={16} /> Filter
          </button>

          {(search || startDate || endDate) && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setSearch('');
                setStartDate('');
                setEndDate('');
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Invoices Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }} className="text-secondary">
            Loading sales invoices...
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            title="No Invoices Found"
            description="There are no sales invoices matching your criteria. Make a sale in the POS counter to create your first bill."
            actionLabel="Open POS Counter"
            onAction={() => navigate('/pos')}
          />
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Payment</th>
                  <th style={{ textAlign: 'right' }}>Items</th>
                  {activeBusiness.id === 'grow-naturals' && <th style={{ textAlign: 'right' }}>Tax (₹)</th>}
                  <th style={{ textAlign: 'right' }}>Total (₹)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <Link
                        to={`/invoices/${inv.id}`}
                        style={{ fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}
                      >
                        {inv.invoice_number}
                      </Link>
                      {inv.project_name && (
                        <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>
                          Project: {inv.project_name}
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div>{new Date(inv.created_at).toLocaleDateString()}</div>
                      <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>
                        {new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.customer_name || 'Walk-in Customer'}</div>
                      {inv.customer_phone && (
                        <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>
                          {inv.customer_phone}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ textTransform: 'capitalize' }}>
                        {inv.payment_method}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="tabular-nums">
                      {inv.item_count || 1}
                    </td>
                    {activeBusiness.id === 'grow-naturals' && (
                      <td style={{ textAlign: 'right' }} className="tabular-nums">
                        ₹{Number(inv.tax_amount || 0).toFixed(2)}
                      </td>
                    )}
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 'var(--font-base)' }} className="tabular-nums">
                      ₹{Number(inv.total_amount).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 'var(--space-1)' }}>
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="btn btn-ghost btn-icon btn-sm"
                          title="View Invoice Details"
                        >
                          <Eye size={15} />
                        </Link>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Print Receipt"
                          onClick={() => navigate(`/invoices/${inv.id}?autoPrint=true`)}
                        >
                          <Printer size={15} />
                        </button>
                      </div>
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
