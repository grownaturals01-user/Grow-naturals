import React, { useState, useMemo } from 'react';
import { useProjects } from '../../context/ProjectContext';
import {
  CompanyResource,
  ResourceAssignment,
} from '../../types/landscaping';
import { formatCurrency } from '../../utils/calculations';
import { AssignResourceModal } from '../resources/AssignResourceModal';
import { AddResourceModal } from '../resources/AddResourceModal';
import { ConflictResolutionDrawer } from '../resources/ConflictResolutionDrawer';
import {
  HardHat,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Layers,
  User,
  ArrowRight,
  DollarSign,
  Users,
  Info,
  CalendarDays,
  UserCheck,
} from 'lucide-react';

interface ResourceAllocationViewProps {
  initialProjectId?: string;
}

// Helper to safely get dates in range without timezone offset shifts
function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const curr = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

export const ResourceAllocationView: React.FC<ResourceAllocationViewProps> = ({
  initialProjectId,
}) => {
  const {
    projects,
    companyResources,
    resourceAssignments,
    resourceConflicts,
    currency,
  } = useProjects();

  // Active converted projects
  const activeProjects = useMemo(
    () => projects.filter(p => p.isConvertedToProject),
    [projects]
  );

  // View Controls
  const [viewMode, setViewMode] = useState<'matrix' | 'roster' | 'agenda'>('matrix');
  const [matrixRangeDays, setMatrixRangeDays] = useState<7 | 14>(7);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterProjectId, setFilterProjectId] = useState<string>(initialProjectId || 'all');
  const [filterConflictOnly, setFilterConflictOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Availability Filter State: 'all' | 'available_only' for a selected date
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available_only'>('all');
  const [selectedFilterDate, setSelectedFilterDate] = useState<string>('2026-10-23');

  // Date Navigation (defaults to starting on 2026-10-22 to encompass sample data dates)
  const [baseDate, setBaseDate] = useState<Date>(() => {
    return new Date('2026-10-22T00:00:00');
  });

  // Modals state
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showAddResourceModal, setShowAddResourceModal] = useState<boolean>(false);
  const [showConflictDrawer, setShowConflictDrawer] = useState<boolean>(false);
  const [activeAssignmentToEdit, setActiveAssignmentToEdit] = useState<ResourceAssignment | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>(undefined);
  const [prefilledResourceId, setPrefilledResourceId] = useState<string | undefined>(undefined);

  // =========================================================================
  // MULTI-TASK VALIDATION LAYER:
  // Detects if a team member is assigned to multiple project tasks on the same date
  // =========================================================================
  const multiTaskValidationMap = useMemo(() => {
    const map = new Map<string, ResourceAssignment[]>();
    resourceAssignments.forEach(asg => {
      const dates = getDatesInRange(asg.startDate, asg.endDate);
      dates.forEach(dateStr => {
        const key = `${asg.resourceId}_${dateStr}`;
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(asg);
      });
    });
    return map;
  }, [resourceAssignments]);

  // Aggregate multi-task collision metrics across the company
  const multiTaskCollisionSummary = useMemo(() => {
    let collisionDaysCount = 0;
    const conflictedMemberIds = new Set<string>();

    multiTaskValidationMap.forEach((assignments, key) => {
      if (assignments.length > 1) {
        collisionDaysCount++;
        const [memberId] = key.split('_');
        if (memberId) conflictedMemberIds.add(memberId);
      }
    });

    return {
      collisionDaysCount,
      conflictedMembersCount: conflictedMemberIds.size,
      conflictedMemberIds,
    };
  }, [multiTaskValidationMap]);

  // Formatted display for selected filter date
  const selectedDateFormatted = useMemo(() => {
    const d = new Date(`${selectedFilterDate}T00:00:00`);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [selectedFilterDate]);

  // Check if a member is completely free / available on a given date
  const isMemberAvailableOnDate = (memberId: string, dateStr: string): boolean => {
    const tasks = multiTaskValidationMap.get(`${memberId}_${dateStr}`) || [];
    return tasks.length === 0;
  };

  // Counts of available vs booked members on selectedFilterDate
  const availableMembersOnSelectedDate = useMemo(() => {
    return companyResources.filter(res => isMemberAvailableOnDate(res.id, selectedFilterDate));
  }, [companyResources, multiTaskValidationMap, selectedFilterDate]);

  const bookedMembersOnSelectedDate = useMemo(() => {
    return companyResources.filter(res => !isMemberAvailableOnDate(res.id, selectedFilterDate));
  }, [companyResources, multiTaskValidationMap, selectedFilterDate]);

  // Team Member Categories for quick filtering
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    companyResources.forEach(r => {
      if (r.category) cats.add(r.category);
    });
    return Array.from(cats);
  }, [companyResources]);

  // Generate Date Columns for Timeline Matrix
  const dateColumns = useMemo(() => {
    const dates: Array<{ dateStr: string; dayName: string; formatted: string; isToday: boolean }> = [];
    const todayStr = '2026-10-22'; // Application reference date

    for (let i = 0; i < matrixRangeDays; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      dates.push({
        dateStr,
        dayName,
        formatted,
        isToday: dateStr === todayStr,
      });
    }
    return dates;
  }, [baseDate, matrixRangeDays]);

  const handlePrevDates = () => {
    const next = new Date(baseDate);
    next.setDate(baseDate.getDate() - matrixRangeDays);
    setBaseDate(next);
  };

  const handleNextDates = () => {
    const next = new Date(baseDate);
    next.setDate(baseDate.getDate() + matrixRangeDays);
    setBaseDate(next);
  };

  const handleGoToToday = () => {
    setBaseDate(new Date('2026-10-22T00:00:00'));
    setSelectedFilterDate('2026-10-22');
  };

  // Filtered Company Team Resources (Applying Search, Category, Conflict, and Availability Filter)
  const filteredResources = useMemo(() => {
    return companyResources.filter(res => {
      // 1. Availability filter for selected date
      if (availabilityFilter === 'available_only') {
        const isFree = isMemberAvailableOnDate(res.id, selectedFilterDate);
        if (!isFree) return false;
      }

      // 2. Category filter
      if (filterCategory !== 'all' && res.category !== filterCategory) return false;

      // 3. Search query
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          res.name.toLowerCase().includes(q) ||
          res.roleOrModel.toLowerCase().includes(q) ||
          res.category.toLowerCase().includes(q) ||
          (res.specsOrSkills && res.specsOrSkills.some(s => s.toLowerCase().includes(q)));
        if (!match) return false;
      }

      // 4. Conflict-only filter
      if (filterConflictOnly) {
        const isConflicted =
          resourceConflicts.some(c => c.resourceId === res.id) ||
          multiTaskCollisionSummary.conflictedMemberIds.has(res.id);
        if (!isConflicted) return false;
      }

      return true;
    });
  }, [
    companyResources,
    availabilityFilter,
    selectedFilterDate,
    filterCategory,
    searchTerm,
    filterConflictOnly,
    resourceConflicts,
    multiTaskCollisionSummary.conflictedMemberIds,
    multiTaskValidationMap,
  ]);

  // Filtered Assignments for Agenda List
  const filteredAssignments = useMemo(() => {
    return resourceAssignments.filter(asg => {
      if (filterProjectId !== 'all' && asg.projectId !== filterProjectId) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          asg.resourceName.toLowerCase().includes(q) ||
          asg.projectCode.toLowerCase().includes(q) ||
          asg.projectTitle.toLowerCase().includes(q) ||
          asg.taskRole.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterConflictOnly && asg.status !== 'Conflict_Detected') {
        const inConflict = resourceConflicts.some(c =>
          c.assignments.some(a => a.id === asg.id)
        );
        const hasDateCollision = getDatesInRange(asg.startDate, asg.endDate).some(d => {
          const tasks = multiTaskValidationMap.get(`${asg.resourceId}_${d}`) || [];
          return tasks.length > 1;
        });
        if (!inConflict && !hasDateCollision) return false;
      }
      return true;
    });
  }, [
    resourceAssignments,
    filterProjectId,
    searchTerm,
    filterConflictOnly,
    resourceConflicts,
    multiTaskValidationMap,
  ]);

  // Total metrics
  const totalTeamMembers = companyResources.length;
  const activeAssignmentsCount = resourceAssignments.length;
  const totalDailyCommittedCost = resourceAssignments.reduce(
    (sum, a) => sum + (a.dailyCost || 0),
    0
  );

  const handleCellClick = (res: CompanyResource, dateStr: string) => {
    setPrefilledResourceId(res.id);
    setPrefilledDate(dateStr);
    setActiveAssignmentToEdit(null);
    setShowAssignModal(true);
  };

  const handleEditAssignment = (asg: ResourceAssignment, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveAssignmentToEdit(asg);
    setPrefilledResourceId(asg.resourceId);
    setPrefilledDate(asg.startDate);
    setShowAssignModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* 1. Header & Summary Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            <span>Team Member Allocation & Scheduling</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight mt-0.5">
            Team Member Allocation & Conflict Prevention
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Assign site supervisors, landscape architects, irrigation leads, and specialist craftsmen across active projects with instant double-booking prevention.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {multiTaskCollisionSummary.collisionDaysCount > 0 && (
            <button
              onClick={() => setShowConflictDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs animate-pulse"
              title="Resolve multi-task double-booking conflicts"
            >
              <AlertTriangle className="w-4 h-4 text-white" />
              <span>
                Resolve {multiTaskCollisionSummary.collisionDaysCount} Multi-Task Conflict
                {multiTaskCollisionSummary.collisionDaysCount > 1 ? 's' : ''}
              </span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveAssignmentToEdit(null);
              setPrefilledDate(selectedFilterDate);
              setPrefilledResourceId(undefined);
              setShowAssignModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-all shadow-2xs hover:scale-[1.01]"
            title="Create new member assignment"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Member</span>
          </button>

          {/* Add Team Member Button */}
          <button
            onClick={() => setShowAddResourceModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-xl transition-colors shadow-2xs"
            title="Add new team member to company roster"
          >
            <User className="w-3.5 h-3.5 text-neutral-500" />
            <span>+ Add Team Member</span>
          </button>
        </div>
      </div>

      {/* 2. Validation Layer Alert Strip (When Multiple Tasks On Same Date Detected) */}
      {multiTaskCollisionSummary.collisionDaysCount > 0 ? (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-amber-950 text-sm">
                  Multi-Task Assignment Alert: {multiTaskCollisionSummary.conflictedMembersCount} Team Member
                  {multiTaskCollisionSummary.conflictedMembersCount > 1 ? 's' : ''} Double-Booked On Same Date
                </span>
                <span className="bg-amber-200/90 text-amber-950 font-bold px-2 py-0.5 rounded text-[10px] border border-amber-300">
                  {multiTaskCollisionSummary.collisionDaysCount} Conflicting Date Shifts
                </span>
              </div>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Validation layer identified overlapping site task responsibilities scheduled on identical dates. Hover over any flagged cell in the matrix below to inspect the collision details and reallocate tasks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setShowConflictDrawer(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Review & 1-Click Resolve</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 px-4 shadow-2xs flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold">Schedule Validation Passed:</span> All team members have single-task daily assignments across active job sites.
            </div>
          </div>
          <span className="font-mono text-[11px] font-semibold text-emerald-700">
            {activeAssignmentsCount} Verified Single-Task Shifts
          </span>
        </div>
      )}

      {/* 3. KPI Roster & Deployment Snapshot Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-emerald-700" />
              Team Members
            </span>
            <span className="text-[11px] font-semibold text-emerald-800">
              {totalTeamMembers} on Roster
            </span>
          </div>
          <div className="text-xl font-extrabold text-neutral-900 font-mono">
            {totalTeamMembers}
          </div>
          <div className="text-[11px] text-neutral-400">
            {availableMembersOnSelectedDate.length} available on {selectedDateFormatted}
          </div>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-700" />
              Active Deployments
            </span>
            <span className="text-[11px] font-semibold text-blue-800">
              {activeProjects.length} Projects
            </span>
          </div>
          <div className="text-xl font-extrabold text-neutral-900 font-mono">
            {activeAssignmentsCount}
          </div>
          <div className="text-[11px] text-neutral-400">
            Committed job site shifts
          </div>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-700" />
              Committed Wages
            </span>
            <span className="text-[11px] font-semibold text-amber-800">
              Per Scheduled Day
            </span>
          </div>
          <div className="text-xl font-extrabold text-neutral-900 font-mono">
            {formatCurrency(totalDailyCommittedCost, currency)}
          </div>
          <div className="text-[11px] text-neutral-400">
            Direct team payroll commitment
          </div>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className={`w-3.5 h-3.5 ${multiTaskCollisionSummary.collisionDaysCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
              Validation Status
            </span>
            <span className={`text-[11px] font-semibold ${multiTaskCollisionSummary.collisionDaysCount > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
              {multiTaskCollisionSummary.collisionDaysCount > 0 ? 'Multi-Task Alert' : 'Optimal'}
            </span>
          </div>
          <div className={`text-xl font-extrabold font-mono ${multiTaskCollisionSummary.collisionDaysCount > 0 ? 'text-amber-600' : 'text-emerald-800'}`}>
            {multiTaskCollisionSummary.collisionDaysCount > 0 ? `${multiTaskCollisionSummary.collisionDaysCount} Overlaps` : '100% Conflict-Free'}
          </div>
          <div className="text-[11px] text-neutral-400">
            {multiTaskCollisionSummary.collisionDaysCount > 0 ? 'Assigned multiple tasks same date' : 'Zero multi-task overlaps'}
          </div>
        </div>
      </div>

      {/* 4. Filter & View Switcher Bar (Including Availability Toggle & Date Selector) */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3 text-xs">
        {/* Row 1: Search, Category, Project, Conflict, View Mode */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap flex-1">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search team member by name, role, or skill..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/20 text-xs"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-700 text-xs"
            >
              <option value="all">All Member Roles ({companyResources.length})</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Project Filter */}
            <select
              value={filterProjectId}
              onChange={e => setFilterProjectId(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-700 text-xs"
            >
              <option value="all">All Active Projects ({activeProjects.length})</option>
              {activeProjects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.title}
                </option>
              ))}
            </select>

            {/* Collision Filter Toggle */}
            <button
              onClick={() => setFilterConflictOnly(!filterConflictOnly)}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-semibold transition-colors ${
                filterConflictOnly
                  ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold'
                  : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${filterConflictOnly ? 'text-amber-600' : 'text-neutral-400'}`} />
              <span>Collisions Only ({multiTaskCollisionSummary.conflictedMembersCount})</span>
            </button>
          </div>

          {/* Right View Mode Selector */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="bg-neutral-100 p-0.5 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  viewMode === 'matrix'
                    ? 'bg-white text-emerald-950 font-bold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Timeline Matrix</span>
              </button>
              <button
                onClick={() => setViewMode('roster')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  viewMode === 'roster'
                    ? 'bg-white text-emerald-950 font-bold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Team Roster</span>
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  viewMode === 'agenda'
                    ? 'bg-white text-emerald-950 font-bold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span>Shift Agenda</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
         * Row 2: TOGGLE: 'All Team Members' VS 'Available Members Only' FOR SELECTED DATE
         * ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-150">
          {/* Segmented Availability Filter Toggle */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-neutral-600" />
              <span>Roster View:</span>
            </span>

            <div className="bg-neutral-100 p-0.5 rounded-xl flex items-center text-xs font-semibold border border-neutral-200">
              <button
                type="button"
                onClick={() => setAvailabilityFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  availabilityFilter === 'all'
                    ? 'bg-white text-neutral-950 font-bold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-neutral-500" />
                <span>All Team Members ({companyResources.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAvailabilityFilter('available_only')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  availabilityFilter === 'available_only'
                    ? 'bg-emerald-800 text-white font-bold shadow-2xs'
                    : 'text-neutral-600 hover:text-emerald-900'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${availabilityFilter === 'available_only' ? 'text-emerald-300' : 'text-emerald-700'}`} />
                <span>Available Members Only ({availableMembersOnSelectedDate.length})</span>
              </button>
            </div>
          </div>

          {/* Selected Date Picker for Availability Calculation */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <span className="text-[11px] font-semibold text-neutral-600">Selected Date:</span>
            <div className="flex items-center gap-1.5 bg-neutral-50 hover:bg-white border border-neutral-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-700/20 px-2.5 py-1 rounded-xl shadow-2xs transition-colors">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
              <input
                type="date"
                value={selectedFilterDate}
                onChange={e => {
                  setSelectedFilterDate(e.target.value);
                  // If picked date is outside timeline window, smoothly adjust baseDate
                  const picked = new Date(`${e.target.value}T00:00:00`);
                  if (!isNaN(picked.getTime())) {
                    setBaseDate(picked);
                  }
                }}
                className="bg-transparent text-xs font-mono font-bold text-neutral-900 focus:outline-none cursor-pointer"
                title="Select date to check team availability"
              />
              <span className="text-[11px] text-emerald-900 font-semibold pl-1.5 border-l border-neutral-200">
                {selectedDateFormatted}
              </span>
            </div>

            {/* Quick availability status badge */}
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              {availableMembersOnSelectedDate.length} Idle / {bookedMembersOnSelectedDate.length} Booked
            </span>
          </div>
        </div>
      </div>

      {/* Active Filter Notice Strip When 'Available Members Only' is Active */}
      {availabilityFilter === 'available_only' && (
        <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-950 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Showing <strong>{filteredResources.length} available team members</strong> with zero shift commitments on <strong>{selectedDateFormatted}</strong> ({selectedFilterDate}).
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveAssignmentToEdit(null);
                setPrefilledDate(selectedFilterDate);
                setPrefilledResourceId(filteredResources[0]?.id);
                setShowAssignModal(true);
              }}
              className="text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3 h-3" />
              <span>Assign on {selectedDateFormatted}</span>
            </button>
            <button
              type="button"
              onClick={() => setAvailabilityFilter('all')}
              className="text-xs font-semibold text-emerald-800 hover:underline px-1"
            >
              Reset to All Members
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
       * VIEW 1: INTERACTIVE TIMELINE MATRIX GRID (Main View)
       * ========================================================================= */}
      {viewMode === 'matrix' && (
        <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
          {/* Timeline Range & Navigation Strip */}
          <div className="bg-neutral-50/90 px-4 py-2.5 border-b border-neutral-200 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-800">Schedule Window:</span>
              <span className="font-mono text-emerald-900 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                {dateColumns[0]?.formatted} — {dateColumns[dateColumns.length - 1]?.formatted}
              </span>
              <span className="text-neutral-400">
                ({filteredResources.length} {availabilityFilter === 'available_only' ? 'available' : 'total'} team members)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Range Toggle */}
              <div className="bg-neutral-200/70 p-0.5 rounded-lg flex items-center text-[10px] font-semibold">
                <button
                  onClick={() => setMatrixRangeDays(7)}
                  className={`px-2 py-0.5 rounded ${
                    matrixRangeDays === 7 ? 'bg-white text-neutral-900 font-bold shadow-2xs' : 'text-neutral-500'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setMatrixRangeDays(14)}
                  className={`px-2 py-0.5 rounded ${
                    matrixRangeDays === 14 ? 'bg-white text-neutral-900 font-bold shadow-2xs' : 'text-neutral-500'
                  }`}
                >
                  14 Days
                </button>
              </div>

              <div className="h-4 w-px bg-neutral-300" />

              <button
                onClick={handlePrevDates}
                className="p-1 hover:bg-neutral-200 rounded text-neutral-600 transition-colors"
                title="Previous dates"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleGoToToday}
                className="px-2 py-0.5 text-[11px] font-semibold bg-white border border-neutral-300 hover:bg-neutral-100 rounded text-neutral-700 transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNextDates}
                className="p-1 hover:bg-neutral-200 rounded text-neutral-600 transition-colors"
                title="Next dates"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Matrix Scrollable Container */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs min-w-[850px]">
              {/* Table Column Headers with Clickable Date Selection */}
              <thead>
                <tr className="bg-neutral-100/80 border-b border-neutral-200 text-neutral-700">
                  <th className="py-2.5 px-4 font-bold w-64 sticky left-0 bg-neutral-100 z-20 border-r border-neutral-200">
                    Team Member & Role
                  </th>
                  {dateColumns.map(col => {
                    const isSelected = col.dateStr === selectedFilterDate;

                    return (
                      <th
                        key={col.dateStr}
                        onClick={() => setSelectedFilterDate(col.dateStr)}
                        className={`py-2 px-2.5 text-center font-semibold border-r border-neutral-200 last:border-r-0 cursor-pointer transition-colors group select-none ${
                          isSelected
                            ? 'bg-emerald-100/90 text-emerald-950 font-bold ring-2 ring-emerald-700 ring-inset'
                            : col.isToday
                            ? 'bg-emerald-50 text-emerald-950 font-bold hover:bg-emerald-100/50'
                            : 'hover:bg-neutral-200/60'
                        }`}
                        title={`Click to filter availability for ${col.formatted}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{col.dayName}</span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 inline-block" />
                          )}
                        </div>
                        <div className="font-mono text-xs">{col.formatted}</div>
                        {isSelected && (
                          <div className="text-[9px] font-bold text-emerald-800 tracking-tight mt-0.5">
                            Filter Date
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {filteredResources.length === 0 ? (
                  <tr>
                    <td colSpan={dateColumns.length + 1} className="py-12 text-center text-neutral-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-neutral-300" />
                        <p className="text-sm font-semibold text-neutral-800">
                          {availabilityFilter === 'available_only'
                            ? `No team members are available on ${selectedDateFormatted}.`
                            : 'No team members match the selected filter.'}
                        </p>
                        {availabilityFilter === 'available_only' && (
                          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                            All {companyResources.length} roster members have assigned shifts on this date.
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => setAvailabilityFilter('all')}
                          className="mt-1 text-xs font-semibold text-emerald-800 hover:underline"
                        >
                          View all team members instead
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredResources.map((res, rowIndex) => {
                    const hasAnyCollision = dateColumns.some(col => {
                      const tasks = multiTaskValidationMap.get(`${res.id}_${col.dateStr}`) || [];
                      return tasks.length > 1;
                    });

                    const isAvailableOnSelected = isMemberAvailableOnDate(res.id, selectedFilterDate);

                    return (
                      <tr
                        key={res.id}
                        className={`border-b border-neutral-200 transition-colors ${
                          hasAnyCollision ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-neutral-50/50'
                        }`}
                      >
                        {/* Member Info Cell (Sticky Left) */}
                        <td className="py-2.5 px-4 sticky left-0 bg-white z-10 border-r border-neutral-200 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-neutral-900 truncate">{res.name}</span>
                                {hasAnyCollision && (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                                    title={`Validation Warning: ${res.name} is assigned to multiple project tasks on the same date.`}
                                  >
                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                    <span>Double-Booked</span>
                                  </span>
                                )}
                                {availabilityFilter === 'available_only' && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
                                    <span>Free on {selectedDateFormatted.split(',')[0]}</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-neutral-500 truncate">{res.roleOrModel}</div>
                              <div className="text-[10px] text-neutral-400 font-mono">
                                {formatCurrency(res.dailyRate, currency)}/day · {res.category}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Date Day Cells */}
                        {dateColumns.map(col => {
                          // All tasks for this member on this date regardless of project filter
                          const allTasksForMemberOnDate =
                            multiTaskValidationMap.get(`${res.id}_${col.dateStr}`) || [];
                          const hasMultiTaskCollision = allTasksForMemberOnDate.length > 1;

                          // Visible assignments (considering project filter)
                          const visibleAssignments = allTasksForMemberOnDate.filter(
                            asg => filterProjectId === 'all' || asg.projectId === filterProjectId
                          );

                          const isFilterDateColumn = col.dateStr === selectedFilterDate;

                          // Tooltip content for native title fallback
                          const collisionTooltipText = hasMultiTaskCollision
                            ? `⚠️ MULTI-TASK VALIDATION WARNING: ${res.name} has ${allTasksForMemberOnDate.length} tasks scheduled on ${col.dateStr}:\n${allTasksForMemberOnDate.map((t, i) => `${i + 1}. [${t.projectCode}] ${t.projectTitle}: ${t.taskRole} (${t.shift})`).join('\n')}`
                            : '';

                          return (
                            <td
                              key={col.dateStr}
                              onClick={() => handleCellClick(res, col.dateStr)}
                              className={`p-1.5 border-r border-neutral-200 last:border-r-0 align-top transition-colors cursor-pointer group hover:bg-neutral-100/60 min-w-[125px] relative ${
                                isFilterDateColumn
                                  ? 'bg-emerald-50/40 ring-1 ring-emerald-500/30 ring-inset'
                                  : col.isToday
                                  ? 'bg-emerald-50/30'
                                  : ''
                              } ${
                                hasMultiTaskCollision
                                  ? 'bg-amber-50/70 border-l-2 border-l-amber-500'
                                  : ''
                              }`}
                              title={collisionTooltipText || `Click to schedule on ${col.formatted}`}
                            >
                              {/* -----------------------------------------------------------------
                               * MULTI-TASK VALIDATION ALERT BADGE & RICH TOOLTIP
                               * ----------------------------------------------------------------- */}
                              {hasMultiTaskCollision && (
                                <div className="relative group/val-tooltip mb-1.5">
                                  {/* Warning Badge Pill with Warning Icon */}
                                  <div
                                    className="flex items-center justify-between gap-1 px-1.5 py-0.5 rounded-md bg-amber-200/90 text-amber-950 font-bold border border-amber-400/80 shadow-2xs hover:bg-amber-300 transition-colors"
                                    onClick={e => {
                                      e.stopPropagation();
                                      setShowConflictDrawer(true);
                                    }}
                                  >
                                    <div className="flex items-center gap-1 min-w-0">
                                      <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0 animate-bounce" />
                                      <span className="truncate text-[10px] tracking-tight">
                                        Multi-Task Alert
                                      </span>
                                    </div>
                                    <span className="px-1 py-0.2 rounded bg-amber-900 text-white text-[9px] font-mono shrink-0">
                                      {allTasksForMemberOnDate.length} Tasks
                                    </span>
                                  </div>

                                  {/* Rich Interactive Tooltip on Hover */}
                                  <div
                                    className={`absolute z-50 ${
                                      rowIndex < 2 ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
                                    } left-0 w-72 sm:w-80 p-3 bg-neutral-900 text-white rounded-xl shadow-2xl border border-amber-400/50 text-left pointer-events-auto hidden group-hover/val-tooltip:block animate-in fade-in zoom-in-95 duration-150`}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    {/* Tooltip Header */}
                                    <div className="flex items-start gap-2.5 pb-2 border-b border-neutral-700">
                                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                                      </div>
                                      <div>
                                        <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                          <span>Multi-Task Scheduling Collision</span>
                                          <span className="px-1.5 py-0.2 rounded bg-amber-900 text-amber-100 text-[9px] font-mono font-bold">
                                            {allTasksForMemberOnDate.length} Overlaps
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-neutral-300 mt-0.5">
                                          <strong className="text-white">{res.name}</strong> is assigned to{' '}
                                          <strong className="text-amber-200">{allTasksForMemberOnDate.length} tasks</strong> on{' '}
                                          <strong className="text-white">{col.formatted}</strong> ({col.dateStr}).
                                        </div>
                                      </div>
                                    </div>

                                    {/* Task List in Tooltip */}
                                    <div className="py-2 space-y-1.5">
                                      <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                                        Overlapping Project Tasks:
                                      </div>
                                      {allTasksForMemberOnDate.map((task, tIdx) => (
                                        <div
                                          key={task.id || tIdx}
                                          className="p-2 rounded-lg bg-neutral-800/90 border border-neutral-700 text-[11px] space-y-0.5"
                                        >
                                          <div className="flex items-center justify-between text-neutral-200 font-semibold">
                                            <span className="text-emerald-400 font-mono font-bold">
                                              {task.projectCode}
                                            </span>
                                            <span className="text-neutral-400 text-[10px] font-mono">
                                              {task.shift}
                                            </span>
                                          </div>
                                          <div className="text-neutral-300 font-medium truncate">
                                            {task.projectTitle}
                                          </div>
                                          <div className="text-amber-200 text-[10px]">
                                            Task: {task.taskRole}
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Tooltip Footer / Quick Action */}
                                    <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px]">
                                      <span className="text-neutral-400 italic">
                                        Site conflict requires reassignment
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setShowConflictDrawer(true)}
                                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-colors shadow-2xs"
                                      >
                                        Resolve Conflict
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Task Assignment Cards */}
                              {visibleAssignments.length > 0 ? (
                                <div className="space-y-1">
                                  {visibleAssignments.map(asg => {
                                    return (
                                      <div
                                        key={asg.id}
                                        onClick={e => handleEditAssignment(asg, e)}
                                        className={`p-1.5 rounded-lg border text-[11px] transition-all hover:scale-[1.02] ${
                                          hasMultiTaskCollision
                                            ? 'bg-amber-100/95 border-amber-300 text-amber-950 font-semibold shadow-xs'
                                            : 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-2xs'
                                        }`}
                                        title={
                                          hasMultiTaskCollision
                                            ? `⚠️ ${res.name} has ${allTasksForMemberOnDate.length} tasks assigned on ${col.dateStr}!`
                                            : `${asg.projectCode} · ${asg.taskRole}`
                                        }
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="font-bold truncate text-[10px] text-neutral-900">
                                            {asg.projectCode}
                                          </span>
                                          {hasMultiTaskCollision && (
                                            <span title={`Multi-task collision: ${allTasksForMemberOnDate.length} tasks on ${col.dateStr}`}>
                                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                            </span>
                                          )}
                                        </div>
                                        <div className="truncate text-[10px] text-neutral-700 font-medium">
                                          {asg.taskRole}
                                        </div>
                                        {asg.shift !== 'Full Day' && (
                                          <div className="text-[9px] text-neutral-500 italic mt-0.5">
                                            {asg.shift.split(' ')[0]}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                                    +
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
       * VIEW 2: TEAM ROSTER CARDS
       * ========================================================================= */}
      {viewMode === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.length === 0 ? (
            <div className="col-span-full p-12 bg-white rounded-2xl border border-neutral-200 text-center text-neutral-500">
              <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="font-bold text-neutral-800">
                {availabilityFilter === 'available_only'
                  ? `No team members are available on ${selectedDateFormatted}.`
                  : 'No team members match the search filters.'}
              </p>
              <button
                type="button"
                onClick={() => setAvailabilityFilter('all')}
                className="mt-2 text-xs font-semibold text-emerald-800 hover:underline"
              >
                Reset availability filter to view all roster members
              </button>
            </div>
          ) : (
            filteredResources.map(res => {
              const activeBookings = resourceAssignments.filter(a => a.resourceId === res.id);
              const isFreeOnSelectedDate = isMemberAvailableOnDate(res.id, selectedFilterDate);

              // Check if this member has any date with multiple tasks
              const conflictedDatesForMember = dateColumns
                .filter(col => {
                  const tasks = multiTaskValidationMap.get(`${res.id}_${col.dateStr}`) || [];
                  return tasks.length > 1;
                })
                .map(col => col.formatted);

              const hasCollisions = conflictedDatesForMember.length > 0;

              return (
                <div
                  key={res.id}
                  className={`bg-white border rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3 ${
                    hasCollisions
                      ? 'border-amber-300 ring-1 ring-amber-300/60'
                      : isFreeOnSelectedDate && availabilityFilter === 'available_only'
                      ? 'border-emerald-300 ring-1 ring-emerald-300/60'
                      : 'border-neutral-200/90'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                        {res.category}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-800">
                        {formatCurrency(res.dailyRate, currency)}/day
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-neutral-900 text-sm flex items-center gap-1.5 flex-wrap">
                        <HardHat className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{res.name}</span>
                        {hasCollisions && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                            title={`Assigned to multiple project tasks on: ${conflictedDatesForMember.join(', ')}`}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Multi-Task Alert</span>
                          </span>
                        )}
                        {isFreeOnSelectedDate && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Free on {selectedDateFormatted}</span>
                          </span>
                        )}
                      </h3>
                      <div className="text-xs text-neutral-500 mt-0.5">{res.roleOrModel}</div>
                      {res.phoneOrPlate && (
                        <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                          Tel: {res.phoneOrPlate}
                        </div>
                      )}
                    </div>

                    {res.specsOrSkills && res.specsOrSkills.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        {res.specsOrSkills.map((spec, i) => (
                          <span key={i} className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Active Bookings Summary */}
                    <div className="pt-2 border-t border-neutral-100 space-y-1">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                        Scheduled Bookings ({activeBookings.length}):
                      </span>
                      {activeBookings.length === 0 ? (
                        <span className="text-[11px] text-emerald-700 font-medium">
                          ✓ Idle / 100% Available for project assignment
                        </span>
                      ) : (
                        <div className="space-y-1">
                          {activeBookings.slice(0, 3).map(b => {
                            const hasOverlap = getDatesInRange(b.startDate, b.endDate).some(d => {
                              const tasks = multiTaskValidationMap.get(`${b.resourceId}_${d}`) || [];
                              return tasks.length > 1;
                            });

                            return (
                              <div
                                key={b.id}
                                className={`text-[11px] p-1.5 rounded-lg border flex items-center justify-between ${
                                  hasOverlap
                                    ? 'bg-amber-50 border-amber-300 text-amber-950 font-medium'
                                    : 'bg-neutral-50 border-neutral-200'
                                }`}
                                title={
                                  hasOverlap
                                    ? `Validation Warning: ${res.name} has multiple tasks scheduled on dates overlapping ${b.startDate}!`
                                    : `${b.projectCode} · ${b.taskRole}`
                                }
                              >
                                <div className="flex items-center gap-1 truncate mr-2">
                                  {hasOverlap && (
                                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                  )}
                                  <span className="font-semibold text-neutral-800 truncate">
                                    {b.projectCode} · {b.taskRole}
                                  </span>
                                </div>
                                <span className="font-mono text-[10px] text-neutral-500 shrink-0">
                                  {b.startDate}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPrefilledResourceId(res.id);
                      setPrefilledDate(selectedFilterDate);
                      setActiveAssignmentToEdit(null);
                      setShowAssignModal(true);
                    }}
                    className="w-full py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign on {selectedDateFormatted}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* =========================================================================
       * VIEW 3: SHIFT AGENDA LIST VIEW
       * ========================================================================= */}
      {viewMode === 'agenda' && (
        <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">
              Active Member Shift Deployments ({filteredAssignments.length})
            </h3>
            <span className="text-xs text-neutral-500">
              Sorted by date
            </span>
          </div>

          <div className="divide-y divide-neutral-200">
            {filteredAssignments.length === 0 ? (
              <div className="p-12 text-center text-neutral-400 text-xs">
                No shift assignments match the active search/filters.
              </div>
            ) : (
              filteredAssignments.map(asg => {
                // Check if any date in this assignment has multi-task collision
                const conflictingDates = getDatesInRange(asg.startDate, asg.endDate).filter(d => {
                  const tasks = multiTaskValidationMap.get(`${asg.resourceId}_${d}`) || [];
                  return tasks.length > 1;
                });
                const isMultiTaskConflict = conflictingDates.length > 0;

                return (
                  <div
                    key={asg.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors hover:bg-neutral-50 ${
                      isMultiTaskConflict ? 'bg-amber-50/50 border-l-4 border-l-amber-500' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-neutral-900 text-sm">
                          {asg.resourceName}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          {asg.projectCode} · {asg.projectTitle}
                        </span>
                        {isMultiTaskConflict && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded cursor-help"
                            title={`Validation Warning: ${asg.resourceName} is assigned to multiple project tasks on dates: ${conflictingDates.join(', ')}`}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Multi-Task Alert ({conflictingDates.length} overlapping dates)
                          </span>
                        )}
                      </div>
                      <div className="text-neutral-600 font-medium">
                        Task: <span className="text-neutral-900">{asg.taskRole}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Client: {asg.clientName} {asg.notes && `· Notes: "${asg.notes}"`}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                      <div className="text-right">
                        <div className="font-mono font-bold text-neutral-900">
                          {asg.startDate} {asg.endDate !== asg.startDate && `to ${asg.endDate}`}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-medium">
                          {asg.shift} · {formatCurrency(asg.dailyCost, currency)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={e => handleEditAssignment(asg, e)}
                        className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modals & Conflict Resolution Drawer */}
      <AssignResourceModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setActiveAssignmentToEdit(null);
        }}
        defaultDate={prefilledDate || selectedFilterDate}
        defaultResourceId={prefilledResourceId}
        existingAssignment={activeAssignmentToEdit}
      />

      <AddResourceModal
        isOpen={showAddResourceModal}
        onClose={() => setShowAddResourceModal(false)}
      />

      <ConflictResolutionDrawer
        isOpen={showConflictDrawer}
        onClose={() => setShowConflictDrawer(false)}
      />
    </div>
  );
};
