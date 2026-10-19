import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Role, ProjectStatus, UserStatus, NotificationType, DocumentCategory } from './types';
import { NAVIGATION_ITEMS, ICONS, ROLE_PERMISSIONS } from './constants';
import { loadRoleDefinitions, saveRoleDefinitions, getUserEffectiveScope, filterProjectsByScope, filterContractsByScope, filterProcurementsByScope, filterInspectionsByScope, filterDocumentsByScope } from './services/accessControlService';
import { loadWeeklyPlans, saveWeeklyPlans, loadWeeklyReports, saveWeeklyReports, filterWeeklyPlansByScope, filterWeeklyReportsByScope } from './services/weeklyTrackingService';
import { loadStaff } from './services/staffService';
import { loadNgos } from './services/ngoService';
import Dashboard from './components/Dashboard';
import PlanningModule from './components/PlanningModule';
import ReviewModule from './components/ReviewModule';
import ProcurementModule from './components/ProcurementModule';
import ContractModule from './components/ContractModule';
import GeographicMapModule from './components/GeographicMapModule';
import PerformanceDashboard from './components/PerformanceDashboard';
import UserManagementModule from './components/UserManagementModule';
import { NgoManagementModule } from './components/NgoManagementModule';
import { StaffManagementModule } from './components/StaffManagementModule';
import MasterDataModule from './components/MasterDataModule';
import DocumentModule from './components/DocumentModule';
import ReportingModule from './components/ReportingModule';
import TrainingModule from './components/TrainingModule';
import DevelopmentPartnersPortal from './components/DevelopmentPartnersPortal';
import Login from './components/Login';
import NotificationPanel from './components/Notification';
import { Logo } from './components/Logo';
import AIChatAssistant from './components/AIChatAssistant';
import { EmailService } from './services/emailService';
import Toast from './components/Toast';
import { CommandPalette } from './components/CommandPalette';
import { UserProfileModal } from './components/UserProfileModal';
import { ExternalPortal } from './components/ExternalPortal';
import { blobToBase64, base64ToBlob } from './services/dataService';
import { loadMasterData, saveMasterData, pushMasterDataToAllModules } from './services/masterDataService';
import { apiClient } from './services/apiClient';
import { flagContractsWithin30Days } from './utils/contractNotificationHelper';
import MetisLayout from './components/layout/MetisLayout';
import MetisPageHeader from './components/layout/MetisPageHeader';
const BACKUP_VERSION = '1.0';
const initialProjects = [];
const initialProcurements = [];
const initialContracts = [];
const initialNotifications = [];
const VALID_MODULES = [
    'dashboard', 'developmentPartners', 'ngos', 'staff', 'gisMap',
    'planning', 'review', 'procurement', 'contract', 'performance',
    'documents', 'reporting', 'usermanagement', 'masterdata', 'training'
];
const getInitialModuleFromHash = () => {
    if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.replace('#/', '').replace('#', '').split('?')[0].split('/')[0];
        if (VALID_MODULES.includes(hash)) {
            return hash;
        }
    }
    return 'dashboard';
};
export const getModuleTitle = (mod) => {
    switch (mod) {
        case 'usermanagement': return 'Users & Permissions Management';
        case 'developmentPartners': return 'Development Partners & Programs Portal';
        case 'ngos': return 'NGOs & Implementing Partners Registry';
        case 'staff': return 'Staff Management & Program Classifications';
        case 'contract': return 'Contract Administration & Delivery';
        case 'planning': return 'Planning & Project Formulation';
        case 'review': return 'Technical Review & EIA Compliance';
        case 'procurement': return 'Procurement & Tenders';
        case 'gisMap': return 'GIS & Regional Asset Map';
        case 'performance': return 'Performance & Overruns Dashboard';
        case 'documents': return 'Document Repository & Vault';
        case 'reporting': return 'Executive Reports & Analytics';
        case 'training': return 'Capacity Building & Training Center';
        case 'masterdata': return 'Master Data & Administrative Registry';
        case 'dashboard': return 'Executive Intelligence Dashboard';
        default: return (mod || 'Dashboard').charAt(0).toUpperCase() + (mod || 'Dashboard').slice(1);
    }
};
export const getModuleSubtitle = (mod) => {
    switch (mod) {
        case 'usermanagement': return 'Role-Based Access Control (RBAC), user directory, permissions matrix, and audit logs';
        case 'developmentPartners': return 'Bilateral, multilateral, and government WASH programs: COWASH, OWNP/CWA, UWSSP-II, Borana Resilience, UNICEF';
        case 'ngos': return 'Authorized non-governmental organizations and implementing partners registry';
        case 'staff': return 'Bureau zonal hydraulic engineers, resident supervisors, and project staff roster';
        case 'contract': return 'Binding contract agreements, performance securities, milestone payments, and variations';
        case 'planning': return 'Technical scheme initiation, hydrological feasibility parameters, and pipeline proposals';
        case 'review': return 'Zonal engineering appraisal, technical scoring, and executive approval workflow';
        case 'procurement': return 'Tender packages, competitive bidding stages, evaluation committees, and award notices';
        case 'gisMap': return 'Spatial GIS distribution, GPS coordinates, and water quality telemetry across 21 zones';
        case 'performance': return 'Earned Value Management (EVM), Cost Performance Index (CPI), and Schedule Variance (SV)';
        case 'documents': return 'Central cryptographic project document vault, technical drawings, and legal deeds';
        case 'reporting': return 'Executive analytical summaries, regional disaggregations, and database backups';
        case 'training': return 'Capacity building curriculum, standard operating procedures, and technical documentation';
        case 'masterdata': return 'Master data catalog, administrative registry, and institutional workflow rules';
        case 'dashboard': return 'Real-time regional water resource & infrastructure portfolio across 21 zones';
        default: return 'OWBPMIS — Oromia Water Bureau Program Management Information System';
    }
};
const App = () => {
    const [authenticatedUser, setAuthenticatedUser] = useState(null);
    const [simulatedRole, setSimulatedRole] = useState(null);
    const [originalUser, setOriginalUser] = useState(null);
    const [activeModule, setActiveModule] = useState(getInitialModuleFromHash);
    // Data states backed by PostgreSQL & Django REST Framework
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState(initialProjects);
    const [procurements, setProcurements] = useState(initialProcurements);
    const [contracts, setContracts] = useState(initialContracts);
    const [notifications, setNotifications] = useState(initialNotifications);
    const [documents, setDocuments] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [masterData, setMasterData] = useState(() => loadMasterData());
    const [fieldInspections, setFieldInspections] = useState([]);
    const [weeklyPlans, setWeeklyPlans] = useState(() => loadWeeklyPlans());
    const [weeklyReports, setWeeklyReports] = useState(() => loadWeeklyReports());
    const [staffList, setStaffList] = useState(() => loadStaff());
    const [ngosList, setNgosList] = useState(() => loadNgos());
    const [toastMessage, setToastMessage] = useState(null);
    // Centralized RBAC & Custom Role Definitions
    const [roles, setRoles] = useState(() => loadRoleDefinitions());
    const handleUpdateRoles = useCallback((newRoles) => {
        setRoles(newRoles);
        saveRoleDefinitions(newRoles);
    }, []);
    const [selectedContract, setSelectedContract] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
    const [isExternalPortalOpen, setIsExternalPortalOpen] = useState(false);
    const notificationRef = useRef(null);
    const personaMenuRef = useRef(null);
    // Instantiate services
    const emailService = useMemo(() => new EmailService((msg) => setToastMessage(msg)), []);
    // Access Control & Data Scoping Engine (Strict Query-Level Isolation)
    const userEffectiveScope = useMemo(() => {
        return getUserEffectiveScope(authenticatedUser, roles);
    }, [authenticatedUser, roles]);
    const accessibleProjects = useMemo(() => {
        return filterProjectsByScope(projects || [], authenticatedUser, roles);
    }, [projects, authenticatedUser, roles]);
    const accessibleContracts = useMemo(() => {
        return filterContractsByScope(contracts || [], projects || [], authenticatedUser, roles);
    }, [contracts, projects, authenticatedUser, roles]);
    const accessibleProcurements = useMemo(() => {
        return filterProcurementsByScope(procurements || [], projects || [], authenticatedUser, roles);
    }, [procurements, projects, authenticatedUser, roles]);
    const accessibleInspections = useMemo(() => {
        return filterInspectionsByScope(fieldInspections || [], projects || [], authenticatedUser, roles);
    }, [fieldInspections, projects, authenticatedUser, roles]);
    const accessibleDocuments = useMemo(() => {
        return filterDocumentsByScope(documents || [], projects || [], authenticatedUser, roles);
    }, [documents, projects, authenticatedUser, roles]);
    const accessibleWeeklyPlans = useMemo(() => {
        return filterWeeklyPlansByScope(weeklyPlans || [], authenticatedUser, projects || [], roles);
    }, [weeklyPlans, authenticatedUser, projects, roles]);
    const accessibleWeeklyReports = useMemo(() => {
        return filterWeeklyReportsByScope(weeklyReports || [], authenticatedUser, projects || [], roles);
    }, [weeklyReports, authenticatedUser, projects, roles]);
    const logActivity = useCallback((action, options) => {
        const userToLog = options?.user || authenticatedUser;
        if (!userToLog)
            return;
        const { user, ...restOptions } = options || {};
        const newLog = {
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: userToLog.username,
            action: action,
            ...restOptions
        };
        setActivityLogs(prev => [newLog, ...prev]);
        apiClient.logActivity({
            user: userToLog.username,
            action: action,
            target_type: restOptions.targetType || '',
            target_id: restOptions.targetId || '',
            details: restOptions.details || ''
        }).catch(err => console.warn('Activity log sync:', err));
    }, [authenticatedUser]);
    const sendAppNotification = useCallback((recipient, message, type, link) => {
        let targetUsers = [];
        if (recipient.username) {
            const user = users.find(u => u.username === recipient.username);
            if (user)
                targetUsers.push(user);
        }
        else if (recipient.role) {
            targetUsers = users.filter(u => u.role === recipient.role);
        }
        if (targetUsers.length === 0)
            return;
        const newNotifs = [];
        targetUsers.forEach(user => {
            newNotifs.push({
                id: `notif-${Date.now()}-${user.id}`,
                userId: user.username,
                message: message,
                type: type,
                isRead: false,
                link: link,
                timestamp: new Date().toISOString(),
            });
            // Send to real backend notification endpoint
            apiClient.sendNotification({
                user: user.id,
                message: message,
                type: type,
                link: link
            }).catch(err => console.warn('Notification sync:', err));
            // Send corresponding email notification
            emailService.sendEmail({
                to: `${user.username}@oweb.gov.et`,
                subject: `[OWBPMIS] New Notification: ${type.replace(/_/g, ' ').toUpperCase()}`,
                body: `Hello ${user.username},\n\nYou have a new notification in OWBPMIS (Oromia Water Bureau Program Management Information System):\n\n"${message}"\n\nPlease log in to view the details.\n\nThank you,\nOWBPMIS Administration`,
            });
        });
        setNotifications(prev => [...prev, ...newNotifs]);
    }, [users, emailService]);
    const handleAddInspection = useCallback((newInspection) => {
        setFieldInspections(prev => [newInspection, ...prev]);
        apiClient.saveInspection({
            inspection_id: newInspection.id,
            project_id: newInspection.projectId,
            project_name: newInspection.projectName,
            program: newInspection.program,
            zone: newInspection.zone,
            woreda: newInspection.woreda,
            inspection_date: newInspection.inspectionDate,
            inspector_name: newInspection.inspectorName,
            inspector_role: newInspection.inspectorRole,
            visit_stage: newInspection.visitStage,
            overall_physical_progress_pct: newInspection.overallPhysicalProgressPct,
            workmanship_rating: newInspection.workmanshipRating,
            site_cleanliness_and_safety: newInspection.siteCleanlinessAndSafety,
            environmental_compliance: newInspection.environmentalCompliance,
            water_quality_test: newInspection.waterQualityTest,
            defects: newInspection.defects,
            supervisor_remarks: newInspection.supervisorRemarks,
            recommended_actions: newInspection.recommendedActions,
            signed_off_by: newInspection.signedOffBy,
            status: newInspection.status,
        }).catch(err => console.warn('Inspection sync:', err));
        logActivity('Logged new site inspection & QA verification', { targetType: 'FieldInspection', targetId: newInspection.id, details: `${newInspection.projectName} (${newInspection.visitStage})` });
        setToastMessage(`Site inspection ${newInspection.id} recorded successfully.`);
        sendAppNotification({ role: Role.ADMIN }, `New QA/QC inspection logged for "${newInspection.projectName}" by ${newInspection.inspectorName}.`, NotificationType.APPROVAL_REQUIRED, { moduleId: 'inspection', itemId: newInspection.id });
    }, [logActivity, sendAppNotification]);
    const handleUpdateInspection = useCallback((updated) => {
        setFieldInspections(prev => prev.map(item => item.id === updated.id ? updated : item));
        apiClient.saveInspection({
            inspection_id: updated.id,
            project_id: updated.projectId,
            project_name: updated.projectName,
            program: updated.program,
            zone: updated.zone,
            woreda: updated.woreda,
            inspection_date: updated.inspectionDate,
            inspector_name: updated.inspectorName,
            inspector_role: updated.inspectorRole,
            visit_stage: updated.visitStage,
            overall_physical_progress_pct: updated.overallPhysicalProgressPct,
            workmanship_rating: updated.workmanshipRating,
            site_cleanliness_and_safety: updated.siteCleanlinessAndSafety,
            environmental_compliance: updated.environmentalCompliance,
            water_quality_test: updated.waterQualityTest,
            defects: updated.defects,
            supervisor_remarks: updated.supervisorRemarks,
            recommended_actions: updated.recommendedActions,
            signed_off_by: updated.signedOffBy,
            status: updated.status,
        }).catch(err => console.warn('Inspection update sync:', err));
        logActivity('Updated site inspection log', { targetType: 'FieldInspection', targetId: updated.id, details: `${updated.projectName}` });
        setToastMessage(`Inspection ${updated.id} updated.`);
    }, [logActivity]);
    const handleAddWeeklyPlan = useCallback((newPlan) => {
        setWeeklyPlans(prev => [newPlan, ...prev]);
        saveWeeklyPlans([newPlan]);
        logActivity('Formulated & submitted new Weekly Work Plan', { targetType: 'WeeklyPlan', targetId: newPlan.id, details: `${newPlan.projectName} (Week ${newPlan.weekNumber})` });
        setToastMessage(`Weekly Work Plan ${newPlan.id} submitted for ${newPlan.projectName}.`);
        sendAppNotification({ role: Role.SUPERVISOR }, `Weekly Work Plan ${newPlan.id} submitted for "${newPlan.projectName}" by ${newPlan.preparedByName}.`, NotificationType.APPROVAL_REQUIRED, { moduleId: 'inspection', itemId: newPlan.id });
    }, [logActivity, sendAppNotification]);
    const handleUpdateWeeklyPlan = useCallback((updatedPlan) => {
        setWeeklyPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
        saveWeeklyPlans([updatedPlan]);
        logActivity('Updated Weekly Work Plan / Approval Status', { targetType: 'WeeklyPlan', targetId: updatedPlan.id, details: `Status: ${updatedPlan.status}` });
        setToastMessage(`Weekly Plan ${updatedPlan.id} updated (${updatedPlan.status}).`);
    }, [logActivity]);
    const handleAddWeeklyReport = useCallback((newReport) => {
        setWeeklyReports(prev => [newReport, ...prev]);
        saveWeeklyReports([newReport]);
        logActivity('Logged Weekly Site Progress Report', { targetType: 'WeeklyReport', targetId: newReport.id, details: `${newReport.projectName} (${newReport.cumulativePhysicalProgressPct}% cumulative)` });
        setToastMessage(`Weekly Progress Report ${newReport.id} submitted.`);
        sendAppNotification({ role: Role.SUPERVISOR }, `Weekly Progress Report ${newReport.id} logged for "${newReport.projectName}": ${newReport.cumulativePhysicalProgressPct}% cumulative.`, NotificationType.INFO, { moduleId: 'inspection', itemId: newReport.id });
    }, [logActivity, sendAppNotification]);
    const handleUpdateWeeklyReport = useCallback((updatedReport) => {
        setWeeklyReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
        saveWeeklyReports([updatedReport]);
        logActivity('Updated Weekly Site Progress Report', { targetType: 'WeeklyReport', targetId: updatedReport.id, details: `Status: ${updatedReport.status}` });
        setToastMessage(`Weekly Progress Report ${updatedReport.id} updated.`);
    }, [logActivity]);
    /**
     * Helper function that flags contracts in the notification system
     * when their performance bond or expected completion date is within 30 days.
     */
    const flagContractsNearDeadline = useCallback((customContracts, showToast = false) => {
        const targetContracts = customContracts || contracts;
        const result = flagContractsWithin30Days(targetContracts, projects, users, notifications);
        if (result.newNotifications.length > 0) {
            setNotifications(prev => [...result.newNotifications, ...prev]);
            logActivity('Flagged Expiring Contracts in Notification System', {
                targetType: 'Contract',
                details: `${result.totalFlagged} contract(s) flagged: ${result.bondExpiringCount} performance bond expiries, ${result.completionExpiringCount} completion deadlines within 30 days.`
            });
            if (showToast) {
                setToastMessage(`Contract audit complete: ${result.totalFlagged} deadline alerts generated (${result.bondExpiringCount} bond, ${result.completionExpiringCount} completion).`);
            }
        }
        else if (showToast) {
            setToastMessage("Contract audit complete: All active contracts are within compliant timeline windows (>30 days).");
        }
        return result;
    }, [contracts, projects, users, notifications, logActivity]);
    // Automatically audit & flag contracts within 30 days on initial mount and when contracts change
    useEffect(() => {
        if (contracts.length > 0 && users.length > 0) {
            const result = flagContractsWithin30Days(contracts, projects, users, notifications);
            if (result.newNotifications.length > 0) {
                setNotifications(prev => [...result.newNotifications, ...prev]);
            }
        }
    }, [contracts, projects, users]);
    // Live documents are loaded from Django REST Framework & PostgreSQL
    // Load live records from Django REST Framework & PostgreSQL on initial mount
    const fetchInitialBackendData = useCallback(async () => {
        try {
            // Restore user session if JWT token exists in storage
            if (apiClient.token) {
                try {
                    const meData = await apiClient.getMe();
                    if (meData && meData.id) {
                        setAuthenticatedUser(prev => prev || {
                            ...meData,
                            id: String(meData.id),
                            fullName: meData.full_name || meData.fullName,
                            secondaryRoles: meData.secondary_roles || meData.secondaryRoles,
                            customRoleIds: meData.custom_role_ids || meData.customRoleIds,
                            customPermissions: meData.custom_permissions || meData.customPermissions,
                            assignedTeam: meData.assigned_team || meData.assignedTeam,
                            assignedZone: meData.assigned_zone || meData.assignedZone,
                            assignedWoreda: meData.assigned_woreda || meData.assignedWoreda,
                            assignedProgram: meData.assigned_program || meData.assignedProgram,
                            assignedPrograms: meData.assigned_programs || meData.assignedPrograms,
                            assignedNgoId: meData.assigned_ngo_id || meData.assignedNgoId,
                            assignedNgoName: meData.assigned_ngo_name || meData.assignedNgoName,
                            staffProfileId: meData.staff_profile_id || meData.staffProfileId,
                            assignedProjectIds: meData.assigned_project_ids || meData.assignedProjectIds,
                            dataScopeOverride: meData.data_scope_override || meData.dataScopeOverride,
                            lastLogin: meData.last_login || meData.lastLogin || new Date().toISOString(),
                        });
                    }
                } catch (authErr) {
                    console.warn('Session check expired or invalid:', authErr?.message);
                    apiClient.setTokens(null, null);
                }
            }

            // Fetch users (if authenticated)
            if (apiClient.token) {
                try {
                    const remoteUsers = await apiClient.getUsers();
                    if (remoteUsers && Array.isArray(remoteUsers)) {
                        setUsers(remoteUsers.map((u) => ({
                            ...u,
                            id: String(u.id),
                            fullName: u.full_name || u.fullName,
                            secondaryRoles: u.secondary_roles || u.secondaryRoles,
                            customRoleIds: u.custom_role_ids || u.customRoleIds,
                            customPermissions: u.custom_permissions || u.customPermissions,
                            assignedTeam: u.assigned_team || u.assignedTeam,
                            assignedZone: u.assigned_zone || u.assignedZone,
                            assignedWoreda: u.assigned_woreda || u.assignedWoreda,
                            assignedProgram: u.assigned_program || u.assignedProgram,
                            assignedPrograms: u.assigned_programs || u.assignedPrograms,
                            assignedNgoId: u.assigned_ngo_id || u.assignedNgoId,
                            assignedNgoName: u.assigned_ngo_name || u.assignedNgoName,
                            staffProfileId: u.staff_profile_id || u.staffProfileId,
                            assignedProjectIds: u.assigned_project_ids || u.assignedProjectIds,
                            dataScopeOverride: u.data_scope_override || u.dataScopeOverride,
                            lastLogin: u.last_login || u.lastLogin,
                            createdAt: u.created_at || u.createdAt,
                        })));
                    }
                } catch (usersErr) {
                    console.warn('User directory sync check:', usersErr?.message);
                }
            }
            // Fetch projects
            const remoteProjects = await apiClient.getProjects();
            if (remoteProjects && Array.isArray(remoteProjects)) {
                setProjects(remoteProjects.map((p) => ({
                    ...p,
                    id: p.project_id || p.id,
                    projectCode: p.project_code || p.projectCode,
                    programId: p.program_id || p.programId,
                    programComponent: p.program_component || p.programComponent,
                    implementingNgoId: p.implementing_ngo_id || p.implementingNgoId,
                    implementingNgoName: p.implementing_ngo_name || p.implementingNgoName,
                    projectManager: p.project_manager || p.projectManager,
                    assignedStaffIds: p.assigned_staff_ids || p.assignedStaffIds,
                    assignedStaffNames: p.assigned_staff_names || p.assignedStaffNames,
                    gpsCoordinates: p.gps_coordinates || p.gpsCoordinates || { lat: 8.5, long: 39.2 },
                    projectType: p.project_type || p.projectType,
                    projectSubType: p.project_sub_type || p.projectSubType,
                    sourceOfWater: p.source_of_water || p.sourceOfWater,
                    energySource: p.energy_source || p.energySource,
                    typeOfIntervention: p.type_of_intervention || p.typeOfIntervention,
                    populationCoverage: p.population_coverage || p.populationCoverage || 0,
                    dailyDemandEstimate: p.daily_demand_estimate || p.dailyDemandEstimate || 0,
                    storageRequirement: p.storage_requirement || p.storageRequirement || 0,
                    pipeLengthEstimation: p.pipe_length_estimation || p.pipeLengthEstimation || 0,
                    implementingBody: p.implementing_body || p.implementingBody,
                    washcoExists: p.washco_exists !== undefined ? p.washco_exists : p.washcoExists,
                    washcoDetails: p.washco_details || p.washcoDetails,
                    landOwnershipCleared: p.land_ownership_cleared !== undefined ? p.land_ownership_cleared : p.landOwnershipCleared,
                    landOwnershipComment: p.land_ownership_comment || p.landOwnershipComment,
                    powerSourceAvailable: p.power_source_available !== undefined ? p.power_source_available : p.powerSourceAvailable,
                    skilledOperatorsAvailable: p.skilled_operators_available !== undefined ? p.skilled_operators_available : p.skilledOperatorsAvailable,
                    estimatedBudget: Number(p.estimated_budget || p.estimatedBudget || 0),
                    phaseCosts: p.phase_costs || p.phaseCosts,
                    fundingSource: p.funding_source || p.fundingSource,
                    communityContribution: p.community_contribution || p.communityContribution,
                    environmentalRiskLevel: p.environmental_risk_level || p.environmentalRiskLevel,
                    sourceReliability: p.source_reliability || p.sourceReliability,
                    conflictOverSource: p.conflict_over_source !== undefined ? p.conflict_over_source : p.conflictOverSource,
                    feasibilityStudyConducted: p.feasibility_study_conducted !== undefined ? p.feasibility_study_conducted : p.feasibilityStudyConducted,
                    feasibilityConsultant: p.feasibility_consultant || p.feasibilityConsultant,
                    feasibilityStudyDate: p.feasibility_study_date || p.feasibilityStudyDate,
                    eiaConducted: p.eia_conducted !== undefined ? p.eia_conducted : p.eiaConducted,
                    eiaConsultant: p.eia_consultant || p.eiaConsultant,
                    eiaApprovalAuthority: p.eia_approval_authority || p.eiaApprovalAuthority || '',
                    eiaApprovalDate: p.eia_approval_date || p.eiaApprovalDate,
                    eiaRiskRating: p.eia_risk_rating || p.eiaRiskRating || 'Low',
                    plannedStartDate: p.planned_start_date || p.plannedStartDate,
                    plannedCompletionDate: p.planned_completion_date || p.plannedCompletionDate,
                    actualStartDate: p.actual_start_date || p.actualStartDate,
                    actualCompletionDate: p.actual_completion_date || p.actualCompletionDate,
                    assignedEngineerId: p.assigned_engineer_id || p.assignedEngineerId,
                    assignedEngineerName: p.assigned_engineer_name || p.assignedEngineerName,
                    assignedSupervisorId: p.assigned_supervisor_id || p.assignedSupervisorId,
                    assignedSupervisorName: p.assigned_supervisor_name || p.assignedSupervisorName,
                    assignedTeamLeaderId: p.assigned_team_leader_id || p.assignedTeamLeaderId,
                    assignedTeam: p.assigned_team || p.assignedTeam,
                    partnerOrganization: p.partner_organization || p.partnerOrganization,
                    summary: p.summary || '',
                    aiRiskAssessment: p.ai_risk_assessment || p.aiRiskAssessment || { level: 'Unknown', keyRisks: [], mitigationStrategies: [] },
                    reviewComments: p.review_comments || p.reviewComments || '',
                    reviewedBy: p.reviewed_by || p.reviewedBy || '',
                    reviewDate: p.review_date || p.reviewDate || '',
                    reviewScore: p.review_score !== undefined && p.review_score !== null ? Number(p.review_score) : p.reviewScore,
                    appraisalVerdict: p.appraisal_verdict || p.appraisalVerdict || '',
                    approvalCertificateNo: p.approval_certificate_no || p.approvalCertificateNo || '',
                    revisionPoints: p.revision_points || p.revisionPoints || [],
                    reviewChecklist: p.review_checklist || p.reviewChecklist || {},
                })));
            }
            // Fetch programs
            const remotePrograms = await apiClient.getPrograms();
            if (remotePrograms && Array.isArray(remotePrograms) && remotePrograms.length > 0) {
                setMasterData(prev => ({
                    ...prev,
                    programs: remotePrograms.map((pr) => ({
                        id: pr.prog_id || pr.id,
                        name: pr.name,
                        code: pr.code,
                        leadAgency: pr.funding_source || '',
                        focusArea: pr.focus_area || '',
                        color: '#0284c7',
                        badgeBg: 'bg-sky-50 border-sky-200',
                        badgeText: 'text-sky-700',
                        accentBorder: 'border-sky-500',
                        description: pr.description,
                        active: pr.status === 'Active',
                        totalBudgetETB: Number(pr.budget_etb || 0),
                        targetBeneficiaries: Number(pr.target_beneficiaries || 0)
                    }))
                }));
            }
            // Fetch NGOs
            const remoteNgos = await apiClient.getNgos();
            if (remoteNgos && Array.isArray(remoteNgos)) {
                setNgosList(remoteNgos.map((n) => ({
                    ...n,
                    id: n.ngo_id || n.id,
                    contactPerson: n.contact_person || n.contactPerson,
                    registrationNumber: n.registration_number || n.registrationNumber,
                    operatingArea: n.operating_area || n.operatingArea,
                    assignedProgramIds: n.assigned_program_ids || n.assignedProgramIds,
                    assignedProgramNames: n.assigned_program_names || n.assignedProgramNames,
                    assignedProjectIds: n.assigned_project_ids || n.assignedProjectIds,
                    activeSchemesCount: n.active_schemes_count || n.activeSchemesCount,
                    primaryProgram: n.primary_program || n.primaryProgram,
                    performanceRating: Number(n.performance_rating || n.performanceRating || 4.0),
                    annualBudget: Number(n.annual_budget || n.annualBudget || 0),
                    mouStatus: n.mou_status || n.mouStatus,
                })));
            }
            // Fetch Staff
            const remoteStaff = await apiClient.getStaff();
            if (remoteStaff && Array.isArray(remoteStaff)) {
                setStaffList(remoteStaff.map((s) => ({
                    ...s,
                    id: s.staff_id || s.id,
                    staffCode: s.staff_code || s.staffCode,
                    fullName: s.full_name || s.fullName,
                    jobTitle: s.job_title || s.jobTitle,
                    assignedProgramId: s.assigned_program_id || s.assignedProgramId,
                    assignedProgramName: s.assigned_program_name || s.assignedProgramName,
                    assignedNgoId: s.assigned_ngo_id || s.assignedNgoId,
                    assignedNgoName: s.assigned_ngo_name || s.assignedNgoName,
                    assignedProjectIds: s.assigned_project_ids || s.assignedProjectIds,
                    supervisorName: s.supervisor_name || s.supervisorName,
                    employmentStartDate: s.employment_start_date || s.employmentStartDate,
                    linkedUserId: s.linked_user_id || s.linkedUserId,
                })));
            }
            // Fetch Procurements
            const remoteProcurements = await apiClient.getProcurements();
            if (remoteProcurements && Array.isArray(remoteProcurements)) {
                setProcurements(remoteProcurements.map((pr) => ({
                    ...pr,
                    id: pr.procurement_id || pr.id,
                    projectId: pr.project_id || pr.projectId,
                    tenderReferenceNumber: pr.tender_reference_number || pr.tenderReferenceNumber,
                    procurementMethod: pr.procurement_method || pr.procurementMethod,
                    procurementType: pr.procurement_type || pr.procurementType,
                    bidIssuedDate: pr.bid_issued_date || pr.bidIssuedDate,
                    biddingPeriodStart: pr.bidding_period_start || pr.biddingPeriodStart,
                    biddingPeriodEnd: pr.bidding_period_end || pr.biddingPeriodEnd,
                    tenderStage: pr.tender_stage || pr.tenderStage,
                    evaluationStatus: pr.evaluation_status || pr.evaluationStatus,
                    evaluationCommittee: pr.evaluation_committee || pr.evaluationCommittee,
                    awardedBidderId: pr.awarded_bidder_id || pr.awardedBidderId,
                    awardDate: pr.award_date || pr.awardDate,
                    standstillPeriod: pr.standstill_period !== undefined ? pr.standstill_period : pr.standstillPeriod,
                    estimatedBudgetETB: Number(pr.estimated_budget_etb || pr.estimatedBudgetETB || 0),
                    finalContractValueETB: Number(pr.final_contract_value_etb || pr.finalContractValueETB || 0),
                })));
            }
            // Fetch Contracts
            const remoteContracts = await apiClient.getContracts();
            if (remoteContracts && Array.isArray(remoteContracts)) {
                setContracts(remoteContracts.map((c) => ({
                    ...c,
                    id: c.contract_id || c.id,
                    projectId: c.project_id || c.projectId,
                    procurementId: c.procurement_id || c.procurementId,
                    contractManager: c.contract_manager || c.contractManager,
                    cmPlanAssignmentDate: c.cm_plan_assignment_date || c.cmPlanAssignmentDate,
                    cmActualAssignmentDate: c.cm_actual_assignment_date || c.cmActualAssignmentDate,
                    supervisor: c.supervisor,
                    supervisorPlanAssignmentDate: c.supervisor_plan_assignment_date || c.supervisorPlanAssignmentDate,
                    supervisorActualAssignmentDate: c.supervisor_actual_assignment_date || c.supervisorActualAssignmentDate,
                    contractorName: c.contractor_name || c.contractorName,
                    performanceSecurityPlanDate: c.performance_security_plan_date || c.performanceSecurityPlanDate,
                    performanceSecurityActualDate: c.performance_security_actual_date || c.performanceSecurityActualDate,
                    performanceSecurityExpiryDate: c.performance_security_expiry_date || c.performanceSecurityExpiryDate,
                    performanceBondAmount: Number(c.performance_bond_amount || c.performanceBondAmount || 0),
                    signingDate: c.signing_date || c.signingDate,
                    commencementPlanDate: c.commencement_plan_date || c.commencementPlanDate,
                    commencementActualDate: c.commencement_actual_date || c.commencementActualDate,
                    plannedCompletionDate: c.planned_completion_date || c.plannedCompletionDate,
                    isPlanFinalized: c.is_plan_finalized !== undefined ? c.is_plan_finalized : c.isPlanFinalized,
                })));
            }
            // Fetch Field Inspections
            const remoteInspections = await apiClient.getInspections();
            if (remoteInspections && Array.isArray(remoteInspections)) {
                setFieldInspections(remoteInspections.map((i) => ({
                    ...i,
                    id: i.inspection_id || i.id,
                    projectId: i.project_id || i.projectId,
                    projectName: i.project_name || i.projectName,
                    inspectionDate: i.inspection_date || i.inspectionDate,
                    inspectorName: i.inspector_name || i.inspectorName,
                    inspectorRole: i.inspector_role || i.inspectorRole,
                    visitStage: i.visit_stage || i.visitStage,
                    overallPhysicalProgressPct: Number(i.overall_physical_progress_pct || i.overallPhysicalProgressPct || 0),
                    workmanshipRating: i.workmanship_rating || i.workmanshipRating,
                    siteCleanlinessAndSafety: i.site_cleanliness_and_safety || i.siteCleanlinessAndSafety,
                    environmentalCompliance: i.environmental_compliance || i.environmentalCompliance,
                    waterQualityTest: i.water_quality_test || i.waterQualityTest,
                    supervisorRemarks: i.supervisor_remarks || i.supervisorRemarks,
                    recommendedActions: i.recommended_actions || i.recommendedActions,
                    signedOffBy: i.signed_off_by || i.signedOffBy,
                })));
            }
            // Fetch Weekly Plans
            const remotePlans = await apiClient.getWeeklyPlans();
            if (remotePlans && Array.isArray(remotePlans)) {
                setWeeklyPlans(remotePlans.map((pl) => ({
                    id: pl.plan_id || String(pl.id),
                    projectId: pl.project_id || pl.projectId,
                    projectName: pl.project_name || pl.projectName,
                    zone: pl.zone || '',
                    woreda: pl.woreda || '',
                    kebele: pl.kebele || '',
                    weekNumber: pl.week_number || pl.weekNumber || 1,
                    startDate: pl.start_date || pl.startDate || '',
                    endDate: pl.end_date || pl.endDate || '',
                    preparedByUserId: pl.prepared_by_user_id || pl.preparedByUserId || '',
                    preparedByName: pl.prepared_by_name || pl.preparedByName || '',
                    preparedDate: pl.prepared_date || pl.preparedDate || '',
                    targetPhysicalProgressPct: Number(pl.target_physical_progress_pct || pl.targetPhysicalProgressPct || 0),
                    status: pl.status || 'Pending Approval',
                    supervisorComments: pl.supervisor_comments || pl.supervisorComments || '',
                    approvedByUserId: pl.approved_by_user_id || pl.approvedByUserId || '',
                    approvedByName: pl.approved_by_name || pl.approvedByName || '',
                    approvalDate: pl.approval_date || pl.approvalDate || '',
                    plannedActivities: Array.isArray(pl.planned_activities) ? pl.planned_activities : (Array.isArray(pl.plannedActivities) ? pl.plannedActivities : []),
                })));
            }
            // Fetch Weekly Reports
            const remoteReports = await apiClient.getWeeklyReports();
            if (remoteReports && Array.isArray(remoteReports)) {
                setWeeklyReports(remoteReports.map((rp) => ({
                    id: rp.report_id || String(rp.id),
                    workPlanId: rp.work_plan_id || rp.workPlanId,
                    projectId: rp.project_id || rp.projectId,
                    projectName: rp.project_name || rp.projectName,
                    zone: rp.zone || '',
                    woreda: rp.woreda || '',
                    kebele: rp.kebele || '',
                    weekNumber: rp.week_number || rp.weekNumber || 1,
                    startDate: rp.start_date || rp.startDate || '',
                    endDate: rp.end_date || rp.endDate || '',
                    submittedByUserId: rp.submitted_by_user_id || rp.submittedByUserId || '',
                    submittedByName: rp.submitted_by_name || rp.submittedByName || '',
                    submittedDate: rp.submitted_date || rp.submittedDate || '',
                    cumulativePhysicalProgressPct: Number(rp.cumulative_physical_progress_pct || rp.cumulativePhysicalProgressPct || 0),
                    status: rp.status || 'Pending Review',
                    reviewedByUserId: rp.reviewed_by_user_id || rp.reviewedByUserId || '',
                    reviewedByName: rp.reviewed_by_name || rp.reviewedByName || '',
                    reviewDate: rp.review_date || rp.reviewDate || '',
                    supervisorFeedback: rp.supervisor_feedback || rp.supervisorFeedback || '',
                    activityExecutions: Array.isArray(rp.activity_executions) ? rp.activity_executions : (Array.isArray(rp.activityExecutions) ? rp.activityExecutions : []),
                    siteChallenges: Array.isArray(rp.site_challenges) ? rp.site_challenges : (Array.isArray(rp.siteChallenges) ? rp.siteChallenges : []),
                    materialsOnSite: Array.isArray(rp.materials_on_site) ? rp.materials_on_site : (Array.isArray(rp.materialsOnSite) ? rp.materialsOnSite : []),
                    manpowerOnSite: Array.isArray(rp.manpower_on_site) ? rp.manpower_on_site : (Array.isArray(rp.manpowerOnSite) ? rp.manpowerOnSite : []),
                    equipmentOnSite: Array.isArray(rp.equipment_on_site) ? rp.equipment_on_site : (Array.isArray(rp.equipmentOnSite) ? rp.equipmentOnSite : []),
                    sitePhotos: Array.isArray(rp.site_photos) ? rp.site_photos : (Array.isArray(rp.sitePhotos) ? rp.sitePhotos : []),
                })));
            }
            // Fetch Roles
            const remoteRoles = await apiClient.getRoles();
            if (remoteRoles && Array.isArray(remoteRoles) && remoteRoles.length > 0) {
                setRoles(remoteRoles.map((r) => ({
                    id: String(r.id),
                    code: r.code,
                    name: r.name,
                    description: r.description,
                    status: r.status,
                    permissions: r.permissions || [],
                    defaultDataScope: r.default_data_scope || r.defaultDataScope || 'ALL',
                    organizationScope: r.organization_scope || r.organizationScope || '',
                    isSystem: r.is_system !== undefined ? r.is_system : r.isSystem,
                    color: r.color || '',
                })));
            }
            // Fetch Activity Logs
            const remoteLogs = await apiClient.getActivityLogs();
            if (remoteLogs && Array.isArray(remoteLogs) && remoteLogs.length > 0) {
                setActivityLogs(remoteLogs.map((l) => ({
                    id: String(l.id),
                    timestamp: l.timestamp,
                    user: l.user,
                    action: l.action,
                    targetType: l.target_type || l.targetType,
                    targetId: l.target_id || l.targetId,
                    details: l.details
                })));
            }
            // Fetch Documents
            const remoteDocs = await apiClient.getDocuments();
            if (remoteDocs && Array.isArray(remoteDocs) && remoteDocs.length > 0) {
                setDocuments(remoteDocs.map((d) => ({
                    id: d.document_id || String(d.id),
                    projectId: d.project_id || d.projectId,
                    fileName: d.file_name || d.fileName,
                    fileUrl: d.file_url || d.fileUrl || '#',
                    category: d.category,
                    uploadedBy: d.uploaded_by || d.uploadedBy,
                    uploadDate: d.upload_date || d.uploadDate
                })));
            }
            // Fetch Notifications
            const remoteNotifs = await apiClient.getNotifications();
            if (remoteNotifs && Array.isArray(remoteNotifs) && remoteNotifs.length > 0) {
                setNotifications(remoteNotifs.map((n) => ({
                    id: String(n.id),
                    userId: n.user,
                    message: n.message,
                    type: n.type,
                    isRead: n.is_read,
                    link: n.link,
                    timestamp: n.created_at
                })));
            }
            // Fetch Master Data Catalog from PostgreSQL
            try {
                const remoteMaster = await apiClient.getMasterData();
                if (remoteMaster && (remoteMaster.catalogCategories?.length > 0 || remoteMaster.regions?.length > 0)) {
                    setMasterData(prev => ({
                        ...prev,
                        ...remoteMaster,
                        catalogCategories: remoteMaster.catalogCategories || prev.catalogCategories,
                        catalogItems: remoteMaster.catalogItems || prev.catalogItems,
                        systemConfigurations: remoteMaster.systemConfigurations || prev.systemConfigurations,
                        workflowSteps: remoteMaster.workflowSteps || prev.workflowSteps,
                        approvalThresholds: remoteMaster.approvalThresholds || prev.approvalThresholds,
                        regions: remoteMaster.regions || prev.regions,
                        woredas: remoteMaster.woredas || prev.woredas,
                        kebeles: remoteMaster.kebeles || prev.kebeles,
                    }));
                }
            } catch (mErr) {
                console.warn('Backend master data sync check:', mErr?.message);
            }
        }
        catch (err) {
            console.warn('Backend connection initial sync check:', err);
        }
    }, []);
    useEffect(() => {
        fetchInitialBackendData();
    }, [fetchInitialBackendData]);
    useEffect(() => {
        if (activeModule !== 'contract') {
            setSelectedContract(null);
        }
        // Update browser URL hash without full reload
        const currentHash = window.location.hash.replace('#/', '').replace('#', '');
        if (currentHash !== activeModule) {
            window.location.hash = `#/${activeModule}`;
        }
        // Update document title dynamically
        document.title = `${getModuleTitle(activeModule)} | OWBPMIS`;
    }, [activeModule]);
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#/', '').replace('#', '').split('?')[0].split('/')[0];
            if (VALID_MODULES.includes(hash)) {
                setActiveModule(hash);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        window.addEventListener('popstate', handleHashChange);
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
            window.removeEventListener('popstate', handleHashChange);
        };
    }, []);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (personaMenuRef.current && !personaMenuRef.current.contains(event.target)) {
                setIsPersonaMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    // Global keyboard shortcut for Command Palette (Cmd+K / Ctrl+K or /)
    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    // Effect to clean up blob URLs on component unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            documents.forEach(doc => {
                if (doc.fileUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(doc.fileUrl);
                }
            });
        };
    }, [documents]);
    const filteredNotifications = useMemo(() => {
        if (!authenticatedUser)
            return [];
        return notifications
            .filter(n => n.userId === authenticatedUser.username)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [notifications, authenticatedUser]);
    const unreadCount = useMemo(() => {
        return filteredNotifications.filter(n => !n.isRead).length;
    }, [filteredNotifications]);
    const visibleNavigationItems = useMemo(() => {
        if (!authenticatedUser)
            return [];
        return NAVIGATION_ITEMS.filter(item => {
            if (item.id === 'usermanagement') {
                return ROLE_PERMISSIONS.canViewUserManagement?.includes(authenticatedUser.role) || (originalUser && ROLE_PERMISSIONS.canViewUserManagement?.includes(originalUser.role));
            }
            if (item.id === 'masterdata') {
                return ROLE_PERMISSIONS.canViewMasterData?.includes(authenticatedUser.role) || (originalUser && ROLE_PERMISSIONS.canViewMasterData?.includes(originalUser.role));
            }
            if (item.id === 'gisMap') {
                return (ROLE_PERMISSIONS.canViewGisMap || ROLE_PERMISSIONS.canViewDashboard)?.includes(authenticatedUser.role);
            }
            if (item.id === 'performance') {
                return (ROLE_PERMISSIONS.canViewPerformance || Object.values(Role))?.includes(authenticatedUser.role);
            }
            const key = `canView${item.id.charAt(0).toUpperCase() + item.id.slice(1).replace('Mgmt', 'Management')}`;
            return ROLE_PERMISSIONS[key]?.includes(authenticatedUser.role);
        });
    }, [authenticatedUser, originalUser]);
    // Dynamic badge counts for navigation items
    const navBadges = useMemo(() => {
        const pendingReviews = projects.filter(p => p.status === ProjectStatus.SUBMITTED || p.status === ProjectStatus.DRAFT).length;
        const activeTenders = procurements.filter(pr => pr.status === 'Open' || pr.status === 'Evaluated').length;
        const activeContracts = contracts.filter(c => c.status === 'Active').length;
        const criticalOverruns = projects.filter(p => {
            const contract = contracts.find(c => c.projectId === p.id);
            const approvedVariations = contract?.variations.filter(v => v.status === 'Approved').reduce((s, v) => s + v.amount, 0) || 0;
            const revisedBudget = (p.estimatedBudget || 0) + approvedVariations;
            const contractExp = contract?.payments.reduce((s, pay) => s + (pay.actualAmount || 0), 0) || 0;
            const phaseExp = (p.phaseCosts || []).reduce((s, ph) => s + (ph.actualAmount || 0), 0);
            const actualExp = Math.max(contractExp, phaseExp);
            return revisedBudget > 0 && actualExp > revisedBudget * 1.10;
        }).length;
        const activeNgos = ngosList.filter(n => n.status === 'Active').length;
        const activeStaff = staffList.filter(s => s.status === 'Active').length;
        return {
            programs: { label: '6', color: 'bg-indigo-500 text-white' },
            ngos: activeNgos > 0 ? { label: `${activeNgos}`, color: 'bg-teal-500 text-white' } : undefined,
            staff: activeStaff > 0 ? { label: `${activeStaff}`, color: 'bg-cyan-600 text-white' } : undefined,
            review: pendingReviews > 0 ? { label: `${pendingReviews}`, color: 'bg-amber-500 text-white' } : undefined,
            procurement: activeTenders > 0 ? { label: `${activeTenders}`, color: 'bg-sky-500 text-white' } : undefined,
            contract: activeContracts > 0 ? { label: `${activeContracts}`, color: 'bg-emerald-500 text-white' } : undefined,
            performance: criticalOverruns > 0 ? { label: `! ${criticalOverruns}`, color: 'bg-rose-500 text-white animate-pulse' } : undefined,
        };
    }, [projects, procurements, contracts, ngosList, staffList]);
    // Navigation item groups for professional water & energy bureau taxonomy
    const navGroups = useMemo(() => [
        {
            title: 'Water Portfolios & Operations',
            items: visibleNavigationItems.filter(item => ['dashboard', 'developmentPartners', 'ngos', 'staff', 'gisMap', 'planning'].includes(item.id))
        },
        {
            title: 'Tenders, Works & QA/QC',
            items: visibleNavigationItems.filter(item => ['review', 'procurement', 'contract'].includes(item.id))
        },
        {
            title: 'Governance, Telemetry & Registry',
            items: visibleNavigationItems.filter(item => ['performance', 'documents', 'reporting', 'masterdata', 'training', 'usermanagement'].includes(item.id))
        }
    ], [visibleNavigationItems]);
    const handleLogin = async (username, password) => {
        const cleanInput = (username || '').trim();
        const cleanPass = (password || '').trim();
        if (!cleanInput) {
            return "Please enter your username or bureau email address.";
        }
        // 1. Authenticate against Django REST Framework SimpleJWT endpoint
        try {
            const apiRes = await apiClient.login(cleanInput, cleanPass);
            if (apiRes && apiRes.user) {
                const u = apiRes.user;
                const authenticatedUserData = {
                    ...u,
                    id: String(u.id),
                    fullName: u.full_name || u.fullName,
                    secondaryRoles: u.secondary_roles || u.secondaryRoles,
                    customRoleIds: u.custom_role_ids || u.customRoleIds,
                    customPermissions: u.custom_permissions || u.customPermissions,
                    assignedTeam: u.assigned_team || u.assignedTeam,
                    assignedZone: u.assigned_zone || u.assignedZone,
                    assignedWoreda: u.assigned_woreda || u.assignedWoreda,
                    assignedProgram: u.assigned_program || u.assignedProgram,
                    assignedPrograms: u.assigned_programs || u.assignedPrograms,
                    assignedNgoId: u.assigned_ngo_id || u.assignedNgoId,
                    assignedNgoName: u.assigned_ngo_name || u.assignedNgoName,
                    staffProfileId: u.staff_profile_id || u.staffProfileId,
                    assignedProjectIds: u.assigned_project_ids || u.assignedProjectIds,
                    dataScopeOverride: u.data_scope_override || u.dataScopeOverride,
                    lastLogin: new Date().toISOString(),
                };
                handleLoginSuccess(authenticatedUserData);
                return null;
            }
        }
        catch (apiErr) {
            console.warn("Backend auth attempt response:", apiErr?.message);
            return apiErr?.message || "Invalid credentials. Please verify your username and password.";
        }
        return "Authentication could not be completed. Please check your credentials.";
    };
    const handleRegisterUser = async (newUser) => {
        try {
            await apiClient.createUser({
                username: newUser.username,
                password: newUser.password,
                full_name: newUser.fullName,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                department: newUser.department,
                organization: newUser.organization,
                assigned_zone: newUser.assignedZone,
                assigned_program: newUser.assignedProgram,
                status: 'Active'
            });
            const loginRes = await apiClient.login(newUser.username, newUser.password);
            if (loginRes && loginRes.user) {
                const u = loginRes.user;
                const authenticatedUserData = {
                    ...u,
                    id: String(u.id),
                    fullName: u.full_name || u.fullName,
                    secondaryRoles: u.secondary_roles || u.secondaryRoles,
                    assignedTeam: u.assigned_team || u.assignedTeam,
                    assignedZone: u.assigned_zone || u.assignedZone,
                    assignedWoreda: u.assigned_woreda || u.assignedWoreda,
                    assignedProgram: u.assigned_program || u.assignedProgram,
                    lastLogin: new Date().toISOString(),
                };
                handleLoginSuccess(authenticatedUserData);
                return true;
            }
            return true;
        } catch (err) {
            console.error('Registration failed:', err);
            return err.message || 'Registration failed';
        }
    };
    const handleLoginSuccess = (user) => {
        setAuthenticatedUser(user);
        setSimulatedRole(null);
        setOriginalUser(null);
        fetchInitialBackendData();
        // Redirect user to their default module after login
        if (user.role === Role.PROCUREMENT)
            setActiveModule('procurement');
        else if (user.role === Role.CONTRACT_MANAGER || user.role === Role.SUPERVISOR)
            setActiveModule('contract');
        else
            setActiveModule('dashboard');
    };
    const handleLogout = () => {
        logActivity('User Logged Out');
        apiClient.setTokens(null, null);
        setAuthenticatedUser(null);
        setSimulatedRole(null);
        setOriginalUser(null);
    };
    const handleAddProject = useCallback((project, files) => {
        const newDocs = [];
        if (files?.feasibility) {
            newDocs.push({
                id: `DOC-${project.id}-FS-${Date.now()}`,
                projectId: project.id,
                fileName: files.feasibility.name,
                fileUrl: URL.createObjectURL(files.feasibility),
                category: DocumentCategory.FEASIBILITY_STUDY,
                uploadedBy: project.creator,
                uploadDate: new Date().toISOString()
            });
        }
        if (files?.eia) {
            newDocs.push({
                id: `DOC-${project.id}-EIA-${Date.now()}`,
                projectId: project.id,
                fileName: files.eia.name,
                fileUrl: URL.createObjectURL(files.eia),
                category: DocumentCategory.EIA_REPORT,
                uploadedBy: project.creator,
                uploadDate: new Date().toISOString()
            });
        }
        setProjects(prevProjects => {
            const exists = prevProjects.some(p => p.id === project.id);
            if (exists) {
                return prevProjects.map(p => p.id === project.id ? { ...p, ...project } : p);
            }
            return [...prevProjects, project];
        });
        logActivity('Created Project', { targetType: 'Project', targetId: project.id, details: `Status: ${project.status}` });
        // Asynchronously persist to Django REST API & PostgreSQL
        apiClient.createProject({
            project_id: project.id,
            project_code: project.projectCode || '',
            name: project.name,
            program: project.program || '',
            program_component: project.programComponent || '',
            region: project.region || 'Oromia',
            zone: project.zone,
            woreda: project.woreda,
            kebele: project.kebele,
            gps_coordinates: project.gpsCoordinates,
            elevation: project.elevation || 0,
            project_type: project.projectType,
            project_sub_type: project.projectSubType || '',
            source_of_water: project.sourceOfWater || '',
            energy_source: project.energySource || '',
            type_of_intervention: project.typeOfIntervention,
            population_coverage: project.populationCoverage || 0,
            daily_demand_estimate: project.dailyDemandEstimate || 0,
            storage_requirement: project.storageRequirement || 0,
            pipe_length_estimation: project.pipeLengthEstimation || 0,
            implementing_body: project.implementingBody,
            washco_exists: project.washcoExists !== undefined ? project.washcoExists : (project.washco_exists || false),
            washco_details: project.washcoDetails || project.washco_details || '',
            land_ownership_cleared: project.landOwnershipCleared !== undefined ? project.landOwnershipCleared : (project.land_ownership_cleared || false),
            land_ownership_comment: project.landOwnershipComment || project.land_ownership_comment || '',
            estimated_budget: project.estimatedBudget,
            phase_costs: project.phaseCosts || project.phase_costs || [],
            funding_source: project.fundingSource,
            community_contribution: project.communityContribution || project.community_contribution || '',
            environmental_risk_level: project.environmentalRiskLevel || project.environmental_risk_level || 'Low',
            source_reliability: project.sourceReliability || project.source_reliability || 'Reliable',
            feasibility_study_conducted: project.feasibilityStudyConducted || false,
            eia_conducted: project.eiaConducted || false,
            eia_approval_authority: project.eiaApprovalAuthority || '',
            eia_risk_rating: project.eiaRiskRating || 'Low',
            planned_start_date: project.plannedStartDate ? project.plannedStartDate.split('T')[0] : null,
            planned_completion_date: project.plannedCompletionDate ? project.plannedCompletionDate.split('T')[0] : null,
            assigned_engineer_id: project.assignedEngineerId || '',
            assigned_engineer_name: project.assignedEngineerName || '',
            assigned_supervisor_id: project.assignedSupervisorId || '',
            assigned_supervisor_name: project.assignedSupervisorName || '',
            assigned_team: project.assignedTeam || '',
            summary: project.summary || project.donorJustification || '',
            ai_risk_assessment: project.aiRiskAssessment || {},
            status: project.status,
            creator: project.creator
        }).then(() => {
            setToastMessage(`Project "${project.name}" registered successfully.`);
        }).catch(e => {
            console.error('Backend createProject sync error:', e);
            setToastMessage(`Project saved locally. Warning: Backend sync failed: ${e.message || 'Network error'}`);
        });
        if (newDocs.length > 0) {
            setDocuments(prevDocs => [...prevDocs, ...newDocs]);
            newDocs.forEach(doc => logActivity('Uploaded Document', { targetType: 'Document', targetId: doc.id, details: `File: ${doc.fileName}` }));
        }
        if (project.status === ProjectStatus.SUBMITTED) {
            sendAppNotification({ role: Role.REVIEWER }, `New project "${project.name}" has been submitted for review.`, NotificationType.NEW_SUBMISSION, { moduleId: 'review', itemId: project.id });
        }
        setActiveModule('dashboard');
    }, [logActivity, sendAppNotification]);
    const handleUpdateProject = useCallback((updatedProject) => {
        const originalProject = (projects || []).find(p => p && p.id === updatedProject.id);
        if (originalProject && originalProject.status !== updatedProject.status) {
            logActivity('Updated Project Status', { targetType: 'Project', targetId: updatedProject.id, details: `Status changed from ${originalProject.status} to ${updatedProject.status}` });
            const statusChange = updatedProject.status;
            if (statusChange === ProjectStatus.APPROVED || statusChange === ProjectStatus.REJECTED) {
                sendAppNotification({ username: updatedProject.creator }, `Your project "${updatedProject.name}" has been ${statusChange.toLowerCase()}.`, statusChange === ProjectStatus.APPROVED ? NotificationType.SUCCESS : NotificationType.ALERT, { moduleId: 'dashboard', itemId: updatedProject.id });
            }
            if (statusChange === ProjectStatus.APPROVED) {
                sendAppNotification({ role: Role.PROCUREMENT }, `Project "${updatedProject.name}" has been approved and is ready for procurement.`, NotificationType.INFO, { moduleId: 'procurement', itemId: updatedProject.id });
            }
        }
        setProjects(prevProjects => prevProjects.map(p => p.id === updatedProject.id ? { ...p, ...updatedProject } : p));
        apiClient.updateProject(updatedProject.id, {
            name: updatedProject.name,
            project_code: updatedProject.projectCode,
            status: updatedProject.status,
            program: updatedProject.program,
            program_component: updatedProject.programComponent,
            zone: updatedProject.zone,
            woreda: updatedProject.woreda,
            kebele: updatedProject.kebele,
            estimated_budget: updatedProject.estimatedBudget,
            assigned_engineer_id: updatedProject.assignedEngineerId,
            assigned_supervisor_id: updatedProject.assignedSupervisorId,
            assigned_team: updatedProject.assignedTeam,
            planned_start_date: updatedProject.plannedStartDate ? updatedProject.plannedStartDate.split('T')[0] : null,
            planned_completion_date: updatedProject.plannedCompletionDate ? updatedProject.plannedCompletionDate.split('T')[0] : null,
            actual_start_date: updatedProject.actualStartDate ? updatedProject.actualStartDate.split('T')[0] : null,
            actual_completion_date: updatedProject.actualCompletionDate ? updatedProject.actualCompletionDate.split('T')[0] : null,
            phase_costs: updatedProject.phaseCosts,
            review_comments: updatedProject.reviewComments || updatedProject.review_comments,
            reviewed_by: updatedProject.reviewedBy || updatedProject.reviewed_by,
            review_date: updatedProject.reviewDate ? updatedProject.reviewDate.split('T')[0] : null,
            review_score: updatedProject.reviewScore !== undefined && updatedProject.reviewScore !== null ? Number(updatedProject.reviewScore) : undefined,
            appraisal_verdict: updatedProject.appraisalVerdict || updatedProject.appraisal_verdict,
            approval_certificate_no: updatedProject.approvalCertificateNo || updatedProject.approval_certificate_no,
            revision_points: updatedProject.revisionPoints || updatedProject.revision_points,
            review_checklist: updatedProject.reviewChecklist || updatedProject.review_checklist,
            ai_risk_assessment: updatedProject.aiRiskAssessment || updatedProject.ai_risk_assessment,
            summary: updatedProject.summary,
        }).then(() => {
            setToastMessage(`Project "${updatedProject.name}" updated successfully.`);
        }).catch(err => {
            console.error('Project update sync error:', err);
            setToastMessage(`Project updated locally. Warning: Backend sync failed: ${err.message || 'Network error'}`);
        });
    }, [projects, logActivity, sendAppNotification]);
    const handleAddProcurement = useCallback((procurement) => {
        setProcurements(prev => [...prev, procurement]);
        apiClient.saveProcurement({
            procurement_id: procurement.id,
            project_id: procurement.projectId,
            tender_reference_number: procurement.tenderReferenceNumber,
            procurement_method: procurement.procurementMethod,
            procurement_type: procurement.procurementType,
            bid_issued_date: procurement.bidIssuedDate,
            bidding_period_start: procurement.biddingPeriodStart,
            bidding_period_end: procurement.biddingPeriodEnd,
            tender_stage: procurement.tenderStage,
            evaluation_status: procurement.evaluationStatus,
            evaluation_committee: procurement.evaluationCommittee,
            awarded_bidder_id: procurement.awardedBidderId,
            award_date: procurement.awardDate,
            standstill_period: procurement.standstillPeriod,
            estimated_budget_etb: procurement.estimatedBudgetETB,
            final_contract_value_etb: procurement.finalContractValueETB,
            bidders: procurement.bidders,
            lots: procurement.lots,
        }).catch(err => console.warn('Procurement create sync:', err));
        logActivity('Created Procurement Record', { targetType: 'Procurement', targetId: procurement.id, details: `For Project ${procurement.projectId}` });
        setToastMessage(`Procurement package ${procurement.tenderReferenceNumber || procurement.id} created successfully.`);
    }, [logActivity]);
    const handleUpdateProcurement = useCallback((updatedProcurement) => {
        setProcurements(prev => prev.map(p => p.id === updatedProcurement.id ? updatedProcurement : p));
        apiClient.saveProcurement({
            procurement_id: updatedProcurement.id,
            project_id: updatedProcurement.projectId,
            tender_reference_number: updatedProcurement.tenderReferenceNumber,
            procurement_method: updatedProcurement.procurementMethod,
            procurement_type: updatedProcurement.procurementType,
            bid_issued_date: updatedProcurement.bidIssuedDate,
            bidding_period_start: updatedProcurement.biddingPeriodStart,
            bidding_period_end: updatedProcurement.biddingPeriodEnd,
            tender_stage: updatedProcurement.tenderStage,
            evaluation_status: updatedProcurement.evaluationStatus,
            evaluation_committee: updatedProcurement.evaluationCommittee,
            awarded_bidder_id: updatedProcurement.awardedBidderId,
            award_date: updatedProcurement.awardDate,
            standstill_period: updatedProcurement.standstillPeriod,
            estimated_budget_etb: updatedProcurement.estimatedBudgetETB,
            final_contract_value_etb: updatedProcurement.finalContractValueETB,
            bidders: updatedProcurement.bidders,
            lots: updatedProcurement.lots,
        }).catch(err => console.warn('Procurement update sync:', err));
        logActivity('Updated Procurement Record', { targetType: 'Procurement', targetId: updatedProcurement.id, details: `Stage: ${updatedProcurement.tenderStage}` });
        setToastMessage(`Procurement package ${updatedProcurement.tenderReferenceNumber || updatedProcurement.id} updated successfully.`);
    }, [logActivity]);
    const handleAddContract = useCallback((contract) => {
        const updatedContracts = [...contracts, contract];
        setContracts(updatedContracts);
        apiClient.saveContract({
            contract_id: contract.id,
            project_id: contract.projectId,
            procurement_id: contract.procurementId,
            contract_manager: contract.contractManager,
            cm_plan_assignment_date: contract.cmPlanAssignmentDate,
            cm_actual_assignment_date: contract.cmActualAssignmentDate,
            supervisor: contract.supervisor,
            supervisor_plan_assignment_date: contract.supervisorPlanAssignmentDate,
            supervisor_actual_assignment_date: contract.supervisorActualAssignmentDate,
            contractor_name: contract.contractorName,
            performance_security_plan_date: contract.performanceSecurityPlanDate,
            performance_security_actual_date: contract.performanceSecurityActualDate,
            performance_security_expiry_date: contract.performanceSecurityExpiryDate,
            performance_bond_amount: contract.performanceBondAmount,
            performance_bond_currency: contract.performanceBondCurrency,
            signing_date: contract.signingDate,
            commencement_plan_date: contract.commencementPlanDate,
            commencement_actual_date: contract.commencementActualDate,
            planned_completion_date: contract.plannedCompletionDate,
            is_plan_finalized: contract.isPlanFinalized,
            kpis: contract.kpis,
            deliverables: contract.deliverables,
            payments: contract.payments,
            variations: contract.variations,
            claims: contract.claims,
        }).then(() => {
            setToastMessage(`Contract ${contract.id} created successfully.`);
        }).catch(err => {
            console.error('Contract create sync error:', err);
            setToastMessage(`Warning: Contract saved locally but sync failed: ${err.message || 'Network error'}`);
        });
        logActivity('Created Contract', { targetType: 'Contract', targetId: contract.id, details: `For Project ${contract.projectId}` });
        sendAppNotification({ username: contract.contractManager }, `You have been assigned as Contract Manager for contract ${contract.id}.`, NotificationType.INFO, { moduleId: 'contract', itemId: contract.id });
        sendAppNotification({ username: contract.supervisor }, `You have been assigned as Supervisor for contract ${contract.id}.`, NotificationType.INFO, { moduleId: 'contract', itemId: contract.id });
        // Run automated 30-day deadline audit
        flagContractsNearDeadline(updatedContracts);
        setActiveModule('dashboard');
    }, [contracts, logActivity, sendAppNotification, flagContractsNearDeadline]);
    const handleUpdateContract = useCallback((updatedContract) => {
        const updatedContracts = contracts.map(c => c.id === updatedContract.id ? updatedContract : c);
        setContracts(updatedContracts);
        apiClient.saveContract({
            contract_id: updatedContract.id,
            project_id: updatedContract.projectId,
            procurement_id: updatedContract.procurementId,
            contract_manager: updatedContract.contractManager,
            cm_plan_assignment_date: updatedContract.cmPlanAssignmentDate,
            cm_actual_assignment_date: updatedContract.cmActualAssignmentDate,
            supervisor: updatedContract.supervisor,
            supervisor_plan_assignment_date: updatedContract.supervisorPlanAssignmentDate,
            supervisor_actual_assignment_date: updatedContract.supervisorActualAssignmentDate,
            contractor_name: updatedContract.contractorName,
            performance_security_plan_date: updatedContract.performanceSecurityPlanDate,
            performance_security_actual_date: updatedContract.performanceSecurityActualDate,
            performance_security_expiry_date: updatedContract.performanceSecurityExpiryDate,
            performance_bond_amount: updatedContract.performanceBondAmount,
            performance_bond_currency: updatedContract.performanceBondCurrency,
            signing_date: updatedContract.signingDate,
            commencement_plan_date: updatedContract.commencementPlanDate,
            commencement_actual_date: updatedContract.commencementActualDate,
            planned_completion_date: updatedContract.plannedCompletionDate,
            is_plan_finalized: updatedContract.isPlanFinalized,
            kpis: updatedContract.kpis,
            deliverables: updatedContract.deliverables,
            payments: updatedContract.payments,
            variations: updatedContract.variations,
            claims: updatedContract.claims,
        }).then(() => {
            setToastMessage(`Contract ${updatedContract.id} updated successfully.`);
        }).catch(err => {
            console.error('Contract update sync error:', err);
            setToastMessage(`Warning: Contract updated locally but sync failed: ${err.message || 'Network error'}`);
        });
        logActivity('Updated Contract', { targetType: 'Contract', targetId: updatedContract.id });
        // Run automated 30-day deadline audit
        flagContractsNearDeadline(updatedContracts);
        setActiveModule('dashboard');
    }, [contracts, logActivity, flagContractsNearDeadline]);
    const handleAddUser = useCallback((user) => {
        setUsers(prev => [...prev, user]);
        apiClient.createUser({
            username: user.username,
            full_name: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            department: user.department,
            organization: user.organization,
            password: user.password || 'password',
            status: user.status || 'Active',
            assigned_zone: user.assignedZone,
            assigned_program: user.assignedProgram,
            data_scope_override: user.dataScopeOverride
        }).catch(err => console.warn('User create sync:', err));
        logActivity('Added New User', { targetType: 'User', targetId: user.id, details: `Username: ${user.username}, Role: ${user.role}, Dept: ${user.department || 'OWEB'}` });
        setToastMessage(`User account for "${user.username}" (${user.role}) created successfully.`);
    }, [logActivity]);
    const handleUpdateUser = useCallback((updatedUser) => {
        const original = users.find(u => u.id === updatedUser.id);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        apiClient.updateUser(updatedUser.id, {
            full_name: updatedUser.fullName,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            department: updatedUser.department,
            organization: updatedUser.organization,
            status: updatedUser.status,
            assigned_zone: updatedUser.assignedZone,
            assigned_program: updatedUser.assignedProgram,
            data_scope_override: updatedUser.dataScopeOverride
        }).catch(err => console.warn('User update sync:', err));
        if (original && original.role !== updatedUser.role) {
            logActivity('Updated User Role', { targetType: 'User', targetId: updatedUser.id, details: `Role changed from ${original.role} to ${updatedUser.role}` });
        }
        else {
            logActivity('Updated User Profile', { targetType: 'User', targetId: updatedUser.id, details: `Updated profile details for ${updatedUser.username}` });
        }
        setToastMessage(`User "${updatedUser.username}" profile updated.`);
    }, [users, logActivity]);
    const handleDeleteUser = useCallback((userId) => {
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete)
            return;
        if (userToDelete.id === authenticatedUser?.id) {
            setToastMessage("Cannot delete your own currently active administrator account.");
            return;
        }
        const adminCount = users.filter(u => u.role === Role.ADMIN && (u.status === UserStatus.ACTIVE || u.status === 'Active' || !u.status)).length;
        if (userToDelete.role === Role.ADMIN && adminCount <= 1) {
            setToastMessage("Cannot delete the sole active System Administrator.");
            return;
        }
        setUsers(prev => prev.filter(u => u.id !== userId));
        apiClient.deleteUser(userId).catch(err => console.warn('User delete sync:', err));
        logActivity('Deleted User Account', { targetType: 'User', targetId: userId, details: `Removed username: ${userToDelete.username}, Role: ${userToDelete.role}` });
        setToastMessage(`User account "${userToDelete.username}" has been permanently removed.`);
    }, [users, authenticatedUser, logActivity]);
    const handleResetUserPassword = useCallback((userId, newPass) => {
        const userToReset = users.find(u => u.id === userId);
        if (!userToReset)
            return;
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPass } : u));
        logActivity('Reset User Password', { targetType: 'User', targetId: userId, details: `Password reset for user ${userToReset.username}` });
        setToastMessage(`Password for user "${userToReset.username}" has been successfully updated.`);
    }, [users, logActivity]);
    const handleToggleUserStatus = useCallback((userId, newStatus) => {
        const userToToggle = users.find(u => u.id === userId);
        if (!userToToggle)
            return;
        if (userToToggle.id === authenticatedUser?.id && newStatus !== UserStatus.ACTIVE) {
            setToastMessage("Cannot deactivate or suspend your own active administrator account.");
            return;
        }
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        apiClient.updateUser(userId, { status: newStatus }).catch(err => console.warn('User status toggle sync:', err));
        logActivity('Updated User Status', { targetType: 'User', targetId: userId, details: `Status set to ${newStatus} for user ${userToToggle.username}` });
        setToastMessage(`User "${userToToggle.username}" status updated to ${newStatus}.`);
    }, [users, authenticatedUser, logActivity]);
    const handleSimulateRole = useCallback((role) => {
        if (!authenticatedUser)
            return;
        if (!originalUser) {
            setOriginalUser(authenticatedUser);
        }
        setSimulatedRole(role);
        setAuthenticatedUser(prev => prev ? { ...prev, role } : null);
        logActivity('Simulated Role View', { details: `Administrator simulated view as ${role}` });
        setToastMessage(`Perspective switched to ${role}. Module access dynamically updated.`);
    }, [authenticatedUser, originalUser, logActivity]);
    const handleSwitchPersona = useCallback((targetUsername) => {
        const found = users.find(u => u.username === targetUsername);
        if (!found)
            return;
        if (!originalUser && authenticatedUser) {
            setOriginalUser(authenticatedUser);
        }
        setSimulatedRole(found.role);
        setAuthenticatedUser(found);
        setIsPersonaMenuOpen(false);
        logActivity('Switched Persona', { details: `Switched perspective to ${found.fullName || found.username} (${found.role})` });
        setToastMessage(`Perspective switched to ${found.fullName || found.username} (${found.role}). Scope: ${found.dataScopeOverride || 'Scoped'}`);
    }, [users, authenticatedUser, originalUser, logActivity]);
    const handleExitRoleSimulation = useCallback(() => {
        if (originalUser) {
            setAuthenticatedUser(originalUser);
            setSimulatedRole(null);
            setOriginalUser(null);
            setIsPersonaMenuOpen(false);
            logActivity('Exited Role Simulation', { details: `Restored primary role: ${originalUser.role}` });
            setToastMessage(`Restored primary administrator perspective.`);
        }
    }, [originalUser, logActivity]);
    const handleSelectContract = useCallback((contract) => {
        setSelectedContract(contract);
        setActiveModule('contract');
    }, []);
    const handleAddDocument = useCallback((document) => {
        setDocuments(prev => [...prev, document]);
        apiClient.uploadDocument({
            document_id: document.id,
            project_id: document.projectId,
            file_name: document.fileName,
            file_url: document.fileUrl,
            category: document.category,
            uploaded_by: document.uploadedBy,
        }).catch(err => console.warn('Document upload sync:', err));
        logActivity('Uploaded Document', { targetType: 'Document', targetId: document.id, details: `File: ${document.fileName}` });
    }, [logActivity]);
    const handleDeleteDocument = useCallback((docId) => {
        if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            const docToDelete = documents.find(d => d.id === docId);
            if (docToDelete) {
                if (docToDelete.fileUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(docToDelete.fileUrl);
                }
                setDocuments(prev => prev.filter(d => d.id !== docId));
                apiClient.deleteDocument(docId).catch(err => console.warn('Document delete sync:', err));
                logActivity('Deleted Document', { targetType: 'Document', targetId: docId, details: `File: ${docToDelete.fileName}` });
            }
        }
    }, [documents, logActivity]);
    const handleMarkAsRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    };
    const handleMarkAllAsRead = () => {
        if (!authenticatedUser)
            return;
        setNotifications(notifications.map(n => n.userId === authenticatedUser.username ? { ...n, isRead: true } : n));
        apiClient.markAllNotificationsRead().catch(err => console.warn('Mark all notifications read sync:', err));
    };
    const handleNotificationClick = (notification) => {
        if (notification.link) {
            setActiveModule(notification.link.moduleId);
            if (notification.link.moduleId === 'contract' && notification.link.itemId) {
                const contractToSelect = contracts.find(c => c.id === notification.link.itemId);
                if (contractToSelect) {
                    setSelectedContract(contractToSelect);
                }
            }
        }
        setShowNotifications(false);
    };
    const handleNavigate = useCallback((moduleId, itemId) => {
        setActiveModule(moduleId);
        if (moduleId === 'contract' && itemId) {
            const contractToSelect = contracts.find(c => c.id === itemId);
            if (contractToSelect) {
                setSelectedContract(contractToSelect);
            }
        }
        // Could add more logic for other modules if needed
    }, [contracts]);
    const handleBackup = async () => {
        try {
            setToastMessage("Starting backup... this may take a moment.");
            const documentsForBackup = await Promise.all(documents.map(async (doc) => {
                if (doc.fileUrl.startsWith('blob:')) {
                    const response = await fetch(doc.fileUrl);
                    const blob = await response.blob();
                    const base64Data = await blobToBase64(blob);
                    const { fileUrl, ...docWithoutUrl } = doc;
                    return {
                        ...docWithoutUrl,
                        base64Data,
                        mimeType: blob.type,
                    };
                }
                return doc;
            }));
            const backupData = {
                backupVersion: BACKUP_VERSION,
                timestamp: new Date().toISOString(),
                projects,
                procurements,
                contracts,
                users,
                notifications,
                documents: documentsForBackup,
                activityLogs,
                masterData,
                fieldInspections,
                weeklyPlans,
                weeklyReports,
            };
            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `oweb_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            logActivity('System Backup Created');
            setToastMessage("System backup created successfully!");
        }
        catch (error) {
            console.error("Backup failed:", error);
            setToastMessage("Error: Backup failed. Check console for details.");
        }
    };
    const handleRestore = async (file) => {
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                setToastMessage("Restoring from backup... please wait.");
                const backupData = JSON.parse(event.target?.result);
                if (backupData.backupVersion !== BACKUP_VERSION) {
                    throw new Error(`Incompatible backup version. Expected ${BACKUP_VERSION} but found ${backupData.backupVersion || 'none'}.`);
                }
                if (!backupData.projects || !backupData.users || !backupData.documents) {
                    throw new Error("Invalid backup file format. Missing required data.");
                }
                documents.forEach(doc => {
                    if (doc.fileUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(doc.fileUrl);
                    }
                });
                const restoredDocuments = backupData.documents.map((doc) => {
                    if (doc.base64Data && doc.mimeType) {
                        const blob = base64ToBlob(doc.base64Data, doc.mimeType);
                        const fileUrl = URL.createObjectURL(blob);
                        const { base64Data, mimeType, ...docWithoutData } = doc;
                        return { ...docWithoutData, fileUrl };
                    }
                    return doc;
                });
                setProjects(backupData.projects);
                setProcurements(backupData.procurements);
                setContracts(backupData.contracts);
                setUsers(backupData.users);
                setNotifications(backupData.notifications);
                setDocuments(restoredDocuments);
                setActivityLogs(backupData.activityLogs);
                if (backupData.masterData) {
                    setMasterData(backupData.masterData);
                    saveMasterData(backupData.masterData);
                }
                if (backupData.fieldInspections && Array.isArray(backupData.fieldInspections)) {
                    setFieldInspections(backupData.fieldInspections);
                }
                if (backupData.weeklyPlans && Array.isArray(backupData.weeklyPlans)) {
                    setWeeklyPlans(backupData.weeklyPlans);
                    saveWeeklyPlans(backupData.weeklyPlans);
                }
                if (backupData.weeklyReports && Array.isArray(backupData.weeklyReports)) {
                    setWeeklyReports(backupData.weeklyReports);
                    saveWeeklyReports(backupData.weeklyReports);
                }
                logActivity('System Restored from Backup', { details: `Backup timestamp: ${backupData.timestamp}` });
                setToastMessage("System has been successfully restored from backup.");
            }
            catch (error) {
                console.error("Restore failed:", error);
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                setToastMessage(`Error: Restore failed. ${errorMessage}`);
            }
        };
        reader.readAsText(file);
    };
    const handleUpdateMasterData = (updated) => {
        setMasterData(updated);
        saveMasterData(updated);
        logActivity('Master Data registry updated', { targetType: 'MasterData', details: `Saved master data revision v${updated.version}` });
        setToastMessage('Master Data registry saved successfully.');
    };
    const handlePushMasterData = (updated) => {
        const synced = pushMasterDataToAllModules(updated);
        setMasterData(synced);
        saveMasterData(synced);
        logActivity('Master Data broadcasted to all modules', { targetType: 'MasterData', details: `Synced master data v${synced.version} across all modules` });
        setToastMessage(`Master Data v${synced.version} successfully pushed and synchronized across all modules.`);
        sendAppNotification({ role: Role.ADMIN }, `Master data v${synced.version} broadcasted and synced across all system modules.`, NotificationType.SYSTEM, { moduleId: 'masterdata' });
    };
    if (!authenticatedUser) {
        if (isExternalPortalOpen) {
            return (<ExternalPortal projects={projects} contracts={contracts} procurements={procurements} inspections={fieldInspections} weeklyPlans={weeklyPlans} onOpenLogin={() => setIsExternalPortalOpen(false)} isLoggedIn={false}/>);
        }
        return <Login onLogin={handleLogin} onRegisterUser={handleRegisterUser} users={users} onOpenExternalPortal={() => setIsExternalPortalOpen(true)}/>;
    }
    if (isExternalPortalOpen) {
        return (<ExternalPortal projects={accessibleProjects} contracts={accessibleContracts} procurements={accessibleProcurements} inspections={accessibleInspections} weeklyPlans={accessibleWeeklyPlans} onOpenLogin={() => setIsExternalPortalOpen(false)} isLoggedIn={true} onReturnToApp={() => setIsExternalPortalOpen(false)} onSelectProject={(pId) => {
                setIsExternalPortalOpen(false);
                handleNavigate('planning', pId);
            }}/>);
    }
    const renderModule = () => {
        const moduleMap = {
            dashboard: ROLE_PERMISSIONS.canViewDashboard.includes(authenticatedUser.role) ? (<Dashboard user={authenticatedUser} projects={accessibleProjects} procurements={accessibleProcurements} contracts={accessibleContracts} onSelectContract={handleSelectContract} onNavigate={handleNavigate} inspections={accessibleInspections} weeklyPlans={accessibleWeeklyPlans}/>) : null,
            developmentPartners: (ROLE_PERMISSIONS.canViewDevelopmentPartners || Object.values(Role)).includes(authenticatedUser.role) ? (<DevelopmentPartnersPortal user={authenticatedUser} onNavigate={handleNavigate}/>) : null,
            ngos: (ROLE_PERMISSIONS.canViewNgos || Object.values(Role)).includes(authenticatedUser.role) ? (<NgoManagementModule user={authenticatedUser} projects={accessibleProjects} staff={staffList} onNgosChange={(newNgos) => {
                    setNgosList(newNgos);
                    logActivity('Updated NGO Implementing Partners Registry', { details: `${newNgos.length} NGOs registered` });
                    setToastMessage('Implementing partner NGO directory updated.');
                }} onNavigate={handleNavigate} onSelectProject={(p) => {
                    handleNavigate('planning', p.id);
                }}/>) : null,
            staff: (ROLE_PERMISSIONS.canViewStaff || Object.values(Role)).includes(authenticatedUser.role) ? (<StaffManagementModule user={authenticatedUser} users={users} projects={accessibleProjects} onStaffChange={(newStaff) => {
                    setStaffList(newStaff);
                    logActivity('Updated Bureau & Partner Staff Roster', { details: `${newStaff.length} staff members on roster` });
                    setToastMessage('Staff roster and assignments updated.');
                }} onNavigate={handleNavigate} onSelectProject={(p) => {
                    handleNavigate('planning', p.id);
                }}/>) : null,
            gisMap: (ROLE_PERMISSIONS.canViewGisMap || ROLE_PERMISSIONS.canViewDashboard).includes(authenticatedUser.role) ? <GeographicMapModule projects={accessibleProjects} user={authenticatedUser} inspections={accessibleInspections} onNavigate={handleNavigate}/> : null,
            planning: ROLE_PERMISSIONS.canViewPlanning.includes(authenticatedUser.role) ? <PlanningModule onAddProject={handleAddProject} user={authenticatedUser} masterData={masterData} projects={accessibleProjects} contracts={accessibleContracts} procurements={accessibleProcurements} users={users}/> : null,
            review: ROLE_PERMISSIONS.canViewReview.includes(authenticatedUser.role) ? <ReviewModule projects={accessibleProjects} documents={accessibleDocuments} onUpdateProject={handleUpdateProject} currentUser={authenticatedUser} onNavigate={handleNavigate} onAddProcurement={handleAddProcurement} masterData={masterData}/> : null,
            procurement: ROLE_PERMISSIONS.canViewProcurement.includes(authenticatedUser.role) ? (<ProcurementModule projects={accessibleProjects.filter(p => p.status === ProjectStatus.APPROVED)} allProjects={accessibleProjects} procurements={accessibleProcurements} contracts={accessibleContracts} users={users} onAddProcurement={handleAddProcurement} onUpdateProcurement={handleUpdateProcurement} onAddContract={handleAddContract} onNavigate={handleNavigate} currentUser={authenticatedUser} masterData={masterData}/>) : null,
            contract: ROLE_PERMISSIONS.canViewContract.includes(authenticatedUser.role) ? <ContractModule procurements={accessibleProcurements.filter(p => p.awardedBidderId)} onAddContract={handleAddContract} onUpdateContract={handleUpdateContract} users={users} contractToEdit={selectedContract} documents={accessibleDocuments} projects={accessibleProjects} contracts={accessibleContracts} masterData={masterData}/> : null,
            performance: (ROLE_PERMISSIONS.canViewPerformance || Object.values(Role)).includes(authenticatedUser.role) ? (<PerformanceDashboard projects={accessibleProjects} contracts={accessibleContracts} procurements={accessibleProcurements} user={authenticatedUser} onNavigate={handleNavigate} inspections={accessibleInspections} weeklyPlans={accessibleWeeklyPlans}/>) : null,
            documents: ROLE_PERMISSIONS.canViewDocuments.includes(authenticatedUser.role) ? <DocumentModule projects={accessibleProjects} documents={accessibleDocuments} user={authenticatedUser} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument} masterData={masterData}/> : null,
            reporting: ROLE_PERMISSIONS.canViewReporting.includes(authenticatedUser.role) ? (<ReportingModule projects={accessibleProjects} contracts={accessibleContracts} procurements={accessibleProcurements} activityLogs={activityLogs} user={authenticatedUser} onBackup={handleBackup} onRestore={handleRestore} inspections={accessibleInspections} weeklyPlans={accessibleWeeklyPlans} onNavigate={handleNavigate}/>) : null,
            usermanagement: (ROLE_PERMISSIONS.canViewUserManagement.includes(authenticatedUser.role) || (originalUser && ROLE_PERMISSIONS.canViewUserManagement.includes(originalUser.role))) ? (<UserManagementModule users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} onResetPassword={handleResetUserPassword} onToggleStatus={handleToggleUserStatus} onSimulateRole={handleSimulateRole} currentUser={authenticatedUser} activityLogs={activityLogs} roles={roles} onUpdateRoles={handleUpdateRoles} projects={projects} onUpdateProject={handleUpdateProject}/>) : null,
            masterdata: (ROLE_PERMISSIONS.canViewMasterData.includes(authenticatedUser.role) || (originalUser && ROLE_PERMISSIONS.canViewMasterData.includes(originalUser.role))) ? (<MasterDataModule masterData={masterData} onUpdateMasterData={handleUpdateMasterData} onPushToAll={handlePushMasterData} currentUser={authenticatedUser} user={authenticatedUser} originalUser={originalUser} projects={projects} contracts={contracts} procurements={procurements} users={users}/>) : null,
            training: ROLE_PERMISSIONS.canViewTraining.includes(authenticatedUser.role) ? <TrainingModule user={authenticatedUser}/> : null,
        };
        const moduleComponent = moduleMap[activeModule];
        if (moduleComponent === null) {
            return <div className="p-8"><h4 className="text-xl font-bold text-danger-700">Access Denied</h4><p className="text-slate-600">You do not have permission to view this module.</p></div>;
        }
        return moduleComponent || (<Dashboard user={authenticatedUser} projects={accessibleProjects} procurements={accessibleProcurements} contracts={accessibleContracts} onSelectContract={handleSelectContract} onNavigate={handleNavigate} inspections={accessibleInspections} weeklyPlans={accessibleWeeklyPlans}/>);
    };
    return (
        <MetisLayout
            user={authenticatedUser}
            originalUser={originalUser}
            simulatedRole={simulatedRole}
            activeModule={activeModule}
            onSelectModule={(mod) => {
                setActiveModule(mod);
                setIsMobileMenuOpen(false);
            }}
            navGroups={navGroups}
            navBadges={navBadges}
            unreadCount={unreadCount}
            onToggleNotifications={() => setShowNotifications(!showNotifications)}
            showNotifications={showNotifications}
            notificationRef={notificationRef}
            NotificationPanelComponent={
                showNotifications && (
                    <NotificationPanel
                        notifications={filteredNotifications}
                        onMarkAsRead={handleMarkAsRead}
                        onMarkAllAsRead={handleMarkAllAsRead}
                        onNotificationClick={handleNotificationClick}
                    />
                )
            }
            onOpenProfile={() => setIsUserProfileModalOpen(true)}
            onLogout={handleLogout}
            onSwitchPersona={handleSwitchPersona}
            onExitRoleSimulation={handleExitRoleSimulation}
            onOpenSearch={() => setIsCommandPaletteOpen(true)}
            onAuditDeadlines={() => flagContractsNearDeadline(undefined, true)}
            accessibleProjectsCount={accessibleProjects.length}
            onOpenExternalPortal={() => setIsExternalPortalOpen(true)}
            activeModuleTitle={getModuleTitle(activeModule)}
        >
            <MetisPageHeader
                title={getModuleTitle(activeModule)}
                subtitle={getModuleSubtitle(activeModule)}
                breadcrumb={[getModuleTitle(activeModule)]}
                actions={
                    ROLE_PERMISSIONS.canViewPlanning.includes(authenticatedUser.role) && activeModule === 'dashboard' ? (
                        <button
                            type="button"
                            onClick={() => setActiveModule('planning')}
                            className="metis-btn metis-btn-primary"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>+ New Scheme</span>
                        </button>
                    ) : null
                }
            />

            <div key={activeModule} className="fade-in">
                {renderModule()}
            </div>

            {/* SMART COMMAND PALETTE (⌘K / Ctrl+K) */}
            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
                projects={accessibleProjects}
                contracts={accessibleContracts}
                procurements={accessibleProcurements}
                inspections={accessibleInspections}
                weeklyPlans={accessibleWeeklyPlans}
                onNavigate={handleNavigate}
                onTriggerAction={(actionId) => {
                    if (actionId === 'audit-contract-deadlines') {
                        flagContractsNearDeadline(undefined, true);
                    }
                }}
                currentRole={authenticatedUser.role}
            />

            {/* USER PROFILE & SETTINGS MODAL */}
            <UserProfileModal
                isOpen={isUserProfileModalOpen}
                onClose={() => setIsUserProfileModalOpen(false)}
                user={authenticatedUser}
                onLogout={handleLogout}
                onSimulateRole={handleSimulateRole}
                originalUser={originalUser}
                projects={accessibleProjects}
            />

            {/* AI ASSISTANT & TOAST ALERTS */}
            <AIChatAssistant
                projects={accessibleProjects}
                contracts={accessibleContracts}
                procurements={accessibleProcurements}
                inspections={accessibleInspections}
                weeklyPlans={accessibleWeeklyPlans}
                user={authenticatedUser}
                onNavigate={handleNavigate}
            />
            <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        </MetisLayout>
    );
};
export default App;
