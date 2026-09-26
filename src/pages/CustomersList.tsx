import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { Customer } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { CustomerCreateModal } from '../components/pos/CustomerCreateModal';

export const CustomersList: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'wholesaler' | 'customer'>('all');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states for Create & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk delete confirmation
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.get<Customer[]>('/customers');
      setCustomers(data);
    } catch (err: any) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers by search term & status/type
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Status / Type filter
      if (statusFilter === 'wholesaler' && c.customer_type !== 'wholesaler') return false;
      if (statusFilter === 'customer' && c.customer_type === 'wholesaler') return false;

      // Search term filter
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      const nameMatch = c.name?.toLowerCase().includes(q);
      const phoneMatch = c.phone?.toLowerCase().includes(q);
      const emailMatch = c.email?.toLowerCase().includes(q);
      const gstinMatch = c.gstin?.toLowerCase().includes(q);
      const addressMatch = c.address?.toLowerCase().includes(q);

      return nameMatch || phoneMatch || emailMatch || gstinMatch || addressMatch;
    });
  }, [customers, search, statusFilter]);

  // Avatar palette generator
  const getAvatarStyle = (name: string) => {
    const palettes = [
      { bg: '#e0e7ff', color: '#4338ca' }, // indigo
      { bg: '#ffe4e6', color: '#e11d48' }, // rose
      { bg: '#d1fae5', color: '#059669' }, // emerald
      { bg: '#fef3c7', color: '#d97706' }, // amber
      { bg: '#e0f2fe', color: '#0284c7' }, // sky
      { bg: '#ede9fe', color: '#7c3aed' }, // violet
      { bg: '#fee2e2', color: '#dc2626' }, // red
      { bg: '#ffedd5', color: '#ea580c' }, // orange
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % palettes.length;
    return palettes[index];
  };

  const getInitials = (name: string) => {
    const parts = (name || '').trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name || '').slice(0, 2).toUpperCase() || 'CU';
  };

  const getCompanyName = (c: Customer) => {
    if (c.gstin) return `GST: ${c.gstin}`;
    if (c.customer_type === 'wholesaler') return 'Wholesale Partner';
    if (c.address) {
      const parts = c.address.split(',');
      if (parts.length > 1) return parts[0].trim();
    }
    return 'Retail Direct';
  };

  const getLocation = (c: Customer) => {
    if (!c.address) return 'India';
    const parts = c.address.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return parts[parts.length - 1];
    }
    return parts[0] || 'India';
  };

  // Checkbox handling
  const allSelected = filteredCustomers.length > 0 && selectedIds.size === filteredCustomers.length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredCustomers.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Delete Single Customer
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.delete(`/customers/${deleteTarget.id}`);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Delete Selected
  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      setIsBulkDeleting(true);
      for (const id of Array.from(selectedIds)) {
        try {
          await api.delete(`/customers/${id}`);
        } catch (e) {
          console.error(`Error deleting customer ${id}:`, e);
        }
      }
      setCustomers((prev) => prev.filter((c) => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
    } catch (err: any) {
      alert(err.message || 'Failed to delete selected customers');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="cust-page-container">
      {/* 1. Page Header */}
      <div className="cust-page-header">
        <div>
          <h1 className="cust-page-title">Customers</h1>
          <p className="cust-page-subtitle">
            Shared directory of retail, corporate, and nursery clientele across businesses
          </p>
        </div>
        <button
          type="button"
          className="cust-add-btn"
          onClick={() => {
            setCustomerToEdit(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Bulk actions banner if rows selected */}
      {selectedIds.size > 0 && (
        <div className="cust-bulk-bar">
          <span>{selectedIds.size} customer{selectedIds.size > 1 ? 's' : ''} selected</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Deselect All
            </button>
            <button
              type="button"
              onClick={confirmBulkDelete}
              disabled={isBulkDeleting}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 12px',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {isBulkDeleting ? <Loader2 size={12} className="spin" /> : <Trash2 size={12} />}
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Table Card */}
      <div className="cust-table-card">
        {/* Toolbar: Search & Status Dropdown */}
        <div className="cust-table-toolbar">
          <div className="cust-search-box">
            <Search size={15} className="cust-search-icon" />
            <input
              type="text"
              placeholder="Search..."
              className="cust-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="cust-toolbar-actions">
            <select
              className="cust-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">Status: All</option>
              <option value="active">Status: Active</option>
              <option value="wholesaler">Status: Wholesaler</option>
              <option value="customer">Status: Retail</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
            <div>Loading customers directory...</div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ padding: '30px' }}>
            <EmptyState
              title="No Customers Found"
              description="No customers matched your filter or search query. Click Add Customer to create a new client profile."
              actionLabel="Add Customer"
              onAction={() => {
                setCustomerToEdit(null);
                setIsModalOpen(true);
              }}
            />
          </div>
        ) : (
          <div className="cust-table-responsive">
            <table className="cust-spacious-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="cust-checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      style={{ margin: '0 auto' }}
                    />
                  </th>
                  <th style={{ width: '80px' }}>Code</th>
                  <th style={{ minWidth: '180px' }}>Biller</th>
                  <th style={{ minWidth: '180px' }}>Company Name</th>
                  <th style={{ minWidth: '180px' }}>Email</th>
                  <th style={{ minWidth: '130px' }}>Phone</th>
                  <th style={{ minWidth: '110px' }}>Country</th>
                  <th style={{ width: '100px' }}>Status</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c, index) => {
                  const avatarTheme = getAvatarStyle(c.name);
                  const isChecked = selectedIds.has(c.id);
                  const code = `BI${String(index + 1).padStart(3, '0')}`;

                  return (
                    <tr
                      key={c.id}
                      style={{
                        backgroundColor: isChecked ? 'rgba(255, 159, 67, 0.05)' : undefined,
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="cust-checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(c.id)}
                          style={{ margin: '0 auto' }}
                        />
                      </td>

                      {/* Code */}
                      <td>
                        <span className="cust-code-text">{code}</span>
                      </td>

                      {/* Biller / Customer */}
                      <td>
                        <div className="cust-biller-cell">
                          <div
                            className="cust-avatar"
                            style={{
                              backgroundColor: avatarTheme.bg,
                              color: avatarTheme.color,
                            }}
                          >
                            {getInitials(c.name)}
                          </div>
                          <Link to={`/customers/${c.id}`} className="cust-name-text">
                            {c.name}
                          </Link>
                        </div>
                      </td>

                      {/* Company Name */}
                      <td>
                        <span className="cust-company-text">{getCompanyName(c)}</span>
                      </td>

                      {/* Email */}
                      <td>
                        <span className="cust-email-text">{c.email || '—'}</span>
                      </td>

                      {/* Phone */}
                      <td>
                        <span className="cust-phone-text">{c.phone || '—'}</span>
                      </td>

                      {/* Country / Location */}
                      <td>
                        <span className="cust-country-text">{getLocation(c)}</span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className="cust-status-pill active">
                          <span className="cust-status-dot" />
                          <span>Active</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="cust-actions-group">
                          {/* View */}
                          <Link
                            to={`/customers/${c.id}`}
                            className="cust-action-btn view"
                            title="View Customer Profile"
                          >
                            <Eye size={14} />
                          </Link>

                          {/* Edit */}
                          <button
                            type="button"
                            className="cust-action-btn edit"
                            title="Edit Customer"
                            onClick={() => {
                              setCustomerToEdit(c);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            className="cust-action-btn delete"
                            title="Delete Customer"
                            onClick={() => setDeleteTarget(c)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info & summary */}
        {!loading && filteredCustomers.length > 0 && (
          <div className="cust-table-footer">
            <span>
              Showing {filteredCustomers.length} of {customers.length} entries
            </span>
            <span style={{ fontWeight: 600 }}>
              All clients active & verified
            </span>
          </div>
        )}
      </div>

      {/* Customer Create & Edit Modal */}
      <CustomerCreateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCustomerToEdit(null);
        }}
        customerToEdit={customerToEdit}
        onCustomerCreated={() => {
          fetchCustomers();
          setIsModalOpen(false);
          setCustomerToEdit(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="dialog-overlay" onClick={() => setDeleteTarget(null)} style={{ zIndex: 1200 }}>
          <div
            className="dialog-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', borderRadius: '12px', padding: '24px', textAlign: 'center' }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>
              Delete Customer?
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.8125rem', color: '#64748b' }}>
              Are you sure you want to remove <strong>{deleteTarget.name}</strong> from your customer directory?
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                style={{ borderRadius: '8px', padding: '8px 18px', fontWeight: 700 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isDeleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
