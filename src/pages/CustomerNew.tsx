import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Sparkles, Loader2, CheckCircle2, AlertCircle, Building2, ShoppingBag, IndianRupee } from 'lucide-react';
import { api } from '../services/api';

export const CustomerNew: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [customerType, setCustomerType] = useState<'customer' | 'wholesaler'>('customer');
  const [creditLimit, setCreditLimit] = useState<string>('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GST Auto-Fetch State
  const [isFetchingGst, setIsFetchingGst] = useState(false);
  const [gstFeedback, setGstFeedback] = useState<{ status: 'idle' | 'success' | 'warning' | 'error'; message: string; state?: string } | null>(null);

  // Auto-fetch handler for GSTIN
  const handleFetchGstDetails = async (inputGstin?: string) => {
    const cleanGst = (inputGstin !== undefined ? inputGstin : gstin).trim().toUpperCase();
    if (!cleanGst) return;

    if (cleanGst.length !== 15) {
      setGstFeedback({
        status: 'warning',
        message: `GSTIN must be 15 characters (currently ${cleanGst.length}/15)`,
      });
      return;
    }

    setIsFetchingGst(true);
    setGstFeedback(null);

    try {
      const res: any = await api.get(`/gst/lookup/${cleanGst}`);
      if (res && res.success) {
        if (res.customer_name || res.trade_name || res.legal_name) {
          const fetchedName = res.trade_name || res.legal_name || res.customer_name;
          setName(fetchedName);
          if (res.phone && !phone) setPhone(res.phone);
          if (res.email && !email) setEmail(res.email);
          if (res.address) setAddress(res.address);

          // If valid B2B company GSTIN is entered, default to wholesaler if not set
          setCustomerType('wholesaler');

          setGstFeedback({
            status: 'success',
            message: `Verified: ${fetchedName} (${res.state || 'Registered'})`,
            state: res.state,
          });
        } else {
          setGstFeedback({
            status: 'success',
            message: `Valid GSTIN Format • State: ${res.state || 'India'} (${res.entity_type || 'Business'})`,
            state: res.state,
          });
        }
      } else {
        setGstFeedback({
          status: 'error',
          message: res.error || 'Could not verify GSTIN details.',
        });
      }
    } catch (err: any) {
      setGstFeedback({
        status: 'error',
        message: err.message || 'Error looking up GSTIN.',
      });
    } finally {
      setIsFetchingGst(false);
    }
  };

  // Debounce auto-fetch on typing 15 chars
  const debounceTimerRef = useRef<any>(null);
  const handleGstinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
    setGstin(val);
    setGstFeedback(null);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (val.length === 15) {
      debounceTimerRef.current = setTimeout(() => {
        handleFetchGstDetails(val);
      }, 350);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await api.post('/customers', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        gstin: gstin.trim().toUpperCase(),
        customer_type: customerType,
        credit_limit: Number(creditLimit) || 0,
      });

      navigate(`/customers/${res.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/customers')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Add New Customer</h1>
            <p className="page-subtitle">
              Register a retail client or wholesaler in the directory for POS, quotations, and projects
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 'var(--space-4)', backgroundColor: 'var(--color-danger-bg, #fef2f2)', borderColor: 'var(--color-danger)' }}>
          <p className="text-error" style={{ margin: 0, fontWeight: 500 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="card-header">
            <h2 className="card-title">Client Information</h2>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            
            {/* Customer Type Selector */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label required">Customer Classification / Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  onClick={() => setCustomerType('customer')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1.5px solid',
                    borderColor: customerType === 'customer' ? 'var(--color-primary, #0284c7)' : 'var(--color-border, #cbd5e1)',
                    background: customerType === 'customer' ? 'var(--color-primary-bg, #f0f9ff)' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="customer_type"
                    checked={customerType === 'customer'}
                    onChange={() => setCustomerType('customer')}
                    style={{ accentColor: 'var(--color-primary, #0284c7)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: customerType === 'customer' ? 'var(--color-primary, #0284c7)' : '#0f172a' }}>
                      Retail Customer
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Regular shopper, homeowner, walk-in buyer
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setCustomerType('wholesaler')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1.5px solid',
                    borderColor: customerType === 'wholesaler' ? '#d97706' : 'var(--color-border, #cbd5e1)',
                    background: customerType === 'wholesaler' ? '#fffbeb' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="customer_type"
                    checked={customerType === 'wholesaler'}
                    onChange={() => setCustomerType('wholesaler')}
                    style={{ accentColor: '#d97706' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: customerType === 'wholesaler' ? '#b45309' : '#0f172a' }}>
                      Wholesaler / B2B
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Bulk buyer, landscaping firm, corporate client
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* GSTIN with Auto-Fetch */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  GSTIN Number (Optional — Auto-Fetches Company Details)
                </label>
                {gstin.length > 0 && (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {gstin.length}/15 chars
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input tabular"
                  placeholder="e.g. 33AABCT1332L1ZV"
                  value={gstin}
                  onChange={handleGstinChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFetchGstDetails();
                    }
                  }}
                  maxLength={15}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleFetchGstDetails()}
                  disabled={isFetchingGst || gstin.length < 15}
                  title="Auto-fetch registered company name and address from GSTIN"
                  style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0 12px' }}
                >
                  {isFetchingGst ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Fetching...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} color="#0284c7" /> Auto Fetch
                    </>
                  )}
                </button>
              </div>

              {/* GST Verification Feedback Pill */}
              {gstFeedback && (
                <div
                  style={{
                    marginTop: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color:
                      gstFeedback.status === 'success'
                        ? '#15803d'
                        : gstFeedback.status === 'warning'
                        ? '#b45309'
                        : '#dc2626',
                  }}
                >
                  {gstFeedback.status === 'success' ? (
                    <CheckCircle2 size={13} color="#16a34a" />
                  ) : (
                    <AlertCircle size={13} />
                  )}
                  <span>{gstFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Customer / Company Name */}
            <div className="form-group">
              <label className="form-label required">Customer / Company Name</label>
              <div className="input-icon-wrapper">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acme Resorts Pvt Ltd or Vikram Sharma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div className="input-icon-wrapper">
                  <Phone size={16} className="input-icon" />
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-icon-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="contact@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Delivery Challan Credit Limit (₹)</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>0 = No Credit Limit (Unlimited / Auto-approved)</span>
              </label>
              <div className="input-icon-wrapper">
                <IndianRupee size={16} className="input-icon" />
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="form-input tabular"
                  placeholder="e.g. 25000"
                  value={creditLimit}
                  onChange={e => setCreditLimit(e.target.value)}
                />
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>
                If this customer's total unpaid Delivery Challan balance exceeds this amount, any new Delivery Challan will require Manager Approval before dispatch.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Billing / Delivery Address</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Plot/Flat no, Street, Landmark, City, Pincode"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/customers')}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Customer'}
          </button>
        </div>
      </form>
    </div>
  );
};
