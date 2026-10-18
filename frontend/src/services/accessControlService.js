import { Role } from '../types';
import { apiClient } from './apiClient';
export const PERMISSION_MODULES = [
    { id: 'projects', label: 'Projects & Schemes', icon: 'FolderKanban' },
    { id: 'ngos', label: 'NGOs & Implementing Partners', icon: 'Building2' },
    { id: 'staff', label: 'Staff Management & Classifications', icon: 'UserCheck' },
    { id: 'contracts', label: 'Contracts & Contractors', icon: 'FileSignature' },
    { id: 'procurement', label: 'Procurement & Tenders', icon: 'Gavel' },
    { id: 'reports', label: 'Executive & Progress Reports', icon: 'BarChart3' },
    { id: 'activities', label: 'Project Activities & Tasks', icon: 'CheckSquare' },
    { id: 'weekly_plan', label: 'Weekly Work Plans', icon: 'CalendarDays' },
    { id: 'weekly_report', label: 'Weekly Progress Reports', icon: 'FileText' },
    { id: 'users', label: 'User Accounts', icon: 'Users' },
    { id: 'roles', label: 'Roles & Permissions', icon: 'ShieldCheck' },
    { id: 'master_data', label: 'Master Data & Org Units', icon: 'Database' },
    { id: 'documents', label: 'Document Vault', icon: 'FileStack' },
];
export const GRANULAR_PERMISSIONS = [
    // Projects
    { code: 'projects.view', module: 'projects', action: 'view', label: 'View Projects', description: 'Can view projects within user data scope' },
    { code: 'projects.create', module: 'projects', action: 'create', label: 'Create Projects', description: 'Can formulate and submit new project proposals' },
    { code: 'projects.update', module: 'projects', action: 'update', label: 'Update Projects', description: 'Can edit project details, feasibility, and costs' },
    { code: 'projects.delete', module: 'projects', action: 'delete', label: 'Delete Projects', description: 'Can remove draft or cancelled projects' },
    { code: 'projects.assign', module: 'projects', action: 'assign', label: 'Assign Staff', description: 'Can assign engineers, supervisors, and teams' },
    { code: 'projects.approve', module: 'projects', action: 'approve', label: 'Approve Projects', description: 'Can issue technical appraisal & appraisal certificates' },
    { code: 'projects.export', module: 'projects', action: 'export', label: 'Export Projects', description: 'Can export project data to Excel, CSV, or PDF' },
    // Contracts
    { code: 'contracts.view', module: 'contracts', action: 'view', label: 'View Contracts', description: 'Can view contracts within user data scope' },
    { code: 'contracts.create', module: 'contracts', action: 'create', label: 'Register Contracts', description: 'Can create and initialize contract records' },
    { code: 'contracts.update', module: 'contracts', action: 'update', label: 'Update Contracts', description: 'Can update deliverables, bonds, milestones, and claims' },
    { code: 'contracts.delete', module: 'contracts', action: 'delete', label: 'Delete Contracts', description: 'Can terminate or delete contract records' },
    { code: 'contracts.approve', module: 'contracts', action: 'approve', label: 'Approve Variations & IPCs', description: 'Can endorse variation orders and payment certificates' },
    { code: 'contracts.export', module: 'contracts', action: 'export', label: 'Export Contracts', description: 'Can export contract registries and summaries' },
    // Procurement
    { code: 'procurement.view', module: 'procurement', action: 'view', label: 'View Tenders', description: 'Can view tenders, bids, and committees' },
    { code: 'procurement.create', module: 'procurement', action: 'create', label: 'Create Tenders', description: 'Can issue new tender packages and RFQs' },
    { code: 'procurement.update', module: 'procurement', action: 'update', label: 'Update Procurement', description: 'Can score bids, update evaluation sheets, and committees' },
    { code: 'procurement.delete', module: 'procurement', action: 'delete', label: 'Cancel Tenders', description: 'Can cancel or re-tender procurement processes' },
    { code: 'procurement.approve', module: 'procurement', action: 'approve', label: 'Endorse Awards', description: 'Can sign off committee recommendations and award tenders' },
    // Reports
    { code: 'reports.view', module: 'reports', action: 'view', label: 'View Reports', description: 'Can access reporting and analytics dashboards' },
    { code: 'reports.create', module: 'reports', action: 'create', label: 'Generate Reports', description: 'Can build custom reports and variance statements' },
    { code: 'reports.update', module: 'reports', action: 'update', label: 'Edit Reports', description: 'Can modify report templates and summaries' },
    { code: 'reports.approve', module: 'reports', action: 'approve', label: 'Approve Reports', description: 'Can officially validate and sign off bureau reports' },
    { code: 'reports.export', module: 'reports', action: 'export', label: 'Export Reports', description: 'Can export executive summaries in PDF and Excel' },
    // Activities
    { code: 'activities.view', module: 'activities', action: 'view', label: 'View Activities', description: 'Can view activity logs, milestones, and progress' },
    { code: 'activities.create', module: 'activities', action: 'create', label: 'Create Activities', description: 'Can create and schedule project tasks and milestones' },
    { code: 'activities.update', module: 'activities', action: 'update', label: 'Update Progress', description: 'Can record progress %, site milestones, and notes' },
    { code: 'activities.delete', module: 'activities', action: 'delete', label: 'Remove Activities', description: 'Can delete unexecuted activities' },
    // Weekly Work Plan
    { code: 'weekly_plan.view', module: 'weekly_plan', action: 'view', label: 'View Weekly Plans', description: 'Can view weekly work plans for projects' },
    { code: 'weekly_plan.create', module: 'weekly_plan', action: 'create', label: 'Create Weekly Plan', description: 'Can submit weekly work schedule and resource allocation' },
    { code: 'weekly_plan.update', module: 'weekly_plan', action: 'update', label: 'Update Weekly Plan', description: 'Can adjust targets and planned site milestones' },
    { code: 'weekly_plan.approve', module: 'weekly_plan', action: 'approve', label: 'Approve Weekly Plan', description: 'Can endorse site team weekly schedules' },
    // Weekly Progress Report
    { code: 'weekly_report.view', module: 'weekly_report', action: 'view', label: 'View Progress Reports', description: 'Can inspect weekly site execution reports' },
    { code: 'weekly_report.create', module: 'weekly_report', action: 'create', label: 'Submit Progress Report', description: 'Can submit weekly physical progress, weather, and delays' },
    { code: 'weekly_report.update', module: 'weekly_report', action: 'update', label: 'Revise Progress Report', description: 'Can amend site progress reports' },
    { code: 'weekly_report.approve', module: 'weekly_report', action: 'approve', label: 'Approve Progress Report', description: 'Can certify weekly site progress and IPC readiness' },
    // Users
    { code: 'users.view', module: 'users', action: 'view', label: 'View Users', description: 'Can see user list and profiles' },
    { code: 'users.create', module: 'users', action: 'create', label: 'Create Users', description: 'Can provision new accounts' },
    { code: 'users.update', module: 'users', action: 'update', label: 'Edit Users', description: 'Can edit profile, department, and project assignments' },
    { code: 'users.delete', module: 'users', action: 'delete', label: 'Delete Users', description: 'Can deactivate or delete user accounts' },
    { code: 'users.assign_role', module: 'users', action: 'assign', label: 'Assign Roles', description: 'Can change role and permission configurations for users' },
    { code: 'users.reset_password', module: 'users', action: 'update', label: 'Reset Password', description: 'Can reset passwords and issue temporary credentials' },
    // Roles
    { code: 'roles.view', module: 'roles', action: 'view', label: 'View Roles', description: 'Can view role catalog and permission definitions' },
    { code: 'roles.create', module: 'roles', action: 'create', label: 'Create Custom Roles', description: 'Can define new system roles and policy scopes' },
    { code: 'roles.update', module: 'roles', action: 'update', label: 'Modify Roles', description: 'Can adjust role permissions and default data scopes' },
    { code: 'roles.delete', module: 'roles', action: 'delete', label: 'Delete Roles', description: 'Can deactivate or retire custom roles' },
    // Master Data
    { code: 'master_data.view', module: 'master_data', action: 'view', label: 'View Master Data', description: 'Can view catalog, regions, woredas, and kebeles' },
    { code: 'master_data.create', module: 'master_data', action: 'create', label: 'Add Master Data', description: 'Can register new administrative units and catalog codes' },
    { code: 'master_data.update', module: 'master_data', action: 'update', label: 'Edit Master Data', description: 'Can modify thresholds, configurations, and org units' },
    { code: 'master_data.delete', module: 'master_data', action: 'delete', label: 'Deactivate Master Data', description: 'Can deactivate master data entries' },
    // Inspections
    { code: 'inspection.view', module: 'inspection', action: 'view', label: 'View Inspections', description: 'Can view QA/QC logs and field inspection entries' },
    { code: 'inspection.create', module: 'inspection', action: 'create', label: 'Log Inspection', description: 'Can perform site QA audits and record water quality tests' },
    { code: 'inspection.update', module: 'inspection', action: 'update', label: 'Update Inspection', description: 'Can update defect rectifications and inspector remarks' },
    { code: 'inspection.delete', module: 'inspection', action: 'delete', label: 'Delete Inspection', description: 'Can remove draft inspection logs' },
    // Documents
    { code: 'documents.view', module: 'documents', action: 'view', label: 'View Documents', description: 'Can view and search documents in vault' },
    { code: 'documents.upload', module: 'documents', action: 'create', label: 'Upload Documents', description: 'Can upload project designs, EIA, and contract files' },
    { code: 'documents.download', module: 'documents', action: 'export', label: 'Download Documents', description: 'Can download vault artifacts and attachments' },
    { code: 'documents.delete', module: 'documents', action: 'delete', label: 'Delete Documents', description: 'Can archive or delete repository files' },
    // NGO & Implementing Partners
    { code: 'ngos.view', module: 'ngos', action: 'view', label: 'View NGOs', description: 'Can view registered NGOs and implementing partners' },
    { code: 'ngos.create', module: 'ngos', action: 'create', label: 'Register NGO', description: 'Can register new NGO partners and accreditations' },
    { code: 'ngos.update', module: 'ngos', action: 'update', label: 'Edit NGO', description: 'Can edit NGO details, contacts, and programs' },
    { code: 'ngos.delete', module: 'ngos', action: 'delete', label: 'Deactivate NGO', description: 'Can toggle active/inactive status and audit reason' },
    { code: 'ngos.export', module: 'ngos', action: 'export', label: 'Export NGOs', description: 'Can export NGO directory and project participation' },
    // Staff Management
    { code: 'staff.view', module: 'staff', action: 'view', label: 'View Staff', description: 'Can view staff profiles and program classifications' },
    { code: 'staff.create', module: 'staff', action: 'create', label: 'Register Staff', description: 'Can create new employee and expert profiles' },
    { code: 'staff.update', module: 'staff', action: 'update', label: 'Edit Staff Profile', description: 'Can edit staff information and assignments' },
    { code: 'staff.transfer', module: 'staff', action: 'assign', label: 'Transfer Program', description: 'Can transfer staff across bureau programs' },
    { code: 'staff.delete', module: 'staff', action: 'delete', label: 'Deactivate Staff', description: 'Can deactivate staff profiles and record reasons' },
    { code: 'staff.export', module: 'staff', action: 'export', label: 'Export Staff', description: 'Can export staff rosters and assignment history' },
];
export const DATA_SCOPE_DEFINITIONS = {
    ALL: {
        label: 'All Regional Records (Bureau-Wide)',
        description: 'Unrestricted access to all projects, contracts, tenders, and logs across Oromia Regional State.',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        color: '#059669',
    },
    ORGANIZATION: {
        label: 'Organization / Department Scope',
        description: 'Access restricted to projects, contracts, and records under the user’s assigned Directorate, Zone, or Program.',
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
        color: '#0284c7',
    },
    TEAM: {
        label: 'Assigned Team Scope',
        description: 'Access restricted to schemes, contracts, and tasks specifically allocated to user’s engineering squad or team.',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
        color: '#7c3aed',
    },
    ASSIGNED_PROJECTS: {
        label: 'Assigned Projects & Schemes Only',
        description: 'Strictly limited to projects where the user is explicitly assigned as Lead Engineer, Supervisor, or Assigned Member.',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        color: '#d97706',
    },
    ASSIGNED_CONTRACTS: {
        label: 'Assigned Contracts Only',
        description: 'Strictly limited to contracts where the user is designated as Contract Manager, Supervising Engineer, or Contractor.',
        badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
        color: '#ea580c',
    },
    OWN_RECORDS: {
        label: 'Created Records Only (Ownership)',
        description: 'Can only view, edit, or manage records initially authored or formulated by this user account.',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
        color: '#475569',
    },
    PARTNER_ORGANIZATION: {
        label: 'Partner / NGO Organization Scope',
        description: 'Restricted strictly to projects and contracts funded or implemented by the user’s affiliated donor or partner entity.',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        color: '#4f46e5',
    },
};
// All permission codes helper
const allCodes = GRANULAR_PERMISSIONS.map(p => p.code);
export const DEFAULT_ROLE_DEFINITIONS = [
    {
        id: 'role-admin',
        code: 'ROLE_ADMIN',
        name: 'System Administrator',
        description: 'Complete operational and governance control, user provisioning, audit logging, and global master-data management.',
        status: 'Active',
        permissions: [...allCodes],
        defaultDataScope: 'ALL',
        organizationScope: 'OWEB Head Office (Regional Bureau)',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#4f46e5',
    },
    {
        id: 'role-director',
        code: 'ROLE_DIRECTOR',
        name: 'Director',
        description: 'Bureau leadership with full regional oversight, executive analytics, strategic approvals, and budget sanction authority.',
        status: 'Active',
        permissions: [
            'projects.view', 'projects.approve', 'projects.export',
            'contracts.view', 'contracts.approve', 'contracts.export',
            'procurement.view', 'procurement.approve',
            'reports.view', 'reports.create', 'reports.approve', 'reports.export',
            'activities.view', 'weekly_plan.view', 'weekly_report.view', 'weekly_report.approve',
            'users.view', 'roles.view', 'master_data.view', 'inspection.view', 'documents.view', 'documents.download',
            'programs.view', 'programs.export', 'ngos.view', 'ngos.export', 'staff.view', 'staff.export'
        ],
        defaultDataScope: 'ALL',
        organizationScope: 'OWEB Directorate Leadership',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#0f766e',
    },
    {
        id: 'role-prog-admin',
        code: 'ROLE_PROGRAM_ADMIN',
        name: 'Program Administrator',
        description: 'Autonomous administration of explicitly assigned program portfolio, implementing NGOs, field staff, budgets, and project approvals.',
        status: 'Active',
        permissions: [
            'programs.view', 'programs.update', 'programs.export',
            'ngos.view', 'ngos.create', 'ngos.update', 'ngos.delete', 'ngos.export',
            'staff.view', 'staff.create', 'staff.update', 'staff.transfer', 'staff.delete', 'staff.export',
            'projects.view', 'projects.create', 'projects.update', 'projects.assign', 'projects.approve', 'projects.export',
            'contracts.view', 'contracts.update', 'contracts.export',
            'reports.view', 'reports.create', 'reports.approve', 'reports.export',
            'activities.view', 'activities.create', 'activities.update',
            'weekly_plan.view', 'weekly_plan.approve',
            'weekly_report.view', 'weekly_report.approve',
            'inspection.view', 'inspection.update',
            'documents.view', 'documents.upload', 'documents.download'
        ],
        defaultDataScope: 'ORGANIZATION',
        organizationScope: 'Program Directorate & PIU',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#0284c7',
    },
    {
        id: 'role-coordinator',
        code: 'ROLE_COORDINATOR',
        name: 'Coordinator',
        description: 'Program-wide operational manager coordinating regional schemes, cross-zonal delivery, and assigning field engineers.',
        status: 'Active',
        permissions: [
            'projects.view', 'projects.create', 'projects.update', 'projects.assign', 'projects.export',
            'contracts.view', 'contracts.update', 'contracts.export',
            'procurement.view', 'procurement.update',
            'reports.view', 'reports.create', 'reports.export',
            'activities.view', 'activities.create', 'activities.update',
            'weekly_plan.view', 'weekly_plan.approve',
            'weekly_report.view', 'weekly_report.approve',
            'users.view', 'master_data.view', 'inspection.view', 'documents.view', 'documents.upload', 'documents.download'
        ],
        defaultDataScope: 'ALL',
        organizationScope: 'OWEB Regional Program Coordination',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#0284c7',
    },
    {
        id: 'role-team-leader',
        code: 'ROLE_TEAM_LEADER',
        name: 'Team Leader',
        description: 'Technical lead managing specific engineering squads, assigning scheme activities, and endorsing weekly work reports.',
        status: 'Active',
        permissions: [
            'projects.view', 'projects.update', 'projects.assign',
            'contracts.view', 'contracts.update',
            'procurement.view',
            'reports.view', 'reports.create',
            'activities.view', 'activities.create', 'activities.update', 'activities.delete',
            'weekly_plan.view', 'weekly_plan.create', 'weekly_plan.update', 'weekly_plan.approve',
            'weekly_report.view', 'weekly_report.approve',
            'users.view', 'inspection.view', 'inspection.create', 'inspection.update',
            'documents.view', 'documents.upload', 'documents.download'
        ],
        defaultDataScope: 'TEAM',
        organizationScope: 'Engineering & Supervision Squad',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#7c3aed',
    },
    {
        id: 'role-engineer',
        code: 'ROLE_ENGINEER',
        name: 'Engineer',
        description: 'Field & resident project engineer with access restricted strictly to assigned schemes, task execution, and progress filing.',
        status: 'Active',
        permissions: [
            'projects.view', 'projects.update',
            'contracts.view',
            'activities.view', 'activities.create', 'activities.update',
            'weekly_plan.view', 'weekly_plan.create', 'weekly_plan.update',
            'weekly_report.view', 'weekly_report.create', 'weekly_report.update',
            'inspection.view', 'inspection.create', 'inspection.update',
            'documents.view', 'documents.upload', 'documents.download',
            'reports.view'
        ],
        defaultDataScope: 'ASSIGNED_PROJECTS',
        organizationScope: 'Assigned Field Sites',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#d97706',
    },
    {
        id: 'role-supervisor',
        code: 'ROLE_SUPERVISOR',
        name: 'Supervisor',
        description: 'Field quality assurance and resident supervision engineer verifying milestones, site inspections, and contractor progress.',
        status: 'Active',
        permissions: [
            'projects.view', 'projects.update',
            'contracts.view', 'contracts.update',
            'inspection.view', 'inspection.create', 'inspection.update',
            'activities.view', 'activities.update',
            'weekly_plan.view', 'weekly_report.view', 'weekly_report.approve',
            'documents.view', 'documents.upload', 'documents.download',
            'reports.view'
        ],
        defaultDataScope: 'ASSIGNED_PROJECTS',
        organizationScope: 'Zonal Water Bureau / Site Supervision',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#ea580c',
    },
    {
        id: 'role-contract-mgr',
        code: 'ROLE_CONTRACT_MGR',
        name: 'Contract Manager',
        description: 'Contract administrator managing milestones, performance securities, variations, delay damages, and contractor IPCs.',
        status: 'Active',
        permissions: [
            'projects.view',
            'contracts.view', 'contracts.create', 'contracts.update', 'contracts.delete', 'contracts.approve', 'contracts.export',
            'procurement.view',
            'reports.view', 'reports.create', 'reports.export',
            'activities.view', 'inspection.view',
            'documents.view', 'documents.upload', 'documents.download', 'documents.delete'
        ],
        defaultDataScope: 'ASSIGNED_CONTRACTS',
        organizationScope: 'Contract Administration Directorate',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#b91c1c',
    },
    {
        id: 'role-procurement',
        code: 'ROLE_PROCUREMENT',
        name: 'Procurement Specialist',
        description: 'Procurement officer formulating tender notices, managing evaluation committees, bid bonds, and award publications.',
        status: 'Active',
        permissions: [
            'projects.view',
            'procurement.view', 'procurement.create', 'procurement.update', 'procurement.delete', 'procurement.approve',
            'contracts.view', 'contracts.create',
            'reports.view', 'documents.view', 'documents.upload', 'documents.download'
        ],
        defaultDataScope: 'ORGANIZATION',
        organizationScope: 'Procurement & Property Directorate',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#c2410c',
    },
    {
        id: 'role-reviewer',
        code: 'ROLE_REVIEWER',
        name: 'Technical Reviewer',
        description: 'Technical appraiser evaluating feasibility studies, engineering calculations, EIA clearances, and issuing certificates.',
        status: 'Active',
        permissions: [
            'projects.view', 'projects.approve',
            'reports.view', 'activities.view',
            'documents.view', 'documents.download',
            'master_data.view'
        ],
        defaultDataScope: 'ORGANIZATION',
        organizationScope: 'Study, Design & Environmental Directorate',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#059669',
    },
    {
        id: 'role-finance',
        code: 'ROLE_FINANCE',
        name: 'Finance Officer',
        description: 'Financial analyst monitoring disbursement schedules, IPC payments, cost overruns, and donor counterpart funds.',
        status: 'Active',
        permissions: [
            'projects.view',
            'contracts.view', 'contracts.update', 'contracts.approve',
            'reports.view', 'reports.export',
            'documents.view', 'documents.download'
        ],
        defaultDataScope: 'ORGANIZATION',
        organizationScope: 'Finance & Accounts Directorate',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#15803d',
    },
    {
        id: 'role-planning',
        code: 'ROLE_PLANNING',
        name: 'Planning Officer',
        description: 'Formulates annual capital plans, program components, water demand projections, and baseline feasibility dossiers.',
        status: 'Active',
        permissions: [
            'projects.view', 'projects.create', 'projects.update', 'projects.export',
            'reports.view', 'reports.create', 'reports.export',
            'master_data.view', 'documents.view', 'documents.upload', 'documents.download'
        ],
        defaultDataScope: 'ORGANIZATION',
        organizationScope: 'Planning & Project Formulation Directorate',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#0369a1',
    },
    {
        id: 'role-me',
        code: 'ROLE_ME',
        name: 'Monitoring & Evaluation Officer',
        description: 'M&E officer tracking physical milestones, beneficiary coverage KPIs, contractor performance ratings, and defect closures.',
        status: 'Active',
        permissions: [
            'projects.view', 'projects.export',
            'contracts.view', 'contracts.export',
            'reports.view', 'reports.create', 'reports.export',
            'activities.view', 'weekly_report.view', 'inspection.view',
            'documents.view', 'documents.download'
        ],
        defaultDataScope: 'ORGANIZATION',
        organizationScope: 'Monitoring & Evaluation Unit',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#4338ca',
    },
    {
        id: 'role-partner',
        code: 'ROLE_PARTNER',
        name: 'NGO / Partner Member',
        description: 'Donor or NGO representative with read/monitoring visibility over co-financed schemes (e.g., COWASH, UNICEF, WaterAid).',
        status: 'Active',
        permissions: [
            'projects.view', 'projects.export',
            'contracts.view', 'contracts.export',
            'reports.view', 'reports.export',
            'documents.view', 'documents.download',
            'inspection.view'
        ],
        defaultDataScope: 'PARTNER_ORGANIZATION',
        organizationScope: 'Partner Organization',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#6366f1',
    },
    {
        id: 'role-auditor',
        code: 'ROLE_AUDITOR',
        name: 'Auditor',
        description: 'Independent compliance examiner reviewing financial disbursements, procurement integrity, and system audit trails.',
        status: 'Active',
        permissions: [
            'projects.view', 'projects.export',
            'contracts.view', 'contracts.export',
            'procurement.view',
            'reports.view', 'reports.export',
            'users.view', 'roles.view', 'master_data.view',
            'inspection.view', 'documents.view', 'documents.download'
        ],
        defaultDataScope: 'ALL',
        organizationScope: 'Regional Audit & Integrity Bureau',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#6d28d9',
    },
    {
        id: 'role-viewer',
        code: 'ROLE_VIEWER',
        name: 'Viewer',
        description: 'Read-only access for stakeholders, trainees, or observers without write or approval capabilities.',
        status: 'Active',
        permissions: [
            'projects.view',
            'contracts.view',
            'reports.view',
            'documents.view',
            'inspection.view'
        ],
        defaultDataScope: 'ORGANIZATION',
        organizationScope: 'General Viewer',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#64748b',
    },
    {
        id: 'role-user',
        code: 'ROLE_USER',
        name: 'User (Project Formulator)',
        description: 'Standard staff member able to create project proposals, submit baseline data, and review public documentation.',
        status: 'Active',
        permissions: [
            'projects.view', 'projects.create', 'projects.update',
            'activities.view', 'activities.create', 'activities.update',
            'documents.view', 'documents.upload', 'documents.download',
            'weekly_plan.view', 'weekly_report.view'
        ],
        defaultDataScope: 'OWN_RECORDS',
        organizationScope: 'General Staff',
        isSystem: true,
        createdBy: 'System Seed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        color: '#2563eb',
    }
];
// In-memory cache for role definitions backed by PostgreSQL
let cachedRoleDefinitions = DEFAULT_ROLE_DEFINITIONS;
export const loadRoleDefinitions = () => {
    return cachedRoleDefinitions;
};
export const fetchRoleDefinitionsFromApi = async () => {
    try {
        const remoteRoles = await apiClient.getRoles();
        if (Array.isArray(remoteRoles) && remoteRoles.length > 0) {
            const mapped = remoteRoles.map(r => ({
                id: String(r.id),
                code: r.code,
                name: r.name,
                description: r.description,
                permissions: r.permissions || [],
                defaultDataScope: r.default_data_scope || r.defaultDataScope || 'ALL',
                organizationScope: r.organization_scope || r.organizationScope || '',
                isSystem: r.is_system !== undefined ? r.is_system : r.isSystem,
                color: r.color || ''
            }));
            cachedRoleDefinitions = mapped;
            return mapped;
        }
    }
    catch (err) {
        console.warn('Failed to fetch role definitions from API:', err);
    }
    return cachedRoleDefinitions;
};
export const saveRoleDefinitions = async (roles) => {
    cachedRoleDefinitions = roles;
    for (const r of roles) {
        try {
            await apiClient.saveRole({
                code: r.code,
                name: r.name,
                description: r.description,
                permissions: r.permissions,
                default_data_scope: r.defaultDataScope,
                organization_scope: r.organizationScope,
                is_system: r.isSystem,
                color: r.color,
            });
        }
        catch (err) {
            console.error('Failed to sync role with backend:', err);
        }
    }
};
// Match User.role (e.g. Role.ADMIN, Role.ENGINEER) to a RoleDefinition
export const getRoleDefinitionForUser = (user, customRoles = DEFAULT_ROLE_DEFINITIONS) => {
    if (!user) {
        return DEFAULT_ROLE_DEFINITIONS.find(r => r.code === 'ROLE_VIEWER') || DEFAULT_ROLE_DEFINITIONS[0];
    }
    // If user has a customRoleId
    if (user.customRoleIds && user.customRoleIds.length > 0) {
        const customMatch = customRoles.find(r => r.id === user.customRoleIds[0]);
        if (customMatch)
            return customMatch;
    }
    // Match by Role enum string or code
    const roleStr = String(user.role).toUpperCase();
    const matched = customRoles.find(r => {
        const codeMatch = r.code.toUpperCase() === `ROLE_${roleStr}` || r.code.toUpperCase() === roleStr;
        const nameMatch = r.name.toLowerCase() === String(user.role).toLowerCase();
        return codeMatch || nameMatch;
    });
    if (matched)
        return matched;
    // Fallbacks for known Role enum mappings
    switch (user.role) {
        case Role.ADMIN:
            return customRoles.find(r => r.code === 'ROLE_ADMIN') || DEFAULT_ROLE_DEFINITIONS[0];
        case Role.REVIEWER:
            return customRoles.find(r => r.code === 'ROLE_REVIEWER') || DEFAULT_ROLE_DEFINITIONS[8];
        case Role.PROCUREMENT:
            return customRoles.find(r => r.code === 'ROLE_PROCUREMENT') || DEFAULT_ROLE_DEFINITIONS[7];
        case Role.CONTRACT_MANAGER:
            return customRoles.find(r => r.code === 'ROLE_CONTRACT_MGR') || DEFAULT_ROLE_DEFINITIONS[6];
        case Role.SUPERVISOR:
            return customRoles.find(r => r.code === 'ROLE_SUPERVISOR') || DEFAULT_ROLE_DEFINITIONS[5];
        case Role.AUDITOR:
            return customRoles.find(r => r.code === 'ROLE_AUDITOR') || DEFAULT_ROLE_DEFINITIONS[13];
        case Role.DIRECTOR:
            return customRoles.find(r => r.code === 'ROLE_DIRECTOR') || DEFAULT_ROLE_DEFINITIONS[1];
        case Role.COORDINATOR:
            return customRoles.find(r => r.code === 'ROLE_COORDINATOR') || DEFAULT_ROLE_DEFINITIONS[2];
        case Role.TEAM_LEADER:
            return customRoles.find(r => r.code === 'ROLE_TEAM_LEADER') || DEFAULT_ROLE_DEFINITIONS[3];
        case Role.ENGINEER:
            return customRoles.find(r => r.code === 'ROLE_ENGINEER') || DEFAULT_ROLE_DEFINITIONS[4];
        case Role.FINANCE_OFFICER:
            return customRoles.find(r => r.code === 'ROLE_FINANCE') || DEFAULT_ROLE_DEFINITIONS[9];
        case Role.PLANNING_OFFICER:
            return customRoles.find(r => r.code === 'ROLE_PLANNING') || DEFAULT_ROLE_DEFINITIONS[10];
        case Role.ME_OFFICER:
            return customRoles.find(r => r.code === 'ROLE_ME') || DEFAULT_ROLE_DEFINITIONS[11];
        case Role.PARTNER_MEMBER:
            return customRoles.find(r => r.code === 'ROLE_PARTNER') || DEFAULT_ROLE_DEFINITIONS[12];
        case Role.VIEWER:
            return customRoles.find(r => r.code === 'ROLE_VIEWER') || DEFAULT_ROLE_DEFINITIONS[14];
        default:
            return customRoles.find(r => r.code === 'ROLE_USER') || DEFAULT_ROLE_DEFINITIONS[15];
    }
};
/**
 * Returns all role definitions assigned to this user (primary + secondary)
 */
