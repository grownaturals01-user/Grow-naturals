import React, { useState, useEffect, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { useInventoryModules } from '../context/InventoryModulesContext';
import { api } from '../services/api';
import type { Product } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  AlertTriangle,
  Eye,
  Edit2,
  Trash2,
  Search,
  RotateCw,
  FileSpreadsheet,
  FileText,
  UploadCloud,
  Loader2,
  X
} from 'lucide-react';

export const ProductsList: React.FC = () => {
  const { businessId, business } = useBusiness();
  const { user } = useAuth();
  const { modules } = useInventoryModules();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  // Fetch products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params: any = { business_id: businessId };
      const data = await api.get<Product[]>('/products', params);
      setProducts(data || []);
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [businessId]);

  // Unique brands/suppliers list for dropdown filter
  const brandOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const brand = p.attributes?.brand || p.supplier_name;
      if (brand && brand.trim()) set.add(brand.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const catSlug = p.type || p.category_name?.toLowerCase();
        if (catSlug !== selectedCategory) return false;
      }

      // Brand filter
      if (selectedBrand !== 'all') {
        const brand = p.attributes?.brand || p.supplier_name;
        if (brand !== selectedBrand) return false;
      }

      // Search filter
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      const nameMatch = p.name?.toLowerCase().includes(q);
      const skuMatch = p.sku?.toLowerCase().includes(q);
      const barcodeMatch = p.barcode?.toLowerCase().includes(q);
      const catMatch = p.category_name?.toLowerCase().includes(q) || p.type?.toLowerCase().includes(q);
      const supplierMatch = p.supplier_name?.toLowerCase().includes(q);

      return nameMatch || skuMatch || barcodeMatch || catMatch || supplierMatch;
    });
  }, [products, search, selectedCategory, selectedBrand]);

  // Avatar palette generator for creator avatar
  const getAvatarStyle = (name: string) => {
    const palettes = [
      { bg: '#e0e7ff', color: '#4338ca' },
      { bg: '#ffe4e6', color: '#e11d48' },
      { bg: '#d1fae5', color: '#059669' },
      { bg: '#fef3c7', color: '#d97706' },
      { bg: '#e0f2fe', color: '#0284c7' },
      { bg: '#ede9fe', color: '#7c3aed' },
      { bg: '#fee2e2', color: '#dc2626' },
      { bg: '#ffedd5', color: '#ea580c' },
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % palettes.length;
    return palettes[index];
  };

  const getInitials = (name: string) => {
    const parts = (name || '').trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name || '').slice(0, 2).toUpperCase() || 'AD';
  };

  // Checkbox handling
  const allSelected = filteredProducts.length > 0 && selectedIds.size === filteredProducts.length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Delete Single Product
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.delete(`/products/${deleteTarget.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Delete Selected
  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      setIsBulkDeleting(true);
      for (const id of Array.from(selectedIds)) {
        try {
          await api.delete(`/products/${id}`);
        } catch (e) {
          console.error(`Error deleting product ${id}:`, e);
        }
      }
      setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
    } catch (err: any) {
      alert(err.message || 'Failed to delete selected products');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Export to CSV / Excel
  const handleExportCSV = () => {
    if (filteredProducts.length === 0) return;
    const headers = ['SKU', 'Product Name', 'Category', 'Brand', 'Price', 'Unit', 'Stock Qty'];
    const rows = filteredProducts.map((p, idx) => {
      const sku = p.sku || `PT${String(idx + 1).padStart(3, '0')}`;
      const category = p.category_name || p.type || 'General';
      const brand = p.attributes?.brand || p.supplier_name || business?.name || 'Grow Naturals';
      const price = Number(p.sale_price || 0).toFixed(2);
      const unit = p.attributes?.unit || 'Pc';
      const qty = p.stock_quantity ?? 0;
      return [
        `"${sku}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${category}"`,
        `"${brand}"`,
        `"${price}"`,
        `"${unit}"`,
        `"${qty}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Product_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF Trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="prod-page-container">
      {/* 1. Header Banner */}
      <div className="prod-page-header">
        <div className="prod-page-title-group">
          <h1>Product List</h1>
          <p>Manage your products</p>
        </div>

        <div className="prod-header-actions">
          {/* Quick Action Icons (PDF, XLS, Refresh, Clear) */}
          <button
            type="button"
            className="prod-icon-btn"
            title="Print / Save PDF"
            onClick={handlePrint}
          >
            <FileText size={16} color="#ef4444" />
          </button>
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
            title="Refresh Product List"
            onClick={fetchProducts}
          >
            <RotateCw size={15} />
          </button>

          {/* Add Product Button */}
          <Link to="/products/new" className="prod-add-btn">
            <Plus size={16} /> Add Product
          </Link>

          {/* Import Product Button */}
          <Link to="/inventory/new" className="prod-import-btn">
            <UploadCloud size={16} /> Import Product
          </Link>
        </div>
      </div>

      {/* Bulk action banner if items selected */}
      {selectedIds.size > 0 && (
        <div className="cust-bulk-bar">
          <span>{selectedIds.size} product{selectedIds.size > 1 ? 's' : ''} selected</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Deselect All
            </button>
            <button
              type="button"
              onClick={confirmBulkDelete}
              disabled={isBulkDeleting}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 12px',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {isBulkDeleting ? <Loader2 size={12} className="spin" /> : <Trash2 size={12} />}
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Organized Table Card */}
      <div className="prod-table-card">
        {/* Toolbar: Search & Dropdowns */}
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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Category: All</option>
              {modules && modules.length > 0 ? (
                modules.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="plants">Plants & Trees</option>
                  <option value="pots">Pots & Planters</option>
                  <option value="cactus">Cactus & Succulents</option>
                  <option value="fertilizers">Fertilizers & Care</option>
                  <option value="flowers">Flowers & Decor</option>
                </>
              )}
            </select>

            {/* Brand / Supplier Dropdown */}
            <select
              className="prod-filter-select"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="all">Brand: All</option>
              {brandOptions.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
            <div>Loading product catalog...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '30px' }}>
            <EmptyState
              icon={Package}
              title="No Products Found"
              description="No catalog items matched your current search or category filter. Click Add Product to register new inventory."
              actionLabel="Add Product"
              onAction={() => navigate('/products/new')}
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
                      checked={allSelected}
                      onChange={handleSelectAll}
                      style={{ margin: '0 auto' }}
                    />
                  </th>
                  <th style={{ width: '90px' }}>SKU</th>
                  <th style={{ minWidth: '220px' }}>Product Name</th>
                  <th style={{ minWidth: '140px' }}>Category</th>
                  <th style={{ minWidth: '130px' }}>Brand</th>
                  <th style={{ minWidth: '100px' }}>Price</th>
                  <th style={{ minWidth: '80px' }}>Unit</th>
                  <th style={{ minWidth: '80px' }}>Qty</th>
                  <th style={{ minWidth: '150px' }}>Created By</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p, idx) => {
                  const isChecked = selectedIds.has(p.id);
                  const sku = p.sku || `PT${String(idx + 1).padStart(3, '0')}`;
                  const category = p.category_name || (p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : 'General');
                  const brand = p.attributes?.brand || p.supplier_name || business?.name || 'Grow Naturals';
                  const price = Number(p.sale_price || 0);
                  const unit = p.attributes?.unit || 'Pc';
                  const qty = Number(p.stock_quantity ?? 0);
                  const isLow = qty <= (p.low_stock_threshold || 5);
                  const isOut = qty <= 0;

                  // Creator info
                  const creatorName = user?.name || 'Admin';
                  const creatorTheme = getAvatarStyle(creatorName);

                  return (
                    <tr
                      key={p.id}
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
                          onChange={() => handleToggleRow(p.id)}
                          style={{ margin: '0 auto' }}
                        />
                      </td>

                      {/* SKU */}
                      <td>
                        <span className="cust-code-text">{sku}</span>
                      </td>

                      {/* Product Name + Image */}
                      <td>
                        <div className="prod-name-cell">
                          <div className="prod-thumb-box">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Package size={16} color="#94a3b8" />
                            )}
                          </div>
                          <Link to={`/products/${p.id}`} className="prod-name-text">
                            {p.name}
                          </Link>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="cust-company-text">{category}</span>
                      </td>

                      {/* Brand */}
                      <td>
                        <span className="cust-country-text">{brand}</span>
                      </td>

                      {/* Price */}
                      <td>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>
                          ₹{price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Unit */}
                      <td>
                        <span className="cust-email-text">{unit}</span>
                      </td>

                      {/* Qty */}
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isOut ? '#ef4444' : isLow ? '#d97706' : '#0f172a',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {qty}
                        </span>
                      </td>

                      {/* Created By */}
                      <td>
                        <div className="prod-creator-cell">
                          <div
                            className="prod-creator-avatar"
                            style={{
                              backgroundColor: creatorTheme.bg,
                              color: creatorTheme.color,
                            }}
                          >
                            {getInitials(creatorName)}
                          </div>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                            {creatorName}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="cust-actions-group">
                          {/* View */}
                          <Link
                            to={`/products/${p.id}`}
                            className="cust-action-btn view"
                            title="View Product Details"
                          >
                            <Eye size={14} />
                          </Link>

                          {/* Edit */}
                          <Link
                            to={`/products/${p.id}/edit`}
                            className="cust-action-btn edit"
                            title="Edit Product"
                          >
                            <Edit2 size={14} />
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            className="cust-action-btn delete"
                            title="Delete Product"
                            onClick={() => setDeleteTarget(p)}
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

        {/* Footer info & summary */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="cust-table-footer">
            <span>
              Showing {filteredProducts.length} of {products.length} products
            </span>
            <span style={{ fontWeight: 600 }}>
              Inventory catalog synchronized
            </span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="dialog-overlay" onClick={() => setDeleteTarget(null)} style={{ zIndex: 1200 }}>
          <div
            className="dialog-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', borderRadius: '12px', padding: '24px', textAlign: 'center' }}
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
              Delete Product?
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.8125rem', color: '#64748b' }}>
              Are you sure you want to remove <strong>{deleteTarget.name}</strong> (SKU: {deleteTarget.sku}) from your product catalog?
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                style={{ borderRadius: '8px', padding: '8px 18px', fontWeight: 700 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isDeleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
