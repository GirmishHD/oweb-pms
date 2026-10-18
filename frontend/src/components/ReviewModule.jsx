import React, { useState, useMemo } from 'react';
import { ProjectStatus, DocumentCategory, Role } from '../types';
import { ICONS, ZONES, PROJECT_TYPES } from '../constants';
import { generateRiskAssessment, performAiTechnicalAudit } from '../services/geminiService';

// Default sub-criteria scores (all 5 pillars sum to 86/100 initially)
const INITIAL_SUB_SCORES = {
    // 1. Hydrogeology & Water Resource (20 pts max)
    hydro_yield: 6,       // Aquifer yield test validation (m3/hr vs planned demand) [0-7]
    hydro_drawdown: 6,    // Drawdown, recovery rate, static & dynamic water levels [0-7]
    hydro_recharge: 5,    // Seasonal recharge reliability & climate-drought resilience [0-6]

    // 2. Engineering & Infrastructure Design (20 pts max)
    eng_pumping: 6,       // Pumping head (TDH), solar PV array sizing vs depth [0-7]
    eng_reservoir: 6,     // Reservoir structural design, storage capacity sizing vs peak hours [0-7]
    eng_hydraulic: 5,     // Hydraulic pressure gradients & pipe diameter optimization [0-6]

    // 3. Environmental & Water Quality Safeguards (20 pts max)
    eia_water_quality: 6, // Lab water quality check (Fluoride, Salinity/EC, Turbidity, E. coli) [0-7]
    eia_mitigation: 6,    // EIA/ESMF mitigation plan & catchment protection zoning [0-7]
    eia_sanitation: 5,    // Waste management at public taps & cattle trough run-off containment [0-6]

    // 4. WASHCO & Community Institutional Readiness (20 pts max)
    washco_legal: 6,      // Legal registration of WASHCO & tariff collection structure [0-7]
    washco_gender: 6,     // Female representation in decision-making & operator readiness [0-7]
    washco_land: 5,       // Land clearance and right-of-way agreements with Kebele administration [0-6]

    // 5. Economic Feasibility & Cost Norms (20 pts max)
    econ_per_capita: 6,   // Cost per capita vs regional benchmarks (ETB/capita) [0-7]
    econ_contribution: 6, // Community contribution verification (cash and in-kind labor/material) [0-7]
    econ_recovery: 5,     // O&M cost recovery and life-cycle financial viability [0-6]
};

