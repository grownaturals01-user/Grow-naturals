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
  DollarSign,
  Edit2,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { Customer, Invoice } from '../types';
import { Badge } from '../components/common/Badge';

interface CustomerWithInvoices extends Customer {
  invoices?: Invoice[];
}

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
  const [customerType, setCustomerType] = useState<'customer' | 'wholesaler'>('customer');
  const [saving, setSaving] = useState(false);
  const [isFetchingGst, setIsFetchingGst] = useState(false);

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
      setCustomerType((data.customer_type as any) || 'customer');
    } catch (err: any) {
      setError(err.message || 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleFetchGstDetails = async (gstToLookup?: string) => {
    const cleanGst = (gstToLookup || gstin).trim().toUpperCase();
    if (!cleanGst || cleanGst.length !== 15) return;
    setIsFetchingGst(true);
    try {
      const res: any = await api.get(`/gst/lookup/${cleanGst}`);
      if (res && res.success) {
        if (res.customer_name || res.trade_name || res.legal_name) {
          setName(res.trade_name || res.legal_name || res.customer_name);
          if (res.phone && !phone) setPhone(res.phone);
          if (res.email && !email) setEmail(res.email);
          if (res.address) setAddress(res.address);
          setCustomerType('wholesaler');
        }
      }
    } catch (err) {}
    finally {
      setIsFetchingGst(false);
    }
  };

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
        gstin: gstin.trim().toUpperCase(),
        customer_type: customerType
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
  const isWholesale = customer.customer_type === 'wholesaler';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/customers')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="page-title" style={{ margin: 0 }}>{customer.name}</h1>
              {isWholesale ? (
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: '#fef3c7',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                  }}
                >
                  Wholesaler / B2B
                </span>
              ) : (
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                  }}
                >
                  Retail Customer
                </span>
              )}
            </div>
            <p className="page-subtitle" style={{ margin: 0, marginTop: '2px' }}>
              Client profile & cross-business purchasing record
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="stat-label">Lifetime Spend Value</div>
          <div className="stat-value tabular-nums text-success">₹{totalSpent.toFixed(2)}</div>
          <div className="stat-helper">Total gross billed</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--space-4)' }}>
        {/* Left Column: Details or Edit Form */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">Customer Details</h2>
            {!isEditing ? (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setName(customer.name || '');
                  setPhone(customer.phone || '');
                  setEmail(customer.email || '');
                  setAddress(customer.address || '');
                  setGstin(customer.gstin || '');
                  setCustomerType((customer.customer_type as any) || 'customer');
                  setIsEditing(true);
                }}
                style={{ fontSize: '0.8rem', padding: '4px 8px' }}
              >
                <Edit2 size={14} /> Edit
              </button>
            ) : (
              <button
                className="btn btn-ghost btn-sm text-secondary"
                onClick={() => setIsEditing(false)}
                style={{ fontSize: '0.8rem', padding: '4px 8px' }}
              >
                <X size={14} /> Cancel
              </button>
            )}
          </div>
          <div className="card-body">
            {isEditing ? (
              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label required">Customer Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      className={`btn ${customerType === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                      onClick={() => setCustomerType('customer')}
                    >
                      Retail Customer
                    </button>
                    <button
                      type="button"
                      className={`btn ${customerType === 'wholesaler' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                      onClick={() => setCustomerType('wholesaler')}
                    >
                      Wholesaler / B2B
                    </button>
                  </div>
                </div>

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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>GSTIN</label>
                    {gstin.length >= 15 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem', padding: '2px 8px', height: 'auto', color: 'var(--primary-color)' }}
                        onClick={() => handleFetchGstDetails(gstin)}
                        disabled={isFetchingGst}
                      >
                        {isFetchingGst ? 'Fetching...' : '✨ Auto-Fetch Details'}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    value={gstin}
                    placeholder="e.g. 33AABCT1332L1ZV"
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setGstin(val);
                      if (val.length === 15) {
                        handleFetchGstDetails(val);
                      }
                    }}
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
                <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--space-2)' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
                    <Save size={16} /> {saving ? 'Saving...' : 'Update Details'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>Customer Type</div>
                  <div style={{ marginTop: '2px' }}>
                    {customer.customer_type === 'wholesaler' ? (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: '#fef3c7',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                        }}
                      >
                        Wholesaler / B2B
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: '#e0f2fe',
                          color: '#0369a1',
                          border: '1px solid #bae6fd',
                        }}
                      >
                        Retail Customer
                      </span>
                    )}
                  </div>
                </div>
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
                            {inv.business_id === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery'}
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
