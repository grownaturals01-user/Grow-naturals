import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Link } from 'react-router-dom';
import { Users2, Phone, Mail, FolderKanban, ArrowRight, ExternalLink } from 'lucide-react';

export const SupervisorsDirectory: React.FC = () => {
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    api
      .get('/supervisors')
      .then(setSupervisors)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">
            <span>Site Supervisors Directory</span>
            <Badge variant="proj">Field Crew</Badge>
          </h1>
          <p className="page-description">
            Field supervisors manage client landscaping installations and log progress updates via their mobile portal.
          </p>
        </div>

        <div className="page-actions">
          <Link to="/supervisor-portal" className="btn btn-secondary">
            <ExternalLink size={16} /> Open Supervisor Portal View
          </Link>
          <Link to="/staff/new" className="btn btn-proj">
            Add Supervisor Account
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Loading supervisors...</div>
      ) : supervisors.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No Supervisors Found"
          description="No users with the supervisor role exist yet."
          actionText="Add Supervisor"
          actionLink="/staff/new"
          accentClass="btn-proj"
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {supervisors.map((s) => (
            <div key={s.id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div className="user-avatar" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700 }}>{s.name}</h3>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                      @{s.username} | Role: <Badge variant="neutral">{s.role}</Badge>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: '18px' }}>
                  {s.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={14} color="var(--color-text-dim)" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  {s.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={14} color="var(--color-text-dim)" />
                      <span>{s.email}</span>
                    </div>
                  )}
                </div>

                {/* Assigned Projects */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                      Assigned Projects ({s.projects?.length || 0})
                    </span>
                    <Badge variant={s.active_project_count > 0 ? 'success' : 'neutral'}>
                      {s.active_project_count} active
                    </Badge>
                  </div>

                  {(s.projects || []).length === 0 ? (
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-dim)' }}>
                      No projects currently assigned.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {s.projects.slice(0, 3).map((p: any) => (
                        <Link
                          key={p.id}
                          to={`/projects/${p.id}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 10px',
                            backgroundColor: 'var(--color-bg-surface-subtle)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-xs)',
                            fontWeight: 600,
                          }}
                        >
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                            {p.name}
                          </span>
                          <span style={{ color: 'var(--color-text-muted)' }}>
                            {p.status} <ArrowRight size={10} />
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