export const getAllRolesForUser = (user, customRoles = DEFAULT_ROLE_DEFINITIONS) => {
    if (!user)
        return [];
    const primary = getRoleDefinitionForUser(user, customRoles);
    const result = [primary];
    if (user.secondaryRoles && Array.isArray(user.secondaryRoles)) {
        for (const secRole of user.secondaryRoles) {
            const match = customRoles.find(r => r.code.toLowerCase() === String(secRole).toLowerCase() ||
                r.name.toLowerCase() === String(secRole).toLowerCase() ||
                r.code.toLowerCase() === `role_${String(secRole).toLowerCase()}`);
            if (match && !result.some(r => r.id === match.id)) {
                result.push(match);
            }
        }
    }
    if (user.customRoleIds && Array.isArray(user.customRoleIds)) {
        for (const crId of user.customRoleIds) {
            const match = customRoles.find(r => r.id === crId);
            if (match && !result.some(r => r.id === match.id)) {
                result.push(match);
            }
        }
    }
    return result;
};
/**
 * Determines the effective data scope for a user.
 * Explicit override > Primary role scope
 */
export const getUserEffectiveScope = (user, customRoles = DEFAULT_ROLE_DEFINITIONS) => {
    if (!user)
        return 'OWN_RECORDS';
    if (user.dataScopeOverride)
        return user.dataScopeOverride;
    const roles = getAllRolesForUser(user, customRoles);
    // Hierarchy of scopes: if user has any role with 'ALL', they get 'ALL'.
    if (roles.some(r => r.defaultDataScope === 'ALL'))
        return 'ALL';
    if (roles.some(r => r.defaultDataScope === 'ORGANIZATION'))
        return 'ORGANIZATION';
    if (roles.some(r => r.defaultDataScope === 'TEAM'))
        return 'TEAM';
    if (roles.some(r => r.defaultDataScope === 'ASSIGNED_PROJECTS'))
        return 'ASSIGNED_PROJECTS';
    if (roles.some(r => r.defaultDataScope === 'ASSIGNED_CONTRACTS'))
        return 'ASSIGNED_CONTRACTS';
    if (roles.some(r => r.defaultDataScope === 'PARTNER_ORGANIZATION'))
        return 'PARTNER_ORGANIZATION';
    return roles[0]?.defaultDataScope || 'ASSIGNED_PROJECTS';
};
/**
 * Returns set of all granted permissions for a user across all assigned roles + custom permissions
 */
