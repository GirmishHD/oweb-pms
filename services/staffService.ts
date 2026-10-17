import { Staff } from '../types';

const STAFF_STORAGE_KEY = 'oweb_staff_registry_v1';

export const INITIAL_STAFF_REGISTRY: Staff[] = [
  {
    id: 'STF-001',
    staffCode: 'STF-OW-01',
    fullName: 'Eng. Solomon Tadesse',
    jobTitle: 'Senior WaSH Project Engineer',
    department: 'Study & Design Directorate',
    phone: '+251 911 234567',
    email: 'solomon.tadesse@oweb.gov.et',
    assignedProgramId: 'ONE-WASH',
    assignedProgramName: 'ONE WASH',
    assignedProjectIds: ['OWEB-WAT-2025-0001', 'OWEB-SAN-2024-0015'],
    supervisorName: 'Dr. Chaltu Desta',
    employmentStartDate: '2021-02-01',
    status: 'Active',
    linkedUserId: '4', // Linked to Team Leader Tigist / Engineer
    transferHistory: [
      {
        fromProgram: 'General Regional WaSH',
        toProgram: 'ONE WASH',
        date: '2021-02-01T08:00:00Z',
        transferredBy: 'admin',
        notes: 'Initial assignment to CWA National Program'
      }
    ],
    createdAt: '2021-02-01T08:00:00Z',
    updatedAt: '2025-01-15T09:00:00Z'
  },
  {
    id: 'STF-002',
    staffCode: 'STF-CO-02',
    fullName: 'Ato Worku Assefa',
    jobTitle: 'CMP Community Water Specialist',
    department: 'Community Management Unit',
    phone: '+251 912 345678',
    email: 'worku.assefa@oweb.gov.et',
    assignedProgramId: 'COWASH',
    assignedProgramName: 'COWASH',
    assignedNgoId: 'NGO-002',
    assignedNgoName: 'Plan International Ethiopia',
    assignedProjectIds: ['OWEB-WAT-2024-0022'],
    supervisorName: 'Eng. Birhanu Kebede',
    employmentStartDate: '2022-04-15',
    status: 'Active',
    transferHistory: [],
    createdAt: '2022-04-15T08:00:00Z',
    updatedAt: '2025-01-15T09:00:00Z'
  },
  {
    id: 'STF-003',
    staffCode: 'STF-UN-03',
    fullName: 'W/ro Genet Desta',
    jobTitle: 'Emergency WaSH & Rapid Response Coordinator',
    department: 'Emergency & Drought Directorate',
    phone: '+251 913 456789',
    email: 'genet.desta@oweb.gov.et',
    assignedProgramId: 'UNICEF',
    assignedProgramName: 'UNICEF',
    assignedNgoId: 'NGO-003',
    assignedNgoName: 'International Rescue Committee (IRC)',
    assignedProjectIds: ['OWEB-EMG-2025-0055', 'OWEB-WAT-2024-0041'],
    supervisorName: 'Dr. Chala Gutema',
    employmentStartDate: '2022-08-01',
    status: 'Active',
    transferHistory: [],
    createdAt: '2022-08-01T08:00:00Z',
    updatedAt: '2025-01-15T09:00:00Z'
  },
  {
    id: 'STF-004',
    staffCode: 'STF-SU-04',
    fullName: 'Eng. Birhanu Kebede',
    jobTitle: 'Urban Utility Infrastructure Specialist',
    department: 'Urban Water Supply Directorate',
    phone: '+251 914 567890',
    email: 'birhanu.kebede@oweb.gov.et',
    assignedProgramId: 'SUWSSP',
    assignedProgramName: 'Second Urban',
    assignedProjectIds: ['OWEB-WAT-2025-0001', 'OWEB-WAT-2025-0002'],
    supervisorName: 'Dr. Chaltu Desta',
    employmentStartDate: '2020-09-01',
    status: 'Active',
    linkedUserId: '5',
    transferHistory: [],
    createdAt: '2020-09-01T08:00:00Z',
    updatedAt: '2025-01-15T09:00:00Z'
  },
  {
    id: 'STF-005',
    staffCode: 'STF-BG-05',
    fullName: 'Ato Tesfaye Negash',
    jobTitle: 'Senior Hydrogeology & Deep Well Engineer',
    department: 'Groundwater & Drilling Directorate',
    phone: '+251 915 678901',
    email: 'tesfaye.negash@oweb.gov.et',
    assignedProgramId: 'BORENA-RESILIENCE',
    assignedProgramName: 'Borena Resilience',
    assignedProjectIds: ['OWEB-WAT-2024-0041'],
    supervisorName: 'Ato Kenenisa Bekele',
    employmentStartDate: '2021-11-10',
    status: 'Active',
    transferHistory: [],
    createdAt: '2021-11-10T08:00:00Z',
    updatedAt: '2025-01-15T09:00:00Z'
  },
  {
    id: 'STF-006',
    staffCode: 'STF-BF-06',
    fullName: 'Dr. Chala Gutema',
    jobTitle: 'Multi-Donor Portfolio Lead',
    department: 'Project Implementation Unit (PIU)',
    phone: '+251 916 789012',
    email: 'chala.gutema@oweb.gov.et',
    assignedProgramId: 'BASKET-FUND',
    assignedProgramName: 'Basket Fund',
    assignedProjectIds: ['OWEB-WAT-2024-0012', 'OWEB-CAP-2024-0033'],
    supervisorName: 'Dr. Chaltu Desta',
    employmentStartDate: '2021-01-15',
    status: 'Active',
    transferHistory: [],
    createdAt: '2021-01-15T08:00:00Z',
    updatedAt: '2025-01-15T09:00:00Z'
  },
  {
    id: 'STF-007',
    staffCode: 'STF-OT-07',
    fullName: 'Eng. Almaz Bekele',
    jobTitle: 'Bilateral Partnerships & Innovation Engineer',
    department: 'Water Supply Directorate',
    phone: '+251 917 890123',
    email: 'almaz.bekele@oweb.gov.et',
    assignedProgramId: 'OTHER-PROG',
    assignedProgramName: 'Other Programs',
    assignedProjectIds: ['OWEB-WAT-2025-0005'],
    supervisorName: 'Ato Kenenisa Bekele',
    employmentStartDate: '2023-03-01',
    status: 'Active',
    transferHistory: [],
    createdAt: '2023-03-01T08:00:00Z',
    updatedAt: '2025-01-15T09:00:00Z'
  }
];

