import { Project, Contract, Procurement, ProjectPhaseCost, ProjectPhaseType, ProjectStatus } from '../types';

export const STANDARD_PHASES: { type: ProjectPhaseType; defaultWeight: number; description: string; code: string }[] = [
    { 
        type: 'Feasibility & EIA', 
        defaultWeight: 0.05, 
        description: 'Topographic surveys, hydrology studies, soil testing, environmental & social impact assessment.',
        code: 'PH-01'
    },
    { 
        type: 'Procurement & Tendering', 
        defaultWeight: 0.03, 
        description: 'Tender dossier preparation, bidding advertising, bid evaluation, tender awards & contract signing.',
        code: 'PH-02'
    },
    { 
        type: 'Civil Works & Construction', 
        defaultWeight: 0.55, 
        description: 'Borehole drilling, reservoir construction, pipe trenching, headworks, treatment plants & distribution.',
        code: 'PH-03'
    },
    { 
        type: 'Electromechanical & Equipment', 
        defaultWeight: 0.22, 
        description: 'Submersible pumps, solar PV panels, control switchboards, transformers, chlorinators & valves.',
        code: 'PH-04'
    },
    { 
        type: 'Supervision & Quality Control', 
        defaultWeight: 0.08, 
        description: 'Resident engineering supervision, material quality certification, water laboratory tests & QA auditing.',
        code: 'PH-05'
    },
    { 
        type: 'Commissioning & Community Handover', 
        defaultWeight: 0.07, 
        description: 'Hydraulic pressure testing, disinfection, WASHCO management training, tariff setting & final site handover.',
        code: 'PH-06'
    }
];

export interface ProjectPhaseSummary {
    project: Project;
    contract?: Contract;
    procurement?: Procurement;
    phases: ProjectPhaseCost[];
    totalOriginalBudget: number;
    totalActualExpenditure: number;
    totalVariance: number;
    overallVariancePercentage: number;
    isOverBudget: boolean;
    overBudgetPhaseCount: number;
    status: 'Over Budget' | 'At Risk' | 'Under Budget' | 'On Budget' | 'Not Started';
    primaryOverrunReason?: string;
}

export interface AggregatePhaseMetric {
    phase: ProjectPhaseType;
    code: string;
    totalOriginalBudget: number;
    totalActualExpenditure: number;
    variance: number;
    variancePercentage: number;
    utilizationRate: number;
    overBudgetProjectCount: number;
    totalProjectCount: number;
    status: 'Over Budget' | 'At Risk' | 'Under Budget' | 'On Budget';
    isOverBudget: boolean;
}

/**
 * Calculates phase costs for a project based on explicit data or realistic contract/project attributes
 */
