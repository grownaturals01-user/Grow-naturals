import React, { useState, useRef, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Store, Leaf, Sprout, ChevronDown, Check, Building2 } from 'lucide-react';

export const BusinessDropdown: React.FC = () => {
  const { businessId, businesses, switchBusiness } = useBusiness();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const allOption = { id: 'all', name: 'All Businesses', desc: 'Combined view across all stores' };
  const baseList = [
    allOption,
    { id: 'grow-naturals', name: 'Grow Naturals', desc: 'GST Taxable Store & POS' },
    { id: 'nikhlesh-nursery', name: 'Nikhlesh Nursery', desc: '0% Tax Agricultural Sales' }
  ];

  // Merge with any custom registered businesses
  const customList = businesses.filter(b => b.id !== 'grow-naturals' && b.id !== 'nikhlesh-nursery' && b.id !== 'all');
  const fullList = [
    allOption,
    ...businesses.length > 0 ? businesses.filter(b => b.id !== 'all') : baseList.filter(b => b.id !== 'all')
  ];

  const getBusinessIcon = (id: string) => {
    if (id === 'all') return <Building2 size={16} color="#ffffff" />;
    if (id === 'grow-naturals') return <Leaf size={16} color="#ffffff" />;
    if (id === 'nikhlesh-nursery') return <Sprout size={16} color="#ffffff" />;
    return <Store size={16} color="#ffffff" />;
  };

  const getIconBg = (id: string) => {
    if (id === 'all') return '#111c2d';
    if (id === 'grow-naturals') return '#16a34a';
    if (id === 'nikhlesh-nursery') return '#ff9f43';
    return '#4f46e5';
  };

  const currentSelection = fullList.find(b => b.id === businessId) || allOption;

  return (
    <div className="dash-biz-dropdown-wrap" ref={dropdownRef}>
      <button
        type="button"
        className="dash-biz-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="dash-biz-trigger-icon" style={{ backgroundColor: getIconBg(businessId) }}>
          {getBusinessIcon(businessId)}
        </div>
        <span className="dash-biz-trigger-name">{currentSelection.name}</span>
        <ChevronDown size={14} className={`dash-biz-chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="dash-biz-menu">
          <div className="dash-biz-menu-header">
            <span>Select Active Store</span>
          </div>

          <div className="dash-biz-menu-list">
            {fullList.map((biz) => {
              const isSelected = biz.id === businessId;
              return (
                <button
                  key={biz.id}
                  type="button"
                  className={`dash-biz-menu-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    switchBusiness(biz.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="dash-biz-item-icon" style={{ backgroundColor: getIconBg(biz.id) }}>
                    {getBusinessIcon(biz.id)}
                  </div>
                  <div className="dash-biz-item-text">
                    <span className="dash-biz-item-name">{biz.name}</span>
                    <span className="dash-biz-item-desc">
                      {(biz as any).desc || (biz.id === 'all' ? 'Combined View' : (biz as any).legal_name || 'Store Location')}
                    </span>
                  </div>
                  {isSelected && <Check size={14} className="dash-biz-check" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
