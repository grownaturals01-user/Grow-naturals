import React, { useState, useEffect, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useInventoryModules } from '../context/InventoryModulesContext';
import { api } from '../services/api';
import type { Product } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  AlertTriangle,
  Eye,
  Edit2,
  Search,
  X,
  LayoutGrid,
  List,
  TrendingUp,
  Layers,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';

export const ProductsList: React.FC = () => {
  const { businessId, business, isTaxable } = useBusiness();
  const { modules } = useInventoryModules();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'in'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch products
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const params: any = { business_id: businessId };
    if (selectedType !== 'all') params.type = selectedType;
    if (stockFilter === 'low') params.low_stock = 'true';
    if (search.trim()) params.search = search.trim();

    api
      .get('/products', params)
      .then((data) => {
        if (isMounted) setProducts(data);
      })
      .catch((err) => console.error('Fetch products error:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [businessId, selectedType, stockFilter, search]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = products.length;
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalUnits = 0;

    for (const p of products) {
      const qty = Number(p.stock_quantity) || 0;
      const sale = Number(p.sale_price) || 0;
      const thresh = Number(p.low_stock_threshold) || 5;

      totalUnits += qty;
      totalValuation += qty * sale;

      if (qty <= 0) outOfStockCount++;
      else if (qty <= thresh) lowStockCount++;
    }

    return {
      totalCount,
      totalValuation,
      lowStockCount,
      outOfStockCount,
      totalUnits,
    };
  }, [products]);

  // Client-side filtering & sorting
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (stockFilter === 'out') {
      list = list.filter((p) => p.stock_quantity <= 0);
    } else if (stockFilter === 'in') {
      list = list.filter((p) => p.stock_quantity > (p.low_stock_threshold || 5));
    }

    list.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'name') comp = a.name.localeCompare(b.name);
      else if (sortBy === 'stock') comp = a.stock_quantity - b.stock_quantity;
      else if (sortBy === 'price') comp = Number(a.sale_price) - Number(b.sale_price);

      return sortOrder === 'asc' ? comp : -comp;
    });

    return list;
  }, [products, stockFilter, sortBy, sortOrder]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length, plants: 0, cactus: 0, pots: 0, fertilizers: 0, flowers: 0 };
    for (const m of modules) {
      counts[m.slug] = 0;
    }
    for (const p of products) {
      if (counts[p.type] !== undefined) {
        counts[p.type]++;
      } else if (p.type === 'plants') counts.plants++;
      else if (p.type === 'cactus') counts.cactus++;
      else if (p.type === 'pots') counts.pots++;
      else if (p.type === 'fertilizers') counts.fertilizers++;
      else if (p.type === 'flowers') counts.flowers++;
    }
    return counts;
  }, [products, modules]);

  const handleSort = (field: 'name' | 'stock' | 'price') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Product Catalog
            </h1>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: '1px solid #e2e8f0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={11} /> {business?.name || 'Grow Naturals'}
            </span>
          </div>
          <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '3px', margin: 0 }}>
            Manage botanical inventory, prices, tax rates, and warehouse stock levels.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/inventory/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#f1f5f9',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '7px',
              fontWeight: 600,
              fontSize: '0.85rem',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
          >
            <Plus size={15} /> Add Inventory
          </Link>
          <Link
            to="/products/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              borderRadius: '7px',
              fontWeight: 600,
              fontSize: '0.85rem',
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(22, 163, 74, 0.2)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#15803d')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
          >
            <Plus size={15} /> Add Product
          </Link>
        </div>
      </div>

      {/* 2. Clean Compact Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#f8fafc',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Package size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total SKUs
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              {metrics.totalCount} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b' }}>products</span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Inventory Value
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              ₹{metrics.totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#f8fafc',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Stock On Hand
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              {metrics.totalUnits} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b' }}>units</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
          style={{
            background: metrics.lowStockCount > 0 ? '#fffbeb' : '#ffffff',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: metrics.lowStockCount > 0 ? '#fde68a' : '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: metrics.lowStockCount > 0 ? '#fef3c7' : '#f8fafc',
              color: metrics.lowStockCount > 0 ? '#d97706' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: metrics.lowStockCount > 0 ? '#b45309' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Low Stock Alerts
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: metrics.lowStockCount > 0 ? '#b45309' : '#0f172a' }}>
              {metrics.lowStockCount} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#92400e' }}>items</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Category Filters Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '12px 16px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search by name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 32px 8px 34px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                color: '#0f172a',
                outline: 'none',
                background: '#ffffff',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Right Controls: Stock status + View mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px', gap: '2px' }}>
              <button
                type="button"
                onClick={() => setStockFilter('all')}
                style={{
                  padding: '5px 9px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '5px',
                  border: 'none',
                  background: stockFilter === 'all' ? '#ffffff' : 'transparent',
                  color: stockFilter === 'all' ? '#0f172a' : '#64748b',
                  boxShadow: stockFilter === 'all' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                }}
              >
                All Stock
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('in')}
                style={{
                  padding: '5px 9px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '5px',
                  border: 'none',
                  background: stockFilter === 'in' ? '#ffffff' : 'transparent',
                  color: stockFilter === 'in' ? '#16a34a' : '#64748b',
                  boxShadow: stockFilter === 'in' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                }}
              >
                In Stock
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('low')}
                style={{
                  padding: '5px 9px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '5px',
                  border: 'none',
                  background: stockFilter === 'low' ? '#ffffff' : 'transparent',
                  color: stockFilter === 'low' ? '#d97706' : '#64748b',
                  boxShadow: stockFilter === 'low' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                }}
              >
                Low Stock {metrics.lowStockCount > 0 && `(${metrics.lowStockCount})`}
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('out')}
                style={{
                  padding: '5px 9px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '5px',
                  border: 'none',
                  background: stockFilter === 'out' ? '#ffffff' : 'transparent',
                  color: stockFilter === 'out' ? '#dc2626' : '#64748b',
                  boxShadow: stockFilter === 'out' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                }}
              >
                Out of Stock {metrics.outOfStockCount > 0 && `(${metrics.outOfStockCount})`}
              </button>
            </div>

            {/* View Mode Switcher */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px', gap: '2px' }}>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table View"
                style={{
                  padding: '5px 7px',
                  borderRadius: '5px',
                  border: 'none',
                  background: viewMode === 'table' ? '#ffffff' : 'transparent',
                  color: viewMode === 'table' ? '#0f172a' : '#64748b',
                  boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <List size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Gallery Cards"
                style={{
                  padding: '5px 7px',
                  borderRadius: '5px',
                  border: 'none',
                  background: viewMode === 'grid' ? '#ffffff' : 'transparent',
                  color: viewMode === 'grid' ? '#0f172a' : '#64748b',
                  boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '10px',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'all', label: 'All', count: categoryCounts.all },
            { id: 'plants', label: 'Plants & Trees', count: categoryCounts.plants },
            { id: 'cactus', label: 'Cactus & Succulents', count: categoryCounts.cactus },
            { id: 'pots', label: 'Pots & Planters', count: categoryCounts.pots },
            { id: 'fertilizers', label: 'Fertilizers & Care', count: categoryCounts.fertilizers },
            { id: 'flowers', label: 'Flowers & Decor', count: categoryCounts.flowers },
            ...modules.map((m) => ({
              id: m.slug,
              label: `${m.icon ? m.icon + ' ' : ''}${m.name}`,
              count: categoryCounts[m.slug] || 0,
            })),
          ].map((cat) => {
            const isActive = selectedType === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedType(cat.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  border: '1px solid',
                  borderColor: isActive ? '#0f172a' : '#e2e8f0',
                  background: isActive ? '#0f172a' : '#ffffff',
                  color: isActive ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{cat.label}</span>
                <span style={{ fontSize: '0.7rem', opacity: isActive ? 0.8 : 0.6 }}>({cat.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Products Table */}
      {isLoading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '2.5px solid #e2e8f0',
              borderTopColor: '#16a34a',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 10px auto',
            }}
          />
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading products...</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Products Found"
          description={`No inventory items match your current filters.`}
          actionText="Add Product"
          actionLink="/products/new"
          accentClass="btn-inv"
        />
      ) : viewMode === 'table' ? (
        /* ULTRA-CLEAN TABLE */
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
              <thead>
                <tr
                  style={{
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    color: '#64748b',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '11px 16px', fontWeight: 600 }}>
                    <div
                      onClick={() => handleSort('name')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    >
                      Product <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th style={{ padding: '11px 16px', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 600 }}>Cost</th>
                  <th style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 600 }}>
                    <div
                      onClick={() => handleSort('price')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', justifyContent: 'flex-end' }}
                    >
                      Selling Price <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th style={{ padding: '11px 16px', textAlign: 'center', fontWeight: 600 }}>GST</th>
                  <th style={{ padding: '11px 16px', textAlign: 'center', fontWeight: 600 }}>
                    <div
                      onClick={() => handleSort('stock')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', justifyContent: 'center' }}
                    >
                      Stock <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th style={{ padding: '11px 16px', fontWeight: 600 }}>Supplier</th>
                  <th style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p, idx) => {
                  const isOut = p.stock_quantity <= 0;
                  const isLow = !isOut && p.stock_quantity <= (p.low_stock_threshold || 5);
                  const cost = Number(p.cost_price) || 0;
                  const sale = Number(p.sale_price) || 0;

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: idx === filteredProducts.length - 1 ? 'none' : '1px solid #f1f5f9',
                        transition: 'background-color 0.1s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      {/* Product Thumbnail + Name + SKU */}
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              background: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Package size={16} style={{ color: '#94a3b8' }} />
                            )}
                          </div>

                          <div>
                            <Link
                              to={`/products/${p.id}`}
                              style={{
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                color: '#0f172a',
                                textDecoration: 'none',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#16a34a')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                            >
                              {p.name}
                            </Link>

                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>
                              <span>SKU: {p.sku}</span>
                              {p.barcode && p.barcode !== p.sku && (
                                <span style={{ marginLeft: '6px', color: '#94a3b8' }}>
                                  · Barcode: {p.barcode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '10px 16px', color: '#334155' }}>
                        <div>{p.category_name || p.type}</div>
                      </td>

                      {/* Cost Price */}
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: '#64748b', fontFamily: 'monospace' }}>
                        ₹{cost.toFixed(2)}
                      </td>

                      {/* Selling Price */}
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>
                        ₹{sale.toFixed(2)}
                      </td>

                      {/* GST Tax Rate */}
                      <td style={{ padding: '10px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                        {isTaxable ? `${Number(p.gst_rate || 0).toFixed(0)}%` : '0%'}
                      </td>

                      {/* Stock Level */}
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: isOut ? '#dc2626' : isLow ? '#d97706' : '#16a34a',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#22c55e',
                            }}
                          />
                          {isOut ? 'Out of stock' : `${p.stock_quantity} in stock`}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td style={{ padding: '10px 16px', fontSize: '0.78rem', color: '#64748b' }}>
                        {p.supplier_name || '—'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Link
                            to={`/products/${p.id}`}
                            title="View Details"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '4px 7px',
                              fontSize: '0.72rem',
                              fontWeight: 500,
                              borderRadius: '5px',
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              color: '#475569',
                              textDecoration: 'none',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#94a3b8';
                              e.currentTarget.style.color = '#0f172a';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.color = '#475569';
                            }}
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </Link>

                          <Link
                            to={`/products/${p.id}/edit`}
                            title="Edit Product"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '4px 7px',
                              fontSize: '0.72rem',
                              fontWeight: 500,
                              borderRadius: '5px',
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              color: '#475569',
                              textDecoration: 'none',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#16a34a';
                              e.currentTarget.style.color = '#16a34a';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.color = '#475569';
                            }}
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GALLERY GRID VIEW */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredProducts.map((p) => {
            const isOut = p.stock_quantity <= 0;
            const isLow = !isOut && p.stock_quantity <= (p.low_stock_threshold || 5);
            const sale = Number(p.sale_price) || 0;
            const cost = Number(p.cost_price) || 0;

            return (
              <div
                key={p.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Product Image Hero */}
                <div
                  style={{
                    height: '140px',
                    width: '100%',
                    background: '#f8fafc',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Package size={32} style={{ color: '#cbd5e1' }} />
                  )}

                  {/* Stock Badge */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '12px',
                      background: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#16a34a',
                      color: '#ffffff',
                    }}
                  >
                    {isOut ? 'Out of stock' : `${p.stock_quantity} in stock`}
                  </span>
                </div>

                {/* Card Body */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '2px' }}>
                    {p.sku} {p.category_name ? `· ${p.category_name}` : ''}
                  </div>

                  <Link
                    to={`/products/${p.id}`}
                    style={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#0f172a',
                      textDecoration: 'none',
                      lineHeight: '1.3',
                      marginBottom: '8px',
                    }}
                  >
                    {p.name}
                  </Link>

                  <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        ₹{sale.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        Cost: ₹{cost.toFixed(2)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <Link
                        to={`/products/${p.id}`}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '5px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          color: '#475569',
                          fontSize: '0.72rem',
                          fontWeight: 500,
                          textDecoration: 'none',
                        }}
                      >
                        Details
                      </Link>
                      <Link
                        to={`/products/${p.id}/edit`}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '5px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          color: '#475569',
                          fontSize: '0.72rem',
                          fontWeight: 500,
                          textDecoration: 'none',
                        }}
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
