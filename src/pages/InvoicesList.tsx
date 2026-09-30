import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  Printer,
  Calendar,
  CreditCard,
  UserCheck,
  RotateCcw,
  ArrowRight,
  Download,
  X,
  IndianRupee,
  Briefcase,
  Percent,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  User,
  ShoppingBag,
  Sparkles,
  MoreVertical,
  Trash2,
  Copy,
  Edit,
  Edit3,
  XCircle,
  FileText,
  History,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { Invoice } from '../types';
import { useBusiness } from '../context/BusinessContext';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';

type DatePreset = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_30_days' | 'custom';
type AmountPreset = 'all' | 'under_500' | '500_to_2000' | '2000_to_5000' | '5000_to_10000' | 'above_10000' | 'custom';

export const InvoicesList: React.FC = () => {
  const navigate = useNavigate();
  const { activeBusiness } = useBusiness();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);

  // Selection State & MyBillBook Kebab Actions State
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [actionMenuInvoiceId, setActionMenuInvoiceId] = useState<string | null>(null);
  const [editHistoryInvoice, setEditHistoryInvoice] = useState<Invoice | null>(null);
  const [creditNoteInvoice, setCreditNoteInvoice] = useState<Invoice | null>(null);
  const [creditNoteAmount, setCreditNoteAmount] = useState<string>('');
  const [creditNoteReason, setCreditNoteReason] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('all');
  const [paymentStatus, setPaymentStatus] = useState<string>('all');
  const [customerType, setCustomerType] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [amountPreset, setAmountPreset] = useState<AmountPreset>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [discountFilter, setDiscountFilter] = useState<string>('all');
  const [taxFilter, setTaxFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Close kebab menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.mbb-kebab-wrapper')) {
        setActionMenuInvoiceId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Apply Date Presets
  const handleDatePresetSelect = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }

    if (preset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
      return;
    }

    if (preset === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      setStartDate(yesterdayStr);
      setEndDate(yesterdayStr);
      return;
    }

    if (preset === 'this_week') {
      const startOfWeek = new Date(now);
      const day = now.getDay() || 7;
      startOfWeek.setDate(now.getDate() - day + 1);
      setStartDate(startOfWeek.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
      return;
    }

    if (preset === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
      return;
    }

    if (preset === 'last_30_days') {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
      return;
    }
  };

  // Handle Amount Presets
  const handleAmountPresetSelect = (preset: AmountPreset) => {
    setAmountPreset(preset);
    if (preset === 'all') {
      setMinAmount('');
      setMaxAmount('');
    } else if (preset === 'under_500') {
      setMinAmount('');
      setMaxAmount('500');
    } else if (preset === '500_to_2000') {
      setMinAmount('500');
      setMaxAmount('2000');
    } else if (preset === '2000_to_5000') {
      setMinAmount('2000');
      setMaxAmount('5000');
    } else if (preset === '5000_to_10000') {
      setMinAmount('5000');
      setMaxAmount('10000');
    } else if (preset === 'above_10000') {
      setMinAmount('10000');
      setMaxAmount('');
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.get<Invoice[]>('/invoices', {
        search: search.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        payment_method: paymentMethod !== 'all' ? paymentMethod : undefined,
        payment_status: paymentStatus !== 'all' ? paymentStatus : undefined,
        customer_type: customerType !== 'all' ? customerType : undefined,
        project_id: projectFilter !== 'all' ? projectFilter : undefined,
        min_amount: minAmount ? Number(minAmount) : undefined,
        max_amount: maxAmount ? Number(maxAmount) : undefined,
        has_discount: discountFilter !== 'all' ? discountFilter : undefined,
        has_tax: taxFilter !== 'all' ? taxFilter : undefined,
        sort_by: sortBy,
        limit: 250,
      });
      setInvoices(data || []);
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [
    activeBusiness.id,
    startDate,
    endDate,
    paymentMethod,
    paymentStatus,
    customerType,
    projectFilter,
    minAmount,
    maxAmount,
    discountFilter,
    taxFilter,
    sortBy
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleClearAllFilters = () => {
    setSearch('');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setPaymentMethod('all');
    setPaymentStatus('all');
    setCustomerType('all');
    setProjectFilter('all');
    setAmountPreset('all');
    setMinAmount('');
    setMaxAmount('');
    setDiscountFilter('all');
    setTaxFilter('all');
    setSortBy('date_desc');
    setCurrentPage(1);
  };

  // Toggle column sorting
  const toggleSort = (field: 'date' | 'amount') => {
    if (field === 'date') {
      setSortBy(prev => prev === 'date_desc' ? 'date_asc' : 'date_desc');
    } else if (field === 'amount') {
      setSortBy(prev => prev === 'amount_desc' ? 'amount_asc' : 'amount_desc');
    }
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (paginatedInvoices.length === 0) return;
    const paginatedIds = paginatedInvoices.map(i => i.id);
    const allSelected = paginatedIds.every(id => selectedInvoiceIds.includes(id));
    if (allSelected) {
      setSelectedInvoiceIds(prev => prev.filter(id => !paginatedIds.includes(id)));
    } else {
      setSelectedInvoiceIds(prev => Array.from(new Set([...prev, ...paginatedIds])));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Actions handlers
  const handleDeleteInvoice = async (inv: Invoice) => {
    if (!window.confirm(`Are you sure you want to permanently delete invoice ${inv.invoice_number}? This cannot be undone.`)) {
      return;
    }
    try {
      setIsProcessingAction(true);
      await api.delete(`/invoices/${inv.id}`);
      setActionMenuInvoiceId(null);
      setSelectedInvoiceIds(prev => prev.filter(id => id !== inv.id));
      await fetchInvoices();
    } catch (err: any) {
      alert(`Failed to delete invoice: ${err.message || 'Error occurred'}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoiceIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedInvoiceIds.length} selected invoice(s)? This cannot be undone.`)) {
      return;
    }
    try {
      setIsProcessingAction(true);
      for (const id of selectedInvoiceIds) {
        await api.delete(`/invoices/${id}`).catch(() => {});
      }
      setSelectedInvoiceIds([]);
      await fetchInvoices();
    } catch (err: any) {
      alert(`Failed to delete invoices: ${err.message || 'Error occurred'}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleCancelInvoice = async (inv: Invoice) => {
    if (!window.confirm(`Are you sure you want to cancel invoice ${inv.invoice_number}?`)) {
      return;
    }
    try {
      setIsProcessingAction(true);
      await api.put(`/invoices/${inv.id}/cancel`, {});
      setActionMenuInvoiceId(null);
      await fetchInvoices();
    } catch (err: any) {
      alert(`Failed to cancel invoice: ${err.message || 'Error occurred'}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDuplicateInvoice = (inv: Invoice) => {
    setActionMenuInvoiceId(null);
    navigate(`/sales/new?duplicateInvoiceId=${inv.id}`);
  };

  const handleEditInvoice = (inv: Invoice) => {
    setActionMenuInvoiceId(null);
    navigate(`/invoices/${inv.id}`);
  };

  const handleIssueCreditNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditNoteInvoice) return;
    alert(`Credit Note of ₹${creditNoteAmount} recorded against invoice ${creditNoteInvoice.invoice_number}!`);
    setCreditNoteInvoice(null);
    setCreditNoteAmount('');
    setCreditNoteReason('');
  };

  // Due In helper
  const getDueInLabel = (inv: Invoice) => {
    const status = (inv.payment_status || 'unpaid').toLowerCase();
    if (status === 'paid' || status === 'cancelled') {
      return '-';
    }
    const createdTime = new Date(inv.created_at).getTime();
    const dueTime = (inv as any).due_date ? new Date((inv as any).due_date).getTime() : (createdTime + 28 * 24 * 60 * 60 * 1000);
    const diffDays = Math.ceil((dueTime - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return `${Math.abs(diffDays)}d Overdue`;
    }
    if (diffDays === 0) {
      return 'Due Today';
    }
    return `${diffDays} Days`;
  };

  // Status pill badge helper
  const renderStatusPill = (statusRaw?: string) => {
    const status = (statusRaw || 'unpaid').toLowerCase();
    if (status === 'paid' || status === 'settled') {
      return <span className="mbb-status-pill mbb-status-paid">Paid</span>;
    }
    if (status === 'cancelled') {
      return <span className="mbb-status-pill mbb-status-cancelled">Cancelled</span>;
    }
    if (status === 'partial' || status === 'partially_paid') {
      return <span className="mbb-status-pill mbb-status-partial">Partial</span>;
    }
    return <span className="mbb-status-pill mbb-status-unpaid">Unpaid</span>;
  };

  // Count active non-default filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (startDate || endDate || datePreset !== 'all') count++;
    if (paymentMethod !== 'all') count++;
    if (paymentStatus !== 'all') count++;
    if (customerType !== 'all') count++;
    if (projectFilter !== 'all') count++;
    if (amountPreset !== 'all' || minAmount || maxAmount) count++;
    if (discountFilter !== 'all') count++;
    if (taxFilter !== 'all') count++;
    if (sortBy !== 'date_desc') count++;
    return count;
  }, [
    search,
    startDate,
    endDate,
    datePreset,
    paymentMethod,
    paymentStatus,
    customerType,
    projectFilter,
    amountPreset,
    minAmount,
    maxAmount,
    discountFilter,
    taxFilter,
    sortBy
  ]);

  // Summary Metrics calculations
  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
  const totalTax = invoices.reduce((sum, inv) => sum + Number(inv.tax_amount || 0), 0);
  const totalDiscount = invoices.reduce((sum, inv) => sum + Number(inv.discount_amount || 0), 0);
  const totalItemsCount = invoices.reduce((sum, inv) => sum + Number(inv.item_count || 1), 0);
  const avgOrderValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;

  // Pagination calculations
  const totalInvoicesCount = invoices.length;
  const totalPages = Math.max(1, Math.ceil(totalInvoicesCount / itemsPerPage));

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return invoices.slice(startIndex, startIndex + itemsPerPage);
  }, [invoices, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newPerPage: number) => {
    setItemsPerPage(newPerPage);
    setCurrentPage(1);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (invoices.length === 0) {
      alert('No invoice data available to export.');
      return;
    }

    const headers = [
      'Invoice #',
      'Date',
      'Time',
      'Customer Name',
      'Customer Phone',
      'Project',
      'Payment Method',
      'Payment Status',
      'Items Count',
      'Subtotal (₹)',
      'Discount (₹)',
      'Tax Amount (₹)',
      'Total Amount (₹)'
    ];

    const rows = invoices.map(inv => [
      `"${inv.invoice_number}"`,
      `"${new Date(inv.created_at).toLocaleDateString('en-IN')}"`,
      `"${new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}"`,
      `"${(inv.customer_name || 'Walk-in Customer').replace(/"/g, '""')}"`,
      `"${inv.customer_phone || ''}"`,
      `"${(inv.project_name || '').replace(/"/g, '""')}"`,
      `"${inv.payment_method}"`,
      `"${inv.payment_status || 'paid'}"`,
      inv.item_count || 1,
      Number(inv.subtotal || 0).toFixed(2),
      Number(inv.discount_amount || 0).toFixed(2),
      Number(inv.tax_amount || 0).toFixed(2),
      Number(inv.total_amount || 0).toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_invoices_${activeBusiness.id}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div className="page-title-group">
          <h1 className="page-title" style={{ fontSize: '1.4rem' }}>
            <span>Sales Invoices</span>
            <Badge variant="sell">{activeBusiness.name}</Badge>
          </h1>
          <p className="page-description" style={{ fontSize: '0.8125rem' }}>
            Browse, filter, analyze, and manage all customer sales bills, GST invoices, and payments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            style={{ fontSize: '0.8125rem', padding: '8px 14px', gap: '6px' }}
            title="Export filtered invoices to CSV spreadsheet"
          >
            <Download size={15} /> Export CSV
          </button>
          <Link to="/refunds" className="btn btn-secondary" style={{ fontSize: '0.8125rem', padding: '8px 14px', gap: '6px' }}>
            <RotateCcw size={15} /> Refunds
          </Link>
          <Link to="/sales/new" className="btn btn-sell" style={{ fontSize: '0.8125rem', padding: '8px 16px', gap: '6px' }}>
            <ShoppingBag size={15} /> + Create Sales Invoice
          </Link>
        </div>
      </div>

      {/* Summary KPI Stat Cards */}
      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card stat-sell">
          <div className="stat-card-accent-bar" />
          <div className="stat-content">
            <span className="stat-label">Invoices Count</span>
            <span className="stat-value tabular">{invoices.length}</span>
            <span className="stat-sub">{totalItemsCount} total item(s) sold</span>
          </div>
          <div className="stat-icon-wrapper">
            <ShoppingBag size={22} />
          </div>
        </div>

        <div className="stat-card stat-inv">
          <div className="stat-card-accent-bar" />
          <div className="stat-content">
            <span className="stat-label">Total Billed Revenue</span>
            <span className="stat-value tabular">
              ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="stat-sub">
              {activeBusiness.id === 'grow-naturals' ? 'Gross sales including taxes' : 'Total net sales revenue'}
            </span>
          </div>
          <div className="stat-icon-wrapper">
            <IndianRupee size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: 'var(--color-border)' }}>
          <div className="stat-card-accent-bar" style={{ backgroundColor: '#8b5cf6' }} />
          <div className="stat-content">
            <span className="stat-label">Avg Order Value (AOV)</span>
            <span className="stat-value tabular" style={{ color: '#7c3aed' }}>
              ₹{avgOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="stat-sub">Average ticket size per bill</span>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' }}>
            <Sparkles size={22} />
          </div>
        </div>

        {activeBusiness.id === 'grow-naturals' ? (
          <div className="stat-card" style={{ borderColor: 'var(--color-border)' }}>
            <div className="stat-card-accent-bar" style={{ backgroundColor: '#0284c7' }} />
            <div className="stat-content">
              <span className="stat-label">GST Tax Collected</span>
              <span className="stat-value tabular" style={{ color: '#0284c7' }}>
                ₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="stat-sub">CGST + SGST tax total</span>
            </div>
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
              <Percent size={22} />
            </div>
          </div>
        ) : (
          <div className="stat-card" style={{ borderColor: 'var(--color-border)' }}>
            <div className="stat-card-accent-bar" style={{ backgroundColor: '#ea580c' }} />
            <div className="stat-content">
              <span className="stat-label">Discounts Awarded</span>
              <span className="stat-value tabular" style={{ color: '#ea580c' }}>
                ₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="stat-sub">Customer bill reductions</span>
            </div>
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(234, 88, 12, 0.12)', color: '#ea580c' }}>
              <Percent size={22} />
            </div>
          </div>
        )}
      </div>

      {/* Main Filter Section */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          padding: '16px 20px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        {/* Row 1: Quick Date Presets Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginRight: '4px' }}>
              Time Period:
            </span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_30_days', label: 'Last 30 Days' },
              { id: 'custom', label: 'Custom Range' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                className={`btn btn-sm ${datePreset === p.id ? 'btn-sell' : 'btn-ghost'}`}
                onClick={() => handleDatePresetSelect(p.id as DatePreset)}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: datePreset === p.id ? 'none' : '1px solid var(--color-border)',
                  fontWeight: datePreset === p.id ? 700 : 500
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{ fontSize: '0.78rem', color: 'var(--module-sell-accent)', gap: '4px', fontWeight: 600 }}
          >
            <SlidersHorizontal size={13} />
            {showAdvancedFilters ? 'Hide Extra Filters' : 'More Filters'}
            <ChevronDown size={13} style={{ transform: showAdvancedFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>

        {/* Row 2: Search, Date Range Pickers, and Primary Dropdowns */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 260px', minWidth: '220px', position: 'relative' }}>
            <div className="input-icon-wrapper" style={{ width: '100%' }}>
              <Search size={15} className="input-icon" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search invoice #, customer name, mobile..."
                className="form-input"
                style={{ paddingLeft: '34px', fontSize: '0.8125rem' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Custom Date Inputs (when selected or active) */}
          {(datePreset === 'custom' || startDate || endDate) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="date"
                className="form-input form-input-sm"
                style={{ width: '135px' }}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                title="Start Date"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>to</span>
              <input
                type="date"
                className="form-input form-input-sm"
                style={{ width: '135px' }}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                title="End Date"
              />
            </div>
          )}

          {/* Payment Method Filter */}
          <div style={{ minWidth: '155px' }}>
            <select
              className="form-select form-select-sm"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="all">All Payment Methods</option>
              <option value="cash">Cash Payment</option>
              <option value="upi">UPI / QR Code</option>
              <option value="card">Card Payment</option>
              <option value="credit">Credit / Pay Later</option>
              <option value="split">Split Payment</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div style={{ minWidth: '145px' }}>
            <select
              className="form-select form-select-sm"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid / Settled</option>
              <option value="unpaid">Unpaid / Pending</option>
              <option value="partial">Partially Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div style={{ minWidth: '175px' }}>
            <select
              className="form-select form-select-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_desc">Latest (Newest First)</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Amount (High to Low)</option>
              <option value="amount_asc">Amount (Low to High)</option>
              <option value="items_desc">Items (Most First)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-sell" style={{ fontSize: '0.8125rem', padding: '6px 14px', gap: '6px', height: '36px' }}>
            <Filter size={14} /> Filter
          </button>
        </form>

        {/* Row 3: Advanced Collapsible Filters */}
        {showAdvancedFilters && (
          <div
            style={{
              marginTop: '14px',
              paddingTop: '14px',
              borderTop: '1px dashed var(--color-border)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              backgroundColor: 'var(--color-bg-surface-subtle)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            {/* Customer Type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Customer Type:
              </label>
              <select
                className="form-select form-select-sm"
                style={{ width: '160px' }}
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
              >
                <option value="all">All Customer Types</option>
                <option value="registered">Registered Clients</option>
                <option value="walkin">Walk-in Store Buyers</option>
              </select>
            </div>

            {/* Project / Channel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Sales Channel:
              </label>
              <select
                className="form-select form-select-sm"
                style={{ width: '175px' }}
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="all">All Sales Channels</option>
                <option value="direct_only">Direct Retail Sales</option>
                <option value="projects_only">Project / Landscape Sales</option>
              </select>
            </div>

            {/* Amount Presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Bill Amount Range:
              </label>
              <select
                className="form-select form-select-sm"
                style={{ width: '155px' }}
                value={amountPreset}
                onChange={(e) => handleAmountPresetSelect(e.target.value as AmountPreset)}
              >
                <option value="all">All Amounts</option>
                <option value="under_500">Under ₹500</option>
                <option value="500_to_2000">₹500 - ₹2,000</option>
                <option value="2000_to_5000">₹2,000 - ₹5,000</option>
                <option value="5000_to_10000">₹5,000 - ₹10,000</option>
                <option value="above_10000">Above ₹10,000</option>
                <option value="custom">Custom Limits...</option>
              </select>
            </div>

            {/* Custom Min / Max Amount Inputs */}
            {amountPreset === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Min ₹:
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="form-input form-input-sm"
                    style={{ width: '85px' }}
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Max ₹:
                  </label>
                  <input
                    type="number"
                    placeholder="99999"
                    className="form-input form-input-sm"
                    style={{ width: '85px' }}
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Discount Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Discounts:
              </label>
              <select
                className="form-select form-select-sm"
                style={{ width: '140px' }}
                value={discountFilter}
                onChange={(e) => setDiscountFilter(e.target.value)}
              >
                <option value="all">All Invoices</option>
                <option value="yes">With Discount</option>
                <option value="no">Zero Discount</option>
              </select>
            </div>

            {/* Tax Filter (for Grow Naturals) */}
            {activeBusiness.id === 'grow-naturals' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Tax Classification:
                </label>
                <select
                  className="form-select form-select-sm"
                  style={{ width: '140px' }}
                  value={taxFilter}
                  onChange={(e) => setTaxFilter(e.target.value)}
                >
                  <option value="all">All Invoices</option>
                  <option value="yes">GST Tax Bills</option>
                  <option value="no">Non-GST Bills</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Row 4: Active Filter Chips Bar */}
        {activeFiltersCount > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid var(--color-border)'
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Active Filters ({activeFiltersCount}):
            </span>

            {search.trim() && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--color-bg-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Search: "{search}"
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSearch('')} />
              </span>
            )}

            {(startDate || endDate || datePreset !== 'all') && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--color-bg-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Date: {datePreset !== 'custom' ? datePreset.replace('_', ' ') : `${startDate || 'Start'} → ${endDate || 'Now'}`}
                <X
                  size={12}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setDatePreset('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                />
              </span>
            )}

            {paymentMethod !== 'all' && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--color-bg-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textTransform: 'capitalize'
                }}
              >
                Method: {paymentMethod}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setPaymentMethod('all')} />
              </span>
            )}

            {paymentStatus !== 'all' && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--color-bg-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textTransform: 'capitalize'
                }}
              >
                Status: {paymentStatus}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setPaymentStatus('all')} />
              </span>
            )}

            {customerType !== 'all' && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--color-bg-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Customer: {customerType === 'registered' ? 'Registered' : 'Walk-in'}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setCustomerType('all')} />
              </span>
            )}

            {projectFilter !== 'all' && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--color-bg-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Channel: {projectFilter === 'direct_only' ? 'Direct Retail' : 'Project Sales'}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setProjectFilter('all')} />
              </span>
            )}

            {(amountPreset !== 'all' || minAmount || maxAmount) && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--color-bg-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Amount: {minAmount ? `≥ ₹${minAmount}` : ''} {maxAmount ? `≤ ₹${maxAmount}` : ''}
                <X
                  size={12}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setAmountPreset('all');
                    setMinAmount('');
                    setMaxAmount('');
                  }}
                />
              </span>
            )}

            {discountFilter !== 'all' && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--color-bg-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Discount: {discountFilter === 'yes' ? 'Applied' : 'Zero'}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setDiscountFilter('all')} />
              </span>
            )}

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleClearAllFilters}
              style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600, padding: '2px 8px' }}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Invoices Table Card with MyBillBook Layout & Action Menu */}
      <div
        className="card mbb-table-card"
        style={{
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '360px'
        }}
      >
        {/* Bulk selection action bar if rows selected */}
        {selectedInvoiceIds.length > 0 && (
          <div style={{
            padding: '10px 16px',
            backgroundColor: 'var(--color-bg-surface-subtle)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {selectedInvoiceIds.length} invoice(s) selected
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedInvoiceIds([])}
                style={{ fontSize: '0.75rem', padding: '2px 8px' }}
              >
                Clear Selection
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleBulkDelete}
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Trash2 size={13} /> Delete Selected
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '8px', color: 'var(--module-sell-accent)' }}>
              ⏳
            </div>
            <p style={{ fontSize: '0.875rem' }}>Loading sales invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            title="No Invoices Match Filters"
            description="There are no sales invoices matching your selected search or filter criteria. Try clearing some filters or creating a new sale."
            actionLabel="Clear Filters"
            onAction={handleClearAllFilters}
          />
        ) : (
          <>
            <div style={{ flex: 1, minHeight: 0, overflowX: 'auto' }}>
              <table className="mbb-invoices-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '42px', textAlign: 'center', paddingLeft: '14px' }}>
                      <input
                        type="checkbox"
                        className="mbb-checkbox"
                        checked={paginatedInvoices.length > 0 && paginatedInvoices.every(i => selectedInvoiceIds.includes(i.id))}
                        onChange={handleSelectAll}
                        title="Select All"
                      />
                    </th>
                    <th style={{ minWidth: '120px' }}>
                      <button type="button" className="mbb-th-sort-btn" onClick={() => toggleSort('date')}>
                        Date <ArrowUpDown size={12} />
                      </button>
                    </th>
                    <th style={{ minWidth: '140px' }}>Invoice Number</th>
                    <th style={{ minWidth: '160px' }}>Party Name</th>
                    <th style={{ minWidth: '95px' }}>Due In</th>
                    <th style={{ minWidth: '130px' }}>
                      <button type="button" className="mbb-th-sort-btn" onClick={() => toggleSort('amount')}>
                        Amount <ArrowUpDown size={12} />
                      </button>
                    </th>
                    <th style={{ minWidth: '95px' }}>Status</th>
                    <th style={{ width: '50px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((inv) => {
                    const isSelected = selectedInvoiceIds.includes(inv.id);
                    const isUnpaid = inv.payment_status !== 'paid' && inv.payment_status !== 'cancelled';
                    const formattedDate = new Date(inv.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                    const totalAmt = Number(inv.total_amount || 0);

                    return (
                      <tr key={inv.id} className={isSelected ? 'selected' : ''}>
                        {/* 1. Checkbox */}
                        <td style={{ textAlign: 'center', paddingLeft: '14px' }}>
                          <input
                            type="checkbox"
                            className="mbb-checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(inv.id)}
                          />
                        </td>

                        {/* 2. Date */}
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          {formattedDate}
                        </td>

                        {/* 3. Invoice Number */}
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Link
                              to={`/invoices/${inv.id}`}
                              style={{
                                fontWeight: 600,
                                color: '#0284c7',
                                textDecoration: 'none',
                                fontSize: '0.8125rem'
                              }}
                            >
                              {inv.invoice_number}
                            </Link>
                            {inv.project_name && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--color-bg-surface-subtle)',
                                  border: '1px solid var(--color-border)',
                                  color: 'var(--color-text-secondary)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                                title={`Project: ${inv.project_name}`}
                              >
                                <Briefcase size={9} />
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. Party Name */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                              {inv.customer_name || 'Walk-in Customer'}
                            </span>
                            {inv.customer_id && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  backgroundColor: '#dcfce7',
                                  color: '#166534',
                                  border: '1px solid #bbf7d0'
                                }}
                              >
                                Client
                              </span>
                            )}
                          </div>
                          {inv.customer_phone && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              {inv.customer_phone}
                            </div>
                          )}
                        </td>

                        {/* 5. Due In */}
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                          {getDueInLabel(inv)}
                        </td>

                        {/* 6. Amount */}
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }} className="tabular-nums">
                            ₹ {totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          {isUnpaid && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '1px' }} className="tabular-nums">
                              (₹ {totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} unpaid)
                            </div>
                          )}
                        </td>

                        {/* 7. Status */}
                        <td>
                          {renderStatusPill(inv.payment_status)}
                        </td>

                        {/* 8. Kebab Action Menu */}
                        <td style={{ textAlign: 'center', position: 'relative' }}>
                          <div className="mbb-kebab-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              type="button"
                              className={`mbb-kebab-btn ${actionMenuInvoiceId === inv.id ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuInvoiceId(prev => prev === inv.id ? null : inv.id);
                              }}
                              title="Actions"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {actionMenuInvoiceId === inv.id && (
                              <div className="mbb-kebab-dropdown">
                                <button
                                  type="button"
                                  className="mbb-kebab-item"
                                  onClick={() => handleEditInvoice(inv)}
                                >
                                  <Edit size={14} /> Edit
                                </button>
                                <button
                                  type="button"
                                  className="mbb-kebab-item"
                                  onClick={() => {
                                    setActionMenuInvoiceId(null);
                                    setEditHistoryInvoice(inv);
                                  }}
                                >
                                  <History size={14} /> Edit History
                                </button>
                                <button
                                  type="button"
                                  className="mbb-kebab-item"
                                  onClick={() => handleDuplicateInvoice(inv)}
                                >
                                  <Copy size={14} /> Duplicate
                                </button>
                                <button
                                  type="button"
                                  className="mbb-kebab-item"
                                  onClick={() => {
                                    setActionMenuInvoiceId(null);
                                    setCreditNoteInvoice(inv);
                                    setCreditNoteAmount(String(inv.total_amount || ''));
                                  }}
                                >
                                  <FileText size={14} /> Issue Credit Note
                                </button>
                                {inv.payment_status !== 'cancelled' && (
                                  <button
                                    type="button"
                                    className="mbb-kebab-item"
                                    onClick={() => handleCancelInvoice(inv)}
                                  >
                                    <XCircle size={14} /> Cancel Invoice
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="mbb-kebab-item delete"
                                  onClick={() => handleDeleteInvoice(inv)}
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalInvoicesCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              itemsPerPageOptions={[10, 15, 25, 50, 100]}
              itemLabel="invoices"
            />
          </>
        )}
      </div>

      {/* Edit History Modal */}
      {editHistoryInvoice && (
        <div className="csi-modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="csi-modal-box" style={{ maxWidth: '480px', width: '90%' }}>
            <div className="csi-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} style={{ color: 'var(--module-sell-accent)' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Invoice Activity History</h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setEditHistoryInvoice(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="csi-modal-body" style={{ padding: '16px 20px', fontSize: '0.8125rem' }}>
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--color-bg-surface-subtle)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Invoice #:</span>
                  <span style={{ fontWeight: 700 }}>{editHistoryInvoice.invoice_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Party:</span>
                  <span style={{ fontWeight: 600 }}>{editHistoryInvoice.customer_name || 'Cash Sale'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Total Amount:</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    ₹{Number(editHistoryInvoice.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', marginTop: '4px' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Invoice Created</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      {new Date(editHistoryInvoice.created_at).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      Created by {editHistoryInvoice.cashier_name || 'Staff User'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: editHistoryInvoice.payment_status === 'paid' ? '#10b981' : '#f59e0b', marginTop: '4px' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Status: {editHistoryInvoice.payment_status?.toUpperCase() || 'UNPAID'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      Payment Method: {editHistoryInvoice.payment_method?.toUpperCase() || 'CASH'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="csi-modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setEditHistoryInvoice(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Credit Note Modal */}
      {creditNoteInvoice && (
        <div className="csi-modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="csi-modal-box" style={{ maxWidth: '460px', width: '90%' }}>
            <div className="csi-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--module-sell-accent)' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Issue Credit Note</h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setCreditNoteInvoice(null)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleIssueCreditNoteSubmit}>
              <div className="csi-modal-body" style={{ padding: '16px 20px', fontSize: '0.8125rem' }}>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                  Issue a credit note against invoice <strong>{creditNoteInvoice.invoice_number}</strong> for <strong>{creditNoteInvoice.customer_name || 'Customer'}</strong>.
                </p>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                    Credit Note Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="form-input form-input-sm"
                    value={creditNoteAmount}
                    onChange={(e) => setCreditNoteAmount(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                    Reason / Notes
                  </label>
                  <textarea
                    className="form-textarea form-textarea-sm"
                    rows={2}
                    placeholder="e.g. Returned damaged item, special post-sale discount"
                    value={creditNoteReason}
                    onChange={(e) => setCreditNoteReason(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="csi-modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setCreditNoteInvoice(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sell btn-sm"
                >
                  Issue Credit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
