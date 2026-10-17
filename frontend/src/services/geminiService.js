import { GoogleGenAI } from "@google/genai";
import { Role, ProjectStatus, InsightLevel } from '../types';
import { loadPrograms } from './programService';
import { loadNgos } from './ngoService';
import { loadStaff } from './staffService';
const getContractAmount = (c) => {
    if (typeof c.contractAmount === 'number')
        return c.contractAmount;
    if (Array.isArray(c.payments))
        return c.payments.reduce((s, p) => s + (p.amount || 0), 0);
    return 0;
};
const isContractActive = (c) => {
    if (c.status)
        return c.status === 'Active';
    return !c.completionDate;
};
// Chat class supporting Gemini streaming and intelligent local fallback
export class GeminiOrLocalChat {
    config;
    history = [];
    constructor(config) {
        this.config = config;
        this.history.push({ role: 'system', parts: [{ text: config.systemInstruction }] });
    }
    async *sendMessageStream(request) {
        const { message } = request;
        const apiKey = getApiKey();
        const allData = this.config.allData || {};
        const projects = Array.isArray(allData.projects) ? allData.projects : [];
        const contracts = Array.isArray(allData.contracts) ? allData.contracts : [];
        const procurements = Array.isArray(allData.procurements) ? allData.procurements : [];
        const inspections = Array.isArray(allData.inspections) ? allData.inspections : [];
        const weeklyPlans = Array.isArray(allData.weeklyPlans) ? allData.weeklyPlans : [];
        const user = allData.user;
        // 1. Attempt Gemini 2.5 Flash streaming when API key is configured
        if (apiKey) {
            try {
                const ai = new GoogleGenAI({ apiKey });
                const contextSummary = `
Current OWEB PB-PMS Database Context:
User: ${user?.username || 'Guest'} (Role: ${user?.role || 'N/A'}, Assigned Zone: ${user?.assignedZone || 'All'}, Program: ${user?.assignedProgram || 'All'})
Total Schemes: ${projects.length}
Key Schemes: ${projects.slice(0, 10).map(p => `[ID: ${p.id}] ${p.name} (${p.zone} Zone, ${p.woreda}) - Status: ${p.status}, Budget: ${p.estimatedBudget?.toLocaleString()} ETB`).join('; ')}
Total Contracts: ${contracts.length} (${contracts.filter(c => isContractActive(c)).length} active)
Active Contracts Summary: ${contracts.slice(0, 6).map(c => `[Contract #${c.id}] ${c.contractorName} for Project ${c.projectId} - Amount: ${getContractAmount(c).toLocaleString()} ETB`).join('; ')}
Total Procurements/Tenders: ${procurements.length}
QA/QC Inspections: ${inspections.length} recorded
Weekly Work Plans: ${weeklyPlans.length} plans submitted
Navigation instructions: Whenever relevant, append an action token like [ACTION:{"type":"navigate","moduleId":"<module>","itemId":"<optional_id>"}] where moduleId is one of: 'dashboard', 'programs', 'ngos', 'staff', 'planning', 'gisMap', 'review', 'procurement', 'contract', 'inspection', 'performance', 'documents', 'reporting', 'usermanagement', 'masterdata'.
`;
                const promptContents = [
                    { text: contextSummary },
                    { text: message }
                ];
                const responseStream = await ai.models.generateContentStream({
                    model: 'gemini-2.5-flash',
                    contents: promptContents,
                    config: {
                        systemInstruction: this.config.systemInstruction,
                    }
                });
                let receivedAny = false;
                for await (const chunk of responseStream) {
                    if (chunk.text) {
                        receivedAny = true;
                        yield { text: chunk.text };
                    }
                }
                if (receivedAny)
                    return;
            }
            catch (err) {
                console.warn('Gemini chat streaming failed, switching to local intelligence engine:', err);
            }
        }
        // 2. High-performance Contextual Local Intelligence Fallback
        await new Promise(resolve => setTimeout(resolve, 200));
        const responseText = generateLocalAssistantResponse(message, {
            projects,
            contracts,
            procurements,
            inspections,
            weeklyPlans,
            user
        });
        const words = responseText.split(' ');
        for (const word of words) {
            yield { text: `${word} ` };
            await new Promise(resolve => setTimeout(resolve, 20));
        }
    }
}
const generateLocalAssistantResponse = (message, data) => {
    const { projects, contracts, procurements, inspections, weeklyPlans, user } = data;
    const lower = message.toLowerCase().trim();
    // 0a. Programs & Multi-Program Portfolio Queries
    if (lower.includes('one wash') || lower.includes('cowash') || lower.includes('unicef') || lower.includes('second urban') || lower.includes('biogas') || lower.includes('basket fund') || lower.includes('programs') || lower.includes('portfolio') || lower.includes('scheme under') || lower.includes('schemes are under')) {
        const programs = loadPrograms();
        const action = { type: 'navigate', moduleId: 'programs' };
        // Count schemes per program
        const programSummaries = programs.map(prog => {
            const progProjects = projects.filter(p => p.program === prog.name || p.program === prog.code);
            const totalBudget = progProjects.reduce((s, p) => s + (p.estimatedBudget || 0), 0);
            return `• ${prog.name} (${prog.code}): ${progProjects.length} schemes | Investment: ${(totalBudget / 1e6).toFixed(1)}M ETB (Status: ${prog.status})`;
        });
        return `Multi-Program Portfolios & Program Isolation Status:\n\n` +
            `• Registered Programs: ${programs.length} active funding frameworks\n` +
            `• Governance: Bureau-wide strict program data isolation active\n\n` +
            `Program Breakdown:\n` +
            programSummaries.join('\n') +
            `\n\nManage Programs, Portfolios & Budgets [ACTION:${JSON.stringify(action)}].`;
    }
    // 0b. NGOs & Implementing Partners Queries
    if (lower.includes('ngo') || lower.includes('partner') || lower.includes('implementing partner') || lower.includes('world vision') || lower.includes('wateraid') || lower.includes('care')) {
        const ngos = loadNgos();
        const action = { type: 'navigate', moduleId: 'ngos' };
        const activeCount = ngos.filter(n => n.status === 'Active').length;
        const totalBudget = ngos.reduce((s, n) => s + (n.annualBudget || 0), 0);
        const topNgos = ngos.slice(0, 5).map(n => `• ${n.name} [${n.code}] - Primary: ${n.primaryProgram || 'General WaSH'} | Rating: ${n.performanceRating || 4.5}★ | Status: ${n.status}`);
        return `NGOs & Implementing Partners Registry:\n\n` +
            `• Registered Partners: ${ngos.length} (${activeCount} active partners)\n` +
            `• Committed Partner Financing: ${(totalBudget / 1e6).toFixed(1)}M ETB\n` +
            `• Active Partners Overview:\n` +
            topNgos.join('\n') +
            `\n\nExplore Partner Portfolios & MoUs [ACTION:${JSON.stringify(action)}].`;
    }
    // 0c. Staff Management & Program Transfers Queries
    if (lower.includes('staff') || lower.includes('transfer') || lower.includes('classification') || lower.includes('engineer') || lower.includes('focal person') || lower.includes('transferred')) {
        const staffList = loadStaff();
        const action = { type: 'navigate', moduleId: 'staff' };
        const transferredCount = staffList.filter(s => (s.transferHistory || []).length > 0).length;
        const activeStaff = staffList.filter(s => s.status === 'Active').length;
        const staffOverview = staffList.slice(0, 4).map(s => `• ${s.fullName} (${s.jobTitle}) - Assigned: ${s.assignedProgramName || 'General WaSH'} [Code: ${s.staffCode}]`);
        return `OWEB WaSH Staff & Program Allocation Registry:\n\n` +
            `• Registered Professional Personnel: ${staffList.length} (${activeStaff} active)\n` +
            `• Inter-Program Transfer Records: ${transferredCount} staff with logged historical transfers\n` +
            `• Roster Highlights:\n` +
            staffOverview.join('\n') +
            `\n\nAccess Staff Management & Classifications [ACTION:${JSON.stringify(action)}].`;
    }
    // 1. Water quality & lab testing queries
    if (lower.includes('water quality') || lower.includes('lab test') || lower.includes('ph') || lower.includes('turbidity') || lower.includes('chlorine') || lower.includes('fluoride') || lower.includes('e.coli') || lower.includes('ecoli')) {
        const tests = inspections.filter(i => i.waterQualityTest).map(i => i.waterQualityTest);
        const compliant = tests.filter(t => t.complianceStatus === 'Compliant').length;
        const total = tests.length;
        const rate = total > 0 ? ((compliant / total) * 100).toFixed(0) : '100';
        const action = { type: 'navigate', moduleId: 'inspection' };
        return `Water Quality & Lab Verification Summary:\n\n` +
            `• Recorded Lab Tests: ${total}\n` +
            `• WHO/CES Compliance Rate: ${rate}% (${compliant} of ${total} compliant)\n` +
            `• Standard Parameters Monitored: pH (6.5–8.5), Turbidity (< 5 NTU), Free Residual Chlorine (0.2–0.5 mg/L), Total Dissolved Solids (< 1,000 mg/L), and E. coli (0 CFU/100mL).\n\n` +
            `Review test records and parameter reports in the QA/QC Logbook [ACTION:${JSON.stringify(action)}].`;
    }
    // 2. Weekly Work Plans & S-Curve Tracking
    if (lower.includes('weekly') || lower.includes('s-curve') || lower.includes('work plan') || lower.includes('site tracking') || lower.includes('progress report')) {
        const totalPlans = weeklyPlans.length;
        const approvedPlans = weeklyPlans.filter(p => p.status === 'Approved').length;
        const activeActivities = weeklyPlans.reduce((sum, p) => sum + (p.plannedActivities?.length || 0), 0);
        const action = { type: 'navigate', moduleId: 'inspection' };
        return `Weekly Work Plans & Site Execution Tracking:\n\n` +
            `• Active Work Plans: ${totalPlans} (${approvedPlans} approved by supervisors)\n` +
            `• Tracked Field Activities: ${activeActivities} work package tasks across assigned schemes\n` +
            `• Features Available: Weekly activity breakdown, daily workforce & equipment logs, cumulative S-Curve planned vs actual progress tracking, and supervisor approval workflows.\n\n` +
            `Access the Weekly Work Plans & S-Curve dashboard [ACTION:${JSON.stringify(action)}].`;
    }
    // 3. QA/QC Field Inspections & Punch Lists
    if (lower.includes('inspection') || lower.includes('defect') || lower.includes('punch list') || lower.includes('qa/qc') || lower.includes('quality')) {
        const totalInspections = inspections.length;
        const totalDefects = inspections.reduce((sum, i) => sum + ((i.defects || []).filter((d) => d.status === 'Open').length), 0);
        const action = { type: 'navigate', moduleId: 'inspection' };
        return `Field Quality Assurance (QA/QC) & Inspection Logbook:\n\n` +
            `• Total Field Inspections: ${totalInspections} logged\n` +
            `• Open Quality Punch List Defects: ${totalDefects} requiring contractor rectification\n` +
            `• Stages Inspected: Pre-Construction, Excavation & Foundations, Pipelaying & Pressure Test, Electromechanical Installation, and Pre-Commissioning.\n\n` +
            `Open the Field Inspection Logbook [ACTION:${JSON.stringify(action)}].`;
    }
    // 4. Cost Overruns & Budget Variations
    if (lower.includes('overrun') || lower.includes('variation') || lower.includes('cost increase') || lower.includes('exceed')) {
        const criticalOverruns = projects.filter(p => {
            const contract = contracts.find(c => c.projectId === p.id);
            const approvedVariations = contract?.variations?.filter((v) => v.status === 'Approved').reduce((s, v) => s + (v.amount || v.costImpact || 0), 0) || 0;
            const revisedBudget = (p.estimatedBudget || 0) + approvedVariations;
            const contractExp = contract?.payments?.reduce((s, pay) => s + (pay.actualAmount || 0), 0) || 0;
            const phaseExp = (p.phaseCosts || []).reduce((s, ph) => s + (ph.actualAmount || 0), 0);
            const actualExp = Math.max(contractExp, phaseExp);
            return revisedBudget > 0 && actualExp > revisedBudget * 1.10;
        });
        const action = { type: 'navigate', moduleId: 'performance' };
        if (criticalOverruns.length > 0) {
            return `Budget Overrun Warning:\n\n` +
                `There are ${criticalOverruns.length} project(s) exceeding their allocated baseline budget by over 10%:\n` +
                criticalOverruns.map(p => `• ${p.name} (${p.zone}) - Budget: ${p.estimatedBudget.toLocaleString()} ETB`).join('\n') +
                `\n\nAudit variations and cost breakdowns in the Performance Dashboard [ACTION:${JSON.stringify(action)}].`;
        }
        return `All active projects are operating within acceptable budget variance thresholds. You can inspect detailed expenditure curves in the Performance Dashboard [ACTION:${JSON.stringify(action)}].`;
    }
    // 5. How many projects / project statistics
    if (lower.includes('how many') || lower.includes('count') || lower.includes('statistics') || (lower.includes('project') && lower.includes('total'))) {
        if (lower.includes('approved')) {
            const count = projects.filter(p => p.status === ProjectStatus.APPROVED).length;
            const action = { type: 'navigate', moduleId: 'planning' };
            return `There are currently ${count} approved projects across Oromia Regional State. [ACTION:${JSON.stringify(action)}]`;
        }
        if (lower.includes('review') || lower.includes('submitted')) {
            const count = projects.filter(p => p.status === ProjectStatus.UNDER_REVIEW || p.status === ProjectStatus.SUBMITTED).length;
            const action = { type: 'navigate', moduleId: 'review' };
            return `There are ${count} projects pending technical and environmental review. [ACTION:${JSON.stringify(action)}]`;
        }
        if (lower.includes('completed')) {
            const count = projects.filter(p => p.status === ProjectStatus.COMPLETED).length;
            return `There are ${count} completed projects with finalized handover certificates.`;
        }
        const totalBudget = projects.reduce((s, p) => s + (p.estimatedBudget || 0), 0);
        const action = { type: 'navigate', moduleId: 'dashboard' };
        return `OWEB Project Portfolio Overview:\n\n` +
            `• Total Registered Schemes: ${projects.length}\n` +
            `• Total Portfolio Investment: ${new Intl.NumberFormat('en-US').format(totalBudget)} ETB\n` +
            `• Approved: ${projects.filter(p => p.status === ProjectStatus.APPROVED).length}\n` +
            `• Under Review: ${projects.filter(p => p.status === ProjectStatus.UNDER_REVIEW || p.status === ProjectStatus.SUBMITTED).length}\n` +
            `• Completed: ${projects.filter(p => p.status === ProjectStatus.COMPLETED).length}\n\n` +
            `View Portfolio Dashboard [ACTION:${JSON.stringify(action)}].`;
    }
    // 6. Project specific search
    if (lower.startsWith('status of') || lower.startsWith('details of') || lower.includes('shashamane') || lower.includes('jimma') || lower.includes('ammaro') || lower.includes('harar') || lower.includes('bale')) {
        let searchTerm = lower.replace('status of', '').replace('details of', '').replace('project', '').replace('?', '').trim();
        if (!searchTerm && lower.includes('shashamane'))
            searchTerm = 'shashamane';
        if (!searchTerm && lower.includes('jimma'))
            searchTerm = 'jimma';
        const match = projects.find(p => p && p.name && (p.name.toLowerCase().includes(searchTerm) || (p.id && p.id.toLowerCase().includes(searchTerm))));
        if (match) {
            const contract = contracts.find(c => c.projectId === match.id);
            const action = { type: 'navigate', moduleId: 'dashboard', itemId: match.id };
            return `Project Summary: "${match.name}" [ID: ${match.id}]\n\n` +
                `• Status: ${match.status}\n` +
                `• Location: ${match.woreda ? `${match.woreda}, ` : ''}${match.zone} Zone (Kebele: ${match.kebele || 'N/A'})\n` +
                `• Classification: ${match.projectType} (${match.projectSubType || 'Infrastructure Scheme'})\n` +
                `• Estimated Budget: ${new Intl.NumberFormat('en-US').format(match.estimatedBudget || 0)} ETB\n` +
                `• Target Beneficiaries: ${match.populationCoverage ? match.populationCoverage.toLocaleString() : 'N/A'} persons\n` +
                `• Water Source: ${match.sourceOfWater || 'Borehole/Spring'} (Pumping: ${match.energySource || 'Solar/Gravity'})\n` +
                `• EIA Status: ${match.eiaConducted ? 'Conducted & Compliant' : 'Pending Verification'}\n` +
                (contract ? `• Awarded Contractor: ${contract.contractorName} (Contract #${contract.id})\n` : '') +
                `\nOpen Project in Workspace [ACTION:${JSON.stringify(action)}]`;
        }
    }
    // 7. Contracts queries
    if (lower.includes('contract') || lower.includes('contractor')) {
        if (user && (user.role === Role.CONTRACT_MANAGER || user.role === Role.SUPERVISOR)) {
            const myContracts = contracts.filter(c => c.contractManager === user.username || c.supervisor === user.username);
            if (myContracts.length > 0) {
                const action = { type: 'navigate', moduleId: 'contract' };
                return `You are assigned to ${myContracts.length} contract(s):\n\n` +
                    myContracts.map(c => `• Contract #${c.id}: ${c.contractorName} (${new Intl.NumberFormat('en-US').format(getContractAmount(c))} ETB) - Status: ${isContractActive(c) ? 'Active' : 'Completed'}`).join('\n') +
                    `\n\nManage contracts [ACTION:${JSON.stringify(action)}]`;
            }
        }
        const activeContracts = contracts.filter(c => isContractActive(c));
        const action = { type: 'navigate', moduleId: 'contract' };
        return `Contract Administration Overview:\n\n` +
            `• Total Contracts: ${contracts.length}\n` +
            `• Active Executions: ${activeContracts.length}\n` +
            `• Total Contract Commitment: ${new Intl.NumberFormat('en-US').format(contracts.reduce((s, c) => s + getContractAmount(c), 0))} ETB\n\n` +
            `Open Contract Administration [ACTION:${JSON.stringify(action)}]`;
    }
    // 8. Tenders / Procurement
    if (lower.includes('procurement') || lower.includes('tender') || lower.includes('bid')) {
        const openTenders = procurements.filter(p => p.status === 'Open' || p.status === 'Evaluated' || p.evaluationStatus === 'Preliminary Evaluation' || p.tenderStage === 'Bid Opening');
        const action = { type: 'navigate', moduleId: 'procurement' };
        return `Procurement & Tendering Overview:\n\n` +
            `• Total Tender Records: ${procurements.length}\n` +
            `• Open/Active Biddings: ${openTenders.length}\n` +
            `• Procurement Methods: National Competitive Bidding (NCB), International (ICB), and Request for Quotation (RFQ).\n\n` +
            `Manage Tenders & Bids [ACTION:${JSON.stringify(action)}]`;
    }
    // 9. Review queue
    if (lower.includes('what needs my review') || lower.includes('review queue') || lower.includes('pending review')) {
        const toReview = projects.filter(p => p.status === ProjectStatus.SUBMITTED || p.status === ProjectStatus.UNDER_REVIEW);
        const action = { type: 'navigate', moduleId: 'review' };
        if (toReview.length > 0) {
            return `You have ${toReview.length} scheme(s) pending technical and EIA review:\n\n` +
                toReview.map(p => `• ${p.name} (${p.zone}) - Budget: ${p.estimatedBudget.toLocaleString()} ETB`).join('\n') +
                `\n\nReview schemes [ACTION:${JSON.stringify(action)}]`;
        }
        return `All submitted projects have been processed. There are no pending reviews in your queue. [ACTION:${JSON.stringify(action)}]`;
    }
    // 10. GIS and Geospatial Map
    if (lower.includes('map') || lower.includes('gis') || lower.includes('coordinate') || lower.includes('location')) {
        const action = { type: 'navigate', moduleId: 'gisMap' };
        return `The OWEB Geographic Information System (GIS) maps water schemes across all Oromia zones with interactive GPS coordinates, regional corridors, and scheme density overlays.\n\nOpen GIS Regional Map [ACTION:${JSON.stringify(action)}].`;
    }
    // 11. Reporting & Analytics
    if (lower.includes('report') || lower.includes('export') || lower.includes('analytics') || lower.includes('pdf') || lower.includes('excel')) {
        const action = { type: 'navigate', moduleId: 'reporting' };
        return `You can generate executive PDF summaries, Excel data sheets, expenditure curves, and Gantt project schedules directly in the Reporting & Analytics module.\n\nOpen Executive Reports [ACTION:${JSON.stringify(action)}].`;
    }
    // Default polite response with suggested quick commands
    return `Hello ${user?.username || 'Colleague'}! I am your OWEB Program-Based Project Management Assistant.\n\n` +
        `Here are some things you can ask me:\n` +
        `• "How many schemes are under ONE WASH and COWASH?"\n` +
        `• "Show active NGO implementing partners"\n` +
        `• "List staff transferred between programs"\n` +
        `• "Water quality lab test compliance rate"\n` +
        `• "Show weekly work plans and S-Curve progress"\n` +
        `• "Check for budget cost overruns"\n` +
        `• "Status of Shashamane project?"\n` +
        `• "What needs my review?"\n` +
        `• "Active contracts and contractors"`;
};
const getApiKey = () => {
    return process.env.GEMINI_API_KEY || process.env.API_KEY || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';
};
// Fallback high-impact 1-paragraph summary generator
const createStructuredOneParagraphSummary = (project) => {
    const name = project.name?.trim() || 'The Proposed Water Infrastructure Development';
    const zone = project.zone || 'Oromia Region';
    const woreda = project.woreda ? `${project.woreda} Woreda, ` : '';
    const type = `${project.projectType || 'Water Supply'} (${project.projectSubType || 'Infrastructure Scheme'})`;
    const intervention = project.typeOfIntervention || 'New Construction';
    const budgetStr = project.estimatedBudget && project.estimatedBudget > 0
        ? `${new Intl.NumberFormat('en-US').format(project.estimatedBudget)} ETB`
        : 'an allocated capital budget';
    const funding = project.fundingSource || 'Regional Development Funds';
    const populationStr = project.populationCoverage && project.populationCoverage > 0
        ? `${new Intl.NumberFormat('en-US').format(project.populationCoverage)} community members`
        : 'the designated rural and peri-urban populace';
    const dailyDemand = project.dailyDemandEstimate && project.dailyDemandEstimate > 0
        ? ` with a projected daily water demand of ${new Intl.NumberFormat('en-US').format(project.dailyDemandEstimate)} liters`
        : '';
    const storageStr = project.storageRequirement && project.storageRequirement > 0
        ? ` supported by a ${project.storageRequirement} m³ reservoir`
        : '';
    const pipeStr = project.pipeLengthEstimation && project.pipeLengthEstimation > 0
        ? ` and ${project.pipeLengthEstimation} km of distribution piping`
        : '';
    const sourceEnergy = project.sourceOfWater || project.energySource
        ? ` utilizing a ${project.sourceOfWater || 'sustainable water source'} powered via ${project.energySource || 'solar/gravity pumping system'}`
        : '';
    const implementing = project.implementingBody ? ` under the supervision of ${project.implementingBody}` : '';
    return `The "${name}" is a strategic ${type} project located in ${woreda}${zone}, structured as a ${intervention} initiative to provide reliable potable water access to approximately ${populationStr}${dailyDemand}. With an estimated capital investment of ${budgetStr} financed through ${funding}${implementing}, the project scope encompasses comprehensive civil and electromechanical works${storageStr}${pipeStr}${sourceEnergy} to ensure climate-resilient, sustainable community water security and sanitation improvement.`;
};
export const generateProjectSummary = async (project) => {
    const apiKey = getApiKey();
    const prompt = `You are an expert civil engineering and water infrastructure planning specialist for the Oromia Water Resource Bureau (OWEB).
Generate exactly ONE cohesive, professional, publication-ready executive summary paragraph based on the following project parameters:

- Project Name: ${project.name || 'Untitled Water Infrastructure Scheme'}
- Project Type & Classification: ${project.projectType || 'Water Supply'} (${project.projectSubType || 'Rural Scheme'}), Program: ${project.program || 'Regional Water Access'}
- Scope & Technical Sizing:
  * Location: ${project.woreda ? project.woreda + ', ' : ''}${project.zone || 'Oromia Region'} (Kebele: ${project.kebele || 'Target Community'})
  * Intervention Type: ${project.typeOfIntervention || 'New Construction'}
  * Target Beneficiary Population: ${project.populationCoverage ? project.populationCoverage.toLocaleString() : 'N/A'} persons
  * Projected Daily Demand: ${project.dailyDemandEstimate ? project.dailyDemandEstimate.toLocaleString() + ' L/day' : 'N/A'}
  * Storage Capacity: ${project.storageRequirement ? project.storageRequirement + ' m³' : 'N/A'}
  * Pipe Network Length: ${project.pipeLengthEstimation ? project.pipeLengthEstimation + ' km' : 'N/A'}
  * Water Source & Pumping: ${project.sourceOfWater || 'Spring/Borehole'} powered by ${project.energySource || 'Solar/Gravity'}
  * Implementing Body: ${project.implementingBody || 'OWEB'}
- Budget & Financing:
  * Total Estimated Budget: ${new Intl.NumberFormat('en-US').format(project.estimatedBudget || 0)} ETB
  * Financing Source: ${project.fundingSource || 'Regional Treasury'}
  * Community Contribution: ${project.communityContribution || 'Local Labor & Materials'}

STRICT REQUIREMENTS:
1. Provide exactly ONE well-written, continuous paragraph (no bullet points, no multiple paragraphs, no intro/outro labels).
2. Directly incorporate the Project Name, Scope (technical sizing and beneficiary coverage), Project Type, and Budget.
3. Use a formal, objective, public sector engineering tone suitable for bureau executives and funding partners.`;
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            if (response && response.text) {
                return response.text.trim();
            }
        }
        catch (error) {
            console.warn("Gemini API call failed, falling back to algorithmic summary:", error);
        }
    }
    // High quality fallback
    return createStructuredOneParagraphSummary(project);
};
export const generateRiskAssessment = async (project) => {
    const apiKey = getApiKey();
    const prompt = {
        text: JSON.stringify({
            estimatedBudget: project.estimatedBudget,
            environmentalRiskLevel: project.environmentalRiskLevel,
            sourceReliability: project.sourceReliability,
            conflictOverSource: project.conflictOverSource,
            skilledOperatorsAvailable: project.skilledOperatorsAvailable,
            landOwnershipCleared: project.landOwnershipCleared
        })
    };
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    { text: "Analyze the following project data and provide a risk assessment. Identify the overall risk level, key risks, and potential mitigation strategies." },
                    prompt
                ],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: 'OBJECT',
                        properties: {
                            level: { type: 'STRING' },
                            keyRisks: { type: 'ARRAY', items: { type: 'STRING' } },
                            mitigationStrategies: { type: 'ARRAY', items: { type: 'STRING' } }
                        }
                    }
                }
            });
            if (response.text) {
                return JSON.parse(response.text);
            }
        }
        catch (error) {
            console.warn("Gemini risk assessment failed, using rule-based assessment:", error);
        }
    }
    // Fallback rule-based risk assessment
    let level = 'Low';
    const keyRisks = [];
    const mitigationStrategies = [];
    if (project.estimatedBudget > 5000000) {
        level = 'Medium';
        keyRisks.push("High budget allocation requires enhanced milestone verification and procurement audit controls.");
        mitigationStrategies.push("Implement strict milestone-based payment disbursements and bi-weekly financial audits.");
    }
    if (project.conflictOverSource) {
        level = 'High';
        keyRisks.push("Reported community or riparian dispute over the water source poses risk to construction continuity.");
        mitigationStrategies.push("Facilitate formal elder dialogue, Woreda Peace & Security Committee clearance, and signed MoU before site handover.");
    }
    if (!project.skilledOperatorsAvailable) {
        keyRisks.push("Absence of trained local pump/solar technicians may threaten post-handover system uptime.");
        mitigationStrategies.push("Incorporate structured WASHCO and local technician capacity training in the contract requirements.");
    }
    if (!project.landOwnershipCleared) {
        level = level === 'High' ? 'High' : 'Medium';
        keyRisks.push("Pending land acquisition or right-of-way clearance for headworks or pipeline route.");
        mitigationStrategies.push("Finalize Kebele administration land deed and compensation protocols prior to contractor mobilization.");
    }
    return { level, keyRisks, mitigationStrategies };
};
// New function to create a chat instance
export const createChatSession = (allData) => {
    const username = allData?.user?.username || 'User';
    const role = allData?.user?.role || Role.USER;
    const systemInstruction = `You are a helpful AI assistant for the OWEB Program-Based Project Management System. You can answer questions about projects, contracts, and procurement. Use the provided data to answer user queries. Be concise and professional. The current user is ${username} with the role of ${role}. When providing actionable items, embed them in the text using the format [ACTION:{"type":"navigate","moduleId":"some_module","itemId":"some_id"}].`;
    return new GeminiOrLocalChat({
        model: 'gemini-2.5-flash',
        systemInstruction,
        allData
    });
};
export const generateDashboardInsights = async (projects = [], contracts = [], procurements = []) => {
    const insights = [];
    const safeProjects = Array.isArray(projects) ? projects : [];
    const safeContracts = Array.isArray(contracts) ? contracts : [];
    const safeProcurements = Array.isArray(procurements) ? procurements : [];
    const today = new Date();
    // --- Insight: Schedule Risk ---
    const activeContracts = safeContracts.filter(c => !c.completionDate);
    activeContracts.forEach(c => {
        if (!c.plannedCompletionDate || !(c.commencementActualDate || c.commencementPlanDate))
            return;
        const plannedCompletion = new Date(c.plannedCompletionDate);
        const commencement = new Date(c.commencementActualDate || c.commencementPlanDate);
        const totalDuration = (plannedCompletion.getTime() - commencement.getTime());
        const elapsedDuration = (today.getTime() - commencement.getTime());
        const timeElapsedPercent = totalDuration > 0 ? (elapsedDuration / totalDuration) * 100 : 0;
        const completedDeliverables = (c.deliverables || []).filter(d => d.actualCompletionDate).length;
        const progressPercent = c.deliverables && c.deliverables.length > 0 ? (completedDeliverables / c.deliverables.length) * 100 : 0;
        if (timeElapsedPercent > 75 && progressPercent < 50) {
            insights.push({
                id: `insight-schedule-${c.id}`,
                level: InsightLevel.WARNING,
                title: "Schedule Risk Identified",
                description: `Contract for project "${c.projectId}" is ${timeElapsedPercent.toFixed(0)}% through its timeline, but only ${progressPercent.toFixed(0)}% of deliverables are complete.`,
                recommendation: "Follow up with the Contract Manager to assess progress and identify potential delays.",
                link: { moduleId: 'contract', itemId: c.id }
            });
        }
    });
    // --- Insight: Budget Watch ---
    safeContracts.forEach(c => {
        const project = safeProjects.find(p => p && p.id === c.projectId);
        if (!project)
            return;
        const totalVariation = (c.variations || []).reduce((sum, v) => sum + (v.status === 'Approved' ? v.costImpact : 0), 0);
        const variationPercent = project.estimatedBudget > 0 ? (totalVariation / project.estimatedBudget) * 100 : 0;
        if (variationPercent > 15) {
            insights.push({
                id: `insight-budget-${c.id}`,
                level: InsightLevel.CRITICAL,
                title: "Significant Budget Variation",
                description: `Project "${project.name}" has approved variations totaling ${totalVariation.toLocaleString()} ETB, which is ${variationPercent.toFixed(1)}% over the original budget.`,
                recommendation: "Conduct a thorough review of variation orders and financial health to mitigate major cost overruns.",
                link: { moduleId: 'contract', itemId: c.id }
            });
        }
    });
    // --- Insight: Procurement Bottleneck ---
    const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30)).getTime();
    const approvedProjects = safeProjects.filter(p => p && p.status === ProjectStatus.APPROVED);
    const procuredProjectIds = new Set(safeProcurements.map(proc => proc.projectId));
    const delayedProcurement = approvedProjects.find(p => {
        const projectApprovalDate = p.reviewDate ? new Date(p.reviewDate).getTime() : (p.createdAt ? new Date(p.createdAt).getTime() : null);
        return !procuredProjectIds.has(p.id) && projectApprovalDate && projectApprovalDate < thirtyDaysAgo;
    });
    if (delayedProcurement) {
        insights.push({
            id: `insight-procurement-delay-${delayedProcurement.id}`,
            level: InsightLevel.WARNING,
            title: "Procurement Initiation Lag",
            description: `Project "${delayedProcurement.name}" was approved over 30 days ago but has not yet entered the procurement phase.`,
            recommendation: "Advise the procurement team to initiate the bidding process to avoid further project delays.",
            link: { moduleId: 'procurement', itemId: delayedProcurement.id }
        });
    }
    // --- Insight: Contract Finalization Delay ---
    const fifteenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 15)).getTime();
    const awardedProcurements = safeProcurements.filter(p => p.awardDate && !safeContracts.some(c => c.procurementId === p.id));
    const delayedContract = awardedProcurements.find(p => p.awardDate && new Date(p.awardDate).getTime() < fifteenDaysAgo);
    if (delayedContract) {
        insights.push({
            id: `insight-contract-delay-${delayedContract.id}`,
            level: InsightLevel.INFO,
            title: "Contract Finalization Pending",
            description: `The award for procurement "${delayedContract.id}" was issued over 15 days ago. A contract should be created and signed.`,
            recommendation: "Assign a Contract Manager and create the contract record to proceed with project commencement.",
            link: { moduleId: 'contract', itemId: '' }
        });
    }
    // --- Insight: Positive Reinforcement ---
    const efficientContract = safeContracts.find(c => {
        return (c.deliverables || []).some(d => {
            if (!d.actualCompletionDate || !d.plannedCompletionDate)
                return false;
            const actual = new Date(d.actualCompletionDate).getTime();
            const planned = new Date(d.plannedCompletionDate).getTime();
            const daysAhead = (planned - actual) / (1000 * 3600 * 24);
            return daysAhead > 14; // Completed more than 2 weeks ahead of schedule
        });
    });
    if (efficientContract) {
        insights.push({
            id: `insight-success-${efficientContract.id}`,
            level: InsightLevel.SUCCESS,
            title: "Excellent Progress",
            description: `Work on contract "${efficientContract.id}" is progressing ahead of schedule. Key deliverables have been completed early.`,
            recommendation: "Acknowledge the team's great work. This project is a model for efficient execution.",
            link: { moduleId: 'contract', itemId: efficientContract.id }
        });
    }
    // --- Insight: Completed Project ---
    const completedProject = safeProjects.find(p => p && p.status === ProjectStatus.COMPLETED);
    if (completedProject && !insights.some(i => i.link?.itemId === completedProject.id)) {
        insights.push({
            id: `insight-completed-${completedProject.id}`,
            level: InsightLevel.SUCCESS,
            title: "Project Completed",
            description: `Congratulations to the team for successfully completing the "${completedProject.name}" project.`,
            recommendation: "Ensure all completion documents are uploaded and finalize the contract closure process.",
            link: { moduleId: 'documents', itemId: completedProject.id }
        });
    }
    return insights.sort((a, b) => {
        const order = { [InsightLevel.CRITICAL]: 0, [InsightLevel.WARNING]: 1, [InsightLevel.INFO]: 2, [InsightLevel.SUCCESS]: 3 };
        return order[a.level] - order[b.level];
    }).slice(0, 5); // Limit to 5 insights
};
