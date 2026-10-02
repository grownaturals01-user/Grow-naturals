import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Category, Supplier, CategoryType } from '../types';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useInventoryModules } from '../context/InventoryModulesContext';
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
  Plus,
  Trash2,
  BadgePercent,
  Trees,
  FlaskConical,
  Flower2,
  Boxes,
  Sprout,
  Shovel,
  Wheat
} from 'lucide-react';
import { CategoryIconBadge, CactusIcon, PlanterIcon } from '../components/common/CategoryIcons';

export const isPlantCategoryType = (t: string): boolean => {
  const norm = (t || '').toLowerCase().trim();
  return (
    norm === 'plants' ||
    norm === 'nursery-plants' ||
    norm === 'fruit-trees' ||
    norm === 'saplings' ||
    norm === 'trees' ||
    norm === 'plants-flora' ||
    norm.includes('plant') ||
    norm.includes('tree') ||
    norm.includes('sapling')
  );
};

export const ProductNew: React.FC = () => {
  const { businessId, business, activeBusiness, businesses, isTaxable } = useBusiness();
  const { modules } = useInventoryModules();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const safeBusinessId = (activeBusiness?.id && activeBusiness.id !== 'all')
    ? activeBusiness.id
    : (businessId && businessId !== 'all' ? businessId : (businesses[0]?.id || 'grow-naturals'));

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

  // Volume / Bulk Discount (Optional)
  const [discountPieces, setDiscountPieces] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<string>('');

  // Plant Sizes and Size-Based Pricing
  const ALL_PLANT_SIZES = [
    { key: 'S', label: 'S (Small)', desc: 'Small pot / young sapling / 4-6 inch' },
    { key: 'M', label: 'M (Medium)', desc: 'Medium / 6-8 inch pot / polybag' },
    { key: 'L', label: 'L (Large)', desc: 'Large floor plant / 10-12 inch pot' },
    { key: 'XL', label: 'XL (Extra Large)', desc: 'Extra large specimen / 3-5 ft' },
    { key: 'XXL', label: 'XXL (Double Extra Large)', desc: 'Full landscape tree / 5+ ft' },
  ];

  const POT_SIZE_PRESETS = [
    { key: '4"', label: '4 Inch Pot', desc: 'Mini nursery starter pot' },
    { key: '6"', label: '6 Inch Pot', desc: 'Standard tabletop / polybag' },
    { key: '8"', label: '8 Inch Pot', desc: 'Medium patio pot / nursery bag' },
    { key: '10"', label: '10 Inch Pot', desc: 'Large decorative planter' },
    { key: '12"', label: '12 Inch Pot', desc: 'Extra large floor planter' },
    { key: '16"', label: '16 Inch Pot', desc: 'Heavy specimen tub / grow bag' },
  ];

  // Size workflow toggle (enabled by default for plants & nursery plants)
  const [enableSizePricing, setEnableSizePricing] = useState<boolean>(true);
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
  const [unifiedSizePrice, setUnifiedSizePrice] = useState<string>('200');
  const [unifiedCostPrice, setUnifiedCostPrice] = useState<string>('100');

  // Specialized Attributes per Category
  // 1. Grow Naturals: Cactus
  const [cactusAttributes, setCactusAttributes] = useState({
    pot_size: '4 inch',
    variety_type: 'Desert Spiny',
    sunlight: 'Direct sun',
    watering: '1x every 2-3 weeks',
    difficulty: 'Very Easy',
  });

  // 2. Grow Naturals: Pots
  const [potAttributes, setPotAttributes] = useState({
    material: 'Ceramic',
    size: '10 inch',
    color: 'White',
    drainage: 'Yes',
  });

  // 3. Grow Naturals: Fertilizers
  const [fertilizerAttributes, setFertilizerAttributes] = useState({
    composition: 'Organic seaweed extract',
    unit_size: '500 ml',
    is_organic: 'Yes',
    safety_notes: 'Non-toxic, safe for pets',
  });

  // 4. Grow Naturals: Flowers
  const [flowerAttributes, setFlowerAttributes] = useState({
    occasion: 'Gifting / Celebration',
    arrangement_style: 'Vase Bouquet',
    shelf_life: '5-7 days',
    vase_included: 'Yes',
  });

  // 5. Nikhlesh Nursery: Nursery Plants
  const [nurseryPlantAttributes, setNurseryPlantAttributes] = useState({
    bag_type: '8 inch Polybag',
    sunlight: 'Full Sunlight',
    watering: 'Daily in summer',
    growth_habit: 'Flowering Shrub / Ornamental',
    difficulty: 'Easy',
  });

  // 6. Nikhlesh Nursery: Fruit Trees
  const [fruitTreeAttributes, setFruitTreeAttributes] = useState({
    graft_type: 'Grafted (High Yield)',
    fruiting_season: '1st Year / Summer Season',
    container_type: '10x12 inch Heavy Polybag',
    mature_height: 'Dwarf / Pot-friendly (6-8 ft)',
    pollination: 'Self-fertile',
  });

  // 7. Nikhlesh Nursery: Seeds & Bulbs
  const [seedsBulbsAttributes, setSeedsBulbsAttributes] = useState({
    variety: 'F1 Hybrid / High Germination',
    sowing_season: 'All Season / Kharif',
    pack_quantity: '50 seeds pack',
    germination_days: '6-10 days',
  });

  // 8. Nikhlesh Nursery: Soil & Manure
  const [soilManureAttributes, setSoilManureAttributes] = useState({
    composition: '100% Organic Vermicompost',
    pack_weight: '5 kg Bag',
    is_organic: 'Yes (Certified Natural)',
    usage_notes: 'Apply 200g per pot monthly',
  });

  // 9. Nikhlesh Nursery: Nursery Pots
  const [nurseryPotAttributes, setNurseryPotAttributes] = useState({
    material: 'Heavy Duty Plastic Nursery Bag',
    pot_size: '8 inch Diameter',
    color: 'Black',
    drainage: 'Yes',
  });

  // Custom / Fallback Category
  const [customAttributes, setCustomAttributes] = useState({
    specification: '',
    size_or_dimension: '',
    material_or_origin: '',
    notes: '',
  });

  // Whether sizes workflow should be active for current product
  const isSizedProduct = isPlantCategoryType(type) || enableSizePricing;

  // Toggle plant size selection
  const togglePlantSize = (sizeKey: string) => {
    setSelectedPlantSizes((prev) => {
      if (prev.includes(sizeKey)) {
        if (prev.length === 1) return prev; // Keep at least one size
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
        [trimmed]: { sale_price: unifiedSizePrice || '100', cost_price: unifiedCostPrice || '50' }
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

  // Preselect from URL query param if present, or fallback to first business module
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam) {
      handleCategoryTypeChange(typeParam as CategoryType);
    } else if (modules.length > 0 && !modules.some((m) => m.slug === type)) {
      handleCategoryTypeChange(modules[0].slug as CategoryType);
    }
  }, [searchParams, modules]);

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
    const isPlant = isPlantCategoryType(newType);
    setEnableSizePricing(isPlant);

    if (newType === 'plants' || newType === 'cactus' || newType === 'nursery-plants' || newType === 'fruit-trees') {
      setHsnCode('0602');
    } else if (newType === 'pots' || newType === 'nursery-pots') {
      setHsnCode('6913');
    } else if (newType === 'fertilizers' || newType === 'soil-manure') {
      setHsnCode('3101');
    } else if (newType === 'flowers') {
      setHsnCode('0603');
    } else if (newType === 'seeds-bulbs') {
      setHsnCode('1209');
    }
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

      // Collect category-specific attributes
      let categoryExtra: any = {};
      if (type === 'nursery-plants') categoryExtra = nurseryPlantAttributes;
      else if (type === 'fruit-trees') categoryExtra = fruitTreeAttributes;
      else if (type === 'cactus') categoryExtra = cactusAttributes;
      else if (type === 'pots') categoryExtra = potAttributes;
      else if (type === 'fertilizers') categoryExtra = fertilizerAttributes;
      else if (type === 'flowers') categoryExtra = flowerAttributes;
      else if (type === 'seeds-bulbs') categoryExtra = seedsBulbsAttributes;
      else if (type === 'soil-manure') categoryExtra = soilManureAttributes;
      else if (type === 'nursery-pots') categoryExtra = nurseryPotAttributes;
      else if (type !== 'plants') categoryExtra = customAttributes;

      attributes = {
        ...categoryExtra,
        sizes: selectedPlantSizes,
        size_pricing: activeSizePricing,
        size_prices: activeSizePrices,
      };
    } else {
      if (type === 'cactus') attributes = cactusAttributes;
      else if (type === 'pots') attributes = potAttributes;
      else if (type === 'fertilizers') attributes = fertilizerAttributes;
      else if (type === 'flowers') attributes = flowerAttributes;
      else if (type === 'nursery-plants') attributes = nurseryPlantAttributes;
      else if (type === 'fruit-trees') attributes = fruitTreeAttributes;
      else if (type === 'seeds-bulbs') attributes = seedsBulbsAttributes;
      else if (type === 'soil-manure') attributes = soilManureAttributes;
      else if (type === 'nursery-pots') attributes = nurseryPotAttributes;
      else attributes = customAttributes;
    }

    const payload = {
      business_id: safeBusinessId,
      name: name.trim(),
      image_url: imageUrl.trim(),
      type,
      category_id: categoryId || null,
      sku: sku.trim(),
      barcode: barcode.trim() || sku.trim(),
      cost_price: finalCostPrice,
      sale_price: finalSalePrice,
      gst_rate: (safeBusinessId === 'nikhlesh-nursery' || !isTaxable) ? 0 : (Number(gstRate) || 0),
      hsn_code: hsnCode.trim(),
      stock_quantity: Number(stockQuantity) || 0,
      low_stock_threshold: Number(lowStockThreshold) || 5,
      supplier_id: supplierId || null,
      discount_pieces: Number(discountPieces) || 0,
      discount_percent: Number(discountPercent) || 0,
      attributes: {
        ...attributes,
        discount_pieces: Number(discountPieces) || 0,
        discount_percent: Number(discountPercent) || 0,
      },
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

  interface CategoryOption {
    type: CategoryType;
    label: string;
    desc: string;
    customIcon?: string;
  }

  const categoryOptions: CategoryOption[] = (modules && modules.length > 0)
    ? modules.map((m) => ({
        type: m.slug as CategoryType,
        customIcon: m.icon,
        label: m.name,
        desc: m.caption || `${m.name} inventory workflow`,
      }))
    : [
        { type: 'plants' as CategoryType, label: 'Plants & Trees', desc: 'Live botanical stock' },
        { type: 'nursery-plants' as CategoryType, label: 'Nursery Plants', desc: 'Outdoor garden saplings & shrubs' },
        { type: 'fruit-trees' as CategoryType, label: 'Fruit Trees', desc: 'Grafted fruit saplings & orchard trees' },
        { type: 'seeds-bulbs' as CategoryType, label: 'Seeds & Bulbs', desc: 'Vegetable seeds, flower bulbs' },
        { type: 'soil-manure' as CategoryType, label: 'Soil & Manure', desc: 'Vermicompost, red soil, cocopeat' },
        { type: 'nursery-pots' as CategoryType, label: 'Nursery Pots', desc: 'Grow bags, terracotta pots' },
        { type: 'cactus' as CategoryType, label: 'Cactus & Succulents', desc: 'Desert flora, low water' },
        { type: 'pots' as CategoryType, label: 'Pots & Planters', desc: 'Ceramic, fiber, clay' },
        { type: 'fertilizers' as CategoryType, label: 'Fertilizers', desc: 'Nutrients, pest care' },
        { type: 'flowers' as CategoryType, label: 'Flowers & Decor', desc: 'Bouquets, fresh cuts' },
      ];

  const matchingSubcategories = categories.filter((c) => !c.type || c.type === type);

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
              <Leaf size={12} /> {business?.name || (businessId === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery')}
            </span>
          </div>
          <p className="page-description" style={{ fontSize: '0.8125rem', marginTop: '3px' }}>
            Create a distinct stock record scoped strictly to {business?.name || 'this business'}.
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
                Defines specialized product specifications & size workflows
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
                    <CategoryIconBadge
                      type={cat.type}
                      isSelected={isSelected}
                      customIcon={cat.customIcon}
                    />
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
                  placeholder="e.g. Mango Banganapalli Grafted, Hibiscus Double Red, 10 inch Terracotta Pot"
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
                  {(matchingSubcategories.length > 0 ? matchingSubcategories : categories).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.type ? `(${c.type})` : ''}
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
                  placeholder="e.g. NN-NP-1001"
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
                  <option value="">None / Internal Nursery Propagation</option>
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

          {/* Section 4: Size Selection & Specialized Category Attributes */}
          <div className="form-section-card" style={{ padding: '14px 18px', marginTop: '2px' }}>
            <div className="form-section-header" style={{ marginBottom: '12px', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="form-section-title" style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SlidersHorizontal size={15} style={{ color: 'var(--module-inv-accent)' }} />
                <span>Specialized {type.toUpperCase().replace(/-/g, ' ')} Specifications</span>
              </div>
              <span
                className="form-section-badge"
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 9px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isPlantCategoryType(type) ? (
                  <>
                    <Trees size={13} style={{ color: '#15803d' }} /> Live Stock & Size Variants Active
                  </>
                ) : type === 'cactus' ? (
                  <>
                    <CactusIcon size={13} style={{ color: '#0d9488' }} /> Desert Flora & Succulents
                  </>
                ) : type === 'pots' || type === 'nursery-pots' ? (
                  <>
                    <PlanterIcon size={13} style={{ color: '#c2410c' }} /> Container & Bag Specs
                  </>
                ) : type === 'fertilizers' || type === 'soil-manure' ? (
                  <>
                    <FlaskConical size={13} style={{ color: '#4f46e5' }} /> Organic Soil & Nutrients
                  </>
                ) : type === 'seeds-bulbs' ? (
                  <>
                    <Wheat size={13} style={{ color: '#b45309' }} /> Seeds & Germination
                  </>
                ) : type === 'flowers' ? (
                  <>
                    <Flower2 size={13} style={{ color: '#e11d48' }} /> Floral Freshness
                  </>
                ) : (
                  <>
                    <Boxes size={13} /> Custom Module Specs
                  </>
                )}
              </span>
            </div>

            {/* Plant Size Selection Container (Available for any plant/tree type or when size pricing enabled) */}
            {isSizedProduct && (
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed #e2e8f0' }}>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Trees size={14} color="#059669" /> Select Available Plant / Sapling Sizes:
                  </label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedPlantSizes(['S', 'M', 'L', 'XL', 'XXL'])}
                      className="btn btn-sm btn-ghost"
                      style={{ fontSize: '0.72rem', padding: '2px 8px', color: '#059669', backgroundColor: '#ecfdf5', borderRadius: '4px' }}
                    >
                      All Sapling Sizes (S, M, L, XL, XXL)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPlantSizes(['S', 'M', 'L'])}
                      className="btn btn-sm btn-ghost"
                      style={{ fontSize: '0.72rem', padding: '2px 8px', color: '#475569', backgroundColor: '#f1f5f9', borderRadius: '4px' }}
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

                {/* Optional Custom Size Add */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Add custom size (e.g. 14 inch, 4-5 ft, 25 kg bag)"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSize();
                      }
                    }}
                    style={{ maxWidth: '320px', height: '32px', fontSize: '0.78rem' }}
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

                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                  💡 <em>You can set individual prices for each size or apply a unified price across all sizes in Section 5 below.</em>
                </div>
              </div>
            )}

            {/* Specialized Category Fields based on selected Type */}
            {/* 1. Nursery Plants (Nikhlesh Nursery) */}
            {type === 'nursery-plants' && (
              <div className="form-grid-3" style={{ gap: '12px 16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Container / Bag Type</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nurseryPlantAttributes.bag_type}
                    onChange={(e) => setNurseryPlantAttributes({ ...nurseryPlantAttributes, bag_type: e.target.value })}
                    placeholder="e.g. 8 inch Black Polybag, Bare Root, Terracotta"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Sunlight Requirement</label>
                  <select
                    className="form-select"
                    value={nurseryPlantAttributes.sunlight}
                    onChange={(e) => setNurseryPlantAttributes({ ...nurseryPlantAttributes, sunlight: e.target.value })}
                  >
                    <option value="Full Sunlight">Full Direct Sun (6+ hrs)</option>
                    <option value="Partial Shade">Partial Shade / Morning Sun</option>
                    <option value="Bright Indirect">Bright Indirect Light</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Watering Schedule</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nurseryPlantAttributes.watering}
                    onChange={(e) => setNurseryPlantAttributes({ ...nurseryPlantAttributes, watering: e.target.value })}
                    placeholder="e.g. Daily in summer, 2x weekly in winter"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Growth / Plant Usage</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nurseryPlantAttributes.growth_habit}
                    onChange={(e) => setNurseryPlantAttributes({ ...nurseryPlantAttributes, growth_habit: e.target.value })}
                    placeholder="e.g. Flowering Shrub, Hedge & Boundary, Avenue Tree"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Maintenance Difficulty</label>
                  <select
                    className="form-select"
                    value={nurseryPlantAttributes.difficulty}
                    onChange={(e) => setNurseryPlantAttributes({ ...nurseryPlantAttributes, difficulty: e.target.value })}
                  >
                    <option value="Easy">Easy / Hardy Garden Stock</option>
                    <option value="Moderate">Moderate Care</option>
                    <option value="High">High / Specialist Care</option>
                  </select>
                </div>
              </div>
            )}

            {/* 2. Fruit Trees (Nikhlesh Nursery) */}
            {type === 'fruit-trees' && (
              <div className="form-grid-3" style={{ gap: '12px 16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Graft / Propagation Type</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fruitTreeAttributes.graft_type}
                    onChange={(e) => setFruitTreeAttributes({ ...fruitTreeAttributes, graft_type: e.target.value })}
                    placeholder="e.g. Grafted (High Yield), Air Layered, Hybrid"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Fruiting Season & Age</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fruitTreeAttributes.fruiting_season}
                    onChange={(e) => setFruitTreeAttributes({ ...fruitTreeAttributes, fruiting_season: e.target.value })}
                    placeholder="e.g. 1st Year Fruiting, Summer Season"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Polybag / Container Size</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fruitTreeAttributes.container_type}
                    onChange={(e) => setFruitTreeAttributes({ ...fruitTreeAttributes, container_type: e.target.value })}
                    placeholder="e.g. 10x12 inch Heavy Polybag, Drum"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Mature Tree Height</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fruitTreeAttributes.mature_height}
                    onChange={(e) => setFruitTreeAttributes({ ...fruitTreeAttributes, mature_height: e.target.value })}
                    placeholder="e.g. Dwarf / Pot-friendly (6-8 ft), Standard (15-20 ft)"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Pollination</label>
                  <select
                    className="form-select"
                    value={fruitTreeAttributes.pollination}
                    onChange={(e) => setFruitTreeAttributes({ ...fruitTreeAttributes, pollination: e.target.value })}
                  >
                    <option value="Self-fertile">Self-fertile (Single plant yields fruit)</option>
                    <option value="Cross-pollinated">Cross-pollinated (Requires partner plant)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 3. Seeds & Bulbs (Nikhlesh Nursery) */}
            {type === 'seeds-bulbs' && (
              <div className="form-grid-2" style={{ gap: '12px 16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Seed Variety / Quality</label>
                  <input
                    type="text"
                    className="form-input"
                    value={seedsBulbsAttributes.variety}
                    onChange={(e) => setSeedsBulbsAttributes({ ...seedsBulbsAttributes, variety: e.target.value })}
                    placeholder="e.g. F1 Hybrid, Desi Heirloom, Export Quality"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Sowing Season</label>
                  <input
                    type="text"
                    className="form-input"
                    value={seedsBulbsAttributes.sowing_season}
                    onChange={(e) => setSeedsBulbsAttributes({ ...seedsBulbsAttributes, sowing_season: e.target.value })}
                    placeholder="e.g. All Season, Kharif (June-July), Rabi (Oct-Nov)"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Packet Packaging / Quantity</label>
                  <input
                    type="text"
                    className="form-input"
                    value={seedsBulbsAttributes.pack_quantity}
                    onChange={(e) => setSeedsBulbsAttributes({ ...seedsBulbsAttributes, pack_quantity: e.target.value })}
                    placeholder="e.g. 50 seeds pack, 10g pouch, 1 bulb"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Germination Time</label>
                  <input
                    type="text"
                    className="form-input"
                    value={seedsBulbsAttributes.germination_days}
                    onChange={(e) => setSeedsBulbsAttributes({ ...seedsBulbsAttributes, germination_days: e.target.value })}
                    placeholder="e.g. 5-8 days, 10-14 days"
                  />
                </div>
              </div>
            )}

            {/* 4. Soil & Manure (Nikhlesh Nursery) */}
            {type === 'soil-manure' && (
              <div className="form-grid-2" style={{ gap: '12px 16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Composition / Soil Formulation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={soilManureAttributes.composition}
                    onChange={(e) => setSoilManureAttributes({ ...soilManureAttributes, composition: e.target.value })}
                    placeholder="e.g. 100% Organic Vermicompost, Red Soil & Cocopeat Mix"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Packaging / Unit Weight</label>
                  <input
                    type="text"
                    className="form-input"
                    value={soilManureAttributes.pack_weight}
                    onChange={(e) => setSoilManureAttributes({ ...soilManureAttributes, pack_weight: e.target.value })}
                    placeholder="e.g. 5 kg Bag, 25 kg Nursery Sack, 50 kg Bulk Bag"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">100% Organic?</label>
                  <select
                    className="form-select"
                    value={soilManureAttributes.is_organic}
                    onChange={(e) => setSoilManureAttributes({ ...soilManureAttributes, is_organic: e.target.value })}
                  >
                    <option value="Yes (Certified Natural)">Yes (100% Natural / Organic)</option>
                    <option value="Enriched Mix">Enriched with NPK Boosters</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Application Notes / Dosage</label>
                  <input
                    type="text"
                    className="form-input"
                    value={soilManureAttributes.usage_notes}
                    onChange={(e) => setSoilManureAttributes({ ...soilManureAttributes, usage_notes: e.target.value })}
                    placeholder="e.g. Apply 200g per pot monthly, mix 1:1 with soil"
                  />
                </div>
              </div>
            )}

            {/* 5. Nursery Pots (Nikhlesh Nursery) */}
            {type === 'nursery-pots' && (
              <div className="form-grid-2" style={{ gap: '12px 16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Material</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nurseryPotAttributes.material}
                    onChange={(e) => setNurseryPotAttributes({ ...nurseryPotAttributes, material: e.target.value })}
                    placeholder="e.g. Heavy Duty UV Plastic, Terracotta Clay, Fabric Grow Bag"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Pot Size / Diameter</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nurseryPotAttributes.pot_size}
                    onChange={(e) => setNurseryPotAttributes({ ...nurseryPotAttributes, pot_size: e.target.value })}
                    placeholder="e.g. 8 inch, 10 inch, 12x12 inch"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Color / Finish</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nurseryPotAttributes.color}
                    onChange={(e) => setNurseryPotAttributes({ ...nurseryPotAttributes, color: e.target.value })}
                    placeholder="e.g. Black, Terracotta / Brick Red, Green"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Drainage Holes</label>
                  <select
                    className="form-select"
                    value={nurseryPotAttributes.drainage}
                    onChange={(e) => setNurseryPotAttributes({ ...nurseryPotAttributes, drainage: e.target.value })}
                  >
                    <option value="Yes">Yes (Multiple drainage holes)</option>
                    <option value="No">No (Solid container / Cachepot)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 6. Cactus & Succulents (Grow Naturals) */}
            {type === 'cactus' && (
              <div className="form-grid-3" style={{ gap: '12px 16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Pot / Container Size</label>
                  <input
                    type="text"
                    className="form-input"
                    value={cactusAttributes.pot_size}
                    onChange={(e) => setCactusAttributes({ ...cactusAttributes, pot_size: e.target.value })}
                    placeholder="e.g. 3 inch terracotta, 4 inch pot"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Cactus Variety / Spine Type</label>
                  <input
                    type="text"
                    className="form-input"
                    value={cactusAttributes.variety_type}
                    onChange={(e) => setCactusAttributes({ ...cactusAttributes, variety_type: e.target.value })}
                    placeholder="e.g. Desert Spiny, Haworthia, Echeveria"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Sunlight Requirement</label>
                  <select
                    className="form-select"
                    value={cactusAttributes.sunlight}
                    onChange={(e) => setCactusAttributes({ ...cactusAttributes, sunlight: e.target.value })}
                  >
                    <option value="Direct sun">Full / Direct Sunlight</option>
                    <option value="Bright indirect">Bright Indirect Sun</option>
                    <option value="Partial shade">Partial Shade</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Watering Frequency</label>
                  <input
                    type="text"
                    className="form-input"
                    value={cactusAttributes.watering}
                    onChange={(e) => setCactusAttributes({ ...cactusAttributes, watering: e.target.value })}
                    placeholder="e.g. 1x every 2-3 weeks, When dry"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Maintenance Difficulty</label>
                  <select
                    className="form-select"
                    value={cactusAttributes.difficulty}
                    onChange={(e) => setCactusAttributes({ ...cactusAttributes, difficulty: e.target.value })}
                  >
                    <option value="Very Easy">Very Easy / Hardy</option>
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                  </select>
                </div>
              </div>
            )}

            {/* 7. Pots & Planters (Grow Naturals) */}
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

            {/* 8. Fertilizers (Grow Naturals) */}
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

            {/* 9. Flowers & Decor (Grow Naturals) */}
            {type === 'flowers' && (
              <div className="form-grid-2" style={{ gap: '12px 16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Occasion / Theme</label>
                  <input
                    type="text"
                    className="form-input"
                    value={flowerAttributes.occasion}
                    onChange={(e) => setFlowerAttributes({ ...flowerAttributes, occasion: e.target.value })}
                    placeholder="e.g. Anniversary, Celebration, Sympathy"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Arrangement Style</label>
                  <input
                    type="text"
                    className="form-input"
                    value={flowerAttributes.arrangement_style}
                    onChange={(e) => setFlowerAttributes({ ...flowerAttributes, arrangement_style: e.target.value })}
                    placeholder="e.g. Hand-tied bouquet, Glass vase, Basket"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Vase Included?</label>
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

            {/* Fallback for other custom categories */}
            {!['plants', 'nursery-plants', 'fruit-trees', 'cactus', 'pots', 'fertilizers', 'flowers', 'seeds-bulbs', 'soil-manure', 'nursery-pots'].includes(type) && (
              <div className="form-grid-2" style={{ gap: '12px 16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Specification / Type</label>
                  <input
                    type="text"
                    className="form-input"
                    value={customAttributes.specification}
                    onChange={(e) => setCustomAttributes({ ...customAttributes, specification: e.target.value })}
                    placeholder="e.g. Variety, grade, model"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Size or Dimensions</label>
                  <input
                    type="text"
                    className="form-input"
                    value={customAttributes.size_or_dimension}
                    onChange={(e) => setCustomAttributes({ ...customAttributes, size_or_dimension: e.target.value })}
                    placeholder="e.g. 500g, 10x12 inches, Standard"
                  />
                </div>
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

          {/* Section 5: Pricing & Taxation */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IndianRupee size={14} style={{ color: 'var(--module-inv-accent)' }} /> Pricing & Taxation
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
                      id="sameAmountToggle"
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
                    <label htmlFor="sameAmountToggle" style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer', margin: 0 }}>
                      Set same amount for all sizes
                    </label>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      (Applies the exact same price across {selectedPlantSizes.join(', ')})
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
                          placeholder="0, 5, 12, 18"
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
                      placeholder="e.g. 0602"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className={isTaxable ? "form-grid-4" : "form-grid-3"} style={{ gap: '12px 16px' }}>
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
                        placeholder="0, 5, 12, 18"
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
                    placeholder="e.g. 0602"
                  />
                </div>
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

          {/* Section 6: Stock Quantities */}
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

          {/* Section 7: Add Discount / Volume Discount (Optional) */}
          <div className="form-section-card" style={{ padding: '14px 18px', marginTop: '2px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <div className="form-section-header" style={{ marginBottom: '12px', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="form-section-title" style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#1e293b' }}>
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
