import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import { useInventoryModules } from '../context/InventoryModulesContext';
import { ProductImageUploader } from '../components/common/ProductImageUploader';
import {
  ArrowLeft,
  PlusCircle,
  Sparkles,
  Layers,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Leaf,
  Globe,
  Check,
  Eye,
  LayoutDashboard,
  ShoppingCart,
  Image as ImageIcon
} from 'lucide-react';
import {
  MODULE_ICON_PRESETS,
  renderModuleIcon,
  CategoryIconBadge
} from '../components/common/CategoryIcons';

type FilterGroup = 'All' | 'Plants & Botany' | 'Flowers & Seeds' | 'Pots & Decor' | 'Tools & Supplies';

export const InventoryModuleNew: React.FC = () => {
  const { businessId, business } = useBusiness();
  const { addModule } = useInventoryModules();
  const navigate = useNavigate();

  const [name, setName] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('bamboo');
  const [customIcon, setCustomIcon] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<FilterGroup>('All');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active icon identifier: custom write-in takes precedence, else selected preset id
  const activeIcon = customIcon.trim() || selectedPresetId;

  // Auto-generate URL slug
  const slug = useMemo(() => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }, [name]);

  // Filter presets
  const filteredPresets = useMemo(() => {
    if (selectedGroup === 'All') return MODULE_ICON_PRESETS;
    return MODULE_ICON_PRESETS.filter((p) => p.group === selectedGroup);
  }, [selectedGroup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter an inventory module name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const newModule = await addModule({
        name: name.trim(),
        caption: caption.trim(),
        icon: activeIcon,
        image_url: imageUrl.trim(),
        slug: slug || 'custom-inventory',
      });

      // Redirect directly to the newly created inventory page
      navigate(`/inventory/custom/${newModule.slug}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create inventory module');
      setIsSubmitting(false);
    }
  };

  const displayName = name.trim() || 'Custom Inventory';
  const displayCaption = caption.trim() || 'Dedicated inventory records & specialized stock tracking.';

  return (
    <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Top Navigation & Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
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
              marginBottom: '8px',
              transition: 'color var(--transition-fast)'
            }}
          >
            <ArrowLeft size={15} /> Back to Products
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ fontSize: '1.45rem', margin: 0, letterSpacing: '-0.01em' }}>
              Add New Inventory Module
            </h1>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 10px',
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

          <p className="page-description" style={{ fontSize: '0.84rem', marginTop: '4px' }}>
            Create a specialized inventory section with its own dedicated stock manager, sidebar navigation link, and category classification.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            backgroundColor: 'var(--color-danger-subtle)',
            color: 'var(--color-danger-text)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.84rem', fontWeight: 500 }}>{errorMessage}</span>
        </div>
      )}

      {/* Main Full-Width Form Layout */}
      <form onSubmit={handleSubmit} className="module-new-layout">
        
        {/* LEFT COLUMN: Configuration Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section 1: Module Identity */}
          <div className="card" style={{ boxShadow: 'var(--shadow-xs)' }}>
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)' }}>
                <Layers size={16} style={{ color: 'var(--color-botanical-600)' }} /> Module Identity & URL
              </h2>
            </div>
            
            <div className="card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  Inventory Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bonsai Trees, Garden Tools, Seeds & Bulbs, Hanging Plants"
                  required
                  autoFocus
                  style={{ fontSize: '0.95rem', height: '42px' }}
                />
                
                {/* Live Route Slug Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '8px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-bg-surface-subtle)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.74rem',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  <Globe size={13} style={{ color: 'var(--color-botanical-600)', flexShrink: 0 }} />
                  <span>
                    URL Route: <strong style={{ color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>/inventory/custom/{slug || 'custom-inventory'}</strong>
                  </span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  Caption / Subtitle Description
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Live miniature specimen trees, shaping wires, and specialized tools"
                  style={{ fontSize: '0.875rem', height: '40px' }}
                />
                <span className="form-helper" style={{ fontSize: '0.72rem', marginTop: '4px' }}>
                  Shown in the inventory page banner and product category selector descriptions.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Choose Icon & Visual Style */}
          <div className="card" style={{ boxShadow: 'var(--shadow-xs)' }}>
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)' }}>
                  <Sparkles size={16} style={{ color: 'var(--color-botanical-600)' }} /> Choose Module Icon
                </h2>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '2px' }}>
                  Professional vector icon displayed across sidebar, stock manager, and POS
                </span>
              </div>

              {/* Group Filter Tabs */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {(['All', 'Plants & Botany', 'Flowers & Seeds', 'Pots & Decor', 'Tools & Supplies'] as FilterGroup[]).map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setSelectedGroup(grp)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      fontWeight: selectedGroup === grp ? 700 : 500,
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid',
                      borderColor: selectedGroup === grp ? 'var(--color-botanical-600)' : 'var(--color-border)',
                      backgroundColor: selectedGroup === grp ? 'var(--color-botanical-50)' : 'transparent',
                      color: selectedGroup === grp ? 'var(--color-botanical-800)' : 'var(--color-text-muted)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {grp}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-body" style={{ padding: '20px' }}>
              {/* Grid of Preset Icons */}
              <div className="module-icon-grid" style={{ marginBottom: '18px' }}>
                {filteredPresets.map((preset) => {
                  const isSelected = activeIcon === preset.id && !customIcon.trim();
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`module-icon-card ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedPresetId(preset.id);
                        setCustomIcon('');
                      }}
                    >
                      {isSelected && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            color: 'var(--color-botanical-600)',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <CheckCircle2 size={14} />
                        </span>
                      )}

                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          backgroundColor: preset.bgColor,
                          color: preset.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '8px',
                          transition: 'transform 0.2s ease',
                          transform: isSelected ? 'scale(1.06)' : 'none'
                        }}
                      >
                        {preset.iconComponent(20)}
                      </div>

                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? 'var(--color-botanical-900)' : 'var(--color-text-primary)',
                          lineHeight: 1.2
                        }}
                      >
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Emoji / Character Override */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-bg-surface-subtle)',
                  border: '1px dashed var(--color-border)',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Or enter a custom emoji / character
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    Type an emoji if you prefer a unique symbol (e.g. 🍁, 🍄, 🍋)
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{
                      width: '80px',
                      textAlign: 'center',
                      fontSize: '1.2rem',
                      height: '40px',
                      padding: '4px'
                    }}
                    value={customIcon}
                    onChange={(e) => setCustomIcon(e.target.value)}
                    placeholder="e.g. 🍁"
                    maxLength={4}
                  />

                  {customIcon.trim() && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setCustomIcon('')}
                      style={{ height: '40px' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Module Banner / Image (Optional) */}
          <div className="card" style={{ boxShadow: 'var(--shadow-xs)' }}>
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)' }}>
                <ImageIcon size={16} style={{ color: 'var(--color-botanical-600)' }} /> Module Cover / Photo (Optional)
              </h2>
            </div>
            
            <div className="card-body" style={{ padding: '20px' }}>
              <ProductImageUploader
                value={imageUrl}
                onChange={setImageUrl}
                label="Upload Banner or Section Photo"
                productType="general"
              />
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sticky Live Preview & Action Center */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '84px' }}>
          
          <div className="card" style={{ boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <div
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.08), rgba(13, 148, 136, 0.05))',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={16} style={{ color: 'var(--color-botanical-600)' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Live System Integration
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-botanical-100)',
                  color: 'var(--color-botanical-800)'
                }}
              >
                Auto Preview
              </span>
            </div>

            <div className="card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>
                This module dynamically renders across the navigation, product forms, and register:
              </p>

              {/* Preview 1: Sidebar Navigation Link */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <LayoutDashboard size={12} /> Sidebar Navigation Link
                </div>
                <div
                  style={{
                    backgroundColor: '#062c1e',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', color: '#34d399' }}>
                    {renderModuleIcon(activeIcon, 18)}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName} Inventory
                  </span>
                </div>
              </div>

              {/* Preview 2: Add Product Category Selector Card */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Layers size={12} /> Add Product Category Card
                </div>
                <div
                  className="category-card-btn active"
                  style={{
                    position: 'relative',
                    cursor: 'default',
                    transform: 'none',
                    margin: 0
                  }}
                >
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
                  <CategoryIconBadge type="general" isSelected={true} customIcon={activeIcon} />
                  <div className="category-card-text-group" style={{ overflow: 'hidden' }}>
                    <span className="category-card-title">{displayName}</span>
                    <span className="category-card-desc">{displayCaption}</span>
                  </div>
                </div>
              </div>

              {/* Preview 3: POS Category Tab */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShoppingCart size={12} /> POS Cashier Register Filter
                </div>
                <div style={{ display: 'inline-flex' }}>
                  <div
                    className="category-pill active"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--color-botanical-600)',
                      color: '#ffffff'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {renderModuleIcon(activeIcon, 14)}
                    </span>
                    <span>{displayName}</span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        marginLeft: '4px'
                      }}
                    >
                      18
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview 4: Dedicated Inventory Header */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FileText size={12} /> Stock Header Banner
                </div>
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-bg-surface-subtle)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--module-inv-accent)' }}>
                      {renderModuleIcon(activeIcon, 16)}
                    </span>
                    <strong style={{ fontSize: '0.82rem', color: 'var(--color-text-primary)' }}>
                      {displayName} Inventory
                    </strong>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--color-botanical-100)',
                        color: 'var(--color-botanical-900)'
                      }}
                    >
                      {business?.name || 'Grow Naturals'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayCaption}
                  </div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

              {/* Form Submit & Cancel Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-inv"
                  disabled={isSubmitting || !name.trim()}
                  style={{
                    width: '100%',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 600
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={17} className="animate-spin" /> Creating Module...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={17} /> Add Inventory Module
                    </>
                  )}
                </button>

                <Link
                  to="/products"
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.84rem'
                  }}
                >
                  Cancel
                </Link>
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.3 }}>
                Automates SQL persistence, route mounting, POS filters, and category taxonomy for {business?.name || 'Grow Naturals'}.
              </div>

            </div>
          </div>

        </div>

      </form>
    </div>
  );
};
