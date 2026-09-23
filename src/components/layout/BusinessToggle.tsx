import React from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Leaf, Sprout, Store } from 'lucide-react';

export const BusinessToggle: React.FC = () => {
  const { businessId, businesses, switchBusiness } = useBusiness();

  // If businesses list hasn't loaded yet, show default dual toggle
  const list = businesses.length > 0 ? businesses : [
    { id: 'grow-naturals', name: 'Grow Naturals' },
    { id: 'nikhlesh-nursery', name: 'Nikhlesh Nursery' }
  ];

  const getIcon = (id: string) => {
    if (id === 'grow-naturals') return <Leaf size={14} />;
    if (id === 'nikhlesh-nursery') return <Sprout size={14} />;
    return <Store size={14} />;
  };

  const getPillClass = (id: string, isActive: boolean) => {
    let base = 'biz-pill';
    if (id === 'grow-naturals') base += ' biz-pill-gn';
    else if (id === 'nikhlesh-nursery') base += ' biz-pill-nn';
    else base += ' biz-pill-custom';

    if (isActive) base += ' active';
    return base;
  };

  return (
    <div className="business-toggle-container" role="radiogroup" aria-label="Business Selection">
      {list.map((biz) => {
        const isActive = biz.id === businessId;
        const isGst = (biz as any).is_taxable ?? (biz.id === 'grow-naturals');
        return (
          <button
            key={biz.id}
            type="button"
            className={getPillClass(biz.id, isActive)}
            onClick={() => switchBusiness(biz.id)}
            title={`Switch to ${biz.name}`}
          >
            {getIcon(biz.id)}
            <span>{biz.name}</span>
            {isGst ? (
              <span className="biz-tag">GST</span>
            ) : biz.id === 'nikhlesh-nursery' ? (
              <span className="biz-tag">NURSERY</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};
