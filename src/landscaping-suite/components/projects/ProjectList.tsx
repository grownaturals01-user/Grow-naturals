import React, { useState, useMemo } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { ProjectStage, LandscapingProject } from '../../types/landscaping';
import { calculateProjectFinancials, formatCurrency } from '../../utils/calculations';
import { KpiOverview, KpiDisplayMode } from '../layout/KpiOverview';
import { PendingCollectionsModule } from '../dashboard/PendingCollectionsModule';
import {
  Search,
  MapPin,
  User,
  ChevronRight,
  HardHat,
  FileText,
  Plus,
  FolderPlus,
  Minimize2,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  X,
  ArrowUpDown,
  Building2,
  Calendar,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Layers,
} from 'lucide-react';

interface ProjectListProps {
  onOpenNewProject: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onOpenNewProject }) => {
  const {
    projects,
    searchQuery,
    setSearchQuery,
    stageFilter,
    setStageFilter,
    selectProject,
    setCurrentView,
    currency,
  } = useProjects();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showQuickGuide, setShowQuickGuide] = useState(() => {
    try {
      return localStorage.getItem('terraflow_guide_dismissed') !== 'true';
    } catch {
      return true;
    }
  });
  const [showPendingDesk, setShowPendingDesk] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'value_desc' | 'name_asc'>('recent');

  const [kpiMode, setKpiMode] = useState<KpiDisplayMode>(() => {
    try {
      const saved = localStorage.getItem('terraflow_kpi_mode') as KpiDisplayMode;
      if (saved === 'cards' || saved === 'compact' || saved === 'collapsed') return saved;
    } catch {}
    return 'cards';
  });

  const handleSetKpiMode = (mode: KpiDisplayMode) => {
    setKpiMode(mode);
    try {
      localStorage.setItem('terraflow_kpi_mode', mode);
    } catch {}
  };

  const handleDismissGuide = () => {
    setShowQuickGuide(false);
    try {
      localStorage.setItem('terraflow_guide_dismissed', 'true');
    } catch {}
  };

  const openEnquiriesCount = useMemo(() => {
    return projects.filter(p => !p.isConvertedToProject).length;
  }, [projects]);

  const activeConvertedCount = useMemo(() => {
    return projects.filter(p => p.isConvertedToProject).length;
  }, [projects]);

  // Beginner-friendly plain English stage labels & colors
  const getSimpleStageBadge = (stage: ProjectStage) => {
    switch (stage) {
      case 'enquiry':
        return { label: 'New Enquiry', bg: 'bg-neutral-100 text-neutral-700 border-neutral-200' };
      case 'site_visit':
        return { label: 'Site Survey', bg: 'bg-sky-50 text-sky-800 border-sky-200' };
      case 'quotation':
        return { label: 'Quotation Ready', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'advance_planning':
        return { label: 'Planning & Crew', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'daily_operations':
        return { label: 'Work In Progress', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'extra_work':
        return { label: 'Additional Work', bg: 'bg-amber-50 text-amber-900 border-amber-200' };
      case 'settlement':
        return { label: 'Completed & Handed Over', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
    }
  };

  // Filter & Sort
  const filteredProjects = useMemo(() => {
    const list = projects.filter(p => {
      // Show active converted projects by default on this screen
      if (!p.isConvertedToProject) return false;

      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matches =
          p.title.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.step1Enquiry.clientName.toLowerCase().includes(q) ||
          p.step1Enquiry.city.toLowerCase().includes(q) ||
          (p.step4Planning.supervisorName && p.step4Planning.supervisorName.toLowerCase().includes(q));

        if (!matches) return false;
      }

      if (stageFilter === 'all') return true;
      if (stageFilter === 'in_progress') {
        return p.currentStage === 'daily_operations' || p.currentStage === 'extra_work';
      }
      if (stageFilter === 'planning') {
        return p.currentStage === 'advance_planning' || p.currentStage === 'quotation';
      }
      if (stageFilter === 'completed') {
        return p.currentStage === 'settlement';
      }
      return p.currentStage === stageFilter;
    });

    return list.sort((a, b) => {
      const finA = calculateProjectFinancials(a);
      const finB = calculateProjectFinancials(b);

      if (sortBy === 'value_desc') {
        return finB.totalContractValue - finA.totalContractValue;
      }
      if (sortBy === 'name_asc') {
        return a.title.localeCompare(b.title);
      }
      // 'recent'
      const dateA = a.step5DailyOperations.length > 0 ? a.step5DailyOperations[a.step5DailyOperations.length - 1].date : a.step1Enquiry.enquiryDate;
      const dateB = b.step5DailyOperations.length > 0 ? b.step5DailyOperations[b.step5DailyOperations.length - 1].date : b.step1Enquiry.enquiryDate;
      return (dateB || '').localeCompare(dateA || '');
    });
  }, [projects, searchQuery, stageFilter, sortBy]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Clean, Friendly Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              Active Projects
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>{activeConvertedCount} Active</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Track daily site logs, client payments, and job progress with zero hassle.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ New Project</span>
          </button>

          <button
            onClick={() => setCurrentView('enquiries')}
            className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-xl transition-colors shadow-2xs"
          >
            <FolderPlus className="w-4 h-4 text-neutral-500" />
            <span>Enquiries</span>
            {openEnquiriesCount > 0 && (
              <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {openEnquiriesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowQuickGuide(!showQuickGuide)}
            className="p-2 text-neutral-400 hover:text-emerald-800 rounded-xl hover:bg-neutral-100 transition-colors"
            title="How TerraFlow Works"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Beginner Quick-Start Guide (Collapsible & Dismissible) */}
      {showQuickGuide && (
        <div className="bg-emerald-50/60 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 relative shadow-2xs">
          <button
            onClick={handleDismissGuide}
            className="absolute top-3.5 right-3.5 text-emerald-800/60 hover:text-emerald-950 p-1"
            title="Dismiss guide"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Beginner Guide: How Your Projects Flow</span>
          </div>

          <div className="beginner-flow-grid mt-3 text-xs" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[12px] mb-2">
                  1
                </span>
                <strong className="text-neutral-900 block font-bold text-[13px]">Enquiry & Survey</strong>
                <p className="text-neutral-500 text-[11px] mt-1 leading-relaxed">
                  Record client requirements and site area measurements.
                </p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[12px] mb-2">
                  2
                </span>
                <strong className="text-neutral-900 block font-bold text-[13px]">Quotation & Advance</strong>
                <p className="text-neutral-500 text-[11px] mt-1 leading-relaxed">
                  Set prices for plants, grass, soil & collect client advance.
                </p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[12px] mb-2">
                  3
                </span>
                <strong className="text-neutral-900 block font-bold text-[13px]">Daily Site Work</strong>
                <p className="text-neutral-500 text-[11px] mt-1 leading-relaxed">
                  Log worker count, daily wages, notes & site photos.
                </p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[12px] mb-2">
                  4
                </span>
                <strong className="text-neutral-900 block font-bold text-[13px]">Completion & P&L</strong>
                <p className="text-neutral-500 text-[11px] mt-1 leading-relaxed">
                  Collect final balance and see your true project profit.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Minimal KPI Numbers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span className="font-semibold text-neutral-700">Financial Snapshot</span>
          <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg text-[11px]">
            <button
              onClick={() => handleSetKpiMode('cards')}
              className={`px-2 py-0.5 rounded ${kpiMode === 'cards' ? 'bg-white font-bold text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
            >
              Cards
            </button>
            <button
              onClick={() => handleSetKpiMode('compact')}
              className={`px-2 py-0.5 rounded ${kpiMode === 'compact' ? 'bg-white font-bold text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
            >
              Minimal
            </button>
            <button
              onClick={() => handleSetKpiMode(kpiMode === 'collapsed' ? 'cards' : 'collapsed')}
              className={`px-2 py-0.5 rounded ${kpiMode === 'collapsed' ? 'bg-white font-bold text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
            >
              {kpiMode === 'collapsed' ? 'Expand' : 'Hide'}
            </button>
          </div>
        </div>
        <KpiOverview mode={kpiMode} onExpand={() => handleSetKpiMode('cards')} />
      </div>

      {/* 4. Payment Reminder Drawer (Progressive Disclosure - Kept Quiet Unless Needed) */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-neutral-900 block">Pending Client Payments Desk</span>
            <span className="text-neutral-500">
              Track outstanding balances, milestones due, and send payment reminders.
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowPendingDesk(!showPendingDesk)}
          className="px-3.5 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors self-start sm:self-auto shrink-0 flex items-center gap-1.5"
        >
          <span>{showPendingDesk ? 'Hide Payment Desk' : 'Open Payment Desk'}</span>
          {showPendingDesk ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {showPendingDesk && (
        <div className="transition-all">
          <PendingCollectionsModule />
        </div>
      )}

      {/* 5. Minimal Filter & Search Bar */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search projects or clients..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all placeholder:text-neutral-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Friendly Stage Tabs & View Mode Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1">
            {[
              { key: 'all', label: 'All Jobs' },
              { key: 'in_progress', label: 'On-Site Work' },
              { key: 'planning', label: 'Planning' },
              { key: 'completed', label: 'Completed' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStageFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  stageFilter === tab.key
                    ? 'bg-neutral-900 text-white shadow-xs font-bold'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-neutral-200 mx-1" />

          {/* Grid vs Table Toggle */}
          <div className="bg-neutral-100 p-0.5 rounded-lg flex items-center border border-neutral-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Projects List / Table (Matching DreamsPOS standard table layout) */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-xs">
          <FolderPlus className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-900">No Matching Projects</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
            {searchQuery
              ? `No project matched "${searchQuery}". Clear your search to see all active jobs.`
              : 'There are no projects in this category right now.'}
          </p>
          <button
            onClick={onOpenNewProject}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-theme-primary rounded-lg"
          >
            Create Your First Project
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-3.5 text-left">Code</th>
                  <th className="py-3 px-3.5 text-left">Project Name & Client</th>
                  <th className="py-3 px-3 text-left">Supervisor</th>
                  <th className="py-3 px-3 text-center">Stage Status</th>
                  <th className="py-3 px-3 text-right">Contract Budget</th>
                  <th className="py-3 px-3 text-right">Collected</th>
                  <th className="py-3 px-3 text-right">Outstanding Due</th>
                  <th className="py-3 px-3 text-right">Realized Profit</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProjects.map(project => {
                  const fin = calculateProjectFinancials(project);
                  const stage = getSimpleStageBadge(project.currentStage);

                  return (
                    <tr
                      key={project.id}
                      onClick={() => selectProject(project.id)}
                      className="hover:bg-neutral-50/70 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3.5 text-left">
                        <span className="font-mono text-[11px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                          {project.code}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-left">
                        <div className="font-bold text-neutral-900 hover:text-primary transition-colors">
                          {project.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {project.step1Enquiry.clientName} · {project.step1Enquiry.city || 'Bangalore'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-left">
                        <div className="flex items-center gap-1.5 text-neutral-700 font-medium">
                          <HardHat className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{project.step4Planning.supervisorName || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${stage.bg}`}>
                          {stage.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-neutral-900 tabular-nums">
                        {formatCurrency(fin.totalContractValue, currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-emerald-800 tabular-nums">
                        {formatCurrency(fin.totalCollected, currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-amber-800 tabular-nums">
                        {formatCurrency(fin.outstandingReceivable, currency)}
                      </td>
                      <td className={`py-3 px-3 text-right font-bold tabular-nums ${fin.realizedProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                        {formatCurrency(fin.realizedProfit, currency)}
                      </td>
                      <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => selectProject(project.id)}
                          className="btn btn-sm btn-outline-primary py-1 px-2.5 fs-11 fw-semibold shadow-none"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredProjects.map(project => {
            const fin = calculateProjectFinancials(project);
            const stage = getSimpleStageBadge(project.currentStage);

            return (
              <div
                key={project.id}
                onClick={() => selectProject(project.id)}
                className="group bg-white border border-neutral-200 hover:border-amber-400 rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Code & Plain Stage Badge */}
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-mono text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
                      {project.code}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${stage.bg}`}>
                      {stage.label}
                    </span>
                  </div>

                  {/* Title & Client */}
                  <div>
                    <h3 className="text-base font-extrabold text-neutral-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                      <span className="font-medium text-neutral-700">{project.step1Enquiry.clientName}</span>
                      <span>·</span>
                      <span>{project.step1Enquiry.city || 'Bangalore'}</span>
                    </div>
                  </div>

                  {/* Simple Budget & Payment Progress Bar */}
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-neutral-500">Contract Budget</span>
                      <span className="font-bold text-neutral-900 font-mono">
                        {formatCurrency(fin.totalContractValue, currency)}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200/70 rounded-full h-2 overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, fin.collectionProgressPercent)}%` }}
                        className="bg-emerald-600 h-full rounded-full transition-all"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span className="text-emerald-700 font-semibold">
                        {formatCurrency(fin.totalCollected, currency)} paid ({fin.collectionProgressPercent}%)
                      </span>
                      <span>
                        {formatCurrency(fin.outstandingReceivable, currency)} due
                      </span>
                    </div>
                  </div>

                  {/* Lead Supervisor & Site Visits Note */}
                  <div className="text-xs text-neutral-500 flex items-center justify-between flex-wrap gap-1">
                    <span className="flex items-center gap-1">
                      <HardHat className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{project.step4Planning.supervisorName || 'Lead Unassigned'}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {project.siteVisitAppointments && project.siteVisitAppointments.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          <span>{project.siteVisitAppointments.length} visit{project.siteVisitAppointments.length > 1 ? 's' : ''}</span>
                        </span>
                      )}
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {project.step5DailyOperations.length} site logs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Card Action Button */}
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <div className="text-xs text-neutral-400">
                    Profit: <strong className="text-emerald-800 font-mono">{formatCurrency(fin.realizedProfit, currency)}</strong>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-bold text-neutral-800 group-hover:bg-theme-primary group-hover:text-white rounded-lg transition-all flex items-center gap-1"
                  >
                    <span>Open Project</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
