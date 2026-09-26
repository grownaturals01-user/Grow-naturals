import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  ArrowDownLeft,
  Building2,
  Store,
  Plus,
  Search,
  RefreshCw,
  Printer,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Package,
  Calendar,
  User,
  FileText,
  Boxes,
  Truck,
  Layers,
  Sparkles,
  X,
  Info,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { ProductSearchSelect } from '../components/common/ProductSearchSelect';
import { Product, WarehouseTransaction, WarehouseItem } from '../types';

interface TransferBatchItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export const StockTransfers: React.FC = () => {
  const { businessId, activeBusiness } = useBusiness();
  const { user } = useAuth();

  // Data State
  const [transactions, setTransactions] = useState<WarehouseTransaction[]>([]);
  const [inventory, setInventory] = useState<WarehouseItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'transfer_to_shop' | 'transfer_from_shop'>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // New Transfer Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [transferType, setTransferType] = useState<'transfer_to_shop' | 'transfer_from_shop'>('transfer_to_shop');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [performedBy, setPerformedBy] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState<string>('');

  // Transfer Items Builder
  const [transferItems, setTransferItems] = useState<TransferBatchItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [currentQty, setCurrentQty] = useState<number>(1);
  const [itemNote, setItemNote] = useState<string>('');

  // Submitting & Feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Print Slip Modal State
  const [slipModalOpen, setSlipModalOpen] = useState<boolean>(false);
  const [selectedSlipTx, setSelectedSlipTx] = useState<WarehouseTransaction | null>(null);
  const printSlipRef = useRef<HTMLDivElement>(null);

