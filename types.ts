export enum ProjectStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  UNDER_REVIEW = 'Under Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
  COMPLETED = 'Completed',
}

export enum Role {
  USER = 'User',
  REVIEWER = 'Reviewer',
  ADMIN = 'Admin',
  PROCUREMENT = 'Procurement',
  CONTRACT_MANAGER = 'Contract Manager',
  SUPERVISOR = 'Supervisor',
  AUDITOR = 'Auditor',
  DIRECTOR = 'Director',
  COORDINATOR = 'Coordinator',
  TEAM_LEADER = 'Team Leader',
  ENGINEER = 'Engineer',
  FINANCE_OFFICER = 'Finance Officer',
  PLANNING_OFFICER = 'Planning Officer',
  ME_OFFICER = 'Monitoring & Evaluation Officer',
  PARTNER_MEMBER = 'NGO/Partner Member',
  VIEWER = 'Viewer',
}

export type DataScope = 
  | 'ALL'
  | 'ORGANIZATION'
  | 'TEAM'
  | 'ASSIGNED_PROJECTS'
  | 'ASSIGNED_CONTRACTS'
  | 'OWN_RECORDS'
  | 'PARTNER_ORGANIZATION';

export interface RoleDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  permissions: string[];
  defaultDataScope: DataScope;
  organizationScope?: string;
  isSystem?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  color?: string;
}

export enum UserStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  SUSPENDED = 'Suspended',
}

export enum NotificationType {
    INFO = 'info',
    ALERT = 'alert',
    SUCCESS = 'success',
    NEW_SUBMISSION = 'new_submission',
    APPROVAL_REQUIRED = 'approval_required',
    SYSTEM = 'system',
}

export enum DocumentCategory {
  FEASIBILITY_STUDY = 'Feasibility Study',
  EIA_REPORT = 'EIA Report',
  CONTRACT_AGREEMENT = 'Contract Agreement',
  TECHNICAL_DRAWING = 'Technical Drawing',
  PROGRESS_REPORT = 'Progress Report',
  PHOTO = 'Photo',
  OTHER = 'Other',
}

export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum InsightLevel {
    INFO = 'Info',
    WARNING = 'Warning',
    CRITICAL = 'Critical',
    SUCCESS = 'Success',
}

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO String
  user: string; // username
  action: string; // e.g., 'Created Project', 'Logged In'
  targetType?: string; // e.g., 'Project', 'User'
  targetId?: string; // e.g., project.id
  details?: string; // e.g., 'Set status to Approved'
}

export interface Document {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string; // Blob URL
  category: DocumentCategory;
  uploadedBy: string; // username
  uploadDate: string; // ISO string
}

export interface User {
  id: string;
  username: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role: Role;
  secondaryRoles?: (Role | string)[];
  customRoleIds?: string[];
  status?: UserStatus | 'Active' | 'Inactive' | 'Suspended';
  department?: string;
  organization?: string;
  partnerOrganization?: string;
  assignedTeam?: string;
  assignedZone?: string;
  assignedWoreda?: string;
  assignedProgram?: string; // e.g. 'All Programs (Bureau Level)' | 'ONE WASH' | 'COWASH' | 'UNICEF' | 'Second Urban' | 'BIOGAS' | 'Basket Fund' | 'Other Programs'
  assignedPrograms?: string[]; // Multiple programs authorized for cross-program users
  assignedNgoId?: string; // NGO organization ID if partner user
  assignedNgoName?: string; // NGO organization name
  staffProfileId?: string; // Linked staff profile ID
  assignedProjectIds?: string[];
  dataScopeOverride?: DataScope;
  avatar?: string;
  password?: string; // Should not be stored long-term
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  customPermissions?: string[];
}

export interface Notification {
  id: string;
  userId: string; // To whom the notification belongs
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: {
    moduleId: string;
    itemId?: string; // e.g., project.id
  };
  timestamp: string; // ISO string
}

