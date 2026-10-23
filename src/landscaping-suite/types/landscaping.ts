export type ProjectStage = 
  | 'enquiry' 
  | 'site_visit' 
  | 'quotation' 
  | 'advance_planning' 
  | 'daily_operations' 
  | 'extra_work' 
  | 'settlement';

export type Currency = '₹' | '$' | '£' | '€' | 'AED';

export type EnquiryStatus =
  | 'New Enquiry'
  | 'Site Visit Scheduled'
  | 'Site Visit Completed'
  | 'Quotation Drafted'
  | 'Materials Revised'
  | 'Quotation Approved'
  | 'Enquiry Lost';

export interface MaterialChangeRecord {
  id: string;
  date: string;
  changedBy: string;
  description: string;
  previousQuotationTotal: number;
  newQuotationTotal: number;
}

export interface CustomerEnquiry {
  clientName: string;
  phone: string;
  email: string;
  clientType: 'Residential Villa' | 'Commercial Plaza' | 'Corporate Campus' | 'Rooftop Terrace' | 'Farmhouse' | 'Resort';
  siteAddress: string;
  city: string;
  landmark: string;
  pincode: string;
  enquiryDate: string;
  targetStartDate: string;
  estimatedBudget: number;
  enquiryStatus: EnquiryStatus;
  revisionCount: number;
  materialChangeHistory?: MaterialChangeRecord[];
  projectRequirements: string[];
  notes: string;
}

export interface SiteMeasurement {
  totalPlotAreaSqFt: number;
  lawnAreaSqFt: number;
  hardscapeAreaSqFt: number;
  plantingBedAreaSqFt: number;
  slopeGrading: 'Flat' | 'Gentle Slope' | 'Moderate Slope' | 'Steep Hillside' | 'Multi-tiered Terraces';
  soilType: 'Red Loam Soil' | 'Clayey Loam' | 'Sandy Loam' | 'Rocky / Gravelly' | 'Black Cotton Soil';
  sunlightExposure: 'Full Direct Sun (6+ hrs)' | 'Partial Shade / Dappled' | 'Dense Shade' | 'Morning Sun Only';
  waterSource: 'Deep Borewell' | 'Municipal Supply' | 'Water Tanker' | 'Rainwater Harvesting Pit';
  waterTdsPpm: number;
  siteAccessibility: 'Direct Truck Access' | 'Narrow Alley (< 8ft)' | 'Stairs & Freight Lift' | 'Manual Carry Only';
}

export interface SitePhoto {
  id: string;
  title: string;
  category: 'Site Boundary' | 'Soil Condition' | 'Slope & Topography' | 'Water Connection' | 'Obstacles';
  dateTaken: string;
  caption: string;
  aspectColor: string; // fallback stylized color palette
}

export interface SiteVisitAssessment {
  visitDate: string;
  assessedBy: string;
  distanceFromHubKm: number;
  ratePerKm: number;
  isFreeVisit: boolean;
  distanceChargeTotal: number;
  measurements: SiteMeasurement;
  photos: SitePhoto[];
  requiredMachinery: {
    name: string;
    estimatedHours: number;
    hourlyRate: number;
  }[];
  initialMaterialNotes: string;
}

export interface QuotationLineItem {
  id: string;
  category: 'materials' | 'plants' | 'pots' | 'labour' | 'transport';
  name: string;
  spec: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface QuotationData {
  quotationNumber: string;
  createdDate: string;
  validUntilDate: string;
  items: QuotationLineItem[];
  taxPercent: number;
  discountAmount: number;
  status: 'Draft' | 'Sent' | 'In Review' | 'Approved' | 'Rejected';
  approvedDate?: string;
  approvedByName?: string;
  approvalReferencePo?: string;
  clientNotes: string;
  termsConditions: string[];
}

export interface MaterialProcurementItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  source: 'Nursery Stock' | 'External Vendor Purchase';
  estimatedCost: number;
  status: 'Allocated' | 'Ordered' | 'Delivered' | 'Pending';
  supplierNotes?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  startDate: string;
  targetEndDate: string;
  progressPercent: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delayed';
  phase?: string;
  assignee?: string;
  notes?: string;
  isDeadline?: boolean;
}

