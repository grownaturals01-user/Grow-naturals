import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle,
  Clock,
  Send,
  ArrowLeft,
  Building,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const SupervisorPortal: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Update form
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [statusChange, setStatusChange] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supervisorId = user?.id || 'usr-supervisor';

  const fetchData = () => {
    setIsLoading(true);
    api
      .get(`/supervisors/portal/${supervisorId}`)
      .then((res) => {
        setData(res);
        if (res.projects?.length > 0 && !selectedProjectId) {
          setSelectedProjectId(res.projects[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [supervisorId]);

  const handleSubmitProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !notes.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post(`/projects/${selectedProjectId}/updates`, {
        supervisor_id: supervisorId,
        notes: notes.trim(),
        status_change: statusChange || undefined,
      });

      setNotes('');
      setStatusChange('');
      setSuccessMsg('Milestone note recorded successfully!');
      fetchData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '12px 0' }}>
      {/* Mobile Portal Header */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: '8px' }}
        >
          <ArrowLeft size={16} /> Exit to Main ERP
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>Field Supervisor Portal</h1>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
              Logged in as: <strong>{data?.supervisor?.name || user?.name || 'Rajesh Kulkarni'}</strong>
            </p>
          </div>
          <Badge variant="proj">Field Mode</Badge>
        </div>
      </div>

      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px', backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success-text)', borderRadius: 'var(--radius-lg)', marginBottom: '16px' }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Quick Post Site Progress Update Form */}
      <div className="card" style={{ marginBottom: '24px', border: '2px solid var(--module-proj-accent)' }}>
        <div className="card-header" style={{ backgroundColor: 'var(--module-proj-subtle)' }}>
          <h3 className="card-title" style={{ color: 'var(--module-proj-text)' }}>
            <Send size={18} /> Log Site Progress / Milestone
          </h3>
        </div>
        <form onSubmit={handleSubmitProgress} className="card-body">
          <div className="form-group">
            <label className="form-label">Select Active Project</label>
            <select
              className="form-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              required
            >
              {(data?.projects || []).map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.client_name}) — {p.business_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Milestone Notes / Progress Description</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '80px' }}
              placeholder="e.g. Delivered 20 ficus planters, soil bedding 80% complete, drip irrigation pipes connected."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Update Project Status</label>
              <select
                className="form-select"
                value={statusChange}
                onChange={(e) => setStatusChange(e.target.value)}
              >
                <option value="">Keep current status</option>
                <option value="active">Active Installation</option>
                <option value="completed">Work Completed</option>
                <option value="on_hold">Site On Hold</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-proj"
                style={{ width: '100%', padding: '12px' }}
                disabled={isSubmitting || !selectedProjectId}
              >
                {isSubmitting ? 'Posting...' : 'Submit Update'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 2. Assigned Projects List */}
      <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, marginBottom: '14px' }}>
        My Assigned Projects ({data?.projects?.length || 0})
      </h3>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '30px' }}>Loading projects...</div>
      ) : (data?.projects || []).length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No projects assigned to your supervisor account.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
          {(data?.projects || []).map((p: any) => (
            <div key={p.id} className="card">
              <div className="card-body" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 700 }}>{p.name}</h4>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                      Client: {p.client_name} {p.company && `(${p.company})`} | {p.business_name}
                    </div>
                  </div>
                  <Badge variant={p.status === 'active' ? 'success' : 'neutral'}>
                    {p.status}
                  </Badge>
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                  <span>Budget: ₹{Number(p.budget || 0).toLocaleString('en-IN')}</span>
                  <span>Logged Expenses: ₹{Number(p.logged_expenses || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Recent Updates Logged */}
      <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, marginBottom: '14px' }}>
        Recent Field Log
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {(data?.recent_updates || []).length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)' }}>No recent activity.</p>
        ) : (
          data.recent_updates.map((u: any) => (
            <div key={u.id} style={{ padding: '12px', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                <strong>{u.project_name}</strong>
                <span>{new Date(u.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-primary)' }}>{u.notes}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
