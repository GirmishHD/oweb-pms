import React from 'react';
import { Procurement, Project } from '../../types';

interface CommitteeDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  procurement: Procurement;
  project?: Project;
}

export const CommitteeDossierModal: React.FC<CommitteeDossierModalProps> = ({
  isOpen,
  onClose,
  procurement,
  project
}) => {
  if (!isOpen) return null;

  const committee = procurement.evaluationCommittee;
  const winner = procurement.bidders.find(b => b.id === procurement.awardedBidderId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-cyan-200/80 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#06203c] via-[#083359] to-[#041a30] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-300 rounded-2xl border border-cyan-400/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">Official Bureau Document</span>
              <h3 className="text-lg font-black tracking-tight text-white">
                Bid Evaluation Committee (BEC) Dossier &amp; Award Resolution
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-cyan-600/80 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-sky-200 hover:text-white hover:bg-cyan-900/50 rounded-xl transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-slate-800">
          {/* Official Letterhead */}
          <div className="text-center border-b border-sky-100 pb-5">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Oromia Water Resource Bureau (OWEB)</h2>
            <p className="text-xs text-slate-600 font-medium">Study, Design &amp; Procurement Directorate • Tender Endorsement Board</p>
            <div className="inline-block mt-2 px-3 py-1 bg-cyan-50 border border-cyan-200 rounded-full text-xs font-bold text-cyan-900">
              Tender Package: {procurement.tenderReferenceNumber || procurement.id}
            </div>
          </div>

          {/* Project & Tender Summary Details */}
          <div className="grid md:grid-cols-2 gap-4 bg-sky-50/40 p-4 rounded-2xl border border-sky-100 text-xs">
            <div>
              <p className="text-slate-500 font-semibold">Target Scheme / Project</p>
              <p className="font-bold text-slate-900 text-sm">{project?.name || procurement.projectId}</p>
              <p className="text-slate-600">{project?.region}, {project?.zone} Zone • {project?.woreda} Woreda</p>
            </div>
            <div className="space-y-1">
              <p><span className="text-slate-500 font-semibold">Procurement Method:</span> <strong className="text-slate-900">{procurement.procurementMethod || 'NCB'}</strong></p>
              <p><span className="text-slate-500 font-semibold">Procurement Category:</span> <strong className="text-slate-900">{procurement.procurementType}</strong></p>
              <p><span className="text-slate-500 font-semibold">Estimated Budget:</span> <strong className="text-cyan-900 font-mono">{project?.estimatedBudget ? `${project.estimatedBudget.toLocaleString()} ETB` : 'N/A'}</strong></p>
            </div>
          </div>

          {/* Committee Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
                1. Constituted Evaluation Committee (BEC) Roster
              </h4>
              <span className="text-xs font-bold text-cyan-800 bg-cyan-100 px-2.5 py-0.5 rounded-full">
                Ref: {committee?.appointmentRefNumber || 'OWEB/BEC/APP-2025'}
              </span>
            </div>

            {committee?.members && committee.members.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {committee.members.map((m, idx) => (
                  <div key={m.id || idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{m.fullName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                        {m.role}
                      </span>
                    </div>
                    <p className="text-slate-600">{m.departmentOrAgency} • {m.specialization || 'Technical Expert'}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500 font-mono">{m.phone || m.email || 'Official Registered'}</span>
                      <span className="text-emerald-700 font-bold">✓ Declaration Signed</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No formal committee members attached to this procurement package.</p>
            )}
          </div>

          {/* Comparative Scoring Matrix */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
              2. Multi-Stage Bid Evaluation &amp; Scoring Matrix
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Bidder / Contractor</th>
                    <th className="p-2.5">Legal Preliminary</th>
                    <th className="p-2.5">Tech Score (/100)</th>
                    <th className="p-2.5">Readout Price</th>
                    <th className="p-2.5">Corrected Price</th>
                    <th className="p-2.5">Committee Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {procurement.bidders.map((b) => (
                    <tr key={b.id} className="hover:bg-sky-50/40">
                      <td className="p-2.5 font-bold text-slate-900">
                        {b.name}
                        <span className="block text-[10px] text-slate-500 font-normal">{b.type} • {b.address}</span>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.preliminaryCompliance?.isEligibleAndResponsive !== false
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {b.preliminaryCompliance?.isEligibleAndResponsive !== false ? 'Responsive' : 'Disqualified'}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold">
                        {b.technicalScores ? (
                          <span className={b.technicalScores.totalTechnicalScore >= 70 ? 'text-sky-700' : 'text-rose-700'}>
                            {b.technicalScores.totalTechnicalScore} pts
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">{b.readoutPrice.toLocaleString()} {b.currency}</td>
                      <td className="p-2.5 font-mono font-bold text-cyan-900">{b.correctedPrice.toLocaleString()} {b.currency}</td>
                      <td className="p-2.5 font-semibold text-slate-700">{b.committeeVerdict || b.evaluationStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Committee Recommendation & Award Endorsement */}
          <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 space-y-3">
            <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              3. Final Committee Recommendation &amp; Award Resolution
            </h4>
            <p className="text-xs text-emerald-900 leading-relaxed">
              {committee?.committeeRecommendationReport || 
                `The Tender Evaluation Committee unanimously recommends award of the contract to ${winner ? winner.name : 'the lowest evaluated responsive bidder'} having met all preliminary, technical, and financial criteria in accordance with OWEB procurement directives.`}
            </p>
            {winner && (
              <div className="pt-3 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-emerald-800 font-medium">Recommended Contractor:</span>
                  <strong className="text-emerald-950 text-sm ml-2">{winner.name}</strong>
                </div>
                <div>
                  <span className="text-emerald-800 font-medium">Awarded Contract Value:</span>
                  <strong className="text-emerald-950 text-sm ml-2 font-mono">{winner.correctedPrice.toLocaleString()} {winner.currency}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
