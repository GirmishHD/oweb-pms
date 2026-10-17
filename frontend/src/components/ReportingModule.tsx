import React, { useState, useMemo } from 'react';
import { Project, Contract, Procurement, ActivityLog, ProjectStatus, User, Role, FieldInspectionLog, WeeklyWorkPlan } from '../types';
import { ZONES, OROMIA_HIERARCHY, PROJECT_TYPES, ICONS, IMPLEMENTING_BODIES, FUNDING_SOURCES, PROGRAMS } from '../constants';
import { Section, Select, FileInput } from './FormControls';
import GanttTimelineChart from './GanttTimelineChart';
import PhaseCostBreakdownTable from './PhaseCostBreakdownTable';
import BudgetVarianceTable from './BudgetVarianceTable';
import PerformanceDashboard from './PerformanceDashboard';
import { ProgramPortfolioReportsSection } from './ProgramPortfolioReportsSection';
import { loadPrograms } from '../services/programService';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    Legend, 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell, 
    CartesianGrid,
    ComposedChart,
    Line
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportingModuleProps {
    projects: Project[];
    contracts: Contract[];
    procurements?: Procurement[];
    activityLogs: ActivityLog[];
    user: User;
    onBackup: () => Promise<void>;
    onRestore: (file: File) => Promise<void>;
    inspections?: FieldInspectionLog[];
    weeklyPlans?: WeeklyWorkPlan[];
    onNavigate?: (module: string, itemId?: string) => void;
}

// Harmonious, high-contrast accessible color palette
const CHART_COLORS = [
    '#0284c7', // Primary Sky Blue
    '#10b981', // Success Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Purple/Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#6366f1', // Indigo
    '#14b8a6', // Teal
    '#64748b', // Slate
    '#e11d48', // Rose
    '#84cc16', // Lime
];

const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);
};

