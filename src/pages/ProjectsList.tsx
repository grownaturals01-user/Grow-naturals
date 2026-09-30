import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Project } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  TrendingUp,
  IndianRupee,
  ArrowRight,
  User,
  Calendar,
  Clock,
  Layers,
  CheckCircle,
  Building,
  MapPin,
  Sparkles,
  Search,
  Filter,
  Eye
} from 'lucide-react';

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

  return (
    <div style={{ width: '100%', paddingBottom: '40px' }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '22px' }}>
              Client Projects
            </h1>
            <Badge variant="proj">{business?.name || 'All Businesses'}</Badge>
          </div>
          <p className="page-description" style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
            Click on any project row to open its full workspace, quotations, daily progress, and finances.
          </p>
        </div>

        <div className="page-actions">
          <Link to="/projects/new" className="btn btn-proj" style={{ fontWeight: 600, gap: '6px' }}>
            <Plus size={16} /> New Project
          </Link>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'rgba(34, 197, 94, 0.12)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <FolderKanban size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
              Total Projects
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
              {totalProjectsCount}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              {activeCount} active • {inProgressCount} in progress
            </span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'rgba(254, 159, 67, 0.14)',
            color: '#e67e22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
              In Progress & Planning
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#e67e22', lineHeight: 1.2 }}>
              {inProgressCount + projects.filter(p => p.status === 'planning').length}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              {completedCount} completed to date
            </span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <IndianRupee size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
              Invoiced Collections
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
              ₹{totalCollectionSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Across billed client invoices
            </span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: totalProfitSum >= 0 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: totalProfitSum >= 0 ? '#16a34a' : '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
              Total Net Profit
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: totalProfitSum >= 0 ? '#16a34a' : '#dc2626', lineHeight: 1.2 }}>
              {totalProfitSum < 0 ? '-' : ''}₹{Math.abs(totalProfitSum).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Revenue minus expenses
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '18px',
        backgroundColor: 'var(--color-bg-surface)',
        padding: '12px 16px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ flex: '1 1 300px', maxWidth: '480px' }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by project name, client, phone, or location..."
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Filter:</span>
          <select
            className="form-select"
            style={{
              width: '170px',
              fontSize: '12px',
              fontWeight: 600,
              height: '36px',
              borderRadius: 'var(--radius-md)'
            }}
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
        <div className="table-container" style={{ borderRadius: 'var(--radius-xl)', overflowX: 'auto', border: '1px solid var(--color-border)' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Project & Client</th>
                <th style={{ textAlign: 'left', padding: '12px 14px' }}>Work & Category</th>
                <th style={{ textAlign: 'left', padding: '12px 14px' }}>Supervisor & Appointment</th>
                <th style={{ textAlign: 'right', padding: '12px 14px' }}>Site Visit / Allow</th>
                <th style={{ textAlign: 'right', padding: '12px 14px' }}>Collection Value</th>
                <th style={{ textAlign: 'right', padding: '12px 14px' }}>Net Profit</th>
                <th style={{ textAlign: 'center', padding: '12px 14px' }}>Status</th>
                <th style={{ textAlign: 'center', padding: '12px 14px', width: '90px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const profitNum = Number(p.profit) || 0;
                const isProfitable = profitNum >= 0;
                const collectionNum = Number(p.collection_value) || 0;
                const siteFee = Number(p.site_visit_amount) || 0;
                const allowFee = Number(p.allowance_amount) || 0;

                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    title="Click to view full project details"
                  >
                    {/* Project & Client Details */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(34, 197, 94, 0.12)',
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '14px',
                          flexShrink: 0
                        }}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '14px',
                              color: 'var(--color-primary)',
                              textDecoration: 'none',
                              display: 'inline-block'
                            }}
                          >
                            {p.name}
                          </span>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                            <span><strong>Client:</strong> {p.client_name} {p.company && `(${p.company})`}</span>
                            {p.location && (
                              <span style={{ color: 'var(--color-text-muted)' }}>• 📍 {p.location}</span>
                            )}
                          </div>
                          {p.referred_by && (
                            <span style={{
                              display: 'inline-block',
                              marginTop: '3px',
                              fontSize: '11px',
                              color: '#6366f1',
                              backgroundColor: 'rgba(99, 102, 241, 0.08)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: 600
                            }}>
                              Ref: {p.referred_by}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Work & Category Details */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        {p.work_type ? (
                          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                            {p.work_type}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>General Work</span>
                        )}

                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {p.work_nature === 'rework' ? (
                            <span style={{
                              fontSize: '10.5px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#ffe4e6',
                              color: '#e11d48',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              🔄 Rework {p.rework_source === 'our_existing' ? '(Our)' : p.rework_source ? '(Other)' : ''}
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '10.5px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#dcfce7',
                              color: '#16a34a',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              🌱 New Work
                            </span>
                          )}

                          {p.category_name && (
                            <span style={{
                              fontSize: '10.5px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(254, 159, 67, 0.12)',
                              color: '#d97706',
                              fontWeight: 600
                            }}>
                              {p.category_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Site Supervisor & Scheduled Appointment */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                          {p.supervisor_name ? (
                            <>
                              <User size={14} color="var(--color-primary)" />
                              <strong style={{ color: 'var(--color-text-primary)' }}>{p.supervisor_name}</strong>
                            </>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                              Unassigned
                            </span>
                          )}
                        </div>

                        {p.appointment_date && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            color: '#4338ca',
                            backgroundColor: 'rgba(99, 102, 241, 0.08)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            width: 'fit-content'
                          }}>
                            <Clock size={11} /> {new Date(p.appointment_date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Site Visit Fee & Allowance */}
                    <td style={{ textAlign: 'right', padding: '12px 14px' }}>
                      {siteFee > 0 || allowFee > 0 ? (
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }} className="tabular">
                            ₹{siteFee.toLocaleString('en-IN')}
                          </div>
                          {allowFee > 0 && (
                            <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>
                              +₹{allowFee.toLocaleString('en-IN')} allow.
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>—</span>
                      )}
                    </td>

                    {/* Collection Value (Billed) */}
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '13.5px', padding: '12px 14px' }} className="tabular">
                      ₹{collectionNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Net Profit */}
                    <td style={{ textAlign: 'right', padding: '12px 14px' }}>
                      <div className="tabular" style={{
                        fontWeight: 800,
                        fontSize: '13.5px',
                        color: profitNum > 0 ? '#16a34a' : profitNum < 0 ? '#dc2626' : 'var(--color-text-muted)'
                      }}>
                        {profitNum < 0 ? `-${formatCurrency(profitNum)}` : formatCurrency(profitNum)}
                      </div>
                      {collectionNum > 0 && (
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          color: isProfitable ? '#16a34a' : '#dc2626',
                          backgroundColor: isProfitable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          display: 'inline-block',
                          marginTop: '2px'
                        }}>
                          {p.margin_percent}% margin
                        </span>
                      )}
                    </td>

                    {/* Uniform Status Badges */}
                    <td style={{ textAlign: 'center', padding: '12px 14px' }}>
                      {p.status === 'in_progress' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          backgroundColor: 'rgba(254, 159, 67, 0.15)',
                          color: '#e67e22',
                          fontWeight: 700,
                          fontSize: '11px',
                          border: '1px solid rgba(254, 159, 67, 0.35)',
                          letterSpacing: '0.3px',
                          whiteSpace: 'nowrap'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e67e22', display: 'inline-block' }} />
                          ⚡ IN PROGRESS
                        </span>
                      ) : p.status === 'active' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          backgroundColor: '#dcfce7',
                          color: '#16a34a',
                          fontWeight: 700,
                          fontSize: '11px',
                          border: '1px solid #bbf7d0',
                          letterSpacing: '0.3px',
                          whiteSpace: 'nowrap'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }} />
                          ACTIVE
                        </span>
                      ) : p.status === 'completed' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          backgroundColor: '#e0f2fe',
                          color: '#0284c7',
                          fontWeight: 700,
                          fontSize: '11px',
                          border: '1px solid #bae6fd',
                          letterSpacing: '0.3px',
                          whiteSpace: 'nowrap'
                        }}>
                          <CheckCircle size={10} /> COMPLETED
                        </span>
                      ) : p.status === 'on_hold' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          backgroundColor: '#ffe4e6',
                          color: '#e11d48',
                          fontWeight: 700,
                          fontSize: '11px',
                          border: '1px solid #fecdd3',
                          letterSpacing: '0.3px',
                          whiteSpace: 'nowrap'
                        }}>
                          ON HOLD
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          fontWeight: 700,
                          fontSize: '11px',
                          border: '1px solid #cbd5e1',
                          letterSpacing: '0.3px',
                          whiteSpace: 'nowrap'
                        }}>
                          PLANNING
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td style={{ textAlign: 'center', padding: '12px 14px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${p.id}`);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderRadius: '6px',
                          backgroundColor: '#f0fdf4',
                          color: '#16a34a',
                          borderColor: '#bbf7d0'
                        }}
                      >
                        <Eye size={13} /> View
                      </button>
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
