import React, { useState, useMemo } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { LandscapingProject } from '../../types/landscaping';
import { calculateProjectFinancials, formatCurrency, FinancialOverview } from '../../utils/calculations';
import { PnlExportService } from '../../utils/pnlExportService';
import { PaymentReminderModal } from '../modals/PaymentReminderModal';
import {
  Wallet,
  MessageSquare,
  Mail,
  Download,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Clock,
  Sparkles,
  Phone,
  Filter,
} from 'lucide-react';

export const PendingCollectionsModule: React.FC = () => {
  const { projects, currency, selectProject } = useProjects();

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'advance' | 'progress' | 'settlement'>('all');
  const [reminderModalData, setReminderModalData] = useState<{
    isOpen: boolean;
    recipients: Array<{ project: LandscapingProject; outstanding: number }>;
  }>({
    isOpen: false,
    recipients: [],
  });

  // Calculate pending items
  const pendingItems = useMemo(() => {
    return projects
      .filter(p => p.isConvertedToProject)
      .map(p => {
        const fin = calculateProjectFinancials(p);
        let statusCategory: 'advance' | 'progress' | 'settlement' = 'progress';

        if (!p.step4Planning.isAdvanceReceived) {
          statusCategory = 'advance';
        } else if (p.currentStage === 'settlement' || p.completedStages.includes('settlement')) {
          statusCategory = 'settlement';
        }

        return {
          project: p,
          fin,
          statusCategory,
        };
      })
      .filter(item => item.fin.outstandingReceivable > 0);
  }, [projects]);

  // Aggregate stats
  const totalOutstanding = useMemo(() => {
    return pendingItems.reduce((sum, item) => sum + item.fin.outstandingReceivable, 0);
  }, [pendingItems]);

  const totalContractValue = useMemo(() => {
    return pendingItems.reduce((sum, item) => sum + item.fin.totalContractValue, 0);
  }, [pendingItems]);

  const advanceDueCount = pendingItems.filter(i => i.statusCategory === 'advance').length;
  const settlementDueCount = pendingItems.filter(i => i.statusCategory === 'settlement').length;

  // Filtered items by search & tab
  const filteredItems = useMemo(() => {
    return pendingItems.filter(item => {
      if (filterType !== 'all' && item.statusCategory !== filterType) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const client = item.project.step1Enquiry.clientName.toLowerCase();
        const title = item.project.title.toLowerCase();
        const code = item.project.code.toLowerCase();
        const phone = (item.project.step1Enquiry.phone || '').toLowerCase();
        return client.includes(q) || title.includes(q) || code.includes(q) || phone.includes(q);
      }

      return true;
    });
  }, [pendingItems, filterType, searchQuery]);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.project.id));
    }
  };

  const handleToggleItem = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Launch reminders
  const handleOpenBulkReminders = () => {
    const chosen = pendingItems.filter(i => selectedIds.includes(i.project.id));
    if (chosen.length === 0) return;

    setReminderModalData({
      isOpen: true,
      recipients: chosen.map(i => ({ project: i.project, outstanding: i.fin.outstandingReceivable })),
    });
  };

  const handleOpenSingleReminder = (item: { project: LandscapingProject; fin: FinancialOverview }) => {
    setReminderModalData({
      isOpen: true,
      recipients: [{ project: item.project, outstanding: item.fin.outstandingReceivable }],
    });
  };

  const handleDirectWhatsApp = (item: { project: LandscapingProject; fin: FinancialOverview }) => {
    const p = item.project;
    let cleanPhone = (p.step1Enquiry.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

    const text = `Dear ${p.step1Enquiry.clientName},\n\nGreetings from TerraFlow Landscaping! This is a friendly reminder regarding the outstanding balance of ${currency}${item.fin.outstandingReceivable.toLocaleString('en-IN')} for your project "${p.title}" (${p.code}).\n\nTotal Contract: ${currency}${item.fin.totalContractValue.toLocaleString('en-IN')}\nPaid: ${currency}${item.fin.totalCollected.toLocaleString('en-IN')}\nOutstanding: ${currency}${item.fin.outstandingReceivable.toLocaleString('en-IN')}\n\nPlease let us know once the transfer is arranged. Thank you!\nTerraFlow Team`;
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDirectEmail = (item: { project: LandscapingProject; fin: FinancialOverview }) => {
    const p = item.project;
    const email = p.step1Enquiry.email;
    const subject = `Payment Statement & Milestone Reminder - ${p.title} | TerraFlow`;
    const body = `Dear ${p.step1Enquiry.clientName},\n\nGreetings from TerraFlow Landscaping.\n\nThis is a friendly reminder that an outstanding balance of ${currency} ${item.fin.outstandingReceivable.toLocaleString('en-IN')} is pending for "${p.title}" (${p.code}).\n\nContract Breakdown:\n- Total Contract: ${currency} ${item.fin.totalContractValue.toLocaleString('en-IN')}\n- Total Received to Date: ${currency} ${item.fin.totalCollected.toLocaleString('en-IN')}\n- Outstanding Balance: ${currency} ${item.fin.outstandingReceivable.toLocaleString('en-IN')}\n\nKindly arrange the payment and reply with the transaction details.\n\nWarm regards,\nTerraFlow Accounts`;
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleExportCsv = () => {
    PnlExportService.exportCollectionsListToCsv(pendingItems, currency);
  };

  if (pendingItems.length === 0) {
    return null;
  }

  const isAllSelected = filteredItems.length > 0 && selectedIds.length === filteredItems.length;

  return (
    <div className="bg-white border border-neutral-200/90 rounded-xl shadow-2xs overflow-hidden transition-all">
      {/* Module Banner / Header */}
      <div className={`p-3.5 sm:p-4 transition-colors ${isExpanded ? 'bg-amber-50/60 border-b border-amber-200/70' : 'bg-white hover:bg-neutral-50/50'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Wallet className="w-4 h-4 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-neutral-900 tracking-tight">
                  Pending Collections Desk
                </h2>
                <span className="text-[11px] text-amber-800 font-medium">
                  {pendingItems.length} accounts pending
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Outstanding receivable:{' '}
                <strong className="text-neutral-900 font-semibold tabular-nums">
                  {formatCurrency(totalOutstanding, currency)}
                </strong>{' '}
                across active contracts totaling {formatCurrency(totalContractValue, currency)}.
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg transition-colors shadow-2xs"
              title="Download pending receivables report (CSV)"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedIds(pendingItems.map(i => i.project.id));
                setReminderModalData({
                  isOpen: true,
                  recipients: pendingItems.map(i => ({ project: i.project, outstanding: i.fin.outstandingReceivable })),
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Bulk Reminders</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              title={isExpanded ? 'Collapse accounts' : 'Expand accounts list'}
            >
              <span>{isExpanded ? 'Collapse' : 'View Accounts'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Quick Summary Pill Bar when Expanded */}
        {isExpanded && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-3 border-t border-amber-200/50 text-xs">
            <div className="bg-white/80 border border-amber-100 rounded-lg p-2 flex items-center justify-between">
              <span className="text-neutral-500 text-[11px]">Total Outstanding:</span>
              <span className="font-bold text-amber-900 tabular-nums">
                {formatCurrency(totalOutstanding, currency)}
              </span>
            </div>
            <div className="bg-white/80 border border-amber-100 rounded-lg p-2 flex items-center justify-between">
              <span className="text-neutral-500 text-[11px]">Advance Due:</span>
              <span className="font-bold text-neutral-800 tabular-nums">{advanceDueCount} Projects</span>
            </div>
            <div className="bg-white/80 border border-amber-100 rounded-lg p-2 flex items-center justify-between">
              <span className="text-neutral-500 text-[11px]">Final Settlement:</span>
              <span className="font-bold text-neutral-800 tabular-nums">{settlementDueCount} Projects</span>
            </div>
            <div className="bg-white/80 border border-amber-100 rounded-lg p-2 flex items-center justify-between">
              <span className="text-neutral-500 text-[11px]">Selected:</span>
              <span className="font-bold text-emerald-800 tabular-nums">
                {selectedIds.length} of {pendingItems.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Table & Action Controls */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Filter Tabs and Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  filterType === 'all'
                    ? 'bg-amber-900 text-white font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                All Outstanding ({pendingItems.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('advance')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  filterType === 'advance'
                    ? 'bg-amber-900 text-white font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Advance Due ({advanceDueCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('progress')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  filterType === 'progress'
                    ? 'bg-amber-900 text-white font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Milestones In Progress ({pendingItems.length - advanceDueCount - settlementDueCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('settlement')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  filterType === 'settlement'
                    ? 'bg-amber-900 text-white font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Final Settlement ({settlementDueCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search debtor client, code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700 font-medium"
              />
            </div>
          </div>

          {/* Bulk Action Strip when 1+ selected */}
          {selectedIds.length > 0 && (
            <div className="bg-amber-100/70 border border-amber-300/80 rounded-xl p-2.5 px-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-950">
                  {selectedIds.length} Client{selectedIds.length > 1 ? 's' : ''} Selected
                </span>
                <span className="text-amber-700">·</span>
                <span className="text-amber-900 font-semibold">
                  Total:{' '}
                  {formatCurrency(
                    pendingItems
                      .filter(i => selectedIds.includes(i.project.id))
                      .reduce((s, i) => s + i.fin.outstandingReceivable, 0),
                    currency
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenBulkReminders}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold shadow-2xs transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send WhatsApp / Email Reminders ({selectedIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="px-2.5 py-1 text-neutral-600 hover:text-neutral-900 font-medium"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Collections Table */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3 w-8">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-neutral-600 hover:text-neutral-900 flex items-center"
                        title={isAllSelected ? 'Deselect All' : 'Select All'}
                      >
                        {isAllSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-800" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-400" />
                        )}
                      </button>
                    </th>
                    <th className="py-2.5 px-3">Project & Client Details</th>
                    <th className="py-2.5 px-3">Current Milestone / Stage</th>
                    <th className="py-2.5 px-3 text-right">Contract Value</th>
                    <th className="py-2.5 px-3 text-right">Paid to Date</th>
                    <th className="py-2.5 px-3 text-right">Outstanding Balance</th>
                    <th className="py-2.5 px-3 text-center">Dispatch Reminders</th>
                    <th className="py-2.5 px-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredItems.map(item => {
                    const { project: p, fin, statusCategory } = item;
                    const isSelected = selectedIds.includes(p.id);

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-amber-50/70' : 'hover:bg-neutral-50/70'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleItem(p.id)}
                            className="text-neutral-600 hover:text-neutral-900 flex items-center"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-800" />
                            ) : (
                              <Square className="w-4 h-4 text-neutral-400" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-neutral-900">{p.step1Enquiry.clientName}</div>
                          <div className="text-[11px] text-neutral-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{p.code}</span>
                            <span>•</span>
                            <span className="truncate max-w-[180px]">{p.title}</span>
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            📞 {p.step1Enquiry.phone || 'N/A'} · ✉️ {p.step1Enquiry.email || 'N/A'}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              statusCategory === 'advance'
                                ? 'bg-rose-100 text-rose-800'
                                : statusCategory === 'settlement'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {statusCategory === 'advance'
                              ? 'Advance Due'
                              : statusCategory === 'settlement'
                              ? 'Final Settlement Pending'
                              : 'Milestone Part-Payment'}
                          </span>
                          <div className="text-[10px] text-neutral-500 mt-1 capitalize">
                            Phase: {p.currentStage.replace('_', ' ')}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-medium text-neutral-900 tabular-nums">
                          {formatCurrency(fin.totalContractValue, currency)}
                        </td>

                        <td className="py-3 px-3 text-right tabular-nums">
                          <div className="font-semibold text-emerald-800">
                            {formatCurrency(fin.totalCollected, currency)}
                          </div>
                          <div className="text-[10px] text-neutral-500 mt-0.5">
                            {fin.collectionProgressPercent}% collected
                          </div>
                          <div className="w-20 ml-auto bg-neutral-200 rounded-full h-1 mt-1 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full rounded-full"
                              style={{ width: `${Math.min(100, fin.collectionProgressPercent)}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-amber-900 tabular-nums text-sm">
                          {formatCurrency(fin.outstandingReceivable, currency)}
                        </td>

                        {/* Remind Actions */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDirectWhatsApp(item)}
                              className="p-1.5 text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs"
                              title={`Direct WhatsApp to ${p.step1Enquiry.clientName} (${p.step1Enquiry.phone})`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDirectEmail(item)}
                              className="p-1.5 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg transition-colors"
                              title={`Send Email to ${p.step1Enquiry.email}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenSingleReminder(item)}
                              className="px-2 py-1 text-[11px] font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                              title="Customize and preview reminder"
                            >
                              Customize
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => selectProject(p.id, 'settlement')}
                            className="p-1 text-neutral-400 hover:text-emerald-800 transition-colors"
                            title="Open Project Settlement Ledger"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment Reminder Modal */}
      {reminderModalData.isOpen && (
        <PaymentReminderModal
          recipients={reminderModalData.recipients}
          currency={currency}
          onClose={() => setReminderModalData({ isOpen: false, recipients: [] })}
        />
      )}
    </div>
  );
};
