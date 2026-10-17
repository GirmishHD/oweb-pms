import React, { useState, useMemo } from 'react';
import { 
  Project, 
  Procurement, 
  Bidder, 
  EvaluationCommittee, 
  ProcurementLot, 
  BidSecurityItem, 
  ProcurementStage,
  ProcurementAuditEntry,
  Contract,
  User
} from '../types';
import { 
  PROC_TYPES, 
  PROCUREMENT_METHODS, 
  DEFAULT_SAMPLE_COMMITTEE_MEMBERS,
  ZONES 
} from '../constants';
import { 
  formatCurrencyETB, 
  validateProcurementThreshold, 
  calculateLeadTimeDays, 
  getBidSecurityStatus 
} from '../utils/procurementThresholds';
import { CommitteeBuilder } from './procurement/CommitteeBuilder';
import { BidderEvaluationTable } from './procurement/BidderEvaluationTable';
import { CommitteeDossierModal } from './procurement/CommitteeDossierModal';
import { ProcurementStageStepper } from './procurement/ProcurementStageStepper';
import { ProcurementLotsManager } from './procurement/ProcurementLotsManager';
import { BidSecurityTracker } from './procurement/BidSecurityTracker';
import { ProcurementSummaryDashboard } from './procurement/ProcurementSummaryDashboard';
import { ProcurementDetailModal } from './procurement/ProcurementDetailModal';
import { StageProgressionModal } from './procurement/StageProgressionModal';
import { ConvertToContractModal } from './procurement/ConvertToContractModal';
import { ProcurementDocumentGeneratorModal } from './procurement/ProcurementDocumentGeneratorModal';
import { CpoReleaseModal } from './procurement/CpoReleaseModal';
import { ProcurementThresholdAdvisor } from './procurement/ProcurementThresholdAdvisor';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Layers, 
  ShieldCheck, 
  Users, 
  Award, 
  FileSignature, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Sparkles, 
  Building2, 
  ChevronRight, 
  RefreshCw, 
  Eye, 
  Trash2, 
  Coins, 
  FileSpreadsheet, 
  Check, 
  X, 
  AlertCircle,
  TrendingUp,
  Tag,
  Scale,
  FolderSync,
  Megaphone,
  RotateCcw,
  CheckCheck
} from 'lucide-react';

interface ProcurementModuleProps {
  projects: Project[];
  allProjects?: Project[];
  procurements: Procurement[];
  contracts?: Contract[];
  users?: User[];
  onAddProcurement: (procurement: Procurement) => void;
  onUpdateProcurement?: (procurement: Procurement) => void;
  onAddContract?: (contract: Contract) => void;
  onNavigate?: (module: string) => void;
  currentUser?: any;
}

