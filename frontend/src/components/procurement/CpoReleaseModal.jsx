import React, { useState } from 'react';
import { formatCurrencyETB } from '../../utils/procurementThresholds';
import { ShieldCheck, X, CheckCircle2 } from 'lucide-react';
export const CpoReleaseModal = ({ isOpen, onClose, security, onUpdateSecurity }) => {
    const [mode, setMode] = useState('release');
    const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [releaseReason, setReleaseReason] = useState('Tender Concluded / Performance Security Substituted');
    const [recipientName, setRecipientName] = useState('Authorized Company Agent');
    const [recipientIdNumber, setRecipientIdNumber] = useState('ETH-ID-');
    const [dispatchRef, setDispatchRef] = useState(`OWEB/CPO-REL/${Date.now().toString().slice(-5)}`);
    const [newExpiryDate, setNewExpiryDate] = useState(new Date(new Date(security.expiryDate).getTime() + 60 * 86400000).toISOString().split('T')[0]);
    const [extensionRef, setExtensionRef] = useState(`BANK-EXT/${security.guaranteeNumber}`);
    if (!isOpen)
        return null;
    const handleConfirmRelease = (e) => {
        e.preventDefault();
        if (mode === 'release') {
            onUpdateSecurity({
                ...security,
                status: 'Released / Returned',
                releaseDate,
                remarks: `Released on ${releaseDate} via ref ${dispatchRef}. Handed to ${recipientName} (ID: ${recipientIdNumber}). Reason: ${releaseReason}`
            });
        }
        else {
            onUpdateSecurity({
                ...security,
                expiryDate: newExpiryDate,
                status: 'Active / Valid',
                remarks: `Extended to ${newExpiryDate} under bank amendment ${extensionRef}.`
            });
        }
        onClose();
    };
    const handlePrintSlip = () => {
        window.print();
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-sky-200 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#06203c] via-[#083359] to-[#041a30] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-300 rounded-2xl border border-cyan-400/30">
              <ShieldCheck className="w-5 h-5"/>
            </div>
            <div>
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">
                CPO Guarantee Vault Operation
              </span>
              <h3 className="text-base font-black tracking-tight text-white">
                {mode === 'release' ? 'Release & Return Bid Security' : 'Extend Security Guarantee Validity'}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-sky-200 hover:text-white hover:bg-cyan-900/50 rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2">
          <button type="button" onClick={() => setMode('release')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${mode === 'release' ? 'bg-cyan-700 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            Release / Return Guarantee
          </button>
          <button type="button" onClick={() => setMode('extend')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${mode === 'extend' ? 'bg-cyan-700 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            Extend Bank Expiry Date
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmRelease} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Security Summary Card */}
          <div className="p-3 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-slate-900">{security.bidderName}</span>
              <span className="font-mono font-black text-cyan-950">{formatCurrencyETB(security.amountETB)}</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Ref: {security.guaranteeNumber} &bull; Bank: {security.issuingBankOrInstitution}
            </p>
            <p className="text-[11px] text-slate-600">
              Current Expiry: <strong className="font-mono">{security.expiryDate}</strong>
            </p>
          </div>

          {mode === 'release' ? (<div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Release Reason</label>
                <select value={releaseReason} onChange={(e) => setReleaseReason(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none">
                  <option value="Tender Concluded / Performance Security Substituted">Tender Concluded / Performance Security Substituted</option>
                  <option value="Non-responsive Bidder / Tender Disqualification">Non-responsive Bidder / Tender Disqualification</option>
                  <option value="Tender Cancelled by Bureau">Tender Cancelled by Bureau</option>
                  <option value="Standstill Period Concluded Without Award">Standstill Period Concluded Without Award</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Release Date</label>
                  <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dispatch Voucher Ref</label>
                  <input type="text" value={dispatchRef} onChange={(e) => setDispatchRef(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 font-mono focus:outline-none"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Recipient Representative</label>
                  <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Recipient ID / Passport</label>
                  <input type="text" value={recipientIdNumber} onChange={(e) => setRecipientIdNumber(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none"/>
                </div>
              </div>
            </div>) : (<div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">New Extended Expiry Date</label>
                <input type="date" value={newExpiryDate} onChange={(e) => setNewExpiryDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none"/>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bank Extension Letter Reference</label>
                <input type="text" value={extensionRef} onChange={(e) => setExtensionRef(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 font-mono focus:outline-none"/>
              </div>
            </div>)}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer">
              Cancel
            </button>

            <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
              <CheckCircle2 className="w-4 h-4"/>
              <span>{mode === 'release' ? 'Confirm Release' : 'Save Extended Validity'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>);
};
