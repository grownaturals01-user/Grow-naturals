import React, { useState } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { calculateDailyLogTotal, formatCurrency } from '../../utils/calculations';
import { HardHat, Coffee, Utensils, Fuel, Truck, Wrench, Search, ArrowLeft, Filter } from 'lucide-react';

export const DailyLedgerView: React.FC = () => {
  const { projects, setCurrentView, selectProject, currency } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Collect all daily logs across projects
  const allLogs: Array<{
    projectId: string;
    projectCode: string;
    projectTitle: string;
    log: any;
  }> = [];

  projects.forEach(p => {
    (p.step5DailyOperations || []).forEach(log => {
      allLogs.push({
        projectId: p.id,
        projectCode: p.code,
        projectTitle: p.title,
        log,
      });
    });
  });

  // Sort by date descending
  allLogs.sort((a, b) => new Date(b.log.date).getTime() - new Date(a.log.date).getTime());

  // Filter
  const filteredLogs = allLogs.filter(entry => {
    if (selectedProjectId !== 'all' && entry.projectId !== selectedProjectId) return false;
    if (searchTerm) {
      const match =
        entry.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.log.workSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.log.date.includes(searchTerm);
      if (!match) return false;
    }
    return true;
  });

  // Calculate totals across filtered logs
  let totalWages = 0;
  let totalSupervisor = 0;
  let totalTea = 0;
  let totalFood = 0;
  let totalFuel = 0;
  let totalTempo = 0;
  let totalMaterials = 0;

  filteredLogs.forEach(entry => {
    const calc = calculateDailyLogTotal(entry.log);
    totalWages += calc.labourCost;
    totalSupervisor += calc.supervisorCost;
    totalMaterials += calc.materialsCost;

    (entry.log.expenses || []).forEach((exp: any) => {
      const amt = Number(exp.amount) || 0;
      switch (exp.category) {
        case 'Tea & Snacks':
          totalTea += amt;
          break;
        case 'Food & Meals':
          totalFood += amt;
          break;
        case 'Fuel & Diesel':
          totalFuel += amt;
          break;
        case 'Local Tempo / Transport':
          totalTempo += amt;
          break;
      }
    });
  });

  const grandTotal = totalWages + totalSupervisor + totalTea + totalFood + totalFuel + totalTempo + totalMaterials;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 font-medium mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </button>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Daily Project Operations & Expense Register
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Cross-project audit of daily worker muster, wages, supervisor salaries, materials, and daily site expenses (tea, food, fuel, transport).
          </p>
        </div>
      </div>

      {/* Aggregate Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white border border-neutral-200 rounded-xl p-3">
          <span className="text-[11px] text-neutral-500 font-medium block">Daily Worker Wages</span>
          <span className="text-base font-bold text-neutral-900 tabular-nums">
            {formatCurrency(totalWages, currency)}
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3">
          <span className="text-[11px] text-neutral-500 font-medium block">Supervisor Salary</span>
          <span className="text-base font-bold text-neutral-900 tabular-nums">
            {formatCurrency(totalSupervisor, currency)}
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3">
          <span className="text-[11px] text-neutral-500 font-medium block flex items-center gap-1">
            <Coffee className="w-3 h-3 text-amber-600" />
            <span>Tea & Chai</span>
          </span>
          <span className="text-base font-bold text-neutral-900 tabular-nums">
            {formatCurrency(totalTea, currency)}
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3">
          <span className="text-[11px] text-neutral-500 font-medium block flex items-center gap-1">
            <Utensils className="w-3 h-3 text-orange-600" />
            <span>Food & Meals</span>
          </span>
          <span className="text-base font-bold text-neutral-900 tabular-nums">
            {formatCurrency(totalFood, currency)}
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3">
          <span className="text-[11px] text-neutral-500 font-medium block flex items-center gap-1">
            <Fuel className="w-3 h-3 text-red-600" />
            <span>Fuel / Diesel</span>
          </span>
          <span className="text-base font-bold text-neutral-900 tabular-nums">
            {formatCurrency(totalFuel, currency)}
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3">
          <span className="text-[11px] text-neutral-500 font-medium block flex items-center gap-1">
            <Truck className="w-3 h-3 text-blue-600" />
            <span>Tempo / Freight</span>
          </span>
          <span className="text-base font-bold text-neutral-900 tabular-nums">
            {formatCurrency(totalTempo, currency)}
          </span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <span className="text-[11px] text-emerald-900 font-bold block">Grand Operations Total</span>
          <span className="text-base font-bold text-emerald-950 tabular-nums">
            {formatCurrency(grandTotal, currency)}
          </span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <span>Filter Project:</span>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="px-2.5 py-1 text-xs border border-neutral-300 rounded-lg bg-white"
            >
              <option value="all">All Active Landscaping Sites</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search notes, date or site..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-300 rounded-lg"
          />
        </div>
      </div>

      {/* Table of all daily logs */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-3 text-left">Date</th>
                <th className="py-2.5 px-3 text-left">Project Site</th>
                <th className="py-2.5 px-3 text-right">Workers & Wage Total</th>
                <th className="py-2.5 px-3 text-right">Supervisor Share</th>
                <th className="py-2.5 px-3 text-right">Tea & Snacks</th>
                <th className="py-2.5 px-3 text-right">Food Meals</th>
                <th className="py-2.5 px-3 text-right">Fuel / Transport</th>
                <th className="py-2.5 px-3 text-right">Day Total ({currency})</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500">
                    <HardHat className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="font-semibold text-neutral-700">No Daily Operation Logs Recorded</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Daily site wages, tea/food expenses, and field activities will automatically compile here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry, idx) => {
                  const calc = calculateDailyLogTotal(entry.log);
                const tea = (entry.log.expenses || []).find((e: any) => e.category === 'Tea & Snacks')?.amount || 0;
                const food = (entry.log.expenses || []).find((e: any) => e.category === 'Food & Meals')?.amount || 0;
                const fuelTempo = (entry.log.expenses || []).reduce((sum: number, e: any) => {
                  if (e.category === 'Fuel & Diesel' || e.category === 'Local Tempo / Transport') {
                    return sum + Number(e.amount);
                  }
                  return sum;
                }, 0);

                return (
                  <tr key={idx} className="hover:bg-neutral-50/70">
                    <td className="py-3 px-3 font-semibold text-neutral-900 whitespace-nowrap text-left">
                      {entry.log.date}
                    </td>
                    <td className="py-3 px-3 text-left">
                      <div className="font-semibold text-neutral-900 line-clamp-1">{entry.projectTitle}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">{entry.projectCode}</div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="font-semibold text-neutral-900 tabular-nums">
                        {formatCurrency(calc.labourCost, currency)}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {entry.log.workers.skilledWorkersCount}S + {entry.log.workers.unskilledWorkersCount}H
                        {entry.log.workers.contractLabourAmount > 0 ? ' + Contract' : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold text-neutral-800">
                      {formatCurrency(calc.supervisorCost, currency)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-neutral-800">
                      {tea > 0 ? formatCurrency(tea, currency) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-neutral-800">
                      {food > 0 ? formatCurrency(food, currency) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-neutral-800">
                      {fuelTempo > 0 ? formatCurrency(fuelTempo, currency) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-neutral-900 tabular-nums">
                      {formatCurrency(calc.dayTotal, currency)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => selectProject(entry.projectId, 'daily_operations')}
                        className="btn btn-sm btn-outline-primary py-1 px-2.5 fs-11 fw-semibold shadow-none"
                      >
                        View Site
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
