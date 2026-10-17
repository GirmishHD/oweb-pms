import React, { useState, useMemo } from 'react';
import { Project, Contract, Procurement, ProjectStatus } from '../types';
import { ZONES, PROJECT_TYPES } from '../constants';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ProgressGaugeProps {
    completionPct: number; // 0 to 100
    timelinePct: number;   // 0 to 100
    title?: string;
    subtitle?: string;
    size?: 'sm' | 'md' | 'lg' | 'hero';
    showDetails?: boolean;
    showNeedle?: boolean;
    plannedDays?: number;
    elapsedDays?: number;
    varianceDays?: number;
    startDateStr?: string;
    targetDateStr?: string;
    healthCategory?: 'optimal' | 'on_track' | 'minor_delay' | 'critical_delay';
    compact?: boolean;
    className?: string;
}

export type ProgressHealthTier = 'ahead' | 'on_track' | 'minor_lag' | 'critical_lag';

export interface ProjectGaugeTelemetry {
    project: Project;
    physicalCompletionPct: number;
    timelineElapsedPct: number;
    progressDelta: number; // physical - timeline (+ is ahead, - is delayed)
    spi: number; // Schedule Performance Index: physical / timeline
    healthTier: ProgressHealthTier;
    plannedDays: number;
    elapsedDays: number;
    remainingDays: number;
    varianceDays: number;
    startDateStr: string;
    targetDateStr: string;
    estimatedCompletionDateStr: string;
    burnRatePct: number; // financial utilization
    financialVarianceEtb: number;
    approvedBudget: number;
    actualExpenditure: number;
    contractCount: number;
    status: ProjectStatus;
}

// Format numbers
const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);
};

const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Visual Progress Gauge Component
 * Renders an SVG dual-arc / tachometer radial gauge comparing physical completion against scheduled timeline elapsed.
 */
