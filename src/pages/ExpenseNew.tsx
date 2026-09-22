import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, DollarSign, Calendar, Tag, Briefcase, FileText } from 'lucide-react';
import { api } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { ExpenseCategory, Project } from '../types';
import { ReceiptImageUploader } from '../components/common/ReceiptImageUploader';

export const ExpenseNew: React.FC = () => {
  const navigate = useNavigate();
  const { activeBusiness } = useBusiness();

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [amount, setAmount] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recipient, setRecipient] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        setLoading(true);
        const [cats, projs] = await Promise.all([
          api.get<ExpenseCategory[]>('/expenses/categories'),
          api.get<Project[]>('/projects')
        ]);
        setCategories(cats);
        setProjects(projs);
        if (cats.length > 0) {
          setCategoryId(cats[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load categories/projects:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPrerequisites();
  }, [activeBusiness.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.post('/expenses', {
        business_id: activeBusiness.id,
        category_id: categoryId || null,
        project_id: projectId || null,
        amount: Number(amount),
        payment_method: paymentMethod,
        date,
        recipient,
        reference_no: referenceNo,
        notes,
        image_url: imageUrl
      });

      navigate('/expenses');
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/expenses')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Record Expense</h1>
            <p className="page-subtitle">
              Log operational expenditure or project cost for <strong>{activeBusiness.name}</strong>
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
            <h2 className="card-title">Expense Details</h2>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label required">Amount (₹)</label>
                <div className="input-icon-wrapper">
                  <DollarSign size={16} className="input-icon" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input tabular-nums"
                    style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">Date of Expense</label>
                <div className="input-icon-wrapper">
                  <Calendar size={16} className="input-icon" />
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label required">Expense Category</label>
                <select
                  className="form-select"
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                >
                  <option value="">General Overhead</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <span className="form-helper">
                  Manage categories in{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/expenses/categories')}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                  >
                    Categories Manager
                  </button>
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Project Tag (Optional)</label>
                <select
                  className="form-select"
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                >
                  <option value="">None (General Store Overhead)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.client_name}</option>
                  ))}
                </select>
                <span className="form-helper">Tagging a project directly deducts this amount from project profit</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Payee / Recipient</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Electric Company, Local Nursery, Driver"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="card">Card / POS Machine</option>
                  <option value="bank_transfer">Bank Transfer / NEFT</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reference / Bill #</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. VOUCHER-902, TXN-81726"
                  value={referenceNo}
                  onChange={e => setReferenceNo(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes & Description</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Provide details about the purpose of this expense, vendor breakdown, or receipt details..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {/* Receipt Image Uploader */}
            <ReceiptImageUploader
              value={imageUrl}
              onChange={setImageUrl}
              label="Receipt / Voucher Photo (Optional)"
              helperText="Upload an invoice, receipt scan, or UPI payment screenshot. You will be able to click and view this full-size anytime in the expenses list."
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/expenses')}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};
