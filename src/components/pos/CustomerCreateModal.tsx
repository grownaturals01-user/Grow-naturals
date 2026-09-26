import React, { useState, useRef, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Sparkles, Loader2, CheckCircle2, AlertCircle, Building2, CreditCard } from 'lucide-react';
import { api } from '../../services/api';
import type { Customer } from '../../types';

interface CustomerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
  initialName?: string;
  customerToEdit?: Customer | null;
}

export const CustomerCreateModal: React.FC<CustomerCreateModalProps> = ({
  isOpen,
  onClose,
  onCustomerCreated,
  initialName = '',
  customerToEdit = null,
}) => {
  const [name, setName] = useState(initialName);
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
  const [gstFeedback, setGstFeedback] = useState<{
    status: 'idle' | 'success' | 'warning' | 'error';
    message: string;
    state?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (customerToEdit) {
        setName(customerToEdit.name || '');
        setPhone(customerToEdit.phone || '');
        setEmail(customerToEdit.email || '');
        setAddress(customerToEdit.address || '');
        setGstin(customerToEdit.gstin || '');
        setCustomerType((customerToEdit.customer_type as any) || 'customer');
        setCreditLimit(String(customerToEdit.credit_limit || 0));
      } else {
        setName(initialName);
        setPhone('');
        setEmail('');
        setAddress('');
        setGstin('');
        setCustomerType('customer');
        setCreditLimit('0');
      }
      setError(null);
      setGstFeedback(null);
    }
  }, [isOpen, initialName, customerToEdit]);

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
          setCustomerType('wholesaler');

          setGstFeedback({
            status: 'success',
            message: `Verified: ${fetchedName} (${res.state || 'Registered'})`,
            state: res.state,
          });
        } else {
          setGstFeedback({
            status: 'success',
            message: `Valid GSTIN Format • State: ${res.state || 'India'}`,
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
      let res: any;
      if (customerToEdit) {
        res = await api.put(`/customers/${customerToEdit.id}`, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          gstin: gstin.trim().toUpperCase(),
          customer_type: customerType,
          credit_limit: Number(creditLimit) || 0,
        });
      } else {
        res = await api.post('/customers', {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          gstin: gstin.trim().toUpperCase(),
          customer_type: customerType,
          credit_limit: Number(creditLimit) || 0,
        });
      }

      const savedCustomer: Customer = {
        id: customerToEdit?.id || res.id || res.customer?.id,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        gstin: gstin.trim().toUpperCase(),
        customer_type: customerType,
        credit_limit: Number(creditLimit) || 0,
        total_spent: customerToEdit?.total_spent || 0,
        invoice_count: customerToEdit?.invoice_count || 0,
      };

      onCustomerCreated(savedCustomer);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="dialog-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '95%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' }}
      >
        <div className="dialog-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#0d9488',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>
                {customerToEdit ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                {customerToEdit ? 'Update client details, contact info and credit limit' : 'Save client details to directory'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {error && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #f87171',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '0.8125rem',
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Type Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              CUSTOMER TYPE
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${customerType === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCustomerType('customer')}
                style={{ justifyContent: 'center', height: '38px', borderRadius: '8px', fontWeight: 700 }}
              >
                Retail Client (B2C)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${customerType === 'wholesaler' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCustomerType('wholesaler')}
                style={{ justifyContent: 'center', height: '38px', borderRadius: '8px', fontWeight: 700 }}
              >
                Wholesaler / Trader (B2B)
              </button>
            </div>
          </div>

          {/* Full Name & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                CUSTOMER NAME *
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={15} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. James Anderson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 10px 0 32px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                MOBILE NO
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Phone size={15} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 10px 0 32px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Email & GSTIN */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                EMAIL ADDRESS
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={15} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 10px 0 32px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  GSTIN (OPTIONAL)
                </label>
                {gstin.length === 15 && (
                  <button
                    type="button"
                    onClick={() => handleFetchGstDetails()}
                    disabled={isFetchingGst}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0d9488',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    {isFetchingGst ? <Loader2 size={12} className="spin" /> : <Sparkles size={12} />}
                    Verify GST
                  </button>
                )}
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Building2 size={15} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  maxLength={15}
                  placeholder="22AAAAA0000A1Z5"
                  value={gstin}
                  onChange={handleGstinChange}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 10px 0 32px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                />
              </div>
            </div>
          </div>

          {/* GST Verification Status Badge */}
          {gstFeedback && (
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '6px 10px',
                borderRadius: '6px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: gstFeedback.status === 'success' ? '#dcfce7' : '#fef3c7',
                color: gstFeedback.status === 'success' ? '#15803d' : '#b45309',
                border: `1px solid ${gstFeedback.status === 'success' ? '#86efac' : '#fde68a'}`,
              }}
            >
              {gstFeedback.status === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span>{gstFeedback.message}</span>
            </div>
          )}

          {/* Address & Credit Limit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                ADDRESS / CITY
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <MapPin size={15} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Billing address or area"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 10px 0 32px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                CREDIT LIMIT (₹)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <CreditCard size={15} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 10px 0 32px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
              style={{ borderRadius: '8px', padding: '8px 16px', fontWeight: 700 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{
                borderRadius: '8px',
                padding: '8px 20px',
                fontWeight: 800,
                backgroundColor: '#0d9488',
                borderColor: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {saving ? <Loader2 size={16} className="spin" /> : <User size={16} />}
              <span>{saving ? 'Saving...' : customerToEdit ? 'Save Changes' : 'Save Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
