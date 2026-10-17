import { apiClient } from './apiClient';
export const INITIAL_NGOS_REGISTRY = [];
let cachedNgos = [];
export const loadNgos = () => {
    return cachedNgos;
};
export const fetchNgosFromApi = async () => {
    try {
        const data = await apiClient.getNgos();
        if (Array.isArray(data)) {
            const mapped = data.map((n) => ({
                id: n.ngo_id || String(n.id),
                name: n.name,
                code: n.code,
                registrationNumber: n.registration_number || n.registrationNumber || '',
                contactPerson: n.contact_person || n.contactPerson || '',
                phone: n.phone || '',
                email: n.email || '',
                address: n.address || '',
                operatingArea: n.operating_area || n.operatingArea || '',
                assignedProgramIds: n.assigned_program_ids || n.assignedProgramIds || [],
                assignedProgramNames: n.assigned_program_names || n.assignedProgramNames || [],
                assignedProjectIds: n.assigned_project_ids || n.assignedProjectIds || [],
                status: n.status || 'Active',
                activeSchemesCount: n.active_schemes_count || n.activeSchemesCount || 0,
                primaryProgram: n.primary_program || n.primaryProgram || '',
                performanceRating: Number(n.performance_rating || n.performanceRating || 4.5),
                annualBudget: Number(n.annual_budget || n.annualBudget || 0),
                mouStatus: n.mou_status || n.mouStatus || 'Signed & Valid',
                history: Array.isArray(n.history) ? n.history : [],
                createdBy: n.created_by || n.createdBy || 'admin',
                createdAt: n.created_at || n.createdAt || new Date().toISOString(),
                updatedAt: n.updated_at || n.updatedAt || new Date().toISOString()
            }));
            cachedNgos = mapped;
            return mapped;
        }
    }
    catch (err) {
        console.error('Failed to fetch NGOs from API:', err);
    }
    return cachedNgos;
};
export const saveNgos = async (ngos) => {
    try {
        cachedNgos = ngos;
        for (const n of ngos) {
            await apiClient.saveNgo({
                ngo_id: n.id,
                name: n.name,
                code: n.code,
                registration_number: n.registrationNumber,
                contact_person: n.contactPerson,
                phone: n.phone,
                email: n.email,
                address: n.address,
                operating_area: n.operatingArea,
                assigned_program_ids: n.assignedProgramIds,
                assigned_program_names: n.assignedProgramNames,
                assigned_project_ids: n.assignedProjectIds,
                status: n.status,
                active_schemes_count: n.activeSchemesCount,
                primary_program: n.primaryProgram,
                performance_rating: n.performanceRating,
                annual_budget: n.annualBudget,
                mou_status: n.mouStatus,
                history: n.history,
            });
        }
    }
    catch (err) {
        console.error('Failed to save NGOs to API:', err);
    }
};
export const validateNgoData = (ngo, existingNgos, isEdit = false) => {
    const errors = [];
    if (!ngo.name || !ngo.name.trim()) {
        errors.push('Organization name is required.');
    }
    if (!ngo.code || !ngo.code.trim()) {
        errors.push('Unique organization code is required.');
    }
    else {
        const codeNormalized = ngo.code.trim().toUpperCase();
        const duplicate = existingNgos.find(n => n.code.trim().toUpperCase() === codeNormalized && (!isEdit || n.id !== ngo.id));
        if (duplicate) {
            errors.push(`Organization code "${ngo.code.trim().toUpperCase()}" is already registered. Code must be unique.`);
        }
    }
    if (!ngo.contactPerson || !ngo.contactPerson.trim()) {
        errors.push('Contact person is required.');
    }
    if (!ngo.phone || !ngo.phone.trim()) {
        errors.push('Contact phone number is required.');
    }
    if (!ngo.email || !ngo.email.trim()) {
        errors.push('Email address is required.');
    }
    if (!ngo.assignedProgramIds || ngo.assignedProgramIds.length === 0) {
        errors.push('At least one assigned program is required.');
    }
    return {
        valid: errors.length === 0,
        errors
    };
};
export const deactivateNgo = (ngoId, reason, user, ngos) => {
    const updated = ngos.map(n => {
        if (n.id === ngoId) {
            const historyEntry = {
                action: 'Deactivated',
                date: new Date().toISOString(),
                performedBy: user,
                details: reason || 'Deactivated by administrator'
            };
            return {
                ...n,
                status: 'Inactive',
                deactivationReason: reason,
                deactivationDate: new Date().toISOString(),
                history: [...(n.history || []), historyEntry],
                updatedAt: new Date().toISOString()
            };
        }
        return n;
    });
    saveNgos(updated);
    return updated;
};
export const reactivateNgo = (ngoId, user, ngos) => {
    const updated = ngos.map(n => {
        if (n.id === ngoId) {
            const historyEntry = {
                action: 'Activated',
                date: new Date().toISOString(),
                performedBy: user,
                details: 'Organization reactivated by authorized administrator'
            };
            return {
                ...n,
                status: 'Active',
                deactivationReason: undefined,
                deactivationDate: undefined,
                history: [...(n.history || []), historyEntry],
                updatedAt: new Date().toISOString()
            };
        }
        return n;
    });
    saveNgos(updated);
    return updated;
};