  // Load Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [txData, invData, prodData] = await Promise.all([
        api.get<WarehouseTransaction[]>('/warehouse/transactions', { business_id: businessId, limit: 300 }),
        api.get<WarehouseItem[]>('/warehouse/inventory', { business_id: businessId }),
        api.get<Product[]>('/products', { business_id: businessId }),
      ]);
      setTransactions(txData || []);
      setInventory(invData || []);
      setProducts(prodData || []);
    } catch (err: any) {
      console.error('Failed to load transfers data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [businessId]);

  // Generate Reference No
  const generateRefNo = () => {
    const prefix = activeBusiness?.invoice_prefix ? activeBusiness.invoice_prefix.replace(/[^a-zA-Z0-9]/g, '') : 'GN';
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `TRF-${prefix}-${dateStr}-${rand}`;
  };

  // Open Modal Handler
  const handleOpenTransferModal = (type: 'transfer_to_shop' | 'transfer_from_shop' = 'transfer_to_shop') => {
    setTransferType(type);
    setReferenceNo(generateRefNo());
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setPerformedBy(user?.name || '');
    setTransferNotes('');
    setTransferItems([]);
    setSelectedProduct(undefined);
    setCurrentQty(1);
    setItemNote('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Find warehouse stock for a product
  const getProductWhStock = (prodId: string) => {
    const match = inventory.find((i) => i.id === prodId);
    return match ? Number(match.warehouse_stock) || 0 : 0;
  };

  // Find shop stock for a product
  const getProductShopStock = (prodId: string) => {
    const match = products.find((p) => p.id === prodId);
    return match ? Number(match.stock_quantity) || 0 : 0;
  };

  // Add Item to Transfer Batch
  const handleAddItemToBatch = () => {
    if (!selectedProduct) {
      setFormError('Please select a product to transfer.');
      return;
    }
    if (currentQty <= 0) {
      setFormError('Transfer quantity must be greater than 0.');
      return;
    }

    const whStock = getProductWhStock(selectedProduct.id);
    const shopStock = getProductShopStock(selectedProduct.id);

    // Check availability
    if (transferType === 'transfer_to_shop' && currentQty > whStock) {
      setFormError(`Insufficient warehouse stock for ${selectedProduct.name}. Available: ${whStock}`);
      return;
    }
    if (transferType === 'transfer_from_shop' && currentQty > shopStock) {
      setFormError(`Insufficient shop stock for ${selectedProduct.name}. Available: ${shopStock}`);
      return;
    }

    // Check if item already in batch
    const existingIndex = transferItems.findIndex((item) => item.product.id === selectedProduct.id);
    if (existingIndex >= 0) {
      const updated = [...transferItems];
      const newTotalQty = updated[existingIndex].quantity + currentQty;
      if (transferType === 'transfer_to_shop' && newTotalQty > whStock) {
        setFormError(`Total quantity in batch (${newTotalQty}) exceeds warehouse stock (${whStock}).`);
        return;
      }
      if (transferType === 'transfer_from_shop' && newTotalQty > shopStock) {
        setFormError(`Total quantity in batch (${newTotalQty}) exceeds shop stock (${shopStock}).`);
        return;
      }
      updated[existingIndex].quantity = newTotalQty;
      if (itemNote) updated[existingIndex].notes = itemNote;
      setTransferItems(updated);
    } else {
      setTransferItems([
        ...transferItems,
        {
          product: selectedProduct,
          quantity: currentQty,
          notes: itemNote || undefined,
        },
      ]);
    }

    // Reset selection
    setSelectedProduct(undefined);
    setCurrentQty(1);
    setItemNote('');
    setFormError(null);
  };

  // Remove Item from Batch
  const handleRemoveBatchItem = (index: number) => {
    setTransferItems(transferItems.filter((_, idx) => idx !== index));
  };

  // Submit Batch Transfer
  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferItems.length === 0) {
      setFormError('Please add at least one product to the transfer list.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        business_id: businessId,
        type: transferType,
        reference_no: referenceNo.trim() || generateRefNo(),
        transaction_date: transactionDate,
        performed_by: performedBy.trim(),
        notes: transferNotes.trim(),
        items: transferItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          notes: item.notes,
        })),
      };

      const res = await api.post<any>('/warehouse/transfers/batch', payload);

      setIsModalOpen(false);
      setNotification({
        type: 'success',
        message: `Transfer voucher ${payload.reference_no} recorded! ${res.total_units} unit(s) moved to ${
          transferType === 'transfer_to_shop' ? 'Shop Counter' : 'Warehouse'
        }.`,
      });
      setTimeout(() => setNotification(null), 5000);

      await fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to process stock transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rollback Transfer Transaction
  const handleRevertTransaction = async (tx: WarehouseTransaction) => {
    if (!window.confirm(`Are you sure you want to revert transfer "${tx.reference_no || tx.id}"? This will return ${tx.quantity} units back.`)) {
      return;
    }

    setDeletingId(tx.id);
    try {
      await api.delete(`/warehouse/transactions/${tx.id}`);
      setNotification({
        type: 'success',
        message: 'Transfer reversed successfully and stock balances restored.',
      });
      setTimeout(() => setNotification(null), 4000);
      await fetchData();
    } catch (err: any) {
      alert(`Failed to revert transfer: ${err.message || 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Print Slip
  const handlePrintSlip = (tx: WarehouseTransaction) => {
    setSelectedSlipTx(tx);
    setSlipModalOpen(true);
  };

  const executePrint = () => {
    window.print();
  };

  // Filtered Transfer Transactions
  const transferTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const isTransfer = tx.type === 'transfer_to_shop' || tx.type === 'transfer_from_shop';
      if (!isTransfer) return false;

      // Direction Filter
      if (directionFilter !== 'all' && tx.type !== directionFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (tx.product_name || '').toLowerCase().includes(query);
        const matchesSku = (tx.product_sku || '').toLowerCase().includes(query);
        const matchesRef = (tx.reference_no || '').toLowerCase().includes(query);
        const matchesPerformer = (tx.performed_by || '').toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesRef && !matchesPerformer) return false;
      }

      // Date Filter
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        if (tx.transaction_date !== today) return false;
      } else if (dateFilter === 'this_month') {
        const thisMonth = new Date().toISOString().slice(0, 7);
        if (!tx.transaction_date.startsWith(thisMonth)) return false;
      }

      return true;
    });
  }, [transactions, directionFilter, searchQuery, dateFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const toShopTx = transactions.filter((t) => t.type === 'transfer_to_shop');
    const fromShopTx = transactions.filter((t) => t.type === 'transfer_from_shop');

    const totalToShopUnits = toShopTx.reduce((sum, t) => sum + Number(t.quantity || 0), 0);
    const totalFromShopUnits = fromShopTx.reduce((sum, t) => sum + Number(t.quantity || 0), 0);
    const totalValuation = toShopTx.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);

    return {
      toShopUnits: totalToShopUnits,
      fromShopUnits: totalFromShopUnits,
      transfersCount: toShopTx.length + fromShopTx.length,
      valuation: totalValuation,
    };
  }, [transactions]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(79, 70, 229, 0.12)',
                color: '#4f46e5',
              }}
            >
              <ArrowLeftRight size={20} />
            </span>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.4rem' }}>
              Stock Transfers & Dispatch
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                color: '#4f46e5',
                border: '1px solid rgba(79, 70, 229, 0.2)',
              }}
            >
              {activeBusiness?.name}
            </span>
          </div>
          <p className="page-description" style={{ marginTop: '4px', fontSize: '0.82rem' }}>
            Move inventory smoothly between central greenhouse / warehouse and retail shop counters with live tracking & stock reconciliation.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchData}
            title="Refresh Data"
            style={{ padding: '8px 12px', gap: '6px', fontSize: '0.8125rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenTransferModal('transfer_to_shop')}
            style={{
              padding: '8px 16px',
              gap: '6px',
              fontSize: '0.8125rem',
              backgroundColor: '#4f46e5',
              borderColor: '#4338ca',
            }}
          >
            <Plus size={16} />
            + New Warehouse ➔ Shop Transfer
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: notification.type === 'success' ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)',
            color: notification.type === 'success' ? '#15803d' : '#b91c1c',
            border: `1px solid ${notification.type === 'success' ? 'rgba(22, 163, 74, 0.25)' : 'rgba(220, 38, 38, 0.25)'}`,
            fontWeight: 500,
            fontSize: '0.875rem',
          }}
        >
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 2. Key Metrics Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '22px',
        }}
      >
        {/* Card 1: Warehouse to Shop */}
        <div
          className="card"
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderLeft: '4px solid #4f46e5',
          }}
        >
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
            }}
          >
            <Store size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Dispatched to Shop
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#4f46e5', marginTop: '2px' }}>
              {metrics.toShopUnits.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>units</span>
            </div>
          </div>
        </div>

        {/* Card 2: Returned from Shop */}
        <div
          className="card"
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderLeft: '4px solid #0d9488',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(13, 148, 136, 0.1)',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Returned to Warehouse
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0d9488', marginTop: '2px' }}>
              {metrics.fromShopUnits.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>units</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Transfer Records */}
        <div
          className="card"
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderLeft: '4px solid #16a34a',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(22, 163, 74, 0.1)',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Boxes size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Transfer Actions Logged
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
              {metrics.transfersCount}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>entries</span>
            </div>
          </div>
        </div>

        {/* Card 4: Transferred Valuation */}
        <div
          className="card"
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderLeft: '4px solid #d97706',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(217, 119, 6, 0.1)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Truck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Total Stock Value Moved
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#d97706', marginTop: '2px' }}>
              ₹{metrics.valuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter and Action Bar */}
      <div className="card" style={{ marginBottom: '18px', padding: '14px 18px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '0.8125rem' }}
              placeholder="Search by product, SKU, transfer #, or handler..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                  color: 'var(--color-text-muted)',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Direction Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className={`btn btn-sm ${directionFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setDirectionFilter('all')}
              style={{ fontSize: '0.78rem' }}
            >
              All Movements ({transferTransactions.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${directionFilter === 'transfer_to_shop' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setDirectionFilter('transfer_to_shop')}
              style={{ fontSize: '0.78rem' }}
            >
              📦 Warehouse ➔ Shop
            </button>
            <button
              type="button"
              className={`btn btn-sm ${directionFilter === 'transfer_from_shop' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setDirectionFilter('transfer_from_shop')}
              style={{ fontSize: '0.78rem' }}
            >
              🏬 Shop ➔ Warehouse
            </button>
          </div>

          {/* Date Filter */}
          <select
            className="form-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: '150px', fontSize: '0.8125rem' }}
          >
            <option value="all">All Dates</option>
            <option value="today">Today Only</option>
            <option value="this_month">This Month</option>
          </select>

          {/* Secondary Return Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleOpenTransferModal('transfer_from_shop')}
            title="Return shop counter items back into warehouse"
            style={{ fontSize: '0.78rem', gap: '4px' }}
          >
            <ArrowDownLeft size={14} />
            + Return to Warehouse
          </button>
        </div>
      </div>

      {/* 4. Transfer Transactions Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-surface-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Date & Slip #</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Product & Category</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>Direction</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>Transferred Qty</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>Warehouse Stock</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Handler & Notes</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--color-text-muted)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#4f46e5' }} />
                    <div>Loading transfer ledger...</div>
                  </td>
                </tr>
              ) : transferTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                      <ArrowLeftRight size={24} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                      No Stock Transfers Recorded
                    </div>
                    <div style={{ fontSize: '0.8rem', maxWidth: '380px', margin: '0 auto 16px auto' }}>
                      Click "+ New Warehouse ➔ Shop Transfer" above to dispatch products from warehouse stock directly to the shop counter.
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenTransferModal('transfer_to_shop')}
                    >
                      <Plus size={14} /> Create First Transfer
                    </button>
                  </td>
                </tr>
              ) : (
                transferTransactions.map((tx) => {
                  const isToShop = tx.type === 'transfer_to_shop';
                  return (
                    <tr
                      key={tx.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background-color var(--transition-fast)',
                      }}
                    >
                      {/* Date & Slip # */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {tx.transaction_date || (tx.created_at ? tx.created_at.slice(0, 10) : '—')}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                          {tx.reference_no || `TRF-${tx.id.slice(-6).toUpperCase()}`}
                        </div>
                      </td>

                      {/* Product */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {tx.product_image_url ? (
                            <img
                              src={tx.product_image_url}
                              alt=""
                              style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(79, 70, 229, 0.08)',
                                color: '#4f46e5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Package size={14} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {tx.product_name || 'Product'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                              SKU: <span style={{ fontFamily: 'monospace' }}>{tx.product_sku || '—'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Direction */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: isToShop ? 'rgba(79, 70, 229, 0.1)' : 'rgba(13, 148, 136, 0.1)',
                            color: isToShop ? '#4f46e5' : '#0d9488',
                            border: `1px solid ${isToShop ? 'rgba(79, 70, 229, 0.25)' : 'rgba(13, 148, 136, 0.25)'}`,
                          }}
                        >
                          {isToShop ? (
                            <>
                              <Building2 size={12} /> ➔ <Store size={12} /> Warehouse ➔ Shop
                            </>
                          ) : (
                            <>
                              <Store size={12} /> ➔ <Building2 size={12} /> Shop ➔ Warehouse
                            </>
                          )}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isToShop ? '#4f46e5' : '#0d9488' }}>
                          {isToShop ? `+${tx.quantity}` : `-${tx.quantity}`} units
                        </div>
                        {tx.total_amount > 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                            Val: ₹{Number(tx.total_amount).toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Warehouse Stock Changes */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {tx.previous_stock}
                        </span>{' '}
                        <span style={{ color: 'var(--color-text-muted)' }}>➔</span>{' '}
                        <strong style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>
                          {tx.new_stock}
                        </strong>
                      </td>

                      {/* Handler & Notes */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          {tx.performed_by ? `By: ${tx.performed_by}` : 'Store Staff'}
                        </div>
                        {tx.notes && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            {tx.notes}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon-only"
                            onClick={() => handlePrintSlip(tx)}
                            title="Print Transfer Voucher / Slip"
                            style={{ width: '28px', height: '28px', padding: 0 }}
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon-only"
                            onClick={() => handleRevertTransaction(tx)}
                            disabled={deletingId === tx.id}
                            title="Revert Transfer (Rollback Stock)"
                            style={{ width: '28px', height: '28px', padding: 0, color: '#dc2626' }}
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
      </div>

      {/* ========================================================================= */}
      {/* MODAL: NEW STOCK TRANSFER (SINGLE / MULTI-ITEM DISPATCH MANIFEST)        */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '720px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
              animation: 'modalSlideIn 0.2s ease-out',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--color-bg-surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: transferType === 'transfer_to_shop' ? 'rgba(79, 70, 229, 0.12)' : 'rgba(13, 148, 136, 0.12)',
                    color: transferType === 'transfer_to_shop' ? '#4f46e5' : '#0d9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowLeftRight size={18} />
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                    {transferType === 'transfer_to_shop' ? 'Dispatch Products to Shop Counter' : 'Return Shop Products to Warehouse'}
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    {transferType === 'transfer_to_shop'
                      ? 'Deducts stock from greenhouse/warehouse and credits retail shop counter'
                      : 'Returns excess/unsold counter stock back into greenhouse/warehouse storage'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon-only"
                onClick={() => setIsModalOpen(false)}
                style={{ width: '30px', height: '30px', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formError && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    border: '1px solid rgba(220, 38, 38, 0.25)',
                    borderRadius: '6px',
                    color: '#dc2626',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Transfer Direction Toggle */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  padding: '4px',
                  backgroundColor: 'var(--color-bg-surface-secondary)',
                  borderRadius: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setTransferType('transfer_to_shop')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: transferType === 'transfer_to_shop' ? '#4f46e5' : 'transparent',
                    color: transferType === 'transfer_to_shop' ? '#ffffff' : 'var(--color-text-primary)',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Building2 size={16} /> Warehouse ➔ Shop Counter
                </button>
                <button
                  type="button"
                  onClick={() => setTransferType('transfer_from_shop')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: transferType === 'transfer_from_shop' ? '#0d9488' : 'transparent',
                    color: transferType === 'transfer_from_shop' ? '#ffffff' : 'var(--color-text-primary)',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Store size={16} /> Shop Counter ➔ Warehouse
                </button>
              </div>

              {/* Manifest Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Transfer Slip #</label>
                  <input
                    type="text"
                    className="form-input tabular"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. TRF-GN-001"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Transfer Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Handled / Dispatched By</label>
                  <input
                    type="text"
                    className="form-input"
                    value={performedBy}
                    onChange={(e) => setPerformedBy(e.target.value)}
                    placeholder="e.g. Ramesh / Store Manager"
                  />
                </div>
              </div>

              {/* Product Selector Box */}
              <div
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '14px',
                  backgroundColor: 'var(--color-bg-surface-secondary)',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                  Select Products to Transfer
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <ProductSearchSelect
                    products={products}
                    value={selectedProduct?.name || ''}
                    selectedProductId={selectedProduct?.id}
                    onChange={(_name, product) => {
                      setSelectedProduct(product);
                      setFormError(null);
                    }}
                    placeholder="Search plant or product name, botanical variety, SKU..."
                  />

                  {selectedProduct && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Warehouse Stock</div>
                          <div style={{ fontWeight: 700, color: '#4f46e5', fontSize: '0.9rem' }}>
                            {getProductWhStock(selectedProduct.id)} units
                          </div>
                        </div>
                        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)' }} />
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Shop Counter Stock</div>
                          <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.9rem' }}>
                            {getProductShopStock(selectedProduct.id)} units
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Qty:</label>
                          <input
                            type="number"
                            min="1"
                            max={
                              transferType === 'transfer_to_shop'
                                ? getProductWhStock(selectedProduct.id)
                                : getProductShopStock(selectedProduct.id)
                            }
                            className="form-input tabular"
                            style={{ width: '75px', textAlign: 'center', padding: '6px' }}
                            value={currentQty}
                            onChange={(e) => setCurrentQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          />
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={handleAddItemToBatch}
                          style={{
                            backgroundColor: transferType === 'transfer_to_shop' ? '#4f46e5' : '#0d9488',
                            borderColor: transferType === 'transfer_to_shop' ? '#4338ca' : '#0f766e',
                          }}
                        >
                          <Plus size={14} /> Add to Manifest
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Items in Transfer Manifest Table */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700 }}>
                    Transfer Manifest Items ({transferItems.length})
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Total Units:{' '}
                    <strong>{transferItems.reduce((sum, item) => sum + item.quantity, 0)}</strong>
                  </span>
                </div>

                {transferItems.length === 0 ? (
                  <div
                    style={{
                      border: '1px dashed var(--color-border)',
                      borderRadius: '6px',
                      padding: '24px',
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                      fontSize: '0.8rem',
                    }}
                  >
                    No products added yet. Use the search box above to pick products for this transfer voucher.
                  </div>
                ) : (
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--color-bg-surface-secondary)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Product</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Transfer Qty</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center' }}>Projected WH Stock</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center' }}>Projected Shop Stock</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center' }}>Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transferItems.map((item, idx) => {
                          const wh = getProductWhStock(item.product.id);
                          const shop = getProductShopStock(item.product.id);
                          const newWh = transferType === 'transfer_to_shop' ? wh - item.quantity : wh + item.quantity;
                          const newShop = transferType === 'transfer_to_shop' ? shop + item.quantity : shop - item.quantity;

                          return (
                            <tr key={item.product.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '8px 12px' }}>
                                <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                  SKU: {item.product.sku}
                                </div>
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#4f46e5' }}>
                                {item.quantity} units
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: '0.78rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>{wh}</span> ➔ <strong>{newWh}</strong>
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: '0.78rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>{shop}</span> ➔ <strong>{newShop}</strong>
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-icon-only"
                                  onClick={() => handleRemoveBatchItem(idx)}
                                  style={{ width: '24px', height: '24px', padding: 0, color: '#dc2626' }}
                                >
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Manifest Remarks / Dispatch Notes</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. Dispatched for weekend garden festival counter display..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                backgroundColor: 'var(--color-bg-surface-secondary)',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmitTransfer}
                disabled={isSubmitting || transferItems.length === 0}
                style={{
                  backgroundColor: transferType === 'transfer_to_shop' ? '#4f46e5' : '#0d9488',
                  borderColor: transferType === 'transfer_to_shop' ? '#4338ca' : '#0f766e',
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Execute Transfer ({transferItems.reduce((s, i) => s + i.quantity, 0)} Units)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINTABLE TRANSFER SLIP / DISPATCH CHALLAN                         */}
      {/* ========================================================================= */}
      {slipModalOpen && selectedSlipTx && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {/* Header Controls */}
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                Internal Stock Transfer Voucher
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={executePrint}
                  style={{ gap: '4px' }}
                >
                  <Printer size={14} /> Print Voucher
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon-only"
                  onClick={() => setSlipModalOpen(false)}
                  style={{ width: '28px', height: '28px' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Printable Slip Content */}
            <div
              ref={printSlipRef}
              style={{
                padding: '24px',
                overflowY: 'auto',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.85rem',
              }}
            >
              {/* Slip Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '14px', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  {activeBusiness?.name || 'Grow Naturals'}
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                  INTERNAL STOCK TRANSFER SLIP / GATE PASS
                </div>
                {activeBusiness?.gstin && (
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>GSTIN: {activeBusiness.gstin}</div>
                )}
              </div>

              {/* Meta Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem', marginBottom: '16px' }}>
                <div>
                  <div style={{ color: '#64748b' }}>Transfer Voucher No:</div>
                  <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                    {selectedSlipTx.reference_no || `TRF-${selectedSlipTx.id.slice(-6).toUpperCase()}`}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>Date & Time:</div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedSlipTx.transaction_date || (selectedSlipTx.created_at ? selectedSlipTx.created_at.slice(0, 10) : '—')}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>From Location:</div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedSlipTx.type === 'transfer_to_shop' ? 'Main Warehouse / Greenhouse' : 'Retail Shop Counter'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>To Destination:</div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedSlipTx.type === 'transfer_to_shop' ? 'Retail Shop Counter' : 'Main Warehouse / Greenhouse'}
                  </div>
                </div>
              </div>

              {/* Item Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Item / Botanical Specimen</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>SKU</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>{selectedSlipTx.product_name}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace', color: '#64748b' }}>
                      {selectedSlipTx.product_sku || '—'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>
                      {selectedSlipTx.quantity} units
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Stock Reconcile Box */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginBottom: '20px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>Warehouse Before: </span>
                  <strong>{selectedSlipTx.previous_stock}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Warehouse After: </span>
                  <strong>{selectedSlipTx.new_stock}</strong>
                </div>
              </div>

              {selectedSlipTx.notes && (
                <div style={{ fontSize: '0.75rem', marginBottom: '20px', color: '#475569', fontStyle: 'italic' }}>
                  Note: {selectedSlipTx.notes}
                </div>
              )}

              {/* Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: '35px' }} />
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.72rem', color: '#475569' }}>
                    Dispatched By: <strong>{selectedSlipTx.performed_by || 'Storekeeper'}</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: '35px' }} />
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.72rem', color: '#475569' }}>
                    Received At Counter By (Signature)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
