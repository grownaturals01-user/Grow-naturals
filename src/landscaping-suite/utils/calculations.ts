import { LandscapingProject, QuotationLineItem, DailyOperationLog, DailyExpenseItem } from '../types/landscaping';

export interface QuotationSummary {
  materialsTotal: number;
  plantsTotal: number;
  potsTotal: number;
  labourTotal: number;
  transportTotal: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalQuotation: number;
}

export interface ExpenseBreakdown {
  dailyWagesTotal: number;
  contractLabourTotal: number;
  totalLabourCost: number;
  supervisorSalaryTotal: number;
  teaSnacksTotal: number;
  foodMealsTotal: number;
  fuelTotal: number;
  transportExpensesTotal: number;
  consumablesTotal: number;
  miscExpensesTotal: number;
  totalDailySiteExpenses: number;
  materialsUsedTotal: number;
  distanceExpenses: number;
  extraWorkCost: number;
  grandTotalExpenses: number;
}

export interface FinancialOverview {
  baseQuotationTotal: number;
  approvedExtraWorkTotal: number;
  distanceChargeTotal: number;
  totalContractValue: number;
  
  advanceReceived: number;
  partPaymentsTotal: number;
  settlementPaymentReceived: number;
  totalCollected: number;
  
  outstandingReceivable: number;
  collectionProgressPercent: number;
  
  expenseBreakdown: ExpenseBreakdown;
  totalExpenses: number;
  
  projectedProfit: number;
  realizedProfit: number;
  projectedMarginPercent: number;
  realizedMarginPercent: number;
  isProfitable: boolean;
}

export function calculateQuotationSummary(items: QuotationLineItem[], taxPercent: number, discountAmount: number = 0): QuotationSummary {
  let materialsTotal = 0;
  let plantsTotal = 0;
  let potsTotal = 0;
  let labourTotal = 0;
  let transportTotal = 0;

  items.forEach(item => {
    const itemTotal = Number(item.total) || (Number(item.quantity) * Number(item.unitPrice));
    switch (item.category) {
      case 'materials':
        materialsTotal += itemTotal;
        break;
      case 'plants':
        plantsTotal += itemTotal;
        break;
      case 'pots':
        potsTotal += itemTotal;
        break;
      case 'labour':
        labourTotal += itemTotal;
        break;
      case 'transport':
        transportTotal += itemTotal;
        break;
    }
  });

  const subtotal = materialsTotal + plantsTotal + potsTotal + labourTotal + transportTotal;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableBase * taxPercent) / 100;
  const totalQuotation = taxableBase + taxAmount;

  return {
    materialsTotal,
    plantsTotal,
    potsTotal,
    labourTotal,
    transportTotal,
    subtotal,
    taxAmount,
    discountAmount,
    totalQuotation,
  };
}

