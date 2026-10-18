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
Navigation instructions: Whenever relevant, append an action token like [ACTION:{"type":"navigate","moduleId":"<module>","itemId":"<optional_id>"}] where moduleId is one of: 'dashboard', 'ngos', 'staff', 'planning', 'gisMap', 'review', 'procurement', 'contract', 'performance', 'documents', 'reporting', 'usermanagement', 'masterdata'.
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
        const action = { type: 'navigate', moduleId: 'dashboard' };
        // Count schemes per program
        const programSummaries = programs.map(prog => {
            const progProjects = projects.filter(p => p.program === prog.name || p.program === prog.code);
            const totalBudget = progProjects.reduce((s, p) => s + (p.estimatedBudget || 0), 0);
            return `• ${prog.name} (${prog.code}): ${progProjects.length} schemes | Investment: ${(totalBudget / 1e6).toFixed(1)}M ETB (Status: ${prog.status})`;
        });
        return `Multi-Program Portfolios & Status:\n\n` +
            `• Registered Programs: ${programs.length} active funding frameworks\n` +
            `• Governance: Regional scheme breakdown active\n\n` +
            `Program Breakdown:\n` +
            programSummaries.join('\n') +
            `\n\nView Program Schemes on Dashboard [ACTION:${JSON.stringify(action)}].`;
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
        const action = { type: 'navigate', moduleId: 'performance' };
        return `Weekly Work Plans & Site Execution Tracking:\n\n` +
            `• Active Work Plans: ${totalPlans} (${approvedPlans} approved by supervisors)\n` +
            `• Tracked Field Activities: ${activeActivities} work package tasks across assigned schemes\n` +
            `• Features Available: Weekly activity breakdown, daily workforce & equipment logs, cumulative S-Curve planned vs actual progress tracking, and supervisor approval workflows.\n\n` +
            `Access the Site Performance & S-Curve dashboard [ACTION:${JSON.stringify(action)}].`;
    }
    // 3. Performance & Quality Analytics
    if (lower.includes('inspection') || lower.includes('defect') || lower.includes('punch list') || lower.includes('qa/qc') || lower.includes('quality')) {
        const totalInspections = inspections.length;
        const totalDefects = inspections.reduce((sum, i) => sum + ((i.defects || []).filter((d) => d.status === 'Open').length), 0);
        const action = { type: 'navigate', moduleId: 'reporting' };
        return `Quality Assurance & Variance Analytics:\n\n` +
            `• Total Field Records: ${totalInspections} logged\n` +
            `• Open Defects: ${totalDefects} requiring contractor rectification\n\n` +
            `Open the Executive Reports & Analytics [ACTION:${JSON.stringify(action)}].`;
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
    try {
        if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_GEMINI_API_KEY) {
            return import.meta.env.VITE_GEMINI_API_KEY;
        }
        if (typeof process !== 'undefined' && process?.env) {
            return process.env.GEMINI_API_KEY || process.env.API_KEY || '';
        }
    } catch {
        // Fall back gracefully
    }
    return '';
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
export const evaluateSchemeFeasibilityAndRisks = async (project) => {
    const apiKey = getApiKey();
    const budget = Number(project.estimatedBudget) || 0;
    const population = Number(project.populationCoverage) || 0;
    const livestock = Number(project.livestockUnits || project.livestock_units) || 0;
    const costPerCapita = population > 0 ? Math.round(budget / population) : 0;
    
    // Baseline Rule-Based Intelligence
    const redFlags = [];
    const engineeringDirectives = [];
    let hydrogeologicalRisk = 'Low';
    let climateResilienceScore = 75; // 0 - 100
    
    // 1. Cost per capita benchmarking
    let costBenchmarkRating = 'Optimal (Standard)';
    if (costPerCapita > 0 && costPerCapita < 3500) {
        costBenchmarkRating = 'Highly Cost-Effective (< 3,500 ETB/capita)';
    } else if (costPerCapita >= 3500 && costPerCapita <= 6500) {
        costBenchmarkRating = 'Standard Regional Benchmark (3,500 - 6,500 ETB/capita)';
    } else if (costPerCapita > 6500 && costPerCapita <= 12000) {
        costBenchmarkRating = 'High Investment Index (6,500 - 12,000 ETB/capita)';
        redFlags.push(`High unit cost of ${costPerCapita.toLocaleString()} ETB/capita exceeds standard rural benchmarks. Justification required.`);
        engineeringDirectives.push("Re-verify Bill of Quantities (BoQ) pipeline unit prices and explore alternative clustering with adjacent kebeles.");
    } else if (costPerCapita > 12000) {
        costBenchmarkRating = 'Outlier / Extreme (> 12,000 ETB/capita)';
        redFlags.push(`Extreme capital expenditure (${costPerCapita.toLocaleString()} ETB/capita). Requires Bureau Planning Directorate scrutiny.`);
    }

    // 2. Hydrogeological & Source profiling
    const source = (project.sourceOfWater || '').toLowerCase();
    const zone = (project.zone || '').toLowerCase();
    const isRiftValley = zone.includes('east shewa') || zone.includes('arsi') || zone.includes('west arsi') || zone.includes('adama');
    const isPastoral = zone.includes('borena') || zone.includes('guji') || zone.includes('west guji') || zone.includes('bale') || zone.includes('dollo');

    if (source.includes('borehole') || source.includes('deep well')) {
        if (isRiftValley) {
            hydrogeologicalRisk = 'Medium-High (Rift Valley Fluoride/Thermal Zone)';
            redFlags.push("Rift Valley volcanic aquifer detected: High probability of elevated fluoride (>1.5 mg/L) and thermal groundwater.");
            engineeringDirectives.push("Mandate comprehensive hydrochemical laboratory testing for Fluoride, TDS, and Arsenic before casing installation.");
        } else {
            hydrogeologicalRisk = 'Moderate (Deep Aquifer)';
        }
        climateResilienceScore += 15;
    } else if (source.includes('spring')) {
        if (project.sourceReliability?.toLowerCase().includes('seasonal') || project.sourceReliability?.toLowerCase().includes('vulnerable')) {
            hydrogeologicalRisk = 'High (Seasonal Discharge Variability)';
            redFlags.push("Selected spring source has reported seasonal discharge fluctuations; discharge may drop significantly in dry season (Bona).");
            engineeringDirectives.push("Execute minimum 72-hour continuous discharge gauging during dry season (January–March) to determine reliable baseflow.");
            climateResilienceScore -= 20;
        } else {
            hydrogeologicalRisk = 'Low (Protected Perennial Spring)';
            climateResilienceScore += 5;
        }
    } else if (source.includes('river') || source.includes('surface')) {
        hydrogeologicalRisk = 'High (Turbidity & Surface Runoff Contamination)';
        redFlags.push("Surface water intake subject to seasonal high turbidity (>50 NTU) and upstream catchment microbial contamination.");
        engineeringDirectives.push("Include multi-stage coagulation, rapid sand filtration, and continuous chlorination dosing chambers.");
        climateResilienceScore -= 10;
    }

    // 3. Pastoralist Water Demands (Livestock)
    if (isPastoral) {
        if (livestock === 0) {
            redFlags.push("Pastoralist corridor scheme lacks documented livestock watering provision (cattle trough / birka).");
            engineeringDirectives.push("Incorporate dual-trough livestock watering points with separate apron drainage away from domestic collection chambers.");
        } else {
            climateResilienceScore += 10;
        }
    }

    // 4. Power & Pumping Sustainability
    const energy = (project.energySource || '').toLowerCase();
    if (energy.includes('solar')) {
        climateResilienceScore += 15;
        if (!project.powerSourceAvailable) {
            engineeringDirectives.push("Verify site solar irradiance and ensure perimeter fencing to prevent solar PV panel theft.");
        }
    } else if (energy.includes('diesel') && !energy.includes('solar')) {
        redFlags.push("Diesel generator without solar hybrid faces high operational recurrent fuel expense and supply disruptions in remote woredas.");
        engineeringDirectives.push("Propose solar-diesel hybrid retrofitting to reduce community monthly operating tariffs by up to 70%.");
        climateResilienceScore -= 15;
    }

    // 5. Governance & Gender Parity (ESMF/WASHCO)
    const washcoDetails = (project.washcoDetails || '').toLowerCase();
    if (!project.washcoExists) {
        redFlags.push("No community WASHCO formed: Risk to local scheme ownership and revenue collection post-handover.");
        engineeringDirectives.push("Deploy Woreda Community Engagement facilitators to establish legally registered WASHCO before contract award.");
    }

    if (!project.landOwnershipCleared) {
        redFlags.push("Land acquisition or Right-of-Way (RoW) not finalized: Risk of site access disputes with local landholders.");
    }

    climateResilienceScore = Math.max(10, Math.min(100, climateResilienceScore));

    // Try Gemini for executive justification narrative and deep synthesis
    let aiNarrative = '';
    let aiRiskLevel = hydrogeologicalRisk.includes('High') || redFlags.length >= 3 ? 'High' : (redFlags.length > 0 ? 'Medium' : 'Low');

    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are the Lead Water Infrastructure Planning Specialist for Oromia Water Bureau (OWEB).
Synthesize the following project parameters into:
1. Overall Risk Level ('Low', 'Medium', or 'High')
2. Key Identified Vulnerabilities (3-4 concise points)
3. Mitigation Strategies (3-4 technical actionable points)
4. Donor Justification Narrative (1 formal paragraph suitable for World Bank, AfDB, UNICEF, or Government appraisal dossiers)

Scheme Parameters:
- Name: ${project.name || 'OWEB Water Scheme'} (${project.zone || 'Oromia'} Zone, ${project.woreda || 'Woreda'})
- Program: ${project.program || 'ONE WASH'} (Component: ${project.programComponent || 'Rural Water'})
- Classification: ${project.projectType || 'Water Supply'} - ${project.projectSubType || 'Borehole Scheme'}
- Water Source: ${project.sourceOfWater || 'Deep Borehole'} (Pumping: ${project.energySource || 'Solar PV'})
- Beneficiaries: ${population.toLocaleString()} people, ${livestock.toLocaleString()} livestock units
- Total Budget: ${budget.toLocaleString()} ETB (Cost/Capita: ${costPerCapita} ETB)
- Sizing: ${project.dailyDemandEstimate || 0} L/day, Reservoir: ${project.storageRequirement || 0} m³, Pipeline: ${project.pipeLengthEstimation || 0} km
- Environmental & Social: EIA Conducted: ${project.eiaConducted ? 'Yes' : 'No'}, Land Cleared: ${project.landOwnershipCleared ? 'Yes' : 'No'}, WASHCO: ${project.washcoExists ? 'Formed' : 'Pending'}`;

            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: 'OBJECT',
                        properties: {
                            level: { type: 'STRING' },
                            keyRisks: { type: 'ARRAY', items: { type: 'STRING' } },
                            mitigationStrategies: { type: 'ARRAY', items: { type: 'STRING' } },
                            donorJustification: { type: 'STRING' }
                        }
                    }
                }
            });

            if (res && res.text) {
                const parsed = JSON.parse(res.text);
                return {
                    level: parsed.level || aiRiskLevel,
                    keyRisks: Array.isArray(parsed.keyRisks) && parsed.keyRisks.length > 0 ? parsed.keyRisks : redFlags,
                    mitigationStrategies: Array.isArray(parsed.mitigationStrategies) && parsed.mitigationStrategies.length > 0 ? parsed.mitigationStrategies : engineeringDirectives,
                    donorJustification: parsed.donorJustification || '',
                    costPerCapita,
                    costBenchmarkRating,
                    climateResilienceScore,
                    hydrogeologicalRisk,
                    redFlags
                };
            }
        } catch (err) {
            console.warn("Gemini evaluation error, using rule-based assessment:", err);
        }
    }

    // Algorithmic Fallback Justification Narrative
    const donorJustification = `The proposed "${project.name || 'Water Supply Scheme'}" represents an essential public health and climate-resilience intervention in ${project.woreda || 'the target'} Woreda, ${project.zone || 'Oromia'} Zone under the ${project.program || 'OWEB Regional Water Initiative'}. By tapping into a ${project.sourceOfWater || 'sustainable water source'} powered via ${project.energySource || 'renewable solar energy'}, the scheme directly addresses severe potable water deficits for ${population.toLocaleString()} residents${livestock > 0 ? ` and ${livestock.toLocaleString()} livestock units` : ''}. At an investment ratio of ${costPerCapita.toLocaleString()} ETB per capita, the formulation adheres to regional economic benchmarks while ensuring durable community ownership through formalized WASHCO governance and environmental mitigation safeguards.`;

    return {
        level: aiRiskLevel,
        keyRisks: redFlags.length > 0 ? redFlags : ["Routine operational monitoring required", "Spare parts supply chain dependent on woreda market access"],
        mitigationStrategies: engineeringDirectives.length > 0 ? engineeringDirectives : ["Standard bureau supervisory inspections and milestone certification before payments"],
        donorJustification,
        costPerCapita,
        costBenchmarkRating,
        climateResilienceScore,
        hydrogeologicalRisk,
        redFlags
    };
};

export const performAiTechnicalAudit = async (project) => {
    const pop = Number(project.populationCoverage) || 0;
    const budget = Number(project.estimatedBudget) || 0;
    const pipeKm = Number(project.pipeLengthEstimation) || 0;
    const storageM3 = Number(project.storageRequirement) || 0;
    const dailyDemandM3 = Number(project.dailyDemandEstimate) 
        ? (Number(project.dailyDemandEstimate) > 1000 ? Math.round(Number(project.dailyDemandEstimate) / 1000) : Number(project.dailyDemandEstimate))
        : Math.round(pop * 0.025);
    const head = Number(project.totalDynamicHead) || 120;
    const yieldLps = Number(project.pumpDischargeYield) || 8.0;
    const fluoride = Number(project.waterQualityFluoride) || 0.8;
    const zone = (project.zone || '').toLowerCase();
    const source = (project.sourceOfWater || '').toLowerCase();
    const energy = (project.energySource || '').toLowerCase();
    const costPerCapita = pop > 0 ? Math.round(budget / pop) : 0;

    // Detect Design Flaws & calculate required pump power
    const designFlaws = [];
    const engineeringDirectives = [];
    const requiredPumpKw = Math.round((yieldLps * head * 9.81 / (1000 * 0.65)) * 10) / 10;
    const recommendedSolarKwp = Math.round((requiredPumpKw * 1.35) * 10) / 10;

    // 1. Solar PV array vs. Pump kW sizing
    if (energy.includes('solar')) {
        if (head > 220 && yieldLps > 15) {
            designFlaws.push(`Extreme Solar Pumping Duty: Total Dynamic Head (${head}m) and high yield (${yieldLps} L/s) requires ~${requiredPumpKw} kW pump, demanding an oversized Solar PV array (> ${recommendedSolarKwp} kWp) susceptible to cloudy-day yield failure.`);
            engineeringDirectives.push(`Adopt hybrid configuration: Solar PV primary during peak sun hours (09:00-15:00) with diesel genset or grid backup for deep pumping head (${head}m).`);
        } else {
            engineeringDirectives.push(`Solar PV Array Benchmark: Ensure minimum ${recommendedSolarKwp} kWp PV capacity with MPPT VFD controller rated for ${requiredPumpKw} kW submersible motor.`);
        }
    }

    // 2. Pipe lengths causing high friction loss without booster stations
    if (pipeKm > 5.0) {
        designFlaws.push(`Long Transmission Pipeline (${pipeKm} km): High cumulative hydraulic friction loss risk without intermediate Break Pressure Tanks (BPTs) or booster stations.`);
        engineeringDirectives.push(`Verify hydraulic profile with EPANET: Install air release valves at high peaks, washout valves at low valleys, and minimum ${Math.max(1, Math.ceil(pipeKm / 3))} Break Pressure Tanks (BPTs).`);
    }

    // 3. High fluoride levels without planned de-fluoridation or blending
    const isRiftValley = zone.includes('east shewa') || zone.includes('arsi') || zone.includes('west arsi') || zone.includes('adama');
    if (fluoride > 1.5 || (isRiftValley && (source.includes('deep') || source.includes('borehole')))) {
        designFlaws.push(`Elevated Fluoride (${fluoride} mg/L): Exceeds WHO and Ethiopian Potability Standard (1.5 mg/L). Risk of dental and skeletal fluorosis.`);
        engineeringDirectives.push(`Integrate activated alumina / bone-char de-fluoridation filters or safe blending with adjacent low-fluoride spring source before reservoir storage.`);
    }

    // 4. Storage reservoir sizing vs. daily demand
    const requiredStorageM3 = Math.round(dailyDemandM3 * 0.35);
    if (storageM3 > 0 && dailyDemandM3 > 0 && storageM3 < dailyDemandM3 * 0.25) {
        designFlaws.push(`Undersized Reservoir (${storageM3} m³): Fails to provide minimum 30-40% balancing capacity (${requiredStorageM3} m³) for peak morning/evening collection hours.`);
        engineeringDirectives.push(`Upsize masonry/R.C. elevated storage reservoir capacity from ${storageM3} m³ to minimum ${requiredStorageM3} m³.`);
    }

    // 5. Cost Per Capita benchmarking
    if (costPerCapita > 8500) {
        designFlaws.push(`Elevated Unit Cost (${costPerCapita.toLocaleString()} ETB/capita): Significantly exceeds rural water standard norm (3,500 - 6,500 ETB/capita).`);
        engineeringDirectives.push(`Audit BoQ pipe network distribution lines and negotiate contractor unit rates to align with current OWEB schedule of rates.`);
    }

    // Suggested Pillar Scores
    let hydroScore = 18;
    let engScore = 18;
    let eiaScore = 18;
    let washcoScore = 17;
    let econScore = 17;

    if (designFlaws.some(f => f.includes('Fluoride') || f.includes('Solar Pumping'))) engScore -= 3;
    if (designFlaws.some(f => f.includes('Transmission Pipeline') || f.includes('Reservoir'))) engScore -= 3;
    if (fluoride > 1.5 || !project.eiaConducted) eiaScore -= 4;
    if (!project.washcoExists || !project.landOwnershipCleared) washcoScore -= 5;
    if (costPerCapita > 8500) econScore -= 4;

    const suggestedTotalScore = Math.max(40, hydroScore + engScore + eiaScore + washcoScore + econScore);

    // Auto-draft executive appraisal remarks for the Director
    const executiveRemarksDraft = `TECHNICAL APPRAISAL COMMITTEE ENDORSEMENT RECOMMENDATION:
The OWEB Technical Review Directorate has scrutinized the engineering, hydrogeological, and ESMF documents for "${project.name || 'Proposed Scheme'}" (${project.zone} Zone, ${project.woreda} Woreda). 
The proposed scheme targets ${pop.toLocaleString()} beneficiaries with a total capital budget of ${budget.toLocaleString()} ETB (${costPerCapita.toLocaleString()} ETB/capita).
Overall Technical Appraisal Score: ${suggestedTotalScore}/100 (${suggestedTotalScore >= 80 ? 'Grade A - Recommended for Procurement' : suggestedTotalScore >= 60 ? 'Grade B - Conditional Approval with Mandatory Revisions' : 'Grade C - Infeasible'}).
Key Engineering Observations: ${designFlaws.length > 0 ? designFlaws.join(' ') : 'Engineering sizing, hydraulic parameters, and ESMF mitigation plans conform to OWEB standards.'}
Directive for Procurement: ${suggestedTotalScore >= 80 ? 'Clear scheme for immediate National Competitive Bidding (NCB) works tendering.' : 'Require the zonal planning team to submit revised hydraulic calculations before tender package issuance.'}`;

    // Try Gemini if available
    const apiKey = getApiKey();
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are the Chief Technical Appraiser at Oromia Water Bureau (OWEB).
Perform a comprehensive engineering and feasibility audit on the following water scheme:
Project: ${project.name} (${project.zone} Zone, ${project.woreda} Woreda)
Budget: ${budget} ETB, Beneficiaries: ${pop}, Cost/Capita: ${costPerCapita} ETB
Source: ${project.sourceOfWater}, Pumping: ${project.energySource}, Head: ${head}m, Yield: ${yieldLps} L/s
Pipe Length: ${pipeKm} km, Reservoir: ${storageM3} m3, Fluoride: ${fluoride} mg/L
EIA Conducted: ${project.eiaConducted}, WASHCO: ${project.washcoExists}, Land Cleared: ${project.landOwnershipCleared}

Provide:
1. designFlaws: List 3-4 specific engineering design flaws or risks (such as solar sizing vs head, pipe friction loss, fluoride, storage ratio, cost per capita).
2. executiveRemarksDraft: Formal appraisal remarks paragraph for the Bureau Director.
3. suggestedScores: Object with hydrology (0-20), engineering (0-20), eia (0-20), washco (0-20), economics (0-20).`;

            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: 'OBJECT',
                        properties: {
                            designFlaws: { type: 'ARRAY', items: { type: 'STRING' } },
                            engineeringDirectives: { type: 'ARRAY', items: { type: 'STRING' } },
                            executiveRemarksDraft: { type: 'STRING' },
                            suggestedScores: {
                                type: 'OBJECT',
                                properties: {
                                    hydrology: { type: 'NUMBER' },
                                    engineering: { type: 'NUMBER' },
                                    eia: { type: 'NUMBER' },
                                    washco: { type: 'NUMBER' },
                                    economics: { type: 'NUMBER' }
                                }
                            }
                        }
                    }
                }
            });

            if (res && res.text) {
                const parsed = JSON.parse(res.text);
                return {
                    designFlaws: parsed.designFlaws?.length > 0 ? parsed.designFlaws : designFlaws,
                    engineeringDirectives: parsed.engineeringDirectives?.length > 0 ? parsed.engineeringDirectives : engineeringDirectives,
                    executiveRemarksDraft: parsed.executiveRemarksDraft || executiveRemarksDraft,
                    suggestedScores: parsed.suggestedScores || {
                        hydrology: hydroScore,
                        engineering: engScore,
                        eia: eiaScore,
                        washco: washcoScore,
                        economics: econScore
                    },
                    requiredPumpKw,
                    recommendedSolarKwp,
                    costPerCapita
                };
            }
        } catch (err) {
            console.warn('Gemini technical audit API error, using algorithmic audit:', err);
        }
    }

    return {
        designFlaws: designFlaws.length > 0 ? designFlaws : ["No critical engineering design flaws detected. Standard construction supervision required."],
        engineeringDirectives: engineeringDirectives.length > 0 ? engineeringDirectives : ["Proceed with standard technical specifications in NCB bidding documents."],
        executiveRemarksDraft,
        suggestedScores: {
            hydrology: hydroScore,
            engineering: engScore,
            eia: eiaScore,
            washco: washcoScore,
            economics: econScore
        },
        requiredPumpKw,
        recommendedSolarKwp,
        costPerCapita
    };
};

export const generateRiskAssessment = async (project) => {
    return await evaluateSchemeFeasibilityAndRisks(project);
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
