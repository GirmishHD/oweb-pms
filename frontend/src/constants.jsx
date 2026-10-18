import React from 'react';
import { Role } from './types';
export const ICONS = {
    dashboard: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20V16"/></svg>,
    planning: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>,
    review: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h.01"/><path d="M7 3.34a10 10 0 1 1-4.995 8.984"/><path d="m2 8 3 3 3-3"/><path d="M12 14a4 4 0 0 0-8 0v0a4 4 0 0 0 8 0v0Z"/><path d="M16 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/></svg>,
    procurement: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8"/><path d="M7 3v2"/><path d="M17 3v2"/><path d="M10.152 11.152a2 2 0 0 0-2.304 2.303l-.002.002 2.304-2.303Z"/><path d="M11.996 6.004 6.002 12.002a8 8 0 1 0 11.992 0L12 6Z"/><path d="m14 14 6-6"/></svg>,
    contract: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v.5Z"/><path d="M8 19v-5"/><path d="M16 19v-5"/><path d="M12 19v-5"/><path d="M12 5a9.1 9.1 0 0 0-5.18 1.82"/><path d="M12 5a9.1 9.1 0 0 1 5.18 1.82"/></svg>,
    documents: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>,
    gisMap: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>,
    inspection: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    performance: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
    menu: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
    logout: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
    bell: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
    user: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    lock: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    chevronDown: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
    chevronUp: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>,
    sparkles: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 4.2-4.2 1.9 4.2 1.9 1.9 4.2 1.9-4.2 4.2-1.9-4.2-1.9Z"/><path d="M5 12s2.55-1.29 4.24-2.12"/><path d="M19 12s-2.55-1.29-4.24-2.12"/><path d="M12 19s1.29-2.55 2.12-4.24"/><path d="M12 5s1.29 2.55 2.12 4.24"/></svg>,
    briefcase: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    clock: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    dollarSign: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    fileSignature: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 19.5v.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8.5L20 7.5V10"/><path d="M8 18h1"/><path d="M12.5 15.8a1 1 0 0 0 1 1.732 1 1 0 0 0 1.732-1l-2.264-3.92a.5.5 0 0 0-.866 0L10 16.5l.206 2.064a1 1 0 0 0 .966.736H15"/><polyline points="14 2 14 8 20 8"/></svg>,
    checkCircle: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    alertTriangle: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    info: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    search: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
    users: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    paperclip: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l.76-.75"></path></svg>,
    reporting: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>,
    waterDrop: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>,
    chat: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>,
    send: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>,
    mail: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>,
    training: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    lightbulb: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 9 2c-3.1 0-5.5 2.3-5.9 5.2"/><path d="M12 14v4"/><path d="M8 20h8"/><path d="M10 18h4"/></svg>,
    shieldAlert: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>,
    refreshCw: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>,
    mapPin: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    database: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>,
    calendar: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="6" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    download: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    fileText: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    layers: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    building: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>,
    userCheck: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
};
export const NAVIGATION_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard },
    { id: 'ngos', label: 'NGOs & Partners', icon: ICONS.building },
    { id: 'staff', label: 'Staff Management', icon: ICONS.userCheck },
    { id: 'gisMap', label: 'GIS & Regional Map', icon: ICONS.gisMap },
    { id: 'inspection', label: 'QA/QC & Field Logs', icon: ICONS.inspection },
    { id: 'planning', label: 'Planning', icon: ICONS.planning },
    { id: 'review', label: 'Review & Approvals', icon: ICONS.review },
    { id: 'procurement', label: 'Procurement & Tenders', icon: ICONS.procurement },
    { id: 'contract', label: 'Contract Administration', icon: ICONS.contract },
    { id: 'performance', label: 'Performance & Overruns', icon: ICONS.performance },
    { id: 'documents', label: 'Documents & Vault', icon: ICONS.documents },
    { id: 'reporting', label: 'Reporting & Analytics', icon: ICONS.reporting },
    { id: 'usermanagement', label: 'Users & Security', icon: ICONS.users },
    { id: 'masterdata', label: 'Master Data & Registry', icon: ICONS.database },
    { id: 'training', label: 'Training Center', icon: ICONS.training },
];
export const ROLE_PERMISSIONS = {
    canViewDashboard: Object.values(Role),
    canViewNgos: Object.values(Role),
    canViewStaff: Object.values(Role),
    canViewGisMap: Object.values(Role),
    canViewInspection: [Role.ADMIN, Role.SUPERVISOR, Role.ENGINEER, Role.TEAM_LEADER, Role.COORDINATOR, Role.DIRECTOR, Role.CONTRACT_MANAGER, Role.REVIEWER, Role.AUDITOR, Role.USER],
    canViewPlanning: [Role.ADMIN, Role.USER, Role.PLANNING_OFFICER, Role.ENGINEER, Role.TEAM_LEADER, Role.COORDINATOR, Role.DIRECTOR, Role.AUDITOR],
    canViewReview: [Role.ADMIN, Role.REVIEWER, Role.DIRECTOR, Role.COORDINATOR, Role.AUDITOR],
    canViewProcurement: [Role.ADMIN, Role.PROCUREMENT, Role.DIRECTOR, Role.COORDINATOR, Role.AUDITOR],
    canViewContract: [Role.ADMIN, Role.CONTRACT_MANAGER, Role.SUPERVISOR, Role.ENGINEER, Role.FINANCE_OFFICER, Role.DIRECTOR, Role.COORDINATOR, Role.AUDITOR],
    canViewPerformance: Object.values(Role),
    canViewDocuments: Object.values(Role),
    canViewUserManagement: [Role.ADMIN, Role.DIRECTOR],
    canViewUsermanagement: [Role.ADMIN, Role.DIRECTOR],
    canViewMasterData: [Role.ADMIN, Role.AUDITOR, Role.DIRECTOR, Role.COORDINATOR],
    canViewMasterdata: [Role.ADMIN, Role.AUDITOR, Role.DIRECTOR, Role.COORDINATOR],
    canViewReporting: [Role.ADMIN, Role.CONTRACT_MANAGER, Role.SUPERVISOR, Role.AUDITOR, Role.REVIEWER, Role.DIRECTOR, Role.COORDINATOR, Role.TEAM_LEADER, Role.FINANCE_OFFICER, Role.ME_OFFICER, Role.PARTNER_MEMBER],
    canViewTraining: Object.values(Role),
};
export const ROLE_DEFINITIONS = {
    [Role.ADMIN]: {
        role: Role.ADMIN,
        label: 'System Administrator',
        description: 'Complete governance, user management, system backups, and global configuration.',
        color: '#6366f1',
        bgBadge: 'bg-indigo-50 border-indigo-200',
        textBadge: 'text-indigo-700',
        icon: 'ShieldCheck',
        responsibilities: [
            'User provisioning, role assignment, and password resets',
            'Full write and read access across all modules',
            'System database backup, snapshotting, and restoration',
            'Audit log tracking and security compliance'
        ],
        defaultCapabilities: ['Full Admin', 'User Management', 'Project Planning', 'Review & Approval', 'Procurement', 'Contract Management', 'Reporting & Exports', 'Backup & Restore']
    },
    [Role.DIRECTOR]: {
        role: Role.DIRECTOR,
        label: 'Director',
        description: 'Bureau leadership with full regional oversight, executive analytics, and strategic approvals.',
        color: '#0f766e',
        bgBadge: 'bg-teal-50 border-teal-200',
        textBadge: 'text-teal-700',
        icon: 'Award',
        responsibilities: [
            'Executive strategic oversight over regional water portfolio',
            'Endorsement of annual capital budgets and program components',
            'Final approval of high-value variation orders and contracts',
            'Bureau performance analytics and donor coordination'
        ],
        defaultCapabilities: ['Executive Oversight', 'Global Data Scope', 'Budget Approvals', 'Strategic Reports', 'Audit Review']
    },
    [Role.COORDINATOR]: {
        role: Role.COORDINATOR,
        label: 'Program Coordinator',
        description: 'Program-wide operational coordinator assigning field engineers and managing cross-zonal delivery.',
        color: '#0284c7',
        bgBadge: 'bg-sky-50 border-sky-200',
        textBadge: 'text-sky-700',
        icon: 'Compass',
        responsibilities: [
            'Cross-zonal project coordination and resource scheduling',
            'Assign resident engineers, supervisors, and squads to projects',
            'Review milestone progress and resolve implementation bottlenecks',
            'Coordinate procurement packaging with regional directorates'
        ],
        defaultCapabilities: ['Program Coordination', 'Staff Assignment', 'Project Tracking', 'Operational Analytics', 'Field Verification']
    },
    [Role.TEAM_LEADER]: {
        role: Role.TEAM_LEADER,
        label: 'Team Leader',
        description: 'Technical lead managing specific engineering squads, assigning scheme activities, and weekly work plans.',
        color: '#7c3aed',
        bgBadge: 'bg-purple-50 border-purple-200',
        textBadge: 'text-purple-700',
        icon: 'Users',
        responsibilities: [
            'Manage dedicated engineering and drilling squad tasks',
            'Approve weekly site work plans and physical progress reports',
            'Supervise quality compliance and defect remediation',
            'Coordinate with woreda water offices and local stakeholders'
        ],
        defaultCapabilities: ['Team Data Scope', 'Activity Management', 'Weekly Plan Approval', 'Squad Leadership', 'Site Verification']
    },
    [Role.ENGINEER]: {
        role: Role.ENGINEER,
        label: 'Project Engineer',
        description: 'Field engineer with access strictly isolated to assigned schemes, task execution, and progress filing.',
        color: '#d97706',
        bgBadge: 'bg-amber-50 border-amber-200',
        textBadge: 'text-amber-700',
        icon: 'Wrench',
        responsibilities: [
            'Direct on-site execution and technical measurement of assigned schemes',
            'Submit weekly work plans and field progress logs',
            'Record site challenges, delay factors, and material inputs',
            'Verify quantities and prepare draft interim payment certificates'
        ],
        defaultCapabilities: ['Assigned Projects Scope', 'Activity Execution', 'Weekly Work Plans', 'Site Progress Filing', 'Vault Access']
    },
    [Role.REVIEWER]: {
        role: Role.REVIEWER,
        label: 'Technical Reviewer',
        description: 'Technical evaluation, Feasibility & EIA verification, and project approval/rejection.',
        color: '#10b981',
        bgBadge: 'bg-emerald-50 border-emerald-200',
        textBadge: 'text-emerald-700',
        icon: 'CheckCircle',
        responsibilities: [
            'Examine technical feasibility study reports and drawings',
            'Validate Environmental & Social Impact Assessments (EIA)',
            'Provide official review feedback and approve or reject submissions',
            'Authorize projects for procurement stage'
        ],
        defaultCapabilities: ['Project Review', 'Technical Validation', 'EIA Auditing', 'Approval/Rejection', 'Document Access', 'Dashboard Analytics']
    },
    [Role.PROCUREMENT]: {
        role: Role.PROCUREMENT,
        label: 'Procurement Specialist',
        description: 'Tendering lifecycle, bidder registration, bid evaluation, award, and standstill notice.',
        color: '#f59e0b',
        bgBadge: 'bg-amber-50 border-amber-200',
        textBadge: 'text-amber-700',
        icon: 'Briefcase',
        responsibilities: [
            'Issue bidding tenders and manage submission timelines',
            'Register and evaluate competing contractors and JV firms',
            'Record readout and corrected bid prices with currency specs',
            'Publish tender awards and manage standstill notifications'
        ],
        defaultCapabilities: ['Tender Management', 'Bidder Evaluation', 'Award Publishing', 'Standstill Notices', 'Procurement Documents', 'Tender Variance']
    },
    [Role.CONTRACT_MANAGER]: {
        role: Role.CONTRACT_MANAGER,
        label: 'Contract Manager',
        description: 'Contract administration, performance securities, milestone deliverables, and payments.',
        color: '#e11d48',
        bgBadge: 'bg-rose-50 border-rose-200',
        textBadge: 'text-rose-700',
        icon: 'FileSignature',
        responsibilities: [
            'Contract signing and performance guarantee compliance tracking',
            'Monitor milestone deliverables, KPIs, and completion schedules',
            'Certify actual interim payments and review variations/claims',
            'Oversee site handover and SEASH conference governance'
        ],
        defaultCapabilities: ['Contract Administration', 'Payment Certification', 'Variation Management', 'Deliverable Tracking', 'Financial Reporting', 'Contract Documents']
    },
    [Role.SUPERVISOR]: {
        role: Role.SUPERVISOR,
        label: 'Resident Engineer / Supervisor',
        description: 'On-site technical supervision, quality verification, milestone sign-off, and site inspection.',
        color: '#0284c7',
        bgBadge: 'bg-sky-50 border-sky-200',
        textBadge: 'text-sky-700',
        icon: 'Eye',
        responsibilities: [
            'Daily on-site inspection of civil and electromechanical works',
            'Site handover verification and dispute board liaison',
            'Verify actual milestone completion dates before payment approval',
            'Record variations in field conditions and technical observations'
        ],
        defaultCapabilities: ['Site Supervision', 'Quality Verification', 'Milestone Inspection', 'Variation Inspection', 'Contract Oversight', 'Reporting']
    },
    [Role.FINANCE_OFFICER]: {
        role: Role.FINANCE_OFFICER,
        label: 'Finance Officer',
        description: 'Disbursement monitoring, contractor IPC settlements, and donor co-financing records.',
        color: '#15803d',
        bgBadge: 'bg-emerald-50 border-emerald-200',
        textBadge: 'text-emerald-700',
        icon: 'DollarSign',
        responsibilities: [
            'Process and record contractor interim payment certificates (IPCs)',
            'Monitor advance payment guarantees and amortization deductions',
            'Track budget variances and financial execution rates',
            'Generate donor liquidation and counterpart contribution reconciliations'
        ],
        defaultCapabilities: ['Financial Management', 'IPC Processing', 'Budget Tracking', 'Variance Analysis', 'Disbursement Reports']
    },
    [Role.PLANNING_OFFICER]: {
        role: Role.PLANNING_OFFICER,
        label: 'Planning Officer',
        description: 'Formulates multi-year capital plans, program components, water demand forecasts, and project proposals.',
        color: '#0369a1',
        bgBadge: 'bg-blue-50 border-blue-200',
        textBadge: 'text-blue-700',
        icon: 'Calendar',
        responsibilities: [
            'Formulate new water scheme proposals and master plans',
            'Model demographic growth and per-capita water demand projections',
            'Benchmark capital costs across deep well, gravity, and solar schemes',
            'Coordinate annual woreda-level priority submissions'
        ],
        defaultCapabilities: ['Project Formulation', 'Demand Estimation', 'Budget Allocation', 'Master Data Access', 'Capital Planning']
    },
    [Role.ME_OFFICER]: {
        role: Role.ME_OFFICER,
        label: 'Monitoring & Evaluation Officer',
        description: 'Beneficiary coverage tracking, contractor physical progress metrics, and defect closure verification.',
        color: '#4338ca',
        bgBadge: 'bg-indigo-50 border-indigo-200',
        textBadge: 'text-indigo-700',
        icon: 'BarChart2',
        responsibilities: [
            'Track key performance indicators (KPIs) and physical progress vs plans',
            'Monitor beneficiary population served by completed schemes',
            'Evaluate contractor timeliness and defect rectification velocity',
            'Publish monthly and quarterly M&E synthesis reports'
        ],
        defaultCapabilities: ['M&E Analytics', 'KPI Tracking', 'Progress Auditing', 'Reporting Suite', 'Defect Monitoring']
    },
    [Role.PARTNER_MEMBER]: {
        role: Role.PARTNER_MEMBER,
        label: 'NGO / Partner Representative',
        description: 'Donor or partner liaison monitoring co-financed programs (e.g. UNICEF, COWASH, World Bank).',
        color: '#4f46e5',
        bgBadge: 'bg-indigo-50 border-indigo-200',
        textBadge: 'text-indigo-700',
        icon: 'Globe',
        responsibilities: [
            'Monitor partner-funded project execution and fund absorption',
            'Inspect technical compliance and environmental benchmarks',
            'Access verified progress reports and photo logbooks',
            'Participate in quarterly joint sector review meetings'
        ],
        defaultCapabilities: ['Partner Data Scope', 'Scheme Monitoring', 'Inspection Logs', 'Report Exports', 'Vault Access']
    },
    [Role.VIEWER]: {
        role: Role.VIEWER,
        label: 'Viewer / Observer',
        description: 'Read-only access for stakeholders, external observers, and trainees.',
        color: '#64748b',
        bgBadge: 'bg-slate-50 border-slate-200',
        textBadge: 'text-slate-700',
        icon: 'Eye',
        responsibilities: [
            'View published water schemes and geographical map',
            'Access public project summaries and statistics',
            'Observe general workflow status'
        ],
        defaultCapabilities: ['Read-Only Access', 'Map Exploration', 'Document Viewing']
    },
    [Role.USER]: {
        role: Role.USER,
        label: 'Project Officer / Planner',
        description: 'Woreda & zonal project identification, technical scoping, budgeting, and submission.',
        color: '#2563eb',
        bgBadge: 'bg-blue-50 border-blue-200',
        textBadge: 'text-blue-700',
        icon: 'Edit3',
        responsibilities: [
            'Draft new water and sanitation project proposals across Oromia',
            'Input GPS coordinates, demographics, and technical specifications',
            'Formulate phase-level estimated budgets and funding structures',
            'Submit proposals for regional technical review'
        ],
        defaultCapabilities: ['Project Proposal Creation', 'Cost Estimation', 'Feasibility Upload', 'Proposal Submission', 'Draft Management', 'Training Access']
    },
    [Role.AUDITOR]: {
        role: Role.AUDITOR,
        label: 'Auditor / Donor Observer',
        description: 'Independent oversight, financial variance tracking, compliance monitoring, and reporting.',
        color: '#7c3aed',
        bgBadge: 'bg-purple-50 border-purple-200',
        textBadge: 'text-purple-700',
        icon: 'ClipboardCheck',
        responsibilities: [
            'Audit all procurement tenders, awards, and contract payments',
            'Track budget estimate vs actual award price variances',
            'Verify donor funding compliance (World Bank, UNICEF, OWEB)',
            'Generate comprehensive financial and phase cost reports'
        ],
        defaultCapabilities: ['Read-Only All Modules', 'Financial Auditing', 'Budget Variance Reports', 'Document Review', 'Export Reports', 'Activity Log Review']
    }
};
export const DEPARTMENTS = [
    'OWEB Head Office (Finfinnee)',
    'Water Supply & Sanitation Directorate',
    'Contract Administration Directorate',
    'Procurement & Property Directorate',
    'Study & Design Directorate',
    'Environmental & Social Directorate',
    'Finance & Budget Directorate',
    'Zonal Water Resource Bureau',
    'Woreda Water Office',
    'Project Implementation Unit (PIU)',
    'External Consultant / Supervision Team',
    'Donor / Partner Representative'
];
export const ORGANIZATIONS = [
    'OWEB Head Office (Finfinnee)',
    'Zonal Water Resource Bureau',
    'Woreda Water Office',
    'Urban Water Utility Enterprise',
    'Project Implementation Unit (PIU)',
    'COWASH Coordination Office',
    'UNICEF WaSH Sector Support',
    'World Bank PIU Unit',
    'WaterAid Ethiopia Liaison',
    'External Consultant / Supervision Firm',
    'Contractor Enterprise'
];
export const ENGINEERING_TEAMS = [
    'Hydrogeology & Drilling Squad',
    'Water Supply Team A (East Shewa & Arsi)',
    'Water Supply Team B (Bale & Hararghe)',
    'Urban Utilities & Sanitation Squad',
    'Electromechanical & Pumping Systems Unit',
    'Civil Works & Structural Unit',
    'Environmental & Watershed Protection Team',
    'Community Engagement & WASHCO Support'
];
export const PLANNING_STEPS = [
    { id: 'general', name: 'General & Program Alignment', description: 'Identification, program component & code generation.' },
    { id: 'geographic', name: 'Geographic & Hydrogeology', description: 'Administrative hierarchy, GPS, water source & pumping.' },
    { id: 'engineering', name: 'Engineering Sizing & Demand', description: 'Human & livestock population, daily demand & reservoir.' },
    { id: 'boq', name: 'BoQ & Budget Breakdown', description: 'Itemized capital expenditure & donor financing ratio.' },
    { id: 'safeguards', name: 'Environmental & Social Safeguards', description: 'EIA clearances, water quality baseline & WASHCO parity.' },
    { id: 'wbs', name: 'WBS & Milestone Schedule', description: 'Target milestone dates, procurement start & phase gates.' },
    { id: 'ai_evaluation', name: 'AI Feasibility & Justification', description: 'Gemini feasibility audit, benchmarks & executive narrative.' },
];
export const OROMIA_HIERARCHY = {
    'Arsi': ['Amigna', 'Aseko', 'Asella town', 'Bale', 'Bekoji town', 'Boku', 'Chilalo', 'Cholé', 'Digeluna Tijo', 'Dodota', 'Enkelo Wabe', 'Gedeb Asasa', 'Guna', 'Hitosa', 'Jeju', 'Limu Bilbilo', 'Lude Hitosa', 'Merti', 'Munessa', 'Robe', 'Seru', 'Shirka', 'Siltʼe', 'Sire', 'Sude', 'Tena', 'Tiyo', 'Ziway Dugda'],
    'Bale': ['Agarfa', 'Berbere', 'Delo Mena', 'Dinsho', 'Gasera', 'Goba', 'Goba town', 'Gololcha', 'Goro', 'Guradamole', 'Harena Buluk', 'Legehida', 'Medda Welabu', 'Rayitu', 'Robe town', 'Sawena', 'Sinana'],
    'Borena': ['Abaya', 'Arero', 'Bule Hora', 'Dhas', 'Dillo', 'Dire', 'Dugda Dawa', 'Gelana', 'Malka Soda', 'Miyo', 'Teltelē', 'Yabelo'],
    'East Hararghe': ['Babile', 'Bedeno', 'Chinaksen', 'Deder', 'Fedis', 'Girawa', 'Gola Oda', 'Goro Gutu', 'Gursum', 'Harar town', 'Haromaya', 'Jarso', 'Kersa', 'Kombolcha', 'Kurfa Chele', 'Malka Balo', 'Meyu', 'Meta'],
    'East Shewa': ['Adama', 'Adama Zuria', 'Ada\'a', 'Bishoftu', 'Bora', 'Boset', 'Dugda', 'Fentale', 'Gimbichu', 'Liben', 'Lome', 'Sude', 'Wenchi'],
    'East Welega': ['Bilo Boshe', 'Diga', 'Gida Kiremu', 'Gobu Sayo', 'Gudeya Billa', 'Haro Limmu', 'Jimma Arjo', 'Leka Dulecha', 'Limmu', 'Nekemte', 'Nunu Kumba', 'Sasiga', 'Sibu Sire', 'Wama Bonaya', 'Wayu Tuka'],
    'Guji': ['Adola Rede', 'Aga Wayu', 'Ana Sora', 'Bore', 'Dama', 'Dugda Dawa', 'Gorodola', 'Gumi Eldelo', 'Hambela Wamena', 'Liben', 'Odo Shakiso', 'Saba Boru', 'Uraga', 'Wadera'],
    'Horo Guduru Welega': ['Abay Chomen', 'Abe Dongoro', 'Amuru', 'Fincha\'a', 'Guduru', 'Horo', 'Jarte Jardega', 'Jimma Genete', 'Jimma Rare', 'Shambu town', 'Sibu Sire'],
    'Illubabor': ['Ale', 'Alge Sachi', 'Bedarre', 'Bure', 'Chora', 'Darimu', 'Didu', 'Dorani', 'Gechi', 'Hurumu', 'Mattu', 'Metu Zuria', 'Nono', 'Sale Nono', 'Suphe', 'Yayu'],
    'Jimma': ['Agaro town', 'Besaq', 'Chora Botor', 'Dedo', 'Gera', 'Goma', 'Guma', 'Kersa', 'Limmu Kosa', 'Limmu Sakka', 'Mana', 'Omo Nada', 'Saqa', 'Seka Chekorsa', 'Setema', 'Shebe Senbo', 'Sigmo', 'Sokoru'],
    'Kelam Welega': ['Anfilo', 'Dale Sedi', 'Dale Wabera', 'Dembi Dolo', 'Gawo Kebe', 'Gidami', 'Hawa Welele', 'Jimma Horo', 'Lalo Kile', 'Sayo', 'Yemalogun Welele'],
    'North Shewa': ['Abichuna Gne\'a', 'Aleltu', 'Debre Libanos', 'Degem', 'Dera', 'Fiche', 'Gerar Jarso', 'Girar Jarso', 'Hidabu Abote', 'Jida', 'Kembibit', 'Kuyu', 'Wara Jarso', 'Wayu', 'Yaya Gulele'],
    'Southwest Shewa': ['Sebeta Hawas', 'Ameya', 'Becho', 'Dawo', 'Elu', 'Goro', 'Ilala', 'Kersana Malima', 'Seden Sodo', 'Sodo Dacha', 'Tole', 'Waliso', 'Wolisso'],
    'West Arsi': ['Adaba', 'Dodola', 'Gedeb', 'Kofele', 'Kokosa', 'Nensebo', 'Shala', 'Shashamane', 'Siraro'],
    'West Hararghe': ['Anchar', 'Boke', 'Chiro', 'Chiro Zuria', 'Daro Lebu', 'Doba', 'Gemechis', 'Guba Koricha', 'Habro', 'Hirna', 'Kuni', 'Mieso', 'Oda Bultum', 'Shanan Dhugo', 'Tulo'],
    'West Shewa': ['Abuna Ginde Beret', 'Ada Berga', 'Ambo', 'Cheliya', 'Dano', 'Dendi', 'Dirre Inchini', 'Ejerie', 'Ejersa Lafo', 'Ginde Beret', 'Jeldu', 'Meta Robi', 'Nono', 'Toke Kutaye'],
    'West Welega': ['Aira', 'Babogambela', 'Begii', 'Boji Chokorsa', 'Boji Dirmaji', 'Gimbi', 'Gimbi town', 'Gublak', 'Homa', 'Jarso', 'Kondala', 'Lalo Asabi', 'Mana Sibu', 'Nejo', 'Nole Kaba', 'Sayo Nole', 'Yubdo']
};
export const ZONES = Object.keys(OROMIA_HIERARCHY);
export const PROJECT_TYPES = {
    'Water Supply': ['Solar-Powered Rural Scheme', 'Urban Piped System', 'Spring Protection', 'Deep Well Borehole System', 'Multi-Village Gravity Scheme'],
    'Sanitation': ['Public Toilet Construction', 'Waste Management System', 'Faecal Sludge Treatment Plant (FSTP)', 'Institutional Latrine Facilities'],
    'Water Resources Management': ['Watershed Protection', 'Catchment Conservation', 'Groundwater Recharge Dam']
};
export const WATER_SOURCES = ['Spring', 'Borehole', 'River', 'Rainwater Harvesting'];
export const ENERGY_SOURCES = ['Solar Pumping', 'Electric Grid Pumping', 'Generator Pumping', 'Hybrid Solar-Grid', 'Gravity Flow (No Power)'];
export const INTERVENTION_TYPES = ['New', 'Expansion', 'Rehabilitation'];
export const IMPLEMENTING_BODIES = ['Utility', 'OWEB', 'Community', 'UNICEF', 'WASH', 'Second Urban', 'Borena Program', 'Cowash', 'Other NGO'];
export const FUNDING_SOURCES = ['OWEB', 'UNICEF', 'World Bank', 'Government', 'Private Donor'];
export const RISK_LEVELS = ['Low', 'Medium', 'High'];
export const RELIABILITY_RATINGS = ['Reliable', 'Moderate', 'Seasonal', 'Unreliable'];
export const PROC_TYPES = ['Goods', 'Works', 'Consulting Services', 'Non-consulting Services'];
export const PROCUREMENT_METHODS = [
    'National Competitive Bidding (NCB)',
    'International Competitive Bidding (ICB)',
    'Restricted Bidding',
    'Request for Quotations (RFQ)',
    'Direct Contracting'
];
export const BID_EVALUATION_METHODS = [
    'Least Cost Evaluated Responsive (LCEB)',
    'Quality & Cost Based Selection (QCBS)',
    'Quality Based Selection (QBS)',
    'Fixed Budget Selection'
];
export const COMMITTEE_ROLES = [
    'Chairperson',
    'Secretary',
    'Technical Evaluator',
    'Procurement Specialist',
    'Financial Analyst',
    'Legal Advisor',
    'Observer'
];
export const BIDDER_TYPES = ['Individual', 'JV', 'Company'];
export const REJECTION_REASONS = ['Non-Compliant Bid', 'Late Submission', 'Technical Non-Conformity', 'Eligibility/Legal Disqualification'];
export const CURRENCIES = ['ETB', 'USD', 'EURO'];
export const DEFAULT_SAMPLE_COMMITTEE_MEMBERS = [
    {
        id: 'MEM-001',
        fullName: 'Eng. Tadesse Bekele',
        role: 'Chairperson',
        departmentOrAgency: 'Study & Design Directorate (OWEB)',
        specialization: 'Lead Water Supply & Hydraulic Engineer',
        phone: '+251 911 445566',
        email: 'tadesse.bekele@oweb.gov.et',
        hasSignedDeclaration: true,
        declarationDate: '2025-01-12',
        notes: '15+ years experience in large-scale rural piped water systems.'
    },
    {
        id: 'MEM-002',
        fullName: 'Fatuma Mohammed',
        role: 'Secretary',
        departmentOrAgency: 'Procurement & Property Directorate (OWEB)',
        specialization: 'Senior Procurement Specialist',
        phone: '+251 912 778899',
        email: 'fatuma.m@oweb.gov.et',
        hasSignedDeclaration: true,
        declarationDate: '2025-01-12',
        notes: 'PPA & World Bank Procurement Regulations certified.'
    },
    {
        id: 'MEM-003',
        fullName: 'Eng. Desta Kebede',
        role: 'Technical Evaluator',
        departmentOrAgency: 'Water Supply & Sanitation Directorate (OWEB)',
        specialization: 'Senior Electromechanical & Solar Pumping Specialist',
        phone: '+251 913 223344',
        email: 'desta.k@oweb.gov.et',
        hasSignedDeclaration: true,
        declarationDate: '2025-01-12',
        notes: 'Expert in borehole submersible pump design & solar hybrid arrays.'
    },
    {
        id: 'MEM-004',
        fullName: 'Chala Gutema',
        role: 'Technical Evaluator',
        departmentOrAgency: 'Contract Administration Directorate (OWEB)',
        specialization: 'Senior Civil & Structural Engineer',
        phone: '+251 914 556677',
        email: 'chala.g@oweb.gov.et',
        hasSignedDeclaration: true,
        declarationDate: '2025-01-12',
        notes: 'Reservoir and pressure pipeline specifications lead.'
    },
    {
        id: 'MEM-005',
        fullName: 'Almaz Tola',
        role: 'Financial Analyst',
        departmentOrAgency: 'Finance & Budget Directorate (OWEB)',
        specialization: 'Cost Estimation & Financial Auditor',
        phone: '+251 915 889900',
        email: 'almaz.t@oweb.gov.et',
        hasSignedDeclaration: true,
        declarationDate: '2025-01-12',
        notes: 'Arithmetic error rectification & market price baseline verification.'
    }
];
export const AMENDMENT_TYPES = ['Change of Amount', 'Time Extension', 'Scope Change', 'Variation Order', 'Other'];
export const VARIATION_STATUSES = ['Pending', 'Approved', 'Rejected'];
export const CLAIM_SOURCES = ['Client', 'Contractor', 'Consultant'];
export const CLAIM_STATUSES = ['Submitted', 'Under Review', 'Settled', 'Rejected'];
export const TERMINATION_REASONS = ['Breach of Contract', 'Mutual Agreement', 'Force Majeure'];
export const DELIVERABLE_CATEGORIES = ['Supply of Goods', 'Construction of Civil Works', 'Electromechanical Works', 'Other'];
export const PRIORITIES = ['High', 'Medium', 'Low'];
export const DOCUMENT_CATEGORIES = ['Feasibility Study', 'EIA Report', 'Contract Agreement', 'Technical Drawing', 'Progress Report', 'Photo', 'Other'];
export const PROGRAMS = [
    'ONE WASH (OWNP)',
    'COWASH',
    'Second Urban (UWSSP-II)',
    'Borena Resilient Program',
    'Regional Capital Budget',
    'Emergency & Drought WaSH'
];
export const PROGRAM_COMPONENTS = {
    'ONE WASH (OWNP)': ['Rural WaSH Schemes', 'Urban WaSH Utilities', 'Institutional WaSH (Schools & Health)', 'Program Management & Capacity'],
    'COWASH': ['Community-Managed Projects (CMP)', 'Spring Development & Hand Pumps', 'WASHCO Capacity & Community Empowerment', 'Inclusion & Disability WASH'],
    'Second Urban (UWSSP-II)': ['Urban Piped Network Expansion', 'Faecal Sludge Treatment Plant (FSTP)', 'Utility Operational Modernization', 'Non-Revenue Water (NRW) Reduction'],
    'Borena Resilient Program': ['Deep Groundwater Drilling (>500m)', 'Multi-Village Distribution Pipelines', 'Solar Pumping Systems & Inverters', 'Pastoralist Livestock Water Points'],
    'Regional Capital Budget': ['Zonal Priority Schemes', 'Major Town Bulk Water Supply', 'Rehabilitation & Expansion', 'Direct OWEB Treasury Interventions'],
    'Emergency & Drought WaSH': ['Rapid Electromechanical Overhaul', 'Water Trucking & Roving Filtration', 'Emergency Water Treatment Chemicals', 'Crisis Borehole Upgrading']
};
export const PROGRAM_DEFINITIONS = {
    'ONE WASH (OWNP)': {
        name: 'ONE WASH (OWNP)',
        code: 'ONE-WASH',
        leadAgency: 'OWEB / Consolidated WaSH Account (World Bank, UNICEF, AfDB, FCDO)',
        focusArea: 'Integrated rural & urban water systems, institutional school/health WASH facilities, and woreda-wide universal access.',
        color: '#0284c7', // Sky Blue
        badgeBg: 'bg-sky-50 border-sky-200',
        badgeText: 'text-sky-700',
        accentBorder: 'border-sky-500',
        description: 'National multi-donor basket fund delivering synchronized water supply, sanitation, and hygiene across Oromia woredas.',
        targetBeneficiaries: 1250000,
        initialBudgetETB: 450000000
    },
    'COWASH': {
        name: 'COWASH',
        code: 'COWASH',
        leadAgency: 'Government of Finland & OWEB',
        focusArea: 'Community-Managed Project (CMP) approach, rural protected springs, hand-dug wells, and deep local ownership.',
        color: '#10b981', // Emerald Green
        badgeBg: 'bg-emerald-50 border-emerald-200',
        badgeText: 'text-emerald-700',
        accentBorder: 'border-emerald-500',
        description: 'Community-led accelerated water and sanitation empowering community groups with direct fund management, procurement, and operations.',
        targetBeneficiaries: 680000,
        initialBudgetETB: 180000000
    },
    'Second Urban (UWSSP-II)': {
        name: 'Second Urban (UWSSP-II)',
        code: 'SUWSSP',
        leadAgency: 'World Bank & OWEB Urban Water Supply Directorate',
        focusArea: 'Major town water utilities, piped network expansion, non-revenue water reduction, and faecal sludge treatment plants.',
        color: '#6366f1', // Indigo
        badgeBg: 'bg-indigo-50 border-indigo-200',
        badgeText: 'text-indigo-700',
        accentBorder: 'border-indigo-500',
        description: 'Large-scale urban infrastructure enhancing operational efficiency and service quality for growing towns and utilities across Oromia.',
        targetBeneficiaries: 850000,
        initialBudgetETB: 520000000
    },
    'Borena Resilient Program': {
        name: 'Borena Resilient Program',
        code: 'BOR-WASH',
        leadAgency: 'OWEB & Climate Resilience Strategic Fund',
        focusArea: 'Deep groundwater aquifer development, solar pumping, multi-village distribution pipelines, and livestock troughs.',
        color: '#f59e0b', // Amber
        badgeBg: 'bg-amber-50 border-amber-200',
        badgeText: 'text-amber-700',
        accentBorder: 'border-amber-500',
        description: 'Climate-resilient deep groundwater multi-village schemes securing durable potable water for pastoralist communities in Borena zone.',
        targetBeneficiaries: 320000,
        initialBudgetETB: 240000000
    },
    'Regional Capital Budget': {
        name: 'Regional Capital Budget',
        code: 'OWEB-CAP',
        leadAgency: 'Oromia Regional Government Treasury',
        focusArea: 'Direct regional government treasury financed infrastructure projects across high-priority woredas and zones.',
        color: '#8b5cf6', // Purple
        badgeBg: 'bg-purple-50 border-purple-200',
        badgeText: 'text-purple-700',
        accentBorder: 'border-purple-500',
        description: 'Direct regional government treasury financed infrastructure projects across high-priority woredas and zones.',
        targetBeneficiaries: 950000,
        initialBudgetETB: 350000000
    },
    'Emergency & Drought WaSH': {
        name: 'Emergency & Drought WaSH',
        code: 'EMERG-WASH',
        leadAgency: 'OWEB / Disaster Risk Management Commission / UNICEF',
        focusArea: 'Rapid borehole electro-mechanical rehabilitation, water trucking distribution points, and emergency disinfection.',
        color: '#e11d48', // Rose Red
        badgeBg: 'bg-rose-50 border-rose-200',
        badgeText: 'text-rose-700',
        accentBorder: 'border-rose-500',
        description: 'Rapid-deployment emergency interventions addressing climate shocks, drought surges, and acute water shortages.',
        targetBeneficiaries: 410000,
        initialBudgetETB: 120000000
    }
};
export const ZONE_COORDINATES = {
    'Arsi': { lat: 7.95, lng: 39.13, corridor: 'Central-East Corridor', capital: 'Asella' },
    'Bale': { lat: 7.12, lng: 40.00, corridor: 'Southeast Corridor', capital: 'Robe' },
    'Borena': { lat: 4.88, lng: 38.08, corridor: 'Southern Pastoralist Corridor', capital: 'Yabelo' },
    'East Hararghe': { lat: 9.35, lng: 42.02, corridor: 'Eastern Corridor', capital: 'Haromaya / Harar' },
    'East Shewa': { lat: 8.54, lng: 39.27, corridor: 'Central Rift Corridor', capital: 'Adama' },
    'East Welega': { lat: 9.08, lng: 36.55, corridor: 'Western Corridor', capital: 'Nekemte' },
    'Guji': { lat: 5.88, lng: 38.98, corridor: 'Southern Highland Corridor', capital: 'Adola Rede / Negele' },
    'Horo Guduru Welega': { lat: 9.57, lng: 37.10, corridor: 'Northwest Corridor', capital: 'Shambu' },
    'Illubabor': { lat: 8.30, lng: 35.58, corridor: 'Southwest Forest Corridor', capital: 'Mattu' },
    'Jimma': { lat: 7.67, lng: 36.83, corridor: 'Southwest Coffee Corridor', capital: 'Jimma' },
    'Kelam Welega': { lat: 8.53, lng: 34.80, corridor: 'Far West Frontier Corridor', capital: 'Dembi Dolo' },
    'North Shewa': { lat: 9.80, lng: 38.73, corridor: 'Northern Highland Corridor', capital: 'Fiche' },
    'Southwest Shewa': { lat: 8.53, lng: 37.97, corridor: 'Central-Southwest Corridor', capital: 'Waliso' },
    'West Arsi': { lat: 7.20, lng: 38.60, corridor: 'Rift Valley Lakes Corridor', capital: 'Shashamane' },
    'West Hararghe': { lat: 9.08, lng: 40.87, corridor: 'Eastern Mountain Corridor', capital: 'Chiro' },
    'West Shewa': { lat: 8.98, lng: 37.85, corridor: 'Central-West Corridor', capital: 'Ambo' },
    'West Welega': { lat: 9.17, lng: 35.83, corridor: 'Western Highlands Corridor', capital: 'Gimbi' }
};
export const INITIAL_INSPECTIONS = [];

