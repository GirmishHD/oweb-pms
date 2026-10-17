import { apiClient } from './apiClient';
export const INITIAL_STAFF_REGISTRY = [];
let cachedStaff = [];
export const loadStaff = () => {
    return cachedStaff;
};
export const fetchStaffFromApi = async () => {
    try {
        const data = await apiClient.getStaff();
        if (Array.isArray(data)) {
            const mapped = data.map((s) => ({
                id: s.staff_id || String(s.id),
                staffCode: s.staff_code || s.staffCode || '',
                fullName: s.full_name || s.fullName,
                jobTitle: s.job_title || s.jobTitle || '',
                department: s.department || '',
                phone: s.phone || '',
                email: s.email || '',
                assignedProgramId: s.assigned_program_id || s.assignedProgramId || '',
                assignedProgramName: s.assigned_program_name || s.assignedProgramName || '',
                assignedNgoId: s.assigned_ngo_id || s.assignedNgoId || '',
                assignedNgoName: s.assigned_ngo_name || s.assignedNgoName || '',
                assignedProjectIds: s.assigned_project_ids || s.assignedProjectIds || [],
                supervisorName: s.supervisor_name || s.supervisorName || '',
                employmentStartDate: s.employment_start_date || s.employmentStartDate || '',
                status: s.status || 'Active',
                linkedUserId: s.linked_user_id || s.linkedUserId || '',
                transferHistory: Array.isArray(s.transfer_history) ? s.transfer_history : (Array.isArray(s.transferHistory) ? s.transferHistory : []),
                createdAt: s.created_at || s.createdAt || new Date().toISOString(),
                updatedAt: s.updated_at || s.updatedAt || new Date().toISOString()
            }));
            cachedStaff = mapped;
            return mapped;
        }
    }
    catch (err) {
        console.error('Failed to fetch staff from API:', err);
    }
    return cachedStaff;
};
export const saveStaff = async (staffList) => {
    try {
        cachedStaff = staffList;
        for (const s of staffList) {
            await apiClient.saveStaff({
                staff_id: s.id,
                staff_code: s.staffCode,
                full_name: s.fullName,
                job_title: s.jobTitle,
                department: s.department,
                phone: s.phone,
                email: s.email,
                assigned_program_id: s.assignedProgramId,
                assigned_program_name: s.assignedProgramName,
                assigned_ngo_id: s.assignedNgoId,
                assigned_ngo_name: s.assignedNgoName,
                assigned_project_ids: s.assignedProjectIds,
                supervisor_name: s.supervisorName,
                employment_start_date: s.employmentStartDate,
                status: s.status,
                linked_user_id: s.linkedUserId,
                transfer_history: s.transferHistory,
            });
        }
    }
    catch (err) {
        console.error('Failed to save staff to API:', err);
    }
};
export const validateStaffData = (staff, existingStaff, isEdit = false) => {
    const errors = [];
    if (!staff.fullName || !staff.fullName.trim()) {
        errors.push('Full name is required.');
    }
    if (!staff.staffCode || !staff.staffCode.trim()) {
        errors.push('Staff ID / Employee Code is required.');
    }
    else {
        const codeNormalized = staff.staffCode.trim().toUpperCase();
        const duplicate = existingStaff.find(s => s.staffCode.trim().toUpperCase() === codeNormalized && (!isEdit || s.id !== staff.id));
        if (duplicate) {
            errors.push(`Staff Code "${staff.staffCode.trim().toUpperCase()}" is already assigned. Code must be unique.`);
        }
    }
    if (!staff.jobTitle || !staff.jobTitle.trim()) {
        errors.push('Job title is required.');
    }
    if (!staff.phone || !staff.phone.trim()) {
        errors.push('Phone number is required.');
    }
    if (!staff.email || !staff.email.trim()) {
        errors.push('Email address is required.');
    }
    if (!staff.assignedProgramId || !staff.assignedProgramId.trim()) {
        errors.push('Assigned Program is required.');
    }
    return {
        valid: errors.length === 0,
        errors
    };
};
export const transferStaffProgram = (staffId, targetProgramId, targetProgramName, performedBy, notes, staffList) => {
    const updated = staffList.map(s => {
        if (s.id === staffId) {
            const historyEntry = {
                fromProgram: s.assignedProgramName || s.assignedProgramId,
                toProgram: targetProgramName,
                date: new Date().toISOString(),
                transferredBy: performedBy,
                notes: notes || 'Program transfer authorized'
            };
            return {
                ...s,
                assignedProgramId: targetProgramId,
                assignedProgramName: targetProgramName,
                transferHistory: [...(s.transferHistory || []), historyEntry],
                updatedAt: new Date().toISOString()
            };
        }
        return s;
    });
    saveStaff(updated);
    return updated;
};
export const toggleStaffStatus = (staffId, newStatus, reason, performedBy, staffList) => {
    const updated = staffList.map(s => {
        if (s.id === staffId) {
            return {
                ...s,
                status: newStatus,
                deactivationReason: newStatus === 'Inactive' ? reason : undefined,
                updatedAt: new Date().toISOString()
            };
        }
        return s;
    });
    saveStaff(updated);
    return updated;
};
