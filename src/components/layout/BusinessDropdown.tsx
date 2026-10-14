import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { Store, Leaf, Sprout, ChevronDown, Check, Building2, CheckCircle2, ArrowRight } from 'lucide-react';

export const BusinessDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { businessId, businesses, switchBusiness, isBizActive, activateAllBusinesses } = useBusiness();
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

  const allOption = {
    id: 'all',
    name: 'All Businesses (Both Stores Active)',
    shortName: 'All Businesses',
    desc: 'Combined view across both stores simultaneously'
  };

  const baseList = [
    { id: 'grow-naturals', name: 'Grow Naturals', desc: 'GST Taxable Store & POS' },
    { id: 'nikhlesh-nursery', name: 'Nikhlesh Nursery', desc: '0% Tax Agricultural Sales' }
  ];

  const individualList = businesses.length > 0
    ? businesses.filter(b => b.id !== 'all')
    : baseList;

  const fullList = [allOption, ...individualList];

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
  const activeCount = individualList.filter(b => isBizActive(b.id)).length;
  const isCurrentActive = businessId === 'all' || isBizActive(businessId);

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
        <span className="dash-biz-trigger-name">
          {businessId === 'all' ? 'All Businesses (Both Active)' : currentSelection.name}
        </span>
        {isCurrentActive && <span className="dash-biz-active-indicator" title="Active Business" />}
        <ChevronDown size={14} className={`dash-biz-chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="dash-biz-menu" style={{ minWidth: '320px' }}>
          <div className="dash-biz-menu-header d-flex justify-content-between align-items-center">
            <span>Stores & Scope</span>
            <span className="badge bg-success-subtle text-success fs-10 fw-bold">
              {activeCount} of {individualList.length} Active
            </span>
          </div>

          <div className="dash-biz-action-row">
            <button
              type="button"
              className="btn btn-xs btn-outline-success d-inline-flex align-items-center py-1 px-2 fs-11"
              onClick={async () => {
                await activateAllBusinesses();
              }}
              title="Ensure both/all registered businesses are Active"
            >
              <CheckCircle2 size={12} className="me-1" />
              Active Both / All Stores
            </button>
            <button
              type="button"
              className="btn btn-xs btn-link text-primary text-decoration-none p-0 fs-11"
              onClick={() => {
                setIsOpen(false);
                navigate('/business-list');
              }}
              title="Open Business List settings page"
            >
              Business List <ArrowRight size={11} className="ms-1" />
            </button>
          </div>

          <div className="dash-biz-menu-list">
            {fullList.map((biz) => {
              const isSelected = biz.id === businessId;
              const isAll = biz.id === 'all';
              const active = isAll ? true : isBizActive(biz.id);

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
                    <div className="d-flex align-items-center">
                      <span className="dash-biz-item-name">{biz.name}</span>
                      <span className={`dash-biz-status-pill ${active ? 'active' : 'inactive'}`}>
                        {isAll ? 'Both Active' : active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <span className="dash-biz-item-desc">
                      {(biz as any).desc || (biz as any).legal_name || 'Store Location'}
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
