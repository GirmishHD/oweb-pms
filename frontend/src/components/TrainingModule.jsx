import React, { useState } from 'react';
import { Role } from '../types';
import { ICONS } from '../constants';
import jsPDF from 'jspdf';
const AccordionItem = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (<div className="border-b border-light-border">
            <h2>
                <button type="button" className="flex items-center justify-between w-full p-5 font-medium text-left text-text-dark hover:bg-light-main" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
                    <span>{title}</span>
                    <span className={`w-6 h-6 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        {ICONS.chevronDown}
                    </span>
                </button>
            </h2>
            <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="p-5 border-t border-light-border bg-light-main/50">
                        <div className="space-y-4 text-text-light leading-relaxed">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>);
};
const Tip = ({ children }) => (<div className="p-4 bg-warning-light border-l-4 border-warning text-yellow-800 rounded-r-lg">
        <p><strong className="font-semibold">Tip:</strong> {children}</p>
    </div>);
const Important = ({ children }) => (<div className="p-4 bg-danger-light border-l-4 border-danger text-red-800 rounded-r-lg">
        <p><strong className="font-semibold">Important:</strong> {children}</p>
    </div>);
const Step = ({ number, children }) => (<div className="flex items-start">
        <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white font-bold text-xs mr-3 mt-1">
            {number}
        </div>
        <div className="flex-1">{children}</div>
    </div>);
const TRAINING_CONTENT = {
    [Role.USER]: {
        title: "General User Guide",
        topics: [
            {
                title: "Dashboard",
                content: <>
                    <p>Your dashboard provides a personalized overview of your projects.</p>
                    <Step number={1}>View your key statistics in the cards at the top, such as Drafts, Submitted, and Approved projects.</Step>
                    <Step number={2}>The "My Projects" table lists all projects you have created. You can quickly see their status and budget.</Step>
                </>
            },
            {
                title: "Planning Module",
                content: <>
                    <p>This is where you create new project proposals.</p>
                    <Step number={1}>Fill in all required fields across the different sections, from basic information to financial details.</Step>
                    <Step number={2}>If you have Feasibility Study or EIA documents, check the corresponding box and attach the files.</Step>
                    <Step number={3}>Use the "Generate Summary with Gemini" button to create a professional summary of your project data. This helps reviewers understand your project quickly.</Step>
                    <Tip>You can edit the AI-generated summary before submitting if you need to make adjustments.</Tip>
                    <Step number={4}>Click "Save as Draft" to save your progress and return later, or "Submit for Review" to send it to the reviewers.</Step>
                    <Important>Once a project is submitted, you can no longer edit it unless a reviewer returns it to you.</Important>
                </>
            },
            {
                title: "Documents Module",
                content: <>
                    <p>Manage all documents related to projects.</p>
                    <Step number={1}>Select a project from the list on the left to see its associated documents.</Step>
                    <Step number={2}>Click "Upload Document" to add new files to the selected project. You must categorize each document.</Step>
                    <Step number={3}>You can download any document by clicking the "Download" link.</Step>
                </>
            }
        ]
    },
    [Role.REVIEWER]: {
        title: "Reviewer Guide",
        topics: [
            {
                title: "Dashboard",
                content: <>
                    <p>Your dashboard highlights projects that require your attention.</p>
                    <Step number={1}>The "Projects for Review" card shows the total number of submissions waiting for your action.</Step>
                    <Step number={2}>The main table on your dashboard lists all projects currently with a status of 'Submitted' or 'Under Review'.</Step>
                </>
            },
            {
                title: "Review Module",
                content: <>
                    <p>This module is your main workspace for evaluating project proposals.</p>
                    <Step number={1}>The table lists all projects waiting for review. Click the "Review" button on a project to open the details modal.</Step>
                    <Step number={2}>In the modal, carefully examine all project details, including the AI-generated summary and any attached documents.</Step>
                    <Step number={3}>You must provide a comment for any action you take. This is crucial for transparency and feedback to the user.</Step>
                    <Step number={4}>Click "Approve & Forward" to approve the project and send it to the Procurement department. Click "Reject" to reject the proposal.</Step>
                    <Important>Approvals and rejections are final. Ensure you have all the necessary information before making a decision.</Important>
                </>
            }
        ]
    },
    [Role.CONTRACT_MANAGER]: {
        title: "Contract Manager Guide",
        topics: [
            {
                title: "Dashboard",
                content: <>
                    <p>Your dashboard gives you a high-level overview of the contracts you manage.</p>
                    <Step number={1}>The cards at the top show your number of active and completed contracts.</Step>
                    <Step number={2}>The "My Managed Contracts" table lists all contracts assigned to you. Click on any row to jump directly to the Contract Management module for that specific contract.</Step>
                </>
            },
            {
                title: "Contract Management Module",
                content: <>
                    <p>This is the most detailed module, where you manage the entire lifecycle of a contract.</p>
                    <Step number={1}>To create a new contract, select an awarded procurement record from the dropdown. This links the contract to a project.</Step>
                    <Step number={2}>Fill out the Formation and Commencement phase details. This includes assigning personnel and recording key dates.</Step>
                    <Step number={3}>Define KPIs and Deliverables for the project. You can link deliverables to payments, which populates the Payments section.</Step>
                    <Step number={4}>Once the plan is set, click "Finalize Plan". This locks the initial schedule and allows you to start tracking implementation.</Step>
                    <Tip>While the contract is active (plan finalized but not yet complete), you can add Variations and Claims, and record actual payments against deliverables.</Tip>
                    <Step number={5}>Once all work is done and payments are settled, click "Mark as Complete" to close out the contract.</Step>
                    <Important>The system automatically calculates the total planned payments against the contract amount. Ensure this does not exceed the budget before finalizing.</Important>
                </>
            }
        ]
    },
    [Role.SUPERVISOR]: {
        title: "Field Supervisor & QA/QC Guide",
        topics: [
            {
                title: "Field QA/QC Inspections & Logbooks",
                content: <>
                    <p>Conduct and record site quality inspections, verify milestone delivery, and maintain standard logbooks.</p>
                    <Step number={1}>Navigate to "QA/QC & Field Logs" from the sidebar or dashboard.</Step>
                    <Step number={2}>Click "+ Log Field Inspection" to record site progress, workmanship quality rating, and civil works notes.</Step>
                    <Step number={3}>Record GPS coordinates or use the device auto-detect button to link the inspection to regional maps.</Step>
                    <Step number={4}>Upload site photos, test certificates, and inspector sign-off signatures.</Step>
                </>
            },
            {
                title: "Water Quality Testing & Defect Punch Lists",
                content: <>
                    <p>Verify that water schemes meet WHO and Ethiopian Compulsory Drinking Water Standards (CES 58).</p>
                    <Step number={1}>In the inspection modal, expand the "Water Quality Lab Verification" panel.</Step>
                    <Step number={2}>Record turbidity (NTU), pH, residual free chlorine (mg/L), and E. coli / Faecal Coliform counts (CFU/100ml).</Step>
                    <Step number={3}>Any non-conforming parameters automatically trigger a Defect Punch List item with corrective actions.</Step>
                    <Tip>Inspection logs are accessible in both the GIS Regional Map and Contract Administration modules.</Tip>
                </>
            },
            {
                title: "Weekly Work Plans & Progress Tracking",
                content: <>
                    <p>Formulate weekly site execution plans and submit weekly progress reports.</p>
                    <Step number={1}>Under "Weekly Tracking", formulate target physical progress percentages and planned manpower for the week.</Step>
                    <Step number={2}>Submit completed weekly progress reports with cumulative progress percentages.</Step>
                    <Step number={3}>Supervisors can review and approve weekly plans, updating project health indicators across the bureau.</Step>
                </>
            }
        ]
    },
    [Role.ENGINEER]: {
        title: "Project & Resident Engineer Guide",
        topics: [
            {
                title: "Site Supervision & Weekly Tracking",
                content: <>
                    <p>Resident engineers maintain continuous technical supervision over borehole drilling, spring capping, and distribution networks.</p>
                    <Step number={1}>Log daily and weekly site logs under "QA/QC & Field Logs".</Step>
                    <Step number={2}>Coordinate with contractor site agents on material testing and pipe pressure tests.</Step>
                    <Step number={3}>Submit weekly work plans ahead of site inspections.</Step>
                </>
            },
            {
                title: "Contract Administration & Variations",
                content: <>
                    <p>Review contractor deliverable submissions and measurement sheets.</p>
                    <Step number={1}>Assess contractor payment requests against verified deliverables in the Contract module.</Step>
                    <Step number={2}>Document site variations and claims promptly with detailed justifications.</Step>
                </>
            }
        ]
    },
    [Role.PROCUREMENT]: {
        title: "Procurement Officer Guide",
        topics: [
            {
                title: "Procurement Packages & Tender Formulation",
                content: <>
                    <p>Manage procurement packages once projects receive technical approval from the Review team.</p>
                    <Step number={1}>Navigate to "Procurement & Tenders" to view projects approved for bidding.</Step>
                    <Step number={2}>Create a procurement package, specifying procurement method (NCB, ICB, Request for Quotations, Community Procurement).</Step>
                    <Step number={3}>Define bid lots, packaging, and estimated budget ceilings.</Step>
                </>
            },
            {
                title: "Tender Evaluation & Bid Securities",
                content: <>
                    <p>Perform two-envelope technical and financial bid evaluations.</p>
                    <Step number={1}>Record submitted bidder preliminary compliance (trade licenses, tax clearance, VAT registration).</Step>
                    <Step number={2}>Score technical proposals against criteria (experience, key personnel, equipment methodology).</Step>
                    <Step number={3}>Track Bank Guarantees / CPO bid securities and receive automated alerts before expiry dates.</Step>
                    <Step number={4}>Determine lowest evaluated responsive bidder and generate award notification.</Step>
                </>
            }
        ]
    },
    [Role.COORDINATOR]: {
        title: "Program Coordinator & Director Guide",
        topics: [
            {
                title: "Multi-Program Portfolios & Allocation",
                content: <>
                    <p>Oversee multiple program funding streams including ONE WASH (OWNP), COWASH, CR-WASH, and Basket Funds.</p>
                    <Step number={1}>Navigate to "Programs & Portfolios" to review active programs, budgets, and beneficiary counts.</Step>
                    <Step number={2}>Monitor program components, funding sources, and multi-year lifecycle milestones.</Step>
                    <Step number={3}>Audit Earned Value Management (EVM) metrics including Cost Performance Index (CPI) and Schedule Performance Index (SPI).</Step>
                </>
            },
            {
                title: "NGO Implementing Partners & Agreements",
                content: <>
                    <p>Register and coordinate accredited NGO implementing partners across Oromia zones.</p>
                    <Step number={1}>Open "NGOs & Partners" to inspect registered NGOs, registration credentials, and MOUs.</Step>
                    <Step number={2}>Review active water schemes assigned to each NGO and track delivery performance ratings.</Step>
                    <Step number={3}>Export partner registry dossiers and generate cross-program coordination reports.</Step>
                </>
            },
            {
                title: "Staff Classifications & Program Rosters",
                content: <>
                    <p>Deploy and reassign engineers, hydrologists, and technicians across programs.</p>
                    <Step number={1}>Open "Staff Management" to review the bureau personnel directory.</Step>
                    <Step number={2}>Use the "Transfer Program" workflow to transition staff between programs with complete audit logs.</Step>
                    <Step number={3}>Filter personnel by job classification, duty station, and assigned schemes.</Step>
                </>
            }
        ]
    },
    [Role.DIRECTOR]: {
        title: "Bureau Director & Leadership Guide",
        topics: [
            {
                title: "Executive Strategic Governance",
                content: <>
                    <p>Leadership overview of regional water supply infrastructure delivery across Oromia.</p>
                    <Step number={1}>Monitor the Executive KPI banner for real-time portfolio budget utilization and schedule health.</Step>
                    <Step number={2}>Inspect critical cost overrun alerts (&gt;10% budget variance) in Performance &amp; Overruns.</Step>
                    <Step number={3}>Review regional corridor progress on the GIS Regional Asset Map.</Step>
                </>
            }
        ]
    },
    [Role.ADMIN]: {
        title: "Administrator Guide",
        topics: [
            {
                title: "Dashboard",
                content: <p>The Admin dashboard provides a complete overview of the entire system, including total projects, budgets, pending reviews, and active contracts.</p>
            },
            {
                title: "User Management & Permissions",
                content: <>
                    <p>As an Admin, you can manage all user accounts, roles, and fine-grained permissions.</p>
                    <Step number={1}>Click "+ Add User" to provision a new user, specify roles, jurisdiction zones, and assigned programs.</Step>
                    <Step number={2}>Manage Role Definitions and customize permission matrix overrides.</Step>
                    <Step number={3}>Simulate different roles using the "Simulate Role" feature to test view constraints.</Step>
                </>
            },
            {
                title: "Multi-Program Portfolios & Master Registry",
                content: <>
                    <p>Configure master data including administrative corridors, woredas, water sources, and program definitions.</p>
                    <Step number={1}>Manage registered programs, NGOs, and staff rosters with instant real-time synchronization.</Step>
                    <Step number={2}>Update organization units and regional hierarchies in Master Data & Registry.</Step>
                </>
            },
            {
                title: "Reporting & Full System Backup",
                content: <>
                <p>The reporting module gives you powerful tools to analyze system data and perform backups.</p>
                <Step number={1}>Use the "Project Reports" tab to filter projects by zone, woreda, status, or type.</Step>
                <Step number={2}>Export reports to Excel or PDF for offline distribution or donor reporting.</Step>
                <Step number={3}>Perform encrypted system backups and audit restore operations safely.</Step>
                </>
            },
            {
                title: "AI Water Assistant",
                content: <p>The AI Chat Assistant provides instant answers to complex queries regarding water quality lab test compliance, scheme counts under ONE WASH or COWASH, staff transfers, and contract milestone deadlines.</p>
            }
        ]
    }
};
// Add other guides to Admin so administrators can review any role manual
TRAINING_CONTENT[Role.ADMIN].topics.push(...TRAINING_CONTENT[Role.USER].topics.filter(t => t.title !== 'Dashboard'));
TRAINING_CONTENT[Role.ADMIN].topics.push(...TRAINING_CONTENT[Role.REVIEWER].topics.filter(t => t.title !== 'Dashboard'));
TRAINING_CONTENT[Role.ADMIN].topics.push(...TRAINING_CONTENT[Role.CONTRACT_MANAGER].topics.filter(t => t.title !== 'Dashboard'));
TRAINING_CONTENT[Role.ADMIN].topics.push(...TRAINING_CONTENT[Role.SUPERVISOR].topics.filter(t => t.title !== 'Dashboard'));
TRAINING_CONTENT[Role.ADMIN].topics.push(...TRAINING_CONTENT[Role.PROCUREMENT].topics.filter(t => t.title !== 'Dashboard'));
TRAINING_CONTENT[Role.ADMIN].topics.push(...TRAINING_CONTENT[Role.COORDINATOR].topics.filter(t => t.title !== 'Dashboard'));
// Helper function to recursively extract text from JSX for PDF generation
const extractTextFromJsx = (node) => {
    if (typeof node === 'string')
        return node;
    if (typeof node === 'number')
        return String(node);
    if (Array.isArray(node))
        return node.map(extractTextFromJsx).join('');
    if (React.isValidElement(node)) {
        const props = node.props;
        const childrenText = extractTextFromJsx(props.children);
        if (node.type === 'p')
            return `${childrenText}\n`;
        if (node.type === Step)
            return `\n• Step ${props.number}: ${childrenText}`;
        if (node.type === Tip)
            return `\n  Tip: ${childrenText}`;
        if (node.type === Important)
            return `\n  IMPORTANT: ${childrenText}`;
        if (props.children)
            return childrenText;
    }
    return '';
};
const TrainingModule = ({ user }) => {
    const userRole = user?.role || Role.USER;
    const [activeRoleGuide, setActiveRoleGuide] = useState(userRole);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const availableGuides = userRole === Role.ADMIN
        ? [Role.ADMIN, Role.USER, Role.SUPERVISOR, Role.ENGINEER, Role.PROCUREMENT, Role.CONTRACT_MANAGER, Role.REVIEWER, Role.COORDINATOR, Role.DIRECTOR]
        : [userRole];
    const currentGuide = TRAINING_CONTENT[activeRoleGuide] || TRAINING_CONTENT[Role.USER];
    const generatePdfManual = () => {
        setIsGeneratingPdf(true);
        // Use a timeout to allow the UI to update to the loading state before the blocking PDF work starts.
        setTimeout(() => {
            try {
                const doc = new jsPDF();
                let currentY = 20;
                const addPageIfNeeded = () => {
                    if (currentY > 270) {
                        doc.addPage();
                        currentY = 20;
                    }
                };
                // --- PDF Header ---
                doc.setFontSize(22);
                doc.setFont(undefined, 'bold');
                doc.text("OWEB PB-PMS User Manual", 105, currentY, { align: 'center' });
                currentY += 10;
                doc.setFontSize(12);
                doc.setFont(undefined, 'normal');
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, currentY, { align: 'center' });
                currentY += 15;
                // --- PDF Body ---
                Object.values(TRAINING_CONTENT).forEach((guide) => {
                    if (!guide)
                        return;
                    addPageIfNeeded();
                    doc.addPage();
                    currentY = 20;
                    doc.setFontSize(18);
                    doc.setFont(undefined, 'bold');
                    doc.text(guide.title, 14, currentY);
                    currentY += 10;
                    doc.setDrawColor(226, 232, 240); // light-border color
                    doc.line(14, currentY - 4, 196, currentY - 4);
                    guide.topics.forEach(topic => {
                        addPageIfNeeded();
                        doc.setFontSize(14);
                        doc.setFont(undefined, 'bold');
                        doc.text(topic.title, 14, currentY);
                        currentY += 8;
                        doc.setFontSize(10);
                        doc.setFont(undefined, 'normal');
                        const rawText = extractTextFromJsx(topic.content);
                        const textLines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
                        textLines.forEach(line => {
                            const splitLines = doc.splitTextToSize(line, 180); // 180mm width
                            const requiredHeight = splitLines.length * 5;
                            if (currentY + requiredHeight > 280) {
                                doc.addPage();
                                currentY = 20;
                            }
                            doc.text(splitLines, 14, currentY);
                            currentY += requiredHeight;
                        });
                        currentY += 10; // Space after each topic
                    });
                });
                doc.save(`OWEB_User_Manual_${new Date().toISOString().split('T')[0]}.pdf`);
            }
            catch (error) {
                console.error("Failed to generate PDF manual:", error);
                alert("An error occurred while generating the PDF. Please check the console for details.");
            }
            finally {
                setIsGeneratingPdf(false);
            }
        }, 50);
    };
    return (<div className="bg-white rounded-2xl border border-light-border shadow-sm">
            <div className="p-6 border-b border-light-border flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-text-dark">OWEB PB-PMS Training Center</h2>
                    <p className="text-text-light mt-1">Welcome, {user.username}! Select a topic below to learn more about the system.</p>
                </div>
                <button onClick={generatePdfManual} disabled={isGeneratingPdf} className="px-4 py-2 bg-primary-light text-primary font-medium rounded-lg hover:bg-primary/20 shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait">
                    {isGeneratingPdf ? (<>
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span>Generating...</span>
                        </>) : (<>
                            {React.cloneElement(ICONS.documents, { className: "w-5 h-5" })}
                            <span>Download User Manual (PDF)</span>
                        </>)}
                </button>
            </div>
            
             {userRole === Role.ADMIN && (<div className="p-4 border-b border-light-border">
                    <label className="text-sm font-semibold mr-4">View Guide For:</label>
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        {availableGuides.map(role => (<button key={role} type="button" onClick={() => setActiveRoleGuide(role)} className={`px-4 py-2 text-sm font-medium border border-light-border transition-colors
                                    ${activeRoleGuide === role ? 'bg-primary text-white z-10' : 'bg-white text-text-dark hover:bg-light-main'}
                                    ${role === availableGuides[0] ? 'rounded-l-lg' : ''}
                                    ${role === availableGuides[availableGuides.length - 1] ? 'rounded-r-lg' : ''}
                                `}>
                                {role}
                            </button>))}
                    </div>
                </div>)}

            <div className="divide-y divide-light-border">
                {currentGuide ? (currentGuide.topics.map((topic, index) => (<AccordionItem key={topic.title} title={topic.title} defaultOpen={index === 0}>
                            {topic.content}
                        </AccordionItem>))) : (<div className="p-8 text-center text-text-light">
                        <p>No training materials are available for your role ({userRole}) at this time.</p>
                    </div>)}
            </div>
        </div>);
};
export default TrainingModule;
