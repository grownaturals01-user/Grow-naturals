import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Product } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Link } from 'react-router-dom';
import { Box, Plus, ArrowRight } from 'lucide-react';

export const PotsInventory: React.FC = () => {
  const { businessId, business } = useBusiness();
  const [pots, setPots] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api
      .get('/products', { business_id: businessId, type: 'pots', search: search.trim() })
      .then((data) => {
        if (isMounted) setPots(data);
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
            <span>Pots & Planters Inventory</span>
            <Badge variant="inv">{business?.name}</Badge>
          </h1>
          <p className="page-description">
            Ceramic planters, grow bags, terracotta pots, and drainage specifications.
          </p>
        </div>

        <div className="page-actions">
          <Link to="/products/new" className="btn btn-inv">
            <Plus size={16} /> Add Pot / Planter
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search pots by material, size, or SKU..."
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Loading pots...</div>
      ) : pots.length === 0 ? (
        <EmptyState
          icon={Box}
          title="No Pots Found"
          description={`No pots or planters records in ${business?.name}.`}
          actionText="Add Pot"
          actionLink="/products/new"
          accentClass="btn-inv"
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Pot Name & Style</th>
                <th>Material</th>
                <th>Size</th>
                <th>Color / Finish</th>
                <th style={{ textAlign: 'center' }}>Drainage Hole</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pots.map((p) => {
                const attrs = typeof p.attributes === 'string' ? JSON.parse(p.attributes) : (p.attributes || {});
                const isLow = p.stock_quantity <= p.low_stock_threshold;
                const isOut = p.stock_quantity <= 0;

                return (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/products/${p.id}`} style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {p.name}
                      </Link>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                        SKU: {p.sku}
                      </div>
                    </td>

                    <td>{attrs.material || 'Standard'}</td>
                    <td>{attrs.size || '—'}</td>
                    <td>{attrs.color || '—'}</td>

                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={attrs.drainage === 'Yes' ? 'success' : 'neutral'}>
                        {attrs.drainage || 'Yes'}
                      </Badge>
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular">
                      ₹{Number(p.sale_price).toFixed(2)}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}>
                        {p.stock_quantity} in stock
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
