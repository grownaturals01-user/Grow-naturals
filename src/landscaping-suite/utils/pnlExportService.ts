import { LandscapingProject } from '../types/landscaping';
import { calculateProjectFinancials, calculateDailyLogTotal, FinancialOverview } from './calculations';

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

function downloadCsvFile(content: string, filename: string): void {
  // Add UTF-8 BOM (\uFEFF) so Excel and spreadsheet apps correctly parse UTF-8 characters and currency symbols
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const PnlExportService = {
  /**
   * Export an individual project's complete P&L financial summary and itemized daily expenses to CSV
   */
  exportProjectPnLToCsv(project: LandscapingProject, currencySymbol: string = '₹'): void {
    const fin = calculateProjectFinancials(project);
    const dateStr = new Date().toISOString().split('T')[0];
    const lines: string[] = [];

    // Header & Meta
    lines.push([escapeCsvCell('TERRAFLOW LANDSCAPING MANAGEMENT'), escapeCsvCell('PROJECT P&L & EXPENSE REPORT')].join(','));
    lines.push([escapeCsvCell('Generated Date'), escapeCsvCell(new Date().toLocaleString())].join(','));
    lines.push([escapeCsvCell('Project Code'), escapeCsvCell(project.code)].join(','));
    lines.push([escapeCsvCell('Project Title'), escapeCsvCell(project.title)].join(','));
    lines.push([escapeCsvCell('Client Name'), escapeCsvCell(project.step1Enquiry.clientName)].join(','));
    lines.push([escapeCsvCell('Client Contact'), escapeCsvCell(`${project.step1Enquiry.phone} | ${project.step1Enquiry.email}`)].join(','));
    lines.push([escapeCsvCell('Site Location'), escapeCsvCell(`${project.step1Enquiry.siteAddress}, ${project.step1Enquiry.city}`)].join(','));
    lines.push([escapeCsvCell('Project Stage'), escapeCsvCell(project.currentStage)].join(','));
    lines.push('');

    // Executive Financial Summary
    lines.push([escapeCsvCell('=== EXECUTIVE FINANCIAL SUMMARY ===')].join(','));
    lines.push([escapeCsvCell('Metric'), escapeCsvCell(`Amount (${currencySymbol})`), escapeCsvCell('Notes')].join(','));
    lines.push([escapeCsvCell('Base Quotation Value'), escapeCsvCell(fin.baseQuotationTotal), escapeCsvCell('Agreed scope')].join(','));
    lines.push([escapeCsvCell('Approved Extra Works'), escapeCsvCell(fin.approvedExtraWorkTotal), escapeCsvCell('Client approved revisions')].join(','));
    lines.push([escapeCsvCell('Site Distance / Visit Charge'), escapeCsvCell(fin.distanceChargeTotal), escapeCsvCell('')].join(','));
    lines.push([escapeCsvCell('Total Contract Value'), escapeCsvCell(fin.totalContractValue), escapeCsvCell('Gross Billing Value')].join(','));
    lines.push('');

    // Cash Inflow & Collections
    lines.push([escapeCsvCell('=== CASH COLLECTIONS & RECEIVABLES ===')].join(','));
    lines.push([escapeCsvCell('Stage'), escapeCsvCell(`Amount (${currencySymbol})`), escapeCsvCell('Status')].join(','));
    lines.push([escapeCsvCell('Advance Received'), escapeCsvCell(fin.advanceReceived), escapeCsvCell(project.step4Planning.isAdvanceReceived ? 'Received' : 'Pending')].join(','));
    lines.push([escapeCsvCell('Part Payments Received'), escapeCsvCell(fin.partPaymentsTotal), escapeCsvCell(`${(project.step6ExtraWork.partPayments || []).length} payment installments`)].join(','));
    lines.push([escapeCsvCell('Final Settlement Received'), escapeCsvCell(fin.settlementPaymentReceived), escapeCsvCell(project.step7Settlement.isFullySettled ? 'Settled' : 'Pending')].join(','));
    lines.push([escapeCsvCell('Total Cash Inflow'), escapeCsvCell(fin.totalCollected), escapeCsvCell(`${fin.collectionProgressPercent}% Collected`)].join(','));
    lines.push([escapeCsvCell('Outstanding Receivable Balance'), escapeCsvCell(fin.outstandingReceivable), escapeCsvCell(fin.outstandingReceivable > 0 ? 'Pending Collection' : 'Fully Paid')].join(','));
    lines.push('');

    // Cost Structure Breakdown
    lines.push([escapeCsvCell('=== EXPENSE & COST STRUCTURE BREAKDOWN ===')].join(','));
    lines.push([escapeCsvCell('Cost Head'), escapeCsvCell(`Amount (${currencySymbol})`), escapeCsvCell('% of Total Expenses')].join(','));
    const exp = fin.expenseBreakdown;
    const calcPct = (amt: number) => fin.totalExpenses > 0 ? `${Math.round((amt / fin.totalExpenses) * 100)}%` : '0%';
    lines.push([escapeCsvCell('Labour Daily Wages (Skilled & Unskilled)'), escapeCsvCell(exp.dailyWagesTotal), escapeCsvCell(calcPct(exp.dailyWagesTotal))].join(','));
    lines.push([escapeCsvCell('Contract Labour'), escapeCsvCell(exp.contractLabourTotal), escapeCsvCell(calcPct(exp.contractLabourTotal))].join(','));
    lines.push([escapeCsvCell('Supervisor Salary Allocation'), escapeCsvCell(exp.supervisorSalaryTotal), escapeCsvCell(calcPct(exp.supervisorSalaryTotal))].join(','));
    lines.push([escapeCsvCell('Materials & Plants Actually Logged'), escapeCsvCell(exp.materialsUsedTotal), escapeCsvCell(calcPct(exp.materialsUsedTotal))].join(','));
    lines.push([escapeCsvCell('Tea, Snacks & Refreshments'), escapeCsvCell(exp.teaSnacksTotal), escapeCsvCell(calcPct(exp.teaSnacksTotal))].join(','));
    lines.push([escapeCsvCell('Food & Meals'), escapeCsvCell(exp.foodMealsTotal), escapeCsvCell(calcPct(exp.foodMealsTotal))].join(','));
    lines.push([escapeCsvCell('Fuel & Diesel (Machinery & Transport)'), escapeCsvCell(exp.fuelTotal), escapeCsvCell(calcPct(exp.fuelTotal))].join(','));
    lines.push([escapeCsvCell('Local Tempo & Transport Expenses'), escapeCsvCell(exp.transportExpensesTotal), escapeCsvCell(calcPct(exp.transportExpensesTotal))].join(','));
    lines.push([escapeCsvCell('Consumables & Tool Repairs'), escapeCsvCell(exp.consumablesTotal), escapeCsvCell(calcPct(exp.consumablesTotal))].join(','));
    lines.push([escapeCsvCell('Miscellaneous Site Overheads'), escapeCsvCell(exp.miscExpensesTotal), escapeCsvCell(calcPct(exp.miscExpensesTotal))].join(','));
    lines.push([escapeCsvCell('Total Direct Site Expenses'), escapeCsvCell(fin.totalExpenses), escapeCsvCell('100%')].join(','));
    lines.push('');

    // Profitability
    lines.push([escapeCsvCell('=== REALIZED PROFITABILITY ===')].join(','));
    lines.push([escapeCsvCell('Realized Net Profit'), escapeCsvCell(fin.realizedProfit), escapeCsvCell(fin.isProfitable ? 'Profitable' : 'Deficit')].join(','));
    lines.push([escapeCsvCell('Realized Net Margin %'), escapeCsvCell(`${fin.realizedMarginPercent}%`), escapeCsvCell('Net margin on cash collected')].join(','));
    lines.push([escapeCsvCell('Projected Profit at Contract Completion'), escapeCsvCell(fin.projectedProfit), escapeCsvCell(`${fin.projectedMarginPercent}% projected margin`)].join(','));
    lines.push('');

    // Itemized Daily Operations Ledger
    lines.push([escapeCsvCell('=== ITEMIZED DAILY OPERATIONS & EXPENSE LEDGER ===')].join(','));
    lines.push([
      escapeCsvCell('Date'),
      escapeCsvCell('Supervisor'),
      escapeCsvCell('Skilled Workers'),
      escapeCsvCell('Unskilled Workers'),
      escapeCsvCell('Daily Wages Cost'),
      escapeCsvCell('Supervisor Cost'),
      escapeCsvCell('Site Expenses (Food/Fuel)'),
      escapeCsvCell('Materials Used Approx'),
      escapeCsvCell('Total Daily Cost'),
      escapeCsvCell('Work Description & Notes'),
    ].join(','));

    const dailyLogs = project.step5DailyOperations || [];
    if (dailyLogs.length === 0) {
      lines.push([escapeCsvCell('No daily logs recorded yet')].join(','));
    } else {
      dailyLogs.forEach(log => {
        const logCalc = calculateDailyLogTotal(log);
        lines.push([
          escapeCsvCell(log.date),
          escapeCsvCell(project.step4Planning.supervisorName || 'Site Supervisor'),
          escapeCsvCell(log.workers.skilledWorkersCount),
          escapeCsvCell(log.workers.unskilledWorkersCount),
          escapeCsvCell(log.workers.skilledWorkersCount * log.workers.skilledDailyWageRate + log.workers.unskilledWorkersCount * log.workers.unskilledDailyWageRate + (log.workers.contractLabourAmount || 0)),
          escapeCsvCell(log.supervisorSalaryAllocation || 0),
          escapeCsvCell(logCalc.expensesCost),
          escapeCsvCell(logCalc.materialsCost),
          escapeCsvCell(logCalc.dayTotal),
          escapeCsvCell(log.workSummary || ''),
        ].join(','));
      });
    }

    const csvContent = lines.join('\r\n');
    const safeTitle = project.code.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadCsvFile(csvContent, `${safeTitle}_PnL_Report_${dateStr}.csv`);
  },

  /**
   * Export the entire portfolio's P&L matrix to CSV
   */
  exportPortfolioPnLToCsv(projects: LandscapingProject[], currencySymbol: string = '₹'): void {
    const dateStr = new Date().toISOString().split('T')[0];
    const lines: string[] = [];

    lines.push([escapeCsvCell('TERRAFLOW LANDSCAPING MANAGEMENT'), escapeCsvCell('PORTFOLIO PROFIT & LOSS AUDIT MATRIX')].join(','));
    lines.push([escapeCsvCell('Generated Date'), escapeCsvCell(new Date().toLocaleString())].join(','));
    lines.push([escapeCsvCell('Total Projects Contracted'), escapeCsvCell(projects.length)].join(','));
    lines.push('');

    // Table Columns
    lines.push([
      escapeCsvCell('Project Code'),
      escapeCsvCell('Project Title'),
      escapeCsvCell('Client Name'),
      escapeCsvCell('Client Phone'),
      escapeCsvCell('City / Location'),
      escapeCsvCell('Current Stage'),
      escapeCsvCell(`Contract Value (${currencySymbol})`),
      escapeCsvCell(`Total Collected (${currencySymbol})`),
      escapeCsvCell(`Labour Cost (${currencySymbol})`),
      escapeCsvCell(`Materials Cost (${currencySymbol})`),
      escapeCsvCell(`Daily Site Expenses (${currencySymbol})`),
      escapeCsvCell(`Total Actual Expenses (${currencySymbol})`),
      escapeCsvCell(`Net Profit (${currencySymbol})`),
      escapeCsvCell('Margin %'),
      escapeCsvCell(`Outstanding Balance (${currencySymbol})`),
      escapeCsvCell('Status'),
    ].join(','));

    let totalContract = 0;
    let totalCollected = 0;
    let totalLabour = 0;
    let totalMaterials = 0;
    let totalDailyOps = 0;
    let totalExpenses = 0;
    let totalProfit = 0;
    let totalOutstanding = 0;

    projects.forEach(p => {
      const fin = calculateProjectFinancials(p);
      totalContract += fin.totalContractValue;
      totalCollected += fin.totalCollected;
      totalLabour += fin.expenseBreakdown.totalLabourCost;
      totalMaterials += fin.expenseBreakdown.materialsUsedTotal;
      totalDailyOps += fin.expenseBreakdown.totalDailySiteExpenses + fin.expenseBreakdown.supervisorSalaryTotal;
      totalExpenses += fin.totalExpenses;
      totalProfit += fin.realizedProfit;
      totalOutstanding += fin.outstandingReceivable;

      lines.push([
        escapeCsvCell(p.code),
        escapeCsvCell(p.title),
        escapeCsvCell(p.step1Enquiry.clientName),
        escapeCsvCell(p.step1Enquiry.phone),
        escapeCsvCell(`${p.step1Enquiry.city}`),
        escapeCsvCell(p.currentStage),
        escapeCsvCell(fin.totalContractValue),
        escapeCsvCell(fin.totalCollected),
        escapeCsvCell(fin.expenseBreakdown.totalLabourCost),
        escapeCsvCell(fin.expenseBreakdown.materialsUsedTotal),
        escapeCsvCell(fin.expenseBreakdown.totalDailySiteExpenses + fin.expenseBreakdown.supervisorSalaryTotal),
        escapeCsvCell(fin.totalExpenses),
        escapeCsvCell(fin.realizedProfit),
        escapeCsvCell(`${fin.realizedMarginPercent}%`),
        escapeCsvCell(fin.outstandingReceivable),
        escapeCsvCell(p.isConvertedToProject ? 'In Execution' : 'Pre-Project Enquiry'),
      ].join(','));
    });

    lines.push('');
    // Summary Row
    lines.push([
      escapeCsvCell('PORTFOLIO TOTALS'),
      escapeCsvCell(''),
      escapeCsvCell(''),
      escapeCsvCell(''),
      escapeCsvCell(''),
      escapeCsvCell(''),
      escapeCsvCell(totalContract),
      escapeCsvCell(totalCollected),
      escapeCsvCell(totalLabour),
      escapeCsvCell(totalMaterials),
      escapeCsvCell(totalDailyOps),
      escapeCsvCell(totalExpenses),
      escapeCsvCell(totalProfit),
      escapeCsvCell(`${totalCollected > 0 ? Math.round((totalProfit / totalCollected) * 100) : 0}%`),
      escapeCsvCell(totalOutstanding),
      escapeCsvCell(''),
    ].join(','));

    const csvContent = lines.join('\r\n');
    downloadCsvFile(csvContent, `TerraFlow_Portfolio_PnL_Matrix_${dateStr}.csv`);
  },

  /**
   * Export the list of pending collections for accounts & follow-up
   */
  exportCollectionsListToCsv(
    items: Array<{ project: LandscapingProject; fin: FinancialOverview }>,
    currencySymbol: string = '₹'
  ): void {
    const dateStr = new Date().toISOString().split('T')[0];
    const lines: string[] = [];

    lines.push([escapeCsvCell('TERRAFLOW LANDSCAPING MANAGEMENT'), escapeCsvCell('PENDING COLLECTIONS & RECEIVABLES LEDGER')].join(','));
    lines.push([escapeCsvCell('Report Date'), escapeCsvCell(new Date().toLocaleString())].join(','));
    lines.push([escapeCsvCell('Pending Accounts Count'), escapeCsvCell(items.length)].join(','));
    lines.push('');

    lines.push([
      escapeCsvCell('Project Code'),
      escapeCsvCell('Project Title'),
      escapeCsvCell('Client Name'),
      escapeCsvCell('Phone Number'),
      escapeCsvCell('Email Address'),
      escapeCsvCell('Site Address'),
      escapeCsvCell('Stage'),
      escapeCsvCell(`Contract Value (${currencySymbol})`),
      escapeCsvCell(`Collected Amount (${currencySymbol})`),
      escapeCsvCell(`Outstanding Balance (${currencySymbol})`),
      escapeCsvCell('Collection %'),
      escapeCsvCell('Payment Status Note'),
    ].join(','));

    let totalPending = 0;

    items.forEach(({ project, fin }) => {
      totalPending += fin.outstandingReceivable;
      let statusNote = 'Part Payment Pending';
      if (!project.step4Planning.isAdvanceReceived) {
        statusNote = 'Advance Payment Due';
      } else if (project.currentStage === 'settlement' || project.completedStages.includes('settlement')) {
        statusNote = 'Final Settlement Overdue';
      }

      lines.push([
        escapeCsvCell(project.code),
        escapeCsvCell(project.title),
        escapeCsvCell(project.step1Enquiry.clientName),
        escapeCsvCell(project.step1Enquiry.phone),
        escapeCsvCell(project.step1Enquiry.email),
        escapeCsvCell(`${project.step1Enquiry.siteAddress}, ${project.step1Enquiry.city}`),
        escapeCsvCell(project.currentStage),
        escapeCsvCell(fin.totalContractValue),
        escapeCsvCell(fin.totalCollected),
        escapeCsvCell(fin.outstandingReceivable),
        escapeCsvCell(`${fin.collectionProgressPercent}%`),
        escapeCsvCell(statusNote),
      ].join(','));
    });

    lines.push('');
    lines.push([
      escapeCsvCell('TOTAL OUTSTANDING RECEIVABLES'),
      escapeCsvCell(''),
      escapeCsvCell(''),
      escapeCsvCell(''),
      escapeCsvCell(''),
      escapeCsvCell(''),
      escapeCsvCell(''),
      escapeCsvCell(''),
      escapeCsvCell(''),
      escapeCsvCell(totalPending),
      escapeCsvCell(''),
      escapeCsvCell(''),
    ].join(','));

    const csvContent = lines.join('\r\n');
    downloadCsvFile(csvContent, `Pending_Collections_Ledger_${dateStr}.csv`);
  },
};
