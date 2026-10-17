import React, { useState } from 'react';
import { Procurement, Project, Contract, User } from '../../types';
import { formatCurrencyETB, validateProcurementThreshold, getBidSecurityStatus } from '../../utils/procurementThresholds';
import { ProcurementStageStepper } from './ProcurementStageStepper';
import { StageProgressionModal } from './StageProgressionModal';
import { ProcurementDocumentGeneratorModal } from './ProcurementDocumentGeneratorModal';
import { ConvertToContractModal } from './ConvertToContractModal';
import { 
  FileText, 
  Layers, 
  Scale, 
  ShieldCheck, 
  Users, 
  Award, 
  ArrowRight, 
  Printer, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Building2, 
  Coins, 
  FileSignature, 
  History,
  FolderSync,
  Megaphone,
  Clock
} from 'lucide-react';

interface ProcurementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  procurement: Procurement;
  project?: Project;
  users?: User[];
  onConvertToContract?: (procurement: Procurement, project?: Project) => void;
  onAddContract?: (contract: Contract) => void;
  onUpdateProcurement?: (updated: Procurement) => void;
  onNavigate?: (module: string) => void;
  currentUser?: any;
}

export const ProcurementDetailModal: React.FC<ProcurementDetailModalProps> = ({
  isOpen,
  onClose,
  procurement,
  project,
  users = [],
  onConvertToContract,
  onAddContract,
  onUpdateProcurement,
  onNavigate,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'dossier' | 'lots' | 'evaluation' | 'securities' | 'committee' | 'award' | 'audit'>('dossier');
  const [isStageModalOpen, setIsStageModalOpen] = useState<boolean>(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentStage = procurement.tenderStage || (procurement.awardedBidderId ? 'Notification of Award & Standstill' : 'Technical & Financial Evaluation');
  const winningBidder = procurement.bidders?.find(b => b.id === procurement.awardedBidderId);
  const totalBudget = procurement.estimatedBudgetETB || project?.estimatedBudget || 0;
  const thresholdCheck = validateProcurementThreshold(procurement.procurementMethod || 'NCB', procurement.procurementType, totalBudget);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-sky-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-6 bg-gradient-to-r from-[#06203c] via-[#083359] to-[#041a30] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-300 rounded-2xl border border-cyan-400/30 flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                  Tender Reference: {procurement.tenderReferenceNumber || procurement.id}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/30 border border-cyan-400/40 text-cyan-200">
                  {procurement.procurementMethod || 'NCB'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-500/30 border border-sky-400/40 text-sky-200">
                  {procurement.procurementType}
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-white truncate mt-0.5">
                {project?.name || `Project ID: ${procurement.projectId}`}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Advance Stage Button */}
            {onUpdateProcurement && (
              <button
                type="button"
                onClick={() => setIsStageModalOpen(true)}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FolderSync className="w-3.5 h-3.5" />
                <span>Advance Stage</span>
              </button>
            )}

            {/* SBD Letters Generator Button */}
            <button
              type="button"
              onClick={() => setIsDocModalOpen(true)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Megaphone className="w-3.5 h-3.5 text-cyan-300" />
              <span>SBD Letters</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-cyan-600/80 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Dossier</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-sky-200 hover:text-white hover:bg-cyan-900/50 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stepper Banner */}
        <div className="px-6 pt-4 pb-2 bg-slate-50 border-b border-sky-100 flex-shrink-0">
          <ProcurementStageStepper 
            currentStage={currentStage} 
            procurement={procurement}
            isInteractive={!!onUpdateProcurement}
            onStageSelect={() => setIsStageModalOpen(true)}
          />
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 pt-3 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          {[
            { id: 'dossier', label: 'Tender Dossier & Scope', icon: <FileText className="w-4 h-4" /> },
            { id: 'lots', label: `Multi-Lot Packaging (${procurement.lots?.length || 0})`, icon: <Layers className="w-4 h-4" /> },
            { id: 'evaluation', label: `Bid Evaluation Matrix (${procurement.bidders?.length || 0})`, icon: <Scale className="w-4 h-4" /> },
            { id: 'securities', label: `Bid Securities / CPO (${procurement.bidSecurities?.length || 0})`, icon: <ShieldCheck className="w-4 h-4" /> },
            { id: 'committee', label: 'BEC Committee Roster', icon: <Users className="w-4 h-4" /> },
            { id: 'award', label: 'Award & Contract Transition', icon: <Award className="w-4 h-4" /> },
            { id: 'audit', label: `Audit Trail (${procurement.auditTrail?.length || 0})`, icon: <History className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'text-cyan-800 border-cyan-600 bg-cyan-50/50'
                  : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-slate-800 bg-white">
          {/* TAB 1: DOSSIER & SCOPE */}
          {activeTab === 'dossier' && (
            <div className="space-y-6 animate-fade-in">
              {/* Threshold Compliance Banner */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                thresholdCheck.isValid 
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}>
                {thresholdCheck.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wide">
                    Ethiopian PPA Threshold Compliance: {thresholdCheck.status}
                  </h4>
                  <p className="text-xs mt-0.5">{thresholdCheck.message}</p>
                </div>
              </div>

              {/* Core Parameters Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-sky-50/40 p-4 rounded-2xl border border-sky-100 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 text-xs border-b border-sky-200/60 pb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-cyan-600" />
                    Target Water Project Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block">Project Name:</span>
                      <span className="font-bold text-slate-800">{project?.name || procurement.projectId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Location:</span>
                      <span className="font-semibold text-slate-800">
                        {project ? `${project.woreda}, ${project.zone}` : 'Oromia Region'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Estimated Budget:</span>
                      <span className="font-extrabold text-cyan-900 font-mono">{formatCurrencyETB(totalBudget)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Funding Source:</span>
                      <span className="font-semibold text-slate-800">{project?.fundingSource || 'Regional Capital Budget'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-sky-50/40 p-4 rounded-2xl border border-sky-100 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 text-xs border-b border-sky-200/60 pb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-cyan-600" />
                    Tender Publication &amp; Bidding Window
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block">Invitation / Issue Date:</span>
                      <span className="font-bold text-slate-800">{procurement.bidIssuedDate || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Floating Period:</span>
                      <span className="font-semibold text-slate-800">
                        {procurement.biddingPeriodStart} &rarr; {procurement.biddingPeriodEnd}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Bid Opening Session:</span>
                      <span className="font-bold text-cyan-900">{procurement.bidOpeningDate || procurement.biddingPeriodEnd || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Media / Gazette Ref:</span>
                      <span className="font-medium text-slate-800">{procurement.publicationMedia || 'The Ethiopian Herald / Addis Zemen'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Committee Report Statement */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">
                  BEC Committee Evaluation Summary Statement
                </span>
                <p className="text-slate-600 leading-relaxed">
                  {procurement.committeeReport || 'The Bid Evaluation Committee verified responsiveness in accordance with Ethiopian Public Procurement Agency (PPA) standard criteria, examining eligibility credentials, technical capability, and financial proposals.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: MULTI-LOT PACKAGING */}
          {activeTab === 'lots' && (
            <div className="space-y-4 animate-fade-in">
              {procurement.lots && procurement.lots.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">Lot Number</th>
                        <th className="p-3">Title &amp; Work Scope</th>
                        <th className="p-3 text-right">Allocated Budget (ETB)</th>
                        <th className="p-3 text-right">Required CPO (ETB)</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {procurement.lots.map(l => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-cyan-900">{l.lotNumber}</td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{l.lotTitle}</span>
                            <span className="text-slate-500 text-[11px]">{l.scopeDescription}</span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">{formatCurrencyETB(l.allocatedBudgetETB)}</td>
                          <td className="p-3 text-right font-mono text-cyan-900">{formatCurrencyETB(l.requiredBidSecurityETB)}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                              {l.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 p-6">
                  <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Single Lot Tender Package</p>
                  <p className="text-[11px] text-slate-500 mt-1">This procurement is treated as a consolidated single lot for the full works package.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BID EVALUATION MATRIX */}
          {activeTab === 'evaluation' && (
            <div className="space-y-4 animate-fade-in">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Bidder Firm</th>
                      <th className="p-3 text-right">Readout Price (ETB)</th>
                      <th className="p-3 text-right">Corrected Price (ETB)</th>
                      <th className="p-3 text-center">Technical Score</th>
                      <th className="p-3 text-center">Preliminary Check</th>
                      <th className="p-3 text-center">Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(procurement.bidders || []).map((b, idx) => {
                      const isWinner = b.id === procurement.awardedBidderId;
                      return (
                        <tr key={b.id} className={isWinner ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-slate-50'}>
                          <td className="p-3 font-black text-cyan-900">
                            {isWinner ? (
                              <span className="flex items-center gap-1 text-emerald-700">
                                <Award className="w-4 h-4" /> 1
                              </span>
                            ) : (
                              b.finalRank || idx + 1
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{b.name}</span>
                            <span className="text-[10px] text-slate-500">{b.address} &bull; {b.type}</span>
                          </td>
                          <td className="p-3 text-right font-mono text-slate-600">{formatCurrencyETB(b.readoutPrice)}</td>
                          <td className="p-3 text-right font-mono font-bold text-cyan-950">{formatCurrencyETB(b.correctedPrice)}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              (b.technicalScores?.totalTechnicalScore || 75) >= 70
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {b.technicalScores?.totalTechnicalScore || 75}%
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Compliant
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isWinner ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isWinner ? 'Recommended Awardee' : b.evaluationStatus || 'Responsive'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: BID SECURITIES / CPO */}
          {activeTab === 'securities' && (
            <div className="space-y-4 animate-fade-in">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Guarantee Number</th>
                      <th className="p-3">Bidder Firm</th>
                      <th className="p-3">Issuing Bank</th>
                      <th className="p-3 text-right">Guarantee Amount (ETB)</th>
                      <th className="p-3 text-center">Expiry Date</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(procurement.bidSecurities || []).map(sec => {
                      const st = getBidSecurityStatus(sec.expiryDate);
                      return (
                        <tr key={sec.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-slate-900">{sec.guaranteeNumber}</td>
                          <td className="p-3 font-bold text-slate-800">{sec.bidderName}</td>
                          <td className="p-3 text-slate-600">{sec.issuingBankOrInstitution}</td>
                          <td className="p-3 text-right font-mono font-black text-cyan-900">{formatCurrencyETB(sec.amountETB)}</td>
                          <td className="p-3 text-center font-mono">{sec.expiryDate}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${st.colorClass}`}>
                              {sec.status || st.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: BEC COMMITTEE */}
          {activeTab === 'committee' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-extrabold text-cyan-950 text-sm">
                    {procurement.evaluationCommittee?.committeeName || 'Bid Evaluation Committee (BEC)'}
                  </h4>
                  <p className="text-slate-500 font-mono text-[11px]">
                    Appointment Ref: {procurement.evaluationCommittee?.appointmentRefNumber || 'OWEB/BEC/APP-2025'}
                  </p>
                </div>
                <span className="px-3 py-1 bg-cyan-100 text-cyan-900 rounded-full font-bold text-xs">
                  {procurement.evaluationCommittee?.status || 'Active & Constituted'}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {(procurement.evaluationCommittee?.members || []).map((m, idx) => (
                  <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-900">{m.fullName}</h5>
                      <p className="text-[11px] text-slate-500">{m.departmentOrAgency} &bull; {m.specialization}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-800">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: AWARD & CONTRACT TRANSITION */}
          {activeTab === 'award' && (
            <div className="space-y-6 animate-fade-in">
              {winningBidder ? (
                <div className="bg-emerald-50/80 p-5 rounded-3xl border border-emerald-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                          Lowest Evaluated Responsive Bidder
                        </span>
                        <h4 className="text-lg font-black text-emerald-950">{winningBidder.name}</h4>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-emerald-700 block font-semibold">Final Award Amount</span>
                      <span className="text-xl font-black text-emerald-950 font-mono">
                        {formatCurrencyETB(winningBidder.correctedPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 pt-3 border-t border-emerald-200/80 text-xs">
                    <div>
                      <span className="text-emerald-700 font-medium block">Award Notification Date:</span>
                      <span className="font-bold text-emerald-950">{procurement.awardDate || new Date().toISOString().split('T')[0]}</span>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-medium block">Standstill Period:</span>
                      <span className="font-bold text-emerald-950">
                        {procurement.standstillStartDate || 'Active'} &rarr; {procurement.standstillEndDate || 'Concluded'}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-medium block">Award Notice Ref:</span>
                      <span className="font-bold text-emerald-950 font-mono">{procurement.awardNoticeRef || `OWEB/AWD/${procurement.id}`}</span>
                    </div>
                  </div>

                  {/* Convert to Contract Button */}
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConvertModalOpen(true)}
                      className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-700/20 hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <FileSignature className="w-4 h-4" />
                      <span>Convert to Formal Contract &rarr;</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 p-6">
                  <Award className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Tender Pending Award Decision</p>
                  <p className="text-[11px] text-slate-500 mt-1">Conclude BEC technical and financial evaluation to endorse the winning contractor.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-600" />
                  Timestamped Procurement Audit Trail
                </h4>
                <span className="text-[11px] text-slate-500">
                  {procurement.auditTrail?.length || 0} Events Recorded
                </span>
              </div>

              {procurement.auditTrail && procurement.auditTrail.length > 0 ? (
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-6">
                  {procurement.auditTrail.map((entry, idx) => (
                    <div key={entry.id || idx} className="relative bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                      <div className="absolute -left-[1.65rem] top-3.5 w-2.5 h-2.5 rounded-full bg-cyan-600 border-2 border-white shadow-2xs" />
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">{entry.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{entry.details}</p>
                      <span className="text-[10px] text-cyan-800 font-bold block">
                        Actor: {entry.performedBy}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  No audit entries recorded for this package.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sub-Modals */}
      {isStageModalOpen && onUpdateProcurement && (
        <StageProgressionModal
          isOpen={isStageModalOpen}
          onClose={() => setIsStageModalOpen(false)}
          procurement={procurement}
          project={project}
          onUpdateProcurement={onUpdateProcurement}
          currentUser={currentUser}
        />
      )}

      {isDocModalOpen && (
        <ProcurementDocumentGeneratorModal
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
          procurement={procurement}
          project={project}
        />
      )}

      {isConvertModalOpen && (
        <ConvertToContractModal
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          procurement={procurement}
          project={project}
          users={users}
          onAddContract={onAddContract}
          onUpdateProcurement={onUpdateProcurement}
          onNavigate={onNavigate}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
