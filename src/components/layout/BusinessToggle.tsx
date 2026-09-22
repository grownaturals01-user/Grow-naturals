import React from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Leaf, Sprout } from 'lucide-react';

export const BusinessToggle: React.FC = () => {
  const { businessId, switchBusiness } = useBusiness();

  return (
    <div className="business-toggle-container" role="radiogroup" aria-label="Business Selection">
      <button
        type="button"
        className={`biz-pill biz-pill-gn ${businessId === 'grow-naturals' ? 'active' : ''}`}
        onClick={() => switchBusiness('grow-naturals')}
        title="Switch to Grow Naturals (Taxable with GST)"
      >
        <Leaf size={14} />
        <span>Grow Naturals</span>
        <span className="biz-tag">GST</span>
      </button>

      <button
        type="button"
        className={`biz-pill biz-pill-nn ${businessId === 'nikhlesh-nursery' ? 'active' : ''}`}
        onClick={() => switchBusiness('nikhlesh-nursery')}
        title="Switch to Nikhlesh Nursery"
      >
        <Sprout size={14} />
        <span>Nikhlesh Nursery</span>
        <span className="biz-tag">NURSERY</span>
      </button>
    </div>
  );
};
