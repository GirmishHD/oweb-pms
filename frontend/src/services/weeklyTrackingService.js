import { Role } from '../types';
import { canUserAccessProject } from './accessControlService';
import { apiClient } from './apiClient';
export const INITIAL_WEEKLY_PLANS = [];
export const INITIAL_WEEKLY_REPORTS = [];
let cachedPlans = [];
let cachedReports = [];
export const loadWeeklyPlans = () => {
    return cachedPlans;
};
export const fetchWeeklyPlansFromApi = async () => {
    try {
        const data = await apiClient.getWeeklyPlans();
        if (Array.isArray(data)) {
            const mapped = data.map((pl) => ({
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
            }));
            cachedPlans = mapped;
            return mapped;
        }
    }
    catch (err) {
        console.error('Failed to fetch weekly plans from API:', err);
    }
    return cachedPlans;
};
export const saveWeeklyPlans = async (plans) => {
    try {
        cachedPlans = plans;
        for (const pl of plans) {
            await apiClient.saveWeeklyPlan({
                plan_id: pl.id,
                project_id: pl.projectId,
                project_name: pl.projectName,
                zone: pl.zone,
                woreda: pl.woreda,
                kebele: pl.kebele,
                week_number: pl.weekNumber,
                start_date: pl.startDate,
                end_date: pl.endDate,
                prepared_by_user_id: pl.preparedByUserId,
                prepared_by_name: pl.preparedByName,
                prepared_date: pl.preparedDate,
                target_physical_progress_pct: pl.targetPhysicalProgressPct,
                status: pl.status,
                supervisor_comments: pl.supervisorComments,
                approved_by_user_id: pl.approvedByUserId,
                approved_by_name: pl.approvedByName,
                approval_date: pl.approvalDate,
                planned_activities: pl.plannedActivities,
            });
        }
    }
    catch (err) {
        console.error('Failed to save weekly plans to API:', err);
    }
};
export const loadWeeklyReports = () => {
    return cachedReports;
};
export const fetchWeeklyReportsFromApi = async () => {
    try {
        const data = await apiClient.getWeeklyReports();
        if (Array.isArray(data)) {
            const mapped = data.map((rp) => ({
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
            }));
            cachedReports = mapped;
            return mapped;
        }
    }
    catch (err) {
        console.error('Failed to fetch weekly reports from API:', err);
    }
    return cachedReports;
};
export const saveWeeklyReports = async (reports) => {
    try {
        cachedReports = reports;
        for (const rp of reports) {
            await apiClient.saveWeeklyReport({
                report_id: rp.id,
                work_plan_id: rp.workPlanId,
                project_id: rp.projectId,
                project_name: rp.projectName,
                zone: rp.zone,
                woreda: rp.woreda,
                kebele: rp.kebele,
                week_number: rp.weekNumber,
                start_date: rp.startDate,
                end_date: rp.endDate,
                submitted_by_user_id: rp.submittedByUserId,
                submitted_by_name: rp.submittedByName,
                submitted_date: rp.submittedDate,
                cumulative_physical_progress_pct: rp.cumulativePhysicalProgressPct,
                status: rp.status,
                reviewed_by_user_id: rp.reviewedByUserId,
                reviewed_by_name: rp.reviewedByName,
                review_date: rp.reviewDate,
                supervisor_feedback: rp.supervisorFeedback,
                activity_executions: rp.activityExecutions,
                site_challenges: rp.siteChallenges,
                materials_on_site: rp.materialsOnSite,
                manpower_on_site: rp.manpowerOnSite,
                equipment_on_site: rp.equipmentOnSite,
                site_photos: rp.sitePhotos,
            });
        }
    }
    catch (err) {
        console.error('Failed to save weekly reports to API:', err);
    }
};
export const filterWeeklyPlansByScope = (plans, user, projects, customRoles = []) => {
    if (!user || !plans || !Array.isArray(plans))
        return [];
    const safeProjects = Array.isArray(projects) ? projects : [];
    return plans.filter(plan => {
        // If user prepared it directly
        if (plan.preparedByUserId === user.id || plan.preparedByUserId === user.username) {
            return true;
        }
        const targetProject = safeProjects.find(p => p && p.id === plan.projectId);
        if (!targetProject) {
            return user.role === Role.ADMIN || user.role === Role.DIRECTOR || user.role === Role.COORDINATOR;
        }
        return canUserAccessProject(user, targetProject, customRoles);
    });
};
export const filterWeeklyReportsByScope = (reports, user, projects, customRoles = []) => {
    if (!user || !reports || !Array.isArray(reports))
        return [];
    const safeProjects = Array.isArray(projects) ? projects : [];
    return reports.filter(report => {
        if (report.submittedByUserId === user.id || report.submittedByUserId === user.username) {
            return true;
        }
        const targetProject = safeProjects.find(p => p && p.id === report.projectId);
        if (!targetProject) {
            return user.role === Role.ADMIN || user.role === Role.DIRECTOR || user.role === Role.COORDINATOR;
        }
        return canUserAccessProject(user, targetProject, customRoles);
    });
};