// Formal Bureau Appraisal Certificate Modal (OWEB Form APP-01)
export const ApprovalCertificateModal = ({ project, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    const certNumber = project?.approvalCertificateNo || `OWEB-APP-${new Date().getFullYear()}-${String(project?.id || '0001').slice(-4)}`;
    const approvalDate = project?.reviewDate ? new Date(project.reviewDate).toLocaleDateString() : new Date().toLocaleDateString();
    const score = Number(project?.reviewScore) || 86;

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in print:p-0 print:bg-white">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-sky-200 print:shadow-none print:border-none print:max-h-none print:w-full">
                {/* Modal Header */}
                <div className="p-4 bg-gradient-to-r from-ocean-900 via-ocean-800 to-sky-900 text-white flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white/10 rounded-xl">
                            {React.cloneElement(ICONS.checkCircle, { className: 'w-5 h-5 text-cyan-300' })}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold tracking-tight">Official Bureau Technical Appraisal Certificate</h3>
                            <p className="text-[11px] text-cyan-200">National Water Sector Standard Form • OWEB Form APP-01</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print Certificate
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-sky-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Certificate Paper Layout */}
                <div className="p-8 overflow-y-auto bg-slate-50 flex-1 space-y-6 print:p-4 print:bg-white">
                    <div className="bg-white p-8 rounded-xl border-2 border-sky-300 shadow-md relative overflow-hidden print:border-none print:shadow-none print:p-2">
                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none select-none">
                            <span className="text-8xl font-black text-ocean-900 tracking-widest uppercase rotate-[-20deg]">OWEB APPROVED</span>
                        </div>

                        {/* Certificate Header with Crest */}
                        <div className="text-center pb-6 border-b-2 border-sky-900/20 space-y-1">
                            <p className="text-xs font-bold text-ocean-700 tracking-widest uppercase">National Regional State of Oromia</p>
                            <h2 className="text-lg font-black text-ocean-950 uppercase tracking-wide">Oromia Water Resource Bureau (OWEB)</h2>
                            <p className="text-xs font-semibold text-slate-600">Planning, Project Appraisal &amp; Quality Directorate</p>
                            <div className="inline-block mt-2 px-3 py-1 bg-emerald-50 border border-emerald-300 rounded-full text-emerald-800 text-xs font-extrabold tracking-wider uppercase">
                                Certificate of Technical Approval &amp; Procurement Endorsement
                            </div>
                        </div>

                        {/* Certificate Meta */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 text-xs border-b border-slate-200">
                            <div>
                                <span className="text-slate-500 font-semibold block uppercase text-[10px]">Certificate Ref No.</span>
                                <span className="font-mono font-bold text-ocean-900">{certNumber}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 font-semibold block uppercase text-[10px]">Date of Endorsement</span>
                                <span className="font-bold text-slate-800">{approvalDate}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 font-semibold block uppercase text-[10px]">Appraisal Score</span>
                                <span className="font-extrabold text-emerald-700">
                                    {score} / 100 ({score >= 80 ? 'Grade A - Fully Responsive' : score >= 60 ? 'Grade B - Conditional' : 'Grade C - Sub-standard'})
                                </span>
                            </div>
                        </div>

                        {/* Project Dossier Particulars */}
                        <div className="py-4 space-y-3">
                            <h4 className="text-xs font-extrabold uppercase text-ocean-900 tracking-wider">1. Project Particulars</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-sky-50/70 rounded-xl border border-sky-100 text-xs">
                                <div>
                                    <span className="text-slate-500 text-[11px] block">Project Name:</span>
                                    <span className="font-bold text-slate-900">{project?.name}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-[11px] block">Project ID:</span>
                                    <span className="font-mono font-bold text-slate-800">{project?.id}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-[11px] block">Location:</span>
                                    <span className="font-bold text-slate-800">{project?.zone} Zone, {project?.woreda} Woreda</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-[11px] block">Intervention Category:</span>
                                    <span className="font-bold text-slate-800">{project?.projectType} • {project?.projectSubType || 'Scheme'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-[11px] block">Approved Budget (ETB):</span>
                                    <span className="font-extrabold text-emerald-800">
                                        {Number(project?.estimatedBudget || 0).toLocaleString()} ETB
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-[11px] block">Target Beneficiaries:</span>
                                    <span className="font-bold text-slate-800">
                                        {Number(project?.populationCoverage || 0).toLocaleString()} Persons
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Technical Verification Statement */}
                        <div className="py-2 space-y-2 text-xs text-slate-700 leading-relaxed">
                            <h4 className="text-xs font-extrabold uppercase text-ocean-900 tracking-wider">2. Technical Appraisal Finding &amp; Endorsement</h4>
                            <p>
                                This is to officially certify that the engineering drawings, hydraulic profile, water yield investigation, Environmental &amp; Social Impact Assessment (EIA), and community WASHCO governance structures for <strong>{project?.name}</strong> have undergone rigorous multi-criteria appraisal by the OWEB Technical Review Committee and meet all regional and national standard specifications.
                            </p>
                            {project?.reviewComments && (
                                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 text-xs">
                                    <span className="font-bold">Reviewer Endorsement Notes: </span>
                                    {project.reviewComments}
                                </div>
                            )}
                        </div>

                        {/* Signatures & Seal Block */}
                        <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-center border-t border-slate-200 mt-6">
                            <div className="space-y-1">
                                <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center font-serif text-slate-800 italic">
                                    {project?.reviewedBy || 'Lead Technical Reviewer'}
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 block">Lead Appraisal Engineer</span>
                                <span className="text-[10px] text-slate-400">OWEB Technical Scrutiny Team</span>
                            </div>
                            <div className="space-y-1">
                                <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center font-serif text-slate-800 italic">
                                    Eng. Director
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 block">Director, Project Planning</span>
                                <span className="text-[10px] text-slate-400">OWEB Planning Directorate</span>
                            </div>
                            <div className="space-y-1">
                                <div className="h-10 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full border-2 border-emerald-600 flex items-center justify-center text-[9px] font-bold text-emerald-700 rotate-[-12deg] uppercase">
                                        OWEB Seal
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 block">Official Bureau Seal</span>
                                <span className="text-[10px] text-slate-400">Authorized Registration</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Comprehensive Technical Review & Appraisal Modal
export const ProjectReviewModal = ({
    project,
    documents = [],
    onClose,
    onUpdateProject,
    currentUser,
    onNavigate,
    onAddProcurement
}) => {
    const [activeTab, setActiveTab] = useState('dossier');
    const [comments, setComments] = useState(project?.reviewComments || '');
    const [subScores, setSubScores] = useState(INITIAL_SUB_SCORES);
    const [isAuditingAI, setIsAuditingAI] = useState(false);
    const [aiAuditResult, setAiAuditResult] = useState(null);
    const [revisionRequirements, setRevisionRequirements] = useState(
        project?.revisionPoints && project.revisionPoints.length > 0
            ? project.revisionPoints
            : [
                'Provide detailed pumping test drawdown curve data and dynamic recovery logs',
                'Include signed local community WASHCO land lease and Right-of-Way (RoW) consent form'
            ]
    );
    const [newRevisionItem, setNewRevisionItem] = useState('');
    const [showCertPreview, setShowCertPreview] = useState(false);
    const [procurementHandoffModal, setProcurementHandoffModal] = useState(null);

    // Compute Pillar Scores (each max 20 pts)
    const pillarScores = useMemo(() => {
        return {
            hydrology: Math.min(20, (subScores.hydro_yield || 0) + (subScores.hydro_drawdown || 0) + (subScores.hydro_recharge || 0)),
            engineering: Math.min(20, (subScores.eng_pumping || 0) + (subScores.eng_reservoir || 0) + (subScores.eng_hydraulic || 0)),
            eia: Math.min(20, (subScores.eia_water_quality || 0) + (subScores.eia_mitigation || 0) + (subScores.eia_sanitation || 0)),
            washco: Math.min(20, (subScores.washco_legal || 0) + (subScores.washco_gender || 0) + (subScores.washco_land || 0)),
            economics: Math.min(20, (subScores.econ_per_capita || 0) + (subScores.econ_contribution || 0) + (subScores.econ_recovery || 0)),
        };
    }, [subScores]);

    // Total Score (0 - 100)
    const totalScore = useMemo(() => {
        return pillarScores.hydrology + pillarScores.engineering + pillarScores.eia + pillarScores.washco + pillarScores.economics;
    }, [pillarScores]);

    // Qualification Gate status
    const qualificationGate = useMemo(() => {
        if (totalScore >= 80) {
            return {
                grade: 'Grade A',
                verdict: 'Approved for Procurement',
                label: 'Unconditional Technical Approval (Eligible for Tender)',
                color: 'text-emerald-800 bg-emerald-50 border-emerald-300',
                canProcure: true
            };
        }
        if (totalScore >= 60) {
            return {
                grade: 'Grade B',
                verdict: 'Conditional Revision Required',
                label: 'Conditional Approval (Technical Amendment Notes Mandatory)',
                color: 'text-amber-800 bg-amber-50 border-amber-300',
                canProcure: false
            };
        }
        return {
            grade: 'Grade C/D',
            verdict: 'Rejected / Infeasible',
            label: 'Infeasible / Sub-standard (Formal Rejection Rationale Required)',
            color: 'text-rose-800 bg-rose-50 border-rose-300',
            canProcure: false
        };
    }, [totalScore]);

    const handleSubScoreChange = (field, val, maxVal) => {
        const bounded = Math.max(0, Math.min(maxVal, Number(val) || 0));
        setSubScores(prev => ({ ...prev, [field]: bounded }));
    };

    const handleAddRevisionItem = () => {
        if (!newRevisionItem.trim()) return;
        setRevisionRequirements(prev => [...prev, newRevisionItem.trim()]);
        setNewRevisionItem('');
    };

    const handleRemoveRevisionItem = (idx) => {
        setRevisionRequirements(prev => prev.filter((_, i) => i !== idx));
    };

    // Run AI Engineering Audit
    const handleRunAiAudit = async () => {
        setIsAuditingAI(true);
        try {
            const audit = await performAiTechnicalAudit(project);
            setAiAuditResult(audit);
            if (audit.executiveRemarksDraft && !comments.trim()) {
                setComments(audit.executiveRemarksDraft);
            }
        } catch (err) {
            console.error('Error conducting AI technical audit:', err);
        } finally {
            setIsAuditingAI(false);
        }
    };

    const handleApplyAiScores = () => {
        if (!aiAuditResult?.suggestedScores) return;
        const s = aiAuditResult.suggestedScores;
        // Distribute proportionally into subcriteria
        setSubScores({
            hydro_yield: Math.round((s.hydrology / 20) * 7),
            hydro_drawdown: Math.round((s.hydrology / 20) * 7),
            hydro_recharge: Math.round((s.hydrology / 20) * 6),

            eng_pumping: Math.round((s.engineering / 20) * 7),
            eng_reservoir: Math.round((s.engineering / 20) * 7),
            eng_hydraulic: Math.round((s.engineering / 20) * 6),

            eia_water_quality: Math.round((s.eia / 20) * 7),
            eia_mitigation: Math.round((s.eia / 20) * 7),
            eia_sanitation: Math.round((s.eia / 20) * 6),

            washco_legal: Math.round((s.washco / 20) * 7),
            washco_gender: Math.round((s.washco / 20) * 7),
            washco_land: Math.round((s.washco / 20) * 6),

            econ_per_capita: Math.round((s.economics / 20) * 7),
            econ_contribution: Math.round((s.economics / 20) * 7),
            econ_recovery: Math.round((s.economics / 20) * 6),
        });
        if (aiAuditResult.executiveRemarksDraft) {
            setComments(aiAuditResult.executiveRemarksDraft);
        }
        alert('AI suggested scores and executive remarks applied to 5-Pillar Scorecard.');
    };

    // General Action Handler
    const handleAction = (status, verdict) => {
        if (!comments.trim() && (status === ProjectStatus.REJECTED || verdict.includes('Revision'))) {
            alert('A detailed technical justification / review note is mandatory for this action.');
            return;
        }

        const certNo = status === ProjectStatus.APPROVED
            ? (project.approvalCertificateNo || `OWEB-APP-${new Date().getFullYear()}-${String(project.id || Date.now()).slice(-4)}`)
            : undefined;

        const updated = {
            ...project,
            status,
            reviewComments: comments,
            reviewedBy: currentUser?.fullName || currentUser?.username || 'Lead Technical Reviewer',
            reviewDate: new Date().toISOString().split('T')[0],
            reviewScore: totalScore,
            appraisalVerdict: verdict,
            approvalCertificateNo: certNo,
            revisionPoints: verdict.includes('Revision') ? revisionRequirements : (project.revisionPoints || []),
            reviewChecklist: {
                hydrologyPassed: pillarScores.hydrology >= 14,
                engineeringPassed: pillarScores.engineering >= 14,
                eiaPassed: pillarScores.eia >= 14,
                washcoPassed: pillarScores.washco >= 14,
                costBenchmarkingPassed: pillarScores.economics >= 14
            },
            aiRiskAssessment: aiAuditResult || project.aiRiskAssessment
        };

        onUpdateProject(updated);
        onClose();
    };

    // Direct Hand-off to Procurement: "Clear & Initiate Procurement Package"
    const handleClearAndInitiateProcurement = () => {
        if (totalScore < 80) {
            alert(`Cannot initiate procurement. Overall Appraisal Score is ${totalScore}/100 (Minimum required: 80/100). Please request revisions or adjust appraisal marks.`);
            return;
        }

        const certNo = project.approvalCertificateNo || `OWEB-APP-${new Date().getFullYear()}-${String(project.id || Date.now()).slice(-4)}`;
        const procId = `PROC-${project.id}-${Date.now().toString().slice(-4)}`;
        const tenderRef = `OWEB/NCB/W-${new Date().getFullYear()}/${String(project.id).slice(-4)}`;

        // 1. Update Project Status to APPROVED
        const updated = {
            ...project,
            status: ProjectStatus.APPROVED,
            reviewComments: comments || 'Officially appraised and cleared by OWEB Technical Appraisal Committee for works tendering.',
            reviewedBy: currentUser?.fullName || currentUser?.username || 'Lead Technical Reviewer',
            reviewDate: new Date().toISOString().split('T')[0],
            reviewScore: totalScore,
            appraisalVerdict: 'Approved',
            approvalCertificateNo: certNo,
            revisionPoints: [],
            reviewChecklist: {
                hydrologyPassed: pillarScores.hydrology >= 14,
                engineeringPassed: pillarScores.engineering >= 14,
                eiaPassed: pillarScores.eia >= 14,
                washcoPassed: pillarScores.washco >= 14,
                costBenchmarkingPassed: pillarScores.economics >= 14
            },
            aiRiskAssessment: aiAuditResult || project.aiRiskAssessment
        };
        onUpdateProject(updated);

        // 2. Initialize Procurement Package in Procurement Module
        if (typeof onAddProcurement === 'function') {
            const initialProcurement = {
                id: procId,
                projectId: project.id,
                tenderReferenceNumber: tenderRef,
                procurementMethod: 'National Competitive Bidding (NCB)',
                procurementType: 'Works',
                bidIssuedDate: new Date().toISOString().split('T')[0],
                tenderStage: 'Preparation',
                evaluationStatus: 'Pending Technical Evaluation',
                estimatedBudgetETB: Number(project.estimatedBudget) || 0,
                finalContractValueETB: 0,
                lots: [
                    {
                        id: `LOT-${project.id}-01`,
                        lotNumber: 1,
                        name: `${project.name} - Construction of Civil Works & Electromechanical Installation`,
                        description: `Execution of ${project.projectType} (${project.projectSubType || 'Water Scheme'}) in ${project.woreda} Woreda, ${project.zone} Zone.`,
                        estimatedBudgetETB: Number(project.estimatedBudget) || 0,
                        bidSecurityAmountETB: Math.round((Number(project.estimatedBudget) || 0) * 0.01),
                        status: 'Active'
                    }
                ],
                bidders: []
            };
            onAddProcurement(initialProcurement);
        }

        // Show handoff confirmation modal
        setProcurementHandoffModal({
            procId,
            tenderRef,
            certNo
        });
    };

    const allProjectDocs = documents.filter(d => d.projectId === project?.id);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-5 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-sky-100 overflow-hidden">
                {/* Modal Header */}
                <div className="p-5 bg-gradient-to-r from-ocean-900 via-ocean-800 to-sky-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
                            {React.cloneElement(ICONS.fileSignature, { className: 'w-6 h-6 text-cyan-300' })}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-500/20 text-cyan-200 border border-sky-400/30">
                                    {project?.id}
                                </span>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${qualificationGate.color}`}>
                                    {qualificationGate.grade} • {qualificationGate.verdict}
                                </span>
                            </div>
                            <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                                Technical Appraisal &amp; Engineering Gatekeeper: {project?.name}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Overall Score Badge */}
                        <div className="px-3.5 py-1.5 bg-white/10 rounded-xl border border-white/20 text-right">
                            <span className="text-[10px] text-cyan-200 block uppercase font-bold tracking-wider">Overall Score</span>
                            <span className="text-lg font-black text-white">{totalScore} <span className="text-xs text-cyan-300 font-normal">/ 100</span></span>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-sky-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Sub-Header Navigation Tabs */}
                <div className="flex items-center gap-2 px-6 pt-3 bg-slate-50 border-b border-slate-200 overflow-x-auto text-xs font-bold">
                    <button
                        type="button"
                        onClick={() => setActiveTab('dossier')}
                        className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'dossier' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {React.cloneElement(ICONS.planning, { className: 'w-4 h-4' })}
                        Scheme Dossier
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('scorecard')}
                        className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'scorecard' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {React.cloneElement(ICONS.reporting, { className: 'w-4 h-4' })}
                        5-Pillar Scorecard ({totalScore}/100)
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('ai_audit')}
                        className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'ai_audit' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {React.cloneElement(ICONS.sparkles, { className: 'w-4 h-4 text-cyan-600' })}
                        AI Engineering Audit
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('documents')}
                        className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'documents' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {React.cloneElement(ICONS.paperclip, { className: 'w-4 h-4' })}
                        Attached Artifacts ({allProjectDocs.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('action')}
                        className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'action' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {React.cloneElement(ICONS.checkCircle, { className: 'w-4 h-4' })}
                        Clearance &amp; Decision Deck
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-5">
                    {/* TAB 1: SCHEME DOSSIER */}
                    {activeTab === 'dossier' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3.5 bg-white rounded-xl border border-sky-100 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Program Framework</span>
                                    <p className="text-xs font-bold text-slate-900 mt-0.5">{project?.program || 'ONE WASH'}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{project?.programComponent || 'Rural Infrastructure'}</p>
                                </div>
                                <div className="p-3.5 bg-white rounded-xl border border-sky-100 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Estimated Capital Budget</span>
                                    <p className="text-xs font-bold text-emerald-800 mt-0.5">{Number(project?.estimatedBudget || 0).toLocaleString()} ETB</p>
                                    <p className="text-[11px] text-slate-500 truncate" title={project?.fundingSource}>{project?.fundingSource}</p>
                                </div>
                                <div className="p-3.5 bg-white rounded-xl border border-sky-100 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Coverage</span>
                                    <p className="text-xs font-bold text-slate-900 mt-0.5">{Number(project?.populationCoverage || 0).toLocaleString()} Persons</p>
                                    <p className="text-[11px] text-slate-500">
                                        {project?.dailyDemandEstimate ? `${Number(project.dailyDemandEstimate).toLocaleString()} L/day` : 'Standard demand'}
                                    </p>
                                </div>
                                <div className="p-3.5 bg-white rounded-xl border border-sky-100 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Environmental Risk</span>
                                    <p className="mt-0.5">
                                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                                            project?.environmentalRiskLevel === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                            project?.environmentalRiskLevel === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}>
                                            {project?.environmentalRiskLevel || 'Low'} Risk
                                        </span>
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-1">EIA Clearance: {project?.eiaConducted ? 'Yes' : 'Pending'}</p>
                                </div>
                            </div>

                            {/* Detailed Parameters Grid */}
                            <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-2xs space-y-4">
                                <h4 className="text-xs font-bold text-ocean-950 uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                                    Engineering &amp; Technical Specifications
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Water Source &amp; Reliability:</span>
                                        <span className="font-semibold text-slate-800">{project?.sourceOfWater || 'Deep Borehole'} ({project?.sourceReliability || 'Reliable'})</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Pumping / Power Source:</span>
                                        <span className="font-semibold text-slate-800">{project?.energySource || 'Solar PV Array'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Intervention Type:</span>
                                        <span className="font-semibold text-slate-800">{project?.typeOfIntervention || 'New Construction'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Total Dynamic Head (TDH):</span>
                                        <span className="font-semibold text-slate-800">{project?.totalDynamicHead ? `${project.totalDynamicHead} meters` : '120 meters'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Pump Discharge Yield:</span>
                                        <span className="font-semibold text-slate-800">{project?.pumpDischargeYield ? `${project.pumpDischargeYield} L/sec` : '8.5 L/sec'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Storage Reservoir Requirement:</span>
                                        <span className="font-semibold text-slate-800">{project?.storageRequirement ? `${project.storageRequirement} m³` : 'Standard tank'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Distribution Pipe Network:</span>
                                        <span className="font-semibold text-slate-800">{project?.pipeLengthEstimation ? `${project.pipeLengthEstimation} km` : 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Water Chemistry (Fluoride / Salinity):</span>
                                        <span className="font-semibold text-slate-800">
                                            {project?.waterQualityFluoride != null ? `${project.waterQualityFluoride} mg/L F⁻` : '0.8 mg/L F⁻'} • {project?.waterQualitySalinity || 600} µS/cm
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">WASHCO Governance &amp; Gender:</span>
                                        <span className="font-semibold text-slate-800">
                                            {project?.washcoExists ? `Active (${project.washcoFemaleMembers || 4} female leaders)` : 'Not yet organized'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Land Acquisition / RoW:</span>
                                        <span className="font-semibold text-slate-800">{project?.landOwnershipCleared ? 'Cleared & Kebele Consented' : 'In Progress'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">GPS Coordinates:</span>
                                        <span className="font-mono text-slate-700">
                                            {project?.gpsCoordinates?.lat != null ? Number(project.gpsCoordinates.lat).toFixed(4) : '8.5400'}° N,{' '}
                                            {project?.gpsCoordinates?.long != null ? Number(project.gpsCoordinates.long).toFixed(4) : '39.2700'}° E
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Implementing Entity:</span>
                                        <span className="font-semibold text-slate-800">{project?.implementingBody || 'OWEB Direct'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Executive Summary Narrative */}
                            {project?.summary && (
                                <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-100 text-xs text-slate-700 leading-relaxed">
                                    <span className="font-bold text-ocean-900 block mb-1">Planner Formulation Narrative:</span>
                                    <p className="italic">{project.summary}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: 5-PILLAR MULTI-DISCIPLINARY SCORING ENGINE */}
                    {activeTab === 'scorecard' && (
                        <div className="space-y-5">
                            {/* Score Overview Bar */}
                            <div className="p-4 bg-white rounded-xl border border-sky-100 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-xs font-extrabold text-ocean-950 uppercase tracking-wider">
                                        OWEB 5-Pillar Multi-Disciplinary Scoring Engine (0–100 Scale)
                                    </h4>
                                    <p className="text-[11px] text-slate-500">
                                        Each pillar evaluates rigorous technical criteria (20 points max each). Minimum 80 points required for procurement clearance.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Appraisal Gate</span>
                                        <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${qualificationGate.color}`}>
                                            {qualificationGate.grade} • {qualificationGate.verdict}
                                        </span>
                                    </div>
                                    <div className="w-16 h-12 bg-ocean-950 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-xs">
                                        {totalScore}
                                    </div>
                                </div>
                            </div>

                            {/* PILLAR 1: HYDROGEOLOGY & WATER RESOURCE */}
                            <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-black text-xs">1</span>
                                        <div>
                                            <h5 className="text-xs font-bold text-ocean-950 uppercase">Hydrogeology &amp; Water Resource Sourcing</h5>
                                            <p className="text-[11px] text-slate-500">Aquifer potential, drawdown recovery, and seasonal drought resilience</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-black text-sky-800">{pillarScores.hydrology} / 20 pts</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <span className="font-bold text-slate-800 block text-[11px]">Aquifer Yield Test Validation (Max 7)</span>
                                        <p className="text-[10px] text-slate-500">Yield discharge (m³/hr) satisfies minimum calculated design peak demand.</p>
                                        <input
                                            type="range"
                                            min={0}
                                            max={7}
                                            value={subScores.hydro_yield}
                                            onChange={(e) => handleSubScoreChange('hydro_yield', e.target.value, 7)}
                                            className="w-full accent-cyan-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                            <span>Score: {subScores.hydro_yield}/7</span>
                                            <button type="button" onClick={() => handleSubScoreChange('hydro_yield', 7, 7)} className="text-cyan-700 hover:underline">Full (7)</button>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <span className="font-bold text-slate-800 block text-[11px]">Drawdown &amp; Recovery Curve (Max 7)</span>
                                        <p className="text-[10px] text-slate-500">Pumping test static/dynamic water levels and 85%+ recovery rate logged.</p>
                                        <input
                                            type="range"
                                            min={0}
                                            max={7}
                                            value={subScores.hydro_drawdown}
                                            onChange={(e) => handleSubScoreChange('hydro_drawdown', e.target.value, 7)}
                                            className="w-full accent-cyan-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                            <span>Score: {subScores.hydro_drawdown}/7</span>
                                            <button type="button" onClick={() => handleSubScoreChange('hydro_drawdown', 7, 7)} className="text-cyan-700 hover:underline">Full (7)</button>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <span className="font-bold text-slate-800 block text-[11px]">Seasonal Drought Resilience (Max 6)</span>
                                        <p className="text-[10px] text-slate-500">Perennial recharge without severe dry-season discharge reduction.</p>
                                        <input
                                            type="range"
                                            min={0}
                                            max={6}
                                            value={subScores.hydro_recharge}
                                            onChange={(e) => handleSubScoreChange('hydro_recharge', e.target.value, 6)}
                                            className="w-full accent-cyan-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                            <span>Score: {subScores.hydro_recharge}/6</span>
                                            <button type="button" onClick={() => handleSubScoreChange('hydro_recharge', 6, 6)} className="text-cyan-700 hover:underline">Full (6)</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PILLAR 2: ENGINEERING & INFRASTRUCTURE DESIGN */}
                            <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-black text-xs">2</span>
                                        <div>
                                            <h5 className="text-xs font-bold text-ocean-950 uppercase">Engineering &amp; Infrastructure Design</h5>
                                            <p className="text-[11px] text-slate-500">Pumping duty, solar array sizing, reservoir structural storage &amp; hydraulics</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-black text-cyan-800">{pillarScores.engineering} / 20 pts</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <span className="font-bold text-slate-800 block text-[11px]">Pump Head &amp; Solar PV kW Sizing (Max 7)</span>
                                        <p className="text-[10px] text-slate-500">Total Dynamic Head (TDH) vs. pump motor and 1.35x solar PV sizing.</p>
                                        <input
                                            type="range"
                                            min={0}
                                            max={7}
                                            value={subScores.eng_pumping}
                                            onChange={(e) => handleSubScoreChange('eng_pumping', e.target.value, 7)}
                                            className="w-full accent-cyan-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                            <span>Score: {subScores.eng_pumping}/7</span>
                                            <button type="button" onClick={() => handleSubScoreChange('eng_pumping', 7, 7)} className="text-cyan-700 hover:underline">Full (7)</button>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <span className="font-bold text-slate-800 block text-[11px]">Storage Reservoir Sizing (Max 7)</span>
                                        <p className="text-[10px] text-slate-500">Provides 30–40% balancing capacity of total daily demand for peak hours.</p>
                                        <input
                                            type="range"
                                            min={0}
                                            max={7}
                                            value={subScores.eng_reservoir}
                                            onChange={(e) => handleSubScoreChange('eng_reservoir', e.target.value, 7)}
                                            className="w-full accent-cyan-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                            <span>Score: {subScores.eng_reservoir}/7</span>
                                            <button type="button" onClick={() => handleSubScoreChange('eng_reservoir', 7, 7)} className="text-cyan-700 hover:underline">Full (7)</button>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <span className="font-bold text-slate-800 block text-[11px]">Hydraulic Gradients &amp; Pipeline (Max 6)</span>
                                        <p className="text-[10px] text-slate-500">Acceptable friction velocities (0.7–2.0 m/s) and break pressure tanks.</p>
                                        <input
                                            type="range"
                                            min={0}
                                            max={6}
                                            value={subScores.eng_hydraulic}
                                            onChange={(e) => handleSubScoreChange('eng_hydraulic', e.target.value, 6)}
                                            className="w-full accent-cyan-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                            <span>Score: {subScores.eng_hydraulic}/6</span>
                                            <button type="button" onClick={() => handleSubScoreChange('eng_hydraulic', 6, 6)} className="text-cyan-700 hover:underline">Full (6)</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PILLAR 3: ENVIRONMENTAL & WATER QUALITY SAFEGUARDS */}
                            <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">3</span>
                                        <div>
                                            <h5 className="text-xs font-bold text-ocean-950 uppercase">Environmental &amp; Water Quality Safeguards (ESMF)</h5>
                                            <p className="text-[11px] text-slate-500">Potability testing, Fluoride levels, EIA clearance certificate, and drainage</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-black text-emerald-800">{pillarScores.eia} / 20 pts</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <span className="font-bold text-slate-800 block text-[11px]">Potability Lab Test Check (Max 7)</span>
                                        <p className="text-[10px] text-slate-500">Fluoride (&lt;1.5 mg/L), Salinity/EC, TDS and zero E. coli bacterial risk.</p>
                                        <input
                                            type="range"
                                            min={0}
                                            max={7}
                                            value={subScores.eia_water_quality}
                                            onChange={(e) => handleSubScoreChange('eia_water_quality', e.target.value, 7)}
                                            className="w-full accent-emerald-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                            <span>Score: {subScores.eia_water_quality}/7</span>
                                            <button type="button" onClick={() => handleSubScoreChange('eia_water_quality', 7, 7)} className="text-emerald-700 hover:underline">Full (7)</button>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <span className="font-bold text-slate-800 block text-[11px]">EIA / ESMF Clearance (Max 7)</span>
                                        <p className="text-[10px] text-slate-500">OEFCCA certified clearance, catchment protection and erosion mitigation.</p>
                                        <input
                                            type="range"
                                            min={0}
                                            max={7}
                                            value={subScores.eia_mitigation}
                                            onChange={(e) => handleSubScoreChange('eia_mitigation', e.target.value, 7)}
                                            className="w-full accent-emerald-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                            <span>Score: {subScores.eia_mitigation}/7</span>
                                            <button type="button" onClick={() => handleSubScoreChange('eia_mitigation', 7, 7)} className="text-emerald-700 hover:underline">Full (7)</button>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <span className="font-bold text-slate-800 block text-[11px]">Sanitation &amp; Livestock Drainage (Max 6)</span>
                                        <p className="text-[10px] text-slate-500">Clean soakaway pit at public taps and cattle trough run-off containment.</p>
                                        <input
                                            type="range"
                                            min={0}
                                            max={6}
                                            value={subScores.eia_sanitation}
                                            onChange={(e) => handleSubScoreChange('eia_sanitation', e.target.value, 6)}
                                            className="w-full accent-emerald-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                            <span>Score: {subScores.eia_sanitation}/6</span>
                                            <button type="button" onClick={() => handleSubScoreChange('eia_sanitation', 6, 6)} className="text-emerald-700 hover:underline">Full (6)</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PILLAR 4: WASHCO & COMMUNITY INSTITUTIONAL READINESS */}
                            <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-black text-xs">4</span>
                                        <div>
                                            <h5 className="text-xs font-bold text-ocean-950 uppercase">WASHCO &amp; Community Institutional Readiness</h5>
                                            <p className="text-[11px] text-slate-500">Legal registration, female leadership roles, tariff structure &amp; land rights</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-black text-indigo-800">{pillarScores.washco} / 20 pts</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <span className="font-bold text-slate-800 block text-[11px]">Legal Registration &amp; Bylaws (Max 7)</span>
                                        <p className="text-[10px] text-slate-500">WASHCO formally registered with Woreda Water Desk and bylaws enacted.</p>
                                        <input
                                            type="range"
                                            min={0}
                                            max={7}
                                            value={subScores.washco_legal}
                                            onChange={(e) => handleSubScoreChange('washco_legal', e.target.value, 7)}
                                            className="w-full accent-indigo-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                            <span>Score: {subScores.washco_legal}/7</span>
                                            <button type="button" onClick={() => handleSubScoreChange('washco_legal', 7, 7)} className="text-indigo-700 hover:underline">Full (7)</button>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <span className="font-bold text-slate-800 block text-[11px]">Gender Parity in Leadership (Max 7)</span>
                                        <p className="text-[10px] text-slate-500">Minimum 50% female committee members with active executive posts.</p>
                                        <input
                                            type="range"
                                            min={0}
                                            max={7}
                                            value={subScores.washco_gender}
                                            onChange={(e) => handleSubScoreChange('washco_gender', e.target.value, 7)}
                                            className="w-full accent-indigo-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                            <span>Score: {subScores.washco_gender}/7</span>
                                            <button type="button" onClick={() => handleSubScoreChange('washco_gender', 7, 7)} className="text-indigo-700 hover:underline">Full (7)</button>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <span className="font-bold text-slate-800 block text-[11px]">Land Clearance &amp; RoW Consent (Max 6)</span>
                                        <p className="text-[10px] text-slate-500">Kebele administration right-of-way signed without outstanding disputes.</p>
                                        <input
                                            type="range"
                                            min={0}
                                            max={6}
                                            value={subScores.washco_land}
                                            onChange={(e) => handleSubScoreChange('washco_land', e.target.value, 6)}
                                            className="w-full accent-indigo-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                            <span>Score: {subScores.washco_land}/6</span>
                                            <button type="button" onClick={() => handleSubScoreChange('washco_land', 6, 6)} className="text-indigo-700 hover:underline">Full (6)</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PILLAR 5: ECONOMIC FEASIBILITY & COST NORMS */}
                            <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs">5</span>
                                        <div>
                                            <h5 className="text-xs font-bold text-ocean-950 uppercase">Economic Feasibility &amp; Cost Norms</h5>
                                            <p className="text-[11px] text-slate-500">Cost per capita benchmark, community equity contribution, and O&amp;M viability</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-black text-teal-800">{pillarScores.economics} / 20 pts</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <span className="font-bold text-slate-800 block text-[11px]">Cost / Beneficiary Benchmark (Max 7)</span>
                                        <p className="text-[10px] text-slate-500">ETB per capita complies with regional 3,500–6,500 ETB/capita norms.</p>
                                        <input
                                            type="range"
                                            min={0}
                                            max={7}
                                            value={subScores.econ_per_capita}
                                            onChange={(e) => handleSubScoreChange('econ_per_capita', e.target.value, 7)}
                                            className="w-full accent-teal-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                            <span>Score: {subScores.econ_per_capita}/7</span>
                                            <button type="button" onClick={() => handleSubScoreChange('econ_per_capita', 7, 7)} className="text-teal-700 hover:underline">Full (7)</button>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <span className="font-bold text-slate-800 block text-[11px]">Community Equity Share (Max 7)</span>
                                        <p className="text-[10px] text-slate-500">Minimum 5–10% community cash tariff deposit and local in-kind labor.</p>
                                        <input
                                            type="range"
                                            min={0}
                                            max={7}
                                            value={subScores.econ_contribution}
                                            onChange={(e) => handleSubScoreChange('econ_contribution', e.target.value, 7)}
                                            className="w-full accent-teal-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                            <span>Score: {subScores.econ_contribution}/7</span>
                                            <button type="button" onClick={() => handleSubScoreChange('econ_contribution', 7, 7)} className="text-teal-700 hover:underline">Full (7)</button>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <span className="font-bold text-slate-800 block text-[11px]">O&amp;M Financial Viability (Max 6)</span>
                                        <p className="text-[10px] text-slate-500">Tariff collection covers spare parts and operator monthly honorarium.</p>
                                        <input
                                            type="range"
                                            min={0}
                                            max={6}
                                            value={subScores.econ_recovery}
                                            onChange={(e) => handleSubScoreChange('econ_recovery', e.target.value, 6)}
                                            className="w-full accent-teal-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                            <span>Score: {subScores.econ_recovery}/6</span>
                                            <button type="button" onClick={() => handleSubScoreChange('econ_recovery', 6, 6)} className="text-teal-700 hover:underline">Full (6)</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: AI TECHNICAL APPRAISAL AUDIT */}
                    {activeTab === 'ai_audit' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-2xs space-y-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="p-2 bg-gradient-to-tr from-cyan-600 to-sky-700 text-white rounded-xl shadow-xs">
                                            {React.cloneElement(ICONS.sparkles, { className: 'w-5 h-5 text-white' })}
                                        </span>
                                        <div>
                                            <h4 className="text-xs font-bold text-ocean-950 uppercase tracking-wider">
                                                Gemini AI Technical Appraisal Audit &amp; Design Flaw Detector
                                            </h4>
                                            <p className="text-[11px] text-slate-500">
                                                Scrutinizes solar array sizing vs pump head, pipe friction loss, fluoride limits, and reservoir balancing volume.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleRunAiAudit}
                                            disabled={isAuditingAI}
                                            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                        >
                                            {isAuditingAI ? 'Scrutinizing Engineering Model...' : 'Run AI Technical Audit'}
                                        </button>
                                    </div>
                                </div>

                                {aiAuditResult ? (
                                    <div className="space-y-4 text-xs">
                                        {/* Hydraulic & Power Sizing Check */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-sky-50/70 rounded-xl border border-sky-200">
                                            <div>
                                                <span className="text-slate-500 text-[10px] block uppercase font-bold">Calculated Pump Power</span>
                                                <span className="font-extrabold text-slate-900 text-sm">{aiAuditResult.requiredPumpKw} kW</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[10px] block uppercase font-bold">Recommended Solar PV</span>
                                                <span className="font-extrabold text-cyan-800 text-sm">{aiAuditResult.recommendedSolarKwp} kWp</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[10px] block uppercase font-bold">Cost Per Capita</span>
                                                <span className="font-extrabold text-emerald-800 text-sm">{aiAuditResult.costPerCapita?.toLocaleString()} ETB</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[10px] block uppercase font-bold">Audit Recommendation</span>
                                                <span className="font-extrabold text-ocean-900 text-sm">
                                                    {totalScore >= 80 ? 'Procurement Ready' : 'Revisions Required'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Design Flaws Warning Card */}
                                        <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-200 space-y-2">
                                            <span className="font-bold text-rose-900 flex items-center gap-1.5">
                                                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                Identified Potential Design Flaws &amp; Technical Bottlenecks ({aiAuditResult.designFlaws?.length || 0}):
                                            </span>
                                            <ul className="list-disc list-inside space-y-1.5 text-rose-800 pl-1">
                                                {aiAuditResult.designFlaws?.map((flaw, idx) => (
                                                    <li key={idx} className="leading-relaxed font-medium">{flaw}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Actionable Engineering Directives */}
                                        <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2">
                                            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                                                {React.cloneElement(ICONS.checkCircle, { className: 'w-4 h-4 text-emerald-600' })}
                                                Actionable Engineering Directives for Tender Documents:
                                            </span>
                                            <ul className="list-disc list-inside space-y-1.5 text-emerald-800 pl-1">
                                                {aiAuditResult.engineeringDirectives?.map((dir, idx) => (
                                                    <li key={idx} className="leading-relaxed">{dir}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Auto-Drafted Executive Remarks */}
                                        {aiAuditResult.executiveRemarksDraft && (
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-ocean-950 uppercase tracking-wider text-[11px]">
                                                        Auto-Drafted Executive Appraisal Remarks (For Bureau Director):
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setComments(aiAuditResult.executiveRemarksDraft);
                                                            alert('Remarks copied into the formal appraisal remarks box.');
                                                        }}
                                                        className="text-cyan-700 hover:text-cyan-900 font-bold text-[11px] underline cursor-pointer"
                                                    >
                                                        Insert into Action Box
                                                    </button>
                                                </div>
                                                <p className="text-slate-700 leading-relaxed font-mono text-[11px] whitespace-pre-line bg-white p-3 rounded-lg border border-slate-200">
                                                    {aiAuditResult.executiveRemarksDraft}
                                                </p>
                                            </div>
                                        )}

                                        {/* Apply to Scorecard button */}
                                        <div className="flex justify-end pt-2">
                                            <button
                                                type="button"
                                                onClick={handleApplyAiScores}
                                                className="px-4 py-2 text-xs font-bold text-cyan-800 bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                                            >
                                                <span>⚡</span>
                                                <span>Apply AI Recommendations to 5-Pillar Scorecard</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                                        <svg className="w-8 h-8 text-cyan-600/50 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <p className="text-xs font-semibold text-slate-700">Click &ldquo;Run AI Technical Audit&rdquo; to launch automated design flaw detection.</p>
                                        <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                                            Evaluates hydraulic power parameters, solar array sizing, pipe friction loss, high-fluoride zones, and drafts executive appraisal remarks.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: ATTACHED ARTIFACTS & FEASIBILITY DOCUMENTS */}
                    {activeTab === 'documents' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-2xs">
                                <h4 className="text-xs font-bold text-ocean-950 uppercase tracking-wider mb-3">
                                    Project Feasibility &amp; Safeguard Artifacts
                                </h4>
                                {allProjectDocs.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-xs font-semibold text-slate-600">No project attachments uploaded</p>
                                        <p className="text-[11px] text-slate-400">The planner did not attach external PDF studies during submission.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {allProjectDocs.map((doc) => (
                                            <div key={doc.id} className="py-3 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="p-2 bg-sky-50 text-cyan-700 rounded-lg">
                                                        {React.cloneElement(ICONS.paperclip, { className: 'w-4 h-4' })}
                                                    </span>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{doc.fileName}</p>
                                                        <p className="text-[11px] text-slate-400">
                                                            {doc.category} • Uploaded by @{doc.uploadedBy} on {new Date(doc.uploadDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={doc.fileUrl}
                                                    download={doc.fileName}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 bg-sky-50 text-cyan-700 hover:bg-sky-100 rounded-lg font-bold transition-colors cursor-pointer"
                                                >
                                                    Download Artifact
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 5: ACTION DECK & ENDORSEMENT DECISION */}
                    {activeTab === 'action' && (
                        <div className="space-y-5">
                            {/* Required Revision Points (if requesting revisions) */}
                            <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-2xs space-y-3">
                                <h4 className="text-xs font-bold text-ocean-950 uppercase tracking-wider flex items-center justify-between">
                                    <span>Mandatory Technical Revision Directives (For Planner Resubmission)</span>
                                    <span className="text-[11px] font-normal text-slate-400">({revisionRequirements.length} points)</span>
                                </h4>
                                <div className="space-y-2">
                                    {revisionRequirements.map((req, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200">
                                            <span className="text-slate-700 font-medium">• {req}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRevisionItem(idx)}
                                                className="text-rose-600 hover:text-rose-800 font-bold ml-2 cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <input
                                        type="text"
                                        placeholder="Add required technical revision directive..."
                                        value={newRevisionItem}
                                        onChange={(e) => setNewRevisionItem(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRevisionItem())}
                                        className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddRevisionItem}
                                        className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                                    >
                                        Add Note
                                    </button>
                                </div>
                            </div>

                            {/* Mandatory Comments Box */}
                            <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-2xs space-y-2">
                                <label className="block text-xs font-bold text-ocean-950 uppercase tracking-wider">
                                    Formal Appraisal Committee Remarks &amp; Recommendation Minutes (Mandatory)
                                </label>
                                <textarea
                                    rows={4}
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    placeholder="Enter detailed technical findings, justifications, conditions, or reasons for decision..."
                                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-slate-800 leading-relaxed font-medium"
                                />
                            </div>

                            {/* Certificate preview trigger if approved */}
                            {project?.status === ProjectStatus.APPROVED && (
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowCertPreview(true)}
                                        className="px-4 py-2 text-xs font-bold text-cyan-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        View Official Bureau Technical Approval Certificate
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal Action Bar */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                        Close Window
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Request Revision */}
                        <button
                            type="button"
                            onClick={() => handleAction(ProjectStatus.UNDER_REVIEW, 'Conditional Revision Required')}
                            className="px-4 py-2.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 active:bg-amber-300 border border-amber-300 rounded-xl transition-colors shadow-2xs cursor-pointer"
                        >
                            Request Technical Revisions ({revisionRequirements.length})
                        </button>

                        {/* Reject */}
                        <button
                            type="button"
                            onClick={() => handleAction(ProjectStatus.REJECTED, 'Rejected / Infeasible')}
                            className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-colors shadow-2xs cursor-pointer"
                        >
                            Reject Scheme Proposal
                        </button>

                        {/* Standard Approve */}
                        <button
                            type="button"
                            onClick={() => handleAction(ProjectStatus.APPROVED, totalScore >= 80 ? 'Approved' : 'Conditional Approval')}
                            className="px-4 py-2.5 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 active:bg-cyan-900 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                            {React.cloneElement(ICONS.checkCircle, { className: 'w-4 h-4' })}
                            <span>Approve &amp; Endorse</span>
                        </button>

                        {/* Prominent Direct Hand-off: "Clear & Initiate Procurement Package" */}
                        <button
                            type="button"
                            onClick={handleClearAndInitiateProcurement}
                            disabled={totalScore < 80}
                            title={totalScore < 80 ? 'Score must be at least 80/100 to clear for procurement' : 'Directly approve and prepare tender in Procurement Module'}
                            className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>🚀</span>
                            <span>Clear &amp; Initiate Procurement Package</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Certificate Preview Popup */}
            {showCertPreview && (
                <ApprovalCertificateModal project={project} onClose={() => setShowCertPreview(false)} />
            )}

            {/* Direct Procurement Handoff Confirmation Modal */}
            {procurementHandoffModal && (
                <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-60 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-emerald-200 space-y-4 text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-black text-ocean-950">Procurement Package Initiated!</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Scheme <strong>{project?.name}</strong> has been cleared with score <strong>{totalScore}/100</strong> and forwarded directly into the Procurement Module pipeline.
                            </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Tender Ref No:</span>
                                <span className="font-mono font-bold text-ocean-900">{procurementHandoffModal.tenderRef}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Appraisal Certificate:</span>
                                <span className="font-mono font-bold text-emerald-700">{procurementHandoffModal.certNo}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Works Budget:</span>
                                <span className="font-bold text-slate-800">{Number(project?.estimatedBudget || 0).toLocaleString()} ETB</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 pt-2">
                            {typeof onNavigate === 'function' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProcurementHandoffModal(null);
                                        onClose();
                                        onNavigate('procurement', procurementHandoffModal.procId);
                                    }}
                                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <span>📋</span>
                                    <span>Go to Procurement Module (View Tender)</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCertPreview(true);
                                }}
                                className="w-full py-2 bg-sky-50 hover:bg-sky-100 text-cyan-800 text-xs font-bold rounded-xl border border-sky-200 transition-colors cursor-pointer"
                            >
                                View Official Appraisal Certificate
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setProcurementHandoffModal(null);
                                    onClose();
                                }}
                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            >
                                Return to Review Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Main Review Module Container
export const ReviewModule = ({
    projects = [],
    documents = [],
    onUpdateProject,
    currentUser,
    onNavigate,
    onAddProcurement
}) => {
    const safeProjects = useMemo(() => Array.isArray(projects) ? projects : [], [projects]);
    const safeDocuments = useMemo(() => Array.isArray(documents) ? documents : [], [documents]);

    const [selectedProject, setSelectedProject] = useState(null);
    const [statusTab, setStatusTab] = useState('PENDING');
    const [searchQuery, setSearchQuery] = useState('');
    const [zoneFilter, setZoneFilter] = useState('ALL');
    const [sectorFilter, setSectorFilter] = useState('ALL');
    const [selectedCertProject, setSelectedCertProject] = useState(null);

    // Filter counts
    const pendingCount = useMemo(() => safeProjects.filter(p => p.status === ProjectStatus.SUBMITTED).length, [safeProjects]);
    const underReviewCount = useMemo(() => safeProjects.filter(p => p.status === ProjectStatus.UNDER_REVIEW).length, [safeProjects]);
    const approvedCount = useMemo(() => safeProjects.filter(p => p.status === ProjectStatus.APPROVED).length, [safeProjects]);
    const rejectedCount = useMemo(() => safeProjects.filter(p => p.status === ProjectStatus.REJECTED).length, [safeProjects]);

    // Filtered Project List
    const filteredProjects = useMemo(() => {
        return safeProjects.filter(p => {
            if (!p) return false;
            // Status Tab
            if (statusTab === 'PENDING' && p.status !== ProjectStatus.SUBMITTED) return false;
            if (statusTab === 'UNDER_REVIEW' && p.status !== ProjectStatus.UNDER_REVIEW) return false;
            if (statusTab === 'APPROVED' && p.status !== ProjectStatus.APPROVED) return false;
            if (statusTab === 'REJECTED' && p.status !== ProjectStatus.REJECTED) return false;

            // Zone
            if (zoneFilter !== 'ALL' && p.zone !== zoneFilter) return false;

            // Sector
            if (sectorFilter !== 'ALL' && p.projectType !== sectorFilter) return false;

            // Search
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matches = (p.name || '').toLowerCase().includes(q) ||
                    String(p.id || '').toLowerCase().includes(q) ||
                    (p.zone || '').toLowerCase().includes(q) ||
                    (p.woreda || '').toLowerCase().includes(q) ||
                    (p.creator && String(p.creator).toLowerCase().includes(q));
                if (!matches) return false;
            }

            return true;
        });
    }, [safeProjects, statusTab, zoneFilter, sectorFilter, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Header & KPI Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div
                    onClick={() => setStatusTab('PENDING')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                        statusTab === 'PENDING'
                            ? 'bg-gradient-to-tr from-cyan-600 to-sky-600 text-white border-transparent'
                            : 'bg-white text-slate-800 border-sky-100 hover:border-cyan-300'
                    }`}
                >
                    <span className={`text-[11px] font-bold uppercase tracking-wider block ${statusTab === 'PENDING' ? 'text-cyan-100' : 'text-slate-500'}`}>
                        Pending Appraisal
                    </span>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-2xl font-black">{pendingCount}</span>
                        <span className={`p-2 rounded-xl text-xs font-bold ${statusTab === 'PENDING' ? 'bg-white/20' : 'bg-cyan-50 text-cyan-700'}`}>
                            {React.cloneElement(ICONS.fileSignature, { className: 'w-5 h-5' })}
                        </span>
                    </div>
                </div>

                <div
                    onClick={() => setStatusTab('UNDER_REVIEW')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                        statusTab === 'UNDER_REVIEW'
                            ? 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white border-transparent'
                            : 'bg-white text-slate-800 border-sky-100 hover:border-amber-300'
                    }`}
                >
                    <span className={`text-[11px] font-bold uppercase tracking-wider block ${statusTab === 'UNDER_REVIEW' ? 'text-amber-100' : 'text-slate-500'}`}>
                        Under Review / Revision
                    </span>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-2xl font-black">{underReviewCount}</span>
                        <span className={`p-2 rounded-xl text-xs font-bold ${statusTab === 'UNDER_REVIEW' ? 'bg-white/20' : 'bg-amber-50 text-amber-700'}`}>
                            {React.cloneElement(ICONS.clock, { className: 'w-5 h-5' })}
                        </span>
                    </div>
                </div>

                <div
                    onClick={() => setStatusTab('APPROVED')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                        statusTab === 'APPROVED'
                            ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white border-transparent'
                            : 'bg-white text-slate-800 border-sky-100 hover:border-emerald-300'
                    }`}
                >
                    <span className={`text-[11px] font-bold uppercase tracking-wider block ${statusTab === 'APPROVED' ? 'text-emerald-100' : 'text-slate-500'}`}>
                        Approved &amp; Endorsed
                    </span>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-2xl font-black">{approvedCount}</span>
                        <span className={`p-2 rounded-xl text-xs font-bold ${statusTab === 'APPROVED' ? 'bg-white/20' : 'bg-emerald-50 text-emerald-700'}`}>
                            {React.cloneElement(ICONS.checkCircle, { className: 'w-5 h-5' })}
                        </span>
                    </div>
                </div>

                <div
                    onClick={() => setStatusTab('REJECTED')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                        statusTab === 'REJECTED'
                            ? 'bg-gradient-to-tr from-rose-600 to-pink-600 text-white border-transparent'
                            : 'bg-white text-slate-800 border-sky-100 hover:border-rose-300'
                    }`}
                >
                    <span className={`text-[11px] font-bold uppercase tracking-wider block ${statusTab === 'REJECTED' ? 'text-rose-100' : 'text-slate-500'}`}>
                        Rejected Submissions
                    </span>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-2xl font-black">{rejectedCount}</span>
                        <span className={`p-2 rounded-xl text-xs font-bold ${statusTab === 'REJECTED' ? 'bg-white/20' : 'bg-rose-50 text-rose-700'}`}>
                            {React.cloneElement(ICONS.alertTriangle, { className: 'w-5 h-5' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-2xl border border-sky-100 shadow-xs overflow-hidden">
                {/* Header & Filter Toolbar */}
                <div className="p-5 border-b border-sky-100 space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-bold text-ocean-950 flex items-center gap-2">
                                <span className="p-2 bg-cyan-100 text-cyan-800 rounded-xl">
                                    {React.cloneElement(ICONS.fileSignature, { className: 'w-5 h-5' })}
                                </span>
                                Project Technical Review &amp; Bureau Appraisal Workspace
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Multi-disciplinary engineering scrutiny, 5-pillar scoring engine, AI design flaw detector, and direct procurement tender clearance.
                            </p>
                        </div>

                        {/* Status Quick Pills */}
                        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                            {['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ALL'].map(tab => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setStatusTab(tab)}
                                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                        statusTab === tab ? 'bg-white text-ocean-950 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {tab === 'PENDING' && `Pending (${pendingCount})`}
                                    {tab === 'UNDER_REVIEW' && `In Review (${underReviewCount})`}
                                    {tab === 'APPROVED' && `Approved (${approvedCount})`}
                                    {tab === 'REJECTED' && `Rejected (${rejectedCount})`}
                                    {tab === 'ALL' && `All (${safeProjects.length})`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filter Inputs Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                        {/* Search Input */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by Project Name, ID, Woreda, Creator..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-slate-800"
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Zone Filter */}
                        <div>
                            <select
                                value={zoneFilter}
                                onChange={(e) => setZoneFilter(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-slate-700 font-medium"
                            >
                                <option value="ALL">All Oromia Zones</option>
                                {ZONES.map(z => (
                                    <option key={z} value={z}>{z} Zone</option>
                                ))}
                            </select>
                        </div>

                        {/* Sector Filter */}
                        <div>
                            <select
                                value={sectorFilter}
                                onChange={(e) => setSectorFilter(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-slate-700 font-medium"
                            >
                                <option value="ALL">All Water Sectors</option>
                                {Object.keys(PROJECT_TYPES).map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Projects Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-sky-50/70 border-b border-sky-100 text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th className="px-5 py-3.5">Project ID &amp; Name</th>
                                <th className="px-4 py-3.5">Zone / Woreda</th>
                                <th className="px-4 py-3.5">Sector &amp; Subtype</th>
                                <th className="px-4 py-3.5">Estimated Budget</th>
                                <th className="px-4 py-3.5">Appraisal Score</th>
                                <th className="px-4 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-center">Appraisal Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16 text-slate-400">
                                        <div className="max-w-xs mx-auto space-y-2">
                                            <svg className="w-8 h-8 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-xs font-bold text-slate-700">No project submissions found</p>
                                            <p className="text-[11px] text-slate-400">Adjust the selected status tab or filters above to review project proposals.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map((p) => {
                                    const hasDocs = safeDocuments.some(d => d.projectId === p.id);
                                    const score = Number(p.reviewScore) || null;

                                    return (
                                        <tr key={p.id} className="hover:bg-sky-50/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                                                <div className="text-[11px] font-mono text-cyan-800 flex items-center gap-1.5 mt-0.5">
                                                    <span>{p.id}</span>
                                                    {hasDocs && (
                                                        <span className="text-[10px] bg-sky-100 text-cyan-800 px-1.5 py-0.2 rounded font-sans font-medium" title="Attachments available">
                                                            📎 Docs
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-slate-700 whitespace-nowrap">
                                                <span className="font-medium text-slate-900">{p.zone}</span>
                                                <span className="text-slate-400 block text-[11px]">{p.woreda || 'Unassigned'}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-slate-600">
                                                <span className="font-semibold text-slate-800">{p.projectType}</span>
                                                <span className="text-slate-400 block text-[11px] truncate max-w-xs">{p.projectSubType || 'Scheme'}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs font-extrabold text-emerald-800 whitespace-nowrap">
                                                {Number(p.estimatedBudget || 0).toLocaleString()} ETB
                                                <span className="text-[10px] font-normal text-slate-400 block">{p.fundingSource || 'Regional Treasury'}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs">
                                                {score !== null ? (
                                                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${
                                                        score >= 80 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                                                        score >= 60 ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                                        'bg-rose-50 text-rose-800 border-rose-300'
                                                    }`}>
                                                        {score} / 100
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 italic">Not appraised</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs">
                                                <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
                                                    p.status === ProjectStatus.APPROVED ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                                    p.status === ProjectStatus.REJECTED ? 'bg-rose-50 text-rose-800 border-rose-200' :
                                                    p.status === ProjectStatus.UNDER_REVIEW ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                                    'bg-sky-50 text-cyan-800 border-sky-200'
                                                }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedProject(p)}
                                                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 active:from-cyan-800 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                                    >
                                                        {React.cloneElement(ICONS.fileSignature, { className: 'w-3.5 h-3.5' })}
                                                        <span>{p.status === ProjectStatus.APPROVED ? 'View Appraisal' : 'Appraise Scheme'}</span>
                                                    </button>

                                                    {p.status === ProjectStatus.APPROVED && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedCertProject(p)}
                                                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                                                            title="Print Technical Approval Certificate"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
            {selectedProject && (
                <ProjectReviewModal
                    project={selectedProject}
                    documents={safeDocuments}
                    onClose={() => setSelectedProject(null)}
                    onUpdateProject={onUpdateProject}
                    currentUser={currentUser}
                    onNavigate={onNavigate}
                    onAddProcurement={onAddProcurement}
                />
            )}

            {/* Standalone Certificate Modal */}
            {selectedCertProject && (
                <ApprovalCertificateModal
                    project={selectedCertProject}
                    onClose={() => setSelectedCertProject(null)}
                />
            )}
        </div>
    );
};

export default ReviewModule;
