import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Save } from 'lucide-react';

export const SupplierEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [name, setName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    api
      .get(`/suppliers/${id}`)
      .then((s) => {
        setName(s.name);
        setContactPerson(s.contact_person || '');
        setPhone(s.phone || '');
        setEmail(s.email || '');
        setAddress(s.address || '');
        setGstin(s.gstin || '');
        setPaymentTerms(s.payment_terms || 'Net 30 Days');
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await api.put(`/suppliers/${id}`, {
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
      alert(`Failed to update supplier: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Loading supplier...</div>;
  }

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
            <span>Edit Supplier Partner</span>
          </h1>
          <p className="page-description">
            Update vendor details, contact person, or payment credit terms.
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input
                type="text"
                className="form-input"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input tabular"
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">GSTIN</label>
              <input
                type="text"
                className="form-input tabular"
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
            <label className="form-label">Address</label>
            <textarea
              className="form-textarea"
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
            <Save size={16} /> {isSubmitting ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
