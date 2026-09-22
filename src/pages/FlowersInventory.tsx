import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Product } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Link } from 'react-router-dom';
import { Flower2, Plus, ArrowRight } from 'lucide-react';

export const FlowersInventory: React.FC = () => {
  const { businessId, business } = useBusiness();
  const [flowers, setFlowers] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api
      .get('/products', { business_id: businessId, type: 'flowers', search: search.trim() })
      .then((data) => {
        if (isMounted) setFlowers(data);
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
            <span>Flowers & Arrangements</span>
            <Badge variant="inv">{business?.name}</Badge>
          </h1>
          <p className="page-description">
            Cut flowers, exotic bouquets, loose farm marigolds, and perishable arrangements.
          </p>
        </div>

        <div className="page-actions">
          <Link to="/products/new" className="btn btn-inv">
            <Plus size={16} /> Add Flower / Arrangement
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search arrangements by style, occasion, or SKU..."
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Loading flowers...</div>
      ) : flowers.length === 0 ? (
        <EmptyState
          icon={Flower2}
          title="No Flower Arrangements Found"
          description={`No flowers or arrangement records in ${business?.name}.`}
          actionText="Add Floral Item"
          actionLink="/products/new"
          accentClass="btn-inv"
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Arrangement Name</th>
                <th>Occasion / Style</th>
                <th>Arrangement Format</th>
                <th>Freshness Window</th>
                <th style={{ textAlign: 'center' }}>Vase Included</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flowers.map((p) => {
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

                    <td>{attrs.occasion || 'General'}</td>
                    <td>{attrs.arrangement_style || 'Standard'}</td>
                    <td>{attrs.shelf_life || '—'}</td>

                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={attrs.vase_included === 'Yes' ? 'success' : 'neutral'}>
                        {attrs.vase_included || 'No'}
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
