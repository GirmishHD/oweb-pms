import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ProjectStatus, Role } from '../types';
import {
    ZONES, PROJECT_TYPES, WATER_SOURCES, ENERGY_SOURCES, INTERVENTION_TYPES,
    IMPLEMENTING_BODIES, FUNDING_SOURCES, RISK_LEVELS, RELIABILITY_RATINGS,
    ICONS, OROMIA_HIERARCHY, PLANNING_STEPS, PROGRAMS, PROGRAM_COMPONENTS,
    ENGINEERING_TEAMS, ORGANIZATIONS
} from '../constants';
import { generateProjectSummary, evaluateSchemeFeasibilityAndRisks } from '../services/geminiService';
import { Section, Input, Select, Checkbox, FileInput } from './FormControls';
import { GanttTimelineChart } from './GanttTimelineChart';
import { CascadingLocationSelector } from './common/CascadingLocationSelector';
import { loadPrograms } from '../services/programService';
import { loadNgos } from '../services/ngoService';
import {
    getWaterSources, getEnergySources, getProjectTypes,
    getInterventionTypes, getFundingSources, getImplementingBodies
} from '../services/masterDataLookups';

const AUTOSAVE_DRAFT_KEY = 'oweb_pms_planning_draft_v2';

const WATER_SOURCE_OPTIONS = [
    'Deep Borehole (>150m)',
    'Shallow Well (30-60m)',
    'Protected Spring with Collection Chamber',
    'River / Surface Water Intake',
    'Rainwater Harvesting & Sand Dam',
    'Infiltration Gallery',
    'Hand-Dug Well with Handpump'
];

const POWER_PUMPING_OPTIONS = [
    'Solar PV Array (Off-Grid)',
    'National Grid (EEU Connected)',
    'Solar-Diesel Generator Hybrid',
    'Gravity Flow (No Pumping)',
    'Handpump Mechanical Drive'
];

const WATER_QUALITY_BACT_OPTIONS = [
    'Compliant (<1 CFU/100mL - Low Risk)',
    'Intermediate Risk (1-10 CFU/100mL)',
    'High Risk (10-100 CFU/100mL - Disinfection Mandatory)',
    'Very High Risk (>100 CFU/100mL)'
];

const LAND_COMPENSATION_OPTIONS = [
    'Cleared & Formally Documented',
    'In Progress (Kebele Consultation)',
    'Exempted (Bureau / Community Donated Land)',
    'Dispute Pending Resolution'
];

const FEMALE_LEADERSHIP_OPTIONS = [
    'Chairperson',
    'Vice Chairperson',
    'Treasurer / Finance Head',
    'Storekeeper & Spare Parts Lead',
    'Active Executive Member',
    'No Female in Leadership (Alert)'
];

const DROUGHT_EMERGENCY_ZONES = ['Borena', 'Guji', 'West Guji', 'East Hararghe', 'Bale', 'Dollo'];

const generateProjectCode = (year = new Date().getFullYear(), zone = 'OROMIA') => {
    const cleanZone = (zone || 'GEN').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `OWEB-WAT-${year}-${cleanZone}-${rand}`;
};

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
    const initialSubtype = (projectCategoriesMap[initialSector] || [])[0] || 'Deep Borehole Multi-Village Scheme';
    const interventionTypesList = masterData?.interventionTypes || masterData?.intervention_types || INTERVENTION_TYPES;
    const implementingBodiesList = masterData?.implementingBodies || masterData?.implementing_bodies || IMPLEMENTING_BODIES;
    const activeDonors = extractFundingSources(masterData);
    const reliabilityRatingsList = masterData?.sourceReliabilityRatings || masterData?.source_reliability_ratings || RELIABILITY_RATINGS;
    const initialProgram = user?.assignedProgram && user.assignedProgram !== 'All Programs (Bureau Level)'
        ? user.assignedProgram
        : (masterData?.programs?.[0]?.name || PROGRAMS[0]);
    const initialComponents = PROGRAM_COMPONENTS[initialProgram] || ['Rural Water Supply Component'];
    const currentYear = new Date().getFullYear();
    const zoneName = zonesList[0] || 'Arsi';

    return {
        id: generateProjectCode(currentYear, zoneName),
        projectCode: generateProjectCode(currentYear, zoneName),
        name: '',
        program: initialProgram,
        programComponent: initialComponents[0],
        region: 'Oromia National Regional State',
        zone: zoneName,
        woreda: '',
        kebele: '',
        village: '',
        gpsCoordinates: { lat: 8.54, long: 39.27 },
        elevation: 1850,
        projectType: initialSector,
        projectSubType: initialSubtype,
        sourceOfWater: WATER_SOURCE_OPTIONS[0],
        sourceReliability: reliabilityRatingsList[0] || 'Year-Round Discharge (Perennial)',
        energySource: POWER_PUMPING_OPTIONS[0],
        typeOfIntervention: interventionTypesList[0] || 'New Construction',
        
        // Beneficiary Demands
        populationCoverage: 0,
        beneficiaryHouseholds: 0,
        livestockUnits: 0,
        demandStandard: 'rural', // 25 L/c/d rural vs 50 L/c/d urban
        dailyDemandEstimate: 0,
        storageRequirement: 0,
        pipeLengthEstimation: 0,
        totalDynamicHead: 120, // Head in meters
        pumpDischargeYield: 8.5, // L/sec

        // BoQ Itemized Cost Estimates (ETB)
        boqBreakdown: {
            sourceDevelopment: 0,
            civilWorks: 0,
            electromechanical: 0,
            pipeNetwork: 0,
            capacityBuilding: 0,
            contingency: 0
        },
        estimatedBudget: 0,
        fundingSource: activeDonors[0] || 'ONE WASH National Program (OWNP / MoWE)',
        donorFinancing: 0,
        communityContributionCash: 0,
        communityContributionInKind: 0,
        communityContribution: '',

        // Environmental & Social Safeguards
        eiaConducted: false,
        eiaApprovalAuthority: 'Oromia Environment, Forest & Climate Change Authority (OEFCCA)',
        eiaApprovalDate: '',
        eiaRiskRating: 'Low',
        waterQualityFluoride: 0.8, // mg/L
        waterQualitySalinity: 650, // uS/cm
        waterQualityTds: 420, // mg/L
        waterQualityBacteriological: WATER_QUALITY_BACT_OPTIONS[0],
        landOwnershipCleared: true,
        landCompensationStatus: LAND_COMPENSATION_OPTIONS[0],
        landOwnershipComment: '',
        washcoExists: true,
        washcoTotalMembers: 7,
        washcoFemaleMembers: 4,
        washcoFemaleLeadership: FEMALE_LEADERSHIP_OPTIONS[2],
        washcoDetails: '7 members established (4 female); Vice-Chair and Treasurer held by female community leaders.',

        // WBS & Milestone Schedule
        plannedStartDate: '',
        plannedProcurementDate: '',
        constructionDurationMonths: 9,
        plannedCompletionDate: '',
        scheduledCommissioningDate: '',
        wbsPhases: [
            { id: 1, name: 'Feasibility & Hydrogeological Investigation', durationDays: 45, status: 'Completed', progress: 100 },
            { id: 2, name: 'Procurement, NCB Bidding & Contract Award', durationDays: 60, status: 'Ready', progress: 0 },
            { id: 3, name: 'Deep Well Drilling, Casing & Pumping Test', durationDays: 75, status: 'Pending', progress: 0 },
            { id: 4, name: 'Civil Headworks & Elevated Reservoir Construction', durationDays: 90, status: 'Pending', progress: 0 },
            { id: 5, name: 'Solar PV Array & Electromechanical Installation', durationDays: 45, status: 'Pending', progress: 0 },
            { id: 6, name: 'Distribution Pipeline Laying & Public Tap Stands', durationDays: 60, status: 'Pending', progress: 0 },
            { id: 7, name: 'Disinfection, Testing & WASHCO Community Handover', durationDays: 30, status: 'Pending', progress: 0 }
        ],

        // Institutional Allocations
        implementingBody: implementingBodiesList[0] || 'OWEB Head Office Direct Execution',
        assignedEngineerId: '',
        assignedEngineerName: '',
        assignedSupervisorId: '',
        assignedSupervisorName: '',
        assignedTeamLeaderId: '',
        assignedTeam: ENGINEERING_TEAMS[0] || 'Rural Water Supply Execution Squad',
        partnerOrganization: ORGANIZATIONS[0] || 'OWEB Bureau Treasury',

        // Workflow & Synthesis
        status: ProjectStatus.DRAFT,
        creator: creatorUsername,
        summary: '',
        donorJustification: '',
        aiRiskAssessment: {
            level: 'Unknown',
            keyRisks: [],
            mitigationStrategies: [],
            climateResilienceScore: 80,
            costPerCapita: 0,
            costBenchmarkRating: 'Pending Calculation'
        }
    };
};

