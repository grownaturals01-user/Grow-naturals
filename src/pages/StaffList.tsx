import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Shield,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const StaffList: React.FC = () => {
  const navigate = useNavigate();

  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Status toggle confirm
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await api.get<User[]>('/staff', {
        search: search || undefined,
        role: selectedRole || undefined
      });
      setStaffList(data);
    } catch (err: any) {
      console.error('Failed to load staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [selectedRole]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStaff();
  };

  const handleToggleStatus = async () => {
    if (!targetUser) return;
    const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    try {
      setToggling(true);
      await api.put(`/staff/${targetUser.id}`, { status: newStatus });
      setTargetUser(null);
      await fetchStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    } finally {
      setToggling(false);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'manager':
        return 'primary';
      case 'cashier':
        return 'warning';
      case 'supervisor':
        return 'info';
      default:
        return 'secondary';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff & Access Control</h1>
          <p className="page-subtitle">
            Manage system users, login credentials, and granular module permissions
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Link to="/staff/new" className="btn btn-primary">
            <Plus size={16} /> Add Staff Member
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div className="input-icon-wrapper" style={{ flex: '1 1 240px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Search staff name, username, or email..."
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="form-select"
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
              <option value="supervisor">Supervisor</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            Search
          </button>
          {(search || selectedRole) && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setSearch('');
                setSelectedRole('');
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Staff Roster Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }} className="text-secondary">
            Loading staff roster...
          </div>
        ) : staffList.length === 0 ? (
          <EmptyState
            title="No Staff Found"
            description="No staff members match the selected filters. Add a new team member to get started."
            actionLabel="Add Staff Member"
            onAction={() => navigate('/staff/new')}
          />
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee / User</th>
                  <th>Role</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th>Granted Modules</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(u => {
                  const permCount = Object.values(u.permissions || {}).filter(Boolean).length;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div className="text-secondary" style={{ fontSize: 'var(--font-xs)' }}>
                          Username: <code>{u.username}</code>
                        </div>
                      </td>
                      <td>
                        <Badge variant={getRoleBadgeVariant(u.role)}>
                          {u.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        {u.phone && (
                          <div style={{ fontSize: 'var(--font-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} className="text-secondary" /> {u.phone}
                          </div>
                        )}
                        {u.email && (
                          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={12} /> {u.email}
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge variant={u.status === 'active' ? 'success' : 'neutral'}>
                          {u.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-secondary" style={{ fontSize: 'var(--font-sm)' }}>
                          {permCount >= 12 ? 'Full Access (12/12)' : `${permCount} modules granted`}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 'var(--space-1)' }}>
                          <Link
                            to={`/staff/${u.id}/edit`}
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Edit Permissions & Details"
                          >
                            <Edit2 size={15} />
                          </Link>
                          {u.role !== 'admin' && (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title={u.status === 'active' ? 'Deactivate User' : 'Reactivate User'}
                              onClick={() => setTargetUser(u)}
                            >
                              {u.status === 'active' ? <UserX size={15} className="text-error" /> : <UserCheck size={15} className="text-success" />}
                            </button>
                          )}
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

      {/* Status Toggle Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!targetUser}
        title={targetUser?.status === 'active' ? 'Deactivate User Account' : 'Reactivate User Account'}
        message={`Are you sure you want to ${targetUser?.status === 'active' ? 'deactivate' : 'reactivate'} "${targetUser?.name}"? Deactivated users cannot log into the POS or billing platform.`}
        confirmText={targetUser?.status === 'active' ? 'Deactivate' : 'Reactivate'}
        cancelText="Cancel"
        variant={targetUser?.status === 'active' ? 'danger' : 'primary'}
        loading={toggling}
        onConfirm={handleToggleStatus}
        onClose={() => setTargetUser(null)}
      />
    </div>
  );
};
