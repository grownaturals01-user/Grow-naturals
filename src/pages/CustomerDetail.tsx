import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Save,
  Receipt,
  Eye,
  Building,
  DollarSign
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import { Customer, Invoice } from '../types';
import { Badge } from '../components/common/Badge';

interface CustomerWithInvoices extends Customer {
  invoices?: Invoice[];
}

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { businesses } = useBusiness();

  const [customer, setCustomer] = useState<CustomerWithInvoices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCustomer = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.get<CustomerWithInvoices>(`/customers/${id}`);
      setCustomer(data);
      setName(data.name || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setAddress(data.address || '');
      setGstin(data.gstin || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setSaving(true);
      await api.put(`/customers/${id}`, {
        name,
        phone,
        email,
        address,
        gstin
      });
      setIsEditing(false);
      await fetchCustomer();
    } catch (err: any) {
      alert(err.message || 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p className="text-secondary">Loading customer profile...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p className="text-error" style={{ marginBottom: 'var(--space-4)' }}>{error || 'Customer not found'}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/customers')}>
          Back to Customers
        </button>
      </div>
    );
  }

  const invoices = customer.invoices || [];
  const totalSpent = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/customers')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">{customer.name}</h1>
            <p className="page-subtitle">
              Client profile & cross-business purchasing record
            </p>
          </div>
        </div>

        <div>
          <button
            className={`btn ${isEditing ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div className="card stat-card">
          <div className="stat-label">Total Bills Issued</div>
          <div className="stat-value tabular-nums text-primary">{invoices.length}</div>
          <div className="stat-helper">Across both businesses</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Lifetime Spend Value</div>
          <div className="stat-value tabular-nums text-success">₹{totalSpent.toFixed(2)}</div>
          <div className="stat-helper">Total gross billed</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--space-4)' }}>
        {/* Left Column: Details or Edit Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Customer Details</h2>
          </div>
          <div className="card-body">
            {isEditing ? (
              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label required">Customer / Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN</label>
                  <input
                    type="text"
                    className="form-input"
                    value={gstin}
                    onChange={e => setGstin(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 'var(--space-2)' }}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Update Details'}
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>Phone</div>
                  <div style={{ fontWeight: 600 }}>{customer.phone || '—'}</div>
                </div>
                <div>
                  <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>Email</div>
                  <div style={{ fontWeight: 600 }}>{customer.email || '—'}</div>
                </div>
                <div>
                  <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>GSTIN</div>
                  <div style={{ fontWeight: 600 }}>{customer.gstin || '—'}</div>
                </div>
                <div>
                  <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>Address</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{customer.address || '—'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invoices History */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Receipt size={18} /> Invoicing History
            </h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {invoices.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center' }} className="text-secondary">
                No past invoices recorded for this customer.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Business</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
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
                        </td>
                        <td>
                          <Badge variant={inv.business_id === 'grow-naturals' ? 'info' : 'secondary'}>
                            {businesses.find(b => b.id === inv.business_id)?.name || inv.business_name || inv.business_id}
                          </Badge>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {new Date(inv.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular-nums">
                          ₹{Number(inv.total_amount).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="btn btn-ghost btn-icon btn-sm"
                            title="View Invoice"
                          >
                            <Eye size={14} />
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
      </div>
    </div>
  );
};
