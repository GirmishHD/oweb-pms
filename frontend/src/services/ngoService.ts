import { NGO } from '../types';

const NGOS_STORAGE_KEY = 'oweb_ngo_registry_v1';

export const INITIAL_NGOS_REGISTRY: NGO[] = [
  {
    id: 'NGO-001',
    name: 'WaterAid Ethiopia (Oromia Regional Chapter)',
    code: 'NGO-WAE',
    registrationNumber: 'FDRE-CSO-1082',
    contactPerson: 'Ato Abebe Tadesse',
    phone: '+251 911 234567',
    email: 'abebe.tadesse@wateraid.org',
    address: 'Bole Subcity / Adama Regional Field Hub',
    operatingArea: 'East Shewa, Arsi, West Hararghe',
    assignedProgramIds: ['ONE-WASH', 'OTHER-PROG'],
    assignedProgramNames: ['ONE WASH', 'Other Programs'],
    assignedProjectIds: ['OWEB-WAT-2025-0001', 'OWEB-WAT-2024-0012'],
    status: 'Active',
    history: [
      {
        action: 'Registered',
        date: '2023-01-10T09:00:00Z',
        performedBy: 'admin',
        details: 'Initial accreditation under OWEB CWA Multi-Partner Framework'
      }
    ],
    createdBy: 'admin',
    createdAt: '2023-01-10T09:00:00Z',
    updatedAt: '2025-01-12T10:00:00Z'
  },
  {
    id: 'NGO-002',
    name: 'Plan International Ethiopia',
    code: 'NGO-PLAN',
    registrationNumber: 'FDRE-CSO-0419',
    contactPerson: 'W/ro Tigist Hailu',
    phone: '+251 912 345678',
    email: 'tigist.hailu@plan-international.org',
    address: 'Kirkos / Jimma Zonal Operations Centre',
    operatingArea: 'Jimma, Illubabor, Kelam Welega',
    assignedProgramIds: ['COWASH', 'UNICEF'],
    assignedProgramNames: ['COWASH', 'UNICEF'],
    assignedProjectIds: ['OWEB-WAT-2024-0022'],
    status: 'Active',
    history: [
      {
        action: 'Registered',
        date: '2023-03-15T11:00:00Z',
        performedBy: 'admin',
        details: 'CMP community water sanitation partner agreement signed'
      }
    ],
    createdBy: 'admin',
    createdAt: '2023-03-15T11:00:00Z',
    updatedAt: '2025-01-12T10:00:00Z'
  },
  {
    id: 'NGO-003',
    name: 'International Rescue Committee (IRC)',
    code: 'NGO-IRC',
    registrationNumber: 'FDRE-CSO-0198',
    contactPerson: 'Eng. Kebede Mengistu',
    phone: '+251 913 456789',
    email: 'kebede.mengistu@rescue.org',
    address: 'Yabelo Field Base & Negele Borana Sub-Office',
    operatingArea: 'Borena, Guji, East Bale',
    assignedProgramIds: ['UNICEF', 'BASKET-FUND'],
    assignedProgramNames: ['UNICEF', 'Basket Fund'],
    assignedProjectIds: ['OWEB-EMG-2025-0055', 'OWEB-WAT-2024-0041'],
    status: 'Active',
    history: [
      {
        action: 'Registered',
        date: '2022-11-20T14:30:00Z',
        performedBy: 'admin',
        details: 'Drought emergency borehole rehabilitation agreement'
      }
    ],
    createdBy: 'admin',
    createdAt: '2022-11-20T14:30:00Z',
    updatedAt: '2025-01-12T10:00:00Z'
  },
  {
    id: 'NGO-004',
    name: 'Catholic Relief Services (CRS Ethiopia)',
    code: 'NGO-CRS',
    registrationNumber: 'FDRE-CSO-0012',
    contactPerson: 'Ato Daniel Girma',
    phone: '+251 914 567890',
    email: 'daniel.girma@crs.org',
    address: 'Nifas Silk / Shashamane Field Coordination Office',
    operatingArea: 'West Arsi, Bale, East Hararghe',
    assignedProgramIds: ['ONE-WASH', 'SUWSSP'],
    assignedProgramNames: ['ONE WASH', 'Second Urban'],
    assignedProjectIds: ['OWEB-SAN-2024-0015'],
    status: 'Active',
    history: [
      {
        action: 'Registered',
        date: '2022-08-05T09:00:00Z',
        performedBy: 'admin',
        details: 'Urban sanitation and faecal sludge treatment cooperation'
      }
    ],
    createdBy: 'admin',
    createdAt: '2022-08-05T09:00:00Z',
    updatedAt: '2025-01-12T10:00:00Z'
  },
  {
    id: 'NGO-005',
    name: 'SNV Netherlands Development Organisation',
    code: 'NGO-SNV',
    registrationNumber: 'FDRE-CSO-0855',
    contactPerson: 'W/ro Selamawit Bekele',
    phone: '+251 915 678901',
    email: 'selamawit.bekele@snv.org',
    address: 'Bishoftu WaSH & Catchment Technical Hub',
    operatingArea: 'North Shewa, West Shewa, Southwest Shewa',
    assignedProgramIds: ['BORENA-RESILIENCE', 'COWASH'],
    assignedProgramNames: ['Borena Resilience', 'COWASH'],
    assignedProjectIds: ['OWEB-WAT-2024-0018'],
    status: 'Active',
    history: [
      {
        action: 'Registered',
        date: '2023-05-12T10:00:00Z',
        performedBy: 'admin',
        details: 'National Biogas institutional digester technical implementation'
      }
    ],
    createdBy: 'admin',
    createdAt: '2023-05-12T10:00:00Z',
    updatedAt: '2025-01-12T10:00:00Z'
  },
  {
    id: 'NGO-006',
    name: 'World Vision Ethiopia (Oromia WaSH Division)',
    code: 'NGO-WVE',
    registrationNumber: 'FDRE-CSO-0028',
    contactPerson: 'Eng. Solomon Worku',
    phone: '+251 916 789012',
    email: 'solomon_worku@wvi.org',
    address: 'Bole / Nekemte Area Development Program Hub',
    operatingArea: 'East Welega, West Welega, Horo Guduru',
    assignedProgramIds: ['ONE-WASH', 'BASKET-FUND'],
    assignedProgramNames: ['ONE WASH', 'Basket Fund'],
    assignedProjectIds: ['OWEB-SAN-2025-0003'],
    status: 'Active',
    history: [
      {
        action: 'Registered',
        date: '2023-07-22T08:30:00Z',
        performedBy: 'admin',
        details: 'Multi-village water supply infrastructure partnership'
      }
    ],
    createdBy: 'admin',
    createdAt: '2023-07-22T08:30:00Z',
    updatedAt: '2025-01-12T10:00:00Z'
  }
];

