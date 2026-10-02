import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Category, Supplier } from '../types';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useInventoryModules } from '../context/InventoryModulesContext';
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
  Leaf,
  BadgePercent,
  Sparkles,
  Trees,
  CheckCircle2,
  Plus,
  Trash2,
  Boxes,
  FlaskConical,
  Flower2,
  Wheat
} from 'lucide-react';
import { isPlantCategoryType } from './ProductNew';

export const ProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { businessId, business, isTaxable } = useBusiness();
  const { modules } = useInventoryModules();
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
  const [discountPieces, setDiscountPieces] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<string>('');
  const [attributes, setAttributes] = useState<Record<string, any>>({});

  // Plant Sizes and Size-Based Pricing
  const ALL_PLANT_SIZES = [
    { key: 'S', label: 'S (Small)', desc: 'Small pot / young sapling / 4-6 inch' },
    { key: 'M', label: 'M (Medium)', desc: 'Medium / 6-8 inch pot / polybag' },
    { key: 'L', label: 'L (Large)', desc: 'Large floor plant / 10-12 inch pot' },
    { key: 'XL', label: 'XL (Extra Large)', desc: 'Extra large specimen / 3-5 ft' },
    { key: 'XXL', label: 'XXL (Double Extra Large)', desc: 'Full landscape tree / 5+ ft' },
  ];

  const [selectedPlantSizes, setSelectedPlantSizes] = useState<string[]>(['S', 'M', 'L', 'XL', 'XXL']);
  const [customSizeInput, setCustomSizeInput] = useState<string>('');
  const [plantSizePricing, setPlantSizePricing] = useState<Record<string, { sale_price: string; cost_price: string }>>({
    S: { sale_price: '100', cost_price: '60' },
    M: { sale_price: '180', cost_price: '100' },
    L: { sale_price: '300', cost_price: '180' },
    XL: { sale_price: '500', cost_price: '300' },
    XXL: { sale_price: '850', cost_price: '500' },
  });
  const [isSameAmountForAll, setIsSameAmountForAll] = useState<boolean>(false);
  const [unifiedSizePrice, setUnifiedSizePrice] = useState<string>('');
  const [unifiedCostPrice, setUnifiedCostPrice] = useState<string>('');

  const isSizedProduct =
    isPlantCategoryType(type) ||
    Boolean(attributes.sizes && attributes.sizes.length > 0) ||
    Boolean(attributes.size_pricing && Object.keys(attributes.size_pricing).length > 0) ||
    Boolean(attributes.size_prices && Object.keys(attributes.size_prices).length > 0);

  // Toggle plant size selection
  const togglePlantSize = (sizeKey: string) => {
    setSelectedPlantSizes((prev) => {
      if (prev.includes(sizeKey)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== sizeKey);
      } else {
        const order = ['S', 'M', 'L', 'XL', 'XXL', '4"', '6"', '8"', '10"', '12"', '16"'];
        const next = [...prev, sizeKey];
        return next.sort((a, b) => {
          const idxA = order.indexOf(a);
          const idxB = order.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          return a.localeCompare(b);
        });
      }
    });
  };

  // Add custom size
  const handleAddCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (!trimmed) return;
    if (!selectedPlantSizes.includes(trimmed)) {
      setSelectedPlantSizes((prev) => [...prev, trimmed]);
      setPlantSizePricing((prev) => ({
        ...prev,
        [trimmed]: { sale_price: unifiedSizePrice || salePrice || '100', cost_price: unifiedCostPrice || costPrice || '50' }
      }));
    }
    setCustomSizeInput('');
  };

  // Apply unified price to all sizes
  const handleApplyUnifiedPrice = () => {
    if (!unifiedSizePrice) return;
    setPlantSizePricing((prev) => {
      const updated = { ...prev };
      selectedPlantSizes.forEach((sz) => {
        updated[sz] = {
          sale_price: unifiedSizePrice,
          cost_price: unifiedCostPrice || (updated[sz]?.cost_price || '0'),
        };
      });
      return updated;
    });
  };

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
        setDiscountPieces(prod.discount_pieces ? String(prod.discount_pieces) : (prod.attributes?.discount_pieces ? String(prod.attributes.discount_pieces) : ''));
        setDiscountPercent(prod.discount_percent ? String(prod.discount_percent) : (prod.attributes?.discount_percent ? String(prod.attributes.discount_percent) : ''));
        
        const attr = typeof prod.attributes === 'string' ? JSON.parse(prod.attributes) : (prod.attributes || {});
        setAttributes(attr);

        if (attr.sizes && Array.isArray(attr.sizes) && attr.sizes.length > 0) {
          setSelectedPlantSizes(attr.sizes);
        }

        if (attr.size_pricing && typeof attr.size_pricing === 'object') {
          const loadedPricing: Record<string, { sale_price: string; cost_price: string }> = {};
          Object.entries(attr.size_pricing).forEach(([sz, p]: [string, any]) => {
            loadedPricing[sz] = {
              sale_price: String(p.sale_price ?? prod.sale_price),
              cost_price: String(p.cost_price ?? prod.cost_price ?? '0'),
            };
          });
          setPlantSizePricing((prev) => ({ ...prev, ...loadedPricing }));
        } else if (attr.size_prices && typeof attr.size_prices === 'object') {
          const loadedPricing: Record<string, { sale_price: string; cost_price: string }> = {};
          Object.entries(attr.size_prices).forEach(([sz, p]: [string, any]) => {
            loadedPricing[sz] = {
              sale_price: String(p ?? prod.sale_price),
              cost_price: String(prod.cost_price ?? '0'),
            };
          });
          setPlantSizePricing((prev) => ({ ...prev, ...loadedPricing }));
        } else if (isPlantCategoryType(prod.type)) {
          // Initialize from current product price
          const baseSale = String(prod.sale_price || '150');
          const baseCost = String(prod.cost_price || '80');
          setPlantSizePricing({
            S: { sale_price: baseSale, cost_price: baseCost },
            M: { sale_price: String(Number(baseSale) * 1.5), cost_price: String(Number(baseCost) * 1.5) },
            L: { sale_price: String(Number(baseSale) * 2), cost_price: String(Number(baseCost) * 2) },
            XL: { sale_price: String(Number(baseSale) * 3), cost_price: String(Number(baseCost) * 3) },
            XXL: { sale_price: String(Number(baseSale) * 4.5), cost_price: String(Number(baseCost) * 4.5) },
          });
        }

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

    let updatedAttributes = { ...attributes };
    let finalSalePrice = Number(salePrice) || 0;
    let finalCostPrice = Number(costPrice) || 0;

    if (isSizedProduct) {
      const activeSizePricing: Record<string, { sale_price: number; cost_price?: number }> = {};
      const activeSizePrices: Record<string, number> = {};
      let minSale = Infinity;
      let minCost = Infinity;

      selectedPlantSizes.forEach((sz) => {
        const sp = Number(plantSizePricing[sz]?.sale_price) || 0;
        const cp = Number(plantSizePricing[sz]?.cost_price) || 0;
        activeSizePricing[sz] = { sale_price: sp, cost_price: cp };
        activeSizePrices[sz] = sp;
        if (sp < minSale) minSale = sp;
        if (cp < minCost) minCost = cp;
      });

      finalSalePrice = minSale !== Infinity ? minSale : (Number(salePrice) || 0);
      finalCostPrice = minCost !== Infinity ? minCost : (Number(costPrice) || 0);

      updatedAttributes = {
        ...updatedAttributes,
        sizes: selectedPlantSizes,
        size_pricing: activeSizePricing,
        size_prices: activeSizePrices,
      };
    }

    const payload = {
      name: name.trim(),
      image_url: imageUrl.trim(),
      type,
      category_id: categoryId || null,
      sku: sku.trim(),
      barcode: barcode.trim() || sku.trim(),
      cost_price: finalCostPrice,
      sale_price: finalSalePrice,
      gst_rate: (businessId === 'nikhlesh-nursery' || !isTaxable) ? 0 : (Number(gstRate) || 0),
      hsn_code: hsnCode.trim(),
      stock_quantity: Number(stockQuantity) || 0,
      low_stock_threshold: Number(lowStockThreshold) || 5,
      supplier_id: supplierId || null,
      discount_pieces: Number(discountPieces) || 0,
      discount_percent: Number(discountPercent) || 0,
      attributes: {
        ...updatedAttributes,
        discount_pieces: Number(discountPieces) || 0,
        discount_percent: Number(discountPercent) || 0,
      },
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
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '32px' }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div className="page-title-group">
          <Link
            to={`/products/${id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              marginBottom: '6px'
            }}
          >
            <ArrowLeft size={15} /> Back to Product Details
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title" style={{ fontSize: '1.35rem', margin: 0 }}>
              Edit Product: {name || 'Untitled'}
            </h1>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: businessId === 'grow-naturals' ? 'var(--color-botanical-100)' : 'var(--module-sell-subtle)',
                color: businessId === 'grow-naturals' ? 'var(--color-botanical-900)' : 'var(--module-sell-text)',
                border: `1px solid ${businessId === 'grow-naturals' ? 'var(--color-botanical-300)' : 'var(--module-sell-border)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Leaf size={12} /> {business?.name || (businessId === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery')}
            </span>
          </div>
          <p className="page-description" style={{ fontSize: '0.8125rem', marginTop: '3px' }}>
            Modify product details, category attributes, size variants, and pricing.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            backgroundColor: 'var(--color-danger-subtle)',
            color: 'var(--color-danger-text)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '16px'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{errorMessage}</span>
        </div>
      )}

      {/* Main Edit Form */}
      <form onSubmit={handleSubmit} className="card" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="card-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Section 1: Basic Information */}
          <div>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={14} style={{ color: 'var(--module-inv-accent)' }} /> Basic Information
            </h3>

            <div className="form-grid-2" style={{ gap: '12px 16px', marginBottom: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Product / Plant Name <span className="required">*</span>
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
                <label className="form-label">Category Type</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {modules.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name} ({m.slug})
                    </option>
                  ))}
                  {!modules.some((m) => m.slug === type) && (
                    <option value={type}>{type}</option>
                  )}
                </select>
              </div>
            </div>

            <div className="form-grid-2" style={{ gap: '12px 16px', marginBottom: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Subcategory</label>
                <select
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">None (Top-Level)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.type ? `(${c.type})` : ''}
                    </option>
                  ))}
                </select>
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
                  <option value="">None / Internal Nursery Propagation</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
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

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

          {/* Section 2: SKU & Barcode */}
          <div>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarcodeIcon size={14} style={{ color: 'var(--module-inv-accent)' }} /> SKU & Identification
            </h3>

            <div className="form-grid-2" style={{ gap: '12px 16px' }}>
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
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

          {/* Section 3: Specialized Category Attributes & Size Variants */}
          {isSizedProduct ? (
            <div className="form-section-card" style={{ padding: '14px 18px' }}>
              <div className="form-section-header" style={{ marginBottom: '12px', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="form-section-title" style={{ fontSize: '0.8125rem' }}>
                  <SlidersHorizontal size={16} style={{ color: 'var(--module-inv-accent)' }} />
                  <span>Size Variants & Botanical Specifications</span>
                </div>
                <span className="form-section-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Trees size={13} style={{ color: '#15803d' }} /> Live Stock Sizes ({selectedPlantSizes.length} active)
                </span>
              </div>

              <div>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: 700 }}>
                    Select Available Plant Sizes:
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedPlantSizes(['S', 'M', 'L', 'XL', 'XXL'])}
                      className="btn btn-sm btn-ghost"
                      style={{ fontSize: '0.72rem', padding: '2px 8px', color: '#059669', backgroundColor: '#ecfdf5', borderRadius: '4px' }}
                    >
                      All Sizes (S to XXL)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPlantSizes(['S', 'M', 'L'])}
                      className="btn btn-sm btn-ghost"
                      style={{ fontSize: '0.72rem', padding: '2px 8px', color: '#64748b', backgroundColor: '#f1f5f9', borderRadius: '4px' }}
                    >
                      Standard (S, M, L)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPlantSizes(['4"', '6"', '8"', '10"', '12"', '16"'])}
                      className="btn btn-sm btn-ghost"
                      style={{ fontSize: '0.72rem', padding: '2px 8px', color: '#c2410c', backgroundColor: '#fff7ed', borderRadius: '4px' }}
                    >
                      Pot Sizes (4" to 16")
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                  {ALL_PLANT_SIZES.map((sz) => {
                    const isSelected = selectedPlantSizes.includes(sz.key);
                    return (
                      <button
                        key={sz.key}
                        type="button"
                        onClick={() => togglePlantSize(sz.key)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1.5px solid ${isSelected ? '#059669' : '#e2e8f0'}`,
                          backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          position: 'relative'
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            backgroundColor: isSelected ? '#059669' : '#f1f5f9',
                            color: isSelected ? '#ffffff' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            flexShrink: 0
                          }}
                        >
                          {sz.key}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: isSelected ? '#065f46' : '#1e293b' }}>
                            {sz.label}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {sz.desc}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom size input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Add custom size (e.g. 14 inch, 4-5 ft)"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSize();
                      }
                    }}
                    style={{ maxWidth: '300px', height: '32px', fontSize: '0.78rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="btn btn-sm btn-secondary"
                    style={{ height: '32px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={13} /> Add Custom Size
                  </button>
                </div>
              </div>
            </div>
          ) : Object.keys(attributes).filter(k => k !== 'discount_pieces' && k !== 'discount_percent' && k !== 'sizes' && k !== 'size_pricing' && k !== 'size_prices').length > 0 ? (
            <div className="form-section-card">
              <div className="form-section-header">
                <div className="form-section-title">
                  <SlidersHorizontal size={16} style={{ color: 'var(--module-inv-accent)' }} />
                  <span>Specialized Attributes ({type.toUpperCase()})</span>
                </div>
                <span className="form-section-badge">Custom Specifications</span>
              </div>

              <div className="form-grid-3">
                {Object.entries(attributes)
                  .filter(([key]) => key !== 'discount_pieces' && key !== 'discount_percent' && key !== 'sizes' && key !== 'size_pricing' && key !== 'size_prices')
                  .map(([key, val]) => (
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
          ) : null}

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

          {/* Section 4: Pricing & Taxation */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IndianRupee size={16} style={{ color: 'var(--module-inv-accent)' }} /> Pricing & Taxation
              </h3>
              {isSizedProduct && (
                <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} /> Size-Based Pricing Active ({selectedPlantSizes.length} sizes selected)
                </span>
              )}
            </div>

            {isSizedProduct ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Fast Action: Set Same Amount For All Sizes */}
                <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="sameAmountToggleEdit"
                      className="cust-checkbox"
                      checked={isSameAmountForAll}
                      onChange={(e) => {
                        setIsSameAmountForAll(e.target.checked);
                        if (e.target.checked && unifiedSizePrice) {
                          handleApplyUnifiedPrice();
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="sameAmountToggleEdit" style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer', margin: 0 }}>
                      Set amount for all sizes
                    </label>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      (Applies the exact same sale price across {selectedPlantSizes.join(', ')})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="input-addon-group" style={{ width: '130px' }}>
                      <span className="input-addon-prefix">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        onKeyDown={(e) => {
                          if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                        }}
                        className="form-input tabular"
                        placeholder="Amount"
                        value={unifiedSizePrice}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setUnifiedSizePrice(val);
                          if (isSameAmountForAll) {
                            setPlantSizePricing((prev) => {
                              const next = { ...prev };
                              selectedPlantSizes.forEach((sz) => {
                                next[sz] = {
                                  sale_price: val,
                                  cost_price: next[sz]?.cost_price || '0',
                                };
                              });
                              return next;
                            });
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={handleApplyUnifiedPrice}
                      style={{ fontSize: '0.75rem', padding: '6px 12px', fontWeight: 600, color: '#059669', borderColor: '#a7f3d0', backgroundColor: '#ecfdf5' }}
                    >
                      Apply to All Sizes
                    </button>
                  </div>
                </div>

                {/* Per-Size Pricing Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                  {selectedPlantSizes.map((sz) => {
                    const priceObj = plantSizePricing[sz] || { sale_price: '0', cost_price: '0' };
                    return (
                      <div
                        key={sz}
                        style={{
                          padding: '10px 12px',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '8px',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ display: 'inline-block', minWidth: '24px', height: '24px', padding: '0 4px', borderRadius: '4px', backgroundColor: '#ecfdf5', textAlign: 'center', lineHeight: '24px', border: '1px solid #a7f3d0' }}>
                              {sz}
                            </span>
                            <span>Size {sz}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePlantSize(sz)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                            title="Remove size"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '2px' }}>
                            Sale Price <span className="required">*</span>
                          </label>
                          <div className="input-addon-group">
                            <span className="input-addon-prefix" style={{ fontSize: '0.75rem' }}>₹</span>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              inputMode="numeric"
                              onKeyDown={(e) => {
                                if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                              }}
                              className="form-input tabular"
                              style={{ fontSize: '0.8125rem', height: '32px' }}
                              value={priceObj.sale_price}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setPlantSizePricing((prev) => ({
                                  ...prev,
                                  [sz]: {
                                    sale_price: val,
                                    cost_price: prev[sz]?.cost_price || '0',
                                  },
                                }));
                              }}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '2px' }}>
                            Cost Price (Optional)
                          </label>
                          <div className="input-addon-group">
                            <span className="input-addon-prefix" style={{ fontSize: '0.75rem' }}>₹</span>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              inputMode="numeric"
                              onKeyDown={(e) => {
                                if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                              }}
                              className="form-input tabular"
                              style={{ fontSize: '0.8125rem', height: '32px' }}
                              value={priceObj.cost_price}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setPlantSizePricing((prev) => ({
                                  ...prev,
                                  [sz]: {
                                    sale_price: prev[sz]?.sale_price || '0',
                                    cost_price: val,
                                  },
                                }));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Lowest / Default POS Price Notice & Tax Fields */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 600 }}>
                    🌿 <strong>Catalog Default:</strong> Least amount (
                    ₹{selectedPlantSizes.length > 0 ? Math.round(Math.min(...selectedPlantSizes.map((s) => Number(plantSizePricing[s]?.sale_price) || 0))) : 0}
                    ) will be displayed as the default price in the POS Catalog & Order List.
                  </span>
                </div>

                <div className="form-grid-2" style={{ gap: '12px 16px', marginTop: '4px' }}>
                  {isTaxable && businessId !== 'nikhlesh-nursery' ? (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">GST Rate (%)</label>
                      <div className="input-addon-group">
                        <span className="input-addon-prefix">%</span>
                        <input
                          type="number"
                          step="1"
                          className="form-input tabular"
                          value={gstRate}
                          onChange={(e) => setGstRate(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">GST Tax Status</label>
                      <input
                        type="text"
                        className="form-input tabular"
                        value="0% (Nursery Agricultural / Non-taxable)"
                        disabled
                        style={{ backgroundColor: '#f8fafc', color: '#64748b' }}
                      />
                    </div>
                  )}

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
            ) : (
              <div className={isTaxable ? "form-grid-4" : "form-grid-3"}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Cost Price</label>
                  <div className="input-addon-group">
                    <span className="input-addon-prefix">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      inputMode="numeric"
                      onKeyDown={(e) => {
                        if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                      }}
                      className="form-input tabular"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value.replace(/[^0-9]/g, ''))}
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
                      step="1"
                      min="0"
                      inputMode="numeric"
                      onKeyDown={(e) => {
                        if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                      }}
                      className="form-input tabular"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value.replace(/[^0-9]/g, ''))}
                      required
                    />
                  </div>
                </div>

                {isTaxable && businessId !== 'nikhlesh-nursery' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      GST Rate (%)
                    </label>
                    <div className="input-addon-group">
                      <span className="input-addon-prefix">%</span>
                      <input
                        type="number"
                        step="1"
                        className="form-input tabular"
                        value={gstRate}
                        onChange={(e) => setGstRate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

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
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

          {/* Section 5: Stock Quantity */}
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

          {/* Section 6: Add Discount / Volume Discount (Optional) */}
          <div className="form-section-card" style={{ padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <div className="form-section-header" style={{ marginBottom: '12px', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="form-section-title" style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#1e293b' }}>
                <BadgePercent size={16} style={{ color: '#059669' }} />
                <span>Add Discount / Bulk Tier (Optional)</span>
              </div>
              <span className="form-section-badge" style={{ fontSize: '0.72rem', padding: '2px 8px', background: '#ecfdf5', color: '#065f46', borderRadius: '12px', fontWeight: 500 }}>
                🏷️ POS Auto Discount
              </span>
            </div>

            <div className="form-grid-2" style={{ gap: '12px 16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  No. of Pieces
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>(Threshold)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="form-input tabular"
                  value={discountPieces}
                  onChange={(e) => setDiscountPieces(e.target.value)}
                  placeholder="e.g. 5"
                />
                <span className="form-helper" style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                  Minimum quantity in cart to trigger discount
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Discount (%)
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>(Percentage)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="form-input tabular"
                    style={{ paddingRight: '28px' }}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    placeholder="e.g. 10"
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>%</span>
                </div>
                <span className="form-helper" style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                  Percentage to reduce from total product amount
                </span>
              </div>
            </div>

            {Number(discountPieces) > 0 && Number(discountPercent) > 0 && (
              <div style={{ marginTop: '10px', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} style={{ color: '#16a34a' }} />
                <span>
                  <strong>Rule Active:</strong> When <strong>{discountPieces} or more pieces</strong> are taken in POS, <strong>{discountPercent}%</strong> will be deducted from the product total.
                </span>
              </div>
            )}
          </div>
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
