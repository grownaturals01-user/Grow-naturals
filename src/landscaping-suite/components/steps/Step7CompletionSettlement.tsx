import React, { useState } from 'react';
import { LandscapingProject, CompletionSettlementData } from '../../types/landscaping';
import { useProjects } from '../../context/ProjectContext';
import { calculateProjectFinancials, formatCurrency } from '../../utils/calculations';
import { Award, CheckCircle2, DollarSign, Printer, Save, ShieldCheck, Star, Users, Check, Clock } from 'lucide-react';

interface Step7CompletionSettlementProps {
  project: LandscapingProject;
  onOpenSettlementModal: () => void;
}

export const Step7CompletionSettlement: React.FC<Step7CompletionSettlementProps> = ({
  project,
  onOpenSettlementModal,
}) => {
  const { updateProjectStep, recordFinalSettlement, currency } = useProjects();
  const financials = calculateProjectFinancials(project);
  const [data, setData] = useState<CompletionSettlementData>(project.step7Settlement);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Settlement payment form state
  const [settlementAmount, setSettlementAmount] = useState(financials.outstandingReceivable);
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [settlementMode, setSettlementMode] = useState('Bank Transfer');
  const [settlementRef, setSettlementRef] = useState(`FINAL-${Date.now().toString().slice(-6)}`);
  const [signedBy, setSignedBy] = useState(data.handoverSignedBy || project.step1Enquiry.clientName || '');

  const handleSave = () => {
    updateProjectStep(project.id, 'step7Settlement', data);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleCompleteSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    recordFinalSettlement(project.id, {
      amount: Number(settlementAmount) || 0,
      date: settlementDate,
      mode: settlementMode,
      ref: settlementRef,
      signedBy: signedBy || project.step1Enquiry.clientName,
    });
    setData({
      ...data,
      isCompleted: true,
      completionDate: settlementDate,
      handoverSignedBy: signedBy || project.step1Enquiry.clientName,
      finalSettlementPaymentReceived: Number(settlementAmount) || 0,
      settlementPaymentDate: settlementDate,
      settlementPaymentMode: settlementMode,
      settlementRef,
      isFullySettled: true,
      workerSettlementCleared: true,
      vendorSettlementCleared: true,
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-200 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Step 7 of 7 · Project Handover & Financial Closure
            </span>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <span className="text-xs text-neutral-500 font-mono">{data.completionCertificateNumber}</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mt-1">Final Settlement, Collections & P&L Audit</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Reconcile final project bill, settle outstanding dues, verify worker payments, and audit net profit/loss.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {data.isCompleted ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg">
              <Check className="w-4 h-4" /> Fully Completed & Settled
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4" /> Final Settlement Pending
            </span>
          )}

          <button
            onClick={onOpenSettlementModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Handover Certificate</span>
          </button>

          {isSavedNotice && (
            <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Details</span>
          </button>
        </div>
      </div>

      {/* Row 1: High Level Final Financial Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <span className="text-xs font-medium text-neutral-500">Gross Billed Contract</span>
          <div className="text-2xl font-bold text-neutral-900 tabular-nums mt-1">
            {formatCurrency(financials.totalContractValue, currency)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Quote ({formatCurrency(financials.baseQuotationTotal, currency)}) + Extra ({formatCurrency(financials.approvedExtraWorkTotal, currency)})
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <span className="text-xs font-medium text-neutral-500">Collected Revenue</span>
          <div className="text-2xl font-bold text-emerald-800 tabular-nums mt-1">
            {formatCurrency(financials.totalCollected, currency)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Advances + Milestone part payments
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <span className="text-xs font-medium text-neutral-500">Total Actual Site Costs</span>
          <div className="text-2xl font-bold text-neutral-900 tabular-nums mt-1">
            {formatCurrency(financials.totalExpenses, currency)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Wages, materials, tea/food & overheads
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <span className="text-xs font-medium text-neutral-500">Net Profit Realized</span>
          <div className={`text-2xl font-bold tabular-nums mt-1 ${
            financials.realizedProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'
          }`}>
            {formatCurrency(financials.realizedProfit, currency)}
          </div>
          <div className="text-xs font-semibold text-neutral-600 mt-1">
            {financials.realizedMarginPercent}% Net Profit Margin
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Final Bill Reconciliation & Outstanding Collection */}
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>Final Bill & Outstanding Collection</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Reconcile all previous payments against the final contract sum.
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-600">Base Quotation Total</span>
                <span className="font-semibold text-neutral-900 tabular-nums">
                  {formatCurrency(financials.baseQuotationTotal, currency)}
                </span>
              </div>

              {financials.approvedExtraWorkTotal > 0 && (
                <div className="flex justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-600">Approved Extra Scope Work</span>
                  <span className="font-semibold text-emerald-800 tabular-nums">
                    +{formatCurrency(financials.approvedExtraWorkTotal, currency)}
                  </span>
                </div>
              )}

              {financials.distanceChargeTotal > 0 && (
                <div className="flex justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-600">Site Distance Travel Fee</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    +{formatCurrency(financials.distanceChargeTotal, currency)}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1 font-bold text-neutral-900 border-b border-neutral-200 bg-neutral-50 p-2 rounded">
                <span>Total Project Billed Amount</span>
                <span className="tabular-nums">{formatCurrency(financials.totalContractValue, currency)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-neutral-100 text-neutral-600">
                <span>Less: Initial Advance Payment</span>
                <span className="text-emerald-800 tabular-nums font-semibold">
                  -{formatCurrency(financials.advanceReceived, currency)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-neutral-100 text-neutral-600">
                <span>Less: Running Milestone Part Payments</span>
                <span className="text-emerald-800 tabular-nums font-semibold">
                  -{formatCurrency(financials.partPaymentsTotal, currency)}
                </span>
              </div>

              {financials.settlementPaymentReceived > 0 && (
                <div className="flex justify-between py-1 border-b border-neutral-100 text-neutral-600">
                  <span>Less: Final Settlement Payment Received</span>
                  <span className="text-emerald-800 tabular-nums font-semibold">
                    -{formatCurrency(financials.settlementPaymentReceived, currency)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2 bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
                <div>
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                    Outstanding Balance Due
                  </span>
                  <div className="text-[10px] text-neutral-500">Remaining receivable from client</div>
                </div>
                <span className="text-xl font-bold text-emerald-900 tabular-nums">
                  {formatCurrency(financials.outstandingReceivable, currency)}
                </span>
              </div>
            </div>

            {/* Final payment collector form if balance > 0 */}
            {financials.outstandingReceivable > 0 && (
              <form onSubmit={handleCompleteSettlement} className="pt-3 border-t border-neutral-200 space-y-3">
                <div className="text-xs font-bold text-neutral-900">
                  Record Final Client Settlement & Close Project:
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Payment Amount ({currency})</label>
                    <input
                      type="number"
                      value={settlementAmount}
                      onChange={e => setSettlementAmount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg tabular-nums font-bold text-emerald-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Settlement Date</label>
                    <input
                      type="date"
                      value={settlementDate}
                      onChange={e => setSettlementDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Payment Mode</label>
                    <select
                      value={settlementMode}
                      onChange={e => setSettlementMode(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI / QR">UPI / QR</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Txn Reference</label>
                    <input
                      type="text"
                      value={settlementRef}
                      onChange={e => setSettlementRef(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors"
                >
                  Confirm Settlement Payment & Mark Project Completed
                </button>
              </form>
            )}
          </div>

          {/* Worker & Vendor Settlement Checklist */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Worker & Vendor Account Settlement</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Ensure zero pending payouts to daily labour, masons, and nursery suppliers before final closure.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 bg-neutral-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.workerSettlementCleared}
                  onChange={e => setData({ ...data, workerSettlementCleared: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600"
                />
                <div>
                  <span className="text-xs font-bold text-neutral-900">
                    Daily Wage & Contract Labour Accounts Cleared
                  </span>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Total labour of {formatCurrency(financials.expenseBreakdown.totalLabourCost, currency)} disbursed in full to all skilled and helper workers.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 bg-neutral-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.vendorSettlementCleared}
                  onChange={e => setData({ ...data, vendorSettlementCleared: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600"
                />
                <div>
                  <span className="text-xs font-bold text-neutral-900">
                    Nursery & External Material Vendor Bills Paid
                  </span>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    All supplier invoices for soil, sand, compost, lawn turf sod, and equipment hire settled.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Profit & Loss Statement */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Full Project Profit & Loss (P&L) Audit</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Comprehensive ledger of revenues, direct costs, daily site overheads and final margin.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {/* Revenue Section */}
            <div>
              <div className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-1.5 text-emerald-900">
                1. Project Revenue
              </div>
              <div className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-700">Total Contract Billed</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {formatCurrency(financials.totalContractValue, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-700">Cash Received to Date</span>
                  <span className="font-bold text-emerald-800 tabular-nums">
                    {formatCurrency(financials.totalCollected, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Costs Section */}
            <div>
              <div className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-1.5 text-neutral-800">
                2. Direct Costs Breakdown
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Daily Workers Wages & Labour</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {formatCurrency(financials.expenseBreakdown.totalLabourCost, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Supervisor Salary Share</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {formatCurrency(financials.expenseBreakdown.supervisorSalaryTotal, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Materials & Plants Consumed</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {formatCurrency(financials.expenseBreakdown.materialsUsedTotal, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Daily Chai / Tea & Snacks</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {formatCurrency(financials.expenseBreakdown.teaSnacksTotal, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Worker Meals & Food</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {formatCurrency(financials.expenseBreakdown.foodMealsTotal, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Fuel & Diesel (Machinery)</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {formatCurrency(financials.expenseBreakdown.fuelTotal, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Local Tempo & Transport</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {formatCurrency(financials.expenseBreakdown.transportExpensesTotal, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Consumables, Tools & Misc</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {formatCurrency(financials.expenseBreakdown.consumablesTotal + financials.expenseBreakdown.miscExpensesTotal, currency)}
                  </span>
                </div>
                {financials.expenseBreakdown.extraWorkCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Extra Work Direct Cost</span>
                    <span className="font-semibold text-neutral-900 tabular-nums">
                      {formatCurrency(financials.expenseBreakdown.extraWorkCost, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-neutral-200 font-bold text-neutral-900">
                  <span>Total Project Expenses</span>
                  <span className="tabular-nums">{formatCurrency(financials.totalExpenses, currency)}</span>
                </div>
              </div>
            </div>

            {/* Bottom Line Profit Summary */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                    Realized Net Profit
                  </span>
                  <div className="text-[10px] text-neutral-500">Cash In Hand - All Direct Expenses</div>
                </div>
                <span className={`text-xl font-bold tabular-nums ${
                  financials.realizedProfit >= 0 ? 'text-emerald-900' : 'text-rose-700'
                }`}>
                  {formatCurrency(financials.realizedProfit, currency)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs pt-1 border-t border-emerald-200/60">
                <span className="text-emerald-900 font-medium">Net Profit Margin %</span>
                <span className="font-bold text-emerald-900 tabular-nums">
                  {financials.realizedMarginPercent}%
                </span>
              </div>
            </div>

            {/* Warranty & Handover Sign-off */}
            <div className="pt-2 space-y-3">
              <div className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] text-neutral-800">
                3. Handover & Warranty Sign-off
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Handover Signed By</label>
                  <input
                    type="text"
                    value={signedBy}
                    onChange={e => setSignedBy(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                    placeholder="Customer Name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Warranty Period</label>
                  <select
                    value={data.warrantyPeriodMonths}
                    onChange={e => setData({ ...data, warrantyPeriodMonths: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                  >
                    <option value={1}>1 Month (Lawn Sod Only)</option>
                    <option value={3}>3 Months Standard Warranty</option>
                    <option value={6}>6 Months Comprehensive</option>
                    <option value={12}>12 Months with Quarterly Pruning</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">Client Rating & Feedback</label>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setData({ ...data, clientRating: star })}
                      className="text-amber-400 hover:text-amber-500"
                    >
                      <Star className={`w-4 h-4 ${star <= (data.clientRating || 5) ? 'fill-amber-400' : 'text-neutral-300'}`} />
                    </button>
                  ))}
                  <span className="text-xs text-neutral-500 ml-2">{(data.clientRating || 5)} / 5 Stars</span>
                </div>
                <textarea
                  rows={2}
                  value={data.clientFeedback || ''}
                  onChange={e => setData({ ...data, clientFeedback: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg resize-none"
                  placeholder="Client feedback and satisfaction notes upon final walkthrough..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