export const ProgressGauge: React.FC<ProgressGaugeProps> = ({
    completionPct,
    timelinePct,
    title,
    subtitle,
    size = 'md',
    showDetails = true,
    showNeedle = true,
    plannedDays,
    elapsedDays,
    varianceDays,
    startDateStr,
    targetDateStr,
    compact = false,
    className = ''
}) => {
    // Clamp percentages between 0 and 100
    const clampedCompletion = Math.min(100, Math.max(0, Math.round(completionPct || 0)));
    const clampedTimeline = Math.min(100, Math.max(0, Math.round(timelinePct || 0)));
    const progressDelta = clampedCompletion - clampedTimeline;
    const spi = clampedTimeline > 0 ? Number((clampedCompletion / clampedTimeline).toFixed(2)) : 1.0;

    // Determine Health Tier
    let healthColor = '#10B981'; // emerald
    let healthBg = 'bg-emerald-50';
    let healthBorder = 'border-emerald-200';
    let healthText = 'text-emerald-700';
    let healthLabel = 'Ahead of Schedule';
    let trackGlow = 'rgba(16, 185, 129, 0.4)';

    if (progressDelta >= 3 || (clampedCompletion === 100)) {
        healthColor = '#10B981';
        healthBg = 'bg-emerald-50';
        healthBorder = 'border-emerald-200';
        healthText = 'text-emerald-700';
        healthLabel = clampedCompletion === 100 ? 'Project Completed' : `Ahead by +${progressDelta}%`;
        trackGlow = 'rgba(16, 185, 129, 0.4)';
    } else if (progressDelta >= -5) {
        healthColor = '#0284C7'; // sky-600
        healthBg = 'bg-sky-50';
        healthBorder = 'border-sky-200';
        healthText = 'text-sky-700';
        healthLabel = 'On Track (Synced)';
        trackGlow = 'rgba(2, 132, 199, 0.4)';
    } else if (progressDelta >= -15) {
        healthColor = '#F59E0B'; // amber-500
        healthBg = 'bg-amber-50';
        healthBorder = 'border-amber-200';
        healthText = 'text-amber-700';
        healthLabel = `Minor Slippage (${Math.abs(progressDelta)}% Lag)`;
        trackGlow = 'rgba(245, 158, 11, 0.4)';
    } else {
        healthColor = '#E11D48'; // rose-600
        healthBg = 'bg-rose-50';
        healthBorder = 'border-rose-300';
        healthText = 'text-rose-700';
        healthLabel = `Critical Lag (${Math.abs(progressDelta)}% Overdue)`;
        trackGlow = 'rgba(225, 29, 72, 0.4)';
    }

    // Dimension sizing configurations
    const dimMap = {
        sm: { width: 140, height: 95, radius: 48, strokeWidth: 8, innerStroke: 5, fontSize: 'text-lg', labelSize: 'text-[9px]' },
        md: { width: 220, height: 140, radius: 78, strokeWidth: 12, innerStroke: 8, fontSize: 'text-2xl', labelSize: 'text-xs' },
        lg: { width: 280, height: 175, radius: 105, strokeWidth: 16, innerStroke: 10, fontSize: 'text-3xl', labelSize: 'text-xs' },
        hero: { width: 340, height: 215, radius: 130, strokeWidth: 18, innerStroke: 12, fontSize: 'text-4xl', labelSize: 'text-sm' }
    };

    const dims = dimMap[size] || dimMap.md;
    const cx = dims.width / 2;
    const cy = dims.height - 15;
    const rOuter = dims.radius;
    const rInner = dims.radius - dims.strokeWidth - 4;

    // Semi-circle arc definitions (180 degrees from -180° to 0° or Math.PI to 0)
    // Outer Arc (Physical Completion)
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;
    const outerCircumference = Math.PI * rOuter;
    const outerOffset = outerCircumference * (1 - clampedCompletion / 100);

    // Inner Arc (Timeline Elapsed)
    const innerCircumference = Math.PI * rInner;
    const innerOffset = innerCircumference * (1 - clampedTimeline / 100);

    // Needle Angle Calculation (180deg to 360deg mapped to 0% to 100%)
    const needleAngleDeg = 180 + (clampedCompletion / 100) * 180;
    const needleRad = (needleAngleDeg * Math.PI) / 180;
    const needleLength = rOuter - 6;
    const needleX = cx + needleLength * Math.cos(needleRad);
    const needleY = cy + needleLength * Math.sin(needleRad);

    // Timeline Marker Angle on Outer Arc
    const timelineRad = (180 + (clampedTimeline / 100) * 180) * (Math.PI / 180);
    const timelineMarkerX1 = cx + (rOuter - dims.strokeWidth - 3) * Math.cos(timelineRad);
    const timelineMarkerY1 = cy + (rOuter - dims.strokeWidth - 3) * Math.sin(timelineRad);
    const timelineMarkerX2 = cx + (rOuter + 5) * Math.cos(timelineRad);
    const timelineMarkerY2 = cy + (rOuter + 5) * Math.sin(timelineRad);

    if (compact) {
        return (
            <div className={`inline-flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border ${healthBorder} shadow-xs ${className}`}>
                <div className="relative flex items-center justify-center">
                    <svg width={52} height={34} viewBox="0 0 52 34" className="overflow-visible">
                        {/* Background track */}
                        <path
                            d="M 6 30 A 20 20 0 0 1 46 30"
                            fill="none"
                            stroke="#E2E8F0"
                            strokeWidth="5"
                            strokeLinecap="round"
                        />
                        {/* Timeline mark */}
                        <path
                            d="M 6 30 A 20 20 0 0 1 46 30"
                            fill="none"
                            stroke="#94A3B8"
                            strokeWidth="5"
                            strokeDasharray="62.8"
                            strokeDashoffset={62.8 * (1 - clampedTimeline / 100)}
                            strokeLinecap="round"
                            opacity={0.4}
                        />
                        {/* Completion progress */}
                        <path
                            d="M 6 30 A 20 20 0 0 1 46 30"
                            fill="none"
                            stroke={healthColor}
                            strokeWidth="5"
                            strokeDasharray="62.8"
                            strokeDashoffset={62.8 * (1 - clampedCompletion / 100)}
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
                <div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{clampedCompletion}% Done</span>
                        <span className={`text-[10px] font-semibold ${healthText}`}>({clampedTimeline}% time)</span>
                    </div>
                    <span className={`text-[10px] font-bold block ${healthText}`}>{healthLabel}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col items-center justify-between relative overflow-hidden ${className}`}>
            {/* Header / Titles */}
            {(title || subtitle) && (
                <div className="w-full flex items-start justify-between gap-2 mb-2">
                    <div>
                        {title && <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>}
                        {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${healthBg} ${healthBorder} ${healthText} whitespace-nowrap`}>
                        {healthLabel}
                    </span>
                </div>
            )}

            {/* Gauge SVG Canvas */}
            <div className="relative flex flex-col items-center my-2 select-none">
                <svg
                    width={dims.width}
                    height={dims.height}
                    viewBox={`0 0 ${dims.width} ${dims.height}`}
                    className="overflow-visible"
                >
                    <defs>
                        {/* Glow filter */}
                        <filter id={`gauge-glow-${title || 'main'}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={healthColor} floodOpacity="0.35" />
                        </filter>
                        {/* Gradient for Completion Arc */}
                        <linearGradient id={`grad-completion-${title || 'main'}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="70%" stopColor={healthColor} />
                            <stop offset="100%" stopColor={healthColor} />
                        </linearGradient>
                    </defs>

                    {/* Outer Track Background (Physical Progress Ceiling) */}
                    <path
                        d={`M ${cx - rOuter} ${cy} A ${rOuter} ${rOuter} 0 0 1 ${cx + rOuter} ${cy}`}
                        fill="none"
                        stroke="#F1F5F9"
                        strokeWidth={dims.strokeWidth}
                        strokeLinecap="round"
                    />

                    {/* Inner Track Background (Timeline Ceiling) */}
                    <path
                        d={`M ${cx - rInner} ${cy} A ${rInner} ${rInner} 0 0 1 ${cx + rInner} ${cy}`}
                        fill="none"
                        stroke="#F8FAFC"
                        strokeWidth={dims.innerStroke}
                        strokeLinecap="round"
                    />

                    {/* Inner Arc: Scheduled Timeline Elapsed Progress */}
                    <path
                        d={`M ${cx - rInner} ${cy} A ${rInner} ${rInner} 0 0 1 ${cx + rInner} ${cy}`}
                        fill="none"
                        stroke="#94A3B8"
                        strokeWidth={dims.innerStroke}
                        strokeDasharray={innerCircumference}
                        strokeDashoffset={innerOffset}
                        strokeLinecap="round"
                        strokeDashoffset-transition="all 0.5s ease"
                    />

                    {/* Outer Arc: Physical Completion Progress */}
                    <path
                        d={`M ${cx - rOuter} ${cy} A ${rOuter} ${rOuter} 0 0 1 ${cx + rOuter} ${cy}`}
                        fill="none"
                        stroke={`url(#grad-completion-${title || 'main'})`}
                        strokeWidth={dims.strokeWidth}
                        strokeDasharray={outerCircumference}
                        strokeDashoffset={outerOffset}
                        strokeLinecap="round"
                        filter={`url(#gauge-glow-${title || 'main'})`}
                    />

                    {/* Timeline Target Needle Mark on Outer Ring */}
                    <line
                        x1={timelineMarkerX1}
                        y1={timelineMarkerY1}
                        x2={timelineMarkerX2}
                        y2={timelineMarkerY2}
                        stroke="#475569"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />

                    {/* Scale Zone Indicator Ticks (0%, 25%, 50%, 75%, 100%) */}
                    {[0, 25, 50, 75, 100].map(pct => {
                        const tickRad = (180 + (pct / 100) * 180) * (Math.PI / 180);
                        const x1 = cx + (rOuter + 3) * Math.cos(tickRad);
                        const y1 = cy + (rOuter + 3) * Math.sin(tickRad);
                        const x2 = cx + (rOuter + 7) * Math.cos(tickRad);
                        const y2 = cy + (rOuter + 7) * Math.sin(tickRad);
                        return (
                            <line
                                key={pct}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="#CBD5E1"
                                strokeWidth="1.5"
                            />
                        );
                    })}

                    {/* Needle Indicator for Physical Completion */}
                    {showNeedle && (
                        <>
                            <line
                                x1={cx}
                                y1={cy}
                                x2={needleX}
                                y2={needleY}
                                stroke={healthColor}
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            <circle cx={cx} cy={cy} r="6" fill="#1E293B" stroke="#FFFFFF" strokeWidth="2" />
                            <circle cx={needleX} cy={needleY} r="3.5" fill={healthColor} />
                        </>
                    )}
                </svg>

                {/* Center Digital Display & Delta */}
                <div className="text-center -mt-8 flex flex-col items-center">
                    <div className="flex items-baseline justify-center gap-1">
                        <span className={`${dims.fontSize} font-extrabold text-slate-900 tracking-tight font-mono`}>
                            {clampedCompletion}%
                        </span>
                        <span className="text-xs font-semibold text-slate-500 uppercase">Physical</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            Timeline: <strong className="font-mono text-slate-700">{clampedTimeline}%</strong>
                        </span>
                        <span className={`text-[11px] font-bold font-mono px-1.5 py-0.2 rounded ${progressDelta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {progressDelta >= 0 ? `+${progressDelta}%` : `${progressDelta}%`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Health Indicator & KPI Breakdown */}
            {showDetails && (
                <div className="w-full mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Schedule Index</span>
                        <span className={`font-mono font-extrabold ${spi >= 1.0 ? 'text-emerald-600' : spi >= 0.85 ? 'text-amber-600' : 'text-rose-600'}`}>
                            SPI {spi.toFixed(2)}
                        </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Time Variance</span>
                        <span className={`font-mono font-bold ${varianceDays !== undefined && varianceDays > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                            {varianceDays !== undefined ? (varianceDays > 0 ? `+${varianceDays}d delay` : `${Math.abs(varianceDays)}d ahead`) : `${clampedTimeline}% elapsed`}
                        </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Planned Span</span>
                        <span className="font-mono font-bold text-slate-700">
                            {plannedDays ? `${plannedDays} Days` : (startDateStr && targetDateStr ? `${formatDate(targetDateStr)}` : 'Active')}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

interface ProjectProgressGaugeSectionProps {
    projects: Project[];
    contracts: Contract[];
    procurements?: Procurement[];
    onSelectProject?: (project: Project) => void;
    onNavigate?: (moduleId: string, itemId?: string) => void;
}

/**
 * Full-featured Visual Progress Gauge Dashboard Section
 * Provides executive portfolio health gauge, filterable matrix of individual project gauges, and deep dive audit inspector.
 */
export const ProjectProgressGaugeSection: React.FC<ProjectProgressGaugeSectionProps> = ({
    projects,
    contracts,
    procurements = [],
    onSelectProject,
    onNavigate
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedZone, setSelectedZone] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [healthFilter, setHealthFilter] = useState<'all' | 'ahead' | 'on_track' | 'minor_lag' | 'critical_lag'>('all');
    const [selectedProjectTelemetry, setSelectedProjectTelemetry] = useState<ProjectGaugeTelemetry | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'table' | 'comparative'>('grid');

    // Build contracts lookup
    const contractsMap = useMemo(() => {
        const map = new Map<string, Contract[]>();
        contracts.forEach(c => {
            const list = map.get(c.projectId) || [];
            list.push(c);
            map.set(c.projectId, list);
        });
        return map;
    }, [contracts]);

    // Calculate Comprehensive Gauge Telemetry for all projects
    const allTelemetry = useMemo<ProjectGaugeTelemetry[]>(() => {
        const today = new Date();

        return projects.map(p => {
            const projectContracts = contractsMap.get(p.id) || [];
            const isCompleted = p.status === ProjectStatus.COMPLETED || !!p.actualCompletionDate;

            // Dates & Duration
            const parseDate = (d?: string) => (d ? new Date(d) : null);
            const plannedStart = parseDate(p.plannedStartDate) || parseDate(p.feasibilityStudyDate) || new Date('2025-01-01');
            const plannedEnd = parseDate(p.plannedCompletionDate) || new Date(plannedStart.getTime() + 365 * 86400000);
            const actualStart = parseDate(p.actualStartDate) || plannedStart;
            const actualEnd = parseDate(p.actualCompletionDate) || (isCompleted ? today : (today > plannedEnd ? today : plannedEnd));

            const plannedDays = Math.max(1, Math.round((plannedEnd.getTime() - plannedStart.getTime()) / (1000 * 60 * 60 * 24)));
            const elapsedDays = Math.max(0, Math.round((today.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24)));
            const remainingDays = Math.max(0, Math.round((plannedEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

            // Timeline Elapsed Percentage
            let timelineElapsedPct = 0;
            if (isCompleted) {
                timelineElapsedPct = 100;
            } else {
                timelineElapsedPct = Math.min(100, Math.max(0, Math.round((elapsedDays / plannedDays) * 100)));
            }

            // Physical Completion Percentage
            let physicalCompletionPct = 0;
            if (isCompleted) {
                physicalCompletionPct = 100;
            } else if (p.status === ProjectStatus.DRAFT) {
                physicalCompletionPct = 8;
            } else if (p.status === ProjectStatus.SUBMITTED) {
                physicalCompletionPct = 18;
            } else if (p.status === ProjectStatus.UNDER_REVIEW) {
                physicalCompletionPct = 28;
            } else if (p.status === ProjectStatus.APPROVED) {
                // Check if contracts exist or phase costs are progressing
                if (projectContracts.length > 0) {
                    const totalContractVal = projectContracts.reduce((sum, c) => sum + (c.contractAmount || p.estimatedBudget || 1), 0);
                    const paidVal = projectContracts.reduce((sum, c) => {
                        const paid = (c.payments || []).reduce((pSum, pay) => pSum + (pay.actualAmount || 0), 0);
                        return sum + paid;
                    }, 0);
                    const paymentPct = Math.min(95, Math.round((paidVal / totalContractVal) * 100));
                    // Physical progress leads or parallels payment
                    physicalCompletionPct = Math.max(35, Math.min(95, Math.round(paymentPct * 0.9 + 25)));
                } else if (p.phaseCosts && p.phaseCosts.length > 0) {
                    const totalBudget = p.phaseCosts.reduce((s, ph) => s + (ph.originalBudget || 1), 0);
                    const actualSpent = p.phaseCosts.reduce((s, ph) => s + (ph.actualExpenditure || 0), 0);
                    physicalCompletionPct = Math.min(92, Math.max(35, Math.round((actualSpent / totalBudget) * 100)));
                } else {
                    physicalCompletionPct = 35;
                }
            } else {
                physicalCompletionPct = Math.min(100, Math.max(10, Math.round(timelineElapsedPct * 0.85)));
            }

            // Progress Delta & SPI
            const progressDelta = physicalCompletionPct - timelineElapsedPct;
            const spi = timelineElapsedPct > 0 ? Number((physicalCompletionPct / timelineElapsedPct).toFixed(2)) : 1.0;

            // Health Tier
            let healthTier: ProgressHealthTier = 'on_track';
            if (isCompleted || progressDelta >= 3) {
                healthTier = 'ahead';
            } else if (progressDelta >= -5) {
                healthTier = 'on_track';
            } else if (progressDelta >= -15) {
                healthTier = 'minor_lag';
            } else {
                healthTier = 'critical_lag';
            }

            // Schedule Variance (days)
            let varianceDays = 0;
            if (isCompleted && p.actualCompletionDate && p.plannedCompletionDate) {
                varianceDays = Math.round((new Date(p.actualCompletionDate).getTime() - new Date(p.plannedCompletionDate).getTime()) / 86400000);
            } else if (p.plannedCompletionDate) {
                if (today > plannedEnd) {
                    varianceDays = Math.round((today.getTime() - plannedEnd.getTime()) / 86400000);
                } else {
                    // Estimated delay based on SPI
                    if (spi < 0.9 && spi > 0) {
                        const requiredDays = Math.round(plannedDays / spi);
                        varianceDays = Math.max(0, requiredDays - plannedDays);
                    } else {
                        varianceDays = 0;
                    }
                }
            }

            // Estimated Completion Date
            let estimatedEnd = new Date(plannedEnd);
            if (varianceDays > 0) {
                estimatedEnd = new Date(plannedEnd.getTime() + varianceDays * 86400000);
            }

            // Financial Fields
            const approvedBudget = p.estimatedBudget || 0;
            const actualExpenditure = projectContracts.reduce((sum, c) => {
                const pays = (c.payments || []).reduce((pSum, pay) => pSum + (pay.actualAmount || 0), 0);
                return sum + pays;
            }, 0) || (p.phaseCosts || []).reduce((s, ph) => s + (ph.actualExpenditure || 0), 0);

            const burnRatePct = approvedBudget > 0 ? (actualExpenditure / approvedBudget) * 100 : 0;
            const financialVarianceEtb = approvedBudget - actualExpenditure;

            return {
                project: p,
                physicalCompletionPct,
                timelineElapsedPct,
                progressDelta,
                spi,
                healthTier,
                plannedDays,
                elapsedDays,
                remainingDays,
                varianceDays,
                startDateStr: p.plannedStartDate || plannedStart.toISOString().split('T')[0],
                targetDateStr: p.plannedCompletionDate || plannedEnd.toISOString().split('T')[0],
                estimatedCompletionDateStr: estimatedEnd.toISOString().split('T')[0],
                burnRatePct,
                financialVarianceEtb,
                approvedBudget,
                actualExpenditure,
                contractCount: projectContracts.length,
                status: p.status
            };
        });
    }, [projects, contractsMap]);

    // Portfolio Level Summary Statistics
    const portfolioSummary = useMemo(() => {
        const total = allTelemetry.length;
        if (total === 0) {
            return {
                avgPhysical: 0,
                avgTimeline: 0,
                avgSpi: 1,
                aheadCount: 0,
                onTrackCount: 0,
                minorLagCount: 0,
                criticalLagCount: 0,
                completedCount: 0
            };
        }

        const sumPhysical = allTelemetry.reduce((s, t) => s + t.physicalCompletionPct, 0);
        const sumTimeline = allTelemetry.reduce((s, t) => s + t.timelineElapsedPct, 0);
        const sumSpi = allTelemetry.reduce((s, t) => s + t.spi, 0);

        const aheadCount = allTelemetry.filter(t => t.healthTier === 'ahead').length;
        const onTrackCount = allTelemetry.filter(t => t.healthTier === 'on_track').length;
        const minorLagCount = allTelemetry.filter(t => t.healthTier === 'minor_lag').length;
        const criticalLagCount = allTelemetry.filter(t => t.healthTier === 'critical_lag').length;
        const completedCount = allTelemetry.filter(t => t.status === ProjectStatus.COMPLETED).length;

        return {
            avgPhysical: Math.round(sumPhysical / total),
            avgTimeline: Math.round(sumTimeline / total),
            avgSpi: Number((sumSpi / total).toFixed(2)),
            aheadCount,
            onTrackCount,
            minorLagCount,
            criticalLagCount,
            completedCount
        };
    }, [allTelemetry]);

    // Filtered Telemetry
    const filteredTelemetry = useMemo(() => {
        return allTelemetry.filter(item => {
            const matchesSearch = !searchQuery || 
                item.project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.project.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.project.woreda.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesZone = !selectedZone || item.project.zone === selectedZone;
            const matchesType = !selectedType || item.project.projectType === selectedType;
            const matchesHealth = healthFilter === 'all' || item.healthTier === healthFilter;

            return matchesSearch && matchesZone && matchesType && matchesHealth;
        });
    }, [allTelemetry, searchQuery, selectedZone, selectedType, healthFilter]);

    // Export Matrix to Excel
    const exportToExcel = () => {
        const rows = filteredTelemetry.map(t => ({
            'Project ID': t.project.id,
            'Project Name': t.project.name,
            'Zone': t.project.zone,
            'Woreda': t.project.woreda,
            'Status': t.project.status,
            'Physical Completion %': `${t.physicalCompletionPct}%`,
            'Timeline Elapsed %': `${t.timelineElapsedPct}%`,
            'Progress Delta %': `${t.progressDelta > 0 ? '+' : ''}${t.progressDelta}%`,
            'Schedule Performance Index (SPI)': t.spi,
            'Health Status': t.healthTier.toUpperCase().replace('_', ' '),
            'Planned Days': t.plannedDays,
            'Elapsed Days': t.elapsedDays,
            'Schedule Variance (Days)': t.varianceDays,
            'Planned Completion': t.targetDateStr,
            'Estimated Completion': t.estimatedCompletionDateStr,
            'Approved Budget (ETB)': t.approvedBudget,
            'Actual Disbursed (ETB)': t.actualExpenditure
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Progress_Gauges');
        XLSX.writeFile(wb, `OWEB_Project_Progress_Gauges_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Export PDF Summary Report
    const exportToPDF = () => {
        const doc = new jsPDF('landscape');
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text('OWEB Project Progress & Timeline Health Gauge Report', 14, 15);
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated on: ${new Date().toLocaleString()} | Regional Active Portfolio Summary`, 14, 21);

        const tableData = filteredTelemetry.map(t => [
            t.project.id,
            t.project.name.length > 25 ? t.project.name.substring(0, 23) + '...' : t.project.name,
            t.project.zone,
            `${t.physicalCompletionPct}%`,
            `${t.timelineElapsedPct}%`,
            `SPI ${t.spi}`,
            t.healthTier.toUpperCase().replace('_', ' '),
            `${t.varianceDays > 0 ? '+' : ''}${t.varianceDays}d`,
            t.targetDateStr
        ]);

        autoTable(doc, {
            head: [['ID', 'Project Name', 'Zone', 'Physical %', 'Timeline %', 'SPI', 'Health', 'Variance', 'Target Date']],
            body: tableData,
            startY: 26,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
        });

        doc.save(`OWEB_Progress_Gauge_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-6 animate-fade-in" id="project-progress-gauge-root">
            {/* Header with KPI and View Controls */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                            </svg>
                        </span>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Project Completion vs. Timeline Health Gauge</h2>
                            <p className="text-xs text-slate-500">
                                Visual tachometer gauges displaying real-time physical completion against scheduled timeline elapsed to immediately identify schedule health and velocity risks.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* View Switcher */}
                    <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                viewMode === 'grid' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            <span>Gauges Grid</span>
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span>Audit Matrix</span>
                        </button>
                    </div>

                    <button
                        onClick={exportToExcel}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span>Export Excel</span>
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        <span>PDF Report</span>
                    </button>
                </div>
            </div>

            {/* PORTFOLIO HERO PROGRESS GAUGE & HEALTH DISTRIBUTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hero Portfolio Speedometer Gauge */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-between">
                    <div className="w-full flex items-center justify-between mb-2">
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Regional Benchmark</span>
                            <h3 className="text-base font-bold text-slate-800">Portfolio Average Velocity</h3>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${portfolioSummary.avgPhysical >= portfolioSummary.avgTimeline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                            SPI {portfolioSummary.avgSpi}
                        </span>
                    </div>

                    <ProgressGauge
                        completionPct={portfolioSummary.avgPhysical}
                        timelinePct={portfolioSummary.avgTimeline}
                        size="hero"
                        showDetails={false}
                        className="border-0 shadow-none p-0 my-1"
                    />

                    <div className="w-full bg-slate-50 p-3.5 rounded-xl border border-slate-100 mt-3 grid grid-cols-2 gap-3 text-center text-xs">
                        <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Physical Complete</span>
                            <span className="font-extrabold font-mono text-base text-slate-800">{portfolioSummary.avgPhysical}%</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Timeline Elapsed</span>
                            <span className="font-extrabold font-mono text-base text-slate-600">{portfolioSummary.avgTimeline}%</span>
                        </div>
                    </div>
                </div>

                {/* Health Tier Summary Cards */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Ahead of Schedule */}
                    <div 
                        onClick={() => setHealthFilter(healthFilter === 'ahead' ? 'all' : 'ahead')}
                        className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                            healthFilter === 'ahead' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Ahead of Schedule</span>
                            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                            </span>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-extrabold text-slate-900 font-mono">{portfolioSummary.aheadCount}</span>
                            <span className="text-xs text-slate-500 ml-1.5">Projects</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Physical deliverable rate exceeds elapsed timeline (SPI &ge; 1.05).</p>
                    </div>

                    {/* On Track */}
                    <div 
                        onClick={() => setHealthFilter(healthFilter === 'on_track' ? 'all' : 'on_track')}
                        className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                            healthFilter === 'on_track' ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-sky-700">On Track / Synced</span>
                            <span className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            </span>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-extrabold text-slate-900 font-mono">{portfolioSummary.onTrackCount}</span>
                            <span className="text-xs text-slate-500 ml-1.5">Projects</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Physical progression is closely synced with planned timelines (&plusmn;5%).</p>
                    </div>

                    {/* Minor Slippage */}
                    <div 
                        onClick={() => setHealthFilter(healthFilter === 'minor_lag' ? 'all' : 'minor_lag')}
                        className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                            healthFilter === 'minor_lag' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Minor Slippage</span>
                            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                            </span>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-extrabold text-slate-900 font-mono">{portfolioSummary.minorLagCount}</span>
                            <span className="text-xs text-slate-500 ml-1.5">Projects</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Physical progress lags timeline by 5% to 15%. Corrective measures advised.</p>
                    </div>

                    {/* Critical Lag */}
                    <div 
                        onClick={() => setHealthFilter(healthFilter === 'critical_lag' ? 'all' : 'critical_lag')}
                        className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                            healthFilter === 'critical_lag' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Critical Delay Risk</span>
                            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            </span>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-extrabold text-rose-600 font-mono">{portfolioSummary.criticalLagCount}</span>
                            <span className="text-xs text-slate-500 ml-1.5">Projects</span>
                        </div>
                        <p className="text-xs text-rose-700 mt-1">Severe schedule lag (&gt;15% overdue). Immediate supervisor escalation required.</p>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                    <input
                        type="text"
                        placeholder="Search by project name, ID, or woreda..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                    <select
                        value={selectedZone}
                        onChange={(e) => setSelectedZone(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none cursor-pointer"
                    >
                        <option value="">All Zones ({ZONES.length})</option>
                        {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>

                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none cursor-pointer"
                    >
                        <option value="">All Types ({Object.keys(PROJECT_TYPES).length})</option>
                        {Object.keys(PROJECT_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <select
                        value={healthFilter}
                        onChange={(e) => setHealthFilter(e.target.value as any)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none cursor-pointer"
                    >
                        <option value="all">All Health Tiers</option>
                        <option value="ahead">Ahead of Schedule</option>
                        <option value="on_track">On Track (Synced)</option>
                        <option value="minor_lag">Minor Slippage</option>
                        <option value="critical_lag">Critical Delay Risk</option>
                    </select>

                    {(searchQuery || selectedZone || selectedType || healthFilter !== 'all') && (
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedZone(''); setSelectedType(''); setHealthFilter('all'); }}
                            className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* MAIN VIEW: GAUGES GRID */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTelemetry.map(item => (
                        <div
                            key={item.project.id}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                        >
                            {/* Card Top */}
                            <div className="p-5 pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                                            {item.project.id} • {item.project.zone}
                                        </span>
                                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                                            {item.project.name}
                                        </h4>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 whitespace-nowrap">
                                        {item.project.status}
                                    </span>
                                </div>
                            </div>

                            {/* Center Visual Progress Gauge */}
                            <div className="px-5 py-2 flex justify-center">
                                <ProgressGauge
                                    completionPct={item.physicalCompletionPct}
                                    timelinePct={item.timelineElapsedPct}
                                    plannedDays={item.plannedDays}
                                    elapsedDays={item.elapsedDays}
                                    varianceDays={item.varianceDays}
                                    startDateStr={item.startDateStr}
                                    targetDateStr={item.targetDateStr}
                                    size="md"
                                    showDetails={true}
                                    className="w-full border-0 shadow-none p-0"
                                />
                            </div>

                            {/* Card Footer Actions */}
                            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-medium">
                                    Target: <strong className="font-mono text-slate-700">{formatDate(item.targetDateStr)}</strong>
                                </span>
                                <button
                                    onClick={() => setSelectedProjectTelemetry(item)}
                                    className="px-3 py-1.5 bg-white hover:bg-primary-50 text-primary-700 border border-slate-200 hover:border-primary-200 font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <span>Detailed Gauge Audit</span>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredTelemetry.length === 0 && (
                        <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
                            <div className="p-3 bg-slate-100 rounded-full w-12 h-12 mx-auto flex items-center justify-center text-slate-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            </div>
                            <h4 className="text-sm font-bold text-slate-800">No project gauges match criteria</h4>
                            <p className="text-xs text-slate-500">Try adjusting your search queries or resetting active filters.</p>
                        </div>
                    )}
                </div>
            )}

            {/* AUDIT MATRIX TABLE VIEW */}
            {viewMode === 'table' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-900 text-white font-semibold text-[11px] uppercase tracking-wider">
                                    <th className="p-3.5">Project ID &amp; Name</th>
                                    <th className="p-3.5">Zone / Woreda</th>
                                    <th className="p-3.5 text-center">Visual Mini-Gauge</th>
                                    <th className="p-3.5 text-center">Physical %</th>
                                    <th className="p-3.5 text-center">Timeline %</th>
                                    <th className="p-3.5 text-center">Delta / SPI</th>
                                    <th className="p-3.5 text-center">Schedule Variance</th>
                                    <th className="p-3.5">Target Completion</th>
                                    <th className="p-3.5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {filteredTelemetry.map(item => (
                                    <tr key={item.project.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3.5">
                                            <span className="font-mono text-[10px] text-slate-400 block font-bold">{item.project.id}</span>
                                            <span className="font-bold text-slate-900">{item.project.name}</span>
                                        </td>
                                        <td className="p-3.5">
                                            <span className="font-semibold block">{item.project.zone}</span>
                                            <span className="text-[10px] text-slate-500">{item.project.woreda}</span>
                                        </td>
                                        <td className="p-3.5 text-center">
                                            <ProgressGauge
                                                completionPct={item.physicalCompletionPct}
                                                timelinePct={item.timelineElapsedPct}
                                                compact={true}
                                            />
                                        </td>
                                        <td className="p-3.5 text-center font-mono font-extrabold text-slate-900">
                                            {item.physicalCompletionPct}%
                                        </td>
                                        <td className="p-3.5 text-center font-mono font-bold text-slate-600">
                                            {item.timelineElapsedPct}%
                                        </td>
                                        <td className="p-3.5 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono ${
                                                item.progressDelta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                            }`}>
                                                {item.progressDelta >= 0 ? `+${item.progressDelta}%` : `${item.progressDelta}%`} (SPI {item.spi})
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-center font-mono font-bold">
                                            <span className={item.varianceDays > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-700'}>
                                                {item.varianceDays > 0 ? `+${item.varianceDays}d lag` : `${Math.abs(item.varianceDays)}d ahead`}
                                            </span>
                                        </td>
                                        <td className="p-3.5 font-mono text-slate-600">
                                            {formatDate(item.targetDateStr)}
                                        </td>
                                        <td className="p-3.5 text-right">
                                            <button
                                                onClick={() => setSelectedProjectTelemetry(item)}
                                                className="px-3 py-1 bg-primary-50 text-primary-700 hover:bg-primary-100 font-bold rounded-lg transition-colors cursor-pointer text-xs"
                                            >
                                                Inspect
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* DETAILED PROJECT GAUGE INSPECTOR MODAL */}
            {selectedProjectTelemetry && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200">
                        {/* Header */}
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold">{selectedProjectTelemetry.project.name}</h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">
                                    Project ID: {selectedProjectTelemetry.project.id} • {selectedProjectTelemetry.project.zone} Zone, {selectedProjectTelemetry.project.woreda} Woreda
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedProjectTelemetry(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                            {/* Visual Tachometer & Velocity Diagnostic */}
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex-1 flex justify-center">
                                    <ProgressGauge
                                        completionPct={selectedProjectTelemetry.physicalCompletionPct}
                                        timelinePct={selectedProjectTelemetry.timelineElapsedPct}
                                        size="lg"
                                        showDetails={false}
                                        className="border-0 shadow-none bg-transparent p-0"
                                    />
                                </div>
                                <div className="flex-1 space-y-3 w-full">
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Schedule Performance Index</span>
                                        <div className="flex items-baseline justify-between mt-1">
                                            <span className="text-xl font-extrabold font-mono text-slate-900">
                                                SPI {selectedProjectTelemetry.spi}
                                            </span>
                                            <span className={`text-xs font-bold ${selectedProjectTelemetry.spi >= 1 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                {selectedProjectTelemetry.spi >= 1 ? 'Healthy Deliverable Velocity' : 'Deliverable Lag vs Schedule'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Forecasted Completion Date</span>
                                        <div className="flex items-baseline justify-between mt-1">
                                            <span className="text-sm font-bold font-mono text-slate-900">
                                                {formatDate(selectedProjectTelemetry.estimatedCompletionDateStr)}
                                            </span>
                                            <span className="text-xs text-slate-500 font-mono">
                                                Target: {formatDate(selectedProjectTelemetry.targetDateStr)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline & Schedule Telemetry */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                                    Timeline Metrics &amp; Elapsed Durations
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Planned Duration</span>
                                        <span className="font-bold font-mono text-slate-800">{selectedProjectTelemetry.plannedDays} Days</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Elapsed Days</span>
                                        <span className="font-bold font-mono text-slate-800">{selectedProjectTelemetry.elapsedDays} Days</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Remaining Days</span>
                                        <span className="font-bold font-mono text-slate-800">{selectedProjectTelemetry.remainingDays} Days</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Schedule Variance</span>
                                        <span className={`font-bold font-mono ${selectedProjectTelemetry.varianceDays > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {selectedProjectTelemetry.varianceDays > 0 ? `+${selectedProjectTelemetry.varianceDays}d delay` : `${Math.abs(selectedProjectTelemetry.varianceDays)}d ahead`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Alignment vs Physical Progress */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                    Financial Burn Rate vs. Physical Progress
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Planned Budget</span>
                                        <span className="font-bold font-mono text-slate-800">{formatCurrency(selectedProjectTelemetry.approvedBudget)} ETB</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Actual Disbursed</span>
                                        <span className="font-bold font-mono text-slate-800">{formatCurrency(selectedProjectTelemetry.actualExpenditure)} ETB</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Budget Utilization</span>
                                        <span className="font-bold font-mono text-slate-800">{selectedProjectTelemetry.burnRatePct.toFixed(1)}%</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Physical vs. Burn Delta</span>
                                        <span className={`font-bold font-mono ${selectedProjectTelemetry.physicalCompletionPct >= selectedProjectTelemetry.burnRatePct ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {(selectedProjectTelemetry.physicalCompletionPct - selectedProjectTelemetry.burnRatePct).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
                            {onSelectProject && (
                                <button
                                    onClick={() => {
                                        onSelectProject(selectedProjectTelemetry.project);
                                        setSelectedProjectTelemetry(null);
                                    }}
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                                >
                                    Open in Project Management Module
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedProjectTelemetry(null)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer ml-auto"
                            >
                                Close Inspector
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
