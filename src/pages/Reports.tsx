import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Receipt,
  AlertTriangle,
  Briefcase,
  CreditCard,
  Printer,
  Award,
  ArrowRight,
  Package,
  CheckCircle2,
  Calendar,
  Sparkles,
  DollarSign,
  QrCode,
  Building,
  Layers,
  Copy,
  Check,
  FileText,
  Clock,
  Eye,
  BarChart3,
  PieChart,
  ShoppingBag,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { Link } from 'react-router-dom';

interface DashboardReportData {
  business_id: string;
  is_combined?: boolean;
  range: string;
  metrics: {
    today_sales: number;
    today_bills: number;
    period_sales: number;
    period_tax: number;
    period_cgst?: number;
    period_sgst?: number;
    period_bills: number;
    low_stock_count: number;
    active_projects: number;
    supplier_dues: number;
  };
  business_breakdown?: Array<{
    business_id: string;
    total_sales: number;
    total_tax: number;
    total_bills: number;
  }>;
  top_products: Array<{ product_name: string; total_qty: number; total_revenue: number }>;
  payment_breakdown: Array<{ payment_method: string; count: number; total: number }>;
  recent_invoices: Array<{
    id: string;
    invoice_number: string;
    customer_name: string;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    created_at: string;
    business_id?: string;
    business_name?: string;
  }>;
  low_stock_items: Array<{
    id: string;
    name: string;
    sku: string;
    stock_quantity: number;
    low_stock_threshold: number;
    type?: string;
    business_id?: string;
    business_name?: string;
  }>;
  sales_trend: Array<{ day: string; total: number; count: number }>;
}

type ViewTab = 'overview' | 'sales' | 'payments' | 'products' | 'inventory' | 'all';

