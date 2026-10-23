import React, { useState, useMemo, useRef } from 'react';
import { LandscapingProject, ProjectMilestone } from '../../types/landscaping';
import { useProjects } from '../../context/ProjectContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Flag,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  ArrowRight,
  TrendingUp,
  Sliders,
} from 'lucide-react';

interface ProjectGanttTimelineProps {
  project: LandscapingProject;
  onClose?: () => void;
  isModalView?: boolean;
}

type ZoomLevel = 'days' | 'weeks' | 'months';

const PHASES = [
  'Site Clearing & Earthwork',
  'Sub-base & Soil Enrichment',
  'Hardscaping & Masonry',
  'Irrigation & Hydraulics',
  'Planting & Specimen Trees',
  'Lawn Turf Installation',
  'Lighting & Features',
  'Handover & Punch List',
];

export const ProjectGanttTimeline: React.FC<ProjectGanttTimelineProps> = ({
  project,
  onClose,
  isModalView = false,
}) => {
  const { updateProjectStep } = useProjects();
  const milestones = project.step4Planning.milestones || [];

  // State
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('days');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState<ProjectMilestone | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form State for Add / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formPhase, setFormPhase] = useState('Site Clearing & Earthwork');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formProgress, setFormProgress] = useState(0);
  const [formStatus, setFormStatus] = useState<ProjectMilestone['status']>('Pending');
  const [formAssignee, setFormAssignee] = useState(project.step4Planning.supervisorName || 'Site Supervisor');
  const [formNotes, setFormNotes] = useState('');

  // Scroll Container Ref
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);

  // Today reference (Current environment time in 2026)
  const todayStr = '2026-10-19';
  const todayTime = new Date(todayStr).getTime();

  // Calculate overall timeline boundary dates
  const { startDate, endDate, totalDays, dateList } = useMemo(() => {
    if (milestones.length === 0) {
      const baseStart = new Date(todayStr);
      baseStart.setDate(baseStart.getDate() - 5);
      const baseEnd = new Date(todayStr);
      baseEnd.setDate(baseEnd.getDate() + 25);
      return {
        startDate: baseStart,
        endDate: baseEnd,
        totalDays: 30,
        dateList: [],
      };
    }

    let minTime = Infinity;
    let maxTime = -Infinity;

    milestones.forEach(m => {
      const s = new Date(m.startDate).getTime();
      const e = new Date(m.targetEndDate).getTime();
      if (!isNaN(s) && s < minTime) minTime = s;
      if (!isNaN(e) && e > maxTime) maxTime = e;
    });

    // Pad 3 days before min and 5 days after max for pleasant breathing room
    const sDate = new Date(minTime);
    sDate.setDate(sDate.getDate() - 3);

    const eDate = new Date(maxTime);
    eDate.setDate(eDate.getDate() + 5);

    const diffDays = Math.max(14, Math.ceil((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Generate list of day dates
    const dList: Date[] = [];
    for (let i = 0; i <= diffDays; i++) {
      const d = new Date(sDate);
      d.setDate(d.getDate() + i);
      dList.push(d);
    }

    return {
      startDate: sDate,
      endDate: eDate,
      totalDays: diffDays,
      dateList: dList,
    };
  }, [milestones]);

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return milestones.filter(m => {
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchesSearch =
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.assignee && m.assignee.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.phase && m.phase.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [milestones, statusFilter, searchTerm]);

  // Overall schedule statistics
  const stats = useMemo(() => {
    const total = milestones.length;
    if (total === 0) return { completed: 0, inProgress: 0, pending: 0, delayed: 0, overallProgress: 0 };

    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    let delayed = 0;
    let progressSum = 0;

    milestones.forEach(m => {
      progressSum += m.progressPercent || 0;
      if (m.status === 'Completed') completed++;
      else if (m.status === 'In Progress') inProgress++;
      else if (m.status === 'Delayed') delayed++;
      else pending++;
    });

    return {
      total,
      completed,
      inProgress,
      pending,
      delayed,
      overallProgress: Math.round(progressSum / total),
    };
  }, [milestones]);

  // Handle Save New Milestone
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newMilestone: ProjectMilestone = {
      id: `m-${Date.now()}`,
      title: formTitle.trim(),
      phase: formPhase,
      startDate: formStartDate || todayStr,
      targetEndDate: formEndDate || todayStr,
      progressPercent: Number(formProgress) || 0,
      status: formStatus,
      assignee: formAssignee.trim() || 'Site Supervisor',
      notes: formNotes.trim(),
    };

    const updated = [...milestones, newMilestone];
    updateProjectStep(project.id, 'step4Planning', {
      ...project.step4Planning,
      milestones: updated,
    });

    setShowAddModal(false);
    resetForm();
  };

  // Handle Edit Milestone
  const handleUpdateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone) return;

    const updatedList = milestones.map(m => {
      if (m.id === selectedMilestone.id) {
        return {
          ...m,
          title: formTitle.trim(),
          phase: formPhase,
          startDate: formStartDate,
          targetEndDate: formEndDate,
          progressPercent: Number(formProgress),
          status: formStatus,
          assignee: formAssignee.trim(),
          notes: formNotes.trim(),
        };
      }
      return m;
    });

    updateProjectStep(project.id, 'step4Planning', {
      ...project.step4Planning,
      milestones: updatedList,
    });

    setShowEditModal(false);
    setSelectedMilestone(null);
    resetForm();
  };

  // Handle Delete Milestone
  const handleDeleteMilestone = (id: string) => {
    if (confirm('Delete this milestone from project schedule?')) {
      const updated = milestones.filter(m => m.id !== id);
      updateProjectStep(project.id, 'step4Planning', {
        ...project.step4Planning,
        milestones: updated,
      });
      if (selectedMilestone?.id === id) setSelectedMilestone(null);
    }
  };

  // Quick Toggle Milestone Complete
  const handleToggleComplete = (m: ProjectMilestone) => {
    const isNowComplete = m.status !== 'Completed';
    const updated = milestones.map(item => {
      if (item.id === m.id) {
        return {
          ...item,
          status: (isNowComplete ? 'Completed' : 'In Progress') as ProjectMilestone['status'],
          progressPercent: isNowComplete ? 100 : Math.max(50, item.progressPercent),
        };
      }
      return item;
    });

    updateProjectStep(project.id, 'step4Planning', {
      ...project.step4Planning,
      milestones: updated,
    });
  };

  // Open Edit Modal with selected milestone
  const openEditModal = (m: ProjectMilestone) => {
    setSelectedMilestone(m);
    setFormTitle(m.title);
    setFormPhase(m.phase || 'Site Clearing & Earthwork');
    setFormStartDate(m.startDate);
    setFormEndDate(m.targetEndDate);
    setFormProgress(m.progressPercent);
    setFormStatus(m.status);
    setFormAssignee(m.assignee || project.step4Planning.supervisorName || 'Site Supervisor');
    setFormNotes(m.notes || '');
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormTitle('');
    setFormPhase('Site Clearing & Earthwork');
    setFormStartDate(todayStr);
    setFormEndDate(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);
    setFormProgress(0);
    setFormStatus('Pending');
    setFormAssignee(project.step4Planning.supervisorName || 'Site Supervisor');
    setFormNotes('');
  };

  // Column width based on zoom
  const colWidth = zoomLevel === 'days' ? 36 : zoomLevel === 'weeks' ? 70 : 120;
  const gridWidth = dateList.length * colWidth;

  // Calculate Bar Position and Width
  const calculateBarMetrics = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const base = startDate.getTime();
    const msPerDay = 1000 * 60 * 60 * 24;

    const offsetDays = Math.max(0, (s - base) / msPerDay);
    const durationDays = Math.max(1, (e - s) / msPerDay + 1);

    const left = offsetDays * colWidth;
    const width = Math.max(colWidth * 0.9, durationDays * colWidth);

    return { left, width, durationDays: Math.round(durationDays) };
  };

  // Calculate Today Marker Position
  const todayOffsetDays = (todayTime - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const todayLeft = todayOffsetDays * colWidth;

  // Status Styling Helpers
  const getStatusBadge = (status: ProjectMilestone['status']) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      case 'Delayed':
        return (
          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Delayed
          </span>
        );
      default:
        return (
          <span className="bg-neutral-100 text-neutral-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
            Pending
          </span>
        );
    }
  };

  const getBarColor = (status: ProjectMilestone['status'], progress: number) => {
    switch (status) {
      case 'Completed':
        return {
          barBg: 'bg-emerald-600',
          trackBg: 'bg-emerald-100',
          border: 'border-emerald-700',
          text: 'text-white',
        };
      case 'In Progress':
        return {
          barBg: 'bg-emerald-700',
          trackBg: 'bg-emerald-100',
          border: 'border-emerald-800',
          text: 'text-white',
        };
      case 'Delayed':
        return {
          barBg: 'bg-rose-600',
          trackBg: 'bg-rose-100',
          border: 'border-rose-700',
          text: 'text-white',
        };
      default:
        return {
          barBg: 'bg-neutral-500',
          trackBg: 'bg-neutral-200',
          border: 'border-neutral-400',
          text: 'text-white',
        };
    }
  };

  return (
    <div className={`space-y-4 ${isModalView ? '' : 'bg-white border border-neutral-200 rounded-xl p-5 shadow-xs'}`}>
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <span>Gantt Chart & Milestone Timeline</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  {stats.overallProgress}% Overall Progress
                </span>
              </h3>
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Track project phases, scheduled milestones, site excavation, planting windows, and target handover deadlines.
          </p>
        </div>

        {/* Top Actions & Zoom Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom Switcher */}
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg text-xs border border-neutral-200">
            <button
              onClick={() => setZoomLevel('days')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                zoomLevel === 'days' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-600'
              }`}
            >
              Days
            </button>
            <button
              onClick={() => setZoomLevel('weeks')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                zoomLevel === 'weeks' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-600'
              }`}
            >
              Weeks
            </button>
          </div>

          {/* Add Milestone CTA */}
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Milestone</span>
          </button>

          {isModalView && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
          <span className="text-[11px] text-neutral-500 block">Overall Completion</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg font-bold text-neutral-900 tabular-nums">{stats.overallProgress}%</span>
            <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all"
                style={{ width: `${stats.overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
          <span className="text-[11px] text-neutral-500 block">Total Milestones</span>
          <span className="text-lg font-bold text-neutral-900 tabular-nums mt-0.5 block">{stats.total}</span>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
          <span className="text-[11px] text-neutral-500 block">Completed</span>
          <span className="text-lg font-bold text-emerald-800 tabular-nums mt-0.5 block">{stats.completed}</span>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
          <span className="text-[11px] text-neutral-500 block">In Progress</span>
          <span className="text-lg font-bold text-blue-700 tabular-nums mt-0.5 block">{stats.inProgress}</span>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
          <span className="text-[11px] text-neutral-500 block">Scheduled Days</span>
          <span className="text-lg font-bold text-neutral-800 tabular-nums mt-0.5 block">
            {totalDays} <span className="text-xs font-normal text-neutral-500">days</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['all', 'In Progress', 'Completed', 'Pending', 'Delayed'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {st === 'all' ? `All Tasks (${milestones.length})` : st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search milestones..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-1 text-xs border border-neutral-300 rounded-lg w-44 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>
      </div>

      {/* Gantt Interactive Workspace */}
      <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs">
        {/* Main Grid View */}
        <div className="flex divide-x divide-neutral-200 min-h-[380px]">
          {/* Left Column: Tasks List */}
          <div className="w-80 shrink-0 flex flex-col bg-neutral-50/50">
            {/* Header row */}
            <div className="h-14 px-3.5 border-b border-neutral-200 flex items-center justify-between font-bold text-xs text-neutral-700 bg-neutral-100/70">
              <span>Milestone & Phase</span>
              <span className="text-neutral-400 font-normal">Progress</span>
            </div>

            {/* Task Items */}
            <div className="divide-y divide-neutral-100 overflow-y-auto">
              {filteredMilestones.map((m, idx) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMilestone(m)}
                  className={`h-16 px-3.5 flex items-center justify-between cursor-pointer transition-colors group ${
                    selectedMilestone?.id === m.id
                      ? 'bg-emerald-50/80 border-l-4 border-emerald-700'
                      : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleToggleComplete(m);
                        }}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          m.status === 'Completed'
                            ? 'bg-emerald-700 border-emerald-700 text-white'
                            : 'border-neutral-300 hover:border-neutral-400 bg-white'
                        }`}
                        title={m.status === 'Completed' ? 'Mark Incomplete' : 'Mark Complete'}
                      >
                        {m.status === 'Completed' && <Check className="w-3 h-3" />}
                      </button>
                      <h4
                        className={`text-xs font-bold truncate ${
                          m.status === 'Completed' ? 'line-through text-neutral-400' : 'text-neutral-900'
                        }`}
                        title={m.title}
                      >
                        {m.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-1 pl-5.5">
                      <span className="font-mono">{m.startDate.slice(5)} → {m.targetEndDate.slice(5)}</span>
                      <span>·</span>
                      <span className="truncate max-w-[80px]">{m.assignee || 'Supervisor'}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span className="text-[11px] font-bold text-neutral-700 tabular-nums">
                      {m.progressPercent}%
                    </span>
                    <div className="w-12 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${m.status === 'Completed' ? 'bg-emerald-600' : 'bg-emerald-700'}`}
                        style={{ width: `${m.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Horizontal Gantt Matrix */}
          <div ref={timelineScrollRef} className="flex-1 overflow-x-auto relative bg-white">
            <div style={{ width: `${Math.max(gridWidth, 650)}px` }} className="relative select-none">
              {/* Timeline Header Row (Days & Months) */}
              <div className="h-14 border-b border-neutral-200 bg-neutral-50/80 flex flex-col justify-between sticky top-0 z-20">
                {/* Month or Week Title labels */}
                <div className="flex border-b border-neutral-200/60 px-2 py-1 text-[11px] font-bold text-neutral-600">
                  <span>Project Schedule Matrix · October – November 2026</span>
                </div>

                {/* Day / Column Headers */}
                <div className="flex h-7 divide-x divide-neutral-100 text-[10px]">
                  {dateList.map((d, i) => {
                    const isToday = d.toISOString().split('T')[0] === todayStr;
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                    return (
                      <div
                        key={i}
                        style={{ width: `${colWidth}px` }}
                        className={`shrink-0 flex flex-col items-center justify-center font-mono ${
                          isToday
                            ? 'bg-emerald-700 text-white font-bold'
                            : isWeekend
                            ? 'bg-neutral-100/60 text-neutral-400'
                            : 'text-neutral-600'
                        }`}
                        title={d.toDateString()}
                      >
                        <span className="leading-none">{d.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vertical Grid Columns Background */}
              <div className="absolute top-14 bottom-0 left-0 right-0 flex divide-x divide-neutral-100 pointer-events-none z-0">
                {dateList.map((d, i) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div
                      key={i}
                      style={{ width: `${colWidth}px` }}
                      className={`shrink-0 h-full ${isWeekend ? 'bg-neutral-50/40' : ''}`}
                    />
                  );
                })}
              </div>

              {/* Today's Vertical Marker Line */}
              {todayLeft >= 0 && (
                <div
                  style={{ left: `${todayLeft}px` }}
                  className="absolute top-0 bottom-0 z-25 pointer-events-none flex flex-col items-center"
                >
                  <div className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-800 text-white shadow-xs uppercase tracking-wider">
                    Today
                  </div>
                  <div className="w-0.5 flex-1 bg-emerald-600/80 dashed-border shadow-xs" />
                </div>
              )}

              {/* Gantt Milestone Bars */}
              <div className="divide-y divide-neutral-100 relative z-10">
                {filteredMilestones.map(m => {
                  const { left, width, durationDays } = calculateBarMetrics(m.startDate, m.targetEndDate);
                  const colors = getBarColor(m.status, m.progressPercent);

                  return (
                    <div
                      key={m.id}
                      className="h-16 relative flex items-center group cursor-pointer"
                      onClick={() => openEditModal(m)}
                    >
                      {/* Gantt Bar */}
                      <div
                        style={{ left: `${left}px`, width: `${width}px` }}
                        className={`absolute h-8 rounded-lg shadow-2xs border ${colors.border} ${colors.trackBg} overflow-hidden transition-all duration-150 group-hover:ring-2 group-hover:ring-emerald-700/40`}
                      >
                        {/* Progress Fill */}
                        <div
                          style={{ width: `${m.progressPercent}%` }}
                          className={`h-full ${colors.barBg} transition-all duration-300`}
                        />

                        {/* Text inside the bar */}
                        <div className="absolute inset-0 px-2 flex items-center justify-between text-[11px] font-bold pointer-events-none">
                          <span className={`truncate ${m.progressPercent > 50 ? 'text-white' : 'text-neutral-900'}`}>
                            {m.title}
                          </span>
                          <span
                            className={`text-[10px] tabular-nums font-mono pl-1 ${
                              m.progressPercent > 80 ? 'text-white' : 'text-neutral-700'
                            }`}
                          >
                            {m.progressPercent}% · {durationDays}d
                          </span>
                        </div>
                      </div>

                      {/* Hover Tooltip Card */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-12 left-4 z-30 pointer-events-none bg-neutral-900 text-white p-2 rounded-lg text-xs shadow-xl min-w-[200px]">
                        <div className="font-bold">{m.title}</div>
                        <div className="text-[11px] text-neutral-300 mt-0.5">
                          {m.startDate} → {m.targetEndDate} ({durationDays} days)
                        </div>
                        <div className="text-[11px] text-emerald-400 mt-0.5">
                          Status: {m.status} ({m.progressPercent}%)
                        </div>
                        {m.assignee && (
                          <div className="text-[10px] text-neutral-400 mt-0.5">Assignee: {m.assignee}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Milestone Actions Footer */}
      {selectedMilestone && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-900">{selectedMilestone.title}</span>
              {getStatusBadge(selectedMilestone.status)}
              <span className="text-xs font-mono text-neutral-500">
                {selectedMilestone.startDate} → {selectedMilestone.targetEndDate}
              </span>
            </div>
            {selectedMilestone.notes && (
              <p className="text-xs text-neutral-600 mt-1">{selectedMilestone.notes}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openEditModal(selectedMilestone)}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Milestone</span>
            </button>
            <button
              onClick={() => handleDeleteMilestone(selectedMilestone.id)}
              className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Milestone Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-neutral-200 shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    {showAddModal ? 'Add Project Milestone' : 'Edit Milestone Schedule'}
                  </h3>
                  <p className="text-[11px] text-neutral-500">Plan milestones and deadlines for {project.code}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={showAddModal ? handleAddMilestone : handleUpdateMilestone} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lawn Turf Sod Laying & Heavy Compaction"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">Project Phase</label>
                  <select
                    value={formPhase}
                    onChange={e => setFormPhase(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
                  >
                    {PHASES.map(p => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed / At Risk</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">Target Completion Date</label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-neutral-700">
                  <span>Current Progress:</span>
                  <span className="text-emerald-800 font-bold tabular-nums">{formProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formProgress}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setFormProgress(val);
                    if (val === 100) setFormStatus('Completed');
                    else if (val > 0 && formStatus === 'Pending') setFormStatus('In Progress');
                  }}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">Assignee / Lead Contractor</label>
                <input
                  type="text"
                  placeholder="e.g. Raghavan K. / Turf Masonry Crew"
                  value={formAssignee}
                  onChange={e => setFormAssignee(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">Scope Notes / Milestones Criteria</label>
                <textarea
                  rows={2}
                  placeholder="Special instructions, water requirements, or weather constraints..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{showAddModal ? 'Save Milestone' : 'Update Milestone'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
