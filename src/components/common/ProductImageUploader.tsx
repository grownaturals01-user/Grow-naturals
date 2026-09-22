import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Link2, X, Sparkles, Check } from 'lucide-react';

interface ProductImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  productType?: string;
}

const PRESET_IMAGES: { label: string; url: string; category: string }[] = [
  {
    label: 'Ficus Bonsai',
    category: 'plants',
    url: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=500&auto=format&fit=crop&q=60',
  },
  {
    label: 'Monstera Deliciosa',
    category: 'plants',
    url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=500&auto=format&fit=crop&q=60',
  },
  {
    label: 'Snake Plant Sansevieria',
    category: 'plants',
    url: 'https://images.unsplash.com/photo-1599598425947-5202edd564c5?w=500&auto=format&fit=crop&q=60',
  },
  {
    label: 'Golden Barrel Cactus',
    category: 'cactus',
    url: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=500&auto=format&fit=crop&q=60',
  },
  {
    label: 'Mini Succulent Rosette',
    category: 'cactus',
    url: 'https://images.unsplash.com/photo-1509223197845-458d87318791?w=500&auto=format&fit=crop&q=60',
  },
  {
    label: 'Ceramic Glazed Planter',
    category: 'pots',
    url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&auto=format&fit=crop&q=60',
  },
  {
    label: 'Terracotta Clay Pot',
    category: 'pots',
    url: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=500&auto=format&fit=crop&q=60',
  },
  {
    label: 'Organic Bio-Nutrient Spray',
    category: 'fertilizers',
    url: 'https://images.unsplash.com/photo-1585336261026-7756f7ef506f?w=500&auto=format&fit=crop&q=60',
  },
  {
    label: 'Luxury Orchid & Lily Bouquet',
    category: 'flowers',
    url: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=500&auto=format&fit=crop&q=60',
  },
  {
    label: 'Exotic Rose Arrangement',
    category: 'flowers',
    url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=500&auto=format&fit=crop&q=60',
  },
];

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  value,
  onChange,
  label = 'Product Image',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compress & convert file to data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          onChange(compressedDataUrl);
        } else {
          onChange(event.target?.result as string);
        }
        setIsCompressing(false);
      };
      img.onerror = () => {
        onChange(event.target?.result as string);
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '8px' }}>
        {label}
      </label>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: value ? '140px 1fr' : '1fr',
          gap: '16px',
          alignItems: 'start',
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1',
        }}
      >
        {/* Preview Box */}
        {value ? (
          <div style={{ position: 'relative', width: '140px', height: '140px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <img
              src={value}
              alt="Product Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => onChange('')}
              title="Remove Image"
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.9)',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              <X size={14} />
            </button>
            <div
              style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#ffffff',
                fontSize: '10px',
                textAlign: 'center',
                padding: '2px 0',
                fontWeight: 600,
              }}
            >
              Active Image
            </div>
          </div>
        ) : null}

        {/* Controls Container */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeTab === 'upload' ? '#16a34a' : '#e2e8f0',
                background: activeTab === 'upload' ? '#f0fdf4' : '#ffffff',
                color: activeTab === 'upload' ? '#15803d' : '#64748b',
                cursor: 'pointer',
              }}
            >
              <Upload size={14} /> Upload File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeTab === 'url' ? '#16a34a' : '#e2e8f0',
                background: activeTab === 'url' ? '#f0fdf4' : '#ffffff',
                color: activeTab === 'url' ? '#15803d' : '#64748b',
                cursor: 'pointer',
              }}
            >
              <Link2 size={14} /> Web URL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeTab === 'presets' ? '#16a34a' : '#e2e8f0',
                background: activeTab === 'presets' ? '#f0fdf4' : '#ffffff',
                color: activeTab === 'presets' ? '#15803d' : '#64748b',
                cursor: 'pointer',
              }}
            >
              <Sparkles size={14} /> Quick Presets
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1.5px dashed #94a3b8',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  background: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#16a34a')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#94a3b8')}
              >
                <Upload size={22} style={{ color: '#16a34a', margin: '0 auto 6px auto' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                  {isCompressing ? 'Processing Image...' : 'Click to browse image from device'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                  PNG, JPG, WEBP (auto-optimized for lightning fast POS)
                </div>
              </div>
            </div>
          )}

          {/* URL Tab */}
          {activeTab === 'url' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Paste image link (https://...)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyUrl();
                  }
                }}
                style={{ fontSize: '0.85rem' }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApplyUrl}
                style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              >
                Set Image
              </button>
            </div>
          )}

          {/* Presets Tab */}
          {activeTab === 'presets' && (
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>
                Select sample high-resolution nursery photography:
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '8px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                }}
              >
                {PRESET_IMAGES.map((preset) => {
                  const isSelected = value === preset.url;
                  return (
                    <div
                      key={preset.label}
                      onClick={() => onChange(preset.url)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 6px',
                        background: isSelected ? '#f0fdf4' : '#ffffff',
                        border: '1px solid',
                        borderColor: isSelected ? '#16a34a' : '#e2e8f0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }}
                      />
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {preset.label}
                      </span>
                      {isSelected && <Check size={12} style={{ color: '#16a34a', marginLeft: 'auto' }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
