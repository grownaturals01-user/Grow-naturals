import React, { useState } from 'react';
import { LandscapingProject, AdvancePlanningData, MaterialProcurementItem, ProjectMilestone } from '../../types/landscaping';
import { useProjects } from '../../context/ProjectContext';
import { calculateQuotationSummary, formatCurrency } from '../../utils/calculations';
import { ProjectGanttTimeline } from '../project-detail/ProjectGanttTimeline';
import { VendorPriceComparison } from '../project-detail/VendorPriceComparison';
import { CalendarCheck2, ShieldCheck, UserCheck, Calendar, Plus, Trash2, CheckCircle, ArrowRight, Save, Clock, PackageCheck, Eye, Layers, Scale } from 'lucide-react';

interface Step4PlanningProps {
  project: LandscapingProject;
}

export const Step4Planning: React.FC<Step4PlanningProps> = ({ project }) => {
  const { updateProjectStep, recordAdvancePayment, setSelectedStep, currency } = useProjects();
  const [data, setData] = useState<AdvancePlanningData>(project.step4Planning);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [showGanttModal, setShowGanttModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);

  // New procurement item state
  const [procName, setProcName] = useState('');
  const [procQty, setProcQty] = useState(1);
  const [procUnit, setProcUnit] = useState('Nos');
  const [procSource, setProcSource] = useState<'Nursery Stock' | 'External Vendor Purchase'>('Nursery Stock');
  const [procCost, setProcCost] = useState(5000);

  // New milestone state
  const [mTitle, setMTitle] = useState('');
  const [mStart, setMStart] = useState(new Date().toISOString().split('T')[0]);
  const [mEnd, setMEnd] = useState(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);

  const quoteSummary = calculateQuotationSummary(
    project.step3Quotation.items,
    project.step3Quotation.taxPercent,
    project.step3Quotation.discountAmount
  );

  const recommendedAdvance = Math.round((quoteSummary.totalQuotation * (data.advanceRequiredPercent || 50)) / 100);

  const handleSave = () => {
    updateProjectStep(project.id, 'step4Planning', data);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleRecordAdvance = () => {
    recordAdvancePayment(project.id, {
      amount: Number(data.advanceReceivedAmount) || 0,
      date: data.advancePaymentDate || new Date().toISOString().split('T')[0],
      mode: data.paymentMode,
      reference: data.transactionReference || `TXN-${Date.now()}`,
      receiptNo: data.advanceReceiptNumber || `TF-REC-${project.code}-01`,
    });
    handleSave();
  };

  const addProcurementItem = () => {
    if (!procName.trim()) return;
    const newItem: MaterialProcurementItem = {
      id: `proc-${Date.now()}`,
      name: procName.trim(),
      quantity: Number(procQty) || 1,
      unit: procUnit.trim() || 'Nos',
      source: procSource,
      estimatedCost: Number(procCost) || 0,
      status: 'Pending',
    };
    setData({
      ...data,
      procurementPlan: [...data.procurementPlan, newItem],
    });
    setProcName('');
  };

  const removeProcurementItem = (id: string) => {
    setData({
      ...data,
      procurementPlan: data.procurementPlan.filter(p => p.id !== id),
    });
  };

  const updateProcStatus = (id: string, status: MaterialProcurementItem['status']) => {
    setData({
      ...data,
      procurementPlan: data.procurementPlan.map(p => (p.id === id ? { ...p, status } : p)),
    });
  };

  const addMilestone = () => {
    if (!mTitle.trim()) return;
    const newM: ProjectMilestone = {
      id: `m-${Date.now()}`,
      title: mTitle.trim(),
      startDate: mStart,
      targetEndDate: mEnd,
      progressPercent: 0,
      status: 'Pending',
    };
    setData({
      ...data,
      milestones: [...data.milestones, newM],
    });
    setMTitle('');
  };

  const updateMilestone = (id: string, progress: number, status: ProjectMilestone['status']) => {
    setData({
      ...data,
      milestones: data.milestones.map(m => (m.id === id ? { ...m, progressPercent: progress, status } : m)),
    });
  };

  const removeMilestone = (id: string) => {
    setData({
      ...data,
      milestones: data.milestones.filter(m => m.id !== id),
    });
  };

  const handleNextStep = () => {
    handleSave();
    setSelectedStep('daily_operations');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-200 rounded-xl p-5">
        <div>
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            Step 4 of 7 · Mobilization & Planning
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mt-1">Advance Received, Supervisor Assignment & Work Plan</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Log initial advance receipt, allocate nursery stock vs purchases, assign site supervisor and schedule milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSavedNotice && (
            <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Planning</span>
          </button>
          <button
            onClick={handleNextStep}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors"
          >
            <span>Daily Operations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 1: Advance Payment Recording */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Customer Advance Collection</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Secure initial mobilization deposit prior to purchasing materials and deploying daily labour.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium">Quoted Total:</span>
            <span className="text-sm font-bold text-neutral-900 tabular-nums">
              {formatCurrency(quoteSummary.totalQuotation, currency)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Required Advance %</label>
            <select
              value={data.advanceRequiredPercent}
              onChange={e =>
                setData({
                  ...data,
                  advanceRequiredPercent: Number(e.target.value),
                  advanceTargetAmount: Math.round((quoteSummary.totalQuotation * Number(e.target.value)) / 100),
                })
              }
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
            >
              <option value={30}>30% Advance Deposit</option>
              <option value={40}>40% Advance Deposit</option>
              <option value={50}>50% Advance Deposit (Standard)</option>
              <option value={60}>60% Advance Deposit</option>
            </select>
            <span className="text-[11px] text-neutral-500 mt-1 block tabular-nums">
              Target: {formatCurrency(recommendedAdvance, currency)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Advance Received ({currency}) *</label>
            <input
              type="number"
              value={data.advanceReceivedAmount}
              onChange={e => setData({ ...data, advanceReceivedAmount: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg font-bold text-emerald-900 tabular-nums"
              placeholder="150000"
            />
            <span className="text-[11px] text-emerald-700 mt-1 block">
              {data.advanceReceivedAmount > 0 ? '✓ Advance Confirmed' : 'Awaiting deposit'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Payment Date</label>
            <input
              type="date"
              value={data.advancePaymentDate}
              onChange={e => setData({ ...data, advancePaymentDate: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Payment Channel</label>
            <select
              value={data.paymentMode}
              onChange={e => setData({ ...data, paymentMode: e.target.value as any })}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
            >
              <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value="UPI / QR">UPI / QR Payment</option>
              <option value="Cheque">Bank Cheque</option>
              <option value="Cash">Cash Deposit</option>
              <option value="Card">Credit / Debit Card</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Txn Ref / Voucher ID</label>
            <input
              type="text"
              value={data.transactionReference}
              onChange={e => setData({ ...data, transactionReference: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg font-mono"
              placeholder="e.g. NEFT/HDFC/029381"
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
          <div className="text-xs text-neutral-500">
            Receipt: <span className="font-mono font-medium text-neutral-700">{data.advanceReceiptNumber || `TF-REC-${project.code}-01`}</span>
          </div>
          <button
            type="button"
            onClick={handleRecordAdvance}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
          >
            Update Advance Ledger
          </button>
        </div>
      </div>

      {/* Row 2: Supervisor & Site Staffing */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="border-b border-neutral-100 pb-3 mb-4">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-700" />
            <span>Assigned Site Supervisor & Project Crew</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Designate the on-site supervisor whose daily salary will be allocated to this project's daily operations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Lead Supervisor Name</label>
            <input
              type="text"
              value={data.supervisorName}
              onChange={e => setData({ ...data, supervisorName: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg"
              placeholder="e.g. Raghavan K."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Supervisor Phone Number</label>
            <input
              type="text"
              value={data.supervisorPhone}
              onChange={e => setData({ ...data, supervisorPhone: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg"
              placeholder="+91 94441 55210"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Supervisor Daily Salary Allocation ({currency}/day)
            </label>
            <input
              type="number"
              value={data.supervisorSalaryDailyRate}
              onChange={e => setData({ ...data, supervisorSalaryDailyRate: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg tabular-nums font-semibold"
              placeholder="1200"
            />
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              Auto-allocated to daily operational expenses in Step 5
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Material Procurement Plan (Stock vs Buy) */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-700" />
              <span>Material Procurement: Nursery Stock vs External Purchase</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Specify which materials are drawn directly from existing central nursery yard vs new vendor orders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowVendorModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
              title="Compare supplier and nursery price quotes"
            >
              <Scale className="w-3.5 h-3.5 text-emerald-700" />
              <span>Vendor Price Comparison</span>
            </button>
            <span className="text-xs text-neutral-500">
              {data.procurementPlan.length} procurement items planned
            </span>
          </div>
        </div>

        {/* Procurement Table */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Inventory Sourcing</th>
                <th className="py-2.5 px-3 text-right">Est. Cost ({currency})</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-2 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.procurementPlan.map(item => (
                <tr key={item.id} className="hover:bg-neutral-50/70">
                  <td className="py-2.5 px-3 font-semibold text-neutral-900">{item.name}</td>
                  <td className="py-2.5 px-3">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      item.source === 'Nursery Stock'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-neutral-100 text-neutral-800'
                    }`}>
                      {item.source}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-neutral-900">
                    {formatCurrency(item.estimatedCost, currency)}
                  </td>
                  <td className="py-2.5 px-3">
                    <select
                      value={item.status}
                      onChange={e => updateProcStatus(item.id, e.target.value as any)}
                      className="px-2 py-1 text-xs border border-neutral-300 rounded bg-white"
                    >
                      <option value="Allocated">Allocated</option>
                      <option value="Ordered">Ordered</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      onClick={() => removeProcurementItem(item.id)}
                      className="text-neutral-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add procurement item form */}
        <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="text-xs font-bold text-neutral-800 mb-2">Add Material Sourcing Entry:</div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              type="text"
              placeholder="Material / Plant Name (e.g. Bermuda Grass 1,800 sq.ft)"
              value={procName}
              onChange={e => setProcName(e.target.value)}
              className="sm:col-span-4 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
            />
            <input
              type="number"
              placeholder="Qty"
              value={procQty}
              onChange={e => setProcQty(Number(e.target.value))}
              className="sm:col-span-1 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
            />
            <input
              type="text"
              placeholder="Unit"
              value={procUnit}
              onChange={e => setProcUnit(e.target.value)}
              className="sm:col-span-1 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
            />
            <select
              value={procSource}
              onChange={e => setProcSource(e.target.value as any)}
              className="sm:col-span-3 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
            >
              <option value="Nursery Stock">Nursery Stock (Own Yard)</option>
              <option value="External Vendor Purchase">External Vendor Purchase</option>
            </select>
            <input
              type="number"
              placeholder="Cost"
              value={procCost}
              onChange={e => setProcCost(Number(e.target.value))}
              className="sm:col-span-2 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
            />
            <button
              type="button"
              onClick={addProcurementItem}
              className="sm:col-span-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors flex items-center justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 4: Work Schedule & Milestone Progress */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Project Work Schedule & Milestone Gantt</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Sequenced milestones from excavation to lawn turf rolling and client walkthrough.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowGanttModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open Visual Gantt Chart</span>
          </button>
        </div>

        <div className="space-y-3 mb-5">
          {data.milestones.map(m => (
            <div key={m.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-bold text-neutral-900 text-sm">{m.title}</div>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-500 tabular-nums">
                    {m.startDate} → {m.targetEndDate}
                  </span>
                  <select
                    value={m.status}
                    onChange={e => updateMilestone(m.id, m.status === 'Completed' ? 100 : m.progressPercent, e.target.value as any)}
                    className="px-2 py-0.5 text-xs border border-neutral-300 rounded bg-white font-medium"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <button
                    onClick={() => removeMilestone(m.id)}
                    className="text-neutral-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress slider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-neutral-200 rounded-full h-2 overflow-hidden">
                  <div
                    style={{ width: `${m.progressPercent}%` }}
                    className={`h-full transition-all ${
                      m.progressPercent === 100 ? 'bg-emerald-600' : 'bg-emerald-800'
                    }`}
                  />
                </div>
                <span className="w-10 text-right font-bold text-neutral-700 tabular-nums">
                  {m.progressPercent}%
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={m.progressPercent}
                  onChange={e => {
                    const val = Number(e.target.value);
                    const status = val === 100 ? 'Completed' : val > 0 ? 'In Progress' : 'Pending';
                    updateMilestone(m.id, val, status);
                  }}
                  className="w-24 accent-emerald-800"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Milestone */}
        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
          <input
            type="text"
            placeholder="New milestone name (e.g. Lawn Sprinkler Commissioning)"
            value={mTitle}
            onChange={e => setMTitle(e.target.value)}
            className="flex-3 px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
          />
          <input
            type="date"
            value={mStart}
            onChange={e => setMStart(e.target.value)}
            className="flex-1 px-2 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
          />
          <input
            type="date"
            value={mEnd}
            onChange={e => setMEnd(e.target.value)}
            className="flex-1 px-2 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
          />
          <button
            type="button"
            onClick={addMilestone}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Milestone
          </button>
        </div>
      </div>

      {/* Gantt Timeline Modal */}
      {showGanttModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-6xl w-full border border-neutral-200 shadow-2xl p-6 my-8 animate-scale-in">
            <ProjectGanttTimeline
              project={project}
              isModalView={true}
              onClose={() => setShowGanttModal(false)}
            />
          </div>
        </div>
      )}
      {/* Vendor Price Comparison Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full border border-neutral-200 shadow-2xl p-6 my-8 animate-scale-in">
            <VendorPriceComparison
              project={project}
              isModal={true}
              onClose={() => setShowVendorModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
