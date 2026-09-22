import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { api } from '../services/api';

export const CustomerNew: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        gstin: gstin.trim().toUpperCase()
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
              Register a client in the shared directory for POS, quotations, and projects
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">GSTIN (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  value={gstin}
                  onChange={e => setGstin(e.target.value)}
                />
                <span className="form-helper">For B2B tax invoicing</span>
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
