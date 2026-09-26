import React, { useState, useEffect, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useInventoryModules } from '../context/InventoryModulesContext';
import { api } from '../services/api';
import type { Category, CategoryType, Product } from '../types';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Layers,
  Search,
  RotateCw,
  FileSpreadsheet,
  Loader2,
  AlertTriangle,
  Package
} from 'lucide-react';
import { DeleteModuleModal } from '../components/common/DeleteModuleModal';
import { renderModuleIcon } from '../components/common/CategoryIcons';
import { EmptyState } from '../components/common/EmptyState';

interface MainCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_builtin: boolean;
  product_count?: number;
  created_at?: string;
}

export const CategoriesManager: React.FC = () => {
  const { businessId, business } = useBusiness();
  const { modules, addModule, updateModule, deleteModule, refreshModules } = useInventoryModules();

  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filter state
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active'>('all');
  const [parentCatFilter, setParentCatFilter] = useState<string>('all');

  // Checkbox selection state
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState<Set<string>>(new Set());

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

  // Single Subcategory Delete state
  const [subCatToDelete, setSubCatToDelete] = useState<Category | null>(null);
  const [isDeletingSubCat, setIsDeletingSubCat] = useState<boolean>(false);

  // Load Subcategories and Products
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
    return (modules || [])
      .map((m, idx) => {
        const count = products.filter((p) => p.type === m.slug).length;
        return {
          id: m.id,
          name: m.name,
          slug: m.slug,
          description: m.caption || `Catalog category for ${business?.name || 'this store'}`,
          sort_order: m.sort_order || idx + 1,
          is_builtin: false,
          product_count: count,
          created_at: m.created_at,
        };
      })
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }, [modules, products, business]);

  // Map of category slug to human-friendly name
  const mainCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    allMainCategories.forEach((c) => {
      map.set(c.slug, c.name);
    });
    return map;
  }, [allMainCategories]);

  // Filtered Main Categories
  const filteredMainCategories = useMemo(() => {
    return allMainCategories.filter((cat) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q) ||
        cat.description?.toLowerCase().includes(q)
      );
    });
  }, [allMainCategories, search]);

  // Filtered Subcategories
  const filteredSubCategories = useMemo(() => {
    return categories.filter((sub) => {
      if (parentCatFilter !== 'all' && sub.type !== parentCatFilter) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      const parentName = mainCategoryMap.get(sub.type) || sub.type;
      return (
        sub.name.toLowerCase().includes(q) ||
        parentName.toLowerCase().includes(q) ||
        sub.description?.toLowerCase().includes(q)
      );
    });
  }, [categories, search, parentCatFilter, mainCategoryMap]);

  // Date formatter
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '24 Dec 2024';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '24 Dec 2024';
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '24 Dec 2024';
    }
  };

  // Checkbox Selection for Categories
  const allCatsSelected =
    filteredMainCategories.length > 0 && selectedCategoryIds.size === filteredMainCategories.length;

  const handleSelectAllCats = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCategoryIds(new Set(filteredMainCategories.map((c) => c.id)));
    } else {
      setSelectedCategoryIds(new Set());
    }
  };

  const handleToggleCatRow = (id: string) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Checkbox Selection for Subcategories
  const allSubCatsSelected =
    filteredSubCategories.length > 0 && selectedSubCategoryIds.size === filteredSubCategories.length;

  const handleSelectAllSubCats = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSubCategoryIds(new Set(filteredSubCategories.map((c) => c.id)));
    } else {
      setSelectedSubCategoryIds(new Set());
    }
  };

  const handleToggleSubCatRow = (id: string) => {
    setSelectedSubCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === 'categories') {
      if (filteredMainCategories.length === 0) return;
      const headers = ['Category', 'Category Slug', 'Created On', 'Status'];
      const rows = filteredMainCategories.map((c) => [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.slug}"`,
        `"${formatDate(c.created_at)}"`,
        '"Active"',
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `Categories_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (filteredSubCategories.length === 0) return;
      const headers = ['Sub Category', 'Category', 'Category Code', 'Description', 'Status'];
      const rows = filteredSubCategories.map((s, idx) => [
        `"${s.name.replace(/"/g, '""')}"`,
        `"${(mainCategoryMap.get(s.type) || s.type).replace(/"/g, '""')}"`,
        `"CT${String(idx + 1).padStart(3, '0')}"`,
        `"${(s.description || '—').replace(/"/g, '""')}"`,
        '"Active"',
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `SubCategories_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handlers for Category Modal
  const handleOpenNewCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatSort(String(allMainCategories.length + 1));
    setCatDesc('');
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (item: MainCategoryItem) => {
    setEditingCategory(item);
    setCatName(item.name);
    setCatSort(String(item.sort_order));
    setCatDesc(item.description);
    setIsCategoryModalOpen(true);
  };

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

  // Handlers for Sub Category Modal
  const handleOpenNewSubCategory = (preselectedSlug?: string) => {
    setEditingSubCategory(null);
    setSubName('');
    setSubMainCategorySlug(preselectedSlug || allMainCategories[0]?.slug || 'plants');
    setSubSort(String(categories.length + 1));
    setSubDesc('');
    setIsSubCategoryModalOpen(true);
  };

  const handleOpenEditSubCategory = (subcat: Category) => {
    setEditingSubCategory(subcat);
    setSubName(subcat.name);
    setSubMainCategorySlug(subcat.type);
    setSubSort(String(subcat.sort_order || 0));
    setSubDesc(subcat.description || '');
    setIsSubCategoryModalOpen(true);
  };

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

  const handleConfirmDeleteSubCategory = async () => {
    if (!subCatToDelete) return;
    setIsDeletingSubCat(true);
    try {
      await api.delete(`/categories/${subCatToDelete.id}`);
      await fetchData();
      setSubCatToDelete(null);
    } catch (err: any) {
      alert(`Failed to delete subcategory: ${err.message}`);
    } finally {
      setIsDeletingSubCat(false);
    }
  };

  return (
    <div className="prod-page-container">
      {/* Tab Switcher: Category vs Sub Category */}
      <div className="cat-tab-switcher">
        <button
          type="button"
          className={`cat-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('categories');
            setSearch('');
            setSelectedCategoryIds(new Set());
          }}
        >
          <FolderTree size={15} />
          <span>Category</span>
          <span className="cat-tab-badge">{allMainCategories.length}</span>
        </button>

        <button
          type="button"
          className={`cat-tab-btn ${activeTab === 'subcategories' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('subcategories');
            setSearch('');
            setSelectedSubCategoryIds(new Set());
          }}
        >
          <Layers size={15} />
          <span>Sub Category</span>
          <span className="cat-tab-badge">{categories.length}</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: CATEGORY (Matches Reference Image 1)
          ========================================================================= */}
      {activeTab === 'categories' && (
        <>
          {/* Header Banner */}
          <div className="prod-page-header">
            <div className="prod-page-title-group">
              <h1>Category</h1>
              <p>Manage your categories</p>
            </div>

            <div className="prod-header-actions">
              <button
                type="button"
                className="prod-icon-btn"
                title="Export to Excel (CSV)"
                onClick={handleExportCSV}
              >
                <FileSpreadsheet size={16} color="#16a34a" />
              </button>
              <button
                type="button"
                className="prod-icon-btn"
                title="Refresh Categories"
                onClick={fetchData}
              >
                <RotateCw size={15} />
              </button>
              <button
                type="button"
                className="prod-add-btn"
                onClick={handleOpenNewCategory}
              >
                <Plus size={16} /> Add Category
              </button>
            </div>
          </div>

          {/* Main Card */}
          <div className="prod-table-card">
            {/* Toolbar */}
            <div className="prod-table-toolbar">
              <div className="prod-search-box">
                <Search size={15} className="prod-search-icon" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="prod-search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="prod-toolbar-filters">
                <select
                  className="prod-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">Status: All</option>
                  <option value="active">Status: Active</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            {isLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
                <div>Loading categories...</div>
              </div>
            ) : filteredMainCategories.length === 0 ? (
              <div style={{ padding: '30px' }}>
                <EmptyState
                  icon={FolderTree}
                  title="No Categories Found"
                  description="No categories matched your search. Click Add Category to create your first item group."
                  actionLabel="Add Category"
                  onAction={handleOpenNewCategory}
                />
              </div>
            ) : (
              <div className="prod-table-responsive">
                <table className="prod-spacious-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="cust-checkbox"
                          checked={allCatsSelected}
                          onChange={handleSelectAllCats}
                          style={{ margin: '0 auto' }}
                        />
                      </th>
                      <th style={{ minWidth: '220px' }}>Category</th>
                      <th style={{ minWidth: '180px' }}>Category slug</th>
                      <th style={{ minWidth: '160px' }}>Created On</th>
                      <th style={{ width: '120px' }}>Status</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMainCategories.map((cat) => {
                      const isChecked = selectedCategoryIds.has(cat.id);
                      return (
                        <tr
                          key={cat.id}
                          style={{
                            backgroundColor: isChecked ? 'rgba(255, 159, 67, 0.05)' : undefined,
                          }}
                        >
                          {/* Checkbox */}
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              className="cust-checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCatRow(cat.id)}
                              style={{ margin: '0 auto' }}
                            />
                          </td>

                          {/* Category Name */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                                {cat.name}
                              </span>
                            </div>
                          </td>

                          {/* Category slug */}
                          <td>
                            <span className="cust-code-text">{cat.slug}</span>
                          </td>

                          {/* Created On */}
                          <td>
                            <span className="cust-country-text">{formatDate(cat.created_at)}</span>
                          </td>

                          {/* Status */}
                          <td>
                            <span className="cat-status-pill">Active</span>
                          </td>

                          {/* Actions: Edit & Delete */}
                          <td>
                            <div className="cust-actions-group">
                              {/* Edit */}
                              <button
                                type="button"
                                className="cust-action-btn edit"
                                title="Edit Category"
                                onClick={() => handleOpenEditCategory(cat)}
                              >
                                <Edit2 size={14} />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                className="cust-action-btn delete"
                                title="Delete Category"
                                onClick={() => setModuleToDelete(cat)}
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

            {/* Footer info */}
            {!isLoading && filteredMainCategories.length > 0 && (
              <div className="cust-table-footer">
                <span>
                  Showing {filteredMainCategories.length} of {allMainCategories.length} categories
                </span>
                <span style={{ fontWeight: 600 }}>Active category classifications</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 2: SUB CATEGORY (Matches Reference Image 2)
          ========================================================================= */}
      {activeTab === 'subcategories' && (
        <>
          {/* Header Banner */}
          <div className="prod-page-header">
            <div className="prod-page-title-group">
              <h1>Sub Category</h1>
              <p>Manage your sub categories</p>
            </div>

            <div className="prod-header-actions">
              <button
                type="button"
                className="prod-icon-btn"
                title="Export to Excel (CSV)"
                onClick={handleExportCSV}
              >
                <FileSpreadsheet size={16} color="#16a34a" />
              </button>
              <button
                type="button"
                className="prod-icon-btn"
                title="Refresh Sub Categories"
                onClick={fetchData}
              >
                <RotateCw size={15} />
              </button>
              <button
                type="button"
                className="prod-add-btn"
                onClick={() => handleOpenNewSubCategory()}
              >
                <Plus size={16} /> Add Sub Category
              </button>
            </div>
          </div>

          {/* Main Card */}
          <div className="prod-table-card">
            {/* Toolbar */}
            <div className="prod-table-toolbar">
              <div className="prod-search-box">
                <Search size={15} className="prod-search-icon" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="prod-search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="prod-toolbar-filters">
                {/* Category Dropdown */}
                <select
                  className="prod-filter-select"
                  value={parentCatFilter}
                  onChange={(e) => setParentCatFilter(e.target.value)}
                >
                  <option value="all">Category: All</option>
                  {allMainCategories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Status Dropdown */}
                <select
                  className="prod-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">Status: All</option>
                  <option value="active">Status: Active</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            {isLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
                <div>Loading sub categories...</div>
              </div>
            ) : filteredSubCategories.length === 0 ? (
              <div style={{ padding: '30px' }}>
                <EmptyState
                  icon={Layers}
                  title="No Sub Categories Found"
                  description="No subcategories matched your filter. Click Add Sub Category to organize items under a parent category."
                  actionLabel="Add Sub Category"
                  onAction={() => handleOpenNewSubCategory()}
                />
              </div>
            ) : (
              <div className="prod-table-responsive">
                <table className="prod-spacious-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="cust-checkbox"
                          checked={allSubCatsSelected}
                          onChange={handleSelectAllSubCats}
                          style={{ margin: '0 auto' }}
                        />
                      </th>
                      <th style={{ width: '70px' }}>Image</th>
                      <th style={{ minWidth: '180px' }}>Sub Category</th>
                      <th style={{ minWidth: '160px' }}>Category</th>
                      <th style={{ minWidth: '120px' }}>Category Code</th>
                      <th style={{ minWidth: '220px' }}>Description</th>
                      <th style={{ width: '100px' }}>Status</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubCategories.map((subcat, idx) => {
                      const isChecked = selectedSubCategoryIds.has(subcat.id);
                      const parentName = mainCategoryMap.get(subcat.type) || subcat.type;
                      const code = `CT${String(idx + 1).padStart(3, '0')}`;

                      return (
                        <tr
                          key={subcat.id}
                          style={{
                            backgroundColor: isChecked ? 'rgba(255, 159, 67, 0.05)' : undefined,
                          }}
                        >
                          {/* Checkbox */}
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              className="cust-checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSubCatRow(subcat.id)}
                              style={{ margin: '0 auto' }}
                            />
                          </td>

                          {/* Image Box */}
                          <td>
                            <div className="prod-thumb-box" style={{ width: '34px', height: '34px' }}>
                              {renderModuleIcon(subcat.type, 18)}
                            </div>
                          </td>

                          {/* Sub Category Name */}
                          <td>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                              {subcat.name}
                            </span>
                          </td>

                          {/* Parent Category */}
                          <td>
                            <span className="cust-company-text">{parentName}</span>
                          </td>

                          {/* Category Code */}
                          <td>
                            <span className="cust-code-text">{code}</span>
                          </td>

                          {/* Description */}
                          <td>
                            <span className="cust-email-text">{subcat.description || '—'}</span>
                          </td>

                          {/* Status */}
                          <td>
                            <span className="cat-status-pill">Active</span>
                          </td>

                          {/* Actions: Edit & Delete */}
                          <td>
                            <div className="cust-actions-group">
                              {/* Edit */}
                              <button
                                type="button"
                                className="cust-action-btn edit"
                                title="Edit Sub Category"
                                onClick={() => handleOpenEditSubCategory(subcat)}
                              >
                                <Edit2 size={14} />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                className="cust-action-btn delete"
                                title="Delete Sub Category"
                                onClick={() => setSubCatToDelete(subcat)}
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

            {/* Footer info */}
            {!isLoading && filteredSubCategories.length > 0 && (
              <div className="cust-table-footer">
                <span>
                  Showing {filteredSubCategories.length} of {categories.length} sub categories
                </span>
                <span style={{ fontWeight: 600 }}>Categorization active</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* =========================================================================
          MODALS: CREATE & EDIT CATEGORY
          ========================================================================= */}
      {isCategoryModalOpen && (
        <div
          className="dialog-overlay"
          onClick={() => setIsCategoryModalOpen(false)}
          style={{ zIndex: 1100 }}
        >
          <div
            className="dialog-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', borderRadius: '6px', overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label required">Category Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Plants & Trees, Pots & Planters"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Display Order</label>
                  <input
                    type="number"
                    className="form-input"
                    value={catSort}
                    onChange={(e) => setCatSort(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Brief description of items in this category"
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '14px 20px',
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
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#ff9f43',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: CREATE & EDIT SUB CATEGORY
          ========================================================================= */}
      {isSubCategoryModalOpen && (
        <div
          className="dialog-overlay"
          onClick={() => setIsSubCategoryModalOpen(false)}
          style={{ zIndex: 1100 }}
        >
          <div
            className="dialog-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', borderRadius: '6px', overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                {editingSubCategory ? 'Edit Sub Category' : 'Add Sub Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubCategoryModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSubCategory}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label required">Parent Category</label>
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
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label required">Sub Category Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Indoor Plants, Ceramic Pots, Bonsai"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Display Order</label>
                  <input
                    type="number"
                    className="form-input"
                    value={subSort}
                    onChange={(e) => setSubSort(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Brief description of items in this subcategory"
                    value={subDesc}
                    onChange={(e) => setSubDesc(e.target.value)}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '14px 20px',
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
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#ff9f43',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {editingSubCategory ? 'Update Sub Category' : 'Save Sub Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Main Category Confirmation Modal */}
      <DeleteModuleModal
        isOpen={!!moduleToDelete}
        moduleName={moduleToDelete?.name || ''}
        moduleSlug={moduleToDelete?.slug}
        isDeleting={isDeletingModule}
        onClose={() => setModuleToDelete(null)}
        onConfirm={handleConfirmDeleteModule}
      />

      {/* Delete Sub Category Confirmation Modal */}
      {subCatToDelete && (
        <div
          className="dialog-overlay"
          onClick={() => setSubCatToDelete(null)}
          style={{ zIndex: 1200 }}
        >
          <div
            className="dialog-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px', borderRadius: '6px', padding: '24px', textAlign: 'center' }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>
              Delete Sub Category?
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.8125rem', color: '#64748b' }}>
              Are you sure you want to remove <strong>{subCatToDelete.name}</strong>?
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSubCatToDelete(null)}
                disabled={isDeletingSubCat}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSubCategory}
                disabled={isDeletingSubCat}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isDeletingSubCat ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                <span>{isDeletingSubCat ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
