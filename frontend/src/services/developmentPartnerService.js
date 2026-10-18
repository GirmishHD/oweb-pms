import { apiClient } from './apiClient';

export const INITIAL_DEVELOPMENT_PARTNERS = [
    {
        id: 'DPART-001',
        name: 'Government of Finland (MFA Finland)',
        acronym: 'MFA Finland',
        category: 'Bilateral',
        countryOfOrigin: 'Finland',
        headquarters: 'Helsinki, Finland / Addis Ababa Embassy',
        focalPerson: 'Arto Suominen (Chief Technical Advisor)',
        focalEmail: 'arto.suominen@cowashethiopia.net',
        focalPhone: '+251 115 510002',
        website: 'https://www.cmpethiopia.org',
        washFocusAreas: ['Community-Managed Projects (CMP)', 'Rural Water Supply', 'Inclusion & Disability WASH', 'Capacity Building'],
        supportedClusters: ['Central Oromia', 'Western Oromia', 'Southwestern Oromia'],
        totalFinancingCommitmentUSD: 24500000,
        status: 'Active',
        officialVerificationUrl: 'https://www.cmpethiopia.org/cowash-phase-iv/',
        notes: 'Co-financing COWASH Phase IV (April 2021 – September 2025) with Oromia Regional Government.'
    },
    {
        id: 'DPART-002',
        name: 'The World Bank Group (IDA)',
        acronym: 'World Bank',
        category: 'Multilateral',
        countryOfOrigin: 'International',
        headquarters: 'Washington, D.C. / Addis Ababa Country Office',
        focalPerson: 'Yitbarek Tessema (Senior Water Specialist)',
        focalEmail: 'ytessema@worldbank.org',
        focalPhone: '+251 115 176000',
        website: 'https://projects.worldbank.org/en/projects-operations/project-detail/P167794',
        washFocusAreas: ['Urban Water Supply', 'Faecal Sludge Management (FSTP)', 'Utility Modernization', 'Consolidated WASH Account (CWA)'],
        supportedClusters: ['Central Oromia', 'Southeastern Oromia', 'Southwestern Oromia', 'Eastern Oromia'],
        totalFinancingCommitmentUSD: 185000000,
        status: 'Active',
        officialVerificationUrl: 'https://projects.worldbank.org/en/projects-operations/project-detail/P167794',
        notes: 'Financing Second Urban Water Supply and Sanitation Project (UWSSP-II, P167794) and OWNP CWA-II.'
    },
    {
        id: 'DPART-003',
        name: 'African Development Bank (AfDB)',
        acronym: 'AfDB',
        category: 'Multilateral',
        countryOfOrigin: 'International',
        headquarters: 'Abidjan, Côte d’Ivoire / Addis Ababa Office',
        focalPerson: 'Dr. Zenebe Urgessa',
        focalEmail: 'z.urgessa@afdb.org',
        focalPhone: '+251 115 542240',
        website: 'https://www.afdb.org/en/projects-and-operations/p-et-e00-011',
        washFocusAreas: ['Drought Resilience', 'Deep Groundwater Extraction (>500m)', 'Pastoralist Water Corridors', 'Multi-Village Piped Schemes'],
        supportedClusters: ['Southern Oromia', 'Southeastern Oromia'],
        totalFinancingCommitmentUSD: 68000000,
        status: 'Active',
        officialVerificationUrl: 'https://www.afdb.org/en/documents/ethiopia-borana-resilient-water-development-improved-livelihoods-program-phase-i-appraisal-report',
        notes: 'Financing Borana Resilient Water Development for Improved Livelihoods Program (BRWDLP, P-ET-E00-011).'
    },
    {
        id: 'DPART-004',
        name: 'UNICEF Ethiopia',
        acronym: 'UNICEF',
        category: 'Multilateral',
        countryOfOrigin: 'United Nations',
        headquarters: 'Addis Ababa Country Office (UNECA Compound)',
        focalPerson: 'Biniam Aregawi (WASH Specialist - Oromia Field)',
        focalEmail: 'baregawi@unicef.org',
        focalPhone: '+251 115 184000',
        website: 'https://www.unicef.org/ethiopia/water-sanitation-and-hygiene-wash',
        washFocusAreas: ['Emergency Drought Response', 'Solar Pumping Conversions', 'School & Health Facility WASH', 'Water Quality Surveillance'],
        supportedClusters: ['Southern Oromia', 'Eastern Oromia', 'Central Oromia'],
        totalFinancingCommitmentUSD: 32000000,
        status: 'Active',
        officialVerificationUrl: 'https://www.unicef.org/ethiopia/water-sanitation-and-hygiene-wash',
        notes: 'Co-chairing Regional WASH Emergency Taskforce and supporting solarized water schemes across drought-impacted woredas.'
    },
    {
        id: 'DPART-005',
        name: 'One WASH National Program (OWNP / CWA Pooled Partners)',
        acronym: 'OWNP / CWA',
        category: 'Government Program',
        countryOfOrigin: 'Federal Republic of Ethiopia / Multi-Donor',
        headquarters: 'Ministry of Water & Energy / OWEB PMU Finfinnee',
        focalPerson: 'Ato Abiy Girma (National Coordinator)',
        focalEmail: 'coordinator.cwa@mowe.gov.et',
        focalPhone: '+251 116 611111',
        website: 'https://www.cmpethiopia.org/one-wash-national-program/',
        washFocusAreas: ['Rural Water Supply', 'Urban Utility Upgrades', 'Institutional WASH', 'Consolidated Account Harmonization'],
        supportedClusters: ['Central Oromia', 'Eastern Oromia', 'Western Oromia', 'Southeastern Oromia', 'Southern Oromia', 'Southwestern Oromia'],
        totalFinancingCommitmentUSD: 325000000,
        status: 'Active',
        officialVerificationUrl: 'https://www.cmpethiopia.org/one-wash-national-program/',
        notes: 'Coordinating Phase II of the Consolidated WASH Account (CWA) across all 6 administrative clusters.'
    }
];