export interface AIRiskAssessment {
  level: 'Low' | 'Medium' | 'High' | 'Unknown';
  keyRisks: string[];
  mitigationStrategies: string[];
}

export interface AIInsight {
  id: string;
  level: InsightLevel;
  title: string;
  description: string;
  recommendation: string;
  link?: {
    moduleId: string;
    itemId: string;
  };
}

export type ProjectPhaseType = 
  | 'Feasibility & EIA'
  | 'Procurement & Tendering'
  | 'Civil Works & Construction'
  | 'Electromechanical & Equipment'
  | 'Supervision & Quality Control'
  | 'Commissioning & Community Handover';

export interface ProjectPhaseCost {
  phase: ProjectPhaseType;
  description?: string;
  originalBudget: number;
  revisedBudget?: number;
  actualExpenditure: number;
  committedExpenditure?: number;
  variance: number;
  variancePercentage: number;
  status: 'Under Budget' | 'On Budget' | 'Over Budget' | 'At Risk' | 'Not Started';
  isOverBudget: boolean;
  notes?: string;
}

export interface Project {
  id: string;
  projectCode?: string; // Unique project code e.g. 'PRJ-ONE-2025-001'
  name: string;
  program?: string; // e.g. 'ONE WASH', 'COWASH', 'UNICEF', 'Second Urban', 'BIOGAS', 'Basket Fund', 'Other Programs'
  programId?: string; // Unique ID of the registered Program
  programComponent?: string; // e.g. 'Rural WaSH', 'Urban WaSH', 'Institutional WaSH', 'CMP Spring Protection'
  implementingNgoId?: string; // Assigned NGO ID
  implementingNgoName?: string; // Assigned NGO Name
  projectManager?: string; // Assigned Project Manager
  assignedStaffIds?: string[]; // Staff IDs assigned to this project
  assignedStaffNames?: string[]; // Staff names assigned to this project
  region: string;
  zone: string;
  woreda: string;
  kebele: string;
  gpsCoordinates: { lat: number; long: number };
  elevation: number;
  projectType: string;
  projectSubType: string;
  sourceOfWater?: string;
  energySource?: string;
  typeOfIntervention: string;
  populationCoverage: number;
  dailyDemandEstimate: number;
  storageRequirement: number;
  pipeLengthEstimation: number;
  implementingBody: string;
  washcoExists: boolean;
  washcoDetails?: string;
  landOwnershipCleared: boolean;
  landOwnershipComment?: string;
  powerSourceAvailable: boolean;
  skilledOperatorsAvailable: boolean;
  estimatedBudget: number;
  phaseCosts?: ProjectPhaseCost[];
  fundingSource: string;
  communityContribution: string;
  environmentalRiskLevel: 'Low' | 'Medium' | 'High';
  sourceReliability: string;
  conflictOverSource: boolean;
  feasibilityStudyConducted: boolean;
  feasibilityConsultant?: string;
  feasibilityStudyDate?: string;
  feasibilityWaterSourceReliability?: 'Reliable' | 'Moderate' | 'Seasonal';
  feasibilityTechnicalViability?: string;
  feasibilityEconomicFeasibility?: string;
  feasibilitySocialAcceptance?: string;
  feasibilityLandAcquisitionStatus?: boolean;
  feasibilityLandAcquisitionRemarks?: string;
  eiaConducted: boolean;
  eiaConsultant?: string;
  eiaApprovalAuthority?: string;
  eiaApprovalDate?: string;
  eiaRiskRating?: 'Low' | 'Medium' | 'High';
  eiaKeyRisks?: string;
  eiaMitigationMeasures?: string;
  eiaMonitoringPlanInPlace?: boolean;
  eiaCommunityConsultationHeld?: boolean;
  eiaCommunityConsultationSummary?: string;
  status: ProjectStatus;
  creator: string;
  plannedStartDate?: string;
  plannedCompletionDate?: string;
  actualStartDate?: string;
  actualCompletionDate?: string;
  reviewComments?: string;
  reviewedBy?: string;
  reviewDate?: string;
  reviewScore?: number;
  appraisalVerdict?: 'Approved' | 'Conditional' | 'Rejected' | 'Revision Requested';
  approvalCertificateNo?: string;
  revisionPoints?: string[];
  reviewChecklist?: {
    hydrologyPassed?: boolean;
    engineeringPassed?: boolean;
    eiaPassed?: boolean;
    washcoPassed?: boolean;
    costBenchmarkingPassed?: boolean;
  };
  summary?: string;
  aiRiskAssessment?: AIRiskAssessment;
  // Assignment & Access Control Fields
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  assignedSupervisorId?: string;
  assignedSupervisorName?: string;
  assignedTeamLeaderId?: string;
  assignedTeam?: string;
  assignedSupportingStaffIds?: string[];
  partnerOrganization?: string;
}

