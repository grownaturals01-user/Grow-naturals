import React, { useState } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { calculateProjectFinancials, formatCurrency } from '../../utils/calculations';
import { PnlExportService } from '../../utils/pnlExportService';
import { PnLExportModal } from '../modals/PnLExportModal';
import {
  ArrowLeft,
  Download,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Filter,
  TrendingUp,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';

export const PnLAnalyticsView: React.FC = () => {
  const { projects, setCurrentView, selectProject, currency } = useProjects();
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProjectId, setExportProjectId] = useState<string | undefined>(projects[0]?.id);
  const [filterMode, setFilterMode] = useState<'all' | 'warning' | 'healthy'>('all');

  let totalContractPortfolio = 0;
  let totalCollections = 0;
  let totalLabourCost = 0;
  let totalMaterialsCost = 0;
  let totalDailySiteExpenses = 0;
  let totalExpenses = 0;
  let totalProfit = 0;
  let totalOutstanding = 0;

  const projectAnalytics = projects.map(p => {
    const fin = calculateProjectFinancials(p);
    totalContractPortfolio += fin.totalContractValue;
    totalCollections += fin.totalCollected;
    totalLabourCost += fin.expenseBreakdown.totalLabourCost;
    totalMaterialsCost += fin.expenseBreakdown.materialsUsedTotal;
    totalDailySiteExpenses += fin.expenseBreakdown.totalDailySiteExpenses + fin.expenseBreakdown.supervisorSalaryTotal;
    totalExpenses += fin.totalExpenses;
    totalProfit += fin.realizedProfit;
    totalOutstanding += fin.outstandingReceivable;

    // Budget burn calculation
    const budgetAllocated = fin.totalContractValue;
    const expensesIncurred = fin.totalExpenses;
    const burnPercent = budgetAllocated > 0 ? (expensesIncurred / budgetAllocated) * 100 : 0;
    const roundedBurn = Math.round(burnPercent * 10) / 10;
    const isOverBudget = roundedBurn >= 100;
    const isWarning = roundedBurn >= 80;
    const budgetRemaining = Math.max(0, budgetAllocated - expensesIncurred);
    const budgetOverrun = isOverBudget ? expensesIncurred - budgetAllocated : 0;

    return {
      project: p,
      fin,
      budgetAllocated,
      expensesIncurred,
      burnPercent: roundedBurn,
      isOverBudget,
      isWarning,
      budgetRemaining,
      budgetOverrun,
    };
  });

  const warningProjects = projectAnalytics.filter(pa => pa.isWarning);
  const healthyProjects = projectAnalytics.filter(pa => !pa.isWarning);
  const overBudgetProjects = projectAnalytics.filter(pa => pa.isOverBudget);

  const filteredAnalytics = projectAnalytics.filter(pa => {
    if (filterMode === 'warning') return pa.isWarning;
    if (filterMode === 'healthy') return !pa.isWarning;
    return true;
  });

  const overallMargin = totalCollections > 0 ? (totalProfit / totalCollections) * 100 : 0;
  const portfolioBurn = totalContractPortfolio > 0 ? Math.round((totalExpenses / totalContractPortfolio) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Navigation & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 font-medium mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </button>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Landscaping Portfolio Profit & Loss (P&L) Matrix
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Comprehensive financial performance, cost breakdown, budget consumption audit, and collection tracking.
          </p>
        </div>

        {/* Download Report Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setExportProjectId(projects[0]?.id);
              setShowExportModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
            title="Download formatted P&L summary and daily expenses report (CSV / Excel)"
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Budget Consumption Warning Alert Banner (When >=80% budget consumed) */}
      {warningProjects.length > 0 && (
        <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-4 sm:p-5 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-amber-950">
                    Budget Consumption Warning: {warningProjects.length} Project{warningProjects.length > 1 ? 's' : ''} Exceeding 80% Allocated Budget
                  </h2>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-200 text-amber-900 rounded-md">
                    {overBudgetProjects.length > 0
                      ? `${overBudgetProjects.length} Over Budget, ${warningProjects.length - overBudgetProjects.length} Approaching Limit`
                      : 'Action Required'}
                  </span>
                </div>
                <p className="text-xs text-amber-800/90 mt-1 max-w-3xl">
                  Actual expenses (daily labor wages, materials delivered, and site operations) have consumed more than 80% of the total contracted quotation. Immediate budget review recommended to prevent margin shrinkage.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFilterMode(filterMode === 'warning' ? 'all' : 'warning')}
              className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                filterMode === 'warning'
                  ? 'bg-amber-700 text-white border-amber-800'
                  : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100/70'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{filterMode === 'warning' ? 'Show All Projects' : `Filter Warning Projects (${warningProjects.length})`}</span>
            </button>
          </div>

          {/* Warning Cards Mini Grid */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-amber-200/80">
            {warningProjects.map(({ project, fin, budgetAllocated, expensesIncurred, burnPercent, isOverBudget, budgetRemaining, budgetOverrun }) => (
              <div
                key={project.id}
                className="bg-white/90 border border-amber-200 rounded-lg p-3.5 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-neutral-900 truncate" title={project.title}>
                      {project.title}
                    </h3>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {project.code} · {project.step1Enquiry.clientName}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-bold ${
                      isOverBudget
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {burnPercent}%
                  </span>
                </div>

                {/* Progress Meter */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex justify-between text-[11px] text-neutral-600">
                    <span>Expenses Incurred</span>
                    <span className="font-semibold text-neutral-900 tabular-nums">
                      {formatCurrency(expensesIncurred, currency)} / {formatCurrency(budgetAllocated, currency)}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverBudget ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, burnPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">
                    {isOverBudget ? (
                      <span className="text-rose-700 font-semibold">
                        Overrun: +{formatCurrency(budgetOverrun, currency)}
                      </span>
                    ) : (
                      <span>
                        Buffer left: <strong className="text-neutral-800">{formatCurrency(budgetRemaining, currency)}</strong>
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => selectProject(project.id, 'daily_operations')}
                    className="text-emerald-800 hover:text-emerald-950 font-semibold inline-flex items-center gap-0.5"
                  >
                    <span>Audit Costs</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High Level Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <span className="text-xs font-medium text-neutral-500">Gross Contract Pipeline</span>
          <div className="text-2xl font-bold text-neutral-900 tabular-nums mt-1">
            {formatCurrency(totalContractPortfolio, currency)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">Across {projects.length} contracted sites</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <span className="text-xs font-medium text-neutral-500">Total Cash Inflow</span>
          <div className="text-2xl font-bold text-emerald-800 tabular-nums mt-1">
            {formatCurrency(totalCollections, currency)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Pending collection: {formatCurrency(totalOutstanding, currency)}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Total Actual Costs</span>
            {warningProjects.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                {warningProjects.length} at risk
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-neutral-900 tabular-nums mt-1">
            {formatCurrency(totalExpenses, currency)}
          </div>
          <div className="text-xs text-neutral-500 mt-1 flex items-center justify-between">
            <span>Direct wages, materials & ops</span>
            <span className="font-semibold text-neutral-700">{portfolioBurn}% portfolio burn</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <span className="text-xs font-medium text-neutral-500">Realized Net Profit</span>
          <div className={`text-2xl font-bold tabular-nums mt-1 ${totalProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
            {formatCurrency(totalProfit, currency)}
          </div>
          <div className="text-xs font-semibold text-neutral-600 mt-1">
            {Math.round(overallMargin * 10) / 10}% Average Net Margin
          </div>
        </div>
      </div>

      {/* Cost Structure Distribution */}
      {totalExpenses > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-neutral-900">Direct Cost Distribution (Portfolio Aggregate)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
              <span className="text-neutral-500 block">Labour & Daily Wages</span>
              <span className="text-base font-bold text-neutral-900 tabular-nums">
                {formatCurrency(totalLabourCost, currency)}
              </span>
              <span className="text-[11px] text-neutral-500 block mt-0.5">
                {Math.round((totalLabourCost / totalExpenses) * 100)}% of total cost
              </span>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
              <span className="text-neutral-500 block">Materials & Plants Used</span>
              <span className="text-base font-bold text-neutral-900 tabular-nums">
                {formatCurrency(totalMaterialsCost, currency)}
              </span>
              <span className="text-[11px] text-neutral-500 block mt-0.5">
                {Math.round((totalMaterialsCost / totalExpenses) * 100)}% of total cost
              </span>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
              <span className="text-neutral-500 block">Daily Site Ops & Tea/Food</span>
              <span className="text-base font-bold text-neutral-900 tabular-nums">
                {formatCurrency(totalDailySiteExpenses, currency)}
              </span>
              <span className="text-[11px] text-neutral-500 block mt-0.5">
                {Math.round((totalDailySiteExpenses / totalExpenses) * 100)}% of total cost
              </span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="text-emerald-900 font-bold block">Portfolio Profitability</span>
              <span className="text-base font-bold text-emerald-950 tabular-nums">
                {formatCurrency(totalProfit, currency)}
              </span>
              <span className="text-[11px] text-emerald-800 block mt-0.5">
                {Math.round(overallMargin)}% Realized Margin
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Project-by-Project P&L Comparison Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        {/* Table Toolbar with Filters */}
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Project Financial Audit & Budget Consumption Ledger</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Live tracking of allocated contract budgets against accrued site expenses and collections.
            </p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                filterMode === 'all'
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All ({projectAnalytics.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('warning')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                filterMode === 'warning'
                  ? 'bg-amber-500 text-white shadow-2xs font-bold'
                  : warningProjects.length > 0
                  ? 'text-amber-800 hover:bg-amber-50'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>&gt;80% Warning ({warningProjects.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('healthy')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                filterMode === 'healthy'
                  ? 'bg-emerald-800 text-white shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Healthy ({healthyProjects.length})</span>
            </button>
          </div>
        </div>

        {/* The Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
              <tr>
                <th className="py-3 px-3.5 text-left">Project / Client</th>
                <th className="py-3 px-3 text-right">Contract Budget</th>
                <th className="py-3 px-3 text-right">Total Expenses</th>
                <th className="py-3 px-3.5 min-w-[140px] text-center">Budget Consumed</th>
                <th className="py-3 px-3 text-right">Collected</th>
                <th className="py-3 px-3 text-right">Labour Cost</th>
                <th className="py-3 px-3 text-right">Materials Cost</th>
                <th className="py-3 px-3 text-right">Daily Site Exp.</th>
                <th className="py-3 px-3 text-right">Net Profit</th>
                <th className="py-3 px-3 text-right">Margin %</th>
                <th className="py-3 px-3 text-right">Outstanding</th>
                <th className="py-3 px-3 text-center">Export / View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-150">
              {filteredAnalytics.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                      <p className="text-sm font-semibold text-neutral-800">
                        {filterMode === 'warning'
                          ? 'No projects currently exceed 80% budget consumption.'
                          : 'No projects match the selected filter.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setFilterMode('all')}
                        className="text-xs font-semibold text-emerald-800 hover:underline mt-1"
                      >
                        Reset to view all projects
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAnalytics.map(({ project, fin, budgetAllocated, expensesIncurred, burnPercent, isOverBudget, isWarning, budgetRemaining, budgetOverrun }) => (
                  <tr
                    key={project.id}
                    className={`transition-colors ${
                      isOverBudget
                        ? 'bg-rose-50/60 hover:bg-rose-50/90 border-l-4 border-l-rose-500'
                        : isWarning
                        ? 'bg-amber-50/60 hover:bg-amber-50/90 border-l-4 border-l-amber-500'
                        : 'hover:bg-neutral-50/70 border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* Project & Client */}
                    <td className="py-3.5 px-3.5">
                      <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                        <span>{project.title}</span>
                        {isOverBudget && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300"
                            title={`Critical budget overrun of +${formatCurrency(budgetOverrun, currency)}`}
                          >
                            <AlertCircle className="w-2.5 h-2.5 mr-0.5 text-rose-600" />
                            Over Budget
                          </span>
                        )}
                        {!isOverBudget && isWarning && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                            title={`Warning: ${burnPercent}% of allocated budget consumed`}
                          >
                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5 text-amber-700" />
                            &gt;80% Limit
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        {project.code} · {project.step1Enquiry.clientName}
                      </div>
                    </td>

                    {/* Allocated Contract Budget */}
                    <td className="py-3.5 px-3 text-right font-semibold text-neutral-900 tabular-nums">
                      {formatCurrency(fin.totalContractValue, currency)}
                    </td>

                    {/* Total Expenses Incurred */}
                    <td className="py-3.5 px-3 text-right font-bold tabular-nums">
                      <span className={isOverBudget ? 'text-rose-700' : isWarning ? 'text-amber-800' : 'text-neutral-900'}>
                        {formatCurrency(fin.totalExpenses, currency)}
                      </span>
                    </td>

                    {/* Budget Consumed % & Progress Visual Indicator */}
                    <td className="py-3.5 px-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`font-bold tabular-nums ${
                              isOverBudget
                                ? 'text-rose-700'
                                : isWarning
                                ? 'text-amber-800'
                                : 'text-neutral-800'
                            }`}
                          >
                            {burnPercent}%
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            {isOverBudget ? (
                              <span className="text-rose-600 font-semibold">Overrun</span>
                            ) : (
                              <span>{formatCurrency(budgetRemaining, currency)} left</span>
                            )}
                          </span>
                        </div>
                        {/* Visual Progress Bar */}
                        <div className="w-full bg-neutral-200/90 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOverBudget
                                ? 'bg-rose-500'
                                : isWarning
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.min(100, burnPercent)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Cash Inflow Collected */}
                    <td className="py-3.5 px-3 text-right font-semibold text-emerald-800 tabular-nums">
                      {formatCurrency(fin.totalCollected, currency)}
                    </td>

                    {/* Labour Cost */}
                    <td className="py-3.5 px-3 text-right tabular-nums text-neutral-700">
                      {formatCurrency(fin.expenseBreakdown.totalLabourCost, currency)}
                    </td>

                    {/* Materials Cost */}
                    <td className="py-3.5 px-3 text-right tabular-nums text-neutral-700">
                      {formatCurrency(fin.expenseBreakdown.materialsUsedTotal, currency)}
                    </td>

                    {/* Daily Site Ops */}
                    <td className="py-3.5 px-3 text-right tabular-nums text-neutral-700">
                      {formatCurrency(fin.expenseBreakdown.totalDailySiteExpenses + fin.expenseBreakdown.supervisorSalaryTotal, currency)}
                    </td>

                    {/* Net Realized Profit */}
                    <td className={`py-3.5 px-3 text-right font-bold tabular-nums ${fin.realizedProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {formatCurrency(fin.realizedProfit, currency)}
                    </td>

                    {/* Margin % */}
                    <td className="py-3.5 px-3 text-right font-semibold tabular-nums text-neutral-800">
                      {fin.realizedMarginPercent}%
                    </td>

                    {/* Outstanding Receivable */}
                    <td className="py-3.5 px-3 text-right font-semibold text-amber-800 tabular-nums">
                      {formatCurrency(fin.outstandingReceivable, currency)}
                    </td>

                    {/* Actions: Export & Drilldown */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => PnlExportService.exportProjectPnLToCsv(project, currency)}
                          className="btn btn-sm btn-outline-success py-1 px-2 fs-11 fw-semibold d-inline-flex align-items-center gap-1 shadow-none"
                          title={`Download ${project.code} P&L & Daily Expenses (CSV)`}
                        >
                          <Download size={12} />
                          <span>CSV</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => selectProject(project.id, isWarning ? 'daily_operations' : 'settlement')}
                          className="btn btn-sm btn-outline-secondary p-1 shadow-none"
                          title={isWarning ? 'Audit Daily Expenses & Operations' : 'Open Settlement Details'}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary Status */}
        <div className="p-3.5 bg-neutral-50/80 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-neutral-600 gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Healthy (&lt;80%)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              High Burn (80%–99.9%)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Over Budget (≥100%)
            </span>
          </div>

          <div className="text-neutral-500">
            Showing {filteredAnalytics.length} of {projectAnalytics.length} contracted projects
          </div>
        </div>
      </div>

      {/* PnL Export Modal */}
      {showExportModal && (
        <PnLExportModal
          projects={projects}
          defaultProjectId={exportProjectId}
          currency={currency}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};
