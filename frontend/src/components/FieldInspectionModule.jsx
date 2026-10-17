import React, { useState, useMemo } from 'react';
import { Role } from '../types';
import { ZONES, PROGRAMS, ICONS } from '../constants';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WeeklyTrackingSection } from './WeeklyTrackingSection';
const STAGE_BADGES = {
    'Pre-Construction': { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-700' },
    'Excavation & Foundations': { bg: 'bg-amber-50 border-amber-300', text: 'text-amber-800' },
    'Pipelaying & Pressure Test': { bg: 'bg-sky-50 border-sky-300', text: 'text-sky-800' },
    'Electromechanical Installation': { bg: 'bg-indigo-50 border-indigo-300', text: 'text-indigo-800' },
    'Pre-Commissioning': { bg: 'bg-purple-50 border-purple-300', text: 'text-purple-800' },
    'Final Handover & Defect Liability': { bg: 'bg-emerald-50 border-emerald-300', text: 'text-emerald-800' },
};
const RATING_BADGES = {
    'Exceptional': { bg: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-800' },
    'Satisfactory': { bg: 'bg-sky-100 text-sky-800', text: 'text-sky-800' },
    'Needs Improvement': { bg: 'bg-amber-100 text-amber-800', text: 'text-amber-800' },
    'Unacceptable': { bg: 'bg-rose-100 text-rose-800', text: 'text-rose-800' },
};
const FieldInspectionModule = ({ projects = [], user, inspections: propsInspections, onAddInspection, onUpdateInspection, onNavigate, weeklyPlans = [], weeklyReports = [], onAddWeeklyPlan, onUpdateWeeklyPlan, onAddWeeklyReport, onUpdateWeeklyReport, }) => {
    const safeProjects = useMemo(() => Array.isArray(projects) ? projects : [], [projects]);
    const [activeSection, setActiveSection] = useState('inspections');
    // Live database-backed inspections synchronized with backend API
    const [inspectionList, setInspectionList] = useState(propsInspections || []);
    React.useEffect(() => {
        if (propsInspections) {
            setInspectionList(propsInspections);
        }
    }, [propsInspections]);
    // Filters
    const [selectedProgram, setSelectedProgram] = useState(() => {
        return user.assignedProgram && user.assignedProgram !== 'All Programs (Bureau Level)' ? user.assignedProgram : '';
    });
    const [selectedZone, setSelectedZone] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedStage, setSelectedStage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);
    // Modal state for adding new inspection
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newLogProjectId, setNewLogProjectId] = useState(() => safeProjects[0]?.id || '');
    React.useEffect(() => {
        if (!newLogProjectId && safeProjects.length > 0) {
            setNewLogProjectId(safeProjects[0].id);
        }
    }, [safeProjects, newLogProjectId]);
    const [newLogStage, setNewLogStage] = useState('Excavation & Foundations');
    const [newLogProgress, setNewLogProgress] = useState(50);
    const [newLogRating, setNewLogRating] = useState('Satisfactory');
    const [newLogRemarks, setNewLogRemarks] = useState('');
    const [newLogActions, setNewLogActions] = useState('');
    const [newLogNextVisit, setNewLogNextVisit] = useState('');
    // Water quality sub-form in create modal
    const [includeWaterQuality, setIncludeWaterQuality] = useState(false);
    const [waterPh, setWaterPh] = useState(7.2);
    const [waterTurbidity, setWaterTurbidity] = useState(1.5);
    const [waterTds, setWaterTds] = useState(380);
    const [waterChlorine, setWaterChlorine] = useState(0.3);
    const [waterFluoride, setWaterFluoride] = useState(0.9);
    const [waterEcoli, setWaterEcoli] = useState(0);
    const [waterLabName, setWaterLabName] = useState('OWEB Regional Water Quality Testing Laboratory');
    // Defect items in modal
    const [defectsList, setDefectsList] = useState([]);
    const [defectDesc, setDefectDesc] = useState('');
    const [defectCategory, setDefectCategory] = useState('Civil Works');
    const [defectSeverity, setDefectSeverity] = useState('Minor');
    const [defectTargetDate, setDefectTargetDate] = useState('');
    const [defectParty, setDefectParty] = useState('Contractor');
    // Filtered inspection logs
    const filteredInspections = useMemo(() => {
        return inspectionList.filter(log => {
            if (selectedProgram && log.program !== selectedProgram)
                return false;
            if (selectedZone && log.zone !== selectedZone)
                return false;
            if (selectedProject && log.projectId !== selectedProject)
                return false;
            if (selectedStage && log.visitStage !== selectedStage)
                return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchProject = log.projectName.toLowerCase().includes(q);
                const matchInspector = log.inspectorName.toLowerCase().includes(q);
                const matchWoreda = log.woreda.toLowerCase().includes(q);
                const matchRemarks = log.supervisorRemarks.toLowerCase().includes(q);
                if (!matchProject && !matchInspector && !matchWoreda && !matchRemarks)
                    return false;
            }
            return true;
        });
    }, [inspectionList, selectedProgram, selectedZone, selectedProject, selectedStage, searchQuery]);
    // Statistics
    const stats = useMemo(() => {
        const totalVisits = filteredInspections.length;
        const totalDefects = filteredInspections.reduce((acc, l) => acc + (l.defects?.length || 0), 0);
        const openDefects = filteredInspections.reduce((acc, l) => {
            return acc + (l.defects?.filter(d => d.status === 'Open').length || 0);
        }, 0);
        const waterTestsConducted = filteredInspections.filter(l => !!l.waterQualityTest).length;
        const compliantWaterTests = filteredInspections.filter(l => l.waterQualityTest?.complianceStatus === 'Compliant').length;
        return {
            totalVisits,
            totalDefects,
            openDefects,
            waterTestsConducted,
            compliantWaterTests
        };
    }, [filteredInspections]);
    // Add defect to draft log
    const handleAddDefect = () => {
        if (!defectDesc.trim())
            return;
        const newDef = {
            id: `DEF-${Date.now().toString().slice(-4)}`,
            itemDescription: defectDesc.trim(),
            category: defectCategory,
            severity: defectSeverity,
            identifiedDate: new Date().toISOString().split('T')[0],
            targetRectificationDate: defectTargetDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            status: 'Open',
            responsibleParty: defectParty,
        };
        setDefectsList(prev => [...prev, newDef]);
        setDefectDesc('');
    };
    const handleRemoveDefect = (id) => {
        setDefectsList(prev => prev.filter(d => d.id !== id));
    };
    // Submit new inspection
    const handleCreateInspection = (e) => {
        e.preventDefault();
        const targetProj = safeProjects.find(p => p && p.id === newLogProjectId);
        if (!targetProj)
            return;
        let wqTest = undefined;
        if (includeWaterQuality) {
            // Determine compliance
            const isPhValid = waterPh >= 6.5 && waterPh <= 8.5;
            const isTurbidityValid = waterTurbidity <= 5;
            const isFluorideValid = waterFluoride <= 1.5;
            const isEcoliValid = waterEcoli === 0;
            const complianceStatus = isPhValid && isTurbidityValid && isFluorideValid && isEcoliValid
                ? 'Compliant'
                : (waterEcoli > 0 || waterFluoride > 2.5 ? 'Non-Compliant' : 'Marginal');
            wqTest = {
                testDate: new Date().toISOString().split('T')[0],
                testedBy: user.fullName || user.username,
                laboratory: waterLabName,
                ph: waterPh,
                turbidityNTU: waterTurbidity,
                tdsMgL: waterTds,
                residualChlorineMgL: waterChlorine,
                fluorideMgL: waterFluoride,
                ecoliCFU: waterEcoli,
                complianceStatus,
                notes: `Laboratory field parameters verified under OWEB QA/QC protocol.`
            };
        }
        const newInspection = {
            id: `INSP-${new Date().getFullYear()}-${String(inspectionList.length + 1).padStart(3, '0')}`,
            projectId: targetProj.id,
            projectName: targetProj.name,
            program: targetProj.program,
            zone: targetProj.zone,
            woreda: targetProj.woreda,
            inspectionDate: new Date().toISOString().split('T')[0],
            inspectorName: user.fullName || user.username,
            inspectorRole: `${user.role} - Field Verification Unit`,
            visitStage: newLogStage,
            overallPhysicalProgressPct: newLogProgress,
            workmanshipRating: newLogRating,
            siteCleanlinessAndSafety: 'Satisfactory',
            environmentalCompliance: 'Compliant',
            waterQualityTest: wqTest,
            defects: defectsList,
            supervisorRemarks: newLogRemarks || 'Civil and electro-mechanical specifications validated on-site.',
            recommendedActions: newLogActions || 'Proceed with subsequent phase milestones and maintain daily site diary.',
            nextScheduledVisit: newLogNextVisit || undefined,
            signedOffBy: `${user.fullName || user.username} (${user.role})`,
            status: 'Submitted'
        };
        setInspectionList(prev => [newInspection, ...prev]);
        if (onAddInspection) {
            onAddInspection(newInspection);
        }
        // Reset modal
        setIsCreateModalOpen(false);
        setDefectsList([]);
        setNewLogRemarks('');
        setNewLogActions('');
        setIncludeWaterQuality(false);
    };
    // Export to Excel
    const handleExportExcel = () => {
        const rows = filteredInspections.map(log => ({
            'Inspection ID': log.id,
            'Project ID': log.projectId,
            'Project Name': log.projectName,
            'Program': log.program || 'ONE WASH',
            'Zone': log.zone,
            'Woreda': log.woreda,
            'Visit Date': log.inspectionDate,
            'Inspector Name': log.inspectorName,
            'Stage': log.visitStage,
            'Physical Progress (%)': log.overallPhysicalProgressPct,
            'Workmanship Rating': log.workmanshipRating,
            'Water Quality Status': log.waterQualityTest ? log.waterQualityTest.complianceStatus : 'N/A',
            'Water pH': log.waterQualityTest?.ph ?? 'N/A',
            'Turbidity (NTU)': log.waterQualityTest?.turbidityNTU ?? 'N/A',
            'Fluoride (mg/L)': log.waterQualityTest?.fluorideMgL ?? 'N/A',
            'Total Defects Logged': log.defects?.length || 0,
            'Open Defects': log.defects?.filter(d => d.status === 'Open').length || 0,
            'Supervisor Remarks': log.supervisorRemarks,
            'Status': log.status
        }));
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Site_Inspections');
        XLSX.writeFile(workbook, `OWEB_Site_Inspections_${new Date().toISOString().split('T')[0]}.xlsx`);
    };
    // Export to PDF
    const handleExportPDF = () => {
        const doc = new jsPDF('landscape');
        doc.setFontSize(16);
        doc.setTextColor(2, 132, 199);
        doc.text('OROMIA WATER RESOURCE BUREAU (OWEB)', 14, 15);
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        doc.text('Field Quality Assurance (QA/QC) & Verification Logbook', 14, 22);
        const tableData = filteredInspections.map(l => [
            l.id,
            l.projectName,
            l.zone,
            l.inspectionDate,
            l.visitStage,
            `${l.overallPhysicalProgressPct}%`,
            l.workmanshipRating,
            l.waterQualityTest?.complianceStatus || 'No Test',
            l.defects?.filter(d => d.status === 'Open').length || 0,
            l.inspectorName
        ]);
        autoTable(doc, {
            startY: 28,
            head: [['ID', 'Project Name', 'Zone', 'Date', 'Stage', 'Progress', 'Rating', 'Water Quality', 'Open Defects', 'Inspector']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [2, 132, 199] },
            styles: { fontSize: 8 }
        });
        doc.save(`OWEB_Inspections_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    return (<div className="space-y-6 pb-12">
            {/* Top Navigation Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-sky-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1">
                    <button type="button" onClick={() => setActiveSection('inspections')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeSection === 'inspections'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'}`}>
                        <span>🛡️</span>
                        <span>Field QA/QC Inspections &amp; Lab Tests</span>
                        <span className="text-[10px] font-bold text-slate-500">
                            ({filteredInspections.length})
                        </span>
                    </button>

                    <button type="button" onClick={() => setActiveSection('weeklyTracking')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeSection === 'weeklyTracking'
            ? 'bg-white text-cyan-950 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'}`}>
                        <span>📋</span>
                        <span>Weekly Work Plans &amp; Site Tracking (S-Curve)</span>
                        <span className="text-[10px] font-bold text-slate-500">
                            ({(weeklyPlans || []).length})
                        </span>
                    </button>
                </div>

                <div className="text-xs text-slate-500 font-semibold px-2">
                    Bureau Quality &amp; Execution Control System
                </div>
            </div>

            {activeSection === 'weeklyTracking' ? (<WeeklyTrackingSection plans={weeklyPlans} reports={weeklyReports} projects={safeProjects} user={user} onAddPlan={onAddWeeklyPlan || (() => { })} onUpdatePlan={onUpdateWeeklyPlan || (() => { })} onAddReport={onAddWeeklyReport || (() => { })} onUpdateReport={onUpdateWeeklyReport || (() => { })} onNavigate={onNavigate}/>) : (<>
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                        <span>🛡️</span>
                        <span>Site Verification &amp; Quality Assurance (QA/QC)</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Field Inspection & Lab Verification Logs
                    </h1>
                    <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                        Comprehensive field supervision logs, hydrostatic pressure validations, water quality lab certifications, and non-conformance punch lists.
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={handleExportExcel} className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-colors">
                        Export Excel
                    </button>
                    <button onClick={handleExportPDF} className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-colors">
                        Export PDF
                    </button>
                    {(user.role === Role.ADMIN || user.role === Role.SUPERVISOR || user.role === Role.CONTRACT_MANAGER) && (<button onClick={() => setIsCreateModalOpen(true)} className="px-4 py-2 text-xs font-bold bg-primary-500 hover:bg-primary-600 rounded-xl text-white shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2">
                            <span>+</span>
                            <span>Log New Site Inspection</span>
                        </button>)}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <span className="text-xs text-slate-500 font-medium">Logged Site Inspections</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalVisits}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Multi-stage technical audits</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <span className="text-xs text-slate-500 font-medium">Open Punch List Defects</span>
                    <p className={`text-2xl font-bold mt-1 ${stats.openDefects > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {stats.openDefects}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Requiring contractor rectification</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <span className="text-xs text-slate-500 font-medium">Water Quality Lab Tests</span>
                    <p className="text-2xl font-bold text-sky-600 mt-1">{stats.waterTestsConducted}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Chemical & microbiological</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <span className="text-xs text-slate-500 font-medium">WHO / ES Compliance Rate</span>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                        {stats.waterTestsConducted > 0
                ? `${Math.round((stats.compliantWaterTests / stats.waterTestsConducted) * 100)}%`
                : '100%'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Potable standard adherence</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            {ICONS.search}
                        </div>
                        <input type="text" placeholder="Search scheme, inspector, woreda..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"/>
                    </div>

                    <div>
                        <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800">
                            <option value="">All Programs</option>
                            {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div>
                        <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800">
                            <option value="">All Zones</option>
                            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                    </div>

                    <div>
                        <select value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800">
                            <option value="">All Inspection Stages</option>
                            {Object.keys(STAGE_BADGES).map(stg => (<option key={stg} value={stg}>{stg}</option>))}
                        </select>
                    </div>

                    <div>
                        <button onClick={() => {
                setSelectedProgram('');
                setSelectedZone('');
                setSelectedProject('');
                setSelectedStage('');
                setSearchQuery('');
            }} className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300">
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Inspections Table & Inspector Drawer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className={`${selectedLog ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                                <tr>
                                    <th className="px-4 py-3.5">Log Code</th>
                                    <th className="px-4 py-3.5">Project Scheme</th>
                                    <th className="px-4 py-3.5">Zone & Date</th>
                                    <th className="px-4 py-3.5">Stage & Workmanship</th>
                                    <th className="px-4 py-3.5 text-center">Progress</th>
                                    <th className="px-4 py-3.5 text-center">Water Quality</th>
                                    <th className="px-4 py-3.5 text-center">Defects</th>
                                    <th className="px-4 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredInspections.map(log => {
                const isSelected = selectedLog?.id === log.id;
                const stageBadge = STAGE_BADGES[log.visitStage] || STAGE_BADGES['Pre-Construction'];
                const ratingBadge = RATING_BADGES[log.workmanshipRating] || RATING_BADGES['Satisfactory'];
                const openDefects = log.defects?.filter(d => d.status === 'Open').length || 0;
                return (<tr key={log.id} onClick={() => setSelectedLog(log)} className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary-50/70' : 'hover:bg-slate-50'}`}>
                                            <td className="px-4 py-3 font-mono font-bold text-primary-700">
                                                {log.id}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-900">
                                                <div>{log.projectName}</div>
                                                <div className="text-[11px] text-slate-400 font-normal">{log.program || 'ONE WaSH'}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-800">{log.zone}</div>
                                                <div className="text-[11px] text-slate-400">{log.inspectionDate}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-800 text-xs">{log.visitStage}</div>
                                                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                                    Rating: <span className="font-bold text-cyan-800">{log.workmanshipRating}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="font-bold text-slate-800">{log.overallPhysicalProgressPct}%</div>
                                                <div className="w-16 bg-slate-200 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                                                    <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${log.overallPhysicalProgressPct}%` }}></div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {log.waterQualityTest ? (<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${log.waterQualityTest.complianceStatus === 'Compliant'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                                        {log.waterQualityTest.complianceStatus}
                                                    </span>) : (<span className="text-slate-400 text-[11px]">N/A</span>)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {openDefects > 0 ? (<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        {openDefects} Open
                                                    </span>) : (<span className="text-emerald-600 font-semibold text-[11px]">✓ Clear</span>)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                    }} className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>);
            })}
                                {filteredInspections.length === 0 && (<tr>
                                        <td colSpan={8} className="text-center py-12 text-slate-400">
                                            No field inspection records match the active criteria.
                                        </td>
                                    </tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Selected Inspection Detailed Inspector Drawer */}
                {selectedLog && (<div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-lg p-6 space-y-6">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200 mb-1.5">
                                    <span>Log:</span>
                                    <span className="font-mono font-bold">{selectedLog.id}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                                    {selectedLog.projectName}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Inspected by <span className="font-semibold text-slate-800">{selectedLog.inspectorName}</span> ({selectedLog.inspectionDate})
                                </p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>

                        {/* Physical Progress & Workmanship */}
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs">
                            <div>
                                <span className="text-slate-500">Visit Stage</span>
                                <p className="font-bold text-slate-900 mt-0.5">{selectedLog.visitStage}</p>
                            </div>
                            <div>
                                <span className="text-slate-500">Workmanship Rating</span>
                                <p className="font-bold text-slate-900 mt-0.5">{selectedLog.workmanshipRating}</p>
                            </div>
                            <div>
                                <span className="text-slate-500">Physical Progress</span>
                                <p className="font-bold text-primary-700 mt-0.5">{selectedLog.overallPhysicalProgressPct}% Complete</p>
                            </div>
                            <div>
                                <span className="text-slate-500">Next Scheduled Visit</span>
                                <p className="font-bold text-slate-900 mt-0.5">{selectedLog.nextScheduledVisit || 'TBD'}</p>
                            </div>
                        </div>

                        {/* Supervisor Remarks */}
                        <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Supervisor Technical Observations</h4>
                            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                                {selectedLog.supervisorRemarks}
                            </p>
                        </div>

                        {/* Recommended Actions */}
                        <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mandated Corrective Actions</h4>
                            <p className="text-xs text-slate-600 bg-amber-50/70 p-3 rounded-lg border border-amber-200 leading-relaxed">
                                {selectedLog.recommendedActions}
                            </p>
                        </div>

                        {/* Water Quality Section if present */}
                        {selectedLog.waterQualityTest && (<div className="space-y-2 border-t border-slate-100 pt-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <span>🧪</span>
                                        <span>Certified Water Quality Lab Results</span>
                                    </h4>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        {selectedLog.waterQualityTest.complianceStatus}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="bg-sky-50/70 border border-sky-100 p-2 rounded-lg">
                                        <span className="text-[10px] text-slate-500">pH Level</span>
                                        <p className="font-bold text-slate-900 mt-0.5">{selectedLog.waterQualityTest.ph}</p>
                                    </div>
                                    <div className="bg-sky-50/70 border border-sky-100 p-2 rounded-lg">
                                        <span className="text-[10px] text-slate-500">Turbidity</span>
                                        <p className="font-bold text-slate-900 mt-0.5">{selectedLog.waterQualityTest.turbidityNTU} NTU</p>
                                    </div>
                                    <div className="bg-sky-50/70 border border-sky-100 p-2 rounded-lg">
                                        <span className="text-[10px] text-slate-500">Fluoride</span>
                                        <p className="font-bold text-slate-900 mt-0.5">{selectedLog.waterQualityTest.fluorideMgL} mg/L</p>
                                    </div>
                                    <div className="bg-sky-50/70 border border-sky-100 p-2 rounded-lg">
                                        <span className="text-[10px] text-slate-500">TDS</span>
                                        <p className="font-bold text-slate-900 mt-0.5">{selectedLog.waterQualityTest.tdsMgL} mg/L</p>
                                    </div>
                                    <div className="bg-sky-50/70 border border-sky-100 p-2 rounded-lg">
                                        <span className="text-[10px] text-slate-500">Residual Cl</span>
                                        <p className="font-bold text-slate-900 mt-0.5">{selectedLog.waterQualityTest.residualChlorineMgL || 0} mg/L</p>
                                    </div>
                                    <div className="bg-sky-50/70 border border-sky-100 p-2 rounded-lg">
                                        <span className="text-[10px] text-slate-500">E. coli</span>
                                        <p className="font-bold text-emerald-700 mt-0.5">{selectedLog.waterQualityTest.ecoliCFU} CFU/100ml</p>
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-500 italic mt-1">
                                    Tested at: {selectedLog.waterQualityTest.laboratory}
                                </p>
                            </div>)}

                        {/* Defect Punch List */}
                        <div className="space-y-2 border-t border-slate-100 pt-4">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Non-Conformance & Defect Punch List ({selectedLog.defects?.length || 0})
                            </h4>

                            <div className="space-y-2">
                                {selectedLog.defects && selectedLog.defects.length > 0 ? (selectedLog.defects.map(def => (<div key={def.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${def.severity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                        def.severity === 'Major' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                                                    {def.severity} • {def.category}
                                                </span>
                                                <span className={`font-semibold text-[11px] ${def.status === 'Open' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {def.status}
                                                </span>
                                            </div>
                                            <p className="font-medium text-slate-800">{def.itemDescription}</p>
                                            <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                                                <span>Assigned: {def.responsibleParty}</span>
                                                <span>Deadline: {def.targetRectificationDate}</span>
                                            </div>
                                        </div>))) : (<p className="text-xs text-emerald-600 italic">No defects or non-conformance issues logged for this inspection visit.</p>)}
                            </div>
                        </div>
                    </div>)}
            </div>

            {/* Modal to Log New Inspection */}
            {isCreateModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="text-lg font-bold text-slate-900">Record Field QA/QC Inspection</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <form onSubmit={handleCreateInspection} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Target Scheme</label>
                                    <select value={newLogProjectId} onChange={(e) => setNewLogProjectId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800" required>
                                        {safeProjects.map(p => (<option key={p.id} value={p.id}>{p.name} ({p.zone})</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Inspection Stage</label>
                                    <select value={newLogStage} onChange={(e) => setNewLogStage(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800">
                                        {Object.keys(STAGE_BADGES).map(stg => (<option key={stg} value={stg}>{stg}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Physical Progress (%)</label>
                                    <input type="number" min="0" max="100" value={newLogProgress} onChange={(e) => setNewLogProgress(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold" required/>
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Workmanship Rating</label>
                                    <select value={newLogRating} onChange={(e) => setNewLogRating(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800">
                                        {Object.keys(RATING_BADGES).map(r => (<option key={r} value={r}>{r}</option>))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Technical Observation Remarks</label>
                                <textarea rows={2} value={newLogRemarks} onChange={(e) => setNewLogRemarks(e.target.value)} placeholder="Describe civil works status, HDPE piping fusion, concrete test results..." className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800" required/>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Corrective Actions & Instructions</label>
                                <input type="text" value={newLogActions} onChange={(e) => setNewLogActions(e.target.value)} placeholder="e.g. Contractor must cure foundation for 14 days before pump installation..." className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"/>
                            </div>

                            {/* Water Quality Sub-Panel Toggle */}
                            <div className="pt-2 border-t border-slate-200">
                                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                                    <input type="checkbox" checked={includeWaterQuality} onChange={(e) => setIncludeWaterQuality(e.target.checked)} className="w-4 h-4 text-primary-600 rounded"/>
                                    <span>Attach Water Quality Lab Analysis</span>
                                </label>

                                {includeWaterQuality && (<div className="mt-3 p-3 bg-sky-50 rounded-xl border border-sky-200 grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[10px] font-semibold text-slate-600">pH (6.5-8.5)</label>
                                            <input type="number" step="0.1" value={waterPh} onChange={(e) => setWaterPh(Number(e.target.value))} className="w-full px-2 py-1 bg-white border border-slate-300 rounded"/>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-slate-600">Turbidity (&lt;5 NTU)</label>
                                            <input type="number" step="0.1" value={waterTurbidity} onChange={(e) => setWaterTurbidity(Number(e.target.value))} className="w-full px-2 py-1 bg-white border border-slate-300 rounded"/>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-slate-600">Fluoride (&lt;1.5 mg/L)</label>
                                            <input type="number" step="0.1" value={waterFluoride} onChange={(e) => setWaterFluoride(Number(e.target.value))} className="w-full px-2 py-1 bg-white border border-slate-300 rounded"/>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-slate-600">TDS (&lt;1000 mg/L)</label>
                                            <input type="number" value={waterTds} onChange={(e) => setWaterTds(Number(e.target.value))} className="w-full px-2 py-1 bg-white border border-slate-300 rounded"/>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-slate-600">Chlorine (mg/L)</label>
                                            <input type="number" step="0.05" value={waterChlorine} onChange={(e) => setWaterChlorine(Number(e.target.value))} className="w-full px-2 py-1 bg-white border border-slate-300 rounded"/>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-slate-600">E. coli (0 CFU)</label>
                                            <input type="number" value={waterEcoli} onChange={(e) => setWaterEcoli(Number(e.target.value))} className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-bold"/>
                                        </div>
                                    </div>)}
                            </div>

                            {/* Punch list defects builder */}
                            <div className="pt-2 border-t border-slate-200">
                                <label className="block font-semibold text-slate-800 mb-1">Add Non-Conformance / Punch List Item</label>
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Defect description..." value={defectDesc} onChange={(e) => setDefectDesc(e.target.value)} className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"/>
                                    <select value={defectSeverity} onChange={(e) => setDefectSeverity(e.target.value)} className="px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800">
                                        <option value="Minor">Minor</option>
                                        <option value="Major">Major</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                    <button type="button" onClick={handleAddDefect} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg font-bold">
                                        Add
                                    </button>
                                </div>

                                {defectsList.length > 0 && (<div className="mt-2 space-y-1">
                                        {defectsList.map(d => (<div key={d.id} className="flex justify-between items-center bg-slate-100 px-3 py-1 rounded text-xs">
                                                <span>{d.itemDescription} ({d.severity})</span>
                                                <button type="button" onClick={() => handleRemoveDefect(d.id)} className="text-rose-600 font-bold">✕</button>
                                            </div>))}
                                    </div>)}
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2 bg-primary-600 hover:bg-primary-700 rounded-xl font-bold text-white shadow-lg">
                                    Submit & Sign Off Log
                                </button>
                            </div>
                        </form>
                    </div>
                </div>)}
                </>)}
        </div>);
};
export default FieldInspectionModule;
