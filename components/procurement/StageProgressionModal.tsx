import React, { useState } from 'react';
import { Procurement, ProcurementStage, ProcurementAuditEntry, Project } from '../../types';
import { formatCurrencyETB } from '../../utils/procurementThresholds';
import { 
  FolderSync, 
  X, 
  CheckCircle2, 
  Calendar, 
  Megaphone, 
  FolderOpen, 
  Scale, 
  BellRing, 
  FileSignature, 
  XCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  Building2
} from 'lucide-react';

interface StageProgressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  procurement: Procurement;
  project?: Project;
  onUpdateProcurement: (updated: Procurement) => void;
  currentUser?: any;
}

export const StageProgressionModal: React.FC<StageProgressionModalProps> = ({
  isOpen,
  onClose,
  procurement,
  project,
  onUpdateProcurement,
  currentUser
}) => {
  if (!isOpen) return null;

  const currentStage = procurement.tenderStage || 'Preparation';
  const todayStr = new Date().toISOString().split('T')[0];

  // Stage select state
  const [selectedStage, setSelectedStage] = useState<ProcurementStage>(currentStage);
  
  // Specific stage parameters
  const [publicationDate, setPublicationDate] = useState<string>(procurement.publicationDate || todayStr);
  const [publicationMedia, setPublicationMedia] = useState<string>(procurement.publicationMedia || 'The Ethiopian Herald & Addis Zemen (Regional e-GP Portal)');
  const [floatingDays, setFloatingDays] = useState<number>(procurement.floatingPeriodDays || 21);

  const [bidOpeningDate, setBidOpeningDate] = useState<string>(procurement.bidOpeningDate || todayStr);
  const [bidOpeningVenue, setBidOpeningVenue] = useState<string>(procurement.bidOpeningVenue || 'OWEB Main Hall, Addis Ababa / Finfinnee');
  const [receivedBidsCount, setReceivedBidsCount] = useState<number>(procurement.receivedBidsCount || procurement.bidders?.length || 3);

  const [evaluationStatus, setEvaluationStatus] = useState<string>(procurement.evaluationStatus || 'Technical & Financial Evaluation Completed');
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>(procurement.awardedBidderId || procurement.bidders?.[0]?.id || '');
  const [standstillDays, setStandstillDays] = useState<number>(7); // Ethiopian PPA 7 working days standstill
  const [standstillStartDate, setStandstillStartDate] = useState<string>(procurement.standstillStartDate || todayStr);
  const [standstillEndDate, setStandstillEndDate] = useState<string>(
    procurement.standstillEndDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [awardNoticeRef, setAwardNoticeRef] = useState<string>(
    procurement.awardNoticeRef || `OWEB/AWD/${(procurement.tenderReferenceNumber || procurement.id).replace(/[^A-Za-z0-9]/g, '-')}`
  );

  const [cancellationReason, setCancellationReason] = useState<string>(procurement.cancellationReason || '');
  const [stageNotes, setStageNotes] = useState<string>('');

  const stagesList: { stage: ProcurementStage; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      stage: 'Preparation',
      label: 'Preparation & SBD Drafting',
      icon: <Clock className="w-4 h-4 text-cyan-600" />,
      desc: 'Formulation of bidding document, TOR, BOQ and BEC committee constitution.'
    },
    {
      stage: 'Advertisement / Invitation',
      label: 'Advertisement / Tender Floating',
      icon: <Megaphone className="w-4 h-4 text-sky-600" />,
      desc: 'Public invitation floated in press and e-GP portal for interested bidders.'
    },
    {
      stage: 'Bid Opening',
      label: 'Public Bid Opening Session',
      icon: <FolderOpen className="w-4 h-4 text-amber-600" />,
      desc: 'Public session recording received tenders, CPO verification, readout prices.'
    },
    {
      stage: 'Technical & Financial Evaluation',
      label: 'BEC Evaluation & Scoring',
      icon: <Scale className="w-4 h-4 text-indigo-600" />,
      desc: 'Preliminary screening, technical compliance matrix, and financial comparison.'
    },
    {
      stage: 'Notification of Award & Standstill',
      label: 'Award Notification & Standstill',
      icon: <BellRing className="w-4 h-4 text-emerald-600" />,
      desc: 'Publishing Intention to Award letter with mandatory 7-working-day standstill window.'
    },
    {
      stage: 'Contract Signing',
      label: 'Contract Signing & Bond Verification',
      icon: <FileSignature className="w-4 h-4 text-teal-600" />,
      desc: 'Formal contract executed with 10% performance security bond in place.'
    },
    {
      stage: 'Cancelled / Re-tendered',
      label: 'Cancelled / Re-tendered',
      icon: <XCircle className="w-4 h-4 text-rose-600" />,
      desc: 'Tender officially cancelled due to non-responsive bids, budget variance, or retendered.'
    }
  ];

  const handleApplyStageChange = (e: React.FormEvent) => {
    e.preventDefault();

    const auditEntry: ProcurementAuditEntry = {
      id: `AUDIT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: `Stage Changed: ${currentStage} &rarr; ${selectedStage}`,
      performedBy: currentUser?.username || 'Procurement Directorate Officer',
      details: stageNotes || `Procurement status updated to ${selectedStage}. Transition verified in accordance with Ethiopian PPA rules.`
    };

    const updated: Procurement = {
      ...procurement,
      tenderStage: selectedStage,
      auditTrail: [...(procurement.auditTrail || []), auditEntry]
    };

    if (selectedStage === 'Advertisement / Invitation') {
      updated.publicationDate = publicationDate;
      updated.publicationMedia = publicationMedia;
      updated.floatingPeriodDays = floatingDays;
      updated.biddingPeriodStart = publicationDate;
      updated.biddingPeriodEnd = new Date(new Date(publicationDate).getTime() + floatingDays * 86400000).toISOString().split('T')[0];
    } else if (selectedStage === 'Bid Opening') {
      updated.bidOpeningDate = bidOpeningDate;
      updated.bidOpeningVenue = bidOpeningVenue;
      updated.receivedBidsCount = receivedBidsCount;
    } else if (selectedStage === 'Technical & Financial Evaluation') {
      updated.evaluationStatus = evaluationStatus;
    } else if (selectedStage === 'Notification of Award & Standstill') {
      updated.awardedBidderId = selectedWinnerId;
      updated.awardDate = todayStr;
      updated.awardNoticeRef = awardNoticeRef;
      updated.standstillPeriod = true;
      updated.standstillStartDate = standstillStartDate;
      updated.standstillEndDate = standstillEndDate;
      const winner = procurement.bidders?.find(b => b.id === selectedWinnerId);
      if (winner) {
        updated.finalContractValueETB = winner.correctedPrice;
      }
    } else if (selectedStage === 'Cancelled / Re-tendered') {
      updated.cancellationReason = cancellationReason || 'Retendered or cancelled by directive of regional procurement board.';
    }

    onUpdateProcurement(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-sky-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#06203c] via-[#083359] to-[#041a30] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-300 rounded-2xl border border-cyan-400/30">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">
                Tender Lifecycle Governance
              </span>
              <h3 className="text-base font-black tracking-tight text-white">
                Advance Procurement Stage
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-sky-200 hover:text-white hover:bg-cyan-900/50 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleApplyStageChange} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-slate-800">
          {/* Target Tender Banner */}
          <div className="p-3 bg-sky-50/60 border border-sky-100 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block">Target Package</span>
              <span className="font-extrabold text-slate-900">{procurement.tenderReferenceNumber || procurement.id}</span>
              <span className="text-slate-500 block text-[11px]">{project?.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-semibold block">Current Stage</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-900">
                {currentStage}
              </span>
            </div>
          </div>

          {/* Stage Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Select Target Lifecycle Stage</label>
            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {stagesList.map((item) => (
                <div
                  key={item.stage}
                  onClick={() => setSelectedStage(item.stage)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    selectedStage === item.stage
                      ? 'bg-cyan-50/80 border-cyan-400 ring-2 ring-cyan-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 bg-slate-100 rounded-xl flex-shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900">{item.label}</h4>
                      {selectedStage === item.stage && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conditional Input Fields Based on Selected Stage */}
          {selectedStage === 'Advertisement / Invitation' && (
            <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-200 space-y-3 text-xs animate-fade-in">
              <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-cyan-700" />
                Advertisement &amp; Floating Details
              </h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Publication Date</label>
                  <input
                    type="date"
                    value={publicationDate}
                    onChange={(e) => setPublicationDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Floating Period (Days)</label>
                  <input
                    type="number"
                    value={floatingDays}
                    onChange={(e) => setFloatingDays(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Media / Portal Notice Reference</label>
                  <input
                    type="text"
                    value={publicationMedia}
                    onChange={(e) => setPublicationMedia(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedStage === 'Bid Opening' && (
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3 text-xs animate-fade-in">
              <h5 className="font-bold text-amber-950 flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-amber-700" />
                Public Bid Opening Session Parameters
              </h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Opening Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={bidOpeningDate}
                    onChange={(e) => setBidOpeningDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Received Bids</label>
                  <input
                    type="number"
                    value={receivedBidsCount}
                    onChange={(e) => setReceivedBidsCount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bid Opening Hall / Venue</label>
                  <input
                    type="text"
                    value={bidOpeningVenue}
                    onChange={(e) => setBidOpeningVenue(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedStage === 'Notification of Award & Standstill' && (
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3 text-xs animate-fade-in">
              <h5 className="font-bold text-emerald-950 flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-emerald-700" />
                Award Endorsement &amp; Standstill Notice
              </h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Awarded Winning Bidder</label>
                  <select
                    value={selectedWinnerId}
                    onChange={(e) => setSelectedWinnerId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 font-bold focus:outline-none"
                  >
                    {procurement.bidders && procurement.bidders.length > 0 ? (
                      procurement.bidders.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} — Evaluated Price: {formatCurrencyETB(b.correctedPrice)}
                        </option>
                      ))
                    ) : (
                      <option value="">No registered bidders available</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Standstill Start Date</label>
                  <input
                    type="date"
                    value={standstillStartDate}
                    onChange={(e) => setStandstillStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Standstill Concluding Date</label>
                  <input
                    type="date"
                    value={standstillEndDate}
                    onChange={(e) => setStandstillEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedStage === 'Cancelled / Re-tendered' && (
            <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-3 text-xs animate-fade-in">
              <h5 className="font-bold text-rose-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-700" />
                Mandatory Cancellation / Retendering Rationale
              </h5>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Justification Reason</label>
                <textarea
                  rows={2}
                  required
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g. All submitted bids non-compliant with technical requirements, or budget overrun exceeding 25% threshold."
                  className="w-full bg-white border border-rose-200 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Audit Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Audit Rationale / Officer Endorsement Remarks
            </label>
            <input
              type="text"
              value={stageNotes}
              onChange={(e) => setStageNotes(e.target.value)}
              placeholder="e.g. Verified and approved by Tender Endorsement Board minutes ref..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl text-xs font-black shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Stage Transition</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
