import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Project } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, TrendingUp, IndianRupee, ArrowRight, User } from 'lucide-react';

export const ProjectsList: React.FC = () => {
  const { businessId, business } = useBusiness();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const params: any = { business_id: businessId };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (search.trim()) params.search = search.trim();

    api
      .get('/projects', params)
      .then((data) => {
        if (isMounted) setProjects(data);
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [businessId, statusFilter, search]);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">
            <span>Client Projects</span>
            <Badge variant="proj">{business?.name}</Badge>
          </h1>
          <p className="page-description">
            Track client installations, supervisor assignments, Collection Values, and Net Profit.
          </p>
        </div>

        <div className="page-actions">
          <Link to="/projects/new" className="btn btn-proj">
            <Plus size={16} /> New Project
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by project title, client, or company..."
        />

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Projects</option>
          <option value="planning">Planning Phase</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
        </select>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Loading projects...</div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No Projects Found"
          description={`No project records found in ${business?.name}.`}
          actionText="Create Project"
          actionLink="/projects/new"
          accentClass="btn-proj"
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Project & Client</th>
                <th>Site Supervisor</th>
                <th>Timeline</th>
                <th style={{ textAlign: 'right' }}>Collection Value</th>
                <th style={{ textAlign: 'right' }}>Total Expenses</th>
                <th style={{ textAlign: 'right' }}>Net Profit</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const isProfitable = p.profit >= 0;

                return (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/projects/${p.id}`} style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {p.name}
                      </Link>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                        Client: {p.client_name} {p.company && `(${p.company})`}
                      </div>
                    </td>

                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                        <User size={13} color="var(--color-text-muted)" />
                        {p.supervisor_name || 'Unassigned'}
                      </span>
                    </td>

                    <td style={{ fontSize: 'var(--font-xs)' }}>
                      {p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'} to{' '}
                      {p.end_date ? new Date(p.end_date).toLocaleDateString() : 'Ongoing'}
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular">
                      ₹{Number(p.collection_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td style={{ textAlign: 'right', color: '#e11d48' }} className="tabular">
                      ₹{Number(p.total_expenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 800 }} className="tabular">
                      <span style={{ color: isProfitable ? '#16a34a' : '#dc2626' }}>
                        ₹{Number(p.profit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      {p.collection_value > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                          {p.margin_percent}% margin
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <Badge
                        variant={
                          p.status === 'active'
                            ? 'success'
                            : p.status === 'completed'
                            ? 'info'
                            : 'neutral'
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/projects/${p.id}`} className="btn btn-secondary btn-sm">
                        View <ArrowRight size={12} />
                      </Link>
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
};
