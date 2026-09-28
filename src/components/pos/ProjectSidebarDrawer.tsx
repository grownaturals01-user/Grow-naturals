import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Search,
  Building,
  FolderKanban,
  User,
  Calendar,
  IndianRupee,
  Plus,
  Check,
  Loader2,
  FolderPlus,
  Briefcase
} from 'lucide-react';
import { api } from '../../services/api';
import type { Project } from '../../types';

interface ProjectSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  selectedProjectId?: string;
  onSelectProject: (project: Project | null) => void;
  onProjectCreated: (newProject: Project) => void;
  businessId: string;
  initialTab?: 'existing' | 'new';
  initialSearchQuery?: string;
}

const PROJ_AVATAR_COLORS = [
  { bg: '#ccfbf1', text: '#0d9488', border: '#99f6e4' }, // Teal
  { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' }, // Sky
  { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' }, // Emerald
  { bg: '#fef3c7', text: '#d97706', border: '#fde68a' }, // Amber
  { bg: '#ede9fe', text: '#6366f1', border: '#ddd6fe' }, // Indigo
  { bg: '#f3e8ff', text: '#9333ea', border: '#e9d5ff' }, // Purple
];

function getProjectColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PROJ_AVATAR_COLORS.length;
  return PROJ_AVATAR_COLORS[index];
}

export const ProjectSidebarDrawer: React.FC<ProjectSidebarDrawerProps> = ({
  isOpen,
  onClose,
  projects,
  selectedProjectId = '',
  onSelectProject,
  onProjectCreated,
  businessId,
  initialTab = 'existing',
  initialSearchQuery = '',
}) => {
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>(initialTab);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Supervisors list for assignment
  const [supervisors, setSupervisors] = useState<Array<{ id: string; name: string }>>([]);

  // New Project Form State
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('0');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery(initialSearchQuery);
      setFormError(null);
      api.get('/supervisors').then(setSupervisors).catch(console.warn);
      if (initialTab === 'existing') {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, initialTab, initialSearchQuery]);

  // Filtered projects
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase().trim();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.client_name.toLowerCase().includes(q) ||
        (p.company && p.company.toLowerCase().includes(q)) ||
        (p.supervisor_name && p.supervisor_name.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  // Handle Project Creation
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientName.trim()) {
      setFormError('Project title and client name are required.');
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);

      const res = await api.post('/projects', {
        business_id: businessId,
        name: name.trim(),
        client_name: clientName.trim(),
        company: company.trim(),
        supervisor_id: supervisorId || null,
        start_date: startDate || null,
        end_date: endDate || null,
        budget: Math.round(Number(budget)) || 0,
        description: description.trim(),
        status,
      });

      const newProject: Project = {
        id: res.id,
        business_id: businessId as any,
        name: name.trim(),
        client_name: clientName.trim(),
        company: company.trim(),
        supervisor_id: supervisorId || undefined,
        supervisor_name: supervisors.find((s) => s.id === supervisorId)?.name,
        start_date: startDate,
        end_date: endDate,
        budget: Math.round(Number(budget)) || 0,
        description: description.trim(),
        status: status as any,
        collection_value: 0,
        total_expenses: 0,
        profit: 0,
        margin_percent: 0,
        created_at: new Date().toISOString(),
      };

      onProjectCreated(newProject);
      onSelectProject(newProject);

      // Reset form
      setName('');
      setClientName('');
      setCompany('');
      setSupervisorId('');
      setBudget('0');
      setDescription('');
      setStatus('active');
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create project.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 1200,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '450px',
          maxWidth: '92vw',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '-12px 0 35px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          borderLeft: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header */}
        <div
          style={{
            padding: '18px 24px 14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderKanban size={20} color="#16a34a" />
            <h2
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
              }}
            >
              Client Projects
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.color = '#475569';
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* 2. Top Navigation Tabs */}
        <div
          style={{
            padding: '12px 24px 10px 24px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('existing')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: activeTab === 'existing' ? '#0f172a' : '#ffffff',
              color: activeTab === 'existing' ? '#ffffff' : '#0f172a',
              border: activeTab === 'existing' ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
              boxShadow: activeTab === 'existing' ? '0 2px 6px rgba(15, 23, 42, 0.15)' : 'none',
            }}
          >
            <FolderKanban size={14} />
            <span>Active Projects ({projects.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('new')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: activeTab === 'new' ? '#0f172a' : '#ffffff',
              color: activeTab === 'new' ? '#ffffff' : '#0f172a',
              border: activeTab === 'new' ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
              boxShadow: activeTab === 'new' ? '0 2px 6px rgba(15, 23, 42, 0.15)' : 'none',
            }}
          >
            <FolderPlus size={14} />
            <span>+ Add New Project</span>
          </button>
        </div>

        {/* 3. Existing Projects View */}
        {activeTab === 'existing' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Search Bar */}
            <div style={{ padding: '6px 24px 14px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    color: '#94a3b8',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search project title, client, or company"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 36px 0 40px',
                    borderRadius: '9999px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.875rem',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    backgroundColor: '#ffffff',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0f172a')}
                  onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      padding: '4px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Project Cards */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Option: Clear / General Billing */}
              <div
                onClick={() => {
                  onSelectProject(null);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: !selectedProjectId ? '#f0fdf4' : '#ffffff',
                  border: !selectedProjectId ? '1.5px solid #86efac' : '1px solid #f1f5f9',
                }}
                onMouseEnter={(e) => {
                  if (selectedProjectId) e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (selectedProjectId) e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                {/* Radio selection indicator */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  {!selectedProjectId ? (
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '2px solid #06b6d4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#06b6d4',
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '1.5px solid #cbd5e1',
                      }}
                    />
                  )}
                </div>

                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Briefcase size={18} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                    No Project Selected
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    Standard direct invoice / retail sale
                  </div>
                </div>

                <div style={{ flexShrink: 0 }}>
                  <span
                    style={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                    }}
                  >
                    Direct
                  </span>
                </div>
              </div>

              {/* Mapped Project List */}
              {filteredList.map((p) => {
                const isSelected = selectedProjectId === p.id;
                const pColor = getProjectColor(p.name);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                      border: isSelected ? '1.5px solid #86efac' : '1px solid #f1f5f9',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    {/* Radio indicator */}
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                      {isSelected ? (
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: '2px solid #06b6d4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#06b6d4',
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: '1.5px solid #cbd5e1',
                          }}
                        />
                      )}
                    </div>

                    {/* Avatar */}
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: pColor.bg,
                        color: pColor.text,
                        border: `1.5px solid ${pColor.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Building size={18} />
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: '#64748b',
                          marginTop: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span>Client: <strong style={{ color: '#334155' }}>{p.client_name}</strong></span>
                        {p.company && (
                          <>
                            <span style={{ color: '#cbd5e1' }}>•</span>
                            <span>{p.company}</span>
                          </>
                        )}
                      </div>
                      {p.budget > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: 600, marginTop: '2px' }}>
                          Budget: ₹{Number(p.budget).toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div style={{ flexShrink: 0 }}>
                      <span
                        style={{
                          backgroundColor: p.status === 'active' ? '#ecfdf5' : '#f1f5f9',
                          color: p.status === 'active' ? '#059669' : '#475569',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          border: p.status === 'active' ? '1px solid #d1fae5' : '1px solid #e2e8f0',
                        }}
                      >
                        {p.status === 'active' ? 'Active' : p.status}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Empty state */}
              {filteredList.length === 0 && searchQuery && (
                <div
                  style={{
                    padding: '36px 16px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <Building size={28} color="#94a3b8" />
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                    No project found matching "{searchQuery}"
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setName(searchQuery);
                      setActiveTab('new');
                    }}
                    style={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '9999px',
                      padding: '8px 20px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    + Add "{searchQuery}" as New Project
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Add New Project Form */}
        {activeTab === 'new' && (
          <form
            onSubmit={handleCreateProject}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                flex: 1,
                padding: '16px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {formError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  {formError}
                </div>
              )}

              {/* Project Title */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Project Name / Title *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Building size={15} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oberoi Rooftop Garden, Baner Luxury Villa"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px 0 36px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#0f172a')}
                    onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                  />
                </div>
              </div>

              {/* Client & Company */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Client / POC Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Deshpande"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Company / Group
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Oberoi Hotels"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Assigned Supervisor */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Assigned Site Supervisor
                </label>
                <select
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value="">Unassigned</option>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Estimated Budget (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={budget}
                    onKeyDown={(e) => {
                      if (e.key === '.' || e.key === ',') e.preventDefault();
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') setBudget('');
                      else {
                        const num = parseInt(val, 10);
                        setBudget(isNaN(num) ? '0' : String(num));
                      }
                    }}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    <option value="active">Active Installation</option>
                    <option value="planning">Planning & Sourcing</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
              </div>

              {/* Start & End Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Scope Description / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Site dimensions, plant varieties, milestone delivery notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                gap: '10px',
                backgroundColor: '#f8fafc',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('existing')}
                style={{
                  flex: 1,
                  height: '42px',
                  borderRadius: '9999px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Back to List
              </button>

              <button
                type="submit"
                disabled={isSaving}
                style={{
                  flex: 2,
                  height: '42px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                }}
              >
                {isSaving ? <Loader2 size={16} className="spinner" /> : <Check size={16} />}
                <span>Save & Select Project</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
