import React, { useState, useMemo } from 'react';
import { ProjectStatus, DocumentCategory } from '../types';
import { ICONS, ZONES, PROJECT_TYPES } from '../constants';
import { generateRiskAssessment } from '../services/geminiService';
const DEFAULT_PILLAR_SCORES = {
    hydrology: 18,
    engineering: 17,
    eia: 16,
    washco: 17,
    economics: 18
};
// Formal Bureau Appraisal Certificate Modal
const ApprovalCertificateModal = ({ project, onClose }) => {
    const handlePrint = () => {
        window.print();
    };
    const certNumber = project.approvalCertificateNo || `OWEB-APP-${new Date().getFullYear()}-${project.id.slice(-4)}`;
    const approvalDate = project.reviewDate ? new Date(project.reviewDate).toLocaleDateString() : new Date().toLocaleDateString();
    const score = project.reviewScore || 86;
    return (<div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-sky-200">
                {/* Modal Header */}
                <div className="p-4 bg-gradient-to-r from-ocean-900 via-ocean-800 to-sky-900 text-white flex items-center justify-between">
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
                        <button onClick={handlePrint} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                            </svg>
                            Print Certificate
                        </button>
                        <button onClick={onClose} className="p-1.5 text-sky-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Certificate Paper Layout */}
                <div className="p-8 overflow-y-auto bg-slate-50 flex-1 space-y-6">
                    <div className="bg-white p-8 rounded-xl border-2 border-sky-200 shadow-md relative overflow-hidden">
                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none">
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
                                <span className="font-extrabold text-emerald-700">{score} / 100 ({score >= 85 ? 'Grade A - Fully Responsive' : 'Grade B - Conditional'})</span>
                            </div>
                        </div>

                        {/* Project Dossier Particulars */}
                        <div className="py-4 space-y-3">
                            <h4 className="text-xs font-extrabold uppercase text-ocean-900 tracking-wider">1. Project Particulars</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-sky-50/70 rounded-xl border border-sky-100 text-xs">
                                <div>
                                    <span className="text-slate-500 text-[11px] block">Project Name:</span>
                                    <span className="font-bold text-slate-900">{project.name}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-[11px] block">Project ID:</span>
                                    <span className="font-mono font-bold text-slate-800">{project.id}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-[11px] block">Location:</span>
                                    <span className="font-bold text-slate-800">{project.zone} Zone, {project.woreda} Woreda</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-[11px] block">Intervention Category:</span>
                                    <span className="font-bold text-slate-800">{project.projectType} • {project.projectSubType}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-[11px] block">Approved Budget (ETB):</span>
                                    <span className="font-extrabold text-emerald-800">{project.estimatedBudget.toLocaleString()} ETB</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-[11px] block">Target Beneficiaries:</span>
                                    <span className="font-bold text-slate-800">{project.populationCoverage.toLocaleString()} Persons</span>
                                </div>
                            </div>
                        </div>

                        {/* Technical Verification Statement */}
                        <div className="py-2 space-y-2 text-xs text-slate-700 leading-relaxed">
                            <h4 className="text-xs font-extrabold uppercase text-ocean-900 tracking-wider">2. Technical Appraisal Finding &amp; Endorsement</h4>
                            <p>
                                This is to officially certify that the engineering drawings, hydraulic profile, water yield study, Environmental &amp; Social Impact Assessment (EIA), and community WASHCO governance structures for <strong>{project.name}</strong> have undergone rigorous multi-criteria appraisal by the OWEB Technical Review Committee and meet all regional and national standard specifications.
                            </p>
                            {project.reviewComments && (<div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 text-xs">
                                    <span className="font-bold">Reviewer Endorsement Notes: </span>
                                    {project.reviewComments}
                                </div>)}
                        </div>

                        {/* Signatures & Seal Block */}
                        <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-center border-t border-slate-200 mt-6">
                            <div className="space-y-1">
                                <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center font-serif text-slate-800 italic">
                                    {project.reviewedBy || 'Lead Technical Reviewer'}
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
        </div>);
};
// Comprehensive Technical Review & Appraisal Modal
const ProjectReviewModal = ({ project, documents, onClose, onUpdateProject, currentUser }) => {
    const [activeTab, setActiveTab] = useState('dossier');
    const [comments, setComments] = useState(project.reviewComments || '');
    const [scores, setScores] = useState(DEFAULT_PILLAR_SCORES);
    const [isReevaluatingAI, setIsReevaluatingAI] = useState(false);
    const [aiAssessment, setAiAssessment] = useState(project.aiRiskAssessment);
    const [revisionRequirements, setRevisionRequirements] = useState(project.revisionPoints || [
        'Provide detailed pumping test drawdown curve data',
        'Include signed local community WASHCO land lease consent form'
    ]);
    const [newRevisionItem, setNewRevisionItem] = useState('');
    const [showCertPreview, setShowCertPreview] = useState(false);
    // Compute total score
    const totalScore = useMemo(() => {
        return scores.hydrology + scores.engineering + scores.eia + scores.washco + scores.economics;
    }, [scores]);
    const qualificationGrade = useMemo(() => {
        if (totalScore >= 85)
            return { grade: 'Grade A', label: 'Unconditional Technical Approval', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
        if (totalScore >= 70)
            return { grade: 'Grade B', label: 'Conditional Technical Approval', color: 'text-sky-700 bg-sky-50 border-sky-300' };
        if (totalScore >= 50)
            return { grade: 'Grade C', label: 'Major Revision Required', color: 'text-amber-700 bg-amber-50 border-amber-300' };
        return { grade: 'Grade D', label: 'Technical Non-Compliance / Disqualified', color: 'text-rose-700 bg-rose-50 border-rose-300' };
    }, [totalScore]);
    const handleScoreChange = (pillar, val) => {
        const bounded = Math.max(0, Math.min(20, val));
        setScores(prev => ({ ...prev, [pillar]: bounded }));
    };
    const handleAddRevisionItem = () => {
        if (!newRevisionItem.trim())
            return;
        setRevisionRequirements(prev => [...prev, newRevisionItem.trim()]);
        setNewRevisionItem('');
    };
    const handleRemoveRevisionItem = (idx) => {
        setRevisionRequirements(prev => prev.filter((_, i) => i !== idx));
    };
    const handleReanalyzeWithAI = async () => {
        setIsReevaluatingAI(true);
        try {
            const freshAssessment = await generateRiskAssessment(project);
            setAiAssessment(freshAssessment);
        }
        catch (err) {
            console.error('Error analyzing project with Gemini:', err);
        }
        finally {
            setIsReevaluatingAI(false);
        }
    };
    const handleAction = (status, verdict) => {
        if (!comments.trim() && (status === ProjectStatus.REJECTED || verdict === 'Revision Requested')) {
            alert('A detailed technical justification / review note is mandatory for this action.');
            return;
        }
        const certNo = status === ProjectStatus.APPROVED
            ? (project.approvalCertificateNo || `OWEB-APP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`)
            : undefined;
        const updated = {
            ...project,
            status,
            reviewComments: comments,
            reviewedBy: currentUser?.fullName || currentUser?.username || 'OWEB Reviewer',
            reviewDate: new Date().toISOString(),
            reviewScore: totalScore,
            appraisalVerdict: verdict,
            approvalCertificateNo: certNo,
            revisionPoints: verdict === 'Revision Requested' ? revisionRequirements : project.revisionPoints,
            reviewChecklist: {
                hydrologyPassed: scores.hydrology >= 14,
                engineeringPassed: scores.engineering >= 14,
                eiaPassed: scores.eia >= 14,
                washcoPassed: scores.washco >= 14,
                costBenchmarkingPassed: scores.economics >= 14
            },
            aiRiskAssessment: aiAssessment || project.aiRiskAssessment
        };
        onUpdateProject(updated);
        onClose();
    };
    const feasibilityDoc = documents.find(d => d.projectId === project.id && d.category === DocumentCategory.FEASIBILITY_STUDY);
    const eiaDoc = documents.find(d => d.projectId === project.id && d.category === DocumentCategory.EIA_REPORT);
    const allProjectDocs = documents.filter(d => d.projectId === project.id);
    return (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-5 animate-fade-in">
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
                                    {project.id}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                                    {project.status}
                                </span>
                            </div>
                            <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                                Technical Appraisal &amp; Review: {project.name}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button type="button" onClick={onClose} className="p-1.5 text-sky-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Sub-Header Navigation Tabs */}
                <div className="flex items-center gap-2 px-6 pt-3 bg-slate-50 border-b border-slate-200 overflow-x-auto text-xs font-bold">
                    <button onClick={() => setActiveTab('dossier')} className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'dossier'
            ? 'border-cyan-600 text-cyan-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        {React.cloneElement(ICONS.planning, { className: 'w-4 h-4' })}
                        Scheme Dossier
                    </button>
                    <button onClick={() => setActiveTab('scorecard')} className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'scorecard'
            ? 'border-cyan-600 text-cyan-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        {React.cloneElement(ICONS.reporting, { className: 'w-4 h-4' })}
                        5-Pillar Scorecard ({totalScore}/100)
                    </button>
                    <button onClick={() => setActiveTab('documents')} className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'documents'
            ? 'border-cyan-600 text-cyan-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        {React.cloneElement(ICONS.paperclip, { className: 'w-4 h-4' })}
                        Attachments ({allProjectDocs.length})
                    </button>
                    <button onClick={() => setActiveTab('ai_critique')} className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'ai_critique'
            ? 'border-cyan-600 text-cyan-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        {React.cloneElement(ICONS.sparkles, { className: 'w-4 h-4 text-cyan-600' })}
                        AI Risk &amp; Feasibility Scrutiny
                    </button>
                    <button onClick={() => setActiveTab('action')} className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'action'
            ? 'border-cyan-600 text-cyan-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        {React.cloneElement(ICONS.checkCircle, { className: 'w-4 h-4' })}
                        Endorsement Decision
                    </button>
                </div>

                {/* Modal Body Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/40">
                    {/* TAB 1: SCHEME DOSSIER */}
                    {activeTab === 'dossier' && (<div className="space-y-6">
                            {/* Summary Banner */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3.5 bg-white rounded-xl border border-sky-100 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location</span>
                                    <p className="text-xs font-bold text-slate-900 mt-0.5">{project.zone} Zone</p>
                                    <p className="text-[11px] text-slate-500">{project.woreda} Woreda, {project.kebele || 'N/A'}</p>
                                </div>
                                <div className="p-3.5 bg-white rounded-xl border border-sky-100 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Budget &amp; Funding</span>
                                    <p className="text-xs font-bold text-emerald-800 mt-0.5">{project.estimatedBudget.toLocaleString()} ETB</p>
                                    <p className="text-[11px] text-slate-500 truncate" title={project.fundingSource}>{project.fundingSource}</p>
                                </div>
                                <div className="p-3.5 bg-white rounded-xl border border-sky-100 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Coverage</span>
                                    <p className="text-xs font-bold text-slate-900 mt-0.5">{project.populationCoverage.toLocaleString()} People</p>
                                    <p className="text-[11px] text-slate-500">{project.dailyDemandEstimate ? `${project.dailyDemandEstimate} m³/day` : 'Demand estimated'}</p>
                                </div>
                                <div className="p-3.5 bg-white rounded-xl border border-sky-100 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Environmental Risk</span>
                                    <p className="mt-0.5">
                                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${project.environmentalRiskLevel === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                project.environmentalRiskLevel === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                            {project.environmentalRiskLevel} Risk
                                        </span>
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-1">EIA Clearance: {project.eiaConducted ? 'Yes' : 'Pending'}</p>
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
                                        <span className="font-semibold text-slate-800">{project.sourceOfWater || 'N/A'} ({project.sourceReliability || 'Reliable'})</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Pumping / Power Source:</span>
                                        <span className="font-semibold text-slate-800">{project.energySource || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Intervention Type:</span>
                                        <span className="font-semibold text-slate-800">{project.typeOfIntervention}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Reservoir / Storage Requirement:</span>
                                        <span className="font-semibold text-slate-800">{project.storageRequirement ? `${project.storageRequirement} m³` : 'Standard tank'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Distribution Pipe Network:</span>
                                        <span className="font-semibold text-slate-800">{project.pipeLengthEstimation ? `${project.pipeLengthEstimation} km` : 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Implementing Entity:</span>
                                        <span className="font-semibold text-slate-800">{project.implementingBody}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">WASHCO Status:</span>
                                        <span className="font-semibold text-slate-800">{project.washcoExists ? 'Formed & Registered' : 'Not yet organized'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Land Acquisition / RoW:</span>
                                        <span className="font-semibold text-slate-800">{project.landOwnershipCleared ? 'Cleared & Consented' : 'In Progress'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">GPS Coordinates:</span>
                                        <span className="font-mono text-slate-700">{project.gpsCoordinates.lat.toFixed(4)}° N, {project.gpsCoordinates.long.toFixed(4)}° E</span>
                                    </div>
                                </div>
                            </div>

                            {/* Feasibility Study Summary */}
                            <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-2xs space-y-3">
                                <h4 className="text-xs font-bold text-ocean-950 uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                    Feasibility &amp; Environmental Verification
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <span className="font-bold text-slate-800 block">Feasibility Study Status:</span>
                                        <p className="text-slate-600 mt-1">
                                            {project.feasibilityStudyConducted ? `Conducted by ${project.feasibilityConsultant || 'OWEB In-house Team'}` : 'Feasibility study pending submission'}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <span className="font-bold text-slate-800 block">EIA Environmental Status:</span>
                                        <p className="text-slate-600 mt-1">
                                            {project.eiaConducted ? `Approved by ${project.eiaApprovalAuthority || 'Regional Environmental Protection Authority'}` : 'EIA documentation under preparation'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>)}

                    {/* TAB 2: 5-PILLAR APPRAISAL SCORECARD */}
                    {activeTab === 'scorecard' && (<div className="space-y-6">
                            {/* Score Summary Box */}
                            <div className="p-4 bg-white rounded-xl border border-sky-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overall Bureau Appraisal Rating</span>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-3xl font-black text-ocean-950">{totalScore} <span className="text-sm font-normal text-slate-400">/ 100</span></span>
                                        <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${qualificationGrade.color}`}>
                                            {qualificationGrade.grade} • {qualificationGrade.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 text-right">
                                    <p>Passing Mark: <span className="font-bold text-slate-700">70 / 100</span></p>
                                    <p>Minimum 14 pts per pillar required</p>
                                </div>
                            </div>

                            {/* 5 Pillars Sliders */}
                            <div className="space-y-4">
                                {/* Pillar 1 */}
                                <div className="p-4 bg-white rounded-xl border border-sky-100 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h5 className="text-xs font-bold text-slate-900">1. Hydrological Feasibility &amp; Source Yield (Max: 20 pts)</h5>
                                            <p className="text-[11px] text-slate-500">Source safe discharge rate, seasonal fluctuation, water quality chemical/microbial compliance.</p>
                                        </div>
                                        <span className="text-sm font-extrabold text-cyan-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                                            {scores.hydrology} / 20
                                        </span>
                                    </div>
                                    <input type="range" min={0} max={20} value={scores.hydrology} onChange={(e) => handleScoreChange('hydrology', Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"/>
                                </div>

                                {/* Pillar 2 */}
                                <div className="p-4 bg-white rounded-xl border border-sky-100 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h5 className="text-xs font-bold text-slate-900">2. Hydraulic Engineering Design &amp; Sizing (Max: 20 pts)</h5>
                                            <p className="text-[11px] text-slate-500">Pipe hydraulic calculations, reservoir storage adequacy, pump power requirement, pressure ratings.</p>
                                        </div>
                                        <span className="text-sm font-extrabold text-cyan-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                                            {scores.engineering} / 20
                                        </span>
                                    </div>
                                    <input type="range" min={0} max={20} value={scores.engineering} onChange={(e) => handleScoreChange('engineering', Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"/>
                                </div>

                                {/* Pillar 3 */}
                                <div className="p-4 bg-white rounded-xl border border-sky-100 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h5 className="text-xs font-bold text-slate-900">3. Environmental &amp; Social Safeguards (EIA) (Max: 20 pts)</h5>
                                            <p className="text-[11px] text-slate-500">Catchment conservation plan, land acquisition documentation, environmental mitigation measures.</p>
                                        </div>
                                        <span className="text-sm font-extrabold text-cyan-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                                            {scores.eia} / 20
                                        </span>
                                    </div>
                                    <input type="range" min={0} max={20} value={scores.eia} onChange={(e) => handleScoreChange('eia', Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"/>
                                </div>

                                {/* Pillar 4 */}
                                <div className="p-4 bg-white rounded-xl border border-sky-100 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h5 className="text-xs font-bold text-slate-900">4. Community WASHCO &amp; Institutional Readiness (Max: 20 pts)</h5>
                                            <p className="text-[11px] text-slate-500">WASHCO committee legalization, tariff cost-recovery model, operator availability, spare parts supply chain.</p>
                                        </div>
                                        <span className="text-sm font-extrabold text-cyan-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                                            {scores.washco} / 20
                                        </span>
                                    </div>
                                    <input type="range" min={0} max={20} value={scores.washco} onChange={(e) => handleScoreChange('washco', Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"/>
                                </div>

                                {/* Pillar 5 */}
                                <div className="p-4 bg-white rounded-xl border border-sky-100 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h5 className="text-xs font-bold text-slate-900">5. Cost Economics, Per-Capita Benchmark &amp; BOQ (Max: 20 pts)</h5>
                                            <p className="text-[11px] text-slate-500">Unit cost per beneficiary within regional guidelines, BOQ market price realism, donor funding agreement.</p>
                                        </div>
                                        <span className="text-sm font-extrabold text-cyan-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                                            {scores.economics} / 20
                                        </span>
                                    </div>
                                    <input type="range" min={0} max={20} value={scores.economics} onChange={(e) => handleScoreChange('economics', Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"/>
                                </div>
                            </div>
                        </div>)}

                    {/* TAB 3: ATTACHED DOCUMENTS */}
                    {activeTab === 'documents' && (<div className="space-y-4">
                            <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-2xs">
                                <h4 className="text-xs font-bold text-ocean-950 uppercase tracking-wider mb-3">
                                    Project Feasibility &amp; Safeguard Artifacts
                                </h4>
                                {allProjectDocs.length === 0 ? (<div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                        </svg>
                                        <p className="text-xs font-semibold text-slate-600">No project attachments uploaded</p>
                                        <p className="text-[11px] text-slate-400">The planner did not attach external PDF studies during submission.</p>
                                    </div>) : (<div className="divide-y divide-slate-100">
                                        {allProjectDocs.map((doc) => (<div key={doc.id} className="py-3 flex items-center justify-between text-xs">
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
                                                <a href={doc.fileUrl} download={doc.fileName} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-sky-50 text-cyan-700 hover:bg-sky-100 rounded-lg font-bold transition-colors cursor-pointer">
                                                    Download Artifact
                                                </a>
                                            </div>))}
                                    </div>)}
                            </div>
                        </div>)}

                    {/* TAB 4: AI RISK & CRITIQUE */}
                    {activeTab === 'ai_critique' && (<div className="space-y-4">
                            <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-2xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="p-1.5 bg-cyan-100 text-cyan-800 rounded-lg">
                                            {React.cloneElement(ICONS.sparkles, { className: 'w-4 h-4' })}
                                        </span>
                                        <h4 className="text-xs font-bold text-ocean-950 uppercase tracking-wider">
                                            Gemini AI Technical Risk Scrutiny
                                        </h4>
                                    </div>
                                    <button type="button" onClick={handleReanalyzeWithAI} disabled={isReevaluatingAI} className="px-3 py-1 text-xs font-bold text-cyan-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                                        {isReevaluatingAI ? 'Scrutinizing...' : 'Re-evaluate with AI'}
                                    </button>
                                </div>

                                {aiAssessment ? (<div className="space-y-3 text-xs">
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <span className="font-bold text-slate-700 block mb-1">Identified Potential Risk Factors:</span>
                                            <ul className="list-disc list-inside space-y-1 text-slate-600">
                                                {aiAssessment.keyRisks?.map((risk, idx) => (<li key={idx}>{risk}</li>))}
                                            </ul>
                                        </div>
                                        <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                                            <span className="font-bold text-emerald-900 block mb-1">Recommended Mitigation Directives:</span>
                                            <ul className="list-disc list-inside space-y-1 text-emerald-800">
                                                {aiAssessment.mitigationStrategies?.map((strat, idx) => (<li key={idx}>{strat}</li>))}
                                            </ul>
                                        </div>
                                    </div>) : (<p className="text-xs text-slate-400 italic">No automated AI risk analysis generated yet.</p>)}

                                {project.summary && (<div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 text-xs text-slate-700">
                                        <span className="font-bold text-ocean-900 block mb-1">Executive Scheme Synopsis:</span>
                                        <p className="italic leading-relaxed">{project.summary}</p>
                                    </div>)}
                            </div>
                        </div>)}

                    {/* TAB 5: ACTION DECK & ENDORSEMENT DECISION */}
                    {activeTab === 'action' && (<div className="space-y-5">
                            {/* Required Revision Points (if requesting revisions) */}
                            <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-2xs space-y-3">
                                <h4 className="text-xs font-bold text-ocean-950 uppercase tracking-wider flex items-center justify-between">
                                    <span>Technical Revision Directives (For Planner Resubmission)</span>
                                    <span className="text-[11px] font-normal text-slate-400">({revisionRequirements.length} points)</span>
                                </h4>
                                <div className="space-y-2">
                                    {revisionRequirements.map((req, idx) => (<div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200">
                                            <span className="text-slate-700 font-medium">• {req}</span>
                                            <button type="button" onClick={() => handleRemoveRevisionItem(idx)} className="text-rose-600 hover:text-rose-800 font-bold ml-2 cursor-pointer">
                                                ✕
                                            </button>
                                        </div>))}
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <input type="text" placeholder="Add required revision directive..." value={newRevisionItem} onChange={(e) => setNewRevisionItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRevisionItem())} className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500"/>
                                    <button type="button" onClick={handleAddRevisionItem} className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer">
                                        Add Note
                                    </button>
                                </div>
                            </div>

                            {/* Comments Box */}
                            <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-2xs space-y-2">
                                <label className="block text-xs font-bold text-ocean-950 uppercase tracking-wider">
                                    Formal Appraisal Committee Remarks &amp; Recommendation Minutes (Mandatory)
                                </label>
                                <textarea rows={4} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Enter detailed technical findings, justifications, conditions, or reasons for decision..." className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-slate-800 leading-relaxed font-medium"/>
                            </div>

                            {/* Certificate preview trigger if approved */}
                            {project.status === ProjectStatus.APPROVED && (<div className="flex justify-end">
                                    <button type="button" onClick={() => setShowCertPreview(true)} className="px-4 py-2 text-xs font-bold text-cyan-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer">
                                        <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                        </svg>
                                        View Bureau Technical Approval Certificate
                                    </button>
                                </div>)}
                        </div>)}
                </div>

                {/* Modal Action Bar */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                        Close Window
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Request Revision */}
                        <button type="button" onClick={() => handleAction(ProjectStatus.UNDER_REVIEW, 'Revision Requested')} className="px-4 py-2.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 active:bg-amber-300 border border-amber-300 rounded-xl transition-colors shadow-2xs cursor-pointer">
                            Request Revisions
                        </button>

                        {/* Reject */}
                        <button type="button" onClick={() => handleAction(ProjectStatus.REJECTED, 'Rejected')} className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-colors shadow-2xs cursor-pointer">
                            Reject Submission
                        </button>

                        {/* Approve & Forward to Procurement */}
                        <button type="button" onClick={() => handleAction(ProjectStatus.APPROVED, totalScore >= 85 ? 'Approved' : 'Conditional')} className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
                            {React.cloneElement(ICONS.checkCircle, { className: 'w-4 h-4' })}
                            <span>Approve &amp; Endorse for Procurement</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Certificate Preview Popup */}
            {showCertPreview && (<ApprovalCertificateModal project={project} onClose={() => setShowCertPreview(false)}/>)}
        </div>);
};
// Main Review Module Container
const ReviewModule = ({ projects = [], documents = [], onUpdateProject, currentUser }) => {
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
            // Status Tab
            if (statusTab === 'PENDING' && p.status !== ProjectStatus.SUBMITTED)
                return false;
            if (statusTab === 'UNDER_REVIEW' && p.status !== ProjectStatus.UNDER_REVIEW)
                return false;
            if (statusTab === 'APPROVED' && p.status !== ProjectStatus.APPROVED)
                return false;
            if (statusTab === 'REJECTED' && p.status !== ProjectStatus.REJECTED)
                return false;
            // Zone
            if (zoneFilter !== 'ALL' && p.zone !== zoneFilter)
                return false;
            // Sector
            if (sectorFilter !== 'ALL' && p.projectType !== sectorFilter)
                return false;
            // Search
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matches = p.name.toLowerCase().includes(q) ||
                    p.id.toLowerCase().includes(q) ||
                    p.zone.toLowerCase().includes(q) ||
                    p.woreda.toLowerCase().includes(q) ||
                    (p.creator && p.creator.toLowerCase().includes(q));
                if (!matches)
                    return false;
            }
            return true;
        });
    }, [safeProjects, statusTab, zoneFilter, sectorFilter, searchQuery]);
    return (<div className="space-y-6">
            {/* Header & KPI Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div onClick={() => setStatusTab('PENDING')} className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${statusTab === 'PENDING'
            ? 'bg-gradient-to-tr from-cyan-600 to-sky-600 text-white border-transparent'
            : 'bg-white text-slate-800 border-sky-100 hover:border-cyan-300'}`}>
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

                <div onClick={() => setStatusTab('UNDER_REVIEW')} className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${statusTab === 'UNDER_REVIEW'
            ? 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white border-transparent'
            : 'bg-white text-slate-800 border-sky-100 hover:border-amber-300'}`}>
                    <span className={`text-[11px] font-bold uppercase tracking-wider block ${statusTab === 'UNDER_REVIEW' ? 'text-amber-100' : 'text-slate-500'}`}>
                        Under Review / Clarification
                    </span>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-2xl font-black">{underReviewCount}</span>
                        <span className={`p-2 rounded-xl text-xs font-bold ${statusTab === 'UNDER_REVIEW' ? 'bg-white/20' : 'bg-amber-50 text-amber-700'}`}>
                            {React.cloneElement(ICONS.clock, { className: 'w-5 h-5' })}
                        </span>
                    </div>
                </div>

                <div onClick={() => setStatusTab('APPROVED')} className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${statusTab === 'APPROVED'
            ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white border-transparent'
            : 'bg-white text-slate-800 border-sky-100 hover:border-emerald-300'}`}>
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

                <div onClick={() => setStatusTab('REJECTED')} className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${statusTab === 'REJECTED'
            ? 'bg-gradient-to-tr from-rose-600 to-pink-600 text-white border-transparent'
            : 'bg-white text-slate-800 border-sky-100 hover:border-rose-300'}`}>
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
                                Project Technical Review &amp; Bureau Appraisal
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Scrutinize water scheme feasibility, hydraulic parameters, EIA safeguards, and endorse verified proposals for procurement.
                            </p>
                        </div>

                        {/* Status Quick Pills */}
                        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                            {['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ALL'].map(tab => (<button key={tab} onClick={() => setStatusTab(tab)} className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusTab === tab
                ? 'bg-white text-ocean-950 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'}`}>
                                    {tab === 'PENDING' && `Pending (${pendingCount})`}
                                    {tab === 'UNDER_REVIEW' && `In Review (${underReviewCount})`}
                                    {tab === 'APPROVED' && `Approved (${approvedCount})`}
                                    {tab === 'REJECTED' && `Rejected (${rejectedCount})`}
                                    {tab === 'ALL' && `All (${safeProjects.length})`}
                                </button>))}
                        </div>
                    </div>

                    {/* Filter Inputs Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                        {/* Search Input */}
                        <div className="relative">
                            <input type="text" placeholder="Search by Project Name, ID, Woreda, Creator..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-slate-800"/>
                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                        </div>

                        {/* Zone Filter */}
                        <div>
                            <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-slate-700 font-medium">
                                <option value="ALL">All Oromia Zones</option>
                                {ZONES.map(z => (<option key={z} value={z}>{z} Zone</option>))}
                            </select>
                        </div>

                        {/* Sector Filter */}
                        <div>
                            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-slate-700 font-medium">
                                <option value="ALL">All Water Sectors</option>
                                {Object.keys(PROJECT_TYPES).map(t => (<option key={t} value={t}>{t}</option>))}
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
                                <th className="px-4 py-3.5">Safeguards &amp; Risk</th>
                                <th className="px-4 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-center">Appraisal Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProjects.length === 0 ? (<tr>
                                    <td colSpan={7} className="text-center py-16 text-slate-400">
                                        <div className="max-w-xs mx-auto space-y-2">
                                            <svg className="w-8 h-8 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                            </svg>
                                            <p className="text-xs font-bold text-slate-700">No project submissions found</p>
                                            <p className="text-[11px] text-slate-400">Adjust the selected status tab or filters above to review project proposals.</p>
                                        </div>
                                    </td>
                                </tr>) : (filteredProjects.map((p) => {
            const hasDocs = documents.some(d => d.projectId === p.id);
            return (<tr key={p.id} className="hover:bg-sky-50/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                                                <div className="text-[11px] font-mono text-cyan-800 flex items-center gap-1.5 mt-0.5">
                                                    <span>{p.id}</span>
                                                    {hasDocs && (<span className="text-[10px] bg-sky-100 text-cyan-800 px-1.5 py-0.2 rounded font-sans font-medium" title="Attachments available">
                                                            📎 Docs attached
                                                        </span>)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-slate-700 whitespace-nowrap">
                                                <span className="font-medium text-slate-900">{p.zone}</span>
                                                <span className="text-slate-400 block text-[11px]">{p.woreda || 'Unassigned'}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-slate-600">
                                                <span className="font-semibold text-slate-800">{p.projectType}</span>
                                                <span className="text-slate-400 block text-[11px] truncate max-w-xs">{p.projectSubType}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs font-extrabold text-emerald-800 whitespace-nowrap">
                                                {p.estimatedBudget.toLocaleString()} ETB
                                                <span className="text-[10px] font-normal text-slate-400 block">{p.fundingSource || 'Regional Treasury'}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs">
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${p.environmentalRiskLevel === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    p.environmentalRiskLevel === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                    {p.environmentalRiskLevel} Risk
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs">
                                                <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${p.status === ProjectStatus.APPROVED ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    p.status === ProjectStatus.REJECTED ? 'bg-rose-50 text-rose-800 border-rose-200' :
                        p.status === ProjectStatus.UNDER_REVIEW ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            'bg-sky-50 text-cyan-800 border-sky-200'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button type="button" onClick={() => setSelectedProject(p)} className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 active:from-cyan-800 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1">
                                                        {React.cloneElement(ICONS.fileSignature, { className: 'w-3.5 h-3.5' })}
                                                        <span>{p.status === ProjectStatus.APPROVED ? 'View Appraisal' : 'Appraise'}</span>
                                                    </button>

                                                    {p.status === ProjectStatus.APPROVED && (<button type="button" onClick={() => setSelectedCertProject(p)} className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors cursor-pointer" title="Print Technical Approval Certificate">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                                                            </svg>
                                                        </button>)}
                                                </div>
                                            </td>
                                        </tr>);
        }))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
            {selectedProject && (<ProjectReviewModal project={selectedProject} documents={documents} onClose={() => setSelectedProject(null)} onUpdateProject={onUpdateProject} currentUser={currentUser}/>)}

            {/* Standalone Certificate Modal */}
            {selectedCertProject && (<ApprovalCertificateModal project={selectedCertProject} onClose={() => setSelectedCertProject(null)}/>)}
        </div>);
};
export default ReviewModule;
