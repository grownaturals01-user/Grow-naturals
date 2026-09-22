import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  Shield,
  Key,
  Phone,
  Mail,
  CheckSquare,
  Square
} from 'lucide-react';
import { api } from '../services/api';
import { User as StaffUser, UserRole, UserPermissions } from '../types';

const ALL_MODULES: Array<{ key: keyof UserPermissions; label: string; description: string }> = [
  { key: 'dashboard', label: 'Dashboard & Reports', description: 'View executive sales KPIs, revenue summaries, and alerts' },
  { key: 'pos', label: 'Point of Sale (POS)', description: 'Access counter sales screen, barcode scanner, and hold bills' },
  { key: 'invoices', label: 'Sales Invoices', description: 'Browse past sales records, reprint receipts, and tax invoices' },
  { key: 'inventory', label: 'Inventory Management', description: 'Browse and edit plants, pots, fertilizers, and stock quantities' },
  { key: 'quotations', label: 'Quotations', description: 'Create estimates, manage validity dates, and convert to DC/bill' },
  { key: 'delivery_challans', label: 'Delivery Challans', description: 'Dispatch orders, assign drivers, vehicle numbers, and verify deliveries' },
  { key: 'projects', label: 'Projects & Landscaping', description: 'Monitor client projects, supervisor logs, budget, and profit margins' },
  { key: 'purchases', label: 'Purchase Orders', description: 'Place supplier orders, track delivery dues, and receive stock' },
  { key: 'expenses', label: 'Store Expenses', description: 'Record operating expenditure, utility bills, and project costs' },
  { key: 'refunds', label: 'Sales Refunds', description: 'Process customer returns and auto-restock returned goods' },
  { key: 'staff', label: 'Staff Management', description: 'Create and update team credentials and access permissions' },
  { key: 'settings', label: 'Shop Settings', description: 'Manage GSTIN, legal business names, and thermal printer bridge' }
];

export const StaffEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [permissions, setPermissions] = useState<UserPermissions>({});

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const u = await api.get<StaffUser>(`/staff/${id}`);
        setName(u.name || '');
        setUsername(u.username || '');
        setEmail(u.email || '');
        setPhone(u.phone || '');
        setRole(u.role);
        setStatus(u.status);
        setPermissions(u.permissions || {});
      } catch (err: any) {
        setError(err.message || 'Failed to load staff details');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleTogglePermission = (key: keyof UserPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAll = (select: boolean) => {
    const updated: UserPermissions = {};
    ALL_MODULES.forEach(m => {
      updated[m.key] = select;
    });
    setPermissions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSaving(true);
      setError(null);

      const payload: any = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        status,
        permissions
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      await api.put(`/staff/${id}`, payload);
      navigate('/staff');
    } catch (err: any) {
      setError(err.message || 'Failed to update staff member');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p className="text-secondary">Loading staff details...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/staff')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Edit Staff: {name}</h1>
            <p className="page-subtitle">
              Modify account credentials, role assignment, and granular module access
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 'var(--space-4)', backgroundColor: 'var(--color-danger-bg, #fef2f2)', borderColor: 'var(--color-danger)' }}>
          <p className="text-error" style={{ margin: 0, fontWeight: 500 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Account Profile Card */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="card-header">
            <h2 className="card-title">User Account & Profile</h2>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label required">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={username}
                  disabled
                  style={{ opacity: 0.7 }}
                />
                <span className="form-helper">Username cannot be changed</span>
              </div>

              <div className="form-group">
                <label className="form-label">New Password (Leave blank to keep)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label required">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label required">System Role</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  required
                >
                  <option value="admin">Administrator</option>
                  <option value="manager">Store Manager</option>
                  <option value="cashier">Cashier</option>
                  <option value="supervisor">Project Supervisor</option>
                  <option value="staff">General Staff</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Account Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={e => setStatus(e.target.value as 'active' | 'inactive')}
                >
                  <option value="active">Active (Can log in)</option>
                  <option value="inactive">Inactive (Access suspended)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Shield size={18} /> Module Access Permissions
            </h2>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => handleSelectAll(true)}
              >
                Grant All
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => handleSelectAll(false)}
              >
                Clear All
              </button>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
              {ALL_MODULES.map(m => {
                const granted = !!permissions[m.key];
                return (
                  <label
                    key={m.key}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      background: granted ? 'var(--color-primary-bg, #f0fdf4)' : 'var(--bg-secondary)',
                      border: `1px solid ${granted ? 'var(--color-primary)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={granted}
                      onChange={() => handleTogglePermission(m.key)}
                      style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: granted ? 'var(--color-primary-dark, #15803d)' : 'inherit' }}>
                        {m.label}
                      </div>
                      <div className="text-secondary" style={{ fontSize: 'var(--font-xs)', marginTop: '2px' }}>
                        {m.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/staff')}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Update Staff Member'}
          </button>
        </div>
      </form>
    </div>
  );
};