export const getUserPermissions = (user, customRoles = DEFAULT_ROLE_DEFINITIONS) => {
    if (!user)
        return new Set();
    const permissions = new Set();
    // If user is Admin or has ALL scope + admin role, grant all
    const roles = getAllRolesForUser(user, customRoles);
    for (const role of roles) {
        if (role.status === 'Active') {
            role.permissions.forEach(p => permissions.add(p));
        }
    }
    // Add individual custom permissions
    if (user.customPermissions && Array.isArray(user.customPermissions)) {
        user.customPermissions.forEach(p => permissions.add(p));
    }
    return permissions;
};
/**
 * Evaluates whether a user is allowed to perform a specific granular action
 */
export const hasPermission = (user, permission, customRoles = DEFAULT_ROLE_DEFINITIONS) => {
    if (!user)
        return false;
    const statusStr = String(user.status || '').toLowerCase();
    if (statusStr === 'inactive' || statusStr === 'suspended') {
        return false;
    }
    // System Administrator always passes
    if (user.role === Role.ADMIN)
        return true;
    const permissions = getUserPermissions(user, customRoles);
    return permissions.has(permission);
};
// ============================================================================
// DATA ACCESS & SCOPING ENFORCEMENT ENGINE
// ============================================================================
/**
 * Checks if a user is permitted to see/access a specific Project record based on Data Scope
 */
