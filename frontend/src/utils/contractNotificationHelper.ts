import { Contract, Project, User, Notification, NotificationType, Role } from '../types';

export interface ContractDeadlineStatus {
    contract: Contract;
    project?: Project;
    bondStatus: {
        isWithin30Days: boolean;
        isExpired: boolean;
        daysRemaining: number;
        date: string;
        amount: number;
        currency: string;
    };
    completionStatus: {
        isWithin30Days: boolean;
        isOverdue: boolean;
        daysRemaining: number;
        date: string;
    };
    flaggedReasons: string[];
}

export interface FlagContractsResult {
    newNotifications: Notification[];
    flaggedContracts: ContractDeadlineStatus[];
    totalFlagged: number;
    bondExpiringCount: number;
    completionExpiringCount: number;
}

/**
 * Calculates the difference in full calendar days between two dates.
 */
export const getDaysDifference = (targetDateStr: string, referenceDate: Date = new Date()): number => {
    if (!targetDateStr) return Infinity;
    const target = new Date(targetDateStr);
    if (isNaN(target.getTime())) return Infinity;
    
    // Normalize both to start of day for accurate day counts
    const d1 = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    const d2 = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    return Math.round((d2.getTime() - d1.getTime()) / MS_PER_DAY);
};

/**
 * Evaluates a contract against the 30-day deadline threshold for Performance Bond Expiry
 * and Expected Completion Date.
 */
export const evaluateContractDeadlines = (
    contract: Contract,
    project?: Project,
    referenceDate: Date = new Date()
): ContractDeadlineStatus => {
    const bondDays = getDaysDifference(contract.performanceSecurityExpiryDate, referenceDate);
    const completionDays = getDaysDifference(contract.plannedCompletionDate, referenceDate);

    // Completed contracts with actual completionDate are exempted from completion alerts
    const isCompleted = Boolean(contract.completionDate);

    const isBondWithin30Days = bondDays <= 30 && bondDays !== Infinity;
    const isBondExpired = bondDays < 0 && bondDays !== Infinity;

    const isCompletionWithin30Days = !isCompleted && completionDays <= 30 && completionDays !== Infinity;
    const isCompletionOverdue = !isCompleted && completionDays < 0 && completionDays !== Infinity;

    const flaggedReasons: string[] = [];

    if (isBondWithin30Days) {
        if (isBondExpired) {
            flaggedReasons.push(`Performance security expired ${Math.abs(bondDays)} day(s) ago (${contract.performanceSecurityExpiryDate})`);
        } else {
            flaggedReasons.push(`Performance security expires in ${bondDays} day(s) (${contract.performanceSecurityExpiryDate})`);
        }
    }

    if (isCompletionWithin30Days) {
        if (isCompletionOverdue) {
            flaggedReasons.push(`Expected completion was due ${Math.abs(completionDays)} day(s) ago (${contract.plannedCompletionDate})`);
        } else {
            flaggedReasons.push(`Expected completion is due in ${completionDays} day(s) (${contract.plannedCompletionDate})`);
        }
    }

    return {
        contract,
        project,
        bondStatus: {
            isWithin30Days: isBondWithin30Days,
            isExpired: isBondExpired,
            daysRemaining: bondDays,
            date: contract.performanceSecurityExpiryDate,
            amount: contract.performanceBondAmount || 0,
            currency: contract.performanceBondCurrency || 'ETB',
        },
        completionStatus: {
            isWithin30Days: isCompletionWithin30Days,
            isOverdue: isCompletionOverdue,
            daysRemaining: completionDays,
            date: contract.plannedCompletionDate,
        },
        flaggedReasons,
    };
};

/**
 * Main helper function that checks all contracts and flags those with performance bond
 * or expected completion date within 30 days, creating notifications for managers, supervisors, and admins.
 *
 * @param contracts List of all contracts
 * @param projects List of projects for naming and metadata
 * @param users List of active users to target notifications
 * @param existingNotifications Currently stored notifications to prevent duplicate alerts
 * @param referenceDate Optional date context (defaults to now)
 * @returns FlagContractsResult containing newly generated notifications and flagged stats
 */
