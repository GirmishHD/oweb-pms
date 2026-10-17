import React, { useState } from 'react';
import { Role } from '../types';
import { ROLE_DEFINITIONS } from '../constants';
const PERMISSION_DATA = [
    // Planning Domain
    {
        domain: 'Planning & Project Formulation',
        action: 'Create & Draft Project Proposals',
        description: 'Initiate new water/sanitation schemes, enter technical specs and cost estimates',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'full',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'none',
            [Role.CONTRACT_MANAGER]: 'none',
            [Role.SUPERVISOR]: 'none',
            [Role.AUDITOR]: 'none',
        }
    },
    {
        domain: 'Planning & Project Formulation',
        action: 'Submit Proposals for Regional Review',
        description: 'Formal transition of draft projects into Submitted status',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'full',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'none',
            [Role.CONTRACT_MANAGER]: 'none',
            [Role.SUPERVISOR]: 'none',
            [Role.AUDITOR]: 'none',
        }
    },
    {
        domain: 'Planning & Project Formulation',
        action: 'Upload Feasibility & EIA Studies',
        description: 'Attach certified environmental & geotechnical study reports',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'full',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'none',
            [Role.CONTRACT_MANAGER]: 'none',
            [Role.SUPERVISOR]: 'none',
            [Role.AUDITOR]: 'none',
        }
    },
    // Review Domain
    {
        domain: 'Technical Review & EIA Clearance',
        action: 'Conduct Technical Evaluation',
        description: 'Examine design parameters, population coverage, and hydrology',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'read',
            [Role.REVIEWER]: 'full',
            [Role.PROCUREMENT]: 'none',
            [Role.CONTRACT_MANAGER]: 'none',
            [Role.SUPERVISOR]: 'none',
            [Role.AUDITOR]: 'read',
        }
    },
    {
        domain: 'Technical Review & EIA Clearance',
        action: 'Approve or Reject Proposals',
        description: 'Grant formal OWEB regional approval or return with review comments',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'none',
            [Role.REVIEWER]: 'full',
            [Role.PROCUREMENT]: 'none',
            [Role.CONTRACT_MANAGER]: 'none',
            [Role.SUPERVISOR]: 'none',
            [Role.AUDITOR]: 'none',
        }
    },
    // Procurement Domain
    {
        domain: 'Procurement & Tendering',
        action: 'Issue Tender & Manage Bidding Period',
        description: 'Initiate competitive procurement tenders for approved projects',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'none',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'full',
            [Role.CONTRACT_MANAGER]: 'none',
            [Role.SUPERVISOR]: 'none',
            [Role.AUDITOR]: 'read',
        }
    },
    {
        domain: 'Procurement & Bidding',
        action: 'Register & Evaluate Competing Bidders',
        description: 'Input readout and corrected financial bids, technical evaluation status',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'none',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'full',
            [Role.CONTRACT_MANAGER]: 'none',
            [Role.SUPERVISOR]: 'none',
            [Role.AUDITOR]: 'read',
        }
    },
    {
        domain: 'Procurement & Bidding',
        action: 'Publish Award & Standstill Notice',
        description: 'Designate winning contractor/JV and issue mandatory standstill period',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'none',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'full',
            [Role.CONTRACT_MANAGER]: 'none',
            [Role.SUPERVISOR]: 'none',
            [Role.AUDITOR]: 'read',
        }
    },
    // Contract Domain
    {
        domain: 'Contract Administration & Financials',
        action: 'Contract Setup & Officer Assignment',
        description: 'Assign Contract Manager and Resident Supervisor, record signing dates',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'none',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'read',
            [Role.CONTRACT_MANAGER]: 'full',
            [Role.SUPERVISOR]: 'read',
            [Role.AUDITOR]: 'read',
        }
    },
    {
        domain: 'Contract Administration & Financials',
        action: 'Manage Performance Security Guarantees',
        description: 'Record bank guarantee amounts, currencies, and expiry dates',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'none',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'none',
            [Role.CONTRACT_MANAGER]: 'full',
            [Role.SUPERVISOR]: 'read',
            [Role.AUDITOR]: 'read',
        }
    },
    {
        domain: 'Contract Administration & Financials',
        action: 'Certify Interim Deliverable Payments',
        description: 'Record actual disbursement amounts and payment dates against milestones',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'none',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'none',
            [Role.CONTRACT_MANAGER]: 'full',
            [Role.SUPERVISOR]: 'scoped',
            [Role.AUDITOR]: 'read',
        }
    },
    {
        domain: 'Contract Administration & Financials',
        action: 'Approve Variations & Claims',
        description: 'Record variation orders, time extensions, and financial claims',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'none',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'none',
            [Role.CONTRACT_MANAGER]: 'full',
            [Role.SUPERVISOR]: 'scoped',
            [Role.AUDITOR]: 'read',
        }
    },
    // Site Supervision Domain
    {
        domain: 'Site Supervision & Inspection',
        action: 'Site Handover & SEASH Verification',
        description: 'Confirm site possession and environmental/social conference milestones',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'none',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'none',
            [Role.CONTRACT_MANAGER]: 'full',
            [Role.SUPERVISOR]: 'full',
            [Role.AUDITOR]: 'read',
        }
    },
    {
        domain: 'Site Supervision & Inspection',
        action: 'Milestone Progress Sign-Off',
        description: 'Validate actual on-the-ground work completion prior to payment',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'none',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'none',
            [Role.CONTRACT_MANAGER]: 'full',
            [Role.SUPERVISOR]: 'full',
            [Role.AUDITOR]: 'read',
        }
    },
    // Documents Domain
    {
        domain: 'Document Repository',
        action: 'Browse & Download Project Documents',
        description: 'Access drawings, EIA files, contracts, and progress reports',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'full',
            [Role.REVIEWER]: 'full',
            [Role.PROCUREMENT]: 'full',
            [Role.CONTRACT_MANAGER]: 'full',
            [Role.SUPERVISOR]: 'full',
            [Role.AUDITOR]: 'full',
        }
    },
    {
        domain: 'Document Repository',
        action: 'Delete / Purge Document Records',
        description: 'Permanently remove documents from the central archive',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'scoped',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'none',
            [Role.CONTRACT_MANAGER]: 'scoped',
            [Role.SUPERVISOR]: 'none',
            [Role.AUDITOR]: 'none',
        }
    },
    // Reporting & Auditing Domain
    {
        domain: 'Reporting & Analytics',
        action: 'View Executive Dashboard & Charts',
        description: 'Regional project breakdown, budget allocations, and status distributions',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'read',
            [Role.REVIEWER]: 'read',
            [Role.PROCUREMENT]: 'read',
            [Role.CONTRACT_MANAGER]: 'read',
            [Role.SUPERVISOR]: 'read',
            [Role.AUDITOR]: 'read',
        }
    },
    {
        domain: 'Reporting & Analytics',
        action: 'Budget vs Award Variance Analysis',
        description: 'Compare initial planning estimates vs competitive bid award prices',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'none',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'none',
            [Role.CONTRACT_MANAGER]: 'full',
            [Role.SUPERVISOR]: 'read',
            [Role.AUDITOR]: 'full',
        }
    },
    {
        domain: 'Reporting & Analytics',
        action: 'Export Reports (Excel & PDF)',
        description: 'Generate formatted spreadsheets and print-ready executive summaries',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'read',
            [Role.REVIEWER]: 'read',
            [Role.PROCUREMENT]: 'read',
            [Role.CONTRACT_MANAGER]: 'full',
            [Role.SUPERVISOR]: 'read',
            [Role.AUDITOR]: 'full',
        }
    },
    // User Governance & Security Domain
    {
        domain: 'System Governance & Security',
        action: 'User Account Provisioning & CRUD',
        description: 'Create, update, deactivate, and delete user profiles and credentials',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'none',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'none',
            [Role.CONTRACT_MANAGER]: 'none',
            [Role.SUPERVISOR]: 'none',
            [Role.AUDITOR]: 'none',
        }
    },
    {
        domain: 'System Governance & Security',
        action: 'Role Assignment & RBAC Governance',
        description: 'Assign role privileges, department access, and zone boundaries',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'none',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'none',
            [Role.CONTRACT_MANAGER]: 'none',
            [Role.SUPERVISOR]: 'none',
            [Role.AUDITOR]: 'none',
        }
    },
    {
        domain: 'System Governance & Security',
        action: 'Database Backup & System Restore',
        description: 'Download JSON snapshots of the entire application and restore state',
        permissions: {
            [Role.ADMIN]: 'full',
            [Role.USER]: 'none',
            [Role.REVIEWER]: 'none',
            [Role.PROCUREMENT]: 'none',
            [Role.CONTRACT_MANAGER]: 'none',
            [Role.SUPERVISOR]: 'none',
            [Role.AUDITOR]: 'none',
        }
    }
];
const renderPermissionBadge = (level) => {
    switch (level) {
        case 'full':
            return (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/>
                    </svg>
                    Full Access
                </span>);
        case 'read':
            return (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    Read Only
                </span>);
        case 'scoped':
            return (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                    Scoped (Assigned)
                </span>);
        case 'none':
        default:
            return (<span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-slate-300 bg-slate-50 font-bold text-xs">
                    —
                </span>);
    }
};
const RolePermissionMatrix = () => {
    const [selectedRole, setSelectedRole] = useState('ALL');
    const [selectedDomain, setSelectedDomain] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const domains = Array.from(new Set(PERMISSION_DATA.map(p => p.domain)));
    const roles = Object.values(Role);
    const filteredRows = PERMISSION_DATA.filter(row => {
        const matchesDomain = selectedDomain === 'ALL' || row.domain === selectedDomain;
        const matchesSearch = searchTerm === '' ||
            row.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.domain.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesDomain && matchesSearch;
    });
    return (<div className="space-y-8">
            {/* Header Description */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                </svg>
                            </span>
                            <h3 className="text-xl font-bold">Role-Based Access Control (RBAC) Governance</h3>
                        </div>
                        <p className="text-sm text-slate-300 mt-2 max-w-3xl">
                            OWEB PB-PMS enforces strict principle-of-least-privilege across 7 distinct organizational roles. Review exact module privileges, data mutation boundaries, and authorization controls below.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Full Write
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Read Only
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Scoped
                        </div>
                    </div>
                </div>
            </div>

            {/* Role Definitions Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {roles.map(role => {
            const def = ROLE_DEFINITIONS[role];
            const isSelected = selectedRole === role;
            return (<div key={role} onClick={() => setSelectedRole(selectedRole === role ? 'ALL' : role)} className={`p-5 rounded-xl border transition-all cursor-pointer ${isSelected
                    ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}>
                            <div className="flex items-start justify-between">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${def?.bgBadge || 'bg-slate-100'} ${def?.textBadge || 'text-slate-800'}`}>
                                    {def?.label || role}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                    {role}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-2.5 line-clamp-2">
                                {def?.description}
                            </p>
                            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                                {def?.defaultCapabilities.slice(0, 3).map((cap, i) => (<span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                        {cap}
                                    </span>))}
                                {(def?.defaultCapabilities.length || 0) > 3 && (<span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-400 font-medium">
                                        +{def.defaultCapabilities.length - 3} more
                                    </span>)}
                            </div>
                        </div>);
        })}
            </div>

            {/* Filter Controls for the Matrix */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input type="text" placeholder="Search permission or action..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                    </div>

                    <select value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)} className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="ALL">All Functional Domains ({domains.length})</option>
                        {domains.map(d => (<option key={d} value={d}>{d}</option>))}
                    </select>

                    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="ALL">All System Roles ({roles.length})</option>
                        {roles.map(r => (<option key={r} value={r}>{r}</option>))}
                    </select>
                </div>

                <div className="text-xs text-slate-500 whitespace-nowrap">
                    Showing <strong className="text-slate-800">{filteredRows.length}</strong> capability controls
                </div>
            </div>

            {/* Permission Matrix Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold sticky top-0">
                            <tr>
                                <th className="px-6 py-4 min-w-[280px]">Functional Capability</th>
                                {roles.filter(r => selectedRole === 'ALL' || selectedRole === r).map(role => (<th key={role} className="px-4 py-4 text-center whitespace-nowrap min-w-[140px]">
                                        <div className="font-bold text-slate-800">{role}</div>
                                        <div className="text-[10px] font-normal text-slate-400 lowercase">{ROLE_DEFINITIONS[role]?.label || ''}</div>
                                    </th>))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRows.map((row, index) => {
            const isFirstInDomain = index === 0 || filteredRows[index - 1].domain !== row.domain;
            return (<React.Fragment key={index}>
                                        {isFirstInDomain && (<tr className="bg-slate-100/70">
                                                <td colSpan={roles.filter(r => selectedRole === 'ALL' || selectedRole === r).length + 1} className="px-6 py-2.5 text-xs font-bold text-slate-700 tracking-wide uppercase">
                                                    {row.domain}
                                                </td>
                                            </tr>)}
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3.5">
                                                <div className="font-semibold text-slate-800 text-xs">
                                                    {row.action}
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">
                                                    {row.description}
                                                </div>
                                            </td>
                                            {roles.filter(r => selectedRole === 'ALL' || selectedRole === r).map(role => {
                    const lvl = row.permissions[role] || (role === Role.ADMIN ? 'full' :
                        role === Role.DIRECTOR ? 'full' :
                            role === Role.COORDINATOR ? 'scoped' :
                                (role === Role.ENGINEER || role === Role.SUPERVISOR) ? 'scoped' :
                                    (role === Role.AUDITOR || role === Role.VIEWER) ? 'read' : 'none');
                    return (<td key={role} className="px-4 py-3.5 text-center">
                                                        {renderPermissionBadge(lvl)}
                                                    </td>);
                })}
                                        </tr>
                                    </React.Fragment>);
        })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>);
};
export default RolePermissionMatrix;