export interface WaterQualityTest {
  testDate: string;
  testedBy: string;
  laboratory: string;
  ph: number; // 6.5 - 8.5
  turbidityNTU: number; // < 5 NTU
  tdsMgL: number; // Total Dissolved Solids < 1000 mg/L
  residualChlorineMgL?: number; // 0.2 - 0.5 mg/L
  fluorideMgL?: number; // < 1.5 mg/L (Critical in Rift Valley)
  ecoliCFU: number; // 0 CFU / 100ml
  complianceStatus: 'Compliant' | 'Marginal' | 'Non-Compliant';
  notes?: string;
}

export interface QualityDefectItem {
  id: string;
  itemDescription: string;
  category: 'Civil Works' | 'Electromechanical' | 'Piping & Fittings' | 'Safety / Environmental' | 'Documentation';
  severity: 'Critical' | 'Major' | 'Minor';
  identifiedDate: string;
  targetRectificationDate: string;
  rectifiedDate?: string;
  status: 'Open' | 'Rectified' | 'Verified & Closed';
  responsibleParty: 'Contractor' | 'Consultant' | 'OWEB Team';
  remedialAction?: string;
}

export interface FieldInspectionLog {
  id: string;
  projectId: string;
  projectName: string;
  program?: string;
  zone: string;
  woreda: string;
  inspectionDate: string;
  inspectorName: string;
  inspectorRole: string;
  visitStage: 'Pre-Construction' | 'Excavation & Foundations' | 'Pipelaying & Pressure Test' | 'Electromechanical Installation' | 'Pre-Commissioning' | 'Final Handover & Defect Liability';
  overallPhysicalProgressPct: number;
  workmanshipRating: 'Exceptional' | 'Satisfactory' | 'Needs Improvement' | 'Unacceptable';
  siteCleanlinessAndSafety: 'Satisfactory' | 'Unsatisfactory';
  environmentalCompliance: 'Compliant' | 'Non-Compliant';
  waterQualityTest?: WaterQualityTest;
  defects: QualityDefectItem[];
  supervisorRemarks: string;
  recommendedActions: string;
  nextScheduledVisit?: string;
  signedOffBy: string;
  status: 'Draft' | 'Submitted' | 'Approved by Bureau Lead';
}

export interface EvaluationCommitteeMember {
  id: string;
  fullName: string;
  role: 'Chairperson' | 'Secretary' | 'Technical Evaluator' | 'Procurement Specialist' | 'Financial Analyst' | 'Legal Advisor' | 'Observer';
  departmentOrAgency: string;
  specialization?: string;
  phone?: string;
  email?: string;
  hasSignedDeclaration: boolean;
  declarationDate?: string;
  notes?: string;
}

export interface BidderPreliminaryCompliance {
  tradeLicenseValid: boolean;
  taxClearanceValid: boolean;
  vatRegistrationValid: boolean;
  ppaSupplierRegistrationValid: boolean;
  bidSecuritySubmitted: boolean;
  bidSecurityAmount?: number;
  bidSecurityValidityDate?: string;
  isEligibleAndResponsive: boolean;
  complianceRemarks?: string;
}

