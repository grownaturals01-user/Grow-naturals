import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  LandscapingProject,
  ProjectStage,
  Currency,
  DailyOperationLog,
  ExtraWorkItem,
  PartPayment,
  QuotationData,
  ProjectDocument,
  SiteNote,
  MaterialComparison,
  VendorQuoteItem,
  SiteVisitAppointment,
  CompanyResource,
  ResourceAssignment,
  ResourceConflict,
  ResourceType,
} from '../types/landscaping';
import {
  INITIAL_LANDSCAPING_PROJECTS,
  INITIAL_COMPANY_RESOURCES,
  INITIAL_RESOURCE_ASSIGNMENTS,
  DEMO_LANDSCAPING_PROJECTS,
  DEMO_COMPANY_RESOURCES,
  DEMO_RESOURCE_ASSIGNMENTS,
} from '../data/mockLandscapingData';
import { calculateProjectFinancials } from '../utils/calculations';

interface ProjectContextType {
  projects: LandscapingProject[];
  activeProjectId: string | null;
  activeProject: LandscapingProject | null;
  currentView: 'dashboard' | 'enquiries' | 'project-detail' | 'daily-ledger' | 'pnl-matrix' | 'resource-allocation';
  selectedStep: ProjectStage;
  currency: Currency;
  searchQuery: string;
  stageFilter: string;
  setSearchQuery: (q: string) => void;
  setStageFilter: (stage: string) => void;
  setCurrency: (c: Currency) => void;
  setCurrentView: (view: 'dashboard' | 'enquiries' | 'project-detail' | 'daily-ledger' | 'pnl-matrix' | 'resource-allocation') => void;
  selectProject: (id: string, step?: ProjectStage) => void;
  setSelectedStep: (step: ProjectStage) => void;
  createNewProject: (projectData: Partial<LandscapingProject>) => string;
  updateProject: (project: LandscapingProject) => void;
  deleteProject: (id: string) => void;
  updateProjectStep: <K extends keyof LandscapingProject>(
    projectId: string,
    stepKey: K,
    stepData: LandscapingProject[K]
  ) => void;
  addDailyOperationLog: (projectId: string, log: Omit<DailyOperationLog, 'id'>) => void;
  updateDailyOperationLog: (projectId: string, logId: string, updatedLog: DailyOperationLog) => void;
  deleteDailyOperationLog: (projectId: string, logId: string) => void;
  addExtraWorkItem: (projectId: string, item: Omit<ExtraWorkItem, 'id'>) => void;
  updateExtraWorkStatus: (projectId: string, itemId: string, status: ExtraWorkItem['status']) => void;
  addPartPayment: (projectId: string, payment: Omit<PartPayment, 'id'>) => void;
  recordAdvancePayment: (
    projectId: string,
    payment: { amount: number; date: string; mode: any; reference: string; receiptNo: string }
  ) => void;
  recordFinalSettlement: (
    projectId: string,
    settlement: { amount: number; date: string; mode: string; ref: string; signedBy: string }
  ) => void;
  updateQuotationStatus: (
    projectId: string,
    status: QuotationData['status'],
    approvedBy?: string,
    poRef?: string
  ) => void;
  updateEnquiryStatus: (projectId: string, status: any) => void;
  recordMaterialChange: (
    projectId: string,
    changeDescription: string,
    updatedItems: any[],
    changedBy?: string
  ) => void;
  approveAndConvertToProject: (projectId: string, approvedByName?: string, poRef?: string) => void;
  addProjectDocument: (projectId: string, document: Omit<ProjectDocument, 'id' | 'uploadedAt'>) => void;
  deleteProjectDocument: (projectId: string, documentId: string) => void;
  updateProjectDocument: (projectId: string, documentId: string, updates: Partial<ProjectDocument>) => void;
  addSiteNote: (projectId: string, note: Omit<SiteNote, 'id' | 'timestamp'>) => void;
  deleteSiteNote: (projectId: string, noteId: string) => void;
  addMaterialComparison: (projectId: string, material: Omit<MaterialComparison, 'id'>) => void;
  deleteMaterialComparison: (projectId: string, materialId: string) => void;
  addVendorQuote: (projectId: string, materialId: string, quote: Omit<VendorQuoteItem, 'id'>) => void;
  awardVendorQuote: (projectId: string, materialId: string, quoteId: string) => void;
  addSiteVisitAppointment: (projectId: string, appt: Omit<SiteVisitAppointment, 'id'>) => void;
  updateSiteVisitAppointment: (projectId: string, apptId: string, updates: Partial<SiteVisitAppointment>) => void;
  deleteSiteVisitAppointment: (projectId: string, apptId: string) => void;
  applyAiQuickQuoteToProject: (projectId: string, items: any[], discountAmount?: number) => void;
  managerAlerts: Array<{ id: string; projectId: string; projectCode: string; projectTitle: string; message: string; severity: 'warning' | 'critical'; timestamp: string }>;
  dismissManagerAlert: (id: string) => void;
  resetToDemoData: () => void;
  clearAllData: () => void;
  seedDemoData: () => void;

