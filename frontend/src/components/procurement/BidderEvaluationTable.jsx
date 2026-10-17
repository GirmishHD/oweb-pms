import React, { useState } from 'react';
import { BIDDER_TYPES, REJECTION_REASONS, CURRENCIES } from '../../constants';
export const BidderEvaluationTable = ({ bidders, onChange, minTechnicalScore = 70, projectBudget }) => {
    const [activeStage, setActiveStage] = useState('all');
    const [expandedBidderId, setExpandedBidderId] = useState(bidders[0]?.id || null);
    const updateBidder = (index, updates) => {
        const updated = [...bidders];
        const current = updated[index];
        const merged = { ...current, ...updates };
        // Auto-calculate total technical score & status if technical scores updated
        if (updates.technicalScores || current.technicalScores) {
            const ts = merged.technicalScores || {
                methodologyScore: 0,
                keyPersonnelScore: 0,
                equipmentAvailabilityScore: 0,
                pastPerformanceScore: 0,
                workScheduleScore: 0,
                totalTechnicalScore: 0,
                technicalPassStatus: 'Fail'
            };
            const total = (ts.methodologyScore || 0) +
                (ts.keyPersonnelScore || 0) +
                (ts.equipmentAvailabilityScore || 0) +
                (ts.pastPerformanceScore || 0) +
                (ts.workScheduleScore || 0);
            ts.totalTechnicalScore = total;
            ts.technicalPassStatus = total >= minTechnicalScore ? 'Pass' : 'Fail';
            merged.technicalScores = ts;
        }
        updated[index] = merged;
        onChange(updated);
    };
    const updateCompliance = (index, complianceUpdates) => {
        const bidder = bidders[index];
        const existing = bidder.preliminaryCompliance || {
            tradeLicenseValid: true,
            taxClearanceValid: true,
            vatRegistrationValid: true,
            ppaSupplierRegistrationValid: true,
            bidSecuritySubmitted: true,
            isEligibleAndResponsive: true
        };
        const mergedCompliance = { ...existing, ...complianceUpdates };
        // Check overall preliminary responsiveness
        const isEligible = mergedCompliance.tradeLicenseValid &&
            mergedCompliance.taxClearanceValid &&
            mergedCompliance.vatRegistrationValid &&
            mergedCompliance.ppaSupplierRegistrationValid &&
            mergedCompliance.bidSecuritySubmitted;
        mergedCompliance.isEligibleAndResponsive = isEligible;
        updateBidder(index, {
            preliminaryCompliance: mergedCompliance,
            evaluationStatus: isEligible ? 'Evaluated' : 'Rejected',
            rejectionReason: !isEligible ? 'Eligibility/Legal Disqualification' : undefined
        });
    };
    const updateTechnical = (index, techUpdates) => {
        const bidder = bidders[index];
        const existing = bidder.technicalScores || {
            methodologyScore: 20,
            keyPersonnelScore: 20,
            equipmentAvailabilityScore: 16,
            pastPerformanceScore: 16,
            workScheduleScore: 8,
            totalTechnicalScore: 80,
            technicalPassStatus: 'Pass'
        };
        const merged = { ...existing, ...techUpdates };
        const total = (merged.methodologyScore || 0) +
            (merged.keyPersonnelScore || 0) +
            (merged.equipmentAvailabilityScore || 0) +
            (merged.pastPerformanceScore || 0) +
            (merged.workScheduleScore || 0);
        merged.totalTechnicalScore = total;
        merged.technicalPassStatus = total >= minTechnicalScore ? 'Pass' : 'Fail';
        updateBidder(index, {
            technicalScores: merged,
            evaluationStatus: merged.technicalPassStatus === 'Pass' && bidder.preliminaryCompliance?.isEligibleAndResponsive !== false ? 'Evaluated' : (bidder.evaluationStatus === 'Rejected' ? 'Rejected' : 'Evaluated')
        });
    };
    const addBidder = () => {
        const newId = `B-${Date.now().toString().slice(-4)}`;
        const newBidder = {
            id: newId,
            name: '',
            address: '',
            type: 'Company',
            evaluationStatus: 'Evaluated',
            readoutPrice: 0,
            correctedPrice: 0,
            currency: 'ETB',
            preliminaryCompliance: {
                tradeLicenseValid: true,
                taxClearanceValid: true,
                vatRegistrationValid: true,
                ppaSupplierRegistrationValid: true,
                bidSecuritySubmitted: true,
                bidSecurityAmount: 50000,
                isEligibleAndResponsive: true
            },
            technicalScores: {
                methodologyScore: 20,
                keyPersonnelScore: 20,
                equipmentAvailabilityScore: 16,
                pastPerformanceScore: 16,
                workScheduleScore: 8,
                totalTechnicalScore: 80,
                technicalPassStatus: 'Pass'
            }
        };
        onChange([...bidders, newBidder]);
        setExpandedBidderId(newId);
    };
    const removeBidder = (index) => {
        onChange(bidders.filter((_, i) => i !== index));
    };
    return (<div className="space-y-4">
      {/* Substage Filter Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-sky-50/70 rounded-2xl border border-sky-200/80">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All Bidders Overview' },
            { id: 'preliminary', label: '1. Preliminary Compliance' },
            { id: 'technical', label: '2. Technical Scoring' },
            { id: 'financial', label: '3. Financial Rectification' }
        ].map((stage) => (<button key={stage.id} type="button" onClick={() => setActiveStage(stage.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeStage === stage.id
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-sky-100/70 border border-sky-200'}`}>
              {stage.label}
            </button>))}
        </div>
        <button type="button" onClick={addBidder} className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/>
          </svg>
          + Add Bidder
        </button>
      </div>

      {bidders.length === 0 ? (<div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <p className="text-xs text-slate-500">No bidders registered yet. Click &quot;+ Add Bidder&quot; to begin evaluation.</p>
        </div>) : (<div className="space-y-4">
          {bidders.map((bidder, index) => {
                const isExpanded = expandedBidderId === bidder.id;
                const techTotal = bidder.technicalScores?.totalTechnicalScore ?? 0;
                const techPass = bidder.technicalScores?.technicalPassStatus === 'Pass' || techTotal >= minTechnicalScore;
                const isCompliant = bidder.preliminaryCompliance?.isEligibleAndResponsive !== false;
                const variancePct = projectBudget && bidder.correctedPrice > 0
                    ? (((bidder.correctedPrice - projectBudget) / projectBudget) * 100).toFixed(1)
                    : null;
                return (<div key={bidder.id} className="bg-white rounded-2xl border border-sky-100 shadow-2xs overflow-hidden transition-all">
                {/* Bidder Card Header Bar */}
                <div onClick={() => setExpandedBidderId(isExpanded ? null : bidder.id)} className="p-4 bg-gradient-to-r from-slate-50/90 via-sky-50/40 to-slate-50/90 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-sky-50/80 border-b border-slate-100 select-none">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-cyan-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
                      #{index + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        {bidder.name || `Unnamed Bidder (${bidder.id})`}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                          {bidder.type}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500">{bidder.address || 'Address not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Status Badges */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${isCompliant ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                      {isCompliant ? '✓ Legal Compliance OK' : '✕ Legal Disqualified'}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${techPass ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      Tech: {techTotal}/100 ({techPass ? 'PASS' : 'FAIL'})
                    </span>

                    <span className="px-3 py-1 bg-cyan-900 text-white rounded-xl text-xs font-black font-mono shadow-2xs">
                      {bidder.correctedPrice ? bidder.correctedPrice.toLocaleString() : bidder.readoutPrice.toLocaleString()} {bidder.currency}
                    </span>

                    <button type="button" onClick={(e) => {
                        e.stopPropagation();
                        removeBidder(index);
                    }} className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Delete Bidder">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded Bidder Details */}
                {isExpanded && (<div className="p-5 space-y-6">
                    {/* General Identification */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Bidder / Contractor Name</label>
                        <input type="text" value={bidder.name} onChange={(e) => updateBidder(index, { name: e.target.value })} placeholder="e.g. Oromia Water Construction PLC" className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 font-bold text-slate-900"/>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Company / JV Address</label>
                        <input type="text" value={bidder.address} onChange={(e) => updateBidder(index, { address: e.target.value })} placeholder="e.g. Adama / Addis Ababa" className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500"/>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Bidder Legal Structure</label>
                        <select value={bidder.type} onChange={(e) => updateBidder(index, { type: e.target.value })} className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 font-medium">
                          {BIDDER_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Evaluation Final Verdict</label>
                        <select value={bidder.evaluationStatus} onChange={(e) => updateBidder(index, { evaluationStatus: e.target.value })} className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 font-bold">
                          <option value="Evaluated">Evaluated / Responsive</option>
                          <option value="Rejected">Rejected / Disqualified</option>
                        </select>
                      </div>
                    </div>

                    {bidder.evaluationStatus === 'Rejected' && (<div className="p-3 bg-rose-50 rounded-xl border border-rose-200 grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-rose-900 mb-1">Disqualification Reason</label>
                          <select value={bidder.rejectionReason || 'Technical Non-Conformity'} onChange={(e) => updateBidder(index, { rejectionReason: e.target.value })} className="w-full px-3 py-1.5 text-xs bg-white border border-rose-300 rounded-lg text-rose-900 font-semibold">
                            {REJECTION_REASONS.map((r) => (<option key={r} value={r}>{r}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-rose-900 mb-1">Committee Disqualification Remarks</label>
                          <input type="text" value={bidder.committeeVerdict || ''} onChange={(e) => updateBidder(index, { committeeVerdict: e.target.value })} placeholder="Detailed justification for rejection..." className="w-full px-3 py-1.5 text-xs bg-white border border-rose-300 rounded-lg text-rose-900"/>
                        </div>
                      </div>)}

                    {/* Section 1: Preliminary & Legal Compliance Check */}
                    {(activeStage === 'all' || activeStage === 'preliminary') && (<div className="p-4 bg-sky-50/40 rounded-2xl border border-sky-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-xs text-sky-950 uppercase tracking-wide flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-500"/>
                            Stage 1: Preliminary &amp; Legal Eligibility Verification
                          </h5>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isCompliant ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {isCompliant ? '✓ Preliminarily Responsive' : '✕ Disqualified at Stage 1'}
                          </span>
                        </div>

                        <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
                          <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                            <input type="checkbox" checked={bidder.preliminaryCompliance?.tradeLicenseValid ?? true} onChange={(e) => updateCompliance(index, { tradeLicenseValid: e.target.checked })} className="w-4 h-4 text-cyan-600 rounded"/>
                            <span className="text-[11px] font-semibold text-slate-700">Valid Trade License</span>
                          </label>

                          <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                            <input type="checkbox" checked={bidder.preliminaryCompliance?.taxClearanceValid ?? true} onChange={(e) => updateCompliance(index, { taxClearanceValid: e.target.checked })} className="w-4 h-4 text-cyan-600 rounded"/>
                            <span className="text-[11px] font-semibold text-slate-700">Tax Clearance</span>
                          </label>

                          <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                            <input type="checkbox" checked={bidder.preliminaryCompliance?.vatRegistrationValid ?? true} onChange={(e) => updateCompliance(index, { vatRegistrationValid: e.target.checked })} className="w-4 h-4 text-cyan-600 rounded"/>
                            <span className="text-[11px] font-semibold text-slate-700">VAT Registration</span>
                          </label>

                          <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                            <input type="checkbox" checked={bidder.preliminaryCompliance?.ppaSupplierRegistrationValid ?? true} onChange={(e) => updateCompliance(index, { ppaSupplierRegistrationValid: e.target.checked })} className="w-4 h-4 text-cyan-600 rounded"/>
                            <span className="text-[11px] font-semibold text-slate-700">PPA Supplier List</span>
                          </label>

                          <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                            <input type="checkbox" checked={bidder.preliminaryCompliance?.bidSecuritySubmitted ?? true} onChange={(e) => updateCompliance(index, { bidSecuritySubmitted: e.target.checked })} className="w-4 h-4 text-cyan-600 rounded"/>
                            <span className="text-[11px] font-semibold text-slate-700">Bid Security / CPO</span>
                          </label>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 pt-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">CPO / Guarantee Amount ({bidder.currency})</label>
                            <input type="number" value={bidder.preliminaryCompliance?.bidSecurityAmount || ''} onChange={(e) => updateCompliance(index, { bidSecurityAmount: parseFloat(e.target.value) || 0 })} placeholder="e.g. 100000" className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"/>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Compliance Examination Remarks</label>
                            <input type="text" value={bidder.preliminaryCompliance?.complianceRemarks || ''} onChange={(e) => updateCompliance(index, { complianceRemarks: e.target.value })} placeholder="e.g. All legal credentials & CPO validated." className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"/>
                          </div>
                        </div>
                      </div>)}

                    {/* Section 2: Detailed Technical Scoring */}
                    {(activeStage === 'all' || activeStage === 'technical') && (<div className="p-4 bg-gradient-to-br from-cyan-50/40 via-sky-50/30 to-blue-50/40 rounded-2xl border border-cyan-200/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-600"/>
                            Stage 2: Technical Proposal Scoring (Water Engineering Criteria)
                          </h5>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600">Total Technical:</span>
                            <span className={`px-3 py-0.5 rounded-full text-xs font-black ${techPass ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                              {techTotal} / 100 pts ({techPass ? 'QUALIFIED' : 'FAILED THRESHOLD'})
                            </span>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-5 gap-3">
                          <div className="p-2.5 bg-white rounded-xl border border-cyan-100">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              1. Methodology &amp; Plan
                              <span className="text-[10px] text-cyan-600 block">(Max 25 pts)</span>
                            </label>
                            <input type="number" min="0" max="25" value={bidder.technicalScores?.methodologyScore ?? 20} onChange={(e) => updateTechnical(index, { methodologyScore: Math.min(25, Math.max(0, parseInt(e.target.value) || 0)) })} className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"/>
                          </div>

                          <div className="p-2.5 bg-white rounded-xl border border-cyan-100">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              2. Key Personnel
                              <span className="text-[10px] text-cyan-600 block">(Max 25 pts)</span>
                            </label>
                            <input type="number" min="0" max="25" value={bidder.technicalScores?.keyPersonnelScore ?? 20} onChange={(e) => updateTechnical(index, { keyPersonnelScore: Math.min(25, Math.max(0, parseInt(e.target.value) || 0)) })} className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"/>
                          </div>

                          <div className="p-2.5 bg-white rounded-xl border border-cyan-100">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              3. Drilling Equipment
                              <span className="text-[10px] text-cyan-600 block">(Max 20 pts)</span>
                            </label>
                            <input type="number" min="0" max="20" value={bidder.technicalScores?.equipmentAvailabilityScore ?? 16} onChange={(e) => updateTechnical(index, { equipmentAvailabilityScore: Math.min(20, Math.max(0, parseInt(e.target.value) || 0)) })} className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"/>
                          </div>

                          <div className="p-2.5 bg-white rounded-xl border border-cyan-100">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              4. Past Performance
                              <span className="text-[10px] text-cyan-600 block">(Max 20 pts)</span>
                            </label>
                            <input type="number" min="0" max="20" value={bidder.technicalScores?.pastPerformanceScore ?? 16} onChange={(e) => updateTechnical(index, { pastPerformanceScore: Math.min(20, Math.max(0, parseInt(e.target.value) || 0)) })} className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"/>
                          </div>

                          <div className="p-2.5 bg-white rounded-xl border border-cyan-100">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              5. Work Schedule
                              <span className="text-[10px] text-cyan-600 block">(Max 10 pts)</span>
                            </label>
                            <input type="number" min="0" max="10" value={bidder.technicalScores?.workScheduleScore ?? 8} onChange={(e) => updateTechnical(index, { workScheduleScore: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)) })} className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"/>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Technical Evaluators Consensus Comments</label>
                          <input type="text" value={bidder.technicalScores?.technicalEvaluatorComments || ''} onChange={(e) => updateTechnical(index, { technicalEvaluatorComments: e.target.value })} placeholder="e.g. Robust deep drilling rigs and proven track record across Oromia region." className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"/>
                        </div>
                      </div>)}

                    {/* Section 3: Financial Rectification & Pricing */}
                    {(activeStage === 'all' || activeStage === 'financial') && (<div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-600"/>
                          Stage 3: Financial Readout &amp; Arithmetic Rectification
                        </h5>

                        <div className="grid sm:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
                            <select value={bidder.currency} onChange={(e) => updateBidder(index, { currency: e.target.value })} className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 font-bold">
                              {CURRENCIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Readout Price (Public Bid Opening)</label>
                            <input type="number" value={bidder.readoutPrice} onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                updateBidder(index, { readoutPrice: val, correctedPrice: bidder.correctedPrice || val });
                            }} className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 font-mono font-bold"/>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Evaluated / Corrected Price</label>
                            <input type="number" value={bidder.correctedPrice} onChange={(e) => updateBidder(index, { correctedPrice: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-1.5 text-xs bg-white border border-cyan-300 rounded-xl focus:ring-2 focus:ring-cyan-500 font-mono font-bold text-cyan-900"/>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Engineer Budget Variance</label>
                            <div className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold font-mono text-slate-700 flex items-center justify-between">
                              <span>{variancePct ? `${variancePct}%` : 'N/A'}</span>
                              {variancePct && (<span className={`text-[10px] px-1.5 py-0.2 rounded ${parseFloat(variancePct) <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {parseFloat(variancePct) <= 0 ? 'Within Budget' : 'Above Budget'}
                                </span>)}
                            </div>
                          </div>
                        </div>
                      </div>)}
                  </div>)}
              </div>);
            })}
        </div>)}
    </div>);
};
