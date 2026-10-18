import React, { useState, useMemo, useEffect } from 'react';
import { Priority } from '../types';
import { CURRENCIES, DELIVERABLE_CATEGORIES, AMENDMENT_TYPES, VARIATION_STATUSES, CLAIM_SOURCES, CLAIM_STATUSES, ICONS, PRIORITIES } from '../constants';
import { getDeliverableCategories, getAmendmentTypes, getCurrencies } from '../services/masterDataLookups';
import { Section, Input, Select, Checkbox, TextArea } from './FormControls';
import ContractTimeline from './ContractTimeline';
import { GanttTimelineChart } from './GanttTimelineChart';
import { evaluateContractDeadlines } from '../utils/contractNotificationHelper';
const initialContractState = {
    contractManager: '',
    cmPlanAssignmentDate: '',
    cmActualAssignmentDate: '',
    cmRemarks: '',
    supervisor: '',
    supervisorPlanAssignmentDate: '',
    supervisorActualAssignmentDate: '',
    supervisorRemarks: '',
    performanceSecurityPlanDate: '',
    performanceSecurityActualDate: '',
    performanceSecurityExpiryDate: '',
    performanceBondAmount: 0,
    performanceBondCurrency: 'ETB',
    performanceGuaranteeUrl: '',
    signingDate: '',
    signedContractUrl: '',
    disputeBoardInPlace: false,
    commencementPlanDate: '',
    commencementActualDate: '',
    siteHandoverPlanDate: '',
    siteHandoverActualDate: '',
    siteHandoverDocsUrl: '',
    seashConferencePlanDate: '',
    seashConferenceActualDate: '',
    seashConferenceRecordsUrl: '',
    kpis: [],
    deliverables: [],
    payments: [],
    variations: [],
    claims: [],
    plannedCompletionDate: '',
    isPlanFinalized: false,
};
const ContractFinancialSummary = ({ contractAmount, variations, payments }) => {
    const totalVariationCost = useMemo(() => variations.reduce((sum, v) => sum + (v.status === 'Approved' ? v.costImpact : 0), 0), [variations]);
    const revisedAmount = contractAmount + totalVariationCost;
    const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + (p.actualAmount || 0), 0), [payments]);
    const balance = revisedAmount - totalPaid;
    const paidPercentage = revisedAmount > 0 ? (totalPaid / revisedAmount) * 100 : 0;
    const formatCurrency = (amount) => `${amount.toLocaleString()} ETB`;
    return (<div className="bg-white p-6 rounded-2xl border border-light-border shadow-card mb-6">
            <h3 className="text-lg font-semibold text-text-dark mb-4">Financial Health</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div>
                    <p className="text-sm text-text-light">Original Amount</p>
                    <p className="font-bold text-lg text-text-dark">{formatCurrency(contractAmount)}</p>
                </div>
                 <div>
                    <p className="text-sm text-text-light">Revised Amount</p>
                    <p className="font-bold text-lg text-primary">{formatCurrency(revisedAmount)}</p>
                </div>
                <div>
                    <p className="text-sm text-text-light">Total Paid</p>
                    <p className="font-bold text-lg text-success">{formatCurrency(totalPaid)}</p>
                </div>
                <div>
                   <p className="text-sm text-text-light">Balance</p>
                    <p className="font-bold text-lg text-text-dark">{formatCurrency(balance)}</p>
                </div>
            </div>
            <div className="mt-4">
                <p className="text-sm text-text-light mb-1">Payment Progress</p>
                <div className="w-full bg-light-hover rounded-full h-2.5">
                    <div className="bg-success h-2.5 rounded-full" style={{ width: `${paidPercentage}%` }}></div>
                </div>
                <p className="text-right text-sm font-semibold text-text-dark mt-1">{paidPercentage.toFixed(1)}% Paid</p>
            </div>
        </div>);
};
const ContractModule = ({ procurements, onAddContract, onUpdateContract, contractToEdit, users, documents: allDocuments, projects = [], contracts = [], masterData }) => {
    const isEditMode = !!contractToEdit;
    const [contractViewMode, setContractViewMode] = useState('form');
    const [selectedProcurementId, setSelectedProcurementId] = useState('');
    const [contract, setContract] = useState(initialContractState);
    const [activeTab, setActiveTab] = useState('formation');
    const [priorityFilter, setPriorityFilter] = useState('All');

    const deliverableCategoryOptions = useMemo(() => getDeliverableCategories(masterData).map(c => ({ value: c, label: c })), [masterData]);
    const amendmentTypeOptions = useMemo(() => getAmendmentTypes(masterData).map(t => ({ value: t, label: t })), [masterData]);
    const currencyOptions = useMemo(() => getCurrencies(masterData).map(c => ({ value: c, label: c })), [masterData]);
    useEffect(() => {
        if (contractToEdit) {
            setContract(contractToEdit);
            setSelectedProcurementId(contractToEdit.procurementId);
        }
        else {
            setContract(initialContractState);
            setSelectedProcurementId('');
            setActiveTab('formation');
        }
    }, [contractToEdit]);
    const { kpis, deliverables, payments, variations, claims, isPlanFinalized } = contract;
    const isContractActive = isPlanFinalized && !contract.completionDate;
    const selectedProcurement = useMemo(() => {
        return procurements.find(p => p.id === selectedProcurementId);
    }, [selectedProcurementId, procurements]);
    const projectDocuments = useMemo(() => {
        if (!selectedProcurement)
            return [];
        return allDocuments.filter(doc => doc.projectId === selectedProcurement.projectId);
    }, [allDocuments, selectedProcurement]);
    const contractAmount = useMemo(() => {
        if (!selectedProcurement)
            return 0;
        const awardedBidder = selectedProcurement.bidders.find(b => b.id === selectedProcurement.awardedBidderId);
        return awardedBidder?.correctedPrice || 0;
    }, [selectedProcurement]);
    const totalPaymentPlanned = useMemo(() => {
        return payments.reduce((sum, p) => sum + p.amount, 0);
    }, [payments]);
    const contractManagerUsers = users.filter(u => u.role === 'Contract Manager').map(u => u.username);
    const supervisorUsers = users.filter(u => u.role === 'Supervisor').map(u => u.username);
    const handleContractChange = (e) => {
        const { name, value, type } = e.target;
        const checked = e.target.checked;
        setContract(c => ({ ...c, [name]: type === 'checkbox' ? checked : value }));
    };
    // --- KPI Management ---
    const addKpi = () => setContract(c => ({ ...c, kpis: [...c.kpis, { id: `K-${Date.now()}`, description: '', unitOfMeasurement: '', periodStartDate: '', periodEndDate: '', target: '' }] }));
    const updateKpi = (index, field, value) => {
        const newKpis = [...kpis];
        newKpis[index][field] = value;
        setContract(c => ({ ...c, kpis: newKpis }));
    };
    const removeKpi = (index) => setContract(c => ({ ...c, kpis: c.kpis.filter((_, i) => i !== index) }));
    // --- Deliverable Management ---
    const addDeliverable = () => setContract(c => ({ ...c, deliverables: [...c.deliverables, { id: `D-${Date.now()}`, name: '', priority: Priority.MEDIUM, category: 'Supply of Goods', plannedCompletionDate: '', linkedToPayments: false }] }));
    const updateDeliverable = (index, field, value) => {
        const newDeliverables = [...deliverables];
        newDeliverables[index][field] = value;
        setContract(c => ({ ...c, deliverables: newDeliverables }));
    };
    const removeDeliverable = (index) => setContract(c => ({ ...c, deliverables: c.deliverables.filter((_, i) => i !== index) }));
    // --- Payment Synchronization ---
    useEffect(() => {
        if (isPlanFinalized)
            return;
        const linkedDeliverables = deliverables.filter(d => d.linkedToPayments);
        const newPayments = linkedDeliverables.map(d => {
            const existingPayment = payments.find(p => p.deliverableId === d.id);
            return existingPayment || { deliverableId: d.id, plannedPaymentDate: '', amount: 0 };
        });
        setContract(c => ({ ...c, payments: newPayments }));
    }, [deliverables, isPlanFinalized]);
    const updatePayment = (deliverableId, field, value) => {
        const newPayments = payments.map(p => p.deliverableId === deliverableId ? { ...p, [field]: value } : p);
        setContract(c => ({ ...c, payments: newPayments }));
    };
    const getPaymentStatus = (payment) => {
        if (payment.actualAmount && payment.actualAmount >= payment.amount)
            return { text: 'Paid', color: '#16a34a' };
        if (payment.actualAmount && payment.actualAmount > 0)
            return { text: 'Partially Paid', color: '#f59e0b' };
        return { text: 'Pending', color: '#e2e8f0' };
    };
    // --- Variation Management ---
    const addVariation = () => setContract(c => ({ ...c, variations: [...c.variations, { id: `V-${Date.now()}`, date: '', description: '', type: 'Variation Order', status: 'Pending', costImpact: 0, timeImpactDays: 0 }] }));
    const updateVariation = (index, field, value) => {
        const newVariations = [...variations];
        newVariations[index][field] = value;
        setContract(c => ({ ...c, variations: newVariations }));
    };
    const removeVariation = (index) => setContract(c => ({ ...c, variations: c.variations.filter((_, i) => i !== index) }));
    // --- Claim Management ---
    const addClaim = () => setContract(c => ({ ...c, claims: [...c.claims, { id: `C-${Date.now()}`, date: '', source: 'Contractor', description: '', amount: 0, status: 'Submitted' }] }));
    const updateClaim = (index, field, value) => {
        const newClaims = [...claims];
        newClaims[index][field] = value;
        setContract(c => ({ ...c, claims: newClaims }));
    };
    const removeClaim = (index) => setContract(c => ({ ...c, claims: c.claims.filter((_, i) => i !== index) }));
    const finalizePlan = () => {
        if (contractAmount > 0 && totalPaymentPlanned > contractAmount) {
            alert("Error: Total planned payments cannot exceed the contract amount.");
            return;
        }
        setContract(c => ({ ...c, isPlanFinalized: true }));
    };
    const handleCompleteContract = () => {
        if (window.confirm("Are you sure you want to mark this contract as complete? This action cannot be undone.")) {
            const updatedContract = { ...contract, completionDate: new Date().toISOString().split('T')[0] };
            onUpdateContract(updatedContract);
        }
    };
    const handleSubmit = () => {
        if (!isPlanFinalized && !isEditMode) {
            alert("Please finalize the plan before saving the contract.");
            return;
        }
        if (isEditMode) {
            onUpdateContract(contract);
        }
        else {
            if (!selectedProcurement) {
                alert('Please select a procurement record.');
                return;
            }
            const finalContract = {
                ...contract,
                id: `CON-${selectedProcurement.id}`,
                projectId: selectedProcurement.projectId,
                procurementId: selectedProcurement.id,
            };
            onAddContract(finalContract);
        }
    };
    const PRIORITY_STYLES = {
        [Priority.HIGH]: 'bg-danger-light text-danger',
        [Priority.MEDIUM]: 'bg-warning-light text-warning-dark',
        [Priority.LOW]: 'bg-success-light text-success-dark',
    };
    const filteredDeliverables = useMemo(() => {
        if (priorityFilter === 'All') {
            return deliverables;
        }
        return deliverables.filter(d => d.priority === priorityFilter);
    }, [deliverables, priorityFilter]);
    if (procurements.length === 0 && !isEditMode) {
        return <div className="p-4 bg-primary-light text-primary rounded-lg">No awarded procurements available to create a contract.</div>;
    }
    const TABS = [
        { id: 'formation', label: 'Formation' },
        { id: 'implementation', label: 'Implementation' },
        { id: 'variations', label: 'Variations & Claims' },
    ];
    if (isEditMode) {
        TABS.push({ id: 'timeline', label: 'Timeline' });
    }
    TABS.push({ id: 'completion', label: 'Completion' });
    const deadlineStatus = useMemo(() => {
        if (!isEditMode || !contractToEdit)
            return null;
        return evaluateContractDeadlines(contractToEdit);
    }, [isEditMode, contractToEdit]);
    return (<div className="space-y-6">
            {/* Top View Mode Switcher Header */}
            <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-tr from-cyan-600 to-sky-600 rounded-xl text-white shadow-xs">
                        {React.cloneElement(ICONS.contract, { className: 'w-6 h-6 text-white' })}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-ocean-950">Contract Management &amp; Execution</h2>
                        <p className="text-xs text-slate-500">
                            Oversee contract formation, supervisor delegation, deliverable milestones, variations, and critical path schedules.
                        </p>
                    </div>
                </div>

                <div className="inline-flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
                    <button type="button" onClick={() => setContractViewMode('form')} className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${contractViewMode === 'form'
            ? 'bg-white text-primary-700 shadow-xs font-extrabold'
            : 'text-slate-600 hover:text-slate-900'}`}>
                        <span>📋</span>
                        <span>{isEditMode ? 'Contract Admin Form' : 'Contract Formation Form'}</span>
                    </button>
                    <button type="button" onClick={() => setContractViewMode('gantt')} className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${contractViewMode === 'gantt'
            ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-xs font-extrabold'
            : 'text-slate-600 hover:text-slate-900'}`}>
                        <span>📊</span>
                        <span>Contracts Portfolio Gantt &amp; Critical Path</span>
                    </button>
                </div>
            </div>

            {contractViewMode === 'gantt' ? (<div className="space-y-6">
                    <GanttTimelineChart projects={projects} contracts={contracts} procurements={procurements} moduleMode="contracts" customTitle="Contracts Portfolio Schedule & Critical Path Matrix" customSubtitle="Monitor contract execution milestones, variation time impacts, contractor deliverables, and critical path dependencies." defaultStatusFilter="all"/>
                </div>) : (<div>
                    {isEditMode && <ContractFinancialSummary contractAmount={contractAmount} variations={variations} payments={payments}/>}

            {deadlineStatus && deadlineStatus.flaggedReasons.length > 0 && (<div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm flex items-start gap-3.5 animate-fade-in">
                    <div className="p-2 bg-amber-200/70 rounded-xl text-amber-800 flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-amber-950">Contract Milestone Alert (Within 30 Days)</h4>
                            <span className="text-xs font-bold text-amber-800">
                                · Action Required
                            </span>
                        </div>
                        <ul className="mt-1.5 space-y-1 text-xs text-amber-800">
                            {deadlineStatus.flaggedReasons.map((reason, rIdx) => (<li key={rIdx} className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"/>
                                    <span>{reason}</span>
                                </li>))}
                        </ul>
                    </div>
                </div>)}

            <Section title={isEditMode ? `Editing Contract: ${contractToEdit.id}` : "Create New Contract"}>
                {!isEditMode && (<div className="mb-6">
                        <Select label="Select Awarded Procurement" value={selectedProcurementId} onChange={(e) => setSelectedProcurementId(e.target.value)} disabled={isEditMode}>
                            <option value="">-- Select Record --</option>
                            {procurements.map(p => <option key={p.id} value={p.id}>{p.id} (Project: {p.projectId})</option>)}
                        </Select>
                         {contractAmount > 0 &&
                    <div className="mt-4 p-3 bg-primary-light rounded-md text-primary">
                                Total Contract Amount: <strong>{contractAmount.toLocaleString()} ETB</strong>
                            </div>}
                    </div>)}
                
                 {selectedProcurementId && <>
                    <div className="border-b border-light-border mb-6">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            {TABS.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                     ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-dark hover:border-gray-300'}`}>{tab.label}</button>))}
                        </nav>
                    </div>

                    <div key={activeTab} className="animate-fade-in-up">
                    {activeTab === 'formation' && (<div className="space-y-8">
                             <div className="grid md:grid-cols-2 gap-x-8">
                                <div>
                                     <h4 className="font-semibold text-md mb-3 text-text-dark">Contract Manager</h4>
                                     <div className="space-y-4">
                                        <Select label="Manager Name" name="contractManager" value={contract.contractManager || ''} onChange={handleContractChange} options={contractManagerUsers}/>
                                        <Input label="Planned Assignment Date" name="cmPlanAssignmentDate" type="date" value={contract.cmPlanAssignmentDate || ''} onChange={handleContractChange}/>
                                        <Input label="Actual Assignment Date" name="cmActualAssignmentDate" type="date" value={contract.cmActualAssignmentDate || ''} onChange={handleContractChange}/>
                                        <TextArea label="Remarks" name="cmRemarks" rows={2} value={contract.cmRemarks || ''} onChange={handleContractChange}/>
                                     </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-md mb-3 text-text-dark">Supervisor</h4>
                                     <div className="space-y-4">
                                        <Select label="Supervisor Name" name="supervisor" value={contract.supervisor || ''} onChange={handleContractChange} options={supervisorUsers}/>
                                        <Input label="Planned Assignment Date" name="supervisorPlanAssignmentDate" type="date" value={contract.supervisorPlanAssignmentDate || ''} onChange={handleContractChange}/>
                                        <Input label="Actual Assignment Date" name="supervisorActualAssignmentDate" type="date" value={contract.supervisorActualAssignmentDate || ''} onChange={handleContractChange}/>
                                         <TextArea label="Remarks" name="supervisorRemarks" rows={2} value={contract.supervisorRemarks || ''} onChange={handleContractChange}/>
                                     </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-md mb-3 mt-8 text-text-dark">Performance Security</h4>
                                 <div className="grid md:grid-cols-3 gap-6">
                                    <Input label="Planned Submission Date" name="performanceSecurityPlanDate" type="date" value={contract.performanceSecurityPlanDate || ''} onChange={handleContractChange}/>
                                    <Input label="Actual Submission Date" name="performanceSecurityActualDate" type="date" value={contract.performanceSecurityActualDate || ''} onChange={handleContractChange}/>
                                    <Input label="Expiry Date" name="performanceSecurityExpiryDate" type="date" value={contract.performanceSecurityExpiryDate || ''} onChange={handleContractChange}/>
                                    <Input label="Bond Amount" name="performanceBondAmount" type="number" value={contract.performanceBondAmount || ''} onChange={handleContractChange}/>
                                    <Select label="Currency" name="performanceBondCurrency" options={currencyOptions} value={contract.performanceBondCurrency} onChange={handleContractChange}/>
                                    <Input label="Guarantee Document URL" name="performanceGuaranteeUrl" value={contract.performanceGuaranteeUrl || ''} onChange={handleContractChange}/>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-md mb-3 mt-8 text-text-dark">Key Contract Dates</h4>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <Input label="Contract Signing Date" name="signingDate" type="date" value={contract.signingDate || ''} onChange={handleContractChange}/>
                                    <Input label="Commencement Planned Date" name="commencementPlanDate" type="date" value={contract.commencementPlanDate || ''} onChange={handleContractChange}/>
                                    <Input label="Planned Completion Date" name="plannedCompletionDate" type="date" value={contract.plannedCompletionDate || ''} onChange={handleContractChange}/>
                                    <Input label="Commencement Actual Date" name="commencementActualDate" type="date" value={contract.commencementActualDate || ''} onChange={handleContractChange}/>
                                    <Input label="Site Handover Planned Date" name="siteHandoverPlanDate" type="date" value={contract.siteHandoverPlanDate || ''} onChange={handleContractChange}/>
                                    <Input label="Site Handover Actual Date" name="siteHandoverActualDate" type="date" value={contract.siteHandoverActualDate || ''} onChange={handleContractChange}/>
                                </div>
                            </div>
                        </div>)}
                    
                     {activeTab === 'implementation' && (<div>
                             {/* KPIs, Deliverables, Payments */}
                             <h4 className="font-semibold text-md mb-3 text-text-dark">Key Performance Indicators (KPIs)</h4>
                            {kpis.map((kpi, index) => (<div key={kpi.id} className="grid md:grid-cols-3 gap-4 p-4 border rounded-xl mb-4 relative border-light-border bg-light-main fade-in">
                                    <button onClick={() => removeKpi(index)} className="absolute top-3 right-3 text-danger hover:text-opacity-80 font-bold text-2xl" disabled={isPlanFinalized}>&times;</button>
                                    <Input label="KPI Description" value={kpi.description} onChange={e => updateKpi(index, 'description', e.target.value)} disabled={isPlanFinalized}/>
                                    <Input label="Unit" value={kpi.unitOfMeasurement} onChange={e => updateKpi(index, 'unitOfMeasurement', e.target.value)} disabled={isPlanFinalized}/>
                                    <Input label="Target" value={kpi.target} onChange={e => updateKpi(index, 'target', e.target.value)} disabled={isPlanFinalized}/>
                                </div>))}
                            <button onClick={addKpi} className="mt-2 px-4 py-2 bg-primary-light text-primary rounded-lg hover:bg-opacity-90 font-medium transition-colors" disabled={isPlanFinalized}>+ Add KPI</button>

                            <h4 className="font-semibold text-md mb-3 mt-8 text-text-dark">Deliverables</h4>
                            {isPlanFinalized && (<div className="flex items-center gap-2 mb-4">
                                    <span className="text-sm font-medium text-text-light">Filter priority:</span>
                                    {['All', ...PRIORITIES].map(p => (<button key={p} onClick={() => setPriorityFilter(p)} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${priorityFilter === p ? 'bg-primary text-white shadow-sm' : 'bg-light-hover text-text-dark hover:bg-light-border'}`}>
                                            {p}
                                        </button>))}
                                </div>)}
                            {isPlanFinalized ? (filteredDeliverables.length > 0 ? (filteredDeliverables.map((d) => {
                        const originalIndex = deliverables.findIndex(originalD => originalD.id === d.id);
                        return (<div key={d.id} className={`flex items-center justify-between p-4 border rounded-xl mb-2 transition-all duration-300 ${d.actualCompletionDate ? 'bg-green-100' : 'bg-light-main'}`}>
                                                <div className="flex items-center">
                                                    <Checkbox id={`complete-${d.id}`} checked={!!d.actualCompletionDate} onChange={(e) => updateDeliverable(originalIndex, 'actualCompletionDate', e.target.checked ? new Date().toISOString().split('T')[0] : undefined)} disabled={!isContractActive}/>
                                                    <label htmlFor={`complete-${d.id}`} className="ml-3 cursor-pointer">
                                                        <p className={`font-medium text-text-dark transition-colors ${d.actualCompletionDate ? 'line-through text-text-light' : ''}`}>{d.name}</p>
                                                        <p className="text-sm text-text-light">
                                                            {d.category} - Planned: {d.plannedCompletionDate ? new Date(d.plannedCompletionDate).toLocaleDateString() : 'N/A'}
                                                        </p>
                                                        {(() => {
                                const linkedDoc = d.linkedDocumentId ? allDocuments.find(doc => doc.id === d.linkedDocumentId) : null;
                                if (!linkedDoc)
                                    return null;
                                return (<a href={linkedDoc.fileUrl} download={linkedDoc.fileName} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} // Prevent triggering checkbox
                                 className="inline-flex items-center text-xs text-primary hover:underline font-medium mt-1" title={linkedDoc.fileName}>
                                                                    {React.cloneElement(ICONS.paperclip, { className: 'w-3 h-3 mr-1' })}
                                                                    <span className="truncate max-w-xs">{linkedDoc.fileName}</span>
                                                                </a>);
                            })()}
                                                        {d.actualCompletionDate && (<p className="text-xs text-success font-semibold mt-1">
                                                                Completed: {new Date(d.actualCompletionDate).toLocaleDateString()}
                                                            </p>)}
                                                    </label>
                                                </div>
                                                <div className={`flex items-center gap-4 flex-shrink-0 transition-opacity ${d.actualCompletionDate ? 'opacity-50' : ''}`}>
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_STYLES[d.priority]}`}>{d.priority}</span>
                                                    {d.linkedToPayments && (<span className="text-xs font-bold text-primary bg-primary-light px-2 py-1 rounded-full">
                                                            PAYMENT LINKED
                                                         </span>)}
                                                </div>
                                            </div>);
                    })) : (<div className="text-center py-8 text-text-light">No deliverables match the selected priority.</div>)) : (deliverables.map((d, index) => (<div key={d.id} className="p-4 border rounded-xl mb-4 relative border-light-border bg-light-main items-end fade-in">
                                        <button onClick={() => removeDeliverable(index)} className="absolute top-3 right-3 text-danger hover:text-opacity-80 font-bold text-2xl" disabled={isPlanFinalized}>&times;</button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="lg:col-span-3">
                                                <Input label="Deliverable Name" value={d.name} onChange={e => updateDeliverable(index, 'name', e.target.value)} disabled={isPlanFinalized}/>
                                            </div>
                                            <Select label="Category" options={deliverableCategoryOptions} value={d.category} onChange={e => updateDeliverable(index, 'category', e.target.value)} disabled={isPlanFinalized}/>
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label htmlFor={`priority-${d.id}`} className="block text-sm font-medium text-text-light">Priority</label>
                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${PRIORITY_STYLES[d.priority]}`}>{d.priority}</span>
                                                </div>
                                                <select id={`priority-${d.id}`} name="priority" value={d.priority} onChange={e => updateDeliverable(index, 'priority', e.target.value)} disabled={isPlanFinalized} className="w-full px-4 py-2 bg-light-main border border-light-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary disabled:bg-gray-200 disabled:text-text-light">
                                                    {PRIORITIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                            <Input label="Planned Completion" type="date" value={d.plannedCompletionDate} onChange={e => updateDeliverable(index, 'plannedCompletionDate', e.target.value)} disabled={isPlanFinalized}/>
                                            <div className="lg:col-span-2">
                                                <Select label="Link Document (Optional)" value={d.linkedDocumentId || ''} onChange={e => updateDeliverable(index, 'linkedDocumentId', e.target.value || undefined)} disabled={isPlanFinalized || projectDocuments.length === 0}>
                                                    <option value="">{projectDocuments.length === 0 ? 'No documents for this project' : 'Select a document'}</option>
                                                    {projectDocuments.map(doc => (<option key={doc.id} value={doc.id}>{doc.fileName}</option>))}
                                                </Select>
                                            </div>
                                            <div className="self-center">
                                                <Checkbox label="Link to Payments?" id={`link-${d.id}`} checked={d.linkedToPayments} onChange={e => updateDeliverable(index, 'linkedToPayments', e.target.checked)} disabled={isPlanFinalized}/>
                                            </div>
                                        </div>
                                    </div>)))}

                            {!isPlanFinalized && (<button onClick={addDeliverable} className="mt-2 px-4 py-2 bg-primary-light text-primary rounded-lg hover:bg-opacity-90 font-medium transition-colors" disabled={isPlanFinalized}>
                                    + Add Deliverable
                                </button>)}
                            
                             <h4 className="font-semibold text-md mb-3 mt-8 text-text-dark">Payments</h4>
                              <div className="space-y-4">
                                {payments.map((p) => {
                        const deliverable = deliverables.find(d => d.id === p.deliverableId);
                        if (!deliverable)
                            return null;
                        const status = getPaymentStatus(p);
                        return (<div key={p.deliverableId} className="p-4 bg-light-main rounded-xl border-l-4" style={{ borderColor: status.color }}>
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-semibold">{deliverable.name}</h4>
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded`} style={{ backgroundColor: `${status.color}30`, color: status.color }}>{status.text}</span>
                                            </div>
                                            <div className="grid md:grid-cols-4 gap-4 items-end">
                                                <Input label="Planned Payment Date" type="date" value={p.plannedPaymentDate} onChange={e => updatePayment(p.deliverableId, 'plannedPaymentDate', e.target.value)} disabled={isPlanFinalized}/>
                                                <Input label="Planned Amount (ETB)" type="number" value={p.amount} onChange={e => updatePayment(p.deliverableId, 'amount', parseFloat(e.target.value))} disabled={isPlanFinalized}/>
                                                <Input label="Actual Payment Date" type="date" value={p.actualPaymentDate || ''} onChange={e => updatePayment(p.deliverableId, 'actualPaymentDate', e.target.value)} disabled={!isContractActive}/>
                                                <Input label="Actual Amount Paid (ETB)" type="number" value={p.actualAmount || ''} onChange={e => updatePayment(p.deliverableId, 'actualAmount', parseFloat(e.target.value))} disabled={!isContractActive}/>
                                            </div>
                                        </div>);
                    })}
                                 {payments.length === 0 && <p className="text-sm text-text-light">No deliverables are linked to payments yet.</p>}
                                 {contractAmount > 0 && (<div className={`mt-4 p-3 rounded-md text-right font-semibold ${totalPaymentPlanned > contractAmount ? 'bg-danger-light text-danger' : 'bg-success-light text-success'}`}>
                                        Total Planned Payments: {totalPaymentPlanned.toLocaleString()} / {contractAmount.toLocaleString()} ETB
                                    </div>)}
                            </div>
                        </div>)}

                     {activeTab === 'variations' && (<div>
                             {isContractActive ? <>
                                <h4 className="font-semibold text-md mb-3 text-text-dark">Variations</h4>
                                {variations.map((v, index) => (<div key={v.id} className="grid md:grid-cols-3 gap-4 p-4 border rounded-xl mb-4 relative border-light-border bg-light-main fade-in">
                                         <button onClick={() => removeVariation(index)} className="absolute top-3 right-3 text-danger hover:text-opacity-80 font-bold text-2xl">&times;</button>
                                         <Input label="Date" type="date" value={v.date} onChange={e => updateVariation(index, 'date', e.target.value)}/>
                                         <Select label="Type" options={amendmentTypeOptions} value={v.type} onChange={e => updateVariation(index, 'type', e.target.value)}/>
                                         <Select label="Status" options={VARIATION_STATUSES} value={v.status} onChange={e => updateVariation(index, 'status', e.target.value)}/>
                                         <Input label="Cost Impact (ETB)" type="number" value={v.costImpact} onChange={e => updateVariation(index, 'costImpact', parseFloat(e.target.value))}/>
                                         <Input label="Time Impact (Days)" type="number" value={v.timeImpactDays} onChange={e => updateVariation(index, 'timeImpactDays', parseInt(e.target.value, 10))}/>
                                         <div className="md:col-span-3">
                                             <TextArea label="Description" rows={2} value={v.description} onChange={e => updateVariation(index, 'description', e.target.value)}/>
                                         </div>
                                    </div>))}
                                <button onClick={addVariation} className="mt-2 px-4 py-2 bg-primary-light text-primary rounded-lg hover:bg-opacity-90 font-medium transition-colors">+ Add Variation</button>

                                <h4 className="font-semibold text-md mb-3 mt-8 text-text-dark">Claims</h4>
                                {claims.map((claim, index) => (<div key={claim.id} className="grid md:grid-cols-3 gap-4 p-4 border rounded-xl mb-4 relative border-light-border bg-light-main fade-in">
                                         <button onClick={() => removeClaim(index)} className="absolute top-3 right-3 text-danger hover:text-opacity-80 font-bold text-2xl">&times;</button>
                                          <Input label="Date" type="date" value={claim.date} onChange={e => updateClaim(index, 'date', e.target.value)}/>
                                          <Select label="Source" options={CLAIM_SOURCES} value={claim.source} onChange={e => updateClaim(index, 'source', e.target.value)}/>
                                          <Select label="Status" options={CLAIM_STATUSES} value={claim.status} onChange={e => updateClaim(index, 'status', e.target.value)}/>
                                          <Input label="Amount (ETB)" type="number" value={claim.amount} onChange={e => updateClaim(index, 'amount', parseFloat(e.target.value))}/>
                                          <div className="md:col-span-3">
                                            <TextArea label="Description" rows={2} value={claim.description} onChange={e => updateClaim(index, 'description', e.target.value)}/>
                                          </div>
                                     </div>))}
                                <button onClick={addClaim} className="mt-2 px-4 py-2 bg-primary-light text-primary rounded-lg hover:bg-opacity-90 font-medium transition-colors">+ Add Claim</button>
                             </> : <p className="text-text-light">Finalize the implementation plan to manage variations and claims.</p>}
                        </div>)}

                    {activeTab === 'timeline' && isEditMode && (<div>
                            <h4 className="font-semibold text-md mb-4 text-text-dark">Project Timeline Visualization</h4>
                            <ContractTimeline contract={contract}/>
                        </div>)}

                     {activeTab === 'completion' && (<div>
                             {!isPlanFinalized && !isContractActive ?
                        <div className="p-4 bg-light-border rounded-lg">
                                    <p className="font-semibold text-text-dark">Finalize the implementation plan to enable contract completion options.</p>
                                </div>
                        : contract.completionDate ?
                            <div className="p-4 bg-light-border rounded-lg">
                                    <p className="font-semibold text-text-dark">This contract was completed on {new Date(contract.completionDate).toLocaleDateString()}.</p>
                                </div>
                            :
                                <div className="p-4 bg-success-light border-l-4 border-success">
                                     <h4 className="font-bold text-success">Complete Contract</h4>
                                    <p className="text-sm text-green-800 mt-1">If all deliverables and payments are finalized, you can mark this contract as complete.</p>
                                     <button onClick={handleCompleteContract} className="mt-3 px-4 py-2 bg-success text-white rounded-lg hover:bg-opacity-90 flex items-center shadow-sm">
                                         <span className="w-5 h-5">{ICONS.checkCircle}</span> <span className="ml-2 font-medium">Mark as Complete</span>
                                     </button>
                                </div>}
                        </div>)}
                     </div>

                    <div className="mt-8 flex justify-end">
                        <button onClick={handleSubmit} className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 disabled:bg-opacity-50 shadow-md">
                            {isEditMode ? 'Update Contract' : 'Save Contract'}
                        </button>
                    </div>
                </>}
            </Section>
        </div>)}
    </div>);
};
export default ContractModule;
