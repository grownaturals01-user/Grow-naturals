import React, { useEffect, useState } from 'react';
import {
  Settings,
  Building,
  Building2,
  Save,
  Printer,
  Database,
  CheckCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Cpu,
  Plus,
  Trash2,
  AlertTriangle,
  Leaf,
  Sprout,
  Store,
  X,
  Receipt,
  Phone,
  Mail,
  MapPin,
  SlidersHorizontal,
  FileText,
  Percent,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { printService } from '../services/printService';
import { useBusiness } from '../context/BusinessContext';
import { Business } from '../types';
import { Badge } from '../components/common/Badge';

export const ShopSettings: React.FC = () => {
  const {
    businesses,
    reloadBusinesses,
    createBusiness,
    deleteBusiness,
    switchBusiness,
    businessId
  } = useBusiness();

  // Selected tab: either a business ID or 'hardware'
  const [activeTab, setActiveTab] = useState<string>(() => {
    return businesses[0]?.id || 'grow-naturals';
  });

  // Current business form state
  const [editForm, setEditForm] = useState<Partial<Business>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Add Business Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newBiz, setNewBiz] = useState<Partial<Business>>({
    name: '',
    legal_name: '',
    is_taxable: true,
    gstin: '',
    invoice_prefix: '',
    phone: '',
    email: '',
    address: '',
    invoice_footer: '',
    default_low_stock: 5
  });

  // Delete Business Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Hardware bridge status
  const [bridgeStatus, setBridgeStatus] = useState<'testing' | 'online' | 'offline'>('offline');
  const [testingBridge, setTestingBridge] = useState(false);

  // Synchronize activeTab and editForm with businesses
  useEffect(() => {
    if (activeTab === 'hardware') return;

    let target = businesses.find(b => b.id === activeTab);
    if (!target && businesses.length > 0) {
      target = businesses[0];
      setActiveTab(target.id);
    }

    if (target) {
      setEditForm({ ...target });
    }
  }, [businesses, activeTab]);

  const testThermalBridge = async () => {
    setTestingBridge(true);
    const isUp = await printService.checkBridgeStatus();
    setBridgeStatus(isUp ? 'online' : 'offline');
    setTestingBridge(false);
  };

  useEffect(() => {
    testThermalBridge();
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSaveSuccess(null);
    setSaveError(null);
    const b = businesses.find(x => x.id === tabId);
    if (b) {
      setEditForm({ ...b });
    }
  };

  const handleSaveCurrentBusiness = async () => {
    if (!editForm.id) return;
    if (!editForm.name || !editForm.name.trim()) {
      setSaveError('Business display name is required.');
      return;
    }

    try {
      setSaving(true);
      setSaveSuccess(null);
      setSaveError(null);

      await api.put(`/businesses/${editForm.id}`, editForm);
      await reloadBusinesses();
      setSaveSuccess(`Successfully updated settings for "${editForm.name}"!`);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update business configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddModal = () => {
    setNewBiz({
      name: '',
      legal_name: '',
      is_taxable: true,
      gstin: '',
      invoice_prefix: '',
      phone: '',
      email: '',
      address: '',
      invoice_footer: '',
      default_low_stock: 5
    });
    setAddError(null);
    setShowAddModal(true);
  };

  const handleNameChange = (nameVal: string) => {
    const letters = nameVal.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
    setNewBiz(prev => ({
      ...prev,
      name: nameVal,
      legal_name: prev.legal_name && prev.legal_name !== prev.name ? prev.legal_name : nameVal,
      invoice_prefix: prev.invoice_prefix || (letters ? `${letters}-` : '')
    }));
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBiz.name || !newBiz.name.trim()) {
      setAddError('Business name is required.');
      return;
    }

    try {
      setAdding(true);
      setAddError(null);
      const created = await createBusiness({
        ...newBiz,
        name: newBiz.name.trim(),
        legal_name: newBiz.legal_name?.trim() || newBiz.name.trim(),
        invoice_prefix: (newBiz.invoice_prefix || `${newBiz.name.slice(0, 3).toUpperCase()}-`).trim().toUpperCase()
      });

      setShowAddModal(false);
      setActiveTab(created.id);
      setSaveSuccess(`Business "${created.name}" created successfully and set as active!`);
    } catch (err: any) {
      setAddError(err.message || 'Failed to create new business');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCurrentBusiness = async () => {
    if (!editForm.id) return;
    try {
      setDeleting(true);
      setDeleteError(null);

      await deleteBusiness(editForm.id);
      setShowDeleteModal(false);

      const remaining = businesses.filter(b => b.id !== editForm.id);
      if (remaining.length > 0) {
        setActiveTab(remaining[0].id);
      }
      setSaveSuccess(`Business "${editForm.name}" has been deleted.`);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete business');
    } finally {
      setDeleting(false);
    }
  };

  const getBusinessIcon = (id?: string) => {
    if (id === 'grow-naturals') return <Leaf size={16} />;
    if (id === 'nikhlesh-nursery') return <Sprout size={16} />;
    return <Store size={16} />;
  };

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', margin: 0, letterSpacing: '-0.02em' }}>
                Shop & Enterprise Settings
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #64748b)', margin: '2px 0 0 0' }}>
                Manage legal entities, tax preferences, invoice prefixes, and thermal hardware bridges
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-sell"
          onClick={handleOpenAddModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            fontSize: '0.875rem',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)'
          }}
        >
          <Plus size={16} /> Add New Business
        </button>
      </div>

      {/* Modern Alert Notifications */}
      {saveSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            marginBottom: '20px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            color: '#166534',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} color="#16a34a" />
            <span>{saveSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', padding: '2px' }}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {saveError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            marginBottom: '20px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            color: '#991b1b',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <XCircle size={18} color="#dc2626" />
            <span>{saveError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', padding: '2px' }}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Modern Segmented Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '24px',
          backgroundColor: '#f1f5f9',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
          {businesses.map((b) => {
            const isActive = activeTab === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleTabChange(b.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#0f172a' : '#64748b',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 600,
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 6px rgba(0, 0, 0, 0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ color: isActive ? '#16a34a' : 'inherit' }}>
                  {getBusinessIcon(b.id)}
                </span>
                <span>{b.name}</span>
                {b.is_taxable ? (
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', backgroundColor: isActive ? '#dcfce7' : '#e2e8f0', color: isActive ? '#15803d' : '#64748b' }}>
                    GST
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', backgroundColor: isActive ? '#fef3c7' : '#e2e8f0', color: isActive ? '#b45309' : '#64748b' }}>
                    0% Tax
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleTabChange('hardware')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'hardware' ? '#ffffff' : 'transparent',
            color: activeTab === 'hardware' ? '#0f172a' : '#64748b',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'hardware' ? 700 : 600,
            cursor: 'pointer',
            boxShadow: activeTab === 'hardware' ? '0 2px 6px rgba(0, 0, 0, 0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Printer size={15} /> Hardware & Bridge
        </button>
      </div>

      {/* Dynamic Business Form */}
      {activeTab !== 'hardware' && editForm.id && (
        <div
          className="card"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }}
        >
          {/* Card Top Title Banner */}
          <div
            style={{
              padding: '24px 28px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              backgroundColor: '#fafbfc'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: editForm.id === 'grow-naturals' ? '#dcfce7' : editForm.id === 'nikhlesh-nursery' ? '#fef3c7' : '#e0e7ff',
                  color: editForm.id === 'grow-naturals' ? '#16a34a' : editForm.id === 'nikhlesh-nursery' ? '#d97706' : '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {getBusinessIcon(editForm.id)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {editForm.name}
                  </h2>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      backgroundColor: editForm.is_taxable ? '#dcfce7' : '#fef3c7',
                      color: editForm.is_taxable ? '#15803d' : '#b45309',
                      border: `1px solid ${editForm.is_taxable ? '#bbf7d0' : '#fde68a'}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em'
                    }}
                  >
                    {editForm.is_taxable ? 'GST Registered (Taxable)' : '0.00% Tax (Non-Taxable)'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '3px 0 0 0' }}>
                  Invoice Series: <strong style={{ color: '#0f172a' }}>{editForm.invoice_prefix || 'None'}</strong> &bull; System ID: <code>{editForm.id}</code>
                </p>
              </div>
            </div>

            {businesses.length > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setDeleteError(null);
                  setShowDeleteModal(true);
                }}
                style={{
                  color: '#dc2626',
                  borderColor: '#fca5a5',
                  backgroundColor: '#ffffff',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px'
                }}
                title="Delete this business entity"
              >
                <Trash2 size={14} /> Delete Business
              </button>
            )}
          </div>

          <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Section 1: General Business Identity */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <Building2 size={16} color="#16a34a" />
                <h3 style={{ fontSize: '0.925rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  General Business Identity
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label required">Display Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.name || ''}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="e.g. Grow Naturals"
                  />
                  <span className="form-helper">Shows on navigation header and POS buttons</span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label required">Legal Entity Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.legal_name || ''}
                    onChange={e => setEditForm({ ...editForm, legal_name: e.target.value })}
                    placeholder="e.g. Grow Naturals Private Limited"
                  />
                  <span className="form-helper">Printed on formal invoices, bills, and tax receipts</span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label required">Invoice Series Prefix</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.invoice_prefix || ''}
                    onChange={e => setEditForm({ ...editForm, invoice_prefix: e.target.value.toUpperCase() })}
                    placeholder="e.g. GN-, NN-"
                  />
                  <span className="form-helper">
                    Generates <strong>{editForm.invoice_prefix || 'INV-'}1001</strong>, <strong>{editForm.invoice_prefix || 'INV-'}1002</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Tax & Legal Structure */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <Receipt size={16} color="#16a34a" />
                <h3 style={{ fontSize: '0.925rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Tax & GST Configuration
                </h3>
              </div>

              {/* Interactive 2-Card Tax Mode Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                <div
                  onClick={() => setEditForm({ ...editForm, is_taxable: true })}
                  style={{
                    padding: '16px 18px',
                    borderRadius: '12px',
                    border: editForm.is_taxable ? '2px solid #16a34a' : '1.5px solid #e2e8f0',
                    backgroundColor: editForm.is_taxable ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: editForm.is_taxable ? '#16a34a' : '#f1f5f9', color: editForm.is_taxable ? '#ffffff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Percent size={14} />
                      </div>
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>Taxable Business (GST)</strong>
                    </div>
                    {editForm.is_taxable && <Check size={18} color="#16a34a" />}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                    Calculates and splits CGST + SGST on POS sales and prints line-item tax details on Tax Invoices.
                  </p>
                </div>

                <div
                  onClick={() => setEditForm({ ...editForm, is_taxable: false })}
                  style={{
                    padding: '16px 18px',
                    borderRadius: '12px',
                    border: !editForm.is_taxable ? '2px solid #d97706' : '1.5px solid #e2e8f0',
                    backgroundColor: !editForm.is_taxable ? '#fffbeb' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: !editForm.is_taxable ? '#d97706' : '#f1f5f9', color: !editForm.is_taxable ? '#ffffff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sprout size={14} />
                      </div>
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>Non-Taxable / Exempt</strong>
                    </div>
                    {!editForm.is_taxable && <Check size={18} color="#d97706" />}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                    Ideal for nursery saplings and agricultural sales. Bills and receipts display without tax lines.
                  </p>
                </div>
              </div>

              {/* GSTIN Input */}
              {editForm.is_taxable && (
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div className="form-group" style={{ margin: 0, maxWidth: '400px' }}>
                    <label className="form-label required">GSTIN Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.gstin || ''}
                      onChange={e => setEditForm({ ...editForm, gstin: e.target.value.toUpperCase() })}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                    />
                    <span className="form-helper">Printed in official header on all Tax Invoices & Challans</span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Store & Contact Information */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <Phone size={16} color="#16a34a" />
                <h3 style={{ fontSize: '0.925rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Store & Contact Information
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.phone || ''}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+91 98220 12345"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Official Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editForm.email || ''}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="billing@grownaturals.in"
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Store / Billing Address</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={editForm.address || ''}
                  onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="No. 19/7, Annasalai, K K Nagar, Madurai-625020, Tamil Nadu"
                />
              </div>
            </div>

            {/* Section 4: Operational Settings & Bill Footer */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <SlidersHorizontal size={16} color="#16a34a" />
                <h3 style={{ fontSize: '0.925rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Operational Defaults & Bill Footer
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={editForm.default_low_stock || 5}
                    onChange={e => setEditForm({ ...editForm, default_low_stock: Number(e.target.value) })}
                  />
                  <span className="form-helper">Items below this trigger re-order warnings</span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Invoice & Receipt Footer Note</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={editForm.invoice_footer || ''}
                    onChange={e => setEditForm({ ...editForm, invoice_footer: e.target.value })}
                    placeholder="Thank you for shopping with us! Live green, grow happy."
                  />
                  <span className="form-helper">Printed at the very bottom of all customer bills</span>
                </div>
              </div>
            </div>

            {/* Save Action Footer Bar */}
            <div
              style={{
                marginTop: '12px',
                paddingTop: '20px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                All updates take effect immediately on POS checkout and printed receipts.
              </div>

              <button
                type="button"
                className="btn btn-sell"
                disabled={saving}
                onClick={handleSaveCurrentBusiness}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(217, 119, 6, 0.2)'
                }}
              >
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving Changes...' : `Save ${editForm.name || 'Business'} Settings`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hardware & Printer Bridge */}
      {activeTab === 'hardware' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', margin: 0 }}>
                <Cpu size={20} color="#16a34a" /> ESC/POS Thermal Receipt Bridge (Port 3333)
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {bridgeStatus === 'online' ? (
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', backgroundColor: '#dcfce7', color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle size={13} /> BRIDGE ONLINE
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', backgroundColor: '#fee2e2', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <XCircle size={13} /> BRIDGE OFFLINE
                  </span>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={testThermalBridge}
                  disabled={testingBridge}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={14} className={testingBridge ? 'animate-spin' : ''} />
                  Test Connection
                </button>
              </div>
            </div>
            <div className="card-body" style={{ padding: '24px' }}>
              <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '16px', lineHeight: 1.5 }}>
                The local ESC/POS print bridge runs on <code>http://localhost:3333</code> and sends ESC/POS command buffers directly to USB/Network 80mm thermal receipt printers without prompting browser print dialogues.
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '16px',
                  borderRadius: '10px',
                  fontSize: '0.8125rem',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  color: '#334155'
                }}
              >
                <div><strong>Bridge Service:</strong> server/escpos-server.cjs</div>
                <div><strong>Start Command:</strong> node server/escpos-server.cjs</div>
                <div><strong>Status:</strong> {bridgeStatus.toUpperCase()}</div>
                <div><strong>Fallback Behavior:</strong> When bridge is offline, system seamlessly opens native Browser Print</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', margin: 0 }}>
                <Database size={20} color="#16a34a" /> Database & Storage Engine
              </h2>
            </div>
            <div className="card-body" style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Primary Relational Database</div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '4px' }}>
                    Embedded PostgreSQL (PGlite) persisting to <code>./data/postgres</code>
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Offline POS Buffer</div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '4px' }}>
                    Browser IndexedDB (Dexie) with automatic background synchronization
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Business Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '20px',
              backgroundColor: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0'
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fafbfc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Store size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Register New Business Entity
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    Add another legal brand or shop division to your billing system
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowAddModal(false)}
                style={{ padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBusiness}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {addError && (
                  <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', fontSize: '0.875rem' }}>
                    {addError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label required">Business Display Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newBiz.name || ''}
                      onChange={e => handleNameChange(e.target.value)}
                      placeholder="e.g. Flora Boutique"
                      required
                    />
                    <span className="form-helper">Short brand title for buttons</span>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label required">Invoice Series Prefix</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newBiz.invoice_prefix || ''}
                      onChange={e => setNewBiz({ ...newBiz, invoice_prefix: e.target.value.toUpperCase() })}
                      placeholder="e.g. FB-"
                      required
                    />
                    <span className="form-helper">Generates {newBiz.invoice_prefix || 'FB-'}1001</span>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Legal Entity Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newBiz.legal_name || ''}
                    onChange={e => setNewBiz({ ...newBiz, legal_name: e.target.value })}
                    placeholder="e.g. Flora Boutique Private Limited"
                  />
                  <span className="form-helper">Official registered corporate name</span>
                </div>

                {/* Tax Option Radio Cards */}
                <div>
                  <label className="form-label required" style={{ marginBottom: '8px' }}>Tax Structure</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div
                      onClick={() => setNewBiz({ ...newBiz, is_taxable: true })}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: newBiz.is_taxable ? '2px solid #16a34a' : '1px solid #e2e8f0',
                        backgroundColor: newBiz.is_taxable ? '#f0fdf4' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>Taxable Entity (GST)</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>CGST & SGST calculated on bills</span>
                    </div>

                    <div
                      onClick={() => setNewBiz({ ...newBiz, is_taxable: false })}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: !newBiz.is_taxable ? '2px solid #d97706' : '1px solid #e2e8f0',
                        backgroundColor: !newBiz.is_taxable ? '#fffbeb' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>Non-Taxable / Exempt</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>0% GST / Farm fresh saplings</span>
                    </div>
                  </div>
                </div>

                {newBiz.is_taxable && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label required">GSTIN Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newBiz.gstin || ''}
                      onChange={e => setNewBiz({ ...newBiz, gstin: e.target.value.toUpperCase() })}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      required={newBiz.is_taxable}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newBiz.phone || ''}
                      onChange={e => setNewBiz({ ...newBiz, phone: e.target.value })}
                      placeholder="+91 98220 00000"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Official Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={newBiz.email || ''}
                      onChange={e => setNewBiz({ ...newBiz, email: e.target.value })}
                      placeholder="contact@floraboutique.in"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Store / Billing Address</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={newBiz.address || ''}
                    onChange={e => setNewBiz({ ...newBiz, address: e.target.value })}
                    placeholder="Enter store location or nursery address"
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  padding: '16px 24px',
                  borderTop: '1px solid #f1f5f9',
                  backgroundColor: '#fafbfc'
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={adding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sell"
                  disabled={adding}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                >
                  {adding ? <RefreshCw size={15} className="animate-spin" /> : <Plus size={15} />}
                  {adding ? 'Registering...' : 'Register Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              borderRadius: '20px',
              backgroundColor: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                  Delete Business Entity
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  Are you sure you want to delete <strong>"{editForm.name}"</strong>?
                </p>
                <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b' }}>
                  Safety Check: If this business has any historical sales invoices, deletion will be blocked to protect financial records.
                </div>
              </div>
            </div>

            {deleteError && (
              <div style={{ margin: '0 24px 16px 24px', padding: '12px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', fontSize: '0.85rem' }}>
                {deleteError}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                padding: '16px 24px',
                borderTop: '1px solid #f1f5f9',
                backgroundColor: '#fafbfc'
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCurrentBusiness}
                disabled={deleting}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 18px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={15} />
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
