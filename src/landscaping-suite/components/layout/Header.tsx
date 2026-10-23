import React from 'react';
import { useProjects } from '../../context/ProjectContext';
import {
  FolderKanban,
  FileSpreadsheet,
  ClipboardList,
  TrendingUp,
  Users2,
  Plus,
  RotateCcw,
  Bell,
  Trash2,
  Sparkles,
  X,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  onOpenNewProject: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewProject }) => {
  const {
    currentView,
    setCurrentView,
    clearAllData,
    seedDemoData,
    managerAlerts,
    selectProject,
    projects,
    activeProject,
    resourceConflicts,
  } = useProjects();

  const activeProjectsCount = projects.filter(p => p.isConvertedToProject).length;
  const enquiriesCount = projects.filter(p => !p.isConvertedToProject).length;

  const handleClearData = () => {
    if (window.confirm('Clear all projects, resources, and allocations to a completely blank slate?')) {
      clearAllData();
    }
  };

  const handleSeedDemoData = () => {
    seedDemoData();
  };

  const tabs = [
    {
      id: 'dashboard',
      label: 'Active Projects',
      icon: FolderKanban,
      count: activeProjectsCount,
      showCount: true,
      onClick: () => setCurrentView('dashboard'),
    },
    {
      id: 'enquiries',
      label: 'Enquiries & Quotes',
      icon: FileSpreadsheet,
      count: enquiriesCount,
      showCount: true,
      onClick: () => setCurrentView('enquiries'),
    },
    {
      id: 'daily-ledger',
      label: 'Daily Operations Ledger',
      icon: ClipboardList,
      showCount: false,
      onClick: () => setCurrentView('daily-ledger'),
    },
    {
      id: 'pnl-matrix',
      label: 'Profit & Loss Analytics',
      icon: TrendingUp,
      showCount: false,
      onClick: () => setCurrentView('pnl-matrix'),
    },
    {
      id: 'resource-allocation',
      label: 'Member Allocation',
      icon: Users2,
      count: resourceConflicts.length,
      showCount: resourceConflicts.length > 0,
      isConflictBadge: true,
      onClick: () => setCurrentView('resource-allocation'),
    },
  ];

  return (
    <div className="landscaping-header-wrapper mb-3">
      {/* 1. DreamsPOS Native Page Header Row */}
      <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div className="d-flex align-items-center gap-3">
          <div className="landscaping-brand-icon">
            <FolderKanban size={22} />
          </div>
          <div className="page-title">
            <h4 className="fw-bold mb-0 text-dark">Projects</h4>
            <h6 className="text-muted mb-0 mt-1">
              {currentView === 'project-detail' && activeProject
                ? `Active Project: ${activeProject.title} (${activeProject.code})`
                : 'Living Materials, Construction Milestones, Daily Ledgers & Real-time Financials'}
            </h6>
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Budget Overrun Alert Indicator */}
          {managerAlerts.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (managerAlerts[0]) {
                  selectProject(managerAlerts[0].projectId);
                }
              }}
              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 shadow-none"
              title={`${managerAlerts.length} Budget Alerts! Click to view.`}
            >
              <Bell size={14} className="text-danger animate-bounce" />
              <span className="fw-bold">{managerAlerts.length} Budget Alert{managerAlerts.length > 1 ? 's' : ''}</span>
            </button>
          )}

          {/* Seed Demo / Reset Data */}
          {projects.length > 0 ? (
            <>
              <button
                type="button"
                onClick={handleSeedDemoData}
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 shadow-none"
                title="Reset sample projects & crew"
              >
                <RotateCcw size={14} />
                <span className="d-none d-sm-inline">Reset Demo</span>
              </button>
              <button
                type="button"
                onClick={handleClearData}
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 shadow-none"
                title="Clear all data to a blank slate"
              >
                <Trash2 size={14} />
                <span className="d-none d-sm-inline">Clear All</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSeedDemoData}
              className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1.5 shadow-none"
              title="Load sample landscaping projects & team roster"
            >
              <Sparkles size={14} />
              <span>Load Sample Data</span>
            </button>
          )}

          {/* Primary Action Button: Add New Project */}
          <button
            type="button"
            onClick={onOpenNewProject}
            className="btn btn-added d-inline-flex align-items-center gap-1 shadow-sm"
          >
            <Plus size={16} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* 2. DreamsPOS Existing Theme Specific Tab Navigation Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-2">
          <ul className="landscaping-theme-tabs" role="tablist">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentView === tab.id;
              return (
                <li key={tab.id} className="landscaping-theme-tab-item">
                  <button
                    type="button"
                    onClick={tab.onClick}
                    className={`landscaping-theme-tab-btn ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={16} className={isActive ? 'text-white' : 'text-muted'} />
                    <span>{tab.label}</span>
                    {tab.showCount && (
                      <span className={`tab-badge ${tab.isConflictBadge ? 'conflict' : ''}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}

            {/* Project Detail Tab indicator when viewing details */}
            {currentView === 'project-detail' && activeProject && (
              <li className="landscaping-theme-tab-item ms-auto">
                <div className="landscaping-theme-tab-btn active d-inline-flex align-items-center gap-2">
                  <Layers size={16} className="text-white" />
                  <span className="text-white">Detail: {activeProject.title}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentView(activeProject.isConvertedToProject ? 'dashboard' : 'enquiries');
                    }}
                    className="btn btn-sm btn-link text-white p-0 ms-1 opacity-75 hover-opacity-100"
                    title="Close detail and return to list"
                  >
                    <X size={14} />
                  </button>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