export function calculateDailyLogTotal(log: DailyOperationLog): {
  labourCost: number;
  supervisorCost: number;
  expensesCost: number;
  materialsCost: number;
  dayTotal: number;
} {
  const skilledCost = (log.workers.skilledWorkersCount || 0) * (log.workers.skilledDailyWageRate || 0);
  const unskilledCost = (log.workers.unskilledWorkersCount || 0) * (log.workers.unskilledDailyWageRate || 0);
  const contractCost = log.workers.contractLabourAmount || 0;
  const labourCost = skilledCost + unskilledCost + contractCost;

  const supervisorCost = log.supervisorSalaryAllocation || 0;

  const expensesCost = (log.expenses || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const materialsCost = (log.materialsUsed || []).reduce((sum, item) => sum + (Number(item.approxValue) || 0), 0);

  return {
    labourCost,
    supervisorCost,
    expensesCost,
    materialsCost,
    dayTotal: labourCost + supervisorCost + expensesCost + materialsCost,
  };
}

export function calculateExpenseBreakdown(project: LandscapingProject): ExpenseBreakdown {
  let dailyWagesTotal = 0;
  let contractLabourTotal = 0;
  let supervisorSalaryTotal = 0;
  let teaSnacksTotal = 0;
  let foodMealsTotal = 0;
  let fuelTotal = 0;
  let transportExpensesTotal = 0;
  let consumablesTotal = 0;
  let miscExpensesTotal = 0;
  let materialsUsedTotal = 0;

  (project.step5DailyOperations || []).forEach(log => {
    const skilled = (log.workers.skilledWorkersCount || 0) * (log.workers.skilledDailyWageRate || 0);
    const unskilled = (log.workers.unskilledWorkersCount || 0) * (log.workers.unskilledDailyWageRate || 0);
    dailyWagesTotal += skilled + unskilled;
    contractLabourTotal += (log.workers.contractLabourAmount || 0);
    supervisorSalaryTotal += (log.supervisorSalaryAllocation || 0);

    (log.expenses || []).forEach(exp => {
      const amt = Number(exp.amount) || 0;
      switch (exp.category) {
        case 'Tea & Snacks':
          teaSnacksTotal += amt;
          break;
        case 'Food & Meals':
          foodMealsTotal += amt;
          break;
        case 'Fuel & Diesel':
          fuelTotal += amt;
          break;
        case 'Local Tempo / Transport':
          transportExpensesTotal += amt;
          break;
        case 'Consumables & Tools':
          consumablesTotal += amt;
          break;
        default:
          miscExpensesTotal += amt;
          break;
      }
    });

    (log.materialsUsed || []).forEach(mat => {
      materialsUsedTotal += Number(mat.approxValue) || 0;
    });
  });

  const totalLabourCost = dailyWagesTotal + contractLabourTotal;
  const totalDailySiteExpenses = teaSnacksTotal + foodMealsTotal + fuelTotal + transportExpensesTotal + consumablesTotal + miscExpensesTotal;

  // Site assessment distance expense if not free visit
  const distanceExpenses = project.step2SiteVisit?.isFreeVisit ? 0 : (project.step2SiteVisit?.distanceChargeTotal || 0);

  // Extra work internal cost for approved items
  const extraWorkCost = (project.step6ExtraWork?.extraWorks || [])
    .filter(ew => ew.status === 'Client Approved' || ew.status === 'In Progress' || ew.status === 'Completed')
    .reduce((sum, ew) => sum + (Number(ew.estimatedInternalCost) || 0), 0);

  const grandTotalExpenses = totalLabourCost + supervisorSalaryTotal + totalDailySiteExpenses + materialsUsedTotal + distanceExpenses + extraWorkCost;

  return {
    dailyWagesTotal,
    contractLabourTotal,
    totalLabourCost,
    supervisorSalaryTotal,
    teaSnacksTotal,
    foodMealsTotal,
    fuelTotal,
    transportExpensesTotal,
    consumablesTotal,
    miscExpensesTotal,
    totalDailySiteExpenses,
    materialsUsedTotal,
    distanceExpenses,
    extraWorkCost,
    grandTotalExpenses,
  };
}

export function calculateProjectFinancials(project: LandscapingProject): FinancialOverview {
  const quoteSummary = calculateQuotationSummary(
    project.step3Quotation?.items || [],
    project.step3Quotation?.taxPercent || 0,
    project.step3Quotation?.discountAmount || 0
  );

  const baseQuotationTotal = quoteSummary.totalQuotation;

  // Distance charge from site assessment (if not free visit)
  const distanceChargeTotal = project.step2SiteVisit?.isFreeVisit ? 0 : (project.step2SiteVisit?.distanceChargeTotal || 0);

  // Approved extra work
  const approvedExtraWorkTotal = (project.step6ExtraWork?.extraWorks || [])
    .filter(ew => ew.status === 'Client Approved' || ew.status === 'In Progress' || ew.status === 'Completed')
    .reduce((sum, ew) => sum + (Number(ew.quotedToClient) || 0), 0);

  const totalContractValue = baseQuotationTotal + distanceChargeTotal + approvedExtraWorkTotal;

  // Collections
  const advanceReceived = Number(project.step4Planning?.advanceReceivedAmount) || 0;
  const partPaymentsTotal = (project.step6ExtraWork?.partPayments || [])
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const settlementPaymentReceived = Number(project.step7Settlement?.finalSettlementPaymentReceived) || 0;

  const totalCollected = advanceReceived + partPaymentsTotal + settlementPaymentReceived;
  const outstandingReceivable = Math.max(0, totalContractValue - totalCollected);
  const collectionProgressPercent = totalContractValue > 0 ? Math.min(100, Math.round((totalCollected / totalContractValue) * 100)) : 0;

  // Expenses
  const expenseBreakdown = calculateExpenseBreakdown(project);
  const totalExpenses = expenseBreakdown.grandTotalExpenses;

  // Realized profit based on actual cash collected minus actual expenses
  const realizedProfit = totalCollected - totalExpenses;
  const realizedMarginPercent = totalCollected > 0 ? (realizedProfit / totalCollected) * 100 : 0;

  // Projected profit based on total contract value minus actual expenses
  const projectedProfit = totalContractValue - totalExpenses;
  const projectedMarginPercent = totalContractValue > 0 ? (projectedProfit / totalContractValue) * 100 : 0;

  return {
    baseQuotationTotal,
    approvedExtraWorkTotal,
    distanceChargeTotal,
    totalContractValue,
    advanceReceived,
    partPaymentsTotal,
    settlementPaymentReceived,
    totalCollected,
    outstandingReceivable,
    collectionProgressPercent,
    expenseBreakdown,
    totalExpenses,
    projectedProfit,
    realizedProfit,
    projectedMarginPercent: Math.round(projectedMarginPercent * 10) / 10,
    realizedMarginPercent: Math.round(realizedMarginPercent * 10) / 10,
    isProfitable: projectedProfit >= 0,
  };
}

export function formatCurrency(amount: number, currency: string = '₹'): string {
  const abs = Math.abs(amount || 0);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(abs);

  const prefix = amount < 0 ? '-' : '';
  return `${prefix}${currency} ${formatted}`;
}
