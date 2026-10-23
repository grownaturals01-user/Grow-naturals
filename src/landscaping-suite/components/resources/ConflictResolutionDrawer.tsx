import React, { useState } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { ResourceConflict } from '../../types/landscaping';
import { formatCurrency } from '../../utils/calculations';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  HardHat,
  Trash2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface ConflictResolutionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConflictResolutionDrawer: React.FC<ConflictResolutionDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    resourceConflicts,
    companyResources,
    resolveConflictReassign,
    resolveConflictReschedule,
    deleteResourceAssignment,
    currency,
  } = useProjects();

  const [resolvedNotice, setResolvedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setResolvedNotice(msg);
    setTimeout(() => setResolvedNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-auto text-neutral-900 border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-rose-950 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-700 text-white flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Scheduling Conflict Resolver ({resourceConflicts.length})
              </h3>
              <p className="text-[11px] text-rose-200">
                Prevent jobsite delays by resolving double-booked team members across project dates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rose-300 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {resolvedNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{resolvedNotice}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {resourceConflicts.length === 0 ? (
            <div className="p-10 text-center space-y-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-neutral-900">
                All Schedules Are Conflict-Free!
              </h4>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                No team members have overlapping assignments across active projects.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl"
              >
                Close Resolver
              </button>
            </div>
          ) : (
            resourceConflicts.map((conflict, idx) => {
              const res = companyResources.find(r => r.id === conflict.resourceId);
              // Find alternative team members
              const alternatives = companyResources.filter(
                r => r.id !== conflict.resourceId
              );

              return (
                <div
                  key={conflict.resourceId + idx}
                  className="bg-white border-2 border-rose-200 rounded-2xl p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-800 flex items-center justify-center">
                        <HardHat className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-neutral-900 text-sm">
                        {conflict.resourceName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                        Collision: {conflict.conflictingDates.join(', ')}
                      </span>
                    </div>

                    <span className="text-[11px] text-neutral-500 font-mono">
                      Daily Cost: {formatCurrency(res?.dailyRate || 0, currency)}
                    </span>
                  </div>

                  <p className="text-neutral-600 text-xs">
                    This team member is scheduled concurrently on multiple active projects:
                  </p>

                  {/* Overlapping Assignments Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {conflict.assignments.map(asg => (
                      <div
                        key={asg.id}
                        className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-1.5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-800">
                            <span className="text-emerald-800 font-bold font-mono">
                              {asg.projectCode}
                            </span>
                            <span className="text-neutral-500">{asg.shift}</span>
                          </div>
                          <div className="font-bold text-neutral-900 line-clamp-1">
                            {asg.projectTitle}
                          </div>
                          <div className="text-[11px] text-neutral-600 line-clamp-1">
                            Task: {asg.taskRole}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono mt-1">
                            Dates: {asg.startDate} {asg.startDate !== asg.endDate ? `to ${asg.endDate}` : ''}
                          </div>
                        </div>

                        {/* Quick Resolution Controls for this specific assignment */}
                        <div className="pt-2 border-t border-neutral-200 flex items-center justify-between gap-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              // Reschedule by 1 day
                              const nextDay = new Date(new Date(asg.endDate).getTime() + 86400000)
                                .toISOString()
                                .split('T')[0];
                              resolveConflictReschedule(asg.id, nextDay, nextDay);
                              showFeedback(`Rescheduled ${asg.projectCode} to ${nextDay}!`);
                            }}
                            className="text-[10px] font-semibold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                            title="Push date forward by 1 day"
                          >
                            <Calendar className="w-3 h-3 text-neutral-500" />
                            <span>Postpone +1 Day</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              deleteResourceAssignment(asg.id);
                              showFeedback(`Removed assignment from ${asg.projectCode}`);
                            }}
                            className="text-[10px] font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                            title="Remove this conflicting assignment"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Cancel Shift</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 1-Click Smart Reassign to Alternative Team Member */}
                  {alternatives.length > 0 && (
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-800 text-[11px] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>1-Click Reassign to Available Colleague:</span>
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          Transfer second booking ({conflict.assignments[1]?.projectCode})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {alternatives.slice(0, 3).map(alt => (
                          <button
                            key={alt.id}
                            type="button"
                            onClick={() => {
                              const targetAssignment = conflict.assignments[1];
                              if (targetAssignment) {
                                resolveConflictReassign(
                                  targetAssignment.id,
                                  alt.id
                                );
                                showFeedback(
                                  `Reassigned ${targetAssignment.projectCode} shift to ${alt.name}!`
                                );
                              }
                            }}
                            className="text-[11px] font-semibold text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                          >
                            <RefreshCw className="w-3 h-3 text-emerald-700" />
                            <span>Reassign to {alt.name}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              ({formatCurrency(alt.dailyRate, currency)}/day)
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 px-5 py-3 border-t border-neutral-200 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            {resourceConflicts.length > 0
              ? 'Resolve collisions to ensure smooth on-site operations'
              : 'All member shifts are conflict-free'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-black rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
