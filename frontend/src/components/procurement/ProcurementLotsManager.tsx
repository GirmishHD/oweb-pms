import React, { useState } from 'react';
import { ProcurementLot, Bidder } from '../../types';
import { formatCurrencyETB } from '../../utils/procurementThresholds';
import { Layers, Plus, Trash2, CheckCircle2, AlertTriangle, Sparkles, Building2 } from 'lucide-react';

interface ProcurementLotsManagerProps {
  lots: ProcurementLot[];
  onChange: (lots: ProcurementLot[]) => void;
  bidders?: Bidder[];
  totalProjectBudget?: number;
}

export const ProcurementLotsManager: React.FC<ProcurementLotsManagerProps> = ({
  lots = [],
  onChange,
  bidders = [],
  totalProjectBudget = 0
}) => {
  const [editingLotId, setEditingLotId] = useState<string | null>(null);

  const totalLotsBudget = lots.reduce((sum, lot) => sum + (lot.estimatedLotBudget || 0), 0);
  const budgetDifference = totalProjectBudget - totalLotsBudget;

  const handleAddLot = () => {
    const nextNum = lots.length + 1;
    const newLot: ProcurementLot = {
      id: `LOT-${Date.now()}-${nextNum}`,
      lotNumber: nextNum,
      lotTitle: `Lot ${nextNum}: Works & Supply Package`,
      scopeDescription: 'Construction, pipe laying, and installation works for the targeted scheme section.',
      estimatedLotBudget: totalProjectBudget > 0 && lots.length === 0 
        ? Math.round(totalProjectBudget) 
        : Math.round(totalProjectBudget / Math.max(1, lots.length + 1)),
      status: 'Open'
    };
    onChange([...lots, newLot]);
    setEditingLotId(newLot.id);
  };

  const handleUpdateLot = (index: number, updates: Partial<ProcurementLot>) => {
    const updated = [...lots];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleRemoveLot = (id: string) => {
    const remaining = lots.filter(l => l.id !== id).map((l, idx) => ({
      ...l,
      lotNumber: idx + 1
    }));
    onChange(remaining);
  };

  const handleApplyPreset = (presetType: 'standard_3lot' | 'borehole_solar_2lot') => {
    if (presetType === 'standard_3lot') {
      const b1 = Math.round(totalProjectBudget * 0.50) || 4000000;
      const b2 = Math.round(totalProjectBudget * 0.30) || 2400000;
      const b3 = Math.round(totalProjectBudget * 0.20) || 1600000;

      onChange([
        {
          id: `LOT-CW-${Date.now()}`,
          lotNumber: 1,
          lotTitle: 'Lot 1: Civil Works, Reservoir & Spring Intake',
          scopeDescription: 'Construction of 50m³ masonry/RC service reservoir, collection chamber, perimeter fencing, and caretaker lodge.',
          estimatedLotBudget: b1,
          status: 'Open'
        },
        {
          id: `LOT-EM-${Date.now()}`,
          lotNumber: 2,
          lotTitle: 'Lot 2: Electro-Mechanical Equipment & Solar Array',
          scopeDescription: 'Supply and installation of submersible pump, high-efficiency solar inverter, PV panels, and grounding protection.',
          estimatedLotBudget: b2,
          status: 'Open'
        },
        {
          id: `LOT-PIPE-${Date.now()}`,
          lotNumber: 3,
          lotTitle: 'Lot 3: Pressure Pipeline & Distribution Network',
          scopeDescription: 'Supply of HDPE/DCI pipes (OD 90mm-160mm PN16), trench excavation, backfilling, and 4 public tap water kiosks.',
          estimatedLotBudget: b3,
          status: 'Open'
        }
      ]);
    } else {
      const b1 = Math.round(totalProjectBudget * 0.65) || 5500000;
      const b2 = Math.round(totalProjectBudget * 0.35) || 3000000;

      onChange([
        {
          id: `LOT-DRILL-${Date.now()}`,
          lotNumber: 1,
          lotTitle: 'Lot 1: Deep Borehole Drilling & Well Casing (>250m)',
          scopeDescription: 'Drilling of 10-5/8" borehole, geophysical logging, stainless steel screen installation, gravel packing, and pumping test.',
          estimatedLotBudget: b1,
          status: 'Open'
        },
        {
          id: `LOT-SURFACE-${Date.now()}`,
          lotNumber: 2,
          lotTitle: 'Lot 2: Surface Distribution, Solar Power & Water Points',
          scopeDescription: 'Elevated tank construction, solar hybrid generator station, transmission line, and cattle drinking trough.',
          estimatedLotBudget: b2,
          status: 'Open'
        }
      ]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Preset Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-sky-50/70 p-4 rounded-2xl border border-sky-200">
        <div>
          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-600" />
            Multi-Lot Tender Packaging Structure
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Divide large water and sanitation projects into distinct specialized bidding lots (e.g. Civil Works, Electromechanical, Pipelines).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleApplyPreset('standard_3lot')}
            className="px-3 py-1.5 bg-white hover:bg-sky-100/70 text-cyan-800 border border-sky-300 rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            Auto-Split 3-Lot Standard
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('borehole_solar_2lot')}
            className="px-3 py-1.5 bg-white hover:bg-sky-100/70 text-cyan-800 border border-sky-300 rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            Auto-Split 2-Lot Hydro
          </button>
          <button
            type="button"
            onClick={handleAddLot}
            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Lot
          </button>
        </div>
      </div>

      {/* Budget Summary Banner */}
      {lots.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-white rounded-xl border border-sky-100 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-semibold block">Total Project Approved Budget</span>
            <span className="text-sm font-extrabold text-slate-900 font-mono">{formatCurrencyETB(totalProjectBudget)}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-sky-100 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-semibold block">Total Allocated Across Lots</span>
            <span className="text-sm font-extrabold text-cyan-800 font-mono">{formatCurrencyETB(totalLotsBudget)}</span>
          </div>
          <div className={`p-3 rounded-xl border shadow-2xs ${
            budgetDifference === 0 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : budgetDifference > 0 
              ? 'bg-sky-50 border-sky-200 text-sky-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <span className="text-[11px] font-semibold block">Unallocated / Balance</span>
            <span className="text-sm font-extrabold font-mono">
              {budgetDifference >= 0 ? `+${formatCurrencyETB(budgetDifference)}` : formatCurrencyETB(budgetDifference)}
            </span>
          </div>
        </div>
      )}

      {/* Lots List */}
      {lots.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6">
          <Layers className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">Single Tender Package (No Lots Configured)</p>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1">
            This procurement will be executed as a unified contract package. To divide it into multiple bidding lots, click &ldquo;Add Custom Lot&rdquo; or use an auto-split preset.
          </p>
          <button
            type="button"
            onClick={handleAddLot}
            className="mt-3 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Enable Multi-Lot Packaging
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lots.map((lot, idx) => (
            <div
              key={lot.id}
              className="bg-white p-4 rounded-2xl border border-sky-100 shadow-2xs hover:border-cyan-300 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-600 text-white text-xs font-black flex items-center justify-center">
                    {lot.lotNumber}
                  </span>
                  <input
                    type="text"
                    value={lot.lotTitle}
                    onChange={(e) => handleUpdateLot(idx, { lotTitle: e.target.value })}
                    className="text-xs font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-cyan-500 focus:bg-slate-50 px-1 py-0.5 rounded outline-none transition-all w-72 sm:w-96"
                    placeholder="Lot Title"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={lot.status}
                    onChange={(e) => handleUpdateLot(idx, { status: e.target.value as any })}
                    className="text-[11px] font-bold px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                  >
                    <option value="Open">Status: Open</option>
                    <option value="Evaluated">Status: Evaluated</option>
                    <option value="Awarded">Status: Awarded</option>
                    <option value="Cancelled">Status: Cancelled</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveLot(lot.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove Lot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Lot Scope &amp; Specifications</label>
                  <textarea
                    rows={2}
                    value={lot.scopeDescription}
                    onChange={(e) => handleUpdateLot(idx, { scopeDescription: e.target.value })}
                    className="w-full text-xs bg-slate-50/80 border border-slate-200 rounded-xl p-2 focus:ring-1 focus:ring-cyan-500 text-slate-800 resize-none"
                    placeholder="Describe specific civil, electromechanical, or pipeline works included in this lot..."
                  />
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Allocated Budget (ETB)</label>
                    <input
                      type="number"
                      value={lot.estimatedLotBudget || ''}
                      onChange={(e) => handleUpdateLot(idx, { estimatedLotBudget: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:ring-1 focus:ring-cyan-500 text-cyan-900"
                      placeholder="e.g. 3500000"
                    />
                  </div>

                  {bidders.length > 0 && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Awarded Bidder for Lot</label>
                      <select
                        value={lot.awardedBidderId || ''}
                        onChange={(e) => {
                          const bid = bidders.find(b => b.id === e.target.value);
                          handleUpdateLot(idx, { 
                            awardedBidderId: e.target.value || undefined,
                            awardedBidderName: bid?.name || undefined,
                            awardedAmount: bid ? bid.correctedPrice : undefined,
                            status: e.target.value ? 'Awarded' : lot.status
                          });
                        }}
                        className="w-full text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-slate-800"
                      >
                        <option value="">-- No Awardee Assigned --</option>
                        {bidders.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({formatCurrencyETB(b.correctedPrice)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
