import React, { useState } from 'react';
import { LandscapingProject } from '../../types/landscaping';
import { calculateQuotationSummary, formatCurrency } from '../../utils/calculations';
import { PdfQuotationService, PdfServiceOptions, DEFAULT_COMPANY_DETAILS } from '../../services/pdfQuotationService';
import {
  X,
  Printer,
  Sprout,
  Download,
  Loader2,
  Building2,
  Phone,
  Mail,
  FileText,
  CreditCard,
  CheckCircle2,
  Settings,
  Eye,
  Copy,
  Check,
  ShieldCheck,
  TreePine,
  Layers,
  HardHat,
  Truck,
  Sparkles,
} from 'lucide-react';

interface PrintableQuotationModalProps {
  project: LandscapingProject;
  onClose: () => void;
}

export const PrintableQuotationModal: React.FC<PrintableQuotationModalProps> = ({
  project,
  onClose,
}) => {
  const quote = project.step3Quotation;
  const client = project.step1Enquiry;
  const summary = calculateQuotationSummary(quote.items, quote.taxPercent, quote.discountAmount);
  const currency = project.currency || '₹';

  const [activeTab, setActiveTab] = useState<'preview' | 'branding'>('preview');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Editable Company Branding and Wire Details
  const [branding, setBranding] = useState<PdfServiceOptions>({
    ...DEFAULT_COMPANY_DETAILS,
  });

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await PdfQuotationService.downloadQuotationPdf(project, branding);
    } catch (e) {
      console.error('Failed to download PDF:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    PdfQuotationService.printQuotationDirect(project, branding);
  };

  const handleCopySummary = () => {
    const text = `
*OFFICIAL PROJECT QUOTATION*
*${branding.companyName}*
----------------------------------------
Quotation Ref: ${quote.quotationNumber}
Project: ${project.title} (${project.code})
Client: ${client.clientName} | ${client.phone}
Site: ${client.siteAddress}, ${client.city}
Date: ${quote.createdDate} (Valid until: ${quote.validUntilDate})

*EXECUTIVE COST BREAKDOWN:*
• Hardscape & Soil Materials: ${formatCurrency(summary.materialsTotal, currency)}
• Flora, Palms & Turf Sod: ${formatCurrency(summary.plantsTotal + summary.potsTotal, currency)}
• Estimated Labour Hours & Trades: ${formatCurrency(summary.labourTotal, currency)}
• Logistics & Machinery: ${formatCurrency(summary.transportTotal, currency)}
----------------------------------------
Gross Subtotal: ${formatCurrency(summary.subtotal, currency)}
${summary.discountAmount > 0 ? `Goodwill Discount: -${formatCurrency(summary.discountAmount, currency)}\n` : ''}Tax / GST (${quote.taxPercent}%): +${formatCurrency(summary.taxAmount, currency)}
*GRAND TOTAL CONTRACT: ${formatCurrency(summary.totalQuotation, currency)}*

*PAYMENT MILESTONES:*
• 50% Mobilization Advance: ${formatCurrency(summary.totalQuotation * 0.5, currency)}
• 40% Progress Milestone: ${formatCurrency(summary.totalQuotation * 0.4, currency)}
• 10% Final Settlement: ${formatCurrency(summary.totalQuotation * 0.1, currency)}

*Bank Details:* ${branding.bankName}
A/C: ${branding.bankAccountNumber} | IFSC: ${branding.bankIfsc}
Beneficiary: ${branding.bankAccountName}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const totalSub = summary.subtotal || 1;
  const floraTotal = summary.plantsTotal + summary.potsTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl my-auto text-neutral-900 border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="bg-neutral-900 text-white px-5 py-3.5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight">Project Quotation PDF Export</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {quote.quotationNumber}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Official contractor PDF with company branding, executive cost breakdown & BOQ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="bg-neutral-800 p-0.5 rounded-lg flex items-center text-xs">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                  activeTab === 'preview'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Document Preview</span>
              </button>
              <button
                onClick={() => setActiveTab('branding')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                  activeTab === 'branding'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Custom Branding</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Secondary Action Bar: Download & Share Actions */}
        <div className="bg-neutral-50 border-b border-neutral-200 px-5 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-neutral-600">
            <span className="font-semibold text-neutral-800">{project.title}</span>
            <span>·</span>
            <span>{client.clientName}</span>
            <span>·</span>
            <span className="font-bold text-emerald-800 font-mono">
              Total: {formatCurrency(summary.totalQuotation, currency)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg transition-colors shadow-2xs"
              title="Copy text summary for WhatsApp or email"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
              <span>{copiedSummary ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg transition-colors shadow-2xs"
              title="Print document directly"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-500" />
              <span>Print View</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 rounded-lg transition-all shadow-xs disabled:opacity-50 hover:scale-[1.01]"
              title="Export formatted PDF with company branding and cost breakdowns"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Formatted PDF'}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-neutral-100/60">
          {activeTab === 'branding' ? (
            /* =========================================================
             * BRANDING & SETTINGS TAB
             * ========================================================= */
            <div className="max-w-3xl mx-auto space-y-5">
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-neutral-900">
                    Company Branding & Letterhead Information
                  </h3>
                </div>
                <p className="text-xs text-neutral-500">
                  These details appear prominently in the PDF header banner, legal sign-off, and running footers.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">Company / Firm Name</label>
                    <input
                      type="text"
                      value={branding.companyName || ''}
                      onChange={e => setBranding({ ...branding, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">Architectural Tagline</label>
                    <input
                      type="text"
                      value={branding.tagline || ''}
                      onChange={e => setBranding({ ...branding, tagline: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold text-neutral-700 block mb-1">Registered Office & Nursery Address</label>
                    <input
                      type="text"
                      value={branding.companyAddress || ''}
                      onChange={e => setBranding({ ...branding, companyAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">Phone Numbers</label>
                    <input
                      type="text"
                      value={branding.companyPhone || ''}
                      onChange={e => setBranding({ ...branding, companyPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">Email Address</label>
                    <input
                      type="text"
                      value={branding.companyEmail || ''}
                      onChange={e => setBranding({ ...branding, companyEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">Website URL</label>
                    <input
                      type="text"
                      value={branding.companyWebsite || ''}
                      onChange={e => setBranding({ ...branding, companyWebsite: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">GSTIN / Tax ID / PAN</label>
                    <input
                      type="text"
                      value={branding.taxRegistrationNumber || ''}
                      onChange={e => setBranding({ ...branding, taxRegistrationNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Account Wire Information */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-neutral-900">
                    Client Advance Wire & Bank Details
                  </h3>
                </div>
                <p className="text-xs text-neutral-500">
                  Included in the PDF under Payment Milestones for clients to disburse the 50% mobilization advance.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">Bank Name & Branch</label>
                    <input
                      type="text"
                      value={branding.bankName || ''}
                      onChange={e => setBranding({ ...branding, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">Account Beneficiary Name</label>
                    <input
                      type="text"
                      value={branding.bankAccountName || ''}
                      onChange={e => setBranding({ ...branding, bankAccountName: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">Account Number</label>
                    <input
                      type="text"
                      value={branding.bankAccountNumber || ''}
                      onChange={e => setBranding({ ...branding, bankAccountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={branding.bankIfsc || ''}
                      onChange={e => setBranding({ ...branding, bankIfsc: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold text-neutral-700 block mb-1">UPI ID (VPA)</label>
                    <input
                      type="text"
                      value={branding.bankUpiId || ''}
                      onChange={e => setBranding({ ...branding, bankUpiId: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setBranding({ ...DEFAULT_COMPANY_DETAILS })}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Updated Document</span>
                </button>
              </div>
            </div>
          ) : (
            /* =========================================================
             * LIVE DOCUMENT PREVIEW TAB
             * ========================================================= */
            <div className="bg-white rounded-xl max-w-3xl mx-auto shadow-md border border-neutral-200 overflow-hidden text-neutral-800">
              {/* Document Banner */}
              <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 relative">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-800 border border-amber-400/60 flex items-center justify-center shrink-0 shadow-md">
                      <Sprout className="w-6 h-6 text-emerald-200" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight text-white">
                        {branding.companyName}
                      </h2>
                      <p className="text-xs text-emerald-200 mt-0.5">
                        {branding.tagline}
                      </p>
                      <div className="text-[11px] text-emerald-300/80 mt-2 space-y-0.5">
                        <div>{branding.companyAddress}</div>
                        <div>Tel: {branding.companyPhone} · {branding.companyEmail}</div>
                        <div className="font-mono text-[10px] text-amber-300/90">{branding.taxRegistrationNumber}</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-300 block">
                      Official Quotation
                    </span>
                    <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                      {quote.quotationNumber}
                    </div>
                    <div className="text-[11px] text-emerald-200 mt-1">Date: {quote.createdDate}</div>
                    <div className="text-[11px] text-emerald-200">Valid: {quote.validUntilDate}</div>
                    <div className="mt-2 inline-block">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        quote.status === 'Approved'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-sky-500 text-white'
                      }`}>
                        {quote.status === 'Approved' ? '✓ APPROVED' : quote.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Gold Border */}
              <div className="h-1 bg-amber-400 w-full" />

              <div className="p-6 space-y-6 text-xs">
                {/* Client & Project Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Client & Site Information
                    </span>
                    <div className="font-bold text-neutral-900 text-sm">{client.clientName}</div>
                    <div className="text-neutral-600">{client.clientType} · {client.phone}</div>
                    <div className="text-neutral-600">{client.email}</div>
                    <div className="text-neutral-600">{client.siteAddress}, {client.city}</div>
                  </div>

                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Project Scope & Lead
                    </span>
                    <div className="font-bold text-neutral-900 text-sm">{project.title} ({project.code})</div>
                    <div className="text-neutral-600">
                      Supervisor: {project.step4Planning.supervisorName || 'Senior Landscape Architect'}
                    </div>
                    <div className="text-neutral-600">
                      Dimensions: {project.step2SiteVisit?.measurements?.lawnAreaSqFt ? `${project.step2SiteVisit.measurements.lawnAreaSqFt.toLocaleString()} sq ft Lawn` : 'Plot Area Surveyed'} · {project.step2SiteVisit?.measurements?.soilType || 'Red Loam Soil'}
                    </div>
                    <div className="text-neutral-600">
                      Sunlight: {project.step2SiteVisit?.measurements?.sunlightExposure || 'Full Direct Sun'}
                    </div>
                  </div>
                </div>

                {/* =========================================================
                 * EXECUTIVE COST BREAKDOWN MATRIX
                 * ========================================================= */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">
                        Executive Cost Allocation Breakdown
                      </h4>
                    </div>
                    <span className="text-[11px] text-neutral-500">
                      High-level investment breakdown by category
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-emerald-900 font-semibold">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-emerald-700" />
                          Materials
                        </span>
                        <span>{Math.round((summary.materialsTotal / totalSub) * 100)}%</span>
                      </div>
                      <div className="text-base font-bold text-neutral-900 font-mono">
                        {formatCurrency(summary.materialsTotal, currency)}
                      </div>
                      <div className="text-[10px] text-neutral-500 line-clamp-1">Soil, sand & hardscape</div>
                    </div>

                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-emerald-900 font-semibold">
                        <span className="flex items-center gap-1">
                          <TreePine className="w-3.5 h-3.5 text-emerald-700" />
                          Flora & Sod
                        </span>
                        <span>{Math.round((floraTotal / totalSub) * 100)}%</span>
                      </div>
                      <div className="text-base font-bold text-neutral-900 font-mono">
                        {formatCurrency(floraTotal, currency)}
                      </div>
                      <div className="text-[10px] text-neutral-500 line-clamp-1">Trees, palms, shrubs & pots</div>
                    </div>

                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-emerald-900 font-semibold">
                        <span className="flex items-center gap-1">
                          <HardHat className="w-3.5 h-3.5 text-emerald-700" />
                          Labour & Trades
                        </span>
                        <span>{Math.round((summary.labourTotal / totalSub) * 100)}%</span>
                      </div>
                      <div className="text-base font-bold text-neutral-900 font-mono">
                        {formatCurrency(summary.labourTotal, currency)}
                      </div>
                      <div className="text-[10px] text-neutral-500 line-clamp-1">Artisans, masons & planting</div>
                    </div>

                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-emerald-900 font-semibold">
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-emerald-700" />
                          Logistics
                        </span>
                        <span>{Math.round((summary.transportTotal / totalSub) * 100)}%</span>
                      </div>
                      <div className="text-base font-bold text-neutral-900 font-mono">
                        {formatCurrency(summary.transportTotal, currency)}
                      </div>
                      <div className="text-[10px] text-neutral-500 line-clamp-1">Tipper freight & machinery</div>
                    </div>
                  </div>
                </div>

                {/* Itemized Bill of Quantities */}
                <div>
                  <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider mb-2">
                    Itemized Bill of Quantities (BOQ)
                  </h4>
                  <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-emerald-950 text-white font-bold">
                        <tr>
                          <th className="py-2.5 px-3 w-8 text-center">#</th>
                          <th className="py-2.5 px-3">Description & Technical Spec</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-right">Qty</th>
                          <th className="py-2.5 px-3 text-right">Rate ({currency})</th>
                          <th className="py-2.5 px-3 text-right">Total ({currency})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 bg-white">
                        {quote.items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="py-2 px-3 text-center text-neutral-400 font-mono text-[10px]">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <div className="font-semibold text-neutral-900">{item.name}</div>
                              {item.spec && <div className="text-[10px] text-neutral-500">{item.spec}</div>}
                            </td>
                            <td className="py-2 px-3 capitalize text-neutral-600 font-medium text-[10px]">{item.category}</td>
                            <td className="py-2 px-3 text-right tabular-nums">
                              {item.quantity} <span className="text-neutral-400 text-[10px]">{item.unit}</span>
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums font-mono">
                              {formatCurrency(item.unitPrice, currency)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-neutral-900 tabular-nums font-mono">
                              {formatCurrency(item.total, currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals & Milestones Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Milestones & Bank Details */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3">
                    <strong className="text-xs font-bold text-emerald-900 block">
                      Payment Milestones & Bank Wire:
                    </strong>
                    <div className="space-y-1.5 text-[11px] text-neutral-600">
                      <div>• <strong>50% Mobilization:</strong> {formatCurrency(summary.totalQuotation * 0.5, currency)} (Upon sign-off)</div>
                      <div>• <strong>40% Progress:</strong> {formatCurrency(summary.totalQuotation * 0.4, currency)} (Post civil/sod)</div>
                      <div>• <strong>10% Final Settlement:</strong> {formatCurrency(summary.totalQuotation * 0.1, currency)} (Upon handover)</div>
                    </div>

                    <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-[10px] text-emerald-950 space-y-0.5">
                      <div className="font-bold text-emerald-900">Wire Beneficiary: {branding.bankAccountName}</div>
                      <div>Bank: {branding.bankName} | A/C: {branding.bankAccountNumber}</div>
                      <div>IFSC: {branding.bankIfsc} {branding.bankUpiId && `· UPI: ${branding.bankUpiId}`}</div>
                    </div>
                  </div>

                  {/* Financial Totals */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-neutral-600">
                      <span>Materials & Soil Subtotal:</span>
                      <span className="font-semibold text-neutral-900 font-mono">{formatCurrency(summary.materialsTotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Flora, Trees & Lawn Turf:</span>
                      <span className="font-semibold text-neutral-900 font-mono">{formatCurrency(floraTotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Labour & Artisan Trades:</span>
                      <span className="font-semibold text-neutral-900 font-mono">{formatCurrency(summary.labourTotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Freight & Site Machinery:</span>
                      <span className="font-semibold text-neutral-900 font-mono">{formatCurrency(summary.transportTotal, currency)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-neutral-900 pt-1 border-t border-neutral-200">
                      <span>Gross Direct Cost:</span>
                      <span className="font-mono">{formatCurrency(summary.subtotal, currency)}</span>
                    </div>
                    {summary.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Goodwill Discount:</span>
                        <span className="font-mono">-{formatCurrency(summary.discountAmount, currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-neutral-600">
                      <span>Tax / GST ({quote.taxPercent}%):</span>
                      <span className="font-mono">+{formatCurrency(summary.taxAmount, currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-white bg-emerald-900 p-2.5 rounded-lg mt-2">
                      <span>Grand Total:</span>
                      <span className="font-mono">{formatCurrency(summary.totalQuotation, currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Warranties & Legal Notes */}
                <div className="border-t border-neutral-200 pt-3 text-[10px] text-neutral-500 space-y-1">
                  <div className="font-bold text-neutral-700">Scope Warranties & Contractual Terms:</div>
                  <div>• 30-day replacement warranty on lawn turf sod survival; 90-day warranty on automated drip fittings.</div>
                  <div>• Quoted unit rates locked for 30 calendar days from issue date. Variations beyond agreed scope billed separately.</div>
                  <div>• Client provides uninterrupted water source (minimum 1.5 bar) and 230V electricity at site boundary.</div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-neutral-200">
                  <div>
                    <div className="border-b border-neutral-300 pb-7 text-center text-neutral-400 text-[11px]">
                      {quote.status === 'Approved' ? (
                        <span className="font-semibold text-emerald-800">
                          ✓ Digitally Authorized by {quote.approvedByName || client.clientName}
                        </span>
                      ) : (
                        'Sign & Affix Seal'
                      )}
                    </div>
                    <div className="text-center text-[10px] font-bold text-neutral-700 mt-1">
                      Customer Acceptance & Approval
                    </div>
                  </div>

                  <div>
                    <div className="border-b border-neutral-300 pb-7 text-center text-neutral-700 text-[11px] font-semibold">
                      {branding.companyName}
                    </div>
                    <div className="text-center text-[10px] font-bold text-neutral-700 mt-1">
                      Authorized Signatory & Seal
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
