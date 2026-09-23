import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Category, Supplier, CategoryType } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { ProductImageUploader } from '../components/common/ProductImageUploader';
import {
  ArrowLeft,
  Save,
  Sparkles,
  AlertCircle,
  Leaf,
  Tag,
  Barcode as BarcodeIcon,
  IndianRupee,
  Layers,
  PackageCheck,
  Building2,
  SlidersHorizontal,
  CheckCircle2,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

export const ProductNew: React.FC = () => {
  const { businessId, business, activeBusiness, isTaxable } = useBusiness();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Core Fields
  const [name, setName] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [type, setType] = useState<CategoryType>('plants');
  const [categoryId, setCategoryId] = useState<string>('');
  const [sku, setSku] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('0');
  const [salePrice, setSalePrice] = useState<string>('0');
  const [gstRate, setGstRate] = useState<string>(isTaxable ? '12' : '0');
  const [hsnCode, setHsnCode] = useState<string>('0602');
  const [stockQuantity, setStockQuantity] = useState<string>('10');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('5');
  const [supplierId, setSupplierId] = useState<string>('');

  // Specialized Attributes per Category
  const [plantAttributes, setPlantAttributes] = useState({
    pot_size: '8 inch',
    height: '1.5 ft',
    sunlight: 'Bright indirect',
    watering: '2x weekly',
    difficulty: 'Easy',
  });

  const [potAttributes, setPotAttributes] = useState({
    material: 'Ceramic',
    size: '10 inch',
    color: 'White',
    drainage: 'Yes',
  });

  const [fertilizerAttributes, setFertilizerAttributes] = useState({
    composition: 'Organic seaweed extract',
    unit_size: '500 ml',
    is_organic: 'Yes',
    safety_notes: 'Non-toxic, safe for pets',
  });

  const [flowerAttributes, setFlowerAttributes] = useState({
    occasion: 'Gifting / Celebration',
    arrangement_style: 'Vase Bouquet',
    shelf_life: '5-7 days',
    vase_included: 'Yes',
  });

  // Load categories & suppliers
  useEffect(() => {
    api.get('/categories', { business_id: businessId }).then(setCategories).catch(console.warn);
    api.get('/suppliers').then(setSuppliers).catch(console.warn);
  }, [businessId]);

  // Auto-generate SKU
  const generateSku = () => {
    const prefix = activeBusiness?.invoice_prefix
      ? activeBusiness.invoice_prefix.replace(/[^a-zA-Z0-9]/g, '')
      : (businessId === 'grow-naturals' ? 'GN' : 'NN');
    const typeCode = type.slice(0, 2).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const generated = `${prefix}-${typeCode}-${rand}`;
    setSku(generated);
    if (!barcode) setBarcode(generated);
  };

  const handleCategoryTypeChange = (newType: CategoryType) => {
    setType(newType);
    if (newType === 'plants') setHsnCode('0602');
    else if (newType === 'pots') setHsnCode('6913');
    else if (newType === 'fertilizers') setHsnCode('3101');
    else if (newType === 'flowers') setHsnCode('0603');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please provide a product/plant name.');
      return;
    }
    if (!sku.trim()) {
      setErrorMessage('SKU is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    let attributes: any = {};
    if (type === 'plants') attributes = plantAttributes;
    else if (type === 'pots') attributes = potAttributes;
    else if (type === 'fertilizers') attributes = fertilizerAttributes;
    else if (type === 'flowers') attributes = flowerAttributes;

    const payload = {
      business_id: businessId,
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
    };

    try {
      await api.post('/products', payload);
      navigate('/products');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = [
    { type: 'plants' as CategoryType, icon: '🌱', label: 'Plants & Trees', desc: 'Live botanical stock' },
    { type: 'pots' as CategoryType, icon: '🪴', label: 'Pots & Planters', desc: 'Ceramic, fiber, clay' },
    { type: 'fertilizers' as CategoryType, icon: '🧪', label: 'Fertilizers', desc: 'Nutrients, pest care' },
    { type: 'flowers' as CategoryType, icon: '💐', label: 'Flowers & Decor', desc: 'Bouquets, fresh cuts' },
  ];

  return (
    <div style={{ maxWidth: '1080px', width: '100%', margin: '0 auto', paddingBottom: '32px' }}>
      {/* Top Breadcrumb & Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div className="page-title-group">
          <Link
            to="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              marginBottom: '6px',
              transition: 'color var(--transition-fast)'
            }}
          >
            <ArrowLeft size={15} /> Back to Products
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ fontSize: '1.35rem', margin: 0 }}>
              Add New Product
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
              <Leaf size={12} /> {business?.name || 'Grow Naturals'}
            </span>
          </div>
          <p className="page-description" style={{ fontSize: '0.8125rem', marginTop: '3px' }}>
            Create a distinct stock record scoped strictly to {business?.name}.
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
            marginBottom: '16px',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{errorMessage}</span>
        </div>
      )}

      {/* Main Product Form Card */}
      <form onSubmit={handleSubmit} className="card" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="card-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Section 1: Category Type Selection */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                <Layers size={15} style={{ color: 'var(--module-inv-accent)' }} /> Category Type <span className="required">*</span>
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                Defines specialized product specifications
              </span>
            </div>

            <div className="category-card-grid">
              {categoryOptions.map((cat) => {
                const isSelected = type === cat.type;
                return (
                  <button
                    key={cat.type}
                    type="button"
                    className={`category-card-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => handleCategoryTypeChange(cat.type)}
                  >
                    {isSelected && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '8px',
                          color: 'var(--color-botanical-600)',
                        }}
                      >
                        <CheckCircle2 size={15} />
                      </span>
                    )}
                    <span className="category-card-icon">{cat.icon}</span>
                    <div className="category-card-text-group">
                      <span className="category-card-title">{cat.label}</span>
                      <span className="category-card-desc">{cat.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

          {/* Section 2: Core Details */}
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
                  placeholder="e.g. Ficus Bonsai S-Shape, 10 inch Glazed Pot"
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

          {/* Section 3: SKU, Barcode & Supplier */}
          <div>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarcodeIcon size={14} style={{ color: 'var(--module-inv-accent)' }} /> SKU & Identification
            </h3>

            <div className="form-grid-3" style={{ gap: '12px 16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    SKU Code <span className="required">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateSku}
                    className="btn btn-sm btn-ghost"
                    style={{
                      padding: '2px 7px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--module-inv-accent)',
                      border: '1px solid var(--module-inv-border)',
                      backgroundColor: 'var(--module-inv-subtle)',
                      borderRadius: 'var(--radius-full)',
                      gap: '3px'
                    }}
                  >
                    <Sparkles size={11} /> Auto Generate
                  </button>
                </div>
                <input
                  type="text"
                  className="form-input tabular"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. GN-PL-1001"
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
                  <option value="">None / Internal Propagation</option>
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

          {/* Section 4: Pricing & Taxes */}
          <div>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IndianRupee size={14} style={{ color: 'var(--module-inv-accent)' }} /> Pricing & Taxation
            </h3>

            <div className="form-grid-4" style={{ gap: '12px 16px' }}>
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
                      placeholder="0, 5, 12, 18"
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
                  placeholder="e.g. 0602"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Stock Quantities */}
          <div>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PackageCheck size={14} style={{ color: 'var(--module-inv-accent)' }} /> Stock & Inventory Levels
            </h3>

            <div className="form-grid-2" style={{ gap: '12px 16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Initial Stock Quantity <span className="required">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-input tabular"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  required
                />
                <span className="form-helper">Available units for immediate sale</span>
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
                <span className="form-helper">Alert triggers when count falls below this</span>
              </div>
            </div>
          </div>

          {/* Section 6: Specialized Category Attribute Container */}
          <div className="form-section-card" style={{ padding: '14px 18px', marginTop: '2px' }}>
            <div className="form-section-header" style={{ marginBottom: '12px', paddingBottom: '8px' }}>
              <div className="form-section-title" style={{ fontSize: '0.8125rem' }}>
                <SlidersHorizontal size={15} style={{ color: 'var(--module-inv-accent)' }} />
                <span>Specialized {type.toUpperCase()} Attributes</span>
              </div>
              <span className="form-section-badge" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                {type === 'plants' && '🌱 Live Botany'}
                {type === 'pots' && '🪴 Container Specs'}
                {type === 'fertilizers' && '🧪 Chemical Profile'}
                {type === 'flowers' && '💐 Floral Freshness'}
              </span>
            </div>

            {type === 'plants' && (
              <div className="form-grid-3" style={{ gap: '12px 16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Pot Size / Container</label>
                  <input
                    type="text"
                    className="form-input"
                    value={plantAttributes.pot_size}
                    onChange={(e) => setPlantAttributes({ ...plantAttributes, pot_size: e.target.value })}
                    placeholder="e.g. 8 inch ceramic, Polybag 5L"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Plant Height</label>
                  <input
                    type="text"
                    className="form-input"
                    value={plantAttributes.height}
                    onChange={(e) => setPlantAttributes({ ...plantAttributes, height: e.target.value })}
                    placeholder="e.g. 1.5 ft, 2-3 ft"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Sunlight Requirement</label>
                  <select
                    className="form-select"
                    value={plantAttributes.sunlight}
                    onChange={(e) => setPlantAttributes({ ...plantAttributes, sunlight: e.target.value })}
                  >
                    <option value="Bright indirect">Bright Indirect Light</option>
                    <option value="Full sun">Full Sun</option>
                    <option value="Partial shade">Partial Shade</option>
                    <option value="Low light">Low Light Tolerant</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Watering Frequency</label>
                  <input
                    type="text"
                    className="form-input"
                    value={plantAttributes.watering}
                    onChange={(e) => setPlantAttributes({ ...plantAttributes, watering: e.target.value })}
                    placeholder="e.g. 2x weekly, Daily, When dry"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Maintenance Difficulty</label>
                  <select
                    className="form-select"
                    value={plantAttributes.difficulty}
                    onChange={(e) => setPlantAttributes({ ...plantAttributes, difficulty: e.target.value })}
                  >
                    <option value="Very Easy">Very Easy / Beginner</option>
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Expert">Expert / Delicate</option>
                  </select>
                </div>
              </div>
            )}

            {type === 'pots' && (
              <div className="form-grid-2" style={{ gap: '12px 16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Material</label>
                  <input
                    type="text"
                    className="form-input"
                    value={potAttributes.material}
                    onChange={(e) => setPotAttributes({ ...potAttributes, material: e.target.value })}
                    placeholder="e.g. Glazed Ceramic, Terracotta, Fiberstone"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Pot Size / Diameter</label>
                  <input
                    type="text"
                    className="form-input"
                    value={potAttributes.size}
                    onChange={(e) => setPotAttributes({ ...potAttributes, size: e.target.value })}
                    placeholder="e.g. 10 inch, 12x12 inch"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Color / Finish</label>
                  <input
                    type="text"
                    className="form-input"
                    value={potAttributes.color}
                    onChange={(e) => setPotAttributes({ ...potAttributes, color: e.target.value })}
                    placeholder="e.g. Royal Indigo, Matte Black"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Drainage Hole</label>
                  <select
                    className="form-select"
                    value={potAttributes.drainage}
                    onChange={(e) => setPotAttributes({ ...potAttributes, drainage: e.target.value })}
                  >
                    <option value="Yes">Yes (Has drainage hole)</option>
                    <option value="No">No (Cachepot / Indoor self-watering)</option>
                  </select>
                </div>
              </div>
            )}

            {type === 'fertilizers' && (
              <div className="form-grid-2" style={{ gap: '12px 16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Composition / Formulation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fertilizerAttributes.composition}
                    onChange={(e) => setFertilizerAttributes({ ...fertilizerAttributes, composition: e.target.value })}
                    placeholder="e.g. Cold pressed seaweed, NPK 19:19:19"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Unit Size / Packaging</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fertilizerAttributes.unit_size}
                    onChange={(e) => setFertilizerAttributes({ ...fertilizerAttributes, unit_size: e.target.value })}
                    placeholder="e.g. 500 ml bottle, 25 kg bag"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                  <label className="form-label">Safety & Dosage Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fertilizerAttributes.safety_notes}
                    onChange={(e) => setFertilizerAttributes({ ...fertilizerAttributes, safety_notes: e.target.value })}
                    placeholder="e.g. Dilute 2ml per 1L water, Store in shade"
                  />
                </div>
              </div>
            )}

            {type === 'flowers' && (
              <div className="form-grid-2" style={{ gap: '12px 16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Occasion / Purpose</label>
                  <input
                    type="text"
                    className="form-input"
                    value={flowerAttributes.occasion}
                    onChange={(e) => setFlowerAttributes({ ...flowerAttributes, occasion: e.target.value })}
                    placeholder="e.g. Corporate Gifting, Mandir / Pooja, Event Decor"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Arrangement Style</label>
                  <input
                    type="text"
                    className="form-input"
                    value={flowerAttributes.arrangement_style}
                    onChange={(e) => setFlowerAttributes({ ...flowerAttributes, arrangement_style: e.target.value })}
                    placeholder="e.g. Hand-tied bouquet, Vase arrangement"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Shelf Life / Freshness Window</label>
                  <input
                    type="text"
                    className="form-input"
                    value={flowerAttributes.shelf_life}
                    onChange={(e) => setFlowerAttributes({ ...flowerAttributes, shelf_life: e.target.value })}
                    placeholder="e.g. 5-7 days, 2 days"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Vase Included</label>
                  <select
                    className="form-select"
                    value={flowerAttributes.vase_included}
                    onChange={(e) => setFlowerAttributes({ ...flowerAttributes, vase_included: e.target.value })}
                  >
                    <option value="Yes">Yes (Vase included in bundle)</option>
                    <option value="No">No (Bouquet / Stems only)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Card Footer with Actions */}
        <div className="card-footer" style={{ padding: '12px 24px' }}>
          <Link to="/products" className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '0.8125rem' }}>
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-inv"
            disabled={isSubmitting}
            style={{
              padding: '8px 22px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving Product...
              </>
            ) : (
              <>
                <Save size={15} /> Save Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