const formatCompactCurrency = (val: number): string => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B ETB`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M ETB`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k ETB`;
    return `${val} ETB`;
};

// Administrative Regional Development Corridors in Oromia Regional State
export const REGIONAL_CORRIDORS: Record<string, { label: string; description: string; zones: string[] }> = {
    'central': {
        label: 'Central Corridor (Shewa)',
        description: 'East Shewa, West Shewa, Southwest Shewa, North Shewa',
        zones: ['East Shewa', 'West Shewa', 'Southwest Shewa', 'North Shewa']
    },
    'eastern': {
        label: 'Eastern Corridor (Hararghe)',
        description: 'East Hararghe, West Hararghe',
        zones: ['East Hararghe', 'West Hararghe']
    },
    'western': {
        label: 'Western Corridor (Welega & Illubabor)',
        description: 'East Welega, West Welega, Kelam Welega, Horo Guduru Welega, Illubabor',
        zones: ['East Welega', 'West Welega', 'Kelam Welega', 'Horo Guduru Welega', 'Illubabor']
    },
    'southern': {
        label: 'Southern Corridor (Arsi, Bale, Borena & Guji)',
        description: 'Arsi, West Arsi, Bale, Borena, Guji',
        zones: ['Arsi', 'West Arsi', 'Bale', 'Borena', 'Guji']
    },
    'southwest': {
        label: 'Southwest Corridor (Jimma)',
        description: 'Jimma Zone & Urban Basin',
        zones: ['Jimma']
    }
};

const DATE_PRESETS = [
    { key: 'all', label: 'All Dates' },
    { key: '2026', label: 'FY 2026 (Current)' },
    { key: '2025', label: 'FY 2025 (Previous)' },
    { key: '2024-2026', label: '2024–2026 Strategic Plan' },
    { key: 'q1_2026', label: 'Q1 2026 (Jan–Mar)' },
    { key: 'q2_2026', label: 'Q2 2026 (Apr–Jun)' },
    { key: 'q3_2026', label: 'Q3 2026 (Jul–Sep)' },
    { key: 'q4_2026', label: 'Q4 2026 (Oct–Dec)' },
    { key: 'past_12m', label: 'Past 12 Months' },
    { key: 'next_12m', label: 'Next 12 Months' },
    { key: 'custom', label: 'Custom Range' },
];

const DATE_FIELD_OPTIONS = [
    { value: 'timeline', label: 'Active Execution Timeline (Overlapping Period)' },
    { value: 'plannedStart', label: 'Planned Start Date' },
    { value: 'plannedCompletion', label: 'Planned Completion Date' },
    { value: 'actualStart', label: 'Actual Start Date' },
    { value: 'actualCompletion', label: 'Actual Completion Date' },
];

const ReportingModule: React.FC<ReportingModuleProps> = ({ 
    projects = [], 
    contracts = [], 
    procurements = [], 
    activityLogs = [], 
    user, 
    onBackup, 
    onRestore,
    inspections = [],
    weeklyPlans = [],
    onNavigate
}) => {
    const [activeTab, setActiveTab] = useState<'performance' | 'analytics' | 'programReports' | 'budgetVariance' | 'phaseCosts' | 'gantt' | 'projects' | 'financial' | 'audit' | 'backup'>('performance');
    
    // Global filter state for reports & analytics
    const [projectFilters, setProjectFilters] = useState({
        program: '',
        region: '',
        zone: '',
        woreda: '',
        status: '',
        type: '',
        implementingBody: '',
        fundingSource: '',
        dateFrom: '',
        dateTo: '',
        datePreset: 'all',
        dateFilterField: 'timeline' as 'timeline' | 'plannedStart' | 'plannedCompletion' | 'actualStart' | 'actualCompletion',
    });

    // Expandable filter panel toggle
    const [isDateFilterExpanded, setIsDateFilterExpanded] = useState(false);

    // Chart display options in Analytics tab
    const [chartDisplayMode, setChartDisplayMode] = useState<'grouped' | 'stacked' | 'utilization'>('grouped');
    const [zoneSortBy, setZoneSortBy] = useState<'budget' | 'expenditure' | 'utilization' | 'name'>('budget');
    const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

    // Backup & restore states
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [restoreFileKey, setRestoreFileKey] = useState(Date.now());

    const handleBackupClick = async () => {
        setIsBackingUp(true);
        await onBackup();
        setIsBackingUp(false);
    };

    const handleRestoreClick = async () => {
        if (!restoreFile) return;
        if (window.confirm("Are you sure you want to restore from this backup? All current data in the system will be permanently overwritten. This action cannot be undone.")) {
            setIsRestoring(true);
            await onRestore(restoreFile);
            setIsRestoring(false);
            setRestoreFile(null);
            setRestoreFileKey(Date.now());
        }
    };

    // Distinct project regions from dataset
    const distinctProjectRegions = useMemo(() => {
        const set = new Set<string>();
        projects.forEach(p => {
            if (p.region && p.region.trim()) {
                set.add(p.region.trim());
            }
        });
        return Array.from(set);
    }, [projects]);

    const handlePresetChange = (presetKey: string) => {
        const now = new Date();

        let dateFrom = '';
        let dateTo = '';

        switch (presetKey) {
            case '2026':
                dateFrom = '2026-01-01';
                dateTo = '2026-12-31';
                break;
            case '2025':
                dateFrom = '2025-01-01';
                dateTo = '2025-12-31';
                break;
            case '2024-2026':
                dateFrom = '2024-01-01';
                dateTo = '2026-12-31';
                break;
            case 'q1_2026':
                dateFrom = '2026-01-01';
                dateTo = '2026-03-31';
                break;
            case 'q2_2026':
                dateFrom = '2026-04-01';
                dateTo = '2026-06-30';
                break;
            case 'q3_2026':
                dateFrom = '2026-07-01';
                dateTo = '2026-09-30';
                break;
            case 'q4_2026':
                dateFrom = '2026-10-01';
                dateTo = '2026-12-31';
                break;
            case 'past_12m': {
                const past = new Date(now);
                past.setFullYear(past.getFullYear() - 1);
                dateFrom = past.toISOString().split('T')[0];
                dateTo = now.toISOString().split('T')[0];
                break;
            }
            case 'next_12m': {
                const future = new Date(now);
                future.setFullYear(future.getFullYear() + 1);
                dateFrom = now.toISOString().split('T')[0];
                dateTo = future.toISOString().split('T')[0];
                break;
            }
            case 'all':
            default:
                dateFrom = '';
                dateTo = '';
                break;
        }

        setProjectFilters(prev => ({
            ...prev,
            datePreset: presetKey,
            dateFrom,
            dateTo,
        }));
    };
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setProjectFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            if (name === 'region') {
                const corridor = REGIONAL_CORRIDORS[value];
                if (corridor && prev.zone && !corridor.zones.includes(prev.zone)) {
                    newFilters.zone = '';
                    newFilters.woreda = '';
                }
            }
            if (name === 'zone') {
                newFilters.woreda = '';
            }
            if (name === 'dateFrom' || name === 'dateTo') {
                newFilters.datePreset = 'custom';
            }
            return newFilters;
        });
    };

    const handleClearDates = () => {
        setProjectFilters(prev => ({
            ...prev,
            dateFrom: '',
            dateTo: '',
            datePreset: 'all',
        }));
    };

    const handleResetFilters = () => {
        setProjectFilters({
            program: '',
            region: '',
            zone: '',
            woreda: '',
            status: '',
            type: '',
            implementingBody: '',
            fundingSource: '',
            dateFrom: '',
            dateTo: '',
            datePreset: 'all',
            dateFilterField: 'timeline',
        });
    };

    const removeSingleFilter = (key: keyof typeof projectFilters) => {
        setProjectFilters(prev => {
            const next = { ...prev, [key]: '' };
            if (key === 'region') {
                // If zone doesn't match, keep it
            }
            if (key === 'zone') {
                next.woreda = '';
            }
            if (key === 'dateFrom' || key === 'dateTo') {
                next.dateFrom = '';
                next.dateTo = '';
                next.datePreset = 'all';
            }
            return next;
        });
    };

    // Available zones filtered by selected region corridor
    const availableZones = useMemo(() => {
        if (!projectFilters.region) return ZONES;
        const corridor = REGIONAL_CORRIDORS[projectFilters.region];
        if (corridor) {
            return corridor.zones;
        }
        return ZONES;
    }, [projectFilters.region]);

    const woredaOptions = useMemo(() => {
        if (!projectFilters.zone) return [];
        return OROMIA_HIERARCHY[projectFilters.zone as keyof typeof OROMIA_HIERARCHY] || [];
    }, [projectFilters.zone]);

    // Filtered projects based on current selections (Region, Zone, Woreda, Date Range, Status, etc.)
    const filteredProjects = useMemo(() => {
        const fromDate = projectFilters.dateFrom ? new Date(projectFilters.dateFrom) : null;
        const toDate = projectFilters.dateTo ? new Date(projectFilters.dateTo) : null;
        if (toDate) toDate.setHours(23, 59, 59, 999);
        if (fromDate) fromDate.setHours(0, 0, 0, 0);

        const dateField = projectFilters.dateFilterField;

        return projects.filter(p => {
            // Program filter
            if (projectFilters.program && p.program !== projectFilters.program) return false;

            // Region filter
            if (projectFilters.region) {
                const corridor = REGIONAL_CORRIDORS[projectFilters.region];
                if (corridor) {
                    if (!corridor.zones.includes(p.zone) && p.region !== corridor.label) {
                        return false;
                    }
                } else if (p.region !== projectFilters.region) {
                    return false;
                }
            }

            // Zone & Woreda filter
            if (projectFilters.zone && p.zone !== projectFilters.zone) return false;
            if (projectFilters.woreda && p.woreda !== projectFilters.woreda) return false;
            if (projectFilters.status && p.status !== projectFilters.status) return false;
            if (projectFilters.type && p.projectType !== projectFilters.type) return false;
            if (projectFilters.implementingBody && p.implementingBody !== projectFilters.implementingBody) return false;
            if (projectFilters.fundingSource && p.fundingSource !== projectFilters.fundingSource) return false;

            // Date Range filter
            if (fromDate || toDate) {
                const getDateObj = (val?: string) => {
                    if (!val) return null;
                    const d = new Date(val);
                    return isNaN(d.getTime()) ? null : d;
                };

                if (dateField === 'plannedStart') {
                    const d = getDateObj(p.plannedStartDate);
                    if (!d) return false;
                    if (fromDate && d < fromDate) return false;
                    if (toDate && d > toDate) return false;
                } else if (dateField === 'plannedCompletion') {
                    const d = getDateObj(p.plannedCompletionDate);
                    if (!d) return false;
                    if (fromDate && d < fromDate) return false;
                    if (toDate && d > toDate) return false;
                } else if (dateField === 'actualStart') {
                    const d = getDateObj(p.actualStartDate);
                    if (!d) return false;
                    if (fromDate && d < fromDate) return false;
                    if (toDate && d > toDate) return false;
                } else if (dateField === 'actualCompletion') {
                    const d = getDateObj(p.actualCompletionDate);
                    if (!d) return false;
                    if (fromDate && d < fromDate) return false;
                    if (toDate && d > toDate) return false;
                } else {
                    // 'timeline' - active overlapping window
                    const start = getDateObj(p.actualStartDate) || getDateObj(p.plannedStartDate) || getDateObj(p.feasibilityStudyDate);
                    const end = getDateObj(p.actualCompletionDate) || getDateObj(p.plannedCompletionDate) || (start ? new Date(start.getTime() + 180 * 86400000) : null);

                    if (start || end) {
                        if (fromDate && end && end < fromDate) return false;
                        if (toDate && start && start > toDate) return false;
                    }
                }
            }

            return true;
        });
    }, [projects, projectFilters]);

    // Map contracts by projectId for quick lookup of payments & variations
    const projectContractsMap = useMemo(() => {
        const map = new Map<string, Contract[]>();
        contracts.forEach(c => {
            const existing = map.get(c.projectId) || [];
            existing.push(c);
            map.set(c.projectId, existing);
        });
        return map;
    }, [contracts]);

    // Calculate actual expenditure for a given project
    const getProjectExpenditure = (projectId: string): number => {
        const projectContracts = projectContractsMap.get(projectId) || [];
        return projectContracts.reduce((sum, contract) => {
            const paymentSum = (contract.payments || []).reduce((pSum, p) => pSum + (p.actualAmount || 0), 0);
            return sum + paymentSum;
        }, 0);
    };

    // Calculate planned payments for a given project
    const getProjectPlannedPayments = (projectId: string): number => {
        const projectContracts = projectContractsMap.get(projectId) || [];
        return projectContracts.reduce((sum, contract) => {
            const paymentSum = (contract.payments || []).reduce((pSum, p) => pSum + (p.amount || 0), 0);
            return sum + paymentSum;
        }, 0);
    };

    // High-level financial KPIs calculated from filtered projects
    const financialSummary = useMemo(() => {
        let totalPlannedBudget = 0;
        let totalActualExpenditure = 0;
        let totalPlannedPayments = 0;
        let totalContractValue = 0;
        let totalVariationCost = 0;
        let activeContractsCount = 0;

        filteredProjects.forEach(p => {
            totalPlannedBudget += p.estimatedBudget || 0;
            const projectContracts = projectContractsMap.get(p.id) || [];
            
            projectContracts.forEach(c => {
                totalContractValue += p.estimatedBudget;
                if (!c.completionDate) activeContractsCount++;
                totalVariationCost += (c.variations || []).reduce((sum, v) => sum + (v.status === 'Approved' ? v.costImpact : 0), 0);
                totalPlannedPayments += (c.payments || []).reduce((sum, pay) => sum + pay.amount, 0);
                totalActualExpenditure += (c.payments || []).reduce((sum, pay) => sum + (pay.actualAmount || 0), 0);
            });
        });

        const variance = totalPlannedBudget - totalActualExpenditure;
        const overallUtilization = totalPlannedBudget > 0 ? (totalActualExpenditure / totalPlannedBudget) * 100 : 0;

        return {
            totalPlannedBudget,
            totalActualExpenditure,
            totalPlannedPayments,
            totalContractValue,
            totalVariationCost,
            activeContractsCount,
            variance,
            overallUtilization,
        };
    }, [filteredProjects, projectContractsMap]);

    // Data aggregation by Zone/Region for Bar Chart & Regional Breakdown
    const regionalFinancialData = useMemo(() => {
        const zoneMap = new Map<string, {
            zone: string;
            projectCount: number;
            plannedBudget: number;
            actualExpenditure: number;
            plannedPayments: number;
            approvedProjects: number;
            completedProjects: number;
        }>();

        filteredProjects.forEach(p => {
            const zone = p.zone || 'Unassigned';
            const current = zoneMap.get(zone) || {
                zone,
                projectCount: 0,
                plannedBudget: 0,
                actualExpenditure: 0,
                plannedPayments: 0,
                approvedProjects: 0,
                completedProjects: 0,
            };

            current.projectCount += 1;
            current.plannedBudget += p.estimatedBudget || 0;
            current.actualExpenditure += getProjectExpenditure(p.id);
            current.plannedPayments += getProjectPlannedPayments(p.id);
            if (p.status === ProjectStatus.APPROVED) current.approvedProjects += 1;
            if (p.status === ProjectStatus.COMPLETED) current.completedProjects += 1;

            zoneMap.set(zone, current);
        });

        const data = Array.from(zoneMap.values()).map(item => {
            const variance = item.plannedBudget - item.actualExpenditure;
            const utilization = item.plannedBudget > 0 ? Math.round((item.actualExpenditure / item.plannedBudget) * 100) : 0;
            return {
                ...item,
                variance,
                utilization,
            };
        });

        // Apply sorting
        if (zoneSortBy === 'budget') {
            data.sort((a, b) => b.plannedBudget - a.plannedBudget);
        } else if (zoneSortBy === 'expenditure') {
            data.sort((a, b) => b.actualExpenditure - a.actualExpenditure);
        } else if (zoneSortBy === 'utilization') {
            data.sort((a, b) => b.utilization - a.utilization);
        } else {
            data.sort((a, b) => a.zone.localeCompare(b.zone));
        }

        return data;
    }, [filteredProjects, projectContractsMap, zoneSortBy]);

    // Data aggregation for Planned Budget by Zone (Pie Chart)
    const regionalBudgetPieData = useMemo(() => {
        return regionalFinancialData
            .filter(item => item.plannedBudget > 0)
            .map((item, index) => ({
                name: item.zone,
                value: item.plannedBudget,
                color: CHART_COLORS[index % CHART_COLORS.length],
            }));
    }, [regionalFinancialData]);

    // Data aggregation for Actual Expenditure by Zone (Pie Chart)
    const regionalExpenditurePieData = useMemo(() => {
        return regionalFinancialData
            .filter(item => item.actualExpenditure > 0)
            .map((item, index) => ({
                name: item.zone,
                value: item.actualExpenditure,
                color: CHART_COLORS[index % CHART_COLORS.length],
            }));
    }, [regionalFinancialData]);

    // Data aggregation by Project Type (Water Supply, Sanitation, Water Resources)
    const projectTypeFinancialData = useMemo(() => {
        const typeMap = new Map<string, { type: string; plannedBudget: number; actualExpenditure: number; count: number }>();
        
        filteredProjects.forEach(p => {
            const type = p.projectType || 'Other';
            const current = typeMap.get(type) || { type, plannedBudget: 0, actualExpenditure: 0, count: 0 };
            current.plannedBudget += p.estimatedBudget || 0;
            current.actualExpenditure += getProjectExpenditure(p.id);
            current.count += 1;
            typeMap.set(type, current);
        });

        return Array.from(typeMap.values()).map(item => ({
            ...item,
            variance: item.plannedBudget - item.actualExpenditure,
            utilization: item.plannedBudget > 0 ? Math.round((item.actualExpenditure / item.plannedBudget) * 100) : 0,
        }));
    }, [filteredProjects, projectContractsMap]);

    // Data aggregation by Funding Source (OWEB, World Bank, UNICEF, etc.)
    const fundingSourceFinancialData = useMemo(() => {
        const fundMap = new Map<string, { source: string; plannedBudget: number; actualExpenditure: number; count: number }>();

        filteredProjects.forEach(p => {
            const source = p.fundingSource || 'Unspecified';
            const current = fundMap.get(source) || { source, plannedBudget: 0, actualExpenditure: 0, count: 0 };
            current.plannedBudget += p.estimatedBudget || 0;
            current.actualExpenditure += getProjectExpenditure(p.id);
            current.count += 1;
            fundMap.set(source, current);
        });

        return Array.from(fundMap.values()).sort((a, b) => b.plannedBudget - a.plannedBudget);
    }, [filteredProjects, projectContractsMap]);

    // Data aggregation by Project Status
    const statusDistributionData = useMemo(() => {
        const statusCounts = Object.values(ProjectStatus).map(status => {
            const list = filteredProjects.filter(p => p.status === status);
            return {
                name: status,
                count: list.length,
                totalBudget: list.reduce((sum, p) => sum + p.estimatedBudget, 0),
            };
        }).filter(item => item.count > 0);

        return statusCounts;
    }, [filteredProjects]);

    // Critical Budget Overrun Projects (>10% Over Approved Budget)
    const criticalBudgetOverrunProjects = useMemo(() => {
        return filteredProjects.map(p => {
            const plannedBudget = p.estimatedBudget || 0;
            const actualExpenditure = getProjectExpenditure(p.id);
            const isCriticalBudgetOverrun = plannedBudget > 0 && actualExpenditure > plannedBudget * 1.10;
            const overrunExcessAmount = Math.max(0, actualExpenditure - plannedBudget);
            const overrunPct = plannedBudget > 0 ? ((actualExpenditure - plannedBudget) / plannedBudget) * 100 : 0;
            return {
                ...p,
                plannedBudget,
                actualExpenditure,
                isCriticalBudgetOverrun,
                overrunExcessAmount,
                overrunPct
            };
        }).filter(item => item.isCriticalBudgetOverrun);
    }, [filteredProjects, projectContractsMap, procurements]);

    // Custom Tooltip for Recharts
    const CustomRechartsTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3.5 rounded-xl shadow-lg border border-slate-200 text-xs min-w-[200px]">
                    <p className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-100 pb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={`item-${index}`} className="flex justify-between items-center py-1">
                            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                                {entry.name}:
                            </span>
                            <span className="font-mono font-semibold text-slate-900">
                                {typeof entry.value === 'number'
                                    ? entry.unit === '%' 
                                        ? `${entry.value}%` 
                                        : `${formatCurrency(entry.value)} ETB`
                                    : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Export to Excel with separate Project and Regional Financial sheets
    const exportToExcel = () => {
        const workbook = XLSX.utils.book_new();

        // 1. Project-level detailed report
        const headers = ['Project ID', 'Project Name', 'Program', 'Zone', 'Woreda', 'Implementing Body', 'Type', 'Status', 'Planned Budget (ETB)', 'Actual Expenditure (ETB)', 'Execution Rate (%)', 'Funding Source'];
        const projectRows = filteredProjects.map(p => {
            const exp = getProjectExpenditure(p.id);
            const rate = p.estimatedBudget > 0 ? ((exp / p.estimatedBudget) * 100).toFixed(1) : '0';
            return [
                p.id,
                p.name,
                p.program || 'ONE WaSH',
                p.zone,
                p.woreda,
                p.implementingBody,
                p.projectType,
                p.status,
                p.estimatedBudget,
                exp,
                Number(rate),
                p.fundingSource
            ];
        });
        const projectWorksheet = XLSX.utils.aoa_to_sheet([headers, ...projectRows]);
        projectWorksheet['!cols'] = [
            { wch: 24 }, { wch: 38 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 18 }
        ];
        XLSX.utils.book_append_sheet(workbook, projectWorksheet, 'Project Listing');

        // 2. Regional Budget vs Expenditure Aggregation
        const regionalHeaders = ['Zone / Region', 'Total Projects', 'Planned Budget (ETB)', 'Actual Expenditure (ETB)', 'Variance / Unspent (ETB)', 'Utilization Rate (%)'];
        const regionalRows = regionalFinancialData.map(r => [
            r.zone,
            r.projectCount,
            r.plannedBudget,
            r.actualExpenditure,
            r.variance,
            r.utilization
        ]);
        const regionalWorksheet = XLSX.utils.aoa_to_sheet([regionalHeaders, ...regionalRows]);
        regionalWorksheet['!cols'] = [
            { wch: 22 }, { wch: 16 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 20 }
        ];
        XLSX.utils.book_append_sheet(workbook, regionalWorksheet, 'Regional Summary');

        XLSX.writeFile(workbook, `OWEB_Expenditure_vs_Budget_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Export to PDF with executive summary and regional analysis
    const exportToPDF = () => {
        const doc = new jsPDF('landscape');
        
        doc.setFontSize(18);
        doc.setTextColor(2, 132, 199); // Primary blue
        doc.text('OWEB Project Expenditure & Budget Performance Report', 14, 18);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} | User: ${user?.username || 'User'} (${user?.role || Role.USER}) | Scope: Oromia Regional State`, 14, 25);
        
        // Summary box
        doc.setFillColor(240, 249, 255);
        doc.roundedRect(14, 28, 268, 18, 3, 3, 'F');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`Total Planned Budget: ${formatCurrency(financialSummary.totalPlannedBudget)} ETB`, 18, 36);
        doc.text(`Total Expenditure: ${formatCurrency(financialSummary.totalActualExpenditure)} ETB`, 105, 36);
        doc.text(`Execution Rate: ${financialSummary.overallUtilization.toFixed(1)}%`, 190, 36);
        doc.text(`Remaining Balance: ${formatCurrency(financialSummary.variance)} ETB`, 18, 42);
        doc.text(`Total Projects: ${filteredProjects.length}`, 105, 42);
        doc.text(`Active Contracts: ${financialSummary.activeContractsCount}`, 190, 42);

        // Regional Table
        const regionalHeaders = [['Zone / Region', 'Projects', 'Planned Budget (ETB)', 'Actual Expenditure (ETB)', 'Variance (ETB)', 'Burn Rate (%)']];
        const regionalData = regionalFinancialData.map(r => [
            r.zone,
            r.projectCount.toString(),
            formatCurrency(r.plannedBudget),
            formatCurrency(r.actualExpenditure),
            formatCurrency(r.variance),
            `${r.utilization}%`
        ]);

        autoTable(doc, {
            startY: 50,
            head: regionalHeaders,
            body: regionalData,
            theme: 'striped',
            headStyles: { fillColor: [2, 132, 199] },
            styles: { fontSize: 8, cellPadding: 2.5 },
            columnStyles: {
                0: { cellWidth: 45 },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 50, halign: 'right' },
                3: { cellWidth: 50, halign: 'right' },
                4: { cellWidth: 50, halign: 'right' },
                5: { cellWidth: 30, halign: 'center' },
            }
        });

        // Project Detailed Table on subsequent page
        const lastY = (doc as any).lastAutoTable?.finalY || 100;
        if (lastY > 150) {
            doc.addPage();
        }

        const projectHeaders = [['Project Name & ID', 'Zone / Woreda', 'Type', 'Status', 'Planned Budget', 'Disbursed', 'Rate']];
        const projectData = filteredProjects.map(p => {
            const exp = getProjectExpenditure(p.id);
            const rate = p.estimatedBudget > 0 ? ((exp / p.estimatedBudget) * 100).toFixed(0) : '0';
            return [
                `${p.name}\n${p.id}`,
                `${p.zone} / ${p.woreda}`,
                p.projectType,
                p.status,
                formatCurrency(p.estimatedBudget),
                formatCurrency(exp),
                `${rate}%`
            ];
        });

        autoTable(doc, {
            startY: lastY > 150 ? 20 : lastY + 12,
            head: projectHeaders,
            body: projectData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] },
            styles: { fontSize: 7, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 65 },
                1: { cellWidth: 40 },
                2: { cellWidth: 35 },
                3: { cellWidth: 30 },
                4: { cellWidth: 35, halign: 'right' },
                5: { cellWidth: 35, halign: 'right' },
                6: { cellWidth: 20, halign: 'center' },
            }
        });

        doc.save(`OWEB_Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const canManageBackup = user?.role === Role.ADMIN;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Top Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-sm no-print overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('performance')} 
                    className={`flex items-center gap-2 px-5 py-3.5 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === 'performance' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Performance Dashboard
                    {criticalBudgetOverrunProjects.length > 0 ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-rose-600 text-white rounded-full animate-pulse shadow-xs flex items-center gap-1">
                            <span>⚠️</span> {criticalBudgetOverrunProjects.length} Overrun{criticalBudgetOverrunProjects.length > 1 ? 's' : ''}
                        </span>
                    ) : (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold bg-primary-100 text-primary-800 rounded-full">
                            New
                        </span>
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('analytics')} 
                    className={`flex items-center gap-2 px-5 py-3.5 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === 'analytics' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Expenditure & Budget Analytics
                    {criticalBudgetOverrunProjects.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('gantt')} 
                    className={`flex items-center gap-2 px-5 py-3.5 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === 'gantt' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Project Timelines & Gantt
                </button>
                <button 
                    onClick={() => setActiveTab('projects')} 
                    className={`flex items-center gap-2 px-5 py-3.5 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === 'projects' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Project Reports & Exports
                </button>
                <button 
                    onClick={() => setActiveTab('programReports')} 
                    className={`flex items-center gap-2 px-5 py-3.5 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === 'programReports' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Program &amp; Partner Dossiers
                </button>
                <button 
                    onClick={() => setActiveTab('budgetVariance')} 
                    className={`flex items-center gap-2 px-5 py-3.5 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === 'budgetVariance' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                    </svg>
                    Budget Variance (Estimate vs. Award)
                </button>
                <button 
                    onClick={() => setActiveTab('phaseCosts')} 
                    className={`flex items-center gap-2 px-5 py-3.5 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === 'phaseCosts' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Phase Cost Breakdown & Variance
                </button>
                <button 
                    onClick={() => setActiveTab('financial')} 
                    className={`flex items-center gap-2 px-5 py-3.5 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === 'financial' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Contract & Financial Breakdown
                </button>
                <button 
                    onClick={() => setActiveTab('audit')} 
                    className={`flex items-center gap-2 px-5 py-3.5 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === 'audit' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Activity Log
                </button>
                {canManageBackup && (
                    <button 
                        onClick={() => setActiveTab('backup')} 
                        className={`flex items-center gap-2 px-5 py-3.5 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === 'backup' 
                                ? 'border-primary-600 text-primary-600' 
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Backup & Restore
                    </button>
                )}
            </div>

            {/* Top Filter Bar (Applicable across Visualizations, Gantt & Reports) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 no-print space-y-3">
                {/* Header & Quick Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <span className="text-primary-600 font-bold">{ICONS.search}</span>
                        <h4 className="text-sm font-bold text-slate-800">Dynamic Reporting Scope & Filter Engine</h4>
                        {(projectFilters.region || projectFilters.zone || projectFilters.woreda || projectFilters.status || projectFilters.type || projectFilters.implementingBody || projectFilters.fundingSource || projectFilters.dateFrom || projectFilters.dateTo) && (
                            <span className="px-2.5 py-0.5 text-xs font-semibold bg-primary-100 text-primary-800 rounded-full border border-primary-200">
                                Scoped ({filteredProjects.length} of {projects.length} Projects)
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsDateFilterExpanded(!isDateFilterExpanded)}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                                isDateFilterExpanded || projectFilters.dateFrom || projectFilters.dateTo
                                    ? 'bg-primary-50 text-primary-700 border-primary-300'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {projectFilters.dateFrom || projectFilters.dateTo ? 'Date Range: Active' : 'Date Range & Timeline Filters'}
                            <svg className={`w-3.5 h-3.5 transition-transform ${isDateFilterExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <button 
                            onClick={handleResetFilters}
                            className="px-3 py-1 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                            title="Reset all filters to view full portfolio"
                        >
                            {ICONS.refreshCw}
                            Reset All
                        </button>
                    </div>
                </div>

                {/* Primary Geographic & Project Scope Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
                    {/* Program Filter */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-primary-700 block">Bureau Program</label>
                        <select 
                            name="program" 
                            value={projectFilters.program} 
                            onChange={handleFilterChange}
                            className="w-full text-xs bg-primary-50/50 border border-primary-300 font-medium text-slate-800 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none"
                        >
                            <option value="">All Programs (Bureau Level)</option>
                            {Array.from(new Set([...loadPrograms().map(p => p.name), ...PROGRAMS])).map(prog => (
                                <option key={prog} value={prog}>{prog}</option>
                            ))}
                        </select>
                    </div>

                    {/* Region / Corridor Filter */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 block">Region / Corridor</label>
                        <select 
                            name="region" 
                            value={projectFilters.region} 
                            onChange={handleFilterChange}
                            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none"
                        >
                            <option value="">All Regions & Corridors</option>
                            <optgroup label="Oromia Development Corridors">
                                {Object.entries(REGIONAL_CORRIDORS).map(([key, item]) => (
                                    <option key={key} value={key}>{item.label}</option>
                                ))}
                            </optgroup>
                            {distinctProjectRegions.length > 0 && (
                                <optgroup label="Project Administrative Regions">
                                    {distinctProjectRegions.map(reg => (
                                        <option key={reg} value={reg}>{reg}</option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                    </div>

                    {/* Zone Filter */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 block">Zone</label>
                        <select 
                            name="zone" 
                            value={projectFilters.zone} 
                            onChange={handleFilterChange}
                            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none"
                        >
                            <option value="">{projectFilters.region ? 'All Zones in Region' : 'All Zones'}</option>
                            {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                    </div>

                    {/* Woreda Filter */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 block">Woreda</label>
                        <select 
                            name="woreda" 
                            value={projectFilters.woreda} 
                            onChange={handleFilterChange} 
                            disabled={!projectFilters.zone}
                            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none disabled:opacity-50 disabled:bg-slate-100"
                        >
                            <option value="">{projectFilters.zone ? 'All Woredas in Zone' : 'Select Zone first'}</option>
                            {woredaOptions.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                    </div>

                    {/* Project Status */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 block">Status</label>
                        <select 
                            name="status" 
                            value={projectFilters.status} 
                            onChange={handleFilterChange}
                            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none"
                        >
                            <option value="">All Statuses</option>
                            {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Project Type */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 block">Project Type</label>
                        <select 
                            name="type" 
                            value={projectFilters.type} 
                            onChange={handleFilterChange}
                            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none"
                        >
                            <option value="">All Types</option>
                            {Object.keys(PROJECT_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* Implementing Body */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 block">Implementing Body</label>
                        <select 
                            name="implementingBody" 
                            value={projectFilters.implementingBody} 
                            onChange={handleFilterChange}
                            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none"
                        >
                            <option value="">All Bodies</option>
                            {IMPLEMENTING_BODIES.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    {/* Funding Source */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 block">Funding Source</label>
                        <select 
                            name="fundingSource" 
                            value={projectFilters.fundingSource} 
                            onChange={handleFilterChange}
                            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none"
                        >
                            <option value="">All Funding Sources</option>
                            {FUNDING_SOURCES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                </div>

                {/* Secondary Expandable Date Range & Timeline Filters */}
                {(isDateFilterExpanded || projectFilters.dateFrom || projectFilters.dateTo) && (
                    <div className="pt-3 border-t border-slate-100 bg-slate-50/80 -mx-4 -mb-4 p-4 rounded-b-xl space-y-3">
                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-500 mr-1">Time Presets:</span>
                            {DATE_PRESETS.map(preset => (
                                <button
                                    key={preset.key}
                                    type="button"
                                    onClick={() => handlePresetChange(preset.key)}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                                        projectFilters.datePreset === preset.key
                                            ? 'bg-primary-600 text-white font-semibold shadow-xs'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Date Inputs & Logic Type */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600 block">Date Matching Basis</label>
                                <select
                                    name="dateFilterField"
                                    value={projectFilters.dateFilterField}
                                    onChange={handleFilterChange}
                                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                >
                                    {DATE_FIELD_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600 block">From Date</label>
                                <input
                                    type="date"
                                    name="dateFrom"
                                    value={projectFilters.dateFrom}
                                    onChange={handleFilterChange}
                                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-slate-600 block">To Date</label>
                                    {(projectFilters.dateFrom || projectFilters.dateTo) && (
                                        <button
                                            type="button"
                                            onClick={handleClearDates}
                                            className="text-[11px] font-medium text-rose-600 hover:underline"
                                        >
                                            Clear Dates
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="date"
                                    name="dateTo"
                                    value={projectFilters.dateTo}
                                    onChange={handleFilterChange}
                                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Filter Badges Strip */}
                {(projectFilters.region || projectFilters.zone || projectFilters.woreda || projectFilters.status || projectFilters.type || projectFilters.implementingBody || projectFilters.fundingSource || projectFilters.dateFrom || projectFilters.dateTo) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs">
                        <span className="font-semibold text-slate-500 mr-1">Active Filter Scope:</span>
                        
                        {projectFilters.region && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
                                Region: {REGIONAL_CORRIDORS[projectFilters.region]?.label || projectFilters.region}
                                <button onClick={() => removeSingleFilter('region')} className="hover:text-rose-600 font-bold ml-1">×</button>
                            </span>
                        )}

                        {projectFilters.zone && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                                Zone: {projectFilters.zone}
                                <button onClick={() => removeSingleFilter('zone')} className="hover:text-rose-600 font-bold ml-1">×</button>
                            </span>
                        )}

                        {projectFilters.woreda && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
                                Woreda: {projectFilters.woreda}
                                <button onClick={() => removeSingleFilter('woreda')} className="hover:text-rose-600 font-bold ml-1">×</button>
                            </span>
                        )}

                        {(projectFilters.dateFrom || projectFilters.dateTo) && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {projectFilters.dateFrom || 'Start'} → {projectFilters.dateTo || 'Present'} ({projectFilters.dateFilterField})
                                <button onClick={() => removeSingleFilter('dateFrom')} className="hover:text-rose-600 font-bold ml-1">×</button>
                            </span>
                        )}

                        {projectFilters.status && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Status: {projectFilters.status}
                                <button onClick={() => removeSingleFilter('status')} className="hover:text-rose-600 font-bold ml-1">×</button>
                            </span>
                        )}

                        {projectFilters.type && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                                Type: {projectFilters.type}
                                <button onClick={() => removeSingleFilter('type')} className="hover:text-rose-600 font-bold ml-1">×</button>
                            </span>
                        )}

                        {projectFilters.implementingBody && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                                Body: {projectFilters.implementingBody}
                                <button onClick={() => removeSingleFilter('implementingBody')} className="hover:text-rose-600 font-bold ml-1">×</button>
                            </span>
                        )}

                        {projectFilters.fundingSource && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                                Fund: {projectFilters.fundingSource}
                                <button onClick={() => removeSingleFilter('fundingSource')} className="hover:text-rose-600 font-bold ml-1">×</button>
                            </span>
                        )}

                        <span className="text-slate-400 font-medium ml-auto">
                            Showing {filteredProjects.length} of {projects.length} ({((filteredProjects.length / Math.max(1, projects.length)) * 100).toFixed(0)}% portfolio)
                        </span>
                    </div>
                )}
            </div>

            {/* TAB 0: PERFORMANCE DASHBOARD (Planned vs Actual Completion & Budget Utilization) */}
            {activeTab === 'performance' && (
                <PerformanceDashboard 
                    projects={filteredProjects}
                    contracts={contracts}
                    procurements={procurements}
                />
            )}

            {/* TAB: PROGRAM & PARTNER DOSSIERS */}
            {activeTab === 'programReports' && (
                <ProgramPortfolioReportsSection
                    projects={filteredProjects}
                    contracts={contracts}
                    inspections={inspections}
                    weeklyPlans={weeklyPlans}
                    user={user}
                    onNavigate={onNavigate}
                />
            )}

            {/* TAB 1: VISUALIZATIONS & ANALYTICS (Recharts) */}
            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    {/* Critical Budget Overrun Warning Banner */}
                    {criticalBudgetOverrunProjects.length > 0 && (
                        <div className="bg-rose-50 border-2 border-rose-500 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-rose-600 text-white rounded-lg animate-pulse flex-shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-extrabold uppercase rounded">
                                            Warning Indicator
                                        </span>
                                        <h4 className="text-xs font-bold text-rose-950">
                                            {criticalBudgetOverrunProjects.length} Project{criticalBudgetOverrunProjects.length > 1 ? 's' : ''} Exceeding Approved Budget by &gt; 10%
                                        </h4>
                                    </div>
                                    <p className="text-xs text-rose-800 mt-1">
                                        Actual cumulative spending exceeds approved baseline budget by greater than 10%. Statutory audit required for contract variations.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveTab('performance')}
                                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer flex-shrink-0"
                            >
                                Open Performance Audits →
                            </button>
                        </div>
                    )}

                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Planned Budget</span>
                                <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                                    {ICONS.dollarSign}
                                </div>
                            </div>
                            <div className="mt-3">
                                <p className="text-2xl font-bold font-mono text-slate-900">{formatCurrency(financialSummary.totalPlannedBudget)} <span className="text-xs font-normal text-slate-500">ETB</span></p>
                                <p className="text-xs text-slate-500 mt-1">Across {filteredProjects.length} filtered projects</p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Actual Expenditure</span>
                                <div className="p-2 bg-success-50 text-success-600 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-3">
                                <p className="text-2xl font-bold font-mono text-emerald-600">{formatCurrency(financialSummary.totalActualExpenditure)} <span className="text-xs font-normal text-slate-500">ETB</span></p>
                                <p className="text-xs text-slate-500 mt-1">Disbursed via milestone payments</p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Remaining Variance</span>
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                    {ICONS.clock}
                                </div>
                            </div>
                            <div className="mt-3">
                                <p className="text-2xl font-bold font-mono text-slate-900">{formatCurrency(financialSummary.variance)} <span className="text-xs font-normal text-slate-500">ETB</span></p>
                                <p className="text-xs text-slate-500 mt-1">Uncommitted or pending disbursement</p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Execution / Burn Rate</span>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                    financialSummary.overallUtilization >= 80 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : financialSummary.overallUtilization >= 40 
                                            ? 'bg-amber-100 text-amber-700' 
                                            : 'bg-slate-100 text-slate-700'
                                }`}>
                                    {financialSummary.overallUtilization.toFixed(1)}%
                                </span>
                            </div>
                            <div className="mt-3">
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${Math.min(100, Math.max(0, financialSummary.overallUtilization))}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2 flex justify-between">
                                    <span>Contracted: {formatCompactCurrency(financialSummary.totalContractValue)}</span>
                                    <span>Variations: +{formatCompactCurrency(financialSummary.totalVariationCost)}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Field QA/QC, Water Lab Testing & Weekly Work Plan Execution Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-white to-sky-50/60 p-5 rounded-xl border border-sky-200/80 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="p-2 bg-sky-100 text-sky-700 rounded-lg text-sm">🛡️</span>
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-sky-950">Site QA/QC &amp; Water Quality Verification</h4>
                                        <p className="text-[11px] text-slate-500 font-medium">Laboratory parameter compliance &amp; defect tracking</p>
                                    </div>
                                </div>
                                {onNavigate && (
                                    <button
                                        type="button"
                                        onClick={() => onNavigate('inspection')}
                                        className="text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-100/70 hover:bg-sky-200/70 px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                        <span>View QA Logbook</span>
                                        <span>→</span>
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-sky-100 text-center">
                                <div className="bg-white/80 p-2.5 rounded-lg border border-sky-100">
                                    <p className="text-lg font-bold text-slate-900 font-mono">{inspections.length}</p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Inspections</p>
                                </div>
                                <div className="bg-white/80 p-2.5 rounded-lg border border-sky-100">
                                    <p className="text-lg font-bold text-emerald-600 font-mono">
                                        {(() => {
                                            const tests = inspections.filter(i => i.waterQualityTest).map(i => i.waterQualityTest);
                                            const compliant = tests.filter(t => t?.complianceStatus === 'Compliant').length;
                                            return tests.length > 0 ? `${((compliant / tests.length) * 100).toFixed(0)}%` : '100%';
                                        })()}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Lab Compliance</p>
                                </div>
                                <div className="bg-white/80 p-2.5 rounded-lg border border-sky-100">
                                    <p className="text-lg font-bold text-amber-600 font-mono">
                                        {inspections.reduce((sum, i) => sum + ((i.defects || []).filter(d => d.status === 'Open').length), 0)}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Open Defects</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-white to-indigo-50/60 p-5 rounded-xl border border-indigo-200/80 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="p-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm">📋</span>
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">Weekly Work Plans &amp; S-Curve Velocity</h4>
                                        <p className="text-[11px] text-slate-500 font-medium">Activity task scheduling &amp; cumulative progress</p>
                                    </div>
                                </div>
                                {onNavigate && (
                                    <button
                                        type="button"
                                        onClick={() => onNavigate('inspection')}
                                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-100/70 hover:bg-indigo-200/70 px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                        <span>View S-Curve</span>
                                        <span>→</span>
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-indigo-100 text-center">
                                <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                                    <p className="text-lg font-bold text-slate-900 font-mono">{weeklyPlans.length}</p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Active Plans</p>
                                </div>
                                <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                                    <p className="text-lg font-bold text-indigo-600 font-mono">
                                        {weeklyPlans.reduce((sum, p) => sum + (p.plannedActivities?.length || 0), 0)}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Tracked Tasks</p>
                                </div>
                                <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                                    <p className="text-lg font-bold text-emerald-600 font-mono">
                                        {weeklyPlans.filter(p => p.status === 'Approved').length}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Approved</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MAIN CHART 1: Regional Planned Budget vs. Actual Expenditure (Bar Chart) */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Regional Project Expenditure vs. Planned Budget</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Comparing financial allocations and actual disbursements across Oromia zones</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
                                    <button 
                                        onClick={() => setChartDisplayMode('grouped')}
                                        className={`px-3 py-1 font-medium rounded-md transition-colors ${
                                            chartDisplayMode === 'grouped' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Side-by-Side
                                    </button>
                                    <button 
                                        onClick={() => setChartDisplayMode('stacked')}
                                        className={`px-3 py-1 font-medium rounded-md transition-colors ${
                                            chartDisplayMode === 'stacked' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Stacked
                                    </button>
                                    <button 
                                        onClick={() => setChartDisplayMode('utilization')}
                                        className={`px-3 py-1 font-medium rounded-md transition-colors ${
                                            chartDisplayMode === 'utilization' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Execution %
                                    </button>
                                </div>
                                <select 
                                    value={zoneSortBy} 
                                    onChange={(e) => setZoneSortBy(e.target.value as any)}
                                    className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-primary-500"
                                >
                                    <option value="budget">Sort by Highest Budget</option>
                                    <option value="expenditure">Sort by Highest Expenditure</option>
                                    <option value="utilization">Sort by Execution %</option>
                                    <option value="name">Sort A-Z</option>
                                </select>
                            </div>
                        </div>

                        {regionalFinancialData.length > 0 ? (
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartDisplayMode === 'utilization' ? (
                                        <BarChart data={regionalFinancialData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="zone" 
                                                angle={-30} 
                                                textAnchor="end" 
                                                tick={{ fill: '#64748b', fontSize: 11 }}
                                                interval={0}
                                                height={50}
                                            />
                                            <YAxis 
                                                tick={{ fill: '#64748b', fontSize: 11 }} 
                                                domain={[0, 100]}
                                                unit="%"
                                            />
                                            <Tooltip content={<CustomRechartsTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                            <Bar 
                                                dataKey="utilization" 
                                                name="Budget Execution Rate (%)" 
                                                fill="#10b981" 
                                                radius={[6, 6, 0, 0]} 
                                                unit="%"
                                            >
                                                {regionalFinancialData.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-rate-${index}`} 
                                                        fill={entry.utilization >= 75 ? '#10b981' : entry.utilization >= 35 ? '#f59e0b' : '#0284c7'} 
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    ) : chartDisplayMode === 'stacked' ? (
                                        <BarChart data={regionalFinancialData} margin={{ top: 10, right: 20, left: 20, bottom: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="zone" 
                                                angle={-30} 
                                                textAnchor="end" 
                                                tick={{ fill: '#64748b', fontSize: 11 }}
                                                interval={0}
                                                height={50}
                                            />
                                            <YAxis 
                                                tick={{ fill: '#64748b', fontSize: 11 }} 
                                                tickFormatter={(v) => formatCompactCurrency(v)}
                                            />
                                            <Tooltip content={<CustomRechartsTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                            <Bar dataKey="actualExpenditure" name="Actual Expenditure" stackId="a" fill="#10b981" />
                                            <Bar dataKey="variance" name="Remaining Budget" stackId="a" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    ) : (
                                        <BarChart data={regionalFinancialData} margin={{ top: 10, right: 20, left: 20, bottom: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="zone" 
                                                angle={-30} 
                                                textAnchor="end" 
                                                tick={{ fill: '#64748b', fontSize: 11 }}
                                                interval={0}
                                                height={50}
                                            />
                                            <YAxis 
                                                tick={{ fill: '#64748b', fontSize: 11 }} 
                                                tickFormatter={(v) => formatCompactCurrency(v)}
                                            />
                                            <Tooltip content={<CustomRechartsTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                            <Bar dataKey="plannedBudget" name="Planned Budget (ETB)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="actualExpenditure" name="Actual Expenditure (ETB)" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                                <p className="text-sm font-medium">No regional data matches the current filters.</p>
                            </div>
                        )}
                    </div>

                    {/* TWO-COLUMN CHARTS: Budget Distribution Pie & Expenditure Distribution Pie */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie 1: Planned Budget by Region/Zone */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">Planned Budget Share by Region</h3>
                                    <p className="text-xs text-slate-500">Distribution of allocated capital per zone</p>
                                </div>
                                <span className="text-xs font-bold font-mono px-2 py-1 bg-primary-50 text-primary-700 rounded-md">
                                    {formatCompactCurrency(financialSummary.totalPlannedBudget)} Total
                                </span>
                            </div>
                            
                            {regionalBudgetPieData.length > 0 ? (
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={regionalBudgetPieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={95}
                                                paddingAngle={2}
                                                dataKey="value"
                                                nameKey="name"
                                                onMouseEnter={(_, index) => setActivePieIndex(index)}
                                                label={({ percent }: { percent: number }) => {
                                                    if (percent < 0.06) return null;
                                                    return `${(percent * 100).toFixed(0)}%`;
                                                }}
                                                labelLine={false}
                                            >
                                                {regionalBudgetPieData.map((entry, index) => (
                                                    <Cell 
                                                        key={`pie-budget-${index}`} 
                                                        fill={entry.color} 
                                                        stroke="#fff" 
                                                        strokeWidth={activePieIndex === index ? 3 : 1}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomRechartsTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-72 flex items-center justify-center text-slate-400 text-sm">No data to display</div>
                            )}
                        </div>

                        {/* Pie 2: Actual Expenditure Distribution by Region/Zone */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">Actual Expenditure Share by Region</h3>
                                    <p className="text-xs text-slate-500">Distribution of executed milestone disbursements</p>
                                </div>
                                <span className="text-xs font-bold font-mono px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md">
                                    {formatCompactCurrency(financialSummary.totalActualExpenditure)} Disbursed
                                </span>
                            </div>

                            {regionalExpenditurePieData.length > 0 ? (
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={regionalExpenditurePieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={95}
                                                paddingAngle={2}
                                                dataKey="value"
                                                nameKey="name"
                                                label={({ percent }: { percent: number }) => {
                                                    if (percent < 0.06) return null;
                                                    return `${(percent * 100).toFixed(0)}%`;
                                                }}
                                                labelLine={false}
                                            >
                                                {regionalExpenditurePieData.map((entry, index) => (
                                                    <Cell key={`pie-exp-${index}`} fill={entry.color} stroke="#fff" />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomRechartsTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-sm">
                                    <p>No milestone disbursements recorded for filtered set.</p>
                                    <p className="text-xs text-slate-400 mt-1">Payments occur upon deliverable verification.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TWO-COLUMN CHARTS: Project Type & Funding Source Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Chart: Budget vs Expenditure by Project Type */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="mb-4">
                                <h3 className="text-base font-bold text-slate-800">Expenditure vs. Budget by Project Type</h3>
                                <p className="text-xs text-slate-500">Water Supply, Sanitation, and Water Resources performance</p>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={projectTypeFinancialData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="type" tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => formatCompactCurrency(v)} />
                                        <Tooltip content={<CustomRechartsTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Bar dataKey="plannedBudget" name="Planned Budget" fill="#0284c7" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="actualExpenditure" name="Actual Expenditure" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Chart: Funding Source Performance */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="mb-4">
                                <h3 className="text-base font-bold text-slate-800">Funding Source Allocation & Utilization</h3>
                                <p className="text-xs text-slate-500">OWEB, UNICEF, World Bank, and Government funding streams</p>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={fundingSourceFinancialData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="source" tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => formatCompactCurrency(v)} />
                                        <Tooltip content={<CustomRechartsTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Bar dataKey="plannedBudget" name="Allocated Budget" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="actualExpenditure" name="Disbursed" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Regional Financial Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Regional Financial Performance Matrix</h3>
                                <p className="text-xs text-slate-500">Zone-by-zone breakdown of project commitments, disbursements, and execution rates</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={exportToExcel} 
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                                    </svg>
                                    Export Excel
                                </button>
                                <button 
                                    onClick={exportToPDF} 
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5h3v1.5h-3v-1.5zm0-3h3v1.5h-3v-1.5zm6 6h-6v-1.5h6v1.5zm0-3h-2v-1.5h2v1.5zm0-3h-2V7h2v1.5z"/>
                                    </svg>
                                    Export PDF
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-5 py-3.5">Zone / Region</th>
                                        <th className="px-5 py-3.5 text-center">Projects</th>
                                        <th className="px-5 py-3.5 text-right">Planned Budget (ETB)</th>
                                        <th className="px-5 py-3.5 text-right">Actual Disbursed (ETB)</th>
                                        <th className="px-5 py-3.5 text-right">Variance (ETB)</th>
                                        <th className="px-5 py-3.5 text-center">Execution Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {regionalFinancialData.map((row, idx) => (
                                        <tr key={row.zone} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-100/70 transition-colors`}>
                                            <td className="px-5 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                                                {row.zone}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full">
                                                    {row.projectCount}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono font-medium text-slate-800">
                                                {formatCurrency(row.plannedBudget)}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono font-semibold text-emerald-600">
                                                {formatCurrency(row.actualExpenditure)}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono text-slate-600">
                                                {formatCurrency(row.variance)}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="inline-flex items-center gap-2">
                                                    <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${
                                                                row.utilization >= 75 ? 'bg-emerald-500' : row.utilization >= 35 ? 'bg-amber-500' : 'bg-primary-500'
                                                            }`} 
                                                            style={{ width: `${Math.min(100, Math.max(0, row.utilization))}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-mono text-xs font-bold text-slate-700 w-10 text-right">
                                                        {row.utilization}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {regionalFinancialData.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-10 text-slate-500">
                                                No regional data available for the active filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-100 font-semibold text-slate-900 border-t-2 border-slate-300 text-xs">
                                    <tr>
                                        <td className="px-5 py-3 uppercase">Total Oromia Scope</td>
                                        <td className="px-5 py-3 text-center">{filteredProjects.length}</td>
                                        <td className="px-5 py-3 text-right font-mono">{formatCurrency(financialSummary.totalPlannedBudget)}</td>
                                        <td className="px-5 py-3 text-right font-mono text-emerald-700">{formatCurrency(financialSummary.totalActualExpenditure)}</td>
                                        <td className="px-5 py-3 text-right font-mono">{formatCurrency(financialSummary.variance)}</td>
                                        <td className="px-5 py-3 text-center font-mono">{financialSummary.overallUtilization.toFixed(1)}%</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: BUDGET VARIANCE (ESTIMATED BUDGET VS PROCUREMENT AWARD PRICE) */}
            {activeTab === 'budgetVariance' && (
                <div className="space-y-6">
                    <BudgetVarianceTable 
                        projects={filteredProjects} 
                        procurements={procurements} 
                        contracts={contracts} 
                    />
                </div>
            )}

            {/* TAB: PHASE COST & VARIANCE BREAKDOWN */}
            {activeTab === 'phaseCosts' && (
                <div className="space-y-6">
                    <PhaseCostBreakdownTable 
                        projects={filteredProjects} 
                        contracts={contracts} 
                        procurements={procurements} 
                    />
                </div>
            )}

            {/* TAB 2: PROJECT TIMELINES & GANTT CHART VISUALIZATION */}
            {activeTab === 'gantt' && (
                <div className="space-y-6">
                    {(projectFilters.region || projectFilters.zone || projectFilters.woreda || projectFilters.dateFrom || projectFilters.dateTo) && (
                        <div className="bg-primary-50 border border-primary-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-primary-900">
                            <div className="flex items-center gap-2">
                                <span className="p-1 bg-primary-600 text-white rounded-md">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                </span>
                                <div>
                                    <span className="font-bold">Dynamic Gantt Schedule View: </span>
                                    <span>
                                        Showing {filteredProjects.length} projects matching 
                                        {projectFilters.region ? ` Region [${REGIONAL_CORRIDORS[projectFilters.region]?.label || projectFilters.region}]` : ''}
                                        {projectFilters.zone ? ` Zone [${projectFilters.zone}]` : ''}
                                        {projectFilters.woreda ? ` Woreda [${projectFilters.woreda}]` : ''}
                                        {(projectFilters.dateFrom || projectFilters.dateTo) ? ` • Date Range [${projectFilters.dateFrom || 'Start'} to ${projectFilters.dateTo || 'Present'}]` : ''}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handleResetFilters}
                                className="px-2.5 py-1 bg-white hover:bg-primary-100 border border-primary-300 font-semibold rounded-md text-primary-700 transition-colors"
                            >
                                View All Projects
                            </button>
                        </div>
                    )}
                    <GanttTimelineChart 
                        projects={filteredProjects} 
                        contracts={contracts} 
                        procurements={procurements} 
                    />
                </div>
            )}

            {/* TAB 3: TABULAR PROJECT REPORTS & EXPORTS */}
            {activeTab === 'projects' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Project Master Report Generator</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Generate, filter, and export comprehensive project registers to Excel or official PDF formats.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 no-print">
                                <button 
                                    onClick={exportToExcel} 
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                                    </svg>
                                    Export Excel (.xlsx)
                                </button>
                                <button 
                                    onClick={exportToPDF} 
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5h3v1.5h-3v-1.5zm0-3h3v1.5h-3v-1.5zm6 6h-6v-1.5h6v1.5zm0-3h-2v-1.5h2v1.5zm0-3h-2V7h2v1.5z"/>
                                    </svg>
                                    Export PDF
                                </button>
                                <button 
                                    onClick={() => window.print()} 
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Print Report
                                </button>
                            </div>
                        </div>

                        {/* Summary Badges */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                                <span className="text-xs text-slate-500 font-medium">Projects in Scope</span>
                                <p className="text-xl font-bold text-slate-900 mt-1">{filteredProjects.length} <span className="text-xs text-slate-400 font-normal">of {projects.length}</span></p>
                            </div>
                            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                                <span className="text-xs text-slate-500 font-medium">Filtered Budget</span>
                                <p className="text-xl font-bold font-mono text-slate-900 mt-1">{formatCompactCurrency(financialSummary.totalPlannedBudget)}</p>
                            </div>
                            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                                <span className="text-xs text-slate-500 font-medium">Filtered Expenditure</span>
                                <p className="text-xl font-bold font-mono text-emerald-600 mt-1">{formatCompactCurrency(financialSummary.totalActualExpenditure)}</p>
                            </div>
                            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                                <span className="text-xs text-slate-500 font-medium">Disbursement Rate</span>
                                <p className="text-xl font-bold font-mono text-slate-900 mt-1">{financialSummary.overallUtilization.toFixed(1)}%</p>
                            </div>
                        </div>

                        {/* Project Table */}
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-5 py-3.5">Project Name & ID</th>
                                        <th className="px-5 py-3.5">Zone / Woreda</th>
                                        <th className="px-5 py-3.5">Implementing Body</th>
                                        <th className="px-5 py-3.5">Type</th>
                                        <th className="px-5 py-3.5">Status</th>
                                        <th className="px-5 py-3.5 text-right">Planned Budget (ETB)</th>
                                        <th className="px-5 py-3.5 text-right">Actual Paid (ETB)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredProjects.map((p, index) => {
                                        const exp = getProjectExpenditure(p.id);
                                        return (
                                            <tr key={p.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-100/70 transition-colors`}>
                                                <td className="px-5 py-4">
                                                    <span className="font-semibold text-slate-900 block">{p.name}</span>
                                                    <span className="text-xs font-mono text-slate-400">{p.id}</span>
                                                </td>
                                                <td className="px-5 py-4 text-slate-600">{p.zone} / {p.woreda}</td>
                                                <td className="px-5 py-4 text-slate-600">{p.implementingBody}</td>
                                                <td className="px-5 py-4 text-slate-600">{p.projectType}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                                        p.status === ProjectStatus.APPROVED || p.status === ProjectStatus.COMPLETED
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : p.status === ProjectStatus.SUBMITTED
                                                                ? 'bg-primary-100 text-primary-700'
                                                                : p.status === ProjectStatus.UNDER_REVIEW
                                                                    ? 'bg-amber-100 text-amber-700'
                                                                    : p.status === ProjectStatus.REJECTED || p.status === ProjectStatus.CANCELLED
                                                                        ? 'bg-rose-100 text-rose-700'
                                                                        : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right font-mono font-medium text-slate-900">{formatCurrency(p.estimatedBudget)}</td>
                                                <td className="px-5 py-4 text-right font-mono font-semibold text-emerald-600">{formatCurrency(exp)}</td>
                                            </tr>
                                        );
                                    })}
                                    {filteredProjects.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-slate-400">
                                                No projects found matching the current filter criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: CONTRACT & EXECUTIVE FINANCIAL SUMMARY */}
            {activeTab === 'financial' && (
                <div className="space-y-6">
                    <Section title="Executive Financial & Contract Commitments Summary">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="p-5 bg-primary-50 rounded-xl border border-primary-100">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-primary-700">Total Contract Value</h4>
                                <p className="text-2xl font-bold font-mono text-slate-900 mt-2">{formatCurrency(financialSummary.totalContractValue)} ETB</p>
                                <p className="text-xs text-primary-600 mt-1">Formally signed procurement contracts</p>
                            </div>
                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                                <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500">Variation Impact</h4>
                                <p className={`text-2xl font-bold font-mono mt-2 ${financialSummary.totalVariationCost > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                                    +{formatCurrency(financialSummary.totalVariationCost)} ETB
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Approved contract adjustments</p>
                            </div>
                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                                <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500">Total Planned Payments</h4>
                                <p className="text-2xl font-bold font-mono mt-2 text-slate-900">{formatCurrency(financialSummary.totalPlannedPayments)} ETB</p>
                                <p className="text-xs text-slate-500 mt-1">Deliverable-linked payment milestones</p>
                            </div>
                            <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-700">Total Actual Payments Made</h4>
                                <p className="text-2xl font-bold font-mono mt-2 text-emerald-800">{formatCurrency(financialSummary.totalActualExpenditure)} ETB</p>
                                <p className="text-xs text-emerald-600 mt-1">Disbursed upon completion of deliverables</p>
                            </div>
                        </div>

                        {/* Contract Details Listing */}
                        <div className="border-t border-slate-200 pt-6">
                            <h4 className="text-base font-bold text-slate-800 mb-4">Active Contracts & Execution Register</h4>
                            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-5 py-3.5">Contract ID</th>
                                            <th className="px-5 py-3.5">Linked Project</th>
                                            <th className="px-5 py-3.5">Contract Manager</th>
                                            <th className="px-5 py-3.5">Signing Date</th>
                                            <th className="px-5 py-3.5 text-right">Variations (ETB)</th>
                                            <th className="px-5 py-3.5 text-right">Paid to Date (ETB)</th>
                                            <th className="px-5 py-3.5 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {contracts.map((c, idx) => {
                                            const proj = (projects || []).find(p => p && p.id === c.projectId);
                                            const paid = (c.payments || []).reduce((sum, p) => sum + (p.actualAmount || 0), 0);
                                            const variations = (c.variations || []).reduce((sum, v) => sum + (v.status === 'Approved' ? v.costImpact : 0), 0);
                                            return (
                                                <tr key={c.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-100/70 transition-colors`}>
                                                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">{c.id}</td>
                                                    <td className="px-5 py-3.5">
                                                        <span className="font-medium text-slate-800">{proj?.name || c.projectId}</span>
                                                        <span className="text-xs text-slate-400 block">{proj?.zone}</span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-slate-600">{c.contractManager}</td>
                                                    <td className="px-5 py-3.5 text-slate-600">{c.signingDate || 'N/A'}</td>
                                                    <td className="px-5 py-3.5 text-right font-mono text-slate-700">
                                                        {variations > 0 ? `+${formatCurrency(variations)}` : '0'}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600">
                                                        {formatCurrency(paid)}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                                            c.completionDate ? 'bg-emerald-100 text-emerald-700' : 'bg-primary-100 text-primary-700'
                                                        }`}>
                                                            {c.completionDate ? 'Completed' : 'Active'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {contracts.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="text-center py-10 text-slate-400">
                                                    No contracts currently in the system.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Section>
                </div>
            )}

            {/* TAB 4: AUDIT TRAIL */}
            {activeTab === 'audit' && (
                <Section title="System Activity Log (Audit Trail)">
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-5 py-3.5">Timestamp</th>
                                    <th className="px-5 py-3.5">User</th>
                                    <th className="px-5 py-3.5">Action</th>
                                    <th className="px-5 py-3.5">Target</th>
                                    <th className="px-5 py-3.5">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activityLogs.map((log, index) => (
                                    <tr key={log.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-100/70 transition-colors`}>
                                        <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-800">{log.user}</td>
                                        <td className="px-5 py-3.5 text-slate-700">{log.action}</td>
                                        <td className="px-5 py-3.5 text-slate-600">{log.targetType} <span className="text-slate-400 font-mono text-xs">{log.targetId}</span></td>
                                        <td className="px-5 py-3.5 text-slate-600">{log.details}</td>
                                    </tr>
                                ))}
                                {activityLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-slate-400">
                                            No activity logs recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Section>
            )}

            {/* TAB 5: BACKUP & RESTORE */}
            {activeTab === 'backup' && canManageBackup && (
                <Section title="System Backup & Disaster Recovery">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-800 text-base">Create System Snapshot Backup</h4>
                            <p className="text-slate-600 text-sm mt-2 mb-6">
                                Generates a complete JSON backup containing all projects, procurements, contracts, payment schedules, documents, and audit logs.
                            </p>
                            <button 
                                onClick={handleBackupClick} 
                                disabled={isBackingUp} 
                                className="px-5 py-3 w-full bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                            >
                                {isBackingUp ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Exporting Backup...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Create Full System Backup (.json)
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-lg mb-4">
                                <h4 className="font-bold text-rose-700 text-sm">Destructive Action Warning</h4>
                                <p className="text-xs text-rose-800 mt-1">
                                    Restoring a backup overwrites existing data with the selected snapshot. Ensure you create a current backup beforehand.
                                </p>
                            </div>
                            <FileInput 
                                key={restoreFileKey} 
                                label="Select Snapshot File (.json)" 
                                id="restore-file-input" 
                                name="restore-file-input" 
                                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)} 
                                fileName={restoreFile?.name} 
                                accept=".json" 
                            />
                            <button 
                                onClick={handleRestoreClick} 
                                disabled={isRestoring || !restoreFile} 
                                className="mt-4 px-5 py-3 w-full bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                            >
                                {isRestoring ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Restoring Database...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Restore System from File
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </Section>
            )}
        </div>
    );
};

export default ReportingModule;
