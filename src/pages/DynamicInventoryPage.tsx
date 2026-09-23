import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import { useInventoryModules } from '../context/InventoryModulesContext';
import { api } from '../services/api';
import type { Product } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Plus, ArrowRight, Package, Trash2 } from 'lucide-react';
import { renderModuleIcon } from '../components/common/CategoryIcons';
import { DeleteModuleModal } from '../components/common/DeleteModuleModal';

export const DynamicInventoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { businessId, business } = useBusiness();
  const { getModuleBySlug, deleteModule } = useInventoryModules();
  const navigate = useNavigate();

  const moduleInfo = slug ? getModuleBySlug(slug) : undefined;
  const moduleName = moduleInfo?.name || (slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Custom');
  const moduleIcon = moduleInfo?.icon || '📦';
  const moduleCaption = moduleInfo?.caption || `Inventory records and stock tracking for ${moduleName}.`;

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    setIsLoading(true);

    api
      .get('/products', { business_id: businessId, type: slug, search: search.trim() })
      .then((data) => {
        if (isMounted) setProducts(data);
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [businessId, slug, search]);

  const handleConfirmDelete = async () => {
    if (!moduleInfo) return;
    setIsDeleting(true);
    try {
      await deleteModule(moduleInfo.id);
      navigate('/products');
    } catch (err) {
      console.error('Failed to remove module:', err);
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--module-inv-accent)' }}>
              {renderModuleIcon(moduleIcon, 22)}
            </span>
            <span>{moduleName} Inventory</span>
            <Badge variant="inv">{business?.name}</Badge>
          </h1>
          <p className="page-description">
            {moduleCaption}
          </p>
        </div>

        <div className="page-actions" style={{ display: 'flex', gap: '10px' }}>
          {moduleInfo && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="btn btn-secondary btn-sm"
              title="Remove this inventory module"
              style={{ color: 'var(--color-danger)' }}
            >
              <Trash2 size={15} /> Remove Module
            </button>
          )}
          <Link to={`/products/new?type=${slug}`} className="btn btn-inv">
            <Plus size={16} /> Add {moduleName}
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={`Search ${moduleName} by product name, variety, SKU, or barcode...`}
        />
      </div>

      {/* Table / Empty State */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
          Loading {moduleName} records...
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={`No ${moduleName} Products Found`}
          description={`No items recorded in ${moduleName} for ${business?.name}.`}
          actionText={`Add ${moduleName}`}
          actionLink={`/products/new?type=${slug}`}
          accentClass="btn-inv"
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Product Name & Variety</th>
                <th>Subcategory</th>
                <th>HSN Code</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'center' }}>Stock Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isLow = p.stock_quantity <= p.low_stock_threshold;
                const isOut = p.stock_quantity <= 0;

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{renderModuleIcon(moduleIcon, 18)}</span>
                        <div>
                          <Link to={`/products/${p.id}`} style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {p.name}
                          </Link>
                          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                            SKU: {p.sku}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>{p.category_name || '—'}</td>
                    <td>{p.hsn_code || '—'}</td>

                    <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular">
                      ₹{Number(p.sale_price).toFixed(2)}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}>
                        {p.stock_quantity} in stock
                      </Badge>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/products/${p.id}`} className="btn btn-secondary btn-sm">
                        View <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Popup Modal */}
      <DeleteModuleModal
        isOpen={isDeleteModalOpen}
        moduleName={moduleName}
        moduleSlug={slug}
        isDeleting={isDeleting}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
