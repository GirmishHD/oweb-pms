import React, { useState, useMemo } from 'react';
import { Role } from '../types';
import { Calendar, Clock, TrendingUp, Plus, Search, FileText, BarChart3, X, Download, HardHat, CloudSun } from 'lucide-react';
import { CascadingLocationSelector } from './common/CascadingLocationSelector';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
export const WeeklyTrackingSection = ({ plans = [], reports = [], projects = [], user, onAddPlan, onUpdatePlan, onAddReport, onUpdateReport, onNavigate }) => {
    const safeProjects = useMemo(() => Array.isArray(projects) ? projects : [], [projects]);
    const safePlans = useMemo(() => Array.isArray(plans) ? plans : [], [plans]);
    const safeReports = useMemo(() => Array.isArray(reports) ? reports : [], [reports]);
    const [subTab, setSubTab] = useState('plans');
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sCurveSelectedProjectId, setSCurveSelectedProjectId] = useState('ALL');
    // S-Curve time series progression data
    const sCurveData = useMemo(() => {
        const targetProj = sCurveSelectedProjectId !== 'ALL'
            ? safeProjects.find(p => p.id === sCurveSelectedProjectId)
            : null;
        const weeks = [28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38];
        return weeks.map(w => {
            const matchingReports = safeReports.filter(r => r.weekNumber === w && (!targetProj || r.projectId === targetProj.id));
            let actualProgress = null;
            let plannedProgress = null;
            if (matchingReports.length > 0) {
                actualProgress = Math.round(matchingReports.reduce((s, r) => s + r.cumulativePhysicalProgressPct, 0) / matchingReports.length);
                plannedProgress = Math.round(matchingReports.reduce((s, r) => s + r.plannedProgressPct, 0) / matchingReports.length);
            }
            else {
                // Model sigmoidal target curve
                const midpoint = 34;
                const slope = 0.55;
                const normalized = 1 / (1 + Math.exp(-slope * (w - midpoint)));
                plannedProgress = Math.round(Math.min(100, Math.max(10, normalized * 85 + 10)));
                if (w <= 34) {
                    const delta = targetProj ? (targetProj.id.charCodeAt(targetProj.id.length - 1) % 5) - 2 : -1;
                    actualProgress = Math.max(0, Math.min(100, plannedProgress + delta));
                }
            }
            return {
                weekLabel: `Wk ${w}`,
                weekNumber: w,
                Planned: plannedProgress,
                Actual: actualProgress
            };
        });
    }, [sCurveSelectedProjectId, safeProjects, safeReports]);
    // Detail Modal States
    const [viewingPlan, setViewingPlan] = useState(null);
    const [viewingReport, setViewingReport] = useState(null);
    // Create Plan Modal
    const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
    const [planProjectId, setPlanProjectId] = useState(() => safeProjects[0]?.id || '');
    const [planWeekNumber, setPlanWeekNumber] = useState(35);
    const [planStartDate, setPlanStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [planEndDate, setPlanEndDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    const [planTargetPct, setPlanTargetPct] = useState(5.0);
    const [planManpower, setPlanManpower] = useState(25);
    const [planEquipment, setPlanEquipment] = useState('1x Excavator, 1x Mixer, 2x Trucks');
    const [planMaterials, setPlanMaterials] = useState('Cement, HDPE pipes, Sand & Gravel');
    const [planWeatherNotes, setPlanWeatherNotes] = useState('Standard weather conditions forecast');
    const [planRegion, setPlanRegion] = useState('Oromia');
    const [planWoreda, setPlanWoreda] = useState('');
    const [planKebele, setPlanKebele] = useState('');
    const [activitiesList, setActivitiesList] = useState([
        {
            id: `act-${Date.now()}-1`,
            activityName: 'Pipeline trenching and bedding',
            unit: 'meters',
            plannedQuantity: 1500,
            weightPct: 50,
            assignedTo: 'Contractor Main Squad',
            status: 'Pending'
        },
        {
            id: `act-${Date.now()}-2`,
            activityName: 'Electro-mechanical chamber masonry',
            unit: 'm3',
            plannedQuantity: 30,
            weightPct: 50,
            assignedTo: 'Civil Team',
            status: 'Pending'
        }
    ]);
    const [newActName, setNewActName] = useState('');
    const [newActUnit, setNewActUnit] = useState('meters');
    const [newActQty, setNewActQty] = useState(100);
    const [newActWeight, setNewActWeight] = useState(25);
    // Create Report Modal
    const [isCreateReportOpen, setIsCreateReportOpen] = useState(false);
    const [reportProjectId, setReportProjectId] = useState(() => safeProjects[0]?.id || '');
    // Keep selected project ID synced if empty
    React.useEffect(() => {
        if (!planProjectId && safeProjects.length > 0) {
            setPlanProjectId(safeProjects[0].id);
        }
        if (!reportProjectId && safeProjects.length > 0) {
            setReportProjectId(safeProjects[0].id);
        }
    }, [safeProjects, planProjectId, reportProjectId]);
    const [reportPlanId, setReportPlanId] = useState('');
    const [reportWeekNum, setReportWeekNum] = useState(35);
    const [reportPrevPct, setReportPrevPct] = useState(50);
    const [reportThisWeekPct, setReportThisWeekPct] = useState(5.0);
    const [reportPlannedPct, setReportPlannedPct] = useState(55.0);
    const [reportLaborCount, setReportLaborCount] = useState(28);
    const [reportWeather, setReportWeather] = useState('Favorable');
    const [reportAccomplishment, setReportAccomplishment] = useState('');
    const [accomplishments, setAccomplishments] = useState([
        'Completed excavation for pipeline stretch'
    ]);
    const [reportChallenge, setReportChallenge] = useState('');
    const [challenges, setChallenges] = useState([
        'Minor rocky outcrop encountered'
    ]);
    const [reportAction, setReportAction] = useState('');
    const [correctiveActions, setCorrectiveActions] = useState([
        'Brought in auxiliary breaker attachment'
    ]);
    // Filtered Plans
    const filteredPlans = useMemo(() => {
        return safePlans.filter(p => {
            if (selectedProjectFilter !== 'ALL' && p.projectId !== selectedProjectFilter)
                return false;
            if (statusFilter !== 'ALL' && p.status !== statusFilter)
                return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const m1 = p.projectName.toLowerCase().includes(q);
                const m2 = p.woreda.toLowerCase().includes(q);
                const m3 = p.preparedByName.toLowerCase().includes(q);
                const m4 = p.id.toLowerCase().includes(q);
                if (!m1 && !m2 && !m3 && !m4)
                    return false;
            }
            return true;
        });
    }, [safePlans, selectedProjectFilter, statusFilter, searchQuery]);
    // Filtered Reports
    const filteredReports = useMemo(() => {
        return safeReports.filter(r => {
            if (selectedProjectFilter !== 'ALL' && r.projectId !== selectedProjectFilter)
                return false;
            if (statusFilter !== 'ALL' && r.status !== statusFilter)
                return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const m1 = r.projectName.toLowerCase().includes(q);
                const m2 = r.submittedByName.toLowerCase().includes(q);
                const m3 = r.id.toLowerCase().includes(q);
                if (!m1 && !m2 && !m3)
                    return false;
            }
            return true;
        });
    }, [safeReports, selectedProjectFilter, statusFilter, searchQuery]);
    // Stats
    const stats = useMemo(() => {
        const totalPlans = safePlans.length;
        const approvedPlans = safePlans.filter(p => p.status === 'Approved').length;
        const pendingPlans = safePlans.filter(p => p.status === 'Submitted').length;
        const totalReports = safeReports.length;
        const approvedReports = safeReports.filter(r => r.status === 'Approved').length;
        const avgPhysicalProgress = safeReports.length > 0
            ? Math.round(safeReports.reduce((s, r) => s + r.cumulativePhysicalProgressPct, 0) / safeReports.length)
            : 0;
        return { totalPlans, approvedPlans, pendingPlans, totalReports, approvedReports, avgPhysicalProgress };
    }, [safePlans, safeReports]);
    const handleAddActivity = () => {
        if (!newActName.trim())
            return;
        const act = {
            id: `act-${Date.now()}`,
            activityName: newActName,
            unit: newActUnit,
            plannedQuantity: newActQty,
            weightPct: newActWeight,
            status: 'Pending'
        };
        setActivitiesList(prev => [...prev, act]);
        setNewActName('');
    };
    const handleRemoveActivity = (id) => {
        setActivitiesList(prev => prev.filter(a => a.id !== id));
    };
    const handleSaveNewPlan = (e) => {
        e.preventDefault();
        const proj = safeProjects.find(p => p && p.id === planProjectId);
        if (!proj)
            return;
        const newPlan = {
            id: `WP-${new Date().getFullYear()}-W${planWeekNumber}-${String(Date.now()).slice(-3)}`,
            projectId: proj.id,
            projectName: proj.name,
            zone: proj.zone,
            woreda: planWoreda || proj.woreda,
            kebele: planKebele || proj.kebele,
            weekNumber: planWeekNumber,
            startDate: planStartDate,
            endDate: planEndDate,
            preparedByUserId: user.id || user.username,
            preparedByName: user.fullName || user.username,
            preparedDate: new Date().toISOString(),
            targetPhysicalProgressPct: planTargetPct,
            plannedActivities: activitiesList,
            resourcePlan: {
                manpowerCount: planManpower,
                equipmentOnSite: planEquipment.split(',').map(s => s.trim()),
                materialsRequired: planMaterials
            },
            weatherForecastNotes: planWeatherNotes,
            status: user.role === Role.ADMIN || user.role === Role.SUPERVISOR ? 'Approved' : 'Submitted',
            approvedBy: user.role === Role.ADMIN || user.role === Role.SUPERVISOR ? `${user.fullName || user.username} (Self-Signed)` : undefined,
            approvalDate: user.role === Role.ADMIN || user.role === Role.SUPERVISOR ? new Date().toISOString() : undefined,
            approvalRemarks: user.role === Role.ADMIN || user.role === Role.SUPERVISOR ? 'Formulated & validated for site execution.' : undefined
        };
        onAddPlan(newPlan);
        setIsCreatePlanOpen(false);
    };
    const handleSaveNewReport = (e) => {
        e.preventDefault();
        const proj = safeProjects.find(p => p && p.id === reportProjectId);
        if (!proj)
            return;
        const cumulative = Math.min(100, Math.round((reportPrevPct + reportThisWeekPct) * 10) / 10);
        const variance = Math.round((cumulative - reportPlannedPct) * 10) / 10;
        const newReport = {
            id: `REP-${new Date().getFullYear()}-W${reportWeekNum}-${String(Date.now()).slice(-3)}`,
            projectId: proj.id,
            projectName: proj.name,
            weeklyPlanId: reportPlanId || undefined,
            weekNumber: reportWeekNum,
            reportDate: new Date().toISOString(),
            submittedByUserId: user.id || user.username,
            submittedByName: `${user.fullName || user.username} (${user.role})`,
            previousPhysicalProgressPct: reportPrevPct,
            thisWeekPhysicalProgressPct: reportThisWeekPct,
            cumulativePhysicalProgressPct: cumulative,
            plannedProgressPct: reportPlannedPct,
            progressVariancePct: variance,
            status: user.role === Role.SUPERVISOR || user.role === Role.ADMIN ? 'Approved' : 'Submitted',
            endorsedByTeamLeader: undefined,
            approvedBySupervisor: user.role === Role.SUPERVISOR || user.role === Role.ADMIN ? user.fullName || user.username : undefined,
            approvalRemarks: user.role === Role.SUPERVISOR || user.role === Role.ADMIN ? 'Direct sign-off upon submission.' : undefined,
            siteLaborCount: reportLaborCount,
            weatherConditions: reportWeather,
            keyAccomplishments: accomplishments,
            challengesBottlenecks: challenges,
            correctiveActions: correctiveActions,
            sitePhotosCount: 3
        };
        onAddReport(newReport);
        setIsCreateReportOpen(false);
    };
    const handleApprovePlan = (plan) => {
        const updated = {
            ...plan,
            status: 'Approved',
            approvedBy: `${user.fullName || user.username} (${user.role})`,
            approvalDate: new Date().toISOString(),
            approvalRemarks: 'Endorsed for execution by technical leadership.'
        };
        onUpdatePlan(updated);
        if (viewingPlan?.id === plan.id)
            setViewingPlan(updated);
    };
    const handleEndorseReport = (report) => {
        const updated = {
            ...report,
            status: 'Endorsed',
            endorsedByTeamLeader: `${user.fullName || user.username} (${user.role})`,
            approvalRemarks: 'Technical milestone verified and forwarded for final supervisor certification.'
        };
        onUpdateReport(updated);
        if (viewingReport?.id === report.id)
            setViewingReport(updated);
    };
    const handleApproveReport = (report) => {
        const updated = {
            ...report,
            status: 'Approved',
            approvedBySupervisor: `${user.fullName || user.username} (${user.role})`,
            approvalRemarks: 'Final physical progress certified and synchronized with PB-PMS registry.'
        };
        onUpdateReport(updated);
        if (viewingReport?.id === report.id)
            setViewingReport(updated);
    };
    const handleExportPlansExcel = () => {
        const rows = filteredPlans.map(p => ({
            'Plan ID': p.id,
            'Project ID': p.projectId,
            'Project Name': p.projectName,
            'Zone': p.zone,
            'Woreda': p.woreda,
            'Kebele': p.kebele || 'N/A',
            'Week': `Week ${p.weekNumber}`,
            'Start Date': p.startDate,
            'End Date': p.endDate,
            'Target Progress (%)': `${p.targetPhysicalProgressPct}%`,
            'Activities Count': p.plannedActivities.length,
            'Labor Planned': p.resourcePlan.manpowerCount,
            'Status': p.status,
            'Prepared By': p.preparedByName,
            'Approved By': p.approvedBy || 'Pending'
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Weekly_Work_Plans');
        XLSX.writeFile(wb, `OWEB_Weekly_Work_Plans_${new Date().toISOString().split('T')[0]}.xlsx`);
    };
    const handleExportReportsExcel = () => {
        const rows = filteredReports.map(r => ({
            'Report ID': r.id,
            'Project ID': r.projectId,
            'Project Name': r.projectName,
            'Zone': r.zone,
            'Woreda': r.woreda,
            'Week': `Week ${r.weekNumber}`,
            'Submission Date': r.submissionDate,
            'Progress Cumulative (%)': `${r.cumulativePhysicalProgressPct}%`,
            'Planned Target (%)': `${r.plannedProgressPct}%`,
            'Labor on Site': r.actualLaborCount,
            'Weather Impact': r.weatherImpact,
            'Submitted By': r.submittedByName,
            'Certified By': r.certifiedBy || 'Pending'
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Weekly_Progress_Reports');
        XLSX.writeFile(wb, `OWEB_Weekly_Progress_Reports_${new Date().toISOString().split('T')[0]}.xlsx`);
    };
    const handleExportSCurvePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.setTextColor(6, 32, 60);
        doc.text('OROMIA WATER RESOURCE BUREAU (OWEB)', 14, 15);
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        doc.text('Weekly S-Curve Physical Progress & Schedule Variance Report', 14, 22);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })} | Bureau Quality & Execution Control`, 14, 28);
        const tableData = safeProjects.map(proj => {
            const projReports = safeReports.filter(r => r.projectId === proj.id);
            const latestRep = projReports[projReports.length - 1];
            const cumProg = latestRep ? latestRep.cumulativePhysicalProgressPct : 50;
            const planProg = latestRep ? latestRep.plannedProgressPct : 52;
            const variance = Math.round((cumProg - planProg) * 10) / 10;
            return [
                proj.id,
                proj.name,
                proj.zone,
                proj.woreda,
                `${cumProg}%`,
                `${planProg}%`,
                variance >= 0 ? `+${variance}% (Ahead)` : `${variance}% (Lag)`,
                latestRep ? `Week ${latestRep.weekNumber}` : 'Pending'
            ];
        });
        autoTable(doc, {
            startY: 33,
            head: [['Project ID', 'Scheme Name', 'Zone', 'Woreda', 'Actual %', 'Plan %', 'Variance', 'Latest Week']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [6, 32, 60] },
            styles: { fontSize: 8 },
        });
        doc.save(`OWEB_SCurve_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    return (<div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#06203c] via-[#072a4d] to-[#041a30] text-white p-6 sm:p-7 rounded-3xl border border-cyan-900/60 shadow-xl shadow-cyan-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              Site Operations & Execution Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              Engineer Workflows (Weekly Plans &amp; Reports)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Weekly Work Plans &amp; Site Progress Reports
          </h2>
          <p className="text-xs sm:text-sm text-sky-200/80 mt-1 max-w-2xl">
            Empower resident engineers and supervisors to submit detailed weekly activity targets, track labor &amp; logistics, and log certified physical progress milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button onClick={handleExportPlansExcel} className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-colors flex items-center gap-1.5 cursor-pointer">
            <Download className="w-3.5 h-3.5"/>
            <span>Export Registry</span>
          </button>
          
          <button onClick={() => setIsCreatePlanOpen(true)} className="px-3.5 py-2 text-xs font-bold bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4"/>
            <span>New Weekly Plan</span>
          </button>

          <button onClick={() => setIsCreateReportOpen(true)} className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4"/>
            <span>Submit Progress Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Weekly Work Plans</span>
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
              <Calendar className="w-4 h-4"/>
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.totalPlans}</p>
          <div className="flex items-center gap-2 mt-1 text-[11px]">
            <span className="text-emerald-700 font-semibold">{stats.approvedPlans} Approved</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-700 font-semibold">{stats.pendingPlans} Pending</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Progress Reports Logged</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <FileText className="w-4 h-4"/>
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.totalReports}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.approvedReports} verified by resident supervisor
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Avg Physical Progress</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <TrendingUp className="w-4 h-4"/>
            </span>
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">{stats.avgPhysicalProgress}%</p>
          <p className="text-[11px] text-slate-400 mt-1">Across active schemes</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Assigned Schemes</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <HardHat className="w-4 h-4"/>
            </span>
          </div>
          <p className="text-2xl font-black text-purple-900 mt-2">{safeProjects.length}</p>
          <p className="text-[11px] text-purple-600 mt-1 font-semibold">
            Filtered by active data scope
          </p>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-sky-100 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1">
          <button onClick={() => setSubTab('plans')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${subTab === 'plans'
            ? 'bg-white text-cyan-900 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'}`}>
            <Calendar className="w-3.5 h-3.5 text-cyan-600"/>
            <span>Weekly Work Plans ({safePlans.length})</span>
          </button>

          <button onClick={() => setSubTab('reports')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${subTab === 'reports'
            ? 'bg-white text-emerald-900 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'}`}>
            <FileText className="w-3.5 h-3.5 text-emerald-600"/>
            <span>Weekly Site Reports ({safeReports.length})</span>
          </button>

          <button onClick={() => setSubTab('sCurve')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${subTab === 'sCurve'
            ? 'bg-white text-blue-900 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'}`}>
            <BarChart3 className="w-3.5 h-3.5 text-blue-600"/>
            <span>Progress Variance &amp; Milestones</span>
          </button>
        </div>

        {/* Global Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
            <input type="text" placeholder="Search plan, scheme, woreda..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 w-44 sm:w-56"/>
          </div>

          <select value={selectedProjectFilter} onChange={e => setSelectedProjectFilter(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none">
            <option value="ALL">All Schemes ({safeProjects.length})</option>
            {safeProjects.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none">
            <option value="ALL">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Submitted">Submitted</option>
            <option value="Endorsed">Endorsed</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* TAB 1: WEEKLY WORK PLANS */}
      {subTab === 'plans' && (<div className="bg-white rounded-3xl border border-sky-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Plan Ref &amp; Week</th>
                  <th className="px-4 py-3.5">Project Scheme</th>
                  <th className="px-4 py-3.5">Location (Hierarchy)</th>
                  <th className="px-4 py-3.5 text-center">Activities</th>
                  <th className="px-4 py-3.5 text-right">Target Progress</th>
                  <th className="px-4 py-3.5">Prepared By</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.map(plan => (<tr key={plan.id} className="hover:bg-sky-50/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-bold text-slate-900">{plan.id}</div>
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md mt-0.5">
                        <Clock className="w-3 h-3"/>
                        <span>Week {plan.weekNumber}</span>
                        <span className="text-slate-400">({plan.startDate.slice(5)} to {plan.endDate.slice(5)})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 max-w-xs truncate" title={plan.projectName}>
                        {plan.projectName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{plan.projectId}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <div className="font-semibold text-slate-800">{plan.zone} Zone</div>
                      <div className="text-[11px] text-slate-400">{plan.woreda}{plan.kebele ? `, ${plan.kebele}` : ''}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        {plan.plannedActivities.length} Tasks
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-extrabold text-cyan-700 text-sm">
                      +{plan.targetPhysicalProgressPct}%
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{plan.preparedByName}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(plan.preparedDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${plan.status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : plan.status === 'Submitted'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'}`}>
                        {plan.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button type="button" onClick={() => setViewingPlan(plan)} className="px-2.5 py-1 text-xs font-semibold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 rounded-lg border border-cyan-200 transition-colors cursor-pointer">
                          View Plan
                        </button>
                        {plan.status !== 'Approved' && (user.role === Role.ADMIN || user.role === Role.SUPERVISOR || user.role === Role.TEAM_LEADER) && (<button type="button" onClick={() => handleApprovePlan(plan)} className="px-2 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer" title="Approve Plan">
                            ✓ Approve
                          </button>)}
                      </div>
                    </td>
                  </tr>))}
                {filteredPlans.length === 0 && (<tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No weekly work plans match the selected filters.
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>)}

      {/* TAB 2: WEEKLY SITE PROGRESS REPORTS */}
      {subTab === 'reports' && (<div className="bg-white rounded-3xl border border-sky-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Report ID &amp; Date</th>
                  <th className="px-4 py-3.5">Project Scheme</th>
                  <th className="px-4 py-3.5 text-right">This Week Progress</th>
                  <th className="px-4 py-3.5 text-right">Cumulative (%)</th>
                  <th className="px-4 py-3.5 text-center">Variance vs Plan</th>
                  <th className="px-4 py-3.5">Submitted By</th>
                  <th className="px-4 py-3.5 text-center">Status &amp; Sign-off</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map(rep => (<tr key={rep.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-bold text-slate-900">{rep.id}</div>
                      <div className="text-[10px] text-slate-400">
                        Week {rep.weekNumber} • {new Date(rep.reportDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 max-w-xs truncate" title={rep.projectName}>
                        {rep.projectName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{rep.projectId}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                      +{rep.thisWeekPhysicalProgressPct}%
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="font-mono font-black text-slate-900 text-sm">
                        {rep.cumulativePhysicalProgressPct}%
                      </div>
                      <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden ml-auto mt-1">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, rep.cumulativePhysicalProgressPct)}%` }}/>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${rep.progressVariancePct >= 0
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                        {rep.progressVariancePct >= 0 ? `+${rep.progressVariancePct}%` : `${rep.progressVariancePct}%`}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{rep.submittedByName}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <CloudSun className="w-3 h-3 text-amber-500"/>
                        <span>{rep.weatherConditions}</span>
                        <span>•</span>
                        <span>{rep.siteLaborCount} labor</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="space-y-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${rep.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : rep.status === 'Endorsed'
                        ? 'bg-cyan-100 text-cyan-800'
                        : 'bg-amber-100 text-amber-800'}`}>
                          {rep.status}
                        </span>
                        {rep.approvedBySupervisor && (<div className="text-[9px] text-slate-500 truncate" title={rep.approvedBySupervisor}>
                            Signed: {rep.approvedBySupervisor}
                          </div>)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button type="button" onClick={() => setViewingReport(rep)} className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer">
                          View Report
                        </button>

                        {rep.status === 'Submitted' && (user.role === Role.TEAM_LEADER || user.role === Role.COORDINATOR || user.role === Role.ADMIN) && (<button type="button" onClick={() => handleEndorseReport(rep)} className="px-2 py-1 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-lg transition-colors cursor-pointer" title="Endorse report as Team Leader">
                            Endorse
                          </button>)}

                        {rep.status !== 'Approved' && (user.role === Role.SUPERVISOR || user.role === Role.ADMIN) && (<button type="button" onClick={() => handleApproveReport(rep)} className="px-2 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer" title="Certify & approve report">
                            Certify
                          </button>)}
                      </div>
                    </td>
                  </tr>))}
                {filteredReports.length === 0 && (<tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No weekly progress reports match the selected filters.
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>)}

      {/* TAB 3: S-CURVE & PROGRESS COMPARISON */}
      {subTab === 'sCurve' && (<div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {safeProjects.map(proj => {
                const projReports = safeReports.filter(r => r.projectId === proj.id);
                const latestRep = projReports[projReports.length - 1];
                const cumProg = latestRep ? latestRep.cumulativePhysicalProgressPct : 50;
                const planProg = latestRep ? latestRep.plannedProgressPct : 52;
                const variance = Math.round((cumProg - planProg) * 10) / 10;
                return (<div key={proj.id} className="bg-white p-5 rounded-3xl border border-sky-100 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{proj.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{proj.id} • {proj.zone} Zone ({proj.woreda})</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${variance >= 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                      {variance >= 0 ? `+${variance}% Ahead` : `${variance}% Lag`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Actual Physical Progress</span>
                      <span className="text-emerald-700 font-bold">{cumProg}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${cumProg}%` }}/>
                    </div>

                    <div className="flex justify-between text-xs font-semibold pt-1">
                      <span className="text-slate-600">Baseline Target Plan</span>
                      <span className="text-cyan-700 font-bold">{planProg}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-600 h-full rounded-full transition-all duration-500" style={{ width: `${planProg}%` }}/>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Lead Engineer:</span>
                      <span className="font-semibold text-slate-800">{proj.assignedEngineerName || 'Bureau Assigned'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Supervisor:</span>
                      <span className="font-semibold text-slate-800">{proj.assignedSupervisorName || 'Zonal Supervisor'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Last Report Logged:</span>
                      <span className="font-mono text-cyan-800">{latestRep ? `Week ${latestRep.weekNumber}` : 'Pending Report'}</span>
                    </div>
                  </div>
                </div>);
            })}
          </div>
        </div>)}

      {/* CREATE PLAN MODAL */}
      {isCreatePlanOpen && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-8">
            <form onSubmit={handleSaveNewPlan}>
              <div className="p-5 bg-gradient-to-r from-[#06203c] to-[#041a30] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-cyan-500/30 rounded-xl">
                    <Calendar className="w-5 h-5 text-cyan-300"/>
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white">Create Weekly Work Plan</h3>
                    <p className="text-xs text-sky-200/80">Plan task execution &amp; allocate site resources for the week</p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsCreatePlanOpen(false)} className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Scheme & Location Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Scheme</label>
                    <select value={planProjectId} onChange={e => setPlanProjectId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500" required>
                      {safeProjects.map(p => (<option key={p.id} value={p.id}>{p.name} ({p.id})</option>))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Week Number</label>
                    <input type="number" min={1} max={52} value={planWeekNumber} onChange={e => setPlanWeekNumber(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500" required/>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Execution Start Date</label>
                    <input type="date" value={planStartDate} onChange={e => setPlanStartDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500" required/>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Execution End Date</label>
                    <input type="date" value={planEndDate} onChange={e => setPlanEndDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500" required/>
                  </div>
                </div>

                {/* Cascading Administrative Location Selector */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Centralized Location (Region → Woreda → Kebele)
                  </label>
                  <CascadingLocationSelector initialRegion={planRegion} initialWoreda={planWoreda} initialKebele={planKebele} onLocationChange={(loc) => {
                setPlanRegion(loc.region);
                setPlanWoreda(loc.woreda);
                setPlanKebele(loc.kebele);
            }} required/>
                </div>

                {/* Activities Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Planned Work Activities ({activitiesList.length})
                    </label>
                    <span className="text-[11px] text-cyan-700 font-bold">
                      Target Incremental Progress: +{planTargetPct}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    {activitiesList.map((act, idx) => (<div key={act.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800">{act.activityName}</p>
                            <p className="text-[10px] text-slate-400">
                              Qty: {act.plannedQuantity} {act.unit} • Weight: {act.weightPct}%
                            </p>
                          </div>
                        </div>
                        <button type="button" onClick={() => handleRemoveActivity(act.id)} className="text-rose-600 hover:text-rose-800 text-xs font-bold p-1 cursor-pointer">
                          ✕
                        </button>
                      </div>))}
                  </div>

                  {/* Add Activity Sub-form */}
                  <div className="p-3 bg-cyan-50/60 rounded-xl border border-cyan-200 space-y-2">
                    <p className="text-[11px] font-bold text-cyan-900">Add Activity Line Item</p>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input type="text" placeholder="Activity name (e.g. trenching)" value={newActName} onChange={e => setNewActName(e.target.value)} className="sm:col-span-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"/>
                      <input type="text" placeholder="Unit (m, m3, pcs)" value={newActUnit} onChange={e => setNewActUnit(e.target.value)} className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"/>
                      <input type="number" placeholder="Qty" value={newActQty} onChange={e => setNewActQty(Number(e.target.value))} className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"/>
                    </div>
                    <button type="button" onClick={handleAddActivity} className="px-3 py-1 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-bold transition cursor-pointer">
                      + Add Activity
                    </button>
                  </div>
                </div>

                {/* Resource Plan */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Manpower Required</label>
                    <input type="number" value={planManpower} onChange={e => setPlanManpower(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"/>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Equipment on Site</label>
                    <input type="text" value={planEquipment} onChange={e => setPlanEquipment(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"/>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Materials Requisition</label>
                  <input type="text" value={planMaterials} onChange={e => setPlanMaterials(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"/>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
                <button type="button" onClick={() => setIsCreatePlanOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 rounded-xl shadow-sm">
                  Submit Weekly Plan
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* CREATE PROGRESS REPORT MODAL */}
      {isCreateReportOpen && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-8">
            <form onSubmit={handleSaveNewReport}>
              <div className="p-5 bg-gradient-to-r from-[#06203c] to-[#041a30] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-emerald-500/30 rounded-xl">
                    <FileText className="w-5 h-5 text-emerald-300"/>
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white">Submit Weekly Progress Report</h3>
                    <p className="text-xs text-emerald-200/80">Certify physical milestones, site labor, and challenges</p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsCreateReportOpen(false)} className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Scheme</label>
                    <select value={reportProjectId} onChange={e => setReportProjectId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
                      {safeProjects.map(p => (<option key={p.id} value={p.id}>{p.name} ({p.id})</option>))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Report Week #</label>
                    <input type="number" value={reportWeekNum} onChange={e => setReportWeekNum(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" required/>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Previous Progress (%)</label>
                    <input type="number" step="0.1" value={reportPrevPct} onChange={e => setReportPrevPct(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" required/>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">This Week Progress (%)</label>
                    <input type="number" step="0.1" value={reportThisWeekPct} onChange={e => setReportThisWeekPct(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-emerald-700" required/>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Planned Target (%)</label>
                    <input type="number" step="0.1" value={reportPlannedPct} onChange={e => setReportPlannedPct(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" required/>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Active Labor on Site</label>
                    <input type="number" value={reportLaborCount} onChange={e => setReportLaborCount(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" required/>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Weather Conditions</label>
                  <select value={reportWeather} onChange={e => setReportWeather(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
                    <option value="Favorable">Favorable (Optimal Site Work)</option>
                    <option value="Intermittent Rain">Intermittent Rain (Minor Slowdown)</option>
                    <option value="Heavy Flooding">Heavy Flooding (Work Suspended)</option>
                    <option value="High Temperature">High Temperature (Adjusted Shift)</option>
                  </select>
                </div>

                {/* Accomplishments */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Key Accomplishments This Week</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="e.g. 500m pipe pressure tested successfully" value={reportAccomplishment} onChange={e => setReportAccomplishment(e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"/>
                    <button type="button" onClick={() => {
                if (reportAccomplishment.trim()) {
                    setAccomplishments(prev => [...prev, reportAccomplishment.trim()]);
                    setReportAccomplishment('');
                }
            }} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">
                      + Add
                    </button>
                  </div>
                  <ul className="space-y-1 text-xs">
                    {accomplishments.map((acc, i) => (<li key={i} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg text-emerald-900">
                        <span>✓ {acc}</span>
                        <button type="button" onClick={() => setAccomplishments(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-600 font-bold">
                          ✕
                        </button>
                      </li>))}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
                <button type="button" onClick={() => setIsCreateReportOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm">
                  Submit Certified Report
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* VIEW PLAN MODAL */}
      {viewingPlan && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 my-8">
            <div className="p-5 bg-gradient-to-r from-[#06203c] to-[#041a30] text-white flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/30 text-cyan-200 font-mono">
                  {viewingPlan.id}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{viewingPlan.projectName}</h3>
                <p className="text-xs text-sky-200/80">Week {viewingPlan.weekNumber} ({viewingPlan.startDate} to {viewingPlan.endDate})</p>
              </div>
              <button onClick={() => setViewingPlan(null)} className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Target Progress:</span>
                  <span className="text-base font-extrabold text-cyan-700">+{viewingPlan.targetPhysicalProgressPct}%</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Status:</span>
                  <span className="text-xs font-bold text-emerald-700">{viewingPlan.status}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Activities Checklist ({viewingPlan.plannedActivities.length})</h4>
                <div className="space-y-2">
                  {viewingPlan.plannedActivities.map((act, i) => (<div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-800">{i + 1}. {act.activityName}</p>
                        <p className="text-[10px] text-slate-500">
                          {act.plannedQuantity} {act.unit} • Weight: {act.weightPct}%
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                        {act.status}
                      </span>
                    </div>))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <p><strong>Labor:</strong> {viewingPlan.resourcePlan.manpowerCount} workers planned</p>
                <p><strong>Equipment:</strong> {viewingPlan.resourcePlan.equipmentOnSite.join(', ')}</p>
                <p><strong>Materials:</strong> {viewingPlan.resourcePlan.materialsRequired}</p>
                {viewingPlan.weatherForecastNotes && <p><strong>Weather:</strong> {viewingPlan.weatherForecastNotes}</p>}
                {viewingPlan.approvalRemarks && (<p className="text-emerald-800 font-semibold pt-1 border-t border-slate-200">
                    Remarks: {viewingPlan.approvalRemarks}
                  </p>)}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setViewingPlan(null)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl">
                Close
              </button>
              {viewingPlan.status !== 'Approved' && (user.role === Role.ADMIN || user.role === Role.SUPERVISOR || user.role === Role.TEAM_LEADER) && (<button onClick={() => handleApprovePlan(viewingPlan)} className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                  Approve Plan
                </button>)}
            </div>
          </div>
        </div>)}

      {/* VIEW REPORT MODAL */}
      {viewingReport && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 my-8">
            <div className="p-5 bg-gradient-to-r from-[#06203c] to-[#041a30] text-white flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/30 text-emerald-200 font-mono">
                  {viewingReport.id}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{viewingReport.projectName}</h3>
                <p className="text-xs text-emerald-200/80">Week {viewingReport.weekNumber} Progress Report</p>
              </div>
              <button onClick={() => setViewingReport(null)} className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] text-emerald-800 uppercase block font-semibold">Cumulative Progress</span>
                  <span className="text-xl font-black text-emerald-900">{viewingReport.cumulativePhysicalProgressPct}%</span>
                </div>
                <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 text-center">
                  <span className="text-[10px] text-cyan-800 uppercase block font-semibold">This Week</span>
                  <span className="text-xl font-black text-cyan-900">+{viewingReport.thisWeekPhysicalProgressPct}%</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Variance vs Plan</span>
                  <span className={`text-xl font-black ${viewingReport.progressVariancePct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {viewingReport.progressVariancePct >= 0 ? `+${viewingReport.progressVariancePct}%` : `${viewingReport.progressVariancePct}%`}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase mb-1.5">Accomplishments</h4>
                <ul className="space-y-1">
                  {viewingReport.keyAccomplishments.map((a, i) => (<li key={i} className="p-2 bg-emerald-50/70 rounded-lg text-emerald-950 font-medium">
                      ✓ {a}
                    </li>))}
                </ul>
              </div>

              {viewingReport.challengesBottlenecks.length > 0 && (<div>
                  <h4 className="font-bold text-slate-800 uppercase mb-1.5">Challenges &amp; Bottlenecks</h4>
                  <ul className="space-y-1">
                    {viewingReport.challengesBottlenecks.map((c, i) => (<li key={i} className="p-2 bg-amber-50/80 rounded-lg text-amber-950 font-medium">
                        ⚠ {c}
                      </li>))}
                  </ul>
                </div>)}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p><strong>Submitted by:</strong> {viewingReport.submittedByName}</p>
                <p><strong>Labor on Site:</strong> {viewingReport.siteLaborCount} workers</p>
                <p><strong>Weather:</strong> {viewingReport.weatherConditions}</p>
                {viewingReport.endorsedByTeamLeader && <p><strong>Team Leader Endorsement:</strong> {viewingReport.endorsedByTeamLeader}</p>}
                {viewingReport.approvedBySupervisor && <p><strong>Supervisor Certification:</strong> {viewingReport.approvedBySupervisor}</p>}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setViewingReport(null)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl">
                Close
              </button>
              {viewingReport.status === 'Submitted' && (user.role === Role.TEAM_LEADER || user.role === Role.COORDINATOR || user.role === Role.ADMIN) && (<button onClick={() => handleEndorseReport(viewingReport)} className="px-4 py-2 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-xl">
                  Endorse Report
                </button>)}
              {viewingReport.status !== 'Approved' && (user.role === Role.SUPERVISOR || user.role === Role.ADMIN) && (<button onClick={() => handleApproveReport(viewingReport)} className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                  Certify &amp; Approve
                </button>)}
            </div>
          </div>
        </div>)}
    </div>);
};
