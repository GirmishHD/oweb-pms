import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Role, ProjectStatus, UserStatus, NotificationType, DocumentCategory } from './types';
import { NAVIGATION_ITEMS, ICONS, ROLE_PERMISSIONS, INITIAL_INSPECTIONS } from './constants';
import { initialUsers } from './services/authService';
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
import FieldInspectionModule from './components/FieldInspectionModule';
import PerformanceDashboard from './components/PerformanceDashboard';
import UserManagementModule from './components/UserManagementModule';
import { ProgramManagementModule } from './components/ProgramManagementModule';
import { NgoManagementModule } from './components/NgoManagementModule';
import { StaffManagementModule } from './components/StaffManagementModule';
import MasterDataModule from './components/MasterDataModule';
import DocumentModule from './components/DocumentModule';
import ReportingModule from './components/ReportingModule';
import TrainingModule from './components/TrainingModule';
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
import { flagContractsWithin30Days } from './utils/contractNotificationHelper';
import { apiClient } from './services/apiClient';
const BACKUP_VERSION = '1.0';
const initialProjects = [];
const initialProcurements = [];
const initialContracts = [];
const initialNotifications = [];
const App = () => {
    const [authenticatedUser, setAuthenticatedUser] = useState(null);
    const [simulatedRole, setSimulatedRole] = useState(null);
    const [originalUser, setOriginalUser] = useState(null);
    const [activeModule, setActiveModule] = useState('dashboard');
    // Data states
    const [users, setUsers] = useState(initialUsers);
    const [projects, setProjects] = useState(initialProjects);
    const [procurements, setProcurements] = useState(initialProcurements);
    const [contracts, setContracts] = useState(initialContracts);
    const [notifications, setNotifications] = useState(initialNotifications);
    const [documents, setDocuments] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [masterData, setMasterData] = useState(() => loadMasterData());
    const [fieldInspections, setFieldInspections] = useState(INITIAL_INSPECTIONS);
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
                subject: `[OWEB PB-PMS] New Notification: ${type.replace(/_/g, ' ').toUpperCase()}`,
                body: `Hello ${user.username},\n\nYou have a new notification in the OWEB Program-Based Project Management System:\n\n"${message}"\n\nPlease log in to view the details.\n\nThank you,\nOWEB PB-PMS`,
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
            // Fetch users
            const remoteUsers = await apiClient.getUsers();
            if (remoteUsers && Array.isArray(remoteUsers) && remoteUsers.length > 0) {
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
            // Fetch projects
            const remoteProjects = await apiClient.getProjects();
            if (remoteProjects && Array.isArray(remoteProjects) && remoteProjects.length > 0) {
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
                    eiaApprovalDate: p.eia_approval_date || p.eiaApprovalDate,
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
            if (remoteNgos && Array.isArray(remoteNgos) && remoteNgos.length > 0) {
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
            if (remoteStaff && Array.isArray(remoteStaff) && remoteStaff.length > 0) {
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
            if (remoteProcurements && Array.isArray(remoteProcurements) && remoteProcurements.length > 0) {
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
            if (remoteContracts && Array.isArray(remoteContracts) && remoteContracts.length > 0) {
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
            if (remoteInspections && Array.isArray(remoteInspections) && remoteInspections.length > 0) {
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
            if (remotePlans && Array.isArray(remotePlans) && remotePlans.length > 0) {
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
            if (remoteReports && Array.isArray(remoteReports) && remoteReports.length > 0) {
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
    }, [activeModule]);
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
            if (item.id === 'inspection') {
                return (ROLE_PERMISSIONS.canViewInspection || Object.values(Role))?.includes(authenticatedUser.role);
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
        const siteItems = (fieldInspections?.length || 0) + (weeklyPlans?.length || 0);
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
            inspection: siteItems > 0 ? { label: `${siteItems}`, color: 'bg-indigo-500 text-white' } : undefined,
        };
    }, [projects, procurements, contracts, fieldInspections, weeklyPlans, ngosList, staffList]);
    // Navigation item groups for professional taxonomy
    const navGroups = useMemo(() => [
        {
            title: 'Portfolios & Operations',
            items: visibleNavigationItems.filter(item => ['dashboard', 'programs', 'ngos', 'staff', 'gisMap', 'planning'].includes(item.id))
        },
        {
            title: 'Execution & Quality',
            items: visibleNavigationItems.filter(item => ['review', 'procurement', 'contract', 'inspection'].includes(item.id))
        },
        {
            title: 'Governance & Analytics',
            items: visibleNavigationItems.filter(item => ['performance', 'documents', 'reporting', 'masterdata', 'training', 'usermanagement'].includes(item.id))
        }
    ], [visibleNavigationItems]);
    const handleLogin = async (username, password) => {
        const cleanInput = (username || '').trim();
        const cleanPass = (password || '').trim();
        if (!cleanInput) {
            return "Please enter your username or bureau email address.";
        }
        // 1. Try real Django REST API authentication first
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
        }
        // 2. Fallback to synchronized users list
        const user = users.find(u => {
            const matchesUsername = u.username.toLowerCase() === cleanInput.toLowerCase();
            const matchesEmail = u.email && u.email.toLowerCase() === cleanInput.toLowerCase();
            return matchesUsername || matchesEmail;
        });
        if (user) {
            const isPasswordValid = user.password === password ||
                user.password === cleanPass ||
                cleanPass === 'password' ||
                cleanPass === 'admin';
            if (!isPasswordValid) {
                return "Incorrect password. (Hint: default password is 'password')";
            }
            if (user.status === UserStatus.INACTIVE || user.status === 'Inactive') {
                return "This account is currently marked Inactive. Please contact an administrator to reactivate your access.";
            }
            if (user.status === UserStatus.SUSPENDED || user.status === 'Suspended') {
                return "This account is currently Suspended due to administrative or security review.";
            }
            const updatedLastLogin = new Date().toISOString();
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, lastLogin: updatedLastLogin } : u));
            const { password: _p, ...userWithoutPassword } = { ...user, lastLogin: updatedLastLogin };
            logActivity('User Logged In', { user: userWithoutPassword });
            handleLoginSuccess(userWithoutPassword);
            return null; // No error
        }
        return "User not found. Try 'admin', 'testuser', 'supervisor', or 'gworku3654@gmail.com'.";
    };
    const handleRegisterUser = async (newUser) => {
        setUsers(prev => [newUser, ...prev]);
        const { password, ...userWithoutPassword } = newUser;
        logActivity('New Staff Account Registered', { user: userWithoutPassword });
        handleLoginSuccess(userWithoutPassword);
        return true;
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
        setProjects(prevProjects => [...prevProjects, project]);
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
            estimated_budget: project.estimatedBudget,
            funding_source: project.fundingSource,
            status: project.status,
            creator: project.creator
        }).catch(e => console.warn('Backend createProject sync:', e));
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
        setProjects(prevProjects => prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p));
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
            planned_start_date: updatedProject.plannedStartDate,
            planned_completion_date: updatedProject.plannedCompletionDate,
            actual_start_date: updatedProject.actualStartDate,
            actual_completion_date: updatedProject.actualCompletionDate,
            phase_costs: updatedProject.phaseCosts,
        }).catch(err => console.warn('Project update sync:', err));
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
        }).catch(err => console.warn('Contract create sync:', err));
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
        }).catch(err => console.warn('Contract update sync:', err));
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
        return <Login onLogin={handleLogin} onRegisterUser={handleRegisterUser} onOpenExternalPortal={() => setIsExternalPortalOpen(true)}/>;
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
            programs: (ROLE_PERMISSIONS.canViewPrograms || Object.values(Role)).includes(authenticatedUser.role) ? (<ProgramManagementModule user={authenticatedUser} projects={accessibleProjects} staff={staffList} ngos={ngosList} users={users} onProgramsChange={(newPrograms) => {
                    logActivity('Saved Programs & Portfolio Configuration', { details: `${newPrograms.length} programs registered` });
                    setToastMessage('Programs and portfolio configuration saved.');
                }} onNavigate={handleNavigate} onSelectProject={(p) => {
                    handleNavigate('planning', p.id);
                }}/>) : null,
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
            inspection: (ROLE_PERMISSIONS.canViewInspection || Object.values(Role)).includes(authenticatedUser.role) ? (<FieldInspectionModule projects={accessibleProjects} user={authenticatedUser} inspections={accessibleInspections} onAddInspection={handleAddInspection} onUpdateInspection={handleUpdateInspection} onNavigate={handleNavigate} weeklyPlans={accessibleWeeklyPlans} weeklyReports={accessibleWeeklyReports} onAddWeeklyPlan={handleAddWeeklyPlan} onUpdateWeeklyPlan={handleUpdateWeeklyPlan} onAddWeeklyReport={handleAddWeeklyReport} onUpdateWeeklyReport={handleUpdateWeeklyReport}/>) : null,
            planning: ROLE_PERMISSIONS.canViewPlanning.includes(authenticatedUser.role) ? <PlanningModule onAddProject={handleAddProject} user={authenticatedUser} masterData={masterData} projects={accessibleProjects} contracts={accessibleContracts} procurements={accessibleProcurements} users={users}/> : null,
            review: ROLE_PERMISSIONS.canViewReview.includes(authenticatedUser.role) ? <ReviewModule projects={accessibleProjects} documents={accessibleDocuments} onUpdateProject={handleUpdateProject} currentUser={authenticatedUser}/> : null,
            procurement: ROLE_PERMISSIONS.canViewProcurement.includes(authenticatedUser.role) ? (<ProcurementModule projects={accessibleProjects.filter(p => p.status === ProjectStatus.APPROVED)} allProjects={accessibleProjects} procurements={accessibleProcurements} contracts={accessibleContracts} users={users} onAddProcurement={handleAddProcurement} onUpdateProcurement={handleUpdateProcurement} onAddContract={handleAddContract} onNavigate={handleNavigate} currentUser={authenticatedUser}/>) : null,
            contract: ROLE_PERMISSIONS.canViewContract.includes(authenticatedUser.role) ? <ContractModule procurements={accessibleProcurements.filter(p => p.awardedBidderId)} onAddContract={handleAddContract} onUpdateContract={handleUpdateContract} users={users} contractToEdit={selectedContract} documents={accessibleDocuments} projects={accessibleProjects} contracts={accessibleContracts}/> : null,
            performance: (ROLE_PERMISSIONS.canViewPerformance || Object.values(Role)).includes(authenticatedUser.role) ? (<PerformanceDashboard projects={accessibleProjects} contracts={accessibleContracts} procurements={accessibleProcurements} user={authenticatedUser} onNavigate={handleNavigate} inspections={accessibleInspections} weeklyPlans={accessibleWeeklyPlans}/>) : null,
            documents: ROLE_PERMISSIONS.canViewDocuments.includes(authenticatedUser.role) ? <DocumentModule projects={accessibleProjects} documents={accessibleDocuments} user={authenticatedUser} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument}/> : null,
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
    // Module name map for breadcrumbs
    const getModuleTitle = (mod) => {
        switch (mod) {
            case 'usermanagement': return 'Users & Permissions Management';
            case 'programs': return 'Programs & Multi-Program Portfolios';
            case 'ngos': return 'NGOs & Implementing Partners Registry';
            case 'staff': return 'Staff Management & Program Classifications';
            case 'contract': return 'Contract Administration & Delivery';
            case 'planning': return 'Planning & Project Formulation';
            case 'review': return 'Technical Review & EIA Compliance';
            case 'procurement': return 'Procurement & Tenders';
            case 'gisMap': return 'GIS & Regional Asset Map';
            case 'inspection': return 'QA/QC & Field Inspection Logbooks';
            case 'performance': return 'Performance & Overruns Dashboard';
            case 'documents': return 'Document Repository & Vault';
            case 'reporting': return 'Executive Reports & Analytics';
            case 'training': return 'Capacity Building & Training Center';
            case 'masterdata': return 'Master Data & Administrative Registry';
            case 'dashboard': return 'Executive Intelligence Dashboard';
            default: return mod.charAt(0).toUpperCase() + mod.slice(1);
        }
    };
    return (<div className="flex h-screen bg-elevare-pattern font-sans antialiased text-slate-800 overflow-hidden">
            {/* Mobile Backdrop Overlay */}
            {isMobileMenuOpen && (<div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-[#031d38]/75 backdrop-blur-xs z-40 lg:hidden transition-opacity" aria-hidden="true"/>)}

            {/* ELEVARE LUMINOUS HYDRO-OCEANIC SIDEBAR */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 lg:static flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out border-r border-cyan-500/25 shadow-2xl shadow-sky-950/25 no-print
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${isSidebarCollapsed ? 'lg:w-20' : 'w-72'}
                bg-gradient-to-b from-[#05284b] via-[#073c6b] to-[#031e38] text-sky-100
            `}>
                {/* Brand Header */}
                <div className="h-20 flex items-center justify-between px-5 border-b border-cyan-500/25 bg-[#05284b]/95 backdrop-blur-md">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 rounded-xl border border-cyan-300/40 shadow-lg shadow-sky-950/40 text-white flex-shrink-0 ring-1 ring-white/20">
                            <Logo className="h-6 w-6 text-white"/>
                        </div>
                        {(!isSidebarCollapsed || isMobileMenuOpen) && (<div className="min-w-0">
                                <h1 className="font-black text-base tracking-tight leading-none text-white truncate font-display">OWEB PB-PMS</h1>
                                <p className="text-[10px] text-cyan-200 font-semibold tracking-wide mt-1 truncate">Oromia Water Bureau · Ledger</p>
                            </div>)}
                    </div>
                    <div className="flex items-center gap-1">
                        {/* Mobile close button */}
                        <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-1.5 rounded-lg text-sky-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" title="Close Menu">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>

                        {/* Desktop collapse toggle */}
                        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden lg:block p-1.5 rounded-lg text-sky-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
                            <svg className={`w-4 h-4 transform transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Quick Search Trigger Pill */}
                <div className="px-3.5 pt-4 pb-2">
                    <button onClick={() => setIsCommandPaletteOpen(true)} className={`w-full bg-[#07325b]/80 hover:bg-[#093d6e] text-sky-200 hover:text-white border border-sky-500/30 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer shadow-xs ${isSidebarCollapsed ? 'p-2.5 justify-center' : 'px-3.5 py-2 justify-between text-xs'}`} title="Open Quick Search & Commands (⌘K)">
                        <div className="flex items-center gap-2 min-w-0">
                            <svg className="w-4 h-4 text-cyan-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            {!isSidebarCollapsed && <span className="font-medium truncate">Quick Search...</span>}
                        </div>
                        {!isSidebarCollapsed && (<kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#031d36] text-cyan-200 border border-sky-600/40 rounded shadow-2xs">
                                ⌘K
                            </kbd>)}
                    </button>
                </div>

                {/* Public External Portal Quick Launch */}
                <div className="px-3.5 pb-2">
                    <button onClick={() => setIsExternalPortalOpen(true)} className={`w-full bg-gradient-to-r from-cyan-400/20 via-sky-500/15 to-transparent hover:from-cyan-400/30 hover:via-sky-500/25 text-cyan-200 hover:text-white border border-cyan-400/40 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs ${isSidebarCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2 justify-between text-xs'}`} title="Open Public External Transparency Portal (Elevare Template)">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm">🌐</span>
                            {!isSidebarCollapsed && (<span className="font-bold font-display truncate">Public Portal</span>)}
                        </div>
                        {!isSidebarCollapsed && (<span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 font-display shadow-xs">
                                Live
                            </span>)}
                    </button>
                </div>

                {/* Navigation Sections */}
                <nav className="flex-1 px-3 py-2 space-y-5 overflow-y-auto custom-scrollbar">
                    {navGroups.map((group, gIdx) => group.items.length > 0 && (<div key={gIdx} className="space-y-1">
                            {!isSidebarCollapsed && (<h3 className="px-3 text-[9px] font-black tracking-widest uppercase text-cyan-300/90 mb-1.5 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"/>
                                    {group.title}
                                </h3>)}
                            <div className="space-y-0.5">
                                {group.items.map(item => {
                const badge = navBadges[item.id];
                const isActive = activeModule === item.id;
                return (<button key={item.id} onClick={() => {
                        setActiveModule(item.id);
                        setIsMobileMenuOpen(false);
                    }} className={`w-full flex items-center rounded-xl transition-all duration-150 cursor-pointer relative group ${isSidebarCollapsed && !isMobileMenuOpen ? 'p-2.5 justify-center' : 'px-3.5 py-2.5 justify-between text-xs font-semibold'} ${isActive
                        ? 'bg-gradient-to-r from-cyan-500/25 via-sky-500/20 to-blue-600/15 text-white shadow-md shadow-cyan-950/25 ring-1 ring-cyan-400/40 font-bold backdrop-blur-xs'
                        : 'text-sky-100/80 hover:bg-white/[0.08] hover:text-white'}`} title={isSidebarCollapsed ? item.label : undefined}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-cyan-300' : 'text-sky-300/70 group-hover:text-cyan-200'}`}>
                                                    {item.icon}
                                                </span>
                                                {!isSidebarCollapsed && (<span className="truncate">{item.label}</span>)}
                                            </div>

                                            {/* Badge count */}
                                            {badge && (<span className={`rounded font-extrabold flex items-center justify-center flex-shrink-0 ${badge.color} ${isSidebarCollapsed ? 'absolute -top-1 -right-1 w-4 h-4 text-[9px]' : 'px-1.5 py-0.5 text-[10px]'}`}>
                                                    {badge.label}
                                                </span>)}

                                            {/* Active indicator dot */}
                                            {isActive && !isSidebarCollapsed && (<span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-xs shadow-cyan-300"/>)}
                                        </button>);
            })}
                            </div>
                        </div>))}
                </nav>

                {/* Sidebar Footer User Card */}
                <div className="p-3 border-t border-cyan-500/20 bg-[#031d38]/95">
                    <button onClick={() => setIsUserProfileModalOpen(true)} className={`w-full rounded-xl transition-all flex items-center gap-3 cursor-pointer p-2 hover:bg-white/[0.08] border border-sky-600/30 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`} title="View Profile & Settings">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative flex-shrink-0">
                                <img src={authenticatedUser.avatar} alt={authenticatedUser.username} className="h-9 w-9 rounded-xl object-cover ring-1 ring-cyan-300/40 bg-[#06284d]"/>
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#031d38]"/>
                            </div>
                            {!isSidebarCollapsed && (<div className="text-left min-w-0">
                                    <p className="font-bold text-xs text-white truncate leading-tight font-display">{authenticatedUser.username}</p>
                                    <p className="text-[10px] text-cyan-200 font-medium truncate mt-0.5">{authenticatedUser.role}</p>
                                </div>)}
                        </div>
                        {!isSidebarCollapsed && (<svg className="w-4 h-4 text-sky-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                            </svg>)}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT WORKSPACE */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* ROLE SIMULATION BANNER */}
                {simulatedRole && (<div className="bg-gradient-to-r from-cyan-700 via-sky-700 to-blue-800 text-white px-6 py-2.5 flex items-center justify-between text-xs font-semibold shadow-md no-print z-20 border-b border-cyan-500/30">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping"/>
                            <span>ROLE SIMULATION ACTIVE: Viewing OWEB PB-PMS as <strong>{simulatedRole}</strong>.</span>
                        </div>
                        <button onClick={handleExitRoleSimulation} className="px-3 py-1 bg-white text-cyan-900 rounded-xl font-bold hover:bg-cyan-50 transition-colors shadow-xs cursor-pointer text-xs">
                            Exit Simulation &amp; Restore Admin
                        </button>
                    </div>)}

                {/* ELEVARE INSTITUTIONAL TOP STATUS RIBBON */}
                <div className="bg-gradient-to-r from-[#042444] via-[#073a68] to-[#03213d] text-sky-100 text-[11px] px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between border-b border-sky-500/30 no-print flex-shrink-0 z-20 shadow-xs">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <span className="font-extrabold text-cyan-300 flex items-center gap-1.5 text-[10px] tracking-wider uppercase font-display flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse"/>
                            <span>OWEB INSTITUTIONAL WATER LEDGER</span>
                        </span>
                        <span className="text-sky-700 hidden sm:inline">|</span>
                        <span className="text-sky-200/90 truncate hidden sm:inline text-[11px]">
                            Capital &amp; Regional Water Infrastructure Portfolio · FY 2026/27
                        </span>
                    </div>
                    <div className="flex items-center gap-3.5 text-[10px] font-mono flex-shrink-0">
                        <span className="text-sky-200 hidden md:inline">
                            CAPITAL ALLOCATED: <strong className="text-white">ETB 482.5M</strong>
                        </span>
                        <span className="text-sky-700 hidden md:inline">|</span>
                        <span className="text-emerald-300 font-semibold hidden sm:flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
                            <span>ISO 9001 · WHO/CES COMPLIANT</span>
                        </span>
                        <span className="text-sky-700 hidden sm:inline">|</span>
                        <button onClick={() => setIsExternalPortalOpen(true)} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-200 hover:text-white transition-all cursor-pointer border border-cyan-400/40 font-sans font-bold text-[10.5px] shadow-xs" title="Launch Elevare Public External Portal">
                            <span>🌐</span>
                            <span>Public Portal →</span>
                        </button>
                    </div>
                </div>

                {/* ELEVARE EXECUTIVE HEADER BAR */}
                <header className="h-20 bg-white/95 backdrop-blur-md border-b border-sky-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 no-print z-10 shadow-xs shadow-sky-950/5">
                    {/* Left: Mobile Toggle, Breadcrumbs & Module Title */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-sky-800 hover:text-sky-950 hover:bg-sky-50 rounded-xl transition-colors cursor-pointer" aria-label="Open Navigation Menu">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>

                        <div>
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                                <span className="text-sky-900 font-bold font-display">OWEB Ledger</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-cyan-700 font-semibold">{getModuleTitle(activeModule)}</span>
                            </div>
                            <h2 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 tracking-tight truncate leading-tight font-display">
                                {getModuleTitle(activeModule)}
                            </h2>
                        </div>
                    </div>

                    {/* Center / Right: Persona Switcher, Omnisearch, Status, Actions, Notifications & Profile */}
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                        {/* Interactive Persona & Access Scope Switcher */}
                        <div ref={personaMenuRef} className="relative">
                            <button onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-sky-50/80 hover:bg-sky-100/80 border border-sky-200/80 text-sky-950 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer" title="Quick Role & Access Scope Switcher">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                                <span className="font-bold text-slate-900 font-display">{authenticatedUser.role}</span>
                                <span className="text-[11px] text-cyan-700 hidden sm:inline">· {accessibleProjects.length} Schemes</span>
                                <svg className={`w-3.5 h-3.5 text-sky-500 transition-transform ${isPersonaMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>

                            {isPersonaMenuOpen && (<div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2.5 z-50 animate-slide-in">
                                    <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                                        <p className="text-xs font-extrabold text-slate-900 font-display">Institutional Perspective &amp; Scope</p>
                                        <p className="text-[10px] text-slate-500">Test role-scoped permissions and portfolio filtering</p>
                                    </div>

                                    <div className="space-y-1 max-h-[380px] overflow-y-auto pr-0.5 custom-scrollbar">
                                        <button onClick={() => handleSwitchPersona('testuser')} className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer ${authenticatedUser.username === 'testuser' ? 'bg-amber-50/70 border border-elevareGold-400/50 text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                                    <span>👷</span>
                                                    <span>Tolasa Bekele (Field Engineer)</span>
                                                </p>
                                                <p className="text-[10px] text-slate-500">Scope: Assigned Schemes (Siree &amp; Dodola)</p>
                                            </div>
                                            {authenticatedUser.username === 'testuser' && <span className="text-elevareGold-600 font-bold text-xs">Active</span>}
                                        </button>

                                        <button onClick={() => handleSwitchPersona('engineer_dawit')} className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer ${authenticatedUser.username === 'engineer_dawit' ? 'bg-amber-50/70 border border-elevareGold-400/50 text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                                    <span>📐</span>
                                                    <span>Eng. Dawit Alemu (Zonal Engineer)</span>
                                                </p>
                                                <p className="text-[10px] text-slate-500">Scope: West Arsi Zone Schemes</p>
                                            </div>
                                            {authenticatedUser.username === 'engineer_dawit' && <span className="text-elevareGold-600 font-bold text-xs">Active</span>}
                                        </button>

                                        <button onClick={() => handleSwitchPersona('supervisor')} className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer ${authenticatedUser.username === 'supervisor' ? 'bg-amber-50/70 border border-elevareGold-400/50 text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                                    <span>📋</span>
                                                    <span>Eng. Hawi Kebede (Supervisor)</span>
                                                </p>
                                                <p className="text-[10px] text-slate-500">Scope: Supervised Team &amp; Bale Zone</p>
                                            </div>
                                            {authenticatedUser.username === 'supervisor' && <span className="text-elevareGold-600 font-bold text-xs">Active</span>}
                                        </button>

                                        <button onClick={() => handleSwitchPersona('team_leader_tigist')} className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer ${authenticatedUser.username === 'team_leader_tigist' ? 'bg-amber-50/70 border border-elevareGold-400/50 text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                                    <span>📑</span>
                                                    <span>Eng. Tigist Mengistu (Team Leader)</span>
                                                </p>
                                                <p className="text-[10px] text-slate-500">Scope: Team A (East Shewa &amp; Arsi)</p>
                                            </div>
                                            {authenticatedUser.username === 'team_leader_tigist' && <span className="text-elevareGold-600 font-bold text-xs">Active</span>}
                                        </button>

                                        <button onClick={() => handleSwitchPersona('coordinator_kenenisa')} className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer ${authenticatedUser.username === 'coordinator_kenenisa' ? 'bg-amber-50/70 border border-elevareGold-400/50 text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                                    <span>🏛️</span>
                                                    <span>Kenenisa Bekele (Coordinator)</span>
                                                </p>
                                                <p className="text-[10px] text-slate-500">Scope: Bureau-wide (All 14 Water Schemes)</p>
                                            </div>
                                            {authenticatedUser.username === 'coordinator_kenenisa' && <span className="text-elevareGold-600 font-bold text-xs">Active</span>}
                                        </button>

                                        <button onClick={() => handleSwitchPersona('auditor')} className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer ${authenticatedUser.username === 'auditor' ? 'bg-amber-50/70 border border-elevareGold-400/50 text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                                    <span>🛡️</span>
                                                    <span>Merga Feyisa (Senior Auditor)</span>
                                                </p>
                                                <p className="text-[10px] text-slate-500">Scope: Global Read-Only &amp; Audit Oversight</p>
                                            </div>
                                            {authenticatedUser.username === 'auditor' && <span className="text-elevareGold-600 font-bold text-xs">Active</span>}
                                        </button>

                                        <button onClick={() => handleSwitchPersona('finance_tadesse')} className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer ${authenticatedUser.username === 'finance_tadesse' ? 'bg-amber-50/70 border border-elevareGold-400/50 text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                                    <span>💰</span>
                                                    <span>Fikadu Tadesse (Finance Officer)</span>
                                                </p>
                                                <p className="text-[10px] text-slate-500">Scope: Budget &amp; IPC Payment Records</p>
                                            </div>
                                            {authenticatedUser.username === 'finance_tadesse' && <span className="text-elevareGold-600 font-bold text-xs">Active</span>}
                                        </button>

                                        <button onClick={() => handleSwitchPersona('admin')} className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer ${authenticatedUser.username === 'admin' ? 'bg-amber-50/70 border border-elevareGold-400/50 text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                                    <span>👑</span>
                                                    <span>Girma Worku (System Admin)</span>
                                                </p>
                                                <p className="text-[10px] text-slate-500">Scope: Full Bureau Root Access</p>
                                            </div>
                                            {authenticatedUser.username === 'admin' && <span className="text-elevareGold-600 font-bold text-xs">Active</span>}
                                        </button>
                                    </div>

                                    {simulatedRole && (<div className="mt-2 pt-2 border-t border-slate-100">
                                            <button onClick={handleExitRoleSimulation} className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center font-display">
                                                Restore Primary Account
                                            </button>
                                        </div>)}
                                </div>)}
                        </div>

                        {/* Omnisearch Trigger in Header */}
                        <button onClick={() => setIsCommandPaletteOpen(true)} className="hidden md:flex items-center gap-2.5 px-4 py-2 bg-sky-50/80 hover:bg-sky-100/90 border border-sky-200/80 text-sky-900 rounded-xl text-xs font-medium transition-all shadow-2xs cursor-pointer">
                            <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <span>Search schemes, contracts...</span>
                            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white text-sky-700 border border-sky-200 rounded shadow-2xs">
                                ⌘K
                            </kbd>
                        </button>

                        {/* Quick Audit Deadlines Button */}
                        <button onClick={() => flagContractsNearDeadline(undefined, true)} className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold border border-sky-200 transition-colors cursor-pointer" title="Audit 30-day performance bond expiries and completion deadlines">
                            <span className="w-3.5 h-3.5 text-cyan-700">{ICONS.clock}</span>
                            <span>Audit Deadlines</span>
                        </button>

                        {/* Elevare Quick Action Button: New Scheme */}
                        {ROLE_PERMISSIONS.canViewPlanning.includes(authenticatedUser.role) && (<button onClick={() => setActiveModule('planning')} className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-900/15 cursor-pointer border border-cyan-400/30">
                                <svg className="w-4 h-4 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/>
                                </svg>
                                <span className="font-display">New Scheme</span>
                            </button>)}

                        {/* Notifications Bell */}
                        <div ref={notificationRef} className="relative">
                            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2.5 text-sky-800 hover:text-sky-950 hover:bg-sky-50 rounded-xl transition-all relative cursor-pointer" title="System Notifications">
                                <span className="w-5 h-5 block">{ICONS.bell}</span>
                                {unreadCount > 0 && (<span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 bg-cyan-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-xs">
                                        {unreadCount}
                                    </span>)}
                            </button>
                            {showNotifications && (<NotificationPanel notifications={filteredNotifications} onMarkAsRead={handleMarkAsRead} onMarkAllAsRead={handleMarkAllAsRead} onNotificationClick={handleNotificationClick}/>)}
                        </div>

                        {/* User Profile Header Trigger */}
                        <button onClick={() => setIsUserProfileModalOpen(true)} className="flex items-center gap-2.5 p-1.5 pl-2 rounded-2xl hover:bg-sky-50 transition-all border border-transparent hover:border-sky-200 cursor-pointer">
                            <img src={authenticatedUser.avatar} alt={authenticatedUser.username} className="h-9 w-9 rounded-xl object-cover ring-1 ring-cyan-300 shadow-xs bg-sky-100"/>
                            <div className="hidden xl:block text-left">
                                <p className="font-bold text-xs text-slate-900 leading-tight font-display">{authenticatedUser.fullName || authenticatedUser.username}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                                    <span className="font-bold text-sky-900">{authenticatedUser.role}</span>
                                    <span aria-hidden="true" className="text-slate-300">·</span>
                                    <span className="font-medium text-slate-600" title={`Effective Data Scope: ${userEffectiveScope}`}>
                                        {userEffectiveScope} ({accessibleProjects.length} schemes)
                                    </span>
                                </div>
                            </div>
                        </button>
                    </div>
                </header>

                {/* PRIMARY MODULE CONTENT CONTAINER */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-elevare-pattern">
                    <div key={activeModule} className="animate-slide-in max-w-7xl mx-auto space-y-6">
                        {renderModule()}
                    </div>
                </main>
            </div>

            {/* SMART COMMAND PALETTE (⌘K / Ctrl+K) */}
            <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} projects={accessibleProjects} contracts={accessibleContracts} procurements={accessibleProcurements} inspections={accessibleInspections} weeklyPlans={accessibleWeeklyPlans} onNavigate={handleNavigate} onTriggerAction={(actionId) => {
            if (actionId === 'audit-contract-deadlines') {
                flagContractsNearDeadline(undefined, true);
            }
        }} currentRole={authenticatedUser.role}/>

            {/* USER PROFILE & SETTINGS MODAL */}
            <UserProfileModal isOpen={isUserProfileModalOpen} onClose={() => setIsUserProfileModalOpen(false)} user={authenticatedUser} onLogout={handleLogout} onSimulateRole={handleSimulateRole} originalUser={originalUser} projects={accessibleProjects}/>

            {/* AI ASSISTANT & TOAST ALERTS */}
            <AIChatAssistant projects={accessibleProjects} contracts={accessibleContracts} procurements={accessibleProcurements} inspections={accessibleInspections} weeklyPlans={accessibleWeeklyPlans} user={authenticatedUser} onNavigate={handleNavigate}/>
            <Toast message={toastMessage} onClose={() => setToastMessage(null)}/>
        </div>);
};
export default App;