export const PlanningModule = ({
    onAddProject,
    user,
    masterData,
    projects = [],
    contracts = [],
    procurements = [],
    users = []
}) => {
    // Top workspace switcher: 'wizard' | 'awp' | 'gantt'
    const [viewMode, setViewMode] = useState('wizard');
    const [currentStep, setCurrentStep] = useState(0);
    const [project, setProject] = useState(() => {
        // Attempt restoring localStorage autosave draft
        try {
            const savedDraft = localStorage.getItem(AUTOSAVE_DRAFT_KEY);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                if (parsed && parsed.name !== undefined) {
                    return parsed;
                }
            }
        } catch {
            // Ignore storage parse error
        }
        return getInitialProjectState(user?.username || 'User', masterData, user);
    });

    const [hasRestoredDraft, setHasRestoredDraft] = useState(() => {
        try {
            return !!localStorage.getItem(AUTOSAVE_DRAFT_KEY);
        } catch {
            return false;
        }
    });

    const [lastAutosaved, setLastAutosaved] = useState(null);
    const [validationError, setValidationError] = useState(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [feasibilityDoc, setFeasibilityDoc] = useState(null);
    const [eiaDoc, setEiaDoc] = useState(null);
    const [isFetchingGps, setIsFetchingGps] = useState(false);
    const [copiedSummary, setCopiedSummary] = useState(false);
    const [copiedJustification, setCopiedJustification] = useState(false);

    // AWP Filter & Selection State
    const [awpYearFilter, setAwpYearFilter] = useState('ALL');
    const [awpZoneFilter, setAwpZoneFilter] = useState('ALL');
    const [awpProgramFilter, setAwpProgramFilter] = useState('ALL');
    const [awpSearchQuery, setAwpSearchQuery] = useState('');
    const [selectedAwpIds, setSelectedAwpIds] = useState(new Set());
    const [isPrintingAwp, setIsPrintingAwp] = useState(false);

    // Filter staff
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

    // Master Data derived options
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

    const projectTypeOptions = useMemo(() => Object.keys(projectCategoriesMap), [projectCategoriesMap]);
    const subTypeOptions = useMemo(() => projectCategoriesMap[project.projectType] || [], [projectCategoriesMap, project.projectType]);
    const woredaOptions = useMemo(() => hierarchyMap[project.zone] || [], [hierarchyMap, project.zone]);
    const waterSourcesOptions = useMemo(() => getWaterSources(masterData), [masterData]);
    const powerPumpingOptions = useMemo(() => getEnergySources(masterData), [masterData]);
    const interventionTypesOptions = useMemo(() => getInterventionTypes(masterData), [masterData]);
    const fundingSourcesOptions = useMemo(() => getFundingSources(masterData), [masterData]);

    const registeredPrograms = useMemo(() => loadPrograms(), []);
    const registeredNgos = useMemo(() => loadNgos(), []);

    const programOptions = useMemo(() => {
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

    const programComponentOptions = useMemo(() => {
        const prog = project.program || (programOptions[0] || PROGRAMS[0]);
        const matched = registeredPrograms.find(p => p.name === prog || p.code === prog);
        if (matched?.components && matched.components.length > 0) {
            return matched.components;
        }
        return PROGRAM_COMPONENTS[prog] || ['Infrastructure Development Window', 'Capacity Building & Institutional Support'];
    }, [project.program, programOptions, registeredPrograms]);

    const implementingBodiesOptions = useMemo(() => {
        const baseBodies = getImplementingBodies(masterData);
        const activeNgoNames = registeredNgos
            .filter(n => n.status === 'Active')
            .map(n => `NGO: ${n.name}`);
        return Array.from(new Set([...baseBodies, ...activeNgoNames]));
    }, [masterData, registeredNgos]);

    // Autosave to localStorage on state changes
    useEffect(() => {
        try {
            localStorage.setItem(AUTOSAVE_DRAFT_KEY, JSON.stringify(project));
            setLastAutosaved(new Date());
        } catch (err) {
            console.warn('Autosave to localStorage failed:', err);
        }
    }, [project]);

    // Form handlers
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target;
            setProject(prev => ({ ...prev, [name]: checked }));
        } else {
            setProject(prev => ({
                ...prev,
                [name]: type === 'number' ? (parseFloat(value) || 0) : value
            }));
        }
    };

    const handleBoqChange = (field, value) => {
        const numVal = parseFloat(value) || 0;
        setProject(prev => {
            const updatedBoq = {
                ...(prev.boqBreakdown || {}),
                [field]: numVal
            };
            const total = Object.values(updatedBoq).reduce((sum, item) => sum + (Number(item) || 0), 0);
            return {
                ...prev,
                boqBreakdown: updatedBoq,
                estimatedBudget: total,
                donorFinancing: total - (Number(prev.communityContributionCash) || 0)
            };
        });
    };

    const handleGpsChange = (e) => {
        const { name, value } = e.target;
        setProject(prev => ({
            ...prev,
            gpsCoordinates: {
                ...prev.gpsCoordinates,
                [name]: parseFloat(value) || 0
            }
        }));
    };

    const handleFetchGps = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }
        setIsFetchingGps(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setProject(prev => ({
                    ...prev,
                    gpsCoordinates: {
                        lat: Number(pos.coords.latitude.toFixed(5)),
                        long: Number(pos.coords.longitude.toFixed(5))
                    }
                }));
                setIsFetchingGps(false);
            },
            (err) => {
                alert(`Error getting location: ${err.message}`);
                setIsFetchingGps(false);
            }
        );
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (e.target.name === 'feasibilityDocument') setFeasibilityDoc(file);
        if (e.target.name === 'eiaDocument') setEiaDoc(file);
    };

    // Auto-calculate engineering sizing and demands
    const handleAutoCalculateSizing = () => {
        const pop = Number(project.populationCoverage) || 0;
        const hhs = Math.round(pop / 5.2); // Average 5.2 persons per rural household in Oromia
        const livestock = Number(project.livestockUnits) || 0;
        const lPerCapita = project.demandStandard === 'urban' ? 50 : 25; // Liters/capita/day standard
        const livestockDemand = livestock * 25; // 25 Liters/TLU/day
        const totalDailyLiters = (pop * lPerCapita) + livestockDemand;
        const dailyM3 = Math.round((totalDailyLiters / 1000) * 10) / 10;
        const reservoirM3 = Math.round(dailyM3 * 0.4); // 40% balancing storage rule of thumb
        const estPipeKm = Math.max(1.5, Math.round((pop / 500) * 10) / 10);

        // Standard Benchmark BoQ Breakdown based on scheme type
        const unitCostPerCapita = 4800; // Average ETB/capita
        const baseBudget = Math.max(2500000, pop * unitCostPerCapita);
        const sourceCost = Math.round(baseBudget * 0.35);
        const civilCost = Math.round(baseBudget * 0.28);
        const electromechanicalCost = Math.round(baseBudget * 0.18);
        const pipeCost = Math.round(baseBudget * 0.12);
        const capacityCost = Math.round(baseBudget * 0.03);
        const contingencyCost = Math.round(baseBudget * 0.04);
        const totalComputedBudget = sourceCost + civilCost + electromechanicalCost + pipeCost + capacityCost + contingencyCost;

        setProject(prev => ({
            ...prev,
            beneficiaryHouseholds: hhs,
            dailyDemandEstimate: totalDailyLiters,
            storageRequirement: reservoirM3,
            pipeLengthEstimation: estPipeKm,
            boqBreakdown: {
                sourceDevelopment: sourceCost,
                civilWorks: civilCost,
                electromechanical: electromechanicalCost,
                pipeNetwork: pipeCost,
                capacityBuilding: capacityCost,
                contingency: contingencyCost
            },
            estimatedBudget: totalComputedBudget,
            donorFinancing: Math.round(totalComputedBudget * 0.90),
            communityContributionCash: Math.round(totalComputedBudget * 0.05),
            communityContributionInKind: Math.round(totalComputedBudget * 0.05),
            communityContribution: `5% community cash tariff deposit (${Math.round(totalComputedBudget * 0.05).toLocaleString()} ETB) + local labor & stone clearance in-kind.`
        }));
    };

    // AI Evaluation & Synthesis Trigger
    const handleRunAIEvaluation = async () => {
        setIsGeneratingAI(true);
        try {
            const [summary, feasibilityAssessment] = await Promise.all([
                generateProjectSummary(project),
                evaluateSchemeFeasibilityAndRisks(project)
            ]);

            setProject(prev => ({
                ...prev,
                summary,
                donorJustification: feasibilityAssessment.donorJustification || prev.donorJustification,
                aiRiskAssessment: feasibilityAssessment
            }));
        } catch (err) {
            console.error('AI Feasibility Evaluation Error:', err);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    // Step Navigation
    const nextStep = () => {
        setValidationError(null);
        // Step 1 Validation
        if (currentStep === 0) {
            if (!project.name?.trim()) {
                setValidationError('Please enter a descriptive Water Scheme Name.');
                return;
            }
            if (!project.zone?.trim()) {
                setValidationError('Please select the Target Administrative Zone.');
                return;
            }
        }
        // Step 2 Validation
        if (currentStep === 1) {
            if (!project.woreda?.trim()) {
                setValidationError('Please specify or select the Administrative Woreda.');
                return;
            }
        }
        // Step 3 Validation
        if (currentStep === 2) {
            if (!project.populationCoverage || Number(project.populationCoverage) <= 0) {
                setValidationError('Please specify the Target Beneficiary Population.');
                return;
            }
        }
        // Step 4 Validation
        if (currentStep === 3) {
            if (!project.estimatedBudget || Number(project.estimatedBudget) <= 0) {
                setValidationError('Total Budget must be greater than zero. Enter itemized costs or click Auto-Calculate.');
                return;
            }
        }

        setCurrentStep(prev => Math.min(prev + 1, PLANNING_STEPS.length - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const prevStep = () => {
        setValidationError(null);
        setCurrentStep(prev => Math.max(prev - 1, 0));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Submission handler
    const handleSubmit = (targetStatus) => {
        setValidationError(null);
        if (targetStatus === ProjectStatus.SUBMITTED) {
            if (!project.name?.trim()) {
                setValidationError('Scheme Name is mandatory.');
                setCurrentStep(0);
                return;
            }
            if (!project.woreda?.trim()) {
                setValidationError('Woreda location is mandatory.');
                setCurrentStep(1);
                return;
            }
            if (!project.estimatedBudget || Number(project.estimatedBudget) <= 0) {
                setValidationError('Estimated budget must be calculated.');
                setCurrentStep(3);
                return;
            }
        }

        const submissionData = {
            ...project,
            status: targetStatus,
            creator: user?.username || project.creator || 'Planning Officer',
            plannedStartDate: project.plannedStartDate ? String(project.plannedStartDate).split('T')[0] : null,
            plannedCompletionDate: project.plannedCompletionDate ? String(project.plannedCompletionDate).split('T')[0] : null,
            feasibilityStudyDate: project.feasibilityStudyDate ? String(project.feasibilityStudyDate).split('T')[0] : null,
            eiaApprovalDate: project.eiaApprovalDate ? String(project.eiaApprovalDate).split('T')[0] : null
        };

        const files = {
            feasibility: feasibilityDoc,
            eia: eiaDoc
        };

        onAddProject(submissionData, files);

        // Clear local storage draft after successful submission
        try {
            localStorage.removeItem(AUTOSAVE_DRAFT_KEY);
            setHasRestoredDraft(false);
        } catch {
            // Ignore
        }
    };

    const handleDiscardDraft = () => {
        if (window.confirm('Are you sure you want to discard your current formulation draft and reset to default?')) {
            try {
                localStorage.removeItem(AUTOSAVE_DRAFT_KEY);
            } catch {
                // Ignore
            }
            setProject(getInitialProjectState(user?.username || 'User', masterData, user));
            setHasRestoredDraft(false);
            setCurrentStep(0);
        }
    };

    // AWP Schemes filtering
    const safeProjects = useMemo(() => Array.isArray(projects) ? projects : [], [projects]);

    const filteredAwpSchemes = useMemo(() => {
        return safeProjects.filter(p => {
            if (!p) return false;
            if (awpZoneFilter !== 'ALL' && p.zone !== awpZoneFilter) return false;
            if (awpProgramFilter !== 'ALL' && p.program !== awpProgramFilter) return false;
            if (awpSearchQuery.trim()) {
                const q = awpSearchQuery.toLowerCase();
                const match = (p.name || '').toLowerCase().includes(q) ||
                    String(p.id || '').toLowerCase().includes(q) ||
                    (p.woreda || '').toLowerCase().includes(q) ||
                    (p.zone || '').toLowerCase().includes(q);
                if (!match) return false;
            }
            return true;
        });
    }, [safeProjects, awpZoneFilter, awpProgramFilter, awpSearchQuery]);

    // AWP Aggregate Metrics
    const awpMetrics = useMemo(() => {
        const total = filteredAwpSchemes.length;
        const totalBudget = filteredAwpSchemes.reduce((sum, p) => sum + (Number(p.estimatedBudget) || 0), 0);
        const totalPop = filteredAwpSchemes.reduce((sum, p) => sum + (Number(p.populationCoverage) || 0), 0);
        const droughtPriorityCount = filteredAwpSchemes.filter(p => DROUGHT_EMERGENCY_ZONES.includes(p.zone)).length;
        return { total, totalBudget, totalPop, droughtPriorityCount };
    }, [filteredAwpSchemes]);

    // Toggle AWP selection
    const toggleAwpSelection = (id) => {
        setSelectedAwpIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAllAwp = () => {
        if (selectedAwpIds.size === filteredAwpSchemes.length) {
            setSelectedAwpIds(new Set());
        } else {
            setSelectedAwpIds(new Set(filteredAwpSchemes.map(p => p.id)));
        }
    };

    // Export AWP to CSV
    const exportAwpToCsv = () => {
        const schemesToExport = selectedAwpIds.size > 0
            ? filteredAwpSchemes.filter(p => selectedAwpIds.has(p.id))
            : filteredAwpSchemes;

        if (schemesToExport.length === 0) {
            alert('No schemes available to export.');
            return;
        }

        const headers = ['Project ID', 'Scheme Name', 'Program', 'Zone', 'Woreda', 'Intervention', 'Water Source', 'Beneficiaries', 'Budget (ETB)', 'Status', 'Creator'];
        const rows = schemesToExport.map(p => [
            `"${p.id || ''}"`,
            `"${(p.name || '').replace(/"/g, '""')}"`,
            `"${p.program || ''}"`,
            `"${p.zone || ''}"`,
            `"${p.woreda || ''}"`,
            `"${p.typeOfIntervention || ''}"`,
            `"${p.sourceOfWater || ''}"`,
            p.populationCoverage || 0,
            p.estimatedBudget || 0,
            `"${p.status || ''}"`,
            `"${p.creator || ''}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `OWEB_Annual_Work_Plan_${new Date().getFullYear()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Map preview coordinates
    const { lat, long } = project.gpsCoordinates || { lat: 8.54, long: 39.27 };
    const hasCoordinates = lat !== 0 || long !== 0;
    const mapLat = hasCoordinates ? lat : 8.54;
    const mapLong = hasCoordinates ? long : 39.27;
    const bbox = `${mapLong - 0.03},${mapLat - 0.02},${mapLong + 0.03},${mapLat + 0.02}`;
    const markerParam = hasCoordinates ? `&marker=${lat},${long}` : '';
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${markerParam}`;

    return (
        <div className="space-y-6">
            {/* Top Navigation & Workspace Header */}
            <div className="bg-white p-4.5 rounded-2xl border border-sky-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-sky-700 rounded-xl text-white shadow-xs">
                        {React.cloneElement(ICONS.planning, { className: 'w-6 h-6 text-white' })}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black text-ocean-950">Water Scheme Formulation &amp; Investment Planning</h2>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800">
                                Enterprise AWP Studio
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Formulate capital schemes, compute technical sizing, baseline ESMF safeguards, and track the Annual Work Plan (AWP).
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* View Switcher Tabs */}
                    <div className="inline-flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setViewMode('wizard')}
                            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                viewMode === 'wizard' ? 'bg-white text-cyan-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span>📝</span>
                            <span>Formulation Wizard</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('awp')}
                            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                viewMode === 'awp' ? 'bg-white text-cyan-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span>📋</span>
                            <span>Annual Work Plan (AWP)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('gantt')}
                            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                viewMode === 'gantt' ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span>📊</span>
                            <span>Gantt Pipeline</span>
                        </button>
                    </div>

                    {/* Quick Draft Actions */}
                    {viewMode === 'wizard' && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleSubmit(ProjectStatus.DRAFT)}
                                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                title="Save current parameters as draft in OWEB database"
                            >
                                <span>💾</span>
                                <span>Save Draft</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSubmit(ProjectStatus.SUBMITTED)}
                                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                                title="Submit scheme proposal for Zonal Desk appraisal"
                            >
                                <span>🚀</span>
                                <span>Submit for Approval</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Autosave & Draft Restoration Notice */}
            {hasRestoredDraft && viewMode === 'wizard' && (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <span className="text-base">📝</span>
                        <span>
                            <strong>Unsaved Formulation Restored:</strong> You have an active scheme draft in progress.
                            {lastAutosaved && ` (Autosaved ${lastAutosaved.toLocaleTimeString()})`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDiscardDraft}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        >
                            Discard &amp; Reset
                        </button>
                        <button
                            type="button"
                            onClick={() => setHasRestoredDraft(false)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg transition-colors cursor-pointer"
                        >
                            Keep Editing
                        </button>
                    </div>
                </div>
            )}

            {/* 1. GANTT PIPELINE VIEW */}
            {viewMode === 'gantt' && (
                <div className="space-y-6">
                    <GanttTimelineChart
                        projects={projects}
                        contracts={contracts}
                        procurements={procurements}
                        moduleMode="planning"
                        customTitle="OWEB Planning Pipeline Gantt &amp; Critical Path Matrix"
                        customSubtitle="Track pipeline preparation timelines, Ethiopian Fiscal Year (EFY) quarters, feasibility milestones, and appraisal dependencies."
                        defaultStatusFilter="planning_pipeline"
                    />
                </div>
            )}

            {/* 2. ANNUAL WORK PLAN (AWP) DASHBOARD VIEW */}
            {viewMode === 'awp' && (
                <div className="space-y-6">
                    {/* AWP Metrics Banner */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 bg-white rounded-2xl border border-sky-100 shadow-xs">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total AWP Schemes</span>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-2xl font-black text-ocean-950">{awpMetrics.total}</span>
                                <span className="p-2 bg-sky-50 text-cyan-800 rounded-xl text-xs font-bold">📋</span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block">In regional formulation pipeline</span>
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-sky-100 shadow-xs">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Planned Capital Investment</span>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-xl font-black text-emerald-800">
                                    {(awpMetrics.totalBudget / 1e6).toFixed(1)}M <span className="text-xs font-normal text-slate-500">ETB</span>
                                </span>
                                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold">💰</span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block">Aggregated financing requirement</span>
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-sky-100 shadow-xs">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Target Beneficiaries</span>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-xl font-black text-ocean-900">
                                    {new Intl.NumberFormat('en-US').format(awpMetrics.totalPop)}
                                </span>
                                <span className="p-2 bg-cyan-50 text-cyan-700 rounded-xl text-xs font-bold">👥</span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block">Rural &amp; peri-urban population</span>
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-sky-100 shadow-xs">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Drought Emergency Priority</span>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-2xl font-black text-rose-700">{awpMetrics.droughtPriorityCount}</span>
                                <span className="p-2 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold">🚨</span>
                            </div>
                            <span className="text-[11px] text-rose-600 font-semibold mt-1 block">Borena, Guji &amp; Hararghe corridors</span>
                        </div>
                    </div>

                    {/* Filter & Action Toolbar */}
                    <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-base font-bold text-ocean-950">Regional Annual Work Plan (AWP) Allocation Matrix</h3>
                                <p className="text-xs text-slate-500">Filter, balance, and endorse project investments across Oromia zones and funding windows.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={exportAwpToCsv}
                                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                    <span>📥</span>
                                    <span>Export AWP (CSV)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                    <span>🖨️</span>
                                    <span>Print AWP</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search scheme name, woreda, code..."
                                    value={awpSearchQuery}
                                    onChange={(e) => setAwpSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-slate-800"
                                />
                                <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
                            </div>

                            <select
                                value={awpZoneFilter}
                                onChange={(e) => setAwpZoneFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                            >
                                <option value="ALL">All Administrative Zones</option>
                                {zoneOptions.map(z => (<option key={z} value={z}>{z} Zone</option>))}
                            </select>

                            <select
                                value={awpProgramFilter}
                                onChange={(e) => setAwpProgramFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                            >
                                <option value="ALL">All Funding Programs</option>
                                {programOptions.map(p => (<option key={p} value={p}>{p}</option>))}
                            </select>

                            <div className="flex items-center justify-end text-xs text-slate-500 font-semibold px-2">
                                Showing {filteredAwpSchemes.length} of {safeProjects.length} schemes
                            </div>
                        </div>

                        {/* Schemes Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-sky-50/70 border-b border-sky-100 text-slate-600 uppercase font-bold">
                                    <tr>
                                        <th className="p-3 w-8 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedAwpIds.size > 0 && selectedAwpIds.size === filteredAwpSchemes.length}
                                                onChange={selectAllAwp}
                                                className="rounded text-cyan-600 cursor-pointer"
                                            />
                                        </th>
                                        <th className="p-3">Scheme Name &amp; Code</th>
                                        <th className="p-3">Zone / Woreda</th>
                                        <th className="p-3">Program Window</th>
                                        <th className="p-3">Water Source</th>
                                        <th className="p-3">Beneficiaries</th>
                                        <th className="p-3">Planned Budget (ETB)</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAwpSchemes.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="p-12 text-center text-slate-400">
                                                <span className="text-3xl block mb-2">📋</span>
                                                <p className="font-bold text-slate-700">No matching schemes in Annual Work Plan</p>
                                                <p className="text-[11px]">Adjust your filters or originate a new scheme via the Formulation Wizard.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAwpSchemes.map(sch => {
                                            const isSelected = selectedAwpIds.has(sch.id);
                                            const isDroughtZone = DROUGHT_EMERGENCY_ZONES.includes(sch.zone);
                                            return (
                                                <tr key={sch.id} className={`hover:bg-sky-50/40 transition-colors ${isSelected ? 'bg-sky-50/60' : ''}`}>
                                                    <td className="p-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleAwpSelection(sch.id)}
                                                            className="rounded text-cyan-600 cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                                            <span>{sch.name}</span>
                                                            {isDroughtZone && (
                                                                <span className="text-[9px] px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 rounded font-black uppercase" title="Drought Resilience Zone">
                                                                    Resilience
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="font-mono text-[10px] text-cyan-800">{sch.id || sch.projectCode}</span>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="font-semibold text-slate-800">{sch.zone} Zone</span>
                                                        <span className="text-slate-400 block text-[11px]">{sch.woreda || 'Unspecified'}</span>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="font-medium text-slate-700 truncate max-w-[160px] block" title={sch.program}>
                                                            {sch.program || 'Regional Treasury'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 block">{sch.programComponent || 'General'}</span>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="font-medium text-slate-800">{sch.sourceOfWater || 'Deep Borehole'}</span>
                                                        <span className="text-[10px] text-slate-400 block">{sch.energySource || 'Solar PV'}</span>
                                                    </td>
                                                    <td className="p-3 font-semibold text-slate-800">
                                                        {Number(sch.populationCoverage || 0).toLocaleString()}
                                                    </td>
                                                    <td className="p-3 font-extrabold text-emerald-800">
                                                        {Number(sch.estimatedBudget || 0).toLocaleString()} ETB
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                            sch.status === ProjectStatus.APPROVED ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                            sch.status === ProjectStatus.SUBMITTED ? 'bg-sky-50 text-cyan-800 border-sky-200' :
                                                            sch.status === ProjectStatus.UNDER_REVIEW ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            'bg-slate-50 text-slate-600 border-slate-200'
                                                        }`}>
                                                            {sch.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setProject({
                                                                    ...getInitialProjectState(user?.username || 'User', masterData, user),
                                                                    ...sch,
                                                                    gpsCoordinates: sch.gpsCoordinates || sch.gps_coordinates || { lat: 8.54, long: 39.27 }
                                                                });
                                                                setViewMode('wizard');
                                                                setCurrentStep(0);
                                                            }}
                                                            className="px-2.5 py-1 text-[11px] font-bold text-cyan-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors cursor-pointer"
                                                        >
                                                            Edit &amp; Appraise
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. MULTI-STEP SCHEME FORMULATION WIZARD */}
            {viewMode === 'wizard' && (
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Stepper Sidebar */}
                    <aside className="w-full lg:w-1/3 xl:w-1/4">
                        <div className="bg-white rounded-2xl border border-sky-100 shadow-xs p-5 sticky top-6 space-y-4">
                            {/* Phase 1 Badge */}
                            <div className="p-3.5 bg-gradient-to-tr from-cyan-600 to-sky-700 rounded-xl text-white shadow-xs">
                                <div className="flex items-center gap-2">
                                    <span className="p-1 bg-white/20 rounded-lg">
                                        {React.cloneElement(ICONS.planning, { className: 'w-4 h-4 text-white' })}
                                    </span>
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-100">
                                        Phase 1: Project Formulation
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold mt-1 text-white">Investment Feasibility &amp; Design</h4>
                                <p className="text-[11px] text-cyan-100 mt-1 leading-snug">
                                    Follow the 7 formulation milestones. All entries are autosaved and validated against national WASH standards.
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-xs text-ocean-950 uppercase tracking-wider">Formulation Steps</h3>
                                <span className="text-[11px] font-bold text-cyan-700">Step {currentStep + 1} of {PLANNING_STEPS.length}</span>
                            </div>

                            <nav className="space-y-1">
                                {PLANNING_STEPS.map((step, index) => {
                                    const isCompleted = index < currentStep;
                                    const isActive = index === currentStep;
                                    return (
                                        <button
                                            key={step.id}
                                            type="button"
                                            onClick={() => {
                                                setValidationError(null);
                                                setCurrentStep(index);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className={`w-full flex items-start text-left p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                                                isActive ? 'bg-sky-50 border border-sky-200 shadow-2xs' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className={`flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold mr-3 mt-0.5 transition-colors duration-200 ${
                                                isActive ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-xs' :
                                                isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {isCompleted ? '✓' : index + 1}
                                            </div>
                                            <div>
                                                <p className={`font-bold text-xs ${isActive ? 'text-cyan-900' : 'text-slate-700'}`}>
                                                    {step.name}
                                                </p>
                                                <p className="text-[11px] text-slate-500 line-clamp-1">{step.description}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </nav>

                            {/* Summary Budget Widget */}
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Current Computed Investment</span>
                                <div className="text-base font-black text-emerald-800">
                                    {Number(project.estimatedBudget || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">ETB</span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-200">
                                    <span>Beneficiaries:</span>
                                    <span className="font-bold text-slate-800">{Number(project.populationCoverage || 0).toLocaleString()} persons</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Right Wizard Content Form */}
                    <main className="w-full lg:w-2/3 xl:w-3/4">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                            {/* Validation Alert */}
                            {validationError && (
                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm animate-shake">
                                    <span className="text-lg">⚠️</span>
                                    <div className="flex-1">
                                        <h4 className="font-bold">Required Information Incomplete</h4>
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

                            {/* STEP 1: GENERAL IDENTIFICATION & PROGRAM ALIGNMENT */}
                            {currentStep === 0 && (
                                <Section
                                    title="Step 1: General Identification & Program Alignment"
                                    subtitle="Define scheme name, unique code generation, funding framework, and alignment with regional donor windows"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                                                Generated Scheme Code <span className="text-cyan-700 font-mono">(OWEB Standard)</span>
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={project.projectCode || project.id}
                                                    readOnly
                                                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newCode = generateProjectCode(new Date().getFullYear(), project.zone);
                                                        setProject(prev => ({ ...prev, id: newCode, projectCode: newCode }));
                                                    }}
                                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                                                    title="Regenerate unique project identifier"
                                                >
                                                    🔄
                                                </button>
                                            </div>
                                        </div>

                                        <Input
                                            label="Official Scheme Name"
                                            name="name"
                                            value={project.name}
                                            onChange={handleChange}
                                            placeholder="e.g. Shashamane Rural Deep Well Multi-Village Water Scheme"
                                            required
                                        />

                                        <Select
                                            label="Target Administrative Zone"
                                            name="zone"
                                            value={project.zone || (zoneOptions[0] || 'Arsi')}
                                            onChange={(e) => {
                                                const newZone = e.target.value;
                                                const newCode = generateProjectCode(new Date().getFullYear(), newZone);
                                                setProject(prev => ({ ...prev, zone: newZone, id: newCode, projectCode: newCode }));
                                            }}
                                            options={zoneOptions}
                                            required
                                        />

                                        <Select
                                            label="Bureau Strategic Program"
                                            name="program"
                                            value={project.program || ''}
                                            onChange={handleChange}
                                            options={programOptions}
                                        />

                                        <Select
                                            label="Program Component / Window"
                                            name="programComponent"
                                            value={project.programComponent || ''}
                                            onChange={handleChange}
                                            options={programComponentOptions}
                                        />

                                        <Select
                                            label="Project Category"
                                            name="projectType"
                                            value={project.projectType}
                                            onChange={handleChange}
                                            options={projectTypeOptions}
                                        />

                                        <Select
                                            label="Intervention Type"
                                            name="typeOfIntervention"
                                            value={project.typeOfIntervention}
                                            onChange={handleChange}
                                            options={interventionTypesOptions}
                                        />

                                        <Select
                                            label="Implementing Body"
                                            name="implementingBody"
                                            value={project.implementingBody}
                                            onChange={handleChange}
                                            options={implementingBodiesOptions}
                                        />

                                        <Select
                                            label="Primary Funding Partner"
                                            name="fundingSource"
                                            value={project.fundingSource}
                                            onChange={handleChange}
                                            options={fundingSourcesOptions}
                                        />

                                        <Input
                                            label="Target Planned Commencement Date"
                                            name="plannedStartDate"
                                            type="date"
                                            value={project.plannedStartDate || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </Section>
                            )}

                            {/* STEP 2: GEOGRAPHIC & HYDROGEOLOGICAL PROFILING */}
                            {currentStep === 1 && (
                                <Section
                                    title="Step 2: Geographic & Hydrogeological Profiling"
                                    subtitle="Administrative hierarchy (Zone -> Woreda -> Kebele -> Village), elevation, water source, and pumping configuration"
                                >
                                    <div className="space-y-4">
                                        {/* Centralized Cascading Location Selector */}
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-sky-100 shadow-2xs space-y-3">
                                            <CascadingLocationSelector
                                                masterData={masterData}
                                                selectedRegion={project.region || 'Oromia National Regional State'}
                                                selectedCluster={project.cluster}
                                                selectedWoreda={project.woreda}
                                                selectedKebele={project.kebele}
                                                selectedZone={project.zone}
                                                onChange={(loc) => {
                                                    const detectedZone = findZoneForWoreda(loc.woreda, hierarchyMap);
                                                    setProject(prev => ({
                                                        ...prev,
                                                        region: loc.region,
                                                        cluster: loc.cluster,
                                                        woreda: loc.woreda,
                                                        kebele: loc.kebele,
                                                        zone: loc.zone || detectedZone || prev.zone
                                                    }));
                                                }}
                                            />

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                                                        Direct Woreda Selection ({project.zone} Zone)
                                                    </label>
                                                    <select
                                                        value={project.woreda || ''}
                                                        onChange={(e) => setProject(prev => ({ ...prev, woreda: e.target.value }))}
                                                        className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                                                    >
                                                        <option value="">-- Choose Woreda ({woredaOptions.length} in {project.zone}) --</option>
                                                        {woredaOptions.map(w => (<option key={w} value={w}>{w}</option>))}
                                                    </select>
                                                </div>

                                                <Input
                                                    label="Specific Village / Ganda Name"
                                                    name="village"
                                                    value={project.village || ''}
                                                    onChange={handleChange}
                                                    placeholder="e.g. Oda Bultum Community Water Point"
                                                />
                                            </div>
                                        </div>

                                        {/* GPS & Map Section */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <Input
                                                label="Elevation (m.a.s.l.)"
                                                name="elevation"
                                                type="number"
                                                value={project.elevation}
                                                onChange={handleChange}
                                            />

                                            <Input
                                                label="Latitude (°N)"
                                                name="lat"
                                                type="number"
                                                step="0.0001"
                                                value={project.gpsCoordinates.lat}
                                                onChange={handleGpsChange}
                                            />

                                            <div className="flex items-end gap-2">
                                                <div className="flex-1">
                                                    <Input
                                                        label="Longitude (°E)"
                                                        name="long"
                                                        type="number"
                                                        step="0.0001"
                                                        value={project.gpsCoordinates.long}
                                                        onChange={handleGpsChange}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleFetchGps}
                                                    disabled={isFetchingGps}
                                                    className="h-10 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold rounded-xl border border-cyan-200 transition-colors whitespace-nowrap mb-0.5 cursor-pointer shadow-2xs"
                                                >
                                                    {isFetchingGps ? 'Locating...' : '📍 Use GPS'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="h-48 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                                            <iframe
                                                title="Geographic Location Map Preview"
                                                className="w-full h-full border-0"
                                                src={mapUrl}
                                                loading="lazy"
                                            />
                                        </div>

                                        {/* Hydrogeology & Pumping Source */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                                            <Select
                                                label="Proposed Water Source"
                                                name="sourceOfWater"
                                                value={project.sourceOfWater}
                                                onChange={handleChange}
                                                options={waterSourcesOptions}
                                            />

                                            <Select
                                                label="Source Reliability Rating"
                                                name="sourceReliability"
                                                value={project.sourceReliability}
                                                onChange={handleChange}
                                                options={RELIABILITY_RATINGS}
                                            />

                                            <Select
                                                label="Power & Pumping Technology"
                                                name="energySource"
                                                value={project.energySource}
                                                onChange={handleChange}
                                                options={powerPumpingOptions}
                                            />
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {/* STEP 3: ENGINEERING SIZING & TECHNICAL DEMAND */}
                            {currentStep === 2 && (
                                <Section
                                    title="Step 3: Engineering Sizing & Technical Demand"
                                    subtitle="Human and pastoralist livestock populations, national water demand benchmarks, and hydraulic storage parameters"
                                >
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gradient-to-r from-sky-50 to-cyan-50 rounded-2xl border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div>
                                                <h4 className="font-extrabold text-sm text-ocean-950 flex items-center gap-1.5">
                                                    <span>⚡</span>
                                                    <span>Automated Engineering Sizing Engine</span>
                                                </h4>
                                                <p className="text-xs text-slate-600 mt-0.5">
                                                    Computes daily consumption, 40% reservoir balancing volume, and baseline BoQ costs automatically.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAutoCalculateSizing}
                                                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-700 hover:to-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                            >
                                                <span>⚡ Auto-Calculate Sizing &amp; Demands</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <Input
                                                label="Target Population (Persons)"
                                                name="populationCoverage"
                                                type="number"
                                                value={project.populationCoverage}
                                                onChange={handleChange}
                                                required
                                            />

                                            <Input
                                                label="Beneficiary Households"
                                                name="beneficiaryHouseholds"
                                                type="number"
                                                value={project.beneficiaryHouseholds || Math.round((project.populationCoverage || 0) / 5.2)}
                                                onChange={handleChange}
                                                helperText="~5.2 persons / rural household"
                                            />

                                            <Input
                                                label="Livestock Units (TLU)"
                                                name="livestockUnits"
                                                type="number"
                                                value={project.livestockUnits || 0}
                                                onChange={handleChange}
                                                helperText="Pastoralist zones (Borena/Guji/Bale)"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                                                    National Demand Standard
                                                </label>
                                                <select
                                                    name="demandStandard"
                                                    value={project.demandStandard || 'rural'}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                                                >
                                                    <option value="rural">Rural Standard (25 L/c/d)</option>
                                                    <option value="urban">Urban/Peri-Urban (50 L/c/d)</option>
                                                </select>
                                            </div>

                                            <Input
                                                label="Daily Demand (Liters/day)"
                                                name="dailyDemandEstimate"
                                                type="number"
                                                value={project.dailyDemandEstimate}
                                                onChange={handleChange}
                                                helperText={project.dailyDemandEstimate > 0 ? `~${(project.dailyDemandEstimate / 1000).toFixed(1)} m³/day` : ''}
                                            />

                                            <Input
                                                label="Storage Capacity (m³)"
                                                name="storageRequirement"
                                                type="number"
                                                value={project.storageRequirement}
                                                onChange={handleChange}
                                                helperText="40% daily balancing reservoir"
                                            />

                                            <Input
                                                label="Pipeline Length (km)"
                                                name="pipeLengthEstimation"
                                                type="number"
                                                step="0.1"
                                                value={project.pipeLengthEstimation}
                                                onChange={handleChange}
                                                helperText="Transmission & distribution"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                            <Input
                                                label="Total Dynamic Head (TDH in meters)"
                                                name="totalDynamicHead"
                                                type="number"
                                                value={project.totalDynamicHead || 120}
                                                onChange={handleChange}
                                                helperText="Static lift + frictional losses"
                                            />

                                            <Input
                                                label="Design Pump Discharge Yield (L/sec)"
                                                name="pumpDischargeYield"
                                                type="number"
                                                step="0.1"
                                                value={project.pumpDischargeYield || 8.5}
                                                onChange={handleChange}
                                                helperText="Safe aquifer extraction yield"
                                            />
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {/* STEP 4: BILL OF QUANTITIES (BOQ) & BUDGET BREAKDOWN */}
                            {currentStep === 3 && (
                                <Section
                                    title="Step 4: Bill of Quantities (BoQ) & Budget Breakdown"
                                    subtitle="Itemized capital cost categories, automated total computation, and financing contribution ratios"
                                >
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                                    1. Source Development / Drilling (ETB)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={project.boqBreakdown?.sourceDevelopment || 0}
                                                    onChange={(e) => handleBoqChange('sourceDevelopment', e.target.value)}
                                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                                />
                                                <span className="text-[10px] text-slate-400">Drilling, casing, gravel pack &amp; yield test</span>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                                    2. Civil Works &amp; Reservoir (ETB)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={project.boqBreakdown?.civilWorks || 0}
                                                    onChange={(e) => handleBoqChange('civilWorks', e.target.value)}
                                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                                />
                                                <span className="text-[10px] text-slate-400">Masonry/R.C. reservoir &amp; pump house</span>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                                    3. Electro-Mechanical &amp; Solar (ETB)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={project.boqBreakdown?.electromechanical || 0}
                                                    onChange={(e) => handleBoqChange('electromechanical', e.target.value)}
                                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                                />
                                                <span className="text-[10px] text-slate-400">Submersible pump, solar PV array &amp; inverter</span>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                                    4. Pipe Network &amp; Water Points (ETB)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={project.boqBreakdown?.pipeNetwork || 0}
                                                    onChange={(e) => handleBoqChange('pipeNetwork', e.target.value)}
                                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                                />
                                                <span className="text-[10px] text-slate-400">HDPE/uPVC pressure pipe &amp; public fountains</span>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                                    5. Capacity Building &amp; WASHCO (ETB)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={project.boqBreakdown?.capacityBuilding || 0}
                                                    onChange={(e) => handleBoqChange('capacityBuilding', e.target.value)}
                                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                                />
                                                <span className="text-[10px] text-slate-400">Community mobilization, tariff setting &amp; tools</span>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                                    6. Contingency &amp; Supervision (3-5%) (ETB)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={project.boqBreakdown?.contingency || 0}
                                                    onChange={(e) => handleBoqChange('contingency', e.target.value)}
                                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                                />
                                                <span className="text-[10px] text-slate-400">Unforeseen ground variations &amp; testing</span>
                                            </div>
                                        </div>

                                        {/* Total Summary Box */}
                                        <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200 space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div>
                                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-900 block">Total Estimated Capital Budget</span>
                                                    <span className="text-2xl font-black text-emerald-800">
                                                        {Number(project.estimatedBudget || 0).toLocaleString()} <span className="text-sm font-normal text-slate-600">ETB</span>
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Unit Cost Per Beneficiary</span>
                                                    <span className="text-base font-extrabold text-cyan-900">
                                                        {project.populationCoverage > 0
                                                            ? `${Math.round(project.estimatedBudget / project.populationCoverage).toLocaleString()} ETB / person`
                                                            : '—'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Financing Contribution Breakdown */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-sky-200 text-xs">
                                                <div>
                                                    <label className="block font-bold text-slate-700 mb-1">Donor / Treasury Financing (ETB)</label>
                                                    <input
                                                        type="number"
                                                        value={project.donorFinancing || (project.estimatedBudget * 0.9)}
                                                        onChange={handleChange}
                                                        name="donorFinancing"
                                                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block font-bold text-slate-700 mb-1">Community Cash Deposit (ETB)</label>
                                                    <input
                                                        type="number"
                                                        value={project.communityContributionCash || 0}
                                                        onChange={handleChange}
                                                        name="communityContributionCash"
                                                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block font-bold text-slate-700 mb-1">Community In-Kind Labor (ETB eq.)</label>
                                                    <input
                                                        type="number"
                                                        value={project.communityContributionInKind || 0}
                                                        onChange={handleChange}
                                                        name="communityContributionInKind"
                                                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {/* STEP 5: ENVIRONMENTAL & SOCIAL SAFEGUARDS (EIA/ESMF) */}
                            {currentStep === 4 && (
                                <Section
                                    title="Step 5: Environmental & Social Safeguards (ESMF/EIA)"
                                    subtitle="Environmental impact clearances, laboratory water quality baselines, land acquisition, and gender-inclusive WASHCO establishment"
                                >
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* EIA Section */}
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                                <h4 className="text-xs font-bold text-ocean-950 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span>🌿</span>
                                                    <span>Environmental Impact Assessment (EIA)</span>
                                                </h4>
                                                <Checkbox
                                                    label="EIA Study Conducted &amp; Screened"
                                                    name="eiaConducted"
                                                    checked={project.eiaConducted}
                                                    onChange={handleChange}
                                                />
                                                {project.eiaConducted && (
                                                    <>
                                                        <Input
                                                            label="Clearance Issuing Authority"
                                                            name="eiaApprovalAuthority"
                                                            value={project.eiaApprovalAuthority || ''}
                                                            onChange={handleChange}
                                                        />
                                                        <Input
                                                            label="Clearance Certificate Date"
                                                            name="eiaApprovalDate"
                                                            type="date"
                                                            value={project.eiaApprovalDate || ''}
                                                            onChange={handleChange}
                                                        />
                                                        <FileInput
                                                            label="Upload EIA Clearance Certificate"
                                                            name="eiaDocument"
                                                            onChange={handleFileChange}
                                                            fileName={eiaDoc?.name}
                                                        />
                                                    </>
                                                )}
                                            </div>

                                            {/* Land Acquisition & RoW */}
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                                <h4 className="text-xs font-bold text-ocean-950 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span>📜</span>
                                                    <span>Land Acquisition &amp; Right-of-Way (RoW)</span>
                                                </h4>
                                                <Checkbox
                                                    label="Site Land Ownership Cleared &amp; Free of Dispute"
                                                    name="landOwnershipCleared"
                                                    checked={project.landOwnershipCleared}
                                                    onChange={handleChange}
                                                />
                                                <Select
                                                    label="Community Compensation / Deed Status"
                                                    name="landCompensationStatus"
                                                    value={project.landCompensationStatus || LAND_COMPENSATION_OPTIONS[0]}
                                                    onChange={handleChange}
                                                    options={LAND_COMPENSATION_OPTIONS}
                                                />
                                                <Input
                                                    label="Land Clearance Notes"
                                                    name="landOwnershipComment"
                                                    value={project.landOwnershipComment || ''}
                                                    onChange={handleChange}
                                                    placeholder="Signed Kebele MoU, boundary agreement, etc."
                                                />
                                            </div>
                                        </div>

                                        {/* Water Quality Baseline */}
                                        <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200 space-y-3">
                                            <h4 className="text-xs font-bold text-ocean-950 uppercase tracking-wider flex items-center gap-1.5">
                                                <span>🧪</span>
                                                <span>Water Quality Baseline Parameters (Potability Compliance)</span>
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                                <Input
                                                    label="Fluoride (mg/L)"
                                                    name="waterQualityFluoride"
                                                    type="number"
                                                    step="0.1"
                                                    value={project.waterQualityFluoride || 0.8}
                                                    onChange={handleChange}
                                                    helperText="WHO Standard <= 1.5 mg/L"
                                                />
                                                <Input
                                                    label="Salinity (EC in uS/cm)"
                                                    name="waterQualitySalinity"
                                                    type="number"
                                                    value={project.waterQualitySalinity || 650}
                                                    onChange={handleChange}
                                                    helperText="Freshwater < 1,500 uS/cm"
                                                />
                                                <Input
                                                    label="Total Dissolved Solids (TDS mg/L)"
                                                    name="waterQualityTds"
                                                    type="number"
                                                    value={project.waterQualityTds || 420}
                                                    onChange={handleChange}
                                                    helperText="Standard < 1,000 mg/L"
                                                />
                                                <Select
                                                    label="Bacteriological Risk"
                                                    name="waterQualityBacteriological"
                                                    value={project.waterQualityBacteriological || WATER_QUALITY_BACT_OPTIONS[0]}
                                                    onChange={handleChange}
                                                    options={WATER_QUALITY_BACT_OPTIONS}
                                                />
                                            </div>
                                        </div>

                                        {/* WASHCO & Gender Parity */}
                                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span>👥</span>
                                                    <span>WASHCO Committee &amp; Gender Representation</span>
                                                </h4>
                                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                    National Standard: &ge; 50% Female
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <Input
                                                    label="Total Committee Members"
                                                    name="washcoTotalMembers"
                                                    type="number"
                                                    value={project.washcoTotalMembers || 7}
                                                    onChange={handleChange}
                                                />
                                                <Input
                                                    label="Female Committee Members"
                                                    name="washcoFemaleMembers"
                                                    type="number"
                                                    value={project.washcoFemaleMembers || 4}
                                                    onChange={handleChange}
                                                />
                                                <Select
                                                    label="Highest Female Role"
                                                    name="washcoFemaleLeadership"
                                                    value={project.washcoFemaleLeadership || FEMALE_LEADERSHIP_OPTIONS[2]}
                                                    onChange={handleChange}
                                                    options={FEMALE_LEADERSHIP_OPTIONS}
                                                />
                                            </div>

                                            <Input
                                                label="WASHCO Registration &amp; Operational Notes"
                                                name="washcoDetails"
                                                value={project.washcoDetails || ''}
                                                onChange={handleChange}
                                                placeholder="Legal certificate from Woreda Water Desk, tariff plan, etc."
                                            />
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {/* STEP 6: MILESTONE SCHEDULE & WORK BREAKDOWN STRUCTURE (WBS) */}
                            {currentStep === 5 && (
                                <Section
                                    title="Step 6: Milestone Schedule & Work Breakdown Structure (WBS)"
                                    subtitle="Baseline construction timeline, 6-phase gate milestones, and assigned resident technical personnel"
                                >
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <Input
                                                label="Planned Procurement Start"
                                                name="plannedProcurementDate"
                                                type="date"
                                                value={project.plannedProcurementDate || ''}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label="Construction Duration (Months)"
                                                name="constructionDurationMonths"
                                                type="number"
                                                value={project.constructionDurationMonths || 9}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label="Target Commissioning Date"
                                                name="plannedCompletionDate"
                                                type="date"
                                                value={project.plannedCompletionDate || ''}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        {/* WBS Baseline Milestone Table */}
                                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between">
                                                <span>6-Phase Standard Baseline Work Breakdown Structure (WBS)</span>
                                                <span>Duration (Days)</span>
                                            </div>
                                            <div className="divide-y divide-slate-100 text-xs">
                                                {(project.wbsPhases || []).map((ph) => (
                                                    <div key={ph.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center text-[11px]">
                                                                {ph.id}
                                                            </span>
                                                            <span className="font-semibold text-slate-800">{ph.name}</span>
                                                        </div>
                                                        <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                                            {ph.durationDays} days
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Staff Allocations */}
                                        <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200 space-y-3">
                                            <h4 className="text-xs font-bold text-ocean-950 uppercase tracking-wider flex items-center gap-1.5">
                                                <span>👷</span>
                                                <span>Assigned Resident Technical Staff (Access Scoping)</span>
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">Lead Resident Engineer</label>
                                                    <select
                                                        value={project.assignedEngineerId || ''}
                                                        onChange={(e) => {
                                                            const selId = e.target.value;
                                                            const selUser = users.find(u => u.id === selId || u.username === selId);
                                                            setProject(prev => ({
                                                                ...prev,
                                                                assignedEngineerId: selId || undefined,
                                                                assignedEngineerName: selUser ? (selUser.fullName || selUser.username) : undefined
                                                            }));
                                                        }}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                                                    >
                                                        <option value="">-- Unassigned (Bureau Pool) --</option>
                                                        {engineersList.map(eng => (
                                                            <option key={eng.id} value={eng.id}>
                                                                {eng.fullName || eng.username} (@{eng.username})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">Supervising Engineer</label>
                                                    <select
                                                        value={project.assignedSupervisorId || ''}
                                                        onChange={(e) => {
                                                            const selId = e.target.value;
                                                            const selUser = users.find(u => u.id === selId || u.username === selId);
                                                            setProject(prev => ({
                                                                ...prev,
                                                                assignedSupervisorId: selId || undefined,
                                                                assignedSupervisorName: selUser ? (selUser.fullName || selUser.username) : undefined
                                                            }));
                                                        }}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                                                    >
                                                        <option value="">-- Unassigned (Bureau Pool) --</option>
                                                        {supervisorsList.map(sup => (
                                                            <option key={sup.id} value={sup.id}>
                                                                {sup.fullName || sup.username} (@{sup.username})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {/* STEP 7: AI FEASIBILITY & EXECUTIVE JUSTIFICATION */}
                            {currentStep === 6 && (
                                <Section
                                    title="Step 7: AI Feasibility, Benchmarking & Justification"
                                    subtitle="Comprehensive Gemini AI analysis, cost-per-capita evaluation, detected red flags, and executive narratives"
                                >
                                    <div className="space-y-6">
                                        {/* Action Button to run AI */}
                                        <div className="p-4.5 bg-gradient-to-r from-sky-50 via-white to-cyan-50 rounded-2xl border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div>
                                                <h4 className="font-black text-sm text-ocean-950 flex items-center gap-1.5">
                                                    <span>⚡</span>
                                                    <span>Gemini 2.5 Multi-Criteria Feasibility Audit</span>
                                                </h4>
                                                <p className="text-xs text-slate-600 mt-0.5">
                                                    Evaluates hydrogeological hazards, benchmark cost per capita, and generates formal donor appraisal narratives.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRunAIEvaluation}
                                                disabled={isGeneratingAI}
                                                className="px-4.5 py-2.5 bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-700 hover:to-sky-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                                            >
                                                {isGeneratingAI ? (
                                                    <>
                                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        <span>Auditing Scheme Parameters...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>✨</span>
                                                        <span>Run AI Feasibility &amp; Risk Audit</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* AI Metrics Badges */}
                                        {project.aiRiskAssessment && (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="p-3.5 bg-white rounded-xl border border-sky-100 shadow-2xs">
                                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Climate Resilience Score</span>
                                                    <div className="text-xl font-black text-cyan-800 mt-0.5">
                                                        {project.aiRiskAssessment.climateResilienceScore || 80} / 100
                                                    </div>
                                                    <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">Renewable solar &amp; perennial baseflow</span>
                                                </div>

                                                <div className="p-3.5 bg-white rounded-xl border border-sky-100 shadow-2xs">
                                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Cost Per Capita</span>
                                                    <div className="text-xl font-black text-slate-800 mt-0.5">
                                                        {project.populationCoverage > 0
                                                            ? `${Math.round(project.estimatedBudget / project.populationCoverage).toLocaleString()} ETB`
                                                            : '0 ETB'}
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                                                        {project.aiRiskAssessment.costBenchmarkRating || 'Standard Benchmark'}
                                                    </span>
                                                </div>

                                                <div className="p-3.5 bg-white rounded-xl border border-sky-100 shadow-2xs">
                                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Overall Risk Rating</span>
                                                    <div className={`text-xl font-black mt-0.5 ${
                                                        project.aiRiskAssessment.level === 'High' ? 'text-rose-700' :
                                                        project.aiRiskAssessment.level === 'Medium' ? 'text-amber-700' : 'text-emerald-700'
                                                    }`}>
                                                        {project.aiRiskAssessment.level || 'Low'} Risk
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Technical &amp; social factors</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Identified Risks and Directives */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                <h5 className="font-bold text-xs uppercase text-slate-700 mb-2 flex items-center gap-1.5">
                                                    <span>🔍</span>
                                                    <span>Identified Vulnerabilities &amp; Red Flags</span>
                                                </h5>
                                                <ul className="space-y-1.5 text-xs text-slate-700">
                                                    {(project.aiRiskAssessment?.keyRisks || []).map((risk, idx) => (
                                                        <li key={idx} className="flex items-start gap-1.5">
                                                            <span className="text-amber-500 font-bold">•</span>
                                                            <span>{risk}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
                                                <h5 className="font-bold text-xs uppercase text-emerald-800 mb-2 flex items-center gap-1.5">
                                                    <span>💡</span>
                                                    <span>Recommended Engineering Mitigation Directives</span>
                                                </h5>
                                                <ul className="space-y-1.5 text-xs text-slate-700">
                                                    {(project.aiRiskAssessment?.mitigationStrategies || []).map((strat, idx) => (
                                                        <li key={idx} className="flex items-start gap-1.5">
                                                            <span className="text-emerald-600 font-bold">✓</span>
                                                            <span>{strat}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Executive Justification Narrative for Donors */}
                                        <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h5 className="font-bold text-xs uppercase text-cyan-950 flex items-center gap-1.5">
                                                    <span>📑</span>
                                                    <span>Executive Project Justification Narrative (For Appraisal Dossier)</span>
                                                </h5>
                                                {project.donorJustification && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(project.donorJustification);
                                                            setCopiedJustification(true);
                                                            setTimeout(() => setCopiedJustification(false), 2000);
                                                        }}
                                                        className="text-[11px] font-bold text-cyan-800 hover:text-cyan-900 bg-white px-2.5 py-1 rounded-lg border border-sky-200 shadow-2xs cursor-pointer"
                                                    >
                                                        {copiedJustification ? 'Copied!' : 'Copy Narrative'}
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-700 leading-relaxed italic">
                                                {project.donorJustification || 'Click "Run AI Feasibility & Risk Audit" to generate the formal donor justification narrative.'}
                                            </p>
                                        </div>

                                        {/* Summary text area */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="block text-xs font-bold text-slate-700 uppercase">
                                                    One-Paragraph Executive Summary
                                                </label>
                                                {project.summary && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(project.summary);
                                                            setCopiedSummary(true);
                                                            setTimeout(() => setCopiedSummary(false), 2000);
                                                        }}
                                                        className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer"
                                                    >
                                                        {copiedSummary ? 'Copied!' : 'Copy Summary'}
                                                    </button>
                                                )}
                                            </div>
                                            <textarea
                                                rows={4}
                                                name="summary"
                                                value={project.summary || ''}
                                                onChange={handleChange}
                                                placeholder="Executive summary will be synthesized here..."
                                                className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl leading-relaxed text-slate-800 focus:ring-2 focus:ring-cyan-500 font-medium"
                                            />
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {/* Navigation Stepper Buttons */}
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

                                    {currentStep < PLANNING_STEPS.length - 1 ? (
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="px-5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-sm transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <span>Continue</span>
                                            <span>&rarr;</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleSubmit(ProjectStatus.SUBMITTED)}
                                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
                                        >
                                            <span>🚀</span>
                                            <span>Submit Proposal for Approval</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            )}
        </div>
    );
};

export default PlanningModule;
