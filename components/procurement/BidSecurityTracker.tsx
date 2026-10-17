import React, { useState } from 'react';
import { BidSecurityItem, Bidder } from '../../types';
import { formatCurrencyETB, getBidSecurityStatus } from '../../utils/procurementThresholds';
import { ShieldCheck, Plus, AlertTriangle, CheckCircle, Clock, Trash2, ArrowUpRight, RotateCcw, Ban } from 'lucide-react';

interface BidSecurityTrackerProps {
  bidSecurities: BidSecurityItem[];
  onChange: (securities: BidSecurityItem[]) => void;
  bidders?: Bidder[];
  tenderEstimatedBudget?: number;
}

const ETHIOPIAN_BANKS = [
  'Commercial Bank of Ethiopia (CBE)',
  'Cooperative Bank of Oromia (Coop)',
  'Awash International Bank',
  'Dashen Bank SC',
  'Oromia Bank (OB)',
  'Bank of Abyssinia',
  'Nib International Bank',
  'Hibret Bank SC',
  'Wegagen Bank',
  'Zemen Bank',
  'Sinqee Bank'
];

export const BidSecurityTracker: React.FC<BidSecurityTrackerProps> = ({
  bidSecurities = [],
  onChange,
  bidders = [],
  tenderEstimatedBudget = 0
}) => {
  const [selectedBidderId, setSelectedBidderId] = useState<string>('');

  const recommendedSecurityAmount = Math.round(tenderEstimatedBudget * 0.015); // standard 1.5%

  const handleAddSecurityForBidder = (bidder: Bidder) => {
    const defaultAmount = bidder.preliminaryCompliance?.bidSecurityAmount || recommendedSecurityAmount || 100000;
    const issueDate = new Date().toISOString().split('T')[0];
    const expiryDate = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]; // standard 90 days

    const newSec: BidSecurityItem = {
      id: `CPO-${Date.now()}-${bidder.id.slice(-4)}`,
      bidderId: bidder.id,
      bidderName: bidder.name,
      guaranteeType: 'Bank Guarantee / CPO',
      issuingBankOrInstitution: 'Commercial Bank of Ethiopia (CBE)',
      guaranteeNumber: `CPO-${Math.floor(100000 + Math.random() * 900000)}/2025`,
      amountETB: defaultAmount,
      issueDate,
      expiryDate,
      status: 'Active / Valid',
      remarks: 'Verified during public bid opening session.'
    };

    onChange([...bidSecurities, newSec]);
  };

  const handleAddCustom = () => {
    const issueDate = new Date().toISOString().split('T')[0];
    const expiryDate = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

    const newSec: BidSecurityItem = {
      id: `CPO-${Date.now()}`,
      bidderId: selectedBidderId || 'CUSTOM',
      bidderName: bidders.find(b => b.id === selectedBidderId)?.name || 'Registered Bidder Firm',
      guaranteeType: 'Bank Guarantee / CPO',
      issuingBankOrInstitution: 'Commercial Bank of Ethiopia (CBE)',
      guaranteeNumber: `CPO-${Math.floor(100000 + Math.random() * 900000)}/2025`,
      amountETB: recommendedSecurityAmount || 150000,
      issueDate,
      expiryDate,
      status: 'Active / Valid',
      remarks: 'Certified bank guarantee submitted in sealed envelope.'
    };

    onChange([...bidSecurities, newSec]);
  };

  const handleUpdate = (index: number, updates: Partial<BidSecurityItem>) => {
    const updated = [...bidSecurities];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleRemove = (id: string) => {
    onChange(bidSecurities.filter(s => s.id !== id));
  };

  const handleAutoPopulateFromBidders = () => {
    if (bidders.length === 0) return;
    const existingBidderIds = new Set(bidSecurities.map(s => s.bidderId));
    const newItems: BidSecurityItem[] = [];

    bidders.forEach((bid, idx) => {
      if (!existingBidderIds.has(bid.id)) {
        const amount = bid.preliminaryCompliance?.bidSecurityAmount || recommendedSecurityAmount || 100000;
        const banks = ['Commercial Bank of Ethiopia (CBE)', 'Awash International Bank', 'Cooperative Bank of Oromia (Coop)'];
        newItems.push({
          id: `CPO-${Date.now()}-${idx}`,
          bidderId: bid.id,
          bidderName: bid.name,
          guaranteeType: 'Bank Guarantee / CPO',
          issuingBankOrInstitution: banks[idx % banks.length],
          guaranteeNumber: `CPO-${Math.floor(200000 + Math.random() * 800000)}/2025`,
          amountETB: amount,
          issueDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
          status: 'Active / Valid',
          remarks: 'Standard 90-day bank guarantee verified.'
        });
      }
    });

    if (newItems.length > 0) {
      onChange([...bidSecurities, ...newItems]);
    }
  };

  const handleReleaseAllUnsuccessful = (winningBidderId?: string) => {
    const updated = bidSecurities.map(s => {
      if (s.bidderId !== winningBidderId && s.status === 'Active / Valid') {
        return {
          ...s,
          status: 'Released / Returned' as const,
          remarks: `CPO released and returned following contract signing (Ref: OWEB/FIN/REL-${Date.now().toString().slice(-4)})`
        };
      }
      return s;
    });
    onChange(updated);
  };

  const expiringCount = bidSecurities.filter(s => {
    const st = getBidSecurityStatus(s.expiryDate);
    return st.status === 'Expiring Soon' || st.status === 'Expired';
  }).length;

  return (
    <div className="space-y-4">
      {/* Tracker Header */}
      <div className="bg-gradient-to-r from-cyan-900/10 via-sky-800/5 to-transparent p-4 rounded-2xl border border-cyan-200/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
            Bid Securities &amp; Bank Guarantee (CPO) Vault
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Monitor bank guarantee validity, expiry warnings (90-day mandatory window), and release CPOs upon tender award conclusion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {bidders.length > 0 && (
            <button
              type="button"
              onClick={handleAutoPopulateFromBidders}
              className="px-3 py-1.5 bg-white hover:bg-sky-50 text-cyan-800 border border-cyan-300 rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-600" />
              Sync from Registered Bidders
            </button>
          )}

          <button
            type="button"
            onClick={handleAddCustom}
            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Record New CPO / Security
          </button>
        </div>
      </div>

      {/* Expiry Alert Banner if any */}
      {expiringCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
            <span>
              <strong>Attention Required:</strong> {expiringCount} bid securities are expiring soon or have expired. Request extension letters from issuing banks immediately.
            </span>
          </div>
        </div>
      )}

      {/* Securities Grid / Table */}
      {bidSecurities.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">No Bid Securities Logged Yet</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
            Track bank guarantees, CPO numbers, and guarantee amounts submitted by participating bidders.
          </p>
          {bidders.length > 0 && (
            <button
              type="button"
              onClick={handleAutoPopulateFromBidders}
              className="mt-3 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Generate CPO Records for {bidders.length} Bidders
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {bidSecurities.map((sec, idx) => {
            const statusInfo = getBidSecurityStatus(sec.expiryDate);

            return (
              <div
                key={sec.id}
                className="bg-white p-4 rounded-2xl border border-sky-100 shadow-2xs hover:border-cyan-300 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-cyan-50 text-cyan-700 rounded-lg">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-900">{sec.bidderName}</h5>
                      <p className="text-[11px] text-slate-500 font-mono">Ref: {sec.guaranteeNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${statusInfo.colorClass}`}>
                      {statusInfo.status} ({statusInfo.daysRemaining} days left)
                    </span>

                    <select
                      value={sec.status}
                      onChange={(e) => handleUpdate(idx, { status: e.target.value as any })}
                      className="text-[11px] font-bold px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                    >
                      <option value="Active / Valid">Active / Valid</option>
                      <option value="Expiring Soon">Expiring Soon</option>
                      <option value="Expired">Expired</option>
                      <option value="Released / Returned">Released / Returned</option>
                      <option value="Forfeited">Forfeited</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemove(sec.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Issuing Bank</label>
                    <select
                      value={sec.issuingBankOrInstitution}
                      onChange={(e) => handleUpdate(idx, { issuingBankOrInstitution: e.target.value })}
                      className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800"
                    >
                      {ETHIOPIAN_BANKS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Guarantee Number</label>
                    <input
                      type="text"
                      value={sec.guaranteeNumber}
                      onChange={(e) => handleUpdate(idx, { guaranteeNumber: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Security Amount (ETB)</label>
                    <input
                      type="number"
                      value={sec.amountETB || ''}
                      onChange={(e) => handleUpdate(idx, { amountETB: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-cyan-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Expiry Date</label>
                    <input
                      type="date"
                      value={sec.expiryDate}
                      onChange={(e) => handleUpdate(idx, { expiryDate: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800"
                    />
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500 truncate max-w-md">{sec.remarks || 'Standard bank guarantee verified'}</span>
                  {sec.status === 'Active / Valid' && (
                    <button
                      type="button"
                      onClick={() => handleUpdate(idx, { 
                        status: 'Released / Returned',
                        remarks: `Released & returned to ${sec.bidderName} on ${new Date().toISOString().split('T')[0]}`
                      })}
                      className="text-cyan-700 hover:text-cyan-900 font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      Mark as Released &amp; Returned
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