export const loadStaff = (): Staff[] => {
  try {
    const raw = localStorage.getItem(STAFF_STORAGE_KEY);
    if (!raw) {
      saveStaff(INITIAL_STAFF_REGISTRY);
      return INITIAL_STAFF_REGISTRY;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_STAFF_REGISTRY;
  } catch (err) {
    console.error('Failed to load staff registry from localStorage, fallback to initial:', err);
    return INITIAL_STAFF_REGISTRY;
  }
};

export const saveStaff = (staffList: Staff[]): void => {
  try {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffList));
  } catch (err) {
    console.error('Failed to save staff to localStorage:', err);
  }
};

export const validateStaffData = (
  staff: Partial<Staff>,
  existingStaff: Staff[],
  isEdit = false
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!staff.fullName || !staff.fullName.trim()) {
    errors.push('Full name is required.');
  }

  if (!staff.staffCode || !staff.staffCode.trim()) {
    errors.push('Staff ID / Employee Code is required.');
  } else {
    const codeNormalized = staff.staffCode.trim().toUpperCase();
    const duplicate = existingStaff.find(
      s => s.staffCode.trim().toUpperCase() === codeNormalized && (!isEdit || s.id !== staff.id)
    );
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

export const transferStaffProgram = (
  staffId: string,
  targetProgramId: string,
  targetProgramName: string,
  performedBy: string,
  notes: string,
  staffList: Staff[]
): Staff[] => {
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

export const toggleStaffStatus = (
  staffId: string,
  newStatus: 'Active' | 'Inactive',
  reason: string,
  performedBy: string,
  staffList: Staff[]
): Staff[] => {
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
