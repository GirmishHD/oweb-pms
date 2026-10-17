import { Program } from '../types';

const PROGRAMS_STORAGE_KEY = 'oweb_programs_registry_v1';

export const INITIAL_PROGRAMS_REGISTRY: Program[] = [
  {
    id: 'PROG-001',
    name: 'ONE WASH',
    code: 'ONE-WASH',
    description: 'National multi-donor consolidated WaSH account (OWNP Phase II/III) delivering synchronized water supply, sanitation, and hygiene across Oromia woredas.',
    programManager: 'Eng. Solomon Tadesse',
    startDate: '2020-07-01',
    endDate: '2028-06-30',
    fundingSource: 'World Bank CWA / AfDB / UNICEF / FCDO',
    contactEmail: 'onewash@oweb.gov.et',
    contactPhone: '+251 115 510001',
    status: 'Active',
    focusArea: 'Integrated rural & urban water systems, institutional school/health WASH, and woreda-wide universal access.',
    budgetETB: 450000000,
    targetBeneficiaries: 1450000,
    components: ['Rural WaSH Schemes', 'Urban WaSH Utilities', 'Institutional WaSH (Schools & Health)', 'Program Capacity Building'],
    createdAt: '2020-07-01T08:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    createdBy: 'admin'
  },
  {
    id: 'PROG-002',
    name: 'COWASH',
    code: 'COWASH',
    description: 'Community-Led Accelerated Water and Sanitation empowering community groups with direct fund management, procurement, and local operations.',
    programManager: 'Ato Worku Assefa',
    startDate: '2021-01-01',
    endDate: '2027-12-31',
    fundingSource: 'Government of Finland & OWEB',
    contactEmail: 'cowash@oweb.gov.et',
    contactPhone: '+251 115 510002',
    status: 'Active',
    focusArea: 'Community-Managed Project (CMP) approach, rural protected springs, hand-dug wells, and deep local ownership.',
    budgetETB: 180000000,
    targetBeneficiaries: 680000,
    components: ['Community-Managed Projects (CMP)', 'Spring Development & Hand Pumps', 'WASHCO Capacity & Community Empowerment', 'Inclusion & Disability WASH'],
    createdAt: '2021-01-01T08:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    createdBy: 'admin'
  },
  {
    id: 'PROG-003',
    name: 'UNICEF',
    code: 'UNICEF',
    description: 'Emergency, climate-resilient water supply, drought response rehabilitation, and child-sensitive WaSH facilities across pastoralist and drought zones.',
    programManager: 'W/ro Genet Desta',
    startDate: '2022-01-01',
    endDate: '2026-12-31',
    fundingSource: 'UNICEF Ethiopia & Global Humanitarian Funds',
    contactEmail: 'unicef.wash@oweb.gov.et',
    contactPhone: '+251 115 510003',
    status: 'Active',
    focusArea: 'Emergency rehabilitation, deep boreholes, solarized pumping, school hygiene, and rapid response filtration.',
    budgetETB: 195000000,
    targetBeneficiaries: 520000,
    components: ['Emergency Drought Response', 'Solar Pumping Conversion', 'School & Health Centre WaSH', 'Water Quality Monitoring & Disinfection'],
    createdAt: '2022-01-01T08:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    createdBy: 'admin'
  },
  {
    id: 'PROG-004',
    name: 'Second Urban',
    code: 'SUWSSP',
    description: 'Second Urban Water Supply and Sanitation Project (UWSSP-II) enhancing operational efficiency, service quality, and faecal sludge treatment in towns.',
    programManager: 'Eng. Birhanu Kebede',
    startDate: '2019-09-01',
    endDate: '2026-12-31',
    fundingSource: 'World Bank IDA / Urban Utility Board',
    contactEmail: 'urban.wash@oweb.gov.et',
    contactPhone: '+251 115 510004',
    status: 'Active',
    focusArea: 'Major town water utilities, piped network expansion, non-revenue water reduction, and faecal sludge treatment plants.',
    budgetETB: 520000000,
    targetBeneficiaries: 850000,
    components: ['Urban Piped Network Expansion', 'Faecal Sludge Treatment Plant (FSTP)', 'Utility Operational Modernization', 'Non-Revenue Water (NRW) Reduction'],
    createdAt: '2019-09-01T08:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    createdBy: 'admin'
  },
  {
    id: 'PROG-005',
    name: 'Borena Resilience',
    code: 'BORENA-RESILIENCE',
    description: 'Borana Resilient Water Development for Improved Livelihoods program financed by AfDB, GCA, and OWEB targeting deep groundwater exploration (>500m), multi-village piped water schemes, pastoralist livestock corridors, and drought crisis resilience.',
    programManager: 'Ato Liban Dida',
    startDate: '2022-01-01',
    endDate: '2028-12-31',
    fundingSource: 'African Development Bank (AfDB) / GCA / Regional Treasury',
    contactEmail: 'borena.resilience@oweb.gov.et',
    contactPhone: '+251 115 510005',
    status: 'Active',
    focusArea: 'Deep groundwater extraction (>500m), multi-village piped water networks, pastoralist livestock watering corridors, and traditional tula well rehabilitation.',
    budgetETB: 420000000,
    targetBeneficiaries: 650000,
    components: ['Deep Well Groundwater Exploration', 'Multi-Village Transmission Networks', 'Livestock Watering Corridors', 'Emergency Drought Response Desks'],
    createdAt: '2022-01-01T08:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    createdBy: 'admin'
  },
  {
    id: 'PROG-006',
    name: 'Basket Fund',
    code: 'BASKET-FUND',
    description: 'Pooled multi-donor basket funding coordinating bilateral and development partner capital allocations across vulnerable woredas in Oromia.',
    programManager: 'Dr. Chala Gutema',
    startDate: '2020-01-01',
    endDate: '2028-12-31',
    fundingSource: 'Multi-Donor WaSH Basket Fund (CWA Pooled)',
    contactEmail: 'basketfund@oweb.gov.et',
    contactPhone: '+251 115 510006',
    status: 'Active',
    focusArea: 'Regional capital expenditure, cross-zonal water transmission mains, multi-village schemes, and reservoir infrastructure.',
    budgetETB: 310000000,
    targetBeneficiaries: 980000,
    components: ['Multi-Village Piped Schemes', 'Bulk Water Transmission Pipelines', 'Regional Storage Reservoirs', 'Zonal Directorate Capacity'],
    createdAt: '2020-01-01T08:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    createdBy: 'admin'
  },
  {
    id: 'PROG-007',
    name: 'Other Programs',
    code: 'OTHER-PROG',
    description: 'Specialized bilateral initiatives, climate resilience pilots, and direct regional treasury interventions not captured under standard donor portfolios.',
    programManager: 'Eng. Almaz Bekele',
    startDate: '2023-01-01',
    endDate: '2029-12-31',
    fundingSource: 'OWEB Regional Treasury & Bilateral Development Partners',
    contactEmail: 'bilateral.wash@oweb.gov.et',
    contactPhone: '+251 115 510007',
    status: 'Active',
    focusArea: 'Pilot technologies, borehole hydro-fracturing, solar desalination pilots, and strategic regional emergencies.',
    budgetETB: 150000000,
    targetBeneficiaries: 340000,
    components: ['Climate Resilience Deep Wells', 'Desalination & Advanced Filtration Pilots', 'Direct Regional Treasury Schemes', 'Research & Watershed Modeling'],
    createdAt: '2023-01-01T08:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    createdBy: 'admin'
  }
];

