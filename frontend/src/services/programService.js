import { apiClient } from './apiClient';
export const INITIAL_PROGRAMS_REGISTRY = [];
let cachedPrograms = [];
export const loadPrograms = () => {
    return cachedPrograms;
};
export const fetchProgramsFromApi = async () => {
    try {
        const data = await apiClient.getPrograms();
        if (Array.isArray(data)) {
            const mapped = data.map((pr) => ({
                id: pr.prog_id || String(pr.id),
                name: pr.name,
                code: pr.code,
                description: pr.description || '',
                programManager: pr.program_manager || pr.programManager || '',
                startDate: pr.start_date || pr.startDate || '',
                endDate: pr.end_date || pr.endDate || '',
                fundingSource: pr.funding_source || pr.fundingSource || '',
                contactEmail: pr.contact_email || pr.contactEmail || '',
                contactPhone: pr.contact_phone || pr.contactPhone || '',
                status: pr.status || 'Active',
                focusArea: pr.focus_area || pr.focusArea || '',
                budgetETB: Number(pr.budget_etb || pr.budgetETB || 0),
                targetBeneficiaries: Number(pr.target_beneficiaries || pr.targetBeneficiaries || 0),
                components: Array.isArray(pr.components) ? pr.components : [],
                createdAt: pr.created_at || pr.createdAt || new Date().toISOString(),
                updatedAt: pr.updated_at || pr.updatedAt || new Date().toISOString(),
                createdBy: pr.created_by || pr.createdBy || 'system'
            }));
            cachedPrograms = mapped;
            return mapped;
        }
    }
    catch (err) {
        console.error('Failed to fetch programs from API:', err);
    }
    return cachedPrograms;
};
export const savePrograms = async (programs) => {
    try {
        cachedPrograms = programs;
        for (const p of programs) {
            await apiClient.saveProgram({
                prog_id: p.id,
                name: p.name,
                code: p.code,
                description: p.description,
                program_manager: p.programManager,
                start_date: p.startDate,
                end_date: p.endDate,
                funding_source: p.fundingSource,
                contact_email: p.contactEmail,
                contact_phone: p.contactPhone,
                status: p.status,
                focus_area: p.focusArea,
                budget_etb: p.budgetETB,
                target_beneficiaries: p.targetBeneficiaries,
                components: p.components,
            });
        }
    }
    catch (err) {
        console.error('Failed to save programs to API:', err);
    }
};
export const validateProgramData = (program, existingPrograms, isEdit = false) => {
    const errors = [];
    if (!program.name || !program.name.trim()) {
        errors.push('Program name is required.');
    }
    if (!program.code || !program.code.trim()) {
        errors.push('Program code is required.');
    }
    else {
        const codeNormalized = program.code.trim().toUpperCase();
        const duplicate = existingPrograms.find(p => p.code.trim().toUpperCase() === codeNormalized && (!isEdit || p.id !== program.id));
        if (duplicate) {
            errors.push(`Program code "${program.code.trim().toUpperCase()}" is already registered. Code must be unique.`);
        }
    }
    if (!program.programManager || !program.programManager.trim()) {
        errors.push('Program manager is required.');
    }
    if (!program.startDate) {
        errors.push('Start date is required.');
    }
    if (!program.fundingSource || !program.fundingSource.trim()) {
        errors.push('Funding source is required.');
    }
    return {
        valid: errors.length === 0,
        errors
    };
};
export const getProgramColor = (programName) => {
    if (!programName)
        return { color: '#64748b', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
    const lower = programName.toLowerCase();
    if (lower.includes('one wash') || lower.includes('ownp')) {
        return { color: '#0284c7', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-300' };
    }
    if (lower.includes('cowash')) {
        return { color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' };
    }
    if (lower.includes('unicef')) {
        return { color: '#06b6d4', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-300' };
    }
    if (lower.includes('second urban') || lower.includes('suwssp')) {
        return { color: '#6366f1', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300' };
    }
    if (lower.includes('borena') || lower.includes('resilience')) {
        return { color: '#0d9488', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300' };
    }
    if (lower.includes('basket fund')) {
        return { color: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' };
    }
    return { color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' };
};