  // Resource Allocation & Conflict Prevention
  companyResources: CompanyResource[];
  resourceAssignments: ResourceAssignment[];
  resourceConflicts: ResourceConflict[];
  addResourceAssignment: (assignment: Omit<ResourceAssignment, 'id'>, allowConflictOverride?: boolean) => { success: boolean; conflict?: ResourceConflict; assignmentId?: string };
  updateResourceAssignment: (id: string, updates: Partial<ResourceAssignment>, allowConflictOverride?: boolean) => { success: boolean; conflict?: ResourceConflict };
  deleteResourceAssignment: (id: string) => void;
  addCompanyResource: (resource: Omit<CompanyResource, 'id'>) => void;
  updateCompanyResource: (id: string, updates: Partial<CompanyResource>) => void;
  deleteCompanyResource: (id: string) => void;
  checkResourceConflicts: (resourceId: string, startDate: string, endDate: string, shift: string, currentAssignmentId?: string) => ResourceAssignment[];
  resolveConflictReassign: (assignmentId: string, newResourceId: string) => void;
  resolveConflictReschedule: (assignmentId: string, newStartDate: string, newEndDate: string) => void;
}

const STORAGE_KEY = 'terraflow_landscaping_projects_v2';
const CURRENCY_KEY = 'terraflow_currency_v2';

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<LandscapingProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_LANDSCAPING_PROJECTS;
  });

  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      localStorage.setItem(CURRENCY_KEY, '₹');
    } catch {}
    return '₹';
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return INITIAL_LANDSCAPING_PROJECTS[0]?.id || null;
  });

  const [currentView, setCurrentView] = useState<'dashboard' | 'enquiries' | 'project-detail' | 'daily-ledger' | 'pnl-matrix' | 'resource-allocation'>('dashboard');
  const [selectedStep, setSelectedStep] = useState<ProjectStage>('daily_operations');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  const [companyResources, setCompanyResources] = useState<CompanyResource[]>(() => {
    try {
      const saved = localStorage.getItem('terraflow_company_resources_v2');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_COMPANY_RESOURCES;
  });

  const [resourceAssignments, setResourceAssignments] = useState<ResourceAssignment[]>(() => {
    try {
      const saved = localStorage.getItem('terraflow_resource_assignments_v2');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_RESOURCE_ASSIGNMENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('terraflow_company_resources_v2', JSON.stringify(companyResources));
    } catch {}
  }, [companyResources]);

  useEffect(() => {
    try {
      localStorage.setItem('terraflow_resource_assignments_v2', JSON.stringify(resourceAssignments));
    } catch {}
  }, [resourceAssignments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }, [projects]);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(CURRENCY_KEY, c);
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || null;

  const selectProject = (id: string, step?: ProjectStage) => {
    const proj = projects.find(p => p.id === id);
    if (proj) {
      setActiveProjectId(id);
      if (step) {
        setSelectedStep(step);
      } else {
        setSelectedStep(proj.currentStage);
      }
      setCurrentView('project-detail');
    }
  };

  const updateProject = (updated: LandscapingProject) => {
    setProjects(prev => prev.map(p => (p.id === updated.id ? { ...updated, updatedAt: new Date().toISOString().split('T')[0] } : p)));
  };

  const createNewProject = (projectData: Partial<LandscapingProject>): string => {
    const newId = `proj-${Date.now().toString(36)}`;
    const randomCodeNum = Math.floor(100 + Math.random() * 900);
    const code = `LP-${new Date().getFullYear()}-${randomCodeNum}`;
    const today = new Date().toISOString().split('T')[0];

    const newProject: LandscapingProject = {
      id: newId,
      code,
      title: projectData.title || 'New Landscaping Project',
      currentStage: 'enquiry',
      completedStages: [],
      isConvertedToProject: false,
      createdAt: today,
      updatedAt: today,
      currency,
      step1Enquiry: projectData.step1Enquiry || {
        clientName: '',
        phone: '',
        email: '',
        clientType: 'Residential Villa',
        siteAddress: '',
        city: '',
        landmark: '',
        pincode: '',
        enquiryDate: today,
        targetStartDate: today,
        estimatedBudget: 300000,
        enquiryStatus: 'New Enquiry',
        revisionCount: 0,
        materialChangeHistory: [],
        projectRequirements: ['Lawn Turf', 'Planting Beds'],
        notes: '',
      },
      step2SiteVisit: projectData.step2SiteVisit || {
        visitDate: today,
        assessedBy: 'Senior Surveyor',
        distanceFromHubKm: 15,
        ratePerKm: 25,
        isFreeVisit: true,
        distanceChargeTotal: 0,
        measurements: {
          totalPlotAreaSqFt: 2000,
          lawnAreaSqFt: 1000,
          hardscapeAreaSqFt: 300,
          plantingBedAreaSqFt: 400,
          slopeGrading: 'Flat',
          soilType: 'Red Loam Soil',
          sunlightExposure: 'Full Direct Sun (6+ hrs)',
          waterSource: 'Municipal Supply',
          waterTdsPpm: 320,
          siteAccessibility: 'Direct Truck Access',
        },
        photos: [],
        requiredMachinery: [],
        initialMaterialNotes: '',
      },
      step3Quotation: projectData.step3Quotation || {
        quotationNumber: `TF-QUO-${new Date().getFullYear()}-${randomCodeNum}`,
        createdDate: today,
        validUntilDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
        items: [],
        taxPercent: 12,
        discountAmount: 0,
        status: 'Draft',
        clientNotes: '',
        termsConditions: [
          '50% mobilization advance upon quotation approval.',
          '40% upon completion of irrigation, planting and turf sod.',
          '10% upon final client handover and review.',
        ],
      },
      step4Planning: projectData.step4Planning || {
        advanceRequiredPercent: 50,
        advanceTargetAmount: 0,
        advanceReceivedAmount: 0,
        advancePaymentDate: '',
        paymentMode: 'Bank Transfer',
        transactionReference: '',
        advanceReceiptNumber: '',
        isAdvanceReceived: false,
        supervisorName: 'Raghavan K.',
        supervisorPhone: '+91 94441 55210',
        supervisorSalaryDailyRate: 1200,
        assignedEngineers: [],
        procurementPlan: [],
        milestones: [
          { id: `m-${Date.now()}-1`, title: 'Site Excavation & Debris Clearing', startDate: today, targetEndDate: today, progressPercent: 0, status: 'Pending' },
          { id: `m-${Date.now()}-2`, title: 'Soil Enrichment & Sub-base Compaction', startDate: today, targetEndDate: today, progressPercent: 0, status: 'Pending' },
          { id: `m-${Date.now()}-3`, title: 'Irrigation & Hardscaping', startDate: today, targetEndDate: today, progressPercent: 0, status: 'Pending' },
          { id: `m-${Date.now()}-4`, title: 'Planting & Lawn Turf Laying', startDate: today, targetEndDate: today, progressPercent: 0, status: 'Pending' },
        ],
      },
      step5DailyOperations: [],
      step6ExtraWork: {
        extraWorks: [],
        partPayments: [],
      },
      step7Settlement: {
        isCompleted: false,
        warrantyPeriodMonths: 3,
        warrantyTerms: '30 days lawn replacement warranty; 90 days drip emitter warranty.',
        finalSettlementPaymentReceived: 0,
        isFullySettled: false,
        workerSettlementCleared: false,
        vendorSettlementCleared: false,
        completionCertificateNumber: `CERT-${new Date().getFullYear()}-${randomCodeNum}`,
      },
    };

    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newId);
    setSelectedStep('enquiry');
    setCurrentView('project-detail');
    return newId;
  };

  const deleteProject = (id: string) => {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id);
      if (activeProjectId === id) {
        setActiveProjectId(next[0]?.id || null);
      }
      return next;
    });
  };

  const updateProjectStep = <K extends keyof LandscapingProject>(
    projectId: string,
    stepKey: K,
    stepData: LandscapingProject[K]
  ) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const updated = {
          ...p,
          [stepKey]: stepData,
          updatedAt: new Date().toISOString().split('T')[0],
        };
        return updated;
      })
    );
  };

  const addDailyOperationLog = (projectId: string, log: Omit<DailyOperationLog, 'id'>) => {
    const newLog: DailyOperationLog = {
      ...log,
      id: `log-${Date.now().toString(36)}`,
    };
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const logs = [newLog, ...(p.step5DailyOperations || [])];
        return {
          ...p,
          step5DailyOperations: logs,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const updateDailyOperationLog = (projectId: string, logId: string, updatedLog: DailyOperationLog) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const logs = (p.step5DailyOperations || []).map(l => (l.id === logId ? updatedLog : l));
        return {
          ...p,
          step5DailyOperations: logs,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const deleteDailyOperationLog = (projectId: string, logId: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          step5DailyOperations: (p.step5DailyOperations || []).filter(l => l.id !== logId),
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const addExtraWorkItem = (projectId: string, item: Omit<ExtraWorkItem, 'id'>) => {
    const newItem: ExtraWorkItem = {
      ...item,
      id: `ew-${Date.now().toString(36)}`,
    };
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const step6 = p.step6ExtraWork || { extraWorks: [], partPayments: [] };
        return {
          ...p,
          step6ExtraWork: {
            ...step6,
            extraWorks: [...step6.extraWorks, newItem],
          },
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const updateExtraWorkStatus = (projectId: string, itemId: string, status: ExtraWorkItem['status']) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const step6 = p.step6ExtraWork || { extraWorks: [], partPayments: [] };
        const updatedItems = step6.extraWorks.map(ew => {
          if (ew.id === itemId) {
            return {
              ...ew,
              status,
              approvedDate: status === 'Client Approved' ? new Date().toISOString().split('T')[0] : ew.approvedDate,
            };
          }
          return ew;
        });
        return {
          ...p,
          step6ExtraWork: {
            ...step6,
            extraWorks: updatedItems,
          },
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const addPartPayment = (projectId: string, payment: Omit<PartPayment, 'id'>) => {
    const newPayment: PartPayment = {
      ...payment,
      id: `pp-${Date.now().toString(36)}`,
    };
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const step6 = p.step6ExtraWork || { extraWorks: [], partPayments: [] };
        return {
          ...p,
          step6ExtraWork: {
            ...step6,
            partPayments: [...step6.partPayments, newPayment],
          },
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const recordAdvancePayment = (
    projectId: string,
    payment: { amount: number; date: string; mode: any; reference: string; receiptNo: string }
  ) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const step4 = p.step4Planning;
        return {
          ...p,
          step4Planning: {
            ...step4,
            advanceReceivedAmount: payment.amount,
            advancePaymentDate: payment.date,
            paymentMode: payment.mode,
            transactionReference: payment.reference,
            advanceReceiptNumber: payment.receiptNo,
            isAdvanceReceived: payment.amount > 0,
          },
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const recordFinalSettlement = (
    projectId: string,
    settlement: { amount: number; date: string; mode: string; ref: string; signedBy: string }
  ) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const step7 = p.step7Settlement;
        return {
          ...p,
          currentStage: 'settlement',
          completedStages: Array.from(new Set([...p.completedStages, 'settlement'])),
          step7Settlement: {
            ...step7,
            isCompleted: true,
            completionDate: settlement.date,
            handoverSignedBy: settlement.signedBy,
            finalSettlementPaymentReceived: settlement.amount,
            settlementPaymentDate: settlement.date,
            settlementPaymentMode: settlement.mode,
            settlementRef: settlement.ref,
            isFullySettled: true,
            workerSettlementCleared: true,
            vendorSettlementCleared: true,
          },
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const updateQuotationStatus = (
    projectId: string,
    status: QuotationData['status'],
    approvedBy?: string,
    poRef?: string
  ) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const step3 = p.step3Quotation;
        const isApproved = status === 'Approved';
        return {
          ...p,
          step3Quotation: {
            ...step3,
            status,
            approvedDate: isApproved ? new Date().toISOString().split('T')[0] : step3.approvedDate,
            approvedByName: approvedBy || step3.approvedByName,
            approvalReferencePo: poRef || step3.approvalReferencePo,
          },
          completedStages: isApproved
            ? Array.from(new Set([...p.completedStages, 'quotation']))
            : p.completedStages,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const updateEnquiryStatus = (projectId: string, status: any) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          step1Enquiry: {
            ...p.step1Enquiry,
            enquiryStatus: status,
          },
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const recordMaterialChange = (
    projectId: string,
    changeDescription: string,
    updatedItems: any[],
    changedBy: string = 'Landscape Architect'
  ) => {
    const today = new Date().toISOString().split('T')[0];
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;

        // Calculate previous and new totals
        const prevTotal = p.step3Quotation.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        const newTotal = updatedItems.reduce((sum, item) => sum + (Number(item.total) || (Number(item.quantity) * Number(item.unitPrice)) || 0), 0);

        const newRevisionRecord = {
          id: `rev-${Date.now()}`,
          date: today,
          changedBy,
          description: changeDescription,
          previousQuotationTotal: prevTotal,
          newQuotationTotal: newTotal,
        };

        const existingHistory = p.step1Enquiry.materialChangeHistory || [];
        const nextRevisionCount = (p.step1Enquiry.revisionCount || 0) + 1;

        return {
          ...p,
          currentStage: p.isConvertedToProject ? p.currentStage : 'quotation',
          step1Enquiry: {
            ...p.step1Enquiry,
            enquiryStatus: 'Materials Revised',
            revisionCount: nextRevisionCount,
            materialChangeHistory: [newRevisionRecord, ...existingHistory],
          },
          step3Quotation: {
            ...p.step3Quotation,
            items: updatedItems,
            status: p.step3Quotation.status === 'Approved' ? 'In Review' : p.step3Quotation.status,
          },
          updatedAt: today,
        };
      })
    );
  };

  const approveAndConvertToProject = (projectId: string, approvedByName?: string, poRef?: string) => {
    const today = new Date().toISOString().split('T')[0];
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const approver = approvedByName || p.step1Enquiry.clientName;
        const po = poRef || `PO-${today.replace(/-/g, '')}`;

        return {
          ...p,
          isConvertedToProject: true,
          convertedDate: today,
          currentStage: 'advance_planning',
          completedStages: Array.from(new Set([...p.completedStages, 'enquiry', 'quotation'])),
          step1Enquiry: {
            ...p.step1Enquiry,
            enquiryStatus: 'Quotation Approved',
          },
          step3Quotation: {
            ...p.step3Quotation,
            status: 'Approved',
            approvedDate: today,
            approvedByName: approver,
            approvalReferencePo: po,
          },
          updatedAt: today,
        };
      })
    );

    setActiveProjectId(projectId);
    setSelectedStep('advance_planning');
    setCurrentView('project-detail');
  };

  const addProjectDocument = (
    projectId: string,
    document: Omit<ProjectDocument, 'id' | 'uploadedAt'>
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const newDoc: ProjectDocument = {
      ...document,
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      uploadedAt: today,
    };

    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const existingDocs = p.documents || [];
        return {
          ...p,
          documents: [newDoc, ...existingDocs],
          updatedAt: today,
        };
      })
    );
  };

  const deleteProjectDocument = (projectId: string, documentId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          documents: (p.documents || []).filter(d => d.id !== documentId),
          updatedAt: today,
        };
      })
    );
  };

  const updateProjectDocument = (
    projectId: string,
    documentId: string,
    updates: Partial<ProjectDocument>
  ) => {
    const today = new Date().toISOString().split('T')[0];
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          documents: (p.documents || []).map(d => (d.id === documentId ? { ...d, ...updates } : d)),
          updatedAt: today,
        };
      })
    );
  };

  const [managerAlerts, setManagerAlerts] = useState<
    Array<{ id: string; projectId: string; projectCode: string; projectTitle: string; message: string; severity: 'warning' | 'critical'; timestamp: string }>
  >([]);

  const dismissManagerAlert = (id: string) => {
    setManagerAlerts(prev => prev.filter(a => a.id !== id));
  };

  const addSiteNote = (projectId: string, note: Omit<SiteNote, 'id' | 'timestamp'>) => {
    const newNote: SiteNote = {
      ...note,
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
    };

    setProjects(prev => {
      return prev.map(p => {
        if (p.id !== projectId) return p;
        const updatedNotes = [newNote, ...(p.siteNotes || [])];
        const fin = calculateProjectFinancials(p);
        
        const totalExp = fin.totalExpenses + (note.costImpactAmount || 0);
        const isOverBudget = fin.totalContractValue > 0 && totalExp > fin.totalContractValue;
        const isWarning = fin.totalContractValue > 0 && totalExp >= fin.totalContractValue * 0.85;

        if (note.isBudgetExceededAlert || isOverBudget || isWarning) {
          const alertId = `alert-${Date.now()}`;
          const severity: 'warning' | 'critical' = isOverBudget ? 'critical' : 'warning';
          const alertMsg = isOverBudget
            ? `Critical: Site expenses (${p.currency}${totalExp.toLocaleString('en-IN')}) exceed contract value (${p.currency}${fin.totalContractValue.toLocaleString('en-IN')})! Note: "${note.content.substring(0, 60)}..."`
            : `Warning: Expenses reached 85%+ threshold (${p.currency}${totalExp.toLocaleString('en-IN')})! Note: "${note.content.substring(0, 60)}..."`;
          
          setManagerAlerts(curr => [
            {
              id: alertId,
              projectId: p.id,
              projectCode: p.code,
              projectTitle: p.title,
              message: alertMsg,
              severity,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
            ...curr,
          ]);
        }

        return {
          ...p,
          siteNotes: updatedNotes,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      });
    });
  };

  const deleteSiteNote = (projectId: string, noteId: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          siteNotes: (p.siteNotes || []).filter(n => n.id !== noteId),
        };
      })
    );
  };

  const addMaterialComparison = (projectId: string, material: Omit<MaterialComparison, 'id'>) => {
    const newMaterial: MaterialComparison = {
      ...material,
      id: `mat-comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          vendorComparisons: [...(p.vendorComparisons || []), newMaterial],
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const deleteMaterialComparison = (projectId: string, materialId: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          vendorComparisons: (p.vendorComparisons || []).filter(m => m.id !== materialId),
        };
      })
    );
  };

  const addVendorQuote = (projectId: string, materialId: string, quote: Omit<VendorQuoteItem, 'id'>) => {
    const newQuote: VendorQuoteItem = {
      ...quote,
      id: `quote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          vendorComparisons: (p.vendorComparisons || []).map(m => {
            if (m.id !== materialId) return m;
            return {
              ...m,
              quotes: [...m.quotes, newQuote],
            };
          }),
        };
      })
    );
  };

  const awardVendorQuote = (projectId: string, materialId: string, quoteId: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          vendorComparisons: (p.vendorComparisons || []).map(m => {
            if (m.id !== materialId) return m;
            return {
              ...m,
              selectedQuoteId: quoteId,
              quotes: m.quotes.map(q => ({
                ...q,
                isAwarded: q.id === quoteId,
              })),
            };
          }),
        };
      })
    );
  };

  const addSiteVisitAppointment = (projectId: string, appt: Omit<SiteVisitAppointment, 'id'>) => {
    const newAppt: SiteVisitAppointment = {
      ...appt,
      id: `appt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          siteVisitAppointments: [...(p.siteVisitAppointments || []), newAppt],
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const updateSiteVisitAppointment = (projectId: string, apptId: string, updates: Partial<SiteVisitAppointment>) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          siteVisitAppointments: (p.siteVisitAppointments || []).map(a =>
            a.id === apptId ? { ...a, ...updates } : a
          ),
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const deleteSiteVisitAppointment = (projectId: string, apptId: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          siteVisitAppointments: (p.siteVisitAppointments || []).filter(a => a.id !== apptId),
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const applyAiQuickQuoteToProject = (projectId: string, items: any[], discountAmount: number = 0) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          step3Quotation: {
            ...p.step3Quotation,
            items: items.map(item => ({
              id: item.id || `item-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              category: item.category || 'materials',
              name: item.name,
              spec: item.spec || '',
              quantity: Number(item.quantity) || 1,
              unit: item.unit || 'sq.ft',
              unitPrice: Number(item.unitPrice) || 0,
              total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
            })),
            discountAmount: discountAmount || p.step3Quotation.discountAmount || 0,
          },
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  // =========================================================================
  // Resource Allocation & Conflict Prevention Engine
  // =========================================================================

  const resourceConflicts = useMemo(() => {
    const conflicts: ResourceConflict[] = [];
    const conflictMap = new Map<
      string,
      {
        resourceName: string;
        resourceType: ResourceType;
        assignments: ResourceAssignment[];
        dates: Set<string>;
      }
    >();

    for (let i = 0; i < resourceAssignments.length; i++) {
      for (let j = i + 1; j < resourceAssignments.length; j++) {
        const a = resourceAssignments[i];
        const b = resourceAssignments[j];
        if (a.resourceId === b.resourceId && a.projectId !== b.projectId) {
          // Date overlap check
          const hasDateOverlap = !(a.endDate < b.startDate || a.startDate > b.endDate);
          if (hasDateOverlap) {
            // Shift overlap check
            const shiftOverlap =
              a.shift === 'Full Day' ||
              b.shift === 'Full Day' ||
              a.shift === b.shift;

            if (shiftOverlap) {
              if (!conflictMap.has(a.resourceId)) {
                conflictMap.set(a.resourceId, {
                  resourceName: a.resourceName,
                  resourceType: a.resourceType,
                  assignments: [],
                  dates: new Set(),
                });
              }
              const entry = conflictMap.get(a.resourceId)!;
              entry.dates.add(a.startDate === b.startDate ? a.startDate : `${a.startDate} to ${a.endDate}`);
              entry.dates.add(b.startDate === b.startDate ? b.startDate : `${b.startDate} to ${b.endDate}`);
              if (!entry.assignments.some(x => x.id === a.id)) entry.assignments.push(a);
              if (!entry.assignments.some(x => x.id === b.id)) entry.assignments.push(b);
            }
          }
        }
      }
    }

    conflictMap.forEach((entry, resourceId) => {
      conflicts.push({
        resourceId,
        resourceName: entry.resourceName,
        resourceType: entry.resourceType,
        conflictingDates: Array.from(entry.dates),
        assignments: entry.assignments,
        severity: 'critical',
        reason: `${entry.resourceName} is double-booked across ${entry.assignments.map(a => a.projectCode).join(' and ')} on overlapping dates.`,
      });
    });

    return conflicts;
  }, [resourceAssignments]);

  const checkResourceConflicts = (
    resourceId: string,
    startDate: string,
    endDate: string,
    shift: string,
    currentAssignmentId?: string
  ): ResourceAssignment[] => {
    return resourceAssignments.filter(a => {
      if (a.id === currentAssignmentId) return false;
      if (a.resourceId !== resourceId) return false;
      const dateOverlap = !(endDate < a.startDate || startDate > a.endDate);
      if (!dateOverlap) return false;
      const shiftOverlap = shift === 'Full Day' || a.shift === 'Full Day' || shift === a.shift;
      return shiftOverlap;
    });
  };

  const addResourceAssignment = (
    assignment: Omit<ResourceAssignment, 'id'>,
    allowConflictOverride = false
  ) => {
    const conflicts = checkResourceConflicts(
      assignment.resourceId,
      assignment.startDate,
      assignment.endDate,
      assignment.shift
    );

    if (conflicts.length > 0 && !allowConflictOverride) {
      return {
        success: false,
        conflict: {
          resourceId: assignment.resourceId,
          resourceName: assignment.resourceName,
          resourceType: assignment.resourceType,
          conflictingDates: [assignment.startDate],
          assignments: conflicts,
          severity: 'critical' as const,
          reason: `${assignment.resourceName} is already assigned on ${conflicts.map(c => c.projectCode).join(', ')} for this schedule.`,
        },
      };
    }

    const newId = `asg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newAssignment: ResourceAssignment = {
      ...assignment,
      id: newId,
      status: conflicts.length > 0 ? 'Conflict_Detected' : 'Confirmed',
    };

    setResourceAssignments(prev => [newAssignment, ...prev]);
    return { success: true, assignmentId: newId };
  };

  const updateResourceAssignment = (
    id: string,
    updates: Partial<ResourceAssignment>,
    allowConflictOverride = false
  ) => {
    const existing = resourceAssignments.find(a => a.id === id);
    if (!existing) return { success: false };

    const resourceId = updates.resourceId || existing.resourceId;
    const startDate = updates.startDate || existing.startDate;
    const endDate = updates.endDate || existing.endDate;
    const shift = updates.shift || existing.shift;

    const conflicts = checkResourceConflicts(resourceId, startDate, endDate, shift, id);
    if (conflicts.length > 0 && !allowConflictOverride) {
      return {
        success: false,
        conflict: {
          resourceId,
          resourceName: updates.resourceName || existing.resourceName,
          resourceType: updates.resourceType || existing.resourceType,
          conflictingDates: [startDate],
          assignments: conflicts,
          severity: 'critical' as const,
          reason: `Schedule conflict with ${conflicts.map(c => c.projectCode).join(', ')}.`,
        },
      };
    }

    setResourceAssignments(prev =>
      prev.map(a =>
        a.id === id
          ? {
              ...a,
              ...updates,
              status: conflicts.length > 0 ? 'Conflict_Detected' : 'Confirmed',
            }
          : a
      )
    );
    return { success: true };
  };

  const deleteResourceAssignment = (id: string) => {
    setResourceAssignments(prev => prev.filter(a => a.id !== id));
  };

  const addCompanyResource = (resource: Omit<CompanyResource, 'id'>) => {
    const newId = `res-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setCompanyResources(prev => [...prev, { ...resource, id: newId }]);
  };

  const updateCompanyResource = (id: string, updates: Partial<CompanyResource>) => {
    setCompanyResources(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteCompanyResource = (id: string) => {
    setCompanyResources(prev => prev.filter(r => r.id !== id));
    setResourceAssignments(prev => prev.filter(a => a.resourceId !== id));
  };

  const resolveConflictReassign = (assignmentId: string, newResourceId: string) => {
    const newRes = companyResources.find(r => r.id === newResourceId);
    if (!newRes) return;
    setResourceAssignments(prev =>
      prev.map(a =>
        a.id === assignmentId
          ? {
              ...a,
              resourceId: newRes.id,
              resourceName: newRes.name,
              resourceType: newRes.type,
              dailyCost: newRes.dailyRate,
              status: 'Confirmed',
            }
          : a
      )
    );
  };

  const resolveConflictReschedule = (assignmentId: string, newStartDate: string, newEndDate: string) => {
    setResourceAssignments(prev =>
      prev.map(a =>
        a.id === assignmentId
          ? {
              ...a,
              startDate: newStartDate,
              endDate: newEndDate,
              status: 'Confirmed',
            }
          : a
      )
    );
  };

  const clearAllData = () => {
    setProjects([]);
    setCompanyResources([]);
    setResourceAssignments([]);
    setActiveProjectId(null);
    setSelectedStep('enquiry');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem('terraflow_company_resources_v2', JSON.stringify([]));
      localStorage.setItem('terraflow_resource_assignments_v2', JSON.stringify([]));
    } catch {}
  };

  const seedDemoData = () => {
    setProjects(DEMO_LANDSCAPING_PROJECTS);
    setCompanyResources(DEMO_COMPANY_RESOURCES);
    setResourceAssignments(DEMO_RESOURCE_ASSIGNMENTS);
    setActiveProjectId(DEMO_LANDSCAPING_PROJECTS[0]?.id || null);
    setSelectedStep('daily_operations');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_LANDSCAPING_PROJECTS));
      localStorage.setItem('terraflow_company_resources_v2', JSON.stringify(DEMO_COMPANY_RESOURCES));
      localStorage.setItem('terraflow_resource_assignments_v2', JSON.stringify(DEMO_RESOURCE_ASSIGNMENTS));
    } catch {}
  };

  const resetToDemoData = () => {
    seedDemoData();
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProjectId,
        activeProject,
        currentView,
        selectedStep,
        currency,
        searchQuery,
        stageFilter,
        setSearchQuery,
        setStageFilter,
        setCurrency,
        setCurrentView,
        selectProject,
        setSelectedStep,
        createNewProject,
        updateProject,
        deleteProject,
        updateProjectStep,
        addDailyOperationLog,
        updateDailyOperationLog,
        deleteDailyOperationLog,
        addExtraWorkItem,
        updateExtraWorkStatus,
        addPartPayment,
        recordAdvancePayment,
        recordFinalSettlement,
        updateQuotationStatus,
        updateEnquiryStatus,
        recordMaterialChange,
        approveAndConvertToProject,
        addProjectDocument,
        deleteProjectDocument,
        updateProjectDocument,
        addSiteNote,
        deleteSiteNote,
        addMaterialComparison,
        deleteMaterialComparison,
        addVendorQuote,
        awardVendorQuote,
        addSiteVisitAppointment,
        updateSiteVisitAppointment,
        deleteSiteVisitAppointment,
        applyAiQuickQuoteToProject,
        managerAlerts,
        dismissManagerAlert,
        resetToDemoData,
        clearAllData,
        seedDemoData,

        // Resource Allocation & Conflict Prevention
        companyResources,
        resourceAssignments,
        resourceConflicts,
        addResourceAssignment,
        updateResourceAssignment,
        deleteResourceAssignment,
        addCompanyResource,
        updateCompanyResource,
        deleteCompanyResource,
        checkResourceConflicts,
        resolveConflictReassign,
        resolveConflictReschedule,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProjects must be used within a ProjectProvider');
  return context;
};
