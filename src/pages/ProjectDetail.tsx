import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { ExpenseReceiptModal } from '../components/common/ExpenseReceiptModal';
import type { Expense } from '../types';
import {
  ArrowLeft,
  IndianRupee,
  Receipt,
  TrendingUp,
  User,
  Phone,
  Mail,
  Calendar,
  Plus,
  Send,
  Building,
  Truck,
  Eye
} from 'lucide-react';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { businessId } = useBusiness();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewingReceiptExpense, setViewingReceiptExpense] = useState<Expense | null>(null);

  // Quick progress update form
  const [updateNotes, setUpdateNotes] = useState<string>('');
  const [statusChange, setStatusChange] = useState<string>('');
  const [isPostingUpdate, setIsPostingUpdate] = useState<boolean>(false);

  const fetchProject = () => {
    setIsLoading(true);
    api
      .get(`/projects/${id}`)
      .then(setProject)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateNotes.trim()) return;

    setIsPostingUpdate(true);
    try {
      await api.post(`/projects/${id}/updates`, {
        supervisor_id: user?.id,
        notes: updateNotes.trim(),
        status_change: statusChange || undefined,
      });

      setUpdateNotes('');
      setStatusChange('');
      fetchProject();
    } catch (err: any) {
      alert(`Error logging update: ${err.message}`);
    } finally {
      setIsPostingUpdate(false);
    }
  };

  if (isLoading || !project) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Loading project...</div>;
  }

  const isProfitable = project.profit >= 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <Link
            to="/projects"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: '6px' }}
          >
            <ArrowLeft size={16} /> Back to Projects
          </Link>
          <h1 className="page-title">
            <span>{project.name}</span>
            <Badge variant={project.status === 'active' ? 'success' : 'neutral'}>
              {project.status}
            </Badge>
          </h1>
          <p className="page-description">
            Client: {project.client_name} {project.company && `| ${project.company}`}
          </p>
        </div>

        <div className="page-actions">
          <Link to={`/delivery-challans/new`} className="btn btn-secondary btn-sm">
            <Truck size={14} /> Dispatch Challan
          </Link>
          <Link to={`/expenses/new`} className="btn btn-secondary btn-sm">
            <Receipt size={14} /> Log Project Expense
          </Link>
        </div>
      </div>

      {/* Financial Overview (Collection Value & Profit) */}
      <div className="stat-grid">
        <StatCard
          label="Collection Value (Billed)"
          value={`₹${Number(project.collection_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subValue={`${project.invoices?.length || 0} invoice(s) issued`}
          icon={IndianRupee}
          variant="stat-sell"
        />

        <StatCard
          label="Project Expenses"
          value={`₹${Number(project.total_expenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subValue={`${project.expenses?.length || 0} expense entry(ies)`}
          icon={Receipt}
          variant="stat-ops"
        />

        <StatCard
          label="Net Project Profit"
          value={`₹${Number(project.profit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subValue={
            project.collection_value > 0
              ? `${project.margin_percent}% profit margin`
              : 'No billing yet'
          }
          icon={TrendingUp}
          variant={isProfitable ? 'stat-inv' : 'stat-ops'}
        />

        <StatCard
          label="Contract Budget"
          value={`₹${Number(project.budget || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subValue={
            project.start_date
              ? `Started ${new Date(project.start_date).toLocaleDateString()}`
              : 'Dates pending'
          }
          icon={Building}
          variant="stat-proj"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Left Column: Invoices & Expenses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Billed Invoices */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <IndianRupee size={18} color="var(--module-sell-accent)" />
                Billed Client Invoices ({project.invoices?.length || 0})
              </h3>
            </div>
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(project.invoices || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                        No invoices billed for this project yet.
                      </td>
                    </tr>
                  ) : (
                    project.invoices!.map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <Link to={`/invoices/${inv.id}`} style={{ fontWeight: 700, color: 'var(--module-sell-accent)' }}>
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td style={{ fontSize: 'var(--font-xs)' }}>
                          {new Date(inv.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <Badge variant={inv.payment_status === 'paid' ? 'success' : 'warning'}>
                            {inv.payment_status}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular">
                          ₹{Number(inv.total_amount).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Project Expenses (Deducted from Collection to get Profit) */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Receipt size={18} color="#e11d48" />
                Project Expenses ({project.expenses?.length || 0})
              </h3>
              <Link to="/expenses/new" className="btn btn-secondary btn-sm">
                <Plus size={14} /> Add Expense
              </Link>
            </div>
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Paid To / Recipient</th>
                    <th>Receipt</th>
                    <th>Payment Mode</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(project.expenses || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                        No expenses tagged to this project yet.
                      </td>
                    </tr>
                  ) : (
                    project.expenses!.map((exp) => (
                      <tr key={exp.id}>
                        <td style={{ fontSize: 'var(--font-xs)' }}>
                          {new Date(exp.date).toLocaleDateString()}
                        </td>
                        <td>
                          <Badge variant="neutral">{exp.category_name || 'General'}</Badge>
                        </td>
                        <td style={{ fontSize: 'var(--font-sm)' }}>
                          {exp.recipient || '—'}
                          {exp.reference_no && <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Ref: {exp.reference_no}</span>}
                        </td>
                        <td>
                          {exp.image_url ? (
                            <button
                              type="button"
                              onClick={() => setViewingReceiptExpense(exp)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                background: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                color: '#0284c7',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              title="View Expense Proof"
                            >
                              <Eye size={12} /> View Proof
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 600 }}>
                            {exp.payment_method}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#e11d48' }} className="tabular">
                          ₹{Number(exp.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Supervisor Info & Progress Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Supervisor Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Site Supervisor</h3>
            </div>
            <div className="card-body">
              {project.supervisor_name ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div className="user-avatar" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                      {project.supervisor_name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--font-md)' }}>{project.supervisor_name}</div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>Field Supervisor</div>
                    </div>
                  </div>

                  {project.supervisor_phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                      <Phone size={14} /> {project.supervisor_phone}
                    </div>
                  )}

                  {project.supervisor_email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                      <Mail size={14} /> {project.supervisor_email}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>
                  No supervisor assigned to this project yet.
                </p>
              )}
            </div>
          </div>

          {/* Progress Notes Log */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Field Progress Log</h3>
            </div>
            <div className="card-body" style={{ maxHeight: '360px', overflowY: 'auto' }}>
              {/* Post Note Form */}
              <form onSubmit={handlePostUpdate} style={{ marginBottom: '18px' }}>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '60px', fontSize: 'var(--font-xs)', marginBottom: '8px' }}
                  placeholder="Add site milestone or supervisor note..."
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <select
                    className="form-select"
                    style={{ width: '130px', padding: '4px 8px', fontSize: '11px' }}
                    value={statusChange}
                    onChange={(e) => setStatusChange(e.target.value)}
                  >
                    <option value="">Keep Status</option>
                    <option value="active">Active</option>
                    <option value="planning">Planning</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                  <button type="submit" className="btn btn-proj btn-sm" disabled={isPostingUpdate}>
                    <Send size={12} /> Post Note
                  </button>
                </div>
              </form>

              {/* Updates List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(project.updates || []).length === 0 ? (
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                    No field progress updates posted yet.
                  </p>
                ) : (
                  project.updates!.map((up) => (
                    <div
                      key={up.id}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: 'var(--color-bg-surface-subtle)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-xs)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--color-text-muted)' }}>
                        <span style={{ fontWeight: 600 }}>{up.supervisor_name || 'Supervisor'}</span>
                        <span>{new Date(up.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <p style={{ color: 'var(--color-text-primary)', margin: 0 }}>{up.notes}</p>
                      {up.status_change && (
                        <div style={{ marginTop: '4px' }}>
                          <Badge variant="info">Changed status to {up.status_change}</Badge>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Full Receipt Popup Modal */}
      <ExpenseReceiptModal
        expense={viewingReceiptExpense}
        onClose={() => setViewingReceiptExpense(null)}
      />
    </div>
  );
};
