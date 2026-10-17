import React, { useState, useMemo, useRef } from 'react';
import { Project, Contract, Procurement, ProjectStatus } from '../types';
import { ICONS, PROGRAMS } from '../constants';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface GanttTimelineChartProps {
    projects: Project[];
    contracts: Contract[];
    procurements?: Procurement[];
    moduleMode?: 'portfolio' | 'planning' | 'contracts';
    customTitle?: string;
    customSubtitle?: string;
    defaultStatusFilter?: string;
}

export interface TimelineProjectData {
    project: Project;
    contract?: Contract;
    procurement?: Procurement;
    
    // Core Dates
    plannedStart: Date | null;
    plannedEnd: Date | null;
    actualStart: Date | null;
    actualEnd: Date | null;
    
    // Milestones
    feasibilityDate: Date | null;
    eiaApprovalDate: Date | null;
    contractSigningDate: Date | null;
    commencementDate: Date | null;
    siteHandoverDate: Date | null;
    
    // Calculations
    plannedDurationDays: number;
    actualDurationDays: number;
    varianceDays: number; // Positive = delayed, Negative = ahead of schedule
    statusCategory: 'completed_on_time' | 'completed_delayed' | 'in_progress_on_track' | 'in_progress_delayed' | 'in_planning' | 'not_started';
    progressPercent: number;
}

type TimeScale = 'month' | 'quarter' | 'week';
type GroupByMode = 'none' | 'program' | 'zone' | 'status' | 'type';
type SortByMode = 'startDate' | 'completionDate' | 'variance' | 'name' | 'budget';

const formatDateStr = (date: Date | null): string => {
    if (!date || isNaN(date.getTime())) return '—';
    return date.toISOString().split('T')[0];
};

const formatReadableDate = (date: Date | null): string => {
    if (!date || isNaN(date.getTime())) return 'Not set';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);
};

