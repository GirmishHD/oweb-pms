import React, { useState, useMemo, useEffect } from 'react';
import { ProjectStatus } from '../types';
import { ZONES, PROJECT_TYPES, WATER_SOURCES, ENERGY_SOURCES, INTERVENTION_TYPES, IMPLEMENTING_BODIES, FUNDING_SOURCES, RISK_LEVELS, RELIABILITY_RATINGS, ICONS, OROMIA_HIERARCHY, PLANNING_STEPS, PROGRAMS, PROGRAM_COMPONENTS, ENGINEERING_TEAMS, ORGANIZATIONS } from '../constants';
import { generateProjectSummary, generateRiskAssessment } from '../services/geminiService';
import { Section, Input, Select, Checkbox, FileInput } from './FormControls';
import { GanttTimelineChart } from './GanttTimelineChart';
import { CascadingLocationSelector } from './common/CascadingLocationSelector';
import { Role } from '../types';
import { loadPrograms } from '../services/programService';
import { loadNgos } from '../services/ngoService';
const extractFundingSources = (md) => {
    const raw = md?.fundingSources || md?.funding_sources;
    if (Array.isArray(raw) && raw.length > 0) {
        const mapped = raw.map(f => {
            if (typeof f === 'string') return f;
            if (f && typeof f === 'object' && f.active !== false) return f.name || f.code;
            return null;
        }).filter(Boolean);
        if (mapped.length > 0) return mapped;
    }
    return FUNDING_SOURCES;
};

const findZoneForWoreda = (woredaName, map) => {
    if (!woredaName || !map) return null;
    const cleanTarget = woredaName.toLowerCase().replace(/\s+(woreda|aanaa|town|city)$/i, '').trim();
    for (const [zoneName, woredas] of Object.entries(map)) {
        if (Array.isArray(woredas)) {
            const matched = woredas.some(w => {
                const cleanW = w.toLowerCase().replace(/\s+(woreda|aanaa|town|city)$/i, '').trim();
                return cleanW === cleanTarget || woredaName.toLowerCase().includes(cleanW) || cleanTarget.includes(cleanW);
            });
            if (matched) return zoneName;
        }
    }
    return null;
};