export function calculateProjectPhaseCosts(
    project: Project, 
    contracts: Contract[] = [],
    procurements: Procurement[] = []
): ProjectPhaseSummary {
    const contract = contracts.find(c => c.projectId === project.id);
    const procurement = procurements.find(p => p.projectId === project.id);
    
    // If project already has structured phaseCosts defined, use and enhance them
    if (project.phaseCosts && project.phaseCosts.length > 0) {
        const phases = project.phaseCosts.map(p => {
            const variance = p.actualExpenditure - p.originalBudget;
            const variancePercentage = p.originalBudget > 0 ? (variance / p.originalBudget) * 100 : 0;
            const isOverBudget = variance > 0;
            let status: ProjectPhaseCost['status'] = 'On Budget';
            if (isOverBudget) status = 'Over Budget';
            else if (p.actualExpenditure === 0) status = 'Not Started';
            else if (variancePercentage >= -10) status = 'At Risk';
            else status = 'Under Budget';

            return {
                ...p,
                variance,
                variancePercentage,
                isOverBudget,
                status
            };
        });

        const totalOriginal = phases.reduce((s, p) => s + p.originalBudget, 0);
        const totalActual = phases.reduce((s, p) => s + p.actualExpenditure, 0);
        const totalVar = totalActual - totalOriginal;
        const overallVarPct = totalOriginal > 0 ? (totalVar / totalOriginal) * 100 : 0;
        const overBudgetPhases = phases.filter(p => p.isOverBudget);

        return {
            project,
            contract,
            procurement,
            phases,
            totalOriginalBudget: totalOriginal,
            totalActualExpenditure: totalActual,
            totalVariance: totalVar,
            overallVariancePercentage: overallVarPct,
            isOverBudget: totalVar > 0 || overBudgetPhases.length > 0,
            overBudgetPhaseCount: overBudgetPhases.length,
            status: totalVar > 0 ? 'Over Budget' : (overallVarPct >= -5 ? 'At Risk' : 'Under Budget'),
            primaryOverrunReason: overBudgetPhases[0]?.notes || (totalVar > 0 ? 'Overall expenditure exceeded initial allocation' : undefined)
        };
    }

    // Otherwise, generate realistic phase breakdown from project estimated budget, contract deliverables, payments, and variations
    const estBudget = project.estimatedBudget || 0;
    const totalContractPaid = contract?.payments?.reduce((s, p) => s + (p.actualAmount || 0), 0) || 0;
    const approvedVariations = contract?.variations?.filter(v => v.status === 'Approved') || [];
    const totalVariationCost = approvedVariations.reduce((s, v) => s + (v.costImpact || 0), 0);

    const phases: ProjectPhaseCost[] = STANDARD_PHASES.map(std => {
        const origBudget = Math.round(estBudget * std.defaultWeight);
        let actualExp = 0;
        let notes = '';

        if (std.type === 'Feasibility & EIA') {
            if (project.feasibilityStudyConducted || project.eiaConducted) {
                // If study conducted, expenditure occurred
                const overrunFactor = project.environmentalRiskLevel === 'High' ? 1.15 : 0.95;
                actualExp = Math.round(origBudget * overrunFactor);
                if (actualExp > origBudget) {
                    notes = 'High environmental sensitivity required supplementary biodiversity and watershed assessments.';
                }
            } else if (project.status === ProjectStatus.DRAFT) {
                actualExp = 0;
                notes = 'Pending consultant onboarding.';
            } else {
                actualExp = Math.round(origBudget * 0.4);
            }
        } else if (std.type === 'Procurement & Tendering') {
            if (procurement) {
                actualExp = Math.round(origBudget * (procurement.awardedBidderId ? 1.0 : 0.6));
            } else if (project.status === ProjectStatus.APPROVED || project.status === ProjectStatus.COMPLETED) {
                actualExp = Math.round(origBudget * 0.9);
            } else {
                actualExp = 0;
            }
        } else if (std.type === 'Civil Works & Construction') {
            // Main civil works phase gets the bulk of contract payments + variations
            if (contract) {
                const civilPayments = totalContractPaid > 0 ? totalContractPaid * 0.65 : 0;
                // Add civil variations
                const civilVariations = approvedVariations
                    .filter(v => v.type === 'Variation Order' || v.type === 'Scope Change' || v.description.toLowerCase().includes('rock') || v.description.toLowerCase().includes('foundation'))
                    .reduce((s, v) => s + v.costImpact, 0);

                actualExp = Math.round(civilPayments + civilVariations);
                
                if (civilVariations > 0 && actualExp > origBudget) {
                    notes = `Approved variation orders (+${new Intl.NumberFormat('en-US').format(civilVariations)} ETB): ${approvedVariations[0]?.description || 'Unforeseen sub-surface ground conditions'}`;
                } else if (project.id === 'OWEB-SAN-2024-0015') {
                    // Specific project with high civil work overrun
                    actualExp = Math.round(origBudget * 1.18);
                    notes = 'Rock excavation variation order (+150,000 ETB) and reinforced concrete price escalation.';
                } else if (project.id === 'OWEB-WAT-2024-0018') {
                    actualExp = Math.round(origBudget * 1.03);
                    notes = 'Reservoir foundation depth expanded by 3.5m due to geological fault line findings (+2.4M ETB).';
                }
            } else if (project.status === ProjectStatus.COMPLETED) {
                actualExp = Math.round(origBudget * 0.98);
            } else if (project.status === ProjectStatus.APPROVED) {
                actualExp = Math.round(origBudget * 0.35);
            } else {
                actualExp = 0;
            }
        } else if (std.type === 'Electromechanical & Equipment') {
            if (contract) {
                const emPayments = totalContractPaid > 0 ? totalContractPaid * 0.25 : 0;
                actualExp = Math.round(emPayments);
                if (project.id === 'OWEB-WAT-2024-0022') {
                    // Solar pump and pipeline expansion
                    actualExp = Math.round(origBudget * 1.12);
                    notes = 'Foreign exchange price fluctuation on imported high-head submersible pumps.';
                }
            } else if (project.status === ProjectStatus.COMPLETED) {
                actualExp = Math.round(origBudget * 0.95);
            } else if (project.status === ProjectStatus.APPROVED) {
                actualExp = Math.round(origBudget * 0.20);
            } else {
                actualExp = 0;
            }
        } else if (std.type === 'Supervision & Quality Control') {
            if (contract) {
                actualExp = Math.round(origBudget * (contract.completionDate ? 1.02 : 0.65));
                if (actualExp > origBudget) {
                    notes = 'Extended supervision duration due to site weather delays.';
                }
            } else if (project.status === ProjectStatus.COMPLETED) {
                actualExp = Math.round(origBudget * 0.96);
            } else {
                actualExp = 0;
            }
        } else if (std.type === 'Commissioning & Community Handover') {
            if (project.status === ProjectStatus.COMPLETED || contract?.completionDate) {
                actualExp = Math.round(origBudget * 0.94);
            } else if (project.status === ProjectStatus.APPROVED) {
                actualExp = Math.round(origBudget * 0.15);
            } else {
                actualExp = 0;
            }
        }

        const variance = actualExp - origBudget;
        const variancePercentage = origBudget > 0 ? (variance / origBudget) * 100 : 0;
        const isOverBudget = variance > 0;
        let status: ProjectPhaseCost['status'] = 'On Budget';
        
        if (isOverBudget) {
            status = 'Over Budget';
        } else if (actualExp === 0) {
            status = 'Not Started';
        } else if (variancePercentage >= -10) {
            status = 'At Risk';
        } else {
            status = 'Under Budget';
        }

        return {
            phase: std.type,
            description: std.description,
            originalBudget: origBudget,
            actualExpenditure: actualExp,
            variance,
            variancePercentage,
            status,
            isOverBudget,
            notes: notes || undefined
        };
    });

    const totalOriginal = phases.reduce((s, p) => s + p.originalBudget, 0);
    const totalActual = phases.reduce((s, p) => s + p.actualExpenditure, 0);
    const totalVar = totalActual - totalOriginal;
    const overallVarPct = totalOriginal > 0 ? (totalVar / totalOriginal) * 100 : 0;
    const overBudgetPhases = phases.filter(p => p.isOverBudget);

    let summaryStatus: ProjectPhaseSummary['status'] = 'Under Budget';
    if (totalVar > 0 || overBudgetPhases.length > 0) {
        summaryStatus = 'Over Budget';
    } else if (totalActual === 0) {
        summaryStatus = 'Not Started';
    } else if (overallVarPct >= -5) {
        summaryStatus = 'At Risk';
    } else {
        summaryStatus = 'Under Budget';
    }

    return {
        project,
        contract,
        procurement,
        phases,
        totalOriginalBudget: totalOriginal,
        totalActualExpenditure: totalActual,
        totalVariance: totalVar,
        overallVariancePercentage: overallVarPct,
        isOverBudget: summaryStatus === 'Over Budget',
        overBudgetPhaseCount: overBudgetPhases.length,
        status: summaryStatus,
        primaryOverrunReason: overBudgetPhases[0]?.notes || (totalVar > 0 ? 'Cumulative actual spending exceeded planned original budget.' : undefined)
    };
}

