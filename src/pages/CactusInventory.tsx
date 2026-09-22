import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Product } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Link } from 'react-router-dom';
import { Plus, Sun, Droplets, ArrowRight, Sparkles } from 'lucide-react';

export const CactusInventory: React.FC = () => {
  const { businessId, business } = useBusiness();
  const [cacti, setCacti] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api
      .get('/products', { business_id: businessId, type: 'cactus', search: search.trim() })
      .then((data) => {
        if (isMounted) setCacti(data);
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [businessId, search]);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">
            <span>Cactus & Succulents Inventory</span>
            <Badge variant="inv">{business?.name}</Badge>
          </h1>
          <p className="page-description">
            Desert flora, drought-tolerant succulents, pot sizes, sunlight requirements, and watering schedules.
          </p>
        </div>

        <div className="page-actions" style={{ display: 'flex', gap: '8px' }}>
          <Link to="/inventory/new" className="btn btn-secondary">
            <Plus size={15} /> Add Inventory
          </Link>
          <Link to="/products/new?type=cactus" className="btn btn-inv">
            <Plus size={16} /> Add Cactus / Succulent
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search cactus by botanical name, variety, pot size, or SKU..."
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Loading cactus inventory...</div>
      ) : cacti.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No Cactus or Succulents Found"
          description={`No cactus records found in ${business?.name}. Add your first cactus to track desert flora.`}
          actionText="Add Cactus"
          actionLink="/products/new"
          accentClass="btn-inv"
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Cactus Name & Variety</th>
                <th>Pot / Container</th>
                <th>Variety / Spine</th>
                <th>Sunlight Needs</th>
                <th>Watering Schedule</th>
                <th>Hardiness</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cacti.map((p) => {
                const attrs = typeof p.attributes === 'string' ? JSON.parse(p.attributes) : (p.attributes || {});
                const isLow = p.stock_quantity <= p.low_stock_threshold;
                const isOut = p.stock_quantity <= 0;

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>🌵</span>
                        <div>
                          <Link to={`/products/${p.id}`} style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {p.name}
                          </Link>
                          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                            SKU: {p.sku}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>{attrs.pot_size || '—'}</td>
                    <td>{attrs.variety_type || 'Desert Flora'}</td>

                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <Sun size={13} color="#d97706" />
                        {attrs.sunlight || 'Direct Sun'}
                      </span>
                    </td>

                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <Droplets size={13} color="#0284c7" />
                        {attrs.watering || '1x every 2-3 wks'}
                      </span>
                    </td>

                    <td>
                      <Badge variant="neutral">{attrs.difficulty || 'Hardy'}</Badge>
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular">
                      ₹{Number(p.sale_price).toFixed(2)}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}>
                        {p.stock_quantity} left
                      </Badge>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/products/${p.id}`} className="btn btn-secondary btn-sm">
                        View <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