export const Reports: React.FC = () => {
  const { businessId, activeBusiness, business } = useBusiness();

  const [isCombined, setIsCombined] = useState(businessId === 'all');
  const [range, setRange] = useState<'today' | '7days' | 'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [data, setData] = useState<DashboardReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const effectiveCombined = isCombined || businessId === 'all' || activeBusiness.id === 'all';

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { range };
      if (effectiveCombined) {
        params.business_id = 'all';
      }
      const res = await api.get<DashboardReportData>('/reports/dashboard', params);
      setData(res);
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsCombined(businessId === 'all');
  }, [businessId]);

  useEffect(() => {
    fetchReports();
  }, [businessId, activeBusiness.id, range, isCombined, effectiveCombined]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    if (!data) return;
    const rangeLabel = range === 'today' ? 'Today' : range === '7days' ? 'Last 7 Days' : range === 'month' ? 'Last 30 Days' : 'This Year';
    
    let text = '';
    if (isCombined) {
      const gnStats = data.business_breakdown?.find(b => b.business_id === 'grow-naturals');
      const nnStats = data.business_breakdown?.find(b => b.business_id === 'nikhlesh-nursery');

      text = [
        `📊 COMBINED BUSINESS REPORT (Both Shops) — ${rangeLabel}`,
        `🏢 Grow Naturals (GST) + Nikhlesh Nursery`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `• Total Combined Sales: ₹${Number(data.metrics.period_sales).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        `• Total Invoices: ${data.metrics.period_bills} bills issued`,
        `• Total GST Tax Collected: ₹${Number(data.metrics.period_tax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        `• Pending Supplier Payables: ₹${Number(data.metrics.supplier_dues).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        `• Active Site Projects: ${data.metrics.active_projects}`,
        `• Critical Low Stock Items: ${data.metrics.low_stock_count}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `📈 INDIVIDUAL SHOP BREAKDOWN:`,
        `• Grow Naturals: ₹${Number(gnStats?.total_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${gnStats?.total_bills || 0} bills, GST: ₹${Number(gnStats?.total_tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })})`,
        `• Nikhlesh Nursery: ₹${Number(nnStats?.total_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${nnStats?.total_bills || 0} bills)`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Generated from GrowNaturals Dual POS & ERP on ${new Date().toLocaleDateString('en-IN')}`
      ].join('\n');
    } else {
      const bizName = business?.name || activeBusiness.name;
      text = [
        `📊 Business Report — ${bizName} (${rangeLabel})`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `• Total Sales Revenue: ₹${Number(data.metrics.period_sales).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        `• Total Invoices: ${data.metrics.period_bills} bills issued`,
        ...(isGrowNaturals ? [`• GST Tax Collected: ₹${Number(data.metrics.period_tax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`] : []),
        `• Pending Supplier Dues: ₹${Number(data.metrics.supplier_dues).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        `• Active Site Projects: ${data.metrics.active_projects}`,
        `• Critical Low Stock Items: ${data.metrics.low_stock_count}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Generated from GrowNaturals Dual POS & ERP on ${new Date().toLocaleDateString('en-IN')}`
      ].join('\n');
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isGrowNaturals = activeBusiness.id === 'grow-naturals';

  const formatCurrency = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getPaymentMethodMeta = (method: string) => {
    const m = (method || '').toLowerCase();
    if (m.includes('cash')) {
      return { label: 'Cash Handover', icon: DollarSign, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' };
    }
    if (m.includes('upi') || m.includes('qr')) {
      return { label: 'UPI / QR Code', icon: QrCode, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)', border: 'rgba(2, 132, 199, 0.25)' };
    }
    if (m.includes('bank') || m.includes('transfer') || m.includes('neft') || m.includes('rtgs')) {
      return { label: 'Bank Transfer', icon: Building, color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)', border: 'rgba(217, 119, 6, 0.25)' };
    }
    if (m.includes('card')) {
      return { label: 'Debit / Credit Card', icon: CreditCard, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.25)' };
    }
    return { label: method || 'Other Mode', icon: Layers, color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.25)' };
  };

  const totalPaymentCollected = data?.payment_breakdown.reduce((sum, p) => sum + (Number(p.total) || 0), 0) || 0;

  const filteredTopProducts = (data?.top_products || []).filter(p =>
    !productSearch ? true : p.product_name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Print-Only Header */}
      <div className="print-only" style={{ marginBottom: '24px', borderBottom: '2px solid #0f172a', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#166534', letterSpacing: '-0.02em' }}>
              {isCombined ? 'Grow Naturals & Nikhlesh Nursery — Combined Business Report' : `${business?.name || activeBusiness.name} — Business Report`}
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#475569' }}>
              {isCombined ? 'Consolidated executive financial performance and tax liabilities across both retail units' : (business?.legal_name || activeBusiness.legal_name)}
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
            <div><strong>Period:</strong> {range === 'today' ? 'Today' : range === '7days' ? 'Last 7 Days' : range === 'month' ? 'Last 30 Days' : 'This Year'}</div>
            <div><strong>Generated:</strong> {new Date().toLocaleDateString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* 1. Page Header & Actions */}
      <div
        className="page-header no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={24} style={{ color: 'var(--color-botanical-600)' }} /> Business Analytics & Reports
            </h1>
            {isCombined ? (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
                  color: '#065f46',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                Combined: Grow Naturals + Nikhlesh Nursery
              </span>
            ) : (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: isGrowNaturals ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  color: isGrowNaturals ? '#059669' : '#d97706',
                  border: `1px solid ${isGrowNaturals ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
                }}
              >
                {business?.name || activeBusiness.name}
              </span>
            )}
          </div>
          <p className="page-subtitle" style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            {isCombined ? (
              <>
                Real-time combined financial performance, tax liabilities, top sellers, and revenue velocity aggregated for <strong>Grow Naturals</strong> &amp; <strong>Nikhlesh Nursery</strong>.
              </>
            ) : (
              <>
                Real-time financial performance, tax liabilities, top sellers, and revenue velocity for <strong>{business?.name || activeBusiness.name}</strong>.
              </>
            )}
          </p>
        </div>

        {/* Action Controls: Combined Reports Button + Time Selector + Export + Print */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Combined Reports Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCombined(!isCombined)}
            className={`btn ${isCombined ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              fontSize: '0.78rem',
              padding: '6px 14px',
              gap: '6px',
              fontWeight: 700,
              backgroundColor: isCombined ? '#065f46' : 'var(--color-bg-surface-subtle)',
              color: isCombined ? '#ffffff' : 'var(--color-text-primary)',
              borderColor: isCombined ? '#047857' : 'var(--color-border)',
              boxShadow: isCombined ? '0 2px 8px rgba(5, 150, 105, 0.25)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 'var(--radius-md)',
              transition: 'all 0.18s ease'
            }}
            title={isCombined ? 'Click to view individual shop report' : 'Click to combine reports for both Grow Naturals & Nikhlesh Nursery'}
          >
            <Layers size={14} style={{ color: isCombined ? '#6ee7b7' : 'var(--color-botanical-600)' }} />
            <span>Combined Reports</span>
            {isCombined && (
              <span
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  fontWeight: 800
                }}
              >
                Both Shops
              </span>
            )}
          </button>

          {/* Time Range Selector */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--color-bg-surface-subtle)',
              padding: '3px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              gap: '2px'
            }}
          >
            {[
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Last 7 Days' },
              { id: 'month', label: '30 Days' },
              { id: 'year', label: 'This Year' }
            ].map((r) => {
              const active = range === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id as any)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: active ? 700 : 500,
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: active ? 'var(--color-botanical-700)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--color-text-secondary)',
                    boxShadow: active ? '0 2px 6px rgba(0,0,0,0.12)' : 'none'
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleCopySummary}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem', padding: '6px 12px', gap: '5px' }}
            title="Copy high-level summary to clipboard"
          >
            {copied ? <Check size={14} style={{ color: '#059669' }} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Summary'}
          </button>

          <button
            onClick={handlePrint}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem', padding: '6px 12px', gap: '5px' }}
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* 2. Interactive Navigation Tabs */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        {[
          { id: 'overview', label: 'Executive Overview', icon: BarChart3 },
          { id: 'sales', label: 'Daily Sales Velocity', icon: TrendingUp },
          { id: 'payments', label: 'Payment Modes & Cash Flow', icon: CreditCard },
          { id: 'products', label: 'Top Selling Products', icon: Award },
          { id: 'inventory', label: 'Inventory Health', icon: Package, badge: data?.metrics.low_stock_count },
          { id: 'all', label: 'View Full Report', icon: FileText }
        ].map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ViewTab)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                fontSize: '0.8125rem',
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--color-botanical-700)' : 'var(--color-text-secondary)',
                backgroundColor: active ? 'var(--color-botanical-subtle)' : 'transparent',
                border: 'none',
                borderBottom: active ? '2px solid var(--color-botanical-700)' : '2px solid transparent',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    marginLeft: '2px'
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && !data ? (
        <div
          className="card"
          style={{
            padding: '56px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--color-bg-surface)',
            borderRadius: 'var(--radius-xl)'
          }}
        >
          <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '12px' }}>
            <Sparkles size={28} style={{ color: 'var(--color-botanical-600)' }} />
          </div>
          <p style={{ fontWeight: 600, color: 'var(--color-text-secondary)', margin: 0 }}>
            Analyzing business metrics & aggregating financial data...
          </p>
        </div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 3. Top Key Metric KPI Cards (Always Shown for Executive Visibility) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px'
            }}
          >
            {/* KPI 1: Sales Revenue */}
            <div
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderRadius: 'var(--radius-xl)',
                padding: '18px 20px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.05)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease'
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#10b981' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  {isCombined ? 'Total Sales Revenue (Combined)' : 'Total Sales Revenue'}
                </span>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <TrendingUp size={18} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', lineHeight: 1.2, fontFamily: 'var(--font-family-display)' }}>
                  {formatCurrency(data.metrics.period_sales)}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: '#059669'
                    }}
                  >
                    {data.metrics.period_bills} {data.metrics.period_bills === 1 ? 'bill' : 'bills'} issued {isCombined ? '(Both Shops)' : ''}
                  </span>
                  {data.metrics.period_bills > 0 && !isCombined && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
                      Avg {formatCurrency(Number(data.metrics.period_sales) / (data.metrics.period_bills || 1))}/bill
                    </span>
                  )}
                  {isCombined && data.business_breakdown && data.business_breakdown.length > 0 && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
                      GN: {formatCurrency(data.business_breakdown.find(b => b.business_id === 'grow-naturals')?.total_sales || 0)} • NN: {formatCurrency(data.business_breakdown.find(b => b.business_id === 'nikhlesh-nursery')?.total_sales || 0)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* KPI 2: Tax Liability / GST */}
            <div
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderRadius: 'var(--radius-xl)',
                padding: '18px 20px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.05)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#8b5cf6' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  {isCombined ? 'GST Tax Collected (Combined)' : isGrowNaturals ? 'GST Tax Collected' : 'Total Bills Issued'}
                </span>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(139, 92, 246, 0.12)',
                    color: '#8b5cf6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Receipt size={18} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#7c3aed', lineHeight: 1.2, fontFamily: 'var(--font-family-display)' }}>
                  {isGrowNaturals || isCombined ? formatCurrency(data.metrics.period_tax) : `${data.metrics.period_bills} Bills`}
                </div>

                <div style={{ marginTop: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      color: '#7c3aed',
                      display: 'inline-block'
                    }}
                  >
                    {isCombined ? (
                      <>
                        CGST 9% ({formatCurrency(data.metrics.period_cgst || Number(data.metrics.period_tax) / 2)}) + SGST 9% ({formatCurrency(data.metrics.period_sgst || Number(data.metrics.period_tax) / 2)})
                      </>
                    ) : isGrowNaturals ? (
                      <>CGST 9% ({formatCurrency(Number(data.metrics.period_tax) / 2)}) + SGST 9% ({formatCurrency(Number(data.metrics.period_tax) / 2)})</>
                    ) : (
                      'Nursery Completed Bills'
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 3: Supplier Payables */}
            <div
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderRadius: 'var(--radius-xl)',
                padding: '18px 20px',
                border: `1px solid ${Number(data.metrics.supplier_dues) > 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.25)'}`,
                boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: Number(data.metrics.supplier_dues) > 0 ? '#ef4444' : '#10b981'
                }}
              />
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  {isCombined ? 'Supplier Payables (Both Shops)' : 'Supplier Payables'}
                </span>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    backgroundColor: Number(data.metrics.supplier_dues) > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    color: Number(data.metrics.supplier_dues) > 0 ? '#ef4444' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AlertTriangle size={18} />
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '1.65rem',
                    fontWeight: 800,
                    color: Number(data.metrics.supplier_dues) > 0 ? '#dc2626' : '#059669',
                    lineHeight: 1.2,
                    fontFamily: 'var(--font-family-display)'
                  }}
                >
                  {formatCurrency(data.metrics.supplier_dues)}
                </div>

                <div style={{ marginTop: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: Number(data.metrics.supplier_dues) > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: Number(data.metrics.supplier_dues) > 0 ? '#dc2626' : '#059669',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {Number(data.metrics.supplier_dues) > 0 ? (
                      isCombined ? 'Pending payables across both shops' : 'Pending payables to suppliers'
                    ) : (
                      <>
                        <CheckCircle2 size={12} /> {isCombined ? 'All supplier bills cleared across both shops' : 'All supplier bills cleared'}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 4: Active Site Projects */}
            <div
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderRadius: 'var(--radius-xl)',
                padding: '18px 20px',
                border: '1px solid rgba(2, 132, 199, 0.3)',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.05)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#0284c7' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  {isCombined ? 'Active Site Projects (Both Shops)' : 'Active Site Projects'}
                </span>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(2, 132, 199, 0.12)',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Briefcase size={18} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284c7', lineHeight: 1.2, fontFamily: 'var(--font-family-display)' }}>
                  {data.metrics.active_projects}
                </div>

                <div style={{ marginTop: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(2, 132, 199, 0.1)',
                      color: '#0284c7',
                      display: 'inline-block'
                    }}
                  >
                    {isCombined ? 'In-progress client installations across both businesses' : 'In-progress client installations'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Sales Velocity & Payment Breakdown Grid */}
          {(activeTab === 'overview' || activeTab === 'sales' || activeTab === 'all') && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: activeTab === 'overview' || activeTab === 'all' ? 'minmax(0, 1.8fr) minmax(0, 1.2fr)' : '1fr',
                gap: '20px'
              }}
            >
              {/* Daily Sales Trend Table & Volume Progress Bars */}
              <div
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--color-bg-surface-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                        Daily Sales Performance (Last 7 Days)
                      </h2>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Volume breakdown
                  </span>
                </div>

                <div style={{ padding: 0 }}>
                  <table className="table" style={{ margin: 0, fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'transparent' }}>
                        <th style={{ width: '25%', padding: '12px 18px' }}>Date</th>
                        <th style={{ width: '15%', textAlign: 'center', padding: '12px 12px' }}>Invoices</th>
                        <th style={{ width: '25%', textAlign: 'right', padding: '12px 18px' }}>Total Sales (₹)</th>
                        <th style={{ width: '35%', padding: '12px 18px' }}>Volume Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sales_trend.length > 0 ? (
                        data.sales_trend.map((row, idx) => {
                          const maxSales = Math.max(...data.sales_trend.map((s) => Number(s.total) || 1));
                          const percent = Math.min(100, Math.round((Number(row.total) / maxSales) * 100));
                          return (
                            <tr key={idx} style={{ transition: 'background-color 0.15s ease' }}>
                              <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Calendar size={13} style={{ color: 'var(--color-text-dim)' }} />
                                  <span>{formatDateDisplay(row.day)}</span>
                                </div>
                              </td>
                              <td style={{ textAlign: 'center', padding: '12px 12px' }}>
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--color-bg-surface-subtle)',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-primary)'
                                  }}
                                >
                                  {row.count} {row.count === 1 ? 'bill' : 'bills'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700, padding: '12px 18px', color: '#059669' }}>
                                {formatCurrency(row.total)}
                              </td>
                              <td style={{ padding: '12px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div
                                    style={{
                                      flex: 1,
                                      background: 'var(--color-bg-surface-subtle)',
                                      height: '8px',
                                      borderRadius: '4px',
                                      overflow: 'hidden',
                                      border: '1px solid var(--color-border)'
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${percent}%`,
                                        height: '100%',
                                        backgroundColor: '#10b981',
                                        borderRadius: '4px',
                                        transition: 'width 0.4s ease'
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', minWidth: '32px', textAlign: 'right', fontWeight: 600 }}>
                                    {percent}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
                            No sales recorded during this 7-day period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Breakdown Card */}
              {(activeTab === 'overview' || activeTab === 'all') && (
                <div
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--color-bg-surface-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(2, 132, 199, 0.15)',
                          color: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CreditCard size={16} />
                      </div>
                      <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                        Payment Modes
                      </h2>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                      Total: {formatCurrency(totalPaymentCollected)}
                    </span>
                  </div>

                  <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {data.payment_breakdown.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', margin: '24px 0' }}>
                        No payment transactions recorded in this period.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {data.payment_breakdown.map((pm, i) => {
                          const meta = getPaymentMethodMeta(pm.payment_method);
                          const Icon = meta.icon;
                          const sharePct = totalPaymentCollected > 0
                            ? Math.round((Number(pm.total) / totalPaymentCollected) * 100)
                            : 0;

                          return (
                            <div
                              key={i}
                              style={{
                                padding: '10px 12px',
                                backgroundColor: 'var(--color-bg-surface-subtle)',
                                borderRadius: 'var(--radius-lg)',
                                border: `1px solid ${meta.border}`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '6px',
                                      backgroundColor: meta.bg,
                                      color: meta.color,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <Icon size={14} />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
                                      {meta.label}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                      {pm.count} {pm.count === 1 ? 'bill' : 'bills'} ({sharePct}% of sales)
                                    </div>
                                  </div>
                                </div>
                                
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: meta.color }}>
                                    {formatCurrency(pm.total)}
                                  </div>
                                </div>
                              </div>

                              <div
                                style={{
                                  width: '100%',
                                  height: '4px',
                                  backgroundColor: 'var(--color-border)',
                                  borderRadius: '2px',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  style={{
                                    width: `${sharePct}%`,
                                    height: '100%',
                                    backgroundColor: meta.color,
                                    borderRadius: '2px'
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Payment Modes Dedicated View (When Payments Tab Active) */}
          {activeTab === 'payments' && (
            <div
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
                    Payment Channels & Revenue Settlement
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '3px 0 0 0' }}>
                    Cash flow breakdown across all tender methods for the selected period.
                  </p>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>
                  Total: {formatCurrency(totalPaymentCollected)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {data.payment_breakdown.map((pm, i) => {
                  const meta = getPaymentMethodMeta(pm.payment_method);
                  const Icon = meta.icon;
                  const sharePct = totalPaymentCollected > 0
                    ? Math.round((Number(pm.total) / totalPaymentCollected) * 100)
                    : 0;

                  return (
                    <div
                      key={i}
                      style={{
                        padding: '18px 20px',
                        backgroundColor: 'var(--color-bg-surface-subtle)',
                        borderRadius: 'var(--radius-xl)',
                        border: `1px solid ${meta.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              backgroundColor: meta.bg,
                              color: meta.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Icon size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>
                              {meta.label}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              {pm.count} transactions
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: '6px',
                            backgroundColor: meta.bg,
                            color: meta.color
                          }}
                        >
                          {sharePct}% Share
                        </span>
                      </div>

                      <div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: meta.color, marginBottom: '8px' }}>
                          {formatCurrency(pm.total)}
                        </div>

                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: 'var(--color-border)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              width: `${sharePct}%`,
                              height: '100%',
                              backgroundColor: meta.color,
                              borderRadius: '3px'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Top Selling Products & Inventory Health Grid */}
          {(activeTab === 'overview' || activeTab === 'products' || activeTab === 'inventory' || activeTab === 'all') && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: activeTab === 'overview' || activeTab === 'all' ? 'minmax(0, 1.4fr) minmax(0, 1.1fr)' : '1fr',
                gap: '20px'
              }}
            >
              {/* Top Selling Products Leaderboard */}
              {(activeTab === 'overview' || activeTab === 'products' || activeTab === 'all') && (
                <div
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px',
                      backgroundColor: 'var(--color-bg-surface-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          color: '#d97706',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Award size={16} />
                      </div>
                      <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                        Top Selling Products
                      </h2>
                    </div>

                    {activeTab === 'products' && (
                      <input
                        type="text"
                        placeholder="Search item name..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="form-input"
                        style={{ width: '180px', height: '30px', fontSize: '0.78rem', padding: '4px 10px' }}
                      />
                    )}

                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      Leaderboard by units sold
                    </span>
                  </div>

                  <div style={{ padding: 0 }}>
                    <table className="table" style={{ margin: 0, fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'transparent' }}>
                          <th style={{ width: '12%', padding: '12px 16px', textAlign: 'center' }}>Rank</th>
                          <th style={{ width: '48%', padding: '12px 16px' }}>Product</th>
                          <th style={{ width: '20%', textAlign: 'right', padding: '12px 16px' }}>Units Sold</th>
                          <th style={{ width: '20%', textAlign: 'right', padding: '12px 16px' }}>Revenue (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTopProducts.length > 0 ? (
                          filteredTopProducts.map((prod, idx) => {
                            const medalColors = ['#f59e0b', '#94a3b8', '#b45309'];
                            const isMedal = idx < 3;
                            return (
                              <tr key={idx} style={{ transition: 'background-color 0.15s ease' }}>
                                <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                                  {isMedal ? (
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '50%',
                                        backgroundColor: medalColors[idx],
                                        color: '#ffffff',
                                        fontWeight: 800,
                                        fontSize: '0.72rem'
                                      }}
                                    >
                                      {idx + 1}
                                    </span>
                                  ) : (
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-dim)' }}>#{idx + 1}</span>
                                  )}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                    {prod.product_name}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700, padding: '12px 16px' }}>
                                  <span
                                    style={{
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      backgroundColor: 'var(--color-bg-surface-subtle)',
                                      border: '1px solid var(--color-border)',
                                      fontSize: '0.78rem'
                                    }}
                                  >
                                    {prod.total_qty} units
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 800, padding: '12px 16px', color: '#059669' }}>
                                  {formatCurrency(prod.total_revenue)}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
                              No product sales recorded in this period.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Critical Low Stock / Inventory Alerts */}
              {(activeTab === 'overview' || activeTab === 'inventory' || activeTab === 'all') && (
                <div
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderRadius: 'var(--radius-xl)',
                    border: `1px solid ${data.metrics.low_stock_count > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--color-border)'}`,
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: data.metrics.low_stock_count > 0 ? 'rgba(239, 68, 68, 0.04)' : 'var(--color-bg-surface-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          backgroundColor: data.metrics.low_stock_count > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: data.metrics.low_stock_count > 0 ? '#dc2626' : '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {data.metrics.low_stock_count > 0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                      </div>
                      <h2
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          margin: 0,
                          color: data.metrics.low_stock_count > 0 ? '#dc2626' : 'var(--color-text-primary)'
                        }}
                      >
                        Inventory Health ({data.metrics.low_stock_count})
                      </h2>
                    </div>

                    <Link
                      to="/inventory"
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--color-botanical-700)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      Manage Inventory <ArrowRight size={12} />
                    </Link>
                  </div>

                  <div style={{ padding: 0 }}>
                    {data.low_stock_items.length > 0 ? (
                      <table className="table" style={{ margin: 0, fontSize: '0.8125rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'transparent' }}>
                            <th style={{ padding: '12px 16px' }}>Item Details</th>
                            <th style={{ textAlign: 'right', padding: '12px 16px' }}>In Stock</th>
                            <th style={{ textAlign: 'right', padding: '12px 16px' }}>Min Threshold</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.low_stock_items.map((item, idx) => (
                            <tr key={idx}>
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{item.name}</span>
                                  {isCombined && (
                                    <span
                                      style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: item.business_id === 'grow-naturals' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                        color: item.business_id === 'grow-naturals' ? '#059669' : '#d97706',
                                        border: `1px solid ${item.business_id === 'grow-naturals' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
                                      }}
                                    >
                                      {item.business_id === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery'}
                                    </span>
                                  )}
                                </div>
                                {item.sku && (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
                                    SKU: {item.sku}
                                  </div>
                                )}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626', padding: '12px 16px' }}>
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#dc2626'
                                  }}
                                >
                                  {item.stock_quantity}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600, padding: '12px 16px' }}>
                                {item.low_stock_threshold}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px auto'
                          }}
                        >
                          <CheckCircle2 size={24} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#059669', marginBottom: '4px' }}>
                          All inventory levels are healthy!
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>
                          {isCombined
                            ? 'No items across both Grow Naturals & Nikhlesh Nursery are currently below minimum thresholds.'
                            : 'No items are currently below their minimum reorder thresholds.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. Recent Invoices Quick Ledger (Shown on Overview & Full Report) */}
          {(activeTab === 'overview' || activeTab === 'all') && (
            <div
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--color-bg-surface-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Receipt size={16} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                      {isCombined ? 'Recent Invoices (Grow Naturals & Nikhlesh Nursery)' : 'Recent Invoices & Transactions'}
                    </h2>
                  </div>
                </div>

                <Link
                  to="/invoices"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--color-botanical-700)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  All Invoices <ArrowRight size={13} />
                </Link>
              </div>

              <div style={{ padding: 0 }}>
                <table className="table" style={{ margin: 0, fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'transparent' }}>
                      <th style={{ padding: '12px 18px' }}>Invoice #</th>
                      {isCombined && <th style={{ padding: '12px 14px' }}>Shop</th>}
                      <th style={{ padding: '12px 18px' }}>Customer / Consignee</th>
                      <th style={{ padding: '12px 14px' }}>Date</th>
                      <th style={{ padding: '12px 14px' }}>Mode</th>
                      <th style={{ textAlign: 'right', padding: '12px 18px' }}>Total Amount</th>
                      <th style={{ textAlign: 'center', padding: '12px 14px' }}>Status</th>
                      <th style={{ width: '40px', padding: '12px 14px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_invoices.length > 0 ? (
                      data.recent_invoices.map((inv) => (
                        <tr key={inv.id} style={{ transition: 'background-color 0.15s ease' }}>
                          <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--color-botanical-700)' }}>
                            <Link to={`/invoices/${inv.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                              {inv.invoice_number}
                            </Link>
                          </td>
                          {isCombined && (
                            <td style={{ padding: '12px 14px' }}>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  backgroundColor: inv.business_id === 'grow-naturals' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                  color: inv.business_id === 'grow-naturals' ? '#059669' : '#d97706',
                                  border: `1px solid ${inv.business_id === 'grow-naturals' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {inv.business_id === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery'}
                              </span>
                            </td>
                          )}
                          <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {inv.customer_name}
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)' }}>
                            {formatDateDisplay(inv.created_at)}
                          </td>
                          <td style={{ padding: '12px 14px', textTransform: 'capitalize' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--color-bg-surface-subtle)',
                                border: '1px solid var(--color-border)'
                              }}
                            >
                              {inv.payment_method || 'Direct'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, padding: '12px 18px', color: '#059669' }}>
                            {formatCurrency(inv.total_amount)}
                          </td>
                          <td style={{ textAlign: 'center', padding: '12px 14px' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                backgroundColor: inv.payment_status === 'paid' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                color: inv.payment_status === 'paid' ? '#059669' : '#d97706',
                                border: `1px solid ${inv.payment_status === 'paid' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
                              }}
                            >
                              {inv.payment_status === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <Link
                              to={`/invoices/${inv.id}`}
                              style={{
                                color: 'var(--color-text-dim)',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                              title="View Invoice"
                            >
                              <Eye size={14} />
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isCombined ? 8 : 7} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
                          {isCombined ? 'No recent invoices recorded across either business.' : 'No recent invoices recorded in this business profile.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
