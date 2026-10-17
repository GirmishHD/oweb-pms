import React, { useState, useMemo } from 'react';
import { ZONES, ICONS, PROGRAM_DEFINITIONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);
};
const formatCompactCurrency = (val) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (absVal >= 1_000_000_000)
        return `${sign}${(absVal / 1_000_000_000).toFixed(1)}B ETB`;
    if (absVal >= 1_000_000)
        return `${sign}${(absVal / 1_000_000).toFixed(1)}M ETB`;
    if (absVal >= 1_000)
        return `${sign}${(absVal / 1_000).toFixed(0)}k ETB`;
    return `${sign}${absVal} ETB`;
};
const formatDateDisplay = (dateStr) => {
    if (!dateStr)
        return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime()))
        return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
export const CostOverrunTracker = ({ projects, contracts, procurements = [], onSelectProject, onNavigate }) => {
    // Search & Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedZone, setSelectedZone] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('overrun_desc');
    const [expandedProjectId, setExpandedProjectId] = useState(null);
    const [selectedProjectModal, setSelectedProjectModal] = useState(null);
    // Simulation Modal State
    const [simulationProject, setSimulationProject] = useState(null);
    const [simVariationType, setSimVariationType] = useState('Variation Order');
    const [simCostImpact, setSimCostImpact] = useState(350000);
    const [simTimeExtensionDays, setSimTimeExtensionDays] = useState(30);
    const [simJustification, setSimJustification] = useState('Unforeseen geotechnical excavation & rocky substrate encounter');
    const [simulationSavedAlert, setSimulationSavedAlert] = useState(null);
    // Map contracts by projectId
    const projectContractsMap = useMemo(() => {
        const map = new Map();
        contracts.forEach(c => {
            const existing = map.get(c.projectId) || [];
            existing.push(c);
            map.set(c.projectId, existing);
        });
        return map;
    }, [contracts]);
    // Build comprehensive cost overrun and variation dataset for all projects
    const allOverrunData = useMemo(() => {
        return projects.map(p => {
            const projectContracts = projectContractsMap.get(p.id) || [];
            const primaryContract = projectContracts[0];
            // 1. Original Planned Budget
            const phaseOriginalSum = (p.phaseCosts || []).reduce((sum, phase) => sum + (phase.originalBudget || 0), 0);
            const originalBudget = p.estimatedBudget > 0 ? p.estimatedBudget : (phaseOriginalSum > 0 ? phaseOriginalSum : 0);
            // 2. Variations breakdown
            const allVariations = [];
            projectContracts.forEach(c => {
                if (c.variations && Array.isArray(c.variations)) {
                    allVariations.push(...c.variations);
                }
            });
            const approvedVariations = allVariations.filter(v => v.status === 'Approved');
            const pendingVariations = allVariations.filter(v => v.status === 'Pending');
            const rejectedVariations = allVariations.filter(v => v.status === 'Rejected');
            const approvedVariationsCost = approvedVariations.reduce((sum, v) => sum + (v.costImpact || 0), 0);
            const pendingVariationsCost = pendingVariations.reduce((sum, v) => sum + (v.costImpact || 0), 0);
            const approvedTimeExtensionDays = approvedVariations.reduce((sum, v) => sum + (v.timeImpactDays || 0), 0);
            // 3. Revised Budget Ceiling = Original Budget + Approved Variations
            const revisedBudget = Math.max(0, originalBudget + approvedVariationsCost);
            // 4. Actual Disbursed Expenditure
            const contractExpenditure = projectContracts.reduce((sum, c) => {
                const pays = (c.payments || []).reduce((pSum, pay) => pSum + (pay.actualAmount || 0), 0);
                return sum + pays;
            }, 0);
            const phaseExpenditure = (p.phaseCosts || []).reduce((sum, phase) => sum + (phase.actualExpenditure || 0), 0);
            const actualExpenditure = Math.max(contractExpenditure, phaseExpenditure);
            // 5. Variances
            const varianceVsOriginal = actualExpenditure - originalBudget;
            const varianceVsOriginalPct = originalBudget > 0 ? (varianceVsOriginal / originalBudget) * 100 : 0;
            const varianceVsRevised = actualExpenditure - revisedBudget;
            const varianceVsRevisedPct = revisedBudget > 0 ? (varianceVsRevised / revisedBudget) * 100 : 0;
            const variationExpansionPct = originalBudget > 0 ? (approvedVariationsCost / originalBudget) * 100 : 0;
            const remainingRevisedBalance = revisedBudget - actualExpenditure;
            const burnRateRevisedPct = revisedBudget > 0 ? (actualExpenditure / revisedBudget) * 100 : 0;
            // 6. Severity & Health Tiers
            const isCriticalOverrun = revisedBudget > 0 && actualExpenditure > revisedBudget * 1.10;
            const isModerateOverrun = !isCriticalOverrun && revisedBudget > 0 && actualExpenditure > revisedBudget;
            const isNearCeiling = !isCriticalOverrun && !isModerateOverrun && revisedBudget > 0 && actualExpenditure >= revisedBudget * 0.85;
            const isHealthy = actualExpenditure < revisedBudget * 0.85;
            let healthTier = 'healthy';
            if (isCriticalOverrun) {
                healthTier = 'critical_overrun';
            }
            else if (isModerateOverrun) {
                healthTier = 'moderate_overrun';
            }
            else if (isNearCeiling) {
                healthTier = 'near_ceiling';
            }
            else if (approvedVariationsCost > 0) {
                healthTier = 'expanded_baseline';
            }
            else {
                healthTier = 'healthy';
            }
            return {
                project: p,
                contract: primaryContract,
                originalBudget,
                approvedVariationsCost,
                pendingVariationsCost,
                approvedTimeExtensionDays,
                revisedBudget,
                actualExpenditure,
                varianceVsOriginal,
                varianceVsOriginalPct,
                varianceVsRevised,
                varianceVsRevisedPct,
                variationExpansionPct,
                remainingRevisedBalance,
                burnRateRevisedPct,
                healthTier,
                isCriticalOverrun,
                isModerateOverrun,
                isNearCeiling,
                isHealthy,
                allVariations,
                approvedVariations,
                pendingVariations,
                rejectedVariations,
                phaseCosts: p.phaseCosts || []
            };
        });
    }, [projects, projectContractsMap]);
    // Portfolio KPI Summary
    const portfolioKPIs = useMemo(() => {
        let totalOriginalBudget = 0;
        let totalApprovedVariations = 0;
        let totalPendingVariations = 0;
        let totalRevisedBudget = 0;
        let totalActualExpenditure = 0;
        let totalNetOverrunExcess = 0; // Sum of excess above revised budget for overrunning projects
        let criticalOverrunCount = 0;
        let moderateOverrunCount = 0;
        let projectsWithVariationsCount = 0;
        let totalApprovedTimeDays = 0;
        allOverrunData.forEach(item => {
            totalOriginalBudget += item.originalBudget;
            totalApprovedVariations += item.approvedVariationsCost;
            totalPendingVariations += item.pendingVariationsCost;
            totalRevisedBudget += item.revisedBudget;
            totalActualExpenditure += item.actualExpenditure;
            totalApprovedTimeDays += item.approvedTimeExtensionDays;
            if (item.approvedVariations.length > 0) {
                projectsWithVariationsCount++;
            }
            if (item.isCriticalOverrun) {
                criticalOverrunCount++;
                totalNetOverrunExcess += Math.max(0, item.actualExpenditure - item.revisedBudget);
            }
            else if (item.isModerateOverrun) {
                moderateOverrunCount++;
                totalNetOverrunExcess += Math.max(0, item.actualExpenditure - item.revisedBudget);
            }
        });
        const netPortfolioVariance = totalActualExpenditure - totalRevisedBudget;
        const portfolioVariationExpansionPct = totalOriginalBudget > 0 ? (totalApprovedVariations / totalOriginalBudget) * 100 : 0;
        const portfolioBurnRatePct = totalRevisedBudget > 0 ? (totalActualExpenditure / totalRevisedBudget) * 100 : 0;
        return {
            totalProjects: allOverrunData.length,
            totalOriginalBudget,
            totalApprovedVariations,
            totalPendingVariations,
            totalRevisedBudget,
            totalActualExpenditure,
            netPortfolioVariance,
            totalNetOverrunExcess,
            criticalOverrunCount,
            moderateOverrunCount,
            projectsWithVariationsCount,
            totalApprovedTimeDays,
            portfolioVariationExpansionPct,
            portfolioBurnRatePct
        };
    }, [allOverrunData]);
    // Filtered and Sorted Dataset
    const filteredOverrunData = useMemo(() => {
        return allOverrunData.filter(item => {
            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = item.project.name.toLowerCase().includes(q);
                const matchId = item.project.id.toLowerCase().includes(q);
                const matchZone = (item.project.zone || '').toLowerCase().includes(q);
                const matchWoreda = (item.project.woreda || '').toLowerCase().includes(q);
                const matchBody = (item.project.implementingBody || '').toLowerCase().includes(q);
                const matchVariation = item.allVariations.some(v => v.description.toLowerCase().includes(q) || v.type.toLowerCase().includes(q));
                if (!matchName && !matchId && !matchZone && !matchWoreda && !matchBody && !matchVariation) {
                    return false;
                }
            }
            // Zone filter
            if (selectedZone && item.project.zone !== selectedZone) {
                return false;
            }
            // Program filter
            if (selectedProgram && item.project.program !== selectedProgram) {
                return false;
            }
            // Status / Health filter
            if (selectedStatusFilter === 'critical') {
                return item.isCriticalOverrun;
            }
            if (selectedStatusFilter === 'any_overrun') {
                return item.isCriticalOverrun || item.isModerateOverrun;
            }
            if (selectedStatusFilter === 'high_variation') {
                return item.variationExpansionPct >= 10 || item.approvedVariationsCost > 0;
            }
            if (selectedStatusFilter === 'near_ceiling') {
                return item.isNearCeiling;
            }
            if (selectedStatusFilter === 'healthy') {
                return item.isHealthy;
            }
            if (selectedStatusFilter === 'pending_variations') {
                return item.pendingVariations.length > 0;
            }
            return true;
        }).sort((a, b) => {
            if (sortBy === 'overrun_desc') {
                return b.varianceVsRevised - a.varianceVsRevised;
            }
            if (sortBy === 'overrun_pct_desc') {
                return b.varianceVsRevisedPct - a.varianceVsRevisedPct;
            }
            if (sortBy === 'variation_desc') {
                return b.approvedVariationsCost - a.approvedVariationsCost;
            }
            if (sortBy === 'revised_desc') {
                return b.revisedBudget - a.revisedBudget;
            }
            if (sortBy === 'original_desc') {
                return b.originalBudget - a.originalBudget;
            }
            if (sortBy === 'name_asc') {
                return a.project.name.localeCompare(b.project.name);
            }
            return 0;
        });
    }, [allOverrunData, searchQuery, selectedZone, selectedProgram, selectedStatusFilter, sortBy]);
    // Chart Data 1: Top 10 Projects Budget vs. Approved Variations vs. Actual
    const comparisonChartData = useMemo(() => {
        return filteredOverrunData.slice(0, 10).map(item => ({
            id: item.project.id,
            name: item.project.name.length > 18 ? `${item.project.name.substring(0, 16)}...` : item.project.name,
            fullName: item.project.name,
            originalBudget: item.originalBudget,
            approvedVariations: item.approvedVariationsCost,
            revisedBudget: item.revisedBudget,
            actualExpenditure: item.actualExpenditure,
            varianceVsRevised: item.varianceVsRevised,
            burnRatePct: Number(item.burnRateRevisedPct.toFixed(1)),
            isCritical: item.isCriticalOverrun,
            isOverrun: item.isCriticalOverrun || item.isModerateOverrun
        }));
    }, [filteredOverrunData]);
    // Chart Data 2: Variation Causes Breakdown
    const variationCausesData = useMemo(() => {
        const causeMap = {
            'Variation Order': { count: 0, totalCost: 0 },
            'Scope Change': { count: 0, totalCost: 0 },
            'Change of Amount': { count: 0, totalCost: 0 },
            'Time Extension': { count: 0, totalCost: 0 },
            'Other': { count: 0, totalCost: 0 }
        };
        allOverrunData.forEach(item => {
            item.allVariations.forEach(v => {
                const typeKey = v.type || 'Other';
                if (!causeMap[typeKey]) {
                    causeMap[typeKey] = { count: 0, totalCost: 0 };
                }
                causeMap[typeKey].count++;
                if (v.status === 'Approved') {
                    causeMap[typeKey].totalCost += v.costImpact || 0;
                }
            });
        });
        return Object.entries(causeMap).map(([type, stats]) => ({
            name: type,
            count: stats.count,
            totalCost: stats.totalCost,
            formattedCost: formatCompactCurrency(stats.totalCost)
        }));
    }, [allOverrunData]);
    // Export Cost Overrun Matrix to Excel
    const handleExportExcel = () => {
        const workbook = XLSX.utils.book_new();
        // 1. Executive Summary Sheet
        const summaryRows = [
            ['OWEB COST OVERRUN & VARIATION ORDERS AUDIT REPORT'],
            ['Generated Date', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
            [''],
            ['PORTFOLIO SUMMARY METRICS', ''],
            ['Total Monitored Projects', portfolioKPIs.totalProjects],
            ['Total Original Budget Baseline (ETB)', portfolioKPIs.totalOriginalBudget],
            ['Total Approved Variation Orders (ETB)', portfolioKPIs.totalApprovedVariations],
            ['Portfolio Variation Expansion Rate (%)', `${portfolioKPIs.portfolioVariationExpansionPct.toFixed(2)}%`],
            ['Total Authorized Revised Budget Ceiling (ETB)', portfolioKPIs.totalRevisedBudget],
            ['Total Actual Disbursed Expenditure (ETB)', portfolioKPIs.totalActualExpenditure],
            ['Total Net Portfolio Variance (ETB)', portfolioKPIs.netPortfolioVariance],
            ['Critical Overrun Projects (>10%)', portfolioKPIs.criticalOverrunCount],
            ['Moderate Overrun Projects (0-10%)', portfolioKPIs.moderateOverrunCount],
            ['Projects with Approved Variations', portfolioKPIs.projectsWithVariationsCount],
            ['Total Approved Extension of Time (Days)', portfolioKPIs.totalApprovedTimeDays]
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');
        // 2. Detailed Projects Overrun Register Sheet
        const detailedHeaders = [
            'Project ID',
            'Project Name',
            'Program',
            'Zone',
            'Woreda',
            'Project Type',
            'Implementing Body',
            'Original Budget (ETB)',
            'Approved Variations (ETB)',
            'Approved Time Extension (Days)',
            'Revised Budget Ceiling (ETB)',
            'Actual Disbursed (ETB)',
            'Variance vs Original (ETB)',
            'Variance vs Original (%)',
            'Variance vs Revised (ETB)',
            'Variance vs Revised (%)',
            'Burn Rate on Revised (%)',
            'Cost Health Tier',
            'Critical Overrun (>10%)'
        ];
        const detailedRows = filteredOverrunData.map(item => [
            item.project.id,
            item.project.name,
            item.project.program || 'N/A',
            item.project.zone,
            item.project.woreda,
            item.project.projectType,
            item.project.implementingBody,
            item.originalBudget,
            item.approvedVariationsCost,
            item.approvedTimeExtensionDays,
            item.revisedBudget,
            item.actualExpenditure,
            item.varianceVsOriginal,
            `${item.varianceVsOriginalPct.toFixed(1)}%`,
            item.varianceVsRevised,
            `${item.varianceVsRevisedPct.toFixed(1)}%`,
            `${item.burnRateRevisedPct.toFixed(1)}%`,
            item.healthTier.replace('_', ' ').toUpperCase(),
            item.isCriticalOverrun ? 'YES (CRITICAL)' : 'NO'
        ]);
        const detailedSheet = XLSX.utils.aoa_to_sheet([detailedHeaders, ...detailedRows]);
        XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Cost Overrun Register');
        // 3. Itemized Variations Log Sheet
        const variationHeaders = [
            'Project ID',
            'Project Name',
            'Variation ID',
            'Variation Type',
            'Date Issued',
            'Status',
            'Cost Impact (ETB)',
            'Time Impact (Days)',
            'Description / Justification'
        ];
        const variationRows = [];
        filteredOverrunData.forEach(item => {
            item.allVariations.forEach(v => {
                variationRows.push([
                    item.project.id,
                    item.project.name,
                    v.id,
                    v.type,
                    v.date,
                    v.status,
                    v.costImpact || 0,
                    v.timeImpactDays || 0,
                    v.description
                ]);
            });
        });
        const variationSheet = XLSX.utils.aoa_to_sheet([variationHeaders, ...variationRows]);
        XLSX.utils.book_append_sheet(workbook, variationSheet, 'Variation Orders Log');
        XLSX.writeFile(workbook, `OWEB_Cost_Overrun_Tracker_${new Date().toISOString().split('T')[0]}.xlsx`);
    };
    // Export PDF Cost Overrun Audit Report
    const handleExportPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const primaryColor = [2, 132, 199];
        const darkSlate = [15, 23, 42];
        const roseColor = [225, 29, 72];
        // Title Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 297, 18, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('OROMIA WATER RESOURCE BUREAU (OWEB)', 14, 11);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('COST OVERRUN TRACKER & VARIATION ORDERS AUDIT REPORT', 180, 11);
        let currentY = 25;
        // Executive Metrics Block
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkSlate);
        doc.text('1. Executive Financial Variance & Baseline Revision Summary', 14, currentY);
        currentY += 4;
        const summaryHeaders = [['Portfolio Metric', 'Value', 'Analysis / Compliance Status']];
        const summaryData = [
            ['Total Original Budget Baseline', `${formatCurrency(portfolioKPIs.totalOriginalBudget)} ETB`, 'Original Approved Plan Ceiling'],
            ['Approved Variation Orders (Cost Expansion)', `+${formatCurrency(portfolioKPIs.totalApprovedVariations)} ETB (+${portfolioKPIs.portfolioVariationExpansionPct.toFixed(1)}%)`, `${portfolioKPIs.projectsWithVariationsCount} projects expanded via variation orders`],
            ['Authorized Revised Budget Ceiling', `${formatCurrency(portfolioKPIs.totalRevisedBudget)} ETB`, 'Current Total Authorized Contract Ceiling'],
            ['Total Actual Disbursed Expenditure', `${formatCurrency(portfolioKPIs.totalActualExpenditure)} ETB (${portfolioKPIs.portfolioBurnRatePct.toFixed(1)}%)`, 'Cumulative Disbursements to Contractors'],
            ['Net Portfolio Cost Variance vs Revised', `${portfolioKPIs.netPortfolioVariance > 0 ? '+' : ''}${formatCurrency(portfolioKPIs.netPortfolioVariance)} ETB`, portfolioKPIs.netPortfolioVariance > 0 ? 'Net Portfolio Budget Overrun' : 'Within Total Authorized Ceiling'],
            ['Critical Overrun Projects (>10% Overrun)', `${portfolioKPIs.criticalOverrunCount} Projects`, `${formatCurrency(portfolioKPIs.totalNetOverrunExcess)} ETB unauthorized excess spending`]
        ];
        autoTable(doc, {
            startY: currentY,
            head: summaryHeaders,
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2.5 }
        });
        currentY = doc.lastAutoTable.finalY + 8;
        // Projects Overrun Register Table
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkSlate);
        doc.text('2. Project Cost Overrun & Approved Variations Register', 14, currentY);
        currentY += 4;
        const projectHeaders = [
            ['Project ID & Name', 'Zone & Woreda', 'Original Budget', 'Approved Variations', 'Revised Budget', 'Actual Disbursed', 'Variance vs Rev.', 'Burn Rate', 'Overrun Health']
        ];
        const projectRows = filteredOverrunData.slice(0, 25).map(item => [
            `${item.project.name}\n[${item.project.id}]`,
            `${item.project.zone}\n${item.project.woreda}`,
            `${formatCurrency(item.originalBudget)} ETB`,
            item.approvedVariationsCost > 0 ? `+${formatCurrency(item.approvedVariationsCost)} ETB\n(+${item.approvedTimeExtensionDays}d)` : '0 ETB',
            `${formatCurrency(item.revisedBudget)} ETB`,
            `${formatCurrency(item.actualExpenditure)} ETB`,
            `${item.varianceVsRevised > 0 ? '+' : ''}${formatCurrency(item.varianceVsRevised)} ETB\n(${item.varianceVsRevisedPct > 0 ? '+' : ''}${item.varianceVsRevisedPct.toFixed(1)}%)`,
            `${item.burnRateRevisedPct.toFixed(1)}%`,
            item.isCriticalOverrun ? 'CRITICAL (>10%)' : item.isModerateOverrun ? 'OVERRUN' : item.isNearCeiling ? 'NEAR CEILING' : 'HEALTHY'
        ]);
        autoTable(doc, {
            startY: currentY,
            head: projectHeaders,
            body: projectRows,
            theme: 'striped',
            headStyles: { fillColor: darkSlate, textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 7, cellPadding: 2 },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 8) {
                    const text = data.cell.raw;
                    if (text && text.includes('CRITICAL')) {
                        data.cell.styles.textColor = roseColor;
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });
        doc.save(`OWEB_Cost_Overrun_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    // Handler to run a variation order what-if simulation
    const calculateSimulation = () => {
        if (!simulationProject)
            return null;
        const currentOriginal = simulationProject.originalBudget;
        const currentApprovedVar = simulationProject.approvedVariationsCost;
        const currentRevised = simulationProject.revisedBudget;
        const currentActual = simulationProject.actualExpenditure;
        const simulatedNewVariationCost = currentApprovedVar + (Number(simCostImpact) || 0);
        const simulatedNewRevisedBudget = currentOriginal + simulatedNewVariationCost;
        const simulatedNewTimeDays = simulationProject.approvedTimeExtensionDays + (Number(simTimeExtensionDays) || 0);
        const simulatedVarianceVsOriginal = currentActual - currentOriginal;
        const simulatedVarianceVsNewRevised = currentActual - simulatedNewRevisedBudget;
        const simulatedNewBurnRate = simulatedNewRevisedBudget > 0 ? (currentActual / simulatedNewRevisedBudget) * 100 : 0;
        const simulatedVariationExpansionPct = currentOriginal > 0 ? (simulatedNewVariationCost / currentOriginal) * 100 : 0;
        const willBeCriticalOverrun = simulatedNewRevisedBudget > 0 && currentActual > simulatedNewRevisedBudget * 1.10;
        const willBeModerateOverrun = !willBeCriticalOverrun && currentActual > simulatedNewRevisedBudget;
        return {
            currentOriginal,
            currentApprovedVar,
            currentRevised,
            currentActual,
            simulatedNewVariationCost,
            simulatedNewRevisedBudget,
            simulatedNewTimeDays,
            simulatedVarianceVsOriginal,
            simulatedVarianceVsNewRevised,
            simulatedNewBurnRate,
            simulatedVariationExpansionPct,
            willBeCriticalOverrun,
            willBeModerateOverrun
        };
    };
    const simResults = calculateSimulation();
    return (<div className="space-y-6" id="cost-overrun-tracker-root">
            {/* Header with Title and Global Action Buttons */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </span>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Cost Overrun & Variation Orders Tracker</h2>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                    Financial Baseline &amp; Change Orders
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Calculates exact variances between original project budget estimates, approved variation orders, revised cost ceilings, and actual disbursed expenditures.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
                    <button onClick={handleExportExcel} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer" title="Export cost overrun register and variations audit to Excel">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span>Export Excel Register</span>
                    </button>
                    <button onClick={handleExportPDF} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer" title="Download executive cost overrun and variations PDF report">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                        </svg>
                        <span>Download Audit PDF</span>
                    </button>
                </div>
            </div>

            {/* CRITICAL BUDGET OVERRUN ALERT BANNER */}
            {portfolioKPIs.criticalOverrunCount > 0 && (<div className="bg-rose-50 border-2 border-rose-400/90 rounded-2xl p-4.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                    <div className="flex items-start gap-3.5">
                        <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs flex-shrink-0 animate-pulse">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-rose-600 text-white shadow-xs flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                                    Critical Overrun Alert (&gt;10% Over Revised Ceiling)
                                </span>
                                <h4 className="text-sm font-bold text-rose-950">
                                    {portfolioKPIs.criticalOverrunCount} {portfolioKPIs.criticalOverrunCount === 1 ? 'Project has' : 'Projects have'} exceeded approved revised budget ceiling by over 10%
                                </h4>
                            </div>
                            <p className="text-xs text-rose-800 mt-1">
                                Cumulative unauthorized excess expenditure: <strong className="font-mono text-rose-950">{formatCurrency(portfolioKPIs.totalNetOverrunExcess)} ETB</strong>. High-risk projects require immediate Bureau audit and variation order regularizations.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'critical' ? 'all' : 'critical')} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${selectedStatusFilter === 'critical'
                ? 'bg-rose-700 text-white ring-2 ring-rose-500'
                : 'bg-white text-rose-700 hover:bg-rose-100 border border-rose-300'}`}>
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                            <span>{selectedStatusFilter === 'critical' ? 'Showing All Projects' : `Filter ${portfolioKPIs.criticalOverrunCount} Flagged Projects`}</span>
                        </button>
                    </div>
                </div>)}

            {/* TOP 5 EXECUTIVE KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Metric 1: Original Budget Baseline */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Original Baseline Budget</span>
                        <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                            {ICONS.briefcase}
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-bold font-mono text-slate-900">{formatCompactCurrency(portfolioKPIs.totalOriginalBudget)}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Baseline across {portfolioKPIs.totalProjects} active projects
                        </p>
                    </div>
                </div>

                {/* Metric 2: Approved Variation Orders */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Approved Variations</span>
                        <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/>
                            </svg>
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-bold font-mono text-purple-700">+{formatCompactCurrency(portfolioKPIs.totalApprovedVariations)}</p>
                        <p className="text-xs text-purple-600 font-medium mt-1">
                            +{portfolioKPIs.portfolioVariationExpansionPct.toFixed(1)}% baseline budget expansion
                        </p>
                    </div>
                </div>

                {/* Metric 3: Total Revised Budget Ceiling */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Revised Budget Ceiling</span>
                        <span className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                            </svg>
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-bold font-mono text-sky-700">{formatCompactCurrency(portfolioKPIs.totalRevisedBudget)}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Authorized contract ceiling
                        </p>
                    </div>
                </div>

                {/* Metric 4: Actual Disbursed Expenditure */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Actual Disbursed</span>
                        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            {ICONS.fileSignature}
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-bold font-mono text-indigo-700">{formatCompactCurrency(portfolioKPIs.totalActualExpenditure)}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            {portfolioKPIs.portfolioBurnRatePct.toFixed(1)}% of revised ceiling utilized
                        </p>
                    </div>
                </div>

                {/* Metric 5: Net Variance & Overrun Count */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cost Overrun Status</span>
                        <span className={`p-2 rounded-xl ${portfolioKPIs.criticalOverrunCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {ICONS.shieldAlert}
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold font-mono text-rose-600">{portfolioKPIs.criticalOverrunCount}</span>
                            <span className="text-xs font-semibold text-rose-700">Critical (&gt;10%)</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            +{portfolioKPIs.moderateOverrunCount} moderate | {portfolioKPIs.projectsWithVariationsCount} w/ variations
                        </p>
                    </div>
                </div>
            </div>

            {/* VISUAL CHARTS: Progression Comparison & Causes Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CHART 1: Original Budget vs Approved Variations vs Actual Disbursed (2 Cols) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                                Budget Progression: Original vs. Approved Variations vs. Actual Expenditure
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Visualizes baseline budget, variation expansions, and actual payments to pinpoint overrun drivers.
                            </p>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        {comparisonChartData.length > 0 ? (<ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonChartData} margin={{ top: 10, right: 20, left: 10, bottom: 45 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                    <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={50} tick={{ fontSize: 10, fill: '#475569' }}/>
                                    <YAxis tickFormatter={(val) => formatCompactCurrency(val)} tick={{ fontSize: 10, fill: '#475569' }}/>
                                    <Tooltip content={({ active, payload }) => {
                if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (<div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700">
                                                        <p className="font-bold text-sky-400 border-b border-slate-700 pb-1">{data.fullName}</p>
                                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                                                            <span className="text-slate-400">Original Baseline:</span>
                                                            <span className="font-mono text-right">{formatCompactCurrency(data.originalBudget)}</span>
                                                            <span className="text-purple-300">Approved Variations:</span>
                                                            <span className="font-mono text-right text-purple-300">+{formatCompactCurrency(data.approvedVariations)}</span>
                                                            <span className="text-sky-300">Revised Ceiling:</span>
                                                            <span className="font-mono text-right text-sky-300 font-bold">{formatCompactCurrency(data.revisedBudget)}</span>
                                                            <span className="text-slate-400">Actual Disbursed:</span>
                                                            <span className="font-mono text-right text-emerald-300 font-bold">{formatCompactCurrency(data.actualExpenditure)}</span>
                                                            <span className="text-slate-400">Variance vs Revised:</span>
                                                            <span className={`font-mono text-right font-bold ${data.varianceVsRevised > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                                {data.varianceVsRevised > 0 ? `+${formatCompactCurrency(data.varianceVsRevised)} (Overrun)` : `${formatCompactCurrency(data.varianceVsRevised)} (Under)`}
                                                            </span>
                                                        </div>
                                                        {data.isCritical && (<div className="mt-1 px-2 py-0.5 bg-rose-600 text-white font-bold text-[10px] rounded text-center animate-pulse">
                                                                ⚠️ CRITICAL OVERRUN (&gt;10% OVER REVISED CEILING)
                                                            </div>)}
                                                    </div>);
                }
                return null;
            }}/>
                                    <Legend wrapperStyle={{ fontSize: 11 }}/>
                                    <Bar dataKey="originalBudget" name="Original Baseline (ETB)" fill="#94a3b8" radius={[3, 3, 0, 0]}/>
                                    <Bar dataKey="approvedVariations" name="Approved Variations (ETB)" fill="#a855f7" radius={[3, 3, 0, 0]}/>
                                    <Bar dataKey="actualExpenditure" name="Actual Disbursed (ETB)" radius={[3, 3, 0, 0]}>
                                        {comparisonChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.isCritical ? '#dc2626' : entry.isOverrun ? '#f43f5e' : entry.burnRatePct >= 85 ? '#f59e0b' : '#10b981'}/>))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>) : (<div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                No matching project records found.
                            </div>)}
                    </div>
                </div>

                {/* CHART 2: Variation Causes & Impact Distribution (1 Col) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                            Variation Order Categories
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Total cost expansion by variation justification type across OWEB portfolio.
                        </p>
                    </div>

                    <div className="my-4 space-y-2.5">
                        {variationCausesData.map((item, index) => {
            const colors = ['#6366f1', '#a855f7', '#0284c7', '#f59e0b', '#64748b'];
            const color = colors[index % colors.length];
            const pct = portfolioKPIs.totalApprovedVariations > 0
                ? (item.totalCost / portfolioKPIs.totalApprovedVariations) * 100
                : 0;
            return (<div key={item.name} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                                            {item.name}
                                        </span>
                                        <span className="font-bold font-mono text-slate-800">{item.formattedCost}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}></div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                                        <span>{item.count} variation orders recorded</span>
                                        <span className="font-bold">{pct.toFixed(1)}% of total</span>
                                    </div>
                                </div>);
        })}
                    </div>

                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between text-xs text-purple-900">
                        <span className="font-semibold">Cumulative Time Extensions:</span>
                        <strong className="font-mono text-purple-950 font-bold">+{portfolioKPIs.totalApprovedTimeDays} Days</strong>
                    </div>
                </div>
            </div>

            {/* DYNAMIC SEARCH & FILTER CONTROL BAR */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <span className="text-rose-600 font-bold">{ICONS.search}</span>
                        <h4 className="text-sm font-bold text-slate-800">Cost Overrun &amp; Variation Filters</h4>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span>Showing <strong>{filteredOverrunData.length}</strong> of {allOverrunData.length} projects</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {/* Search Input */}
                    <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Search Projects &amp; Variations</label>
                        <input type="text" placeholder="Name, ID, Woreda, Justification..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none"/>
                    </div>

                    {/* Zone Selector */}
                    <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Zone Filter</label>
                        <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none">
                            <option value="">All Oromia Zones</option>
                            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                    </div>

                    {/* Program Filter */}
                    <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Program Portfolio</label>
                        <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none">
                            <option value="">All WaSH Programs</option>
                            {Object.keys(PROGRAM_DEFINITIONS).map(prog => (<option key={prog} value={prog}>{prog}</option>))}
                        </select>
                    </div>

                    {/* Overrun & Health Scope Filter */}
                    <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Overrun Severity Filter</label>
                        <select value={selectedStatusFilter} onChange={(e) => setSelectedStatusFilter(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none font-medium">
                            <option value="all">All Projects</option>
                            <option value="critical">⚠️ Critical Overruns (&gt;10% Over Revised)</option>
                            <option value="any_overrun">All Overruns (&gt;100% of Revised)</option>
                            <option value="high_variation">High Variation Orders (&gt;10% added)</option>
                            <option value="near_ceiling">Watchlist (85-100% of Revised)</option>
                            <option value="healthy">Within Budget / Healthy (&lt;85%)</option>
                            <option value="pending_variations">⏳ Pending Variations</option>
                        </select>
                    </div>

                    {/* Sort Selector */}
                    <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Sort Matrix By</label>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none font-medium">
                            <option value="overrun_desc">Highest Overrun Amount (ETB)</option>
                            <option value="overrun_pct_desc">Highest Overrun %</option>
                            <option value="variation_desc">Highest Approved Variations</option>
                            <option value="revised_desc">Highest Revised Budget</option>
                            <option value="original_desc">Highest Original Budget</option>
                            <option value="name_asc">Project Name (A-Z)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* DETAILED COST OVERRUN & VARIATION REGISTER TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">Cost Overrun &amp; Variation Orders Audit Register</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Itemized financial baseline tracking, variation orders breakdown, and variance calculation vs. approved ceilings.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">Click row or actions to inspect itemized variations and run what-if simulations</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                            <tr>
                                <th className="px-4 py-3.5">Project Details</th>
                                <th className="px-4 py-3.5">Location &amp; Sector</th>
                                <th className="px-4 py-3.5 text-right">Original Budget</th>
                                <th className="px-4 py-3.5 text-right">Approved Variations</th>
                                <th className="px-4 py-3.5 text-right">Revised Budget Ceiling</th>
                                <th className="px-4 py-3.5 text-right">Actual Disbursed</th>
                                <th className="px-4 py-3.5 text-center">Variance vs. Revised</th>
                                <th className="px-4 py-3.5 text-center">Burn Rate</th>
                                <th className="px-4 py-3.5 text-center">Overrun Status</th>
                                <th className="px-4 py-3.5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                            {filteredOverrunData.map((item, idx) => {
            const isExpanded = expandedProjectId === item.project.id;
            return (<React.Fragment key={item.project.id}>
                                        <tr className={`${item.isCriticalOverrun
                    ? 'bg-rose-50/60 border-l-4 border-l-rose-600'
                    : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-sky-50/60 transition-colors`}>
                                            {/* Project Details */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="font-bold text-slate-800">{item.project.name}</div>
                                                    {item.isCriticalOverrun && (<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-600 text-white shadow-xs flex-shrink-0 animate-pulse">
                                                            <span className="w-1 h-1 rounded-full bg-white"></span>
                                                            &gt;10% OVERRUN
                                                        </span>)}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                                    <span>{item.project.id}</span>
                                                    {item.project.program && (<span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                                            {item.project.program}
                                                        </span>)}
                                                </div>
                                            </td>

                                            {/* Location & Sector */}
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-700">{item.project.zone}</div>
                                                <div className="text-[10px] text-slate-500">{item.project.woreda} • {item.project.projectType}</div>
                                            </td>

                                            {/* Original Budget */}
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                                                {formatCurrency(item.originalBudget)} <span className="text-[10px] font-normal text-slate-400">ETB</span>
                                            </td>

                                            {/* Approved Variations */}
                                            <td className="px-4 py-3 text-right font-mono">
                                                {item.approvedVariationsCost > 0 ? (<div>
                                                        <span className="font-bold text-purple-700">+{formatCurrency(item.approvedVariationsCost)} ETB</span>
                                                        <div className="text-[10px] text-purple-600">
                                                            +{item.variationExpansionPct.toFixed(1)}% ({item.approvedVariations.length} orders, +{item.approvedTimeExtensionDays}d)
                                                        </div>
                                                    </div>) : (<span className="text-slate-400 font-mono">0 ETB</span>)}
                                                {item.pendingVariationsCost > 0 && (<div className="text-[9px] text-amber-600 font-medium">
                                                        +{formatCompactCurrency(item.pendingVariationsCost)} pending
                                                    </div>)}
                                            </td>

                                            {/* Revised Budget Ceiling */}
                                            <td className="px-4 py-3 text-right font-mono font-bold text-sky-800">
                                                {formatCurrency(item.revisedBudget)} <span className="text-[10px] font-normal text-slate-400">ETB</span>
                                            </td>

                                            {/* Actual Disbursed */}
                                            <td className={`px-4 py-3 text-right font-mono font-bold ${item.isCriticalOverrun ? 'text-rose-600 font-extrabold' : 'text-emerald-600'}`}>
                                                {formatCurrency(item.actualExpenditure)} <span className="text-[10px] font-normal text-slate-400">ETB</span>
                                            </td>

                                            {/* Variance vs. Revised */}
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={`font-mono font-bold text-xs ${item.varianceVsRevised > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                        {item.varianceVsRevised > 0 ? `+${formatCurrency(item.varianceVsRevised)}` : formatCurrency(item.varianceVsRevised)} ETB
                                                    </span>
                                                    <span className={`text-[10px] font-semibold ${item.varianceVsRevisedPct > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                                        {item.varianceVsRevisedPct > 0 ? `+${item.varianceVsRevisedPct.toFixed(1)}% Over` : `${item.varianceVsRevisedPct.toFixed(1)}% Remaining`}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Burn Rate */}
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-mono font-bold text-xs ${item.isCriticalOverrun ? 'text-rose-700 font-extrabold' : item.burnRateRevisedPct > 100 ? 'text-rose-600' : item.burnRateRevisedPct >= 85 ? 'text-amber-600' : 'text-emerald-700'}`}>
                                                    {item.burnRateRevisedPct.toFixed(1)}%
                                                </span>
                                            </td>

                                            {/* Overrun Status Badge */}
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${item.isCriticalOverrun
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : item.isModerateOverrun
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : item.isNearCeiling
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : item.approvedVariationsCost > 0
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                                    {item.isCriticalOverrun
                    ? '⚠️ Critical Overrun (>10%)'
                    : item.isModerateOverrun
                        ? 'Budget Overrun'
                        : item.isNearCeiling
                            ? 'Watchlist (85-100%)'
                            : item.approvedVariationsCost > 0
                                ? 'Expanded Baseline'
                                : 'Within Budget'}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button onClick={() => setExpandedProjectId(isExpanded ? null : item.project.id)} className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${isExpanded
                    ? 'bg-primary-50 text-primary-700 border-primary-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`} title="Toggle variation orders and phase breakdown">
                                                        {isExpanded ? (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"/></svg>) : (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>)}
                                                    </button>
                                                    <button onClick={() => setSelectedProjectModal(item)} className="px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer" title="Inspect full variation audit and project history">
                                                        Inspect
                                                    </button>
                                                    <button onClick={() => {
                    setSimulationProject(item);
                    setSimCostImpact(item.originalBudget * 0.05 || 250000);
                    setSimulationSavedAlert(null);
                }} className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer" title="Simulate proposed new variation order impact on cost ceiling">
                                                        Simulate
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* EXPANDED ROW: Itemized Variations & Phase Costs */}
                                        {isExpanded && (<tr className="bg-slate-50/90 border-y border-slate-200">
                                                <td colSpan={10} className="p-4 space-y-4">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        {/* Sub-panel 1: Variation Orders Log */}
                                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                                                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                                                                    Variation Orders Register ({item.allVariations.length})
                                                                </h5>
                                                                <span className="text-[11px] text-purple-700 font-bold font-mono">
                                                                    Total Approved: +{formatCurrency(item.approvedVariationsCost)} ETB
                                                                </span>
                                                            </div>

                                                            {item.allVariations.length > 0 ? (<div className="space-y-2">
                                                                    {item.allVariations.map(v => (<div key={v.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-mono font-bold text-slate-800">{v.id}</span>
                                                                                    <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-semibold">{v.type}</span>
                                                                                </div>
                                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : v.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                                                                                    {v.status}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-slate-600 text-[11px]">{v.description}</p>
                                                                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                                                                                <span>Issued: {formatDateDisplay(v.date)}</span>
                                                                                <div className="space-x-2 font-mono">
                                                                                    <span className="font-bold text-purple-700">Cost: +{formatCurrency(v.costImpact || 0)} ETB</span>
                                                                                    <span className="text-slate-600">Time: +{v.timeImpactDays || 0} days</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>))}
                                                                </div>) : (<p className="text-xs text-slate-400 italic py-2">
                                                                    No variation orders recorded for this contract. Budget matches original baseline estimate.
                                                                </p>)}
                                                        </div>

                                                        {/* Sub-panel 2: Phase Costs & Variance Breakdown */}
                                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                                                    <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                                                                    Implementation Phase Cost Variances
                                                                </h5>
                                                                <span className="text-[11px] text-slate-500">
                                                                    {item.phaseCosts.length} phases configured
                                                                </span>
                                                            </div>

                                                            {item.phaseCosts.length > 0 ? (<div className="overflow-x-auto">
                                                                    <table className="w-full text-[11px] text-left">
                                                                        <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                                                                            <tr>
                                                                                <th className="p-1.5">Phase</th>
                                                                                <th className="p-1.5 text-right">Planned (ETB)</th>
                                                                                <th className="p-1.5 text-right">Actual (ETB)</th>
                                                                                <th className="p-1.5 text-right">Variance</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100">
                                                                            {item.phaseCosts.map((ph, pIdx) => {
                            const phaseVar = ph.actualExpenditure - ph.originalBudget;
                            return (<tr key={pIdx}>
                                                                                        <td className="p-1.5 font-medium text-slate-700">{ph.phase}</td>
                                                                                        <td className="p-1.5 text-right font-mono text-slate-600">{formatCompactCurrency(ph.originalBudget)}</td>
                                                                                        <td className="p-1.5 text-right font-mono font-bold text-slate-800">{formatCompactCurrency(ph.actualExpenditure)}</td>
                                                                                        <td className={`p-1.5 text-right font-mono font-bold ${phaseVar > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                                                            {phaseVar > 0 ? `+${formatCompactCurrency(phaseVar)}` : formatCompactCurrency(phaseVar)}
                                                                                        </td>
                                                                                    </tr>);
                        })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>) : (<div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-1">
                                                                    <p>Standard single-package contract implementation.</p>
                                                                    <div className="flex justify-between font-mono pt-1 text-[11px]">
                                                                        <span>Original: {formatCurrency(item.originalBudget)} ETB</span>
                                                                        <span className="text-emerald-700 font-bold">Disbursed: {formatCurrency(item.actualExpenditure)} ETB</span>
                                                                    </div>
                                                                </div>)}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>)}
                                    </React.Fragment>);
        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL 1: WHAT-IF VARIATION SIMULATOR */}
            {simulationProject && simResults && (<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 border border-slate-200">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                                    </span>
                                    <h3 className="text-base font-bold text-slate-800">Variation Order What-If Impact Simulator</h3>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Project: <strong>{simulationProject.project.name}</strong> ({simulationProject.project.id})
                                </p>
                            </div>
                            <button onClick={() => setSimulationProject(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>

                        {/* Input Simulation Parameters */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Proposed Variation Type</label>
                                <select value={simVariationType} onChange={(e) => setSimVariationType(e.target.value)} className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none">
                                    <option value="Variation Order">Variation Order (Site &amp; Ground Conditions)</option>
                                    <option value="Scope Change">Scope Change / Pipe Extension</option>
                                    <option value="Time Extension">Time Extension with Price Adjustment</option>
                                    <option value="Change of Amount">Change of Amount / Material Escalation</option>
                                    <option value="Other">Other Design Modification</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Proposed Cost Impact (ETB)</label>
                                <input type="number" min="0" step="10000" value={simCostImpact} onChange={(e) => setSimCostImpact(Number(e.target.value))} className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"/>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Time Extension Requested (Days)</label>
                                <input type="number" min="0" value={simTimeExtensionDays} onChange={(e) => setSimTimeExtensionDays(Number(e.target.value))} className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"/>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Engineering Justification</label>
                                <input type="text" value={simJustification} onChange={(e) => setSimJustification(e.target.value)} className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"/>
                            </div>
                        </div>

                        {/* Simulation Output Comparison Grid */}
                        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                                Simulated Financial Baseline Impact
                            </h4>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div className="p-2.5 bg-white rounded-lg border border-purple-100">
                                    <span className="text-[10px] text-slate-500 block">Original Baseline</span>
                                    <span className="font-bold font-mono text-slate-800">{formatCompactCurrency(simResults.currentOriginal)}</span>
                                </div>
                                <div className="p-2.5 bg-white rounded-lg border border-purple-100">
                                    <span className="text-[10px] text-slate-500 block">Total Variations</span>
                                    <span className="font-bold font-mono text-purple-700">+{formatCompactCurrency(simResults.simulatedNewVariationCost)}</span>
                                </div>
                                <div className="p-2.5 bg-white rounded-lg border border-purple-100">
                                    <span className="text-[10px] text-slate-500 block">New Revised Ceiling</span>
                                    <span className="font-bold font-mono text-sky-800">{formatCompactCurrency(simResults.simulatedNewRevisedBudget)}</span>
                                </div>
                                <div className="p-2.5 bg-white rounded-lg border border-purple-100">
                                    <span className="text-[10px] text-slate-500 block">Simulated Burn Rate</span>
                                    <span className={`font-bold font-mono ${simResults.willBeCriticalOverrun ? 'text-rose-600' : 'text-emerald-700'}`}>
                                        {simResults.simulatedNewBurnRate.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {/* Overrun Threshold Verification */}
                            <div className="p-3 rounded-lg border text-xs flex items-center justify-between gap-3 bg-white">
                                <div>
                                    <span className="font-bold text-slate-800">10% Overrun Threshold Status:</span>
                                    <p className="text-[11px] text-slate-500">
                                        {simResults.willBeCriticalOverrun
                ? '⚠️ Projected expenditure exceeds new revised ceiling by >10%.'
                : '✅ Within approved allowable tolerance after variation authorization.'}
                                    </p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${simResults.willBeCriticalOverrun ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                    {simResults.willBeCriticalOverrun ? 'CRITICAL RISK' : 'APPROVED TOLERANCE'}
                                </span>
                            </div>
                        </div>

                        {simulationSavedAlert && (<div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                                <span>{simulationSavedAlert}</span>
                            </div>)}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button onClick={() => setSimulationProject(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer">
                                Close Simulator
                            </button>
                            <button onClick={() => {
                setSimulationSavedAlert(`Simulated variation of +${formatCurrency(simCostImpact)} ETB recorded in what-if scenario log.`);
            }} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer">
                                Save Simulation Scenario
                            </button>
                        </div>
                    </div>
                </div>)}

            {/* MODAL 2: FULL PROJECT INSPECTION & AUDIT LOG */}
            {selectedProjectModal && (<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                                        {ICONS.briefcase}
                                    </span>
                                    <h3 className="text-base font-bold text-slate-800">{selectedProjectModal.project.name}</h3>
                                </div>
                                <p className="text-xs text-slate-500">
                                    ID: <span className="font-mono">{selectedProjectModal.project.id}</span> | {selectedProjectModal.project.zone} Zone, {selectedProjectModal.project.woreda}
                                </p>
                            </div>
                            <button onClick={() => setSelectedProjectModal(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>

                        {/* Financial Variance Overview Table */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <span className="text-[10px] text-slate-500 block uppercase font-bold">Original Budget</span>
                                <span className="text-sm font-bold font-mono text-slate-800">{formatCurrency(selectedProjectModal.originalBudget)} ETB</span>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                                <span className="text-[10px] text-purple-700 block uppercase font-bold">Approved Variations</span>
                                <span className="text-sm font-bold font-mono text-purple-900">+{formatCurrency(selectedProjectModal.approvedVariationsCost)} ETB</span>
                            </div>
                            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                                <span className="text-[10px] text-sky-700 block uppercase font-bold">Revised Ceiling</span>
                                <span className="text-sm font-bold font-mono text-sky-900">{formatCurrency(selectedProjectModal.revisedBudget)} ETB</span>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                                <span className="text-[10px] text-emerald-700 block uppercase font-bold">Actual Disbursed</span>
                                <span className="text-sm font-bold font-mono text-emerald-900">{formatCurrency(selectedProjectModal.actualExpenditure)} ETB</span>
                            </div>
                        </div>

                        {/* Itemized Variation Orders */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Itemized Variation Orders &amp; Change Authorizations
                            </h4>

                            {selectedProjectModal.allVariations.length > 0 ? (<div className="space-y-2">
                                    {selectedProjectModal.allVariations.map(v => (<div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-slate-800">{v.id}</span>
                                                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-semibold">{v.type}</span>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${v.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                    {v.status}
                                                </span>
                                            </div>
                                            <p className="text-slate-700">{v.description}</p>
                                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                                                <span>Issued: {formatDateDisplay(v.date)}</span>
                                                <div className="space-x-3 font-mono">
                                                    <span className="font-bold text-purple-700">Cost Impact: +{formatCurrency(v.costImpact || 0)} ETB</span>
                                                    <span className="text-slate-600">Time Impact: +{v.timeImpactDays || 0} days</span>
                                                </div>
                                            </div>
                                        </div>))}
                                </div>) : (<p className="text-xs text-slate-400 italic py-2">
                                    No variation orders logged for this project contract.
                                </p>)}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            {onNavigate && (<button onClick={() => {
                    setSelectedProjectModal(null);
                    onNavigate('contract', selectedProjectModal.contract?.id);
                }} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer">
                                    Open Contract Details
                                </button>)}
                            <button onClick={() => setSelectedProjectModal(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer">
                                Close Audit Modal
                            </button>
                        </div>
                    </div>
                </div>)}
        </div>);
};
export default CostOverrunTracker;
