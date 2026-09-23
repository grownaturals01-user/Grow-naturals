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

interface MainCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_builtin: boolean;
  product_count?: number;
}

const BUILTIN_CATEGORIES: Omit<MainCategoryItem, 'product_count'>[] = [
  {
    id: 'builtin-plants',
    name: 'Plants',
    slug: 'plants',
    description: 'Exotic potted plants, hardy indoor greenery & bonsai',
    sort_order: 1,
    is_builtin: true,
  },
  {
    id: 'builtin-cactus',
    name: 'Cactus',
    slug: 'cactus',
    description: 'Desert succulents, hardy cactus & grafting specimens',
    sort_order: 2,
    is_builtin: true,
  },
  {
    id: 'builtin-pots',
    name: 'Pots',
    slug: 'pots',
    description: 'Artisan glazed pots, self-watering pots & planters',
    sort_order: 3,
    is_builtin: true,
  },
  {
    id: 'builtin-fertilizers',
    name: 'Fertilizers',
    slug: 'fertilizers',
    description: 'Bio boosters, seaweed tonics, soil mixes & neem sprays',
    sort_order: 4,
    is_builtin: true,
  },
  {
    id: 'builtin-flowers',
    name: 'Flowers',
    slug: 'flowers',
    description: 'Fresh cut lilies, orchids, and luxury arrangements',
    sort_order: 5,
    is_builtin: true,
  },
];

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

  // Combine built-in categories with dynamic inventory modules
  const allMainCategories = useMemo<MainCategoryItem[]>(() => {
    const list: MainCategoryItem[] = BUILTIN_CATEGORIES.map((b) => {
      // Calculate total products matching this category slug/type
      const count = products.filter((p) => p.type === b.slug).length;
      return { ...b, product_count: count };
    });

    // Append custom modules from database
    modules.forEach((m, idx) => {
      const count = products.filter((p) => p.type === m.slug).length;
      list.push({
        id: m.id,
        name: m.name,
        slug: m.slug,
        description: m.caption || 'Custom inventory classification',
        sort_order: m.sort_order || (BUILTIN_CATEGORIES.length + idx + 1),
        is_builtin: false,
        product_count: count,
      });
    });

    return list.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }, [modules, products]);

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
        if (!editingCategory.is_builtin) {
          await updateModule(editingCategory.id, {
            name: catName.trim(),
            caption: catDesc.trim(),
            sort_order: Number(catSort) || 0,
          });
        }
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

  // Handler: Delete Custom Category
  const handleDeleteCategory = async (item: MainCategoryItem) => {
    if (item.is_builtin) {
      alert('Built-in system categories (Plants, Cactus, Pots, Fertilizers, Flowers) cannot be deleted.');
      return;
    }
    if (!window.confirm(`Delete category "${item.name}"? Products in this category will become unassigned.`)) {
      return;
    }
    try {
      await deleteModule(item.id);
      await refreshModules();
      await fetchData();
    } catch (err: any) {
      alert(`Failed to delete category: ${err.message}`);
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
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">
            <span>Categories Management</span>
            <Badge variant="inv">{business?.name}</Badge>
          </h1>
          <p className="page-description">
            Organize catalog classifications, main categories, and subcategories for {business?.name}.
          </p>
        </div>

        <div className="page-actions">
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
          gap: '12px',
          borderBottom: '1px solid var(--color-border, #e2e8f0)',
          paddingBottom: '12px',
          marginBottom: '20px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            border: '1px solid',
            borderColor: activeTab === 'categories' ? 'var(--color-primary, #0284c7)' : 'transparent',
            background: activeTab === 'categories' ? 'var(--color-primary-bg, #f0f9ff)' : '#ffffff',
            color: activeTab === 'categories' ? 'var(--color-primary, #0284c7)' : 'var(--color-text-secondary, #64748b)',
          }}
        >
          <FolderTree size={16} /> Category
          <span
            style={{
              padding: '1px 7px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: activeTab === 'categories' ? 'var(--color-primary, #0284c7)' : '#f1f5f9',
              color: activeTab === 'categories' ? '#ffffff' : '#64748b',
            }}
          >
            {allMainCategories.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subcategories')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            border: '1px solid',
            borderColor: activeTab === 'subcategories' ? 'var(--color-primary, #0284c7)' : 'transparent',
            background: activeTab === 'subcategories' ? 'var(--color-primary-bg, #f0f9ff)' : '#ffffff',
            color: activeTab === 'subcategories' ? 'var(--color-primary, #0284c7)' : 'var(--color-text-secondary, #64748b)',
          }}
        >
          <Layers size={16} /> Sub Category
          <span
            style={{
              padding: '1px 7px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: activeTab === 'subcategories' ? 'var(--color-primary, #0284c7)' : '#f1f5f9',
              color: activeTab === 'subcategories' ? '#ffffff' : '#64748b',
            }}
          >
            {categories.length}
          </span>
        </button>
      </div>

      {/* TAB 1: MAIN CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="card">
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
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '65px' }}>ORDER</th>
                    <th>CATEGORY NAME</th>
                    <th>DESCRIPTION</th>
                    <th style={{ textAlign: 'center', width: '160px' }}>TOTAL PRODUCTS</th>
                    <th style={{ textAlign: 'right', width: '240px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {allMainCategories.map((cat) => (
                    <tr key={cat.id}>
                      <td className="tabular" style={{ fontWeight: 600 }}>
                        {cat.sort_order}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-text-main, #0f172a)', fontSize: '0.925rem' }}>
                            {cat.name}
                          </span>
                          {cat.is_builtin && (
                            <span
                              style={{
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: '#f1f5f9',
                                color: '#64748b',
                                fontWeight: 700,
                              }}
                            >
                              Core
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary, #64748b)', fontSize: 'var(--font-xs)' }}>
                        {cat.description || '—'}
                      </td>
                      <td style={{ textAlign: 'center' }} className="tabular">
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{cat.product_count || 0}</span> items
                      </td>
                      <td style={{ textAlign: 'right' }}>
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
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              color: 'var(--color-primary, #0284c7)',
                              borderColor: '#bae6fd',
                              background: '#f0f9ff',
                              fontWeight: 600,
                            }}
                          >
                            <Plus size={13} /> Add Sub Category
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleOpenEditCategory(cat)}
                            title="Edit Category"
                            style={{ padding: '4px 8px' }}
                          >
                            <Edit2 size={14} /> Edit
                          </button>

                          {/* Delete button (custom only) */}
                          {!cat.is_builtin && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon btn-sm text-error"
                              onClick={() => handleDeleteCategory(cat)}
                              title="Delete Category"
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
        <div className="card">
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
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '65px' }}>ORDER</th>
                    <th>SUB CATEGORY NAME</th>
                    <th>MAIN CATEGORY</th>
                    <th>DESCRIPTION</th>
                    <th style={{ textAlign: 'center', width: '160px' }}>TOTAL PRODUCTS</th>
                    <th style={{ textAlign: 'right', width: '120px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((subcat) => {
                    const parentName = mainCategoryMap.get(subcat.type) || subcat.type;
                    return (
                      <tr key={subcat.id}>
                        <td className="tabular" style={{ fontWeight: 600 }}>
                          {subcat.sort_order}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--color-text-main, #0f172a)' }}>
                          {subcat.name}
                        </td>
                        <td>
                          <Badge variant="inv" style={{ textTransform: 'capitalize' }}>
                            {parentName}
                          </Badge>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary, #64748b)', fontSize: 'var(--font-xs)' }}>
                          {subcat.description || '—'}
                        </td>
                        <td style={{ textAlign: 'center' }} className="tabular">
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{subcat.product_count || 0}</span> items
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleOpenEditSubCategory(subcat)}
                              title="Edit Sub Category"
                              style={{ padding: '4px 8px' }}
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon btn-sm text-error"
                              onClick={() => handleDeleteSubCategory(subcat.id, subcat.name)}
                              title="Delete Sub Category"
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
    </div>
  );
};