export const canUserAccessProject = (user, project, customRoles = DEFAULT_ROLE_DEFINITIONS) => {
    if (!user)
        return false;
    const statusStr = String(user.status || '').toLowerCase();
    if (statusStr === 'inactive' || statusStr === 'suspended') {
        return false;
    }
    const effectiveScope = getUserEffectiveScope(user, customRoles);
    // 1. ALL scope - Full regional visibility
    if (effectiveScope === 'ALL') {
        return true;
    }
    const username = user.username?.toLowerCase() || '';
    const userId = user.id?.toLowerCase() || '';
    const userFullName = user.fullName?.toLowerCase() || '';
    // Direct assignment checks
    const isDirectEngineer = (project.assignedEngineerId && (project.assignedEngineerId.toLowerCase() === userId || project.assignedEngineerId.toLowerCase() === username)) ||
        (project.assignedEngineerName && userFullName && project.assignedEngineerName.toLowerCase() === userFullName);
    const isDirectSupervisor = (project.assignedSupervisorId && (project.assignedSupervisorId.toLowerCase() === userId || project.assignedSupervisorId.toLowerCase() === username)) ||
        (project.assignedSupervisorName && userFullName && project.assignedSupervisorName.toLowerCase() === userFullName);
    const isDirectTeamLeader = project.assignedTeamLeaderId && (project.assignedTeamLeaderId.toLowerCase() === userId || project.assignedTeamLeaderId.toLowerCase() === username);
    const isSupportingStaff = project.assignedSupportingStaffIds && (project.assignedSupportingStaffIds.includes(userId) || project.assignedSupportingStaffIds.includes(username));
    const isCreator = project.creator && (project.creator.toLowerCase() === username || project.creator.toLowerCase() === userId);
    const isExplicitlyAssignedInUser = user.assignedProjectIds && Array.isArray(user.assignedProjectIds) && user.assignedProjectIds.includes(project.id);
    const hasDirectAssignment = isDirectEngineer || isDirectSupervisor || isDirectTeamLeader || isSupportingStaff || isCreator || isExplicitlyAssignedInUser;
    // 2. ASSIGNED_PROJECTS Scope (Strict Engineer / Supervisor Isolation)
    if (effectiveScope === 'ASSIGNED_PROJECTS') {
        return !!hasDirectAssignment;
    }
    // 3. TEAM Scope (Team Leader / Engineering Squad)
    if (effectiveScope === 'TEAM') {
        if (hasDirectAssignment)
            return true;
        if (user.assignedTeam && project.assignedTeam) {
            return user.assignedTeam.toLowerCase().trim() === project.assignedTeam.toLowerCase().trim();
        }
        return false;
    }
    // 4. ORGANIZATION Scope (Department / Zone / Program)
    if (effectiveScope === 'ORGANIZATION') {
        if (hasDirectAssignment)
            return true;
        // Check multi-program authorization list if defined
        const userAssignedPrograms = [
            ...(user.assignedProgram ? [user.assignedProgram] : []),
            ...(user.assignedPrograms || [])
        ].map(p => p.toLowerCase().trim());
        const hasProgramRestriction = userAssignedPrograms.length > 0 &&
            !userAssignedPrograms.some(p => p.includes('all programs') || p.includes('bureau level'));
        if (hasProgramRestriction) {
            const projectProgram = (project.program || '').toLowerCase().trim();
            const matchesProgram = userAssignedPrograms.some(up => projectProgram.includes(up) || up.includes(projectProgram));
            if (!matchesProgram) {
                return false;
            }
        }
        // Bureau-level / Head office without specific zone restriction sees all in their authorized programs
        const userZone = user.assignedZone?.toLowerCase() || '';
        if (!userZone || userZone.includes('all zones') || userZone.includes('regional')) {
            return true;
        }
        // Match Zone
        if (project.zone && project.zone.toLowerCase() === userZone) {
            return true;
        }
        return false;
    }
    // 5. PARTNER_ORGANIZATION Scope (NGOs / Donors like UNICEF, COWASH, World Bank)
    if (effectiveScope === 'PARTNER_ORGANIZATION') {
        if (hasDirectAssignment)
            return true;
        const partner = (user.partnerOrganization || user.assignedNgoName || user.department || '').toLowerCase().trim();
        const partnerId = (user.assignedNgoId || '').toLowerCase().trim();
        // Check project NGO association
        if (partnerId && project.implementingBody && project.implementingBody.toLowerCase().includes(partnerId)) {
            return true;
        }
        if (!partner)
            return false;
        const matchesFunding = project.fundingSource && project.fundingSource.toLowerCase().includes(partner);
        const matchesImplementing = project.implementingBody && project.implementingBody.toLowerCase().includes(partner);
        const matchesPartner = project.partnerOrganization && project.partnerOrganization.toLowerCase().includes(partner);
        const matchesProgram = project.program && project.program.toLowerCase().includes(partner);
        return !!(matchesFunding || matchesImplementing || matchesPartner || matchesProgram);
    }
    // 6. OWN_RECORDS Scope
    if (effectiveScope === 'OWN_RECORDS') {
        return !!(isCreator || hasDirectAssignment);
    }
    // 7. ASSIGNED_CONTRACTS Scope
    if (effectiveScope === 'ASSIGNED_CONTRACTS') {
        return !!hasDirectAssignment;
    }
    return false;
};
/**
 * Filters an array of projects according to user data access scope
 */
