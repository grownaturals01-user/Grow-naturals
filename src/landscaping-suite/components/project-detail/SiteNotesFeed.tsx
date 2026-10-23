import React, { useState } from 'react';
import { LandscapingProject, SiteNote } from '../../types/landscaping';
import { useProjects } from '../../context/ProjectContext';
import { calculateProjectFinancials, formatCurrency } from '../../utils/calculations';
import {
  MessageSquare,
  Send,
  AlertTriangle,
  Clock,
  User,
  ShieldAlert,
  CheckCircle2,
  Bell,
  Trash2,
  X,
  Truck,
  CloudRain,
  HardHat,
  DollarSign,
  Filter,
} from 'lucide-react';

interface SiteNotesFeedProps {
  project: LandscapingProject;
  onClose?: () => void;
  isModal?: boolean;
}

export const SiteNotesFeed: React.FC<SiteNotesFeedProps> = ({
  project,
  onClose,
  isModal = false,
}) => {
  const { addSiteNote, deleteSiteNote, managerAlerts, dismissManagerAlert, currency } = useProjects();
  const fin = calculateProjectFinancials(project);

  const notes = project.siteNotes || [];
  const projectAlerts = managerAlerts.filter(a => a.projectId === project.id);

  // Compose State
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState(
    project.step4Planning.supervisorName || 'Ramesh Kumar (Supervisor)'
  );
  const [role, setRole] = useState<SiteNote['role']>('Site Supervisor');
  const [category, setCategory] = useState<SiteNote['category']>('Daily Progress');
  const [phase, setPhase] = useState<SiteNote['phase']>('During');
  const [costImpact, setCostImpact] = useState<number | ''>('');
  const [isUrgentAlert, setIsUrgentAlert] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [postSuccess, setPostSuccess] = useState(false);

  // Financial threshold checks
  const budgetUtilizationPct = fin.totalContractValue > 0
    ? Math.round((fin.totalExpenses / fin.totalContractValue) * 100)
    : 0;

  const isBudgetWarning = budgetUtilizationPct >= 85 && budgetUtilizationPct < 100;
  const isBudgetCritical = budgetUtilizationPct >= 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    addSiteNote(project.id, {
      authorName: authorName.trim() || 'Site Supervisor',
      role,
      category,
      phase,
      content: content.trim(),
      costImpactAmount: costImpact === '' ? undefined : Number(costImpact),
      isBudgetExceededAlert: isUrgentAlert || (typeof costImpact === 'number' && costImpact > 5000),
      alertSeverity: isBudgetCritical ? 'critical' : isBudgetWarning || isUrgentAlert ? 'warning' : 'info',
    });

    setContent('');
    setCostImpact('');
    setIsUrgentAlert(false);
    setPostSuccess(true);
    setTimeout(() => setPostSuccess(false), 2500);
  };

  const filteredNotes = notes.filter(n => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'alerts') return n.isBudgetExceededAlert;
    return n.category === filterCategory;
  });

  return (
    <div className={`space-y-6 ${isModal ? 'p-6 bg-white' : ''}`}>
      {/* Top Banner / Budget Threshold Status */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <MessageSquare className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                  Site Notes & Real-Time Field Log
                </h2>
                <span className="text-[11px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full">
                  {notes.length} updates logged
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Real-time site updates from supervisors. Automatically triggers manager push notifications if budget thresholds or unexpected expenses arise.
              </p>
            </div>
          </div>

          {/* Budget Health Pill */}
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                isBudgetCritical
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : isBudgetWarning
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              {isBudgetCritical ? (
                <ShieldAlert className="w-4 h-4 text-rose-700 animate-pulse" />
              ) : isBudgetWarning ? (
                <AlertTriangle className="w-4 h-4 text-amber-700" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              )}
              <span>
                Budget Status: {budgetUtilizationPct}% Spent ({formatCurrency(fin.totalExpenses, currency)} / {formatCurrency(fin.totalContractValue, currency)})
              </span>
            </div>

            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Manager Push Notification Banner (Simulated Push Alert) */}
        {projectAlerts.length > 0 && (
          <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                <Bell className="w-4 h-4 text-rose-700 animate-bounce" />
                <span>MANAGER PUSH NOTIFICATION TRIGGERED</span>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                Action Required
              </span>
            </div>
            {projectAlerts.map(alert => (
              <div
                key={alert.id}
                className="bg-white p-2.5 rounded-lg border border-rose-200 text-xs flex items-center justify-between gap-3 text-rose-950"
              >
                <div>
                  <span className="font-semibold block">{alert.message}</span>
                  <span className="text-[10px] text-neutral-400">Triggered at {alert.timestamp}</span>
                </div>
                <button
                  type="button"
                  onClick={() => dismissManagerAlert(alert.id)}
                  className="px-2 py-1 text-[11px] font-semibold text-rose-900 hover:bg-rose-100 rounded-md transition-colors whitespace-nowrap"
                >
                  Acknowledge & Dismiss
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compose Form */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
          <span>Log New Daily Field Note</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Author Name</label>
              <input
                type="text"
                required
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
              >
                <option value="Site Supervisor">Site Supervisor</option>
                <option value="Landscape Architect">Landscape Architect</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Quality Engineer">Quality Engineer</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
              >
                <option value="Daily Progress">Daily Progress</option>
                <option value="Material Delivery">Material Delivery</option>
                <option value="Labor & Crew">Labor & Crew</option>
                <option value="Weather & Delays">Weather & Delays</option>
                <option value="Budget & Expense Alert">Budget & Expense Alert</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Construction Phase</label>
              <select
                value={phase}
                onChange={e => setPhase(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
              >
                <option value="Before">Before (Site Survey)</option>
                <option value="During">During (Execution)</option>
                <option value="After">After (Handover)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Site Note / Observation</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Completed laying 1,800 sq.ft of Bermuda sod. Sprinkler hydraulic test completed with 4 zones operating at 3.5 bar pressure..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full p-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 leading-relaxed font-sans"
            />
          </div>

          {/* Cost impact & trigger options */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="font-semibold text-neutral-700 text-xs">Unexpected Cost Impact ({currency}):</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 (Optional)"
                  value={costImpact}
                  onChange={e => setCostImpact(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-28 px-2 py-1 text-xs border border-neutral-300 rounded-lg bg-white font-medium focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-800 ml-2">
                <input
                  type="checkbox"
                  checked={isUrgentAlert}
                  onChange={e => setIsUrgentAlert(e.target.checked)}
                  className="rounded text-rose-700 focus:ring-rose-700"
                />
                <span>Trigger Urgent Manager Alert</span>
              </label>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {postSuccess && (
                <span className="text-emerald-700 font-semibold text-xs animate-in fade-in flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Posted to Feed
                </span>
              )}
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 font-semibold text-xs text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Note</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
              filterCategory === 'all'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            All Notes ({notes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('alerts')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
              filterCategory === 'alerts'
                ? 'bg-rose-800 text-white font-semibold'
                : 'text-rose-800 bg-rose-50 hover:bg-rose-100'
            }`}
          >
            Budget Alerts ({notes.filter(n => n.isBudgetExceededAlert).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('Daily Progress')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
              filterCategory === 'Daily Progress'
                ? 'bg-emerald-800 text-white font-semibold'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Daily Progress
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('Material Delivery')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
              filterCategory === 'Material Delivery'
                ? 'bg-emerald-800 text-white font-semibold'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Material Deliveries
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('Weather & Delays')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
              filterCategory === 'Weather & Delays'
                ? 'bg-emerald-800 text-white font-semibold'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Weather & Delays
          </button>
        </div>
      </div>

      {/* Timeline Feed */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center text-xs text-neutral-500">
          No site notes match the selected filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map(note => {
            const isAlert = note.isBudgetExceededAlert;

            return (
              <div
                key={note.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isAlert
                    ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200'
                    : 'bg-white border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-neutral-900">{note.authorName}</span>
                    <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                      {note.role}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        note.category === 'Budget & Expense Alert' || isAlert
                          ? 'bg-rose-100 text-rose-800 font-bold'
                          : note.category === 'Material Delivery'
                          ? 'bg-blue-100 text-blue-800'
                          : note.category === 'Weather & Delays'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {note.category}
                    </span>
                    {note.phase && (
                      <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-200/70 px-1.5 py-0.5 rounded">
                        Phase: {note.phase}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{note.timestamp}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => deleteSiteNote(project.id, note.id)}
                      className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                      title="Delete site note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="py-2.5 text-xs text-neutral-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {note.content}
                </div>

                {/* Cost Impact Highlight if any */}
                {note.costImpactAmount && note.costImpactAmount > 0 && (
                  <div className="bg-rose-100/70 text-rose-900 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                      <span>Unforeseen Cost Impact:</span>
                    </div>
                    <span className="tabular-nums font-bold text-rose-950">
                      +{formatCurrency(note.costImpactAmount, currency)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
