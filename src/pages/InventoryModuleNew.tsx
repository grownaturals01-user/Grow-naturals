import React, { useState } from 'react';
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
  Smile,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Leaf
} from 'lucide-react';

const PRESET_ICONS = [
  { emoji: '🎋', label: 'Bonsai / Bamboo' },
  { emoji: '🌴', label: 'Palm / Tropical' },
  { emoji: '🌲', label: 'Conifer / Pine' },
  { emoji: '🌾', label: 'Seeds / Bulbs' },
  { emoji: '🍀', label: 'Herbs / Greens' },
  { emoji: '🌻', label: 'Sunflowers / Blooms' },
  { emoji: '🌺', label: 'Exotics / Orchids' },
  { emoji: '🍄', label: 'Fungi / Spores' },
  { emoji: '🪓', label: 'Tools / Shears' },
  { emoji: '🏺', label: 'Clay / Vases' },
  { emoji: '🌿', label: 'Botanicals' },
  { emoji: '🪴', label: 'Pots & Trays' },
  { emoji: '🌵', label: 'Succulents' },
  { emoji: '🍃', label: 'Foliage' },
  { emoji: '🍂', label: 'Dry Goods' },
  { emoji: '🛠️', label: 'Supplies / Hardware' },
];

export const InventoryModuleNew: React.FC = () => {
  const { businessId, business } = useBusiness();
  const { addModule } = useInventoryModules();
  const navigate = useNavigate();

  const [name, setName] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState<string>('🎋');
  const [customIcon, setCustomIcon] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeIcon = customIcon.trim() || selectedIcon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter an inventory module name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const newModule = await addModule({
        name: name.trim(),
        caption: caption.trim(),
        icon: activeIcon,
        image_url: imageUrl.trim(),
        slug,
      });

      // Redirect directly to the newly created inventory page
      navigate(`/inventory/custom/${newModule.slug}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create inventory module');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '860px', width: '100%', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Breadcrumb & Header */}
      <div className="page-header" style={{ marginBottom: '18px' }}>
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
            <ArrowLeft size={15} /> Back to Inventory
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ fontSize: '1.4rem', margin: 0 }}>
              Add New Inventory Module
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
            Create a custom inventory category with its own dedicated inventory table, sidebar link, and product classification.
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

      {/* Main Creation Card */}
      <form onSubmit={handleSubmit} className="card" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="card-body" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* 1. Module Name */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              <Layers size={15} style={{ color: 'var(--module-inv-accent)' }} /> Inventory Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bonsai Trees, Garden Tools, Seeds & Bulbs, Hanging Plants"
              required
              autoFocus
              style={{ fontSize: '0.95rem', padding: '10px 14px' }}
            />
            <span className="form-helper">
              This creates a dedicated "{name.trim() || 'Custom'} Inventory" page and category option.
            </span>
          </div>

          {/* 2. Caption / Description */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              <FileText size={15} style={{ color: 'var(--module-inv-accent)' }} /> Caption / Description
            </label>
            <input
              type="text"
              className="form-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Live miniature specimen trees, shaping wires, and specialized tools"
              style={{ fontSize: '0.9rem', padding: '9px 12px' }}
            />
            <span className="form-helper">
              Shown in the page banner subtitle and product category selector.
            </span>
          </div>

          {/* 3. Icon / Emoji Picker */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
                <Smile size={15} style={{ color: 'var(--module-inv-accent)' }} /> Choose Icon / Emoji Badge
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Displayed in sidebar and category tabs
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: '8px', marginBottom: '12px' }}>
              {PRESET_ICONS.map((item) => {
                const isSelected = activeIcon === item.emoji;
                return (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() => {
                      setSelectedIcon(item.emoji);
                      setCustomIcon('');
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 6px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--color-botanical-600)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-botanical-50)' : 'var(--color-bg-surface)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{item.emoji}</span>
                    <span style={{ fontSize: '0.68rem', marginTop: '4px', color: isSelected ? 'var(--color-botanical-800)' : 'var(--color-text-muted)', fontWeight: isSelected ? 700 : 500, textAlign: 'center', lineHeight: 1.1 }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                Or enter custom emoji:
              </div>
              <input
                type="text"
                className="form-input"
                style={{ width: '120px', textAlign: 'center', fontSize: '1.1rem' }}
                value={customIcon}
                onChange={(e) => setCustomIcon(e.target.value)}
                placeholder="e.g. 🎋"
                maxLength={4}
              />
            </div>
          </div>

          {/* 4. Optional Image / Cover */}
          <div style={{ paddingTop: '4px' }}>
            <ProductImageUploader
              value={imageUrl}
              onChange={setImageUrl}
              label="Module Banner / Photo (Optional)"
              productType="general"
            />
          </div>

          {/* 5. Real-Time Live Preview */}
          <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={13} color="#059669" /> Live Preview in System
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {/* Sidebar Link Preview */}
              <div style={{ background: '#062c1e', color: '#ffffff', borderRadius: '8px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', fontWeight: 600 }}>
                <span>{activeIcon}</span>
                <span>{name.trim() || 'New Module'} Inventory</span>
              </div>

              {/* Category Card Preview */}
              <div style={{ background: '#ffffff', border: '2px solid #059669', borderRadius: '8px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem' }}>
                <span style={{ fontSize: '1.3rem' }}>{activeIcon}</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{name.trim() || 'New Module'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{caption.trim() || 'Custom inventory workflow'}</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="card-footer" style={{ padding: '16px 28px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--color-border)' }}>
          <Link to="/products" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-inv"
            disabled={isSubmitting || !name.trim()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: '150px', justifyContent: 'center' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating...
              </>
            ) : (
              <>
                <PlusCircle size={16} /> Add Inventory
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