const getInitialProjectState = (creatorUsername, masterData, user) => {
    const geo = masterData?.geographicHierarchy || masterData?.geographic_hierarchy;
    const zonesList = (geo && Object.keys(geo).length > 0) ? Object.keys(geo) : ZONES;
    const projectCategoriesMap = masterData?.projectCategories || masterData?.project_categories || PROJECT_TYPES;
    const initialSector = Object.keys(projectCategoriesMap)[0] || 'Water Supply';
    const initialSubtype = (projectCategoriesMap[initialSector] || [])[0] || 'Solar-Powered Rural Scheme';
    const waterSourcesList = masterData?.waterSources || masterData?.water_sources || WATER_SOURCES;
    const energySourcesList = masterData?.energySources || masterData?.energy_sources || ENERGY_SOURCES;
    const interventionTypesList = masterData?.interventionTypes || masterData?.intervention_types || INTERVENTION_TYPES;
    const implementingBodiesList = masterData?.implementingBodies || masterData?.implementing_bodies || IMPLEMENTING_BODIES;
    const activeDonors = extractFundingSources(masterData);
    const reliabilityRatingsList = masterData?.sourceReliabilityRatings || masterData?.source_reliability_ratings || RELIABILITY_RATINGS;
    const initialProgram = user?.assignedProgram && user.assignedProgram !== 'All Programs (Bureau Level)'
        ? user.assignedProgram
        : (masterData?.programs?.[0]?.name || PROGRAMS[0]);
    const initialComponents = PROGRAM_COMPONENTS[initialProgram] || ['General Component'];
    return {
        id: `OWEB-WAT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        name: '',
        program: initialProgram,
        programComponent: initialComponents[0],
        region: 'Oromia',
        zone: zonesList[0] || 'Arsi',
        woreda: '',
        kebele: '',
        gpsCoordinates: { lat: 0, long: 0 },
        elevation: 0,
        projectType: initialSector,
        projectSubType: initialSubtype,
        sourceOfWater: waterSourcesList[0] || 'Spring',
        energySource: energySourcesList[0] || 'Solar PV Array',
        typeOfIntervention: interventionTypesList[0] || 'New Construction',
        populationCoverage: 0,
        dailyDemandEstimate: 0,
        storageRequirement: 0,
        pipeLengthEstimation: 0,
        implementingBody: implementingBodiesList[0] || 'OWEB Head Office Direct Execution',
        washcoExists: false,
        landOwnershipCleared: false,
        powerSourceAvailable: false,
        skilledOperatorsAvailable: false,
        estimatedBudget: 0,
        fundingSource: activeDonors[0] || 'OWEB Regional Treasury (GoE)',
        communityContribution: '',
        environmentalRiskLevel: 'Low',
        sourceReliability: reliabilityRatingsList[0] || 'Reliable (Year-Round Discharge)',
        conflictOverSource: false,
        feasibilityStudyConducted: false,
        eiaConducted: false,
        eiaApprovalAuthority: '',
        eiaRiskRating: 'Low',
        eiaMonitoringPlanInPlace: false,
        status: ProjectStatus.DRAFT,
        creator: creatorUsername,
        summary: '',
        aiRiskAssessment: { level: 'Unknown', keyRisks: [], mitigationStrategies: [] }
    };
};
const RiskAssessmentDisplay = ({ assessment, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-sky-50/50 border border-sky-100 rounded-2xl">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                <p className="mt-3 font-bold text-slate-800 text-sm">Synthesizing Project Risks...</p>
                <p className="text-xs text-slate-500">Evaluating technical, social, and environmental indicators.</p>
            </div>
        );
    }
    const riskBadge = {
        'Low': 'bg-emerald-50 text-emerald-800 border-emerald-300',
        'Medium': 'bg-amber-50 text-amber-800 border-amber-300',
        'High': 'bg-rose-50 text-rose-800 border-rose-300',
        'Unknown': 'bg-slate-50 text-slate-600 border-slate-300',
    };
    const riskTextColor = {
        'Low': 'text-emerald-700',
        'Medium': 'text-amber-700',
        'High': 'text-rose-700',
        'Unknown': 'text-slate-600',
    };
    return (
        <div className="space-y-4">
            <div className={`p-5 rounded-2xl border ${riskBadge[assessment?.level] || riskBadge['Unknown']} transition-all`}>
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-75">OWEB Risk Rating</span>
                        <h4 className={`text-2xl font-black mt-0.5 ${riskTextColor[assessment?.level] || 'text-slate-700'}`}>{assessment?.level || 'Standard'} Risk Profile</h4>
                    </div>
                    <span className="text-3xl">
                        {assessment?.level === 'Low' ? '🛡️' : assessment?.level === 'Medium' ? '⚠️' : assessment?.level === 'High' ? '🚨' : '📋'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h5 className="font-bold text-xs uppercase text-slate-600 mb-2 tracking-wide flex items-center gap-1.5">
                        <span>🔍</span> Key Identified Vulnerabilities
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                        {assessment?.keyRisks && assessment.keyRisks.length > 0 ? (
                            assessment.keyRisks.map((risk, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                    <span className="text-amber-500 font-bold mt-0.5">•</span>
                                    <span>{risk}</span>
                                </li>
                            ))
                        ) : (
                            <li className="text-slate-400 italic">No specific risk triggers flagged.</li>
                        )}
                    </ul>
                </div>

                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
                    <h5 className="font-bold text-xs uppercase text-emerald-800 mb-2 tracking-wide flex items-center gap-1.5">
                        <span>💡</span> Recommended Mitigation Measures
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                        {assessment?.mitigationStrategies && assessment.mitigationStrategies.length > 0 ? (
                            assessment.mitigationStrategies.map((strategy, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                    <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                                    <span>{strategy}</span>
                                </li>
                            ))
                        ) : (
                            <li className="text-slate-400 italic">Standard bureau monitoring protocols apply.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};
const PlanningModule = ({ onAddProject, user, masterData, projects = [], contracts = [], procurements = [], users = [] }) => {
    const [planningViewMode, setPlanningViewMode] = useState('form');
    const [currentStep, setCurrentStep] = useState(0);
    const [project, setProject] = useState(() => getInitialProjectState(user?.username || 'User', masterData, user));
    const [validationError, setValidationError] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [feasibilityDoc, setFeasibilityDoc] = useState(null);
    const [eiaDoc, setEiaDoc] = useState(null);
    const [isFetchingGps, setIsFetchingGps] = useState(false);
    // Filter eligible personnel for assignment
    const engineersList = useMemo(() => {
        return users.filter(u => u.role === Role.ENGINEER ||
            u.role === Role.USER ||
            u.role === Role.ADMIN ||
            (u.secondaryRoles && u.secondaryRoles.includes(Role.ENGINEER)));
    }, [users]);
    const supervisorsList = useMemo(() => {
        return users.filter(u => u.role === Role.SUPERVISOR ||
            u.role === Role.ADMIN ||
            u.role === Role.CONTRACT_MANAGER ||
            (u.secondaryRoles && u.secondaryRoles.includes(Role.SUPERVISOR)));
    }, [users]);
    const teamLeadersList = useMemo(() => {
        return users.filter(u => u.role === Role.TEAM_LEADER ||
            u.role === Role.COORDINATOR ||
            u.role === Role.DIRECTOR ||
            u.role === Role.ADMIN ||
            (u.secondaryRoles && u.secondaryRoles.includes(Role.TEAM_LEADER)));
    }, [users]);
    // Derived options from masterData or fallback constants
    const zoneOptions = useMemo(() => {
        const geo = masterData?.geographicHierarchy || masterData?.geographic_hierarchy;
        return (geo && Object.keys(geo).length > 0) ? Object.keys(geo) : ZONES;
    }, [masterData]);
    const hierarchyMap = useMemo(() => {
        return masterData?.geographicHierarchy || masterData?.geographic_hierarchy || OROMIA_HIERARCHY;
    }, [masterData]);
    const projectCategoriesMap = useMemo(() => {
        const cats = masterData?.projectCategories || masterData?.project_categories;
        return (cats && Object.keys(cats).length > 0) ? cats : PROJECT_TYPES;
    }, [masterData]);
    const projectTypeOptions = useMemo(() => {
        return Object.keys(projectCategoriesMap);
    }, [projectCategoriesMap]);
    const subTypeOptions = useMemo(() => {
        return projectCategoriesMap[project.projectType] || [];
    }, [projectCategoriesMap, project.projectType]);
    const woredaOptions = useMemo(() => {
        return hierarchyMap[project.zone] || [];
    }, [hierarchyMap, project.zone]);
    const waterSourcesOptions = useMemo(() => {
        const raw = masterData?.waterSources || masterData?.water_sources;
        return (Array.isArray(raw) && raw.length > 0) ? raw : WATER_SOURCES;
    }, [masterData]);
    const energySourcesOptions = useMemo(() => {
        const raw = masterData?.energySources || masterData?.energy_sources;
        return (Array.isArray(raw) && raw.length > 0) ? raw : ENERGY_SOURCES;
    }, [masterData]);
    const interventionTypesOptions = useMemo(() => {
        const raw = masterData?.interventionTypes || masterData?.intervention_types;
        return (Array.isArray(raw) && raw.length > 0) ? raw : INTERVENTION_TYPES;
    }, [masterData]);
    const fundingSourcesOptions = useMemo(() => {
        return extractFundingSources(masterData);
    }, [masterData]);
    const draftSchemes = useMemo(() => {
        return (Array.isArray(projects) ? projects : []).filter(p => p && (p.status === ProjectStatus.DRAFT || p.status === 'Draft'));
    }, [projects]);
    const registeredPrograms = useMemo(() => loadPrograms(), []);
    const registeredNgos = useMemo(() => loadNgos(), []);
    const programOptions = useMemo(() => {
        // Enforce user assigned program scope if user is constrained
        const userAssigned = user?.assignedProgram;
        if (userAssigned && userAssigned !== 'All Programs (Bureau Level)' && !userAssigned.includes('All Programs')) {
            return [userAssigned];
        }
        if (registeredPrograms.length > 0) {
            return registeredPrograms.filter(p => p.status === 'Active').map(p => p.name);
        }
        if (masterData?.programs && masterData.programs.length > 0) {
            return masterData.programs.map(p => p.name);
        }
        return PROGRAMS;
    }, [masterData, registeredPrograms, user]);
    // Enhanced Implementing Body Options including active NGOs
    const implementingBodiesOptions = useMemo(() => {
        const baseBodies = masterData ? masterData.implementingBodies : IMPLEMENTING_BODIES;
        const activeNgoNames = registeredNgos
            .filter(n => n.status === 'Active')
            .map(n => `NGO: ${n.name}`);
        return Array.from(new Set([...baseBodies, ...activeNgoNames]));
    }, [masterData, registeredNgos]);
    const programComponentOptions = useMemo(() => {
        const prog = project.program || (programOptions[0] || PROGRAMS[0]);
        const matched = registeredPrograms.find(p => p.name === prog || p.code === prog);
        if (matched?.components && matched.components.length > 0) {
            return matched.components;
        }
        return PROGRAM_COMPONENTS[prog] || ['General Component', 'Infrastructure Development'];
    }, [project.program, programOptions, registeredPrograms]);
    const reliabilityRatingsOptions = useMemo(() => {
        return masterData ? masterData.sourceReliabilityRatings : RELIABILITY_RATINGS;
    }, [masterData]);
    // FIX: The value from a number input is a string, so it must be parsed to avoid type errors.
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target;
            setProject(prev => ({ ...prev, [name]: checked }));
        }
        else {
            setProject(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
        }
    };
    const handleGpsChange = (e) => {
        const { name, value } = e.target;
        setProject(prev => ({ ...prev, gpsCoordinates: { ...prev.gpsCoordinates, [name]: parseFloat(value) || 0 } }));
    };
    const handleFetchGps = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }
        setIsFetchingGps(true);
        navigator.geolocation.getCurrentPosition((position) => {
            setProject(prev => ({
                ...prev,
                gpsCoordinates: {
                    lat: position.coords.latitude,
                    long: position.coords.longitude
                }
            }));
            setIsFetchingGps(false);
        }, (error) => {
            alert(`Error getting location: ${error.message}`);
            setIsFetchingGps(false);
        });
    };
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const { name } = e.target;
        if (name === 'feasibilityDocument') {
            setFeasibilityDoc(file);
        }
        else if (name === 'eiaDocument') {
            setEiaDoc(file);
        }
    };
    const [copiedSummary, setCopiedSummary] = useState(false);
    const handleCopySummary = () => {
        if (!project.summary)
            return;
        navigator.clipboard.writeText(project.summary);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
    };
    const handleGenerateContent = async (type) => {
        setIsGenerating(true);
        try {
            if (type === 'summary') {
                const summary = await generateProjectSummary(project);
                setProject(prev => ({ ...prev, summary }));
            }
            else if (type === 'risk') {
                const riskAssessment = await generateRiskAssessment(project);
                setProject(prev => ({ ...prev, aiRiskAssessment: riskAssessment }));
            }
        } catch (err) {
            console.error('Failed to generate AI content:', err);
        } finally {
            setIsGenerating(false);
        }
    };
    const handleSubmit = (status) => {
        setValidationError(null);
        if (status === ProjectStatus.SUBMITTED) {
            if (!project.name?.trim()) {
                setValidationError('Step 1 Required: Please enter the Project Name before submitting for approval.');
                setCurrentStep(0);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            if (!project.zone?.trim()) {
                setValidationError('Step 1 Required: Please select the Administrative Zone.');
                setCurrentStep(0);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            if (!project.woreda?.trim()) {
                setValidationError('Step 2 Required: Please select the Administrative Woreda / District.');
                setCurrentStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            if (!project.estimatedBudget || Number(project.estimatedBudget) <= 0) {
                setValidationError('Step 4 Required: Estimated Budget (ETB) must be entered and greater than 0.');
                setCurrentStep(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
        } else if (!project.name?.trim()) {
            project.name = `Draft Water Scheme (${project.zone || 'Oromia'})`;
        }
        const projectData = { ...project, status, creator: user?.username || project.creator || 'User' };
        const files = {
            feasibility: feasibilityDoc,
            eia: eiaDoc,
        };
        onAddProject(projectData, files);
    };
    const nextStep = () => {
        setValidationError(null);
        setCurrentStep(prev => Math.min(prev + 1, PLANNING_STEPS.length - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const prevStep = () => {
        setValidationError(null);
        setCurrentStep(prev => Math.max(prev - 1, 0));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    useEffect(() => {
        if (subTypeOptions.length > 0 && !subTypeOptions.includes(project.projectSubType)) {
            setProject(p => ({ ...p, projectSubType: subTypeOptions[0] || '' }));
        }
    }, [subTypeOptions]);
    useEffect(() => {
        if (project.woreda && woredaOptions.length > 0) {
            const cleanTarget = project.woreda.toLowerCase().replace(/\s+(woreda|aanaa|town|city)$/i, '').trim();
            const matched = woredaOptions.some(w => {
                const cleanW = w.toLowerCase().replace(/\s+(woreda|aanaa|town|city)$/i, '').trim();
                return cleanW === cleanTarget || project.woreda.toLowerCase().includes(cleanW) || cleanTarget.includes(cleanW);
            });
            if (!matched) {
                setProject(p => ({ ...p, woreda: '', kebele: '' }));
            }
        }
    }, [project.zone, woredaOptions]);
    // Auto-trigger risk assessment when entering the step
    useEffect(() => {
        if (currentStep === 5 && project.aiRiskAssessment?.level === 'Unknown') {
            handleGenerateContent('risk');
        }
    }, [currentStep]);
    const { lat, long } = project.gpsCoordinates;
    const hasCoordinates = lat !== 0 || long !== 0;
    // Default to a central point in Oromia (Adama) for a better regional overview.
    const mapLat = hasCoordinates ? lat : 8.54;
    const mapLong = hasCoordinates ? long : 39.27;
    // A wider zoom for the regional view, a tighter zoom for a specific pin.
    const mapZoomFactor = hasCoordinates ? 0.02 : 4;
    const bbox = `${mapLong - mapZoomFactor},${mapLat - mapZoomFactor / 2},${mapLong + mapZoomFactor},${mapLat + mapZoomFactor / 2}`;
    const marker = hasCoordinates ? `&marker=${lat},${long}` : '';
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`;
    return (<div className="space-y-6">
            {/* Top View Mode Switcher Header */}
            <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-tr from-cyan-600 to-sky-600 rounded-xl text-white shadow-xs">
                        {React.cloneElement(ICONS.planning, { className: 'w-6 h-6 text-white' })}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-ocean-950">Planning &amp; Pipeline Formulation</h2>
                        <p className="text-xs text-slate-500">
                            Originate new water schemes, formulate feasibility &amp; EIA baselines, and visualize project preparation schedules.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {draftSchemes.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <select
                                value={project.id || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) {
                                        setProject(getInitialProjectState(user?.username || 'User', masterData, user));
                                        setCurrentStep(0);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    } else {
                                        const selected = draftSchemes.find(p => (p.id === val || p.project_id === val));
                                        if (selected) {
                                            setProject({
                                                ...getInitialProjectState(user?.username || 'User', masterData, user),
                                                ...selected,
                                                gpsCoordinates: selected.gpsCoordinates || selected.gps_coordinates || { lat: 8.54, long: 39.27 },
                                            });
                                            setValidationError(null);
                                        }
                                    }
                                }}
                                className="px-3 py-1.5 text-xs font-semibold bg-sky-50/70 hover:bg-sky-50 border border-sky-200 rounded-xl text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-2xs"
                                title="Resume editing a saved draft scheme or formulate a fresh one"
                            >
                                <option value="">➕ Formulate New Scheme</option>
                                {draftSchemes.map(d => (
                                    <option key={d.id || d.project_id} value={d.id || d.project_id}>
                                        📝 Resume: {d.name || d.id || d.project_id} ({d.zone || 'Zone'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="inline-flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
                        <button type="button" onClick={() => setPlanningViewMode('form')} className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${planningViewMode === 'form'
                ? 'bg-white text-primary-700 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'}`}>
                            <span>📝</span>
                            <span>Form Wizard</span>
                        </button>
                        <button type="button" onClick={() => setPlanningViewMode('gantt')} className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${planningViewMode === 'gantt'
                ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'}`}>
                            <span>📊</span>
                            <span>Gantt Pipeline</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleSubmit(ProjectStatus.DRAFT)}
                            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        >
                            <span>💾</span>
                            <span>Save Draft</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSubmit(ProjectStatus.SUBMITTED)}
                            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                            <span>🚀</span>
                            <span>Submit for Approval</span>
                        </button>
                    </div>
                </div>
            </div>

            {planningViewMode === 'gantt' ? (<div className="space-y-6">
                    <GanttTimelineChart projects={projects} contracts={contracts} procurements={procurements} moduleMode="planning" customTitle="Planning Pipeline Gantt & Critical Path Matrix" customSubtitle="Track pipeline preparation timelines, feasibility study milestones, EIA clearances, and appraisal dependencies." defaultStatusFilter="planning_pipeline"/>
                </div>) : (<div className="flex flex-col lg:flex-row gap-8">
                    <aside className="w-full lg:w-1/3 xl:w-1/4">
                        <div className="bg-white rounded-2xl border border-sky-100 shadow-xs p-5 sticky top-6 space-y-4">
                            {/* Phase Enforcement Badge */}
                            <div className="p-3.5 bg-gradient-to-tr from-cyan-600 to-sky-600 rounded-xl text-white shadow-xs">
                                <div className="flex items-center gap-2">
                                    <span className="p-1 bg-white/20 rounded-lg">
                                        {React.cloneElement(ICONS.planning, { className: 'w-4 h-4 text-white' })}
                                    </span>
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-100">
                                        Phase 1: Planning Only
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold mt-1 text-white">Project Formulation &amp; Feasibility</h4>
                                <p className="text-[11px] text-cyan-100 mt-1 leading-snug">
                                    All new projects originate strictly in the Planning Phase. Verified submissions enter the Technical Review &amp; Approval queue.
                                </p>
                            </div>

                            <h3 className="font-bold text-sm text-ocean-950 uppercase tracking-wider">Formulation Steps</h3>
                            <nav className="space-y-1">
                        {PLANNING_STEPS.map((step, index) => {
                const isCompleted = index < currentStep;
                return (<button key={step.id} onClick={() => {
                    setValidationError(null);
                    setCurrentStep(index);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }} className={`w-full flex items-start text-left p-3 rounded-xl transition-all duration-200 cursor-pointer ${isActive ? 'bg-sky-50 border border-sky-200 shadow-2xs' : 'hover:bg-slate-50'}`}>
                                    <div className={`flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold mr-3 mt-0.5 transition-colors duration-200 ${isActive ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-xs' : isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {isCompleted ? '✓' : index + 1}
                                    </div>
                                    <div>
                                        <p className={`font-bold text-xs ${isActive ? 'text-cyan-900' : 'text-slate-700'}`}>
                                            {step.name}
                                        </p>
                                        <p className="text-[11px] text-slate-500 line-clamp-1">{step.description}</p>
                                    </div>
                                </button>);
            })}
                    </nav>
                </div>
            </aside>

            <main className="w-full lg:w-2/3 xl:w-3/4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                    {validationError && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
                            <span className="text-lg">⚠️</span>
                            <div className="flex-1">
                                <h4 className="font-bold">Please Complete Required Information</h4>
                                <p className="text-xs text-rose-700 mt-0.5">{validationError}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setValidationError(null)}
                                className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1 rounded"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}

                    {currentStep === 0 && (<Section title="Step 1: General Information" description="Basic project identification, program initiative, and classification">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Project ID" name="id" value={project.id} onChange={handleChange} disabled/>
                                <Input label="Project Name" name="name" value={project.name} onChange={handleChange} placeholder="e.g. Shashamane Water Supply Extension" required/>
                                <Select label="Project Zone / Administrative Area" name="zone" value={project.zone || (zoneOptions[0] || 'Arsi')} onChange={handleChange} options={zoneOptions} required/>
                                <Select label="Bureau Program / Initiative" name="program" value={project.program || ''} onChange={handleChange} options={programOptions}/>
                                <Select label="Program Component / Window" name="programComponent" value={project.programComponent || ''} onChange={handleChange} options={programComponentOptions}/>
                                <Select label="Project Type" name="projectType" value={project.projectType} onChange={handleChange} options={projectTypeOptions}/>
                                <Select label="Sub Type" name="projectSubType" value={project.projectSubType} onChange={handleChange} options={subTypeOptions}/>
                                <Select label="Intervention Type" name="typeOfIntervention" value={project.typeOfIntervention} onChange={handleChange} options={interventionTypesOptions}/>
                                <Select label="Source of Water" name="sourceOfWater" value={project.sourceOfWater || ''} onChange={handleChange} options={waterSourcesOptions}/>
                                <Select label="Pumping / Power Source" name="energySource" value={project.energySource || ''} onChange={handleChange} options={energySourcesOptions}/>
                                <Select label="Source Reliability" name="sourceReliability" value={project.sourceReliability || ''} onChange={handleChange} options={reliabilityRatingsOptions}/>
                                <Input label="Planned Start Date" name="plannedStartDate" type="date" value={project.plannedStartDate || ''} onChange={handleChange}/>
                                <Input label="Planned Completion Date" name="plannedCompletionDate" type="date" value={project.plannedCompletionDate || ''} onChange={handleChange}/>
                            </div>
                        </Section>)}

                    {currentStep === 1 && (<Section title="Step 2: Administrative Location & Technical Sizing" description="Centralized Organization Unit hierarchy (Region → Woreda → Kebele) and technical metrics">
                            <div className="space-y-4">
                                {/* Centralized Cascading Location Selector */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-sky-100 shadow-2xs">
                                    <CascadingLocationSelector masterData={masterData} selectedRegion={project.region || 'Oromia National Regional State'} selectedWoreda={project.woreda} selectedKebele={project.kebele} selectedZone={project.zone} onChange={(loc) => {
                    const detectedZone = findZoneForWoreda(loc.woreda, hierarchyMap);
                    setProject(prev => ({
                        ...prev,
                        region: loc.region,
                        woreda: loc.woreda,
                        kebele: loc.kebele,
                        ...(detectedZone ? { zone: detectedZone } : {})
                    }));
                }}/>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Elevation (m)" name="elevation" type="number" value={project.elevation} onChange={handleChange}/>
                                    <div className="hidden md:block"/>
                                    <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row items-end gap-3">
                                    <div className="flex-1 w-full">
                                        <Input label="Latitude" name="lat" type="number" value={project.gpsCoordinates.lat} onChange={handleGpsChange} step="0.0001"/>
                                    </div>
                                    <div className="flex-1 w-full">
                                        <Input label="Longitude" name="long" type="number" value={project.gpsCoordinates.long} onChange={handleGpsChange} step="0.0001"/>
                                    </div>
                                    <button type="button" onClick={handleFetchGps} disabled={isFetchingGps} className="h-10 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg border border-slate-300 transition-colors whitespace-nowrap mb-0.5">
                                        {isFetchingGps ? 'Locating...' : '📍 Use My GPS'}
                                    </button>
                                </div>
                                <div className="col-span-1 md:col-span-2 h-52 rounded-lg overflow-hidden border border-slate-200">
                                    <iframe title="Project Location Map" className="w-full h-full border-0" src={mapUrl} loading="lazy"/>
                                </div>
                                <div className="col-span-1 md:col-span-2 flex items-center justify-between pt-3 border-t border-slate-200">
                                    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-700">Technical Sizing & Demands</h4>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const pop = Number(project.populationCoverage) || 0;
                                            if (pop > 0) {
                                                const dailyLiters = pop * 25; // 25 Liters/person/day standard rural design parameter
                                                const storageM3 = Math.round((dailyLiters * 0.4) / 1000); // 40% reservoir balancing capacity
                                                setProject(prev => ({
                                                    ...prev,
                                                    dailyDemandEstimate: dailyLiters,
                                                    storageRequirement: storageM3
                                                }));
                                            }
                                        }}
                                        className="text-[11px] font-bold text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                        title="Auto-calculate daily demand (25L/person/day) and reservoir storage from population"
                                    >
                                        <span>⚡</span>
                                        <span>Auto-Estimate Sizing from Population</span>
                                    </button>
                                </div>
                                <Input label="Beneficiary Population" name="populationCoverage" type="number" value={project.populationCoverage} onChange={handleChange}/>
                                <Input label="Daily Demand (Liters/day)" name="dailyDemandEstimate" type="number" value={project.dailyDemandEstimate} onChange={handleChange} helperText={project.dailyDemandEstimate > 0 ? `~${(project.dailyDemandEstimate / 1000).toFixed(1)} m³/day` : ''}/>
                                <Input label="Storage Capacity (m³)" name="storageRequirement" type="number" value={project.storageRequirement} onChange={handleChange}/>
                                <Input label="Pipe Network Length (km)" name="pipeLengthEstimation" type="number" value={project.pipeLengthEstimation} onChange={handleChange}/>
                            </div>
                        </div>
                    </Section>)}

                    {currentStep === 2 && (<Section title="Step 3: Institutional Readiness & Staff Assignment" description="Governance, community participation, and technical personnel allocations">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select label="Implementing Body" name="implementingBody" value={project.implementingBody} onChange={handleChange} options={implementingBodiesOptions}/>
                                <div className="space-y-3 pt-2">
                                    <Checkbox label="WASHCO / Water Committee Formed" name="washcoExists" checked={project.washcoExists} onChange={handleChange}/>
                                    <Checkbox label="Land Ownership Cleared" name="landOwnershipCleared" checked={project.landOwnershipCleared} onChange={handleChange}/>
                                    <Checkbox label="Reliable Power Available" name="powerSourceAvailable" checked={project.powerSourceAvailable} onChange={handleChange}/>
                                    <Checkbox label="Skilled Operators Available" name="skilledOperatorsAvailable" checked={project.skilledOperatorsAvailable} onChange={handleChange}/>
                                    <Checkbox label="Conflict Over Source Reported" name="conflictOverSource" checked={project.conflictOverSource} onChange={handleChange}/>
                                </div>
                                {project.washcoExists && (<Input label="WASHCO Details" name="washcoDetails" value={project.washcoDetails || ''} onChange={handleChange} placeholder="e.g. 7 members (4 female)"/>)}
                                {!project.landOwnershipCleared && (<Input label="Land Ownership Issue Notes" name="landOwnershipComment" value={project.landOwnershipComment || ''} onChange={handleChange} placeholder="Status of dispute resolution"/>)}
                            </div>

                            {/* Technical Personnel Assignment & RBAC Data Access Scoping Card */}
                            <div className="mt-6 pt-5 border-t border-slate-200">
                                <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200 shadow-2xs space-y-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-sky-600 text-white rounded-xl shadow-xs">
                                            <span className="font-bold text-sm">👷</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">Technical Staff &amp; Engineer Assignments (Access Control)</h4>
                                            <p className="text-xs text-slate-500">
                                                Assign resident engineers, supervising engineers, and squads. Assigned personnel automatically receive project-level access rights.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Assigned Lead Project Engineer
                                            </label>
                                            <select value={project.assignedEngineerId || ''} onChange={(e) => {
                    const selId = e.target.value;
                    const selUser = users.find(u => u.id === selId || u.username === selId);
                    setProject(prev => ({
                        ...prev,
                        assignedEngineerId: selId || undefined,
                        assignedEngineerName: selUser ? (selUser.fullName || selUser.username) : undefined
                    }));
                }} className="w-full px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                                <option value="">-- Unassigned (Bureau Pool) --</option>
                                                {engineersList.map(eng => (<option key={eng.id} value={eng.id}>
                                                        {eng.fullName || eng.username} (@{eng.username}) • {eng.role}
                                                    </option>))}
                                            </select>
                                            <span className="text-[10px] text-slate-400 mt-1 block">
                                                Resident engineer responsible for activities, weekly plans, and site progress.
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Assigned Supervising Engineer
                                            </label>
                                            <select value={project.assignedSupervisorId || ''} onChange={(e) => {
                    const selId = e.target.value;
                    const selUser = users.find(u => u.id === selId || u.username === selId);
                    setProject(prev => ({
                        ...prev,
                        assignedSupervisorId: selId || undefined,
                        assignedSupervisorName: selUser ? (selUser.fullName || selUser.username) : undefined
                    }));
                }} className="w-full px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                                <option value="">-- Unassigned (Bureau Pool) --</option>
                                                {supervisorsList.map(sup => (<option key={sup.id} value={sup.id}>
                                                        {sup.fullName || sup.username} (@{sup.username}) • {sup.role}
                                                    </option>))}
                                            </select>
                                            <span className="text-[10px] text-slate-400 mt-1 block">
                                                Supervising engineer verifying QA/QC inspections and contractor IPC milestones.
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Assigned Team Leader
                                            </label>
                                            <select value={project.assignedTeamLeaderId || ''} onChange={(e) => {
                    setProject(prev => ({
                        ...prev,
                        assignedTeamLeaderId: e.target.value || undefined
                    }));
                }} className="w-full px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                                <option value="">-- Unassigned --</option>
                                                {teamLeadersList.map(tl => (<option key={tl.id} value={tl.id}>
                                                        {tl.fullName || tl.username} (@{tl.username}) • {tl.role}
                                                    </option>))}
                                            </select>
                                            <span className="text-[10px] text-slate-400 mt-1 block">
                                                Squad leader approving technical work plans and submissions.
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Assigned Engineering Squad / Team
                                            </label>
                                            <select value={project.assignedTeam || ''} onChange={(e) => {
                    setProject(prev => ({
                        ...prev,
                        assignedTeam: e.target.value || undefined
                    }));
                }} className="w-full px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                                <option value="">-- Select Team Squad --</option>
                                                {ENGINEERING_TEAMS.map(team => (<option key={team} value={team}>{team}</option>))}
                                            </select>
                                            <span className="text-[10px] text-slate-400 mt-1 block">
                                                Enables TEAM data scope visibility for members of this engineering squad.
                                            </span>
                                        </div>

                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Partner / Co-Financing Organization
                                            </label>
                                            <select value={project.partnerOrganization || ''} onChange={(e) => {
                    setProject(prev => ({
                        ...prev,
                        partnerOrganization: e.target.value || undefined
                    }));
                }} className="w-full px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                                <option value="">-- Internal OWEB Scheme (No External Partner) --</option>
                                                {ORGANIZATIONS.map(org => (<option key={org} value={org}>{org}</option>))}
                                            </select>
                                            <span className="text-[10px] text-slate-400 mt-1 block">
                                                Grants monitoring visibility to members with PARTNER_ORGANIZATION scope.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Section>)}

                    {currentStep === 3 && (<Section title="Step 4: Cost & Financing" description="Budget allocation, funding partner, and community contributions">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Estimated Budget (ETB)" name="estimatedBudget" type="number" value={project.estimatedBudget} onChange={handleChange} required/>
                                <Select label="Funding Source" name="fundingSource" value={project.fundingSource} onChange={handleChange} options={fundingSourcesOptions}/>
                                <div className="col-span-1 md:col-span-2">
                                    <Input label="Community Contribution" name="communityContribution" value={project.communityContribution || ''} onChange={handleChange} placeholder="e.g. In-kind labor, 250,000 ETB cash"/>
                                </div>
                                {Number(project.estimatedBudget) > 0 && (
                                    <div className="col-span-1 md:col-span-2 p-4 bg-sky-50/60 rounded-xl border border-sky-100 space-y-2 mt-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-sky-950">
                                            <span>📊 Engineering Phase Allocation Preview (OWEB Standard Benchmark)</span>
                                            <span>{new Intl.NumberFormat('en-US').format(project.estimatedBudget)} ETB</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                                            <div className="bg-white p-2 rounded-lg border border-sky-100 shadow-2xs">
                                                <span className="text-[10px] text-slate-500 block font-semibold">Civil Works (55%)</span>
                                                <span className="font-bold text-slate-800">{new Intl.NumberFormat('en-US').format(project.estimatedBudget * 0.55)} ETB</span>
                                            </div>
                                            <div className="bg-white p-2 rounded-lg border border-sky-100 shadow-2xs">
                                                <span className="text-[10px] text-slate-500 block font-semibold">Electromechanical (22%)</span>
                                                <span className="font-bold text-slate-800">{new Intl.NumberFormat('en-US').format(project.estimatedBudget * 0.22)} ETB</span>
                                            </div>
                                            <div className="bg-white p-2 rounded-lg border border-sky-100 shadow-2xs">
                                                <span className="text-[10px] text-slate-500 block font-semibold">Supervision &amp; QC (8%)</span>
                                                <span className="font-bold text-slate-800">{new Intl.NumberFormat('en-US').format(project.estimatedBudget * 0.08)} ETB</span>
                                            </div>
                                            <div className="bg-white p-2 rounded-lg border border-sky-100 shadow-2xs">
                                                <span className="text-[10px] text-slate-500 block font-semibold">Commissioning &amp; Handover (7%)</span>
                                                <span className="font-bold text-slate-800">{new Intl.NumberFormat('en-US').format(project.estimatedBudget * 0.07)} ETB</span>
                                            </div>
                                            <div className="bg-white p-2 rounded-lg border border-sky-100 shadow-2xs">
                                                <span className="text-[10px] text-slate-500 block font-semibold">Feasibility &amp; EIA (5%)</span>
                                                <span className="font-bold text-slate-800">{new Intl.NumberFormat('en-US').format(project.estimatedBudget * 0.05)} ETB</span>
                                            </div>
                                            <div className="bg-white p-2 rounded-lg border border-sky-100 shadow-2xs">
                                                <span className="text-[10px] text-slate-500 block font-semibold">Tendering &amp; Award (3%)</span>
                                                <span className="font-bold text-slate-800">{new Intl.NumberFormat('en-US').format(project.estimatedBudget * 0.03)} ETB</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Section>)}

                    {currentStep === 4 && (<Section title="Step 5: Feasibility & Environmental Impact" description="Engineering assessments, environmental clearances, and documentation">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <Checkbox label="Feasibility Study Conducted" name="feasibilityStudyConducted" checked={project.feasibilityStudyConducted} onChange={handleChange}/>
                                    {project.feasibilityStudyConducted && (<>
                                            <Input label="Consultant / Firm" name="feasibilityConsultant" value={project.feasibilityConsultant || ''} onChange={handleChange}/>
                                            <Input label="Study Completion Date" name="feasibilityStudyDate" type="date" value={project.feasibilityStudyDate || ''} onChange={handleChange}/>
                                            <FileInput label="Upload Feasibility Report" name="feasibilityDocument" onChange={handleFileChange} fileName={feasibilityDoc?.name}/>
                                        </>)}
                                </div>
                                <div className="space-y-4">
                                    <Checkbox label="EIA (Environmental Impact) Conducted" name="eiaConducted" checked={project.eiaConducted} onChange={handleChange}/>
                                    {project.eiaConducted && (<>
                                            <Select label="EIA Risk Rating" name="eiaRiskRating" value={project.eiaRiskRating || 'Low'} onChange={handleChange} options={RISK_LEVELS}/>
                                            <Input label="EIA Consultant" name="eiaConsultant" value={project.eiaConsultant || ''} onChange={handleChange}/>
                                            <Input label="Approval Authority" name="eiaApprovalAuthority" value={project.eiaApprovalAuthority || ''} onChange={handleChange}/>
                                            <Input label="Approval Date" name="eiaApprovalDate" type="date" value={project.eiaApprovalDate || ''} onChange={handleChange}/>
                                            <FileInput label="Upload EIA Clearance" name="eiaDocument" onChange={handleFileChange} fileName={eiaDoc?.name}/>
                                        </>)}
                                </div>
                            </div>
                        </Section>)}

                    {currentStep === 5 && (<Section title="Step 6: AI Risk & Vulnerability Analysis" description="Automated risk profiling powered by Gemini AI">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-slate-600">Analyze technical, social, and environmental indicators for risk scoring.</p>
                                    <button type="button" onClick={() => handleGenerateContent('risk')} disabled={isGenerating} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                                        {isGenerating ? 'Analyzing...' : '⚡ Re-Analyze Risk with Gemini'}
                                    </button>
                                </div>
                                {project.aiRiskAssessment && (<RiskAssessmentDisplay assessment={project.aiRiskAssessment} isLoading={isGenerating}/>)}
                            </div>
                        </Section>)}

                    {currentStep === 6 && (<Section title="Step 7: Project Summary & Submission" description="Review details and generate a professional one-paragraph summary before submission">
                            <div className="space-y-6">
                                {/* Core Data Inputs Breakdown */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500">Inputs Analyzed for AI Summary</h4>
                                        <span className="text-xs text-slate-400">4 Key Parameters</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                                            <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide">1. Project Name</p>
                                            <p className="font-bold text-sm text-slate-900 mt-1 truncate" title={project.name || 'Not provided'}>
                                                {project.name || <span className="text-slate-400 italic">No name entered</span>}
                                            </p>
                                        </div>
                                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                                            <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide">2. Scope & Reach</p>
                                            <p className="font-bold text-sm text-slate-900 mt-1 truncate" title={`${project.typeOfIntervention} | ${project.populationCoverage.toLocaleString()} people`}>
                                                {project.typeOfIntervention} • {new Intl.NumberFormat('en-US').format(project.populationCoverage || 0)} pop.
                                            </p>
                                        </div>
                                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                                            <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide">3. Project Type</p>
                                            <p className="font-bold text-sm text-slate-900 mt-1 truncate" title={`${project.projectType} (${project.projectSubType})`}>
                                                {project.projectType} ({project.projectSubType})
                                            </p>
                                        </div>
                                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                                            <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide">4. Budget Allocation</p>
                                            <p className="font-bold text-sm text-slate-900 mt-1">
                                                {new Intl.NumberFormat('en-US').format(project.estimatedBudget || 0)} ETB
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Executive Summary Card with AI Generator */}
                                <div className="bg-gradient-to-br from-primary-50/50 via-white to-slate-50 p-5 rounded-2xl border border-primary-100 shadow-sm space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-9 w-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-sm">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-base">One-Paragraph Executive Summary</h4>
                                                <p className="text-xs text-slate-500">AI-generated from project name, technical scope, classification, and budget</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {project.summary && (<button type="button" onClick={handleCopySummary} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs">
                                                    {copiedSummary ? (<>
                                                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                                                            </svg>
                                                            <span className="text-emerald-700">Copied!</span>
                                                        </>) : (<>
                                                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                                            </svg>
                                                            <span>Copy</span>
                                                        </>)}
                                                </button>)}

                                            <button type="button" onClick={() => handleGenerateContent('summary')} disabled={isGenerating} className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center gap-1.5">
                                                {isGenerating ? (<>
                                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        <span>Synthesizing...</span>
                                                    </>) : (<>
                                                        <span>✨</span>
                                                        <span>{project.summary ? 'Regenerate Summary' : 'Generate with Gemini'}</span>
                                                    </>)}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <textarea name="summary" value={project.summary || ''} onChange={handleChange} rows={4} className="w-full text-sm text-slate-800 leading-relaxed p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder:text-slate-400" placeholder="Click 'Generate with Gemini' above to create a one-paragraph professional project summary based on your entered name, scope, type, and budget..."/>
                                        {isGenerating && (<div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-xl flex items-center justify-center">
                                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md border border-slate-200">
                                                    <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-xs font-medium text-slate-700">Generating professional summary...</span>
                                                </div>
                                            </div>)}
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                                        <span>
                                            {project.summary ? (<span className="text-emerald-700 font-medium flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                                    </svg>
                                                    One-paragraph executive summary ready
                                                </span>) : ('Summary will be included in the project appraisal dossier')}
                                        </span>
                                        <span>{project.summary ? `${project.summary.split(/\s+/).filter(Boolean).length} words` : '0 words'}</span>
                                    </div>
                                </div>

                                {/* Geographic & Administrative Recap */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Location</p>
                                        <p className="font-bold text-slate-800 text-sm mt-0.5">{project.zone}, {project.woreda || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Implementing Body</p>
                                        <p className="font-bold text-slate-800 text-sm mt-0.5 truncate" title={project.implementingBody}>{project.implementingBody}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Funding Partner</p>
                                        <p className="font-bold text-slate-800 text-sm mt-0.5 truncate" title={project.fundingSource}>{project.fundingSource}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Water &amp; Pumping</p>
                                        <p className="font-bold text-slate-800 text-sm mt-0.5 truncate" title={`${project.sourceOfWater} / ${project.energySource}`}>
                                            {project.sourceOfWater} • {project.energySource}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Section>)}

                    {/* Navigation Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            &larr; Back
                        </button>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => handleSubmit(ProjectStatus.DRAFT)}
                                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors shadow-2xs cursor-pointer"
                            >
                                💾 Save Draft
                            </button>

                            {currentStep < PLANNING_STEPS.length - 1 && (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span>Continue</span>
                                    <span>&rarr;</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => handleSubmit(ProjectStatus.SUBMITTED)}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
                            >
                                <span>🚀</span>
                                <span>Submit for Approval</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>)}
    </div>);
};
export default PlanningModule;
