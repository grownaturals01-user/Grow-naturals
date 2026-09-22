import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingBag,
  AlertTriangle,
  FolderKanban,
  Plus,
  ShoppingCart,
  Receipt,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Building
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { businessId, business, isTaxable } = useBusiness();
  const [range, setRange] = useState<'today' | '7days' | 'month' | 'year'>('today');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api
      .get('/reports/dashboard', { business_id: businessId, range })
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
  }, [businessId, range]);

  const metrics = data?.metrics || {
    today_sales: 0,
    today_bills: 0,
    period_sales: 0,
    period_tax: 0,
    period_bills: 0,
    low_stock_count: 0,
    active_projects: 0,
    supplier_dues: 0,
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">
            <span>{business?.name || (isTaxable ? 'Grow Naturals' : 'Nikhlesh Nursery')}</span>
            <Badge variant={isTaxable ? 'success' : 'warning'}>
              {isTaxable ? 'GST Taxable' : '0% Tax (Agricultural)'}
            </Badge>
          </h1>
          <p className="page-description">
            Live business overview, sales velocity, counter operations, and pending dues.
          </p>
        </div>

        {/* Date Range Tabs */}
        <div className="tab-list" style={{ margin: 0, border: 'none', padding: 0 }}>
          <button
            type="button"
            className={`tab-btn ${range === 'today' ? 'active' : ''}`}
            onClick={() => setRange('today')}
          >
            Today
          </button>
          <button
            type="button"
            className={`tab-btn ${range === '7days' ? 'active' : ''}`}
            onClick={() => setRange('7days')}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            className={`tab-btn ${range === 'month' ? 'active' : ''}`}
            onClick={() => setRange('month')}
          >
            This Month
          </button>
          <button
            type="button"
            className={`tab-btn ${range === 'year' ? 'active' : ''}`}
            onClick={() => setRange('year')}
          >
            This Year
          </button>
        </div>
      </div>

      {/* Quick Action Strip */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <Link to="/pos" className="btn btn-sell">
          <ShoppingCart size={16} /> POS Counter
        </Link>
        <Link to="/products/new" className="btn btn-inv">
          <Plus size={16} /> Add Product
        </Link>
        <Link to="/quotations/new" className="btn btn-secondary">
          <FileSpreadsheet size={16} /> New Quotation
        </Link>
        <Link to="/expenses/new" className="btn btn-secondary">
          <Receipt size={16} /> Record Expense
        </Link>
      </div>

      {/* Core Key Metric Cards (Low cognitive load) */}
      <div className="stat-grid">
        <StatCard
          label="Today's Sales"
          value={`₹${metrics.today_sales.toLocaleString('en-IN')}`}
          subValue={`${metrics.today_bills} bills issued today`}
          icon={IndianRupee}
          variant="stat-sell"
        />

        <StatCard
          label={`${range === 'today' ? 'Period' : range.toUpperCase()} Revenue`}
          value={`₹${metrics.period_sales.toLocaleString('en-IN')}`}
          subValue={
            isTaxable
              ? `Incl. ₹${metrics.period_tax.toLocaleString('en-IN')} GST`
              : `₹0.00 tax (Non-Taxable)`
          }
          icon={TrendingUp}
          variant="stat-purch"
        />

        <StatCard
          label="Low Stock Alerts"
          value={metrics.low_stock_count}
          subValue={metrics.low_stock_count > 0 ? 'Requires re-ordering' : 'Inventory healthy'}
          icon={AlertTriangle}
          variant="stat-ops"
        />

        <StatCard
          label="Active Projects"
          value={metrics.active_projects}
          subValue={`Dues: ₹${metrics.supplier_dues.toLocaleString('en-IN')}`}
          icon={FolderKanban}
          variant="stat-proj"
        />
      </div>

      {/* Main Dashboard Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Recent Invoices Panel */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <ShoppingBag size={18} color="var(--module-sell-accent)" />
              Recent Invoices ({business?.name})
            </h3>
            <Link to="/invoices" className="btn btn-secondary btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Payment</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recent_invoices || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                      No sales recorded for this period yet. Open the POS to make a sale!
                    </td>
                  </tr>
                ) : (
                  (data?.recent_invoices || []).map((inv: any) => (
                    <tr key={inv.id}>
                      <td>
                        <Link to={`/invoices/${inv.id}`} style={{ fontWeight: 700, color: 'var(--module-sell-accent)' }}>
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td>{inv.customer_name || 'Walk-in Customer'}</td>
                      <td>
                        <Badge variant="neutral" style={{ textTransform: 'uppercase' }}>
                          {inv.payment_method}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular">
                        ₹{Number(inv.total_amount).toFixed(2)}
                      </td>
                      <td style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                        {new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products & Payment Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Selling */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <TrendingUp size={18} color="var(--module-inv-accent)" />
                Top Selling Items
              </h3>
            </div>
            <div className="card-body" style={{ padding: '16px' }}>
              {(data?.top_products || []).length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)', textAlign: 'center', padding: '12px' }}>
                  No items sold in this timeframe.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(data?.top_products || []).map((p: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ maxWidth: '65%' }}>
                        <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.product_name}
                        </div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                          {p.total_qty} units sold
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 'var(--font-sm)', color: 'var(--module-inv-accent)' }} className="tabular">
                        ₹{Number(p.total_revenue).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <CreditCard size={18} color="var(--module-purch-accent)" />
                Payment Breakdown
              </h3>
            </div>
            <div className="card-body" style={{ padding: '16px' }}>
              {(data?.payment_breakdown || []).length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)', textAlign: 'center', padding: '12px' }}>
                  No payment data.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(data?.payment_breakdown || []).map((pm: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ textTransform: 'capitalize', fontSize: 'var(--font-sm)', fontWeight: 500 }}>
                        {pm.payment_method} ({pm.count} bills)
                      </span>
                      <strong className="tabular" style={{ fontSize: 'var(--font-sm)' }}>
                        ₹{Number(pm.total).toFixed(2)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
