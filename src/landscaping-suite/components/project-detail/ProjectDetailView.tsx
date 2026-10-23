import React, { useState } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { StepperNav } from './StepperNav';
import { Step1Enquiry } from '../steps/Step1Enquiry';
import { Step2SiteVisit } from '../steps/Step2SiteVisit';
import { Step3Quotation } from '../steps/Step3Quotation';
import { Step4Planning } from '../steps/Step4Planning';
import { Step5DailyOperations } from '../steps/Step5DailyOperations';
import { Step6ExtraWorkPayments } from '../steps/Step6ExtraWorkPayments';
import { Step7CompletionSettlement } from '../steps/Step7CompletionSettlement';
import { PrintableQuotationModal } from '../modals/PrintableQuotationModal';
import { PrintableSettlementModal } from '../modals/PrintableSettlementModal';
import { ProjectDocumentsSection } from './ProjectDocumentsSection';
import { ProjectGanttTimeline } from './ProjectGanttTimeline';
import { VendorPriceComparison } from './VendorPriceComparison';
import { SiteNotesFeed } from './SiteNotesFeed';
import { ConstructionPhasePhotos } from './ConstructionPhasePhotos';
import { SiteVisitsCalendarView } from './SiteVisitsCalendarView';
import { ResourceAllocationView } from '../views/ResourceAllocationView';
import { AiQuickQuoteModal } from '../modals/AiQuickQuoteModal';
import { calculateProjectFinancials, formatCurrency } from '../../utils/calculations';
import { ProjectStage } from '../../types/landscaping';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  User,
  Trash2,
  Paperclip,
  Printer,
  Calendar,
  Sparkles,
  Download,
  Scale,
  MessageSquare,
  Camera,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Layers,
  ChevronDown,
  Truck,
  HardHat,
} from 'lucide-react';

const STAGES_LIST: ProjectStage[] = [
  'enquiry',
  'site_visit',
  'quotation',
  'advance_planning',
  'daily_operations',
  'extra_work',
  'settlement',
];

const STEP_GUIDANCE: Record<ProjectStage, { stepNum: number; title: string; hint: string }> = {
  enquiry: {
    stepNum: 1,
    title: 'Customer Enquiry & Requirements',
    hint: 'Enter your client details, plot address, and what they want (lawn, vertical garden, trees, irrigation).',
  },
  site_visit: {
    stepNum: 2,
    title: 'Site Visit & Area Measurements',
    hint: 'Record plot dimensions in sq ft, soil type, sunlight, water source, and initial site observations.',
  },
  quotation: {
    stepNum: 3,
    title: 'Itemized Quotation & Pricing',
    hint: 'Add materials, plants, grass, and labor. Set your margin, print the quote, and get client sign-off.',
  },
  advance_planning: {
    stepNum: 4,
    title: 'Advance Payment & Site Crew',
    hint: 'Confirm advance payment received from client, assign your site supervisor, and order plants & materials.',
  },
  daily_operations: {
    stepNum: 5,
    title: 'Daily Site Operations & Logs',
    hint: 'Record worker count, daily wages, tea/transport expenses, and what tasks were accomplished today.',
  },
  extra_work: {
    stepNum: 6,
    title: 'Extra Work Requests & Payments',
    hint: 'Track client variations, change requests, and part payments received during execution.',
  },
  settlement: {
    stepNum: 7,
    title: 'Completion & Final Settlement',
    hint: 'Verify work completion, collect the remaining balance, and generate the final handover certificate.',
  },
};

