import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  TrendingDown,
  Plus,
  Trash2,
  Package,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  ShieldAlert,
  Bug,
  Droplets,
  Clock,
  Trees,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Leaf,
  Truck,
  CloudSnow,
  HelpCircle,
  Check,
  ShoppingBag,
  Store,
  Boxes
} from 'lucide-react';
import { api } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { ProductSearchSelect } from '../components/common/ProductSearchSelect';
import {
  Product,
  WarehouseItem,
  WarehouseTransaction,
  WarehouseMetrics,
  WarehouseTransactionType
} from '../types';

interface ReasonMeta {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
  bg: string;
  border: string;
}

const DAMAGE_REASONS: Record<string, ReasonMeta> = {
  withered_decay: { label: 'Wilting / Spoilage', icon: Leaf, color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  pest_infection: { label: 'Pest Infestation', icon: Bug, color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' },
  root_rot: { label: 'Root Rot / Moisture', icon: Droplets, color: '#6d28d9', bg: '#ede9fe', border: '#ddd6fe' },
  physical_damage: { label: 'Physical Breakage', icon: ShieldAlert, color: '#c2410c', bg: '#ffedd5', border: '#fed7aa' },
  transit_breakage: { label: 'Transit / Unloading', icon: Truck, color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' },
  expired: { label: 'Expired / Shelf Life', icon: Clock, color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' },
  weather_extreme: { label: 'Weather / Frost / Heat', icon: CloudSnow, color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc' },
  other: { label: 'Other Spoilage', icon: HelpCircle, color: '#4b5563', bg: '#f3f4f6', border: '#e5e7eb' }
};

export const WarehouseManagement: React.FC = () => {
  const { businessId, activeBusiness } = useBusiness();
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales' | 'damages' | 'ledger'>('inventory');
  const [inventory, setInventory] = useState<WarehouseItem[]>([]);
  const [metrics, setMetrics] = useState<WarehouseMetrics | null>(null);
  const [transactions, setTransactions] = useState<WarehouseTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  // Modal State
  const [modalType, setModalType] = useState<WarehouseTransactionType | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [productSearchVal, setProductSearchVal] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [buyerName, setBuyerName] = useState('');
  const [damageReason, setDamageReason] = useState<string>('withered_decay');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load all warehouse data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [invData, metData, txData, prodData] = await Promise.all([
        api.get<WarehouseItem[]>('/warehouse/inventory', { business_id: businessId }),
        api.get<WarehouseMetrics>('/warehouse/metrics', { business_id: businessId }),
        api.get<WarehouseTransaction[]>('/warehouse/transactions', { business_id: businessId, limit: 200 }),
        api.get<Product[]>('/products', { business_id: businessId })
      ]);
      setInventory(invData);
      setMetrics(metData);
      setTransactions(txData);
      setProducts(prodData);
    } catch (err: any) {
      console.error('Failed to load warehouse data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [businessId]);

  // Open modal with presets
  const handleOpenActionModal = (type: WarehouseTransactionType, preselectedProd?: Product | WarehouseItem) => {
    setFormError(null);
    setQuantity(1);
    setNotes('');
    setBuyerName('');
    setDamageReason('withered_decay');
    setReferenceNo('');
    setTransactionDate(new Date().toISOString().split('T')[0]);

    if (preselectedProd) {
      const match = products.find((p) => p.id === preselectedProd.id) || (preselectedProd as any);
      setSelectedProduct(match);
      setProductSearchVal(match.name);
      if (type === 'sale') {
        setUnitPrice(Number(match.sale_price) || 0);
      } else {
        setUnitPrice(Number(match.cost_price) || Number(match.sale_price) || 0);
      }
    } else {
      setSelectedProduct(undefined);
      setProductSearchVal('');
      setUnitPrice(0);
    }

    setModalType(type);
  };

  // Submit transaction
  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setFormError('Please select a plant or product');
      return;
    }

    if (quantity <= 0) {
      setFormError('Quantity must be greater than 0');
      return;
    }

    const whItem = inventory.find((i) => i.id === selectedProduct.id);
    const availableWhStock = whItem ? whItem.warehouse_stock : 0;

    if (['sale', 'damage', 'transfer_to_shop'].includes(modalType as string) && quantity > availableWhStock) {
      setFormError(`Insufficient warehouse stock! Only ${availableWhStock} unit(s) available.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      await api.post('/warehouse/transactions', {
        business_id: businessId,
        product_id: selectedProduct.id,
        type: modalType,
        quantity,
        unit_price: unitPrice,
        buyer_name: buyerName.trim(),
        damage_reason: damageReason,
        reference_no: referenceNo.trim(),
        notes: notes.trim(),
        performed_by: user?.name || 'Warehouse Staff',
        transaction_date: transactionDate
      });

      let successMsg = 'Warehouse movement recorded.';
      if (modalType === 'sale') successMsg = `Warehouse Sale of ${quantity} units recorded for ₹${(quantity * unitPrice).toFixed(2)}.`;
      if (modalType === 'damage') successMsg = `Logged ${quantity} damaged units in warehouse. Stock deducted.`;
      if (modalType === 'inward') successMsg = `Inward arrival of ${quantity} units added to warehouse stock.`;
      if (modalType === 'transfer_to_shop') successMsg = `Transferred ${quantity} units from Warehouse to Shop Counter.`;

      setNotification({ message: successMsg, type: 'success' });
      setModalType(null);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit warehouse transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rollback a transaction
  const handleRollback = async (id: string, prodName?: string) => {
    if (!window.confirm(`Rollback this warehouse transaction for "${prodName || 'this item'}"? Stock will be reversed to its previous count.`)) {
      return;
    }

    try {
      setDeletingId(id);
      await api.delete(`/warehouse/transactions/${id}`);
      setNotification({ message: 'Transaction rolled back successfully. Stock restored.', type: 'success' });
      await fetchData();
    } catch (err: any) {
      setNotification({ message: err.message || 'Failed to rollback transaction', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  // Unique categories for filtering
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((i) => {
      if (i.category_name) set.add(i.category_name);
    });
    return Array.from(set).sort();
  }, [inventory]);

  // Filtered inventory list
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (categoryFilter !== 'all' && item.category_name !== categoryFilter) return false;
      if (stockFilter === 'in_stock' && item.warehouse_stock <= 0) return false;
      if (stockFilter === 'out_of_stock' && item.warehouse_stock > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          (item.category_name && item.category_name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [inventory, categoryFilter, stockFilter, searchQuery]);

  // Filtered sales
  const salesTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === 'sale');
  }, [transactions]);

  // Filtered damages
  const damageTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === 'damage');
  }, [transactions]);

  // Current selected product's warehouse stock
  const currentSelectedWhItem = useMemo(() => {
    if (!selectedProduct) return null;
    return inventory.find((i) => i.id === selectedProduct.id) || null;
  }, [selectedProduct, inventory]);

  return (
    <div className="prod-page-container">
      {/* 1. Page Header */}
      <div className="prod-page-header">
        <div className="prod-page-title-group">
          <h1>Warehouse & Nursery Stock</h1>
          <p>
            Central nursery stock, warehouse direct sales, damage tracking, and shop dispatches for <strong>{activeBusiness.name}</strong>
          </p>
        </div>

        <div className="prod-header-actions">
          <button
            type="button"
            className="prod-icon-btn"
            onClick={fetchData}
            title="Refresh Data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            className="wh-mini-btn stock"
            style={{ height: '32px', padding: '0 12px', fontSize: '0.8125rem' }}
            onClick={() => handleOpenActionModal('inward')}
          >
            <ArrowDownLeft size={15} /> + Inward Stock
          </button>

          <button
            type="button"
            className="wh-mini-btn sale"
            style={{ height: '32px', padding: '0 12px', fontSize: '0.8125rem' }}
            onClick={() => handleOpenActionModal('sale')}
          >
            <ShoppingBag size={15} /> + Warehouse Sale
          </button>

          <button
            type="button"
            className="wh-mini-btn damage"
            style={{ height: '32px', padding: '0 12px', fontSize: '0.8125rem' }}
            onClick={() => handleOpenActionModal('damage')}
          >
            <TrendingDown size={15} /> + Log Damage
          </button>

          <button
            type="button"
            className="wh-mini-btn transfer"
            style={{ height: '32px', padding: '0 12px', fontSize: '0.8125rem' }}
            onClick={() => handleOpenActionModal('transfer_to_shop')}
          >
            <ArrowLeftRight size={15} /> Quick Transfer
          </button>

          <Link
            to="/transfers"
            className="prod-icon-btn"
            style={{ width: 'auto', padding: '0 12px', gap: '6px', fontSize: '0.8125rem', fontWeight: 600 }}
          >
            <Store size={14} /> All Transfers & Slips ➔
          </Link>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '4px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: notification.type === 'success' ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)',
            color: notification.type === 'success' ? '#15803d' : '#b91c1c',
            border: `1px solid ${notification.type === 'success' ? 'rgba(22, 163, 74, 0.25)' : 'rgba(220, 38, 38, 0.25)'}`,
            fontWeight: 600,
            fontSize: '0.8125rem',
            boxShadow: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 2. KPI Overview Cards (Dashboard Style) */}
      <div className="dash-stats-grid" style={{ marginBottom: '12px' }}>
        {/* KPI 1: Remaining Warehouse Stock */}
        <div className="dash-white-card">
          <div className="dash-white-top">
            <div className="dash-white-val-group">
              <span className="dash-white-label">Warehouse Remaining Stock</span>
              <span className="dash-white-amount">
                {metrics?.total_warehouse_units || 0}{' '}
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>units</span>
              </span>
            </div>
            <div className="dash-soft-icon icon-cyan">
              <Building2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
            Valuation: ₹{Number(metrics?.total_warehouse_valuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* KPI 2: Warehouse Sales */}
        <div className="dash-white-card">
          <div className="dash-white-top">
            <div className="dash-white-val-group">
              <span className="dash-white-label">Direct Warehouse Sales</span>
              <span className="dash-white-amount" style={{ color: '#16a34a' }}>
                ₹{Number(metrics?.total_sales_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="dash-soft-icon icon-mint">
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {metrics?.total_sales_units || 0} units across {metrics?.sales_transactions_count || 0} orders
          </div>
        </div>

        {/* KPI 3: Warehouse Damages */}
        <div className="dash-white-card">
          <div className="dash-white-top">
            <div className="dash-white-val-group">
              <span className="dash-white-label">Warehouse Damage / Spoilage</span>
              <span className="dash-white-amount" style={{ color: '#dc2626' }}>
                ₹{Number(metrics?.total_damage_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="dash-soft-icon icon-coral">
              <TrendingDown size={18} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {metrics?.total_damage_units || 0} damaged units logged
          </div>
        </div>

        {/* KPI 4: Shop Dispatches */}
        <div className="dash-white-card">
          <div className="dash-white-top">
            <div className="dash-white-val-group">
              <span className="dash-white-label">Dispatched to Retail Counter</span>
              <span className="dash-white-amount">
                {metrics?.total_transfers_units || 0}{' '}
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>units</span>
              </span>
            </div>
            <div className="dash-soft-icon icon-amber">
              <Store size={18} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
            {metrics?.transfer_records_count || 0} dispatch shipments
          </div>
        </div>
      </div>

      {/* 3. Main Section Card */}
      <div className="prod-table-card">
        {/* Segmented Tab Navigation Row */}
        <div className="prod-tab-nav">
          <div className="prod-tab-group">
            <button
              type="button"
              className={`prod-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <Package size={14} />
              <span>Stock Balances</span>
              <span className="prod-tab-badge">{inventory.length}</span>
            </button>

            <button
              type="button"
              className={`prod-tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
              onClick={() => setActiveTab('sales')}
            >
              <ShoppingBag size={14} />
              <span>Warehouse Sales</span>
              <span className="prod-tab-badge">{salesTransactions.length}</span>
            </button>

            <button
              type="button"
              className={`prod-tab-btn ${activeTab === 'damages' ? 'active' : ''}`}
              onClick={() => setActiveTab('damages')}
            >
              <TrendingDown size={14} />
              <span>Warehouse Damages</span>
              <span className="prod-tab-badge">{damageTransactions.length}</span>
            </button>

            <button
              type="button"
              className={`prod-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
              onClick={() => setActiveTab('ledger')}
            >
              <Layers size={14} />
              <span>Movements Ledger</span>
              <span className="prod-tab-badge">{transactions.length}</span>
            </button>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {activeTab === 'inventory' && `Showing ${filteredInventory.length} of ${inventory.length} botanical items`}
            {activeTab === 'sales' && `${salesTransactions.length} direct sales recorded`}
            {activeTab === 'damages' && `${damageTransactions.length} spoilage logs recorded`}
            {activeTab === 'ledger' && `${transactions.length} total movement events`}
          </div>
        </div>

        {/* Filter Bar for Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="prod-table-toolbar">
            <div className="prod-search-box">
              <Search size={14} className="prod-search-icon" />
              <input
                type="text"
                className="prod-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by plant name, SKU, or variety..."
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="prod-toolbar-filters">
              <select
                className="prod-filter-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categoriesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                className="prod-filter-select"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
              >
                <option value="all">All Stock Levels</option>
                <option value="in_stock">In Warehouse Stock (&gt; 0)</option>
                <option value="out_of_stock">Out of Stock (= 0)</option>
              </select>
            </div>
          </div>
        )}

        {/* Tab 1: Clean, Spacious Warehouse Stock Table */}
        {/* Tab 1: Clean, Spacious Warehouse Stock Table */}
        {activeTab === 'inventory' && (
          <div className="prod-table-responsive">
            <table className="prod-spacious-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '260px' }}>Plant / Item</th>
                  <th style={{ minWidth: '150px', textAlign: 'center' }}>Warehouse Stock</th>
                  <th style={{ minWidth: '140px', textAlign: 'center' }}>Retail Shop Stock</th>
                  <th style={{ minWidth: '130px', textAlign: 'right' }}>Cost Price</th>
                  <th style={{ minWidth: '220px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#ff9f43' }} />
                      <div>Loading warehouse inventory...</div>
                    </td>
                  </tr>
                ) : filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255, 159, 67, 0.1)',
                          color: '#ff9f43',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px auto',
                        }}
                      >
                        <Building2 size={24} />
                      </div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: '4px' }}>
                        No items match your filter
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b', maxWidth: '360px', margin: '0 auto' }}>
                        {searchQuery ? 'Try clearing your search query' : 'Use "+ Inward Stock" to add inventory to the warehouse.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id}>
                      {/* Botanical Item with image, name, SKU and category */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="prod-thumb-box" style={{ width: '32px', height: '32px' }}>
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} />
                            ) : (
                              <Trees size={16} color="#64748b" />
                            )}
                          </div>
                          <div>
                            <div className="prod-name-text" style={{ fontSize: '0.8125rem' }}>
                              {item.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                              <span className="cust-code-text">{item.sku}</span>
                              {item.category_name && (
                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  &bull; {item.category_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Warehouse Stock Badge */}
                      <td style={{ textAlign: 'center' }}>
                        <div>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '3px',
                              display: 'inline-block',
                              backgroundColor: item.warehouse_stock > 5 ? '#eff6ff' : item.warehouse_stock > 0 ? '#fef3c7' : '#fee2e2',
                              color: item.warehouse_stock > 5 ? '#2563eb' : item.warehouse_stock > 0 ? '#b45309' : '#b91c1c',
                              border: `1px solid ${item.warehouse_stock > 5 ? '#bfdbfe' : item.warehouse_stock > 0 ? '#fde68a' : '#fecaca'}`
                            }}
                          >
                            {item.warehouse_stock} units
                          </span>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                            {item.warehouse_stock > 0
                              ? `Val: ₹${(item.warehouse_stock * (Number(item.cost_price) || 0)).toLocaleString('en-IN')}`
                              : 'Out of stock'}
                          </div>
                        </div>
                      </td>

                      {/* Shop Counter Stock */}
                      <td style={{ textAlign: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155' }}>
                            {item.shop_stock} units
                          </span>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                            Retail display
                          </div>
                        </div>
                      </td>

                      {/* Cost Price */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8125rem' }}>
                          ₹{Number(item.cost_price || 0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                          MRP: ₹{Number(item.sale_price || 0).toFixed(2)}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="wh-mini-btn stock"
                            title="Inward Stock Arrival"
                            onClick={() => handleOpenActionModal('inward', item as any)}
                          >
                            + Stock
                          </button>
                          <button
                            type="button"
                            className="wh-mini-btn sale"
                            title="Direct Warehouse Sale"
                            onClick={() => handleOpenActionModal('sale', item as any)}
                            disabled={item.warehouse_stock <= 0}
                          >
                            Sale
                          </button>
                          <button
                            type="button"
                            className="wh-mini-btn transfer"
                            title="Dispatch to Shop Counter"
                            onClick={() => handleOpenActionModal('transfer_to_shop', item as any)}
                            disabled={item.warehouse_stock <= 0}
                          >
                            Transfer
                          </button>
                          <button
                            type="button"
                            className="wh-mini-btn damage"
                            title="Log Warehouse Damage"
                            onClick={() => handleOpenActionModal('damage', item as any)}
                            disabled={item.warehouse_stock <= 0}
                          >
                            <TrendingDown size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Warehouse Sales History */}
        {activeTab === 'sales' && (
          <div className="prod-table-responsive">
            <table className="prod-spacious-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '130px' }}>Date</th>
                  <th style={{ minWidth: '220px' }}>Plant / Item</th>
                  <th style={{ minWidth: '180px' }}>Buyer / Customer</th>
                  <th style={{ minWidth: '120px', textAlign: 'right' }}>Quantity</th>
                  <th style={{ minWidth: '110px', textAlign: 'right' }}>Unit Rate</th>
                  <th style={{ minWidth: '130px', textAlign: 'right' }}>Total Revenue</th>
                  <th style={{ minWidth: '150px' }}>Notes / Ref</th>
                  <th style={{ width: '80px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {salesTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255, 159, 67, 0.1)',
                          color: '#ff9f43',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px auto',
                        }}
                      >
                        <ShoppingBag size={24} />
                      </div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: '4px' }}>
                        No warehouse direct sales logged
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b', maxWidth: '360px', margin: '0 auto' }}>
                        Click "+ Warehouse Sale" above to record wholesale or direct client sales from warehouse stock.
                      </div>
                    </td>
                  </tr>
                ) : (
                  salesTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8125rem' }}>
                          {new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <div className="prod-name-text" style={{ fontSize: '0.8125rem' }}>{tx.product_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          SKU: <span className="cust-code-text">{tx.product_sku || '—'}</span>
                        </div>
                      </td>
                      <td style={{ color: '#334155', fontWeight: 600, fontSize: '0.8125rem' }}>
                        {tx.buyer_name || 'Direct Wholesale Buyer'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '3px',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe'
                          }}
                        >
                          {tx.quantity} units
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: '#64748b', fontSize: '0.8125rem' }}>
                        ₹{Number(tx.unit_price).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a', fontSize: '0.875rem' }}>
                        ₹{Number(tx.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {tx.notes || tx.reference_no || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="cust-actions-group">
                          <button
                            type="button"
                            className="cust-action-btn delete"
                            onClick={() => handleRollback(tx.id, tx.product_name)}
                            disabled={deletingId === tx.id}
                            title="Rollback sale and restore stock"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Warehouse Damages History */}
        {activeTab === 'damages' && (
          <div className="prod-table-responsive">
            <table className="prod-spacious-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '130px' }}>Date</th>
                  <th style={{ minWidth: '220px' }}>Plant / Item</th>
                  <th style={{ minWidth: '120px', textAlign: 'right' }}>Damaged Qty</th>
                  <th style={{ minWidth: '110px', textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ minWidth: '130px', textAlign: 'right' }}>Loss Value</th>
                  <th style={{ minWidth: '160px' }}>Cause / Reason</th>
                  <th style={{ minWidth: '140px' }}>Reported By</th>
                  <th style={{ width: '80px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {damageTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255, 159, 67, 0.1)',
                          color: '#ff9f43',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px auto',
                        }}
                      >
                        <TrendingDown size={24} />
                      </div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: '4px' }}>
                        No warehouse damages logged
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b', maxWidth: '360px', margin: '0 auto' }}>
                        Click "+ Log Damage" if plants in the warehouse or greenhouse show wilting, pests, or decay.
                      </div>
                    </td>
                  </tr>
                ) : (
                  damageTransactions.map((tx) => {
                    const rCfg = DAMAGE_REASONS[tx.damage_reason || ''] || DAMAGE_REASONS.other;
                    const ReasonIcon = rCfg.icon;
                    return (
                      <tr key={tx.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8125rem' }}>
                            {new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td>
                          <div className="prod-name-text" style={{ fontSize: '0.8125rem' }}>{tx.product_name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                            SKU: <span className="cust-code-text">{tx.product_sku || '—'}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '3px',
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca'
                            }}
                          >
                            -{tx.quantity} units
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', color: '#64748b', fontSize: '0.8125rem' }}>
                          ₹{Number(tx.unit_price).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626', fontSize: '0.875rem' }}>
                          ₹{Number(tx.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '3px',
                              backgroundColor: rCfg.bg,
                              color: rCfg.color,
                              border: `1px solid ${rCfg.border}`
                            }}
                          >
                            <ReasonIcon size={12} />
                            <span>{rCfg.label}</span>
                          </span>
                        </td>
                        <td style={{ color: '#334155', fontSize: '0.8125rem' }}>
                          {tx.performed_by || 'Staff'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="cust-actions-group">
                            <button
                              type="button"
                              className="cust-action-btn delete"
                              onClick={() => handleRollback(tx.id, tx.product_name)}
                              disabled={deletingId === tx.id}
                              title="Rollback damage and restore stock"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Movement Ledger (Timeline) */}
        {activeTab === 'ledger' && (
          <div className="prod-table-responsive">
            <table className="prod-spacious-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '140px' }}>Date & Time</th>
                  <th style={{ minWidth: '160px' }}>Movement Type</th>
                  <th style={{ minWidth: '220px' }}>Item Details</th>
                  <th style={{ minWidth: '120px', textAlign: 'right' }}>Quantity</th>
                  <th style={{ minWidth: '130px', textAlign: 'center' }}>Stock Balance</th>
                  <th style={{ minWidth: '120px', textAlign: 'right' }}>Amount</th>
                  <th style={{ minWidth: '160px' }}>Notes / Handled By</th>
                  <th style={{ width: '80px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255, 159, 67, 0.1)',
                          color: '#ff9f43',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px auto',
                        }}
                      >
                        <Layers size={24} />
                      </div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: '4px' }}>
                        No movement activity recorded
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b', maxWidth: '360px', margin: '0 auto' }}>
                        Transactions will appear here as stock arrives, transfers, or is sold.
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    let badgeColor = '#2563eb';
                    let badgeBg = '#eff6ff';
                    let badgeBorder = '#bfdbfe';
                    let label = 'Movement';

                    if (tx.type === 'inward') {
                      badgeColor = '#16a34a';
                      badgeBg = '#f0fdf4';
                      badgeBorder = '#bbf7d0';
                      label = 'Stock Inward (Arrival)';
                    } else if (tx.type === 'sale') {
                      badgeColor = '#2563eb';
                      badgeBg = '#eff6ff';
                      badgeBorder = '#bfdbfe';
                      label = 'Warehouse Sale';
                    } else if (tx.type === 'damage') {
                      badgeColor = '#dc2626';
                      badgeBg = '#fef2f2';
                      badgeBorder = '#fecaca';
                      label = 'Warehouse Damage';
                    } else if (tx.type === 'transfer_to_shop') {
                      badgeColor = '#d97706';
                      badgeBg = '#fffbeb';
                      badgeBorder = '#fde68a';
                      label = 'Dispatched to Shop';
                    }

                    return (
                      <tr key={tx.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8125rem' }}>
                            {new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="cust-code-text" style={{ marginTop: '2px' }}>
                            {new Date(tx.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '3px',
                              backgroundColor: badgeBg,
                              color: badgeColor,
                              border: `1px solid ${badgeBorder}`
                            }}
                          >
                            {label}
                          </span>
                        </td>
                        <td>
                          <div className="prod-name-text" style={{ fontSize: '0.8125rem' }}>{tx.product_name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                            SKU: <span className="cust-code-text">{tx.product_sku || '—'}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '3px',
                              backgroundColor: tx.type === 'inward' ? '#f0fdf4' : '#fef2f2',
                              color: tx.type === 'inward' ? '#16a34a' : '#dc2626',
                              border: `1px solid ${tx.type === 'inward' ? '#bbf7d0' : '#fecaca'}`
                            }}
                          >
                            {tx.type === 'inward' ? `+${tx.quantity}` : `-${tx.quantity}`} units
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '0.8125rem' }}>
                          <span style={{ color: '#64748b' }}>{tx.previous_stock}</span>{' '}
                          <span style={{ color: '#94a3b8', margin: '0 2px' }}>➔</span>{' '}
                          <strong style={{ color: '#0f172a' }}>{tx.new_stock}</strong>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.8125rem' }}>
                          {Number(tx.total_amount) > 0 ? `₹${Number(tx.total_amount).toFixed(2)}` : '—'}
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#475569' }}>
                          <div>{tx.notes || tx.buyer_name || '—'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>By: {tx.performed_by || 'Staff'}</div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="cust-actions-group">
                            <button
                              type="button"
                              className="cust-action-btn delete"
                              onClick={() => handleRollback(tx.id, tx.product_name)}
                              disabled={deletingId === tx.id}
                              title="Rollback transaction and restore stock"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="cust-table-footer">
          <span>
            {activeTab === 'inventory' && `Showing ${filteredInventory.length} of ${inventory.length} total botanical items`}
            {activeTab === 'sales' && `Showing ${salesTransactions.length} direct warehouse sales records`}
            {activeTab === 'damages' && `Showing ${damageTransactions.length} damage audit logs`}
            {activeTab === 'ledger' && `Showing ${transactions.length} movement ledger entries`}
          </span>
          <span style={{ fontWeight: 600 }}>Live warehouse inventory reconciliation active</span>
        </div>
      </div>

      {/* Action Modals */}
      {modalType && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            fontFamily: "'Nunito', sans-serif"
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              maxHeight: 'min(90vh, 740px)',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '4px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              boxShadow: 'none',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '4px',
                    backgroundColor:
                      modalType === 'inward'
                        ? '#d1fae5'
                        : modalType === 'sale'
                        ? '#e0e7ff'
                        : modalType === 'damage'
                        ? '#fee2e2'
                        : '#fef3c7',
                    color:
                      modalType === 'inward'
                        ? '#059669'
                        : modalType === 'sale'
                        ? '#4f46e5'
                        : modalType === 'damage'
                        ? '#dc2626'
                        : '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {modalType === 'inward' && <ArrowDownLeft size={18} />}
                  {modalType === 'sale' && <ShoppingBag size={18} />}
                  {modalType === 'damage' && <TrendingDown size={18} />}
                  {modalType === 'transfer_to_shop' && <ArrowLeftRight size={18} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {modalType === 'inward' && 'Record Inward Stock Arrival'}
                    {modalType === 'sale' && 'Record Warehouse Direct Sale'}
                    {modalType === 'damage' && 'Log Warehouse Damage / Spoilage'}
                    {modalType === 'transfer_to_shop' && 'Dispatch Stock to Shop Counter'}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    {modalType === 'inward' && 'Increments central warehouse stock count'}
                    {modalType === 'sale' && 'Deducts warehouse stock and records bulk sales revenue'}
                    {modalType === 'damage' && 'Deducts warehouse stock and calculates spoilage financial loss'}
                    {modalType === 'transfer_to_shop' && 'Deducts from warehouse and increments retail shop counter stock'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setModalType(null)}
                style={{ padding: '6px', color: '#64748b', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitTransaction} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
              <div
                style={{
                  flex: '1 1 auto',
                  overflowY: 'auto',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                {formError && (
                  <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#b91c1c', fontSize: '0.8rem' }}>
                    {formError}
                  </div>
                )}

                {/* Select Plant */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label required" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Select Botanical / Inventory Item
                  </label>
                  <ProductSearchSelect
                    products={products}
                    value={productSearchVal}
                    selectedProductId={selectedProduct?.id}
                    onChange={(name, prod) => {
                      setProductSearchVal(name);
                      setSelectedProduct(prod);
                      if (prod) {
                        if (modalType === 'sale') setUnitPrice(Number(prod.sale_price) || 0);
                        else setUnitPrice(Number(prod.cost_price) || Number(prod.sale_price) || 0);
                      }
                    }}
                    placeholder="Search plant by name, category, or SKU..."
                  />
                </div>

                {/* Selected Product Status Card */}
                {selectedProduct && currentSelectedWhItem && (
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                        {selectedProduct.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        SKU: <span className="cust-code-text">{selectedProduct.sku}</span> &bull; Retail MRP: ₹{Number(selectedProduct.sale_price).toFixed(2)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', textAlign: 'right' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Warehouse Stock</div>
                        <div style={{ fontWeight: 800, color: currentSelectedWhItem.warehouse_stock <= 5 ? '#dc2626' : '#047857', fontSize: '0.82rem' }}>
                          {currentSelectedWhItem.warehouse_stock} units
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Shop Stock</div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>
                          {currentSelectedWhItem.shop_stock} units
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quantity & Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label required" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Quantity ({modalType === 'inward' ? 'Units Received' : modalType === 'sale' ? 'Units Sold' : modalType === 'damage' ? 'Damaged Units' : 'Units to Dispatch'})
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      required
                      style={{ fontSize: '0.82rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                    {currentSelectedWhItem && ['sale', 'damage', 'transfer_to_shop'].includes(modalType) && (
                      <div style={{ fontSize: '0.72rem', marginTop: '3px', color: quantity > currentSelectedWhItem.warehouse_stock ? '#dc2626' : '#64748b' }}>
                        {quantity > currentSelectedWhItem.warehouse_stock ? (
                          <span>Exceeds warehouse stock ({currentSelectedWhItem.warehouse_stock} available)</span>
                        ) : (
                          <span>Remaining in warehouse: <strong>{currentSelectedWhItem.warehouse_stock - quantity}</strong> units</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label required" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Date
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      required
                      style={{ fontSize: '0.82rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                {/* Sale Details */}
                {modalType === 'sale' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label required" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                        Buyer / Customer / Project
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="e.g. Kaveri Landscaping / Walk-in"
                        required
                        style={{ fontSize: '0.82rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label required" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                        Selling Price / Unit (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                        required
                        style={{ fontSize: '0.82rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                )}

                {/* Damage Reason Selector */}
                {modalType === 'damage' && (
                  <div>
                    <label className="form-label required" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Cause of Damage / Spoilage
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {Object.entries(DAMAGE_REASONS).map(([key, cfg]) => {
                        const isSelected = damageReason === key;
                        const IconComp = cfg.icon;
                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() => setDamageReason(key)}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              gap: '4px',
                              padding: '8px 10px',
                              borderRadius: '4px',
                              border: isSelected ? `2px solid ${cfg.color}` : '1px solid #cbd5e1',
                              backgroundColor: isSelected ? cfg.bg : '#ffffff',
                              color: isSelected ? cfg.color : '#334155',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <IconComp size={14} />
                              {isSelected && <Check size={10} strokeWidth={3} />}
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: isSelected ? 700 : 600, lineHeight: 1.2 }}>
                              {cfg.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reference & Notes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Reference #
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      placeholder="e.g. WH-SO-1029 / PO-45"
                      style={{ fontSize: '0.82rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Notes / Remarks
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Dispatched for Saturday sales"
                      style={{ fontSize: '0.82rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 20px',
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  flexShrink: 0
                }}
              >
                <div>
                  {modalType === 'sale' && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Revenue:</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#047857' }}>
                        ₹{(quantity * unitPrice).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {modalType === 'damage' && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Estimated Loss:</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b91c1c' }}>
                        ₹{(quantity * unitPrice).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {modalType === 'transfer_to_shop' && selectedProduct && (
                    <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700 }}>
                      Shop stock will become: {((currentSelectedWhItem?.shop_stock || 0) + quantity)} units
                    </div>
                  )}
                  {modalType === 'inward' && (
                    <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700 }}>
                      + {quantity} units adding to warehouse stock
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setModalType(null)}
                    disabled={isSubmitting}
                    style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedProduct}
                    style={{
                      backgroundColor:
                        modalType === 'inward'
                          ? '#047857'
                          : modalType === 'sale'
                          ? '#4f46e5'
                          : modalType === 'damage'
                          ? '#b91c1c'
                          : '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: !selectedProduct ? 'not-allowed' : 'pointer',
                      opacity: !selectedProduct ? 0.6 : 1
                    }}
                  >
                    {isSubmitting && <RefreshCw size={14} className="animate-spin" />}
                    {modalType === 'inward' && 'Confirm Inward Stock'}
                    {modalType === 'sale' && 'Confirm Warehouse Sale'}
                    {modalType === 'damage' && 'Confirm Warehouse Damage'}
                    {modalType === 'transfer_to_shop' && 'Confirm Dispatch to Shop'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