export const filterProjectsByScope = (projects, user, customRoles = DEFAULT_ROLE_DEFINITIONS) => {
    if (!user)
        return [];
    return projects.filter(p => canUserAccessProject(user, p, customRoles));
};
/**
 * Checks if a user is permitted to access a Contract record based on Data Scope
 */
// Helper to safely extract user and projects regardless of argument order
function resolveUserAndProjects(argA, argB) {
    let user = undefined;
    let projects = [];
    if (Array.isArray(argA)) {
        projects = argA;
        user = argB;
    }
    else if (Array.isArray(argB)) {
        user = argA;
        projects = argB;
    }
    else {
        if (argA && typeof argA === 'object' && ('role' in argA || 'username' in argA)) {
            user = argA;
            projects = Array.isArray(argB) ? argB : [];
        }
        else if (argB && typeof argB === 'object' && ('role' in argB || 'username' in argB)) {
            user = argB;
            projects = Array.isArray(argA) ? argA : [];
        }
        else {
            user = argA || argB;
            projects = [];
        }
    }
    return { user, projects: Array.isArray(projects) ? projects : [] };
}
/**
 * Checks if a user is permitted to access a Contract record based on Data Scope
 */
export const canUserAccessContract = (user, contract, projects = [], customRoles = DEFAULT_ROLE_DEFINITIONS) => {
    if (!user)
        return false;
    const statusStr = String(user.status || '').toLowerCase();
    if (statusStr === 'inactive' || statusStr === 'suspended') {
        return false;
    }
    const effectiveScope = getUserEffectiveScope(user, customRoles);
    if (effectiveScope === 'ALL')
        return true;
    const username = user.username?.toLowerCase() || '';
    const userId = user.id?.toLowerCase() || '';
    const userFullName = user.fullName?.toLowerCase() || '';
    // Direct contract role assignments
    const isContractManager = contract.contractManager && (contract.contractManager.toLowerCase() === username || contract.contractManager.toLowerCase() === userId);
    const isSupervisor = contract.supervisor && (contract.supervisor.toLowerCase() === username || contract.supervisor.toLowerCase() === userId);
    const isAssignedEng = (contract.assignedEngineerId && (contract.assignedEngineerId.toLowerCase() === userId || contract.assignedEngineerId.toLowerCase() === username)) ||
        (contract.assignedEngineer && userFullName && contract.assignedEngineer.toLowerCase() === userFullName);
    if (isContractManager || isSupervisor || isAssignedEng) {
        return true;
    }
    // If user has project scope or team scope, check associated project
    const safeProjects = Array.isArray(projects) ? projects : [];
    const parentProject = safeProjects.find(p => p && p.id === contract.projectId);
    if (parentProject) {
        return canUserAccessProject(user, parentProject, customRoles);
    }
    return false;
};
/**
 * Filters an array of contracts according to user data access scope
 */
