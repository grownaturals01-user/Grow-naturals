import React, { useState, useEffect, useRef } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  Calendar,
  FileText,
  RotateCcw,
  Package,
  Layers,
  Clock,
  Receipt,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Info,
  ChevronDown,
  UserCheck,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Flag,
  Hash,
  ShoppingBag,
  Check
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { businessId, business } = useBusiness();
  const { user } = useAuth();

  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL' | 'CUSTOM'>('1Y');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const [showDateDropdown, setShowDateDropdown] = useState<boolean>(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [txTab, setTxTab] = useState<'sale' | 'purchase' | 'quotation' | 'expenses' | 'invoices'>('sale');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setShowDateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const datePresets: Array<{ key: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'; label: string }> = [
    { key: '1D', label: 'Today' },
    { key: '1W', label: 'Last 7 Days' },
    { key: '1M', label: 'Last 30 Days' },
    { key: '3M', label: 'Last 3 Months' },
    { key: '6M', label: 'Last 6 Months' },
    { key: '1Y', label: 'Last 1 Year' },
    { key: 'ALL', label: 'All Time' },
  ];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const params: any = { business_id: businessId };
    if (timeRange === 'CUSTOM' && startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    } else {
      params.range = timeRange;
    }

    api
      .get('/reports/dashboard', params)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => console.error('Dashboard load error:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [businessId, timeRange, startDate, endDate]);

  const getDateRangeLabel = () => {
    const today = new Date();
    const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    
    if (timeRange === 'CUSTOM' && startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      return `${formatDate(s)} - ${formatDate(e)}`;
    }
    if (timeRange === '1D') return formatDate(today);
    if (timeRange === '1W') {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      return `${formatDate(past)} - ${formatDate(today)}`;
    }
    if (timeRange === '1M') {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      return `${formatDate(past)} - ${formatDate(today)}`;
    }
    if (timeRange === '3M') {
      const past = new Date(today);
      past.setDate(past.getDate() - 90);
      return `${formatDate(past)} - ${formatDate(today)}`;
    }
    if (timeRange === '6M') {
      const past = new Date(today);
      past.setDate(past.getDate() - 180);
      return `${formatDate(past)} - ${formatDate(today)}`;
    }
    if (timeRange === '1Y') {
      const past = new Date(today);
      past.setDate(past.getDate() - 365);
      return `${formatDate(past)} - ${formatDate(today)}`;
    }
    if (timeRange === 'ALL') {
      return 'All Time';
    }
    return formatDate(today);
  };

  const metrics = data?.metrics || {
    today_sales: 0,
    today_bills: 0,
    period_sales: 0,
    total_sales_return: 0,
    total_purchase: 0,
    total_purchase_return: 0,
    profit: 0,
    invoice_due: 0,
    total_expenses: 0,
    supplier_dues: 0,
    total_suppliers: 0,
    total_customers: 0,
    total_orders: 0,
    first_time_customers: 0,
    returning_customers: 0,
    low_stock_count: 0
  };

  const formatINR = (val: number | string) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Real 7-day sales trend or calculated distribution
  const salesTrendList: Array<{ day: string; total: string | number }> = data?.sales_trend || [];
  const maxTrendVal = Math.max(...salesTrendList.map((t) => Number(t.total) || 0), 1);

  // Real Monthly Stats for Jan - Dec
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlySalesMap: Record<string, number> = {};
  (data?.monthly_sales || []).forEach((m: any) => {
    monthlySalesMap[m.month] = Number(m.sales) || 0;
  });

  const monthlyExpMap: Record<string, number> = {};
  (data?.monthly_expenses || []).forEach((m: any) => {
    monthlyExpMap[m.month] = Number(m.expenses) || 0;
  });

  const maxMonthVal = Math.max(
    ...months.map((m) => Math.max(monthlySalesMap[m] || 0, monthlyExpMap[m] || 0)),
    1000
  );

  // Active Tab Transaction Records from real database response
  const getActiveTabTransactions = () => {
    if (txTab === 'sale' || txTab === 'invoices') {
      return (data?.recent_invoices || []).map((inv: any) => ({
        date: new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        name: inv.customer_name || 'Walk-in Customer',
        id: inv.invoice_number || inv.id?.slice(0, 8),
        status: inv.payment_status === 'paid' ? 'Completed' : inv.payment_status === 'pending' ? 'Pending' : 'Draft',
        amount: Number(inv.total_amount) || 0
      }));
    }
    if (txTab === 'purchase') {
      return (data?.recent_purchases || []).map((po: any) => ({
        date: new Date(po.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        name: po.supplier_name || 'Vendor',
        id: po.po_number || po.id?.slice(0, 8),
        status: po.payment_status === 'paid' ? 'Completed' : 'Draft',
        amount: Number(po.total_amount) || 0
      }));
    }
    if (txTab === 'quotation') {
      return (data?.recent_quotations || []).map((q: any) => ({
        date: new Date(q.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        name: q.customer_name || 'Client',
        id: q.quotation_number || q.id?.slice(0, 8),
        status: q.status === 'accepted' || q.status === 'approved' ? 'Completed' : 'Draft',
        amount: Number(q.total_amount) || 0
      }));
    }
    if (txTab === 'expenses') {
      return (data?.recent_expenses || []).map((e: any) => ({
        date: new Date(e.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        name: e.title || e.category || 'Store Expense',
        id: `EXP-${e.id?.toString().slice(0, 4)}`,
        status: 'Completed',
        amount: Number(e.amount) || 0
      }));
    }
    return [];
  };

  const currentTabRows = getActiveTabTransactions();

  // Donut circumference calculations for customers
  const firstTimeCount = metrics.first_time_customers || 0;
  const returnCount = metrics.returning_customers || 0;
  const totalCustCount = firstTimeCount + returnCount || 1;
  const firstTimePercent = Math.round((firstTimeCount / totalCustCount) * 100);
  const returnPercent = Math.round((returnCount / totalCustCount) * 100);

  return (
    <div className="dash-container">
      {/* 1. Header & Welcome Strip */}
      <div className="dash-header-strip">
        <div className="dash-welcome-group">
          <h1 className="dash-welcome-title">Welcome, {user?.name || 'Admin'}</h1>
          <p className="dash-welcome-subtitle">
            You have <strong className="highlight">{metrics.today_bills} Orders</strong>, Today
          </p>
        </div>

        <div className="dash-date-filter-wrap" ref={dateDropdownRef}>
          <button
            type="button"
            className="dash-date-btn"
            onClick={() => setShowDateDropdown(!showDateDropdown)}
          >
            <Calendar size={14} color="#ff9f43" />
            <span>{getDateRangeLabel()}</span>
            <ChevronDown size={12} color="#94a3b8" />
          </button>

          {showDateDropdown && (
            <div className="dash-date-menu-dropdown">
              <div className="dash-date-menu-header">Select Date Range</div>
              <div className="dash-date-presets-grid">
                {datePresets.map((preset) => {
                  const isActive = timeRange === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      className={`dash-date-preset-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setTimeRange(preset.key);
                        setStartDate('');
                        setEndDate('');
                        setShowDateDropdown(false);
                      }}
                    >
                      <span>{preset.label}</span>
                      {isActive && <Check size={14} color="#ea580c" />}
                    </button>
                  );
                })}
              </div>

              <div className="dash-date-menu-divider" />

              <div className="dash-date-custom-section">
                <div className="dash-date-menu-header">Custom Range</div>
                <div className="dash-date-custom-inputs">
                  <div className="dash-date-input-group">
                    <label>From</label>
                    <input
                      type="date"
                      value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                    />
                  </div>
                  <div className="dash-date-input-group">
                    <label>To</label>
                    <input
                      type="date"
                      value={tempEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="dash-date-apply-btn"
                  disabled={!tempStartDate || !tempEndDate}
                  onClick={() => {
                    if (tempStartDate && tempEndDate) {
                      setTimeRange('CUSTOM');
                      setStartDate(tempStartDate);
                      setEndDate(tempEndDate);
                      setShowDateDropdown(false);
                    }
                  }}
                >
                  Apply Range
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Top 4 Vibrant Hero Metric Cards */}
      <div className="dash-hero-grid">
        {/* Total Sales */}
        <div className="dash-hero-card hero-orange">
          <div className="dash-hero-icon-box">
            <FileText size={18} />
          </div>
          <div className="dash-hero-content">
            <span className="dash-hero-label">Total Sales</span>
            <div className="dash-hero-val-row">
              <span className="dash-hero-value">{formatINR(metrics.period_sales || metrics.today_sales)}</span>
              <span className="dash-hero-badge">
                <ArrowUpRight size={10} /> Active
              </span>
            </div>
          </div>
        </div>

        {/* Total Sales Return */}
        <div className="dash-hero-card hero-navy">
          <div className="dash-hero-icon-box">
            <RotateCcw size={18} />
          </div>
          <div className="dash-hero-content">
            <span className="dash-hero-label">Total Sales Return</span>
            <div className="dash-hero-val-row">
              <span className="dash-hero-value">{formatINR(metrics.total_sales_return)}</span>
              <span className="dash-hero-badge badge-down">
                <ArrowDownRight size={10} /> Return
              </span>
            </div>
          </div>
        </div>

        {/* Total Purchase */}
        <div className="dash-hero-card hero-teal">
          <div className="dash-hero-icon-box">
            <Package size={18} />
          </div>
          <div className="dash-hero-content">
            <span className="dash-hero-label">Total Purchase</span>
            <div className="dash-hero-val-row">
              <span className="dash-hero-value">{formatINR(metrics.total_purchase)}</span>
              <span className="dash-hero-badge">
                <ArrowUpRight size={10} /> PO
              </span>
            </div>
          </div>
        </div>

        {/* Total Purchase Return */}
        <div className="dash-hero-card hero-blue">
          <div className="dash-hero-icon-box">
            <RotateCcw size={18} />
          </div>
          <div className="dash-hero-content">
            <span className="dash-hero-label">Total Purchase Return</span>
            <div className="dash-hero-val-row">
              <span className="dash-hero-value">{formatINR(metrics.total_purchase_return)}</span>
              <span className="dash-hero-badge">
                <ArrowUpRight size={10} /> PO Return
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Second Row: 4 Clean White Stat Cards */}
      <div className="dash-stats-grid">
        {/* Profit */}
        <div className="dash-white-card">
          <div className="dash-white-top">
            <div className="dash-white-val-group">
              <span className="dash-white-amount">{formatINR(metrics.profit)}</span>
              <span className="dash-white-label">Net Profit</span>
            </div>
            <div className="dash-soft-icon icon-cyan">
              <Layers size={16} />
            </div>
          </div>
          <div className="dash-white-bottom">
            <span className="dash-trend-pill">
              <ArrowUpRight size={12} /> Realtime
            </span>
            <Link to="/reports" className="dash-view-link">View All</Link>
          </div>
        </div>

        {/* Invoice Due */}
        <div className="dash-white-card">
          <div className="dash-white-top">
            <div className="dash-white-val-group">
              <span className="dash-white-amount">{formatINR(metrics.invoice_due)}</span>
              <span className="dash-white-label">Invoice Due (Receivables)</span>
            </div>
            <div className="dash-soft-icon icon-mint">
              <Clock size={16} />
            </div>
          </div>
          <div className="dash-white-bottom">
            <span className="dash-trend-pill">
              <ArrowUpRight size={12} /> Pending
            </span>
            <Link to="/invoices" className="dash-view-link">View All</Link>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="dash-white-card">
          <div className="dash-white-top">
            <div className="dash-white-val-group">
              <span className="dash-white-amount">{formatINR(metrics.total_expenses)}</span>
              <span className="dash-white-label">Total Expenses</span>
            </div>
            <div className="dash-soft-icon icon-coral">
              <Receipt size={16} />
            </div>
          </div>
          <div className="dash-white-bottom">
            <span className="dash-trend-pill">
              <ArrowUpRight size={12} /> Tracked
            </span>
            <Link to="/expenses" className="dash-view-link">View All</Link>
          </div>
        </div>

        {/* Total Supplier Dues */}
        <div className="dash-white-card">
          <div className="dash-white-top">
            <div className="dash-white-val-group">
              <span className="dash-white-amount">{formatINR(metrics.supplier_dues)}</span>
              <span className="dash-white-label">Supplier Payables</span>
            </div>
            <div className="dash-soft-icon icon-purple">
              <Hash size={16} />
            </div>
          </div>
          <div className="dash-white-bottom">
            <span className={`dash-trend-pill ${metrics.supplier_dues > 0 ? 'trend-down' : ''}`}>
              {metrics.supplier_dues > 0 ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />} Payables
            </span>
            <Link to="/purchase-orders" className="dash-view-link">View All</Link>
          </div>
        </div>
      </div>

      {/* 4. Middle Section: Sales Trend Bar Chart (2/3) & Overall Information (1/3) */}
      <div className="dash-split-grid">
        {/* Left 2/3: Sales & Purchase Trend Bar Chart */}
        <div className="dash-panel-card">
          <div className="dash-panel-header">
            <h3 className="dash-panel-title">
              <div className="dash-panel-title-icon">
                <ShoppingCart size={14} />
              </div>
              Sales Velocity & Daily Volume
            </h3>

            {/* Timeframe selector */}
            <div className="dash-time-tabs">
              {(['1D', '1W', '1M', '3M', '6M', '1Y'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`dash-time-tab ${timeRange === t ? 'active' : ''}`}
                  onClick={() => setTimeRange(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Legend Badges */}
          <div className="dash-chart-legend">
            <div className="dash-legend-badge">
              <span className="dash-legend-title">
                <span className="dash-legend-dot" style={{ background: '#10b981' }} /> Total Purchases
              </span>
              <span className="dash-legend-val">{formatINR(metrics.total_purchase)}</span>
            </div>

            <div className="dash-legend-badge">
              <span className="dash-legend-title">
                <span className="dash-legend-dot" style={{ background: '#ff9f43' }} /> Total Sales
              </span>
              <span className="dash-legend-val">{formatINR(metrics.period_sales)}</span>
            </div>
          </div>

          {/* Real Visual Bar Chart */}
          <div className="dash-bar-chart">
            {salesTrendList.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#94a3b8', fontSize: '0.75rem' }}>
                No recent daily transactions recorded in this range.
              </div>
            ) : (
              salesTrendList.map((bar, idx) => {
                const totalVal = Number(bar.total) || 0;
                const heightPercent = Math.max(8, Math.min(100, Math.round((totalVal / maxTrendVal) * 90)));
                return (
                  <div key={idx} className="dash-bar-column">
                    <div className="dash-bar-stack">
                      <div className="dash-bar-top-segment" style={{ height: '20%' }} />
                      <div className="dash-bar-bottom-segment" style={{ height: `${heightPercent}%` }} />
                    </div>
                    <span className="dash-bar-label">{bar.day?.slice(5)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1/3: Overall Info + Customers Overview */}
        <div className="dash-split-side-col">
          {/* Overall Information */}
          <div className="dash-panel-card">
            <div className="dash-panel-header" style={{ marginBottom: '12px' }}>
              <h3 className="dash-panel-title" style={{ fontSize: '0.8125rem' }}>
                <div className="dash-panel-title-icon icon-info" style={{ width: '24px', height: '24px' }}>
                  <Info size={13} />
                </div>
                Overall Information
              </h3>
            </div>

            <div className="dash-overall-tiles">
              {/* Suppliers */}
              <div className="dash-mini-tile">
                <Building size={16} color="#2563eb" className="dash-mini-tile-icon" />
                <span className="dash-mini-tile-label">Suppliers</span>
                <span className="dash-mini-tile-val">{metrics.total_suppliers}</span>
              </div>

              {/* Customer */}
              <div className="dash-mini-tile">
                <Users size={16} color="#ff9f43" className="dash-mini-tile-icon" />
                <span className="dash-mini-tile-label">Customers</span>
                <span className="dash-mini-tile-val">{metrics.total_customers}</span>
              </div>

              {/* Orders */}
              <div className="dash-mini-tile">
                <ShoppingCart size={16} color="#10b981" className="dash-mini-tile-icon" />
                <span className="dash-mini-tile-label">Orders</span>
                <span className="dash-mini-tile-val">{metrics.total_orders}</span>
              </div>
            </div>
          </div>

          {/* Customers Overview Donut */}
          <div className="dash-panel-card">
            <div className="dash-panel-header" style={{ marginBottom: '10px' }}>
              <h3 className="dash-panel-title" style={{ fontSize: '0.8125rem' }}>Customers Overview</h3>
            </div>

            <div className="dash-donut-container">
              {/* SVG Ring Donut Chart */}
              <div className="dash-donut-ring-wrap">
                <svg width="80" height="80" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  {/* Outer ring: Teal */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#008f7a"
                    strokeWidth="10"
                    strokeDasharray={`${(returnPercent / 100) * 238} 240`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  {/* Inner ring: Orange */}
                  <circle
                    cx="50"
                    cy="50"
                    r="26"
                    fill="none"
                    stroke="#ff9f43"
                    strokeWidth="8"
                    strokeDasharray={`${(firstTimePercent / 100) * 163} 165`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Breakdown Stats */}
              <div className="dash-donut-breakdown">
                <div className="dash-donut-stat">
                  <span className="dash-donut-val">{firstTimeCount}</span>
                  <span className="dash-donut-label" style={{ color: '#ff5e36' }}>First Time</span>
                  <span className="dash-pill-growth" style={{ width: 'fit-content' }}>
                    <ArrowUpRight size={9} /> {firstTimePercent}%
                  </span>
                </div>

                <div className="dash-donut-stat">
                  <span className="dash-donut-val">{returnCount}</span>
                  <span className="dash-donut-label" style={{ color: '#008f7a' }}>Returning</span>
                  <span className="dash-pill-growth" style={{ width: 'fit-content' }}>
                    <ArrowUpRight size={9} /> {returnPercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Section 4: 3-Column Row (Top Selling Products, Low Stock Products, Recent Sales) */}
      <div className="dash-tri-grid">
        {/* Top Selling Products */}
        <div className="dash-panel-card">
          <div className="dash-panel-header">
            <h3 className="dash-panel-title">
              <div className="dash-panel-title-icon icon-pink">
                <Package size={14} />
              </div>
              Top Selling Products
            </h3>
            <Link to="/products" className="dash-view-link" style={{ fontSize: '0.6875rem' }}>View All</Link>
          </div>

          <div className="dash-item-list">
            {(data?.top_products || []).length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', padding: '16px 0', textAlign: 'center' }}>
                No product sales recorded in this period.
              </div>
            ) : (
              (data.top_products || []).slice(0, 5).map((p: any, idx: number) => (
                <div key={idx} className="dash-item-row">
                  <div className="dash-item-left">
                    <div className="dash-item-thumb" style={{ fontSize: '1rem' }}>
                      🪴
                    </div>
                    <div className="dash-item-info">
                      <span className="dash-item-title">{p.product_name}</span>
                      <span className="dash-item-sub">{p.total_qty} units sold</span>
                    </div>
                  </div>

                  <div className="dash-item-right">
                    <span className="dash-item-price">{formatINR(p.total_revenue)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="dash-panel-card">
          <div className="dash-panel-header">
            <h3 className="dash-panel-title">
              <div className="dash-panel-title-icon icon-alert">
                <AlertTriangle size={14} />
              </div>
              Low Stock Products
            </h3>
            <Link to="/inventory" className="dash-view-link" style={{ fontSize: '0.6875rem' }}>View All</Link>
          </div>

          <div className="dash-item-list">
            {(data?.low_stock_items || []).length === 0 ? (
              <div style={{ color: '#16a34a', fontSize: '0.75rem', padding: '16px 0', textAlign: 'center', fontWeight: 600 }}>
                ✓ All inventory items are above minimum stock levels.
              </div>
            ) : (
              (data.low_stock_items || []).slice(0, 5).map((p: any, idx: number) => (
                <div key={idx} className="dash-item-row">
                  <div className="dash-item-left">
                    <div className="dash-item-thumb" style={{ fontSize: '1rem' }}>
                      📦
                    </div>
                    <div className="dash-item-info">
                      <span className="dash-item-title">{p.name}</span>
                      <span className="dash-item-sub">SKU: {p.sku || `#${p.id?.slice(0, 6)}`}</span>
                    </div>
                  </div>

                  <div className="dash-item-right">
                    <span style={{ fontSize: '0.625rem', color: '#64748b', fontWeight: 600 }}>Instock</span>
                    <span className="dash-stock-alert-text">{p.stock_quantity}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="dash-panel-card">
          <div className="dash-panel-header">
            <h3 className="dash-panel-title">
              <div className="dash-panel-title-icon icon-pink">
                <ShoppingBag size={14} />
              </div>
              Recent Sales
            </h3>
            <Link to="/invoices" className="dash-view-link" style={{ fontSize: '0.6875rem' }}>View All</Link>
          </div>

          <div className="dash-item-list">
            {(data?.recent_invoices || []).length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', padding: '16px 0', textAlign: 'center' }}>
                No recent invoices found. Open the POS to issue a bill!
              </div>
            ) : (
              (data.recent_invoices || []).slice(0, 5).map((inv: any, idx: number) => (
                <div key={idx} className="dash-item-row">
                  <div className="dash-item-left">
                    <div className="dash-item-thumb">
                      <UserCheck size={16} />
                    </div>
                    <div className="dash-item-info">
                      <span className="dash-item-title">{inv.customer_name || 'Walk-in Customer'}</span>
                      <span className="dash-item-sub">{inv.invoice_number}</span>
                    </div>
                  </div>

                  <div className="dash-item-right">
                    <span className="dash-item-price">{formatINR(inv.total_amount)}</span>
                    <span className={`dash-status-pill ${inv.payment_status === 'paid' ? 'status-completed' : 'status-processing'}`}>
                      {inv.payment_status || 'paid'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. Section 5: Real Sales Statistics & Recent Transactions */}
      <div className="dash-split-equal">
        {/* Sales Statistics (Waterfall Bar Chart from Database) */}
        <div className="dash-panel-card">
          <div className="dash-panel-header">
            <h3 className="dash-panel-title">
              <div className="dash-panel-title-icon icon-alert">
                <TrendingUp size={14} />
              </div>
              Sales & Expense Statistics
            </h3>
          </div>

          {/* KPI Small Cards */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div className="dash-legend-badge" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="dash-legend-val" style={{ color: '#008f7a' }}>{formatINR(metrics.period_sales)}</span>
                <span className="dash-pill-growth"><ArrowUpRight size={9} /> Revenue</span>
              </div>
              <span className="dash-legend-title">Sales Revenue</span>
            </div>

            <div className="dash-legend-badge" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="dash-legend-val" style={{ color: '#ff5e36' }}>{formatINR(metrics.total_expenses)}</span>
                <span className="dash-pill-growth pill-down"><ArrowDownRight size={9} /> Expense</span>
              </div>
              <span className="dash-legend-title">Operating Expenses</span>
            </div>
          </div>

          {/* Diverging Bar Chart */}
          <div className="dash-diverging-chart">
            {months.map((m, idx) => {
              const revVal = monthlySalesMap[m] || 0;
              const expVal = monthlyExpMap[m] || 0;
              const revHeight = revVal > 0 ? Math.max(10, Math.min(100, Math.round((revVal / maxMonthVal) * 85))) : 0;
              const expHeight = expVal > 0 ? Math.max(10, Math.min(100, Math.round((expVal / maxMonthVal) * 85))) : 0;

              return (
                <div key={idx} className="dash-diverging-col">
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                    {revHeight > 0 && <div className="dash-bar-pos" style={{ height: `${revHeight}%` }} />}
                  </div>
                  <div className="dash-divider-line" />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', width: '100%', justifyContent: 'center' }}>
                    {expHeight > 0 && <div className="dash-bar-neg" style={{ height: `${expHeight}%` }} />}
                  </div>
                  <span className="dash-bar-label" style={{ marginTop: '6px' }}>{m}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions Multi-Tab */}
        <div className="dash-panel-card">
          <div className="dash-panel-header" style={{ marginBottom: '10px' }}>
            <h3 className="dash-panel-title">
              <div className="dash-panel-title-icon icon-flag">
                <Flag size={14} />
              </div>
              Recent Transactions
            </h3>
            <Link to="/invoices" className="dash-view-link" style={{ fontSize: '0.6875rem' }}>View All</Link>
          </div>

          {/* Tab buttons */}
          <div className="dash-tx-tabs">
            {(['sale', 'purchase', 'quotation', 'expenses', 'invoices'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`dash-tx-tab ${txTab === tab ? 'active' : ''}`}
                onClick={() => setTxTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Transactions Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="dash-tx-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer / Entity</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {currentTabRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                      No {txTab} transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  currentTabRows.slice(0, 5).map((row: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ color: '#64748b' }}>{row.date}</td>
                      <td>
                        <div className="dash-tx-avatar-group">
                          <div className="dash-tx-avatar">
                            {row.name.charAt(0)}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{row.name}</span>
                            <span style={{ fontSize: '0.625rem', color: '#94a3b8' }}>#{row.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`dash-status-pill ${row.status === 'Completed' ? 'status-completed' : 'status-processing'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        {formatINR(row.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 7. Bottom Section: Real Top Customers Directory */}
      <div className="dash-panel-card">
        <div className="dash-panel-header">
          <h3 className="dash-panel-title">
            <div className="dash-panel-title-icon icon-user">
              <Users size={14} />
            </div>
            Top Customers Directory
          </h3>
          <Link to="/customers" className="dash-view-link" style={{ fontSize: '0.6875rem' }}>View All Customers</Link>
        </div>

        <div className="dash-item-list">
          {(data?.top_customers || []).length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', padding: '16px 0', textAlign: 'center' }}>
              No customer sales aggregated yet.
            </div>
          ) : (
            (data.top_customers || []).slice(0, 5).map((c: any, idx: number) => (
              <div key={idx} className="dash-item-row">
                <div className="dash-item-left">
                  <div className="dash-item-thumb" style={{ fontSize: '1rem' }}>
                    👨‍💼
                  </div>
                  <div className="dash-item-info">
                    <span className="dash-item-title">{c.name}</span>
                    <span className="dash-item-sub">{c.order_count} Orders placed</span>
                  </div>
                </div>

                <div className="dash-item-right">
                  <span className="dash-item-price">{formatINR(c.total_spent)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