export interface AdvancePlanningData {
  advanceRequiredPercent: number;
  advanceTargetAmount: number;
  advanceReceivedAmount: number;
  advancePaymentDate: string;
  paymentMode: 'Bank Transfer' | 'UPI / QR' | 'Cheque' | 'Cash' | 'Card';
  transactionReference: string;
  advanceReceiptNumber: string;
  isAdvanceReceived: boolean;
  
  supervisorName: string;
  supervisorPhone: string;
  supervisorSalaryDailyRate: number;
  assignedEngineers: string[];
  
  procurementPlan: MaterialProcurementItem[];
  milestones: ProjectMilestone[];
}

export interface DailyWorkerLog {
  skilledWorkersCount: number;
  skilledDailyWageRate: number;
  unskilledWorkersCount: number;
  unskilledDailyWageRate: number;
  contractLabourTeamName: string;
  contractLabourAmount: number;
}

export interface DailyExpenseItem {
  id: string;
  category: 'Tea & Snacks' | 'Food & Meals' | 'Fuel & Diesel' | 'Local Tempo / Transport' | 'Consumables & Tools' | 'Miscellaneous';
  description: string;
  amount: number;
}

export interface DailyMaterialUsed {
  id: string;
  materialName: string;
  quantityUsed: number;
  unit: string;
  approxValue: number;
}

export interface DailyOperationLog {
  id: string;
  date: string;
  weather: 'Sunny & Clear' | 'Mild / Overcast' | 'Hot & Dry' | 'Intermittent Rain' | 'Heavy Rain';
  workers: DailyWorkerLog;
  supervisorSalaryAllocation: number;
  expenses: DailyExpenseItem[];
  materialsUsed: DailyMaterialUsed[];
  workSummary: string;
  completedTasks: string[];
  issuesOrDelays?: string;
}

export interface ExtraWorkItem {
  id: string;
  title: string;
  category: 'Hardscaping' | 'Planting & Flora' | 'Water Feature' | 'Irrigation Automation' | 'Lighting' | 'Other';
  description: string;
  requestedDate: string;
  quotedToClient: number;
  estimatedInternalCost: number;
  status: 'Requested' | 'Client Approved' | 'In Progress' | 'Completed' | 'Rejected';
  approvedDate?: string;
}

export interface PartPayment {
  id: string;
  milestoneTitle: string;
  date: string;
  amount: number;
  paymentMode: 'Bank Transfer' | 'UPI / QR' | 'Cheque' | 'Cash' | 'Card';
  referenceNo: string;
  receiptNumber: string;
  notes: string;
}

export interface CompletionSettlementData {
  isCompleted: boolean;
  completionDate?: string;
  handoverSignedBy?: string;
  warrantyPeriodMonths: number;
  warrantyTerms: string;
  finalSettlementPaymentReceived: number;
  settlementPaymentDate?: string;
  settlementPaymentMode?: string;
  settlementRef?: string;
  isFullySettled: boolean;
  workerSettlementCleared: boolean;
  vendorSettlementCleared: boolean;
  completionCertificateNumber: string;
  clientRating?: number;
  clientFeedback?: string;
}

export interface ProjectDocument {
  id: string;
  title: string;
  category: 'Site Plan' | 'Contract' | 'Site Photo' | 'Soil/Water Report' | 'Irrigation Scheme' | 'Invoice / Receipt' | 'Other';
  type: 'file' | 'link';
  fileName?: string;
  fileSize?: string;
  mimeType?: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
  phase?: 'Before' | 'During' | 'After';
  timestamp?: string;
  locationTag?: string;
}

export interface VendorQuoteItem {
  id: string;
  vendorName: string;
  contactPerson?: string;
  phone?: string;
  unitPrice: number;
  deliveryFreightCost: number;
  leadTimeDays: number;
  qualityRating: number; // 1 to 5
  minOrderQty?: number;
  notes?: string;
  isAwarded?: boolean;
}

export interface MaterialComparison {
  id: string;
  materialName: string;
  category: 'Plants & Trees' | 'Turf & Grass' | 'Soil & Manure' | 'Hardscape & Stone' | 'Pipes & Irrigation' | 'Pots & Planters' | 'Other';
  requiredQuantity: number;
  unit: string;
  budgetUnitPrice: number;
  quotes: VendorQuoteItem[];
  selectedQuoteId?: string;
  notes?: string;
}

