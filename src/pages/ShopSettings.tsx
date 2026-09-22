import React, { useEffect, useState } from 'react';
import {
  Settings,
  Building,
  Save,
  Printer,
  Database,
  CheckCircle,
  XCircle,
  RefreshCw,
  Cpu,
  Layers,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { printService } from '../services/printService';
import { useBusiness } from '../context/BusinessContext';
import { Business } from '../types';
import { Badge } from '../components/common/Badge';

export const ShopSettings: React.FC = () => {
  const { businesses, reloadBusinesses } = useBusiness();

  const [activeTab, setActiveTab] = useState<'grow-naturals' | 'nikhlesh-nursery' | 'hardware'>('grow-naturals');

  // Business editing forms
  const [gnForm, setGnForm] = useState<Partial<Business>>({});
  const [nnForm, setNnForm] = useState<Partial<Business>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Hardware bridge status
  const [bridgeStatus, setBridgeStatus] = useState<'testing' | 'online' | 'offline'>('offline');
  const [testingBridge, setTestingBridge] = useState(false);

  useEffect(() => {
    const gn = businesses.find(b => b.id === 'grow-naturals');
    const nn = businesses.find(b => b.id === 'nikhlesh-nursery');
    if (gn) setGnForm({ ...gn });
    if (nn) setNnForm({ ...nn });
  }, [businesses]);

  const testThermalBridge = async () => {
    setTestingBridge(true);
    const isUp = await printService.checkBridgeStatus();
    setBridgeStatus(isUp ? 'online' : 'offline');
    setTestingBridge(false);
  };

  useEffect(() => {
    testThermalBridge();
  }, []);

  const handleSaveBusiness = async (bizId: 'grow-naturals' | 'nikhlesh-nursery') => {
    const formData = bizId === 'grow-naturals' ? gnForm : nnForm;
    try {
      setSaving(true);
      setSaveSuccess(null);
      setSaveError(null);

      await api.put(`/businesses/${bizId}`, formData);
      await reloadBusinesses();
      setSaveSuccess(`Successfully updated ${bizId === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery'} settings!`);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update business configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title">Shop & Enterprise Settings</h1>
          <p className="page-subtitle">
            Configure dual-business legal entities, tax preferences, invoice numbering, and hardware bridges
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="card" style={{ marginBottom: 'var(--space-4)', backgroundColor: 'var(--color-success-bg, #f0fdf4)', borderColor: 'var(--color-success)' }}>
          <p style={{ margin: 0, color: 'var(--color-success-dark, #166534)', fontWeight: 500 }}>
            {saveSuccess}
          </p>
        </div>
      )}

      {saveError && (
        <div className="card" style={{ marginBottom: 'var(--space-4)', backgroundColor: 'var(--color-danger-bg, #fef2f2)', borderColor: 'var(--color-danger)' }}>
          <p className="text-error" style={{ margin: 0, fontWeight: 500 }}>{saveError}</p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)' }}>
        <button
          className={`btn ${activeTab === 'grow-naturals' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('grow-naturals')}
        >
          <Building size={16} /> Grow Naturals (Taxable)
        </button>
        <button
          className={`btn ${activeTab === 'nikhlesh-nursery' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('nikhlesh-nursery')}
        >
          <Building size={16} /> Nikhlesh Nursery (Non-Taxable)
        </button>
        <button
          className={`btn ${activeTab === 'hardware' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('hardware')}
        >
          <Printer size={16} /> Hardware & Printer Bridge
        </button>
      </div>

      {/* Grow Naturals Form */}
      {activeTab === 'grow-naturals' && (
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="card-title">Grow Naturals — Taxable Entity (GST)</h2>
                <p className="card-subtitle">Applied to plants, luxury pots, and commercial landscaping services</p>
              </div>
              <Badge variant="info">GST APPLICABLE</Badge>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label required">Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={gnForm.name || ''}
                  onChange={e => setGnForm({ ...gnForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Legal Entity Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={gnForm.legal_name || ''}
                  onChange={e => setGnForm({ ...gnForm, legal_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label required">GSTIN Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={gnForm.gstin || ''}
                  onChange={e => setGnForm({ ...gnForm, gstin: e.target.value })}
                />
                <span className="form-helper">Printed on all Tax Invoices & Challans</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={gnForm.phone || ''}
                  onChange={e => setGnForm({ ...gnForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={gnForm.email || ''}
                  onChange={e => setGnForm({ ...gnForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Invoice Prefix</label>
                <input
                  type="text"
                  className="form-input"
                  value={gnForm.invoice_prefix || ''}
                  onChange={e => setGnForm({ ...gnForm, invoice_prefix: e.target.value })}
                />
                <span className="form-helper">e.g. "GN-" yields GN-1001, GN-1002</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Store / Billing Address</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={gnForm.address || ''}
                onChange={e => setGnForm({ ...gnForm, address: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Invoice Footer / Legal Terms</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={gnForm.invoice_footer || ''}
                onChange={e => setGnForm({ ...gnForm, invoice_footer: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button
                className="btn btn-primary"
                disabled={saving}
                onClick={() => handleSaveBusiness('grow-naturals')}
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Grow Naturals Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nikhlesh Nursery Form */}
      {activeTab === 'nikhlesh-nursery' && (
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="card-title">Nikhlesh Nursery — Non-Taxable Business</h2>
                <p className="card-subtitle">Agricultural and sapling sales; bills show ₹0.00 tax rows for layout uniformity</p>
              </div>
              <Badge variant="secondary">0.00% TAX (NON-TAXABLE)</Badge>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label required">Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={nnForm.name || ''}
                  onChange={e => setNnForm({ ...nnForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Legal Entity Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={nnForm.legal_name || ''}
                  onChange={e => setNnForm({ ...nnForm, legal_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Invoice Prefix</label>
                <input
                  type="text"
                  className="form-input"
                  value={nnForm.invoice_prefix || ''}
                  onChange={e => setNnForm({ ...nnForm, invoice_prefix: e.target.value })}
                />
                <span className="form-helper">e.g. "NN-" yields NN-1001, NN-1002</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={nnForm.phone || ''}
                  onChange={e => setNnForm({ ...nnForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={nnForm.email || ''}
                  onChange={e => setNnForm({ ...nnForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default Low Stock Threshold</label>
                <input
                  type="number"
                  className="form-input"
                  value={nnForm.default_low_stock || 10}
                  onChange={e => setNnForm({ ...nnForm, default_low_stock: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Farm / Nursery Address</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={nnForm.address || ''}
                onChange={e => setNnForm({ ...nnForm, address: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Invoice Footer / Notes</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={nnForm.invoice_footer || ''}
                onChange={e => setNnForm({ ...nnForm, invoice_footer: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button
                className="btn btn-primary"
                disabled={saving}
                onClick={() => handleSaveBusiness('nikhlesh-nursery')}
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Nikhlesh Nursery Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hardware & Printer Bridge */}
      {activeTab === 'hardware' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Cpu size={18} /> ESC/POS Thermal Receipt Bridge (Port 3333)
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {bridgeStatus === 'online' ? (
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={13} /> BRIDGE ONLINE
                    </span>
                  ) : (
                    <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <XCircle size={13} /> BRIDGE OFFLINE
                    </span>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={testThermalBridge}
                    disabled={testingBridge}
                  >
                    <RefreshCw size={14} className={testingBridge ? 'animate-spin' : ''} />
                    Test Connection
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              <p className="text-secondary" style={{ marginBottom: 'var(--space-3)' }}>
                The local ESC/POS print bridge runs on <code>http://localhost:3333</code> and sends ESC/POS command buffers directly to USB/Network 80mm thermal receipt printers without prompting browser print dialogues.
              </p>

              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-xs)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <div><strong>Bridge Service:</strong> server/escpos-server.cjs</div>
                <div><strong>Start Command:</strong> node server/escpos-server.cjs</div>
                <div><strong>Status:</strong> {bridgeStatus.toUpperCase()}</div>
                <div><strong>Fallback Behavior:</strong> When bridge is offline, system seamlessly opens native Browser Print</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Database size={18} /> Database & Storage Engine
              </h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Primary Relational Database</div>
                  <div className="text-secondary" style={{ fontSize: 'var(--font-sm)', marginTop: '2px' }}>
                    Embedded PostgreSQL (PGlite) persisting to <code>./data/postgres</code>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 600 }}>Offline POS Buffer</div>
                  <div className="text-secondary" style={{ fontSize: 'var(--font-sm)', marginTop: '2px' }}>
                    Browser IndexedDB (Dexie) with automatic background synchronization
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
