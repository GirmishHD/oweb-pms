import React, { useMemo } from 'react';
import { calculateLeadTimeDays, getBidSecurityStatus } from '../../utils/procurementThresholds';
import { Briefcase, Banknote, Clock, ShieldAlert, Scale, Award, FileCheck2, TrendingUp } from 'lucide-react';
export const ProcurementSummaryDashboard = ({ procurements = [], projects = [], onFilterByStage, onFilterByMethod }) => {
    const metrics = useMemo(() => {
        const totalTenders = procurements.length;
        const activeBidding = procurements.filter(p => p.tenderStage === 'Advertisement / Invitation' || p.tenderStage === 'Bid Opening' || (!p.tenderStage && !p.awardedBidderId)).length;
        const inEvaluation = procurements.filter(p => p.tenderStage === 'Technical & Financial Evaluation' || p.evaluationStatus === 'Technical Scoring' || p.evaluationStatus === 'Preliminary Evaluation').length;
        const awarded = procurements.filter(p => p.awardedBidderId || p.tenderStage === 'Notification of Award & Standstill' || p.tenderStage === 'Contract Signing').length;
        const signedContracts = procurements.filter(p => p.tenderStage === 'Contract Signing' || p.contractSigningDate).length;
        const totalValueETB = procurements.reduce((sum, p) => {
            const winner = p.bidders?.find(b => b.id === p.awardedBidderId);
            if (winner)
                return sum + (winner.correctedPrice || 0);
            const proj = (projects || []).find(pr => pr && pr.id === p.projectId);
            return sum + (p.estimatedBudgetETB || proj?.estimatedBudget || 0);
        }, 0);
        const leadTimes = [];
        procurements.forEach(p => {
            const start = p.publicationDate || p.biddingPeriodStart || p.bidIssuedDate;
            const end = p.awardDate || p.contractSigningDate;
            if (start && end) {
                const days = calculateLeadTimeDays(start, end);
                if (days > 0 && days < 365)
                    leadTimes.push(days);
            }
        });
        const avgLeadTime = leadTimes.length > 0
            ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length)
            : 42; // default standard Ethiopian NCB lead time
        let expiringSecuritiesCount = 0;
        procurements.forEach(p => {
            (p.bidSecurities || []).forEach(sec => {
                const st = getBidSecurityStatus(sec.expiryDate);
                if (st.status === 'Expiring Soon' || st.status === 'Expired') {
                    expiringSecuritiesCount++;
                }
            });
        });
        // Method Breakdown
        const methodCounts = {};
        procurements.forEach(p => {
            const m = p.procurementMethod || 'NCB';
            const key = m.includes('NCB') ? 'NCB'
                : m.includes('ICB') ? 'ICB'
                    : m.includes('RFQ') ? 'RFQ'
                        : m.includes('Direct') ? 'Direct'
                            : m.includes('QCBS') ? 'QCBS'
                                : 'Other';
            methodCounts[key] = (methodCounts[key] || 0) + 1;
        });
        // Type Breakdown
        const typeCounts = {};
        procurements.forEach(p => {
            typeCounts[p.procurementType] = (typeCounts[p.procurementType] || 0) + 1;
        });
        return {
            totalTenders,
            activeBidding,
            inEvaluation,
            awarded,
            signedContracts,
            totalValueETB,
            avgLeadTime,
            expiringSecuritiesCount,
            methodCounts,
            typeCounts
        };
    }, [procurements, projects]);
    return (<div className="space-y-4">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Allocated Value */}
        <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Procurement Portfolio Value
            </span>
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
              <Banknote className="w-5 h-5"/>
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {(metrics.totalValueETB / 1000000).toFixed(1)}M <span className="text-xs font-normal text-slate-500">ETB</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-cyan-700 font-semibold">
            <TrendingUp className="w-3.5 h-3.5"/>
            <span>{metrics.totalTenders} Tender Packages in Pipeline</span>
          </div>
        </div>

        {/* Card 2: Active Tenders & Bidding */}
        <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Active Floating &amp; Opening
            </span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Briefcase className="w-5 h-5"/>
            </div>
          </div>
          <p className="text-2xl font-black text-sky-900 mt-2 font-mono">
            {metrics.activeBidding}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-sky-700 font-semibold">
            <Scale className="w-3.5 h-3.5"/>
            <span>{metrics.inEvaluation} Under BEC Committee Scoring</span>
          </div>
        </div>

        {/* Card 3: Awarded & Signed */}
        <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Awarded &amp; Contract Signed
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="w-5 h-5"/>
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2 font-mono">
            {metrics.awarded}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-700 font-semibold">
            <FileCheck2 className="w-3.5 h-3.5"/>
            <span>{metrics.signedContracts} Converted to Active Contracts</span>
          </div>
        </div>

        {/* Card 4: Average Lead-Time & Security Warnings */}
        <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Avg Lead-Time / CPO Alerts
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5"/>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-black text-slate-900 font-mono">
              {metrics.avgLeadTime} <span className="text-xs font-normal text-slate-500">Days</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-amber-700">
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0"/>
            <span>{metrics.expiringSecuritiesCount} CPO Bank Guarantees Expiring Soon</span>
          </div>
        </div>
      </div>

      {/* Stage Breakdown Progression Strip */}
      <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Tender Packages by Execution Stage
          </h4>
          <span className="text-[11px] text-cyan-700 font-bold">{metrics.totalTenders} Total Packages</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { stage: 'Preparation', count: procurements.filter(p => p.tenderStage === 'Preparation' || (!p.tenderStage && !p.biddingPeriodStart)).length, color: 'bg-slate-100 text-slate-800' },
            { stage: 'Advertisement', count: procurements.filter(p => p.tenderStage === 'Advertisement / Invitation' || (p.biddingPeriodStart && !p.bidOpeningDate)).length, color: 'bg-sky-50 text-sky-800 border-sky-200' },
            { stage: 'Bid Opening', count: procurements.filter(p => p.tenderStage === 'Bid Opening' || (p.bidders.length > 0 && p.evaluationStatus === 'Preliminary Evaluation')).length, color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
            { stage: 'Evaluation', count: procurements.filter(p => p.tenderStage === 'Technical & Financial Evaluation' || p.evaluationStatus === 'Technical Scoring').length, color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
            { stage: 'Standstill', count: procurements.filter(p => p.tenderStage === 'Notification of Award & Standstill' || (p.awardedBidderId && p.standstillPeriod)).length, color: 'bg-amber-50 text-amber-800 border-amber-200' },
            { stage: 'Contract Signed', count: procurements.filter(p => p.tenderStage === 'Contract Signing' || p.contractSigningDate).length, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
        ].map(s => (<button key={s.stage} type="button" onClick={() => onFilterByStage && onFilterByStage(s.stage)} className={`p-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] cursor-pointer ${s.color}`}>
              <div className="text-[10px] font-semibold opacity-75 truncate">{s.stage}</div>
              <div className="text-lg font-black font-mono mt-0.5">{s.count}</div>
            </button>))}
        </div>
      </div>
    </div>);
};
