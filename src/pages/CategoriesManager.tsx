import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Category, CategoryType } from '../types';
import { Badge } from '../components/common/Badge';
import { FolderTree, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

export const CategoriesManager: React.FC = () => {
  const { businessId, business } = useBusiness();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Quick form state
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState<string>('');
  const [formType, setFormType] = useState<CategoryType>('plants');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formSort, setFormSort] = useState<string>('0');

  const fetchCategories = () => {
    setIsLoading(true);
    api
      .get('/categories', { business_id: businessId })
      .then(setCategories)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCategories();
    setIsAdding(false);
    setEditingId(null);
  }, [businessId]);

  const handleStartAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormType('plants');
    setFormDesc('');
    setFormSort(String(categories.length + 1));
    setIsAdding(true);
  };

  const handleStartEdit = (cat: Category) => {
    setIsAdding(false);
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormType(cat.type);
    setFormDesc(cat.description || '');
    setFormSort(String(cat.sort_order || 0));
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormName('');
    setFormDesc('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, {
          name: formName.trim(),
          type: formType,
          description: formDesc.trim(),
          sort_order: Number(formSort) || 0,
        });
      } else {
        await api.post('/categories', {
          business_id: businessId,
          name: formName.trim(),
          type: formType,
          description: formDesc.trim(),
          sort_order: Number(formSort) || 0,
        });
      }

      handleCancelForm();
      fetchCategories();
    } catch (err: any) {
      alert(`Error saving category: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category? Products in this category will become unassigned.')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">
            <span>Categories Management</span>
            <Badge variant="inv">{business?.name}</Badge>
          </h1>
          <p className="page-description">
            Organize catalog classifications and category ordering for {business?.name}.
          </p>
        </div>

        <div className="page-actions">
          {!isAdding && !editingId && (
            <button type="button" className="btn btn-inv" onClick={handleStartAdd}>
              <Plus size={16} /> New Category
            </button>
          )}
        </div>
      </div>

      {/* Inline Add / Edit Panel */}
      {(isAdding || editingId) && (
        <form onSubmit={handleSave} className="card" style={{ marginBottom: '24px', border: '2px solid var(--module-inv-accent)' }}>
          <div className="card-header">
            <h3 className="card-title">
              {editingId ? 'Edit Category' : 'Create New Category'}
            </h3>
            <button type="button" onClick={handleCancelForm} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
          <div className="card-body">
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Category Name <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Exotic Succulents, Large Planters"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category Type</label>
                <select
                  className="form-select"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as CategoryType)}
                >
                  <option value="plants">Plants & Trees</option>
                  <option value="pots">Pots & Planters</option>
                  <option value="fertilizers">Fertilizers & Care</option>
                  <option value="flowers">Flowers & Arrangements</option>
                  <option value="general">General Supplies</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Display Sort Order</label>
                <input
                  type="number"
                  className="form-input tabular"
                  value={formSort}
                  onChange={(e) => setFormSort(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Brief summary of items in this classification"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
          </div>
          <div className="card-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleCancelForm}>
              Cancel
            </button>
            <button type="submit" className="btn btn-inv btn-sm">
              <Save size={14} /> {editingId ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      )}

      {/* Categories Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <FolderTree size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '8px' }} />
          <h3>No Categories Yet</h3>
          <p>Add your first classification to organize your inventory.</p>
          <button type="button" className="btn btn-inv" onClick={handleStartAdd} style={{ marginTop: '12px' }}>
            Add Category
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Order</th>
                <th>Category Name</th>
                <th>Type</th>
                <th>Description</th>
                <th style={{ textAlign: 'center' }}>Total Products</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="tabular" style={{ fontWeight: 600 }}>{cat.sort_order}</td>
                  <td style={{ fontWeight: 700 }}>{cat.name}</td>
                  <td>
                    <Badge variant="inv" style={{ textTransform: 'capitalize' }}>
                      {cat.type}
                    </Badge>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-xs)' }}>
                    {cat.description || '—'}
                  </td>
                  <td style={{ textAlign: 'center' }} className="tabular">
                    <span style={{ fontWeight: 600 }}>{cat.product_count || 0}</span> items
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStartEdit(cat)}
                        title="Edit Category"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-subtle btn-sm btn-icon-only"
                        onClick={() => handleDelete(cat.id)}
                        title="Delete Category"
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
  );
};
