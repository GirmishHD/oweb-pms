import React, { useState, useMemo } from 'react';
import { Project, Contract, Procurement, ProjectPhaseCost, ProjectPhaseType } from '../types';
import { 
    calculateProjectPhaseCosts, 
    calculateAggregatePhaseMetrics, 
    STANDARD_PHASES, 
    ProjectPhaseSummary 
} from '../services/phaseCostCalculator';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    Legend, 
    ResponsiveContainer, 
    CartesianGrid, 
    Cell 
} from 'recharts';

interface PhaseCostBreakdownTableProps {
    projects: Project[];
    contracts?: Contract[];
    procurements?: Procurement[];
}

const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);
};

const formatCompactCurrency = (val: number): string => {
    if (Math.abs(val) >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B ETB`;
    if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M ETB`;
    if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}k ETB`;
    return `${val} ETB`;
};

const PhaseCostBreakdownTable: React.FC<PhaseCostBreakdownTableProps> = ({
    projects,
    contracts = [],
    procurements = []
}) => {
    const [viewMode, setViewMode] = useState<'detailed' | 'aggregated' | 'overbudget'>('detailed');
    const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('All');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Over Budget' | 'At Risk' | 'Under Budget'>('All');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
    const [sortField, setSortField] = useState<'name' | 'original' | 'actual' | 'variance' | 'variancePct'>('variance');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedProjectForModal, setSelectedProjectForModal] = useState<ProjectPhaseSummary | null>(null);

    // Compute phase cost summaries for all projects
    const allSummaries: ProjectPhaseSummary[] = useMemo(() => {
        return projects.map(p => calculateProjectPhaseCosts(p, contracts, procurements));
    }, [projects, contracts, procurements]);

    // Aggregate summary metrics across all projects
    const aggregateMetrics = useMemo(() => {
        return calculateAggregatePhaseMetrics(allSummaries);
    }, [allSummaries]);

    // Financial KPIs
    const kpis = useMemo(() => {
        const totalOriginal = allSummaries.reduce((s, p) => s + p.totalOriginalBudget, 0);
        const totalActual = allSummaries.reduce((s, p) => s + p.totalActualExpenditure, 0);
        const totalVariance = totalActual - totalOriginal;
        const totalVariancePct = totalOriginal > 0 ? (totalVariance / totalOriginal) * 100 : 0;
        const overBudgetProjects = allSummaries.filter(p => p.isOverBudget);
        const atRiskProjects = allSummaries.filter(p => !p.isOverBudget && p.status === 'At Risk');
        const underBudgetProjects = allSummaries.filter(p => p.status === 'Under Budget');

        return {
            totalOriginal,
            totalActual,
            totalVariance,
            totalVariancePct,
            overBudgetCount: overBudgetProjects.length,
            atRiskCount: atRiskProjects.length,
            underBudgetCount: underBudgetProjects.length,
            totalProjects: allSummaries.length,
            overBudgetAmount: overBudgetProjects.reduce((s, p) => s + Math.max(0, p.totalVariance), 0)
        };
    }, [allSummaries]);

    // Filter and sort project summaries
    const filteredSummaries = useMemo(() => {
        return allSummaries
            .filter(s => {
                // Search query
                const matchesSearch = 
                    s.project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.project.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.project.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.project.woreda.toLowerCase().includes(searchQuery.toLowerCase());
                if (!matchesSearch) return false;

                // Status Filter
                if (selectedStatusFilter === 'Over Budget' && !s.isOverBudget) return false;
                if (selectedStatusFilter === 'At Risk' && s.status !== 'At Risk') return false;
                if (selectedStatusFilter === 'Under Budget' && s.status !== 'Under Budget') return false;

                // Phase filter: if specific phase selected, check if that phase matches status
                if (selectedPhaseFilter !== 'All') {
                    const phaseData = s.phases.find(p => p.phase === selectedPhaseFilter);
                    if (!phaseData) return false;
                    if (selectedStatusFilter === 'Over Budget' && !phaseData.isOverBudget) return false;
                }

                return true;
            })
            .sort((a, b) => {
                let valA = 0;
                let valB = 0;
                if (sortField === 'name') {
                    return sortOrder === 'asc' 
                        ? a.project.name.localeCompare(b.project.name) 
                        : b.project.name.localeCompare(a.project.name);
                }
                if (sortField === 'original') {
                    valA = a.totalOriginalBudget;
                    valB = b.totalOriginalBudget;
                } else if (sortField === 'actual') {
                    valA = a.totalActualExpenditure;
                    valB = b.totalActualExpenditure;
                } else if (sortField === 'variance') {
                    valA = a.totalVariance;
                    valB = b.totalVariance;
                } else if (sortField === 'variancePct') {
                    valA = a.overallVariancePercentage;
                    valB = b.overallVariancePercentage;
                }
                return sortOrder === 'asc' ? valA - valB : valB - valA;
            });
    }, [allSummaries, searchQuery, selectedStatusFilter, selectedPhaseFilter, sortField, sortOrder]);

    const handleSort = (field: 'name' | 'original' | 'actual' | 'variance' | 'variancePct') => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    // Export to Excel
    const handleExportExcel = () => {
        const rows: any[] = [];

        filteredSummaries.forEach(s => {
            s.phases.forEach(ph => {
                rows.push({
                    'Project ID': s.project.id,
                    'Project Name': s.project.name,
                    'Zone': s.project.zone,
                    'Woreda': s.project.woreda,
                    'Project Type': s.project.projectType,
                    'Project Status': s.project.status,
                    'Lifecycle Phase': ph.phase,
                    'Original Budget (ETB)': ph.originalBudget,
                    'Actual Expenditure (ETB)': ph.actualExpenditure,
                    'Variance (ETB)': ph.variance,
                    'Variance (%)': ph.variancePercentage.toFixed(1) + '%',
                    'Phase Status': ph.status,
                    'Over Budget?': ph.isOverBudget ? 'YES' : 'NO',
                    'Notes / Overrun Factor': ph.notes || 'Normal execution'
                });
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Phase Cost Breakdown');

        // Add summary sheet
        const summaryRows = aggregateMetrics.map(m => ({
            'Phase Code': m.code,
            'Phase Name': m.phase,
            'Total Original Budget (ETB)': m.totalOriginalBudget,
            'Total Actual Expenditure (ETB)': m.totalActualExpenditure,
            'Total Variance (ETB)': m.variance,
            'Variance (%)': m.variancePercentage.toFixed(1) + '%',
            'Utilization (%)': m.utilizationRate.toFixed(1) + '%',
            'Over-Budget Projects Count': m.overBudgetProjectCount,
            'Total Projects in Scope': m.totalProjectCount,
            'Overall Phase Status': m.status
        }));
        const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Phase Aggregate Summary');

        XLSX.writeFile(workbook, `OWEB_Project_Phase_Costs_Breakdown_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Export to PDF
    const handleExportPDF = () => {
        const doc = new jsPDF('landscape');

        doc.setFontSize(14);
        doc.setTextColor(2, 132, 199);
        doc.text('OROMIA WATER RESOURCE BUREAU (OWEB)', 14, 15);
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        doc.text('Project Cost Breakdown by Phase & Budget Variance Report', 14, 22);

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated on: ${new Date().toLocaleString()} | Projects in scope: ${filteredSummaries.length}`, 14, 28);

        const tableBody: any[] = [];
        filteredSummaries.forEach(s => {
            s.phases.forEach((ph, pIdx) => {
                tableBody.push([
                    pIdx === 0 ? `${s.project.name}\n(${s.project.id})` : '',
                    ph.phase,
                    formatCurrency(ph.originalBudget),
                    formatCurrency(ph.actualExpenditure),
                    `${ph.variance > 0 ? '+' : ''}${formatCurrency(ph.variance)} (${ph.variancePercentage > 0 ? '+' : ''}${ph.variancePercentage.toFixed(1)}%)`,
                    ph.status,
                    ph.notes || '-'
                ]);
            });
        });

        autoTable(doc, {
            startY: 32,
            head: [['Project & ID', 'Lifecycle Phase', 'Original Budget (ETB)', 'Actual Expenditure (ETB)', 'Variance (ETB / %)', 'Status', 'Cost Remarks / Overrun Reason']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [2, 132, 199], textColor: 255, fontSize: 8 },
            bodyStyles: { fontSize: 7.5, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 55, fontStyle: 'bold' },
                1: { cellWidth: 42 },
                2: { cellWidth: 32, halign: 'right' },
                3: { cellWidth: 32, halign: 'right' },
                4: { cellWidth: 38, halign: 'right' },
                5: { cellWidth: 25, halign: 'center' },
                6: { cellWidth: 50 },
            }
        });

        doc.save(`OWEB_Phase_Cost_Breakdown_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Chart data for phase comparison
    const chartData = useMemo(() => {
        return aggregateMetrics.map(m => ({
            name: m.phase.replace(' & ', '\n& '),
            phase: m.phase,
            Original: Math.round(m.totalOriginalBudget / 1_000_000), // in Millions ETB
            Actual: Math.round(m.totalActualExpenditure / 1_000_000), // in Millions ETB
            variance: m.variance,
            isOver: m.isOverBudget
        }));
    }, [aggregateMetrics]);

    return (
        <div className="space-y-6 animate-fade-in" id="phase-cost-breakdown-section">
            {/* Header with Title and Quick Action Controls */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </span>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Project Cost Breakdown by Phase & Variance Analysis</h3>
                                <p className="text-xs text-slate-500">Comprehensive breakdown of original budgets, actual disbursements, and cost variances with over-budget alerts.</p>
                            </div>
                        </div>
                    </div>

                    {/* View Switcher & Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs font-semibold text-slate-600">
                            <button
                                onClick={() => setViewMode('detailed')}
                                className={`px-3 py-1.5 rounded-md transition-all ${
                                    viewMode === 'detailed' 
                                        ? 'bg-white text-primary-700 shadow-sm font-bold' 
                                        : 'hover:text-slate-900'
                                }`}
                            >
                                Project Breakdown
                            </button>
                            <button
                                onClick={() => setViewMode('aggregated')}
                                className={`px-3 py-1.5 rounded-md transition-all ${
                                    viewMode === 'aggregated' 
                                        ? 'bg-white text-primary-700 shadow-sm font-bold' 
                                        : 'hover:text-slate-900'
                                }`}
                            >
                                Phase Summary Matrix
                            </button>
                            <button
                                onClick={() => {
                                    setViewMode('overbudget');
                                    setSelectedStatusFilter('Over Budget');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                                    viewMode === 'overbudget' 
                                        ? 'bg-rose-600 text-white shadow-sm font-bold' 
                                        : 'text-rose-600 hover:bg-rose-50'
                                }`}
                            >
                                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                                Over-Budget Alerts ({kpis.overBudgetCount})
                            </button>
                        </div>

                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                            title="Export phase cost breakdown to Excel"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export Excel
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
                            title="Export PDF Report"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            PDF Report
                        </button>
                    </div>
                </div>

                {/* Financial KPI Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-xs font-semibold uppercase text-slate-500">Total Original Budget</span>
                        <p className="text-xl font-bold font-mono text-slate-900 mt-1">{formatCompactCurrency(kpis.totalOriginal)}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Across {kpis.totalProjects} tracked projects</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-xs font-semibold uppercase text-slate-500">Actual Expenditures</span>
                        <p className="text-xl font-bold font-mono text-emerald-700 mt-1">{formatCompactCurrency(kpis.totalActual)}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Disbursement: {kpis.totalOriginal > 0 ? ((kpis.totalActual / kpis.totalOriginal) * 100).toFixed(1) : 0}%
                        </p>
                    </div>

                    <div className={`p-4 rounded-xl border ${
                        kpis.totalVariance > 0 
                            ? 'bg-rose-50/70 border-rose-200' 
                            : 'bg-emerald-50/70 border-emerald-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold uppercase ${kpis.totalVariance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                Net Phase Variance
                            </span>
                            {kpis.totalVariance > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-200 text-rose-800 rounded">Overrun</span>
                            )}
                        </div>
                        <p className={`text-xl font-bold font-mono mt-1 ${kpis.totalVariance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {kpis.totalVariance > 0 ? `+${formatCompactCurrency(kpis.totalVariance)}` : formatCompactCurrency(kpis.totalVariance)}
                        </p>
                        <p className={`text-[11px] font-medium mt-0.5 ${kpis.totalVariance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {kpis.totalVariancePct > 0 ? `+${kpis.totalVariancePct.toFixed(1)}%` : `${kpis.totalVariancePct.toFixed(1)}%`} vs Baseline
                        </p>
                    </div>

                    <div className={`p-4 rounded-xl border ${
                        kpis.overBudgetCount > 0 
                            ? 'bg-amber-50 border-amber-200' 
                            : 'bg-slate-50 border-slate-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-amber-800">Over-Budget Watch</span>
                            {kpis.overBudgetCount > 0 && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-full">
                                    {kpis.overBudgetCount} Projects
                                </span>
                            )}
                        </div>
                        <p className="text-xl font-bold text-slate-900 mt-1">
                            {kpis.overBudgetCount} <span className="text-xs text-slate-400 font-normal">of {kpis.totalProjects} Over</span>
                        </p>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                            {kpis.overBudgetAmount > 0 ? `+${formatCompactCurrency(kpis.overBudgetAmount)} in overruns` : 'All projects within limit'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search projects by name, ID, zone, or woreda..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Phase Filter */}
                        <select
                            value={selectedPhaseFilter}
                            onChange={(e) => setSelectedPhaseFilter(e.target.value)}
                            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="All">All Lifecycle Phases</option>
                            {STANDARD_PHASES.map(ph => (
                                <option key={ph.type} value={ph.type}>{ph.type}</option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="All">All Budget Statuses</option>
                            <option value="Over Budget">🔴 Over Budget (Alerts Only)</option>
                            <option value="At Risk">🟡 At Risk (Near Limit)</option>
                            <option value="Under Budget">🟢 Under Budget / On-Track</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* VIEW 1: DETAILED PROJECT BREAKDOWN (WITH EXPANDABLE ACCORDION / PHASE ROWS) */}
            {viewMode === 'detailed' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-sm text-slate-800">Project-by-Project Phase Cost Matrix</h4>
                            <p className="text-xs text-slate-500">Click any project row to expand its detailed phase breakdown or view cost overrun drivers.</p>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">Showing {filteredSummaries.length} projects</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-100 text-xs uppercase text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3.5 w-8"></th>
                                    <th 
                                        className="px-4 py-3.5 cursor-pointer hover:bg-slate-200 transition-colors"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Project Details & ID
                                            {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3.5">Zone / Sector</th>
                                    <th 
                                        className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-200 transition-colors"
                                        onClick={() => handleSort('original')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Original Budget
                                            {sortField === 'original' && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </div>
                                    </th>
                                    <th 
                                        className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-200 transition-colors"
                                        onClick={() => handleSort('actual')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Actual Spent
                                            {sortField === 'actual' && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </div>
                                    </th>
                                    <th 
                                        className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-200 transition-colors"
                                        onClick={() => handleSort('variance')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Variance (ETB / %)
                                            {sortField === 'variance' && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3.5 text-center">Budget Status</th>
                                    <th className="px-4 py-3.5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredSummaries.map((summary, idx) => {
                                    const isExpanded = expandedProjectId === summary.project.id;
                                    const hasOverrun = summary.isOverBudget;

                                    return (
                                        <React.Fragment key={summary.project.id}>
                                            <tr 
                                                className={`transition-colors cursor-pointer ${
                                                    hasOverrun 
                                                        ? 'bg-rose-50/40 hover:bg-rose-50/80' 
                                                        : (idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-100/60')
                                                }`}
                                                onClick={() => setExpandedProjectId(isExpanded ? null : summary.project.id)}
                                            >
                                                <td className="px-4 py-3.5 text-center text-slate-400">
                                                    <svg 
                                                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90 text-primary-600' : ''}`} 
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        {hasOverrun && (
                                                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0 animate-pulse" title="Over budget project"></span>
                                                        )}
                                                        <div>
                                                            <span className="font-bold text-slate-900 hover:text-primary-600 block">
                                                                {summary.project.name}
                                                            </span>
                                                            <span className="text-xs font-mono text-slate-400">
                                                                {summary.project.id}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="text-xs font-medium text-slate-700 block">{summary.project.zone} / {summary.project.woreda}</span>
                                                    <span className="text-[11px] text-slate-500">{summary.project.projectType}</span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-800">
                                                    {formatCurrency(summary.totalOriginalBudget)} ETB
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                                                    {formatCurrency(summary.totalActualExpenditure)} ETB
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-mono">
                                                    <span className={`font-bold ${
                                                        summary.totalVariance > 0 
                                                            ? 'text-rose-600' 
                                                            : summary.totalVariance < 0 ? 'text-emerald-600' : 'text-slate-600'
                                                    }`}>
                                                        {summary.totalVariance > 0 ? `+${formatCurrency(summary.totalVariance)}` : formatCurrency(summary.totalVariance)} ETB
                                                    </span>
                                                    <span className={`block text-xs font-semibold ${
                                                        summary.overallVariancePercentage > 0 ? 'text-rose-600' : 'text-emerald-600'
                                                    }`}>
                                                        {summary.overallVariancePercentage > 0 ? `(+${summary.overallVariancePercentage.toFixed(1)}%)` : `(${summary.overallVariancePercentage.toFixed(1)}%)`}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    {hasOverrun ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                                            <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                            </svg>
                                                            Over Budget ({summary.overBudgetPhaseCount} {summary.overBudgetPhaseCount === 1 ? 'Phase' : 'Phases'})
                                                        </span>
                                                    ) : summary.status === 'At Risk' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                            At Risk (&gt;90%)
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            Under Budget
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedProjectForModal(summary);
                                                        }}
                                                        className="px-2.5 py-1 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expanded Detailed Phase Rows */}
                                            {isExpanded && (
                                                <tr className="bg-slate-50/90 border-b border-slate-300">
                                                    <td colSpan={8} className="p-4">
                                                        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                                                    Phase-by-Phase Cost Breakdown for {summary.project.name}
                                                                </h5>
                                                                {summary.primaryOverrunReason && (
                                                                    <span className="text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                                                                        ⚠️ Overrun Driver: {summary.primaryOverrunReason}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-xs text-left">
                                                                    <thead className="bg-slate-100 text-slate-600 font-semibold uppercase border-b border-slate-200">
                                                                        <tr>
                                                                            <th className="px-3 py-2">Phase Name</th>
                                                                            <th className="px-3 py-2">Scope Description</th>
                                                                            <th className="px-3 py-2 text-right">Original Budget</th>
                                                                            <th className="px-3 py-2 text-right">Actual Spent</th>
                                                                            <th className="px-3 py-2 text-right">Variance</th>
                                                                            <th className="px-3 py-2 text-center">Progress / Utilization</th>
                                                                            <th className="px-3 py-2 text-center">Phase Status</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100">
                                                                        {summary.phases.map(ph => {
                                                                            const utilPct = ph.originalBudget > 0 ? (ph.actualExpenditure / ph.originalBudget) * 100 : 0;
                                                                            return (
                                                                                <tr key={ph.phase} className={ph.isOverBudget ? 'bg-rose-50/50' : ''}>
                                                                                    <td className="px-3 py-2.5 font-bold text-slate-900">
                                                                                        {ph.phase}
                                                                                    </td>
                                                                                    <td className="px-3 py-2.5 text-slate-500 max-w-xs truncate" title={ph.description}>
                                                                                        {ph.description || '-'}
                                                                                    </td>
                                                                                    <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                                                                                        {formatCurrency(ph.originalBudget)} ETB
                                                                                    </td>
                                                                                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-700">
                                                                                        {formatCurrency(ph.actualExpenditure)} ETB
                                                                                    </td>
                                                                                    <td className="px-3 py-2.5 text-right font-mono">
                                                                                        <span className={`font-bold ${ph.isOverBudget ? 'text-rose-600' : ph.variance < 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                                                            {ph.variance > 0 ? `+${formatCurrency(ph.variance)}` : formatCurrency(ph.variance)} ETB
                                                                                        </span>
                                                                                        <span className={`block text-[10px] ${ph.isOverBudget ? 'text-rose-600' : 'text-slate-400'}`}>
                                                                                            {ph.variancePercentage > 0 ? `+${ph.variancePercentage.toFixed(1)}%` : `${ph.variancePercentage.toFixed(1)}%`}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-3 py-2.5 text-center">
                                                                                        <div className="w-24 mx-auto bg-slate-200 rounded-full h-2 overflow-hidden">
                                                                                            <div 
                                                                                                className={`h-full rounded-full ${
                                                                                                    ph.isOverBudget 
                                                                                                        ? 'bg-rose-600' 
                                                                                                        : utilPct >= 90 ? 'bg-amber-500' : 'bg-emerald-500'
                                                                                                }`}
                                                                                                style={{ width: `${Math.min(100, utilPct)}%` }}
                                                                                            />
                                                                                        </div>
                                                                                        <span className="text-[10px] font-mono text-slate-500">{utilPct.toFixed(0)}%</span>
                                                                                    </td>
                                                                                    <td className="px-3 py-2.5 text-center">
                                                                                        {ph.isOverBudget ? (
                                                                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700">
                                                                                                Over Budget
                                                                                            </span>
                                                                                        ) : ph.status === 'At Risk' ? (
                                                                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                                                                                                At Risk
                                                                                            </span>
                                                                                        ) : ph.actualExpenditure === 0 ? (
                                                                                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-500">
                                                                                                Not Started
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">
                                                                                                Under Budget
                                                                                            </span>
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}

                                {filteredSummaries.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12 text-slate-400">
                                            No projects found matching the filter criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VIEW 2: PHASE SUMMARY MATRIX (AGGREGATED SUMMARY ACROSS ALL PROJECTS) */}
            {viewMode === 'aggregated' && (
                <div className="space-y-6">
                    {/* Visual Comparison Chart */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Total Phase Budget vs Actual Expenditures</h4>
                                <p className="text-xs text-slate-500">Macro-level comparison across the entire portfolio in Millions ETB.</p>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg">
                                Portfolio Overview
                            </span>
                        </div>

                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="M" />
                                    <Tooltip 
                                        formatter={(val: number) => [`${val} Million ETB`, '']}
                                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Bar dataKey="Original" name="Original Budget (M ETB)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Actual" name="Actual Expenditure (M ETB)" fill="#0284c7" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.isOver ? '#e11d48' : '#0284c7'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Aggregate Phase Summary Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <h4 className="font-bold text-sm text-slate-800">Aggregated Portfolio Breakdown by Phase</h4>
                            <p className="text-xs text-slate-500">Summary totals for each lifecycle phase across all currently tracked projects.</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-xs uppercase text-slate-600 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-5 py-3.5">Code</th>
                                        <th className="px-5 py-3.5">Lifecycle Phase</th>
                                        <th className="px-5 py-3.5 text-right">Total Original Budget</th>
                                        <th className="px-5 py-3.5 text-right">Total Actual Spent</th>
                                        <th className="px-5 py-3.5 text-right">Net Variance</th>
                                        <th className="px-5 py-3.5 text-center">Utilization</th>
                                        <th className="px-5 py-3.5 text-center">Over-Budget Count</th>
                                        <th className="px-5 py-3.5 text-center">Phase Health</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {aggregateMetrics.map(m => (
                                        <tr key={m.phase} className={m.isOverBudget ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50'}>
                                            <td className="px-5 py-4 font-mono font-bold text-xs text-slate-500">{m.code}</td>
                                            <td className="px-5 py-4">
                                                <span className="font-bold text-slate-900 block">{m.phase}</span>
                                                <span className="text-xs text-slate-400">
                                                    {STANDARD_PHASES.find(s => s.type === m.phase)?.description}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono font-semibold text-slate-800">
                                                {formatCurrency(m.totalOriginalBudget)} ETB
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono font-bold text-emerald-700">
                                                {formatCurrency(m.totalActualExpenditure)} ETB
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono">
                                                <span className={`font-bold ${m.isOverBudget ? 'text-rose-600' : m.variance < 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                    {m.variance > 0 ? `+${formatCurrency(m.variance)}` : formatCurrency(m.variance)} ETB
                                                </span>
                                                <span className={`block text-xs font-semibold ${m.isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {m.variancePercentage > 0 ? `(+${m.variancePercentage.toFixed(1)}%)` : `(${m.variancePercentage.toFixed(1)}%)`}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center font-mono text-xs font-bold text-slate-700">
                                                {m.utilizationRate.toFixed(1)}%
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {m.overBudgetProjectCount > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700">
                                                        ⚠️ {m.overBudgetProjectCount} Projects
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-medium">0 Projects</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {m.isOverBudget ? (
                                                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                                        Over Budget
                                                    </span>
                                                ) : m.status === 'At Risk' ? (
                                                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                                        At Risk
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        Healthy
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 3: OVER-BUDGET ALERTS & ROOT CAUSE WATCHLIST */}
            {viewMode === 'overbudget' && (
                <div className="space-y-6">
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-rose-900">Over-Budget Early Warning & Variance Register</h4>
                                <p className="text-xs text-rose-700">
                                    Identified {kpis.overBudgetCount} projects with active phase cost overruns totaling +{formatCurrency(kpis.overBudgetAmount)} ETB in excess expenditures.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {allSummaries.filter(s => s.isOverBudget).map(s => (
                            <div key={s.project.id} className="bg-white rounded-xl border border-rose-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                            <h5 className="font-bold text-slate-900">{s.project.name}</h5>
                                        </div>
                                        <p className="text-xs font-mono text-slate-400 mt-0.5">{s.project.id} • {s.project.zone} / {s.project.woreda}</p>
                                    </div>
                                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700">
                                        +{s.overallVariancePercentage.toFixed(1)}% Overrun
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-50 rounded-lg text-center">
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Planned Budget</span>
                                        <p className="text-xs font-bold font-mono text-slate-800 mt-0.5">{formatCurrency(s.totalOriginalBudget)}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Actual Spent</span>
                                        <p className="text-xs font-bold font-mono text-emerald-700 mt-0.5">{formatCurrency(s.totalActualExpenditure)}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-rose-500 uppercase font-semibold">Cost Overrun</span>
                                        <p className="text-xs font-bold font-mono text-rose-600 mt-0.5">+{formatCurrency(s.totalVariance)}</p>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    <span className="text-xs font-bold text-slate-700 block">Affected Project Phases:</span>
                                    {s.phases.filter(ph => ph.isOverBudget).map(ph => (
                                        <div key={ph.phase} className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg text-xs">
                                            <div className="flex items-center justify-between font-semibold text-rose-900">
                                                <span>{ph.phase}</span>
                                                <span className="font-mono">+{formatCurrency(ph.variance)} ETB (+{ph.variancePercentage.toFixed(1)}%)</span>
                                            </div>
                                            {ph.notes && (
                                                <p className="text-[11px] text-rose-700 mt-1">
                                                    Reason: {ph.notes}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                                    <button
                                        onClick={() => setSelectedProjectForModal(s)}
                                        className="px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                                    >
                                        Inspect Full Project Audit →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PROJECT DRILLDOWN MODAL */}
            {selectedProjectForModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-lg font-bold text-slate-900">{selectedProjectForModal.project.name}</h4>
                                    {selectedProjectForModal.isOverBudget && (
                                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                            Over Budget
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 font-mono mt-1">
                                    {selectedProjectForModal.project.id} • {selectedProjectForModal.project.zone} / {selectedProjectForModal.project.woreda}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedProjectForModal(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Modal KPIs */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                    <span className="text-xs text-slate-500 font-medium">Original Allocated Budget</span>
                                    <p className="text-base font-bold font-mono text-slate-900 mt-1">
                                        {formatCurrency(selectedProjectForModal.totalOriginalBudget)} ETB
                                    </p>
                                </div>
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                    <span className="text-xs text-slate-500 font-medium">Actual Paid Out</span>
                                    <p className="text-base font-bold font-mono text-emerald-700 mt-1">
                                        {formatCurrency(selectedProjectForModal.totalActualExpenditure)} ETB
                                    </p>
                                </div>
                                <div className={`p-3.5 rounded-xl border text-center ${
                                    selectedProjectForModal.totalVariance > 0 
                                        ? 'bg-rose-50 border-rose-200' 
                                        : 'bg-emerald-50 border-emerald-200'
                                }`}>
                                    <span className={`text-xs font-semibold ${
                                        selectedProjectForModal.totalVariance > 0 ? 'text-rose-700' : 'text-emerald-700'
                                    }`}>
                                        Variance
                                    </span>
                                    <p className={`text-base font-bold font-mono mt-1 ${
                                        selectedProjectForModal.totalVariance > 0 ? 'text-rose-700' : 'text-emerald-700'
                                    }`}>
                                        {selectedProjectForModal.totalVariance > 0 ? `+${formatCurrency(selectedProjectForModal.totalVariance)}` : formatCurrency(selectedProjectForModal.totalVariance)} ETB
                                    </p>
                                </div>
                            </div>

                            {/* Phase Table */}
                            <div>
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                                    Detailed Phase-by-Phase Breakdown
                                </h5>
                                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase">
                                            <tr>
                                                <th className="px-3.5 py-2.5">Phase</th>
                                                <th className="px-3.5 py-2.5 text-right">Original (ETB)</th>
                                                <th className="px-3.5 py-2.5 text-right">Actual (ETB)</th>
                                                <th className="px-3.5 py-2.5 text-right">Variance (ETB)</th>
                                                <th className="px-3.5 py-2.5 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedProjectForModal.phases.map(ph => (
                                                <tr key={ph.phase} className={ph.isOverBudget ? 'bg-rose-50/60' : ''}>
                                                    <td className="px-3.5 py-3">
                                                        <span className="font-bold text-slate-900 block">{ph.phase}</span>
                                                        {ph.notes && (
                                                            <span className="text-[11px] text-rose-600 block mt-0.5">{ph.notes}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3.5 py-3 text-right font-mono text-slate-700">
                                                        {formatCurrency(ph.originalBudget)}
                                                    </td>
                                                    <td className="px-3.5 py-3 text-right font-mono font-bold text-emerald-700">
                                                        {formatCurrency(ph.actualExpenditure)}
                                                    </td>
                                                    <td className="px-3.5 py-3 text-right font-mono">
                                                        <span className={`font-bold ${ph.isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                            {ph.variance > 0 ? `+${formatCurrency(ph.variance)}` : formatCurrency(ph.variance)}
                                                        </span>
                                                    </td>
                                                    <td className="px-3.5 py-3 text-center">
                                                        {ph.isOverBudget ? (
                                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700">
                                                                Over Budget
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">
                                                                Under Budget
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
                            <button
                                onClick={() => setSelectedProjectForModal(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Close Inspection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhaseCostBreakdownTable;