const PROGRAMS_STORAGE_KEY_V2 = 'oweb_programs_registry_v2';

export const loadPrograms = (): Program[] => {
  try {
    const raw = localStorage.getItem(PROGRAMS_STORAGE_KEY_V2) || localStorage.getItem(PROGRAMS_STORAGE_KEY);
    if (!raw) {
      savePrograms(INITIAL_PROGRAMS_REGISTRY);
      return INITIAL_PROGRAMS_REGISTRY;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Clean and migrate old entries: replace BIOGAS with BORENA-RESILIENCE, deduplicate strictly by id
      const idMap = new Map<string, Program>();

      for (const item of parsed) {
        if (!item || !item.id) continue;
        
        let p = item;
        // If it's the old BIOGAS program or old PROG-005, migrate to Borena Resilience
        if (p.code === 'BIOGAS' || p.name === 'BIOGAS' || p.id === 'PROG-005') {
          const borenaProg = INITIAL_PROGRAMS_REGISTRY.find(ip => ip.id === 'PROG-005');
          if (borenaProg) {
            p = { ...borenaProg };
          }
        }
        
        // Put in map by ID (guarantees unique p.id across all entries)
        idMap.set(p.id, p);
      }

      // Ensure all 7 core programs exist
      const existingCodes = new Set(Array.from(idMap.values()).map(p => p.code.toUpperCase()));
      for (const cp of INITIAL_PROGRAMS_REGISTRY) {
        if (!idMap.has(cp.id) && !existingCodes.has(cp.code.toUpperCase())) {
          idMap.set(cp.id, cp);
          existingCodes.add(cp.code.toUpperCase());
        }
      }

      const cleanList = Array.from(idMap.values());
      savePrograms(cleanList);
      return cleanList;
    }
    return INITIAL_PROGRAMS_REGISTRY;
  } catch (err) {
    console.error('Failed to load programs registry from localStorage, fallback to initial:', err);
    return INITIAL_PROGRAMS_REGISTRY;
  }
};

export const savePrograms = (programs: Program[]): void => {
  try {
    // Ensure strict deduplication by id before saving
    const uniqueMap = new Map<string, Program>();
    programs.forEach(p => {
      if (p && p.id) {
        uniqueMap.set(p.id, p);
      }
    });
    const uniquePrograms = Array.from(uniqueMap.values());
    localStorage.setItem(PROGRAMS_STORAGE_KEY_V2, JSON.stringify(uniquePrograms));
    localStorage.removeItem(PROGRAMS_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to save programs to localStorage:', err);
  }
};

export const validateProgramData = (
  program: Partial<Program>,
  existingPrograms: Program[],
  isEdit = false
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!program.name || !program.name.trim()) {
    errors.push('Program name is required.');
  }

  if (!program.code || !program.code.trim()) {
    errors.push('Program code is required.');
  } else {
    const codeNormalized = program.code.trim().toUpperCase();
    const duplicate = existingPrograms.find(
      p => p.code.trim().toUpperCase() === codeNormalized && (!isEdit || p.id !== program.id)
    );
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

export const getProgramColor = (programName?: string): { color: string; bg: string; text: string; border: string } => {
  if (!programName) return { color: '#64748b', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
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