export const ProjectDetailView: React.FC = () => {
  const {
    activeProject,
    projects,
    selectProject,
    setCurrentView,
    selectedStep,
    setSelectedStep,
    deleteProject,
    currency,
    managerAlerts,
  } = useProjects();

  const [showPrintQuote, setShowPrintQuote] = useState(false);
  const [showPrintSettlement, setShowPrintSettlement] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showAiQuoteModal, setShowAiQuoteModal] = useState(false);
  const [viewMode, setViewMode] = useState<'steps' | 'calendar' | 'resources' | 'gantt' | 'vendor_quotes' | 'site_notes' | 'phase_photos' | 'docs'>('steps');

  if (!activeProject) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h3 className="text-base font-bold text-neutral-900">No Project Selected</h3>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 rounded-xl"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  const fin = calculateProjectFinancials(activeProject);
  const hasManagerAlert = managerAlerts.some(a => a.projectId === activeProject.id);
  const currentStepInfo = STEP_GUIDANCE[selectedStep] || STEP_GUIDANCE.enquiry;
  const currentStepIndex = STAGES_LIST.indexOf(selectedStep);

  const handleNextStep = () => {
    if (currentStepIndex < STAGES_LIST.length - 1) {
      setSelectedStep(STAGES_LIST[currentStepIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setSelectedStep(STAGES_LIST[currentStepIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/70 pb-20">
      {/* 1. Minimal Header & Quick Context */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Back link & Project title */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView(activeProject.isConvertedToProject ? 'dashboard' : 'enquiries')}
                  className="text-xs font-semibold text-neutral-500 hover:text-emerald-800 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Projects</span>
                </button>
                <span className="text-neutral-300">/</span>
                <span className="text-xs font-mono font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                  {activeProject.code}
                </span>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Step {currentStepInfo.stepNum} of 7
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
                {activeProject.title}
              </h1>

              <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-neutral-700">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{activeProject.step1Enquiry.clientName}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{activeProject.step1Enquiry.city || 'Bangalore'}</span>
                </span>
                <span>·</span>
                <span>Lead: {activeProject.step4Planning.supervisorName || 'Unassigned'}</span>
              </div>
            </div>

            {/* Quick Financial Summary & Print Buttons */}
            <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
              <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl px-3 py-2 text-xs flex items-center gap-3">
                <div>
                  <span className="text-[10px] text-neutral-400 block font-medium">Budget</span>
                  <span className="font-bold text-neutral-900 font-mono">
                    {formatCurrency(fin.totalContractValue, currency)}
                  </span>
                </div>
                <div className="h-6 w-px bg-neutral-200" />
                <div>
                  <span className="text-[10px] text-emerald-800 block font-medium">Paid</span>
                  <span className="font-bold text-emerald-800 font-mono">
                    {formatCurrency(fin.totalCollected, currency)} ({fin.collectionProgressPercent}%)
                  </span>
                </div>
                <div className="h-6 w-px bg-neutral-200" />
                <div>
                  <span className="text-[10px] text-neutral-400 block font-medium">Profit</span>
                  <span className={`font-bold font-mono ${fin.realizedProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                    {formatCurrency(fin.realizedProfit, currency)}
                  </span>
                </div>
              </div>

              {/* AI Quick Quote Generator */}
              <button
                onClick={() => setShowAiQuoteModal(true)}
                className="px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 rounded-xl shadow-2xs flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                title="Generate AI Quick Quote & Cost Estimation"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>AI Quick Quote</span>
              </button>

              {/* Export PDF Quotation */}
              <button
                onClick={() => setShowPrintQuote(true)}
                className="px-3 py-2 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
                title="Export Formatted PDF Quotation with Company Branding & Cost Breakdowns"
              >
                <Download className="w-3.5 h-3.5 text-emerald-800" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>

              {/* Print Quote Shortcut */}
              <button
                onClick={() => setShowPrintQuote(true)}
                className="px-3 py-2 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
                title="Print Quote Document"
              >
                <Printer className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden sm:inline">Print Quote</span>
              </button>

              {/* Delete Project */}
              <button
                onClick={() => {
                  if (confirm(`Delete project "${activeProject.title}"?`)) {
                    deleteProject(activeProject.id);
                    setCurrentView('dashboard');
                  }
                }}
                className="p-2 text-neutral-400 hover:text-rose-600 rounded-xl hover:bg-neutral-100 transition-colors"
                title="Delete Project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Simplified Module Navigation Bar */}
        <div className="border-t border-neutral-100 bg-neutral-50/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar text-xs font-semibold">
            <button
              onClick={() => setViewMode('steps')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                viewMode === 'steps'
                  ? 'bg-emerald-800 text-white shadow-2xs font-bold'
                  : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Project Workflow (Steps 1-7)</span>
            </button>

            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                viewMode === 'calendar'
                  ? 'bg-emerald-800 text-white shadow-2xs font-bold'
                  : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Site Visits Calendar</span>
              {(activeProject.siteVisitAppointments?.length || 0) > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    viewMode === 'calendar'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {activeProject.siteVisitAppointments?.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setViewMode('resources')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                viewMode === 'resources'
                  ? 'bg-emerald-800 text-white shadow-2xs font-bold'
                  : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Member Allocation</span>
            </button>

            <button
              onClick={() => setViewMode('phase_photos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                viewMode === 'phase_photos'
                  ? 'bg-emerald-800 text-white shadow-2xs font-bold'
                  : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Site Photos & Camera</span>
            </button>

            <button
              onClick={() => setViewMode('site_notes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                viewMode === 'site_notes'
                  ? 'bg-emerald-800 text-white shadow-2xs font-bold'
                  : hasManagerAlert
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Daily Notes Feed</span>
              {hasManagerAlert && <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />}
            </button>

            <button
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                viewMode === 'gantt'
                  ? 'bg-emerald-800 text-white shadow-2xs font-bold'
                  : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timeline Schedule</span>
            </button>

            <button
              onClick={() => setViewMode('vendor_quotes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                viewMode === 'vendor_quotes'
                  ? 'bg-emerald-800 text-white shadow-2xs font-bold'
                  : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Vendor Price Quotes</span>
            </button>

            <button
              onClick={() => setViewMode('docs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                viewMode === 'docs'
                  ? 'bg-emerald-800 text-white shadow-2xs font-bold'
                  : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Files & Plans ({activeProject.documents?.length || 0})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Budget Alert (if any) */}
      {hasManagerAlert && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Budget Alert:</strong> Daily site expenses exceeded initial target threshold for this project.
              </span>
            </div>
            <button
              onClick={() => setViewMode('site_notes')}
              className="px-3 py-1 bg-rose-200 hover:bg-rose-300 font-bold text-rose-950 rounded-lg shrink-0"
            >
              View Notes →
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Body Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-5 space-y-5">
        {viewMode === 'calendar' ? (
          <SiteVisitsCalendarView project={activeProject} />
        ) : viewMode === 'resources' ? (
          <ResourceAllocationView initialProjectId={activeProject.id} />
        ) : viewMode === 'gantt' ? (
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs">
            <ProjectGanttTimeline project={activeProject} />
          </div>
        ) : viewMode === 'vendor_quotes' ? (
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs">
            <VendorPriceComparison project={activeProject} />
          </div>
        ) : viewMode === 'site_notes' ? (
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs">
            <SiteNotesFeed project={activeProject} />
          </div>
        ) : viewMode === 'phase_photos' ? (
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs">
            <ConstructionPhasePhotos project={activeProject} />
          </div>
        ) : viewMode === 'docs' ? (
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs">
            <ProjectDocumentsSection project={activeProject} />
          </div>
        ) : (
          /* WORKFLOW STEPS MODE */
          <div className="space-y-4">
            {/* Stepper Navigation */}
            <StepperNav
              currentStep={selectedStep}
              completedStages={activeProject.completedStages}
              onSelectStep={step => setSelectedStep(step)}
              project={activeProject}
            />

            {/* Beginner-Friendly "What to do in this step" Guidance Box */}
            <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-950 uppercase tracking-wider text-[11px]">
                    Step {currentStepInfo.stepNum}: {currentStepInfo.title}
                  </span>
                </div>
                <p className="text-neutral-600 mt-0.5 leading-relaxed">
                  {currentStepInfo.hint}
                </p>
              </div>
            </div>

            {/* Active Step Screen */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs">
              {selectedStep === 'enquiry' && <Step1Enquiry project={activeProject} />}
              {selectedStep === 'site_visit' && <Step2SiteVisit project={activeProject} />}
              {selectedStep === 'quotation' && (
                <Step3Quotation project={activeProject} onOpenPrintModal={() => setShowPrintQuote(true)} />
              )}
              {selectedStep === 'advance_planning' && <Step4Planning project={activeProject} />}
              {selectedStep === 'daily_operations' && <Step5DailyOperations project={activeProject} />}
              {selectedStep === 'extra_work' && <Step6ExtraWorkPayments project={activeProject} />}
              {selectedStep === 'settlement' && (
                <Step7CompletionSettlement
                  project={activeProject}
                  onOpenSettlementModal={() => setShowPrintSettlement(true)}
                />
              )}
            </div>

            {/* Bottom Next / Previous Step Guidance Bar */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  currentStepIndex === 0
                    ? 'text-neutral-300 cursor-not-allowed'
                    : 'text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 shadow-2xs'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={currentStepIndex === STAGES_LIST.length - 1}
                className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
                  currentStepIndex === STAGES_LIST.length - 1
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-emerald-800 hover:bg-emerald-900 text-white active:scale-[0.98]'
                }`}
              >
                <span>
                  {currentStepIndex === STAGES_LIST.length - 1 ? 'Project Completed' : 'Proceed to Next Step'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Print Overlays */}
      {showPrintQuote && (
        <PrintableQuotationModal project={activeProject} onClose={() => setShowPrintQuote(false)} />
      )}
      {showPrintSettlement && (
        <PrintableSettlementModal project={activeProject} onClose={() => setShowPrintSettlement(false)} />
      )}

      {/* AI Quick Quote Modal */}
      {showAiQuoteModal && (
        <AiQuickQuoteModal
          project={activeProject}
          isOpen={showAiQuoteModal}
          onClose={() => setShowAiQuoteModal(false)}
          onApplySuccess={() => {
            setSelectedStep('quotation');
            setViewMode('steps');
          }}
        />
      )}
    </div>
  );
};
