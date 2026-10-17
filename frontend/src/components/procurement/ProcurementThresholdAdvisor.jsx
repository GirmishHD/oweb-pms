import React, { useState, useMemo } from 'react';
import { formatCurrencyETB } from '../../utils/procurementThresholds';
import { Scale, CheckCircle2, BookOpen, ShieldCheck, ArrowRight, Calculator } from 'lucide-react';
export const ProcurementThresholdAdvisor = ({ onApplyParameters }) => {
    const [procurementCategory, setProcurementCategory] = useState('Works');
    const [fundingSource, setFundingSource] = useState('Regional Capital Budget');
    const [budgetETB, setBudgetETB] = useState(35000000); // 35 Million ETB default
    // Assessment Logic based on Ethiopian Public Procurement Directive & Proclamation No. 649/2009
    const evaluation = useMemo(() => {
        let permissibleMethod = 'National Competitive Bidding (NCB)';
        let minFloatingDays = 21;
        let maxFloatingDays = 30;
        let minCpoPercent = 1;
        let maxCpoPercent = 2;
        let maxCpoCapETB = 500000;
        let approvalLevel = 'OWEB Tender Endorsement Board';
        let legalCitation = 'Federal Public Procurement Directive & Regional Proclamation';
        let recommendations = [];
        let isInternational = false;
        let isShopping = false;
        let isDirect = false;
        if (procurementCategory === 'Works') {
            if (budgetETB > 50000000) {
                permissibleMethod = 'International Competitive Bidding (ICB)';
                isInternational = true;
                minFloatingDays = 45;
                maxFloatingDays = 60;
                minCpoPercent = 0.5;
                maxCpoPercent = 1.5;
                maxCpoCapETB = null;
                approvalLevel = 'Regional Bureau Head & Federal PPA Notification';
                legalCitation = 'Directive Art. 16.1 — Works exceeding ETB 50,000,000 mandate ICB';
                recommendations.push('Prepare Standard Bidding Documents (SBD) in English with international packaging.');
                recommendations.push('Publish notice in UNDB Online and international press alongside Ethiopian national gazette.');
            }
            else if (budgetETB <= 500000) {
                permissibleMethod = 'Request for Quotations (RFQ) / Shopping';
                isShopping = true;
                minFloatingDays = 7;
                maxFloatingDays = 10;
                minCpoPercent = 0;
                maxCpoPercent = 0;
                maxCpoCapETB = 0;
                approvalLevel = 'Directorate Director';
                legalCitation = 'Directive Art. 24 — Minor works under ETB 500,000 eligible for RFQ/Shopping';
                recommendations.push('Invite minimum of 3 vetted regional water contractors on local roster.');
            }
            else {
                permissibleMethod = 'National Competitive Bidding (NCB)';
                minFloatingDays = budgetETB > 10000000 ? 30 : 21;
                maxFloatingDays = 30;
                minCpoPercent = 1;
                maxCpoPercent = 2;
                maxCpoCapETB = 500000;
                approvalLevel = 'OWEB Tender Endorsement Board';
                legalCitation = 'Directive Art. 17 — Works between ETB 500,000 and ETB 50,000,000 governed by NCB';
                recommendations.push('Publish invitation in The Ethiopian Herald & Addis Zemen / regional e-GP.');
                recommendations.push('Mandate Grade 1 - Grade 4 Water Works Contractors (WWC) license certification.');
            }
        }
        else if (procurementCategory === 'Goods') {
            if (budgetETB > 10000000) {
                permissibleMethod = 'International Competitive Bidding (ICB)';
                isInternational = true;
                minFloatingDays = 45;
                maxFloatingDays = 60;
                minCpoPercent = 0.5;
                maxCpoPercent = 1.5;
                maxCpoCapETB = null;
                approvalLevel = 'Regional Bureau Head';
                legalCitation = 'Directive Art. 16.2 — Supply of Goods exceeding ETB 10,000,000 requires ICB';
                recommendations.push('Include international manufacturer authorization and ISO/CE pipe/pump test certificates.');
            }
            else if (budgetETB <= 150000) {
                permissibleMethod = 'Request for Quotations (RFQ) / Shopping';
                isShopping = true;
                minFloatingDays = 5;
                maxFloatingDays = 7;
                minCpoPercent = 0;
                maxCpoPercent = 0;
                maxCpoCapETB = 0;
                approvalLevel = 'Procurement Directorate Unit';
                legalCitation = 'Directive Art. 24 — Goods under ETB 150,000 eligible for direct Shopping';
            }
            else {
                permissibleMethod = 'National Competitive Bidding (NCB)';
                minFloatingDays = 15;
                maxFloatingDays = 21;
                minCpoPercent = 1;
                maxCpoPercent = 2;
                maxCpoCapETB = 250000;
                approvalLevel = 'OWEB Tender Endorsement Board';
                legalCitation = 'Directive Art. 17.2 — Goods between ETB 150,000 and ETB 10,000,000 governed by NCB';
            }
        }
        else if (procurementCategory === 'Consulting Services') {
            if (budgetETB > 2500000) {
                permissibleMethod = 'Quality and Cost Based Selection (QCBS)';
                minFloatingDays = 30;
                maxFloatingDays = 45;
                minCpoPercent = 0;
                maxCpoPercent = 0; // Bid securities rarely required for consultancy under PPA
                maxCpoCapETB = 0;
                approvalLevel = 'OWEB Evaluation Committee & Bureau Head';
                legalCitation = 'Directive Art. 28 — Consultancy services above ETB 2,500,000 mandate QCBS';
                recommendations.push('Adopt two-envelope technical and financial evaluation (80% Tech / 20% Financial weight).');
                recommendations.push('Require 70% minimum technical qualification threshold.');
            }
            else {
                permissibleMethod = 'Least Cost Selection (LCS)';
                minFloatingDays = 15;
                maxFloatingDays = 21;
                minCpoPercent = 0;
                maxCpoPercent = 0;
                maxCpoCapETB = 0;
                approvalLevel = 'Directorate Endorsement';
                legalCitation = 'Directive Art. 29 — Small consultancy assignments under ETB 2,500,000';
            }
        }
        else {
            // Non-consulting Services
            permissibleMethod = budgetETB > 5000000 ? 'International Competitive Bidding (ICB)' : 'National Competitive Bidding (NCB)';
            minFloatingDays = budgetETB > 5000000 ? 45 : 21;
            maxFloatingDays = 30;
            minCpoPercent = 1;
            maxCpoPercent = 2;
            maxCpoCapETB = 200000;
            legalCitation = 'Directive Art. 18 — Non-consulting services guidelines';
        }
        const recommendedCpoMin = isShopping || procurementCategory === 'Consulting Services' ? 0 : Math.round(budgetETB * (minCpoPercent / 100));
        const recommendedCpoMax = isShopping || procurementCategory === 'Consulting Services' ? 0 : Math.round(budgetETB * (maxCpoPercent / 100));
        const performanceSecurityETB = isShopping ? 0 : Math.round(budgetETB * 0.10); // 10%
        const maxAdvancePaymentETB = Math.round(budgetETB * 0.30); // 30%
        return {
            permissibleMethod,
            minFloatingDays,
            maxFloatingDays,
            recommendedCpoMin,
            recommendedCpoMax,
            maxCpoCapETB,
            performanceSecurityETB,
            maxAdvancePaymentETB,
            approvalLevel,
            legalCitation,
            recommendations,
            isInternational,
            isShopping
        };
    }, [procurementCategory, fundingSource, budgetETB]);
    return (<div className="space-y-6 animate-fade-in text-slate-800">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 text-cyan-700 rounded-2xl border border-cyan-200">
              <Scale className="w-6 h-6"/>
            </div>
            <div>
              <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">
                Statutory Regulatory Engine
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Ethiopian PPA &amp; OWEB Procurement Threshold Advisor
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-xs font-bold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5"/>
              Proc. No. 649/2009 &amp; Directive 2016
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 max-w-3xl">
          Interactive threshold validator providing automated regulatory clearance, permissible method classification, mandatory advertisement floating windows, CPO bank guarantee parameters, and 10% performance bond computation.
        </p>
      </div>

      {/* Interactive Parameters Workbench */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Inputs */}
        <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-2xs space-y-5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calculator className="w-4 h-4 text-cyan-600"/>
            1. Package Input Parameters
          </h4>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Procurement Category</label>
            <div className="grid grid-cols-2 gap-2">
              {['Works', 'Goods', 'Consulting Services', 'Non-consulting Services'].map(cat => (<button key={cat} type="button" onClick={() => setProcurementCategory(cat)} className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${procurementCategory === cat
                ? 'bg-cyan-50 border-cyan-400 text-cyan-900 ring-2 ring-cyan-500/20 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                  {cat}
                </button>))}
            </div>
          </div>

          {/* Budget Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Estimated Budget (ETB)</label>
              <span className="text-[10px] font-mono text-cyan-800 font-extrabold">
                {formatCurrencyETB(budgetETB)}
              </span>
            </div>
            <input type="number" min={10000} step={100000} value={budgetETB} onChange={(e) => setBudgetETB(Math.max(0, Number(e.target.value)))} className="w-full text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"/>
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
            { label: '450K (RFQ)', val: 450000 },
            { label: '8M (NCB Small)', val: 8000000 },
            { label: '35M (NCB Water)', val: 35000000 },
            { label: '65M (ICB Large)', val: 65000000 }
        ].map(p => (<button key={p.label} type="button" onClick={() => setBudgetETB(p.val)} className="px-2 py-1 bg-slate-100 hover:bg-sky-100 text-slate-600 hover:text-cyan-900 rounded-lg text-[10px] font-bold transition-all cursor-pointer">
                  {p.label}
                </button>))}
            </div>
          </div>

          {/* Funding Source */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Financing Modality</label>
            <select value={fundingSource} onChange={(e) => setFundingSource(e.target.value)} className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none">
              <option value="Regional Capital Budget">Regional Capital Budget (OWEB Treasury)</option>
              <option value="Federal Treasury">Federal Treasury (MoWE / PPA Matching)</option>
              <option value="World Bank / Development Partner">World Bank / Development Partner (WaSH / ONE WASH)</option>
            </select>
          </div>

          {/* Action Button */}
          {onApplyParameters && (<div className="pt-2">
              <button type="button" onClick={() => onApplyParameters(evaluation.permissibleMethod, procurementCategory, budgetETB)} className="w-full py-3 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer">
                <span>Initiate Tender With This Profile</span>
                <ArrowRight className="w-4 h-4"/>
              </button>
            </div>)}
        </div>

        {/* Right 2 Columns: Generated Assessment & Threshold Output */}
        <div className="lg:col-span-2 space-y-5">
          {/* Method Verdict Card */}
          <div className="bg-gradient-to-r from-[#06203c] via-[#083359] to-[#041a30] text-white p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400"/>
                Statutory Method Verdict
              </span>
              <span className="text-[11px] text-sky-200/80 font-mono">
                PPA Approved
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-black tracking-tight text-white">
                {evaluation.permissibleMethod}
              </h3>
              <p className="text-sky-200/90 text-xs mt-1">
                {evaluation.legalCitation}
              </p>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-cyan-900/60 text-xs">
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
                <span className="text-[10px] text-sky-200 block font-semibold">Min Floating Days</span>
                <span className="text-lg font-black text-white font-mono">{evaluation.minFloatingDays} Days</span>
              </div>

              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
                <span className="text-[10px] text-sky-200 block font-semibold">CPO Security Bond</span>
                <span className="text-sm font-black text-white font-mono">
                  {evaluation.recommendedCpoMin > 0 ? formatCurrencyETB(evaluation.recommendedCpoMin) : 'Exempt'}
                </span>
              </div>

              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
                <span className="text-[10px] text-sky-200 block font-semibold">Performance Bond (10%)</span>
                <span className="text-sm font-black text-white font-mono">
                  {evaluation.performanceSecurityETB > 0 ? formatCurrencyETB(evaluation.performanceSecurityETB) : 'N/A'}
                </span>
              </div>

              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
                <span className="text-[10px] text-sky-200 block font-semibold">Max Advance (30%)</span>
                <span className="text-sm font-black text-white font-mono">
                  {formatCurrencyETB(evaluation.maxAdvancePaymentETB)}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Compliance Matrix */}
          <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-2xs space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600"/>
              Statutory Requirement Matrix &amp; Governance Rules
            </h4>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-1">
                <span className="text-[10px] font-bold text-cyan-800 uppercase block">Endorsement Authority</span>
                <p className="font-extrabold text-slate-900">{evaluation.approvalLevel}</p>
                <p className="text-[11px] text-slate-500">Requires formal committee evaluation minutes endorsed by bureau board.</p>
              </div>

              <div className="p-3.5 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-1">
                <span className="text-[10px] font-bold text-cyan-800 uppercase block">Standstill Appeal Period</span>
                <p className="font-extrabold text-slate-900">7 Working Days (Mandatory)</p>
                <p className="text-[11px] text-slate-500">Notice of intention to award must be circulated to all bidders before signing.</p>
              </div>

              <div className="p-3.5 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-1">
                <span className="text-[10px] font-bold text-cyan-800 uppercase block">Bid Security Validity</span>
                <p className="font-extrabold text-slate-900">Bid Floating Period + 28 Days</p>
                <p className="text-[11px] text-slate-500">Bank guarantee / CPO must remain valid 28 days beyond bid validity date.</p>
              </div>

              <div className="p-3.5 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-1">
                <span className="text-[10px] font-bold text-cyan-800 uppercase block">Language &amp; Standard Bidding Document</span>
                <p className="font-extrabold text-slate-900">
                  {evaluation.isInternational ? 'English (International SBD)' : 'English / Afaan Oromoo / Amharic'}
                </p>
                <p className="text-[11px] text-slate-500">Adopt standard OWEB Water Supply &amp; Sanitation SBD templates.</p>
              </div>
            </div>

            {/* Recommendations List */}
            {evaluation.recommendations.length > 0 && (<div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1 text-xs">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Mandatory Execution Guidelines
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                  {evaluation.recommendations.map((rec, i) => (<li key={i}>{rec}</li>))}
                </ul>
              </div>)}
          </div>
        </div>
      </div>
    </div>);
};
