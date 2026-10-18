import React, { useState, useMemo } from 'react';
import { ProjectStatus } from '../types';
import { ZONES, ICONS, PROJECT_TYPES } from '../constants';
import { CostOverrunTracker } from './CostOverrunTracker';
import { ProgressGauge, ProjectProgressGaugeSection } from './ProgressGauge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, ComposedChart, Line, ReferenceLine, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);
};
const formatCompactCurrency = (val) => {
    if (val >= 1_000_000_000)
        return `${(val / 1_000_000_000).toFixed(1)}B ETB`;
    if (val >= 1_000_000)
        return `${(val / 1_000_000).toFixed(1)}M ETB`;
    if (val >= 1_000)
        return `${(val / 1_000).toFixed(0)}k ETB`;
    return `${val} ETB`;
};
const formatDateDisplay = (dateStr) => {
    if (!dateStr)
        return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime()))
        return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
const PerformanceDashboard = ({ projects, contracts, procurements = [], user, onSelectProject, onNavigate, inspections = [], weeklyPlans = [] }) => {
    // Navigation Sub-tab ('timelines' | 'progress_gauges' | 'cost_overrun' | 'program_evm')
    const [activeSubTab, setActiveSubTab] = useState('timelines');
    // Search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedZone, setSelectedZone] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedHealth, setSelectedHealth] = useState('all');
    const [statusScope, setStatusScope] = useState('active_only');
    const [chartSortBy, setChartSortBy] = useState('variance_desc');
    const [selectedProjectModal, setSelectedProjectModal] = useState(null);
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
    // Build comprehensive performance metrics for all projects
    const allPerformanceData = useMemo(() => {
        const today = new Date();
        return projects.map(p => {
            const projectContracts = projectContractsMap.get(p.id) || [];
            // 1. Calculate Actual Financial Expenditure
            const contractExpenditure = projectContracts.reduce((sum, c) => {
                const pays = (c.payments || []).reduce((pSum, pay) => pSum + (pay.actualAmount || 0), 0);
                return sum + pays;
            }, 0);
            const phaseCostExpenditure = (p.phaseCosts || []).reduce((sum, phase) => sum + (phase.actualExpenditure || 0), 0);
            const actualExpenditure = Math.max(contractExpenditure, phaseCostExpenditure);
            const approvedBudget = p.estimatedBudget || 0;
            const contractValue = projectContracts.reduce((sum, c) => sum + p.estimatedBudget, 0);
            const budgetUtilizationPct = approvedBudget > 0 ? (actualExpenditure / approvedBudget) * 100 : 0;
            const budgetVariance = approvedBudget - actualExpenditure;
            let budgetHealth = 'healthy';
            if (budgetUtilizationPct > 100) {
                budgetHealth = 'overrun';
            }
            else if (budgetUtilizationPct >= 85) {
                budgetHealth = 'warning';
            }
            // Warning system: actual spending exceeds planned budget by > 10%
            const isCriticalBudgetOverrun = approvedBudget > 0 && actualExpenditure > approvedBudget * 1.10;
            const overrunExcessAmount = Math.max(0, actualExpenditure - approvedBudget);
            const overrunPct = approvedBudget > 0 && actualExpenditure > approvedBudget
                ? ((actualExpenditure - approvedBudget) / approvedBudget) * 100
                : 0;
            // 2. Calculate Planned vs. Actual Timeline Dates & Variance
            const parseDate = (dStr) => (dStr ? new Date(dStr) : null);
            // Planned Dates
            const plannedStart = parseDate(p.plannedStartDate) || parseDate(p.feasibilityStudyDate) || new Date('2025-01-01');
            const plannedEnd = parseDate(p.plannedCompletionDate) || new Date(plannedStart.getTime() + 365 * 86400000);
            const plannedDurationDays = Math.max(1, Math.round((plannedEnd.getTime() - plannedStart.getTime()) / (1000 * 60 * 60 * 24)));
            // Actual / Forecast Dates
            const actualStart = parseDate(p.actualStartDate) || plannedStart;
            const isCompleted = p.status === ProjectStatus.COMPLETED || !!p.actualCompletionDate;
            const actualEnd = parseDate(p.actualCompletionDate) || (isCompleted ? today : (today > plannedEnd ? today : plannedEnd));
            const actualOrElapsedDays = Math.max(1, Math.round((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24)));
            // Schedule Variance: positive means actual duration exceeded planned duration or actual completion passed planned completion
            let scheduleVarianceDays = 0;
            if (isCompleted && p.actualCompletionDate && p.plannedCompletionDate) {
                const actualComp = new Date(p.actualCompletionDate);
                const planComp = new Date(p.plannedCompletionDate);
                scheduleVarianceDays = Math.round((actualComp.getTime() - planComp.getTime()) / (1000 * 60 * 60 * 24));
            }
            else if (p.plannedCompletionDate) {
                const planComp = new Date(p.plannedCompletionDate);
                if (today > planComp) {
                    scheduleVarianceDays = Math.round((today.getTime() - planComp.getTime()) / (1000 * 60 * 60 * 24));
                }
                else {
                    scheduleVarianceDays = Math.round((actualOrElapsedDays - plannedDurationDays));
                }
            }
            let scheduleHealth = 'on_time';
            if (scheduleVarianceDays > 30) {
                scheduleHealth = 'critical_delay';
            }
            else if (scheduleVarianceDays > 0) {
                scheduleHealth = 'minor_delay';
            }
            // Estimate schedule progress percentage
            let scheduleProgressPct = 0;
            if (isCompleted) {
                scheduleProgressPct = 100;
            }
            else {
                const totalSpan = Math.max(1, plannedEnd.getTime() - plannedStart.getTime());
                const elapsedSpan = Math.max(0, today.getTime() - actualStart.getTime());
                scheduleProgressPct = Math.min(100, Math.round((elapsedSpan / totalSpan) * 100));
            }
            // Composite Performance Health
            let compositeHealth = 'on_track';
            if (budgetHealth === 'overrun' && scheduleHealth === 'critical_delay') {
                compositeHealth = 'critical';
            }
            else if (budgetHealth === 'overrun') {
                compositeHealth = 'cost_overrun';
            }
            else if (scheduleHealth === 'critical_delay') {
                compositeHealth = 'schedule_risk';
            }
            else if (scheduleHealth === 'on_time' && budgetUtilizationPct <= 90) {
                compositeHealth = 'optimal';
            }
            return {
                id: p.id,
                name: p.name,
                zone: p.zone,
                woreda: p.woreda,
                projectType: p.projectType,
                implementingBody: p.implementingBody,
                status: p.status,
                plannedStartDateStr: p.plannedStartDate || plannedStart.toISOString().split('T')[0],
                plannedCompletionDateStr: p.plannedCompletionDate || plannedEnd.toISOString().split('T')[0],
                actualStartDateStr: p.actualStartDate || actualStart.toISOString().split('T')[0],
                actualCompletionDateStr: p.actualCompletionDate || (isCompleted ? actualEnd.toISOString().split('T')[0] : 'In Progress'),
                plannedDurationDays,
                actualOrElapsedDays,
                scheduleVarianceDays,
                scheduleHealth,
                isCompleted,
                approvedBudget,
                actualExpenditure,
                contractValue,
                budgetUtilizationPct,
                budgetVariance,
                budgetHealth,
                isCriticalBudgetOverrun,
                overrunExcessAmount,
                overrunPct,
                scheduleProgressPct,
                compositeHealth
            };
        });
    }, [projects, projectContractsMap]);
    // Filter projects according to user controls
    const filteredPerformanceData = useMemo(() => {
        return allPerformanceData.filter(item => {
            // Status Scope
            if (statusScope === 'active_only') {
                if (item.status === ProjectStatus.DRAFT || item.status === ProjectStatus.REJECTED || item.status === ProjectStatus.CANCELLED) {
                    return false;
                }
            }
            else if (statusScope === 'completed') {
                if (!item.isCompleted)
                    return false;
            }
            // Health filter
            if (selectedHealth === 'on_time' && item.scheduleHealth !== 'on_time')
                return false;
            if (selectedHealth === 'delayed' && (item.scheduleHealth === 'on_time'))
                return false;
            if (selectedHealth === 'overrun' && item.budgetHealth !== 'overrun')
                return false;
            if (selectedHealth === 'overrun_10' && !item.isCriticalBudgetOverrun)
                return false;
            if (selectedHealth === 'optimal' && item.compositeHealth !== 'optimal')
                return false;
            // Zone filter
            if (selectedZone && item.zone !== selectedZone)
                return false;
            // Project Type filter
            if (selectedType && item.projectType !== selectedType)
                return false;
            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matches = item.name.toLowerCase().includes(q) ||
                    item.id.toLowerCase().includes(q) ||
                    item.zone.toLowerCase().includes(q) ||
                    item.woreda.toLowerCase().includes(q) ||
                    item.implementingBody.toLowerCase().includes(q);
                if (!matches)
                    return false;
            }
            return true;
        });
    }, [allPerformanceData, statusScope, selectedHealth, selectedZone, selectedType, searchQuery]);
    // Sort for chart display
    const chartSortedData = useMemo(() => {
        const sorted = [...filteredPerformanceData];
        switch (chartSortBy) {
            case 'utilization_desc':
                return sorted.sort((a, b) => b.budgetUtilizationPct - a.budgetUtilizationPct);
            case 'variance_desc':
                return sorted.sort((a, b) => b.scheduleVarianceDays - a.scheduleVarianceDays);
            case 'budget_desc':
                return sorted.sort((a, b) => b.approvedBudget - a.approvedBudget);
            case 'date_asc':
                return sorted.sort((a, b) => new Date(a.plannedCompletionDateStr).getTime() - new Date(b.plannedCompletionDateStr).getTime());
            default:
                return sorted;
        }
    }, [filteredPerformanceData, chartSortBy]);
    // Overall KPI Summary
    const summaryKPIs = useMemo(() => {
        const totalProjects = filteredPerformanceData.length;
        if (totalProjects === 0) {
            return {
                totalProjects: 0,
                totalApprovedBudget: 0,
                totalActualExpenditure: 0,
                avgBudgetUtilization: 0,
                onTimeCount: 0,
                onTimePct: 0,
                delayedCount: 0,
                criticalDelayedCount: 0,
                overrunCount: 0,
                criticalOverrunCount: 0,
                criticalOverrunProjects: [],
                totalOverrunExcess: 0,
                avgScheduleVariance: 0
            };
        }
        const totalApprovedBudget = filteredPerformanceData.reduce((sum, p) => sum + p.approvedBudget, 0);
        const totalActualExpenditure = filteredPerformanceData.reduce((sum, p) => sum + p.actualExpenditure, 0);
        const avgBudgetUtilization = totalApprovedBudget > 0 ? (totalActualExpenditure / totalApprovedBudget) * 100 : 0;
        const onTimeCount = filteredPerformanceData.filter(p => p.scheduleHealth === 'on_time').length;
        const delayedCount = filteredPerformanceData.filter(p => p.scheduleHealth !== 'on_time').length;
        const criticalDelayedCount = filteredPerformanceData.filter(p => p.scheduleHealth === 'critical_delay').length;
        const overrunCount = filteredPerformanceData.filter(p => p.budgetHealth === 'overrun').length;
        // Critical overrun projects (>10% budget overrun)
        const criticalOverrunProjects = filteredPerformanceData.filter(p => p.isCriticalBudgetOverrun);
        const criticalOverrunCount = criticalOverrunProjects.length;
        const totalOverrunExcess = criticalOverrunProjects.reduce((sum, p) => sum + p.overrunExcessAmount, 0);
        const totalVarianceDays = filteredPerformanceData.reduce((sum, p) => sum + p.scheduleVarianceDays, 0);
        const avgScheduleVariance = Math.round(totalVarianceDays / totalProjects);
        return {
            totalProjects,
            totalApprovedBudget,
            totalActualExpenditure,
            avgBudgetUtilization,
            onTimeCount,
            onTimePct: Math.round((onTimeCount / totalProjects) * 100),
            delayedCount,
            criticalDelayedCount,
            overrunCount,
            criticalOverrunCount,
            criticalOverrunProjects,
            totalOverrunExcess,
            avgScheduleVariance
        };
    }, [filteredPerformanceData]);
    // Zonal Aggregates for zonal comparison chart
    const zonalPerformanceData = useMemo(() => {
        const zoneMap = new Map();
        filteredPerformanceData.forEach(p => {
            const current = zoneMap.get(p.zone) || {
                zone: p.zone,
                count: 0,
                totalBudget: 0,
                totalExpenditure: 0,
                totalVarianceDays: 0
            };
            current.count += 1;
            current.totalBudget += p.approvedBudget;
            current.totalExpenditure += p.actualExpenditure;
            current.totalVarianceDays += p.scheduleVarianceDays;
            zoneMap.set(p.zone, current);
        });
        return Array.from(zoneMap.values()).map(z => ({
            zone: z.zone,
            projectsCount: z.count,
            budgetUtilizationPct: z.totalBudget > 0 ? Math.round((z.totalExpenditure / z.totalBudget) * 100) : 0,
            avgVarianceDays: Math.round(z.totalVarianceDays / Math.max(1, z.count)),
            totalBudgetM: (z.totalBudget / 1_000_000).toFixed(1),
            totalExpenditureM: (z.totalExpenditure / 1_000_000).toFixed(1)
        })).sort((a, b) => b.budgetUtilizationPct - a.budgetUtilizationPct);
    }, [filteredPerformanceData]);
    // Sector Aggregates
    const sectorPerformanceData = useMemo(() => {
        const sectorMap = new Map();
        filteredPerformanceData.forEach(p => {
            const current = sectorMap.get(p.projectType) || {
                sector: p.projectType,
                count: 0,
                totalBudget: 0,
                totalExpenditure: 0,
                onTimeCount: 0
            };
            current.count += 1;
            current.totalBudget += p.approvedBudget;
            current.totalExpenditure += p.actualExpenditure;
            if (p.scheduleHealth === 'on_time')
                current.onTimeCount += 1;
            sectorMap.set(p.projectType, current);
        });
        return Array.from(sectorMap.values()).map(s => ({
            sector: s.sector,
            count: s.count,
            budgetUtilizationPct: s.totalBudget > 0 ? Math.round((s.totalExpenditure / s.totalBudget) * 100) : 0,
            onTimePct: Math.round((s.onTimeCount / Math.max(1, s.count)) * 100)
        }));
    }, [filteredPerformanceData]);
    // Export to Excel handler
    const exportToExcel = () => {
        const rows = filteredPerformanceData.map(p => ({
            'Project ID': p.id,
            'Project Name': p.name,
            'Zone': p.zone,
            'Woreda': p.woreda,
            'Sector': p.projectType,
            'Implementing Body': p.implementingBody,
            'Status': p.status,
            'Planned Start Date': p.plannedStartDateStr,
            'Planned Completion Date': p.plannedCompletionDateStr,
            'Actual Start Date': p.actualStartDateStr,
            'Actual / Target Completion Date': p.actualCompletionDateStr,
            'Planned Duration (Days)': p.plannedDurationDays,
            'Actual / Elapsed Duration (Days)': p.actualOrElapsedDays,
            'Schedule Variance (Days)': p.scheduleVarianceDays,
            'Schedule Health': p.scheduleHealth === 'on_time' ? 'On Schedule' : p.scheduleHealth === 'minor_delay' ? 'Minor Delay' : 'Critical Delay',
            'Approved Budget (ETB)': p.approvedBudget,
            'Actual Expenditure (ETB)': p.actualExpenditure,
            'Budget Variance (ETB)': p.budgetVariance,
            'Budget Utilization (%)': `${p.budgetUtilizationPct.toFixed(1)}%`,
            'Budget Health': p.budgetHealth === 'healthy' ? 'Under Budget' : p.budgetHealth === 'warning' ? 'Approaching Limit' : 'Cost Overrun',
            'Composite Performance': p.compositeHealth.toUpperCase()
        }));
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Performance_Metrics');
        XLSX.writeFile(workbook, `OWEB_Project_Performance_Dashboard_${new Date().toISOString().split('T')[0]}.xlsx`);
    };
    // Export Comprehensive Executive PDF Report
    const exportExecutivePDF = () => {
        const doc = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        // --- PAGE 1: EXECUTIVE COVER & DASHBOARD SUMMARY ---
        // Header Background Banner
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 28, 'F');
        // Accent strip
        doc.setFillColor(2, 132, 199); // sky-600
        doc.rect(0, 28, pageWidth, 2.5, 'F');
        // Bureau Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('OROMIA WATER RESOURCE BUREAU (OWEB)', 14, 11);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(186, 230, 253); // sky-200
        doc.text('Executive Performance Dashboard — Planned vs Actual Completion & Budget Utilization Audit', 14, 18);
        doc.setFontSize(8);
        doc.setTextColor(203, 213, 225); // slate-300
        doc.text(`Generated: ${todayStr} | Scope: ${statusScope === 'active_only' ? 'Active Projects' : statusScope === 'completed' ? 'Completed Projects' : 'All Projects'} (${filteredPerformanceData.length} Projects)`, 14, 24);
        // Section Title: Executive Key Performance Indicators
        let currentY = 38;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('1. Executive Portfolio Key Performance Indicators (KPIs)', 14, currentY);
        currentY += 4;
        // Draw 5 Executive KPI Summary Cards using autoTable for crisp rendering
        const kpiHeaders = [['Active Projects', 'Schedule Health', 'Avg Schedule Delay', 'Avg Budget Utilization', 'Capital Disbursed']];
        const kpiRows = [[
                `${summaryKPIs.totalProjects} Projects\n(${summaryKPIs.onTimeCount} On-Time / ${summaryKPIs.delayedCount} Delayed)`,
                `${summaryKPIs.onTimePct}% On-Schedule\n(${summaryKPIs.criticalDelayedCount} Critical Delays)`,
                `${summaryKPIs.avgScheduleVariance > 0 ? '+' : ''}${summaryKPIs.avgScheduleVariance} Days\n(${summaryKPIs.avgScheduleVariance > 0 ? 'Net Portfolio Delay' : 'Running Ahead'})`,
                `${summaryKPIs.avgBudgetUtilization.toFixed(1)}% Utilized\n(${summaryKPIs.overrunCount} Overrun Alerts)`,
                `${formatCompactCurrency(summaryKPIs.totalActualExpenditure)}\nof ${formatCompactCurrency(summaryKPIs.totalApprovedBudget)}`
            ]];
        autoTable(doc, {
            startY: currentY,
            head: kpiHeaders,
            body: kpiRows,
            theme: 'grid',
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontSize: 8.5,
                fontStyle: 'bold',
                halign: 'center',
                cellPadding: 3
            },
            bodyStyles: {
                fontSize: 8,
                textColor: [15, 23, 42],
                halign: 'center',
                valign: 'middle',
                fontStyle: 'bold',
                cellPadding: 3.5,
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                0: { cellWidth: 54 },
                1: { cellWidth: 54, textColor: [16, 185, 129] },
                2: { cellWidth: 54, textColor: summaryKPIs.avgScheduleVariance > 0 ? [217, 119, 6] : [16, 185, 129] },
                3: { cellWidth: 54, textColor: summaryKPIs.avgBudgetUtilization > 100 ? [225, 29, 72] : [14, 116, 144] },
                4: { cellWidth: 53, textColor: [79, 70, 229] }
            }
        });
        currentY = doc.lastAutoTable.finalY + 8;
        // Section Title: Regional / Zonal Performance Breakdown Table
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('2. Regional / Zonal Infrastructure Performance Matrix', 14, currentY);
        currentY += 4;
        const zonalHeaders = [['Oromia Zone', 'Active Projects', 'Approved Budget (ETB)', 'Disbursed Funds (ETB)', 'Remaining Budget (ETB)', 'Budget Util %', 'Avg Schedule Delay', 'Regional Health']];
        const zonalRows = zonalPerformanceData.map(z => [
            z.zone,
            z.projectsCount.toString(),
            `${z.totalBudgetM}M ETB`,
            `${z.totalExpenditureM}M ETB`,
            `${(Number(z.totalBudgetM) - Number(z.totalExpenditureM)).toFixed(1)}M ETB`,
            `${z.budgetUtilizationPct}%`,
            `${z.avgVarianceDays > 0 ? '+' : ''}${z.avgVarianceDays} days`,
            z.budgetUtilizationPct > 100 ? 'Over Budget' : z.avgVarianceDays > 30 ? 'Severe Delay' : z.avgVarianceDays > 0 ? 'Minor Delay' : 'Optimal'
        ]);
        autoTable(doc, {
            startY: currentY,
            head: zonalHeaders,
            body: zonalRows,
            theme: 'striped',
            headStyles: {
                fillColor: [14, 116, 144], // cyan-700
                textColor: [255, 255, 255],
                fontSize: 8,
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: {
                fontSize: 7.5,
                cellPadding: 2.2,
                textColor: [30, 41, 59]
            },
            columnStyles: {
                0: { cellWidth: 42, fontStyle: 'bold' },
                1: { cellWidth: 24, halign: 'center' },
                2: { cellWidth: 38, halign: 'right' },
                3: { cellWidth: 38, halign: 'right' },
                4: { cellWidth: 38, halign: 'right' },
                5: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
                6: { cellWidth: 32, halign: 'center' },
                7: { cellWidth: 31, halign: 'center' }
            }
        });
        // --- PAGE 2: COMPLETE PROJECT-BY-PROJECT PERFORMANCE AUDIT REGISTER ---
        doc.addPage('landscape');
        // Header strip on Page 2
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 16, 'F');
        doc.setFillColor(2, 132, 199);
        doc.rect(0, 16, pageWidth, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('3. Detailed Active Infrastructure Projects Performance & Completion Register', 14, 10);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(186, 230, 253);
        doc.text(`Total Records: ${filteredPerformanceData.length} Projects | Planned vs Actual Dates, Durations, and Financial Burn Rate`, 14, 14);
        const projectTableHeaders = [[
                'ID & Name',
                'Location & Sector',
                'Planned Dates',
                'Actual / Target Date',
                'Plan / Act Days',
                'Schedule Variance',
                'Approved Budget',
                'Actual Disbursed',
                'Budget Util %',
                'Composite Status'
            ]];
        const projectTableRows = filteredPerformanceData.map(p => [
            `${p.id}\n${p.name.length > 28 ? p.name.substring(0, 26) + '...' : p.name}`,
            `${p.zone}\n${p.woreda} (${p.projectType})`,
            `${p.plannedStartDateStr}\n→ ${p.plannedCompletionDateStr}`,
            `${p.actualStartDateStr}\n→ ${p.actualCompletionDateStr}`,
            `${p.plannedDurationDays}d plan\n${p.actualOrElapsedDays}d act`,
            `${p.scheduleVarianceDays > 0 ? '+' : ''}${p.scheduleVarianceDays}d\n(${p.scheduleHealth === 'on_time' ? 'On Schedule' : p.scheduleHealth === 'minor_delay' ? 'Minor Delay' : 'Critical Delay'})`,
            `${formatCurrency(p.approvedBudget)} ETB`,
            `${formatCurrency(p.actualExpenditure)} ETB`,
            `${p.budgetUtilizationPct.toFixed(1)}%\n(${p.budgetHealth === 'healthy' ? 'Under Budget' : p.budgetHealth === 'warning' ? 'Approaching' : 'Overrun'})`,
            p.compositeHealth.toUpperCase().replace('_', ' ')
        ]);
        // Add summary totals row
        const totalBudgetSum = filteredPerformanceData.reduce((s, p) => s + p.approvedBudget, 0);
        const totalExpSum = filteredPerformanceData.reduce((s, p) => s + p.actualExpenditure, 0);
        const avgUtil = totalBudgetSum > 0 ? (totalExpSum / totalBudgetSum) * 100 : 0;
        projectTableRows.push([
            `PORTFOLIO TOTAL\n(${filteredPerformanceData.length} Projects)`,
            'All Scoped Corridors',
            '--',
            '--',
            '--',
            `${summaryKPIs.avgScheduleVariance > 0 ? '+' : ''}${summaryKPIs.avgScheduleVariance}d Avg Variance`,
            `${formatCurrency(totalBudgetSum)} ETB`,
            `${formatCurrency(totalExpSum)} ETB`,
            `${avgUtil.toFixed(1)}% Avg`,
            summaryKPIs.onTimePct >= 80 ? 'PORTFOLIO HEALTHY' : 'ATTENTION REQUIRED'
        ]);
        autoTable(doc, {
            startY: 22,
            head: projectTableHeaders,
            body: projectTableRows,
            theme: 'grid',
            headStyles: {
                fillColor: [15, 23, 42],
                textColor: [255, 255, 255],
                fontSize: 7.5,
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: {
                fontSize: 6.8,
                cellPadding: 1.8,
                textColor: [30, 41, 59],
                valign: 'middle'
            },
            columnStyles: {
                0: { cellWidth: 44, fontStyle: 'bold' },
                1: { cellWidth: 32 },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 25, halign: 'center' },
                4: { cellWidth: 20, halign: 'center' },
                5: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
                6: { cellWidth: 30, halign: 'right' },
                7: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
                8: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
                9: { cellWidth: 23, halign: 'center' }
            },
            didParseCell: (data) => {
                // Highlight totals row
                if (data.row.index === projectTableRows.length - 1) {
                    data.cell.styles.fillColor = [241, 245, 249];
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.textColor = [15, 23, 42];
                }
            }
        });
        // Add dynamic page numbers and footer watermark to all pages
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text('Confidential • Oromia Water Resource Bureau (OWEB) Management Information System', 14, pageHeight - 6);
            doc.text(`Page ${i} of ${totalPages}`, pageWidth - 25, pageHeight - 6);
        }
        doc.save(`OWEB_Executive_Performance_Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    // Export Quick Project Performance Register Table PDF
    const exportTableOnlyPDF = () => {
        const doc = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 22, 'F');
        doc.setFillColor(2, 132, 199);
        doc.rect(0, 22, pageWidth, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('OWEB Active Projects Performance Register', 14, 10);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(203, 213, 225);
        doc.text(`Planned vs. Actual Schedule Variance & Budget Utilization Table | Date: ${new Date().toLocaleDateString()} | Count: ${filteredPerformanceData.length} Projects`, 14, 17);
        const headers = [['ID', 'Project Name', 'Zone / Woreda', 'Plan Finish', 'Act Finish', 'Variance', 'Approved Budget', 'Disbursed', 'Util %', 'Status']];
        const body = filteredPerformanceData.map(p => [
            p.id,
            p.name.length > 30 ? p.name.substring(0, 28) + '...' : p.name,
            `${p.zone} / ${p.woreda}`,
            p.plannedCompletionDateStr,
            p.actualCompletionDateStr,
            `${p.scheduleVarianceDays > 0 ? '+' : ''}${p.scheduleVarianceDays}d`,
            `${formatCurrency(p.approvedBudget)} ETB`,
            `${formatCurrency(p.actualExpenditure)} ETB`,
            `${p.budgetUtilizationPct.toFixed(1)}%`,
            p.scheduleHealth === 'on_time' ? 'On Schedule' : `${p.scheduleVarianceDays}d Delay`
        ]);
        autoTable(doc, {
            startY: 28,
            head: headers,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [14, 116, 144] },
            styles: { fontSize: 7.5, cellPadding: 2.2 },
            columnStyles: {
                0: { cellWidth: 22 },
                1: { cellWidth: 55 },
                2: { cellWidth: 35 },
                3: { cellWidth: 24 },
                4: { cellWidth: 24 },
                5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
                6: { cellWidth: 32, halign: 'right' },
                7: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
                8: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
                9: { cellWidth: 25, halign: 'center' }
            }
        });
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.text(`OWEB Project Management System • Page ${i} of ${totalPages}`, 14, pageHeight - 6);
        }
        doc.save(`OWEB_Project_Performance_Table_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    // Export Single Project Audit Report PDF
    const exportSingleProjectPDF = (item) => {
        const doc = new jsPDF('portrait', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.width;
        // Header Banner
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 30, 'F');
        doc.setFillColor(2, 132, 199);
        doc.rect(0, 30, pageWidth, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('OROMIA WATER RESOURCE BUREAU', 14, 12);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(186, 230, 253);
        doc.text('Individual Project Performance & Completion Audit Certificate', 14, 19);
        doc.setFontSize(8);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
        // Project Title Box
        let currentY = 40;
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(item.name, 14, currentY);
        currentY += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Project ID: ${item.id} | Location: ${item.zone} Zone, ${item.woreda} Woreda | Sector: ${item.projectType}`, 14, currentY);
        // Timeline & Schedule Milestone Table
        currentY += 8;
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('1. Timeline & Schedule Execution Breakdown', 14, currentY);
        currentY += 3;
        const timelineHeaders = [['Milestone Field', 'Planned Timeline', 'Actual / Forecast Timeline', 'Variance / Status']];
        const timelineRows = [
            ['Start Date', item.plannedStartDateStr, item.actualStartDateStr, 'Project Initiated'],
            ['Completion Date', item.plannedCompletionDateStr, item.actualCompletionDateStr, item.scheduleHealth === 'on_time' ? 'On Schedule' : `${item.scheduleVarianceDays} Days Delayed`],
            ['Total Duration (Days)', `${item.plannedDurationDays} Days Planned`, `${item.actualOrElapsedDays} Days Actual`, `${item.scheduleVarianceDays > 0 ? '+' : ''}${item.scheduleVarianceDays} Days Variance`],
            ['Schedule Progress %', '100% Target', `${item.scheduleProgressPct}% Progress`, item.isCompleted ? 'Completed' : 'Active Execution']
        ];
        autoTable(doc, {
            startY: currentY,
            head: timelineHeaders,
            body: timelineRows,
            theme: 'grid',
            headStyles: { fillColor: [2, 132, 199] },
            styles: { fontSize: 8.5, cellPadding: 3 }
        });
        currentY = doc.lastAutoTable.finalY + 8;
        // Financial & Budget Breakdown Table
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('2. Financial Budget Utilization & Payment Audit', 14, currentY);
        currentY += 3;
        const financeHeaders = [['Financial Metric', 'Amount (ETB)', 'Financial Health / Analysis']];
        const financeRows = [
            ['Approved Estimated Budget', `${formatCurrency(item.approvedBudget)} ETB`, 'Official Approved Cost Ceiling'],
            ['Actual Disbursed Payments', `${formatCurrency(item.actualExpenditure)} ETB`, `Funds Disbursed to Date (${item.budgetUtilizationPct.toFixed(1)}%)`],
            ['Remaining Budget Balance', `${formatCurrency(item.budgetVariance)} ETB`, item.budgetVariance >= 0 ? 'Under Approved Budget' : 'Cost Overrun Detected'],
            ['Overall Budget Health', `${item.budgetUtilizationPct.toFixed(1)}% Utilized`, item.budgetHealth === 'healthy' ? 'Healthy Budget Execution' : item.budgetHealth === 'warning' ? 'Approaching Budget Ceiling' : 'Critical Budget Overrun']
        ];
        autoTable(doc, {
            startY: currentY,
            head: financeHeaders,
            body: financeRows,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] },
            styles: { fontSize: 8.5, cellPadding: 3 }
        });
        doc.save(`OWEB_Audit_${item.id}_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    return (<div className="space-y-6 animate-fade-in" id="performance-dashboard-root">
            {/* Header with Title and Global Action Buttons */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-primary-50 text-primary-600 rounded-xl border border-primary-100">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                            </svg>
                        </span>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Active Project Performance Dashboard</h2>
                            <p className="text-xs text-slate-500">
                                Planned vs. Actual completion timelines, schedule variance, and budget utilization rates across active OWEB infrastructure.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                    <button onClick={exportToExcel} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer" title="Export performance matrix to Excel spreadsheet">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span>Export Excel</span>
                    </button>
                    <button onClick={exportTableOnlyPDF} className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer" title="Export quick project performance data table as PDF">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span>PDF Table</span>
                    </button>
                    <button onClick={exportExecutivePDF} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer" title="Export comprehensive executive PDF performance report with KPIs, regional matrix, and complete project audit register">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                        </svg>
                        <span>Download Executive PDF Report</span>
                    </button>
                </div>
            </div>

            {/* SUB-MODULE VIEW TABS */}
            <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap items-center gap-2 border border-slate-200 shadow-xs">
                <button onClick={() => setActiveSubTab('timelines')} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeSubTab === 'timelines'
            ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                    <span>Performance &amp; Timelines Dashboard</span>
                </button>

                <button onClick={() => setActiveSubTab('progress_gauges')} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeSubTab === 'progress_gauges'
            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
                    </svg>
                    <span>Visual Progress Gauges</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeSubTab === 'progress_gauges' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        Completion vs Timeline
                    </span>
                </button>

                <button onClick={() => setActiveSubTab('cost_overrun')} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeSubTab === 'cost_overrun'
            ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/30'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>Cost Overrun &amp; Variation Tracker</span>
                    {summaryKPIs.criticalOverrunCount > 0 && (<span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeSubTab === 'cost_overrun' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-800 animate-pulse'}`}>
                            {summaryKPIs.criticalOverrunCount} Overruns
                        </span>)}
                </button>
            </div>

            {/* CONDITIONAL RENDER: COST OVERRUN TRACKER, PROGRESS GAUGES, OR TIMELINES OVERVIEW */}
            {activeSubTab === 'cost_overrun' ? (<CostOverrunTracker projects={projects} contracts={contracts} procurements={procurements} onSelectProject={onSelectProject} onNavigate={onNavigate}/>) : activeSubTab === 'progress_gauges' ? (<ProjectProgressGaugeSection projects={projects} contracts={contracts} procurements={procurements} onSelectProject={onSelectProject} onNavigate={onNavigate}/>) : (<>
            {/* SITE WORK PLANS & S-CURVE EXECUTION TELEMETRY STRIP */}
            {weeklyPlans.length > 0 && (<div className="bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 rounded-2xl p-4.5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-3 bg-white/10 rounded-xl text-xl backdrop-blur-sm flex-shrink-0">
                            🛡️
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">Site Execution &amp; Work Plan Telemetry</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Active Telemetry
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">
                                Active S-Curve weekly plans: <strong className="text-white">{weeklyPlans.length} plans</strong>
                            </p>
                        </div>
                    </div>
                </div>)}

            {/* CRITICAL BUDGET OVERRUN WARNING SYSTEM BANNER (>10% Overrun Flag) */}
            {summaryKPIs.criticalOverrunCount > 0 && (<div className="bg-rose-50 border-2 border-rose-400/90 rounded-2xl p-4.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
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
                                    Critical Overrun Alert (&gt;10%)
                                </span>
                                <h4 className="text-sm font-bold text-rose-950">
                                    {summaryKPIs.criticalOverrunCount} {summaryKPIs.criticalOverrunCount === 1 ? 'Project has' : 'Projects have'} exceeded approved budget by more than 10%
                                </h4>
                            </div>
                            <p className="text-xs text-rose-800 mt-1">
                                Total unauthorized excess expenditure: <strong className="font-mono text-rose-950">{formatCurrency(summaryKPIs.totalOverrunExcess)} ETB</strong>. Flagged projects are highlighted in red below with immediate disbursement audit recommendations.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setActiveSubTab('cost_overrun')} className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer">
                            <span>Open Cost Overrun Tracker</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                        </button>
                        <button onClick={() => setSelectedHealth(selectedHealth === 'overrun_10' ? 'all' : 'overrun_10')} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${selectedHealth === 'overrun_10'
                    ? 'bg-rose-700 text-white ring-2 ring-rose-500'
                    : 'bg-white text-rose-700 hover:bg-rose-100 border border-rose-300'}`}>
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                            <span>{selectedHealth === 'overrun_10' ? 'Show All Projects' : `Filter ${summaryKPIs.criticalOverrunCount} Flagged Projects`}</span>
                        </button>
                    </div>
                </div>)}

            {/* Top KPI Metrics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Metric 1: Tracked Active Projects */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tracked Projects</span>
                        <span className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                            {ICONS.briefcase}
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-bold text-slate-900">{summaryKPIs.totalProjects}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <span className="font-semibold text-emerald-600">{summaryKPIs.onTimeCount} on time</span>
                            <span>•</span>
                            <span className="text-rose-600 font-semibold">{summaryKPIs.delayedCount} delayed</span>
                        </p>
                    </div>
                </div>

                {/* Metric 2: Average Budget Utilization & Overrun Warning Indicator */}
                <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-all ${summaryKPIs.criticalOverrunCount > 0
                ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-200'
                : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Budget Utilization</span>
                        <span className={`p-2 rounded-xl ${summaryKPIs.criticalOverrunCount > 0 ? 'bg-rose-100 text-rose-700 animate-pulse' : summaryKPIs.avgBudgetUtilization > 100 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {ICONS.dollarSign}
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className="flex items-baseline gap-2">
                            <p className={`text-2xl font-bold font-mono ${summaryKPIs.avgBudgetUtilization > 100 ? 'text-rose-600' : 'text-slate-900'}`}>
                                {summaryKPIs.avgBudgetUtilization.toFixed(1)}%
                            </p>
                            <span className="text-xs font-semibold text-slate-400">of approved budget</span>
                        </div>
                        {summaryKPIs.criticalOverrunCount > 0 && (<div className="mt-1 flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-bold shadow-xs animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                    {summaryKPIs.criticalOverrunCount} projects &gt;10% Overrun
                                </span>
                            </div>)}
                        <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${summaryKPIs.avgBudgetUtilization > 100
                ? 'bg-rose-500'
                : summaryKPIs.avgBudgetUtilization >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, Math.max(0, summaryKPIs.avgBudgetUtilization))}%` }}/>
                        </div>
                    </div>
                </div>

                {/* Metric 3: Planned Schedule On-Time Rate */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Schedule Health Index</span>
                        <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            {ICONS.checkCircle}
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-emerald-600">{summaryKPIs.onTimePct}%</p>
                            <span className="text-xs font-semibold text-slate-400">on or ahead of schedule</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {summaryKPIs.onTimeCount} of {summaryKPIs.totalProjects} active projects on baseline
                        </p>
                    </div>
                </div>

                {/* Metric 4: Avg Schedule Variance Days */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Schedule Variance</span>
                        <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                            {ICONS.clock}
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className={`text-2xl font-bold font-mono ${summaryKPIs.avgScheduleVariance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {summaryKPIs.avgScheduleVariance > 0 ? `+${summaryKPIs.avgScheduleVariance}` : summaryKPIs.avgScheduleVariance} <span className="text-xs font-normal text-slate-500">days</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {summaryKPIs.avgScheduleVariance > 0 ? 'Net average completion delay' : 'Running ahead of target completion'}
                        </p>
                    </div>
                </div>

                {/* Metric 5: Financial Portfolio Total */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Actual Disbursed</span>
                        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            {ICONS.fileSignature}
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-bold font-mono text-indigo-700">{formatCompactCurrency(summaryKPIs.totalActualExpenditure)}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Approved: {formatCompactCurrency(summaryKPIs.totalApprovedBudget)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Dynamic Filter & Scoping Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <span className="text-primary-600 font-bold">{ICONS.search}</span>
                        <h4 className="text-sm font-bold text-slate-800">Performance Filters & Controls</h4>
                    </div>

                    {/* Status Scope Selector */}
                    <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <button onClick={() => setStatusScope('active_only')} className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${statusScope === 'active_only' ? 'bg-white text-primary-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
                            Active Projects Only
                        </button>
                        <button onClick={() => setStatusScope('all')} className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${statusScope === 'all' ? 'bg-white text-primary-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
                            All Projects
                        </button>
                        <button onClick={() => setStatusScope('completed')} className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${statusScope === 'completed' ? 'bg-white text-primary-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
                            Completed Only
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {/* Search Input */}
                    <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Search Projects</label>
                        <input type="text" placeholder="Name, ID, Woreda, Body..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none"/>
                    </div>

                    {/* Zone Selector */}
                    <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Zone Filter</label>
                        <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none">
                            <option value="">All Oromia Zones</option>
                            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                    </div>

                    {/* Sector Type Selector */}
                    <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Sector Type</label>
                        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none">
                            <option value="">All Sector Types</option>
                            {Object.keys(PROJECT_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* Performance Health Filter */}
                    <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Performance Health</label>
                        <select value={selectedHealth} onChange={(e) => setSelectedHealth(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none">
                            <option value="all">All Health Categories</option>
                            <option value="overrun_10">⚠️ Critical Overrun (&gt;10% Over Budget)</option>
                            <option value="overrun">All Budget Overruns (&gt;100%)</option>
                            <option value="on_time">On Schedule Only</option>
                            <option value="delayed">Delayed / Slipping Timeline</option>
                            <option value="optimal">Optimal (On-Time &lt;90% Budget)</option>
                        </select>
                    </div>

                    {/* Chart Sorting Option */}
                    <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Sort Visualizations</label>
                        <select value={chartSortBy} onChange={(e) => setChartSortBy(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none font-semibold text-slate-700">
                            <option value="variance_desc">Highest Schedule Delay First</option>
                            <option value="utilization_desc">Highest Budget Utilization %</option>
                            <option value="budget_desc">Largest Budget First</option>
                            <option value="date_asc">Earliest Target Completion</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* RECHARTS SECTION 1: Planned vs. Actual Completion & Budget Utilization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CHART 1: Planned vs. Actual Duration (Days) & Schedule Variance */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2 mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                                Planned vs. Actual Timeline Completion (Days)
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Compares baseline planned duration against actual elapsed project duration and net schedule variance in days.
                            </p>
                        </div>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-700 rounded-md">
                            {chartSortedData.length} Projects
                        </span>
                    </div>

                    <div className="h-80 w-full">
                        {chartSortedData.length > 0 ? (<ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartSortedData.slice(0, 15)} margin={{ top: 10, right: 20, left: 10, bottom: 45 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                    <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={55} tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={(val) => val.length > 14 ? `${val.substring(0, 12)}...` : val}/>
                                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#475569' }} unit=" d"/>
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#f43f5e' }} unit=" d"/>
                                    <Tooltip content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (<div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 max-w-xs">
                                                        <p className="font-bold text-sky-400 border-b border-slate-700 pb-1">{data.name}</p>
                                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                                                            <span className="text-slate-400">Planned Dates:</span>
                                                            <span className="font-mono text-right">{data.plannedStartDateStr} → {data.plannedCompletionDateStr}</span>
                                                            <span className="text-slate-400">Actual/Forecast:</span>
                                                            <span className="font-mono text-right text-amber-300">{data.actualStartDateStr} → {data.actualCompletionDateStr}</span>
                                                            <span className="text-slate-400">Planned Duration:</span>
                                                            <span className="font-semibold text-right">{data.plannedDurationDays} days</span>
                                                            <span className="text-slate-400">Actual/Elapsed:</span>
                                                            <span className="font-semibold text-right">{data.actualOrElapsedDays} days</span>
                                                            <span className="text-slate-400">Schedule Variance:</span>
                                                            <span className={`font-bold text-right ${data.scheduleVarianceDays > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                                {data.scheduleVarianceDays > 0 ? `+${data.scheduleVarianceDays} days delay` : `${data.scheduleVarianceDays} days ahead`}
                                                            </span>
                                                        </div>
                                                    </div>);
                    }
                    return null;
                }}/>
                                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }}/>
                                    <Bar yAxisId="left" dataKey="plannedDurationDays" name="Planned Duration (Days)" fill="#0284c7" radius={[4, 4, 0, 0]}/>
                                    <Bar yAxisId="left" dataKey="actualOrElapsedDays" name="Actual / Elapsed Duration (Days)" fill="#10b981" radius={[4, 4, 0, 0]}/>
                                    <Line yAxisId="right" type="monotone" dataKey="scheduleVarianceDays" name="Schedule Slippage (Days)" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 4, fill: '#e11d48' }}/>
                                </ComposedChart>
                            </ResponsiveContainer>) : (<div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                No matching active projects found for this filter scope.
                            </div>)}
                    </div>
                </div>

                {/* CHART 2: Budget Utilization Rate (%) for Active Projects */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2 mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                Budget Utilization Percentage (%)
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Actual disbursed funds as a percentage of total approved estimated budget, with reference lines at 100% and 85%.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-semibold">
                            <span className="flex items-center gap-1 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> &lt;85%</span>
                            <span className="flex items-center gap-1 text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-500"></span> 85-100%</span>
                            <span className="flex items-center gap-1 text-rose-500"><span className="w-2 h-2 rounded-full bg-rose-500"></span> 100-110%</span>
                            <span className="flex items-center gap-1 text-rose-700 font-bold"><span className="w-2 h-2 rounded-full bg-rose-700 animate-pulse"></span> &gt;110% Alert</span>
                        </div>
                    </div>

                    <div className="h-80 w-full">
                        {chartSortedData.length > 0 ? (<ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartSortedData.slice(0, 15)} margin={{ top: 10, right: 20, left: 10, bottom: 45 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                    <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={55} tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={(val) => val.length > 14 ? `${val.substring(0, 12)}...` : val}/>
                                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} unit="%" domain={[0, (dataMax) => Math.max(125, Math.ceil(dataMax / 10) * 10)]}/>
                                    <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (<div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 max-w-xs">
                                                        <p className="font-bold text-emerald-400 border-b border-slate-700 pb-1">{data.name}</p>
                                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                                                            <span className="text-slate-400">Approved Budget:</span>
                                                            <span className="font-mono text-right">{formatCompactCurrency(data.approvedBudget)}</span>
                                                            <span className="text-slate-400">Actual Disbursed:</span>
                                                            <span className="font-mono text-right text-emerald-300">{formatCompactCurrency(data.actualExpenditure)}</span>
                                                            <span className="text-slate-400">Remaining Balance:</span>
                                                            <span className="font-mono text-right text-amber-300">{formatCompactCurrency(data.budgetVariance)}</span>
                                                            <span className="text-slate-400">Budget Utilization:</span>
                                                            <span className={`font-bold text-right ${data.isCriticalBudgetOverrun ? 'text-rose-400 font-extrabold' : data.budgetUtilizationPct > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                                {data.budgetUtilizationPct.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        {data.isCriticalBudgetOverrun && (<div className="mt-1.5 px-2 py-1 bg-rose-600/90 text-white font-bold text-[10px] rounded-lg text-center flex items-center justify-center gap-1 animate-pulse">
                                                                <span>⚠️</span> CRITICAL OVERRUN: &gt;10% OVER BUDGET (+{data.overrunPct.toFixed(1)}%)
                                                            </div>)}
                                                    </div>);
                    }
                    return null;
                }}/>
                                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }}/>
                                    <ReferenceLine y={110} stroke="#dc2626" strokeWidth={1.5} strokeDasharray="3 3" label={{ value: '⚠️ 110% Overrun Threshold', fill: '#dc2626', fontSize: 9, position: 'top' }}/>
                                    <ReferenceLine y={100} stroke="#f43f5e" strokeDasharray="2 2" label={{ value: '100% Budget', fill: '#f43f5e', fontSize: 9, position: 'top' }}/>
                                    <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="2 2" label={{ value: '85% Target', fill: '#f59e0b', fontSize: 9, position: 'top' }}/>
                                    
                                    <Bar dataKey="budgetUtilizationPct" name="Budget Utilization Rate (%)" radius={[4, 4, 0, 0]}>
                                        {chartSortedData.slice(0, 15).map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.isCriticalBudgetOverrun ? '#dc2626' : entry.budgetUtilizationPct > 100 ? '#f43f5e' : entry.budgetUtilizationPct >= 85 ? '#f59e0b' : '#10b981'}/>))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>) : (<div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                No matching active projects found for this filter scope.
                            </div>)}
                    </div>
                </div>
            </div>

            {/* RECHARTS SECTION 2: Dual Performance Matrix & Regional Aggregates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CHART 3: Schedule Progress % vs. Budget Utilization % Matrix */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2 mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                                Schedule Progress % vs. Budget Burn Rate %
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Compares timeline elapsed % against financial utilization % to detect premature expenditure or lagging deliverables.
                            </p>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        {chartSortedData.length > 0 ? (<ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartSortedData.slice(0, 12)} margin={{ top: 10, right: 20, left: 10, bottom: 45 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                    <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={50} tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={(val) => val.length > 12 ? `${val.substring(0, 10)}...` : val}/>
                                    <YAxis unit="%" domain={[0, 120]} tick={{ fontSize: 11, fill: '#475569' }}/>
                                    <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (<div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                                                        <p className="font-bold text-indigo-400">{data.name}</p>
                                                        <p className="text-slate-300">Schedule Elapsed: <span className="font-bold text-sky-400">{data.scheduleProgressPct}%</span></p>
                                                        <p className="text-slate-300">Budget Utilized: <span className="font-bold text-emerald-400">{data.budgetUtilizationPct.toFixed(1)}%</span></p>
                                                        <p className="text-slate-400 text-[10px]">Zone: {data.zone} | Woreda: {data.woreda}</p>
                                                    </div>);
                    }
                    return null;
                }}/>
                                    <Legend wrapperStyle={{ fontSize: 11 }}/>
                                    <Bar dataKey="scheduleProgressPct" name="Schedule Elapsed (%)" fill="#6366f1" radius={[4, 4, 0, 0]}/>
                                    <Bar dataKey="budgetUtilizationPct" name="Budget Utilized (%)" fill="#14b8a6" radius={[4, 4, 0, 0]}/>
                                </ComposedChart>
                            </ResponsiveContainer>) : (<div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                No active projects to display in performance matrix.
                            </div>)}
                    </div>
                </div>

                {/* CHART 4: Zonal Aggregates (Budget Utilization & Schedule Delay by Zone) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2 mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                Zonal Budget Utilization & Average Schedule Delay
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Aggregated regional performance across Oromia administrative zones.
                            </p>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        {zonalPerformanceData.length > 0 ? (<ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={zonalPerformanceData.slice(0, 10)} margin={{ top: 10, right: 20, left: 10, bottom: 45 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                    <XAxis dataKey="zone" angle={-30} textAnchor="end" interval={0} height={50} tick={{ fontSize: 10, fill: '#475569' }}/>
                                    <YAxis yAxisId="left" unit="%" tick={{ fontSize: 11, fill: '#475569' }}/>
                                    <YAxis yAxisId="right" orientation="right" unit=" d" tick={{ fontSize: 11, fill: '#f59e0b' }}/>
                                    <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (<div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                                                        <p className="font-bold text-amber-400">{data.zone} Zone</p>
                                                        <p className="text-slate-300">Active Projects: <span className="font-bold text-white">{data.projectsCount}</span></p>
                                                        <p className="text-slate-300">Avg Budget Utilization: <span className="font-bold text-emerald-400">{data.budgetUtilizationPct}%</span></p>
                                                        <p className="text-slate-300">Avg Schedule Delay: <span className="font-bold text-amber-400">{data.avgVarianceDays} days</span></p>
                                                        <p className="text-slate-400 text-[10px]">Total Budget: {data.totalBudgetM}M ETB</p>
                                                    </div>);
                    }
                    return null;
                }}/>
                                    <Legend wrapperStyle={{ fontSize: 11 }}/>
                                    <Bar yAxisId="left" dataKey="budgetUtilizationPct" name="Avg Budget Utilization (%)" fill="#0284c7" radius={[4, 4, 0, 0]}/>
                                    <Line yAxisId="right" type="monotone" dataKey="avgVarianceDays" name="Avg Delay (Days)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b' }}/>
                                </ComposedChart>
                            </ResponsiveContainer>) : (<div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                No zonal records available.
                            </div>)}
                    </div>
                </div>
            </div>

            {/* DETAILED PERFORMANCE AUDIT TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">Active Project Performance Audit Register</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Displaying {filteredPerformanceData.length} active projects with planned vs. actual timelines and financial variance.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">Click any row to inspect complete milestone audit</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                            <tr>
                                <th className="px-4 py-3.5">Project Details</th>
                                <th className="px-4 py-3.5">Location & Sector</th>
                                <th className="px-4 py-3.5">Planned Timeline</th>
                                <th className="px-4 py-3.5">Actual / Target Finish</th>
                                <th className="px-4 py-3.5 text-center">Schedule Variance</th>
                                <th className="px-4 py-3.5 text-right">Approved Budget</th>
                                <th className="px-4 py-3.5 text-right">Actual Disbursed</th>
                                <th className="px-4 py-3.5 text-center">Budget Util %</th>
                                <th className="px-4 py-3.5 text-center">Composite Health</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                            {filteredPerformanceData.map((item, idx) => (<tr key={item.id} onClick={() => setSelectedProjectModal(item)} className={`${item.isCriticalBudgetOverrun
                    ? 'bg-rose-50/60 border-l-4 border-l-rose-600'
                    : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-sky-50/60 cursor-pointer transition-colors`}>
                                    {/* Project Details & Overrun Badge */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="font-bold text-slate-800">{item.name}</div>
                                            {item.isCriticalBudgetOverrun && (<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-600 text-white shadow-xs flex-shrink-0 animate-pulse" title="Actual expenditure exceeds approved budget by over 10%">
                                                    <span className="w-1 h-1 rounded-full bg-white"></span>
                                                    OVERRUN
                                                </span>)}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.id}</div>
                                        {item.isCriticalBudgetOverrun && (<div className="mt-1">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                                    &gt;10% Overrun (+{item.overrunPct.toFixed(1)}%)
                                                </span>
                                            </div>)}
                                    </td>

                                    {/* Location & Sector */}
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-slate-700">{item.zone}</div>
                                        <div className="text-[10px] text-slate-500">{item.woreda} • {item.projectType}</div>
                                    </td>

                                    {/* Planned Timeline */}
                                    <td className="px-4 py-3">
                                        <div className="text-slate-700 font-mono text-[11px]">{formatDateDisplay(item.plannedStartDateStr)}</div>
                                        <div className="text-slate-500 text-[10px]">Target: <span className="font-semibold text-slate-700">{formatDateDisplay(item.plannedCompletionDateStr)}</span></div>
                                        <div className="text-[10px] text-slate-400">({item.plannedDurationDays} days planned)</div>
                                    </td>

                                    {/* Actual Timeline */}
                                    <td className="px-4 py-3">
                                        <div className="text-slate-700 font-mono text-[11px]">Started: {formatDateDisplay(item.actualStartDateStr)}</div>
                                        <div className="text-[10px] font-semibold text-slate-800">
                                            {item.isCompleted ? `Completed: ${formatDateDisplay(item.actualCompletionDateStr)}` : `Est: ${formatDateDisplay(item.plannedCompletionDateStr)}`}
                                        </div>
                                        <div className="text-[10px] text-slate-400">({item.actualOrElapsedDays} days elapsed)</div>
                                    </td>

                                    {/* Schedule Variance */}
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${item.scheduleHealth === 'on_time'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : item.scheduleHealth === 'minor_delay'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                            {item.scheduleVarianceDays > 0 ? `+${item.scheduleVarianceDays}d Delay` : `${item.scheduleVarianceDays}d (On Time)`}
                                        </span>
                                    </td>

                                    {/* Approved Budget */}
                                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                                        {formatCurrency(item.approvedBudget)} <span className="text-[10px] font-normal text-slate-400">ETB</span>
                                    </td>

                                    {/* Actual Disbursed */}
                                    <td className={`px-4 py-3 text-right font-mono font-bold ${item.isCriticalBudgetOverrun ? 'text-rose-600 font-extrabold' : 'text-emerald-600'}`}>
                                        {formatCurrency(item.actualExpenditure)} <span className="text-[10px] font-normal text-slate-400">ETB</span>
                                    </td>

                                    {/* Budget Utilization % with Warning Indicator */}
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`font-mono font-bold text-xs flex items-center gap-1 ${item.isCriticalBudgetOverrun
                    ? 'text-rose-700 font-extrabold'
                    : item.budgetHealth === 'overrun'
                        ? 'text-rose-600'
                        : item.budgetHealth === 'warning'
                            ? 'text-amber-600'
                            : 'text-emerald-700'}`}>
                                                {item.isCriticalBudgetOverrun && <span className="text-rose-600 text-[10px] animate-pulse">⚠️</span>}
                                                {item.budgetUtilizationPct.toFixed(1)}%
                                            </span>
                                            {item.isCriticalBudgetOverrun && (<span className="text-[9px] font-bold text-rose-600 mt-0.5">
                                                    +{formatCompactCurrency(item.overrunExcessAmount)} excess
                                                </span>)}
                                            <div className="w-16 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                                <div className={`h-full rounded-full ${item.isCriticalBudgetOverrun
                    ? 'bg-rose-600'
                    : item.budgetHealth === 'overrun'
                        ? 'bg-rose-500'
                        : item.budgetHealth === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, Math.max(0, item.budgetUtilizationPct))}%` }}/>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Composite Health */}
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${item.isCriticalBudgetOverrun
                    ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                    : item.compositeHealth === 'optimal'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.compositeHealth === 'on_track'
                            ? 'bg-sky-100 text-sky-800'
                            : item.compositeHealth === 'schedule_risk'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'}`}>
                                            {item.isCriticalBudgetOverrun ? 'CRITICAL OVERRUN' : item.compositeHealth.replace('_', ' ')}
                                        </span>
                                    </td>
                                </tr>))}

                            {filteredPerformanceData.length === 0 && (<tr>
                                    <td colSpan={9} className="text-center py-12 text-slate-400">
                                        No active projects match your search and filter parameters.
                                    </td>
                                </tr>)}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PROJECT PERFORMANCE DETAIL INSPECTION MODAL */}
            {selectedProjectModal && (<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-scale-in">
                        <div className={`p-5 text-white flex items-center justify-between ${selectedProjectModal.isCriticalBudgetOverrun
                    ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900'
                    : 'bg-gradient-to-r from-slate-900 to-sky-950'}`}>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-white/20 text-white rounded-md border border-white/30">
                                        Project Performance Audit
                                    </span>
                                    {selectedProjectModal.isCriticalBudgetOverrun && (<span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-600 text-white rounded-md uppercase tracking-wide animate-pulse">
                                            &gt;10% Budget Overrun Alert
                                        </span>)}
                                </div>
                                <h3 className="text-lg font-bold text-white mt-1">{selectedProjectModal.name}</h3>
                                <p className="text-xs text-slate-300 font-mono">{selectedProjectModal.id} • {selectedProjectModal.zone} Zone, {selectedProjectModal.woreda}</p>
                            </div>
                            <button onClick={() => setSelectedProjectModal(null)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                            {/* Critical Overrun Alert Box */}
                            {selectedProjectModal.isCriticalBudgetOverrun && (<div className="bg-rose-50 border-2 border-rose-500 rounded-xl p-4 flex items-start gap-3 shadow-xs">
                                    <div className="p-2 bg-rose-600 text-white rounded-lg animate-pulse flex-shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-extrabold uppercase rounded">
                                                High Priority Warning
                                            </span>
                                            <h4 className="text-xs font-bold text-rose-950">Approved Budget Exceeded by More Than 10%</h4>
                                        </div>
                                        <p className="text-xs text-rose-800 mt-1">
                                            Actual spending exceeds the approved baseline budget by <strong>+{selectedProjectModal.overrunPct.toFixed(1)}%</strong> with an unauthorized excess variance of <strong className="font-mono text-rose-950">{formatCurrency(selectedProjectModal.overrunExcessAmount)} ETB</strong>. Immediate financial audit and contract variation justification required.
                                        </p>
                                    </div>
                                </div>)}

                            {/* Visual Progress Gauge (Physical Completion vs Timeline Elapsed) */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5 self-start">
                                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
                                    </svg>
                                    Project Completion vs. Timeline Health Gauge
                                </h4>
                                <ProgressGauge completionPct={selectedProjectModal.scheduleProgressPct} timelinePct={selectedProjectModal.scheduleProgressPct} plannedDays={selectedProjectModal.plannedDurationDays} elapsedDays={selectedProjectModal.actualOrElapsedDays} varianceDays={selectedProjectModal.scheduleVarianceDays} startDateStr={selectedProjectModal.plannedStartDateStr} targetDateStr={selectedProjectModal.plannedCompletionDateStr} size="md" showDetails={true} className="w-full border-0 shadow-none bg-transparent p-0"/>
                            </div>

                            {/* Schedule & Timeline Breakdown */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                                    {ICONS.clock} Timeline & Completion Schedule Breakdown
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div>
                                        <span className="text-slate-400 block text-[10px]">Planned Start</span>
                                        <span className="font-bold text-slate-800">{formatDateDisplay(selectedProjectModal.plannedStartDateStr)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px]">Target Completion</span>
                                        <span className="font-bold text-slate-800">{formatDateDisplay(selectedProjectModal.plannedCompletionDateStr)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px]">Actual Start</span>
                                        <span className="font-bold text-slate-800">{formatDateDisplay(selectedProjectModal.actualStartDateStr)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px]">Actual / Forecast Finish</span>
                                        <span className="font-bold text-slate-800">{formatDateDisplay(selectedProjectModal.actualCompletionDateStr)}</span>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                                    <span className="text-xs text-slate-600">Net Schedule Variance:</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedProjectModal.scheduleVarianceDays > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                        {selectedProjectModal.scheduleVarianceDays > 0 ? `+${selectedProjectModal.scheduleVarianceDays} Days Delay` : `${selectedProjectModal.scheduleVarianceDays} Days Ahead of Schedule`}
                                    </span>
                                </div>
                            </div>

                            {/* Financial Budget Utilization Breakdown */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                                    {ICONS.dollarSign} Financial Budget Utilization Breakdown
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div>
                                        <span className="text-slate-400 block text-[10px]">Approved Estimated Budget</span>
                                        <span className="font-bold font-mono text-sm text-slate-800">{formatCurrency(selectedProjectModal.approvedBudget)} ETB</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px]">Actual Disbursed Payments</span>
                                        <span className="font-bold font-mono text-sm text-emerald-600">{formatCurrency(selectedProjectModal.actualExpenditure)} ETB</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px]">Remaining Budget Balance</span>
                                        <span className="font-bold font-mono text-sm text-amber-600">{formatCurrency(selectedProjectModal.budgetVariance)} ETB</span>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-200">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-slate-600">Budget Utilization Rate:</span>
                                        <span className="font-bold font-mono text-slate-800">{selectedProjectModal.budgetUtilizationPct.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${selectedProjectModal.budgetUtilizationPct > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, Math.max(0, selectedProjectModal.budgetUtilizationPct))}%` }}/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
                            <button onClick={() => exportSingleProjectPDF(selectedProjectModal)} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer" title="Download single project performance audit certificate PDF">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                                </svg>
                                <span>Download Project Audit PDF</span>
                            </button>
                            <button onClick={() => setSelectedProjectModal(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer">
                                Close Audit
                            </button>
                        </div>
                    </div>
                </div>)}
                </>)}
        </div>);
};
export default PerformanceDashboard;
