import React, { useState } from 'react';
import { api } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

export const SupplierNew: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30 Days');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post('/suppliers', {
        name: name.trim(),
        contact_person: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        gstin: gstin.trim(),
        payment_terms: paymentTerms.trim(),
      });
      navigate('/suppliers');
    } catch (err: any) {
      alert(`Error creating supplier: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title-group">
          <Link
            to="/suppliers"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: '6px' }}
          >
            <ArrowLeft size={16} /> Back to Suppliers
          </Link>
          <h1 className="page-title">
            <span>Register New Supplier Partner</span>
          </h1>
          <p className="page-description">
            Shared across both businesses for purchase orders, bulk plants, and materials.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Company / Nursery Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Kaveri Flora Wholesale, Pottery Craft Works"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Contact Person Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Suresh Kaveri"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input tabular"
                placeholder="+91 98450 11223"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="orders@vendor.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">GSTIN (Optional)</label>
              <input
                type="text"
                className="form-input tabular"
                placeholder="e.g. 29AABCK9900L1Z2"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Terms</label>
            <select
              className="form-select"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            >
              <option value="100% Advance">100% Advance</option>
              <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
              <option value="Net 15 Days">Net 15 Days</option>
              <option value="Net 30 Days">Net 30 Days</option>
              <option value="Net 45 Days">Net 45 Days</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Address / Mandi Location</label>
            <textarea
              className="form-textarea"
              placeholder="Full dispatch yard address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        <div className="card-footer">
          <Link to="/suppliers" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-purch" disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? 'Registering...' : 'Save Supplier'}
          </button>
        </div>
      </form>
    </div>
  );
};