export const flagContractsWithin30Days = (
    contracts: Contract[],
    projects: Project[],
    users: User[],
    existingNotifications: Notification[] = [],
    referenceDate: Date = new Date()
): FlagContractsResult => {
    const newNotifications: Notification[] = [];
    const flaggedContracts: ContractDeadlineStatus[] = [];
    let bondExpiringCount = 0;
    let completionExpiringCount = 0;

    const existingNotifKeys = new Set(
        existingNotifications.map(n => `${n.userId}-${n.link?.itemId}-${n.message.slice(0, 40)}`)
    );

    (contracts || []).forEach(contract => {
        const project = (projects || []).find(p => p && p.id === contract.projectId);
        const status = evaluateContractDeadlines(contract, project, referenceDate);

        if (status.bondStatus.isWithin30Days || status.completionStatus.isWithin30Days) {
            flaggedContracts.push(status);

            if (status.bondStatus.isWithin30Days) bondExpiringCount++;
            if (status.completionStatus.isWithin30Days) completionExpiringCount++;

            const projectName = project ? project.name : contract.projectId;

            // Determine recipient users: Contract Manager, Supervisor, and System Admins
            const targetUsernames = new Set<string>();
            if (contract.contractManager) targetUsernames.add(contract.contractManager);
            if (contract.supervisor) targetUsernames.add(contract.supervisor);

            // Also notify Administrators
            users.filter(u => u.role === Role.ADMIN || u.role === Role.CONTRACT_MANAGER).forEach(u => {
                targetUsernames.add(u.username);
            });

            // 1. Generate notification for Performance Bond expiry within 30 days
            if (status.bondStatus.isWithin30Days) {
                const days = status.bondStatus.daysRemaining;
                const bondMsg = days < 0
                    ? `⚠️ Urgent: Performance Bond for Contract ${contract.id} (${projectName}) expired ${Math.abs(days)} day(s) ago (${status.bondStatus.date}). Renewal or claim required.`
                    : `⚠️ Notice: Performance Bond for Contract ${contract.id} (${projectName}) expires in ${days} day(s) (${status.bondStatus.date}). Please review renewal status.`;

                targetUsernames.forEach(username => {
                    const dedupeKey = `${username}-${contract.id}-bond-${status.bondStatus.date}`;
                    const notifId = `notif-bond-${contract.id}-${username}-${status.bondStatus.date}`;

                    // Check if already notified
                    const alreadyExists = existingNotifications.some(n => n.id === notifId) || existingNotifKeys.has(dedupeKey);

                    if (!alreadyExists) {
                        newNotifications.push({
                            id: notifId,
                            userId: username,
                            message: bondMsg,
                            type: NotificationType.ALERT,
                            isRead: false,
                            link: {
                                moduleId: 'contract',
                                itemId: contract.id,
                            },
                            timestamp: new Date().toISOString(),
                        });
                        existingNotifKeys.add(dedupeKey);
                    }
                });
            }

            // 2. Generate notification for Expected Completion Date within 30 days
            if (status.completionStatus.isWithin30Days) {
                const days = status.completionStatus.daysRemaining;
                const compMsg = days < 0
                    ? `⏰ Overdue: Expected completion for Contract ${contract.id} (${projectName}) was due ${Math.abs(days)} day(s) ago (${status.completionStatus.date}). Finalize inspection & commissioning.`
                    : `⏰ Schedule Alert: Expected completion for Contract ${contract.id} (${projectName}) is in ${days} day(s) (${status.completionStatus.date}). Prepare final handover dossier.`;

                targetUsernames.forEach(username => {
                    const dedupeKey = `${username}-${contract.id}-comp-${status.completionStatus.date}`;
                    const notifId = `notif-comp-${contract.id}-${username}-${status.completionStatus.date}`;

                    const alreadyExists = existingNotifications.some(n => n.id === notifId) || existingNotifKeys.has(dedupeKey);

                    if (!alreadyExists) {
                        newNotifications.push({
                            id: notifId,
                            userId: username,
                            message: compMsg,
                            type: NotificationType.ALERT,
                            isRead: false,
                            link: {
                                moduleId: 'contract',
                                itemId: contract.id,
                            },
                            timestamp: new Date().toISOString(),
                        });
                        existingNotifKeys.add(dedupeKey);
                    }
                });
            }
        }
    });

    return {
        newNotifications,
        flaggedContracts,
        totalFlagged: flaggedContracts.length,
        bondExpiringCount,
        completionExpiringCount,
    };
};
