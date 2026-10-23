import React, { useState } from 'react';
import { LandscapingProject, ExtraWorkItem, PartPayment } from '../../types/landscaping';
import { useProjects } from '../../context/ProjectContext';
import { calculateProjectFinancials, formatCurrency } from '../../utils/calculations';
import { Layers, Plus, CheckCircle, ArrowRight, Banknote, ShieldAlert, Check, Clock, XCircle, Receipt } from 'lucide-react';

interface Step6ExtraWorkPaymentsProps {
  project: LandscapingProject;
}

export const Step6ExtraWorkPayments: React.FC<Step6ExtraWorkPaymentsProps> = ({ project }) => {
  const { addExtraWorkItem, updateExtraWorkStatus, addPartPayment, setSelectedStep, currency } = useProjects();
  const financials = calculateProjectFinancials(project);

  // New Extra work form state
  const [ewTitle, setEwTitle] = useState('');
  const [ewCategory, setEwCategory] = useState<ExtraWorkItem['category']>('Hardscaping');
  const [ewDesc, setEwDesc] = useState('');
  const [ewQuoted, setEwQuoted] = useState(25000);
  const [ewCost, setEwCost] = useState(15000);

  // New Part payment form state
  const [ppMilestone, setPpMilestone] = useState('');
  const [ppAmount, setPpAmount] = useState(100000);
  const [ppDate, setPpDate] = useState(new Date().toISOString().split('T')[0]);
  const [ppMode, setPpMode] = useState<PartPayment['paymentMode']>('Bank Transfer');
  const [ppRef, setPpRef] = useState(`TXN-${Date.now().toString().slice(-6)}`);
  const [ppReceipt, setPpReceipt] = useState(`TF-REC-${project.code}-0${(project.step6ExtraWork?.partPayments?.length || 0) + 2}`);
  const [ppNotes, setPpNotes] = useState('');

  const handleAddExtraWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ewTitle.trim()) return;

    addExtraWorkItem(project.id, {
      title: ewTitle.trim(),
      category: ewCategory,
      description: ewDesc.trim() || 'Client requested project scope addition.',
      requestedDate: new Date().toISOString().split('T')[0],
      quotedToClient: Number(ewQuoted) || 0,
      estimatedInternalCost: Number(ewCost) || 0,
      status: 'Client Approved',
      approvedDate: new Date().toISOString().split('T')[0],
    });

    setEwTitle('');
    setEwDesc('');
  };

  const handleAddPartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (ppAmount <= 0) return;

    addPartPayment(project.id, {
      milestoneTitle: ppMilestone.trim() || `Milestone ${(project.step6ExtraWork?.partPayments?.length || 0) + 2} Payment`,
      date: ppDate,
      amount: Number(ppAmount) || 0,
      paymentMode: ppMode,
      referenceNo: ppRef,
      receiptNumber: ppReceipt,
      notes: ppNotes.trim() || 'Received against progress milestone.',
    });

    setPpMilestone('');
    setPpNotes('');
  };

  const handleNextStep = () => {
    setSelectedStep('settlement');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-200 rounded-xl p-5">
        <div>
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            Step 6 of 7 · Scope Additions & Progress Collections
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mt-1">Extra Work & Running Part Payments</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Add approved extra work to the project and quotation; track each client payment and monitor remaining balance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleNextStep}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
          >
            <span>Proceed to Completion & Settlement</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Contract & Collection Health Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white border border-neutral-200 rounded-xl p-5">
        <div>
          <span className="text-xs font-medium text-neutral-500">Base Quotation</span>
          <div className="text-lg font-bold text-neutral-900 tabular-nums mt-0.5">
            {formatCurrency(financials.baseQuotationTotal, currency)}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-neutral-500">Approved Extra Work</span>
          <div className="text-lg font-bold text-emerald-800 tabular-nums mt-0.5">
            +{formatCurrency(financials.approvedExtraWorkTotal, currency)}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-neutral-500">Total Contract Value</span>
          <div className="text-lg font-bold text-neutral-900 tabular-nums mt-0.5">
            {formatCurrency(financials.totalContractValue, currency)}
          </div>
        </div>

        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
            <span>Collected So Far</span>
            <span className="tabular-nums">{financials.collectionProgressPercent}%</span>
          </div>
          <div className="text-lg font-bold text-emerald-950 tabular-nums mt-0.5">
            {formatCurrency(financials.totalCollected, currency)}
          </div>
          <div className="text-[11px] text-emerald-800 mt-0.5">
            Remaining: {formatCurrency(financials.outstandingReceivable, currency)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Extra Work / Change Orders */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Extra Work Orders & Scope Changes</span>
              </span>
              <span className="text-xs font-semibold text-neutral-600">
                {project.step6ExtraWork?.extraWorks?.length || 0} items
              </span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Client requests during execution (e.g., extra pathway, misting, lighting).
            </p>
          </div>

          {/* List of extra work */}
          <div className="space-y-3">
            {(project.step6ExtraWork?.extraWorks || []).length === 0 ? (
              <div className="text-xs text-neutral-500 p-4 bg-neutral-50 rounded-lg text-center border border-dashed border-neutral-200">
                No extra work orders recorded. Use the form below to add approved additions.
              </div>
            ) : (
              project.step6ExtraWork.extraWorks.map(ew => (
                <div key={ew.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-neutral-900">{ew.title}</div>
                      <div className="text-[11px] text-neutral-500">{ew.category} · Requested: {ew.requestedDate}</div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-emerald-800 tabular-nums">
                        +{formatCurrency(ew.quotedToClient, currency)}
                      </div>
                      <div className="text-[10px] text-neutral-500 tabular-nums">
                        Internal Cost: {formatCurrency(ew.estimatedInternalCost, currency)}
                      </div>
                    </div>
                  </div>

                  <p className="text-neutral-600">{ew.description}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
                    <span className="text-[11px] text-neutral-500">Approval Status:</span>
                    <select
                      value={ew.status}
                      onChange={e => updateExtraWorkStatus(project.id, ew.id, e.target.value as any)}
                      className="px-2 py-0.5 text-xs border border-neutral-300 rounded bg-white font-medium"
                    >
                      <option value="Requested">Requested (Pending Approval)</option>
                      <option value="Client Approved">Client Approved</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Extra Work Form */}
          <form onSubmit={handleAddExtraWork} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
            <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              <span>Add New Approved Extra Work</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Extra Work Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Automated Misting System for Bamboo Wall"
                  value={ewTitle}
                  onChange={e => setEwTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Category</label>
                  <select
                    value={ewCategory}
                    onChange={e => setEwCategory(e.target.value as any)}
                    className="w-full px-2 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                  >
                    <option value="Hardscaping">Hardscaping</option>
                    <option value="Planting & Flora">Planting & Flora</option>
                    <option value="Water Feature">Water Feature</option>
                    <option value="Irrigation Automation">Irrigation</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Billed to Client ({currency})</label>
                  <input
                    type="number"
                    value={ewQuoted}
                    onChange={e => setEwQuoted(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Internal Cost ({currency})</label>
                  <input
                    type="number"
                    value={ewCost}
                    onChange={e => setEwCost(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Scope Description & Reason</label>
                <input
                  type="text"
                  placeholder="Client requested during site review..."
                  value={ewDesc}
                  onChange={e => setEwDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors"
            >
              Add Extra Work to Project Contract
            </button>
          </form>
        </div>

        {/* Right Column: Running Part Payments Tracking */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <span>Running Part Payments Ledger</span>
              </span>
              <span className="text-xs font-semibold text-emerald-800">
                {project.step6ExtraWork?.partPayments?.length || 0} milestone receipts
              </span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Record stage-by-stage payments and track remaining balance.
            </p>
          </div>

          {/* List of payments */}
          <div className="space-y-3">
            {/* Advance payment card */}
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 text-xs flex items-center justify-between">
              <div>
                <div className="font-bold text-emerald-950">Step 4 Advance Received</div>
                <div className="text-[11px] text-emerald-800">
                  {project.step4Planning.advancePaymentDate || 'Paid'} · {project.step4Planning.paymentMode}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  Ref: {project.step4Planning.transactionReference || 'N/A'}
                </div>
              </div>
              <div className="text-right font-bold text-emerald-900 text-sm tabular-nums">
                {formatCurrency(project.step4Planning.advanceReceivedAmount, currency)}
              </div>
            </div>

            {/* Part payments */}
            {(project.step6ExtraWork?.partPayments || []).map(p => (
              <div key={p.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-neutral-900">{p.milestoneTitle}</div>
                  <div className="text-[11px] text-neutral-500">
                    {p.date} · {p.paymentMode} · Voucher: {p.receiptNumber}
                  </div>
                  {p.referenceNo && (
                    <div className="text-[10px] text-neutral-500 font-mono">Txn: {p.referenceNo}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-800 text-sm tabular-nums">
                    +{formatCurrency(p.amount, currency)}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">Receipt Cleared</span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Part Payment Form */}
          <form onSubmit={handleAddPartPayment} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
            <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              <span>Record Client Part Payment</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Milestone Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Milestone 2: Hardscape & Soil Completion"
                  value={ppMilestone}
                  onChange={e => setPpMilestone(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Amount Received ({currency}) *</label>
                  <input
                    type="number"
                    value={ppAmount}
                    onChange={e => setPpAmount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums font-bold text-emerald-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Payment Date</label>
                  <input
                    type="date"
                    value={ppDate}
                    onChange={e => setPpDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Payment Channel</label>
                  <select
                    value={ppMode}
                    onChange={e => setPpMode(e.target.value as any)}
                    className="w-full px-2 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI / QR">UPI / QR Payment</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash Deposit</option>
                    <option value="Card">Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Transaction Ref</label>
                  <input
                    type="text"
                    value={ppRef}
                    onChange={e => setPpRef(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white font-mono"
                    placeholder="IMPS/6291048"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors"
            >
              Record Payment Receipt
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