export const INITIAL_PARTNER_DOCUMENTS = [
    {
        id: 'PDOC-001',
        title: 'COWASH Phase IV Project Document (2021–2025)',
        documentType: 'Project Document',
        programCode: 'COWASH',
        partnerId: 'DPART-001',
        publicationYear: 2021,
        fileUrl: 'https://www.cmpethiopia.org/wp-content/uploads/2021/04/COWASH_IV_Project_Document.pdf',
        sourceOrganization: 'Ministry of Foreign Affairs of Finland & MoWE',
        summary: 'Official project appraisal and operational implementation manual for Community-Managed Projects (CMP) in Oromia woredas.',
        verified: true
    },
    {
        id: 'PDOC-002',
        title: 'Borana Resilient Water Development Program (BRWDLP Phase I) Appraisal Report',
        documentType: 'Project Appraisal Report',
        programCode: 'BORENA-RESILIENCE',
        partnerId: 'DPART-003',
        publicationYear: 2022,
        fileUrl: 'https://www.afdb.org/en/documents/ethiopia-borana-resilient-water-development-improved-livelihoods-program-phase-i-appraisal-report',
        sourceOrganization: 'African Development Bank (AfDB)',
        summary: 'Comprehensive technical appraisal detailing deep well drilling (>500m), livestock watering points, and climate adaptation in Borana.',
        verified: true
    },
    {
        id: 'PDOC-003',
        title: 'Second Urban Water Supply and Sanitation Project (UWSSP-II) Project Appraisal Document',
        documentType: 'Project Appraisal Document',
        programCode: 'SUWSSP',
        partnerId: 'DPART-002',
        publicationYear: 2019,
        fileUrl: 'https://documents.worldbank.org/en/publication/documents-reports/documentdetail/859591500084393666/ethiopia-second-urban-water-supply-and-sanitation-project',
        sourceOrganization: 'World Bank Group (IDA)',
        summary: 'World Bank appraisal and restructuring documents for piped networks and faecal sludge treatment plants in secondary cities.',
        verified: true
    },
    {
        id: 'PDOC-004',
        title: 'One WASH National Program Phase II (OWNP-CWA) Program Operational Manual',
        documentType: 'Program Operational Manual',
        programCode: 'ONE-WASH',
        partnerId: 'DPART-005',
        publicationYear: 2020,
        fileUrl: 'https://www.cmpethiopia.org/wp-content/uploads/2020/01/OWNP_Phase_II_POM.pdf',
        sourceOrganization: 'Ministry of Water & Energy / Consolidated WASH Account PMU',
        summary: 'Harmonized implementation guidelines across water, health, and education sectors for regional bureaus and woredas.',
        verified: true
    },
    {
        id: 'PDOC-005',
        title: 'UNICEF Ethiopia WASH Sector Annual Progress & Solar Pumping Assessment',
        documentType: 'Progress & Technical Assessment',
        programCode: 'UNICEF',
        partnerId: 'DPART-004',
        publicationYear: 2023,
        fileUrl: 'https://www.unicef.org/ethiopia/reports/wash-annual-results-2023',
        sourceOrganization: 'UNICEF Ethiopia',
        summary: 'Evaluates solarization conversions of motorized boreholes and emergency drought rehabilitation across lowlands.',
        verified: true
    }
];

let cachedPartners = [...INITIAL_DEVELOPMENT_PARTNERS];
let cachedDocuments = [...INITIAL_PARTNER_DOCUMENTS];

export const loadDevelopmentPartners = () => {
    return cachedPartners;
};

export const loadPartnerDocuments = () => {
    return cachedDocuments;
};

export const fetchDevelopmentPartnersFromApi = async () => {
    try {
        const data = await apiClient.getDevelopmentPartners();
        if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map(item => ({
                id: item.partner_id || String(item.id),
                name: item.name,
                acronym: item.acronym || '',
                category: item.category || 'Bilateral',
                countryOfOrigin: item.country_of_origin || '',
                headquarters: item.headquarters || '',
                focalPerson: item.focal_person || '',
                focalEmail: item.focal_email || '',
                focalPhone: item.focal_phone || '',
                website: item.website || '',
                washFocusAreas: Array.isArray(item.wash_focus_areas) ? item.wash_focus_areas : [],
                supportedClusters: Array.isArray(item.supported_clusters) ? item.supported_clusters : [],
                totalFinancingCommitmentUSD: Number(item.total_financing_commitment_usd || 0),
                status: item.status || 'Active',
                officialVerificationUrl: item.official_verification_url || '',
                notes: item.notes || ''
            }));
            cachedPartners = mapped;
            return mapped;
        }
    } catch (err) {
        console.warn('Falling back to local development partners cache:', err);
    }
    return cachedPartners;
};

export const fetchPartnerDocumentsFromApi = async () => {
    try {
        const data = await apiClient.getPartnerDocuments();
        if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map(item => ({
                id: item.doc_id || String(item.id),
                title: item.title,
                documentType: item.document_type || 'Evaluation Report',
                programCode: item.program_code || '',
                partnerId: item.partner_id || '',
                publicationYear: Number(item.publication_year || 2024),
                fileUrl: item.file_url || '',
                sourceOrganization: item.source_organization || '',
                summary: item.summary || '',
                verified: item.verified !== false
            }));
            cachedDocuments = mapped;
            return mapped;
        }
    } catch (err) {
        console.warn('Falling back to local partner documents cache:', err);
    }
    return cachedDocuments;
};