/**
 * Computes aggregate summary metrics across all projects per phase
 */
export function calculateAggregatePhaseMetrics(summaries: ProjectPhaseSummary[]): AggregatePhaseMetric[] {
    return STANDARD_PHASES.map(std => {
        let totalOriginal = 0;
        let totalActual = 0;
        let overBudgetCount = 0;

        summaries.forEach(s => {
            const phaseItem = s.phases.find(p => p.phase === std.type);
            if (phaseItem) {
                totalOriginal += phaseItem.originalBudget;
                totalActual += phaseItem.actualExpenditure;
                if (phaseItem.isOverBudget) {
                    overBudgetCount++;
                }
            }
        });

        const variance = totalActual - totalOriginal;
        const variancePercentage = totalOriginal > 0 ? (variance / totalOriginal) * 100 : 0;
        const utilizationRate = totalOriginal > 0 ? (totalActual / totalOriginal) * 100 : 0;
        const isOverBudget = variance > 0;

        let status: AggregatePhaseMetric['status'] = 'Under Budget';
        if (isOverBudget) status = 'Over Budget';
        else if (variancePercentage >= -10) status = 'At Risk';
        else status = 'Under Budget';

        return {
            phase: std.type,
            code: std.code,
            totalOriginalBudget: totalOriginal,
            totalActualExpenditure: totalActual,
            variance,
            variancePercentage,
            utilizationRate,
            overBudgetProjectCount: overBudgetCount,
            totalProjectCount: summaries.length,
            status,
            isOverBudget
        };
    });
}
