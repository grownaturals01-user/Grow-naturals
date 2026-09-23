import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { DeliveryChallan, CustomerDCSummary } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Link, useNavigate } from 'react-router-dom';
import {
  Truck,
  Plus,
  ArrowRight,
  User,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Receipt,
  Layers,
  Phone,
  FileCheck2,
  X,
  Loader2,
  Briefcase,
  ShieldAlert,
  ShieldCheck,
  Bell
} from 'lucide-react';

export const DeliveryChallansList: React.FC = () => {
  const { businessId, business } = useBusiness();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'by-customer' | 'all-challans'>('by-customer');
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [customerSummaries, setCustomerSummaries] = useState<CustomerDCSummary[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [dueReminderFilter, setDueReminderFilter] = useState<'all' | 'overdue' | 'due_today' | 'due_soon'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dueReminders, setDueReminders] = useState<{
    reminders: any[];
    summary: {
      total_pending: number;
      overdue_count: number;
      due_today_count: number;
      due_soon_count: number;
      total_due_amount: number;
    };
  } | null>(null);

  // Expanded customers state
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});

  // Payment / Settlement Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDCSummary | null>(null);
  const [selectedChallan, setSelectedChallan] = useState<DeliveryChallan | null>(null);
  const [selectedChallanIds, setSelectedChallanIds] = useState<string[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [convertToInvoice, setConvertToInvoice] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [allDc, custSummary, reminders] = await Promise.all([
        api.get('/delivery-challans', {
          business_id: businessId,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          payment_status: paymentFilter !== 'all' ? paymentFilter : undefined,
          approval_status: approvalFilter !== 'all' ? approvalFilter : undefined,
          search: search.trim() || undefined,
        }),
        api.get('/delivery-challans/customers-summary', {
          business_id: businessId,
          search: search.trim() || undefined,
        }),
        api.get('/delivery-challans/due-reminders', {
          business_id: businessId
        }).catch(() => null)
      ]);
      setChallans(allDc);
      setCustomerSummaries(custSummary);
      if (reminders) {
        setDueReminders(reminders);
      }
    } catch (err) {
      console.error('Failed to load DC data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [businessId, statusFilter, paymentFilter, approvalFilter, search]);

  const toggleCustomerExpand = (custName: string) => {
    setExpandedCustomers((prev) => ({ ...prev, [custName]: !prev[custName] }));
  };

  // Open Payment Modal for single challan
  const handleOpenChallanPayment = (dc: DeliveryChallan) => {
    setSelectedChallan(dc);
    setSelectedCustomer(null);
    setSelectedChallanIds([dc.id]);
    const due = Number(dc.due_amount) || Math.max(0, (Number(dc.total_amount) || 0) - (Number(dc.paid_amount) || 0));
    setPaymentAmount(String(due));
    setPaymentMethod('cash');
    setPaymentNotes(`Payment for DC #${dc.challan_number}`);
    setConvertToInvoice(false);
    setPaymentModalOpen(true);
  };

  // Open Payment Modal for customer (all or selected unpaid challans)
  const handleOpenCustomerPayment = (summary: CustomerDCSummary) => {
    setSelectedCustomer(summary);
    setSelectedChallan(null);
    const unpaidIds = summary.challans
      .filter((dc) => (Number(dc.due_amount) || 0) > 0 || dc.payment_status === 'unpaid' || dc.payment_status === 'partially_paid')
      .map((dc) => dc.id);

    setSelectedChallanIds(unpaidIds.length > 0 ? unpaidIds : summary.challans.map((d) => d.id));
    setPaymentAmount(String(summary.total_due_balance));
    setPaymentMethod('cash');
    setPaymentNotes(`Settlement of delivery dues for ${summary.customer_name}`);
    setConvertToInvoice(true);
    setPaymentModalOpen(true);
  };

  const handleToggleChallanInBulk = (id: string, due: number) => {
    setSelectedChallanIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      // Recalculate suggested amount
      if (selectedCustomer) {
        let total = 0;
        selectedCustomer.challans.forEach((c) => {
          if (next.includes(c.id)) {
            total += Number(c.due_amount) || Math.max(0, (Number(c.total_amount) || 0) - (Number(c.paid_amount) || 0));
          }
        });
        setPaymentAmount(String(total));
      }
      return next;
    });
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(paymentAmount);
    if (!amountVal || amountVal <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    if (selectedChallanIds.length === 0) {
      alert('Please select at least one delivery challan.');
      return;
    }

    setIsProcessingPayment(true);
    try {
      if (selectedChallan && selectedChallanIds.length === 1) {
        const res = await api.post(`/delivery-challans/${selectedChallan.id}/payments`, {
          amount: amountVal,
          payment_method: paymentMethod,
          notes: paymentNotes,
          create_invoice: convertToInvoice,
        });
        if (convertToInvoice && res.invoice_id) {
          navigate(`/invoices/${res.invoice_id}`);
          return;
        }
      } else {
        const res = await api.post('/delivery-challans/bulk-payment', {
          challan_ids: selectedChallanIds,
          amount: amountVal,
          payment_method: paymentMethod,
          notes: paymentNotes,
          convert_to_invoice: convertToInvoice,
        });
        if (convertToInvoice && res.invoice_id) {
          navigate(`/invoices/${res.invoice_id}`);
          return;
        }
      }

      setPaymentModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Payment recording failed: ${err.message}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Helper to compute DC due status
  const getDCDueInfo = (dc: DeliveryChallan) => {
    const total = Number(dc.total_amount) || 0;
    const paid = Number(dc.paid_amount) || 0;
    const due = Number(dc.due_amount) || Math.max(0, total - paid);

    if (due <= 0 || dc.payment_status === 'paid' || dc.payment_status === 'billed') {
      return { isDue: false, days: null, category: 'settled', label: 'Settled', color: '#059669', bg: 'rgba(16, 185, 129, 0.12)' };
    }
    if (!dc.due_date) {
      return { isDue: true, days: null, category: 'no_due_date', label: 'No Due Date', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dDate = new Date(dc.due_date);
    dDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { isDue: true, days: diffDays, category: 'overdue', label: `${Math.abs(diffDays)}d Overdue`, color: '#dc2626', bg: '#fee2e2' };
    } else if (diffDays === 0) {
      return { isDue: true, days: 0, category: 'due_today', label: 'Due Today', color: '#ea580c', bg: '#ffedd5' };
    } else if (diffDays <= 7) {
      return { isDue: true, days: diffDays, category: 'due_soon', label: `Due in ${diffDays}d`, color: '#d97706', bg: '#fef3c7' };
    }
    return { isDue: true, days: diffDays, category: 'upcoming', label: `Due ${new Date(dc.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`, color: '#2563eb', bg: '#eff6ff' };
  };

  // Metrics calculation
  const totalDispatched = customerSummaries.reduce((sum, c) => sum + c.total_dispatched_amount, 0);
  const totalPaid = customerSummaries.reduce((sum, c) => sum + c.total_paid_amount, 0);
  const totalDues = customerSummaries.reduce((sum, c) => sum + c.total_due_balance, 0);
  const customersWithDues = customerSummaries.filter((c) => c.total_due_balance > 0).length;

  // Filtered lists considering due reminder filters
  const filteredChallans = challans.filter((dc) => {
    if (dueReminderFilter === 'all') return true;
    const dueInfo = getDCDueInfo(dc);
    return dueInfo.category === dueReminderFilter;
  });

  const filteredCustomerSummaries = customerSummaries
    .map((summary) => {
      if (dueReminderFilter === 'all') return summary;
      const matching = summary.challans.filter((dc) => {
        const dueInfo = getDCDueInfo(dc);
        return dueInfo.category === dueReminderFilter;
      });
      return {
        ...summary,
        challans: matching,
        total_due_balance: matching.reduce((s, d) => s + (Number(d.due_amount) || Math.max(0, (Number(d.total_amount) || 0) - (Number(d.paid_amount) || 0))), 0)
      };
    })
    .filter((s) => (dueReminderFilter === 'all' ? true : s.challans.length > 0));

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div className="page-title-group">
          <h1 className="page-title" style={{ fontSize: '1.4rem' }}>
            <span>Delivery Challans & Dues</span>
            <Badge variant="sell">{business?.name}</Badge>
          </h1>
          <p className="page-description" style={{ fontSize: '0.8125rem' }}>
            Track site dispatches, material delivery notes, and clear pending customer dues upon payment.
          </p>
        </div>

        <div className="page-actions">
          <Link to="/delivery-challans/new" className="btn btn-sell" style={{ padding: '9px 18px', fontSize: '0.8125rem', gap: '6px' }}>
            <Plus size={15} /> New Delivery Challan
          </Link>
        </div>
      </div>

      {/* Due Date & Reminders Banner */}
      {dueReminders && (dueReminders.summary.overdue_count > 0 || dueReminders.summary.due_today_count > 0 || dueReminders.summary.due_soon_count > 0) && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: 'var(--radius-xl)',
            padding: '14px 20px',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Bell size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Payment Due Reminders & Deadlines
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '999px', border: '1px solid #fde68a' }}>
                  ₹{dueReminders.summary.total_due_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Total Due
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '2px' }}>
                Follow up with customers on pending challans before or on their scheduled payment due date.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {dueReminders.summary.overdue_count > 0 && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setDueReminderFilter(dueReminderFilter === 'overdue' ? 'all' : 'overdue')}
                style={{
                  backgroundColor: dueReminderFilter === 'overdue' ? '#dc2626' : '#fee2e2',
                  color: dueReminderFilter === 'overdue' ? '#ffffff' : '#991b1b',
                  border: '1px solid #fca5a5',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '5px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <AlertCircle size={13} /> {dueReminders.summary.overdue_count} Overdue
              </button>
            )}

            {dueReminders.summary.due_today_count > 0 && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setDueReminderFilter(dueReminderFilter === 'due_today' ? 'all' : 'due_today')}
                style={{
                  backgroundColor: dueReminderFilter === 'due_today' ? '#ea580c' : '#ffedd5',
                  color: dueReminderFilter === 'due_today' ? '#ffffff' : '#9a3412',
                  border: '1px solid #fed7aa',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '5px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Clock size={13} /> {dueReminders.summary.due_today_count} Due Today
              </button>
            )}

            {dueReminders.summary.due_soon_count > 0 && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setDueReminderFilter(dueReminderFilter === 'due_soon' ? 'all' : 'due_soon')}
                style={{
                  backgroundColor: dueReminderFilter === 'due_soon' ? '#d97706' : '#fef3c7',
                  color: dueReminderFilter === 'due_soon' ? '#ffffff' : '#b45309',
                  border: '1px solid #fde68a',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '5px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Calendar size={13} /> {dueReminders.summary.due_soon_count} Due in 7 Days
              </button>
            )}

            {dueReminderFilter !== 'all' && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setDueReminderFilter('all')}
                style={{ fontSize: '0.75rem', color: '#92400e', textDecoration: 'underline', padding: '4px 8px' }}
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card stat-sell">
          <div className="stat-card-accent-bar" />
          <div className="stat-content">
            <span className="stat-label">Total Outward Dispatched</span>
            <span className="stat-value tabular">₹{totalDispatched.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className="stat-sub">{challans.length} total delivery notes</span>
          </div>
          <div className="stat-icon-wrapper">
            <Truck size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: 'var(--color-danger-border)' }}>
          <div className="stat-card-accent-bar" style={{ backgroundColor: 'var(--color-danger)' }} />
          <div className="stat-content">
            <span className="stat-label" style={{ color: 'var(--color-danger-text)' }}>Total Outstanding Dues</span>
            <span className="stat-value tabular" style={{ color: 'var(--color-danger)' }}>
              ₹{totalDues.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="stat-sub">{customersWithDues} client(s) with pending payments</span>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--color-danger-subtle)', color: 'var(--color-danger)' }}>
            <AlertCircle size={22} />
          </div>
        </div>

        <div className="stat-card stat-inv">
          <div className="stat-card-accent-bar" />
          <div className="stat-content">
            <span className="stat-label">Collected & Settled</span>
            <span className="stat-value tabular">₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className="stat-sub">Received across challans</span>
          </div>
          <div className="stat-icon-wrapper">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '18px',
          backgroundColor: 'var(--color-bg-surface)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'by-customer' ? 'btn-sell' : 'btn-ghost'}`}
            onClick={() => setActiveTab('by-customer')}
            style={{ fontSize: '0.8125rem', padding: '7px 14px', borderRadius: 'var(--radius-md)' }}
          >
            <Layers size={14} /> Grouped by Customer ({filteredCustomerSummaries.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'all-challans' ? 'btn-sell' : 'btn-ghost'}`}
            onClick={() => setActiveTab('all-challans')}
            style={{ fontSize: '0.8125rem', padding: '7px 14px', borderRadius: 'var(--radius-md)' }}
          >
            <Truck size={14} /> All Challans ({filteredChallans.length})
          </button>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ width: '240px' }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search customer, DC #, vehicle..."
            />
          </div>

          <select
            className="form-select"
            style={{ width: '150px', fontSize: '0.8125rem', padding: '7px 12px' }}
            value={dueReminderFilter}
            onChange={(e) => setDueReminderFilter(e.target.value as any)}
          >
            <option value="all">All Deadlines</option>
            <option value="overdue">🚨 Overdue Dues</option>
            <option value="due_today">⏰ Due Today</option>
            <option value="due_soon">📅 Due in 7 Days</option>
          </select>

          <select
            className="form-select"
            style={{ width: '145px', fontSize: '0.8125rem', padding: '7px 12px' }}
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">All Payment Status</option>
            <option value="unpaid">Unpaid / Due</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Fully Paid</option>
            <option value="billed">Invoiced / Billed</option>
          </select>

          <select
            className="form-select"
            style={{ width: '130px', fontSize: '0.8125rem', padding: '7px 12px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Transit</option>
            <option value="dispatched">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>

          <select
            className="form-select"
            style={{ width: '140px', fontSize: '0.8125rem', padding: '7px 12px' }}
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
          >
            <option value="all">All Approvals</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
          <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 10px', color: 'var(--module-sell-accent)' }} />
          <p style={{ fontSize: 'var(--font-sm)' }}>Loading delivery challan ledger...</p>
        </div>
      ) : activeTab === 'by-customer' ? (
        /* TAB 1: GROUPED BY CUSTOMER VIEW */
        filteredCustomerSummaries.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No Customer Delivery Records"
            description={`No delivery challans match your selected filters.`}
            actionText="Create Delivery Challan"
            actionLink="/delivery-challans/new"
            accentClass="btn-sell"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredCustomerSummaries.map((summary) => {
              const isExpanded = !!expandedCustomers[summary.customer_name];
              const hasDue = summary.total_due_balance > 0;

              return (
                <div
                  key={summary.customer_name}
                  className="card"
                  style={{
                    borderColor: hasDue ? 'rgba(217, 119, 6, 0.35)' : 'var(--color-border)',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  {/* Customer Card Header */}
                  <div
                    style={{
                      padding: '14px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      backgroundColor: hasDue ? 'rgba(254, 243, 199, 0.25)' : 'var(--color-bg-surface)',
                      borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none',
                      cursor: 'pointer',
                      transition: 'background-color var(--transition-fast)'
                    }}
                    onClick={() => toggleCustomerExpand(summary.customer_name)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: 'var(--radius-lg)',
                          backgroundColor: hasDue ? 'var(--module-sell-subtle)' : 'var(--color-botanical-100)',
                          color: hasDue ? 'var(--module-sell-accent)' : 'var(--color-botanical-800)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px'
                        }}
                      >
                        <User size={18} />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {summary.customer_name}
                          </span>
                          {summary.customer_phone && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={11} /> {summary.customer_phone}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px', display: 'flex', gap: '12px' }}>
                          <span><strong>{summary.challan_count}</strong> Challan(s) issued</span>
                          <span>Latest: {new Date(summary.latest_dispatch_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Financial Balances & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Outstanding Due
                        </div>
                        <div
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            color: hasDue ? 'var(--color-danger)' : 'var(--color-success)',
                            fontFamily: 'var(--font-family-sans)'
                          }}
                          className="tabular"
                        >
                          ₹{summary.total_due_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '85px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Total Value
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }} className="tabular">
                          ₹{summary.total_dispatched_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      {hasDue && (
                        <button
                          type="button"
                          className="btn btn-inv btn-sm"
                          style={{
                            padding: '6px 14px',
                            fontWeight: 700,
                            borderRadius: 'var(--radius-full)',
                            boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                            gap: '4px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCustomerPayment(summary);
                          }}
                        >
                          <IndianRupee size={13} /> Clear Due / Pay
                        </button>
                      )}

                      <div style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Nested Delivery Challans Table */}
                  {isExpanded && (
                    <div style={{ padding: '0', backgroundColor: 'var(--color-bg-surface-subtle)', borderTop: '1px solid var(--color-border)' }}>
                      <table className="table" style={{ margin: 0, fontSize: '0.8125rem', width: '100%' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--color-bg-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ width: '22%', padding: '12px 18px' }}>Challan & Dispatch</th>
                            <th style={{ width: '26%', padding: '12px 18px' }}>Logistics & Materials</th>
                            <th style={{ width: '18%', padding: '12px 18px' }}>Transit Status</th>
                            <th style={{ width: '18%', padding: '12px 18px', textAlign: 'right' }}>Total & Due Balance</th>
                            <th style={{ width: '16%', padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.challans.map((dc) => {
                            const dcTotal = Number(dc.total_amount) || 0;
                            const dcPaid = Number(dc.paid_amount) || 0;
                            const dcDue = Number(dc.due_amount) || Math.max(0, dcTotal - dcPaid);
                            const dueInfo = getDCDueInfo(dc);

                            return (
                              <tr key={dc.id} style={{ backgroundColor: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '12px 18px', verticalAlign: 'middle' }}>
                                  <Link
                                    to={`/delivery-challans/${dc.id}`}
                                    style={{
                                      fontWeight: 800,
                                      color: 'var(--module-sell-accent)',
                                      fontSize: '0.875rem',
                                      textDecoration: 'none',
                                      display: 'block',
                                      marginBottom: '3px'
                                    }}
                                  >
                                    {dc.challan_number}
                                  </Link>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Calendar size={11} style={{ color: 'var(--color-text-dim)' }} />
                                    {new Date(dc.dispatch_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </div>
                                </td>

                                <td style={{ padding: '12px 18px', verticalAlign: 'middle' }}>
                                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                    {dc.item_count || 1} material item(s) dispatched
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                    Vehicle: {dc.vehicle_no || 'Local Handover'} {dc.driver_name ? `(${dc.driver_name})` : ''}
                                  </div>
                                </td>

                                <td style={{ padding: '12px 18px', verticalAlign: 'middle' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <span
                                      style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        padding: '2px 8px',
                                        borderRadius: '999px',
                                        width: 'fit-content',
                                        backgroundColor: dc.status === 'delivered' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                        color: dc.status === 'delivered' ? '#059669' : '#d97706',
                                        border: `1px solid ${dc.status === 'delivered' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
                                      }}
                                    >
                                      {dc.status === 'delivered' ? 'Delivered' : 'In Transit'}
                                    </span>
                                    {dc.approval_status === 'pending_approval' ? (
                                      <span
                                        style={{
                                          fontSize: '0.68rem',
                                          fontWeight: 700,
                                          padding: '2px 7px',
                                          borderRadius: '999px',
                                          width: 'fit-content',
                                          backgroundColor: '#fffbeb',
                                          color: '#b45309',
                                          border: '1px solid #fde68a',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px'
                                        }}
                                        title={dc.approval_reason || 'Credit limit exceeded'}
                                      >
                                        <ShieldAlert size={10} color="#d97706" /> Approval Required
                                      </span>
                                    ) : dc.approval_status === 'rejected' ? (
                                      <span
                                        style={{
                                          fontSize: '0.68rem',
                                          fontWeight: 700,
                                          padding: '2px 7px',
                                          borderRadius: '999px',
                                          width: 'fit-content',
                                          backgroundColor: '#fee2e2',
                                          color: '#b91c1c',
                                          border: '1px solid #fca5a5',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px'
                                        }}
                                      >
                                        <X size={10} color="#dc2626" /> Rejected
                                      </span>
                                    ) : null}
                                  </div>
                                </td>

                                <td style={{ padding: '12px 18px', textAlign: 'right', verticalAlign: 'middle' }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: dcDue > 0 ? '#dc2626' : '#059669' }} className="tabular">
                                    ₹{dcDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {dcDue > 0 ? 'Due' : ''}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                      Total: ₹{dcTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '0.68rem',
                                        fontWeight: 700,
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        backgroundColor:
                                          dc.payment_status === 'paid' || dc.payment_status === 'billed'
                                            ? 'rgba(16, 185, 129, 0.12)'
                                            : dc.payment_status === 'partially_paid'
                                            ? 'rgba(245, 158, 11, 0.12)'
                                            : 'rgba(239, 68, 68, 0.12)',
                                        color:
                                          dc.payment_status === 'paid' || dc.payment_status === 'billed'
                                            ? '#059669'
                                            : dc.payment_status === 'partially_paid'
                                            ? '#d97706'
                                            : '#dc2626'
                                      }}
                                    >
                                      {dc.payment_status === 'billed' ? 'Billed' : dc.payment_status === 'paid' ? 'Paid' : dc.payment_status === 'partially_paid' ? 'Partial' : 'Unpaid'}
                                    </span>
                                    {dueInfo.isDue && (
                                      <span
                                        style={{
                                          fontSize: '0.68rem',
                                          fontWeight: 700,
                                          padding: '1px 6px',
                                          borderRadius: '4px',
                                          backgroundColor: dueInfo.bg,
                                          color: dueInfo.color,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '2px'
                                        }}
                                        title={dc.due_date ? `Due Date: ${new Date(dc.due_date).toLocaleDateString('en-IN')}` : undefined}
                                      >
                                        <Clock size={10} /> {dueInfo.label}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td style={{ padding: '12px 18px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                    {dcDue > 0 && (
                                      <button
                                        type="button"
                                        className="btn btn-inv btn-sm"
                                        style={{
                                          padding: '4px 10px',
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          borderRadius: 'var(--radius-md)',
                                          gap: '3px',
                                          whiteSpace: 'nowrap'
                                        }}
                                        onClick={() => handleOpenChallanPayment(dc)}
                                      >
                                        <IndianRupee size={12} /> Pay
                                      </button>
                                    )}
                                    <Link
                                      to={`/delivery-challans/${dc.id}`}
                                      className="btn btn-secondary btn-sm"
                                      style={{
                                        padding: '4px 10px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        borderRadius: 'var(--radius-md)',
                                        gap: '3px',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      View <ArrowRight size={11} />
                                    </Link>
                                  </div>
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
            })}
          </div>
        )
      ) : (
        /* TAB 2: CHRONOLOGICAL ALL CHALLANS VIEW */
        filteredChallans.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No Delivery Challans Found"
            description={`No dispatch records match your current filter.`}
            actionText="Create Delivery Challan"
            actionLink="/delivery-challans/new"
            accentClass="btn-sell"
          />
        ) : (
          <div
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden'
            }}
          >
            <table className="table" style={{ margin: 0, fontSize: '0.8125rem', width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ width: '18%', padding: '14px 18px' }}>Challan & Date</th>
                  <th style={{ width: '28%', padding: '14px 18px' }}>Customer & Destination</th>
                  <th style={{ width: '18%', padding: '14px 18px' }}>Transit & Vehicle</th>
                  <th style={{ width: '20%', padding: '14px 18px', textAlign: 'right' }}>Total & Due Balance</th>
                  <th style={{ width: '16%', padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredChallans.map((dc) => {
                  const total = Number(dc.total_amount) || 0;
                  const paid = Number(dc.paid_amount) || 0;
                  const due = Number(dc.due_amount) || Math.max(0, total - paid);
                  const dueInfo = getDCDueInfo(dc);

                  return (
                    <tr key={dc.id} style={{ transition: 'background-color 0.15s ease', borderBottom: '1px solid var(--color-border)' }}>
                      {/* 1. Challan # and Date */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <Link
                          to={`/delivery-challans/${dc.id}`}
                          style={{
                            fontWeight: 800,
                            color: 'var(--module-sell-accent)',
                            fontSize: '0.875rem',
                            textDecoration: 'none',
                            display: 'block',
                            marginBottom: '4px'
                          }}
                        >
                          {dc.challan_number}
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} style={{ color: 'var(--color-text-dim)' }} />
                          {new Date(dc.dispatch_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>

                      {/* 2. Customer & Project Destination */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                          {dc.customer_name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                          {dc.customer_phone && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Phone size={10} /> {dc.customer_phone}
                            </span>
                          )}
                          {dc.project_name ? (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '1px 7px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--color-bg-surface-subtle)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-secondary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Briefcase size={10} /> {dc.project_name}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>Direct Sale Delivery</span>
                          )}
                        </div>
                      </td>

                      {/* 3. Transit & Logistics */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                          {dc.vehicle_no || 'Handover Dispatch'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              backgroundColor: dc.status === 'delivered' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              color: dc.status === 'delivered' ? '#059669' : '#d97706',
                              border: `1px solid ${dc.status === 'delivered' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
                            }}
                          >
                            {dc.status === 'delivered' ? 'Delivered' : 'In Transit'}
                          </span>
                          {dc.approval_status === 'pending_approval' ? (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: '999px',
                                backgroundColor: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title={dc.approval_reason || 'Credit limit exceeded'}
                            >
                              <ShieldAlert size={10} color="#d97706" /> Approval Required
                            </span>
                          ) : dc.approval_status === 'rejected' ? (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: '999px',
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #fca5a5',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <X size={10} color="#dc2626" /> Rejected
                            </span>
                          ) : null}
                          {dc.driver_name && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
                              ({dc.driver_name})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Total & Due Balance */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: due > 0 ? '#dc2626' : '#059669' }} className="tabular">
                          ₹{due.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {due > 0 ? 'Due' : ''}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                            Total: ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor:
                                dc.payment_status === 'paid' || dc.payment_status === 'billed'
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : dc.payment_status === 'partially_paid'
                                  ? 'rgba(245, 158, 11, 0.12)'
                                  : 'rgba(239, 68, 68, 0.12)',
                              color:
                                dc.payment_status === 'paid' || dc.payment_status === 'billed'
                                  ? '#059669'
                                  : dc.payment_status === 'partially_paid'
                                  ? '#d97706'
                                  : '#dc2626'
                            }}
                          >
                            {dc.payment_status === 'billed' ? 'Billed' : dc.payment_status === 'paid' ? 'Paid' : dc.payment_status === 'partially_paid' ? 'Partial' : 'Unpaid'}
                          </span>
                          {dueInfo.isDue && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: dueInfo.bg,
                                color: dueInfo.color,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                              title={dc.due_date ? `Due Date: ${new Date(dc.due_date).toLocaleDateString('en-IN')}` : undefined}
                            >
                              <Clock size={10} /> {dueInfo.label}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          {due > 0 && (
                            <button
                              type="button"
                              className="btn btn-inv btn-sm"
                              style={{
                                padding: '5px 12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                borderRadius: 'var(--radius-md)',
                                gap: '4px',
                                whiteSpace: 'nowrap'
                              }}
                              onClick={() => handleOpenChallanPayment(dc)}
                            >
                              <IndianRupee size={12} /> Clear Due
                            </button>
                          )}
                          <Link
                            to={`/delivery-challans/${dc.id}`}
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '5px 12px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              borderRadius: 'var(--radius-md)',
                              gap: '4px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            View Slip <ArrowRight size={12} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* =========================================================================
          PAYMENT / DUE CLEARANCE MODAL
          ========================================================================= */}
      {paymentModalOpen && (
        <div className="dialog-overlay" onClick={() => setPaymentModalOpen(false)}>
          <div className="dialog-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IndianRupee size={18} style={{ color: 'var(--module-inv-accent)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  {selectedCustomer ? `Clear Due for ${selectedCustomer.customer_name}` : `Clear Due for DC #${selectedChallan?.challan_number}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProcessPayment}>
              <div className="dialog-body" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Challan selection list if customer has multiple challans */}
                {selectedCustomer && selectedCustomer.challans.length > 0 && (
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '6px' }}>
                      Select Challans to Settle
                    </label>
                    <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '6px' }}>
                      {selectedCustomer.challans.map((dc) => {
                        const isChecked = selectedChallanIds.includes(dc.id);
                        const due = Number(dc.due_amount) || Math.max(0, (Number(dc.total_amount) || 0) - (Number(dc.paid_amount) || 0));

                        return (
                          <div
                            key={dc.id}
                            onClick={() => handleToggleChallanInBulk(dc.id, due)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: isChecked ? 'var(--color-botanical-50)' : 'transparent',
                              cursor: 'pointer',
                              marginBottom: '2px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                style={{ cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{dc.challan_number}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>({new Date(dc.dispatch_date).toLocaleDateString()})</span>
                            </div>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: due > 0 ? 'var(--color-danger)' : 'var(--color-success)' }} className="tabular">
                              Due: ₹{due.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Amount to collect */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Payment Amount to Collect (₹) <span className="required">*</span>
                  </label>
                  <div className="input-addon-group">
                    <span className="input-addon-prefix">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input tabular"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Payment Mode */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">💵 Cash Received</option>
                    <option value="upi">📱 UPI / QR Code (GPay, PhonePe, Paytm)</option>
                    <option value="bank_transfer">🏦 Direct Bank Transfer / NEFT / IMPS</option>
                    <option value="card">💳 Card Swipe (POS Machine)</option>
                    <option value="cheque">📝 Cheque</option>
                  </select>
                </div>

                {/* Payment Notes */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Reference / Transaction Note</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. UPI Ref #938492849, Cash handed by site supervisor"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>

                {/* Convert to Official Invoice Checkbox */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    backgroundColor: 'var(--color-bg-surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <input
                    type="checkbox"
                    id="convertToInvoiceCheck"
                    checked={convertToInvoice}
                    onChange={(e) => setConvertToInvoice(e.target.checked)}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <label htmlFor="convertToInvoiceCheck" style={{ fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <strong>Generate Official Paid Tax Invoice</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      Automatically compiles all items from the settled challan(s) into a formal invoice for accounting & tax audit.
                    </div>
                  </label>
                </div>
              </div>

              <div className="dialog-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPaymentModalOpen(false)}
                  style={{ padding: '7px 16px', fontSize: '0.8125rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-inv"
                  disabled={isProcessingPayment}
                  style={{ padding: '7px 20px', fontSize: '0.8125rem', fontWeight: 700 }}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Recording...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Confirm & Clear Due
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
