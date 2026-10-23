import React from 'react';
import { LandscapingProject } from '../../types/landscaping';
import { calculateProjectFinancials, formatCurrency } from '../../utils/calculations';
import { X, Printer, Sprout, Award, CheckCircle } from 'lucide-react';

interface PrintableSettlementModalProps {
  project: LandscapingProject;
  onClose: () => void;
}

export const PrintableSettlementModal: React.FC<PrintableSettlementModalProps> = ({
  project,
  onClose,
}) => {
  const fin = calculateProjectFinancials(project);
  const settlement = project.step7Settlement;
  const client = project.step1Enquiry;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full p-8 shadow-2xl my-8 text-neutral-900 border border-neutral-200">
        {/* Top Controls */}
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4 mb-6 no-print">
          <div className="text-xs text-neutral-500 font-medium">
            Project Completion & Handover Certificate · Print or Export PDF
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Paper */}
        <div className="space-y-6 text-xs border-4 border-double border-emerald-900 p-6 rounded-lg bg-white">
          {/* Header */}
          <div className="text-center space-y-1 border-b border-neutral-200 pb-4">
            <div className="w-12 h-12 rounded-full bg-emerald-800 text-white mx-auto flex items-center justify-center mb-2">
              <Award className="w-7 h-7 text-emerald-100" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-emerald-950 uppercase">
              Certificate of Project Handover & Financial Settlement
            </h1>
            <p className="text-xs text-neutral-500 font-mono">
              Certificate ID: {settlement.completionCertificateNumber} · Project: {project.code}
            </p>
          </div>

          {/* Attestation */}
          <div className="text-neutral-700 text-center leading-relaxed max-w-xl mx-auto">
            This formal certificate attests that all landscaping, hardscaping, turf laying, planting, and irrigation works for{' '}
            <strong className="text-neutral-900 font-bold">{project.title}</strong> located at{' '}
            <span className="font-medium text-neutral-900">{client.siteAddress}, {client.city}</span> have been completed in accordance with the contract specifications and satisfactorily handed over to{' '}
            <strong className="text-neutral-900 font-bold">{client.clientName}</strong>.
          </div>

          {/* Financial Reconciliation Summary */}
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 space-y-2">
            <span className="font-bold text-neutral-900 text-xs uppercase tracking-wider block border-b border-neutral-200 pb-1">
              Final Account Settlement & Collection Audit
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Total Contract Billed</span>
                <span className="font-bold text-neutral-900 tabular-nums font-mono text-sm">
                  {formatCurrency(fin.totalContractValue, project.currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Total Revenue Collected</span>
                <span className="font-bold text-emerald-800 tabular-nums font-mono text-sm">
                  {formatCurrency(fin.totalCollected, project.currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Actual Project Cost</span>
                <span className="font-bold text-neutral-900 tabular-nums font-mono text-sm">
                  {formatCurrency(fin.totalExpenses, project.currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Realized Net Profit</span>
                <span className="font-bold text-emerald-900 tabular-nums font-mono text-sm">
                  {formatCurrency(fin.realizedProfit, project.currency)} ({fin.realizedMarginPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Warranty Terms */}
          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-1">
            <span className="font-bold text-emerald-950 text-[11px] block flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Warranty Coverage: {settlement.warrantyPeriodMonths} Months Comprehensive</span>
            </span>
            <p className="text-[11px] text-emerald-900">
              {settlement.warrantyTerms || '30 days lawn turf replacement guarantee for bald patches; 90 days drip emitter warranty.'}
            </p>
          </div>

          {/* Compliance Checkmarks */}
          <div className="grid grid-cols-2 gap-4 text-[11px] text-neutral-600">
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <span>All daily wages & contractor dues disbursed in full.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <span>Nursery stock & vendor material accounts cleared.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <span>Irrigation pressure & controller programming verified.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <span>Site cleaned of all debris and handed over.</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 pt-8">
            <div className="text-center">
              <div className="border-b border-neutral-400 pb-6 font-semibold text-neutral-900">
                {settlement.handoverSignedBy || client.clientName}
              </div>
              <div className="text-[11px] font-bold text-neutral-700 mt-1">Client Signature & Acceptance</div>
              <div className="text-[10px] text-neutral-500">Date: {settlement.completionDate || new Date().toISOString().split('T')[0]}</div>
            </div>

            <div className="text-center">
              <div className="border-b border-neutral-400 pb-6 font-semibold text-neutral-900">
                TerraFlow Contracting Division
              </div>
              <div className="text-[11px] font-bold text-neutral-700 mt-1">Lead Landscape Architect</div>
              <div className="text-[10px] text-neutral-500">Supervisor: {project.step4Planning.supervisorName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
