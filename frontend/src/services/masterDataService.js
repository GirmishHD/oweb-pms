import { OROMIA_HIERARCHY, PROGRAM_DEFINITIONS } from '../constants';
import { INITIAL_REGIONS, INITIAL_WOREDAS, INITIAL_KEBELES } from './orgUnitService';
import { apiClient } from './apiClient';
export const INITIAL_PROGRAMS = Object.values(PROGRAM_DEFINITIONS).map((prog, index) => ({
    id: `prog-${index + 1}`,
    name: prog.name,
    code: prog.code,
    leadAgency: prog.leadAgency,
    focusArea: prog.focusArea,
    targetBeneficiaries: prog.targetBeneficiaries,
    totalBudgetETB: prog.initialBudgetETB,
    color: prog.color,
    badgeBg: prog.badgeBg,
    badgeText: prog.badgeText,
    accentBorder: prog.accentBorder,
    description: prog.description,
    active: true
}));
export const INITIAL_FUNDING_SOURCES = [
    { id: 'fs-1', name: 'OWEB Regional Treasury (GoE)', code: 'OWEB-REG', category: 'Regional Government', description: 'Oromia Regional Government Capital Allocation', active: true },
    { id: 'fs-2', name: 'World Bank - OneWASH CWA Program', code: 'WB-CWA', category: 'Multilateral', description: 'Consolidated WaSH Account Phase II / III', active: true },
    { id: 'fs-3', name: 'UNICEF Ethiopia WaSH Initiative', code: 'UNICEF-WASH', category: 'Multilateral', description: 'Emergency & Resilient WASH in drought prone zones', active: true },
    { id: 'fs-4', name: 'African Development Bank (AfDB)', code: 'AfDB-RWS', category: 'Multilateral', description: 'Rural Water Supply & Sanitation Program', active: true },
    { id: 'fs-5', name: 'Cowash Phase IV (Govt of Finland)', code: 'COWASH-IV', category: 'Bilateral', description: 'Community-Led Accelerated WaSH in Oromia', active: true },
    { id: 'fs-6', name: 'Second Urban Water Supply & Sanitation (SUWSSP)', code: 'SUWSSP', category: 'Multilateral', description: 'Town Water Supply & Faecal Sludge Management', active: true },
    { id: 'fs-7', name: 'Borena Resilient WASH Initiative', code: 'BOR-RES', category: 'Bilateral', description: 'Specialized deep aquifer & pastoral water security', active: true },
    { id: 'fs-8', name: 'KfW Development Bank', code: 'KfW-ETH', category: 'Bilateral', description: 'Sustainable water resources and watershed management', active: true },
    { id: 'fs-9', name: 'Community & Beneficiary Contribution', code: 'COMM-CONTR', category: 'Community Contribution', description: 'Cash, upfront labor and local construction materials', active: true },
    { id: 'fs-10', name: 'NGO / Philanthropic Partner', code: 'NGO-PARTNER', category: 'NGO / Donor', description: 'International & local humanitarian non-governmental bodies', active: true }
];
export const INITIAL_CURRENCIES = [
    { code: 'ETB', name: 'Ethiopian Birr', symbol: 'ETB', isBase: true, exchangeRateToETB: 1.0 },
    { code: 'USD', name: 'US Dollar', symbol: '$', isBase: false, exchangeRateToETB: 135.5 },
    { code: 'EURO', name: 'Euro', symbol: '€', isBase: false, exchangeRateToETB: 147.2 },
    { code: 'GBP', name: 'British Pound', symbol: '£', isBase: false, exchangeRateToETB: 172.0 }
];
export const INITIAL_PROCUREMENT_METHODS = [
    'National Competitive Bidding (NCB)',
    'International Competitive Bidding (ICB)',
    'Request for Quotations (RFQ)',
    'Direct Contracting / Single Source',
    'Quality & Cost Based Selection (QCBS)',
    'Least Cost Selection (LCS)',
    'Community-Based Procurement (CBP)'
];
// ==========================================
// 1. MASTER DATA CATALOG CATEGORIES
// ==========================================
export const INITIAL_CATALOG_CATEGORIES = [
    // Project Domain
    { id: 'cat-prj-type', code: 'PROJECT_TYPE', name: 'Project Sector / Type', domain: 'PROJECT', description: 'High-level water and infrastructure sectors', isHierarchical: true, isSystem: true, displayOrder: 1 },
    { id: 'cat-prj-subtype', code: 'PROJECT_SUBTYPE', name: 'Project Technical Subtype', domain: 'PROJECT', description: 'Specific scheme technical intervention options', parentCategoryCode: 'PROJECT_TYPE', isHierarchical: true, isSystem: true, displayOrder: 2 },
    { id: 'cat-prj-status', code: 'PROJECT_STATUS', name: 'Project Lifecycle Status', domain: 'PROJECT', description: 'Governance status of planning and approved schemes', isSystem: true, displayOrder: 3 },
    { id: 'cat-prj-priority', code: 'PROJECT_PRIORITY', name: 'Project Priority Rating', domain: 'PROJECT', description: 'Strategic priority ranking for resource allocation', isSystem: true, displayOrder: 4 },
    { id: 'cat-prj-class', code: 'PROJECT_CLASSIFICATION', name: 'Project Classification', domain: 'PROJECT', description: 'Scale classification: Mega Capital, Medium, Community, Emergency', isSystem: true, displayOrder: 5 },
    { id: 'cat-prj-phase', code: 'PROJECT_PHASE', name: 'Implementation Phase', domain: 'PROJECT', description: 'Execution lifecycle phases from appraisal to handover', isSystem: true, displayOrder: 6 },
    { id: 'cat-prj-scope', code: 'PROJECT_SCOPE', name: 'Project Scope Model', domain: 'PROJECT', description: 'Turnkey EPC, Civil Only, Supply & Install, Force Account', isSystem: true, displayOrder: 7 },
    { id: 'cat-water-src', code: 'WATER_SOURCE', name: 'Water Source Types', domain: 'PROJECT', description: 'Hydrological intake or raw water extraction classification', isSystem: true, displayOrder: 8 },
    { id: 'cat-energy-src', code: 'ENERGY_SOURCE', name: 'Pumping & Power Sources', domain: 'PROJECT', description: 'Power source driving the water supply pumping systems', isSystem: true, displayOrder: 9 },
    { id: 'cat-int-type', code: 'INTERVENTION_TYPE', name: 'Intervention Classification', domain: 'PROJECT', description: 'New construction, rehabilitation, or expansion', isSystem: true, displayOrder: 10 },
    { id: 'cat-src-rel', code: 'RELIABILITY_RATING', name: 'Source Reliability Rating', domain: 'PROJECT', description: 'Seasonal and year-round hydrological discharge assurance', isSystem: true, displayOrder: 11 },
    // Contract Domain
    { id: 'cat-ctr-type', code: 'CONTRACT_TYPE', name: 'Contract Type', domain: 'CONTRACT', description: 'Standard Ethiopian public procurement contract typologies', isSystem: true, displayOrder: 12 },
    { id: 'cat-ctr-status', code: 'CONTRACT_STATUS', name: 'Contract Status', domain: 'CONTRACT', description: 'Administrative execution and compliance status', isSystem: true, displayOrder: 13 },
    { id: 'cat-ctr-cat', code: 'CONTRACT_CATEGORY', name: 'Contract Category', domain: 'CONTRACT', description: 'Major categories: Works, Goods, Consultancy, Non-Consultancy', isSystem: true, displayOrder: 14 },
    { id: 'cat-proc-method', code: 'PROCUREMENT_METHOD', name: 'Procurement Method', domain: 'CONTRACT', description: 'PPA statutory procurement methods and thresholds', isSystem: true, displayOrder: 15 },
    { id: 'cat-contractor-type', code: 'CONTRACTOR_TYPE', name: 'Contractor Classification', domain: 'CONTRACT', description: 'Grade and specialization of construction enterprises (GC/WWC-1 to 6)', isSystem: true, displayOrder: 16 },
    { id: 'cat-consultant-type', code: 'CONSULTANT_TYPE', name: 'Consultant Specialization', domain: 'CONTRACT', description: 'Engineering, Hydrology, EIA, and Construction Supervision firms', isSystem: true, displayOrder: 17 },
    { id: 'cat-deliv-cat', code: 'DELIVERABLE_CATEGORY', name: 'Deliverable Categories', domain: 'CONTRACT', description: 'Major milestones and physical outputs linked to contracts', isSystem: true, displayOrder: 18 },
    { id: 'cat-amend-type', code: 'AMENDMENT_TYPE', name: 'Contract Amendment Type', domain: 'CONTRACT', description: 'Variation orders, time extensions, and scope changes', isSystem: true, displayOrder: 19 },
    { id: 'cat-var-status', code: 'VARIATION_STATUS', name: 'Variation Status', domain: 'CONTRACT', description: 'Approval states for contract variation proposals', isSystem: true, displayOrder: 20 },
    { id: 'cat-claim-src', code: 'CLAIM_SOURCE', name: 'Claim Source', domain: 'CONTRACT', description: 'Contractor, Employer, or Consultant originating claims', isSystem: true, displayOrder: 21 },
    { id: 'cat-claim-status', code: 'CLAIM_STATUS', name: 'Claim Adjudication Status', domain: 'CONTRACT', description: 'Review, settlement, and DAB referral states', isSystem: true, displayOrder: 22 },
    { id: 'cat-term-reason', code: 'TERMINATION_REASON', name: 'Contract Termination Rationale', domain: 'CONTRACT', description: 'Legal and performance grounds for contract termination', isSystem: true, displayOrder: 23 },
    // Payment Domain
    { id: 'cat-pay-type', code: 'PAYMENT_TYPE', name: 'Payment Milestone Type', domain: 'PAYMENT', description: 'Advance mobilization, interim progress, or retention release', isSystem: true, displayOrder: 24 },
    { id: 'cat-pay-status', code: 'PAYMENT_STATUS', name: 'Payment Certification Status', domain: 'PAYMENT', description: 'Workflow verification and disbursement states', isSystem: true, displayOrder: 25 },
    { id: 'cat-pay-method', code: 'PAYMENT_METHOD', name: 'Disbursement Method', domain: 'PAYMENT', description: 'Direct bank transfer, letter of credit, or regional treasury', isSystem: true, displayOrder: 26 },
    { id: 'cat-pay-cat', code: 'PAYMENT_CATEGORY', name: 'Payment Category', domain: 'PAYMENT', description: 'Advance Mobilization, Interim Certificate, Retention, Price Escalation', isSystem: true, displayOrder: 27 },
    { id: 'cat-pay-source', code: 'PAYMENT_SOURCE', name: 'Payment Source Account', domain: 'PAYMENT', description: 'Regional Treasury, OneWASH CWA Account, Donor Direct, Partner Fund', isSystem: true, displayOrder: 28 },
    // Risk Domain
    { id: 'cat-risk-cat', code: 'RISK_CATEGORY', name: 'Risk Category', domain: 'RISK', description: 'Environmental, technical, social, and financial risks', isSystem: true, displayOrder: 29 },
    { id: 'cat-risk-lvl', code: 'RISK_LEVEL', name: 'Risk Severity Level', domain: 'RISK', description: 'Qualitative severity ratings (Low to Critical)', isSystem: true, displayOrder: 30 },
    { id: 'cat-risk-status', code: 'RISK_STATUS', name: 'Risk Mitigation Status', domain: 'RISK', description: 'Identified, Mitigated, Escalated, Closed, Transferred', isSystem: true, displayOrder: 31 },
    { id: 'cat-risk-prob', code: 'RISK_PROBABILITY', name: 'Risk Probability Rating', domain: 'RISK', description: 'Likelihood of risk event occurring during scheme lifecycle', isSystem: true, displayOrder: 32 },
    { id: 'cat-risk-imp', code: 'RISK_IMPACT', name: 'Risk Impact Rating', domain: 'RISK', description: 'Potential cost and schedule impact of risk occurrence', isSystem: true, displayOrder: 33 },
    // Documents Domain
    { id: 'cat-doc-type', code: 'DOCUMENT_TYPE', name: 'Document Type', domain: 'DOCUMENTS', description: 'Specific official tender and contract document artifacts', isSystem: true, displayOrder: 34 },
    { id: 'cat-doc-cat', code: 'DOCUMENT_CATEGORY', name: 'Document Classification', domain: 'DOCUMENTS', description: 'Official project and technical document categories', isSystem: true, displayOrder: 35 },
    { id: 'cat-doc-status', code: 'DOCUMENT_STATUS', name: 'Document Lifecycle Status', domain: 'DOCUMENTS', description: 'Draft, verified, approved, or archived', isSystem: true, displayOrder: 36 },
    { id: 'cat-doc-version', code: 'DOCUMENT_VERSION_TYPE', name: 'Document Version Type', domain: 'DOCUMENTS', description: 'Initial Draft, Appraisal Version, Tender Final, As-Built Revision', isSystem: true, displayOrder: 37 },
    // Organization Domain
    { id: 'cat-org-type', code: 'ORGANIZATION_TYPE', name: 'Organization Type', domain: 'ORGANIZATION', description: 'Government Bureau, Public Utility, PIU, NGO Partner, Contractor Firm', isSystem: true, displayOrder: 38 },
    { id: 'cat-org-dir', code: 'DIRECTORATE', name: 'Bureau Directorates', domain: 'ORGANIZATION', description: 'OWEB head office directorship divisions', isHierarchical: true, isSystem: true, displayOrder: 39 },
    { id: 'cat-org-dept', code: 'DEPARTMENT', name: 'Department / Unit', domain: 'ORGANIZATION', description: 'Operational units subordinate to directorates', parentCategoryCode: 'DIRECTORATE', isHierarchical: true, isSystem: true, displayOrder: 40 },
    { id: 'cat-org-team', code: 'TEAM', name: 'Technical Working Team', domain: 'ORGANIZATION', description: 'Multidisciplinary inspection and engineering squads', parentCategoryCode: 'DEPARTMENT', isHierarchical: true, isSystem: true, displayOrder: 41 },
    { id: 'cat-org-pos', code: 'POSITION', name: 'Staff Position / Role Title', domain: 'ORGANIZATION', description: 'Official civil service and project cadre titles', isSystem: true, displayOrder: 42 },
    { id: 'cat-impl-body', code: 'IMPLEMENTING_BODY', name: 'Implementing Agency', domain: 'ORGANIZATION', description: 'Executing entities, PIUs, zonal offices, and utilities', isSystem: true, displayOrder: 43 },
    // Geography Domain
    { id: 'cat-geo-reg', code: 'REGION', name: 'Regional State', domain: 'GEOGRAPHY', description: 'First-level administrative region', isHierarchical: true, isSystem: true, displayOrder: 44 },
    { id: 'cat-geo-zone', code: 'ZONE', name: 'Administrative Zone', domain: 'GEOGRAPHY', description: 'Zonal water administrations in Oromia', parentCategoryCode: 'REGION', isHierarchical: true, isSystem: true, displayOrder: 45 },
    { id: 'cat-geo-woreda', code: 'WOREDA', name: 'Woreda (District)', domain: 'GEOGRAPHY', description: 'District water desk jurisdictions', parentCategoryCode: 'ZONE', isHierarchical: true, isSystem: true, displayOrder: 46 },
    { id: 'cat-geo-kebele', code: 'KEBELE', name: 'Kebele (Community)', domain: 'GEOGRAPHY', description: 'Grassroots community administration', parentCategoryCode: 'WOREDA', isHierarchical: true, isSystem: true, displayOrder: 47 },
    // General Domain
    { id: 'cat-gen-prio', code: 'PRIORITY', name: 'Priority Levels', domain: 'GENERAL', description: 'Global multi-module priority ratings (High, Medium, Low, Critical)', isSystem: true, displayOrder: 48 },
    { id: 'cat-gen-status', code: 'STATUS', name: 'Generic System Statuses', domain: 'GENERAL', description: 'Active, Inactive, Pending, Archived, Suspended status flags', isSystem: true, displayOrder: 49 },
    { id: 'cat-gen-curr', code: 'CURRENCY', name: 'Currencies & Rates', domain: 'GENERAL', description: 'Operational project currencies with ETB exchange rates', isSystem: true, displayOrder: 50 },
    { id: 'cat-gen-unit', code: 'UNIT_OF_MEASURE', name: 'Units of Measurement', domain: 'GENERAL', description: 'Engineering, volumetric, and billing metrics', isSystem: true, displayOrder: 51 },
    { id: 'cat-gen-unit-short', code: 'UNIT', name: 'Standard Engineering Units', domain: 'GENERAL', description: 'Physical metric notations: m, km, m3, l/s, ha, pcs', isSystem: true, displayOrder: 52 },
    { id: 'cat-gen-fund', code: 'FUNDING_SOURCE', name: 'Financing Partners & Donors', domain: 'GENERAL', description: 'Bilateral, multilateral, and government financiers', isSystem: true, displayOrder: 53 }
];
// ==========================================
// 2. MASTER DATA CATALOG ITEMS (SEED DATA)
// ==========================================
export const buildInitialCatalogItems = () => {
    const items = [];
    const now = new Date().toISOString();
    const addItem = (categoryCode, code, name, opts = {}) => {
        items.push({
            id: `MDI-${categoryCode}-${code}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            categoryCode,
            code,
            name,
            description: opts.description || name,
            parentId: opts.parentId,
            parentCode: opts.parentCode,
            displayOrder: opts.displayOrder || items.length + 1,
            isActive: opts.isActive ?? true,
            isDefault: opts.isDefault ?? false,
            metadata: opts.metadata || {},
            createdBy: 'System Provisioning',
            createdAt: now,
            updatedBy: 'System Provisioning',
            updatedAt: now
        });
    };
    // Project Statuses
    addItem('PROJECT_STATUS', 'DRAFT', 'Draft Scheme Concept', { description: 'Initial project profile formulated by planning officer', displayOrder: 1, isDefault: true, metadata: { badgeColor: 'bg-slate-100 text-slate-700' } });
    addItem('PROJECT_STATUS', 'SUBMITTED', 'Submitted for Review', { description: 'Project finalized and submitted to desk appraisal', displayOrder: 2, metadata: { badgeColor: 'bg-amber-100 text-amber-800' } });
    addItem('PROJECT_STATUS', 'UNDER_REVIEW', 'Under Technical Review', { description: 'Engineering and hydrology verification in progress', displayOrder: 3, metadata: { badgeColor: 'bg-blue-100 text-blue-800' } });
    addItem('PROJECT_STATUS', 'APPROVED', 'Approved by Bureau', { description: 'Technically and financially approved for procurement', displayOrder: 4, metadata: { badgeColor: 'bg-emerald-100 text-emerald-800' } });
    addItem('PROJECT_STATUS', 'REJECTED', 'Appraisal Rejected', { description: 'Project proposal fails basic viability or ESMP screening', displayOrder: 5, metadata: { badgeColor: 'bg-rose-100 text-rose-800' } });
    addItem('PROJECT_STATUS', 'REVISION_REQUESTED', 'Revision Requested', { description: 'Returned to creator for technical corrections', displayOrder: 6, metadata: { badgeColor: 'bg-purple-100 text-purple-800' } });
    // Project Priorities
    addItem('PROJECT_PRIORITY', 'HIGH', 'High Strategic Priority', { description: 'Drought-prone zone or emergency water shortage area', displayOrder: 1, metadata: { scoreWeight: 10 } });
    addItem('PROJECT_PRIORITY', 'MEDIUM', 'Medium Priority', { description: 'Standard planned rural or urban expansion scheme', displayOrder: 2, isDefault: true, metadata: { scoreWeight: 5 } });
    addItem('PROJECT_PRIORITY', 'LOW', 'Low Priority', { description: 'Discretionary or phased secondary investment', displayOrder: 3, metadata: { scoreWeight: 2 } });
    // Project Types & Subtypes
    const projectTypes = [
        { code: 'WATER_SUPPLY', name: 'Water Supply Infrastructure' },
        { code: 'SANITATION', name: 'Sanitation & Hygiene' },
        { code: 'WATER_RESOURCES', name: 'Water Resources & Catchment Conservation' },
        { code: 'IRRIGATION_WATERSHED', name: 'Smallholder Irrigation & Watershed' }
    ];
    projectTypes.forEach((pt, idx) => {
        addItem('PROJECT_TYPE', pt.code, pt.name, { displayOrder: idx + 1 });
    });
    const subtypesMap = {
        'WATER_SUPPLY': [
            'Solar-Powered Rural Scheme',
            'Urban Piped Multi-Village System',
            'Deep Well Drilling & Distribution',
            'Shallow Well with Hand Pump',
            'Spring Protection & Gravity Piped',
            'Sand Dam & Sub-Surface Dam',
            'Rainwater Harvesting Mega-Tank'
        ],
        'SANITATION': [
            'Public Toilet Construction',
            'Institutional VIP Latrine Cluster',
            'Faecal Sludge Treatment Facility',
            'Solid Waste Management System',
            'School WASH Hygiene Center'
        ],
        'WATER_RESOURCES': [
            'Watershed Protection & Catchment Conservation',
            'Groundwater Recharge Structure',
            'Spring Catchment Reforestation',
            'Ancient Tula Well Rehabilitation'
        ],
        'IRRIGATION_WATERSHED': [
            'Micro-Earth Dam for Smallholder Irrigation',
            'River Diversion Weir & Canal Network',
            'Watershed Soil & Water Conservation'
        ]
    };
    Object.entries(subtypesMap).forEach(([parentCode, list]) => {
        list.forEach((subName, sIdx) => {
            const code = `${parentCode}_${subName.replace(/[^A-Za-z0-9]/g, '_').toUpperCase().slice(0, 24)}`;
            addItem('PROJECT_SUBTYPE', code, subName, {
                parentCode,
                displayOrder: sIdx + 1
            });
        });
    });
    // Water Sources
    [
        'Spring',
        'Borehole / Deep Well',
        'Shallow Well',
        'Perennial River',
        'Rainwater Harvesting Reservoir',
        'Lake / Natural Dam'
    ].forEach((ws, idx) => {
        addItem('WATER_SOURCE', `WS_${idx + 1}`, ws, { displayOrder: idx + 1 });
    });
    // Energy Sources
    [
        'Solar PV Array',
        'National Grid (EEU)',
        'Diesel / Generator Unit',
        'Hybrid (Solar + Generator)',
        'Gravity Flow (No External Energy)',
        'Wind Kinetic Pump'
    ].forEach((es, idx) => {
        addItem('ENERGY_SOURCE', `ES_${idx + 1}`, es, { displayOrder: idx + 1 });
    });
    // Intervention Types
    [
        'New Construction',
        'Expansion & Upgrading',
        'Rehabilitation & Restoration',
        'Emergency Drought Response'
    ].forEach((it, idx) => {
        addItem('INTERVENTION_TYPE', `IT_${idx + 1}`, it, { displayOrder: idx + 1 });
    });
    // Source Reliability
    [
        'Reliable (Year-Round Discharge)',
        'Moderate (Minor Dry Season Drop)',
        'Seasonal (Significant Flow Fluctuation)',
        'Unreliable / Depleting Aquifer'
    ].forEach((sr, idx) => {
        addItem('RELIABILITY_RATING', `SR_${idx + 1}`, sr, { displayOrder: idx + 1 });
    });
    // Contract Types & Procurement Methods
    [
        { code: 'CIVIL_WORKS', name: 'Civil Construction Works Contract' },
        { code: 'GOODS_SUPPLY', name: 'Pipes, Fittings & Equipment Supply' },
        { code: 'CONSULTING_SVCS', name: 'Feasibility & Engineering Supervision' },
        { code: 'TURNKEY_EPC', name: 'Design-Build (EPC) Turnkey Contract' },
        { code: 'COMMUNITY_FORCE', name: 'Community Force Account Contract' }
    ].forEach((ct, idx) => {
        addItem('CONTRACT_TYPE', ct.code, ct.name, { displayOrder: idx + 1 });
    });
    INITIAL_PROCUREMENT_METHODS.forEach((pm, idx) => {
        addItem('PROCUREMENT_METHOD', `PM_${idx + 1}`, pm, { displayOrder: idx + 1 });
    });
    // Contract Statuses
    [
        'Draft Contract Agreement',
        'Active & Under Implementation',
        'Substantially Completed (Snag Stage)',
        'Fully Commissioned & Handed Over',
        'Suspended by Engineer Notice',
        'Terminated Due to Default'
    ].forEach((st, idx) => {
        addItem('CONTRACT_STATUS', `CS_${idx + 1}`, st, { displayOrder: idx + 1 });
    });
    // Payment Milestone Types
    [
        'Advance Mobilization Payment (Up to 30%)',
        'Interim Progress Certificate (IPC)',
        'Materials on Site (MoS) Advance',
        'Substantial Completion Release (50% Retention)',
        'Defects Liability Final Settlement (100% Retention)'
    ].forEach((pt, idx) => {
        addItem('PAYMENT_TYPE', `PT_${idx + 1}`, pt, { displayOrder: idx + 1 });
    });
    // Risk Levels & Categories
    ['Low', 'Medium', 'High', 'Critical'].forEach((rl, idx) => {
        addItem('RISK_LEVEL', `RL_${idx + 1}`, rl, { displayOrder: idx + 1 });
    });
    [
        'Technical & Hydrogeological Risk',
        'Environmental & Safeguards (ESMP) Risk',
        'Contractor Capacity & Liquidity Risk',
        'Community & Right-of-Way Dispute Risk',
        'Security & Access Constraint Risk'
    ].forEach((rc, idx) => {
        addItem('RISK_CATEGORY', `RC_${idx + 1}`, rc, { displayOrder: idx + 1 });
    });
    // Document Categories
    [
        'Feasibility Study',
        'EIA Report',
        'Contract Agreement',
        'Technical Drawing & BoQ',
        'Progress Report & Site Log',
        'Milestone Inspection Certificate',
        'Site Handover Record',
        'Variation & Claim Order',
        'Photo & Geotagged Survey',
        'Other Official Record'
    ].forEach((dc, idx) => {
        addItem('DOCUMENT_CATEGORY', `DC_${idx + 1}`, dc, { displayOrder: idx + 1 });
    });
    // Units of Measure
    [
        { code: 'M3', name: 'Cubic Meters (m³)' },
        { code: 'L_SEC', name: 'Liters per Second (l/s)' },
        { code: 'KM', name: 'Kilometers (km)' },
        { code: 'MTR', name: 'Meters (m)' },
        { code: 'PCS', name: 'Pieces / Units (pcs)' },
        { code: 'LS', name: 'Lump Sum (LS)' },
        { code: 'HA', name: 'Hectares (ha)' }
    ].forEach((u, idx) => {
        addItem('UNIT_OF_MEASURE', u.code, u.name, { displayOrder: idx + 1 });
    });
    // Regional Geography: Region -> Zones -> Sample Woredas
    addItem('REGION', 'OROMIA', 'Oromia National Regional State', { displayOrder: 1 });
    const zonesList = Object.keys(OROMIA_HIERARCHY);
    zonesList.forEach((zoneName, zIdx) => {
        const zoneCode = `ZONE_${zoneName.replace(/[^A-Za-z0-9]/g, '_').toUpperCase().slice(0, 18)}`;
        addItem('ZONE', zoneCode, zoneName, {
            parentCode: 'OROMIA',
            displayOrder: zIdx + 1
        });
        // Woredas for this Zone
        const woredas = OROMIA_HIERARCHY[zoneName] || [];
        woredas.forEach((woredaName, wIdx) => {
            const woredaCode = `WOR_${zoneCode}_${woredaName.replace(/[^A-Za-z0-9]/g, '_').toUpperCase().slice(0, 16)}`;
            addItem('WOREDA', woredaCode, woredaName, {
                parentCode: zoneCode,
                displayOrder: wIdx + 1
            });
        });
    });
    // Bureau Directorates & Departments
    const directorates = [
        { code: 'DIR_WATER_SUPPLY', name: 'Water Supply & Sanitation Directorate' },
        { code: 'DIR_CONTRACT_ADMIN', name: 'Contract Administration Directorate' },
        { code: 'DIR_PROCUREMENT', name: 'Procurement & Property Administration Directorate' },
        { code: 'DIR_FEASIBILITY', name: 'Study, Design & Feasibility Directorate' },
        { code: 'DIR_SAFEGUARDS', name: 'Environmental & Social Safeguards Directorate' },
        { code: 'DIR_FINANCE', name: 'Finance, Budget & Disbursement Directorate' },
        { code: 'DIR_PLANNING', name: 'Planning, Monitoring & Evaluation Directorate' }
    ];
    directorates.forEach((d, idx) => {
        addItem('DIRECTORATE', d.code, d.name, { displayOrder: idx + 1 });
    });
    // Implementing Bodies
    [
        'OWEB Head Office Direct Execution',
        'Zonal Water Resource Bureau',
        'Woreda Water Office',
        'Urban Water Utility Enterprise',
        'WASHCO Community Committee',
        'OneWASH National Program PIU',
        'UNICEF WaSH Partner Unit',
        'Cowash Project Office',
        'Supervision Engineering Firm / NGO'
    ].forEach((ib, idx) => {
        addItem('IMPLEMENTING_BODY', `IB_${idx + 1}`, ib, { displayOrder: idx + 1 });
    });
    // Project Classification
    [
        { code: 'MEGA_CAPITAL', name: 'Mega Capital Scheme (>50M ETB)' },
        { code: 'MEDIUM_SCHEME', name: 'Medium Regional Scheme (10M - 50M ETB)' },
        { code: 'COMMUNITY_SCALE', name: 'Community-Scale Scheme (<10M ETB)' },
        { code: 'EMERGENCY_DROUGHT', name: 'Emergency Rapid Response Intervention' }
    ].forEach((pc, idx) => {
        addItem('PROJECT_CLASSIFICATION', pc.code, pc.name, { displayOrder: idx + 1 });
    });
    // Project Scope
    [
        { code: 'TURNKEY_EPC', name: 'Turnkey Design-Build (EPC)' },
        { code: 'CIVIL_ONLY', name: 'Civil Construction Works Only' },
        { code: 'SUPPLY_INSTALL', name: 'Electromechanical Supply & Installation' },
        { code: 'DRILLING_ONLY', name: 'Deep Well Drilling & Pumping Test Only' },
        { code: 'FORCE_ACCOUNT', name: 'Community Force Account' }
    ].forEach((ps, idx) => {
        addItem('PROJECT_SCOPE', ps.code, ps.name, { displayOrder: idx + 1 });
    });
    // Contract Category
    [
        { code: 'WORKS', name: 'Civil & Hydraulic Construction Works' },
        { code: 'GOODS', name: 'Plant, Pipes & Equipment Supply' },
        { code: 'CONSULTANCY', name: 'Consulting & Supervision Services' },
        { code: 'NON_CONSULTING', name: 'Non-Consulting Technical Services' }
    ].forEach((cc, idx) => {
        addItem('CONTRACT_CATEGORY', cc.code, cc.name, { displayOrder: idx + 1 });
    });
    // Consultant Types
    [
        'Water Supply Design & Feasibility Consultant',
        'Resident Supervising Engineering Firm',
        'Environmental & Social Impact (ESMP) Consultant',
        'Independent Technical & Financial Auditor',
        'Geophysical & Borehole Siting Specialist'
    ].forEach((ct, idx) => {
        addItem('CONSULTANT_TYPE', `CONS_${idx + 1}`, ct, { displayOrder: idx + 1 });
    });
    // Payment Category
    [
        'Advance Mobilization Payment',
        'Interim Payment Certificate (IPC)',
        'Retention Money Partial Release (50%)',
        'Retention Money Final Release (100%)',
        'Price Escalation / Adjustment Payment',
        'Final Contract Settlement'
    ].forEach((pc, idx) => {
        addItem('PAYMENT_CATEGORY', `PAYCAT_${idx + 1}`, pc, { displayOrder: idx + 1 });
    });
    // Payment Source
    [
        'OWEB Regional Treasury Capital Account',
        'World Bank Consolidated WaSH Account (CWA)',
        'African Development Bank (AfDB) Basket',
        'Bilateral Donor Direct Disbursement',
        'Beneficiary Community Cash Contribution'
    ].forEach((ps, idx) => {
        addItem('PAYMENT_SOURCE', `PAYSRC_${idx + 1}`, ps, { displayOrder: idx + 1 });
    });
    // Risk Status
    [
        'Identified & Logged',
        'Under Active Monitoring',
        'Mitigated & Controlled',
        'Escalated to Directorate',
        'Closed & Resolved',
        'Transferred to Third Party'
    ].forEach((rs, idx) => {
        addItem('RISK_STATUS', `RS_${idx + 1}`, rs, { displayOrder: idx + 1 });
    });
    // Document Type
    [
        'Standard Bidding Document (SBD)',
        'Bill of Quantities (BoQ) & Cost Estimate',
        'Engineering Working Drawing & Hydraulic Profile',
        'Contract Agreement & Legal Addenda',
        'Environmental & Social Safeguards Clearance',
        'Interim Payment Certificate (IPC Form 3)',
        'Substantial Completion Certificate & Snag List',
        'Final Handover & Acceptance Protocol'
    ].forEach((dt, idx) => {
        addItem('DOCUMENT_TYPE', `DT_${idx + 1}`, dt, { displayOrder: idx + 1 });
    });
    // Document Version Type
    [
        'Initial Formulation Draft',
        'Appraisal & Verification Revision',
        'Final Tender Baseline',
        'Approved Contract Variation Baseline',
        'As-Built Post-Commissioning Dossier'
    ].forEach((dvt, idx) => {
        addItem('DOCUMENT_VERSION_TYPE', `DVT_${idx + 1}`, dvt, { displayOrder: idx + 1 });
    });
    // Organization Type
    [
        'Regional Government Bureau',
        'Zonal Water Administration',
        'Woreda Water Desk Office',
        'Urban Water Utility Enterprise',
        'Community WASHCO Committee',
        'General Building Contractor (GC)',
        'Water Works Contractor (WWC)',
        'Consulting Engineering Enterprise'
    ].forEach((ot, idx) => {
        addItem('ORGANIZATION_TYPE', `OT_${idx + 1}`, ot, { displayOrder: idx + 1 });
    });
    // Team
    [
        'Hydrogeology & Well Siting Squad',
        'Civil Construction Supervision Unit',
        'Contract & Claim Adjudication Desk',
        'Environmental & Social Safeguards Team',
        'Procurement Evaluation Committee Panel',
        'Quality Assurance & Materials Testing Lab'
    ].forEach((tm, idx) => {
        addItem('TEAM', `TEAM_${idx + 1}`, tm, { displayOrder: idx + 1 });
    });
    // Staff Position
    [
        'Bureau Head / Regional Commissioner',
        'Technical Directorate Director',
        'Senior Contract Administrator',
        'Senior Resident Supervising Engineer',
        'Hydrogeologist / Borehole Logging Specialist',
        'Environmental Safeguards Specialist',
        'Procurement Specialist & Tenders Lead',
        'Field Monitoring & GIS Officer'
    ].forEach((pos, idx) => {
        addItem('POSITION', `POS_${idx + 1}`, pos, { displayOrder: idx + 1 });
    });
    // Generic Priority
    ['Critical', 'High', 'Medium', 'Low'].forEach((pr, idx) => {
        addItem('PRIORITY', pr.toUpperCase(), `${pr} Priority`, { displayOrder: idx + 1 });
    });
    // Generic Status
    ['Active', 'Inactive', 'Pending', 'Suspended', 'Archived'].forEach((st, idx) => {
        addItem('STATUS', st.toUpperCase(), st, { displayOrder: idx + 1 });
    });
    // Standard Engineering Units (UNIT)
    [
        { code: 'M', name: 'Meters (m)' },
        { code: 'KM', name: 'Kilometers (km)' },
        { code: 'M3', name: 'Cubic Meters (m³)' },
        { code: 'L_SEC', name: 'Liters per Second (l/s)' },
        { code: 'HA', name: 'Hectares (ha)' },
        { code: 'PCS', name: 'Pieces (pcs)' },
        { code: 'LS', name: 'Lump Sum (LS)' },
        { code: 'PCT', name: 'Percentage (%)' }
    ].forEach((u, idx) => {
        addItem('UNIT', u.code, u.name, { displayOrder: idx + 1 });
    });
    return items;
};
// ==========================================
// 3. SYSTEM CONFIGURATION DEFINITIONS
// ==========================================
export const INITIAL_SYSTEM_CONFIGURATIONS = [
    {
        id: 'cfg-app-name',
        key: 'APPLICATION_NAME',
        name: 'Application Display Name',
        category: 'General',
        value: 'OWEB Program-Based Project Management System (PB-PMS)',
        defaultValue: 'OWEB Program-Based Project Management System (PB-PMS)',
        dataType: 'string',
        description: 'Brand title displayed on navigation bars, report covers, and login headers.',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'cfg-org-name',
        key: 'ORGANIZATION_NAME',
        name: 'Executive Bureau Organization Name',
        category: 'General',
        value: 'Oromia Water Resource Bureau (OWEB)',
        defaultValue: 'Oromia Water Resource Bureau (OWEB)',
        dataType: 'string',
        description: 'Legal public authority heading all official contract, procurement, and audit dossiers.',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'cfg-def-curr',
        key: 'DEFAULT_CURRENCY',
        name: 'Default Currency Code',
        category: 'Localization',
        value: 'ETB',
        defaultValue: 'ETB',
        dataType: 'select',
        options: ['ETB', 'USD', 'EURO', 'GBP'],
        description: 'Primary reporting and ledger currency used for budget allocations and disbursements.',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'cfg-date-fmt',
        key: 'DATE_FORMAT',
        name: 'System Date Display Format',
        category: 'Localization',
        value: 'DD/MM/YYYY',
        defaultValue: 'DD/MM/YYYY',
        dataType: 'select',
        options: ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'Ethiopian Calendar (EC)'],
        description: 'Standard date representation rendered across inspection logs, milestones, and reports.',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'cfg-tz',
        key: 'TIME_ZONE',
        name: 'Regional Time Zone',
        category: 'Localization',
        value: 'Africa/Addis_Ababa (UTC+3)',
        defaultValue: 'Africa/Addis_Ababa (UTC+3)',
        dataType: 'string',
        description: 'Time zone utilized for server activity logging, deadline countdowns, and bid opening schedules.',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'cfg-page-size',
        key: 'DEFAULT_PAGE_SIZE',
        name: 'Default Grid Page Size',
        category: 'General',
        value: '25',
        defaultValue: '25',
        dataType: 'number',
        description: 'Number of rows rendered by default in data tables across projects, procurements, and logs.',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'cfg-max-file-size',
        key: 'MAX_FILE_UPLOAD_SIZE_MB',
        name: 'Maximum File Upload Size (MB)',
        category: 'Files & Storage',
        value: '50',
        defaultValue: '50',
        dataType: 'number',
        description: 'Maximum permitted file payload for engineering drawings, EIA clearances, and feasibility reports.',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'cfg-allowed-file-types',
        key: 'ALLOWED_FILE_TYPES',
        name: 'Permitted File Extensions',
        category: 'Files & Storage',
        value: '.pdf, .docx, .xlsx, .dwg, .dxf, .jpg, .png',
        defaultValue: '.pdf, .docx, .xlsx, .dwg, .dxf, .jpg, .png',
        dataType: 'string',
        description: 'Comma-separated whitelist of allowed document extensions accepted by the document manager.',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'cfg-cost-overrun-thresh',
        key: 'PROJECT_COST_OVERRUN_ALERT_PERCENT',
        name: 'Budget Overrun Critical Threshold (%)',
        category: 'Thresholds & Limits',
        value: '10',
        defaultValue: '10',
        dataType: 'number',
        description: 'Percentage variance over baseline budget that triggers automated critical alert pulse in UI.',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'cfg-advance-cap',
        key: 'PAYMENT_ADVANCE_MAX_PERCENT',
        name: 'Statutory Advance Mobilization Cap (%)',
        category: 'Thresholds & Limits',
        value: '30',
        defaultValue: '30',
        dataType: 'number',
        description: 'Statutory ceiling for advance payments to contractors against unconditional bank guarantee.',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'cfg-perf-bond-min',
        key: 'PERFORMANCE_BOND_MANDATORY_PERCENT',
        name: 'Mandatory Performance Security (%)',
        category: 'Thresholds & Limits',
        value: '10',
        defaultValue: '10',
        dataType: 'number',
        description: 'Statutory minimum performance security required from lowest evaluated responsive bidder.',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'cfg-notif-retention',
        key: 'NOTIFICATION_RETENTION_DAYS',
        name: 'Notification Log Retention Window (Days)',
        category: 'Governance & Retention',
        value: '90',
        defaultValue: '90',
        dataType: 'number',
        description: 'Automatic purge threshold for transient user notifications and alert receipts.',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'cfg-notif-email',
        key: 'EMAIL_DISPATCH_NOTIFICATIONS_ENABLED',
        name: 'Email Alerts Enabled',
        category: 'Notifications',
        value: 'true',
        defaultValue: 'true',
        dataType: 'boolean',
        description: 'Toggle automated outward SMTP / dispatch notifications for critical workflow sign-offs.',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'cfg-prj-comp-threshold',
        key: 'PROJECT_COMPLETION_THRESHOLD_PERCENT',
        name: 'Project Substantial Completion Threshold (%)',
        category: 'Thresholds & Limits',
        value: '95',
        defaultValue: '95',
        dataType: 'number',
        description: 'Physical progress milestone required before initiating Joint Substantial Completion site inspection.',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'cfg-doc-retention-years',
        key: 'DOCUMENT_RETENTION_YEARS',
        name: 'Statutory Document Retention Period (Years)',
        category: 'Governance & Retention',
        value: '10',
        defaultValue: '10',
        dataType: 'number',
        description: 'Statutory minimum retention requirement for official contract agreements, BoQs, and payment vouchers.',
        updatedAt: new Date().toISOString()
    }
];
// ==========================================
// 4. CONFIGURABLE WORKFLOWS & STEPS
// ==========================================
export const INITIAL_WORKFLOW_DEFINITIONS = [
    {
        id: 'wf-prj-appraisal',
        code: 'WF_PROJECT_APPRAISAL',
        name: 'Scheme Feasibility & Planning Appraisal Workflow',
        module: 'planning',
        description: 'Standard 4-tier technical, environmental, and financial appraisal route for new capital schemes.',
        isActive: true,
        slaTotalDays: 14,
        version: '1.2.0',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'wf-pay-cert',
        code: 'WF_PAYMENT_APPROVAL',
        name: 'Interim Payment Certificate (IPC) Certification Workflow',
        module: 'contract',
        description: 'Multi-party measurement verification, quantity auditing, and disbursement sanction.',
        isActive: true,
        slaTotalDays: 10,
        version: '1.1.0',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'wf-var-order',
        code: 'WF_CONTRACT_VARIATION',
        name: 'Contract Variation & Extension of Time (EOT) Workflow',
        module: 'contract',
        description: 'Statutory engineering change evaluation, price adjustment, and bureau board ratification.',
        isActive: true,
        slaTotalDays: 21,
        version: '1.0.0',
        updatedAt: new Date().toISOString()
    },
    {
        id: 'wf-tnd-award',
        code: 'WF_TENDER_ENDORSEMENT',
        name: 'Bid Evaluation Committee (BEC) Award Endorsement',
        module: 'procurement',
        description: 'Preliminary scrutiny, technical scoring, standstill publication, and award resolution.',
        isActive: true,
        slaTotalDays: 15,
        version: '1.0.0',
        updatedAt: new Date().toISOString()
    }
];
export const INITIAL_WORKFLOW_STEPS = [
    // WF_PROJECT_APPRAISAL Steps
    {
        id: 'step-pa-1',
        workflowCode: 'WF_PROJECT_APPRAISAL',
        stepName: 'Scheme Formulation & Documentation',
        role: 'Planning Officer / Field Engineer',
        sequence: 1,
        isRequired: true,
        approvalType: 'Single Sign-off',
        slaDays: 3,
        isActive: true,
        actionLabel: 'Submit for Desk Review'
    },
    {
        id: 'step-pa-2',
        workflowCode: 'WF_PROJECT_APPRAISAL',
        stepName: 'Hydrology, Geotechnical & EIA Review',
        role: 'Reviewer',
        sequence: 2,
        isRequired: true,
        approvalType: 'Consensus',
        slaDays: 5,
        isActive: true,
        actionLabel: 'Verify 5-Point Technical Checklist'
    },
    {
        id: 'step-pa-3',
        workflowCode: 'WF_PROJECT_APPRAISAL',
        stepName: 'Technical Directorate Appraisal & Endorsement',
        role: 'Directorate Director',
        sequence: 3,
        isRequired: true,
        approvalType: 'Single Sign-off',
        slaDays: 3,
        isActive: true,
        actionLabel: 'Issue Technical Clearance'
    },
    {
        id: 'step-pa-4',
        workflowCode: 'WF_PROJECT_APPRAISAL',
        stepName: 'Bureau Head Budgetary Sanction & Approval',
        role: 'Administrator',
        sequence: 4,
        isRequired: true,
        approvalType: 'Single Sign-off',
        slaDays: 3,
        isActive: true,
        actionLabel: 'Final Formal Approval'
    },
    // WF_PAYMENT_APPROVAL Steps
    {
        id: 'step-py-1',
        workflowCode: 'WF_PAYMENT_APPROVAL',
        stepName: 'Physical Measurement & Joint Quantity Survey',
        role: 'Supervisor',
        sequence: 1,
        isRequired: true,
        approvalType: 'Single Sign-off',
        slaDays: 3,
        isActive: true,
        actionLabel: 'Certify Measurements'
    },
    {
        id: 'step-py-2',
        workflowCode: 'WF_PAYMENT_APPROVAL',
        stepName: 'Contract Compliance & Liquidated Damages Audit',
        role: 'Contract Manager',
        sequence: 2,
        isRequired: true,
        approvalType: 'Single Sign-off',
        slaDays: 4,
        isActive: true,
        actionLabel: 'Endorse Payment Certificate'
    },
    {
        id: 'step-py-3',
        workflowCode: 'WF_PAYMENT_APPROVAL',
        stepName: 'Treasury Budget Commitment & Final Disbursement',
        role: 'Administrator',
        sequence: 3,
        isRequired: true,
        approvalType: 'Single Sign-off',
        slaDays: 3,
        isActive: true,
        actionLabel: 'Authorize Treasury Transfer'
    }
];
// ==========================================
// 5. APPROVAL THRESHOLDS DEFINITIONS
// ==========================================
export const INITIAL_APPROVAL_THRESHOLDS = [
    // Payment Approval Thresholds
    {
        id: 'ath-pay-1',
        category: 'PAYMENT',
        title: 'Tier 1: Minor Routine Progress Payments',
        amountFromETB: 0,
        amountToETB: 1000000,
        requiredRole: 'Supervisor',
        approvalSequence: 1,
        mandatoryDocuments: ['Signed Measurement Sheet', 'Quality Test Certificate'],
        notes: 'Resident Supervising Engineer single sign-off sufficient.',
        isActive: true
    },
    {
        id: 'ath-pay-2',
        category: 'PAYMENT',
        title: 'Tier 2: Intermediate Milestone Disbursements',
        amountFromETB: 1000001,
        amountToETB: 10000000,
        requiredRole: 'Contract Manager',
        approvalSequence: 2,
        mandatoryDocuments: ['Interim Payment Certificate (IPC)', 'Advance Recovery Schedule', 'Site Inspection Log'],
        notes: 'Requires Contract Manager review and counter-signature.',
        isActive: true
    },
    {
        id: 'ath-pay-3',
        category: 'PAYMENT',
        title: 'Tier 3: Major Civil Works Disbursements',
        amountFromETB: 10000001,
        amountToETB: 50000000,
        requiredRole: 'Directorate Director',
        approvalSequence: 3,
        mandatoryDocuments: ['IPC Form 3', 'Finance Directorate Verification', 'Senior Resident Engineer Endorsement'],
        notes: 'Mandates Contract Administration Directorate Director sign-off.',
        isActive: true
    },
    {
        id: 'ath-pay-4',
        category: 'PAYMENT',
        title: 'Tier 4: Mega Capital Scheme & Final Settlements',
        amountFromETB: 50000001,
        amountToETB: 0, // unlimited
        requiredRole: 'Administrator',
        approvalSequence: 4,
        mandatoryDocuments: ['Final Account Audit Dossier', 'Dispute Clearance Letter', 'Regional Bureau Board Minutes'],
        notes: 'Reserved for Bureau Head / Board executive ratification.',
        isActive: true
    },
    // Variation Approval Thresholds
    {
        id: 'ath-var-1',
        category: 'VARIATION',
        title: 'Minor Engineering Variation (<5% Cumulative)',
        amountFromETB: 0,
        amountToETB: 2000000,
        requiredRole: 'Contract Manager',
        approvalSequence: 1,
        mandatoryDocuments: ['Engineer Variation Assessment', 'Site Justification Memo'],
        notes: 'Permissible within contingency allowance.',
        isActive: true
    },
    {
        id: 'ath-var-2',
        category: 'VARIATION',
        title: 'Substantial Scope Variation (5% to 15% Cumulative)',
        amountFromETB: 2000001,
        amountToETB: 15000000,
        requiredRole: 'Directorate Director',
        approvalSequence: 2,
        mandatoryDocuments: ['Comparative BoQ Analysis', 'Funding Agency No-Objection'],
        notes: 'Must be endorsed by Technical Director.',
        isActive: true
    },
    {
        id: 'ath-var-3',
        category: 'VARIATION',
        title: 'Statutory Limit Variation (15% to 25% Maximum)',
        amountFromETB: 15000001,
        amountToETB: 0,
        requiredRole: 'Administrator',
        approvalSequence: 3,
        mandatoryDocuments: ['Tender Endorsement Board Formal Resolution', 'Legal Directorate Clearance'],
        notes: 'Statutory ceiling under Ethiopian Public Procurement Directive.',
        isActive: true
    },
    // Contract Award & Execution Thresholds
    {
        id: 'ath-ctr-1',
        category: 'CONTRACT',
        title: 'Tier 1: Request for Quotation (RFQ) & Minor Works',
        amountFromETB: 0,
        amountToETB: 5000000,
        requiredRole: 'Contract Manager',
        approvalSequence: 1,
        mandatoryDocuments: ['Procurement Endorsement Minute', 'Budget Availability Clearance'],
        notes: 'Delegated authority to Contract Administration lead.',
        isActive: true
    },
    {
        id: 'ath-ctr-2',
        category: 'CONTRACT',
        title: 'Tier 2: Standard National Competitive Bidding (NCB)',
        amountFromETB: 5000001,
        amountToETB: 30000000,
        requiredRole: 'Directorate Director',
        approvalSequence: 2,
        mandatoryDocuments: ['BEC Final Evaluation Dossier', 'No-Objection Certificate (NOC)', 'Verified CPO Guarantee'],
        notes: 'Endorsement required from Technical Directorate Director.',
        isActive: true
    },
    {
        id: 'ath-ctr-3',
        category: 'CONTRACT',
        title: 'Tier 3: Mega Civil Construction & ICB Packages',
        amountFromETB: 30000001,
        amountToETB: 0,
        requiredRole: 'Administrator',
        approvalSequence: 3,
        mandatoryDocuments: ['Regional Tender Endorsement Board Resolution', 'Legal Counsel Form of Contract Certification'],
        notes: 'Mandatory Bureau Head / Tender Board final ratification.',
        isActive: true
    },
    // Scheme Budget Approval Thresholds
    {
        id: 'ath-prj-1',
        category: 'PROJECT_BUDGET',
        title: 'Community-Scale Water Point Schemes',
        amountFromETB: 0,
        amountToETB: 10000000,
        requiredRole: 'Supervisor',
        approvalSequence: 1,
        mandatoryDocuments: ['Woreda Desk Study', 'Community Contribution Commitment Letter'],
        notes: 'Zonal and woreda water desk delegation.',
        isActive: true
    },
    {
        id: 'ath-prj-2',
        category: 'PROJECT_BUDGET',
        title: 'Intermediate Multi-Village Piped Schemes',
        amountFromETB: 10000001,
        amountToETB: 50000000,
        requiredRole: 'Directorate Director',
        approvalSequence: 2,
        mandatoryDocuments: ['Comprehensive Feasibility Report', 'Certified EIA Clearance', 'Hydraulic Modeling Profile'],
        notes: 'Technical Directorate formal sign-off.',
        isActive: true
    },
    {
        id: 'ath-prj-3',
        category: 'PROJECT_BUDGET',
        title: 'Mega Regional Capital & Deep Well Projects',
        amountFromETB: 50000001,
        amountToETB: 0,
        requiredRole: 'Administrator',
        approvalSequence: 3,
        mandatoryDocuments: ['Regional Planning Commission Sanction', 'Financier Financing Agreement (Credit/Grant)'],
        notes: 'Bureau Cabinet & Regional State Executive Council Sanction.',
        isActive: true
    }
];
// ==========================================
// 6. INITIAL MASTER DATA AGGREGATION
// ==========================================
export const INITIAL_MASTER_DATA = {
    version: '2.0.0',
    lastPushedAt: new Date().toISOString(),
    lastPushedBy: 'System Administrator (OWEB)',
    changeNotes: 'Enterprise Master Data Catalog, centralized system configurations, workflow rules, and approval thresholds initialized.',
    // Normalized Catalog
    catalogCategories: INITIAL_CATALOG_CATEGORIES,
    catalogItems: buildInitialCatalogItems(),
    // Centralized System Configurations
    systemConfigurations: INITIAL_SYSTEM_CONFIGURATIONS,
    // Workflow Rules
    workflowDefinitions: INITIAL_WORKFLOW_DEFINITIONS,
    workflowSteps: INITIAL_WORKFLOW_STEPS,
    // Approval Thresholds
    approvalThresholds: INITIAL_APPROVAL_THRESHOLDS,
    // Audit & Version History Log
    historyEntries: [
        {
            id: 'hist-init',
            entityType: 'CONFIG',
            entityCode: 'APPLICATION_NAME',
            entityName: 'Application Display Name',
            action: 'CREATED',
            changedBy: 'System Administrator (OWEB)',
            timestamp: new Date().toISOString(),
            previousValue: 'None',
            newValue: 'OWEB Program-Based Project Management System (PB-PMS)',
            changeSummary: 'Administrator established baseline Enterprise Master Data Catalog and centralized system configuration values.'
        }
    ],
    // Programs Portfolio & Monitoring
    programs: INITIAL_PROGRAMS,
    // Organization Units Hierarchy (Region -> Woreda -> Kebele)
    regions: INITIAL_REGIONS,
    woredas: INITIAL_WOREDAS,
    kebeles: INITIAL_KEBELES,
    // Geographic Hierarchy (18 Zones & all Woredas)
    geographicHierarchy: { ...OROMIA_HIERARCHY },
    // Project Classifications & Technical Options
    projectCategories: {
        'Water Supply': [
            'Solar-Powered Rural Scheme',
            'Urban Piped Multi-Village System',
            'Deep Well Drilling & Distribution',
            'Shallow Well with Hand Pump',
            'Spring Protection & Gravity Piped',
            'Sand Dam & Sub-Surface Dam',
            'Rainwater Harvesting Mega-Tank'
        ],
        'Sanitation': [
            'Public Toilet Construction',
            'Institutional VIP Latrine Cluster',
            'Faecal Sludge Treatment Facility',
            'Solid Waste Management System',
            'School WASH Hygiene Center'
        ],
        'Water Resources Management': [
            'Watershed Protection & Catchment Conservation',
            'Groundwater Recharge Structure',
            'Spring Catchment Reforestation',
            'Ancient Tula Well Rehabilitation'
        ],
        'Irrigation & Watershed': [
            'Micro-Earth Dam for Smallholder Irrigation',
            'River Diversion Weir & Canal Network',
            'Watershed Soil & Water Conservation'
        ]
    },
    waterSources: [
        'Spring',
        'Borehole / Deep Well',
        'Shallow Well',
        'Perennial River',
        'Rainwater Harvesting Reservoir',
        'Lake / Natural Dam'
    ],
    energySources: [
        'Solar PV Array',
        'National Grid (EEU)',
        'Diesel / Generator Unit',
        'Hybrid (Solar + Generator)',
        'Gravity Flow (No External Energy)',
        'Wind Kinetic Pump'
    ],
    interventionTypes: [
        'New Construction',
        'Expansion & Upgrading',
        'Rehabilitation & Restoration',
        'Emergency Drought Response'
    ],
    sourceReliabilityRatings: [
        'Reliable (Year-Round Discharge)',
        'Moderate (Minor Dry Season Drop)',
        'Seasonal (Significant Flow Fluctuation)',
        'Unreliable / Depleting Aquifer'
    ],
    implementingBodies: [
        'OWEB Head Office Direct Execution',
        'Zonal Water Resource Bureau',
        'Woreda Water Office',
        'Urban Water Utility Enterprise',
        'WASHCO Community Committee',
        'OneWASH National Program PIU',
        'UNICEF WaSH Partner Unit',
        'Cowash Project Office',
        'Supervision Engineering Firm / NGO'
    ],
    riskLevels: ['Low', 'Medium', 'High', 'Critical'],
    fundingSources: INITIAL_FUNDING_SOURCES,
    currencies: INITIAL_CURRENCIES,
    departments: [
        'OWEB Head Office (Finfinnee)',
        'Water Supply & Sanitation Directorate',
        'Contract Administration Directorate',
        'Procurement & Property Administration Directorate',
        'Study, Design & Feasibility Directorate',
        'Environmental & Social Safeguards Directorate',
        'Finance, Budget & Disbursement Directorate',
        'Planning, Monitoring & Evaluation Directorate',
        'Zonal Water Resource Bureau',
        'Woreda Water Office',
        'OneWASH Project Implementation Unit (PIU)',
        'Supervising Consultant / Resident Engineering Team',
        'Regional Auditor / Donor Oversight Mission'
    ],
    procurementTypes: [
        'Works (Civil & Electromechanical)',
        'Goods & Equipment Supply',
        'Consulting Services',
        'Non-consulting Services'
    ],
    procurementMethods: INITIAL_PROCUREMENT_METHODS,
    bidderTypes: [
        'Registered Company / Contractor',
        'Joint Venture (JV) Consortium',
        'Individual / Sole Proprietor Consultant',
        'Micro & Small Enterprise (MSE)'
    ],
    rejectionReasons: [
        'Non-Responsive to Mandatory Technical Specifications',
        'Bid Security / CPO Missing, Expired, or Insufficient',
        'Late Submission Past Stated Bid Closing Hour',
        'Financial Offer Exceeds Allocated Budget Ceiling',
        'Failure to Submit Certified Tax Clearance / Business License',
        'Conflict of Interest or Entity on Debarment List',
        'Incomplete or Non-Binding Joint Venture Agreement'
    ],
    deliverableCategories: [
        'Civil Works & Structural Construction',
        'Electromechanical Supply & Installation',
        'Pipe Network Laying, Hydrostatic Pressure Testing & Backfilling',
        'Water Quality Laboratory Testing & Disinfection',
        'Supply & Delivery of Pipes, Fittings & Pumps',
        'WASHCO Community Mobilization & Operational Training',
        'As-Built Drawings & Final Handover Dossier'
    ],
    amendmentTypes: [
        'Variation Order (Scope or Quantity Adjustment)',
        'Time Extension (Extension of Time - EOT)',
        'Price Adjustment & Material Escalation',
        'Change of Total Contract Amount',
        'Key Personnel / Sub-contractor Replacement',
        'Design Rectification & Site Condition Modification'
    ],
    variationStatuses: ['Pending Review', 'Approved by Client', 'Rejected by Engineer'],
    claimSources: [
        'Contractor Claim (Cost / EOT)',
        'Employer / Client Counter-Claim (Liquidated Damages)',
        'Supervising Consultant Claim'
    ],
    claimStatuses: [
        'Submitted',
        'Under Engineer Assessment',
        'Adjudicated & Approved',
        'Partially Approved',
        'Rejected',
        'Referred to Dispute Adjudication Board (DAB)'
    ],
    terminationReasons: [
        'Fundamental Breach / Contractor Abandonment',
        'Liquidated Damages Exceeded Maximum Contractual Cap (10%)',
        'Employer Default / Extended Non-Payment',
        'Force Majeure / Insuperable Site Obstacle',
        'Mutual Written Agreement'
    ],
    documentCategories: [
        'Feasibility Study',
        'EIA Report',
        'Contract Agreement',
        'Technical Drawing & BoQ',
        'Progress Report & Site Log',
        'Milestone Inspection Certificate',
        'Site Handover Record',
        'Variation & Claim Order',
        'Photo & Geotagged Survey',
        'Other Official Record'
    ],
    priorityLevels: ['High', 'Medium', 'Low'],
    pushLogs: [
        {
            id: 'push-v2',
            timestamp: new Date().toISOString(),
            pushedBy: 'System Administrator (OWEB)',
            version: '2.0.0',
            modulesAffected: ['Planning', 'Review', 'Procurement', 'Contract', 'Documents', 'Users', 'Reporting', 'Master Data Catalog'],
            changeSummary: 'Enterprise Master Data Catalog deployed: 38 Categories, Centralized System Configs, Workflow Rules, and Approval Thresholds.',
            totalItems: 520
        }
    ]
};
// In-memory cache for master data backed by PostgreSQL
let cachedMasterData = INITIAL_MASTER_DATA;
export const loadMasterData = () => {
    return cachedMasterData;
};
export const fetchMasterDataFromApi = async () => {
    try {
        const remote = await apiClient.getMasterData();
        if (remote && (remote.catalogCategories?.length > 0 || remote.regions?.length > 0)) {
            cachedMasterData = {
                ...INITIAL_MASTER_DATA,
                ...remote,
                catalogCategories: remote.catalogCategories || INITIAL_MASTER_DATA.catalogCategories,
                catalogItems: remote.catalogItems || INITIAL_MASTER_DATA.catalogItems,
                systemConfigurations: remote.systemConfigurations || INITIAL_MASTER_DATA.systemConfigurations,
                workflowSteps: remote.workflowSteps || INITIAL_MASTER_DATA.workflowSteps,
                approvalThresholds: remote.approvalThresholds || INITIAL_MASTER_DATA.approvalThresholds,
                regions: remote.regions || INITIAL_MASTER_DATA.regions,
                woredas: remote.woredas || INITIAL_MASTER_DATA.woredas,
                kebeles: remote.kebeles || INITIAL_MASTER_DATA.kebeles,
            };
            return cachedMasterData;
        }
    }
    catch (err) {
        console.warn('Failed to fetch master data from API:', err);
    }
    return cachedMasterData;
};
export const saveMasterData = (data) => {
    cachedMasterData = data;
    apiClient.saveMasterData(data).catch(err => {
        console.error('Failed to sync master data with backend:', err);
    });
};
export const calculateTotalMasterDataItems = (data) => {
    let count = (data.catalogItems || []).length;
    count += (data.systemConfigurations || []).length;
    count += (data.workflowSteps || []).length;
    count += (data.approvalThresholds || []).length;
    count += (data.regions || []).length;
    count += (data.woredas || []).length;
    count += (data.kebeles || []).length;
    return count > 0 ? count : 450;
};
export const pushMasterDataToAllModules = (data, pusherName) => {
    const currentVersionParts = data.version.split('.').map(Number);
    const nextPatch = (currentVersionParts[2] || 0) + 1;
    const newVersion = `${currentVersionParts[0] || 2}.${currentVersionParts[1] || 0}.${nextPatch}`;
    const totalCount = calculateTotalMasterDataItems(data);
    const newPushLog = {
        id: `push-${Date.now()}`,
        timestamp: new Date().toISOString(),
        pushedBy: pusherName || 'Administrator',
        version: newVersion,
        modulesAffected: ['Planning', 'Review', 'Procurement', 'Contract', 'Documents', 'User Management', 'Reporting', 'Catalog'],
        changeSummary: `Broadcasted master data v${newVersion} containing ${totalCount} reference values and configurations.`,
        totalItems: totalCount
    };
    const newHistoryEntry = {
        id: `hist-${Date.now()}`,
        entityType: 'CONFIG',
        entityCode: 'SYSTEM_PUSH',
        entityName: 'Catalog Synchronization',
        action: 'UPDATED',
        changedBy: pusherName || 'Administrator',
        timestamp: new Date().toISOString(),
        previousValue: data.version,
        newValue: newVersion,
        changeSummary: `Administrator broadcasted master data v${newVersion} containing ${totalCount} active items across all system subsystems.`
    };
    const updatedData = {
        ...data,
        version: newVersion,
        lastPushedAt: new Date().toISOString(),
        lastPushedBy: pusherName || 'Administrator',
        lastUpdated: new Date().toISOString(),
        pushLogs: [newPushLog, ...(data.pushLogs || [])],
        historyEntries: [newHistoryEntry, ...(data.historyEntries || [])]
    };
    saveMasterData(updatedData);
    return updatedData;
};
// ==========================================
// 7. ENTERPRISE REUSABLE QUERY SERVICES
// ==========================================
export const getMasterDataItemsByCategory = (data, categoryCode, activeOnly = true) => {
    const items = (data.catalogItems || []).filter(item => item.categoryCode === categoryCode);
    if (activeOnly) {
        return items.filter(item => item.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
    }
    return items.sort((a, b) => a.displayOrder - b.displayOrder);
};
export const getMasterDataItemByCode = (data, categoryCode, code) => {
    return (data.catalogItems || []).find(item => item.categoryCode === categoryCode && item.code === code);
};
export const getMasterDataChildren = (data, parentIdOrCode, activeOnly = true) => {
    const items = (data.catalogItems || []).filter(item => item.parentId === parentIdOrCode || item.parentCode === parentIdOrCode);
    if (activeOnly) {
        return items.filter(item => item.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
    }
    return items.sort((a, b) => a.displayOrder - b.displayOrder);
};
export const getSystemConfigValue = (data, key, fallback = '') => {
    const item = (data.systemConfigurations || []).find(c => c.key === key);
    return item ? item.value : fallback;
};
export const getApplicableApprovalThreshold = (data, category, amountETB) => {
    const thresholds = (data.approvalThresholds || [])
        .filter(t => t.category === category && t.isActive)
        .sort((a, b) => a.approvalSequence - b.approvalSequence);
    return thresholds.find(t => {
        if (t.amountToETB === 0) {
            return amountETB >= t.amountFromETB;
        }
        return amountETB >= t.amountFromETB && amountETB <= t.amountToETB;
    }) || thresholds[thresholds.length - 1];
};
export const getWorkflowWithSteps = (data, workflowCode) => {
    const workflow = (data.workflowDefinitions || []).find(w => w.code === workflowCode);
    const steps = (data.workflowSteps || [])
        .filter(s => s.workflowCode === workflowCode && s.isActive)
        .sort((a, b) => a.sequence - b.sequence);
    return { workflow, steps };
};
// ==========================================
// 8. DATA USAGE & INTEGRITY CHECK (PROTECTION)
// ==========================================
export const checkMasterDataItemUsage = (itemId, itemCode, categoryCode, projects = [], contracts = [], procurements = []) => {
    const usageLocations = [];
    let usageCount = 0;
    // Check project status / types / zones
    if (categoryCode === 'PROJECT_STATUS') {
        const matching = projects.filter(p => p.status === itemCode || p.status?.toUpperCase() === itemCode);
        if (matching.length > 0) {
            usageCount += matching.length;
            usageLocations.push(`${matching.length} Project(s) currently in this status`);
        }
    }
    else if (categoryCode === 'PROJECT_TYPE' || categoryCode === 'PROJECT_SUBTYPE') {
        const matching = projects.filter(p => p.projectType === itemCode || p.projectSubType === itemCode);
        if (matching.length > 0) {
            usageCount += matching.length;
            usageLocations.push(`${matching.length} Project(s) configured with this sector/type`);
        }
    }
    else if (categoryCode === 'ZONE' || categoryCode === 'WOREDA') {
        const matching = projects.filter(p => p.zone === itemCode || p.woreda === itemCode);
        if (matching.length > 0) {
            usageCount += matching.length;
            usageLocations.push(`${matching.length} Project(s) located in this administrative area`);
        }
    }
    else if (categoryCode === 'PROCUREMENT_METHOD') {
        const matching = procurements.filter(pr => pr.procurementMethod?.includes(itemCode));
        if (matching.length > 0) {
            usageCount += matching.length;
            usageLocations.push(`${matching.length} Tender package(s) executed under this method`);
        }
    }
    else if (categoryCode === 'CONTRACT_STATUS') {
        const matching = contracts.filter(c => c.status === itemCode);
        if (matching.length > 0) {
            usageCount += matching.length;
            usageLocations.push(`${matching.length} Contract(s) active with this status`);
        }
    }
    return {
        isUsed: usageCount > 0,
        usageCount,
        usageLocations
    };
};
// ==========================================
// 9. IMPORT PRE-FLIGHT VALIDATION ENGINE
// ==========================================
export const validateMasterDataImport = (inputContent, existingData) => {
    const existingCategories = new Set((existingData.catalogCategories || []).map(c => c.code));
    const existingItemCodes = new Set((existingData.catalogItems || []).map(i => `${i.categoryCode}::${i.code}`));
    const rows = [];
    let validCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    let warningCount = 0;
    try {
        let rawRows = [];
        const trimmed = inputContent.trim();
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            // JSON format
            const parsed = JSON.parse(trimmed);
            rawRows = Array.isArray(parsed) ? parsed : [parsed];
        }
        else {
            // CSV format
            const lines = trimmed.split('\n').filter(l => l.trim().length > 0);
            if (lines.length > 1) {
                const header = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
                    const rowObj = {};
                    header.forEach((h, idx) => {
                        rowObj[h] = values[idx] || '';
                    });
                    rawRows.push(rowObj);
                }
            }
        }
        rawRows.forEach((row, idx) => {
            const rowNumber = idx + 1;
            const categoryCode = (row.categorycode || row.category_code || row.category || '').toUpperCase().trim();
            const code = (row.code || row.item_code || '').toUpperCase().trim();
            const name = (row.name || row.item_name || '').trim();
            const parentCode = (row.parentcode || row.parent_code || '').toUpperCase().trim();
            const description = row.description || name;
            const displayOrder = Number(row.displayorder || row.display_order || rowNumber);
            const isActive = row.isactive === undefined ? true : (row.isactive === true || row.isactive === 'true' || row.isactive === '1');
            const errors = [];
            if (!categoryCode)
                errors.push('Missing required category code.');
            else if (!existingCategories.has(categoryCode))
                errors.push(`Unknown category code "${categoryCode}".`);
            if (!code)
                errors.push('Missing required item code.');
            if (!name)
                errors.push('Missing required item name.');
            const key = `${categoryCode}::${code}`;
            let status = 'VALID';
            if (errors.length > 0) {
                status = 'ERROR';
                errorCount++;
            }
            else if (existingItemCodes.has(key)) {
                status = 'WARNING';
                duplicateCount++;
                warningCount++;
                errors.push(`Duplicate code: will update existing record for "${code}".`);
            }
            else {
                validCount++;
            }
            rows.push({
                rowNumber,
                code,
                name,
                categoryCode,
                parentCode: parentCode || undefined,
                status,
                errorDetails: errors,
                data: {
                    categoryCode,
                    code,
                    name,
                    description,
                    parentCode: parentCode || undefined,
                    displayOrder,
                    isActive
                }
            });
        });
    }
    catch (e) {
        return {
            totalRecords: 0,
            validCount: 0,
            errorCount: 1,
            duplicateCount: 0,
            warningCount: 0,
            rows: [{
                    rowNumber: 1,
                    code: 'PARSE_ERROR',
                    name: 'File Parse Error',
                    categoryCode: '',
                    status: 'ERROR',
                    errorDetails: [`Could not parse CSV/JSON file: ${e.message}`],
                    data: {}
                }]
        };
    }
    return {
        totalRecords: rows.length,
        validCount,
        errorCount,
        duplicateCount,
        warningCount,
        rows
    };
};
export const executeMasterDataImport = (existingData, validatedRows, actorName = 'Administrator') => {
    const validRows = validatedRows.filter(r => r.status === 'VALID' || r.status === 'WARNING');
    if (validRows.length === 0)
        return existingData;
    const currentItems = [...(existingData.catalogItems || [])];
    const now = new Date().toISOString();
    validRows.forEach(r => {
        const itemData = r.data;
        const existingIdx = currentItems.findIndex(i => i.categoryCode === itemData.categoryCode && i.code === itemData.code);
        if (existingIdx >= 0) {
            // Update
            currentItems[existingIdx] = {
                ...currentItems[existingIdx],
                name: itemData.name || currentItems[existingIdx].name,
                description: itemData.description || currentItems[existingIdx].description,
                parentCode: itemData.parentCode || currentItems[existingIdx].parentCode,
                displayOrder: itemData.displayOrder || currentItems[existingIdx].displayOrder,
                isActive: itemData.isActive ?? currentItems[existingIdx].isActive,
                updatedBy: actorName,
                updatedAt: now
            };
        }
        else {
            // Insert
            currentItems.push({
                id: `MDI-${itemData.categoryCode}-${itemData.code}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                categoryCode: itemData.categoryCode || 'GENERAL',
                code: itemData.code || `ITEM_${Date.now()}`,
                name: itemData.name || 'Imported Reference Item',
                description: itemData.description || itemData.name,
                parentCode: itemData.parentCode,
                displayOrder: itemData.displayOrder || currentItems.length + 1,
                isActive: itemData.isActive ?? true,
                createdBy: actorName,
                createdAt: now,
                updatedBy: actorName,
                updatedAt: now
            });
        }
    });
    const newHistory = {
        id: `hist-imp-${Date.now()}`,
        entityType: 'ITEM',
        entityCode: 'BATCH_IMPORT',
        entityName: 'Catalog Data Import',
        action: 'IMPORTED',
        changedBy: actorName,
        timestamp: now,
        changeSummary: `${actorName} successfully committed batch import of ${validRows.length} master data records.`
    };
    const updatedData = {
        ...existingData,
        catalogItems: currentItems,
        lastUpdated: now,
        historyEntries: [newHistory, ...(existingData.historyEntries || [])]
    };
    saveMasterData(updatedData);
    return updatedData;
};
