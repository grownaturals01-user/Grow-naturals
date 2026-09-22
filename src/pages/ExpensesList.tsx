import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Tag,
  DollarSign,
  Calendar,
  Briefcase,
  Layers,
  Eye,
  Receipt,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../services/api';
import { Expense, ExpenseCategory, Project } from '../types';
import { useBusiness } from '../context/BusinessContext';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExpenseReceiptModal } from '../components/common/ExpenseReceiptModal';

export const ExpensesList: React.FC = () => {
  const { activeBusiness } = useBusiness();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Receipt Preview Modal
  const [viewingReceiptExpense, setViewingReceiptExpense] = useState<Expense | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expData, catData, projData] = await Promise.all([
        api.get<Expense[]>('/expenses', {
          search: search || undefined,
          category_id: selectedCategory || undefined,
          project_id: selectedProject || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
        api.get<ExpenseCategory[]>('/expenses/categories'),
        api.get<Project[]>('/projects')
      ]);
      setExpenses(expData);
      setCategories(catData);
      setProjects(projData);
    } catch (err: any) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBusiness.id, selectedCategory, selectedProject, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/expenses/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">
            Track operational spending, vendor payments, and project-tagged outlays for {activeBusiness.name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Link to="/expenses/categories" className="btn btn-secondary">
            <Layers size={16} /> Manage Categories
          </Link>
          <Link to="/expenses/new" className="btn btn-primary">
            <Plus size={16} /> Record Expense
          </Link>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div className="card stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-label">Total Filtered Outlay</div>
          <div className="stat-value tabular-nums" style={{ color: 'var(--color-danger)' }}>
            ₹{totalExpenseAmount.toFixed(2)}
          </div>
          <div className="stat-helper">{expenses.length} recorded entries</div>
        </div>
        <div className="card stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="stat-label">Categories Active</div>
          <div className="stat-value tabular-nums text-primary">{categories.length}</div>
          <div className="stat-helper">Configured for {activeBusiness.name}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div className="input-icon-wrapper" style={{ flex: '1 1 200px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Search recipient, ref #, or notes..."
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="form-select"
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              title="Start Date"
            />
            <span className="text-secondary">to</span>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              title="End Date"
            />
          </div>

          <button type="submit" className="btn btn-secondary">
            <Filter size={16} /> Filter
          </button>
          {(search || selectedCategory || selectedProject || startDate || endDate) && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setSelectedProject('');
                setStartDate('');
                setEndDate('');
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Expenses Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }} className="text-secondary">
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState
            title="No Expenses Found"
            description="Record business expenses, utility bills, or project costs to track outlays and profit margins."
            actionLabel="Record First Expense"
            onAction={() => window.location.href = '/expenses/new'}
          />
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Recipient / Payee</th>
                  <th>Receipt / Bill</th>
                  <th>Project Tag</th>
                  <th>Payment Method</th>
                  <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 500 }}>
                        {new Date(exp.date).toLocaleDateString()}
                      </div>
                      {exp.reference_no && (
                        <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>
                          Ref: {exp.reference_no}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge variant="info">
                        {exp.category_name || 'General'}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{exp.recipient || '—'}</div>
                      {exp.notes && (
                        <div className="text-secondary text-truncate" style={{ fontSize: 'var(--font-xs)', maxWidth: '200px' }}>
                          {exp.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      {exp.image_url ? (
                        <button
                          type="button"
                          onClick={() => setViewingReceiptExpense(exp)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                          className="receipt-thumbnail-btn"
                          title="Click to view full receipt / invoice proof"
                        >
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              flexShrink: 0,
                              border: '1px solid #93c5fd',
                              background: '#ffffff',
                            }}
                          >
                            <img
                              src={exp.image_url}
                              alt="Receipt Thumbnail"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Eye size={12} /> View Proof
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Full Preview</span>
                          </div>
                        </button>
                      ) : (
                        <span className="text-secondary" style={{ fontSize: 'var(--font-xs)', color: '#94a3b8' }}>
                          —
                        </span>
                      )}
                    </td>
                    <td>
                      {exp.project_name ? (
                        <span className="badge" style={{ background: 'var(--color-primary-bg, #e0e7ff)', color: 'var(--color-primary, #4338ca)' }}>
                          <Briefcase size={12} style={{ marginRight: '4px' }} />
                          {exp.project_name}
                        </span>
                      ) : (
                        <span className="text-tertiary" style={{ fontSize: 'var(--font-xs)' }}>General Overhead</span>
                      )}
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>{exp.payment_method}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-danger)' }} className="tabular-nums">
                      ₹{Number(exp.amount).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-icon btn-sm text-error"
                        title="Delete Expense"
                        onClick={() => setDeleteTarget(exp)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Expense Record"
        message={`Are you sure you want to delete this expense of ₹${Number(deleteTarget?.amount || 0).toFixed(2)} to "${deleteTarget?.recipient}"? This action cannot be undone.`}
        confirmText="Delete Expense"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Full Receipt Popup Modal */}
      <ExpenseReceiptModal
        expense={viewingReceiptExpense}
        onClose={() => setViewingReceiptExpense(null)}
      />
    </div>
  );
};
