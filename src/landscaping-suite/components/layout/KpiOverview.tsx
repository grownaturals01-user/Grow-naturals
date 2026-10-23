import React from 'react';
import { useProjects } from '../../context/ProjectContext';
import { calculateProjectFinancials, formatCurrency } from '../../utils/calculations';
import { FolderGit2, Banknote, ArrowDownRight, ArrowUpRight, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export type KpiDisplayMode = 'cards' | 'compact' | 'collapsed';

interface KpiOverviewProps {
  isCompact?: boolean;
  mode?: KpiDisplayMode;
  onExpand?: () => void;
}

export const KpiOverview: React.FC<KpiOverviewProps> = ({ isCompact, mode = isCompact ? 'compact' : 'cards', onExpand }) => {
  const { projects, currency } = useProjects();

  let totalContractValue = 0;
  let totalCollected = 0;
  let totalExpenses = 0;
  let totalOutstanding = 0;
  let completedCount = 0;
  let activeCount = 0;

  projects.forEach(p => {
    const fin = calculateProjectFinancials(p);
    totalContractValue += fin.totalContractValue;
    totalCollected += fin.totalCollected;
    totalExpenses += fin.totalExpenses;
    totalOutstanding += fin.outstandingReceivable;
    if (p.currentStage === 'settlement' && p.step7Settlement.isCompleted) {
      completedCount++;
    } else {
      activeCount++;
    }
  });

  const netRealizedProfit = totalCollected - totalExpenses;
  const overallMargin = totalContractValue > 0 ? ((totalContractValue - totalExpenses) / totalContractValue) * 100 : 0;
  const collectedPct = totalContractValue > 0 ? Math.round((totalCollected / totalContractValue) * 100) : 0;

  // Mode 1: Collapsed Ribbon (Minimal 1-line bar)
  if (mode === 'collapsed') {
    return (
      <div
        onClick={onExpand}
        className="group bg-white hover:bg-neutral-50 border border-neutral-200/90 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs cursor-pointer transition-all"
      >
        <div className="flex items-center gap-2 flex-wrap text-neutral-700">
          <span className="font-bold text-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Summary:</span>
          </span>
          <span className="font-semibold text-neutral-900">{activeCount} Active</span>
          <span className="text-neutral-300">·</span>
          <span>Value <strong className="font-mono tabular-nums text-neutral-900">{formatCurrency(totalContractValue, currency)}</strong></span>
          <span className="text-neutral-300">·</span>
          <span className="text-emerald-700 font-semibold">Received <strong className="font-mono tabular-nums">{formatCurrency(totalCollected, currency)}</strong> ({collectedPct}%)</span>
          <span className="text-neutral-300">·</span>
          <span className={`font-bold font-mono tabular-nums ${netRealizedProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
            Profit {formatCurrency(netRealizedProfit, currency)}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onExpand?.(); }}
          className="self-start sm:self-center text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
        >
          <span>Show Numbers</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Mode 2: Compact Single-Row
  if (mode === 'compact') {
    return (
      <div className="bg-white border border-neutral-200/90 rounded-xl p-2.5 sm:p-3 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="p-2 rounded-lg bg-neutral-50/80 border border-neutral-100">
            <div className="text-[11px] text-neutral-500 font-medium">Active Projects</div>
            <div className="text-sm font-bold text-neutral-900 font-mono mt-0.5">{activeCount} jobs</div>
          </div>
          <div className="p-2 rounded-lg bg-neutral-50/80 border border-neutral-100">
            <div className="text-[11px] text-neutral-500 font-medium">Total Project Value</div>
            <div className="text-sm font-bold text-neutral-900 font-mono mt-0.5 truncate">{formatCurrency(totalContractValue, currency)}</div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <div className="text-[11px] text-emerald-900 font-medium">Payments Received</div>
            <div className="text-sm font-bold text-emerald-800 font-mono mt-0.5 truncate">{formatCurrency(totalCollected, currency)} ({collectedPct}%)</div>
          </div>
          <div className="p-2 rounded-lg bg-neutral-50/80 border border-neutral-100">
            <div className="text-[11px] text-neutral-500 font-medium">Estimated Profit</div>
            <div className={`text-sm font-bold font-mono mt-0.5 truncate ${netRealizedProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
              {formatCurrency(netRealizedProfit, currency)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode 3: Clean, Friendly Cards (Beginner-Friendly Terms)
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}
    >
      {/* Card 1: Active Projects */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
          <span className="font-semibold text-neutral-700">Active Jobs</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <FolderGit2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-mono tabular-nums">
            {activeCount}
          </span>
          <span className="text-xs text-neutral-500 font-medium">
            in progress
          </span>
        </div>
        <div className="mt-2 text-xs text-neutral-400">
          {completedCount} completed · {projects.length} total jobs
        </div>
      </div>

      {/* Card 2: Total Project Value */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
          <span className="font-semibold text-neutral-700">Total Project Value</span>
          <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center">
            <Banknote className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-xl sm:text-2xl font-extrabold text-neutral-900 font-mono tabular-nums block truncate">
            {formatCurrency(totalContractValue, currency)}
          </span>
        </div>
        <div className="mt-2 text-xs text-neutral-400">
          Approved customer quotations
        </div>
      </div>

      {/* Card 3: Payments Collected */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
          <span className="font-semibold text-neutral-700">Payments Received</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-1">
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-800 font-mono tabular-nums truncate">
            {formatCurrency(totalCollected, currency)}
          </span>
          <span className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 px-1.5 py-0.5 rounded-md">
            {collectedPct}%
          </span>
        </div>
        {/* Simple Progress Bar */}
        <div className="mt-2.5 space-y-1">
          <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
            <div
              style={{ width: `${Math.min(100, collectedPct)}%` }}
              className="bg-emerald-600 h-full rounded-full transition-all"
            />
          </div>
          <div className="text-[11px] text-neutral-400">
            {formatCurrency(totalOutstanding, currency)} left to collect
          </div>
        </div>
      </div>

      {/* Card 4: Estimated Profit */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
          <span className="font-semibold text-neutral-700">Estimated Profit</span>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            netRealizedProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-1">
          <span className={`text-xl sm:text-2xl font-extrabold font-mono tabular-nums truncate ${
            netRealizedProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'
          }`}>
            {formatCurrency(netRealizedProfit, currency)}
          </span>
          <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-md ${
            netRealizedProfit >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {Math.round(overallMargin * 10) / 10}%
          </span>
        </div>
        <div className="mt-2 text-xs text-neutral-400">
          After site wages & materials
        </div>
      </div>
    </div>
  );
};
