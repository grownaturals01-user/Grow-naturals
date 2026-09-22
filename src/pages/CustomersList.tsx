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
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Customer } from '../types';
import { EmptyState } from '../components/common/EmptyState';

export const CustomersList: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div className="input-icon-wrapper" style={{ flex: '1 1 300px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Search customer name, phone number, email, or GSTIN..."
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
        ) : customers.length === 0 ? (
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
                  <th>Contact Info</th>
                  <th>Address & GSTIN</th>
                  <th style={{ textAlign: 'right' }}>Bills Count</th>
                  <th style={{ textAlign: 'right' }}>Total Spent (₹)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
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
                        <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600 }}>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