export interface BidderTechnicalScores {
  methodologyScore: number; // max 25
  keyPersonnelScore: number; // max 25
  equipmentAvailabilityScore: number; // max 20
  pastPerformanceScore: number; // max 20
  workScheduleScore: number; // max 10
  totalTechnicalScore: number; // calculated sum out of 100
  technicalPassStatus: 'Pass' | 'Fail';
  technicalEvaluatorComments?: string;
}

export interface Bidder {
  id: string;
  name: string;
  address: string;
  type: 'Individual' | 'JV' | 'Company';
  evaluationStatus: 'Evaluated' | 'Rejected';
  rejectionReason?: 'Non-Compliant Bid' | 'Late Submission' | 'Technical Non-Conformity' | 'Eligibility/Legal Disqualification';
  readoutPrice: number;
  correctedPrice: number;
  currency: 'ETB' | 'USD' | 'EURO';
  preliminaryCompliance?: BidderPreliminaryCompliance;
  technicalScores?: BidderTechnicalScores;
  financialScore?: number;
  combinedScore?: number;
  financialRank?: number;
  finalRank?: number;
  committeeVerdict?: string;
}

export interface ProcurementLot {
  id: string;
  lotNumber: number;
  lotTitle: string;
  scopeDescription: string;
  estimatedLotBudget: number;
  awardedBidderId?: string;
  awardedBidderName?: string;
  awardedAmount?: number;
  status: 'Open' | 'Evaluated' | 'Awarded' | 'Cancelled';
}

export interface BidSecurityItem {
  id: string;
  bidderId: string;
  bidderName: string;
  guaranteeType: 'Bank Guarantee / CPO' | 'Bid Bond' | 'Insurance Surety';
  issuingBankOrInstitution: string;
  guaranteeNumber: string;
  amountETB: number;
  issueDate: string;
  expiryDate: string;
  status: 'Active / Valid' | 'Expiring Soon' | 'Expired' | 'Released / Returned' | 'Forfeited';
  remarks?: string;
}

export interface ProcurementMilestone {
  id: string;
  stage: string;
  name: string;
  plannedDate: string;
  actualDate?: string;
  isDelayed?: boolean;
  delayDays?: number;
  status: 'Pending' | 'Completed' | 'Delayed';
}

export interface ProcurementAuditEntry {
  id: string;
  timestamp: string;
  performedBy: string;
  action: string;
  stageFrom?: string;
  stageTo?: string;
  details: string;
}

export type ProcurementStage = 
  | 'Preparation' 
  | 'Advertisement / Invitation' 
  | 'Bid Opening' 
  | 'Technical & Financial Evaluation' 
  | 'Notification of Award & Standstill' 
  | 'Contract Signing' 
  | 'Cancelled / Re-tendered';

export interface EvaluationCommittee {
  id: string;
  committeeName: string;
  appointmentRefNumber?: string;
  formationDate: string;
  members: EvaluationCommitteeMember[];
  evaluationStartDate?: string;
  evaluationCompletionDate?: string;
  evaluationVenue?: string;
  evaluationMethod: 'Least Cost Evaluated Responsive (LCEB)' | 'Quality & Cost Based Selection (QCBS)' | 'Quality Based Selection (QBS)' | 'Fixed Budget Selection';
  technicalWeightPercentage?: number;
  financialWeightPercentage?: number;
  minimumTechnicalQualifyingScore?: number;
  committeeRecommendationReport?: string;
  status: 'Committee Formed' | 'In Evaluation' | 'Recommendation Submitted' | 'Endorsed & Approved' | 'Rejected for Re-tender';
  endorsedBy?: string;
  endorsementDate?: string;
}