export const loadNgos = (): NGO[] => {
  try {
    const raw = localStorage.getItem(NGOS_STORAGE_KEY);
    if (!raw) {
      saveNgos(INITIAL_NGOS_REGISTRY);
      return INITIAL_NGOS_REGISTRY;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_NGOS_REGISTRY;
  } catch (err) {
    console.error('Failed to load NGOs from localStorage, fallback to initial:', err);
    return INITIAL_NGOS_REGISTRY;
  }
};

export const saveNgos = (ngos: NGO[]): void => {
  try {
    localStorage.setItem(NGOS_STORAGE_KEY, JSON.stringify(ngos));
  } catch (err) {
    console.error('Failed to save NGOs to localStorage:', err);
  }
};

export const validateNgoData = (
  ngo: Partial<NGO>,
  existingNgos: NGO[],
  isEdit = false
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!ngo.name || !ngo.name.trim()) {
    errors.push('Organization name is required.');
  }

  if (!ngo.code || !ngo.code.trim()) {
    errors.push('Unique organization code is required.');
  } else {
    const codeNormalized = ngo.code.trim().toUpperCase();
    const duplicate = existingNgos.find(
      n => n.code.trim().toUpperCase() === codeNormalized && (!isEdit || n.id !== ngo.id)
    );
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

export const deactivateNgo = (
  ngoId: string,
  reason: string,
  user: string,
  ngos: NGO[]
): NGO[] => {
  const updated = ngos.map(n => {
    if (n.id === ngoId) {
      const historyEntry = {
        action: 'Deactivated' as const,
        date: new Date().toISOString(),
        performedBy: user,
        details: reason || 'Deactivated by administrator'
      };
      return {
        ...n,
        status: 'Inactive' as const,
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

export const reactivateNgo = (
  ngoId: string,
  user: string,
  ngos: NGO[]
): NGO[] => {
  const updated = ngos.map(n => {
    if (n.id === ngoId) {
      const historyEntry = {
        action: 'Activated' as const,
        date: new Date().toISOString(),
        performedBy: user,
        details: 'Organization reactivated by authorized administrator'
      };
      return {
        ...n,
        status: 'Active' as const,
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