export const filterContractsByScope = (contracts = [], arg2, arg3, customRoles = DEFAULT_ROLE_DEFINITIONS) => {
    if (!contracts || !Array.isArray(contracts))
        return [];
    const { user, projects } = resolveUserAndProjects(arg2, arg3);
    if (!user)
        return [];
    return contracts.filter(c => canUserAccessContract(user, c, projects, customRoles));
};
/**
 * Filters procurement records by project accessibility
 */
export const filterProcurementsByScope = (procurements = [], arg2, arg3, customRoles = DEFAULT_ROLE_DEFINITIONS) => {
    if (!procurements || !Array.isArray(procurements))
        return [];
    const { user, projects } = resolveUserAndProjects(arg2, arg3);
    if (!user)
        return [];
    const effectiveScope = getUserEffectiveScope(user, customRoles);
    if (effectiveScope === 'ALL')
        return procurements;
    return procurements.filter(proc => {
        const parentProject = (projects || []).find(p => p && p.id === proc.projectId);
        if (!parentProject)
            return effectiveScope === 'ORGANIZATION';
        return canUserAccessProject(user, parentProject, customRoles);
    });
};
/**
 * Filters field QA/QC inspection logs by project accessibility
 */
export const filterInspectionsByScope = (inspections = [], arg2, arg3, customRoles = DEFAULT_ROLE_DEFINITIONS) => {
    if (!inspections || !Array.isArray(inspections))
        return [];
    const { user, projects } = resolveUserAndProjects(arg2, arg3);
    if (!user)
        return [];
    const effectiveScope = getUserEffectiveScope(user, customRoles);
    if (effectiveScope === 'ALL')
        return inspections;
    const username = user.username?.toLowerCase() || '';
    const fullName = user.fullName?.toLowerCase() || '';
    return inspections.filter(insp => {
        // If inspector logged it personally
        if (insp.signedOffBy?.toLowerCase() === username || insp.inspectorName?.toLowerCase() === fullName) {
            return true;
        }
        const parentProject = (projects || []).find(p => p && p.id === insp.projectId);
        if (!parentProject)
            return false;
        return canUserAccessProject(user, parentProject, customRoles);
    });
};
/**
 * Filters documents by project accessibility
 */
export const filterDocumentsByScope = (documents = [], arg2, arg3, customRoles = DEFAULT_ROLE_DEFINITIONS) => {
    if (!documents || !Array.isArray(documents))
        return [];
    const { user, projects } = resolveUserAndProjects(arg2, arg3);
    if (!user)
        return [];
    const effectiveScope = getUserEffectiveScope(user, customRoles);
    if (effectiveScope === 'ALL')
        return documents;
    const username = user.username?.toLowerCase() || '';
    return documents.filter(doc => {
        if (doc.uploadedBy?.toLowerCase() === username)
            return true;
        const parentProject = (projects || []).find(p => p && p.id === doc.projectId);
        if (!parentProject)
            return true; // Global documents
        return canUserAccessProject(user, parentProject, customRoles);
    });
};
