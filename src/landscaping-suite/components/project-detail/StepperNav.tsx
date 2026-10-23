import React from 'react';
import { ProjectStage, LandscapingProject } from '../../types/landscaping';
import {
  Check,
  ClipboardList,
  MapPin,
  Calculator,
  CalendarCheck2,
  HardHat,
  Layers,
  Award,
  ChevronRight,
} from 'lucide-react';

interface StepperNavProps {
  currentStep: ProjectStage;
  completedStages: ProjectStage[];
  onSelectStep: (step: ProjectStage) => void;
  project: LandscapingProject;
}

interface StepItem {
  key: ProjectStage;
  number: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepItem[] = [
  { key: 'enquiry', number: '01', title: 'Customer Enquiry', subtitle: 'Lead & Scope', icon: ClipboardList },
  { key: 'site_visit', number: '02', title: 'Site Assessment', subtitle: 'Survey & Photos', icon: MapPin },
  { key: 'quotation', number: '03', title: 'Quotation & BoQ', subtitle: 'Pricing & Approval', icon: Calculator },
  { key: 'advance_planning', number: '04', title: 'Advance & Plan', subtitle: 'Procurement & Crew', icon: CalendarCheck2 },
  { key: 'daily_operations', number: '05', title: 'Daily Operations', subtitle: 'Site Logs & Wages', icon: HardHat },
  { key: 'extra_work', number: '06', title: 'Extra Work', subtitle: 'Variations & Parts', icon: Layers },
  { key: 'settlement', number: '07', title: 'Handover & Settled', subtitle: 'Final Settlement', icon: Award },
];

export const StepperNav: React.FC<StepperNavProps> = ({
  currentStep,
  completedStages,
  onSelectStep,
  project,
}) => {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="bg-white border-b border-neutral-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Stepper Track */}
        <div className="py-2.5 sm:py-3 overflow-x-auto no-scrollbar">
          <nav className="flex items-center min-w-max gap-1 sm:gap-2" aria-label="Project Execution Pipeline">
            {STEPS.map((step, idx) => {
              const isActive = currentStep === step.key;
              const isCompleted = completedStages.includes(step.key);
              const isCurrentStageOfProject = project.currentStage === step.key;
              const Icon = step.icon;

              return (
                <React.Fragment key={step.key}>
                  <button
                    type="button"
                    onClick={() => onSelectStep(step.key)}
                    className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all relative ${
                      isActive
                        ? 'bg-emerald-800 text-white shadow-xs font-semibold'
                        : isCompleted
                        ? 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200/80'
                        : isCurrentStageOfProject
                        ? 'bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-950 border border-emerald-300'
                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 border border-transparent'
                    }`}
                  >
                    {/* Step Number / Icon Badge */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold shrink-0 transition-transform group-hover:scale-105 ${
                        isActive
                          ? 'bg-emerald-900 text-white shadow-2xs'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCurrentStageOfProject
                          ? 'bg-emerald-700 text-white'
                          : 'bg-neutral-200/80 text-neutral-600'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.number}
                    </div>

                    {/* Step Title & Subtitle */}
                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 leading-tight">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-200' : 'text-neutral-400'}`} />
                        <span className="text-xs truncate">{step.title}</span>
                      </div>
                      <div
                        className={`text-[10px] leading-tight truncate mt-0.5 ${
                          isActive ? 'text-emerald-200/90' : 'text-neutral-400'
                        }`}
                      >
                        {step.subtitle}
                      </div>
                    </div>

                    {/* Active Bottom Indicator Pip */}
                    {isActive && (
                      <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-3 h-1 bg-emerald-800 rounded-t-full hidden sm:block" />
                    )}
                  </button>

                  {/* Divider Chevron */}
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-300 shrink-0 hidden sm:block" aria-hidden="true" />
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};