export interface Procurement {
  id: string;
  projectId: string;
  bidIssuedDate: string;
  tenderReferenceNumber?: string;
  procurementMethod?: 'International Competitive Bidding (ICB)' | 'National Competitive Bidding (NCB)' | 'Restricted Bidding' | 'Request for Quotations (RFQ)' | 'Direct Contracting' | string;
  draftDocumentsUrl?: string;
  procurementType: 'Goods' | 'Works' | 'Consulting Services' | 'Non-consulting Services';
  tenderStage?: ProcurementStage;
  publicationDate?: string;
  publicationMedia?: string;
  floatingPeriodDays?: number;
  bidOpeningDate?: string;
  bidOpeningVenue?: string;
  receivedBidsCount?: number;
  plannedOpeningDate?: string;
  plannedAwardDate?: string;
  plannedSigningDate?: string;
  contractSigningDate?: string;
  signedContractRef?: string;
  cancellationReason?: string;
  amendmentsAvailable?: boolean;
  amendmentDate?: string;
  amendedDocumentsUrl?: string;
  biddingPeriodStart: string;
  biddingPeriodEnd: string;
  submissionMinutesUrl?: string;
  lots?: ProcurementLot[];
  bidSecurities?: BidSecurityItem[];
  milestones?: ProcurementMilestone[];
  auditTrail?: ProcurementAuditEntry[];
  bidders: Bidder[];
  evaluationCommittee?: EvaluationCommittee;
  awardedBidderId?: string;
  awardDate?: string;
  awardNoticeRef?: string;
  standstillPeriod: boolean;
  standstillBidderId?: string;
  standstillStartDate?: string;
  standstillEndDate?: string;
  standstillNoticeUrl?: string;
  evaluationStatus?: 'Draft' | 'Preliminary Evaluation' | 'Technical Scoring' | 'Financial Evaluation' | 'Committee Recommendation' | 'Award Endorsed' | string;
  estimatedBudgetETB?: number;
  finalContractValueETB?: number;
  thresholdCompliant?: boolean;
  thresholdValidationNotes?: string;
  committeeReport?: string;
}

export interface KPI {
  id: string;
  description: string;
  unitOfMeasurement: string;
  periodStartDate: string;
  periodEndDate: string;
  target: string;
}

export interface Deliverable {
  id: string;
  name: string;
  priority: Priority;
  category: 'Supply of Goods' | 'Construction of Civil Works' | 'Electromechanical Works' | 'Other';
  plannedCompletionDate: string;
  actualCompletionDate?: string;
  linkedToPayments: boolean;
  linkedDocumentId?: string;
}

export interface Payment {
  deliverableId: string;
  plannedPaymentDate: string;
  amount: number;
  actualAmount?: number;
  actualPaymentDate?: string;
}

export interface Variation {
  id: string;
  date: string;
  description: string;
  type: 'Change of Amount' | 'Time Extension' | 'Scope Change' | 'Variation Order' | 'Other';
  status: 'Pending' | 'Approved' | 'Rejected';
  costImpact: number;
  timeImpactDays: number;
  documentUrl?: string;
}

export interface Claim {
  id:string;
  date: string;
  source: 'Client' | 'Contractor' | 'Consultant';
  description: string;
  amount: number;
  status: 'Submitted' | 'Under Review' | 'Settled' | 'Rejected';
  documentUrl?: string;
}

export interface Contract {
  id: string;
  projectId: string;
  procurementId: string;
  contractManager: string;
  cmPlanAssignmentDate: string;
  cmActualAssignmentDate: string;
  cmRemarks?: string;
  supervisor: string;
  supervisorPlanAssignmentDate: string;
  supervisorActualAssignmentDate: string;
  supervisorRemarks?: string;
  assignedEngineer?: string;
  assignedEngineerId?: string;
  assignedTeam?: string;
  contractorName?: string;
  performanceSecurityPlanDate: string;
  performanceSecurityActualDate: string;
  performanceSecurityExpiryDate: string;
  performanceBondAmount: number;
  performanceBondCurrency: 'ETB' | 'USD' | 'EURO';
  performanceGuaranteeUrl?: string;
  signingDate: string;
  signedContractUrl: string;
  // Commencement
  disputeBoardInPlace: boolean;
  commencementPlanDate: string;
  commencementActualDate: string;
  siteHandoverPlanDate: string;
  siteHandoverActualDate: string;
  siteHandoverDocsUrl?: string;
  seashConferencePlanDate: string;
  seashConferenceActualDate: string;
  seashConferenceRecordsUrl?: string;
  // Implementation
  kpis: KPI[];
  deliverables: Deliverable[];
  payments: Payment[];
  variations: Variation[];
  claims: Claim[];
  // Completion
  plannedCompletionDate: string;
  completionDate?: string;
  isPlanFinalized: boolean;
}

