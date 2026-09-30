import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Project } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  TrendingUp,
  IndianRupee,
  User,
  Clock,
  CheckCircle,
  Sparkles,
  Search,
  X,
  Eye
} from 'lucide-react';
import '../styles/projects-list.css';

export const ProjectsList: React.FC = () => {
  const { businessId, business } = useBusiness();
  const navigate = useNavigate();
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
        if (isMounted) setProjects(data || []);
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [businessId, statusFilter, search]);

  // Summary Metrics
  const totalProjectsCount = projects.length;
  const inProgressCount = projects.filter(p => p.status === 'in_progress').length;
  const activeCount = projects.filter(p => p.status === 'active').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const totalCollectionSum = projects.reduce((acc, p) => acc + (Number(p.collection_value) || 0), 0);
  const totalProfitSum = projects.reduce((acc, p) => acc + (Number(p.profit) || 0), 0);

  const formatCurrency = (val: number) => {
    return `₹${Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getAvatarClass = (name: string) => {
    const code = name.charCodeAt(0) || 0;
    const classes = ['c-orange', 'c-green', 'c-purple', 'c-blue'];
    return classes[code % classes.length];
  };

  return (
    <div className="projects-page-wrap">
      {/* Top Header */}
      <div className="proj-page-header">
        <div className="proj-title-group">
          <div className="proj-title-row">
            <h1 className="proj-main-heading">
              Client Projects
            </h1>
            <span className="proj-biz-badge">
              {business?.name || 'All Businesses'}
            </span>
          </div>
          <p className="proj-page-desc">
            Click on any project row to open its full workspace, quotations, daily progress, and finances.
          </p>
        </div>

        <div>
          <Link to="/projects/new" className="proj-btn-new">
            <Plus size={16} /> New Project
          </Link>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="proj-kpi-grid">
        <div className="proj-kpi-card">
          <div className="proj-kpi-icon-wrap total">
            <FolderKanban size={22} />
          </div>
          <div className="proj-kpi-details">
            <span className="proj-kpi-label">
              Total Projects
            </span>
            <div className="proj-kpi-value">
              {totalProjectsCount}
            </div>
            <span className="proj-kpi-subtext">
              {activeCount} active • {inProgressCount} in progress
            </span>
          </div>
        </div>

        <div className="proj-kpi-card">
          <div className="proj-kpi-icon-wrap progress">
            <Sparkles size={22} />
          </div>
          <div className="proj-kpi-details">
            <span className="proj-kpi-label">
              In Progress & Planning
            </span>
            <div className="proj-kpi-value" style={{ color: '#ea580c' }}>
              {inProgressCount + projects.filter(p => p.status === 'planning').length}
            </div>
            <span className="proj-kpi-subtext">
              {completedCount} completed to date
            </span>
          </div>
        </div>

        <div className="proj-kpi-card">
          <div className="proj-kpi-icon-wrap collections">
            <IndianRupee size={22} />
          </div>
          <div className="proj-kpi-details">
            <span className="proj-kpi-label">
              Invoiced Collections
            </span>
            <div className="proj-kpi-value">
              ₹{totalCollectionSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="proj-kpi-subtext">
              Across billed client invoices
            </span>
          </div>
        </div>

        <div className="proj-kpi-card">
          <div className={`proj-kpi-icon-wrap ${totalProfitSum >= 0 ? 'profit-pos' : 'profit-neg'}`}>
            <TrendingUp size={22} />
          </div>
          <div className="proj-kpi-details">
            <span className="proj-kpi-label">
              Total Net Profit
            </span>
            <div className={`proj-kpi-value ${totalProfitSum >= 0 ? 'profit-pos' : 'profit-neg'}`}>
              {totalProfitSum < 0 ? '-' : ''}₹{Math.abs(totalProfitSum).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="proj-kpi-subtext">
              Revenue minus expenses
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="proj-filter-bar">
        <div className="proj-search-box">
          <Search className="proj-search-icon" size={16} />
          <input
            type="text"
            className="proj-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name, client, phone, or location..."
          />
          {search && (
            <button
              type="button"
              className="proj-search-clear-btn"
              onClick={() => setSearch('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="proj-filter-right">
          <span className="proj-filter-label">Filter:</span>
          <select
            className="proj-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Projects ({totalProjectsCount})</option>
            <option value="in_progress">⚡ In Progress</option>
            <option value="active">Active Execution</option>
            <option value="planning">Planning Phase</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* Projects Table List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ fontWeight: 600 }}>Loading project records...</p>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No Projects Found"
          description={search ? `No projects matching "${search}".` : `No project records found in ${business?.name}.`}
          actionText="Create New Project"
          actionLink="/projects/new"
          accentClass="btn-proj"
        />
      ) : (
        <div className="proj-table-card">
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="proj-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '220px' }}>Project & Client</th>
                  <th style={{ minWidth: '150px' }}>Work & Category</th>
                  <th style={{ minWidth: '180px' }}>Supervisor & Appointment</th>
                  <th style={{ textAlign: 'right', minWidth: '130px' }}>Site Visit / Allow</th>
                  <th style={{ textAlign: 'right', minWidth: '140px' }}>Collection Value</th>
                  <th style={{ textAlign: 'right', minWidth: '130px' }}>Net Profit</th>
                  <th style={{ textAlign: 'center', minWidth: '120px' }}>Status</th>
                  <th style={{ textAlign: 'center', width: '90px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const profitNum = Number(p.profit) || 0;
                  const isProfitable = profitNum >= 0;
                  const collectionNum = Number(p.collection_value) || 0;
                  const siteFee = Number(p.site_visit_amount) || 0;
                  const allowFee = Number(p.allowance_amount) || 0;
                  const avatarClass = getAvatarClass(p.name || 'P');

                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      title="Click to view full project details"
                    >
                      {/* Project & Client Details */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className={`proj-avatar-box ${avatarClass}`}>
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="proj-name-text">
                              {p.name}
                            </span>
                            <div className="proj-client-meta">
                              <span><strong>Client:</strong> {p.client_name} {p.company && `(${p.company})`}</span>
                              {p.location && (
                                <span>• 📍 {p.location}</span>
                              )}
                            </div>
                            {p.referred_by && (
                              <span className="proj-ref-badge">
                                Ref: {p.referred_by}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Work & Category Details */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          {p.work_type ? (
                            <span className="proj-work-type">
                              {p.work_type}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>General Work</span>
                          )}

                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {p.work_nature === 'rework' ? (
                              <span className="proj-pill-rework">
                                🔄 Rework {p.rework_source === 'our_existing' ? '(Our)' : p.rework_source ? '(Other)' : ''}
                              </span>
                            ) : (
                              <span className="proj-pill-new">
                                🌱 New Work
                              </span>
                            )}

                            {p.category_name && (
                              <span className="proj-pill-cat">
                                {p.category_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Site Supervisor & Scheduled Appointment */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div className="proj-supervisor-row">
                            {p.supervisor_name ? (
                              <>
                                <User size={13} color="var(--color-primary)" />
                                <span className="proj-supervisor-name">{p.supervisor_name}</span>
                              </>
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                Unassigned
                              </span>
                            )}
                          </div>

                          {p.appointment_date && (
                            <span className="proj-appoint-badge">
                              <Clock size={11} /> {new Date(p.appointment_date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Site Visit Fee & Allowance */}
                      <td style={{ textAlign: 'right' }}>
                        {siteFee > 0 || allowFee > 0 ? (
                          <div>
                            <div className="proj-num-cell" style={{ color: 'var(--color-text-primary)' }}>
                              ₹{siteFee.toLocaleString('en-IN')}
                            </div>
                            {allowFee > 0 && (
                              <div style={{ fontSize: '0.6875rem', color: '#b45309', fontWeight: 600 }}>
                                +₹{allowFee.toLocaleString('en-IN')} allow.
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>

                      {/* Collection Value (Billed) */}
                      <td style={{ textAlign: 'right' }}>
                        <span className="proj-num-cell proj-collection-val">
                          ₹{collectionNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Net Profit */}
                      <td style={{ textAlign: 'right' }}>
                        <div className={`proj-num-cell ${profitNum >= 0 ? 'proj-profit-pos' : 'proj-profit-neg'}`}>
                          {profitNum < 0 ? `-${formatCurrency(profitNum)}` : formatCurrency(profitNum)}
                        </div>
                        {collectionNum > 0 && (
                          <span className={`proj-margin-badge ${isProfitable ? 'pos' : 'neg'}`}>
                            {p.margin_percent}% margin
                          </span>
                        )}
                      </td>

                      {/* Uniform Status Badges */}
                      <td style={{ textAlign: 'center' }}>
                        {p.status === 'in_progress' ? (
                          <span className="proj-status-badge in_progress">
                            <span className="proj-status-dot" />
                            ⚡ IN PROGRESS
                          </span>
                        ) : p.status === 'active' ? (
                          <span className="proj-status-badge active">
                            <span className="proj-status-dot" />
                            ACTIVE
                          </span>
                        ) : p.status === 'completed' ? (
                          <span className="proj-status-badge completed">
                            <CheckCircle size={11} /> COMPLETED
                          </span>
                        ) : p.status === 'on_hold' ? (
                          <span className="proj-status-badge on_hold">
                            ON HOLD
                          </span>
                        ) : (
                          <span className="proj-status-badge planning">
                            PLANNING
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${p.id}`);
                          }}
                          className="proj-action-btn"
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
