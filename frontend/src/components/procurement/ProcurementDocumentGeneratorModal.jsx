import React, { useState } from 'react';
import { formatCurrencyETB } from '../../utils/procurementThresholds';
import { FileText, Printer, X, Award, Megaphone, FolderOpen, FileSignature, ShieldCheck } from 'lucide-react';
export const ProcurementDocumentGeneratorModal = ({ isOpen, onClose, procurement, project }) => {
    const [selectedDocType, setSelectedDocType] = useState('ifb');
    const [copied, setCopied] = useState(false);
    if (!isOpen)
        return null;
    const winner = procurement.bidders?.find(b => b.id === procurement.awardedBidderId) || procurement.bidders?.[0];
    const totalAmount = winner?.correctedPrice || procurement.finalContractValueETB || procurement.estimatedBudgetETB || project?.estimatedBudget || 0;
    const performanceBondETB = Math.round(totalAmount * 0.10);
    const tenderRef = procurement.tenderReferenceNumber || procurement.id;
    const projectName = project?.name || `Scheme ${procurement.projectId}`;
    const location = project ? `${project.woreda} Woreda, ${project.zone} Zone, Oromia Region` : 'Oromia National Regional State';
    const todayFormatted = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const handlePrint = () => {
        window.print();
    };
    const handleCopyText = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-sky-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-[#06203c] via-[#083359] to-[#041a30] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-300 rounded-2xl border border-cyan-400/30">
              <FileText className="w-5 h-5"/>
            </div>
            <div>
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">
                Official Bureau Procurement Instruments
              </span>
              <h3 className="text-base font-black tracking-tight text-white">
                Standard Procurement Documents (SBD) &amp; Letters Generator
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
              <Printer className="w-4 h-4"/>
              <span>Print / Export PDF</span>
            </button>
            <button onClick={onClose} className="p-2 text-sky-200 hover:text-white hover:bg-cyan-900/50 rounded-xl transition-colors cursor-pointer">
              <X className="w-5 h-5"/>
            </button>
          </div>
        </div>

        {/* Document Selector Navigation */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          {[
            { id: 'ifb', label: '1. Invitation for Bids (IFB)', icon: <Megaphone className="w-3.5 h-3.5"/> },
            { id: 'opening_minutes', label: '2. Bid Opening Protocol', icon: <FolderOpen className="w-3.5 h-3.5"/> },
            { id: 'standstill_notice', label: '3. Intention to Award & Standstill', icon: <Award className="w-3.5 h-3.5"/> },
            { id: 'acceptance_letter', label: '4. Award & Acceptance Letter', icon: <FileSignature className="w-3.5 h-3.5"/> }
        ].map(tab => (<button key={tab.id} onClick={() => setSelectedDocType(tab.id)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${selectedDocType === tab.id
                ? 'text-cyan-900 border-cyan-600 bg-white shadow-2xs font-extrabold'
                : 'text-slate-500 border-transparent hover:text-slate-800'}`}>
              {tab.icon}
              {tab.label}
            </button>))}
        </div>

        {/* Scrollable Printable Document Canvas */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar bg-slate-100/60 text-slate-900">
          <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto font-serif text-slate-900 space-y-6 print:p-0 print:border-none print:shadow-none">
            {/* Bureau Letterhead */}
            <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1">
              <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-950">
                OROMIA WATER RESOURCE BUREAU (OWEB)
              </h2>
              <p className="text-xs font-bold text-slate-700 tracking-wider">
                Biiroo Qabeenya Bishaanii Oromiyaa &bull; የኦሮሚያ የውሃ ሀብት ቢሮ
              </p>
              <p className="text-[11px] font-sans text-slate-500">
                Study, Design, Construction &amp; Procurement Directorate &bull; P.O. Box 8630, Finfinnee / Addis Ababa, Ethiopia
              </p>
              <div className="pt-2 flex justify-between items-center text-[11px] font-sans text-slate-600 border-t border-slate-100">
                <span>Date: <strong>{todayFormatted}</strong></span>
                <span>Tender Ref: <strong className="font-mono">{tenderRef}</strong></span>
              </div>
            </div>

            {/* DOCUMENT 1: INVITATION FOR BIDS (IFB) */}
            {selectedDocType === 'ifb' && (<div className="space-y-4 text-xs font-sans leading-relaxed text-slate-800">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black uppercase text-slate-950 underline underline-offset-4">
                    SPECIFIC PROCUREMENT NOTICE (SPN) &mdash; INVITATION FOR BIDS (IFB)
                  </h3>
                  <p className="font-bold text-[11px] text-cyan-900">
                    National Competitive Bidding (NCB) &bull; Package: {tenderRef}
                  </p>
                </div>

                <p>
                  1. The <strong>Oromia Water Resource Bureau (OWEB)</strong> has allocated funds towards the capital budget for the implementation of sustainable water supply and sanitation infrastructure, and intends to apply part of the proceeds towards eligible payments under the contract for:
                </p>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-sans">
                  <p><strong>Project Name:</strong> {projectName}</p>
                  <p><strong>Location:</strong> {location}</p>
                  <p><strong>Procurement Category:</strong> {procurement.procurementType}</p>
                  <p><strong>Estimated Budget:</strong> {formatCurrencyETB(procurement.estimatedBudgetETB || project?.estimatedBudget || 0)}</p>
                </div>

                <p>
                  2. The OWEB now invites sealed bids from eligible, competent, and certified water works contractors (WWCs) or suppliers holding renewed business licenses, valid tax clearance certificates, VAT registration certificates, and active registration on the Ethiopian Public Procurement and Property Administration Agency (PPA) supplier list.
                </p>

                <p>
                  3. Bidding will be conducted through the <strong>{procurement.procurementMethod || 'National Competitive Bidding (NCB)'}</strong> procedures specified in the Ethiopian Federal Public Procurement Directive and is open to all qualified domestic bidders.
                </p>

                <p>
                  4. A complete set of Bidding Documents in English may be inspected and purchased by interested bidders upon payment of a non-refundable fee of <strong>500.00 ETB</strong> at OWEB Procurement Directorate, 4th Floor, Finfinnee.
                </p>

                <p>
                  5. All bids must be accompanied by an unconditional <strong>Bid Security (CPO / Bank Guarantee)</strong> of not less than <strong>{formatCurrencyETB(Math.round((procurement.estimatedBudgetETB || project?.estimatedBudget || 10000000) * 0.015))}</strong> in the name of Oromia Water Resource Bureau.
                </p>

                <p>
                  6. Bids must be delivered to the address below on or before <strong>{procurement.biddingPeriodEnd || '21 calendar days from publication'}</strong> at 10:00 AM local time. Bids will be publicly opened in the presence of bidders&apos; designated representatives at 10:30 AM on the same date.
                </p>

                <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs">
                  <div>
                    <p className="font-bold">Procurement &amp; Property Directorate</p>
                    <p className="text-slate-500">Oromia Water Resource Bureau</p>
                  </div>
                  <div className="text-center">
                    <div className="w-32 border-b border-slate-400 mb-1"/>
                    <p className="text-[10px] text-slate-500">Official Bureau Stamp</p>
                  </div>
                </div>
              </div>)}

            {/* DOCUMENT 2: BID OPENING PROTOCOL */}
            {selectedDocType === 'opening_minutes' && (<div className="space-y-4 text-xs font-sans leading-relaxed text-slate-800">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black uppercase text-slate-950 underline underline-offset-4">
                    FORMAL PROTOCOL OF PUBLIC BID OPENING SESSION
                  </h3>
                  <p className="font-bold text-[11px] text-cyan-900">
                    Session Convened on: {procurement.bidOpeningDate || todayFormatted} &bull; Ref: {tenderRef}
                  </p>
                </div>

                <p>
                  The Bid Evaluation Committee (BEC) and tender attendees convened at the OWEB Main Procurement Conference Hall for the public bid opening session. All received outer envelopes were examined in public view, confirmed intact and sealed prior to opening.
                </p>

                {/* Table of bids received */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">No.</th>
                        <th className="p-2.5">Bidder Name</th>
                        <th className="p-2.5">Original Readout Price (ETB)</th>
                        <th className="p-2.5">Bid Security (CPO) Submitted</th>
                        <th className="p-2.5">Envelope Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(procurement.bidders || []).map((b, idx) => (<tr key={b.id}>
                          <td className="p-2.5 font-bold">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900">{b.name}</td>
                          <td className="p-2.5 font-mono font-bold text-cyan-950">{formatCurrencyETB(b.readoutPrice)}</td>
                          <td className="p-2.5 text-emerald-700 font-semibold">CPO Verified Valid</td>
                          <td className="p-2.5 text-slate-600">Sealed &amp; Signed</td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] text-slate-600 italic">
                  Note: The read-out prices and CPO guarantees are subject to detailed arithmetical verification, legal compliance, and technical scoring by the appointed Bid Evaluation Committee.
                </p>

                <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200 text-center text-xs">
                  <div>
                    <div className="border-b border-slate-400 mb-1 h-8"/>
                    <p className="font-bold">BEC Chairperson</p>
                    <p className="text-[10px] text-slate-500">Signature &amp; Date</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 mb-1 h-8"/>
                    <p className="font-bold">BEC Secretary</p>
                    <p className="text-[10px] text-slate-500">Signature &amp; Date</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 mb-1 h-8"/>
                    <p className="font-bold">Bidder Representative</p>
                    <p className="text-[10px] text-slate-500">Observer Signature</p>
                  </div>
                </div>
              </div>)}

            {/* DOCUMENT 3: STANDSTILL NOTICE */}
            {selectedDocType === 'standstill_notice' && (<div className="space-y-4 text-xs font-sans leading-relaxed text-slate-800">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black uppercase text-slate-950 underline underline-offset-4">
                    NOTIFICATION OF INTENTION TO AWARD &amp; STANDSTILL NOTICE
                  </h3>
                  <p className="font-bold text-[11px] text-emerald-800">
                    Pursuant to Ethiopian Public Procurement Proclamation No. 649/2009
                  </p>
                </div>

                <p>
                  To: <strong>All Participating Bidders for Tender Ref: {tenderRef}</strong>
                </p>

                <p>
                  This is to notify you that the Oromia Water Resource Bureau (OWEB) has concluded the preliminary, technical, and financial evaluation for the procurement of <strong>{projectName}</strong>.
                </p>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs">
                  <h4 className="font-extrabold text-emerald-950">Recommended Successful Bidder:</h4>
                  <p><strong>Contractor Name:</strong> {winner?.name || 'Pending Award Decision'}</p>
                  <p><strong>Evaluated Responsive Price:</strong> <span className="font-mono font-bold text-emerald-900">{formatCurrencyETB(totalAmount)}</span></p>
                  <p><strong>Combined Technical &amp; Financial Score:</strong> {winner?.technicalScores?.totalTechnicalScore || 85}% (Rank 1)</p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700"/>
                    Mandatory Standstill Period (7 Working Days)
                  </h4>
                  <p className="text-[11px] text-amber-900">
                    The standstill period begins on <strong>{procurement.standstillStartDate || todayFormatted}</strong> and concludes on <strong>{procurement.standstillEndDate || '7 days hence'}</strong> at 5:00 PM. No contract shall be executed prior to the expiry of the standstill period. Bidders wishing to request debriefing or submit an administrative appeal may do so in writing within this timeframe.
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs">
                  <div>
                    <p className="font-bold">Director General / Bureau Head</p>
                    <p className="text-slate-500">Oromia Water Resource Bureau</p>
                  </div>
                  <div className="text-center">
                    <div className="w-32 border-b border-slate-400 mb-1"/>
                    <p className="text-[10px] text-slate-500">Seal &amp; Signature</p>
                  </div>
                </div>
              </div>)}

            {/* DOCUMENT 4: ACCEPTANCE LETTER */}
            {selectedDocType === 'acceptance_letter' && (<div className="space-y-4 text-xs font-sans leading-relaxed text-slate-800">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black uppercase text-slate-950 underline underline-offset-4">
                    LETTER OF ACCEPTANCE &amp; FORMAL AWARD NOTIFICATION
                  </h3>
                  <p className="font-bold text-[11px] text-teal-800">
                    Ref: OWEB/AWD/{tenderRef.replace(/[^A-Za-z0-9]/g, '-')}
                  </p>
                </div>

                <p>
                  To: <strong>{winner?.name || 'Awarded Contractor Firm'}</strong><br />
                  Address: {winner?.address || 'Finfinnee / Adama, Oromia Special Zone, Ethiopia'}
                </p>

                <p>
                  This is to notify you that your Tender dated <strong>{procurement.bidOpeningDate || todayFormatted}</strong> for execution of <strong>{projectName}</strong> ({tenderRef}) for the accepted contract amount of <strong>{formatCurrencyETB(totalAmount)}</strong> inclusive of all applicable VAT and taxes, is hereby accepted by our Bureau.
                </p>

                <p>
                  You are hereby instructed in accordance with the Instructions to Bidders to:
                </p>

                <ol className="list-decimal list-inside space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <li>
                    Furnish an unconditional <strong>Performance Security Bond</strong> equal to <strong>10%</strong> of the contract amount (ETB <strong>{formatCurrencyETB(performanceBondETB)}</strong>) issued by a reputable commercial bank licensed by the National Bank of Ethiopia within <strong>fifteen (15) calendar days</strong> of receipt of this letter.
                  </li>
                  <li>
                    Present yourself or your authorized legal representative to the OWEB Head Office to formally sign and seal the Contract Agreement.
                  </li>
                </ol>

                <p className="text-rose-700 font-bold">
                  Failure to furnish the performance security or sign the contract agreement within the stipulated deadline shall constitute sufficient grounds for the annulment of the award and forfeiture of the Bid Security (CPO).
                </p>

                <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs">
                  <div>
                    <p className="font-bold">Authorized Directorate Representative</p>
                    <p className="text-slate-500">Oromia Water Resource Bureau</p>
                  </div>
                  <div className="text-center">
                    <div className="w-32 border-b border-slate-400 mb-1"/>
                    <p className="text-[10px] text-slate-500">Official Seal</p>
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </div>
    </div>);
};
