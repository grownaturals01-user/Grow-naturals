import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Category, Supplier } from '../types';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ProductImageUploader } from '../components/common/ProductImageUploader';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Tag,
  Barcode as BarcodeIcon,
  IndianRupee,
  PackageCheck,
  Building2,
  SlidersHorizontal,
  Loader2,
  Leaf
} from 'lucide-react';

export const ProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { businessId, business, isTaxable } = useBusiness();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [type, setType] = useState<string>('plants');
  const [categoryId, setCategoryId] = useState<string>('');
  const [sku, setSku] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('0');
  const [salePrice, setSalePrice] = useState<string>('0');
  const [gstRate, setGstRate] = useState<string>('0');
  const [hsnCode, setHsnCode] = useState<string>('');
  const [stockQuantity, setStockQuantity] = useState<string>('0');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('5');
  const [supplierId, setSupplierId] = useState<string>('');
  const [attributes, setAttributes] = useState<Record<string, any>>({});

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.get(`/products/${id}`),
      api.get('/categories', { business_id: businessId }),
      api.get('/suppliers'),
    ])
      .then(([prod, cats, supps]) => {
        setName(prod.name);
        setImageUrl(prod.image_url || '');
        setType(prod.type);
        setCategoryId(prod.category_id || '');
        setSku(prod.sku);
        setBarcode(prod.barcode || '');
        setCostPrice(String(prod.cost_price));
        setSalePrice(String(prod.sale_price));
        setGstRate(String(prod.gst_rate));
        setHsnCode(prod.hsn_code || '');
        setStockQuantity(String(prod.stock_quantity));
        setLowStockThreshold(String(prod.low_stock_threshold));
        setSupplierId(prod.supplier_id || '');
        setAttributes(typeof prod.attributes === 'string' ? JSON.parse(prod.attributes) : (prod.attributes || {}));

        setCategories(cats);
        setSuppliers(supps);
      })
      .catch((err) => setErrorMessage(err.message || 'Product load failed'))
      .finally(() => setIsLoading(false));
  }, [id, businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      setErrorMessage('Name and SKU are required');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      name: name.trim(),
      image_url: imageUrl.trim(),
      type,
      category_id: categoryId || null,
      sku: sku.trim(),
      barcode: barcode.trim() || sku.trim(),
      cost_price: Number(costPrice) || 0,
      sale_price: Number(salePrice) || 0,
      gst_rate: isTaxable ? Number(gstRate) || 0 : 0,
      hsn_code: hsnCode.trim(),
      stock_quantity: Number(stockQuantity) || 0,
      low_stock_threshold: Number(lowStockThreshold) || 5,
      supplier_id: supplierId || null,
      attributes,
      user_id: user?.id,
    };

    try {
      await api.put(`/products/${id}`, payload);
      navigate(`/products/${id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px', color: 'var(--color-text-muted)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-botanical-600)' }} />
        <p style={{ fontSize: 'var(--font-sm)' }}>Loading product details...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Breadcrumb & Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div className="page-title-group">
          <Link
            to={`/products/${id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--font-sm)',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '8px',
              transition: 'color var(--transition-fast)'
            }}
          >
            <ArrowLeft size={16} /> Back to Product Details
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              Edit Product: {name}
            </h1>
            <span
              style={{
                fontSize: 'var(--font-xs)',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: businessId === 'grow-naturals' ? 'var(--color-botanical-100)' : 'var(--module-sell-subtle)',
                color: businessId === 'grow-naturals' ? 'var(--color-botanical-900)' : 'var(--module-sell-text)',
                border: `1px solid ${businessId === 'grow-naturals' ? 'var(--color-botanical-300)' : 'var(--module-sell-border)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Leaf size={12} /> {business?.name}
            </span>
          </div>
          <p className="page-description" style={{ marginTop: '4px' }}>
            Update inventory specifications and stock records for {business?.name}.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 18px',
            backgroundColor: 'var(--color-danger-subtle)',
            color: 'var(--color-danger-text)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Section 1: Core Details */}
          <div>
            <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={16} style={{ color: 'var(--module-inv-accent)' }} /> Product Information
            </h3>

            <div className="form-grid-2" style={{ marginBottom: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Product Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Subcategory</label>
                <select
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select Subcategory (Optional)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Image Uploader */}
            <ProductImageUploader
              value={imageUrl}
              onChange={setImageUrl}
              label="Product Photo / Media"
              productType={type}
            />
          </div>

          {/* Section 2: SKU, Barcode & Supplier */}
          <div>
            <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarcodeIcon size={16} style={{ color: 'var(--module-inv-accent)' }} /> SKU & Identification
            </h3>

            <div className="form-grid-3">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  SKU Code <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input tabular"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Barcode Number</label>
                <input
                  type="text"
                  className="form-input tabular"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Leave blank to match SKU"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <Building2 size={13} style={{ color: 'var(--color-text-muted)' }} /> Supplier Partner
                </label>
                <select
                  className="form-select"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">None / Direct</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

          {/* Section 3: Pricing & Tax Structure */}
          <div>
            <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IndianRupee size={16} style={{ color: 'var(--module-inv-accent)' }} /> Pricing & Taxation
            </h3>

            <div className="form-grid-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cost Price</label>
                <div className="input-addon-group">
                  <span className="input-addon-prefix">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input tabular"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Sale Price <span className="required">*</span>
                </label>
                <div className="input-addon-group">
                  <span className="input-addon-prefix">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input tabular"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  GST Rate {isTaxable ? '(%)' : ''}
                </label>
                {isTaxable ? (
                  <div className="input-addon-group">
                    <span className="input-addon-prefix">%</span>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input tabular"
                      value={gstRate}
                      onChange={(e) => setGstRate(e.target.value)}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    className="form-input tabular"
                    value="0% (Tax Exempt)"
                    disabled
                    style={{ fontWeight: 600 }}
                  />
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">HSN Code</label>
                <input
                  type="text"
                  className="form-input tabular"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Stock Quantity */}
          <div>
            <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PackageCheck size={16} style={{ color: 'var(--module-inv-accent)' }} /> Stock & Inventory Levels
            </h3>

            <div className="form-grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Current Stock Quantity <span className="required">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-input tabular"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  required
                />
                <span className="form-helper">Manually adjusting stock logs an audit entry.</span>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Low Stock Threshold</label>
                <input
                  type="number"
                  min="0"
                  className="form-input tabular"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Specialized Category Attributes */}
          {Object.keys(attributes).length > 0 && (
            <div className="form-section-card">
              <div className="form-section-header">
                <div className="form-section-title">
                  <SlidersHorizontal size={16} style={{ color: 'var(--module-inv-accent)' }} />
                  <span>Specialized Attributes ({type.toUpperCase()})</span>
                </div>
                <span className="form-section-badge">Custom Specifications</span>
              </div>

              <div className="form-grid-3">
                {Object.entries(attributes).map(([key, val]) => (
                  <div key={key} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={String(val)}
                      onChange={(e) => setAttributes({ ...attributes, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card Footer with Actions */}
        <div className="card-footer" style={{ padding: '16px 24px' }}>
          <Link to={`/products/${id}`} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-inv"
            disabled={isSubmitting}
            style={{
              padding: '10px 24px',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save size={16} /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
