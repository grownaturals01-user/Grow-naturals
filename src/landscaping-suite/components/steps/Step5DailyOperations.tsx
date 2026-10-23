import React, { useState } from 'react';
import { LandscapingProject, DailyOperationLog, DailyExpenseItem, DailyMaterialUsed } from '../../types/landscaping';
import { useProjects } from '../../context/ProjectContext';
import { calculateDailyLogTotal, formatCurrency } from '../../utils/calculations';
import { HardHat, Plus, Trash2, Coffee, Utensils, Fuel, Truck, Wrench, CheckCircle, ArrowRight, ChevronDown, ChevronUp, Sun, CloudRain } from 'lucide-react';

interface Step5DailyOperationsProps {
  project: LandscapingProject;
}

export const Step5DailyOperations: React.FC<Step5DailyOperationsProps> = ({ project }) => {
  const { addDailyOperationLog, deleteDailyOperationLog, setSelectedStep, currency } = useProjects();
  const [expandedLogId, setExpandedLogId] = useState<string | null>(project.step5DailyOperations[0]?.id || null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New day log form state
  const today = new Date().toISOString().split('T')[0];
  const [logDate, setLogDate] = useState(today);
  const [weather, setWeather] = useState<DailyOperationLog['weather']>('Sunny & Clear');
  const [skilledCount, setSkilledCount] = useState(2);
  const [skilledWage, setSkilledWage] = useState(950);
  const [unskilledCount, setUnskilledCount] = useState(4);
  const [unskilledWage, setUnskilledWage] = useState(650);
  const [contractTeam, setContractTeam] = useState('');
  const [contractAmt, setContractAmt] = useState(0);

  const [supervisorSalary, setSupervisorSalary] = useState(project.step4Planning.supervisorSalaryDailyRate || 1200);

  // Daily expenses
  const [teaSnacks, setTeaSnacks] = useState(300);
  const [foodMeals, setFoodMeals] = useState(650);
  const [fuelDiesel, setFuelDiesel] = useState(0);
  const [localTempo, setLocalTempo] = useState(0);
  const [toolsConsumables, setToolsConsumables] = useState(0);
  const [miscExp, setMiscExp] = useState(0);
  const [miscDesc, setMiscDesc] = useState('');

  // Material used
  const [materialName, setMaterialName] = useState('');
  const [materialQty, setMaterialQty] = useState(1);
  const [materialUnit, setMaterialUnit] = useState('Lot');
  const [materialVal, setMaterialVal] = useState(0);

  const [workSummary, setWorkSummary] = useState('');
  const [task1, setTask1] = useState('');
  const [task2, setTask2] = useState('');

  // Cumulative metrics
  let totalLabourIncurred = 0;
  let totalSupervisorIncurred = 0;
  let totalDailyExpensesIncurred = 0;
  let totalMaterialsIncurred = 0;

  project.step5DailyOperations.forEach(log => {
    const calc = calculateDailyLogTotal(log);
    totalLabourIncurred += calc.labourCost;
    totalSupervisorIncurred += calc.supervisorCost;
    totalDailyExpensesIncurred += calc.expensesCost;
    totalMaterialsIncurred += calc.materialsCost;
  });

  const totalOperationsBurn = totalLabourIncurred + totalSupervisorIncurred + totalDailyExpensesIncurred + totalMaterialsIncurred;

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();

    const expenses: DailyExpenseItem[] = [];
    if (teaSnacks > 0) {
      expenses.push({ id: `exp-tea-${Date.now()}`, category: 'Tea & Snacks', description: 'Daily chai, tea, biscuits & water', amount: Number(teaSnacks) });
    }
    if (foodMeals > 0) {
      expenses.push({ id: `exp-food-${Date.now()}`, category: 'Food & Meals', description: 'Crew lunch meals', amount: Number(foodMeals) });
    }
    if (fuelDiesel > 0) {
      expenses.push({ id: `exp-fuel-${Date.now()}`, category: 'Fuel & Diesel', description: 'Machinery & generator fuel', amount: Number(fuelDiesel) });
    }
    if (localTempo > 0) {
      expenses.push({ id: `exp-tempo-${Date.now()}`, category: 'Local Tempo / Transport', description: 'Local site transport / tempo trip', amount: Number(localTempo) });
    }
    if (toolsConsumables > 0) {
      expenses.push({ id: `exp-tools-${Date.now()}`, category: 'Consumables & Tools', description: 'Blades, strings, adhesives, small tools', amount: Number(toolsConsumables) });
    }
    if (miscExp > 0) {
      expenses.push({ id: `exp-misc-${Date.now()}`, category: 'Miscellaneous', description: miscDesc.trim() || 'Site incidentals', amount: Number(miscExp) });
    }

    const materialsUsed: DailyMaterialUsed[] = [];
    if (materialName.trim()) {
      materialsUsed.push({
        id: `mat-${Date.now()}`,
        materialName: materialName.trim(),
        quantityUsed: Number(materialQty) || 1,
        unit: materialUnit.trim() || 'Units',
        approxValue: Number(materialVal) || 0,
      });
    }

    const completedTasks: string[] = [];
    if (task1.trim()) completedTasks.push(task1.trim());
    if (task2.trim()) completedTasks.push(task2.trim());

    addDailyOperationLog(project.id, {
      date: logDate,
      weather,
      workers: {
        skilledWorkersCount: Number(skilledCount) || 0,
        skilledDailyWageRate: Number(skilledWage) || 0,
        unskilledWorkersCount: Number(unskilledCount) || 0,
        unskilledDailyWageRate: Number(unskilledWage) || 0,
        contractLabourTeamName: contractTeam.trim(),
        contractLabourAmount: Number(contractAmt) || 0,
      },
      supervisorSalaryAllocation: Number(supervisorSalary) || 0,
      expenses,
      materialsUsed,
      workSummary: workSummary.trim() || 'Daily site activity executed as scheduled.',
      completedTasks,
    });

    setShowAddForm(false);
    // Reset fields
    setMaterialName('');
    setWorkSummary('');
    setTask1('');
    setTask2('');
  };

  const handleNextStep = () => {
    setSelectedStep('extra_work');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-200 rounded-xl p-5">
        <div>
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            Step 5 of 7 · On-Site Operations
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mt-1">Daily Project Operations, Wages & Expenses</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Log worker attendance, supervisor salary share, materials used, transport, food, chai/tea, and petty cash.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Log Daily Site Operations</span>
          </button>
          <button
            onClick={handleNextStep}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <span>Extra Work & Payments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time Operation Cost Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white border border-neutral-200 rounded-xl p-4">
        <div>
          <span className="text-[11px] font-medium text-neutral-500">Total Worker Wages</span>
          <div className="text-base font-bold text-neutral-900 tabular-nums mt-0.5">
            {formatCurrency(totalLabourIncurred, currency)}
          </div>
        </div>
        <div>
          <span className="text-[11px] font-medium text-neutral-500">Supervisor Salary Share</span>
          <div className="text-base font-bold text-neutral-900 tabular-nums mt-0.5">
            {formatCurrency(totalSupervisorIncurred, currency)}
          </div>
        </div>
        <div>
          <span className="text-[11px] font-medium text-neutral-500">Tea, Food & Site Exp.</span>
          <div className="text-base font-bold text-neutral-900 tabular-nums mt-0.5">
            {formatCurrency(totalDailyExpensesIncurred, currency)}
          </div>
        </div>
        <div>
          <span className="text-[11px] font-medium text-neutral-500">Materials Consumed</span>
          <div className="text-base font-bold text-neutral-900 tabular-nums mt-0.5">
            {formatCurrency(totalMaterialsIncurred, currency)}
          </div>
        </div>
        <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 flex flex-col justify-center">
          <span className="text-[11px] font-semibold text-emerald-900">Total Operations Burn</span>
          <div className="text-lg font-bold text-emerald-950 tabular-nums">
            {formatCurrency(totalOperationsBurn, currency)}
          </div>
        </div>
      </div>

      {/* Log Today Form Modal/Drawer */}
      {showAddForm && (
        <form onSubmit={handleCreateLog} className="bg-white border-2 border-emerald-700 rounded-xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <HardHat className="w-4 h-4 text-emerald-700" />
                <span>Log New Daily Site Operations</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">Enter crew muster, expenses, and materials used today.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-neutral-500 hover:text-neutral-800"
            >
              Cancel
            </button>
          </div>

          {/* Section 1: Date & Weather */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Log Date</label>
              <input
                type="date"
                value={logDate}
                onChange={e => setLogDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Weather on Site</label>
              <select
                value={weather}
                onChange={e => setWeather(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
              >
                <option value="Sunny & Clear">Sunny & Clear</option>
                <option value="Mild / Overcast">Mild / Overcast</option>
                <option value="Hot & Dry">Hot & Dry</option>
                <option value="Intermittent Rain">Intermittent Rain</option>
                <option value="Heavy Rain">Heavy Rain (Disrupted work)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Supervisor Daily Salary Share ({currency})</label>
              <input
                type="number"
                value={supervisorSalary}
                onChange={e => setSupervisorSalary(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg tabular-nums"
                placeholder="1200"
              />
            </div>
          </div>

          {/* Section 2: Workers & Daily Wages */}
          <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50/50 space-y-3">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
              Daily Workers & Wages Attendance
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Skilled Workers Count</label>
                <input
                  type="number"
                  min="0"
                  value={skilledCount}
                  onChange={e => setSkilledCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Skilled Wage Rate ({currency}/day)</label>
                <input
                  type="number"
                  value={skilledWage}
                  onChange={e => setSkilledWage(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Unskilled / Helpers Count</label>
                <input
                  type="number"
                  min="0"
                  value={unskilledCount}
                  onChange={e => setUnskilledCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Helper Wage Rate ({currency}/day)</label>
                <input
                  type="number"
                  value={unskilledWage}
                  onChange={e => setUnskilledWage(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Contract Labour Team Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Specialized Turf Laying Gang"
                  value={contractTeam}
                  onChange={e => setContractTeam(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Contract Labour Payment ({currency})</label>
                <input
                  type="number"
                  value={contractAmt}
                  onChange={e => setContractAmt(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Daily Site Expenses (Tea, Food, Fuel, Tempo) */}
          <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50/50 space-y-3">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
              Daily Operational Site Expenses
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5 text-amber-700" />
                  <span>Tea & Chai ({currency})</span>
                </label>
                <input
                  type="number"
                  value={teaSnacks}
                  onChange={e => setTeaSnacks(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5 text-orange-700" />
                  <span>Food & Lunch ({currency})</span>
                </label>
                <input
                  type="number"
                  value={foodMeals}
                  onChange={e => setFoodMeals(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-red-700" />
                  <span>Fuel & Diesel ({currency})</span>
                </label>
                <input
                  type="number"
                  value={fuelDiesel}
                  onChange={e => setFuelDiesel(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-blue-700" />
                  <span>Tempo / Transport ({currency})</span>
                </label>
                <input
                  type="number"
                  value={localTempo}
                  onChange={e => setLocalTempo(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Consumables & Tools ({currency})</span>
                </label>
                <input
                  type="number"
                  value={toolsConsumables}
                  onChange={e => setToolsConsumables(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Miscellaneous Petty Cash ({currency})</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={miscExp}
                    onChange={e => setMiscExp(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
                  />
                  <input
                    type="text"
                    placeholder="Description of misc expense"
                    value={miscDesc}
                    onChange={e => setMiscDesc(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Materials Received / Used today */}
          <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50/50 space-y-3">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
              Materials Used / Received on Site Today (Optional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                placeholder="Material Name (e.g. Tipper Truck Red Soil)"
                value={materialName}
                onChange={e => setMaterialName(e.target.value)}
                className="sm:col-span-6 px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
              />
              <input
                type="number"
                placeholder="Qty"
                value={materialQty}
                onChange={e => setMaterialQty(Number(e.target.value))}
                className="sm:col-span-2 px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
              />
              <input
                type="text"
                placeholder="Unit"
                value={materialUnit}
                onChange={e => setMaterialUnit(e.target.value)}
                className="sm:col-span-2 px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
              />
              <input
                type="number"
                placeholder="Value"
                value={materialVal}
                onChange={e => setMaterialVal(Number(e.target.value))}
                className="sm:col-span-2 px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
              />
            </div>
          </div>

          {/* Section 5: Summary notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Work Accomplished Summary</label>
              <textarea
                rows={2}
                value={workSummary}
                onChange={e => setWorkSummary(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg resize-none"
                placeholder="Detailed summary of work completed by the crew today..."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Completed Task 1 (e.g. Lawn sub-base grading)"
                value={task1}
                onChange={e => setTask1(e.target.value)}
                className="px-3 py-1.5 text-xs border border-neutral-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Completed Task 2 (e.g. Areca palm planting)"
                value={task2}
                onChange={e => setTask2(e.target.value)}
                className="px-3 py-1.5 text-xs border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
            >
              Save Day Log Entry
            </button>
          </div>
        </form>
      )}

      {/* Chronological Day Logs Register */}
      <div className="space-y-3">
        {project.step5DailyOperations.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center">
            <HardHat className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-neutral-900">No Daily Operations Logged Yet</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Click &quot;Log Daily Site Operations&quot; above to record worker attendance, daily wages, supervisor salary, chai/tea, and materials.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 rounded-lg"
            >
              Log First Day Entry
            </button>
          </div>
        ) : (
          project.step5DailyOperations.map(log => {
            const isExpanded = expandedLogId === log.id;
            const calc = calculateDailyLogTotal(log);

            return (
              <div
                key={log.id}
                className="bg-white border border-neutral-200 rounded-xl overflow-hidden transition-shadow hover:shadow-xs"
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-neutral-50/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {log.date.split('-')[2]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-neutral-900">{log.date}</span>
                        <span aria-hidden="true" className="text-neutral-300">·</span>
                        <span className="text-xs text-neutral-600 flex items-center gap-1">
                          {log.weather.includes('Rain') ? <CloudRain className="w-3 h-3 text-blue-500" /> : <Sun className="w-3 h-3 text-amber-500" />}
                          {log.weather}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{log.workSummary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-neutral-500">Day Total Burn</div>
                      <div className="text-sm font-bold text-neutral-900 tabular-nums">
                        {formatCurrency(calc.dayTotal, currency)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        deleteDailyOperationLog(project.id, log.id);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="text-neutral-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-neutral-100 p-5 bg-neutral-50/50 space-y-4 text-xs">
                    {/* Worker Attendance */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-3.5 rounded-lg border border-neutral-200">
                      <div>
                        <span className="text-neutral-500 font-medium block">Worker Attendance & Wages:</span>
                        <div className="mt-1 font-semibold text-neutral-900">
                          {log.workers.skilledWorkersCount} Skilled ({formatCurrency(log.workers.skilledDailyWageRate, currency)}/day) = {formatCurrency(log.workers.skilledWorkersCount * log.workers.skilledDailyWageRate, currency)}
                        </div>
                        <div className="text-neutral-700">
                          {log.workers.unskilledWorkersCount} Helpers ({formatCurrency(log.workers.unskilledDailyWageRate, currency)}/day) = {formatCurrency(log.workers.unskilledWorkersCount * log.workers.unskilledDailyWageRate, currency)}
                        </div>
                        {log.workers.contractLabourAmount > 0 && (
                          <div className="text-neutral-700">
                            Contract: {log.workers.contractLabourTeamName} = {formatCurrency(log.workers.contractLabourAmount, currency)}
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-neutral-500 font-medium block">Supervisor Allocation:</span>
                        <div className="mt-1 font-semibold text-neutral-900">
                          {formatCurrency(log.supervisorSalaryAllocation, currency)}
                        </div>
                        <span className="text-[11px] text-neutral-500">
                          Lead: {project.step4Planning.supervisorName || 'Site Supervisor'}
                        </span>
                      </div>

                      <div>
                        <span className="text-neutral-500 font-medium block">Materials Consumed:</span>
                        {log.materialsUsed.length === 0 ? (
                          <div className="mt-1 text-neutral-500">None logged for this day</div>
                        ) : (
                          log.materialsUsed.map((m, i) => (
                            <div key={i} className="mt-1 text-neutral-900 font-medium">
                              {m.materialName} ({m.quantityUsed} {m.unit}) · {formatCurrency(m.approxValue, currency)}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Expenses breakdown */}
                    {log.expenses.length > 0 && (
                      <div className="bg-white p-3.5 rounded-lg border border-neutral-200">
                        <span className="text-neutral-500 font-medium block mb-2">Daily Site Expenses Breakdown:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {log.expenses.map(exp => (
                            <div key={exp.id} className="flex items-center justify-between p-2 rounded bg-neutral-50 border border-neutral-100">
                              <div>
                                <span className="font-semibold text-neutral-800">{exp.category}</span>
                                <div className="text-[11px] text-neutral-500">{exp.description}</div>
                              </div>
                              <span className="font-bold text-neutral-900 tabular-nums">
                                {formatCurrency(exp.amount, currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tasks completed */}
                    {log.completedTasks.length > 0 && (
                      <div>
                        <span className="text-neutral-500 font-medium block mb-1">Key Completed Milestones:</span>
                        <div className="flex flex-wrap gap-2">
                          {log.completedTasks.map((task, idx) => (
                            <span key={idx} className="bg-white border border-neutral-200 text-neutral-800 px-2.5 py-1 rounded text-xs flex items-center gap-1 font-medium">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              {task}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