export const GanttTimelineChart: React.FC<GanttTimelineChartProps> = ({ 
    projects, 
    contracts, 
    procurements = [],
    moduleMode = 'portfolio',
    customTitle,
    customSubtitle,
    defaultStatusFilter
}) => {
    const [timeScale, setTimeScale] = useState<TimeScale>('month');
    const [groupBy, setGroupBy] = useState<GroupByMode>('none');
    const [sortBy, setSortBy] = useState<SortByMode>('startDate');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>(
        defaultStatusFilter || (moduleMode === 'planning' ? 'planning_pipeline' : 'all')
    );
    const [selectedVarianceFilter, setSelectedVarianceFilter] = useState<string>('all');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
    const [showCriticalPath, setShowCriticalPath] = useState<boolean>(true);
    const [showDependencies, setShowDependencies] = useState<boolean>(true);
    const [selectedProjectForModal, setSelectedProjectForModal] = useState<TimelineProjectData | null>(null);
    const [hoveredProject, setHoveredProject] = useState<TimelineProjectData | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const containerRef = useRef<HTMLDivElement>(null);

    // Map contracts and procurements by projectId
    const contractsMap = useMemo(() => {
        const map = new Map<string, Contract>();
        contracts.forEach(c => map.set(c.projectId, c));
        return map;
    }, [contracts]);

    const procurementsMap = useMemo(() => {
        const map = new Map<string, Procurement>();
        procurements.forEach(p => map.set(p.projectId, p));
        return map;
    }, [procurements]);

    // Parse and augment project timelines
    const timelineData: TimelineProjectData[] = useMemo(() => {
        const now = new Date();

        return projects.map(project => {
            const contract = contractsMap.get(project.id);
            const procurement = procurementsMap.get(project.id);

            // Determine planned dates: prioritize project explicit dates, then contract/procurement baselines
            let plannedStartStr = project.plannedStartDate || contract?.commencementPlanDate || contract?.signingDate || procurement?.biddingPeriodStart;
            let plannedEndStr = project.plannedCompletionDate || contract?.plannedCompletionDate;

            // Determine actual dates: prioritize explicit actuals, then contract actual dates
            let actualStartStr = project.actualStartDate || contract?.commencementActualDate || contract?.signingDate;
            let actualEndStr = project.actualCompletionDate || contract?.completionDate;

            // Defaults fallback if totally missing to provide a structured timeline visualization
            if (!plannedStartStr) {
                // Approximate from feasibility or current year
                if (project.feasibilityStudyDate) {
                    const fDate = new Date(project.feasibilityStudyDate);
                    fDate.setMonth(fDate.getMonth() + 2);
                    plannedStartStr = fDate.toISOString().split('T')[0];
                } else {
                    plannedStartStr = '2025-01-01';
                }
            }

            if (!plannedEndStr && plannedStartStr) {
                const pStart = new Date(plannedStartStr);
                pStart.setMonth(pStart.getMonth() + 10);
                plannedEndStr = pStart.toISOString().split('T')[0];
            }

            const pStart = plannedStartStr ? new Date(plannedStartStr) : null;
            const pEnd = plannedEndStr ? new Date(plannedEndStr) : null;
            const aStart = actualStartStr ? new Date(actualStartStr) : null;
            const aEnd = actualEndStr ? new Date(actualEndStr) : null;

            // Milestones
            const feasibilityDate = project.feasibilityStudyDate ? new Date(project.feasibilityStudyDate) : null;
            const eiaApprovalDate = project.eiaApprovalDate ? new Date(project.eiaApprovalDate) : null;
            const contractSigningDate = contract?.signingDate ? new Date(contract.signingDate) : null;
            const commencementDate = contract?.commencementActualDate ? new Date(contract.commencementActualDate) : (contract?.commencementPlanDate ? new Date(contract.commencementPlanDate) : null);
            const siteHandoverDate = contract?.siteHandoverActualDate ? new Date(contract.siteHandoverActualDate) : (contract?.siteHandoverPlanDate ? new Date(contract.siteHandoverPlanDate) : null);

            // Calculate Durations & Variance
            const pDuration = (pStart && pEnd) ? Math.max(1, Math.round((pEnd.getTime() - pStart.getTime()) / (1000 * 60 * 60 * 24))) : 0;
            
            let aDuration = 0;
            let variance = 0;
            let statusCategory: TimelineProjectData['statusCategory'] = 'in_planning';
            let progress = 0;

            if (project.status === ProjectStatus.COMPLETED || aEnd) {
                const effectiveEnd = aEnd || now;
                const effectiveStart = aStart || pStart || now;
                aDuration = Math.max(1, Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)));
                
                if (pEnd) {
                    variance = Math.round((effectiveEnd.getTime() - pEnd.getTime()) / (1000 * 60 * 60 * 24));
                }
                statusCategory = variance > 5 ? 'completed_delayed' : 'completed_on_time';
                progress = 100;
            } else if (aStart) {
                // In progress
                const effectiveEnd = now;
                aDuration = Math.max(1, Math.round((effectiveEnd.getTime() - aStart.getTime()) / (1000 * 60 * 60 * 24)));
                
                if (pEnd) {
                    // Check if current date has surpassed planned end or if time extension exists
                    const daysRemaining = Math.round((pEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysRemaining < 0) {
                        variance = Math.abs(daysRemaining);
                        statusCategory = 'in_progress_delayed';
                    } else {
                        // Check if progress is delayed based on schedule duration
                        const totalPlannedTime = pEnd.getTime() - (pStart ? pStart.getTime() : aStart.getTime());
                        const elapsedTime = now.getTime() - aStart.getTime();
                        progress = totalPlannedTime > 0 ? Math.min(95, Math.max(10, Math.round((elapsedTime / totalPlannedTime) * 100))) : 50;
                        statusCategory = 'in_progress_on_track';
                        variance = 0;
                    }
                } else {
                    statusCategory = 'in_progress_on_track';
                    progress = 40;
                }
            } else if (project.status === ProjectStatus.APPROVED || project.status === ProjectStatus.UNDER_REVIEW) {
                statusCategory = 'not_started';
                progress = 5;
            } else {
                statusCategory = 'in_planning';
                progress = 0;
            }

            // If contract has variations with time impacts
            if (contract && contract.variations) {
                const totalTimeExtension = contract.variations
                    .filter(v => v.status === 'Approved')
                    .reduce((sum, v) => sum + (v.timeImpactDays || 0), 0);
                if (totalTimeExtension > 0) {
                    variance += totalTimeExtension;
                }
            }

            return {
                project,
                contract,
                procurement,
                plannedStart: pStart,
                plannedEnd: pEnd,
                actualStart: aStart,
                actualEnd: aEnd,
                feasibilityDate,
                eiaApprovalDate,
                contractSigningDate,
                commencementDate,
                siteHandoverDate,
                plannedDurationDays: pDuration,
                actualDurationDays: aDuration,
                varianceDays: variance,
                statusCategory,
                progressPercent: progress,
            };
        });
    }, [projects, contractsMap, procurementsMap]);

    // Filtering
    const filteredTimelineData = useMemo(() => {
        return timelineData.filter(item => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const match = 
                    item.project.name.toLowerCase().includes(q) ||
                    item.project.id.toLowerCase().includes(q) ||
                    item.project.zone.toLowerCase().includes(q) ||
                    item.project.woreda.toLowerCase().includes(q) ||
                    (item.project.program && item.project.program.toLowerCase().includes(q));
                if (!match) return false;
            }

            if (selectedProgramFilter !== 'all') {
                const prog = item.project.program || 'Unassigned';
                if (prog !== selectedProgramFilter) return false;
            }

            if (selectedStatusFilter === 'planning_pipeline') {
                if (item.project.status !== ProjectStatus.DRAFT && 
                    item.project.status !== ProjectStatus.SUBMITTED && 
                    item.project.status !== ProjectStatus.UNDER_REVIEW && 
                    item.project.status !== ProjectStatus.APPROVED) {
                    return false;
                }
            } else if (selectedStatusFilter === 'contract_active') {
                if (!item.contract && item.project.status !== ProjectStatus.APPROVED) {
                    return false;
                }
            } else if (selectedStatusFilter !== 'all' && item.project.status !== selectedStatusFilter) {
                return false;
            }

            if (selectedTypeFilter !== 'all' && item.project.projectType !== selectedTypeFilter) {
                return false;
            }

            if (selectedVarianceFilter === 'delayed') {
                if (item.statusCategory !== 'in_progress_delayed' && item.statusCategory !== 'completed_delayed') return false;
            } else if (selectedVarianceFilter === 'on_track') {
                if (item.statusCategory !== 'in_progress_on_track' && item.statusCategory !== 'completed_on_time') return false;
            } else if (selectedVarianceFilter === 'completed') {
                if (item.statusCategory !== 'completed_on_time' && item.statusCategory !== 'completed_delayed') return false;
            } else if (selectedVarianceFilter === 'planning') {
                if (item.statusCategory !== 'in_planning' && item.statusCategory !== 'not_started') return false;
            }

            return true;
        });
    }, [timelineData, searchQuery, selectedProgramFilter, selectedStatusFilter, selectedTypeFilter, selectedVarianceFilter]);

    // Sorting
    const sortedTimelineData = useMemo(() => {
        return [...filteredTimelineData].sort((a, b) => {
            if (sortBy === 'startDate') {
                const aTime = a.plannedStart?.getTime() || 0;
                const bTime = b.plannedStart?.getTime() || 0;
                return aTime - bTime;
            }
            if (sortBy === 'completionDate') {
                const aTime = a.plannedEnd?.getTime() || 0;
                const bTime = b.plannedEnd?.getTime() || 0;
                return aTime - bTime;
            }
            if (sortBy === 'variance') {
                return b.varianceDays - a.varianceDays; // Most delayed first
            }
            if (sortBy === 'name') {
                return a.project.name.localeCompare(b.project.name);
            }
            if (sortBy === 'budget') {
                return (b.project.estimatedBudget || 0) - (a.project.estimatedBudget || 0);
            }
            return 0;
        });
    }, [filteredTimelineData, sortBy]);

    // Grouping
    const groupedData = useMemo(() => {
        if (groupBy === 'none') {
            return [{ groupName: 'All Projects', items: sortedTimelineData }];
        }

        const groupsMap = new Map<string, TimelineProjectData[]>();
        sortedTimelineData.forEach(item => {
            let key = 'Other';
            if (groupBy === 'program') key = item.project.program || 'Other / General Portfolio';
            if (groupBy === 'zone') key = item.project.zone || 'Unassigned Zone';
            if (groupBy === 'status') key = item.project.status;
            if (groupBy === 'type') key = item.project.projectType || 'General';

            const existing = groupsMap.get(key) || [];
            existing.push(item);
            groupsMap.set(key, existing);
        });

        return Array.from(groupsMap.entries()).map(([groupName, items]) => ({
            groupName,
            items
        }));
    }, [sortedTimelineData, groupBy]);

    // Overall Date Range Bounds
    const { minDate, maxDate, totalTimelineDays } = useMemo(() => {
        let minTime = Infinity;
        let maxTime = -Infinity;

        timelineData.forEach(d => {
            const dates = [
                d.plannedStart?.getTime(),
                d.plannedEnd?.getTime(),
                d.actualStart?.getTime(),
                d.actualEnd?.getTime(),
                d.feasibilityDate?.getTime(),
                d.contractSigningDate?.getTime()
            ].filter(Boolean) as number[];

            dates.forEach(t => {
                if (t < minTime) minTime = t;
                if (t > maxTime) maxTime = t;
            });
        });

        // Fallbacks if no dates
        if (minTime === Infinity || maxTime === -Infinity) {
            minTime = new Date('2024-01-01').getTime();
            maxTime = new Date('2026-12-31').getTime();
        }

        // Add 1 month padding to start and end for breathing space
        const paddedMin = new Date(minTime);
        paddedMin.setMonth(paddedMin.getMonth() - 1);
        paddedMin.setDate(1);

        const paddedMax = new Date(maxTime);
        paddedMax.setMonth(paddedMax.getMonth() + 2);
        paddedMax.setDate(28);

        const totalDays = Math.max(30, Math.round((paddedMax.getTime() - paddedMin.getTime()) / (1000 * 60 * 60 * 24)));

        return {
            minDate: paddedMin,
            maxDate: paddedMax,
            totalTimelineDays: totalDays
        };
    }, [timelineData]);

    // Time Axis Columns Generation
    const timeAxisColumns = useMemo(() => {
        const columns: { label: string; subLabel?: string; startDate: Date; endDate: Date; widthPercent: number }[] = [];
        const current = new Date(minDate);

        if (timeScale === 'month') {
            while (current <= maxDate) {
                const year = current.getFullYear();
                const month = current.getMonth();
                const start = new Date(year, month, 1);
                const end = new Date(year, month + 1, 0);

                const colDays = Math.round((Math.min(end.getTime(), maxDate.getTime()) - Math.max(start.getTime(), minDate.getTime())) / (1000 * 60 * 60 * 24));
                const widthPercent = (colDays / totalTimelineDays) * 100;

                const monthName = start.toLocaleDateString('en-US', { month: 'short' });
                columns.push({
                    label: monthName,
                    subLabel: String(year),
                    startDate: start,
                    endDate: end,
                    widthPercent
                });

                current.setMonth(current.getMonth() + 1);
            }
        } else if (timeScale === 'quarter') {
            while (current <= maxDate) {
                const year = current.getFullYear();
                const currentMonth = current.getMonth();
                const quarter = Math.floor(currentMonth / 3) + 1;
                const startMonth = (quarter - 1) * 3;
                const start = new Date(year, startMonth, 1);
                const end = new Date(year, startMonth + 3, 0);

                const colDays = Math.round((Math.min(end.getTime(), maxDate.getTime()) - Math.max(start.getTime(), minDate.getTime())) / (1000 * 60 * 60 * 24));
                const widthPercent = (colDays / totalTimelineDays) * 100;

                columns.push({
                    label: `Q${quarter}`,
                    subLabel: String(year),
                    startDate: start,
                    endDate: end,
                    widthPercent
                });

                current.setMonth(current.getMonth() + 3);
            }
        } else if (timeScale === 'week') {
            while (current <= maxDate) {
                const start = new Date(current);
                const end = new Date(current);
                end.setDate(end.getDate() + 6);

                const colDays = 7;
                const widthPercent = (colDays / totalTimelineDays) * 100;

                const weekNum = Math.ceil(start.getDate() / 7);
                const monthName = start.toLocaleDateString('en-US', { month: 'short' });

                columns.push({
                    label: `W${weekNum}`,
                    subLabel: `${monthName} '${String(start.getFullYear()).slice(-2)}`,
                    startDate: start,
                    endDate: end,
                    widthPercent
                });

                current.setDate(current.getDate() + 7);
            }
        }

        return columns;
    }, [minDate, maxDate, timeScale, totalTimelineDays]);

    // Position Calculator (Percent of timeline)
    const getDatePositionPercent = (date: Date | null): number => {
        if (!date) return 0;
        const time = date.getTime();
        const minTime = minDate.getTime();
        const maxTime = maxDate.getTime();

        if (time < minTime) return 0;
        if (time > maxTime) return 100;

        return ((time - minTime) / (maxTime - minTime)) * 100;
    };

    // Calculate Today position
    const todayPercent = getDatePositionPercent(new Date());

    // KPI Metrics
    const kpis = useMemo(() => {
        const total = timelineData.length;
        const completed = timelineData.filter(d => d.statusCategory === 'completed_on_time' || d.statusCategory === 'completed_delayed').length;
        const onTrack = timelineData.filter(d => d.statusCategory === 'in_progress_on_track' || d.statusCategory === 'completed_on_time').length;
        const delayed = timelineData.filter(d => d.statusCategory === 'in_progress_delayed' || d.statusCategory === 'completed_delayed').length;
        
        const totalDuration = timelineData.reduce((sum, d) => sum + d.plannedDurationDays, 0);
        const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;
        
        const delayedItems = timelineData.filter(d => d.varianceDays > 0);
        const avgDelay = delayedItems.length > 0 
            ? Math.round(delayedItems.reduce((sum, d) => sum + d.varianceDays, 0) / delayedItems.length) 
            : 0;

        return {
            total,
            completed,
            onTrack,
            delayed,
            avgDuration,
            avgDelay,
            onTrackRate: total > 0 ? Math.round((onTrack / total) * 100) : 0
        };
    }, [timelineData]);

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    // Export to Excel
    const exportGanttToExcel = () => {
        const rows = sortedTimelineData.map(item => [
            item.project.id,
            item.project.name,
            item.project.zone,
            item.project.woreda,
            item.project.projectType,
            item.project.status,
            formatDateStr(item.plannedStart),
            formatDateStr(item.plannedEnd),
            item.plannedDurationDays,
            formatDateStr(item.actualStart),
            formatDateStr(item.actualEnd),
            item.actualDurationDays || '—',
            item.varianceDays > 0 ? `+${item.varianceDays} days (Delayed)` : item.varianceDays < 0 ? `${item.varianceDays} days (Ahead)` : 'On Schedule',
            `${item.progressPercent}%`,
            item.project.estimatedBudget,
            item.contract ? item.contract.contractManager : 'N/A'
        ]);

        const headers = [
            'Project ID',
            'Project Name',
            'Zone',
            'Woreda',
            'Sector',
            'Status',
            'Planned Start Date',
            'Planned Completion Date',
            'Planned Duration (Days)',
            'Actual Start Date',
            'Actual Completion Date',
            'Elapsed/Actual Days',
            'Schedule Variance',
            'Progress Rate',
            'Estimated Budget (ETB)',
            'Contract Manager'
        ];

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        worksheet['!cols'] = [
            { wch: 22 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 },
            { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 22 }, { wch: 18 },
            { wch: 24 }, { wch: 15 }, { wch: 20 }, { wch: 20 }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Project Timelines');
        XLSX.writeFile(workbook, `OWEB_Project_Gantt_Timelines_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Export to PDF
    const exportGanttToPDF = () => {
        const doc = new jsPDF('landscape');

        doc.setFontSize(16);
        doc.setTextColor(2, 132, 199);
        doc.text('OWEB Project Schedule & Timeline Gantt Audit Report', 14, 18);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} | Scope: Planned vs Actual Schedules | Region: Oromia`, 14, 25);

        // Summary Metric Box
        doc.setFillColor(240, 249, 255);
        doc.roundedRect(14, 28, 268, 16, 3, 3, 'F');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(`Total Tracked Projects: ${kpis.total}`, 18, 36);
        doc.text(`On-Track Rate: ${kpis.onTrackRate}%`, 85, 36);
        doc.text(`Delayed Projects: ${kpis.delayed}`, 150, 36);
        doc.text(`Avg Planned Duration: ${kpis.avgDuration} days`, 210, 36);

        const tableHeaders = [['ID & Project Name', 'Zone / Sector', 'Status', 'Planned Timeline', 'Actual Timeline', 'Variance', 'Progress']];
        const tableData = sortedTimelineData.map(item => [
            `${item.project.id}\n${item.project.name}`,
            `${item.project.zone}\n${item.project.projectType}`,
            item.project.status,
            `${formatDateStr(item.plannedStart)} to\n${formatDateStr(item.plannedEnd)} (${item.plannedDurationDays}d)`,
            `${formatDateStr(item.actualStart)} to\n${item.actualEnd ? formatDateStr(item.actualEnd) : 'In Progress'}`,
            item.varianceDays > 0 ? `+${item.varianceDays}d Delayed` : item.varianceDays < 0 ? `${item.varianceDays}d Ahead` : 'On Schedule',
            `${item.progressPercent}%`
        ]);

        autoTable(doc, {
            startY: 48,
            head: tableHeaders,
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [2, 132, 199] },
            styles: { fontSize: 8, cellPadding: 2.5 },
            columnStyles: {
                0: { cellWidth: 70 },
                1: { cellWidth: 40 },
                2: { cellWidth: 25 },
                3: { cellWidth: 45 },
                4: { cellWidth: 45 },
                5: { cellWidth: 25, halign: 'center' },
                6: { cellWidth: 18, halign: 'center' },
            }
        });

        doc.save(`OWEB_Gantt_Timelines_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-6">
            {/* Timeline KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Projects</p>
                        <span className="p-1.5 bg-primary-50 text-primary-600 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 mt-2">{kpis.total}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Across Oromia zones</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">On Schedule Rate</p>
                        <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600 mt-2">{kpis.onTrackRate}%</p>
                    <p className="text-xs text-slate-500 mt-0.5">{kpis.onTrack} on-track / completed</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Delayed / At-Risk</p>
                        <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-rose-600 mt-2">{kpis.delayed}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{kpis.avgDelay > 0 ? `Avg +${kpis.avgDelay}d slippage` : 'None delayed'}</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Completed On Time</p>
                        <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-sky-600 mt-2">{kpis.completed}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Final handover verified</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg Plan Duration</p>
                        <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 mt-2">{Math.round(kpis.avgDuration / 30)} mos</p>
                    <p className="text-xs text-slate-500 mt-0.5">~{kpis.avgDuration} days execution</p>
                </div>
            </div>

            {/* Gantt Controls Bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-primary-600 font-bold">{ICONS.calendar}</span>
                        <div>
                            <h3 className="font-bold text-slate-800 text-base">
                                {customTitle || (moduleMode === 'planning' ? 'Planning Pipeline Gantt & Critical Path Matrix' : moduleMode === 'contracts' ? 'Contracts Portfolio Schedule & Critical Path Matrix' : 'Project Timeline & Gantt Schedule Matrix')}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {customSubtitle || (moduleMode === 'planning' ? 'Visualize project preparation timelines, feasibility & EIA milestones, and critical path dependencies.' : moduleMode === 'contracts' ? 'Track contract execution baselines, variation extensions, deliverables, and critical milestones.' : 'Planned vs. Actual Schedule Comparison across Oromia Water Bureau Projects')}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Interactive Critical Path & Dependency Toggles */}
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setShowCriticalPath(prev => !prev)}
                                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                                    showCriticalPath 
                                        ? 'bg-amber-500 text-white shadow-xs font-bold' 
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="Toggle Critical Path Highlighting"
                            >
                                <span>⚡</span>
                                <span>Critical Path</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowDependencies(prev => !prev)}
                                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                                    showDependencies 
                                        ? 'bg-primary-600 text-white shadow-xs font-bold' 
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="Toggle Milestone Dependency Linkages"
                            >
                                <span>🔗</span>
                                <span>Dependencies</span>
                            </button>
                        </div>

                        {/* Time Scale Zoom Controls */}
                        <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                            <button
                                onClick={() => setTimeScale('quarter')}
                                className={`px-2.5 py-1 rounded-md transition-colors ${
                                    timeScale === 'quarter' ? 'bg-white text-primary-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Quarterly
                            </button>
                            <button
                                onClick={() => setTimeScale('month')}
                                className={`px-2.5 py-1 rounded-md transition-colors ${
                                    timeScale === 'month' ? 'bg-white text-primary-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setTimeScale('week')}
                                className={`px-2.5 py-1 rounded-md transition-colors ${
                                    timeScale === 'week' ? 'bg-white text-primary-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Weekly
                            </button>
                        </div>

                        {/* Export Buttons */}
                        <button
                            onClick={exportGanttToExcel}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-1.5 transition-colors"
                            title="Export Timeline Schedule to Excel"
                        >
                            {ICONS.download}
                            Excel
                        </button>
                        <button
                            onClick={exportGanttToPDF}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 flex items-center gap-1.5 transition-colors"
                            title="Export Timeline Report to PDF"
                        >
                            {ICONS.fileText}
                            PDF
                        </button>
                    </div>
                </div>

                {/* Filter and Sorting Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 pt-2 border-t border-slate-100">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search project or ID..."
                            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">{ICONS.search}</span>
                    </div>

                    <div>
                        <select
                            value={selectedProgramFilter}
                            onChange={(e) => setSelectedProgramFilter(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-500 font-medium"
                        >
                            <option value="all">Program: All Programs</option>
                            {PROGRAMS.map(prog => (
                                <option key={prog} value={prog}>{prog}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <select
                            value={selectedVarianceFilter}
                            onChange={(e) => setSelectedVarianceFilter(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">Schedule Health: All</option>
                            <option value="on_track">🟢 On Schedule / Ahead</option>
                            <option value="delayed">🔴 Delayed / At-Risk Only</option>
                            <option value="completed">🔵 Completed Only</option>
                            <option value="planning">⚪ In Planning Only</option>
                        </select>
                    </div>

                    <div>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value as GroupByMode)}
                            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-500 font-medium"
                        >
                            <option value="none">Group By: None (Flat List)</option>
                            <option value="program">Group By: Program (Portfolio)</option>
                            <option value="zone">Group By: Zone</option>
                            <option value="status">Group By: Project Status</option>
                            <option value="type">Group By: Sector Type</option>
                        </select>
                    </div>

                    <div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortByMode)}
                            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="startDate">Sort: Earliest Planned Start</option>
                            <option value="completionDate">Sort: Target Completion</option>
                            <option value="variance">Sort: Schedule Variance (Delay)</option>
                            <option value="name">Sort: Project Name (A-Z)</option>
                            <option value="budget">Sort: Budget (High to Low)</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-end text-xs text-slate-500 font-medium px-1">
                        Showing <strong className="text-slate-800 mx-1">{filteredTimelineData.length}</strong> of {timelineData.length} projects
                    </div>
                </div>

                {/* Legend Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-2.5 rounded-xs bg-sky-400 border border-sky-500 inline-block"></span>
                            <span className="text-slate-600 font-medium">Planned Baseline Timeline</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-2.5 rounded-xs bg-emerald-500 border border-emerald-600 inline-block"></span>
                            <span className="text-slate-600 font-medium">Actual Execution (On Track / Completed)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-2.5 rounded-xs bg-rose-500 border border-rose-600 inline-block"></span>
                            <span className="text-slate-600 font-medium">Actual Execution (Delayed / Slippage)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-2.5 rounded-xs border-2 border-dashed border-slate-400 bg-slate-100 inline-block"></span>
                            <span className="text-slate-600 font-medium">Pending / Forecast Period</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-600 inline-block"></span>
                            <span className="text-slate-600 font-medium">Key Milestones (Contract / Handover)</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 italic">
                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>
                        Red vertical line indicates Today
                    </div>
                </div>
            </div>

            {/* Main Interactive Gantt Container */}
            <div 
                ref={containerRef}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto relative"
                style={{ minHeight: '400px' }}
            >
                <div style={{ minWidth: '1080px' }} className="select-none">
                    {/* Gantt Header: Project Left Column & Time Scale Right Column */}
                    <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-20">
                        {/* Left Info Column Header */}
                        <div className="w-80 flex-shrink-0 p-3 border-r border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-between">
                            <span>Project Identification & Scope</span>
                            <span className="text-slate-400 font-normal">Plan vs Actual</span>
                        </div>

                        {/* Right Timeline Header Columns */}
                        <div className="flex-1 relative flex">
                            {timeAxisColumns.map((col, idx) => (
                                <div
                                    key={idx}
                                    style={{ width: `${col.widthPercent}%` }}
                                    className="p-2 text-center border-r border-slate-200 text-xs font-semibold text-slate-700 flex flex-col justify-center"
                                >
                                    <span className="text-slate-800 leading-tight">{col.label}</span>
                                    {col.subLabel && <span className="text-[10px] font-normal text-slate-400">{col.subLabel}</span>}
                                </div>
                            ))}

                            {/* Today Marker Line in Header */}
                            {todayPercent >= 0 && todayPercent <= 100 && (
                                <div 
                                    style={{ left: `${todayPercent}%` }}
                                    className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
                                >
                                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs -translate-y-1">
                                        TODAY
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Gantt Body Rows */}
                    <div className="relative divide-y divide-slate-100">
                        {/* Vertical Grid Lines & Today Marker across all rows */}
                        <div className="absolute inset-0 left-80 flex pointer-events-none z-0">
                            {timeAxisColumns.map((col, idx) => (
                                <div
                                    key={idx}
                                    style={{ width: `${col.widthPercent}%` }}
                                    className="border-r border-slate-100 h-full"
                                />
                            ))}

                            {/* Continuous Today Line */}
                            {todayPercent >= 0 && todayPercent <= 100 && (
                                <div
                                    style={{ left: `${todayPercent}%` }}
                                    className="absolute top-0 bottom-0 border-l-2 border-dashed border-red-500 z-10 opacity-70"
                                />
                            )}
                        </div>

                        {groupedData.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <p className="text-base font-semibold">No project schedules match your search filters.</p>
                                <p className="text-xs mt-1">Try resetting the status, sector, or keyword filters above.</p>
                            </div>
                        ) : (
                            groupedData.map((group, groupIdx) => {
                                const isCollapsed = expandedGroups[group.groupName] === false;

                                return (
                                    <div key={groupIdx} className="relative z-10">
                                        {/* Group Header Row (if grouping enabled) */}
                                        {groupBy !== 'none' && (
                                            <div
                                                onClick={() => toggleGroup(group.groupName)}
                                                className="bg-slate-100/80 px-4 py-2 flex items-center justify-between border-y border-slate-200 cursor-pointer hover:bg-slate-200/70 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-600 text-xs font-bold">{isCollapsed ? '▶' : '▼'}</span>
                                                    <span className="font-bold text-xs text-slate-800">{group.groupName}</span>
                                                    <span className="text-[11px] px-2 py-0.2 bg-white rounded-full text-slate-600 border border-slate-200 font-medium">
                                                        {group.items.length} {group.items.length === 1 ? 'project' : 'projects'}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-primary-600 font-medium">
                                                    {isCollapsed ? 'Expand Group' : 'Collapse Group'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Project Rows */}
                                        {!isCollapsed && group.items.map((item, rowIdx) => {
                                            const pStartPercent = getDatePositionPercent(item.plannedStart);
                                            const pEndPercent = getDatePositionPercent(item.plannedEnd);
                                            const pWidthPercent = Math.max(0.5, pEndPercent - pStartPercent);

                                            const aStartPercent = item.actualStart ? getDatePositionPercent(item.actualStart) : null;
                                            const aEndPercent = item.actualEnd 
                                                ? getDatePositionPercent(item.actualEnd) 
                                                : (item.actualStart ? getDatePositionPercent(new Date()) : null);
                                            const aWidthPercent = (aStartPercent !== null && aEndPercent !== null) 
                                                ? Math.max(0.5, aEndPercent - aStartPercent) 
                                                : null;

                                            // Milestone positions
                                            const signingPercent = item.contractSigningDate ? getDatePositionPercent(item.contractSigningDate) : null;
                                            const commencementPercent = item.commencementDate ? getDatePositionPercent(item.commencementDate) : null;
                                            const siteHandoverPercent = item.siteHandoverDate ? getDatePositionPercent(item.siteHandoverDate) : null;

                                            const isDelayed = item.varianceDays > 0;
                                            const isAhead = item.varianceDays < 0;
                                            const isCritical = isDelayed || (item.project.status === ProjectStatus.UNDER_REVIEW || item.project.status === ProjectStatus.SUBMITTED) || (item.plannedDurationDays >= 180);

                                            return (
                                                <div
                                                    key={item.project.id}
                                                    className={`flex hover:bg-slate-50/90 transition-colors group relative border-b border-slate-100 ${
                                                        showCriticalPath && isCritical ? 'bg-amber-50/30 border-l-4 border-l-amber-500' : ''
                                                    }`}
                                                    onMouseEnter={(e) => {
                                                        setHoveredProject(item);
                                                        setTooltipPos({ x: e.clientX, y: e.clientY });
                                                    }}
                                                    onMouseMove={(e) => {
                                                        setTooltipPos({ x: e.clientX, y: e.clientY });
                                                    }}
                                                    onMouseLeave={() => setHoveredProject(null)}
                                                >
                                                    {/* Left Project Info Panel */}
                                                    <div className="w-80 flex-shrink-0 p-3 border-r border-slate-200 flex flex-col justify-center gap-1.5 bg-white/70">
                                                        <div className="flex items-start justify-between gap-1">
                                                            <button
                                                                onClick={() => setSelectedProjectForModal(item)}
                                                                className="text-left font-bold text-xs text-primary-700 hover:text-primary-900 hover:underline line-clamp-1 flex-1"
                                                                title={item.project.name}
                                                            >
                                                                {item.project.name}
                                                            </button>
                                                            <div className="flex items-center gap-1">
                                                                {showCriticalPath && isCritical && (
                                                                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-xs bg-amber-500 text-white shadow-2xs whitespace-nowrap animate-pulse">
                                                                        ⚡ CRITICAL
                                                                    </span>
                                                                )}
                                                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap ${
                                                                    item.project.status === ProjectStatus.COMPLETED ? 'bg-emerald-100 text-emerald-800' :
                                                                    item.project.status === ProjectStatus.APPROVED ? 'bg-sky-100 text-sky-800' :
                                                                    item.project.status === ProjectStatus.REJECTED ? 'bg-rose-100 text-rose-800' :
                                                                    'bg-amber-100 text-amber-800'
                                                                }`}>
                                                                    {item.project.status}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                                                            <span>{item.project.id}</span>
                                                            <span>{item.project.zone} · {item.project.projectType}</span>
                                                        </div>

                                                        {/* Dependency Flow Badge (if enabled) */}
                                                        {showDependencies && (
                                                            <div className="flex items-center gap-1 text-[9px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 overflow-hidden text-ellipsis whitespace-nowrap">
                                                                <span className="font-semibold text-slate-700">Sequence:</span>
                                                                <span className={item.feasibilityDate ? 'text-emerald-700 font-bold' : 'text-slate-400'}>Feasibility</span>
                                                                <span>→</span>
                                                                <span className={item.eiaApprovalDate ? 'text-emerald-700 font-bold' : 'text-slate-400'}>EIA</span>
                                                                <span>→</span>
                                                                <span className={item.contractSigningDate ? 'text-emerald-700 font-bold' : 'text-slate-400'}>Contract</span>
                                                                <span>→</span>
                                                                <span className={item.actualEnd ? 'text-emerald-700 font-bold' : item.actualStart ? 'text-sky-700 font-bold' : 'text-slate-400'}>Handover</span>
                                                            </div>
                                                        )}

                                                        {/* Schedule Variance Pill */}
                                                        <div className="flex items-center justify-between pt-0.5">
                                                            <div className="flex items-center gap-1 text-[10px]">
                                                                {isDelayed ? (
                                                                    <span className="font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                                                        ⚠️ +{item.varianceDays}d Delayed
                                                                    </span>
                                                                ) : isAhead ? (
                                                                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                                                        ✓ {Math.abs(item.varianceDays)}d Ahead
                                                                    </span>
                                                                ) : item.statusCategory === 'completed_on_time' ? (
                                                                    <span className="font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                                                                        ✓ Delivered on Schedule
                                                                    </span>
                                                                ) : (
                                                                    <span className="font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                                                        On Schedule
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <span className="text-[10px] font-bold text-slate-700">
                                                                {formatCurrency(item.project.estimatedBudget)} ETB
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Right Gantt Dual-Bar Visualization Canvas */}
                                                    <div className="flex-1 relative flex flex-col justify-center py-2 px-1 min-h-[76px]">
                                                        {/* Planned Track (Upper Bar) */}
                                                        {item.plannedStart && item.plannedEnd && (
                                                            <div className="relative h-5 mb-1.5 w-full">
                                                                <div
                                                                    style={{
                                                                        left: `${pStartPercent}%`,
                                                                        width: `${pWidthPercent}%`,
                                                                    }}
                                                                    className="absolute top-0 bottom-0 bg-sky-100 border border-sky-400 rounded-md flex items-center px-2 shadow-2xs group-hover:border-sky-600 transition-all overflow-hidden"
                                                                >
                                                                    <div className="flex items-center justify-between w-full text-[10px] text-sky-800 font-semibold truncate">
                                                                        <span>Planned: {formatReadableDate(item.plannedStart)} – {formatReadableDate(item.plannedEnd)}</span>
                                                                        <span className="ml-1 opacity-80 whitespace-nowrap">{item.plannedDurationDays}d ({Math.round(item.plannedDurationDays / 30)}m)</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Actual Track (Lower Bar) */}
                                                        <div className="relative h-5 w-full">
                                                            {aStartPercent !== null && aWidthPercent !== null ? (
                                                                <div
                                                                    style={{
                                                                        left: `${aStartPercent}%`,
                                                                        width: `${aWidthPercent}%`,
                                                                    }}
                                                                    className={`absolute top-0 bottom-0 rounded-md flex items-center px-2 shadow-xs transition-all overflow-hidden border ${
                                                                        isDelayed 
                                                                            ? 'bg-rose-500 border-rose-600 text-white' 
                                                                            : 'bg-emerald-500 border-emerald-600 text-white'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between w-full text-[10px] font-semibold truncate">
                                                                        <span>
                                                                            Actual: {formatReadableDate(item.actualStart)} → {item.actualEnd ? formatReadableDate(item.actualEnd) : 'Active Progress'}
                                                                        </span>
                                                                        <span className="ml-1 bg-black/20 px-1 py-0.2 rounded text-[9px] font-bold">
                                                                            {item.actualEnd ? 'Completed' : `${item.progressPercent}% Elapsed`}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                // If actual start has not commenced yet
                                                                <div
                                                                    style={{
                                                                        left: `${pStartPercent}%`,
                                                                        width: `${pWidthPercent}%`,
                                                                    }}
                                                                    className="absolute top-0 bottom-0 border border-dashed border-slate-300 bg-slate-50/80 rounded-md flex items-center justify-center px-2 text-[10px] text-slate-400 font-medium italic"
                                                                >
                                                                    Pending Commencement & Site Handover
                                                                </div>
                                                            )}

                                                            {/* Milestone Markers */}
                                                            {signingPercent !== null && (
                                                                <div 
                                                                    style={{ left: `${signingPercent}%` }}
                                                                    className="absolute top-0 -translate-x-1/2 z-20"
                                                                    title={`Contract Signing: ${formatReadableDate(item.contractSigningDate)}`}
                                                                >
                                                                    <div className="w-2.5 h-2.5 rotate-45 bg-amber-500 border border-white shadow-xs"></div>
                                                                </div>
                                                            )}

                                                            {commencementPercent !== null && (
                                                                <div 
                                                                    style={{ left: `${commencementPercent}%` }}
                                                                    className="absolute bottom-0 -translate-x-1/2 z-20"
                                                                    title={`Commencement / Handover: ${formatReadableDate(item.commencementDate)}`}
                                                                >
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600 border border-white shadow-xs"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Hover Floating Tooltip */}
            {hoveredProject && tooltipPos && (
                <div
                    style={{
                        position: 'fixed',
                        left: Math.min(window.innerWidth - 340, tooltipPos.x + 16),
                        top: Math.min(window.innerHeight - 260, tooltipPos.y + 16),
                        zIndex: 100,
                        pointerEvents: 'none'
                    }}
                    className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 w-80 text-xs space-y-2 animate-fade-in"
                >
                    <div className="flex items-start justify-between gap-1 border-b border-slate-800 pb-2">
                        <div>
                            <p className="font-bold text-white leading-tight">{hoveredProject.project.name}</p>
                            <p className="text-[10px] text-slate-400">{hoveredProject.project.id} · {hoveredProject.project.zone}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            hoveredProject.project.status === ProjectStatus.COMPLETED ? 'bg-emerald-800 text-emerald-100' :
                            hoveredProject.project.status === ProjectStatus.APPROVED ? 'bg-sky-800 text-sky-100' :
                            'bg-amber-800 text-amber-100'
                        }`}>
                            {hoveredProject.project.status}
                        </span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Planned Schedule:</span>
                            <span className="font-semibold text-sky-300">
                                {formatReadableDate(hoveredProject.plannedStart)} → {formatReadableDate(hoveredProject.plannedEnd)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Planned Duration:</span>
                            <span className="font-medium text-slate-200">{hoveredProject.plannedDurationDays} days (~{Math.round(hoveredProject.plannedDurationDays / 30)} mos)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Actual Timeline:</span>
                            <span className={`font-semibold ${hoveredProject.actualStart ? 'text-emerald-300' : 'text-slate-400'}`}>
                                {hoveredProject.actualStart ? formatReadableDate(hoveredProject.actualStart) : 'Not Started'} → {hoveredProject.actualEnd ? formatReadableDate(hoveredProject.actualEnd) : 'In Progress'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Schedule Health:</span>
                            <span className={`font-bold ${
                                hoveredProject.varianceDays > 0 ? 'text-rose-400' :
                                hoveredProject.varianceDays < 0 ? 'text-emerald-400' :
                                'text-sky-300'
                            }`}>
                                {hoveredProject.varianceDays > 0 ? `+${hoveredProject.varianceDays} Days Delayed` :
                                 hoveredProject.varianceDays < 0 ? `${Math.abs(hoveredProject.varianceDays)} Days Ahead` :
                                 'On Track with Baseline'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Budget Allocation:</span>
                            <span className="font-medium text-slate-200">{formatCurrency(hoveredProject.project.estimatedBudget)} ETB</span>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Click project row for deep milestone breakdown</span>
                        <span className="text-primary-400">Inspect ↗</span>
                    </div>
                </div>
            )}

            {/* Detailed Project Timeline Modal */}
            {selectedProjectForModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-800">
                                        {selectedProjectForModal.project.id}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                        selectedProjectForModal.project.status === ProjectStatus.COMPLETED ? 'bg-emerald-100 text-emerald-800' :
                                        selectedProjectForModal.project.status === ProjectStatus.APPROVED ? 'bg-sky-100 text-sky-800' :
                                        'bg-amber-100 text-amber-800'
                                    }`}>
                                        {selectedProjectForModal.project.status}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedProjectForModal.project.name}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {selectedProjectForModal.project.zone} Zone, {selectedProjectForModal.project.woreda} · Sector: {selectedProjectForModal.project.projectType} ({selectedProjectForModal.project.projectSubType})
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedProjectForModal(null)}
                                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Planned vs Actual Comparison Card */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-sky-800 uppercase tracking-wide">Planned Baseline Schedule</span>
                                    <span className="text-xs font-bold text-sky-700">{selectedProjectForModal.plannedDurationDays} Days</span>
                                </div>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Planned Start:</span>
                                        <span className="font-bold text-slate-800">{formatReadableDate(selectedProjectForModal.plannedStart)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Target Completion:</span>
                                        <span className="font-bold text-slate-800">{formatReadableDate(selectedProjectForModal.plannedEnd)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Duration in Months:</span>
                                        <span className="font-semibold text-slate-800">~{Math.round(selectedProjectForModal.plannedDurationDays / 30)} Months</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Actual Execution Schedule</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                        selectedProjectForModal.varianceDays > 0 ? 'bg-rose-100 text-rose-800' :
                                        selectedProjectForModal.varianceDays < 0 ? 'bg-emerald-100 text-emerald-800' :
                                        'bg-sky-100 text-sky-800'
                                    }`}>
                                        {selectedProjectForModal.varianceDays > 0 ? `+${selectedProjectForModal.varianceDays}d Delayed` :
                                         selectedProjectForModal.varianceDays < 0 ? `${Math.abs(selectedProjectForModal.varianceDays)}d Ahead` :
                                         'On Baseline'}
                                    </span>
                                </div>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Actual Commencement:</span>
                                        <span className="font-bold text-slate-800">{formatReadableDate(selectedProjectForModal.actualStart)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Actual/Forecast Finish:</span>
                                        <span className="font-bold text-slate-800">{formatReadableDate(selectedProjectForModal.actualEnd) || 'Underway'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Physical Progress:</span>
                                        <span className="font-semibold text-emerald-700">{selectedProjectForModal.progressPercent}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lifecycle Milestone Roadmap */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-sm text-slate-800">Project Milestone Lifecycle Audit</h4>
                            <div className="space-y-2.5">
                                {[
                                    {
                                        title: '1. Feasibility Study & Engineering Validation',
                                        date: selectedProjectForModal.feasibilityDate,
                                        detail: selectedProjectForModal.project.feasibilityConsultant ? `Consultant: ${selectedProjectForModal.project.feasibilityConsultant}` : 'Study cleared',
                                        completed: selectedProjectForModal.project.feasibilityStudyConducted
                                    },
                                    {
                                        title: '2. Environmental Impact Assessment (EIA) Approval',
                                        date: selectedProjectForModal.eiaApprovalDate,
                                        detail: `Risk Rating: ${selectedProjectForModal.project.eiaRiskRating || selectedProjectForModal.project.environmentalRiskLevel}`,
                                        completed: selectedProjectForModal.project.eiaConducted
                                    },
                                    {
                                        title: '3. Procurement Bidding & Contractor Award',
                                        date: selectedProjectForModal.procurement?.awardDate ? new Date(selectedProjectForModal.procurement.awardDate) : null,
                                        detail: selectedProjectForModal.procurement?.awardedBidderId ? `Awarded: ${selectedProjectForModal.procurement.awardedBidderId}` : 'Procurement in progress',
                                        completed: !!selectedProjectForModal.procurement?.awardedBidderId
                                    },
                                    {
                                        title: '4. Contract Agreement & Performance Bond',
                                        date: selectedProjectForModal.contractSigningDate,
                                        detail: selectedProjectForModal.contract ? `Bond: ${formatCurrency(selectedProjectForModal.contract.performanceBondAmount || 0)} ${selectedProjectForModal.contract.performanceBondCurrency || 'ETB'}` : 'Pending signature',
                                        completed: !!selectedProjectForModal.contractSigningDate
                                    },
                                    {
                                        title: '5. Site Handover & Commencement of Works',
                                        date: selectedProjectForModal.commencementDate,
                                        detail: selectedProjectForModal.contract?.contractManager ? `Manager: ${selectedProjectForModal.contract.contractManager} | Supervisor: ${selectedProjectForModal.contract.supervisor}` : 'Handover pending',
                                        completed: !!selectedProjectForModal.commencementDate
                                    },
                                    {
                                        title: '6. Final Completion & Facility Handover',
                                        date: selectedProjectForModal.actualEnd,
                                        detail: selectedProjectForModal.project.status === ProjectStatus.COMPLETED ? 'Fully commissioned' : `Target: ${formatReadableDate(selectedProjectForModal.plannedEnd)}`,
                                        completed: selectedProjectForModal.project.status === ProjectStatus.COMPLETED
                                    }
                                ].map((step, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                                step.completed ? 'bg-emerald-600' : 'bg-slate-300 text-slate-600'
                                            }`}>
                                                {step.completed ? '✓' : idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-xs text-slate-800">{step.title}</p>
                                                <p className="text-[11px] text-slate-500">{step.detail}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-700">{formatReadableDate(step.date)}</p>
                                            <p className={`text-[10px] font-semibold ${step.completed ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {step.completed ? 'Completed' : 'Pending'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contract Variations & Time Extension Impact */}
                        {selectedProjectForModal.contract && selectedProjectForModal.contract.variations && selectedProjectForModal.contract.variations.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-bold text-sm text-slate-800">Approved Variations & Schedule Extensions</h4>
                                <div className="space-y-2">
                                    {selectedProjectForModal.contract.variations.map((v) => (
                                        <div key={v.id} className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                                            <div>
                                                <p className="font-bold text-slate-800">{v.description}</p>
                                                <p className="text-slate-500 text-[11px]">Type: {v.type} · Status: {v.status}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-rose-600">+{v.timeImpactDays} Days Extension</p>
                                                <p className="font-semibold text-slate-700">{formatCurrency(v.costImpact)} ETB</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer Action */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setSelectedProjectForModal(null)}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GanttTimelineChart;
