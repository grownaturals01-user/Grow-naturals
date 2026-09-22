import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Save, Layers, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import { ExpenseCategory } from '../types';
import { useBusiness } from '../context/BusinessContext';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const ExpenseCategoriesManager: React.FC = () => {
  const navigate = useNavigate();
  const { activeBusiness } = useBusiness();

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit form state
  const [editingCat, setEditingCat] = useState<ExpenseCategory | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await api.get<ExpenseCategory[]>('/expenses/categories');
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to load expense categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [activeBusiness.id]);

  const handleStartAdd = () => {
    setEditingCat(null);
    setName('');
    setDescription('');
    setError(null);
  };

  const handleStartEdit = (cat: ExpenseCategory) => {
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      if (editingCat) {
        await api.put(`/expenses/categories/${editingCat.id}`, {
          name: name.trim(),
          description: description.trim()
        });
      } else {
        await api.post('/expenses/categories', {
          business_id: activeBusiness.id,
          name: name.trim(),
          description: description.trim()
        });
      }
      handleStartAdd();
      await fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/expenses/categories/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/expenses')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Expense Categories</h1>
            <p className="page-subtitle">
              Manage custom expense classification categories for <strong>{activeBusiness.name}</strong>
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--space-4)' }}>
        {/* Left: Form for Add/Edit */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              {editingCat ? `Edit "${editingCat.name}"` : 'New Expense Category'}
            </h2>
          </div>
          <div className="card-body">
            {error && (
              <div style={{ color: 'var(--color-danger)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-3)' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label required">Category Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Nursery Maintenance, Fertilizer Freight"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Optional brief note on what costs belong here..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                {editingCat && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleStartAdd}
                    disabled={saving}
                  >
                    Cancel Edit
                  </button>
                )}
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving...' : editingCat ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Existing Categories Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Layers size={18} /> Active Categories ({categories.length})
            </h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center' }} className="text-secondary">
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center' }} className="text-secondary">
                No expense categories defined yet. Create one using the form on the left!
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th style={{ textAlign: 'right' }}>Total Spent (₹)</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(cat => (
                      <tr key={cat.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{cat.name}</div>
                          {cat.description && (
                            <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>
                              {cat.description}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }} className="tabular-nums font-semibold">
                          ₹{Number(cat.total_spent || 0).toFixed(2)}
                          <div className="text-secondary" style={{ fontSize: 'var(--font-xs)', fontWeight: 400 }}>
                            {cat.expense_count || 0} entries
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 'var(--space-1)' }}>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Edit Category"
                              onClick={() => handleStartEdit(cat)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-icon btn-sm text-error"
                              title="Delete Category"
                              onClick={() => setDeleteTarget(cat)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Expense Category"
        message={`Are you sure you want to delete category "${deleteTarget?.name}"? Any past expenses logged under this category will retain their expense record.`}
        confirmText="Delete Category"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
