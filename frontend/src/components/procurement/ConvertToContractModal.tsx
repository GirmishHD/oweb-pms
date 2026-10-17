import React, { useState } from 'react';
import { Procurement, Project, Contract, User, KPI, Deliverable, Payment, Priority } from '../../types';
import { formatCurrencyETB } from '../../utils/procurementThresholds';
import { 
  FileSignature, 
  X, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  Calendar, 
  UserCheck, 
  Layers, 
  Clock, 
  ArrowRight,
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface ConvertToContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  procurement: Procurement;
  project?: Project;
  users?: User[];
  onAddContract?: (contract: Contract) => void;
  onUpdateProcurement?: (procurement: Procurement) => void;
  onNavigate?: (module: string) => void;
  currentUser?: any;
}

export const ConvertToContractModal: React.FC<ConvertToContractModalProps> = ({
  isOpen,
  onClose,
  procurement,
  project,
  users = [],
  onAddContract,
  onUpdateProcurement,
  onNavigate,
  currentUser
}) => {
  if (!isOpen) return null;

  const winner = procurement.bidders?.find(b => b.id === procurement.awardedBidderId) || procurement.bidders?.[0];
  const totalAmount = winner?.correctedPrice || procurement.finalContractValueETB || procurement.estimatedBudgetETB || project?.estimatedBudget || 0;
  const performanceSecurityAmount = Math.round(totalAmount * 0.10); // Standard 10% performance security in Ethiopian Public Procurement

  // Contract Managers and Supervisors from user pool
  const contractManagers = users.filter(u => u.role === 'Contract Manager');
  const supervisors = users.filter(u => u.role === 'Supervisor');

  const defaultCm = contractManagers[0]?.username || 'Contract Manager Specialist';
  const defaultSup = supervisors[0]?.username || 'Regional Senior Water Engineer';

  const defaultContractId = `CTR-OWEB-${new Date().getFullYear()}-${(procurement.tenderReferenceNumber || procurement.id).replace(/[^A-Za-z0-9]/g, '').slice(-5) || Math.floor(1000 + Math.random() * 9000)}`;

  const todayStr = new Date().toISOString().split('T')[0];
  const commencementDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]; // 15 days mobilization
  const completionDate = new Date(Date.now() + 270 * 86400000).toISOString().split('T')[0]; // 9 months standard works duration
  const performanceBondExpiry = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

  // Form State
  const [contractId, setContractId] = useState<string>(defaultContractId);
  const [contractManager, setContractManager] = useState<string>(defaultCm);
  const [supervisor, setSupervisor] = useState<string>(defaultSup);
  const [signingDate, setSigningDate] = useState<string>(todayStr);
  const [plannedCommencementDate, setPlannedCommencementDate] = useState<string>(commencementDate);
  const [plannedCompletionDate, setPlannedCompletionDate] = useState<string>(completionDate);
  const [disputeBoardInPlace, setDisputeBoardInPlace] = useState<boolean>(true);
  const [performanceBond, setPerformanceBond] = useState<number>(performanceSecurityAmount);
  const [bondExpiryDate, setBondExpiryDate] = useState<string>(performanceBondExpiry);
  const [advancePaymentPercent, setAdvancePaymentPercent] = useState<number>(20);
  const [remarks, setRemarks] = useState<string>(`Contract formulated following competitive bidding under ${procurement.tenderReferenceNumber || procurement.id}. Endorsed by BEC.`);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successContract, setSuccessContract] = useState<Contract | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Formulate Standard Deliverables based on lots or procurement type
    let deliverables: Deliverable[] = [];
    if (procurement.lots && procurement.lots.length > 0) {
      deliverables = procurement.lots.map((lot, idx) => ({
        id: `DEL-${Date.now()}-${idx}`,
        name: `${lot.lotNumber}: ${lot.lotTitle}`,
        priority: Priority.HIGH,
        category: procurement.procurementType === 'Goods' ? 'Supply of Goods' : 'Construction of Civil Works',
        plannedCompletionDate: new Date(Date.now() + (60 * (idx + 1)) * 86400000).toISOString().split('T')[0],
        linkedToPayments: true
      }));
    } else {
      deliverables = [
        {
          id: `DEL-${Date.now()}-1`,
          name: 'Site Handover, Mobilization & Preliminary Survey',
          priority: Priority.MEDIUM,
          category: 'Construction of Civil Works',
          plannedCompletionDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          linkedToPayments: true
        },
        {
          id: `DEL-${Date.now()}-2`,
          name: 'Civil Works & Structural Construction',
          priority: Priority.HIGH,
          category: 'Construction of Civil Works',
          plannedCompletionDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
          linkedToPayments: true
        },
        {
          id: `DEL-${Date.now()}-3`,
          name: 'Electromechanical Supply, Installation & Testing',
          priority: Priority.HIGH,
          category: 'Electromechanical Works',
          plannedCompletionDate: new Date(Date.now() + 240 * 86400000).toISOString().split('T')[0],
          linkedToPayments: true
        },
        {
          id: `DEL-${Date.now()}-4`,
          name: 'Substantial Completion Inspection & Snag Clearance',
          priority: Priority.HIGH,
          category: 'Construction of Civil Works',
          plannedCompletionDate: plannedCompletionDate,
          linkedToPayments: true
        }
      ];
    }

    // Default Milestone Payments
    const advanceAmount = Math.round(totalAmount * (advancePaymentPercent / 100));
    const interim1 = Math.round(totalAmount * 0.35);
    const interim2 = Math.round(totalAmount * 0.35);
    const finalAmount = totalAmount - (advanceAmount + interim1 + interim2);

    const payments: Payment[] = [
      {
        deliverableId: deliverables[0]?.id || `DEL-${Date.now()}-1`,
        plannedPaymentDate: plannedCommencementDate,
        amount: advanceAmount
      },
      {
        deliverableId: deliverables[1]?.id || `DEL-${Date.now()}-2`,
        plannedPaymentDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        amount: interim1
      },
      {
        deliverableId: deliverables[2]?.id || `DEL-${Date.now()}-3`,
        plannedPaymentDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        amount: interim2
      },
      {
        deliverableId: deliverables[deliverables.length - 1]?.id || `DEL-${Date.now()}-4`,
        plannedPaymentDate: plannedCompletionDate,
        amount: Math.max(0, finalAmount)
      }
    ];

    // Standard Project KPIs
    const kpis: KPI[] = [
      {
        id: `KPI-${Date.now()}-1`,
        description: 'Physical Works Progress Against Baseline Schedule',
        unitOfMeasurement: '% Completed',
        periodStartDate: plannedCommencementDate,
        periodEndDate: plannedCompletionDate,
        target: '100%'
      },
      {
        id: `KPI-${Date.now()}-2`,
        description: 'Quality Compliance & Materials Certification Rate',
        unitOfMeasurement: '% Test Compliance',
        periodStartDate: plannedCommencementDate,
        periodEndDate: plannedCompletionDate,
        target: '100% Passing Laboratory Tests'
      },
      {
        id: `KPI-${Date.now()}-3`,
        description: 'Environmental & Social Safeguards Adherence',
        unitOfMeasurement: 'ESMP Audit Score',
        periodStartDate: plannedCommencementDate,
        periodEndDate: plannedCompletionDate,
        target: 'Zero Critical Safeguard Non-Compliances'
      }
    ];

    const newContract: Contract = {
      id: contractId,
      projectId: procurement.projectId,
      procurementId: procurement.id,
      contractManager,
      cmPlanAssignmentDate: signingDate,
      cmActualAssignmentDate: signingDate,
      cmRemarks: `Assigned as Lead CM following award of ${procurement.tenderReferenceNumber || procurement.id}.`,
      supervisor,
      supervisorPlanAssignmentDate: signingDate,
      supervisorActualAssignmentDate: signingDate,
      supervisorRemarks: 'Designated resident supervising engineer.',
      performanceSecurityPlanDate: signingDate,
      performanceSecurityActualDate: signingDate,
      performanceSecurityExpiryDate: bondExpiryDate,
      performanceBondAmount: performanceBond,
      performanceBondCurrency: 'ETB',
      signingDate,
      signedContractUrl: '',
      disputeBoardInPlace,
      commencementPlanDate: plannedCommencementDate,
      commencementActualDate: '',
      siteHandoverPlanDate: plannedCommencementDate,
      siteHandoverActualDate: '',
      seashConferencePlanDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
      seashConferenceActualDate: '',
      kpis,
      deliverables,
      payments,
      variations: [],
      claims: [],
      plannedCompletionDate,
      isPlanFinalized: true
    };

    // 1. Add contract to system state
    if (onAddContract) {
      onAddContract(newContract);
    }

    // 2. Advance procurement stage to Contract Signing
    if (onUpdateProcurement) {
      const updatedAudit = [
        ...(procurement.auditTrail || []),
        {
          id: `AUDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Converted to Formal Contract',
          performedBy: currentUser?.username || 'Procurement Directorate Officer',
          details: `Contract ${newContract.id} successfully formulated with ${winner?.name || 'awarded contractor'} for ${formatCurrencyETB(totalAmount)}. Transferred to Contract Administration.`
        }
      ];

      onUpdateProcurement({
        ...procurement,
        tenderStage: 'Contract Signing',
        signedContractRef: newContract.id,
        contractSigningDate: signingDate,
        finalContractValueETB: totalAmount,
        auditTrail: updatedAudit
      });
    }

    setIsSubmitting(false);
    setSuccessContract(newContract);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-emerald-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#032e27] via-[#064e3b] to-[#022c22] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-400/30">
              <FileSignature className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Awarded Tender &rarr; Contract Administration Transition
              </span>
              <h3 className="text-lg font-black tracking-tight text-white">
                Convert Procurement to Formal Contract
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-800/50 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {successContract ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900">Contract Formulated Successfully!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Contract <span className="font-mono font-bold text-emerald-800">{successContract.id}</span> has been created and linked to project <span className="font-semibold text-slate-700">{project?.name || procurement.projectId}</span>.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 max-w-lg mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-emerald-800 font-semibold">Awarded Contractor:</span>
                <span className="font-bold text-slate-900">{winner?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800 font-semibold">Total Contract Value:</span>
                <span className="font-mono font-black text-emerald-950">{formatCurrencyETB(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800 font-semibold">Contract Manager:</span>
                <span className="font-bold text-slate-900">{successContract.contractManager}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800 font-semibold">Planned Completion:</span>
                <span className="font-bold text-slate-900">{successContract.plannedCompletionDate}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              >
                Stay in Procurement
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigate) onNavigate('contract');
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-700/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Open Contract Module</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-slate-800">
            {/* Overview Banner */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Awarded Contractor</span>
                <h4 className="text-base font-black text-emerald-950">{winner?.name || 'Tender Responsive Bidder'}</h4>
                <p className="text-xs text-emerald-800/80 font-mono mt-0.5">
                  Tender: {procurement.tenderReferenceNumber || procurement.id} &bull; Scheme: {project?.name || procurement.projectId}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold text-emerald-700 block">Evaluated Price</span>
                <span className="text-lg font-black text-emerald-950 font-mono">{formatCurrencyETB(totalAmount)}</span>
              </div>
            </div>

            {/* Core Contract Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contract Identifier / Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Formal Contract Signing Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={signingDate}
                  onChange={(e) => setSigningDate(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Contract Manager <span className="text-rose-500">*</span>
                </label>
                <select
                  value={contractManager}
                  onChange={(e) => setContractManager(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {contractManagers.length > 0 ? (
                    contractManagers.map(cm => (
                      <option key={cm.id} value={cm.username}>{cm.username} ({cm.department || 'OWEB CM Unit'})</option>
                    ))
                  ) : (
                    <option value={defaultCm}>{defaultCm}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Designated Supervising Engineer <span className="text-rose-500">*</span>
                </label>
                <select
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {supervisors.length > 0 ? (
                    supervisors.map(sup => (
                      <option key={sup.id} value={sup.username}>{sup.username} ({sup.department || 'Water Engineering'})</option>
                    ))
                  ) : (
                    <option value={defaultSup}>{defaultSup}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Performance Security & Dates */}
            <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-700" />
                  Performance Security Bond (10% Statutory Requirement)
                </h5>
                <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                  PPA Mandatory
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Required Guarantee Amount (ETB)</label>
                  <input
                    type="number"
                    value={performanceBond}
                    onChange={(e) => setPerformanceBond(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-cyan-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Guarantee Expiry Date</label>
                  <input
                    type="date"
                    value={bondExpiryDate}
                    onChange={(e) => setBondExpiryDate(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Timelines */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Planned Site Handover &amp; Commencement</label>
                <input
                  type="date"
                  value={plannedCommencementDate}
                  onChange={(e) => setPlannedCommencementDate(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Planned Completion Date</label>
                <input
                  type="date"
                  value={plannedCompletionDate}
                  onChange={(e) => setPlannedCompletionDate(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Advance payment & Dispute board */}
            <div className="grid md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Advance Mobilization Payment (%)</label>
                <select
                  value={advancePaymentPercent}
                  onChange={(e) => setAdvancePaymentPercent(Number(e.target.value))}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                >
                  <option value={0}>0% (No Advance Payment)</option>
                  <option value={10}>10% of Contract Value</option>
                  <option value={20}>20% of Contract Value (Recommended)</option>
                  <option value={30}>30% (PPA Statutory Ceiling)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="disputeBoard"
                  checked={disputeBoardInPlace}
                  onChange={(e) => setDisputeBoardInPlace(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="disputeBoard" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Establish Dispute Adjudication Board (DAB)
                </label>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contract Administration Remarks</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none"
              />
            </div>

            {/* Modal Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-700/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FileSignature className="w-4 h-4" />
                <span>{isSubmitting ? 'Formulating Contract...' : 'Confirm & Generate Contract'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
