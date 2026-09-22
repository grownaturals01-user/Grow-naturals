import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Product } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Link } from 'react-router-dom';
import { Trees, Plus, Sun, Droplets, ArrowRight } from 'lucide-react';

export const PlantsInventory: React.FC = () => {
  const { businessId, business } = useBusiness();
  const [plants, setPlants] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api
      .get('/products', { business_id: businessId, type: 'plants', search: search.trim() })
      .then((data) => {
        if (isMounted) setPlants(data);
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
            <span>Plant Inventory</span>
            <Badge variant="inv">{business?.name}</Badge>
          </h1>
          <p className="page-description">
            Botanical inventory tracking pot sizes, heights, sunlight needs, and watering cycles.
          </p>
        </div>

        <div className="page-actions">
          <Link to="/products/new" className="btn btn-inv">
            <Plus size={16} /> Add Plant
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search plants by botanical name, variety, or SKU..."
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Loading plants...</div>
      ) : plants.length === 0 ? (
        <EmptyState
          icon={Trees}
          title="No Plants Found"
          description={`No plant records in ${business?.name}.`}
          actionText="Add Plant"
          actionLink="/products/new"
          accentClass="btn-inv"
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Plant Name & Variety</th>
                <th>Pot Size</th>
                <th>Height</th>
                <th>Sunlight Needs</th>
                <th>Watering</th>
                <th>Difficulty</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plants.map((p) => {
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

                    <td>{attrs.pot_size || '—'}</td>
                    <td>{attrs.height || '—'}</td>

                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <Sun size={13} color="#d97706" />
                        {attrs.sunlight || 'Moderate'}
                      </span>
                    </td>

                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <Droplets size={13} color="#0284c7" />
                        {attrs.watering || 'Regular'}
                      </span>
                    </td>

                    <td>
                      <Badge variant="neutral">{attrs.difficulty || 'Easy'}</Badge>
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
