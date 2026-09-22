import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Product } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Link } from 'react-router-dom';
import { FlaskConical, Plus, ArrowRight, ShieldCheck } from 'lucide-react';

export const FertilizersInventory: React.FC = () => {
  const { businessId, business } = useBusiness();
  const [items, setItems] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api
      .get('/products', { business_id: businessId, type: 'fertilizers', search: search.trim() })
      .then((data) => {
        if (isMounted) setItems(data);
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
            <span>Fertilizers & Chemicals</span>
            <Badge variant="inv">{business?.name}</Badge>
          </h1>
          <p className="page-description">
            Organic composts, seaweed tonics, plant boosters, and safety formulations.
          </p>
        </div>

        <div className="page-actions">
          <Link to="/products/new" className="btn btn-inv">
            <Plus size={16} /> Add Fertilizer / Care Item
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search nutrients by formulation, unit size, or SKU..."
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Loading items...</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No Fertilizers Found"
          description={`No fertilizer or chemical records in ${business?.name}.`}
          actionText="Add Item"
          actionLink="/products/new"
          accentClass="btn-inv"
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Composition</th>
                <th>Unit / Pack Size</th>
                <th style={{ textAlign: 'center' }}>Organic Certified</th>
                <th>Safety / Dosage Notes</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
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

                    <td style={{ maxWidth: '200px' }}>{attrs.composition || '—'}</td>
                    <td>{attrs.unit_size || '—'}</td>

                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={attrs.is_organic === 'Yes' ? 'success' : 'neutral'}>
                        {attrs.is_organic === 'Yes' ? 'Organic' : 'Chemical / Bio'}
                      </Badge>
                    </td>

                    <td style={{ fontSize: 'var(--font-xs)', maxWidth: '220px', color: 'var(--color-text-secondary)' }}>
                      {attrs.safety_notes || '—'}
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
