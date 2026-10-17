import React, { useState, useMemo } from 'react';
import { ICONS } from '../constants';
const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const formatCurrency = (val) => {
    if (!val)
        return '—';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val) + ' ETB';
};
const ContractTimeline = ({ contract }) => {
    const [timeScale, setTimeScale] = useState('month');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showCriticalOnly, setShowCriticalOnly] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);
    // Build comprehensive schedule items from contract data
    const scheduleItems = useMemo(() => {
        const items = [];
        const baseCommence = contract.commencementActualDate
            ? new Date(contract.commencementActualDate)
            : contract.commencementPlanDate
                ? new Date(contract.commencementPlanDate)
                : contract.signingDate
                    ? new Date(contract.signingDate)
                    : new Date();
        const baseCompletion = contract.completionDate
            ? new Date(contract.completionDate)
            : contract.plannedCompletionDate
                ? new Date(contract.plannedCompletionDate)
                : new Date(baseCommence.getTime() + 180 * 24 * 60 * 60 * 1000);
        // 1. Overall Contract Baseline Bar
        items.push({
            id: 'contract-baseline',
            title: `Contract Baseline: ${contract.contractor || 'General Works'}`,
            category: 'summary',
            startDate: baseCommence,
            endDate: baseCompletion,
            status: contract.completionDate ? 'completed' : 'in_progress',
            progressPercent: contract.completionDate ? 100 : 50,
            description: `Official contract duration: ${contract.contractNumber}`,
            isCriticalPath: true,
        });
        // 2. Key Milestones
        if (contract.signingDate) {
            const d = new Date(contract.signingDate);
            items.push({
                id: 'm-signing',
                title: '✍️ Contract Signing Date',
                category: 'milestone',
                startDate: d,
                endDate: new Date(d.getTime() + 2 * 24 * 60 * 60 * 1000),
                status: 'completed',
                progressPercent: 100,
                description: 'Formal contract agreement execution between OWEB and Contractor.',
                isCriticalPath: true,
            });
        }
        if (contract.commencementPlanDate || contract.commencementActualDate) {
            const start = contract.commencementActualDate ? new Date(contract.commencementActualDate) : new Date(contract.commencementPlanDate);
            items.push({
                id: 'm-commence',
                title: '🚀 Commencement Order Notice',
                category: 'milestone',
                startDate: start,
                endDate: new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000),
                status: contract.commencementActualDate ? 'completed' : 'pending',
                progressPercent: contract.commencementActualDate ? 100 : 0,
                description: 'Official notice to proceed issued to contractor.',
                isCriticalPath: true,
                predecessors: ['m-signing'],
            });
        }
        if (contract.siteHandoverPlanDate || contract.siteHandoverActualDate) {
            const start = contract.siteHandoverActualDate ? new Date(contract.siteHandoverActualDate) : new Date(contract.siteHandoverPlanDate);
            items.push({
                id: 'm-handover',
                title: '📍 Site Possession & Handover',
                category: 'milestone',
                startDate: start,
                endDate: new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000),
                status: contract.siteHandoverActualDate ? 'completed' : 'pending',
                progressPercent: contract.siteHandoverActualDate ? 100 : 0,
                description: 'Physical site boundary transfer with local Woreda WASH team.',
                isCriticalPath: true,
                predecessors: ['m-commence'],
            });
        }
        // 3. Contract Deliverables (WBS)
        if (contract.deliverables && contract.deliverables.length > 0) {
            contract.deliverables.forEach((del, idx) => {
                const delEnd = del.plannedCompletionDate ? new Date(del.plannedCompletionDate) : new Date(baseCommence.getTime() + (idx + 1) * 30 * 24 * 60 * 60 * 1000);
                const delStart = new Date(delEnd.getTime() - 28 * 24 * 60 * 60 * 1000);
                const isCompleted = !!del.actualCompletionDate;
                const isCrit = idx === 0 || idx === contract.deliverables.length - 1;
                items.push({
                    id: del.id || `del-${idx}`,
                    title: `📦 ${del.name || 'Deliverable ' + (idx + 1)}`,
                    category: 'deliverable',
                    startDate: delStart,
                    endDate: delEnd,
                    status: isCompleted ? 'completed' : isCrit ? 'critical' : 'in_progress',
                    progressPercent: isCompleted ? 100 : 50,
                    description: `Category: ${del.category} • Priority: ${del.priority}`,
                    isCriticalPath: isCrit,
                    predecessors: idx > 0 ? [`del-${idx - 1}`] : ['m-handover'],
                });
            });
        }
        else {
            // Default synthesized water project deliverables if none entered yet
            const defaultStages = [
                { name: 'Site Mobilization & Camp Setup', daysFromStart: 15, duration: 15, crit: true },
                { name: 'Civil Works & Reservoir Foundation', daysFromStart: 30, duration: 45, crit: true },
                { name: 'Pipe Laying & Distribution Network', daysFromStart: 60, duration: 60, crit: true },
                { name: 'Electro-Mechanical Equipment Installation', daysFromStart: 110, duration: 35, crit: false },
                { name: 'Testing, Disinfection & Water Commissioning', daysFromStart: 140, duration: 25, crit: true },
                { name: 'Final Inspection & Provisional Acceptance', daysFromStart: 165, duration: 15, crit: true },
            ];
            defaultStages.forEach((stage, idx) => {
                const st = new Date(baseCommence.getTime() + stage.daysFromStart * 24 * 60 * 60 * 1000);
                const et = new Date(st.getTime() + stage.duration * 24 * 60 * 60 * 1000);
                const isPast = et.getTime() < Date.now();
                items.push({
                    id: `stage-${idx}`,
                    title: `📦 ${stage.name}`,
                    category: 'deliverable',
                    startDate: st,
                    endDate: et,
                    status: isPast ? 'completed' : idx === 1 ? 'in_progress' : stage.crit ? 'critical' : 'pending',
                    progressPercent: isPast ? 100 : idx === 1 ? 55 : 0,
                    description: `Standard WBS work package for water scheme execution`,
                    isCriticalPath: stage.crit,
                });
            });
        }
        // 4. Variations & Time Extensions
        if (contract.variations && contract.variations.length > 0) {
            contract.variations.forEach((v, idx) => {
                if (v.status === 'Approved' && (v.timeImpactDays || 0) > 0) {
                    const vStart = baseCompletion;
                    const vEnd = new Date(vStart.getTime() + (v.timeImpactDays || 30) * 24 * 60 * 60 * 1000);
                    items.push({
                        id: v.id || `var-${idx}`,
                        title: `⚡ VO #${idx + 1}: ${v.description || 'Approved Time Extension'} (+${v.timeImpactDays} days)`,
                        category: 'variation',
                        startDate: vStart,
                        endDate: vEnd,
                        status: 'critical',
                        progressPercent: 0,
                        description: `Approved variation: cost impact ${formatCurrency(v.costImpact)} with ${v.timeImpactDays} days extension.`,
                        isCriticalPath: true,
                        predecessors: ['contract-baseline'],
                    });
                }
            });
        }
        return items;
    }, [contract]);
    // Calculate timeline bounds
    const { minDate, maxDate, totalTimeSpan } = useMemo(() => {
        if (scheduleItems.length === 0) {
            const now = new Date();
            return { minDate: now, maxDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000), totalTimeSpan: 180 * 24 * 60 * 60 * 1000 };
        }
        let min = scheduleItems[0].startDate.getTime();
        let max = scheduleItems[0].endDate.getTime();
        scheduleItems.forEach(item => {
            if (item.startDate.getTime() < min)
                min = item.startDate.getTime();
            if (item.endDate.getTime() > max)
                max = item.endDate.getTime();
        });
        // Add 5% padding
        const span = max - min;
        const pad = Math.max(span * 0.05, 7 * 24 * 60 * 60 * 1000);
        return {
            minDate: new Date(min - pad),
            maxDate: new Date(max + pad),
            totalTimeSpan: (max + pad) - (min - pad),
        };
    }, [scheduleItems]);
    // Compute ticks for time header
    const timeTicks = useMemo(() => {
        const ticks = [];
        const start = new Date(minDate);
        start.setDate(1); // align to month start
        const cur = new Date(start);
        while (cur.getTime() <= maxDate.getTime()) {
            const leftPercent = ((cur.getTime() - minDate.getTime()) / totalTimeSpan) * 100;
            if (leftPercent >= 0 && leftPercent <= 100) {
                ticks.push({
                    label: cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                    date: new Date(cur),
                    leftPercent,
                });
            }
            // Increment by month
            cur.setMonth(cur.getMonth() + (timeScale === 'quarter' ? 3 : 1));
        }
        return ticks;
    }, [minDate, maxDate, totalTimeSpan, timeScale]);
    const getPositionPercent = (date) => {
        const p = ((date.getTime() - minDate.getTime()) / totalTimeSpan) * 100;
        return Math.max(0, Math.min(100, p));
    };
    const todayPercent = getPositionPercent(new Date());
    // Filter items
    const filteredItems = useMemo(() => {
        return scheduleItems.filter(item => {
            if (showCriticalOnly && !item.isCriticalPath)
                return false;
            if (filterCategory === 'milestones' && item.category !== 'milestone')
                return false;
            if (filterCategory === 'deliverables' && item.category !== 'deliverable')
                return false;
            if (filterCategory === 'variations' && item.category !== 'variation')
                return false;
            return true;
        });
    }, [scheduleItems, showCriticalOnly, filterCategory]);
    const criticalItemsCount = scheduleItems.filter(i => i.isCriticalPath).length;
    return (<div className="space-y-4">
            {/* Header & Controls */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-primary-600 font-bold">{ICONS.calendar}</span>
                            <h4 className="font-bold text-slate-800 text-sm">Contract Deliverables & Milestone Schedule Matrix</h4>
                            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-primary-50 text-primary-700 rounded-full border border-primary-200">
                                WBS & Critical Path
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Contractor: <strong className="text-slate-700">{contract.contractor || 'Assigned Firm'}</strong> • Ref: {contract.contractNumber}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Critical Path Toggle */}
                        <button type="button" onClick={() => setShowCriticalOnly(prev => !prev)} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${showCriticalOnly
            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>
                            <span>⚡</span>
                            <span>Critical Path Only ({criticalItemsCount})</span>
                        </button>

                        {/* Category Filter */}
                        <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                            <button onClick={() => setFilterCategory('all')} className={`px-2.5 py-1 rounded-md transition-colors ${filterCategory === 'all' ? 'bg-white text-primary-700 shadow-xs' : 'text-slate-600'}`}>
                                All Items
                            </button>
                            <button onClick={() => setFilterCategory('milestones')} className={`px-2.5 py-1 rounded-md transition-colors ${filterCategory === 'milestones' ? 'bg-white text-primary-700 shadow-xs' : 'text-slate-600'}`}>
                                Milestones
                            </button>
                            <button onClick={() => setFilterCategory('deliverables')} className={`px-2.5 py-1 rounded-md transition-colors ${filterCategory === 'deliverables' ? 'bg-white text-primary-700 shadow-xs' : 'text-slate-600'}`}>
                                Deliverables
                            </button>
                            <button onClick={() => setFilterCategory('variations')} className={`px-2.5 py-1 rounded-md transition-colors ${filterCategory === 'variations' ? 'bg-white text-primary-700 shadow-xs' : 'text-slate-600'}`}>
                                Variations
                            </button>
                        </div>

                        {/* Time Scale */}
                        <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                            <button onClick={() => setTimeScale('quarter')} className={`px-2 py-1 rounded-md transition-colors ${timeScale === 'quarter' ? 'bg-white text-primary-700 shadow-xs' : 'text-slate-600'}`}>
                                Qtr
                            </button>
                            <button onClick={() => setTimeScale('month')} className={`px-2 py-1 rounded-md transition-colors ${timeScale === 'month' ? 'bg-white text-primary-700 shadow-xs' : 'text-slate-600'}`}>
                                Month
                            </button>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-2.5 rounded-xs bg-sky-500 inline-block"></span>
                            <span className="text-slate-600 font-medium">Contract Deliverable (In Progress)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>
                            <span className="text-slate-600 font-medium">Completed Deliverable</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-2.5 rounded-xs bg-amber-500 inline-block"></span>
                            <span className="text-slate-600 font-medium">Critical Path Activity</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-2.5 rounded-xs bg-purple-500 inline-block"></span>
                            <span className="text-slate-600 font-medium">Time Extension Variation</span>
                        </div>
                    </div>
                    <div className="text-[11px] text-slate-400 italic flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>
                        Today Reference
                    </div>
                </div>
            </div>

            {/* Gantt Matrix Canvas */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Time Header */}
                <div className="flex border-b border-slate-200 bg-slate-50 font-semibold text-xs text-slate-700 select-none">
                    <div className="w-72 flex-shrink-0 p-3 border-r border-slate-200 bg-slate-100/70">
                        WBS Activity / Milestone
                    </div>
                    <div className="flex-1 relative h-10">
                        {timeTicks.map((tick, idx) => (<div key={idx} style={{ left: `${tick.leftPercent}%` }} className="absolute top-0 bottom-0 border-l border-slate-200 pl-1.5 pt-2 text-[11px] text-slate-500 whitespace-nowrap">
                                {tick.label}
                            </div>))}
                    </div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-100 relative">
                    {/* Today Line */}
                    {todayPercent >= 0 && todayPercent <= 100 && (<div style={{ left: `calc(18rem + (100% - 18rem) * ${todayPercent / 100})` }} className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 pointer-events-none">
                            <span className="absolute -top-2 -left-3 text-[9px] font-bold text-white bg-red-500 px-1 rounded shadow-xs">
                                Today
                            </span>
                        </div>)}

                    {filteredItems.map((item) => {
            const startP = getPositionPercent(item.startDate);
            const endP = getPositionPercent(item.endDate);
            const widthP = Math.max(1.5, endP - startP);
            return (<div key={item.id} className={`flex hover:bg-slate-50 transition-colors ${item.isCriticalPath ? 'bg-amber-50/20' : ''}`} onMouseEnter={() => setHoveredItem(item)} onMouseLeave={() => setHoveredItem(null)}>
                                {/* Left Info */}
                                <div className="w-72 flex-shrink-0 p-3 border-r border-slate-200 flex flex-col justify-center gap-0.5 bg-white/70">
                                    <div className="flex items-center justify-between gap-1">
                                        <span className="font-semibold text-xs text-slate-800 truncate" title={item.title}>
                                            {item.title}
                                        </span>
                                        {item.isCriticalPath && (<span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded border border-amber-300">
                                                CRITICAL
                                            </span>)}
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                                        <span>{formatDate(item.startDate)}</span>
                                        <span>→</span>
                                        <span>{formatDate(item.endDate)}</span>
                                    </div>
                                    {item.paymentAmount && (<div className="text-[10px] font-bold text-emerald-600">
                                            Linked Payment: {formatCurrency(item.paymentAmount)}
                                        </div>)}
                                </div>

                                {/* Right Gantt Bar Canvas */}
                                <div className="flex-1 relative flex items-center py-3 px-2 min-h-[52px]">
                                    {/* Grid background lines */}
                                    {timeTicks.map((tick, idx) => (<div key={idx} style={{ left: `${tick.leftPercent}%` }} className="absolute top-0 bottom-0 border-l border-slate-100 pointer-events-none"/>))}

                                    {/* Task Gantt Bar */}
                                    <div style={{
                    left: `${startP}%`,
                    width: `${widthP}%`,
                }} className={`relative h-6 rounded-md shadow-xs flex items-center px-2 text-[10px] font-bold text-white transition-all overflow-hidden cursor-pointer ${item.category === 'variation'
                    ? 'bg-purple-600 border border-purple-700'
                    : item.status === 'completed'
                        ? 'bg-emerald-500 border border-emerald-600'
                        : item.status === 'in_progress'
                            ? 'bg-sky-500 border border-sky-600'
                            : item.isCriticalPath
                                ? 'bg-amber-500 border border-amber-600'
                                : 'bg-slate-400 border border-slate-500'}`} title={`${item.title} (${formatDate(item.startDate)} - ${formatDate(item.endDate)})`}>
                                        <span className="truncate drop-shadow-xs">{item.title}</span>
                                        {item.progressPercent !== undefined && item.progressPercent > 0 && (<span className="ml-auto pl-1 text-[9px] opacity-90">{item.progressPercent}%</span>)}
                                    </div>
                                </div>
                            </div>);
        })}
                </div>
            </div>

            {/* Hovered Item Detail Card */}
            {hoveredItem && (<div className="bg-slate-900 text-white p-3 rounded-lg text-xs space-y-1 shadow-md animate-fadeIn">
                    <div className="flex items-center justify-between">
                        <strong className="text-white font-bold">{hoveredItem.title}</strong>
                        <span className="text-slate-300 font-mono">
                            {formatDate(hoveredItem.startDate)} to {formatDate(hoveredItem.endDate)}
                        </span>
                    </div>
                    {hoveredItem.description && (<p className="text-slate-300">{hoveredItem.description}</p>)}
                </div>)}
        </div>);
};
export default ContractTimeline;
