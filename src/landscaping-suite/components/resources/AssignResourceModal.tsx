import React, { useState, useMemo } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { CompanyResource, ResourceAssignment } from '../../types/landscaping';
import { formatCurrency } from '../../utils/calculations';
import {
  X,
  AlertTriangle,
  Calendar,
  Clock,
  HardHat,
  CheckCircle2,
  Trash2,
  ArrowRight,
  ShieldAlert,
  User,
} from 'lucide-react';

interface AssignResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultResourceId?: string;
  defaultProjectId?: string;
  existingAssignment?: ResourceAssignment | null;
}

export const AssignResourceModal: React.FC<AssignResourceModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  defaultResourceId,
  defaultProjectId,
  existingAssignment,
}) => {
  const {
    projects,
    companyResources,
    addResourceAssignment,
    updateResourceAssignment,
    deleteResourceAssignment,
    checkResourceConflicts,
    currency,
  } = useProjects();

  const activeProjects = useMemo(
    () => projects.filter(p => p.isConvertedToProject),
    [projects]
  );

  const initialDate = existingAssignment?.startDate || defaultDate || '2026-10-23';
  const initialEndDate = existingAssignment?.endDate || initialDate;
  const initialResId = existingAssignment?.resourceId || defaultResourceId || companyResources[0]?.id || '';
  const initialProjId = existingAssignment?.projectId || defaultProjectId || activeProjects[0]?.id || '';

  const [selectedResourceId, setSelectedResourceId] = useState<string>(initialResId);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjId);
  const [startDate, setStartDate] = useState<string>(initialDate);
  const [endDate, setEndDate] = useState<string>(initialEndDate);
  const [shift, setShift] = useState<'Full Day' | 'Morning (8am - 1pm)' | 'Afternoon (1pm - 6pm)'>(
    existingAssignment?.shift || 'Full Day'
  );
  const [taskRole, setTaskRole] = useState<string>(
    existingAssignment?.taskRole || ''
  );
  const [notes, setNotes] = useState<string>(existingAssignment?.notes || '');
  const [allowConflictOverride, setAllowConflictOverride] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentResource = useMemo(
    () => companyResources.find(r => r.id === selectedResourceId),
    [companyResources, selectedResourceId]
  );

  const currentProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  // Live conflict checking as user tweaks dates, resource, or shift
  const detectedConflicts = useMemo(() => {
    if (!selectedResourceId || !startDate || !endDate) return [];
    return checkResourceConflicts(
      selectedResourceId,
      startDate,
      endDate,
      shift,
      existingAssignment?.id
    );
  }, [
    selectedResourceId,
    startDate,
    endDate,
    shift,
    existingAssignment,
    checkResourceConflicts,
  ]);

  // Suggested alternative resources if the selected one has a conflict
  const alternativeResources = useMemo(() => {
    if (detectedConflicts.length === 0 || !currentResource) return [];
    return companyResources.filter(r => {
      if (r.id === currentResource.id) return false;
      const altConflicts = checkResourceConflicts(
        r.id,
        startDate,
        endDate,
        shift,
        existingAssignment?.id
      );
      return altConflicts.length === 0;
    });
  }, [
    detectedConflicts,
    currentResource,
    companyResources,
    checkResourceConflicts,
    startDate,
    endDate,
    shift,
    existingAssignment,
  ]);

  // Sync default values when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (existingAssignment) {
        setSelectedResourceId(existingAssignment.resourceId);
        setSelectedProjectId(existingAssignment.projectId);
        setStartDate(existingAssignment.startDate);
        setEndDate(existingAssignment.endDate);
        setShift(existingAssignment.shift);
        setTaskRole(existingAssignment.taskRole);
        setNotes(existingAssignment.notes || '');
      } else {
        if (defaultResourceId) setSelectedResourceId(defaultResourceId);
        if (defaultDate) {
          setStartDate(defaultDate);
          setEndDate(defaultDate);
        }
        if (defaultProjectId) setSelectedProjectId(defaultProjectId);
        if (!taskRole && currentResource) {
          setTaskRole(currentResource.roleOrModel);
        }
      }
      setAllowConflictOverride(false);
      setErrorMessage(null);
    }
  }, [isOpen, existingAssignment, defaultResourceId, defaultDate, defaultProjectId]);

  // Update default task role when resource changes
  React.useEffect(() => {
    if (currentResource && !existingAssignment && !taskRole) {
      setTaskRole(currentResource.roleOrModel);
    }
  }, [currentResource, existingAssignment, taskRole]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedResourceId) {
      setErrorMessage('Please select a team member.');
      return;
    }

    if (!selectedProjectId) {
      setErrorMessage('Please select an active project.');
      return;
    }

    if (!startDate || !endDate) {
      setErrorMessage('Please specify start and end dates.');
      return;
    }

    if (endDate < startDate) {
      setErrorMessage('End date cannot precede start date.');
      return;
    }

    const res = companyResources.find(r => r.id === selectedResourceId);
    const proj = projects.find(p => p.id === selectedProjectId);

    if (!res || !proj) {
      setErrorMessage('Invalid team member or project selection.');
      return;
    }

    const payload = {
      resourceId: res.id,
      resourceName: res.name,
      resourceType: 'team_member' as const,
      projectId: proj.id,
      projectCode: proj.code,
      projectTitle: proj.title,
      clientName: proj.step1Enquiry.clientName,
      startDate,
      endDate,
      shift,
      taskRole: taskRole.trim() || res.roleOrModel,
      dailyCost: res.dailyRate,
      notes: notes.trim(),
      status: (detectedConflicts.length > 0 && allowConflictOverride
        ? 'Conflict_Detected'
        : 'Confirmed') as 'Confirmed' | 'Conflict_Detected',
      assignedBy: 'Operations Manager',
    };

    if (existingAssignment) {
      const result = updateResourceAssignment(
        existingAssignment.id,
        payload,
        allowConflictOverride
      );
      if (!result.success) {
        setErrorMessage(
          result.conflict
            ? `Cannot schedule: ${res.name} is already booked on ${result.conflict.conflictingDates.join(', ')} for project ${result.conflict.assignments[0]?.projectCode}. You can check "Override conflict" below if double-booking is intended.`
            : 'Failed to update member assignment.'
        );
        return;
      }
    } else {
      const result = addResourceAssignment(payload, allowConflictOverride);
      if (!result.success) {
        setErrorMessage(
          result.conflict
            ? `Double-booking alert: ${res.name} is already booked on ${result.conflict.conflictingDates.join(', ')}. Select an alternative member or check "Override conflict".`
            : 'Failed to create member assignment.'
        );
        return;
      }
    }

    onClose();
  };

  const handleDelete = () => {
    if (!existingAssignment) return;
    deleteResourceAssignment(existingAssignment.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl my-auto text-neutral-900 border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-neutral-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                {existingAssignment ? 'Edit Member Assignment' : 'Assign Team Member to Project'}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Automatic schedule collision checking against all active jobs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Assignment Blocked</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Real-time Conflict Alert Box */}
          {detectedConflicts.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Scheduling Collision Detected!</span>
              </div>
              <p className="text-[11px] text-amber-800">
                <strong>{currentResource?.name}</strong> is already allocated to:
              </p>
              <div className="space-y-1">
                {detectedConflicts.map(c => (
                  <div
                    key={c.id}
                    className="p-2 rounded-lg bg-white/90 border border-amber-200 text-[11px] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-neutral-900">{c.projectCode}</span>
                      <span className="text-neutral-600"> · {c.projectTitle}</span>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {c.startDate} {c.startDate !== c.endDate ? `to ${c.endDate}` : ''} ({c.shift})
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                      Occupied
                    </span>
                  </div>
                ))}
              </div>

              {/* Suggested Alternative Resources */}
              {alternativeResources.length > 0 && (
                <div className="pt-2 border-t border-amber-200/80">
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block mb-1">
                    Available Conflict-Free Team Members:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {alternativeResources.slice(0, 3).map(alt => (
                      <button
                        key={alt.id}
                        type="button"
                        onClick={() => setSelectedResourceId(alt.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg border border-emerald-300 transition-colors flex items-center gap-1"
                      >
                        <span>Switch to {alt.name}</span>
                        <ArrowRight className="w-3 h-3 text-emerald-700" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conflict Override Checkbox */}
              <label className="flex items-center gap-2 text-[11px] text-amber-900 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowConflictOverride}
                  onChange={e => setAllowConflictOverride(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Override scheduling conflict (Double-book anyway for split shift / dual-site)</span>
              </label>
            </div>
          )}

          {/* Destination Project Selection */}
          <div>
            <label className="font-semibold text-neutral-700 block mb-1">
              Assigned Project Site *
            </label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white font-medium"
            >
              {activeProjects.map(proj => (
                <option key={proj.id} value={proj.id}>
                  {proj.code} · {proj.title} ({proj.step1Enquiry.clientName})
                </option>
              ))}
            </select>
          </div>

          {/* Specific Team Member Picker with Availability Badge */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-neutral-700">
                Select Team Member *
              </label>
              {currentResource && (
                <span className="text-[11px] text-neutral-500 font-mono">
                  Rate: {formatCurrency(currentResource.dailyRate, currency)}/day
                </span>
              )}
            </div>

            <select
              value={selectedResourceId}
              onChange={e => setSelectedResourceId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white font-medium"
            >
              {companyResources.map(res => {
                const conflicts = checkResourceConflicts(
                  res.id,
                  startDate,
                  endDate,
                  shift,
                  existingAssignment?.id
                );
                const hasConflict = conflicts.length > 0;
                return (
                  <option key={res.id} value={res.id}>
                    {res.name} — {res.roleOrModel} {hasConflict ? '⚠️ [CONFLICT ON THIS DATE]' : '✓ [Available]'}
                  </option>
                );
              })}
            </select>

            {currentResource?.specsOrSkills && currentResource.specsOrSkills.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-[10px] text-neutral-500">
                <span className="font-medium text-neutral-600">Skills:</span>
                {currentResource.specsOrSkills.map((s, idx) => (
                  <span key={idx} className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Date Range & Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Start Date *</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                <input
                  type="date"
                  value={startDate}
                  onChange={e => {
                    setStartDate(e.target.value);
                    if (endDate < e.target.value) setEndDate(e.target.value);
                  }}
                  className="w-full pl-8 pr-2.5 py-1.5 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">End Date *</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Shift / Hours</label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                <select
                  value={shift}
                  onChange={e => setShift(e.target.value as any)}
                  className="w-full pl-8 pr-2 py-1.5 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white text-xs font-medium"
                >
                  <option value="Full Day">Full Day (8am - 5pm)</option>
                  <option value="Morning (8am - 1pm)">Morning (8am - 1pm)</option>
                  <option value="Afternoon (1pm - 6pm)">Afternoon (1pm - 6pm)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Assigned Task / Role Description */}
          <div>
            <label className="font-semibold text-neutral-700 block mb-1">
              On-Site Task / Role Responsibility
            </label>
            <input
              type="text"
              placeholder="e.g. Bermuda Turf Sod Laying & Sub-base Compaction"
              value={taskRole}
              onChange={e => setTaskRole(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white text-xs"
            />
          </div>

          {/* Internal Logistics / Site Notes */}
          <div>
            <label className="font-semibold text-neutral-700 block mb-1">
              Field Notes & Instructions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Special site instructions, client timing guidelines, tools required..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white text-xs resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
            {existingAssignment ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs ${
                  detectedConflicts.length > 0 && !allowConflictOverride
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {existingAssignment
                    ? 'Update Assignment'
                    : detectedConflicts.length > 0 && allowConflictOverride
                    ? 'Confirm Double-Booking'
                    : 'Confirm Assignment'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