export const ProcurementModule: React.FC<ProcurementModuleProps> = ({
  projects = [],
  allProjects,
  procurements = [],
  contracts = [],
  users = [],
  onAddProcurement,
  onUpdateProcurement,
  onAddContract,
  onNavigate,
  currentUser
}) => {
  // Navigation View State
  const [activeView, setActiveView] = useState<'packages' | 'create' | 'cpo_vault' | 'committees' | 'dashboard' | 'threshold_advisor'>('packages');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterZone, setFilterZone] = useState<string>('ALL');

  // CPO Vault Specific Filter
  const [cpoFilter, setCpoFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'RELEASED'>('ALL');

  // Modals State
  const [detailModalProcurement, setDetailModalProcurement] = useState<Procurement | null>(null);
  const [dossierModalProcurement, setDossierModalProcurement] = useState<Procurement | null>(null);
  const [convertModalProcurement, setConvertModalProcurement] = useState<Procurement | null>(null);
  const [stageModalProcurement, setStageModalProcurement] = useState<Procurement | null>(null);
  const [docModalProcurement, setDocModalProcurement] = useState<Procurement | null>(null);
  const [cpoReleaseSecurity, setCpoReleaseSecurity] = useState<BidSecurityItem | null>(null);
  const [activeCpoParentProcId, setActiveCpoParentProcId] = useState<string>('');

  // Toast feedback state
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 3500);
  };

  // Wizard Step State for "Create / Edit Procurement"
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [tenderRefNumber, setTenderRefNumber] = useState<string>('');
  const [procurementMethod, setProcurementMethod] = useState<string>('National Competitive Bidding (NCB)');
  const [procurementType, setProcurementType] = useState<'Goods' | 'Works' | 'Consulting Services' | 'Non-consulting Services'>('Works');
  const [tenderStage, setTenderStage] = useState<ProcurementStage>('Preparation');
  
  // Dates & Schedule
  const [bidIssuedDate, setBidIssuedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [publicationDate, setPublicationDate] = useState<string>('');
  const [biddingPeriodStart, setBiddingPeriodStart] = useState<string>('');
  const [biddingPeriodEnd, setBiddingPeriodEnd] = useState<string>('');
  const [bidOpeningDate, setBidOpeningDate] = useState<string>('');
  const [evaluationStatus, setEvaluationStatus] = useState<string>('Pending Technical Evaluation');
  
  // Multi-Lot State
  const [isMultiLot, setIsMultiLot] = useState<boolean>(false);
  const [lots, setLots] = useState<ProcurementLot[]>([]);

  // Bid Securities State
  const [bidSecurities, setBidSecurities] = useState<BidSecurityItem[]>([]);

  // BEC Committee State
  const [committee, setCommittee] = useState<EvaluationCommittee>({
    id: `BEC-${Date.now()}`,
    committeeName: 'OWEB Water Works Bid Evaluation Committee',
    appointmentRefNumber: `OWEB/BEC/${Math.floor(100 + Math.random() * 900)}/2025`,
    formationDate: new Date().toISOString().split('T')[0],
    members: DEFAULT_SAMPLE_COMMITTEE_MEMBERS.map(m => ({ ...m })),
    evaluationMethod: 'Least Cost Evaluated Responsive (LCEB)',
    minimumTechnicalQualifyingScore: 70,
    status: 'In Evaluation'
  });

  // Bidders State
  const [bidders, setBidders] = useState<Bidder[]>([]);

  // Award & Standstill State
  const [awardedBidderId, setAwardedBidderId] = useState<string>('');
  const [awardDate, setAwardDate] = useState<string>('');
  const [awardNoticeRef, setAwardNoticeRef] = useState<string>('');
  const [standstillPeriod, setStandstillPeriod] = useState<boolean>(true);
  const [standstillStartDate, setStandstillStartDate] = useState<string>('');
  const [standstillEndDate, setStandstillEndDate] = useState<string>('');
  const [committeeReport, setCommitteeReport] = useState<string>('');

  // Effective project pool (prefer approved projects for new procurement)
  const fullProjectsPool = allProjects && allProjects.length > 0 ? allProjects : projects;
  const availableApprovedProjects = useMemo(() => {
    const existingProcuredProjectIds = new Set(procurements.map(p => p.projectId));
    return fullProjectsPool.filter(p => !existingProcuredProjectIds.has(p.id));
  }, [fullProjectsPool, procurements]);

  const selectedProject = useMemo(() => {
    return fullProjectsPool.find(p => p.id === selectedProjectId);
  }, [fullProjectsPool, selectedProjectId]);

  const estimatedBudgetETB = useMemo(() => {
    return selectedProject?.estimatedBudget || 5000000;
  }, [selectedProject]);

  // Real-time Threshold Validation
  const thresholdValidation = useMemo(() => {
    return validateProcurementThreshold(procurementMethod, procurementType, estimatedBudgetETB);
  }, [procurementMethod, procurementType, estimatedBudgetETB]);

  // Handle Project Selection & Auto-populate Form Defaults
  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    if (!projId) return;

    const proj = fullProjectsPool.find(p => p.id === projId);
    if (proj) {
      const pBudget = proj.estimatedBudget || 5000000;
      const today = new Date().toISOString().split('T')[0];
      const flStart = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
      const flEnd = new Date(Date.now() + 33 * 86400000).toISOString().split('T')[0];

      setTenderRefNumber(`OWEB/NCB/W-${proj.id.split('-').slice(-2).join('-') || Math.floor(1000 + Math.random() * 9000)}`);
      setBidIssuedDate(today);
      setPublicationDate(today);
      setBiddingPeriodStart(flStart);
      setBiddingPeriodEnd(flEnd);
      setBidOpeningDate(flEnd);

      // Auto-configure recommended Ethiopian NCB method
      if (pBudget > 50000000) {
        setProcurementMethod('International Competitive Bidding (ICB)');
      } else if (pBudget <= 500000) {
        setProcurementMethod('Request for Quotations (RFQ)');
      } else {
        setProcurementMethod('National Competitive Bidding (NCB)');
      }

      // Populate default prospective bidders
      const defaultBidders: Bidder[] = [
        {
          id: `B-001-${Date.now().toString().slice(-4)}`,
          name: 'Oromia Water Works Construction Enterprise (OWWCE)',
          address: 'Kaliti, Finfinnee, Oromia',
          type: 'Company',
          evaluationStatus: 'Evaluated',
          readoutPrice: Math.round(pBudget * 0.98),
          correctedPrice: Math.round(pBudget * 0.97),
          currency: 'ETB',
          finalRank: 1,
          preliminaryCompliance: {
            tradeLicenseValid: true,
            taxClearanceValid: true,
            vatRegistrationValid: true,
            ppaSupplierRegistrationValid: true,
            bidSecuritySubmitted: true,
            bidSecurityAmount: Math.round(pBudget * 0.015),
            isEligibleAndResponsive: true
          },
          technicalScores: {
            methodologyScore: 28,
            keyPersonnelScore: 24,
            equipmentAvailabilityScore: 19,
            pastPerformanceScore: 9,
            workScheduleScore: 5,
            totalTechnicalScore: 85,
            technicalPassStatus: 'Pass'
          },
          financialRank: 1,
          committeeVerdict: 'Lowest Evaluated Responsive Bidder (Recommended for Award)'
        },
        {
          id: `B-002-${Date.now().toString().slice(-4)}`,
          name: 'Borena Hydro & Electromechanical Engineering JV',
          address: 'Adama, Oromia Special Zone',
          type: 'JV',
          evaluationStatus: 'Evaluated',
          readoutPrice: Math.round(pBudget * 1.04),
          correctedPrice: Math.round(pBudget * 1.04),
          currency: 'ETB',
          finalRank: 2,
          preliminaryCompliance: {
            tradeLicenseValid: true,
            taxClearanceValid: true,
            vatRegistrationValid: true,
            ppaSupplierRegistrationValid: true,
            bidSecuritySubmitted: true,
            bidSecurityAmount: Math.round(pBudget * 0.015),
            isEligibleAndResponsive: true
          },
          technicalScores: {
            methodologyScore: 25,
            keyPersonnelScore: 22,
            equipmentAvailabilityScore: 18,
            pastPerformanceScore: 8,
            workScheduleScore: 5,
            totalTechnicalScore: 78,
            technicalPassStatus: 'Pass'
          },
          financialRank: 2,
          committeeVerdict: 'Technically Responsive, Higher Readout Price'
        }
      ];

      setBidders(defaultBidders);

      // Auto-generate CPOs for sample bidders
      const defaultSecurities: BidSecurityItem[] = [
        {
          id: `CPO-001-${Date.now().toString().slice(-4)}`,
          bidderId: defaultBidders[0].id,
          bidderName: defaultBidders[0].name,
          guaranteeType: 'Bank Guarantee / CPO',
          issuingBankOrInstitution: 'Commercial Bank of Ethiopia (CBE)',
          guaranteeNumber: `CPO-CBE-${Math.floor(100000 + Math.random() * 900000)}/25`,
          amountETB: Math.round(pBudget * 0.015),
          issueDate: today,
          expiryDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
          status: 'Active / Valid',
          remarks: 'Verified by BEC during formal bid opening session.'
        },
        {
          id: `CPO-002-${Date.now().toString().slice(-4)}`,
          bidderId: defaultBidders[1].id,
          bidderName: defaultBidders[1].name,
          guaranteeType: 'Bank Guarantee / CPO',
          issuingBankOrInstitution: 'Cooperative Bank of Oromia (Coop)',
          guaranteeNumber: `CPO-COOP-${Math.floor(100000 + Math.random() * 900000)}/25`,
          amountETB: Math.round(pBudget * 0.015),
          issueDate: today,
          expiryDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
          status: 'Active / Valid',
          remarks: 'Verified by BEC during formal bid opening session.'
        }
      ];

      setBidSecurities(defaultSecurities);
    }
  };

  // Reset Create Form
  const handleResetForm = () => {
    setSelectedProjectId('');
    setTenderRefNumber('');
    setWizardStep(1);
    setLots([]);
    setIsMultiLot(false);
    setBidders([]);
    setBidSecurities([]);
    setAwardedBidderId('');
    setTenderStage('Preparation');
  };

  // Final Submit Handler for New Procurement Package
  const handleSaveProcurement = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProjectId) {
      alert('Please select a target approved water project first.');
      return;
    }

    const auditTrailEntry: ProcurementAuditEntry = {
      id: `AUDIT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: awardedBidderId ? 'Tender Awarded & Standstill Published' : 'Procurement Package Created',
      performedBy: currentUser?.username || 'Procurement Directorate Specialist',
      details: `Procurement package ${tenderRefNumber || 'OWEB/TND'} formulated under ${procurementMethod}. Stage: ${tenderStage}.`
    };

    const newProcurement: Procurement = {
      id: `PROC-${Date.now()}`,
      projectId: selectedProjectId,
      tenderReferenceNumber: tenderRefNumber || `OWEB/NCB/${selectedProjectId.slice(-6)}`,
      procurementType,
      procurementMethod,
      tenderStage,
      bidIssuedDate,
      publicationDate: publicationDate || bidIssuedDate,
      biddingPeriodStart: biddingPeriodStart || bidIssuedDate,
      biddingPeriodEnd: biddingPeriodEnd || bidIssuedDate,
      bidOpeningDate: bidOpeningDate || biddingPeriodEnd,
      evaluationStatus: evaluationStatus || 'Technical & Financial Evaluation Completed',
      estimatedBudgetETB,
      lots: isMultiLot ? lots : undefined,
      bidSecurities,
      bidders,
      amendmentsAvailable: false,
      evaluationCommittee: committee,
      awardedBidderId: awardedBidderId || undefined,
      awardDate: awardDate || (awardedBidderId ? new Date().toISOString().split('T')[0] : undefined),
      awardNoticeRef: awardNoticeRef || (awardedBidderId ? `OWEB/AWD-${tenderRefNumber || Date.now().toString().slice(-4)}` : undefined),
      standstillPeriod,
      standstillStartDate: standstillStartDate || (awardedBidderId ? new Date().toISOString().split('T')[0] : undefined),
      standstillEndDate: standstillEndDate || (awardedBidderId ? new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] : undefined),
      committeeReport: committeeReport || 'BEC evaluated all submitted tenders and verified legal and technical compliance in accordance with Ethiopian PPA rules.',
      auditTrail: [auditTrailEntry]
    };

    onAddProcurement(newProcurement);
    handleResetForm();
    setActiveView('packages');
    showToast(`Procurement package ${newProcurement.tenderReferenceNumber} created successfully.`);
  };

  // Convert to Contract Trigger
  const handleConvertToContract = (procurement: Procurement, project?: Project) => {
    setConvertModalProcurement(procurement);
  };

  // Update CPO in vault
  const handleUpdateCpoSecurity = (updatedSec: BidSecurityItem) => {
    if (!onUpdateProcurement) return;

    // Find which procurement has this security
    const parentProc = procurements.find(p => p.id === activeCpoParentProcId) ||
      procurements.find(p => p.bidSecurities?.some(s => s.id === updatedSec.id));

    if (parentProc) {
      const updatedSecurities = (parentProc.bidSecurities || []).map(s => s.id === updatedSec.id ? updatedSec : s);
      const auditEntry: ProcurementAuditEntry = {
        id: `AUDIT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: `CPO Guarantee Updated: ${updatedSec.guaranteeNumber}`,
        performedBy: currentUser?.username || 'Procurement Officer',
        details: `CPO ${updatedSec.guaranteeNumber} status updated to "${updatedSec.status}". ${updatedSec.remarks || ''}`
      };

      onUpdateProcurement({
        ...parentProc,
        bidSecurities: updatedSecurities,
        auditTrail: [...(parentProc.auditTrail || []), auditEntry]
      });

      showToast(`CPO Guarantee ${updatedSec.guaranteeNumber} updated.`);
    }
  };

  // Filtered Procurements Directory
  const filteredProcurements = useMemo(() => {
    return procurements.filter(p => {
      const proj = fullProjectsPool.find(pr => pr.id === p.projectId);
      const searchMatch = !searchTerm || 
        (p.tenderReferenceNumber && p.tenderReferenceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.id && p.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (proj && proj.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (proj && proj.zone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.procurementMethod && p.procurementMethod.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.bidders && p.bidders.some(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())));

      const methodMatch = filterMethod === 'ALL' || (p.procurementMethod && p.procurementMethod.includes(filterMethod));
      const stageMatch = filterStage === 'ALL' || (p.tenderStage && p.tenderStage === filterStage);
      const typeMatch = filterType === 'ALL' || p.procurementType === filterType;
      const zoneMatch = filterZone === 'ALL' || (proj && proj.zone === filterZone);

      return searchMatch && methodMatch && stageMatch && typeMatch && zoneMatch;
    });
  }, [procurements, fullProjectsPool, searchTerm, filterMethod, filterStage, filterType, filterZone]);

  // Aggregated CPO List & Metrics
  const allVaultCPOs = useMemo(() => {
    return procurements.flatMap(p => 
      (p.bidSecurities || []).map(sec => ({
        ...sec,
        parentProcurementId: p.id,
        tenderRef: p.tenderReferenceNumber || p.id,
        projectName: fullProjectsPool.find(pr => pr.id === p.projectId)?.name || p.projectId
      }))
    );
  }, [procurements, fullProjectsPool]);

  const filteredVaultCPOs = useMemo(() => {
    return allVaultCPOs.filter(sec => {
      const st = getBidSecurityStatus(sec.expiryDate);
      if (cpoFilter === 'ACTIVE') return sec.status === 'Active / Valid' || st.status === 'Active / Valid';
      if (cpoFilter === 'EXPIRING') return st.status === 'Expiring Soon';
      if (cpoFilter === 'EXPIRED') return st.status === 'Expired' || sec.status === 'Expired';
      if (cpoFilter === 'RELEASED') return sec.status === 'Released / Returned';
      return true;
    });
  }, [allVaultCPOs, cpoFilter]);

  const totalCpoValueETB = useMemo(() => {
    return allVaultCPOs.reduce((sum, s) => sum + (s.amountETB || 0), 0);
  }, [allVaultCPOs]);

  // Export Directory to CSV
  const handleExportCSV = () => {
    if (procurements.length === 0) {
      alert('No procurement packages to export.');
      return;
    }
    const headers = [
      'Tender Reference',
      'Target Project Name',
      'Zone',
      'Woreda',
      'Procurement Method',
      'Procurement Type',
      'Lifecycle Stage',
      'Estimated Budget (ETB)',
      'Awarded Contractor',
      'Award Price (ETB)',
      'Bids Count',
      'Publication Date',
      'Bid Opening Date'
    ];

    const rows = filteredProcurements.map(p => {
      const proj = fullProjectsPool.find(pr => pr.id === p.projectId);
      const winner = p.bidders?.find(b => b.id === p.awardedBidderId);
      return [
        `"${p.tenderReferenceNumber || p.id}"`,
        `"${proj?.name || p.projectId}"`,
        `"${proj?.zone || 'N/A'}"`,
        `"${proj?.woreda || 'N/A'}"`,
        `"${p.procurementMethod || 'NCB'}"`,
        `"${p.procurementType}"`,
        `"${p.tenderStage || 'In Evaluation'}"`,
        p.estimatedBudgetETB || proj?.estimatedBudget || 0,
        `"${winner?.name || 'Pending Award'}"`,
        winner?.correctedPrice || 0,
        p.bidders?.length || 0,
        `"${p.publicationDate || p.bidIssuedDate || 'N/A'}"`,
        `"${p.bidOpeningDate || 'N/A'}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OWEB_Procurement_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in relative text-slate-800">
      {/* Toast Notification Banner */}
      {toastFeedback && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center gap-2.5 text-xs font-bold animate-fade-in">
          <CheckCheck className="w-4 h-4 text-emerald-300" />
          <span>{toastFeedback}</span>
        </div>
      )}

      {/* OCEANIC BRAND HEADER & NAVIGATION TOOLBAR */}
      <div className="bg-gradient-to-r from-[#06203c] via-[#083359] to-[#041a30] text-white p-6 sm:p-7 rounded-3xl border border-cyan-900/60 shadow-xl shadow-cyan-950/20 relative overflow-hidden">
        {/* Subtle Water Shimmer Effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                OWEB Procurement Directorate &bull; PPA Compliant
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Procurement &amp; Tender Management
            </h1>
            <p className="text-sky-200/80 text-xs sm:text-sm mt-1 max-w-2xl">
              Manage end-to-end bidding lifecycles, BEC committee rosters, multi-lot packaging, bank guarantee CPO vaults, statutory threshold validations, and seamless transition to contracts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-300" />
              <span>Export Register</span>
            </button>

            <button
              onClick={() => {
                setActiveView('create');
                setWizardStep(1);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-cyan-500/30 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate Tender Package</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-cyan-900/60 overflow-x-auto relative z-10">
          {[
            { id: 'packages', label: `Tender Packages (${procurements.length})`, icon: <Briefcase className="w-4 h-4" /> },
            { id: 'dashboard', label: 'Summary & KPIs', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'threshold_advisor', label: 'Threshold Advisor', icon: <Scale className="w-4 h-4" /> },
            { id: 'cpo_vault', label: `CPO Guarantee Vault (${allVaultCPOs.length})`, icon: <ShieldCheck className="w-4 h-4" /> },
            { id: 'committees', label: 'BEC Rosters', icon: <Users className="w-4 h-4" /> },
            { id: 'create', label: 'Formulate Package', icon: <Plus className="w-4 h-4" /> }
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeView === view.id
                  ? 'bg-white text-slate-900 shadow-md font-extrabold'
                  : 'bg-white/10 text-sky-200 hover:bg-white/20 hover:text-white'
              }`}
            >
              {view.icon}
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: SUMMARY & KPIS */}
      {activeView === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          <ProcurementSummaryDashboard
            procurements={procurements}
            projects={fullProjectsPool}
            onFilterByStage={(st) => {
              setFilterStage(st);
              setActiveView('packages');
            }}
          />
        </div>
      )}

      {/* VIEW: THRESHOLD ADVISOR */}
      {activeView === 'threshold_advisor' && (
        <div className="space-y-6 animate-fade-in">
          <ProcurementThresholdAdvisor
            onApplyParameters={(method, type, budget) => {
              setProcurementMethod(method);
              setProcurementType(type);
              setActiveView('create');
              setWizardStep(1);
              showToast(`Applied ${method} parameters to new tender wizard.`);
            }}
          />
        </div>
      )}

      {/* VIEW 2: TENDER PACKAGES DIRECTORY */}
      {activeView === 'packages' && (
        <div className="space-y-5 animate-fade-in">
          {/* Quick Metrics Bar */}
          <ProcurementSummaryDashboard
            procurements={procurements}
            projects={fullProjectsPool}
          />

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by tender ref, project name, woreda, or contractor..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filters Group */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                >
                  <option value="ALL">All Methods</option>
                  <option value="NCB">NCB (National)</option>
                  <option value="ICB">ICB (International)</option>
                  <option value="RFQ">RFQ (Shopping)</option>
                  <option value="Direct">Direct Contracting</option>
                  <option value="QCBS">QCBS (Consultancy)</option>
                </select>

                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                >
                  <option value="ALL">All Lifecycle Stages</option>
                  <option value="Preparation">Preparation</option>
                  <option value="Advertisement / Invitation">Advertisement</option>
                  <option value="Bid Opening">Bid Opening</option>
                  <option value="Technical & Financial Evaluation">Evaluation</option>
                  <option value="Notification of Award & Standstill">Award &amp; Standstill</option>
                  <option value="Contract Signing">Contract Signing</option>
                  <option value="Cancelled / Re-tendered">Cancelled / Re-tendered</option>
                </select>

                <select
                  value={filterZone}
                  onChange={(e) => setFilterZone(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                >
                  <option value="ALL">All Oromia Zones</option>
                  {ZONES.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>

                {(searchTerm || filterMethod !== 'ALL' || filterStage !== 'ALL' || filterZone !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterMethod('ALL');
                      setFilterStage('ALL');
                      setFilterZone('ALL');
                    }}
                    className="p-2 text-slate-500 hover:text-cyan-800 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    title="Reset Filters"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Procurements Cards Grid */}
          {filteredProcurements.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-sky-100 p-8 shadow-2xs">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Procurement Packages Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {searchTerm || filterMethod !== 'ALL' || filterStage !== 'ALL'
                  ? 'No tender records match your active search and filter criteria.'
                  : 'Start by linking an approved water scheme project to launch a compliant tender package.'}
              </p>
              <button
                onClick={() => {
                  setActiveView('create');
                  setWizardStep(1);
                }}
                className="mt-4 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Initiate New Tender Package
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredProcurements.map((procurement) => {
                const targetProject = fullProjectsPool.find(p => p.id === procurement.projectId);
                const winner = procurement.bidders?.find(b => b.id === procurement.awardedBidderId);
                const stage = procurement.tenderStage || (winner ? 'Notification of Award & Standstill' : 'Technical & Financial Evaluation');
                const totalValue = procurement.estimatedBudgetETB || targetProject?.estimatedBudget || 0;
                const thresholdRes = validateProcurementThreshold(procurement.procurementMethod || 'NCB', procurement.procurementType, totalValue);
                const expiringCPOs = (procurement.bidSecurities || []).filter(s => getBidSecurityStatus(s.expiryDate).status !== 'Active / Valid').length;

                return (
                  <div
                    key={procurement.id}
                    className="bg-white rounded-3xl border border-sky-100 p-5 shadow-2xs hover:shadow-md hover:border-cyan-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Card Top Pill Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-50 border border-cyan-200 text-cyan-800">
                            {procurement.procurementMethod || 'NCB'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {procurement.procurementType}
                          </span>
                          {procurement.lots && procurement.lots.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {procurement.lots.length} Lots
                            </span>
                          )}
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          stage === 'Contract Signing' ? 'bg-emerald-100 text-emerald-800' :
                          stage === 'Notification of Award & Standstill' ? 'bg-amber-100 text-amber-800' :
                          stage === 'Technical & Financial Evaluation' ? 'bg-indigo-100 text-indigo-800' :
                          stage === 'Cancelled / Re-tendered' ? 'bg-rose-100 text-rose-800' :
                          'bg-cyan-100 text-cyan-900'
                        }`}>
                          {stage}
                        </span>
                      </div>

                      {/* Tender Title & Reference */}
                      <h4 className="text-base font-black text-slate-900 line-clamp-1">
                        {targetProject?.name || `Project: ${procurement.projectId}`}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Ref: {procurement.tenderReferenceNumber || procurement.id}
                        {targetProject && ` • ${targetProject.woreda}, ${targetProject.zone}`}
                      </p>

                      {/* Mini Stepper Progress */}
                      <div className="mt-3">
                        <ProcurementStageStepper 
                          currentStage={stage} 
                          procurement={procurement}
                          isInteractive={!!onUpdateProcurement}
                          onStageSelect={() => setStageModalProcurement(procurement)}
                        />
                      </div>

                      {/* Core Meta Grid */}
                      <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-sky-50/40 rounded-2xl border border-sky-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold block">Estimated Budget</span>
                          <span className="font-extrabold text-cyan-950 font-mono">{formatCurrencyETB(totalValue)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold block">Registered Bidders</span>
                          <span className="font-bold text-slate-800">{procurement.bidders?.length || 0} Firms ({procurement.bidSecurities?.length || 0} CPOs)</span>
                        </div>
                        {winner && (
                          <div className="col-span-2 pt-1.5 border-t border-sky-200/50 flex items-center justify-between">
                            <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                              <Award className="w-3 h-3 text-emerald-600" />
                              Winner: {winner.name}
                            </span>
                            <span className="font-mono text-emerald-950 font-extrabold">{formatCurrencyETB(winner.correctedPrice)}</span>
                          </div>
                        )}
                        {procurement.signedContractRef && (
                          <div className="col-span-2 pt-1 border-t border-sky-200/50 flex items-center justify-between text-[11px]">
                            <span className="text-teal-800 font-bold flex items-center gap-1">
                              <FileSignature className="w-3 h-3 text-teal-600" />
                              Contract Executed:
                            </span>
                            <span className="font-mono font-bold text-teal-950">{procurement.signedContractRef}</span>
                          </div>
                        )}
                      </div>

                      {/* Warnings / CPO Alerts */}
                      {expiringCPOs > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{expiringCPOs} CPO guarantees expiring soon or expired</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {/* Stage Progression Trigger */}
                        {onUpdateProcurement && (
                          <button
                            type="button"
                            onClick={() => setStageModalProcurement(procurement)}
                            className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Advance Lifecycle Stage"
                          >
                            <FolderSync className="w-3 h-3 text-sky-600" />
                            <span>Stage</span>
                          </button>
                        )}

                        {/* Official SBD Documents Trigger */}
                        <button
                          type="button"
                          onClick={() => setDocModalProcurement(procurement)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Generate Standard Procurement Notices & Letters"
                        >
                          <Megaphone className="w-3 h-3 text-cyan-600" />
                          <span>Notices</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDossierModalProcurement(procurement)}
                          className="text-cyan-700 hover:text-cyan-900 font-bold text-xs flex items-center gap-1 cursor-pointer px-1 py-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Dossier</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {winner && (
                          <button
                            type="button"
                            onClick={() => handleConvertToContract(procurement, targetProject)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                            title="Convert Awarded Tender into Formal Contract"
                          >
                            <FileSignature className="w-3.5 h-3.5" />
                            <span>Convert to Contract</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDetailModalProcurement(procurement)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-sky-100 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: CPO GUARANTEE VAULT */}
      {activeView === 'cpo_vault' && (
        <div className="space-y-4 animate-fade-in">
          {/* CPO Financial Header Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Guarantees Portfolio Held
              </span>
              <p className="text-xl font-black text-cyan-950 font-mono">
                {formatCurrencyETB(totalCpoValueETB)}
              </p>
              <span className="text-[11px] text-slate-500 block">
                Across {allVaultCPOs.length} registered bid security instruments
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                Expiring Within 15 Days
              </span>
              <p className="text-xl font-black text-amber-600 font-mono">
                {allVaultCPOs.filter(s => getBidSecurityStatus(s.expiryDate).status === 'Expiring Soon').length} CPOs
              </p>
              <span className="text-[11px] text-slate-500 block">
                Immediate validity extension required from issuing banks
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Released &amp; Returned
              </span>
              <p className="text-xl font-black text-emerald-600 font-mono">
                {allVaultCPOs.filter(s => s.status === 'Released / Returned').length} Securities
              </p>
              <span className="text-[11px] text-slate-500 block">
                Formally returned upon contract execution or tender closure
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-600" />
                  Regional Bid Securities &amp; CPO Guarantee Registry
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consolidated tracking of all bank guarantees, issue &amp; expiry timelines, and release clearance workflows across all water packages.
                </p>
              </div>

              {/* Sub-Filters */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
                {(['ALL', 'ACTIVE', 'EXPIRING', 'EXPIRED', 'RELEASED'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setCpoFilter(tab)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                      cpoFilter === tab ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Aggregated Table of all CPOs */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Guarantee Ref</th>
                    <th className="p-3">Bidder Firm</th>
                    <th className="p-3">Target Tender &amp; Scheme</th>
                    <th className="p-3">Issuing Bank</th>
                    <th className="p-3 text-right">Guarantee Amount (ETB)</th>
                    <th className="p-3 text-center">Expiry Date</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVaultCPOs.map((sec) => {
                    const st = getBidSecurityStatus(sec.expiryDate);
                    return (
                      <tr key={sec.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{sec.guaranteeNumber}</td>
                        <td className="p-3 font-bold text-slate-800">{sec.bidderName}</td>
                        <td className="p-3">
                          <span className="text-[11px] font-mono text-cyan-800 block font-bold">{sec.tenderRef}</span>
                          <span className="text-[10px] text-slate-500 line-clamp-1">{sec.projectName}</span>
                        </td>
                        <td className="p-3 text-slate-600">{sec.issuingBankOrInstitution}</td>
                        <td className="p-3 text-right font-mono font-black text-cyan-900">{formatCurrencyETB(sec.amountETB)}</td>
                        <td className="p-3 text-center font-mono">{sec.expiryDate || 'N/A'}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${st.colorClass}`}>
                            {sec.status || st.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {sec.status !== 'Released / Returned' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setCpoReleaseSecurity(sec);
                                setActiveCpoParentProcId(sec.parentProcurementId);
                              }}
                              className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Manage / Release
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold">Cleared</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredVaultCPOs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        No bid securities found under &quot;{cpoFilter}&quot; filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: BEC COMMITTEES */}
      {activeView === 'committees' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-2xs space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-600" />
                Bid Evaluation Committee (BEC) Rosters &amp; Mandates
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official register of appointed technical evaluators, legal advisors, and financial analysts constituted under OWEB directives.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {procurements.map(p => {
                const comm = p.evaluationCommittee;
                if (!comm) return null;
                const proj = fullProjectsPool.find(pr => pr.id === p.projectId);

                return (
                  <div key={p.id} className="bg-sky-50/40 p-4 rounded-2xl border border-sky-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-cyan-900">{comm.committeeName}</span>
                      <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full text-[10px] font-bold">
                        {comm.status || 'Active'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-mono">
                      Appointment Ref: {comm.appointmentRefNumber || 'OWEB/BEC/2025'} &bull; Target: {proj?.name || p.projectId}
                    </p>

                    <div className="space-y-1.5 pt-2 border-t border-sky-200/60">
                      {comm.members?.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-slate-100">
                          <div>
                            <span className="font-bold text-slate-800">{m.fullName}</span>
                            <span className="text-[10px] text-slate-400 block">{m.specialization}</span>
                          </div>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            {m.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: INTERACTIVE 6-STEP TENDER FORMULATION WIZARD */}
      {activeView === 'create' && (
        <div className="bg-white rounded-3xl border border-sky-100 p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in">
          {/* Wizard Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider">Tender Formulation Wizard</span>
              <h2 className="text-xl font-black text-slate-900">
                Step {wizardStep} of 6: {
                  wizardStep === 1 ? 'Project Linkage & Method Compliance' :
                  wizardStep === 2 ? 'Tender Floating & Schedule' :
                  wizardStep === 3 ? 'Multi-Lot Packaging Structure' :
                  wizardStep === 4 ? 'Bid Evaluation Committee (BEC)' :
                  wizardStep === 5 ? 'Bidder Submissions & CPO Vault' :
                  'Award Resolution & Standstill'
                }
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-3.5 py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Reset Wizard
              </button>
              <button
                type="button"
                onClick={() => setActiveView('packages')}
                className="px-3.5 py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Stepper Navigation Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { step: 1, label: '1. Project & Method' },
              { step: 2, label: '2. Bidding Schedule' },
              { step: 3, label: '3. Multi-Lots' },
              { step: 4, label: '4. BEC Panel' },
              { step: 5, label: '5. Bidders & CPOs' },
              { step: 6, label: '6. Award & Standstill' }
            ].map(item => (
              <button
                key={item.step}
                type="button"
                onClick={() => setWizardStep(item.step)}
                className={`py-2 px-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                  wizardStep === item.step
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : wizardStep > item.step
                    ? 'bg-sky-50 text-cyan-800 border border-sky-200'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* STEP 1: PROJECT LINKAGE & COMPLIANCE */}
          {wizardStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Approved Water Scheme Project <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => handleSelectProject(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    <option value="">-- Choose Approved Project --</option>
                    {availableApprovedProjects.map(proj => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name} ({proj.woreda}, {proj.zone}) — {formatCurrencyETB(proj.estimatedBudget || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tender Reference Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tenderRefNumber}
                    onChange={(e) => setTenderRefNumber(e.target.value)}
                    placeholder="e.g. OWEB/NCB/W-004/2026"
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Procurement Category</label>
                  <select
                    value={procurementType}
                    onChange={(e) => setProcurementType(e.target.value as any)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                  >
                    {PROC_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Procurement Method</label>
                  <select
                    value={procurementMethod}
                    onChange={(e) => setProcurementMethod(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                  >
                    {PROCUREMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-time Threshold Compliance Banner */}
              {selectedProjectId && (
                <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                  thresholdValidation.isValid
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/80 border-amber-200 text-amber-900'
                }`}>
                  {thresholdValidation.isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h5 className="font-extrabold uppercase tracking-wide">
                      Ethiopian PPA Threshold Assessment: {thresholdValidation.status}
                    </h5>
                    <p className="mt-0.5">{thresholdValidation.message}</p>
                    <p className="mt-1 font-mono text-[11px] text-slate-600">
                      Approved Scheme Budget: <strong>{formatCurrencyETB(estimatedBudgetETB)}</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: BIDDING SCHEDULE */}
          {wizardStep === 2 && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bid Notice Issued Date</label>
                  <input
                    type="date"
                    value={bidIssuedDate}
                    onChange={(e) => setBidIssuedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Newspaper Publication Date</label>
                  <input
                    type="date"
                    value={publicationDate}
                    onChange={(e) => setPublicationDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Floating Window Start</label>
                  <input
                    type="date"
                    value={biddingPeriodStart}
                    onChange={(e) => setBiddingPeriodStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bid Submission Closing</label>
                  <input
                    type="date"
                    value={biddingPeriodEnd}
                    onChange={(e) => setBiddingPeriodEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Public Bid Opening Session</label>
                  <input
                    type="date"
                    value={bidOpeningDate}
                    onChange={(e) => setBidOpeningDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Lifecycle Stage</label>
                  <select
                    value={tenderStage}
                    onChange={(e) => setTenderStage(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none"
                  >
                    <option value="Preparation">Preparation</option>
                    <option value="Advertisement / Invitation">Advertisement / Invitation</option>
                    <option value="Bid Opening">Bid Opening</option>
                    <option value="Technical & Financial Evaluation">Technical &amp; Financial Evaluation</option>
                    <option value="Notification of Award & Standstill">Notification of Award &amp; Standstill</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: MULTI-LOT PACKAGING */}
          {wizardStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between p-4 bg-sky-50/50 rounded-2xl border border-sky-100">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Multi-Lot Packaging Structure</h4>
                  <p className="text-[11px] text-slate-500">Divide scheme into separate packages (e.g. Lot 1: Civil Works, Lot 2: Electromechanical).</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMultiLot(!isMultiLot)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isMultiLot ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isMultiLot ? 'Multi-Lot Enabled' : 'Single Package'}
                </button>
              </div>

              {isMultiLot && (
                <ProcurementLotsManager
                  lots={lots}
                  onChange={setLots}
                  totalProjectBudget={estimatedBudgetETB}
                />
              )}
            </div>
          )}

          {/* STEP 4: BEC COMMITTEE PANEL */}
          {wizardStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <CommitteeBuilder
                committee={committee}
                onChange={setCommittee}
              />
            </div>
          )}

          {/* STEP 5: BIDDERS & CPO GUARANTEES */}
          {wizardStep === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h4 className="font-bold text-xs text-slate-900 mb-2">Registered Bidders &amp; Technical Scoring</h4>
                <BidderEvaluationTable
                  bidders={bidders}
                  onChange={setBidders}
                  projectBudget={estimatedBudgetETB}
                  minTechnicalScore={committee.minimumTechnicalQualifyingScore || 70}
                />
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-900 mb-2">Bid Securities / Bank Guarantee Vault (CPO)</h4>
                <BidSecurityTracker
                  bidSecurities={bidSecurities}
                  onChange={setBidSecurities}
                  bidders={bidders}
                  tenderEstimatedBudget={estimatedBudgetETB}
                />
              </div>
            </div>
          )}

          {/* STEP 6: AWARD RESOLUTION & STANDSTILL */}
          {wizardStep === 6 && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-700" />
                  Contractor Award Endorsement &amp; Standstill Window
                </h4>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select Awarded Contractor</label>
                    <select
                      value={awardedBidderId}
                      onChange={(e) => setAwardedBidderId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none"
                    >
                      <option value="">-- Pending Evaluation Recommendation --</option>
                      {bidders.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} — Evaluated Price: {formatCurrencyETB(b.correctedPrice)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Award Notice Reference</label>
                    <input
                      type="text"
                      value={awardNoticeRef}
                      onChange={(e) => setAwardNoticeRef(e.target.value)}
                      placeholder="e.g. OWEB/AWD/2026/012"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Standstill Start Date</label>
                    <input
                      type="date"
                      value={standstillStartDate}
                      onChange={(e) => setStandstillStartDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Standstill End Date (7 Working Days)</label>
                    <input
                      type="date"
                      value={standstillEndDate}
                      onChange={(e) => setStandstillEndDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Evaluation Committee Resolution Summary</label>
                  <textarea
                    rows={2}
                    value={committeeReport}
                    onChange={(e) => setCommitteeReport(e.target.value)}
                    placeholder="Summary of evaluation findings, qualification notes, and award justification..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={wizardStep === 1}
              onClick={() => setWizardStep(prev => Math.max(1, prev - 1))}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-30 cursor-pointer"
            >
              &larr; Previous Step
            </button>

            <div className="flex items-center gap-2">
              {wizardStep < 6 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(prev => Math.min(6, prev + 1))}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Proceed to Step {wizardStep + 1}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveProcurement}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-700/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finalize &amp; Launch Tender Package</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailModalProcurement && (
        <ProcurementDetailModal
          isOpen={!!detailModalProcurement}
          onClose={() => setDetailModalProcurement(null)}
          procurement={detailModalProcurement}
          project={fullProjectsPool.find(p => p.id === detailModalProcurement.projectId)}
          users={users}
          onConvertToContract={(proc, proj) => {
            setDetailModalProcurement(null);
            setConvertModalProcurement(proc);
          }}
          onAddContract={onAddContract}
          onUpdateProcurement={onUpdateProcurement}
          onNavigate={onNavigate}
          currentUser={currentUser}
        />
      )}

      {/* DOSSIER MODAL */}
      {dossierModalProcurement && (
        <CommitteeDossierModal
          isOpen={!!dossierModalProcurement}
          onClose={() => setDossierModalProcurement(null)}
          procurement={dossierModalProcurement}
          project={fullProjectsPool.find(p => p.id === dossierModalProcurement.projectId)}
        />
      )}

      {/* STAGE PROGRESSION MODAL */}
      {stageModalProcurement && onUpdateProcurement && (
        <StageProgressionModal
          isOpen={!!stageModalProcurement}
          onClose={() => setStageModalProcurement(null)}
          procurement={stageModalProcurement}
          project={fullProjectsPool.find(p => p.id === stageModalProcurement.projectId)}
          onUpdateProcurement={(updated) => {
            onUpdateProcurement(updated);
            showToast(`Stage updated to ${updated.tenderStage}`);
          }}
          currentUser={currentUser}
        />
      )}

      {/* SBD DOCUMENT GENERATOR MODAL */}
      {docModalProcurement && (
        <ProcurementDocumentGeneratorModal
          isOpen={!!docModalProcurement}
          onClose={() => setDocModalProcurement(null)}
          procurement={docModalProcurement}
          project={fullProjectsPool.find(p => p.id === docModalProcurement.projectId)}
        />
      )}

      {/* CONVERT TO CONTRACT MODAL */}
      {convertModalProcurement && (
        <ConvertToContractModal
          isOpen={!!convertModalProcurement}
          onClose={() => setConvertModalProcurement(null)}
          procurement={convertModalProcurement}
          project={fullProjectsPool.find(p => p.id === convertModalProcurement.projectId)}
          users={users}
          onAddContract={onAddContract}
          onUpdateProcurement={onUpdateProcurement}
          onNavigate={onNavigate}
          currentUser={currentUser}
        />
      )}

      {/* CPO RELEASE / EXTEND MODAL */}
      {cpoReleaseSecurity && (
        <CpoReleaseModal
          isOpen={!!cpoReleaseSecurity}
          onClose={() => setCpoReleaseSecurity(null)}
          security={cpoReleaseSecurity}
          onUpdateSecurity={handleUpdateCpoSecurity}
        />
      )}
    </div>
  );
};

export default ProcurementModule;
