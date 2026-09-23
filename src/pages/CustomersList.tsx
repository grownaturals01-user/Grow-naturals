import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Receipt,
  ArrowRight,
  UserCheck,
  Building2,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { Customer } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';

export const CustomersList: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'customer' | 'wholesaler'>('all');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.get<Customer[]>('/customers', {
        search: search || undefined
      });
      setCustomers(data);
    } catch (err: any) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const filteredCustomers = customers.filter(c => {
    if (typeFilter === 'all') return true;
    if (typeFilter === 'wholesaler') return c.customer_type === 'wholesaler';
    return !c.customer_type || c.customer_type === 'customer';
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">
            Shared directory of retail, corporate, and nursery clientele across both businesses
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Link to="/customers/new" className="btn btn-primary">
            <Plus size={16} /> Add Customer
          </Link>
        </div>
      </div>

      {/* Search & Type Filter Bar */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div className="input-icon-wrapper" style={{ flex: '1 1 260px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Search customer name, phone number, email, or GSTIN..."
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: '170px' }}>
            <select
              className="form-select"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
            >
              <option value="all">All Customer Types</option>
              <option value="customer">Retail Customers</option>
              <option value="wholesaler">Wholesalers / B2B</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            Search
          </button>
          {(search || typeFilter !== 'all') && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
                fetchCustomers();
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Customers Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }} className="text-secondary">
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            title="No Customers Found"
            description="Add your first customer to track their billing history, recurring quotations, and delivery challans."
            actionLabel="Add Customer"
            onAction={() => navigate('/customers/new')}
          />
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Customer Type</th>
                  <th>Contact Info</th>
                  <th>Address & GSTIN</th>
                  <th style={{ textAlign: 'right' }}>Bills Count</th>
                  <th style={{ textAlign: 'right' }}>Total Spent (₹)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(c => {
                  const isWholesale = c.customer_type === 'wholesaler';
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link
                          to={`/customers/${c.id}`}
                          style={{ fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td>
                        {isWholesale ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                            }}
                          >
                            <Building2 size={12} /> Wholesaler
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: '#e0f2fe',
                              color: '#0369a1',
                              border: '1px solid #bae6fd',
                            }}
                          >
                            <Users size={12} /> Customer
                          </span>
                        )}
                      </td>
                      <td>
                        {c.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-sm)' }}>
                            <Phone size={13} className="text-secondary" /> {c.phone}
                          </div>
                        )}
                        {c.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                            <Mail size={12} /> {c.email}
                          </div>
                        )}
                        {!c.phone && !c.email && (
                          <span className="text-tertiary" style={{ fontSize: 'var(--font-xs)' }}>No contact info</span>
                        )}
                      </td>
                      <td>
                        {c.gstin && (
                          <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: '#15803d' }}>
                            GSTIN: {c.gstin}
                          </div>
                        )}
                        {c.address ? (
                          <div className="text-secondary text-truncate" style={{ fontSize: 'var(--font-xs)', maxWidth: '220px' }}>
                            {c.address}
                          </div>
                        ) : (
                          <span className="text-tertiary" style={{ fontSize: 'var(--font-xs)' }}>No address</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }} className="tabular-nums font-semibold">
                        {c.invoice_count || 0}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular-nums text-success">
                        ₹{Number(c.total_spent || 0).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/customers/${c.id}`}
                          className="btn btn-ghost btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          Profile <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
