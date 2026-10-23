import React, { useState } from 'react';
import { LandscapingProject } from '../../types/landscaping';
import { PnlExportService } from '../../utils/pnlExportService';
import { calculateProjectFinancials, formatCurrency } from '../../utils/calculations';
import {
  X,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Layers,
  HardHat,
  Receipt,
  FileText,
  Building,
} from 'lucide-react';

interface PnLExportModalProps {
  projects: LandscapingProject[];
  defaultProjectId?: string;
  currency: string;
  onClose: () => void;
}

export const PnLExportModal: React.FC<PnLExportModalProps> = ({
  projects,
  defaultProjectId,
  currency,
  onClose,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId || projects[0]?.id || ''
  );
  const [exportMode, setExportMode] = useState<'single' | 'portfolio'>('single');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const selectedProjectFin = selectedProject ? calculateProjectFinancials(selectedProject) : null;

  const handleExport = () => {
    if (exportMode === 'single' && selectedProject) {
      PnlExportService.exportProjectPnLToCsv(selectedProject, currency);
      setDownloadSuccess(`Exported ${selectedProject.code} P&L and daily expense ledger!`);
    } else {
      PnlExportService.exportPortfolioPnLToCsv(projects, currency);
      setDownloadSuccess(`Exported portfolio P&L matrix for ${projects.length} projects!`);
    }

    setTimeout(() => {
      setDownloadSuccess(null);
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl my-8 border border-neutral-200 overflow-hidden text-neutral-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-800 text-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold tracking-tight">Export P&L & Expenses Report</h2>
              <p className="text-xs text-emerald-200">
                Formatted CSV / Excel export for accounting, external auditing, and management reporting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Export Scope Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700">Choose Report Scope</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportMode('single')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  exportMode === 'single'
                    ? 'border-emerald-700 bg-emerald-50/60 ring-1 ring-emerald-700'
                    : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                }`}
              >
                <div className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Single Project Audit</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Full P&L statement + itemized daily operations & expenses ledger
                </p>
              </button>

              <button
                type="button"
                onClick={() => setExportMode('portfolio')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  exportMode === 'portfolio'
                    ? 'border-emerald-700 bg-emerald-50/60 ring-1 ring-emerald-700'
                    : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                }`}
              >
                <div className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>Full Portfolio Matrix</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Cross-project comparison across all {projects.length} contracted sites
                </p>
              </button>
            </div>
          </div>

          {/* Project Dropdown if Single Mode */}
          {exportMode === 'single' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Select Landscaping Project</label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.title} ({p.step1Enquiry.clientName})
                  </option>
                ))}
              </select>

              {/* Selected Project Quick Snapshot */}
              {selectedProject && selectedProjectFin && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 mt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs border-b border-neutral-200 pb-2">
                    <div>
                      <span className="font-bold text-neutral-900">{selectedProject.title}</span>
                      <span className="text-neutral-500 text-[11px] block">
                        Client: {selectedProject.step1Enquiry.clientName} · {selectedProject.step1Enquiry.city}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-neutral-200 text-neutral-700">
                      {selectedProject.currentStage.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Contract Value:</span>
                      <span className="font-bold text-neutral-900 tabular-nums">
                        {formatCurrency(selectedProjectFin.totalContractValue, currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Actual Expenses:</span>
                      <span className="font-bold text-neutral-900 tabular-nums">
                        {formatCurrency(selectedProjectFin.totalExpenses, currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Realized Profit:</span>
                      <span className="font-bold text-emerald-800 tabular-nums">
                        {formatCurrency(selectedProjectFin.realizedProfit, currency)} ({selectedProjectFin.realizedMarginPercent}%)
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-neutral-500 pt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>
                      Includes {(selectedProject.step5DailyOperations || []).length} recorded daily expense logs & worker muster rolls
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Included Data Checklist */}
          <div className="border border-neutral-200 rounded-xl p-3 bg-neutral-50/70 text-xs space-y-2">
            <span className="font-bold text-neutral-800 block text-[11px] uppercase tracking-wider">
              Included In Exported Report
            </span>
            <div className="grid grid-cols-2 gap-2 text-neutral-600 text-[11px]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Executive P&L Summary</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Labour & Supervisor Wages</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cash Inflow & Receivables</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Site Refreshments & Fuel Log</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Materials & Plants Logged</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Excel UTF-8 Compatible (BOM)</span>
              </div>
            </div>
          </div>

          {/* Download feedback alert */}
          {downloadSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-semibold">{downloadSuccess}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-neutral-200 px-6 py-4 bg-neutral-50 flex items-center justify-between">
          <div className="text-[11px] text-neutral-500">
            Format: Standard RFC 4180 CSV (compatible with Excel, Sheets, Numbers)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={projects.length === 0}
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>
                {projects.length === 0
                  ? 'No Projects to Export'
                  : exportMode === 'single'
                  ? `Download ${selectedProject?.code || 'Project'} CSV`
                  : 'Download Portfolio CSV'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
