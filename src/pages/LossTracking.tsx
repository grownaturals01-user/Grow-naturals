import React, { useEffect, useState, useMemo } from 'react';
import {
  TrendingDown,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Package,
  RefreshCw,
  Search,
  Filter,
  Bug,
  Droplets,
  Clock,
  ArrowRight,
  Trees,
  X,
  CheckCircle2,
  FileText,
  SlidersHorizontal,
  Info,
  Layers,
  Leaf,
  Truck,
  CloudSnow,
  HelpCircle,
  ShieldAlert,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { ProductSearchSelect } from '../components/common/ProductSearchSelect';
import { Product, InventoryLoss, InventoryLossMetrics, LossReason } from '../types';

interface ReasonMeta {
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
  bg: string;
  border: string;
}

const REASON_CONFIG: Record<LossReason, ReasonMeta> = {
  withered_decay: {
    label: 'Withered / Wilting',
    shortLabel: 'Wilting',
    icon: Leaf,
    color: '#b45309',
    bg: '#fef3c7',
    border: '#fde68a'
  },
  pest_infection: {
    label: 'Pest Infestation',
    shortLabel: 'Pests',
    icon: Bug,
    color: '#b91c1c',
    bg: '#fee2e2',
    border: '#fecaca'
  },
  root_rot: {
    label: 'Root Rot / Moisture',
    shortLabel: 'Root Rot',
    icon: Droplets,
    color: '#6d28d9',
    bg: '#ede9fe',
    border: '#ddd6fe'
  },
  physical_damage: {
    label: 'Physical Breakage',
    shortLabel: 'Breakage',
    icon: ShieldAlert,
    color: '#c2410c',
    bg: '#ffedd5',
    border: '#fed7aa'
  },
  transit_breakage: {
    label: 'Transit / Handling',
    shortLabel: 'Transit',
    icon: Truck,
    color: '#0369a1',
    bg: '#e0f2fe',
    border: '#bae6fd'
  },
  expired: {
    label: 'Expired / Shelf Life',
    shortLabel: 'Expired',
    icon: Clock,
    color: '#475569',
    bg: '#f1f5f9',
    border: '#e2e8f0'
  },
  weather_extreme: {
    label: 'Weather / Frost',
    shortLabel: 'Frost / Heat',
    icon: CloudSnow,
    color: '#0e7490',
    bg: '#ecfeff',
    border: '#a5f3fc'
  },
  other: {
    label: 'Other Spoilage',
    shortLabel: 'Other',
    icon: HelpCircle,
    color: '#4b5563',
    bg: '#f3f4f6',
    border: '#e5e7eb'
  }
};

export const LossTracking: React.FC = () => {
  const { businessId, activeBusiness } = useBusiness();
  const { user } = useAuth();

  // Data state
  const [losses, setLosses] = useState<InventoryLoss[]>([]);
  const [metrics, setMetrics] = useState<InventoryLossMetrics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReason, setSelectedReason] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month' | 'all'>('month');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [productSearchVal, setProductSearchVal] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<LossReason>('withered_decay');
  const [damageDate, setDamageDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [valuationBasis, setValuationBasis] = useState<'cost' | 'sale'>('cost');
  const [notes, setNotes] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Deletion State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load losses and products
  const fetchData = async () => {
    try {
      setLoading(true);
      const [lossesData, metricsData, prodsData] = await Promise.all([
        api.get<InventoryLoss[]>('/inventory-losses', { business_id: businessId }),
        api.get<InventoryLossMetrics>('/inventory-losses/metrics', { business_id: businessId }),
        api.get<Product[]>('/products', { business_id: businessId })
      ]);
      setLosses(lossesData);
      setMetrics(metricsData);
      setProducts(prodsData);
    } catch (err: any) {
      console.error('Failed to load loss data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [businessId]);

  // Set default reporter
  useEffect(() => {
    if (user?.name) {
      setReportedBy(user.name);
    }
  }, [user]);

  // Open modal
  const handleOpenModal = () => {
    setSelectedProduct(undefined);
    setProductSearchVal('');
    setQuantity(1);
    setReason('withered_decay');
    setDamageDate(new Date().toISOString().split('T')[0]);
    setValuationBasis('cost');
    setNotes('');
    setReportedBy(user?.name || 'Staff Member');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Damage Entry
  const handleSubmitDamage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setFormError('Please select a plant or product from the catalog.');
      return;
    }

    if (quantity <= 0) {
      setFormError('Damaged quantity must be at least 1.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      await api.post('/inventory-losses', {
        business_id: businessId,
        product_id: selectedProduct.id,
        quantity,
        reason,
        damage_date: damageDate,
        notes: notes.trim(),
        reported_by: reportedBy.trim(),
        valuation_basis: valuationBasis
      });

      setNotification({
        message: `Recorded ${quantity} damaged unit(s) of "${selectedProduct.name}". Stock deducted from inventory.`,
        type: 'success'
      });
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to record damage entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rollback / Delete Damage Entry
  const handleDeleteLoss = async (id: string, name?: string) => {
    if (!window.confirm(`Are you sure you want to rollback this damage log for "${name || 'this item'}"? The subtracted stock will be restored back to inventory.`)) {
      return;
    }

    try {
      setDeletingId(id);
      await api.delete(`/inventory-losses/${id}`);
      setNotification({
        message: `Damage record reversed. Stock successfully restored to inventory.`,
        type: 'success'
      });
      await fetchData();
    } catch (err: any) {
      setNotification({
        message: err.message || 'Failed to reverse damage entry',
        type: 'error'
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered losses
  const filteredLosses = useMemo(() => {
    return losses.filter((item) => {
      // Reason filter
      if (selectedReason !== 'all' && item.reason !== selectedReason) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const itemDate = new Date(item.damage_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateFilter === 'today') {
          const itemDay = new Date(itemDate);
          itemDay.setHours(0, 0, 0, 0);
          if (itemDay.getTime() !== today.getTime()) return false;
        } else if (dateFilter === '7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(today.getDate() - 7);
          if (itemDate < sevenDaysAgo) return false;
        } else if (dateFilter === 'month') {
          const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          if (itemDate < firstOfMonth) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.product_name?.toLowerCase().includes(q);
        const matchesSku = item.product_sku?.toLowerCase().includes(q);
        const matchesReporter = item.reported_by?.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesReporter && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [losses, selectedReason, dateFilter, searchQuery]);

  // Live calculation in modal
  const unitVal = useMemo(() => {
    if (!selectedProduct) return 0;
    if (valuationBasis === 'sale') return Number(selectedProduct.sale_price) || 0;
    return Number(selectedProduct.cost_price) > 0
      ? Number(selectedProduct.cost_price)
      : Number(selectedProduct.sale_price) || 0;
  }, [selectedProduct, valuationBasis]);

  const liveLossTotal = Number((quantity * unitVal).toFixed(2));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <TrendingDown size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', margin: 0, letterSpacing: '-0.02em' }}>
                Inventory Loss & Damage Tracking
              </h1>
              <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary, #64748b)', margin: '3px 0 0 0' }}>
                Audit daily plant mortality, decay, and damage with automatic stock deductions for <strong>{activeBusiness.name}</strong>
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn"
          onClick={handleOpenModal}
          style={{
            backgroundColor: '#dc2626',
            color: '#ffffff',
            borderColor: '#dc2626',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            fontSize: '0.875rem',
            fontWeight: 700,
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
          }}
        >
          <Plus size={16} /> Record Damage Entry
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            marginBottom: '20px',
            backgroundColor: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '12px',
            color: notification.type === 'success' ? '#166534' : '#991b1b',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {notification.type === 'success' ? <CheckCircle2 size={18} color="#16a34a" /> : <AlertTriangle size={18} color="#dc2626" />}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* KPI 1: Total Loss */}
        <div
          className="card"
          style={{
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>Total Financial Loss</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#dc2626' }}>
            ₹{Number(metrics?.total_loss_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Across {metrics?.total_records || 0} damage audit logs
          </div>
        </div>

        {/* KPI 2: Total Units Lost */}
        <div
          className="card"
          style={{
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>Total Damaged Units</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            {metrics?.total_items_lost || 0} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>units</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Subtracted from active catalog inventory
          </div>
        </div>

        {/* KPI 3: Today's Damage */}
        <div
          className="card"
          style={{
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>Today's Spoilage</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            ₹{Number(metrics?.today_loss_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px', fontWeight: 600 }}>
            {metrics?.today_items_lost || 0} unit(s) recorded today
          </div>
        </div>

        {/* KPI 4: Top Cause */}
        <div
          className="card"
          style={{
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>Primary Spoilage Cause</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {metrics?.top_reasons && metrics.top_reasons[0] ? (
              (() => {
                const rCfg = REASON_CONFIG[metrics.top_reasons[0].reason as LossReason] || REASON_CONFIG.other;
                const IconComponent = rCfg.icon;
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <IconComponent size={18} style={{ color: rCfg.color }} />
                    <span>{rCfg.label}</span>
                  </span>
                );
              })()
            ) : (
              'None Recorded'
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            {metrics?.top_reasons && metrics.top_reasons[0] ? `${metrics.top_reasons[0].units_lost} units lost to this cause` : 'No logs recorded'}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by plant name, SKU, or reporter..."
              style={{ paddingLeft: '36px', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ minWidth: '190px' }}>
            <select
              className="form-input"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              style={{ fontSize: '0.875rem' }}
            >
              <option value="all">All Spoilage Causes</option>
              {Object.entries(REASON_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filter Buttons */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
          <button
            type="button"
            className={`btn btn-sm ${dateFilter === 'today' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setDateFilter('today')}
            style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '7px' }}
          >
            Today
          </button>
          <button
            type="button"
            className={`btn btn-sm ${dateFilter === '7days' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setDateFilter('7days')}
            style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '7px' }}
          >
            7 Days
          </button>
          <button
            type="button"
            className={`btn btn-sm ${dateFilter === 'month' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setDateFilter('month')}
            style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '7px' }}
          >
            This Month
          </button>
          <button
            type="button"
            className={`btn btn-sm ${dateFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setDateFilter('all')}
            style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '7px' }}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Losses Table */}
      <div
        className="card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 18px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '14px 18px', textAlign: 'left' }}>Plant / Item Details</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Damaged Qty</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Unit Cost</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Total Loss Amount</th>
                <th style={{ padding: '14px 18px', textAlign: 'left' }}>Cause / Reason</th>
                <th style={{ padding: '14px 18px', textAlign: 'left' }}>Reported By</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#16a34a' }} />
                    <div>Loading inventory damage logs...</div>
                  </td>
                </tr>
              ) : filteredLosses.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                      <Trees size={24} style={{ color: '#94a3b8' }} />
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>No damage logs found</div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '4px' }}>
                      {searchQuery || selectedReason !== 'all' ? 'Try changing your search filters' : 'No stock damages have been recorded for this period.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLosses.map((item) => {
                  const reasonCfg = REASON_CONFIG[item.reason] || REASON_CONFIG.other;
                  const ReasonIcon = reasonCfg.icon;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Date */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap', color: '#334155' }}>
                        <div style={{ fontWeight: 600 }}>
                          {new Date(item.damage_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {item.created_at ? new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>

                      {/* Product Name & SKU */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {item.product_image_url ? (
                            <img
                              src={item.product_image_url}
                              alt={item.product_name}
                              style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0 }}>
                              <Trees size={18} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.product_name || 'Plant'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              SKU: <code>{item.product_sku || 'N/A'}</code>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Damaged Quantity */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: '#b91c1c',
                            backgroundColor: '#fee2e2',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.8125rem'
                          }}
                        >
                          -{item.quantity} units
                        </span>
                      </td>

                      {/* Unit Cost */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', color: '#64748b' }} className="tabular">
                        ₹{Number(item.unit_cost || item.unit_price).toFixed(2)}
                      </td>

                      {/* Total Loss Amount */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: '#dc2626', fontSize: '0.95rem' }} className="tabular">
                        ₹{Number(item.loss_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Cause / Reason */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '3px 9px',
                            borderRadius: '6px',
                            backgroundColor: reasonCfg.bg,
                            color: reasonCfg.color,
                            border: `1px solid ${reasonCfg.border}`
                          }}
                        >
                          <ReasonIcon size={13} />
                          <span>{reasonCfg.label}</span>
                        </span>
                        {item.notes && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.notes}>
                            {item.notes}
                          </div>
                        )}
                      </td>

                      {/* Reported By */}
                      <td style={{ padding: '14px 18px', color: '#334155', fontSize: '0.8125rem' }}>
                        {item.reported_by || 'Staff Member'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDeleteLoss(item.id, item.product_name)}
                          disabled={deletingId === item.id}
                          title="Rollback damage entry and restore stock"
                          style={{ color: '#dc2626', padding: '6px' }}
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
      </div>

      {/* Record Damage / Loss Modal */}
      {isModalOpen && (
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
              maxWidth: '680px',
              maxHeight: 'min(90vh, 780px)',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header (Fixed, non-scrolling) */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingDown size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Record Inventory Damage & Loss
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    Deducts stock immediately from active inventory and records financial loss
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '6px', color: '#64748b', borderRadius: '8px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form & Scrollable Body */}
            <form onSubmit={handleSubmitDamage} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
              <div
                style={{
                  flex: '1 1 auto',
                  overflowY: 'auto',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {formError && (
                  <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', fontSize: '0.875rem' }}>
                    {formError}
                  </div>
                )}

                {/* Step 1: Select Plant / Product */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label required" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Select Plant / Inventory Item
                  </label>
                  <ProductSearchSelect
                    products={products}
                    value={productSearchVal}
                    selectedProductId={selectedProduct?.id}
                    onChange={(name, prod) => {
                      setProductSearchVal(name);
                      setSelectedProduct(prod);
                    }}
                    placeholder="Search plant by name, category, or SKU..."
                  />
                </div>

                {/* Selected Product Live Badge Card */}
                {selectedProduct && (
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                        <Trees size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                          {selectedProduct.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          SKU: <code>{selectedProduct.sku}</code> &bull; <span style={{ textTransform: 'capitalize' }}>{selectedProduct.type}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', textAlign: 'right' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Current Stock</div>
                        <div style={{ fontWeight: 700, color: selectedProduct.stock_quantity <= 5 ? '#dc2626' : '#16a34a', fontSize: '0.875rem' }}>
                          {selectedProduct.stock_quantity} units
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Unit Cost</div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                          ₹{Number(selectedProduct.cost_price || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Quantity & Date Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label required" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Damaged Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct ? selectedProduct.stock_quantity : 9999}
                      className="form-input"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      required
                      style={{ fontSize: '0.875rem' }}
                    />
                    {selectedProduct && (
                      <div style={{ fontSize: '0.75rem', marginTop: '4px', color: quantity > selectedProduct.stock_quantity ? '#dc2626' : '#64748b' }}>
                        {quantity > selectedProduct.stock_quantity ? (
                          <span>Exceeds stock ({selectedProduct.stock_quantity} available)</span>
                        ) : (
                          <span>Remaining after deduction: <strong>{selectedProduct.stock_quantity - quantity}</strong> units</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label required" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Damage Date
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={damageDate}
                      onChange={(e) => setDamageDate(e.target.value)}
                      required
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                {/* Step 3: Professional Cause Grid with Lucide Icons */}
                <div>
                  <label className="form-label required" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                    Cause of Damage / Spoilage
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                    {(Object.keys(REASON_CONFIG) as LossReason[]).map((key) => {
                      const cfg = REASON_CONFIG[key];
                      const isSelected = reason === key;
                      const IconComp = cfg.icon;
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setReason(key)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '6px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: isSelected ? `2px solid ${cfg.color}` : '1px solid #e2e8f0',
                            backgroundColor: isSelected ? cfg.bg : '#ffffff',
                            color: isSelected ? cfg.color : '#334155',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                            outline: 'none',
                            boxShadow: isSelected ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                backgroundColor: isSelected ? '#ffffff' : cfg.bg,
                                color: cfg.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <IconComp size={15} />
                            </div>
                            {isSelected && (
                              <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: cfg.color, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={10} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: isSelected ? 700 : 500, lineHeight: 1.25 }}>
                            {cfg.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 4: Reporter & Valuation Basis */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Reported By
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={reportedBy}
                      onChange={(e) => setReportedBy(e.target.value)}
                      placeholder="e.g. Nursery Supervisor"
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Valuation Basis
                    </label>
                    <select
                      className="form-input"
                      value={valuationBasis}
                      onChange={(e) => setValuationBasis(e.target.value as any)}
                      style={{ fontSize: '0.875rem' }}
                    >
                      <option value="cost">Cost Price (Out-of-Pocket Loss)</option>
                      <option value="sale">Selling Price (Revenue Opportunity Loss)</option>
                    </select>
                  </div>
                </div>

                {/* Step 5: Remedial / Disposal Notes */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Remedial Action / Disposal Notes
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Severe spider mite attack on foliage. Disposed to compost bin."
                    style={{ fontSize: '0.875rem', resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Modal Footer (Fixed, sticky at bottom, NEVER cut off) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 24px',
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  flexShrink: 0
                }}
              >
                {selectedProduct ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Total Calculated Loss:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>
                      ₹{liveLossTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                    Select a product to view loss calculation
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedProduct}
                    style={{
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 20px',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: !selectedProduct ? 'not-allowed' : 'pointer',
                      opacity: !selectedProduct ? 0.6 : 1,
                      boxShadow: '0 1px 3px rgba(220, 38, 38, 0.2)'
                    }}
                  >
                    {isSubmitting ? <RefreshCw size={15} className="animate-spin" /> : <TrendingDown size={15} />}
                    {isSubmitting ? 'Logging...' : 'Confirm & Deduct Stock'}
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
