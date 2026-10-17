import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);
};
const formatCompactCurrency = (val) => {
    if (Math.abs(val) >= 1_000_000_000)
        return `${(val / 1_000_000_000).toFixed(1)}B ETB`;
    if (Math.abs(val) >= 1_000_000)
        return `${(val / 1_000_000).toFixed(1)}M ETB`;
    if (Math.abs(val) >= 1_000)
        return `${(val / 1_000).toFixed(0)}k ETB`;
    return `${val} ETB`;
};
const BudgetVarianceTable = ({ projects, procurements = [], contracts = [] }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [procurementTypeFilter, setProcurementTypeFilter] = useState('All');
    const [sortField, setSortField] = useState('variance');
    const [sortOrder, setSortOrder] = useState('desc');
    const [expandedProjectId, setExpandedProjectId] = useState(null);
    const [selectedProjectForModal, setSelectedProjectForModal] = useState(null);
    const [showChart, setShowChart] = useState(true);
    // Map procurements and contracts by Project ID
    const procurementMap = useMemo(() => {
        const map = new Map();
        procurements.forEach(pr => map.set(pr.projectId, pr));
        return map;
    }, [procurements]);
    const contractMap = useMemo(() => {
        const map = new Map();
        contracts.forEach(c => map.set(c.projectId, c));
        return map;
    }, [contracts]);
    // Calculate budget variance for all projects
    const allVariances = useMemo(() => {
        return projects.map(project => {
            const procurement = procurementMap.get(project.id);
            const contract = contractMap.get(project.id);
            const estimatedBudget = project.estimatedBudget || 0;
            let awardedBidder = undefined;
            let actualAwardPrice = null;
            let hasAward = false;
            const bidders = procurement?.bidders || [];
            const biddersCount = bidders.length;
            const evaluatedBiddersCount = bidders.filter(b => b.evaluationStatus === 'Evaluated').length;
            const rejectedBiddersCount = bidders.filter(b => b.evaluationStatus === 'Rejected').length;
            let awardDate = procurement?.awardDate;
            let currency = 'ETB';
            if (procurement && procurement.awardedBidderId) {
                awardedBidder = bidders.find(b => b.id === procurement.awardedBidderId);
                if (awardedBidder) {
                    actualAwardPrice = awardedBidder.correctedPrice || awardedBidder.readoutPrice || 0;
                    hasAward = true;
                    currency = awardedBidder.currency || 'ETB';
                }
            }
            else if (bidders.length > 0) {
                // Check if any evaluated bidder exists
                const evaluated = bidders.filter(b => b.evaluationStatus === 'Evaluated');
                if (evaluated.length > 0) {
                    // Pick lowest price evaluated bidder
                    const sorted = [...evaluated].sort((a, b) => (a.correctedPrice || a.readoutPrice) - (b.correctedPrice || b.readoutPrice));
                    awardedBidder = sorted[0];
                    actualAwardPrice = awardedBidder.correctedPrice || awardedBidder.readoutPrice || 0;
                    hasAward = true;
                    currency = awardedBidder.currency || 'ETB';
                }
            }
            let varianceAmount = null;
            let variancePercentage = null;
            let status = 'Pending Award';
            if (hasAward && actualAwardPrice !== null) {
                varianceAmount = estimatedBudget - actualAwardPrice; // Positive = Cost Savings, Negative = Overrun
                variancePercentage = estimatedBudget > 0 ? ((estimatedBudget - actualAwardPrice) / estimatedBudget) * 100 : 0;
                if (actualAwardPrice < estimatedBudget) {
                    status = 'Savings';
                }
                else if (actualAwardPrice > estimatedBudget) {
                    status = 'Over Budget';
                }
                else {
                    status = 'On Budget';
                }
            }
            return {
                project,
                procurement,
                contract,
                awardedBidder,
                estimatedBudget,
                actualAwardPrice,
                hasAward,
                varianceAmount,
                variancePercentage,
                status,
                biddersCount,
                evaluatedBiddersCount,
                rejectedBiddersCount,
                awardDate,
                currency,
                bidders,
            };
        });
    }, [projects, procurementMap, contractMap]);
    // Financial KPIs
    const kpis = useMemo(() => {
        const totalEstimatedBudget = allVariances.reduce((sum, v) => sum + v.estimatedBudget, 0);
        const awardedList = allVariances.filter(v => v.hasAward && v.actualAwardPrice !== null);
        const totalAwardedBudget = awardedList.reduce((sum, v) => sum + (v.actualAwardPrice || 0), 0);
        const totalAwardedEstimated = awardedList.reduce((sum, v) => sum + v.estimatedBudget, 0);
        // Net Savings across all awarded projects
        const netSavings = totalAwardedEstimated - totalAwardedBudget;
        const netSavingsPercentage = totalAwardedEstimated > 0 ? (netSavings / totalAwardedEstimated) * 100 : 0;
        const savingsProjects = allVariances.filter(v => v.status === 'Savings');
        const overBudgetProjects = allVariances.filter(v => v.status === 'Over Budget');
        const onBudgetProjects = allVariances.filter(v => v.status === 'On Budget');
        const pendingProjects = allVariances.filter(v => v.status === 'Pending Award');
        const totalGrossSavings = savingsProjects.reduce((sum, v) => sum + Math.max(0, v.varianceAmount || 0), 0);
        const totalGrossOverrun = overBudgetProjects.reduce((sum, v) => sum + Math.abs(Math.min(0, v.varianceAmount || 0)), 0);
        const totalBidders = allVariances.reduce((sum, v) => sum + v.biddersCount, 0);
        const procuredTendersCount = allVariances.filter(v => v.biddersCount > 0).length;
        const avgBiddersPerTender = procuredTendersCount > 0 ? (totalBidders / procuredTendersCount).toFixed(1) : '0';
        return {
            totalEstimatedBudget,
            totalAwardedBudget,
            totalAwardedEstimated,
            netSavings,
            netSavingsPercentage,
            totalGrossSavings,
            totalGrossOverrun,
            savingsCount: savingsProjects.length,
            overBudgetCount: overBudgetProjects.length,
            onBudgetCount: onBudgetProjects.length,
            pendingCount: pendingProjects.length,
            awardedCount: awardedList.length,
            totalProjects: allVariances.length,
            avgBiddersPerTender,
        };
    }, [allVariances]);
    // Filter and sort variances
    const filteredVariances = useMemo(() => {
        return allVariances
            .filter(item => {
            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchesName = item.project.name.toLowerCase().includes(q);
                const matchesId = item.project.id.toLowerCase().includes(q);
                const matchesZone = item.project.zone.toLowerCase().includes(q);
                const matchesWoreda = item.project.woreda.toLowerCase().includes(q);
                const matchesBidder = item.awardedBidder?.name.toLowerCase().includes(q) || false;
                const matchesProcId = item.procurement?.id.toLowerCase().includes(q) || false;
                if (!matchesName && !matchesId && !matchesZone && !matchesWoreda && !matchesBidder && !matchesProcId) {
                    return false;
                }
            }
            // Status filter
            if (statusFilter !== 'All' && item.status !== statusFilter) {
                return false;
            }
            // Procurement type filter
            if (procurementTypeFilter !== 'All') {
                if (item.procurement?.procurementType !== procurementTypeFilter) {
                    return false;
                }
            }
            return true;
        })
            .sort((a, b) => {
            let valA = 0;
            let valB = 0;
            if (sortField === 'variance' || sortField === 'savings') {
                valA = a.varianceAmount ?? (sortOrder === 'desc' ? -Infinity : Infinity);
                valB = b.varianceAmount ?? (sortOrder === 'desc' ? -Infinity : Infinity);
            }
            else if (sortField === 'variancePct') {
                valA = a.variancePercentage ?? (sortOrder === 'desc' ? -Infinity : Infinity);
                valB = b.variancePercentage ?? (sortOrder === 'desc' ? -Infinity : Infinity);
            }
            else if (sortField === 'estimated') {
                valA = a.estimatedBudget;
                valB = b.estimatedBudget;
            }
            else if (sortField === 'award') {
                valA = a.actualAwardPrice ?? 0;
                valB = b.actualAwardPrice ?? 0;
            }
            else if (sortField === 'name') {
                return sortOrder === 'asc'
                    ? a.project.name.localeCompare(b.project.name)
                    : b.project.name.localeCompare(a.project.name);
            }
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        });
    }, [allVariances, searchQuery, statusFilter, procurementTypeFilter, sortField, sortOrder]);
    // Data for Recharts visualization
    const chartData = useMemo(() => {
        return allVariances
            .filter(v => v.hasAward && v.actualAwardPrice !== null)
            .map(v => {
            const est = v.estimatedBudget;
            const award = v.actualAwardPrice || 0;
            const diff = est - award; // Positive = savings
            return {
                name: v.project.name.length > 20 ? `${v.project.name.substring(0, 18)}...` : v.project.name,
                fullName: v.project.name,
                id: v.project.id,
                zone: v.project.zone,
                estimated: est,
                awardPrice: award,
                savings: Math.max(0, diff),
                overrun: Math.max(0, -diff),
                status: v.status,
            };
        })
            .slice(0, 10);
    }, [allVariances]);
    // Export to Excel
    const handleExportExcel = () => {
        const workbook = XLSX.utils.book_new();
        const headers = [
            'Project ID',
            'Project Name',
            'Region / Zone',
            'Woreda',
            'Project Type',
            'Estimated Budget (ETB)',
            'Procurement ID',
            'Awarded Contractor / Bidder',
            'Bidder Type',
            'Actual Award Price (ETB)',
            'Budget Variance (ETB)',
            'Variance Percentage (%)',
            'Procurement Outcome',
            'Participating Bidders',
            'Evaluated Bidders',
            'Award Date',
            'Funding Source'
        ];
        const rows = filteredVariances.map(v => {
            const varianceStr = v.varianceAmount !== null
                ? (v.varianceAmount >= 0 ? `+${v.varianceAmount}` : `${v.varianceAmount}`)
                : 'N/A';
            const pctStr = v.variancePercentage !== null
                ? `${v.variancePercentage.toFixed(1)}%`
                : 'N/A';
            return [
                v.project.id,
                v.project.name,
                `${v.project.region || 'Oromia'} / ${v.project.zone}`,
                v.project.woreda,
                v.project.projectType,
                v.estimatedBudget,
                v.procurement?.id || 'N/A',
                v.awardedBidder?.name || 'Pending Award',
                v.awardedBidder?.type || 'N/A',
                v.actualAwardPrice !== null ? v.actualAwardPrice : 'N/A',
                varianceStr,
                pctStr,
                v.status,
                v.biddersCount,
                v.evaluatedBiddersCount,
                v.awardDate || 'N/A',
                v.project.fundingSource || 'OWEB'
            ];
        });
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget Variance Analysis');
        XLSX.writeFile(workbook, `OWEB_Budget_Variance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };
    // Export to PDF
    const handleExportPDF = () => {
        const doc = new jsPDF('landscape');
        doc.setFontSize(16);
        doc.setTextColor(2, 132, 199);
        doc.text('OWEB Project Budget Variance & Procurement Award Analysis', 14, 18);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} | Scope: Oromia Regional State Water Resource Bureau`, 14, 25);
        // Summary metric strip
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, 28, 268, 16, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(`Total Planning Budget: ${formatCurrency(kpis.totalEstimatedBudget)} ETB`, 18, 35);
        doc.text(`Awarded Value: ${formatCurrency(kpis.totalAwardedBudget)} ETB`, 100, 35);
        doc.text(`Net Variance: ${kpis.netSavings >= 0 ? '+' : ''}${formatCurrency(kpis.netSavings)} ETB (${kpis.netSavingsPercentage.toFixed(1)}%)`, 180, 35);
        doc.text(`Awarded Tenders: ${kpis.awardedCount} of ${kpis.totalProjects} (${kpis.savingsCount} Under Budget, ${kpis.overBudgetCount} Overrun)`, 18, 41);
        const tableHeaders = [['Project Name & Code', 'Zone / Woreda', 'Estimated Budget (ETB)', 'Awarded Contractor', 'Award Price (ETB)', 'Variance (ETB)', 'Variance %', 'Status']];
        const tableRows = filteredVariances.map(v => [
            `${v.project.name}\n${v.project.id}`,
            `${v.project.zone} / ${v.project.woreda}`,
            formatCurrency(v.estimatedBudget),
            v.awardedBidder?.name || 'Pending Award',
            v.actualAwardPrice !== null ? formatCurrency(v.actualAwardPrice) : '-',
            v.varianceAmount !== null ? `${v.varianceAmount >= 0 ? '+' : ''}${formatCurrency(v.varianceAmount)}` : '-',
            v.variancePercentage !== null ? `${v.variancePercentage.toFixed(1)}%` : '-',
            v.status
        ]);
        autoTable(doc, {
            startY: 48,
            head: tableHeaders,
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [2, 132, 199] },
            styles: { fontSize: 8, cellPadding: 2.5 },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 35 },
                2: { cellWidth: 35, halign: 'right' },
                3: { cellWidth: 45 },
                4: { cellWidth: 35, halign: 'right' },
                5: { cellWidth: 30, halign: 'right' },
                6: { cellWidth: 20, halign: 'center' },
                7: { cellWidth: 20, halign: 'center' },
            }
        });
        doc.save(`OWEB_Budget_Variance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    return (<div className="space-y-6">
            {/* Header Title and Context */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-primary-50 text-primary-700 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"/>
                            </svg>
                        </span>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Budget Variance & Procurement Award Analysis</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Rigorous benchmarking comparing original planning estimates against actual evaluated procurement award contract values.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 no-print">
                    <button onClick={() => setShowChart(!showChart)} className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${showChart ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        {showChart ? 'Hide Visual Analytics' : 'Show Visual Analytics'}
                    </button>

                    <button onClick={handleExportExcel} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                        </svg>
                        Export Excel
                    </button>

                    <button onClick={handleExportPDF} className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5h3v1.5h-3v-1.5zm0-3h3v1.5h-3v-1.5zm6 6h-6v-1.5h6v1.5zm0-3h-2v-1.5h2v1.5zm0-3h-2V7h2v1.5z"/>
                        </svg>
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Financial & Procurement KPIs Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Estimated Budget */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Planning Budget</span>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-bold font-mono text-slate-900">{formatCurrency(kpis.totalEstimatedBudget)} <span className="text-xs font-normal text-slate-500">ETB</span></p>
                        <p className="text-xs text-slate-500 mt-1">Across {kpis.totalProjects} active projects in portfolio</p>
                    </div>
                </div>

                {/* Actual Procurement Award Value */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Awarded Contract Value</span>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                            </svg>
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-bold font-mono text-indigo-700">{formatCurrency(kpis.totalAwardedBudget)} <span className="text-xs font-normal text-slate-500">ETB</span></p>
                        <p className="text-xs text-slate-500 mt-1">For {kpis.awardedCount} awarded tenders ({kpis.pendingCount} pending)</p>
                    </div>
                </div>

                {/* Net Procurement Variance & Savings */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net Procurement Variance</span>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${kpis.netSavings >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {kpis.netSavings >= 0 ? `+${kpis.netSavingsPercentage.toFixed(1)}% Savings` : `${kpis.netSavingsPercentage.toFixed(1)}% Overrun`}
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className={`text-2xl font-bold font-mono ${kpis.netSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {kpis.netSavings >= 0 ? '+' : ''}{formatCurrency(kpis.netSavings)} <span className="text-xs font-normal text-slate-500">ETB</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Gross Savings: +{formatCompactCurrency(kpis.totalGrossSavings)} | Overruns: -{formatCompactCurrency(kpis.totalGrossOverrun)}
                        </p>
                    </div>
                </div>

                {/* Market Competition & Award Efficiency */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Procurement Efficiency</span>
                        <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                            </svg>
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className="flex items-baseline justify-between">
                            <p className="text-2xl font-bold font-mono text-slate-900">{kpis.avgBiddersPerTender} <span className="text-xs font-normal text-slate-500">bidders / tender</span></p>
                            <span className="text-xs font-semibold text-emerald-600">{((kpis.savingsCount / Math.max(1, kpis.awardedCount)) * 100).toFixed(0)}% Under Budget</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden flex">
                            <div className="bg-emerald-500 h-full" style={{ width: `${(kpis.savingsCount / Math.max(1, kpis.totalProjects)) * 100}%` }} title="Savings"/>
                            <div className="bg-blue-500 h-full" style={{ width: `${(kpis.onBudgetCount / Math.max(1, kpis.totalProjects)) * 100}%` }} title="On Budget"/>
                            <div className="bg-rose-500 h-full" style={{ width: `${(kpis.overBudgetCount / Math.max(1, kpis.totalProjects)) * 100}%` }} title="Over Budget"/>
                            <div className="bg-slate-300 h-full" style={{ width: `${(kpis.pendingCount / Math.max(1, kpis.totalProjects)) * 100}%` }} title="Pending Award"/>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual Recharts Comparison Section (Toggleable) */}
            {showChart && chartData.length > 0 && (<div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Estimated Budget vs. Procurement Award Price Comparison</h3>
                            <p className="text-xs text-slate-500">Visualizing tender cost differentials and savings outcomes for awarded projects</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1.5 font-medium text-slate-600">
                                <span className="w-3 h-3 rounded-xs bg-sky-600 inline-block"/>
                                Estimated Budget
                            </span>
                            <span className="flex items-center gap-1.5 font-medium text-slate-600">
                                <span className="w-3 h-3 rounded-xs bg-indigo-600 inline-block"/>
                                Award Contract Price
                            </span>
                            <span className="flex items-center gap-1.5 font-medium text-slate-600">
                                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block"/>
                                Cost Savings
                            </span>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} interval={0} angle={-15} textAnchor="end"/>
                                <YAxis tickFormatter={formatCompactCurrency} tick={{ fontSize: 11, fill: '#475569' }}/>
                                <Tooltip formatter={(value, name) => [
                `${formatCurrency(Number(value))} ETB`,
                name === 'estimated' ? 'Estimated Budget' : name === 'awardPrice' ? 'Actual Award Price' : name
            ]} labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                    return `${payload[0].payload.fullName} (${payload[0].payload.id})`;
                }
                return label;
            }} contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}/>
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}/>
                                <Bar dataKey="estimated" name="Estimated Budget (ETB)" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={32}/>
                                <Bar dataKey="awardPrice" name="Actual Award Price (ETB)" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>)}

            {/* Filter and Search Controls Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 no-print">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Search Field */}
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                        </div>
                        <input type="text" placeholder="Search by project name, ID, zone, woreda, or awarded contractor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none"/>
                        {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                                ×
                            </button>)}
                    </div>

                    {/* Status / Outcome Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Outcome:</label>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none">
                            <option value="All">All Outcomes ({allVariances.length})</option>
                            <option value="Savings">Cost Savings ({kpis.savingsCount})</option>
                            <option value="Over Budget">Budget Overrun ({kpis.overBudgetCount})</option>
                            <option value="On Budget">On Budget ({kpis.onBudgetCount})</option>
                            <option value="Pending Award">Pending Award ({kpis.pendingCount})</option>
                        </select>
                    </div>

                    {/* Procurement Type Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Type:</label>
                        <select value={procurementTypeFilter} onChange={(e) => setProcurementTypeFilter(e.target.value)} className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none">
                            <option value="All">All Types</option>
                            <option value="Works">Works</option>
                            <option value="Goods">Goods</option>
                            <option value="Consulting Services">Consulting Services</option>
                            <option value="Non-consulting Services">Non-consulting Services</option>
                        </select>
                    </div>

                    {/* Sort Field */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Sort By:</label>
                        <select value={sortField} onChange={(e) => setSortField(e.target.value)} className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none">
                            <option value="variance">Largest Savings First</option>
                            <option value="variancePct">Savings Percentage (%)</option>
                            <option value="estimated">Estimated Budget</option>
                            <option value="award">Award Contract Price</option>
                            <option value="name">Project Name</option>
                        </select>
                        <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-bold" title={sortOrder === 'asc' ? 'Ascending order' : 'Descending order'}>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>

                {/* Filter Counts Banner */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>
                        Showing <strong className="text-slate-800">{filteredVariances.length}</strong> of {allVariances.length} projects
                    </span>
                    {(searchQuery || statusFilter !== 'All' || procurementTypeFilter !== 'All') && (<button onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setProcurementTypeFilter('All');
            }} className="text-primary-600 hover:text-primary-800 font-semibold">
                            Clear Variance Filters
                        </button>)}
                </div>
            </div>

            {/* Detailed Budget Variance Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3.5">Project Details</th>
                                <th className="px-4 py-3.5">Location & Type</th>
                                <th className="px-4 py-3.5 text-right">Original Estimated Budget</th>
                                <th className="px-4 py-3.5">Awarded Contractor / Supplier</th>
                                <th className="px-4 py-3.5 text-right">Actual Award Price</th>
                                <th className="px-4 py-3.5 text-right">Budget Variance</th>
                                <th className="px-4 py-3.5 text-center">Variance %</th>
                                <th className="px-4 py-3.5 text-center">Outcome Status</th>
                                <th className="px-4 py-3.5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredVariances.map((item, idx) => {
            const isExpanded = expandedProjectId === item.project.id;
            const isSavings = item.status === 'Savings';
            const isOverrun = item.status === 'Over Budget';
            const isPending = item.status === 'Pending Award';
            return (<React.Fragment key={item.project.id}>
                                        <tr className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                                            {/* Project Details */}
                                            <td className="px-4 py-3.5">
                                                <div className="font-semibold text-slate-900 text-sm">{item.project.name}</div>
                                                <div className="font-mono text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5">
                                                    <span>{item.project.id}</span>
                                                    {item.procurement && (<span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px]">
                                                            {item.procurement.id}
                                                        </span>)}
                                                </div>
                                            </td>

                                            {/* Location & Type */}
                                            <td className="px-4 py-3.5">
                                                <div className="font-medium text-slate-800">{item.project.zone} / {item.project.woreda}</div>
                                                <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                                                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                                        {item.project.projectType}
                                                    </span>
                                                    <span>• {item.project.fundingSource}</span>
                                                </div>
                                            </td>

                                            {/* Original Estimated Budget */}
                                            <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                                                {formatCurrency(item.estimatedBudget)} <span className="text-[10px] font-normal text-slate-500">ETB</span>
                                            </td>

                                            {/* Awarded Contractor */}
                                            <td className="px-4 py-3.5">
                                                {item.awardedBidder ? (<div>
                                                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500"/>
                                                            {item.awardedBidder.name}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                                            {item.awardedBidder.type} • Awarded {item.awardDate || 'Confirmed'}
                                                        </div>
                                                    </div>) : (<div className="text-slate-400 italic">
                                                        {item.biddersCount > 0 ? `${item.biddersCount} Bids In Evaluation` : 'No Award / Unprocured'}
                                                    </div>)}
                                            </td>

                                            {/* Actual Award Price */}
                                            <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                                                {item.actualAwardPrice !== null ? (<>
                                                        <span className="text-indigo-700">{formatCurrency(item.actualAwardPrice)}</span>
                                                        <span className="text-[10px] font-normal text-slate-500 ml-1">ETB</span>
                                                    </>) : (<span className="text-slate-400 font-normal italic">Pending</span>)}
                                            </td>

                                            {/* Budget Variance (Nominal) */}
                                            <td className="px-4 py-3.5 text-right font-mono font-bold text-sm">
                                                {item.varianceAmount !== null ? (<span className={isSavings ? 'text-emerald-600' : isOverrun ? 'text-rose-600' : 'text-slate-700'}>
                                                        {item.varianceAmount > 0 ? `+${formatCurrency(item.varianceAmount)}` : formatCurrency(item.varianceAmount)}
                                                        <span className="text-[10px] font-normal text-slate-500 ml-1">ETB</span>
                                                    </span>) : (<span className="text-slate-400 font-normal">-</span>)}
                                            </td>

                                            {/* Variance % */}
                                            <td className="px-4 py-3.5 text-center">
                                                {item.variancePercentage !== null ? (<div className="inline-flex flex-col items-center">
                                                        <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${isSavings
                        ? 'bg-emerald-100 text-emerald-800'
                        : isOverrun
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-800'}`}>
                                                            {item.variancePercentage > 0 ? `+${item.variancePercentage.toFixed(1)}%` : `${item.variancePercentage.toFixed(1)}%`}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 mt-0.5">
                                                            {isSavings ? 'Savings' : isOverrun ? 'Overrun' : 'On Par'}
                                                        </span>
                                                    </div>) : (<span className="text-slate-400 font-mono text-xs">-</span>)}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-4 py-3.5 text-center">
                                                {isSavings && (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                                                        </svg>
                                                        Cost Savings
                                                    </span>)}
                                                {isOverrun && (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                                        </svg>
                                                        Budget Overrun
                                                    </span>)}
                                                {item.status === 'On Budget' && (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                        Exact Match
                                                    </span>)}
                                                {isPending && (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                        Pending Award
                                                    </span>)}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button onClick={() => setExpandedProjectId(isExpanded ? null : item.project.id)} className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title={isExpanded ? 'Collapse bidder breakdown' : 'Expand competing bidders breakdown'}>
                                                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                                                        </svg>
                                                    </button>
                                                    <button onClick={() => setSelectedProjectForModal(item)} className="px-2.5 py-1 bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-700 font-semibold rounded-md transition-colors text-[11px]" title="View Tender Analysis Card">
                                                        Details
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded Row for Bidder Tender Evaluation Breakdown */}
                                        {isExpanded && (<tr className="bg-slate-50/90 border-y border-slate-200">
                                                <td colSpan={9} className="p-4">
                                                    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-800 text-xs">
                                                                    Tender Evaluation & Bidder Register: {item.procurement?.id || 'Procurement In Progress'}
                                                                </span>
                                                                <span className="text-xs text-slate-500">
                                                                    ({item.biddersCount} Total Bidders, {item.evaluatedBiddersCount} Evaluated, {item.rejectedBiddersCount} Rejected)
                                                                </span>
                                                            </div>
                                                            <div className="text-xs font-semibold text-slate-700">
                                                                Estimated Budget: <span className="font-mono text-slate-900">{formatCurrency(item.estimatedBudget)} ETB</span>
                                                            </div>
                                                        </div>

                                                        {item.bidders.length > 0 ? (<div className="overflow-x-auto">
                                                                <table className="w-full text-left text-xs">
                                                                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                                                        <tr>
                                                                            <th className="py-2 px-3">Bidder Name</th>
                                                                            <th className="py-2 px-3">Type</th>
                                                                            <th className="py-2 px-3">Address</th>
                                                                            <th className="py-2 px-3 text-right">Readout Price</th>
                                                                            <th className="py-2 px-3 text-right">Corrected Price</th>
                                                                            <th className="py-2 px-3 text-center">Evaluation Status</th>
                                                                            <th className="py-2 px-3 text-center">Award Decision</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100">
                                                                        {item.bidders.map(bidder => {
                            const isWinner = bidder.id === item.procurement?.awardedBidderId || bidder.id === item.awardedBidder?.id;
                            const corrected = bidder.correctedPrice || bidder.readoutPrice;
                            const diffFromEst = item.estimatedBudget - corrected;
                            return (<tr key={bidder.id} className={isWinner ? 'bg-emerald-50/50 font-semibold' : 'hover:bg-slate-50'}>
                                                                                    <td className="py-2 px-3 text-slate-900 flex items-center gap-1.5">
                                                                                        {isWinner && <span className="text-emerald-600 font-bold">★</span>}
                                                                                        {bidder.name}
                                                                                    </td>
                                                                                    <td className="py-2 px-3 text-slate-600">{bidder.type}</td>
                                                                                    <td className="py-2 px-3 text-slate-600">{bidder.address}</td>
                                                                                    <td className="py-2 px-3 text-right font-mono text-slate-700">{formatCurrency(bidder.readoutPrice)} {bidder.currency}</td>
                                                                                    <td className="py-2 px-3 text-right font-mono text-slate-900 font-bold">{formatCurrency(corrected)} {bidder.currency}</td>
                                                                                    <td className="py-2 px-3 text-center">
                                                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${bidder.evaluationStatus === 'Evaluated' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                                                            {bidder.evaluationStatus}
                                                                                            {bidder.rejectionReason && ` (${bidder.rejectionReason})`}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="py-2 px-3 text-center">
                                                                                        {isWinner ? (<span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                                                                                                Awarded Contract ({diffFromEst >= 0 ? `+${formatCurrency(diffFromEst)} ETB savings` : `${formatCurrency(diffFromEst)} ETB overrun`})
                                                                                            </span>) : (<span className="text-slate-400 text-[11px]">Runner-up</span>)}
                                                                                    </td>
                                                                                </tr>);
                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>) : (<div className="py-4 text-center text-slate-400 text-xs italic">
                                                                No bidders logged for this procurement tender yet.
                                                            </div>)}
                                                    </div>
                                                </td>
                                            </tr>)}
                                    </React.Fragment>);
        })}

                            {filteredVariances.length === 0 && (<tr>
                                    <td colSpan={9} className="py-12 text-center text-slate-400">
                                        <div className="max-w-sm mx-auto space-y-2">
                                            <p className="font-semibold text-slate-600 text-sm">No project budget variance records match your active filters.</p>
                                            <p className="text-xs text-slate-400">Try adjusting your search keywords, outcome status, or procurement type filters.</p>
                                        </div>
                                    </td>
                                </tr>)}
                        </tbody>
                        <tfoot className="bg-slate-100 font-semibold text-slate-900 border-t-2 border-slate-300 text-xs">
                            <tr>
                                <td className="px-4 py-3 uppercase">Total Portfolio Summary</td>
                                <td className="px-4 py-3">{filteredVariances.length} Projects</td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-sm">
                                    {formatCurrency(filteredVariances.reduce((s, v) => s + v.estimatedBudget, 0))} ETB
                                </td>
                                <td className="px-4 py-3">
                                    {filteredVariances.filter(v => v.hasAward).length} Awarded Tenders
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-sm text-indigo-800">
                                    {formatCurrency(filteredVariances.reduce((s, v) => s + (v.actualAwardPrice || 0), 0))} ETB
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-sm">
                                    {(() => {
            const totalEst = filteredVariances.filter(v => v.hasAward).reduce((s, v) => s + v.estimatedBudget, 0);
            const totalAward = filteredVariances.filter(v => v.hasAward).reduce((s, v) => s + (v.actualAwardPrice || 0), 0);
            const netDiff = totalEst - totalAward;
            return (<span className={netDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                                                {netDiff >= 0 ? '+' : ''}{formatCurrency(netDiff)} ETB
                                            </span>);
        })()}
                                </td>
                                <td className="px-4 py-3 text-center font-mono font-bold">
                                    {(() => {
            const totalEst = filteredVariances.filter(v => v.hasAward).reduce((s, v) => s + v.estimatedBudget, 0);
            const totalAward = filteredVariances.filter(v => v.hasAward).reduce((s, v) => s + (v.actualAwardPrice || 0), 0);
            const pct = totalEst > 0 ? ((totalEst - totalAward) / totalEst) * 100 : 0;
            return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
        })()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {kpis.savingsCount} Savings / {kpis.overBudgetCount} Overrun
                                </td>
                                <td className="px-4 py-3 text-center">-</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Modal for Detailed Project Tender Breakdown */}
            {selectedProjectForModal && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                            <div>
                                <span className="px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-800 rounded-md font-mono">
                                    {selectedProjectForModal.project.id}
                                </span>
                                <h3 className="text-lg font-bold text-slate-800 mt-1">{selectedProjectForModal.project.name}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {selectedProjectForModal.project.zone} / {selectedProjectForModal.project.woreda} • {selectedProjectForModal.project.projectType}
                                </p>
                            </div>
                            <button onClick={() => setSelectedProjectForModal(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 text-lg font-bold">
                                ×
                            </button>
                        </div>

                        {/* Financial Comparison Summary Box */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                                <span className="text-[11px] font-semibold uppercase text-slate-500">Planning Estimate</span>
                                <p className="text-lg font-bold font-mono text-slate-900 mt-1">
                                    {formatCurrency(selectedProjectForModal.estimatedBudget)} ETB
                                </p>
                            </div>

                            <div>
                                <span className="text-[11px] font-semibold uppercase text-slate-500">Actual Award Price</span>
                                <p className="text-lg font-bold font-mono text-indigo-700 mt-1">
                                    {selectedProjectForModal.actualAwardPrice !== null ? `${formatCurrency(selectedProjectForModal.actualAwardPrice)} ETB` : 'Pending'}
                                </p>
                            </div>

                            <div>
                                <span className="text-[11px] font-semibold uppercase text-slate-500">Procurement Variance</span>
                                <p className={`text-lg font-bold font-mono mt-1 ${selectedProjectForModal.status === 'Savings' ? 'text-emerald-600' : selectedProjectForModal.status === 'Over Budget' ? 'text-rose-600' : 'text-slate-700'}`}>
                                    {selectedProjectForModal.varianceAmount !== null ? (`${selectedProjectForModal.varianceAmount >= 0 ? '+' : ''}${formatCurrency(selectedProjectForModal.varianceAmount)} ETB`) : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Bidder Evaluation Register */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-800 text-sm">Participating Bidders & Evaluated Prices</h4>
                            {selectedProjectForModal.bidders.length > 0 ? (<div className="space-y-2">
                                    {selectedProjectForModal.bidders.map((b, bIdx) => {
                    const isAwarded = b.id === selectedProjectForModal.procurement?.awardedBidderId || b.id === selectedProjectForModal.awardedBidder?.id;
                    const price = b.correctedPrice || b.readoutPrice;
                    return (<div key={b.id} className={`p-3 rounded-lg border flex items-center justify-between text-xs ${isAwarded ? 'bg-emerald-50/80 border-emerald-300' : 'bg-white border-slate-200'}`}>
                                                <div>
                                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                                        {isAwarded && <span className="text-emerald-600">★ Award Winner:</span>}
                                                        {b.name}
                                                    </div>
                                                    <div className="text-slate-500 mt-0.5">
                                                        {b.type} • Address: {b.address || 'Oromia'} • Status: <strong className={b.evaluationStatus === 'Evaluated' ? 'text-emerald-700' : 'text-rose-700'}>{b.evaluationStatus}</strong>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold font-mono text-slate-900 text-sm">{formatCurrency(price)} {b.currency}</p>
                                                    <p className="text-[10px] text-slate-500">Readout: {formatCurrency(b.readoutPrice)}</p>
                                                </div>
                                            </div>);
                })}
                                </div>) : (<p className="text-xs text-slate-400 italic">No bidder evaluation data registered for this tender.</p>)}
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button onClick={() => setSelectedProjectForModal(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition-colors">
                                Close Window
                            </button>
                        </div>
                    </div>
                </div>)}
        </div>);
};
export default BudgetVarianceTable;