export interface ChatAction {
  type: 'navigate';
  moduleId: string;
  itemId?: string;
}

export interface Program {
  id: string;
  name: string; // 'ONE WASH', 'COWASH', 'UNICEF', 'Second Urban', 'BIOGAS', 'Basket Fund', 'Other Programs'
  code: string; // Unique program code e.g. 'ONE-WASH', 'COWASH', 'UNICEF', 'SUWSSP', 'BIOGAS', 'BASKET-FUND', 'OTHER-PROG'
  description: string;
  programManager: string;
  startDate: string;
  endDate: string;
  fundingSource: string;
  contactEmail: string;
  contactPhone: string;
  status: 'Active' | 'Inactive';
  focusArea?: string;
  budgetETB?: number;
  targetBeneficiaries?: number;
  components?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  deactivationReason?: string;
  deactivationDate?: string;
}

export interface NGO {
  id: string;
  name: string;
  code: string; // Unique organization code e.g. 'NGO-WAE', 'NGO-PLAN'
  registrationNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  operatingArea: string; // Zones or Woredas in Oromia
  assignedProgramIds: string[]; // Program IDs or codes
  assignedProgramNames?: string[]; // Program names e.g. ['ONE WASH', 'UNICEF']
  assignedProjectIds: string[];
  activeSchemesCount?: number;
  primaryProgram?: string;
  performanceRating?: number;
  annualBudget?: number;
  mouStatus?: string;
  status: 'Active' | 'Inactive';
  deactivationReason?: string;
  deactivationDate?: string;
  history?: {
    action: 'Registered' | 'Updated' | 'Activated' | 'Deactivated' | 'Assigned Program' | 'Assigned Project';
    date: string;
    performedBy: string;
    details: string;
  }[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  staffCode: string; // Unique employee code e.g. 'STF-001'
  fullName: string;
  jobTitle: string;
  department: string;
  dutyStation?: string;
  staffClassification?: string;
  phone: string;
  email: string;
  assignedProgramId: string; // Program ID or code
  assignedProgramName: string; // Program Name e.g. 'ONE WASH'
  assignedNgoId?: string; // Optional NGO ID if NGO partner staff
  assignedNgoName?: string;
  assignedProjectIds: string[];
  supervisorName: string;
  employmentStartDate: string;
  employmentEndDate?: string;
  status: 'Active' | 'Inactive';
  deactivationReason?: string;
  linkedUserId?: string; // Distinguish staff profile from system login account!
  transferHistory?: {
    fromProgram: string;
    toProgram: string;
    date: string;
    transferredBy: string;
    notes?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ProgramConfig {
  id: string;
  name: string; // e.g. 'ONE WASH (OWNP)', 'COWASH', 'Second Urban (UWSSP-II)', 'Borena Resilient Program', 'Regional Capital Budget', 'Emergency & Drought WaSH'
  code: string;
  leadAgency: string;
  focusArea: string;
  targetBeneficiaries?: number;
  totalBudgetETB?: number;
  color: string;
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
  description?: string;
  active: boolean;
}

export interface FundingSourceConfig {
  id: string;
  name: string;
  code: string;
  category: 'Regional Government' | 'Multilateral' | 'Bilateral' | 'NGO / Donor' | 'Community Contribution' | 'Other';
  description?: string;
  active: boolean;
}

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  isBase?: boolean;
  exchangeRateToETB: number;
}

export interface MasterDataPushLog {
  id: string;
  timestamp: string;
  pushedBy: string;
  version: string;
  modulesAffected: string[];
  changeSummary: string;
  totalItems: number;
}

export type MasterDataDomain = 
  | 'PROJECT' 
  | 'CONTRACT' 
  | 'PAYMENT' 
  | 'RISK' 
  | 'DOCUMENTS' 
  | 'ORGANIZATION' 
  | 'GEOGRAPHY' 
  | 'GENERAL' 
  | 'WORKFLOW' 
  | 'CONFIGURATION';

export interface MasterDataCategory {
  id: string;
  code: string;
  name: string;
  domain: MasterDataDomain;
  description?: string;
  parentCategoryCode?: string;
  isHierarchical?: boolean;
  isSystem?: boolean;
  displayOrder?: number;
  iconName?: string;
}

export interface MasterDataItem {
  id: string;
  categoryCode: string;
  code: string;
  name: string;
  description?: string;
  shortName?: string;
  parentId?: string;
  parentCode?: string;
  displayOrder: number;
  isActive: boolean;
  isDefault?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  metadata?: Record<string, any>;
  createdBy?: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt: string;
}

export interface SystemConfigurationItem {
  id: string;
  key: string;
  name: string;
  category: 'General' | 'Localization' | 'Files & Storage' | 'Thresholds & Limits' | 'Notifications' | 'Governance & Retention';
  value: string;
  defaultValue: string;
  dataType: 'string' | 'number' | 'boolean' | 'select' | 'json';
  options?: string[];
  description: string;
  isReadOnly?: boolean;
  requiresRestart?: boolean;
  updatedBy?: string;
  updatedAt: string;
}

export interface WorkflowDefinition {
  id: string;
  code: string;
  name: string;
  module: 'planning' | 'review' | 'procurement' | 'contract' | 'inspection' | 'documents';
  description: string;
  isActive: boolean;
  slaTotalDays?: number;
  version: string;
  updatedBy?: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  workflowCode: string;
  stepName: string;
  role: string;
  sequence: number;
  isRequired: boolean;
  approvalType: 'Single Sign-off' | 'Consensus' | 'Majority';
  slaDays: number;
  isActive: boolean;
  actionLabel?: string;
  escalationRole?: string;
}

export interface ApprovalThreshold {
  id: string;
  category: 'PAYMENT' | 'VARIATION' | 'CONTRACT' | 'PROJECT_BUDGET';
  title: string;
  amountFromETB: number;
  amountToETB: number;
  requiredRole: string;
  approvalSequence: number;
  mandatoryDocuments: string[];
  notes?: string;
  isActive: boolean;
  updatedBy?: string;
  updatedAt?: string;
}

export interface MasterDataHistoryEntry {
  id: string;
  entityType: 'CATEGORY' | 'ITEM' | 'CONFIG' | 'WORKFLOW' | 'THRESHOLD';
  entityCode: string;
  entityName: string;
  action: 'CREATED' | 'UPDATED' | 'ACTIVATED' | 'DEACTIVATED' | 'DELETED' | 'IMPORTED' | 'RESET';
  changedBy: string;
  timestamp: string;
  previousValue?: string;
  newValue?: string;
  changeSummary: string;
  reason?: string;
}

export interface MasterDataImportValidationRow {
  rowNumber: number;
  code: string;
  name: string;
  categoryCode: string;
  parentCode?: string;
  status: 'VALID' | 'WARNING' | 'ERROR';
  errorDetails?: string[];
  data: Partial<MasterDataItem>;
}

export interface Region {
  id: string;
  code: string;
  name: string;
  localName: string;
  description?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Woreda {
  id: string;
  code: string;
  name: string;
  localName: string;
  regionId: string;
  regionName?: string;
  description?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Kebele {
  id: string;
  code: string;
  name: string;
  localName: string;
  woredaId: string;
  woredaName?: string;
  regionId?: string;
  description?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface MasterDataImportResult {
  totalRecords: number;
  validCount: number;
  errorCount: number;
  duplicateCount: number;
  warningCount: number;
  rows: MasterDataImportValidationRow[];
}

export interface MasterData {
  version: string;
  lastPushedAt: string;
  lastPushedBy: string;
  lastUpdated?: string;
  changeNotes?: string;
  
  // Normalized Master Data Catalog
  catalogCategories?: MasterDataCategory[];
  catalogItems?: MasterDataItem[];
  
  // Organization Units (Region -> Woreda -> Kebele)
  regions?: Region[];
  woredas?: Woreda[];
  kebeles?: Kebele[];

  // Centralized System Configuration
  systemConfigurations?: SystemConfigurationItem[];
  
  // Configurable Workflow Rules
  workflowDefinitions?: WorkflowDefinition[];
  workflowSteps?: WorkflowStep[];
  
  // Configurable Business Approval Thresholds
  approvalThresholds?: ApprovalThreshold[];
  
  // Audit & Version History Log
  historyEntries?: MasterDataHistoryEntry[];

  // Programs Portfolio & Monitoring
  programs?: ProgramConfig[];

  // Geographic Hierarchy
  geographicHierarchy: Record<string, string[]>;
  
  // Project Classifications & Technical Parameters
  projectCategories: Record<string, string[]>;
  waterSources: string[];
  energySources: string[];
  interventionTypes: string[];
  sourceReliabilityRatings: string[];
  implementingBodies: string[];
  riskLevels: string[];
  
  // Financial & Partners
  fundingSources: FundingSourceConfig[];
  currencies: CurrencyConfig[];
  
  // Organizational Structure
  departments: string[];
  
  // Procurement & Tendering
  procurementTypes: string[];
  procurementMethods: string[];
  bidderTypes: string[];
  rejectionReasons: string[];
  
  // Contract Administration
  deliverableCategories: string[];
  amendmentTypes: string[];
  variationStatuses: string[];
  claimSources: string[];
  claimStatuses: string[];
  terminationReasons: string[];
  
  // Documents & System
  documentCategories: string[];
  priorityLevels: string[];
  
  // History
  pushLogs?: MasterDataPushLog[];
}

export interface WeeklyActivityPlan {
  id: string;
  activityName: string;
  woreda?: string;
  kebele?: string;
  unit: string;
  plannedQuantity: number;
  actualQuantity?: number;
  weightPct: number;
  assignedTo?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delayed';
}

export interface WeeklyWorkPlan {
  id: string;
  projectId: string;
  projectName: string;
  zone: string;
  woreda: string;
  kebele?: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  preparedByUserId: string;
  preparedByName: string;
  preparedDate: string;
  targetPhysicalProgressPct: number;
  plannedActivities: WeeklyActivityPlan[];
  resourcePlan: {
    manpowerCount: number;
    equipmentOnSite: string[];
    materialsRequired: string;
  };
  weatherForecastNotes?: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Revision Requested';
  approvedBy?: string;
  approvalDate?: string;
  approvalRemarks?: string;
}

export interface WeeklyProgressReport {
  id: string;
  projectId: string;
  projectName: string;
  weeklyPlanId?: string;
  weekNumber: number;
  reportDate: string;
  submittedByUserId: string;
  submittedByName: string;
  previousPhysicalProgressPct: number;
  thisWeekPhysicalProgressPct: number;
  cumulativePhysicalProgressPct: number;
  plannedProgressPct: number;
  progressVariancePct: number;
  status: 'Draft' | 'Submitted' | 'Endorsed' | 'Approved' | 'Rejected';
  endorsedByTeamLeader?: string;
  approvedBySupervisor?: string;
  approvalRemarks?: string;
  siteLaborCount: number;
  weatherConditions: 'Favorable' | 'Intermittent Rain' | 'Heavy Flooding' | 'High Temperature';
  keyAccomplishments: string[];
  challengesBottlenecks: string[];
  correctiveActions: string[];
  sitePhotosCount?: number;
}
