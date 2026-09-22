import React, { useState, useRef, useEffect } from 'react';
import type { Product } from '../../types';
import { Search, ChevronDown, Check, X, Plus } from 'lucide-react';

interface ProductSearchSelectProps {
  products: Product[];
  value: string;
  selectedProductId?: string;
  onChange: (productName: string, product?: Product) => void;
  placeholder?: string;
}

export const ProductSearchSelect: React.FC<ProductSearchSelectProps> = ({
  products,
  value,
  selectedProductId,
  onChange,
  placeholder = 'Search inventory product...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = products.filter((p) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.type && p.type.toLowerCase().includes(q))
    );
  });

  const handleSelect = (product: Product) => {
    setQuery(product.name);
    onChange(product.name, product);
    setIsOpen(false);
  };

  const handleCustomUse = () => {
    onChange(query, undefined);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    onChange('', undefined);
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'plants': return '🌱';
      case 'pots': return '🪴';
      case 'fertilizers': return '🧪';
      case 'flowers': return '💐';
      default: return '📦';
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%'
        }}
      >
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: '10px',
            color: 'var(--color-text-dim)',
            pointerEvents: 'none'
          }}
        />

        <input
          type="text"
          className="form-input"
          style={{
            paddingLeft: '32px',
            paddingRight: query ? '50px' : '28px',
            fontSize: '0.8125rem',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-bg-surface)'
          }}
          placeholder={placeholder}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value, undefined);
            setIsOpen(true);
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {query && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-dim)',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Clear"
            >
              <X size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-dim)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: '260px',
            overflowY: 'auto',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            padding: '4px'
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '10px 12px', fontSize: '0.78rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              No inventory products found matching "{query}".
            </div>
          ) : (
            filtered.map((prod) => {
              const isSelected = selectedProductId === prod.id || value === prod.name;
              return (
                <div
                  key={prod.id}
                  onClick={() => handleSelect(prod)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'var(--color-botanical-50)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '1.1rem' }}>{getCategoryIcon(prod.type)}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {prod.name}
                      </span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                        <span>SKU: {prod.sku || '—'}</span>
                        <span style={{ color: prod.stock_quantity <= (prod.low_stock_threshold || 5) ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                          Stock: <strong>{prod.stock_quantity}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-botanical-700)' }} className="tabular">
                      ₹{Number(prod.sale_price).toFixed(2)}
                    </span>
                    {isSelected && <Check size={14} style={{ color: 'var(--color-botanical-600)' }} />}
                  </div>
                </div>
              );
            })
          )}

          {query && (
            <div
              onClick={handleCustomUse}
              style={{
                borderTop: '1px solid var(--color-border)',
                marginTop: '4px',
                padding: '8px 10px',
                fontSize: '0.78rem',
                color: 'var(--module-sell-accent)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--module-sell-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Plus size={13} /> Use custom item: "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
