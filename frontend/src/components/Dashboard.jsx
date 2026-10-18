import React, { useState, useMemo, useEffect } from 'react';
import { Role, ProjectStatus, InsightLevel } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell } from 'recharts';
import { ICONS, ZONES, PROGRAMS } from '../constants';
import { generateDashboardInsights } from '../services/geminiService';
import GanttTimelineChart from './GanttTimelineChart';
import { loadPrograms } from '../services/programService';
import { loadNgos } from '../services/ngoService';
import { loadStaff } from '../services/staffService';
import MetisStatsCard from './metis/MetisStatsCard';
import MetisCard from './metis/MetisCard';
const STATUS_UI = {
    [ProjectStatus.APPROVED]: { color: 'bg-success-100 text-success-700', icon: ICONS.checkCircle },
    [ProjectStatus.COMPLETED]: { color: 'bg-success-100 text-success-700', icon: ICONS.checkCircle },
    [ProjectStatus.REJECTED]: { color: 'bg-danger-100 text-danger-700', icon: ICONS.alertTriangle },
    [ProjectStatus.CANCELLED]: { color: 'bg-danger-100 text-danger-700', icon: ICONS.alertTriangle },
    [ProjectStatus.SUBMITTED]: { color: 'bg-primary-100 text-primary-700', icon: ICONS.fileSignature },
    [ProjectStatus.UNDER_REVIEW]: { color: 'bg-warning-100 text-warning-700', icon: ICONS.clock },
    [ProjectStatus.DRAFT]: { color: 'bg-slate-100 text-slate-600', icon: ICONS.planning },
};
const STATUS_COLORS_HEX = {
    [ProjectStatus.APPROVED]: '#059669',
    [ProjectStatus.COMPLETED]: '#059669',
    [ProjectStatus.REJECTED]: '#be123c',
    [ProjectStatus.CANCELLED]: '#be123c',
    [ProjectStatus.SUBMITTED]: '#0369a1',
    [ProjectStatus.UNDER_REVIEW]: '#b45309',
    [ProjectStatus.DRAFT]: '#475569',
};
const Card = ({ title, value, icon, iconBg, trend, trendUp, variant }) => {
    let resolvedVariant = variant || 'primary';
    if (!variant) {
        if (iconBg && (iconBg.includes('warning') || iconBg.includes('amber'))) resolvedVariant = 'warning';
        else if (iconBg && (iconBg.includes('success') || iconBg.includes('emerald'))) resolvedVariant = 'success';
        else if (iconBg && (iconBg.includes('danger') || iconBg.includes('rose'))) resolvedVariant = 'danger';
        else if (iconBg && (iconBg.includes('info') || iconBg.includes('cyan') || iconBg.includes('sky'))) resolvedVariant = 'info';
    }
    return (
        <MetisStatsCard
            title={title}
            value={value}
            icon={icon}
            variant={resolvedVariant}
            trend={trend}
            trendType={trendUp ? 'up' : 'neutral'}
        />
    );
};
const ChartContainer = ({ title, children, className, action }) => (
    <MetisCard
        title={title}
        actions={action}
        className={className || ''}
    >
        {children}
    </MetisCard>
);
const AIInsights = ({ insights, isLoading, onNavigate, onRefresh }) => {
    const INSIGHT_STYLES = {
        [InsightLevel.INFO]: { icon: ICONS.lightbulb, bg: 'bg-primary-50/70', badgeBg: 'bg-primary-100 text-primary-800', border: 'border-primary-200', text: 'text-primary-700' },
        [InsightLevel.WARNING]: { icon: ICONS.alertTriangle, bg: 'bg-warning-50/70', badgeBg: 'bg-warning-100 text-warning-800', border: 'border-warning-200', text: 'text-warning-700' },
        [InsightLevel.CRITICAL]: { icon: ICONS.shieldAlert, bg: 'bg-danger-50/70', badgeBg: 'bg-danger-100 text-danger-800', border: 'border-danger-200', text: 'text-danger-700' },
        [InsightLevel.SUCCESS]: { icon: ICONS.checkCircle, bg: 'bg-success-50/70', badgeBg: 'bg-success-100 text-success-800', border: 'border-success-200', text: 'text-success-700' },
    };
    return (<div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-primary-100 text-primary-700 rounded-xl">
                        {React.cloneElement(ICONS.sparkles, { className: "w-5 h-5 text-primary-600" })}
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">AI Executive Intelligence</h3>
                        <p className="text-xs text-slate-500">Autonomous risk & overrun signals</p>
                    </div>
                </div>
                <button onClick={onRefresh} disabled={isLoading} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50 disabled:animate-spin cursor-pointer" title="Refresh AI analysis">
                    {React.cloneElement(ICONS.refreshCw, { className: "w-4 h-4" })}
                </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar max-h-[380px]">
                {isLoading ? (<div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center">
                        <div className="w-10 h-10 text-primary-500 animate-pulse">{ICONS.sparkles}</div>
                        <p className="mt-3 font-bold text-slate-700 text-sm">Evaluating Project Vectors...</p>
                        <p className="text-xs text-slate-400">Synthesizing milestones, variations & budget variances.</p>
                    </div>) : insights.length > 0 ? (insights.map((insight, index) => {
            const style = INSIGHT_STYLES[insight.level];
            return (<div key={insight.id} className={`p-4 rounded-xl border ${style.bg} ${style.border} transition-all hover:shadow-xs`}>
                                <div className="flex items-start space-x-3">
                                    <div className={`flex-shrink-0 p-1.5 rounded-lg ${style.badgeBg}`}>
                                        {React.cloneElement(style.icon, { className: "w-4 h-4" })}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-bold text-xs text-slate-900 truncate">{insight.title}</p>
                                            <span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${style.badgeBg}`}>
                                                {insight.level}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{insight.description}</p>
                                        {insight.link ? (<button onClick={() => onNavigate(insight.link.moduleId, insight.link.itemId)} className="text-xs text-primary-700 font-bold hover:text-primary-800 hover:underline mt-2 inline-flex items-center gap-1 cursor-pointer">
                                                <span>{insight.recommendation}</span>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                                                </svg>
                                            </button>) : (<p className="text-xs text-slate-600 font-medium mt-2">{insight.recommendation}</p>)}
                                    </div>
                                </div>
                            </div>);
        })) : (<div className="text-center text-slate-400 text-xs py-10">
                        No critical risk flags detected across regional water portfolios.
                    </div>)}
            </div>
        </div>);
};
const ProjectsByStatusChart = ({ data }) => {
    const statusCounts = Object.values(ProjectStatus).map(status => ({
        name: status,
        count: data.filter(p => p.status === status).length,
    })).filter(item => item.count > 0);
    return (<ChartContainer title="Projects by Status">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusCounts} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false}/>
                    <Tooltip cursor={{ fill: 'rgba(235, 234, 254, 0.5)' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }}/>
                    <Legend wrapperStyle={{ fontSize: "14px" }}/>
                    <Bar dataKey="count" fill="#0ea5e9" name="Project Count" radius={[4, 4, 0, 0]} barSize={40}/>
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>);
};
const ProjectsByImplementingBodyChart = ({ data }) => {
    const implementingBodyCounts = useMemo(() => {
        const counts = data.reduce((acc, project) => {
            const body = project.implementingBody || 'Unknown';
            acc[body] = (acc[body] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [data]);
    const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#64748b']; // Primary, Success, Warning, Danger, slate
    return (<ChartContainer title="Projects by Implementing Body">
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={implementingBodyCounts} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
            const RADIAN = Math.PI / 180;
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);
            if (percent < 0.05)
                return null; // Don't render label for small slices
            return (<text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12px" fontWeight="bold">
                                    {`${(percent * 100).toFixed(0)}%`}
                                </text>);
        }}>
                        {implementingBodyCounts.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }}/>
                    <Legend wrapperStyle={{ fontSize: "14px", paddingTop: "20px" }}/>
                </PieChart>
            </ResponsiveContainer>
        </ChartContainer>);
};
const ProjectLocationMap = ({ data }) => {
    const mapData = data.map(p => ({
        x: p.gpsCoordinates.long,
        y: p.gpsCoordinates.lat,
        z: p.estimatedBudget, // for bubble size
        ...p
    }));
    const projectsByStatus = Object.values(ProjectStatus).reduce((acc, status) => {
        const projectsInStatus = mapData.filter(p => p.status === status);
        if (projectsInStatus.length > 0) {
            acc[status] = projectsInStatus;
        }
        return acc;
    }, {});
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (<div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200 text-sm">
            <p className="font-bold text-slate-800">{data.name}</p>
            <p className="text-slate-500">Status: <span className="font-semibold">{data.status}</span></p>
            <p className="text-slate-500">Budget: {data.z.toLocaleString()} ETB</p>
          </div>);
        }
        return null;
    };
    return (<ChartContainer title="Project Locations">
             <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <XAxis type="number" dataKey="x" name="longitude" domain={['dataMin - 1', 'dataMax + 1']} hide/>
                    <YAxis type="number" dataKey="y" name="latitude" domain={['dataMin - 0.5', 'dataMax + 0.5']} hide/>
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />}/>
                    {Object.entries(projectsByStatus).map(([status, points]) => (<Scatter key={status} name={status} data={points} fill={STATUS_COLORS_HEX[status]} shape="circle"/>))}
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}/>
                </ScatterChart>
            </ResponsiveContainer>
        </ChartContainer>);
};
const ProjectTable = ({ title, projects, onNavigate }) => (<div className="metis-card col-span-1 lg:col-span-3">
        <div className="metis-card-header d-flex justify-content-between align-items-center">
            <div>
                <h3 className="metis-card-title">{title}</h3>
                <p className="metis-card-subtitle">Click any portfolio entry to inspect technical blueprints & financial disbursement details</p>
            </div>
            <div className="d-flex align-items-center gap-2">
                <span className="badge bg-secondary font-monospace">
                    {projects.length} SCHEMES
                </span>
            </div>
        </div>
        <div className="metis-card-body p-0">
            <div className="metis-table-responsive">
                <table className="metis-table">
                    <thead>
                        <tr>
                            <th>Scheme Identification</th>
                            <th>Program Framework</th>
                            <th>Jurisdiction / Zone</th>
                            <th>Audit Status</th>
                            <th className="text-end">Committed Capital (ETB)</th>
                            <th className="text-center">Protocol</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((p) => {
        const statusBadge = p.status === ProjectStatus.APPROVED || p.status === ProjectStatus.COMPLETED
            ? 'badge bg-success'
            : p.status === ProjectStatus.UNDER_REVIEW
                ? 'badge bg-warning'
                : p.status === ProjectStatus.SUBMITTED
                    ? 'badge bg-primary'
                    : p.status === ProjectStatus.REJECTED || p.status === ProjectStatus.CANCELLED
                        ? 'badge bg-danger'
                        : 'badge bg-secondary';
        return (<tr key={p.id} onClick={() => onNavigate && onNavigate('planning', p.id)} style={{ cursor: 'pointer' }}>
                                <td className="fw-bold">
                                    <div>{p.name}</div>
                                    <small className="text-muted font-monospace">{p.id}</small>
                                </td>
                                <td>
                                    <span className="badge bg-secondary">
                                        {p.program || 'ONE WaSH'}
                                    </span>
                                </td>
                                <td>
                                    <span className="fw-semibold">{p.zone}</span>
                                    {p.woreda && <small className="text-muted"> · {p.woreda}</small>}
                                </td>
                                <td>
                                    <span className={statusBadge}>
                                        {p.status}
                                    </span>
                                </td>
                                <td className="text-end font-monospace fw-bold">
                                    {p.estimatedBudget.toLocaleString()} <small className="text-muted">ETB</small>
                                </td>
                                <td className="text-center">
                                    <span className="text-primary fw-bold small">
                                        Open Record →
                                    </span>
                                </td>
                            </tr>);
    })}
                        {projects.length === 0 && (<tr>
                                <td colSpan={6} className="text-center py-4 text-muted">
                                    No water projects match the current scope or filter criteria.
                                </td>
                            </tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    </div>);
const ContractTable = ({ title, contracts, onSelectContract }) => (<div className="metis-card col-span-1 lg:col-span-3">
        <div className="metis-card-header d-flex justify-content-between align-items-center">
            <div>
                <h3 className="metis-card-title">{title}</h3>
                <p className="metis-card-subtitle">Procurement, legal milestone schedules and vendor performance status</p>
            </div>
            <span className="badge bg-secondary font-monospace">
                {contracts.length} CONTRACTS
            </span>
        </div>
        <div className="metis-card-body p-0">
            <div className="metis-table-responsive">
                <table className="metis-table">
                    <thead>
                        <tr>
                            <th>Contract Reference</th>
                            <th>Scheme Project ID</th>
                            <th>Lead Contract Officer</th>
                            <th className="text-end">Execution Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contracts.length > 0 ? contracts.map((c) => (<tr key={c.id} onClick={() => onSelectContract(c)} style={{ cursor: 'pointer' }}>
                                <td className="font-monospace fw-bold text-primary">{c.id}</td>
                                <td className="text-muted font-monospace">{c.projectId}</td>
                                <td className="fw-semibold">{c.contractManager}</td>
                                <td className="text-end">
                                    <span className={`badge ${c.completionDate ? 'bg-success' : 'bg-primary'}`}>
                                        {c.completionDate ? 'Completed' : 'Active In-Progress'}
                                    </span>
                                </td>
                            </tr>)) : (<tr>
                                <td colSpan={4} className="text-center py-4 text-muted">
                                    No contracts to display in this view.
                                </td>
                            </tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    </div>);
const Dashboard = ({ projects = [], user, procurements = [], contracts = [], onSelectContract, onNavigate, inspections = [], weeklyPlans = [] }) => {
    const safeProjects = useMemo(() => Array.isArray(projects) ? projects : [], [projects]);
    const safeContracts = useMemo(() => Array.isArray(contracts) ? contracts : [], [contracts]);
    const safeProcurements = useMemo(() => Array.isArray(procurements) ? procurements : [], [procurements]);
    const safeInspections = useMemo(() => Array.isArray(inspections) ? inspections : [], [inspections]);
    const safeWeeklyPlans = useMemo(() => Array.isArray(weeklyPlans) ? weeklyPlans : [], [weeklyPlans]);
    const waterComplianceRate = useMemo(() => {
        const tests = safeInspections.filter(i => i.waterQualityTest).map(i => i.waterQualityTest);
        if (tests.length === 0)
            return 100;
        const compliant = tests.filter(t => t?.complianceStatus === 'Compliant').length;
        return Math.round((compliant / tests.length) * 100);
    }, [safeInspections]);
    const openDefectsCount = useMemo(() => {
        return safeInspections.reduce((sum, i) => sum + ((i.defects || []).filter(d => d.status === 'Open').length), 0);
    }, [safeInspections]);
    const [viewMode, setViewMode] = useState('overview');
    const [statusFilter, setStatusFilter] = useState('');
    const [zoneFilter, setZoneFilter] = useState('');
    const [programFilter, setProgramFilter] = useState(() => {
        return user?.assignedProgram && user.assignedProgram !== 'All Programs (Bureau Level)' ? user.assignedProgram : '';
    });
    const [insights, setInsights] = useState([]);
    const [isLoadingInsights, setIsLoadingInsights] = useState(true);
    const registeredPrograms = useMemo(() => {
        const progs = loadPrograms();
        const map = new Map();
        progs.forEach(p => { if (p && p.id)
            map.set(p.id, p); });
        return Array.from(map.values());
    }, []);
    const registeredNgos = useMemo(() => loadNgos(), []);
    const registeredStaff = useMemo(() => loadStaff(), []);
    const programBreakdown = useMemo(() => {
        return registeredPrograms.map(prog => {
            const progProjects = safeProjects.filter(p => p.program === prog.name || p.program === prog.code);
            const progBudget = progProjects.reduce((sum, p) => sum + (p.estimatedBudget || 0), 0);
            return {
                ...prog,
                schemesCount: progProjects.length,
                totalBudget: progBudget
            };
        });
    }, [registeredPrograms, safeProjects]);
    const fetchInsights = async () => {
        setIsLoadingInsights(true);
        const generatedInsights = await generateDashboardInsights(safeProjects, safeContracts, safeProcurements);
        setInsights(generatedInsights);
        setIsLoadingInsights(false);
    };
    useEffect(() => {
        if (user?.role === Role.ADMIN || user?.role === Role.CONTRACT_MANAGER || user?.role === Role.SUPERVISOR) {
            fetchInsights();
        }
        else {
            setIsLoadingInsights(false);
        }
    }, [safeProjects, safeContracts, safeProcurements, user?.role]);
    const filteredProjects = useMemo(() => {
        return safeProjects.filter(p => {
            const statusMatch = statusFilter ? p.status === statusFilter : true;
            const zoneMatch = zoneFilter ? p.zone === zoneFilter : true;
            const programMatch = programFilter ? (p.program === programFilter || (p.program && programFilter && p.program.toLowerCase() === programFilter.toLowerCase())) : true;
            return statusMatch && zoneMatch && programMatch;
        });
    }, [safeProjects, statusFilter, zoneFilter, programFilter]);
    // Schedule overview stats for the quick widget
    const scheduleStats = useMemo(() => {
        const total = safeProjects.length;
        let delayed = 0;
        let onTrack = 0;
        let completed = 0;
        const now = new Date();
        safeProjects.forEach(p => {
            if (p.status === ProjectStatus.COMPLETED || p.actualCompletionDate) {
                completed++;
            }
            else if (p.plannedCompletionDate) {
                const targetEnd = new Date(p.plannedCompletionDate);
                if (targetEnd < now && p.status !== ProjectStatus.COMPLETED) {
                    delayed++;
                }
                else {
                    onTrack++;
                }
            }
            else {
                onTrack++;
            }
        });
        return {
            total,
            completed,
            delayed,
            onTrack,
            onTrackRate: total > 0 ? Math.round(((total - delayed) / total) * 100) : 100
        };
    }, [safeProjects]);
    const AdminDashboard = () => (<div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <Card title="Total Projects" value={filteredProjects.length} icon={ICONS.briefcase} iconBg="bg-primary-500"/>
                 <Card title="Pending Reviews" value={safeProjects.filter(p => p.status === ProjectStatus.SUBMITTED).length} icon={ICONS.clock} iconBg="bg-warning-500"/>
                 <Card title="Total Budget (ETB)" value={filteredProjects.reduce((sum, p) => sum + p.estimatedBudget, 0).toLocaleString()} icon={ICONS.dollarSign} iconBg="bg-success-500"/>
                 <Card title="Active Contracts" value={safeContracts.filter(c => !c.completionDate).length} icon={ICONS.fileSignature} iconBg="bg-danger-500"/>
            </div>

            {/* Quick Timeline & Schedule Health Banner - Luminous Water Gradient */}
            <div className="bg-gradient-to-r from-[#034479] via-[#0560a8] to-[#04335c] rounded-2xl p-5 text-white shadow-md shadow-sky-900/15 border border-sky-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-cyan-400/20 text-cyan-200 rounded-lg border border-cyan-400/30">
                            {ICONS.clock}
                        </span>
                        <h3 className="text-base font-bold tracking-tight">Project Timeline &amp; Schedule Matrix</h3>
                        <span className="text-xs font-semibold text-cyan-200">
                            · {scheduleStats.onTrackRate}% On Schedule
                        </span>
                    </div>
                    <p className="text-xs text-sky-100/90">
                        Tracking planned vs. actual start and completion dates, milestone handovers, and variance for {safeProjects.length} regional projects.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-4 bg-white/15 px-4 py-2 rounded-xl backdrop-blur-xs text-xs border border-white/15">
                        <div>
                            <span className="text-sky-200 block text-[10px]">On Track</span>
                            <span className="font-bold text-emerald-300 text-sm">{scheduleStats.onTrack}</span>
                        </div>
                        <div className="h-6 w-px bg-white/20"></div>
                        <div>
                            <span className="text-sky-200 block text-[10px]">Delayed</span>
                            <span className="font-bold text-rose-300 text-sm">{scheduleStats.delayed}</span>
                        </div>
                        <div className="h-6 w-px bg-white/20"></div>
                        <div>
                            <span className="text-sky-200 block text-[10px]">Completed</span>
                            <span className="font-bold text-cyan-200 text-sm">{scheduleStats.completed}</span>
                        </div>
                    </div>

                    <button onClick={() => onNavigate && onNavigate('ngos')} className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer backdrop-blur-xs">
                        <span>{ICONS.building}</span>
                        <span>NGOs</span>
                    </button>

                    <button onClick={() => onNavigate && onNavigate('staff')} className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer backdrop-blur-xs">
                        <span>{ICONS.userCheck}</span>
                        <span>Staff</span>
                    </button>

                    <button onClick={() => onNavigate && onNavigate('gisMap')} className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
                        <span>{ICONS.gisMap}</span>
                        <span>GIS Regional Map</span>
                    </button>

                    <button onClick={() => onNavigate && onNavigate('inspection')} className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
                        <span>{ICONS.inspection}</span>
                        <span>Field QA/QC</span>
                    </button>

                    <button onClick={() => setViewMode('gantt')} className="px-3.5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
                        <span>Gantt Chart</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Site Operations, QA/QC & Weekly Plans Executive Hub */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-3 rounded-xl bg-sky-50 text-sky-600 flex-shrink-0 text-base">
                            🛡️
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">QA/QC Inspections</span>
                            <span className="text-xl font-black text-slate-900">{safeInspections.length} Logged</span>
                        </div>
                    </div>
                    <button type="button" onClick={() => onNavigate && onNavigate('inspection')} className="text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
                        View →
                    </button>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0 text-base">
                            💧
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">Water Quality Compliance</span>
                            <span className="text-xl font-black text-emerald-600">{waterComplianceRate}% Safe</span>
                        </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">
                        WHO · CES
                    </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 flex-shrink-0 text-base">
                            📋
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">Weekly Work Plans</span>
                            <span className="text-xl font-black text-slate-900">{safeWeeklyPlans.length} Active</span>
                        </div>
                    </div>
                    <button type="button" onClick={() => onNavigate && onNavigate('inspection')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
                        S-Curve →
                    </button>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-3 rounded-xl bg-amber-50 text-amber-600 flex-shrink-0 text-base">
                            ⚠️
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">Open Punch List Defects</span>
                            <span className="text-xl font-black text-amber-700">{openDefectsCount} Pending</span>
                        </div>
                    </div>
                    <span className={`text-xs font-bold ${openDefectsCount > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                        {openDefectsCount > 0 ? 'Action Required' : 'All Clear'}
                    </span>
                </div>
            </div>

            {/* Multi-Program Portfolios & Partner Infrastructure Strip */}
            <div className="bg-gradient-to-r from-[#033b6b] via-[#054d87] to-[#032e54] rounded-2xl p-5 text-white shadow-md shadow-sky-950/20 border border-sky-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2.5 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                        <span className="p-2 bg-cyan-400/20 text-cyan-200 rounded-xl text-lg border border-cyan-400/30">📁</span>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-cyan-200">
                                Multi-Program Funding Portfolios &amp; Implementing Partners
                            </h4>
                            <p className="text-[11px] text-sky-200/90">
                                Click any program card to instantly filter schemes across Oromia
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {programFilter && (<button onClick={() => setProgramFilter('')} className="px-2.5 py-1 text-[11px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 rounded-lg font-semibold transition-colors cursor-pointer">
                                Clear Filter ({programFilter}) ✕
                            </button>)}
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    {programBreakdown.map((prog) => {
            const isSelected = programFilter === prog.name || (programFilter && programFilter.toLowerCase() === prog.name.toLowerCase());
            return (<button key={prog.id} onClick={() => setProgramFilter(isSelected ? '' : prog.name)} className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${isSelected
                    ? 'bg-cyan-400/30 border-cyan-300 ring-2 ring-cyan-400/50 shadow-md'
                    : 'bg-white/10 hover:bg-white/15 border-white/15'}`}>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-200 truncate">{prog.code}</span>
                                    <span className={`text-[10px] font-bold flex items-center gap-1 ${prog.status === 'Active' ? 'text-emerald-300' : 'text-sky-300/70'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${prog.status === 'Active' ? 'bg-emerald-400' : 'bg-slate-400'}`}/>
                                        <span>{prog.status}</span>
                                    </span>
                                </div>
                                <h5 className="text-xs font-bold text-white line-clamp-1 mb-1">{prog.name}</h5>
                                <div className="flex items-baseline justify-between text-[11px] text-sky-100 mt-1">
                                    <span className="font-extrabold text-white">{prog.schemesCount} Schemes</span>
                                    <span className="text-[10px] text-cyan-300 font-semibold">{(prog.totalBudget / 1e6).toFixed(1)}M ETB</span>
                                </div>
                            </button>);
        })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2.5 border-t border-white/10 text-xs">
                    <div className="flex items-center gap-4 text-sky-200/90 flex-wrap">
                        <span>🤝 NGO Implementing Partners: <strong className="text-white">{registeredNgos.length} Registered</strong> ({registeredNgos.filter(n => n.status === 'Active').length} Active)</span>
                        <span>👥 WaSH Professional Personnel: <strong className="text-white">{registeredStaff.length} Staff</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onNavigate && onNavigate('ngos')} className="text-xs font-semibold text-cyan-300 hover:text-white underline cursor-pointer">
                            NGO Registry →
                        </button>
                        <span className="text-white/20">•</span>
                        <button onClick={() => onNavigate && onNavigate('staff')} className="text-xs font-semibold text-sky-300 hover:text-white underline cursor-pointer">
                            Staff Roster →
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-2xl border border-sky-100 shadow-xs p-4 flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 text-sky-950 font-bold text-sm flex-shrink-0">
                            <span className="text-cyan-600">🔍</span>
                            <span>Filter Schemes:</span>
                        </div>
                        <div className="flex-grow grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <select id="program-filter" value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className="w-full px-3 py-2 text-xs bg-sky-50/70 border border-sky-200 font-semibold text-sky-950 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all cursor-pointer">
                                <option value="">All Programs</option>
                                {(() => {
            const regProgs = loadPrograms().map(p => p.name);
            const allUnique = Array.from(new Set([...regProgs, ...PROGRAMS]));
            return allUnique.map(p => <option key={p} value={p}>{p}</option>);
        })()}
                            </select>
                            <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 text-xs bg-sky-50/70 border border-sky-200 font-semibold text-sky-950 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all cursor-pointer">
                                <option value="">All Statuses</option>
                                {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select id="zone-filter" value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="w-full px-3 py-2 text-xs bg-sky-50/70 border border-sky-200 font-semibold text-sky-950 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all cursor-pointer">
                                    <option value="">All Zones</option>
                                    {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                            <button onClick={() => { setStatusFilter(''); setZoneFilter(''); setProgramFilter(''); }} className="w-full px-4 py-2 text-xs border border-sky-200 text-sky-800 rounded-xl hover:bg-sky-50 font-bold transition-all cursor-pointer shadow-2xs">
                                Reset Filters
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProjectsByStatusChart data={filteredProjects}/>
                        <ProjectsByImplementingBodyChart data={filteredProjects}/>
                    </div>
                 </div>
                 <div className="lg:col-span-2 space-y-6">
                    <AIInsights insights={insights} isLoading={isLoadingInsights} onNavigate={onNavigate} onRefresh={fetchInsights}/>
                 </div>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 <div className="lg:col-span-3">
                     <ProjectTable title={`Displaying ${filteredProjects.length} Projects`} projects={filteredProjects} onNavigate={onNavigate}/>
                 </div>
                 <div className="lg:col-span-2">
                     <ProjectLocationMap data={filteredProjects}/>
                 </div>
             </div>
       </div>);
    const ReviewerDashboard = () => {
        const myProjects = safeProjects.filter(p => p.status === ProjectStatus.SUBMITTED || p.status === ProjectStatus.UNDER_REVIEW);
        return (<>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card title="Projects for Review" value={myProjects.length} icon={ICONS.review} iconBg="bg-warning-500"/>
                    <Card title="Approved Projects" value={safeProjects.filter(p => p.status === ProjectStatus.APPROVED).length} icon={ICONS.checkCircle} iconBg="bg-success-500"/>
                    <Card title="Rejected Projects" value={safeProjects.filter(p => p.status === ProjectStatus.REJECTED).length} icon={ICONS.alertTriangle} iconBg="bg-danger-500"/>
                </div>
                <ProjectTable title="Projects Pending Review" projects={myProjects} onNavigate={onNavigate}/>
            </>);
    };
    const UserDashboard = () => {
        const myProjects = safeProjects.filter(p => p.creator === user?.username);
        return (<>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card title="My Draft Projects" value={myProjects.filter(p => p.status === ProjectStatus.DRAFT).length} icon={ICONS.planning} iconBg="bg-slate-500"/>
                    <Card title="My Submitted Projects" value={myProjects.filter(p => p.status !== ProjectStatus.DRAFT).length} icon={ICONS.briefcase} iconBg="bg-primary-500"/>
                    <Card title="My Approved Projects" value={myProjects.filter(p => p.status === ProjectStatus.APPROVED).length} icon={ICONS.checkCircle} iconBg="bg-success-500"/>
                </div>
                 <ProjectTable title="My Projects" projects={myProjects} onNavigate={onNavigate}/>
            </>);
    };
    const ContractManagerDashboard = () => {
        const myContracts = safeContracts.filter(c => c.contractManager === user?.username);
        return (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card title="Active Contracts" value={myContracts.filter(c => !c.completionDate).length} icon={ICONS.fileSignature} iconBg="bg-danger-500"/>
                        <Card title="Completed Contracts" value={myContracts.filter(c => c.completionDate).length} icon={ICONS.checkCircle} iconBg="bg-success-500"/>
                        <Card title="Total Managed Contracts" value={myContracts.length} icon={ICONS.briefcase} iconBg="bg-primary-500"/>
                    </div>
                    <ContractTable title="My Managed Contracts" contracts={myContracts} onSelectContract={onSelectContract}/>
                </div>
                <div className="lg:col-span-1">
                    <AIInsights insights={insights} isLoading={isLoadingInsights} onNavigate={onNavigate} onRefresh={fetchInsights}/>
                </div>
            </div>);
    };
    const SupervisorDashboard = () => {
        const myContracts = safeContracts.filter(c => !user?.username || c.supervisor === user?.username || user?.role === Role.SUPERVISOR || user?.role === Role.TEAM_LEADER);
        const pendingInspections = safeInspections.filter(i => i.status !== 'Approved by Bureau Lead');
        const pendingWeeklyPlans = safeWeeklyPlans.filter(p => p.status === 'Submitted');
        return (<div className="space-y-6">
                {/* Supervisor Status & Jurisdiction Bar */}
                <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"/>
                            <h3 className="text-base font-bold tracking-tight">Resident Engineer &amp; Supervision Hub</h3>
                            <span className="text-xs font-semibold text-cyan-200">
                                · Jurisdiction: {user?.assignedTeam || user?.assignedZone || 'Assigned Schemes'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                            Technical oversight, site quality verification, inspection log approvals, and milestone sign-offs.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        <button onClick={() => onNavigate && onNavigate('inspection')} className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                            <span>{ICONS.inspection}</span>
                            <span>Review Inspections ({pendingInspections.length})</span>
                        </button>
                        <button onClick={() => onNavigate && onNavigate('gisMap')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-200 border border-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer">
                            <span>{ICONS.gisMap}</span>
                            <span>Team GIS Map</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card title="Supervised Schemes" value={safeProjects.length} icon={ICONS.briefcase} iconBg="bg-primary-500"/>
                    <Card title="Pending Inspections" value={pendingInspections.length} icon={ICONS.clock} iconBg="bg-warning-500"/>
                    <Card title="Weekly Work Plans" value={safeWeeklyPlans.length} icon={ICONS.planning} iconBg="bg-indigo-500"/>
                    <Card title="Active Contracts" value={myContracts.filter(c => !c.completionDate).length} icon={ICONS.fileSignature} iconBg="bg-emerald-500"/>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <ProjectTable title={`Supervised Water Schemes (${safeProjects.length})`} projects={safeProjects} onNavigate={onNavigate}/>
                        <ContractTable title="Active Contracts for Supervision" contracts={myContracts} onSelectContract={onSelectContract}/>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        {/* Action Queue */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <span className="p-1 rounded-md bg-amber-50 text-amber-700">{ICONS.alertTriangle}</span>
                                <span>Supervisor Approval Queue</span>
                            </h3>
                            <div className="space-y-2.5 text-xs">
                                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-amber-900">{pendingInspections.length} QA/QC Logbooks</p>
                                        <p className="text-[11px] text-amber-700">Awaiting technical supervisor verification</p>
                                    </div>
                                    <button onClick={() => onNavigate('inspection')} className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px]">
                                        Verify
                                    </button>
                                </div>
                                <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-sky-900">{pendingWeeklyPlans.length} Weekly Plans</p>
                                        <p className="text-[11px] text-sky-700">Submitted by field engineers</p>
                                    </div>
                                    <button onClick={() => onNavigate('inspection')} className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[11px]">
                                        Endorse
                                    </button>
                                </div>
                            </div>
                        </div>

                        <AIInsights insights={insights} isLoading={isLoadingInsights} onNavigate={onNavigate} onRefresh={fetchInsights}/>
                    </div>
                </div>
            </div>);
    };
    const EngineerDashboard = () => {
        const mySchemes = safeProjects;
        const myInspections = safeInspections;
        const myPlans = safeWeeklyPlans;
        return (<div className="space-y-6">
                {/* Field Engineer Welcome & Scope Banner */}
                <div className="bg-gradient-to-r from-teal-900 via-sky-900 to-slate-900 p-5 rounded-2xl text-white shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"/>
                            <h3 className="text-base font-bold tracking-tight">Field Engineering &amp; Site Log Hub</h3>
                            <span className="text-xs font-semibold text-emerald-200">
                                · Assigned Scope: {mySchemes.length} Water Schemes
                            </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                            Logged in as <strong>{user?.fullName || user?.username}</strong>. You have direct access to submit QA/QC verification logs, photos, and weekly work plans for your designated schemes.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        <button onClick={() => onNavigate && onNavigate('inspection')} className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
                            <span>{ICONS.inspection}</span>
                            <span>+ Log Site QA/QC</span>
                        </button>
                        <button onClick={() => onNavigate && onNavigate('gisMap')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-200 border border-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer">
                            <span>{ICONS.gisMap}</span>
                            <span>GPS Scheme Map</span>
                        </button>
                    </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card title="Assigned Schemes" value={mySchemes.length} icon={ICONS.briefcase} iconBg="bg-teal-600"/>
                    <Card title="QA/QC Logs Recorded" value={myInspections.length} icon={ICONS.checkCircle} iconBg="bg-primary-500"/>
                    <Card title="Weekly Plans Submitted" value={myPlans.length} icon={ICONS.planning} iconBg="bg-indigo-500"/>
                    <Card title="Water Quality Testing" value={`${waterComplianceRate}%`} icon={ICONS.shieldAlert} iconBg="bg-emerald-500"/>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <ProjectTable title={`My Assigned Water Infrastructure Schemes (${mySchemes.length})`} projects={mySchemes} onNavigate={onNavigate}/>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        {/* Quick Field Log Action Card */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="p-1 rounded-md bg-teal-50 text-teal-700">⚡</span>
                                <span>Quick Field Actions</span>
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">
                                Fast shortcuts to record site activities from the field:
                            </p>
                            <div className="space-y-2">
                                <button onClick={() => onNavigate('inspection')} className="w-full p-2.5 text-left rounded-xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200 transition-colors flex items-center justify-between text-xs font-semibold text-teal-900">
                                    <span>📝 Record Stage QA/QC Inspection</span>
                                    <span>→</span>
                                </button>
                                <button onClick={() => onNavigate('inspection')} className="w-full p-2.5 text-left rounded-xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200 transition-colors flex items-center justify-between text-xs font-semibold text-sky-900">
                                    <span>📅 Submit Weekly Work Plan</span>
                                    <span>→</span>
                                </button>
                                <button onClick={() => onNavigate('gisMap')} className="w-full p-2.5 text-left rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-colors flex items-center justify-between text-xs font-semibold text-emerald-900">
                                    <span>📍 Locate Schemes on GIS Map</span>
                                    <span>→</span>
                                </button>
                                <button onClick={() => onNavigate('documents')} className="w-full p-2.5 text-left rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between text-xs font-semibold text-slate-700">
                                    <span>📂 Feasibility &amp; EIA Study Vault</span>
                                    <span>→</span>
                                </button>
                            </div>
                        </div>

                        {/* Recent Inspection Logs */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                                <span>Recent QA/QC Field Logs</span>
                                <span className="text-xs text-cyan-600 font-bold cursor-pointer" onClick={() => onNavigate('inspection')}>All ({myInspections.length})</span>
                            </h3>
                            <div className="space-y-2.5">
                                {myInspections.slice(0, 3).map(insp => (<div key={insp.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-800 truncate">{insp.projectName}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">{insp.inspectionDate}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                                            <span>Stage: {insp.visitStage}</span>
                                            <span>·</span>
                                            <span className="font-semibold text-emerald-700">{insp.overallPhysicalProgressPct}% Done</span>
                                        </div>
                                    </div>))}
                                {myInspections.length === 0 && (<p className="text-xs text-slate-400 py-3 text-center">No inspection logs recorded yet.</p>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>);
    };
    const AuditorDashboard = () => {
        return (<div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 p-5 rounded-2xl text-white shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"/>
                            <h3 className="text-base font-bold tracking-tight">Independent Audit &amp; Compliance Hub</h3>
                            <span className="text-xs font-semibold text-purple-200">
                                · Global Read-Only Oversight
                            </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                            Auditing procurement award variances, contractor IPC settlements, environmental compliance, and unrectified site defects across Oromia.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => onNavigate('reporting')} className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer">
                            Executive Financial Reports
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card title="Audited Schemes" value={safeProjects.length} icon={ICONS.inspection} iconBg="bg-purple-600"/>
                    <Card title="Committed Budget (ETB)" value={safeProjects.reduce((sum, p) => sum + p.estimatedBudget, 0).toLocaleString()} icon={ICONS.dollarSign} iconBg="bg-emerald-600"/>
                    <Card title="Active Contracts" value={safeContracts.length} icon={ICONS.fileSignature} iconBg="bg-sky-600"/>
                    <Card title="Open Site Defects" value={openDefectsCount} icon={ICONS.alertTriangle} iconBg="bg-amber-600"/>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <ProjectTable title="Water Schemes Portfolio" projects={safeProjects} onNavigate={onNavigate}/>
                        <ContractTable title="Active Contracts Registry" contracts={safeContracts} onSelectContract={onSelectContract}/>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <AIInsights insights={insights} isLoading={isLoadingInsights} onNavigate={onNavigate} onRefresh={fetchInsights}/>
                    </div>
                </div>
            </div>);
    };
    const PlanningDashboard = () => (<div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Total Schemes" value={safeProjects.length} icon={ICONS.planning} iconBg="bg-sky-600"/>
                <Card title="Draft Formulations" value={safeProjects.filter(p => p.status === ProjectStatus.DRAFT).length} icon={ICONS.fileText} iconBg="bg-amber-500"/>
                <Card title="Approved for Tendering" value={safeProjects.filter(p => p.status === ProjectStatus.APPROVED).length} icon={ICONS.checkCircle} iconBg="bg-emerald-600"/>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ProjectTable title="Formulated Schemes Pipeline" projects={safeProjects} onNavigate={onNavigate}/>
                </div>
                <div className="lg:col-span-1">
                    <AIInsights insights={insights} isLoading={isLoadingInsights} onNavigate={onNavigate} onRefresh={fetchInsights}/>
                </div>
            </div>
        </div>);
    const FinanceDashboard = () => (<div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Total Allocated Budget (ETB)" value={safeProjects.reduce((s, p) => s + p.estimatedBudget, 0).toLocaleString()} icon={ICONS.dollarSign} iconBg="bg-emerald-600"/>
                <Card title="Active Contracts" value={safeContracts.filter(c => !c.completionDate).length} icon={ICONS.fileSignature} iconBg="bg-sky-600"/>
                <Card title="Completed Contracts" value={safeContracts.filter(c => c.completionDate).length} icon={ICONS.checkCircle} iconBg="bg-teal-600"/>
            </div>
            <ContractTable title="Contract Financial Records" contracts={safeContracts} onSelectContract={onSelectContract}/>
        </div>);
    const renderDashboardByRole = () => {
        switch (user?.role) {
            case Role.ADMIN:
            case Role.DIRECTOR:
            case Role.COORDINATOR:
                return <AdminDashboard />;
            case Role.ENGINEER:
                return <EngineerDashboard />;
            case Role.SUPERVISOR:
            case Role.TEAM_LEADER:
                return <SupervisorDashboard />;
            case Role.REVIEWER:
                return <ReviewerDashboard />;
            case Role.AUDITOR:
                return <AuditorDashboard />;
            case Role.PLANNING_OFFICER:
                return <PlanningDashboard />;
            case Role.FINANCE_OFFICER:
                return <FinanceDashboard />;
            case Role.CONTRACT_MANAGER:
                return <ContractManagerDashboard />;
            default:
                return <UserDashboard />;
        }
    };
    return (<div className="space-y-6">
            {/* Top Dashboard View Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Executive Dashboard</h2>
                    <p className="text-sm text-slate-500">
                        {viewMode === 'overview'
            ? 'High-level programmatic metrics, regional distribution, and AI insights.'
            : 'Project schedule Gantt visualization with planned vs. actual timelines and variance tracking.'}
                    </p>
                </div>

                {/* Switcher Pills */}
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-xs">
                    <button onClick={() => setViewMode('overview')} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${viewMode === 'overview'
            ? 'bg-white text-primary-700 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'}`}>
                        <span className="w-4 h-4">{ICONS.dashboard}</span>
                        <span>Overview & Analytics</span>
                    </button>
                    <button onClick={() => setViewMode('gantt')} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${viewMode === 'gantt'
            ? 'bg-white text-primary-700 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'}`}>
                        <span className="w-4 h-4">{ICONS.clock}</span>
                        <span>Project Timelines (Gantt Chart)</span>
                        <span className="text-[10px] font-bold text-cyan-800">
                            ({safeProjects.length})
                        </span>
                    </button>
                </div>
            </div>

            {/* View Mode Content */}
            {viewMode === 'overview' ? (renderDashboardByRole()) : (<div className="space-y-6">
                    <GanttTimelineChart projects={safeProjects} contracts={safeContracts} procurements={safeProcurements}/>
                </div>)}
        </div>);
};
export default Dashboard;
