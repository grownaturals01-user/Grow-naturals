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
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', margin: 0, letterSpacing: '-0.02em' }}>
              Warehouse & Nursery Stock
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary, #64748b)', margin: '2px 0 0 0' }}>
              Central nursery stock, warehouse direct sales, damage tracking, and shop dispatches for <strong>{activeBusiness.name}</strong>
            </p>
          </div>
        </div>

        {/* Top Quick Actions Bar */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            onClick={() => handleOpenActionModal('inward')}
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowDownLeft size={15} /> + Inward Stock
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => handleOpenActionModal('sale')}
            style={{
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShoppingBag size={15} /> + Warehouse Sale
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => handleOpenActionModal('damage')}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <TrendingDown size={15} /> + Log Damage
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => handleOpenActionModal('transfer_to_shop')}
            style={{
              backgroundColor: '#d97706',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeftRight size={15} /> ⇄ Quick Transfer
          </button>

          <Link
            to="/transfers"
            className="btn btn-secondary"
            style={{
              padding: '7px 14px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none'
            }}
          >
            <Store size={15} /> All Transfers & Slips ➔
          </Link>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            marginBottom: '18px',
            backgroundColor: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '10px',
            color: notification.type === 'success' ? '#166534' : '#991b1b',
            fontSize: '0.84rem',
            fontWeight: 500
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {notification.type === 'success' ? <CheckCircle2 size={17} color="#16a34a" /> : <AlertTriangle size={17} color="#dc2626" />}
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

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {/* KPI 1: Remaining Warehouse Stock */}
        <div
          className="card"
          style={{
            padding: '18px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Warehouse Remaining Stock</span>
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', backgroundColor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={15} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            {metrics?.total_warehouse_units || 0} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>units</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#4f46e5', marginTop: '3px', fontWeight: 600 }}>
            Valuation: ₹{Number(metrics?.total_warehouse_valuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* KPI 2: Warehouse Sales */}
        <div
          className="card"
          style={{
            padding: '18px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Direct Warehouse Sales</span>
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={15} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>
            ₹{Number(metrics?.total_sales_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
            {metrics?.total_sales_units || 0} units across {metrics?.sales_transactions_count || 0} orders
          </div>
        </div>

        {/* KPI 3: Warehouse Damages */}
        <div
          className="card"
          style={{
            padding: '18px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Warehouse Damage / Spoilage</span>
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={15} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>
            ₹{Number(metrics?.total_damage_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
            {metrics?.total_damage_units || 0} damaged units logged
          </div>
        </div>

        {/* KPI 4: Shop Dispatches */}
        <div
          className="card"
          style={{
            padding: '18px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Dispatched to Retail Counter</span>
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={15} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            {metrics?.total_transfers_units || 0} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>units</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#d97706', marginTop: '3px', fontWeight: 600 }}>
            {metrics?.transfer_records_count || 0} dispatch shipments
          </div>
        </div>
      </div>

      {/* Main Section Card */}
      <div
        className="card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)'
        }}
      >
        {/* Clean Segmented Tab Navigation Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Segmented Pill Tabs */}
          <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '9px', gap: '3px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 13px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: activeTab === 'inventory' ? '#ffffff' : 'transparent',
                color: activeTab === 'inventory' ? '#0f172a' : '#64748b',
                fontWeight: activeTab === 'inventory' ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'inventory' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Package size={15} color={activeTab === 'inventory' ? '#4f46e5' : '#64748b'} />
              <span>Stock Balances</span>
              <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '6px', backgroundColor: '#e2e8f0', color: '#334155', fontWeight: 700 }}>
                {inventory.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sales')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 13px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: activeTab === 'sales' ? '#ffffff' : 'transparent',
                color: activeTab === 'sales' ? '#0f172a' : '#64748b',
                fontWeight: activeTab === 'sales' ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'sales' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <ShoppingBag size={15} color={activeTab === 'sales' ? '#059669' : '#64748b'} />
              <span>Warehouse Sales</span>
              <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '6px', backgroundColor: '#e2e8f0', color: '#334155', fontWeight: 700 }}>
                {salesTransactions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('damages')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 13px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: activeTab === 'damages' ? '#ffffff' : 'transparent',
                color: activeTab === 'damages' ? '#0f172a' : '#64748b',
                fontWeight: activeTab === 'damages' ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'damages' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <TrendingDown size={15} color={activeTab === 'damages' ? '#dc2626' : '#64748b'} />
              <span>Warehouse Damages</span>
              <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '6px', backgroundColor: '#e2e8f0', color: '#334155', fontWeight: 700 }}>
                {damageTransactions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 13px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: activeTab === 'ledger' ? '#ffffff' : 'transparent',
                color: activeTab === 'ledger' ? '#0f172a' : '#64748b',
                fontWeight: activeTab === 'ledger' ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'ledger' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={15} color={activeTab === 'ledger' ? '#0284c7' : '#64748b'} />
              <span>Movements Ledger</span>
              <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '6px', backgroundColor: '#e2e8f0', color: '#334155', fontWeight: 700 }}>
                {transactions.length}
              </span>
            </button>
          </div>

          {/* Quick Item Counter */}
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            {activeTab === 'inventory' && `Showing ${filteredInventory.length} botanical items`}
            {activeTab === 'sales' && `${salesTransactions.length} direct sales recorded`}
            {activeTab === 'damages' && `${damageTransactions.length} spoilage logs recorded`}
            {activeTab === 'ledger' && `${transactions.length} total movement events`}
          </div>
        </div>

        {/* Clean Filter Bar for Inventory Tab */}
        {activeTab === 'inventory' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 18px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
              {/* Search */}
              <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by plant name, SKU, or variety..."
                  style={{ paddingLeft: '32px', fontSize: '0.8125rem', height: '34px', backgroundColor: '#ffffff' }}
                />
              </div>

              {/* Category Dropdown */}
              <div style={{ minWidth: '170px' }}>
                <select
                  className="form-input"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ fontSize: '0.8125rem', height: '34px', backgroundColor: '#ffffff' }}
                >
                  <option value="all">All Categories</option>
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Status Dropdown */}
              <div style={{ minWidth: '150px' }}>
                <select
                  className="form-input"
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as any)}
                  style={{ fontSize: '0.8125rem', height: '34px', backgroundColor: '#ffffff' }}
                >
                  <option value="all">All Stock Levels</option>
                  <option value="in_stock">In Warehouse Stock (&gt; 0)</option>
                  <option value="out_of_stock">Out of Stock (= 0)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Clean, Spacious Warehouse Stock Table */}
        {activeTab === 'inventory' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#ffffff', borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 18px', textAlign: 'left', minWidth: '320px' }}>Plant / Item</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', width: '180px' }}>Warehouse Stock</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', width: '160px' }}>Retail Shop Stock</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', width: '140px' }}>Cost Price</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right', width: '220px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#4f46e5' }} />
                      <div>Loading warehouse inventory...</div>
                    </td>
                  </tr>
                ) : filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '44px 20px', color: '#94a3b8' }}>
                      <Building2 size={30} style={{ margin: '0 auto 8px auto', color: '#cbd5e1' }} />
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>No items match your filter</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>
                        {searchQuery ? 'Try clearing your search query' : 'Use "+ Inward Stock" to add inventory to the warehouse.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Botanical Item with image, name, SKU and category */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
                              <Trees size={20} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', lineHeight: 1.3 }}>
                              {item.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                              <code style={{ fontSize: '0.72rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                                {item.sku}
                              </code>
                              {item.category_name && (
                                <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                                  &bull; {item.category_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Warehouse Stock Badge */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '0.88rem',
                              padding: '4px 12px',
                              borderRadius: '7px',
                              display: 'inline-block',
                              backgroundColor: item.warehouse_stock > 5 ? '#e0e7ff' : item.warehouse_stock > 0 ? '#fef3c7' : '#fee2e2',
                              color: item.warehouse_stock > 5 ? '#3730a3' : item.warehouse_stock > 0 ? '#b45309' : '#b91c1c'
                            }}
                          >
                            {item.warehouse_stock} units
                          </span>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>
                            {item.warehouse_stock > 0
                              ? `Val: ₹${(item.warehouse_stock * (Number(item.cost_price) || 0)).toLocaleString('en-IN')}`
                              : 'Out of stock'}
                          </div>
                        </div>
                      </td>

                      {/* Shop Counter Stock */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                            {item.shop_stock} units
                          </span>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '3px' }}>
                            Retail display
                          </div>
                        </div>
                      </td>

                      {/* Cost Price */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }} className="tabular">
                          ₹{Number(item.cost_price || 0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                          MRP: ₹{Number(item.sale_price || 0).toFixed(2)}
                        </div>
                      </td>

                      {/* Spacious Action Buttons (No Clipping!) */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            title="Inward Stock Arrival"
                            onClick={() => handleOpenActionModal('inward', item as any)}
                            style={{ padding: '5px 9px', color: '#059669', backgroundColor: '#ecfdf5', fontSize: '0.78rem', fontWeight: 600, borderRadius: '6px' }}
                          >
                            + Stock
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            title="Direct Warehouse Sale"
                            onClick={() => handleOpenActionModal('sale', item as any)}
                            disabled={item.warehouse_stock <= 0}
                            style={{ padding: '5px 9px', color: '#4f46e5', backgroundColor: '#eef2ff', fontSize: '0.78rem', fontWeight: 600, borderRadius: '6px', opacity: item.warehouse_stock <= 0 ? 0.4 : 1 }}
                          >
                            Sale
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            title="Dispatch to Shop Counter"
                            onClick={() => handleOpenActionModal('transfer_to_shop', item as any)}
                            disabled={item.warehouse_stock <= 0}
                            style={{ padding: '5px 9px', color: '#d97706', backgroundColor: '#fffbeb', fontSize: '0.78rem', fontWeight: 600, borderRadius: '6px', opacity: item.warehouse_stock <= 0 ? 0.4 : 1 }}
                          >
                            Transfer
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            title="Log Warehouse Damage"
                            onClick={() => handleOpenActionModal('damage', item as any)}
                            disabled={item.warehouse_stock <= 0}
                            style={{ padding: '5px 7px', color: '#dc2626', backgroundColor: '#fef2f2', fontSize: '0.78rem', fontWeight: 600, borderRadius: '6px', opacity: item.warehouse_stock <= 0 ? 0.4 : 1 }}
                          >
                            <TrendingDown size={14} />
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
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#ffffff', borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 18px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left' }}>Plant / Item</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left' }}>Buyer / Customer</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Quantity</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Unit Rate</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Total Revenue</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left' }}>Notes / Ref</th>
                  <th style={{ padding: '12px 18px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {salesTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                      <ShoppingBag size={30} style={{ margin: '0 auto 8px auto', color: '#cbd5e1' }} />
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>No warehouse direct sales logged</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>
                        Click "+ Warehouse Sale" to record bulk sales directly from warehouse stock.
                      </div>
                    </td>
                  </tr>
                ) : (
                  salesTransactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>
                          {new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{tx.product_name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>SKU: <code>{tx.product_sku}</code></div>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#334155', fontWeight: 600 }}>
                        {tx.buyer_name || 'Direct Wholesale Buyer'}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                        {tx.quantity} units
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right', color: '#64748b' }} className="tabular">
                        ₹{Number(tx.unit_price).toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: '0.92rem' }} className="tabular">
                        ₹{Number(tx.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8rem', color: '#64748b' }}>
                        {tx.notes || tx.reference_no || '-'}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleRollback(tx.id, tx.product_name)}
                          disabled={deletingId === tx.id}
                          title="Rollback sale and restore stock"
                          style={{ color: '#dc2626', padding: '5px' }}
                        >
                          <Trash2 size={15} />
                        </button>
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
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#ffffff', borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 18px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left' }}>Plant / Item</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Damaged Qty</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Loss Value</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left' }}>Cause / Reason</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left' }}>Reported By</th>
                  <th style={{ padding: '12px 18px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {damageTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                      <TrendingDown size={30} style={{ margin: '0 auto 8px auto', color: '#cbd5e1' }} />
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>No warehouse damages logged</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>
                        Click "+ Log Damage" if plants in the warehouse or greenhouse show wilting, pests, or decay.
                      </div>
                    </td>
                  </tr>
                ) : (
                  damageTransactions.map((tx) => {
                    const rCfg = DAMAGE_REASONS[tx.damage_reason || ''] || DAMAGE_REASONS.other;
                    const ReasonIcon = rCfg.icon;
                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, color: '#334155' }}>
                            {new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{tx.product_name}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>SKU: <code>{tx.product_sku}</code></div>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: '#b91c1c', backgroundColor: '#fee2e2', padding: '3px 8px', borderRadius: '6px', fontSize: '0.8125rem' }}>
                            -{tx.quantity} units
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right', color: '#64748b' }} className="tabular">
                          ₹{Number(tx.unit_price).toFixed(2)}
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: '#dc2626', fontSize: '0.92rem' }} className="tabular">
                          ₹{Number(tx.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 600, padding: '3px 9px', borderRadius: '6px', backgroundColor: rCfg.bg, color: rCfg.color, border: `1px solid ${rCfg.border}` }}>
                            <ReasonIcon size={13} />
                            <span>{rCfg.label}</span>
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#334155', fontSize: '0.8125rem' }}>
                          {tx.performed_by || 'Staff'}
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleRollback(tx.id, tx.product_name)}
                            disabled={deletingId === tx.id}
                            title="Rollback damage and restore stock"
                            style={{ color: '#dc2626', padding: '5px' }}
                          >
                            <Trash2 size={15} />
                          </button>
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
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#ffffff', borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 18px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left' }}>Movement Type</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left' }}>Item Details</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Quantity</th>
                  <th style={{ padding: '12px 18px', textAlign: 'center' }}>Stock Balance</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left' }}>Notes / Handled By</th>
                  <th style={{ padding: '12px 18px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                      <Layers size={30} style={{ margin: '0 auto 8px auto', color: '#cbd5e1' }} />
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>No movement activity recorded</div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    let badgeColor = '#4f46e5';
                    let badgeBg = '#e0e7ff';
                    let label = 'Movement';

                    if (tx.type === 'inward') {
                      badgeColor = '#059669';
                      badgeBg = '#d1fae5';
                      label = 'Stock Inward (Arrival)';
                    } else if (tx.type === 'sale') {
                      badgeColor = '#4338ca';
                      badgeBg = '#e0e7ff';
                      label = 'Warehouse Sale';
                    } else if (tx.type === 'damage') {
                      badgeColor = '#dc2626';
                      badgeBg = '#fee2e2';
                      label = 'Warehouse Damage';
                    } else if (tx.type === 'transfer_to_shop') {
                      badgeColor = '#d97706';
                      badgeBg = '#fef3c7';
                      label = 'Dispatched to Shop';
                    }

                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, color: '#334155' }}>
                            {new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {new Date(tx.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: badgeBg, color: badgeColor }}>
                            {label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{tx.product_name}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>SKU: <code>{tx.product_sku}</code></div>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700 }}>
                          <span style={{ color: tx.type === 'inward' ? '#059669' : '#dc2626' }}>
                            {tx.type === 'inward' ? `+${tx.quantity}` : `-${tx.quantity}`} units
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'center', fontSize: '0.8125rem' }}>
                          <span style={{ color: '#64748b' }}>{tx.previous_stock}</span> &rarr;{' '}
                          <strong style={{ color: '#0f172a' }}>{tx.new_stock}</strong>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600 }} className="tabular">
                          {Number(tx.total_amount) > 0 ? `₹${Number(tx.total_amount).toFixed(2)}` : '-'}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '0.8rem', color: '#475569' }}>
                          <div>{tx.notes || tx.buyer_name || '-'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>By: {tx.performed_by || 'Staff'}</div>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleRollback(tx.id, tx.product_name)}
                            disabled={deletingId === tx.id}
                            title="Rollback transaction and restore stock"
                            style={{ color: '#dc2626', padding: '5px' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modals */}
      {modalType && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              maxHeight: 'min(90vh, 740px)',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header (Sticky) */}
            <div
              style={{
                padding: '16px 22px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
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
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {modalType === 'inward' && 'Record Inward Stock Arrival'}
                    {modalType === 'sale' && 'Record Warehouse Direct Sale'}
                    {modalType === 'damage' && 'Log Warehouse Damage / Spoilage'}
                    {modalType === 'transfer_to_shop' && 'Dispatch Stock to Shop Counter'}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0' }}>
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
                style={{ padding: '6px', color: '#64748b', borderRadius: '8px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitTransaction} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
              <div
                style={{
                  flex: '1 1 auto',
                  overflowY: 'auto',
                  padding: '18px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                {formError && (
                  <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.84rem' }}>
                    {formError}
                  </div>
                )}

                {/* Select Plant */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label required" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
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
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                        {selectedProduct.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        SKU: <code>{selectedProduct.sku}</code> &bull; Retail MRP: ₹{Number(selectedProduct.sale_price).toFixed(2)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', textAlign: 'right' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Warehouse Stock</div>
                        <div style={{ fontWeight: 700, color: currentSelectedWhItem.warehouse_stock <= 5 ? '#dc2626' : '#4f46e5', fontSize: '0.84rem' }}>
                          {currentSelectedWhItem.warehouse_stock} units
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Shop Stock</div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.84rem' }}>
                          {currentSelectedWhItem.shop_stock} units
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quantity & Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label required" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Quantity ({modalType === 'inward' ? 'Units Received' : modalType === 'sale' ? 'Units Sold' : modalType === 'damage' ? 'Damaged Units' : 'Units to Dispatch'})
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      required
                      style={{ fontSize: '0.85rem' }}
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
                    <label className="form-label required" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Date
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      required
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                {/* Sale Details */}
                {modalType === 'sale' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label required" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                        Buyer / Customer / Project
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="e.g. Kaveri Landscaping / Walk-in"
                        required
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label required" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
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
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                )}

                {/* Damage Reason Selector */}
                {modalType === 'damage' && (
                  <div>
                    <label className="form-label required" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
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
                              borderRadius: '8px',
                              border: isSelected ? `2px solid ${cfg.color}` : '1px solid #e2e8f0',
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
                            <span style={{ fontSize: '0.72rem', fontWeight: isSelected ? 700 : 500, lineHeight: 1.2 }}>
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
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Reference #
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      placeholder="e.g. WH-SO-1029 / PO-45"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Notes / Remarks
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Dispatched for Saturday sales"
                      style={{ fontSize: '0.85rem' }}
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
                  padding: '12px 22px',
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  flexShrink: 0
                }}
              >
                <div>
                  {modalType === 'sale' && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Total Revenue:</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>
                        ₹{(quantity * unitPrice).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {modalType === 'damage' && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Estimated Loss:</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#dc2626' }}>
                        ₹{(quantity * unitPrice).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {modalType === 'transfer_to_shop' && selectedProduct && (
                    <div style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 600 }}>
                      Shop stock will become: {((currentSelectedWhItem?.shop_stock || 0) + quantity)} units
                    </div>
                  )}
                  {modalType === 'inward' && (
                    <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
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
                    style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedProduct}
                    style={{
                      backgroundColor:
                        modalType === 'inward'
                          ? '#059669'
                          : modalType === 'sale'
                          ? '#4f46e5'
                          : modalType === 'damage'
                          ? '#dc2626'
                          : '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '7px',
                      padding: '7px 18px',
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