export interface SiteNote {
  id: string;
  timestamp: string;
  authorName: string;
  role: 'Site Supervisor' | 'Landscape Architect' | 'Project Manager' | 'Quality Engineer';
  category: 'Daily Progress' | 'Material Delivery' | 'Labor & Crew' | 'Weather & Delays' | 'Budget & Expense Alert';
  content: string;
  costImpactAmount?: number;
  isBudgetExceededAlert?: boolean;
  alertSeverity?: 'info' | 'warning' | 'critical';
  resolved?: boolean;
  phase?: 'Before' | 'During' | 'After';
}

export interface SiteVisitAppointment {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:30 AM"
  type:
    | 'Initial Site Survey'
    | 'Soil & Slope Assessment'
    | 'Client Design Walkthrough'
    | 'Civil / Drainage Inspection'
    | 'Plant Material Inspection'
    | 'Final Handover Assessment';
  assignedTo: string;
  assignedRole: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Rescheduled';
  location: string;
  contactPerson: string;
  contactPhone: string;
  notes?: string;
  weatherForecast?: string;
  findingsSummary?: string;
}

export interface AiQuickQuoteInput {
  plotAreaSqFt: number;
  lawnAreaSqFt: number;
  hardscapeAreaSqFt: number;
  plantingBedAreaSqFt: number;
  landscapingStyle: string;
  qualityTier: 'Economy / Standard' | 'Premium Residential' | 'Luxury Architectural';
  includeIrrigation: boolean;
  includeLighting: boolean;
  includeWaterFeature: boolean;
  includePergola: boolean;
  soilCondition?: string;
  cityOrRegion?: string;
}

export interface SuggestedLineItem {
  id: string;
  category: 'materials' | 'plants' | 'pots' | 'labour' | 'transport';
  name: string;
  spec: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  rationale?: string;
}

export interface AiQuickQuoteResult {
  summary: string;
  suggestedItems: SuggestedLineItem[];
  materialCostSubtotal: number;
  laborCostSubtotal: number;
  transportAllowance: number;
  estimatedGrandTotal: number;
  suggestedTimelineDays: number;
  recommendedMarginPercent: number;
  keyDesignTips: string[];
  climateSuitability: string;
}

export interface LandscapingProject {
  id: string;
  code: string;
  title: string;
  currentStage: ProjectStage;
  completedStages: ProjectStage[];
  isConvertedToProject: boolean;
  convertedDate?: string;
  createdAt: string;
  updatedAt: string;
  currency: Currency;
  documents?: ProjectDocument[];
  siteNotes?: SiteNote[];
  vendorComparisons?: MaterialComparison[];
  siteVisitAppointments?: SiteVisitAppointment[];
  
  step1Enquiry: CustomerEnquiry;
  step2SiteVisit: SiteVisitAssessment;
  step3Quotation: QuotationData;
  step4Planning: AdvancePlanningData;
  step5DailyOperations: DailyOperationLog[];
  step6ExtraWork: {
    extraWorks: ExtraWorkItem[];
    partPayments: PartPayment[];
  };
  step7Settlement: CompletionSettlementData;
}

export type ResourceType = 'team_member' | 'heavy_equipment';

export interface CompanyResource {
  id: string;
  type: ResourceType;
  name: string;
  roleOrModel: string;
  category: string;
  phoneOrPlate?: string;
  dailyRate: number;
  status: 'active' | 'maintenance' | 'on_leave';
  avatarOrColor?: string;
  specsOrSkills?: string[];
  operatorRequired?: boolean;
}

export interface ResourceAssignment {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: ResourceType;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  clientName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  shift: 'Full Day' | 'Morning (8am - 1pm)' | 'Afternoon (1pm - 6pm)';
  taskRole: string;
  dailyCost: number;
  notes?: string;
  status: 'Confirmed' | 'Tentative' | 'Completed' | 'Conflict_Detected';
  assignedBy?: string;
}

export interface ResourceConflict {
  resourceId: string;
  resourceName: string;
  resourceType: ResourceType;
  conflictingDates: string[];
  assignments: ResourceAssignment[];
  severity: 'warning' | 'critical';
  reason: string;
}


