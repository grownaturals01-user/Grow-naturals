import React, { useState, useEffect, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useInventoryModules } from '../context/InventoryModulesContext';
import { api } from '../services/api';
import type { Category, CategoryType, Product } from '../types';
import { Badge } from '../components/common/Badge';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Layers,
  Tag,
  CheckCircle2,
  Package
} from 'lucide-react';
import { DeleteModuleModal } from '../components/common/DeleteModuleModal';

interface MainCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_builtin: boolean;
  product_count?: number;
}

export const CategoriesManager: React.FC = () => {
  const { businessId, business } = useBusiness();
  const { modules, addModule, updateModule, deleteModule, refreshModules } = useInventoryModules();

  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<MainCategoryItem | null>(null);
  const [catName, setCatName] = useState<string>('');
  const [catSort, setCatSort] = useState<string>('0');
  const [catDesc, setCatDesc] = useState<string>('');

  // Sub Category Modal State
  const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState<boolean>(false);
  const [editingSubCategory, setEditingSubCategory] = useState<Category | null>(null);
  const [subName, setSubName] = useState<string>('');
  const [subMainCategorySlug, setSubMainCategorySlug] = useState<string>('plants');
  const [subSort, setSubSort] = useState<string>('0');
  const [subDesc, setSubDesc] = useState<string>('');

  // Delete Module Modal State
  const [moduleToDelete, setModuleToDelete] = useState<MainCategoryItem | null>(null);
  const [isDeletingModule, setIsDeletingModule] = useState<boolean>(false);

  // Load Subcategories and Products for product count calculation
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        api.get<Category[]>('/categories', { business_id: businessId }),
        api.get<Product[]>('/products', { business_id: businessId }),
      ]);
      setCategories(cats || []);
      setProducts(prods || []);
    } catch (err) {
      console.error('Failed to load categories or products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setIsCategoryModalOpen(false);
    setIsSubCategoryModalOpen(false);
  }, [businessId]);

  // Derive categories strictly from active business inventory modules
  const allMainCategories = useMemo<MainCategoryItem[]>(() => {
    return (modules || []).map((m, idx) => {
      const count = products.filter((p) => p.type === m.slug).length;
      return {
        id: m.id,
        name: m.name,
        slug: m.slug,
        description: m.caption || `Catalog category for ${business?.name || 'this store'}`,
        sort_order: m.sort_order || (idx + 1),
        is_builtin: false,
        product_count: count,
      };
    }).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }, [modules, products, business]);

  // Map of category slug to human-friendly name
  const mainCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    allMainCategories.forEach((c) => {
      map.set(c.slug, c.name);
    });
    return map;
  }, [allMainCategories]);

  // Handler: Open Category Modal for Create
  const handleOpenNewCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatSort(String(allMainCategories.length + 1));
    setCatDesc('');
    setIsCategoryModalOpen(true);
  };

  // Handler: Open Category Modal for Edit
  const handleOpenEditCategory = (item: MainCategoryItem) => {
    setEditingCategory(item);
    setCatName(item.name);
    setCatSort(String(item.sort_order));
    setCatDesc(item.description);
    setIsCategoryModalOpen(true);
  };

  // Handler: Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      if (editingCategory) {
        await updateModule(editingCategory.id, {
          name: catName.trim(),
          caption: catDesc.trim(),
          sort_order: Number(catSort) || 0,
        });
      } else {
        await addModule({
          name: catName.trim(),
          caption: catDesc.trim(),
          sort_order: Number(catSort) || 0,
        });
      }

      setIsCategoryModalOpen(false);
      await refreshModules();
      await fetchData();
    } catch (err: any) {
      alert(`Error saving category: ${err.message || 'Unknown error'}`);
    }
  };

  // Handler: Delete Category
  const handleDeleteCategory = (item: MainCategoryItem) => {
    setModuleToDelete(item);
  };

  const handleConfirmDeleteModule = async () => {
    if (!moduleToDelete) return;
    setIsDeletingModule(true);
    try {
      await deleteModule(moduleToDelete.id);
      await refreshModules();
      await fetchData();
      setModuleToDelete(null);
    } catch (err: any) {
      alert(`Failed to delete category: ${err.message}`);
    } finally {
      setIsDeletingModule(false);
    }
  };

  // Handler: Open Sub Category Modal for Create
  const handleOpenNewSubCategory = (preselectedSlug?: string) => {
    setEditingSubCategory(null);
    setSubName('');
    setSubMainCategorySlug(preselectedSlug || allMainCategories[0]?.slug || 'plants');
    setSubSort(String(categories.length + 1));
    setSubDesc('');
    setIsSubCategoryModalOpen(true);
  };

  // Handler: Open Sub Category Modal for Edit
  const handleOpenEditSubCategory = (subcat: Category) => {
    setEditingSubCategory(subcat);
    setSubName(subcat.name);
    setSubMainCategorySlug(subcat.type);
    setSubSort(String(subcat.sort_order || 0));
    setSubDesc(subcat.description || '');
    setIsSubCategoryModalOpen(true);
  };

  // Handler: Save Sub Category
  const handleSaveSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;

    try {
      if (editingSubCategory) {
        await api.put(`/categories/${editingSubCategory.id}`, {
          name: subName.trim(),
          type: subMainCategorySlug as CategoryType,
          description: subDesc.trim(),
          sort_order: Number(subSort) || 0,
        });
      } else {
        await api.post('/categories', {
          business_id: businessId,
          name: subName.trim(),
          type: subMainCategorySlug as CategoryType,
          description: subDesc.trim(),
          sort_order: Number(subSort) || 0,
        });
      }

      setIsSubCategoryModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(`Error saving subcategory: ${err.message}`);
    }
  };

  // Handler: Delete Sub Category
  const handleDeleteSubCategory = async (id: string, name: string) => {
    if (!window.confirm(`Delete subcategory "${name}"? Products in this subcategory will become unassigned.`)) {
      return;
    }
    try {
      await api.delete(`/categories/${id}`);
      await fetchData();
    } catch (err: any) {
      alert(`Failed to delete subcategory: ${err.message}`);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div className="page-title-group">
          <h1 className="page-title">
            <span>Categories Management</span>
            <Badge variant="inv">{business?.name}</Badge>
          </h1>
          <p className="page-description">
            Organize catalog classifications, main categories, and subcategories for {business?.name}.
          </p>
        </div>

        <div className="page-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeTab === 'categories' ? (
            <button
              type="button"
              className="btn btn-inv"
              onClick={handleOpenNewCategory}
            >
              <Plus size={16} /> New Category
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-inv"
              onClick={() => handleOpenNewSubCategory()}
            >
              <Plus size={16} /> New Sub Category
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--color-bg-surface)',
          padding: '6px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          width: 'fit-content',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`btn ${activeTab === 'categories' ? 'btn-inv' : 'btn-ghost'}`}
          style={{
            padding: '7px 16px',
            fontSize: '0.8125rem',
            borderRadius: 'var(--radius-lg)',
            gap: '8px'
          }}
        >
          <FolderTree size={15} /> Categories
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              background: activeTab === 'categories' ? 'rgba(255, 255, 255, 0.25)' : 'var(--color-bg-surface-subtle)',
              color: activeTab === 'categories' ? '#ffffff' : 'var(--color-text-secondary)',
            }}
          >
            {allMainCategories.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subcategories')}
          className={`btn ${activeTab === 'subcategories' ? 'btn-inv' : 'btn-ghost'}`}
          style={{
            padding: '7px 16px',
            fontSize: '0.8125rem',
            borderRadius: 'var(--radius-lg)',
            gap: '8px'
          }}
        >
          <Layers size={15} /> Sub Categories
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              background: activeTab === 'subcategories' ? 'rgba(255, 255, 255, 0.25)' : 'var(--color-bg-surface-subtle)',
              color: activeTab === 'subcategories' ? '#ffffff' : 'var(--color-text-secondary)',
            }}
          >
            {categories.length}
          </span>
        </button>
      </div>

      {/* TAB 1: MAIN CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
              Loading categories...
            </div>
          ) : allMainCategories.length === 0 ? (
            <div className="empty-state">
              <FolderTree size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '8px' }} />
              <h3>No Categories Found</h3>
              <p>Create your first category to start organizing your products.</p>
              <button type="button" className="btn btn-inv" onClick={handleOpenNewCategory} style={{ marginTop: '12px' }}>
                <Plus size={16} /> New Category
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-surface-subtle)' }}>
                    <th style={{ width: '70px', padding: '12px 18px' }}>ORDER</th>
                    <th style={{ padding: '12px 18px' }}>CATEGORY NAME</th>
                    <th style={{ padding: '12px 18px' }}>DESCRIPTION</th>
                    <th style={{ textAlign: 'center', width: '160px', padding: '12px 18px' }}>TOTAL PRODUCTS</th>
                    <th style={{ textAlign: 'right', width: '230px', padding: '12px 18px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {allMainCategories.map((cat) => (
                    <tr key={cat.id}>
                      <td className="tabular" style={{ fontWeight: 600, padding: '12px 18px' }}>
                        {cat.sort_order}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
                            {cat.name}
                          </span>
                          {cat.is_builtin ? (
                            <span
                              style={{
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'var(--color-bg-surface-subtle)',
                                color: 'var(--color-text-muted)',
                                fontWeight: 700,
                                border: '1px solid var(--color-border)'
                              }}
                            >
                              Core
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'var(--module-inv-subtle)',
                                color: 'var(--module-inv-accent)',
                                fontWeight: 700,
                                border: '1px solid var(--module-inv-border)'
                              }}
                            >
                              Custom
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-xs)', padding: '12px 18px' }}>
                        {cat.description || '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 18px' }} className="tabular">
                        <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{cat.product_count || 0}</span> items
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 18px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Add Sub Category button */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenNewSubCategory(cat.slug)}
                            title={`Add Sub Category under ${cat.name}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                              color: 'var(--module-inv-accent)',
                              borderColor: 'var(--module-inv-border)',
                              background: 'var(--module-inv-subtle)',
                              fontWeight: 600,
                            }}
                          >
                            <Plus size={13} /> Add Sub Category
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEditCategory(cat)}
                            title="Edit Category"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>

                          {/* Delete button (custom only) */}
                          {!cat.is_builtin && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => handleDeleteCategory(cat)}
                              title="Delete Category"
                              style={{ color: 'var(--color-danger)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUB CATEGORIES TAB */}
      {activeTab === 'subcategories' && (
        <div className="card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
              Loading subcategories...
            </div>
          ) : categories.length === 0 ? (
            <div className="empty-state">
              <Layers size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '8px' }} />
              <h3>No Sub Categories Yet</h3>
              <p>Group items into subcategories to make inventory browsing simple and organized.</p>
              <button type="button" className="btn btn-inv" onClick={() => handleOpenNewSubCategory()} style={{ marginTop: '12px' }}>
                <Plus size={16} /> New Sub Category
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-surface-subtle)' }}>
                    <th style={{ width: '70px', padding: '12px 18px' }}>ORDER</th>
                    <th style={{ padding: '12px 18px' }}>SUB CATEGORY NAME</th>
                    <th style={{ padding: '12px 18px' }}>MAIN CATEGORY</th>
                    <th style={{ padding: '12px 18px' }}>DESCRIPTION</th>
                    <th style={{ textAlign: 'center', width: '160px', padding: '12px 18px' }}>TOTAL PRODUCTS</th>
                    <th style={{ textAlign: 'right', width: '150px', padding: '12px 18px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((subcat) => {
                    const parentName = mainCategoryMap.get(subcat.type) || subcat.type;
                    return (
                      <tr key={subcat.id}>
                        <td className="tabular" style={{ fontWeight: 600, padding: '12px 18px' }}>
                          {subcat.sort_order}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--color-text-primary)', padding: '12px 18px' }}>
                          {subcat.name}
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <Badge variant="inv" style={{ textTransform: 'capitalize' }}>
                            {parentName}
                          </Badge>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-xs)', padding: '12px 18px' }}>
                          {subcat.description || '—'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px 18px' }} className="tabular">
                          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{subcat.product_count || 0}</span> items
                        </td>
                        <td style={{ textAlign: 'right', padding: '12px 18px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenEditSubCategory(subcat)}
                              title="Edit Sub Category"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                            >
                              <Edit2 size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => handleDeleteSubCategory(subcat.id, subcat.name)}
                              title="Delete Sub Category"
                              style={{ color: 'var(--color-danger)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCategoryModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '650px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderTree size={20} color="var(--color-primary, #0284c7)" />
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="btn btn-ghost btn-icon"
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label required">Category Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Seeds & Bulbs, Garden Tools, Outdoor Furniture"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Display Sort Order</label>
                    <input
                      type="number"
                      className="form-input tabular"
                      value={catSort}
                      onChange={(e) => setCatSort(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Brief summary of items in this classification"
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '12px 20px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={15} /> {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT SUB CATEGORY MODAL */}
      {isSubCategoryModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSubCategoryModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '650px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} color="var(--color-primary, #0284c7)" />
                {editingSubCategory ? 'Edit Sub Category' : 'Create New Sub Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubCategoryModalOpen(false)}
                className="btn btn-ghost btn-icon"
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSubCategory}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label required">Main Category</label>
                    <select
                      className="form-select"
                      value={subMainCategorySlug}
                      onChange={(e) => setSubMainCategorySlug(e.target.value)}
                      required
                    >
                      {allMainCategories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <span className="form-helper">Subcategory will be linked under this category</span>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Display Sort Order</label>
                    <input
                      type="number"
                      className="form-input tabular"
                      value={subSort}
                      onChange={(e) => setSubSort(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label required">Sub Category Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Indoor Tropicals & Bonsai, Glazed Ceramic"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Brief summary of items in this subcategory"
                    value={subDesc}
                    onChange={(e) => setSubDesc(e.target.value)}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '12px 20px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsSubCategoryModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={15} /> {editingSubCategory ? 'Update Sub Category' : 'Create Sub Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Custom Category / Module Confirmation Popup Modal */}
      <DeleteModuleModal
        isOpen={!!moduleToDelete}
        moduleName={moduleToDelete?.name || ''}
        moduleSlug={moduleToDelete?.slug}
        isDeleting={isDeletingModule}
        onClose={() => setModuleToDelete(null)}
        onConfirm={handleConfirmDeleteModule}
      />
    </div>
  );
};
