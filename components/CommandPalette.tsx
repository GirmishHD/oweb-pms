import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Project, Contract, Role, Procurement, FieldInspectionLog, WeeklyWorkPlan } from '../types';
import { NAVIGATION_ITEMS, ICONS } from '../constants';
import { loadPrograms } from '../services/programService';
import { loadNgos } from '../services/ngoService';
import { loadStaff } from '../services/staffService';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    contracts: Contract[];
    procurements?: Procurement[];
    inspections?: FieldInspectionLog[];
    weeklyPlans?: WeeklyWorkPlan[];
    onNavigate: (moduleId: string, itemId?: string) => void;
    onTriggerAction?: (actionId: string) => void;
    currentRole?: Role;
}

interface CommandItem {
    id: string;
    title: string;
    subtitle?: string;
    category: 'Modules' | 'Projects' | 'Contracts' | 'Tenders & Procurement' | 'Weekly Plans & Site QA' | 'Programs & Portfolios' | 'NGOs & Partners' | 'Staff Directory' | 'Quick Actions';
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
    action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
    isOpen,
    onClose,
    projects,
    contracts,
    procurements = [],
    inspections = [],
    weeklyPlans = [],
    onNavigate,
    onTriggerAction,
    currentRole,
}) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Build searchable catalog
    const allItems = useMemo<CommandItem[]>(() => {
        const items: CommandItem[] = [];

        // 1. Navigation Modules
        NAVIGATION_ITEMS.forEach(nav => {
            items.push({
                id: `nav-${nav.id}`,
                title: `Go to ${nav.label}`,
                subtitle: `Navigate directly to ${nav.label} workspace`,
                category: 'Modules',
                icon: nav.icon,
                action: () => {
                    onNavigate(nav.id);
                    onClose();
                }
            });
        });

        // 2. Quick Actions
        items.push({
            id: 'action-new-project',
            title: 'Create New Project Form',
            subtitle: 'Initiate feasibility and project formulation',
            category: 'Quick Actions',
            icon: (
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
            ),
            badge: 'Planning',
            badgeColor: 'bg-emerald-100 text-emerald-800',
            action: () => {
                onNavigate('planning');
                onClose();
            }
        });

        items.push({
            id: 'action-field-inspection',
            title: 'Log New QA/QC Field Inspection',
            subtitle: 'Record site inspection, water quality test, or defect punch item',
            category: 'Quick Actions',
            icon: (
                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            badge: 'QA/QC',
            badgeColor: 'bg-sky-100 text-sky-800',
            action: () => {
                onNavigate('inspection');
                onClose();
            }
        });

        items.push({
            id: 'action-audit-deadlines',
            title: 'Audit Contract 30-Day Deadlines & Performance Bonds',
            subtitle: 'Scan and flag all contracts with performance bonds or completion dates within 30 days',
            category: 'Quick Actions',
            icon: (
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            badge: 'Milestone Alert',
            badgeColor: 'bg-amber-100 text-amber-800',
            action: () => {
                if (onTriggerAction) {
                    onTriggerAction('audit-contract-deadlines');
                }
                onClose();
            }
        });

        items.push({
            id: 'action-export-audit-logs',
            title: 'View & Export User Activity Audit Logs',
            subtitle: 'Filter user logins, creations, and updates with CSV export report',
            category: 'Quick Actions',
            icon: (
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            badge: 'Audit Trail',
            badgeColor: 'bg-emerald-100 text-emerald-800',
            action: () => {
                onNavigate('usermanagement');
                onClose();
            }
        });

        items.push({
            id: 'action-org-units',
            title: 'Manage Organization Units (Region → Woreda → Kebele)',
            subtitle: 'Centralized administrative hierarchy, cascading dropdowns, and geographic jurisdiction trees',
            category: 'Quick Actions',
            icon: (
                <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            badge: 'Master Data',
            badgeColor: 'bg-cyan-100 text-cyan-800',
            action: () => {
                onNavigate('masterdata');
                onClose();
            }
        });

        items.push({
            id: 'action-cost-overrun',
            title: 'Audit Cost Overruns & Budget Variations',
            subtitle: 'Review projects exceeding 10% budget overrun threshold',
            category: 'Quick Actions',
            icon: (
                <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            badge: 'Overrun Alert',
            badgeColor: 'bg-rose-100 text-rose-800',
            action: () => {
                onNavigate('performance');
                onClose();
            }
        });

        items.push({
            id: 'action-progress-gauges',
            title: 'Inspect Project Progress Tachometer Gauges',
            subtitle: 'Visual completion vs timeline health velocity',
            category: 'Quick Actions',
            icon: (
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
            ),
            badge: 'Gauge Health',
            badgeColor: 'bg-indigo-100 text-indigo-800',
            action: () => {
                onNavigate('performance');
                onClose();
            }
        });

        items.push({
            id: 'action-programs-portfolio',
            title: 'Manage Programs & Multi-Program Portfolios',
            subtitle: 'Configure ONE WaSH, COWASH, CR-WASH, budget allocations, and funding components',
            category: 'Quick Actions',
            icon: (
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                    <polyline points="2 17 12 22 22 17"/>
                    <polyline points="2 12 12 17 22 12"/>
                </svg>
            ),
            badge: 'Portfolios',
            badgeColor: 'bg-indigo-100 text-indigo-800',
            action: () => {
                onNavigate('programs');
                onClose();
            }
        });

        items.push({
            id: 'action-ngo-registry',
            title: 'Register & Track Implementing Partner NGOs',
            subtitle: 'Directory of NGOs, MOUs, operating zones, active water schemes, and agreements',
            category: 'Quick Actions',
            icon: (
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                    <path d="M9 22v-4h6v4"/>
                </svg>
            ),
            badge: 'Partners',
            badgeColor: 'bg-teal-100 text-teal-800',
            action: () => {
                onNavigate('ngos');
                onClose();
            }
        });

        items.push({
            id: 'action-staff-deployments',
            title: 'Manage Staff Classifications & Program Roster',
            subtitle: 'Deploy engineers, hydrologists, and technicians across programs and stations',
            category: 'Quick Actions',
            icon: (
                <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
                </svg>
            ),
            badge: 'Staff Roster',
            badgeColor: 'bg-cyan-100 text-cyan-800',
            action: () => {
                onNavigate('staff');
                onClose();
            }
        });

        // 3. Projects Catalog
        projects.forEach(p => {
            items.push({
                id: `proj-${p.id}`,
                title: p.name,
                subtitle: `${p.id} • ${p.zone} Zone, ${p.woreda} • ${p.program || 'OWEB'}`,
                category: 'Projects',
                icon: (
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                ),
                badge: p.status,
                badgeColor: p.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : p.status === 'Under Review' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700',
                action: () => {
                    onNavigate('dashboard', p.id);
                    onClose();
                }
            });
        });

        // 4. Contracts Catalog
        contracts.forEach(c => {
            items.push({
                id: `cont-${c.id}`,
                title: `${c.contractorName} - Contract #${c.id}`,
                subtitle: `Project: ${c.projectName || c.projectId} • Amount: ${new Intl.NumberFormat('en-US').format(c.contractAmount)} ETB`,
                category: 'Contracts',
                icon: (
                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                ),
                badge: c.status,
                badgeColor: c.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700',
                action: () => {
                    onNavigate('contract', c.id);
                    onClose();
                }
            });
        });

        // 5. Procurements & Tenders Catalog
        (procurements || []).forEach(proc => {
            items.push({
                id: `proc-${proc.id}`,
                title: `Tender ${proc.id} - ${proc.procurementMethod}`,
                subtitle: `Project: ${proc.projectId} • Status: ${proc.status} • Est: ${new Intl.NumberFormat('en-US').format(proc.estimatedAmount || 0)} ETB`,
                category: 'Tenders & Procurement',
                icon: (
                    <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                ),
                badge: proc.status,
                badgeColor: proc.status === 'Awarded' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800',
                action: () => {
                    onNavigate('procurement', proc.id);
                    onClose();
                }
            });
        });

        // 6. Weekly Work Plans Catalog
        (weeklyPlans || []).forEach(plan => {
            items.push({
                id: `plan-${plan.id}`,
                title: `Weekly Plan Week ${plan.weekNumber} - ${plan.projectName}`,
                subtitle: `Target: ${plan.targetPhysicalProgressPct}% • Prepared by: ${plan.preparedByName} • ${plan.zone} Zone`,
                category: 'Weekly Plans & Site QA',
                icon: (
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                ),
                badge: plan.status,
                badgeColor: plan.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
                action: () => {
                    onNavigate('inspection', plan.id);
                    onClose();
                }
            });
        });

        // 7. QA/QC Field Inspections Catalog
        (inspections || []).forEach(insp => {
            items.push({
                id: `insp-${insp.id}`,
                title: `QA/QC Inspection: ${insp.projectName}`,
                subtitle: `${insp.visitStage} • Rating: ${insp.workmanshipRating} • Progress: ${insp.overallPhysicalProgressPct}%`,
                category: 'Weekly Plans & Site QA',
                icon: (
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                badge: insp.workmanshipRating,
                badgeColor: insp.workmanshipRating === 'Exceptional' || insp.workmanshipRating === 'Satisfactory' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800',
                action: () => {
                    onNavigate('inspection', insp.id);
                    onClose();
                }
            });
        });

        // 8. Programs & Multi-Program Portfolios Catalog
        try {
            const programsCatalog = loadPrograms();
            programsCatalog.forEach(prog => {
                items.push({
                    id: `prog-${prog.id}`,
                    title: `${prog.name} (${prog.code})`,
                    subtitle: `Lead: ${prog.programManager} • Fund: ${prog.fundingSource} • Budget: ${new Intl.NumberFormat('en-US').format(prog.budgetETB || 0)} ETB`,
                    category: 'Programs & Portfolios',
                    icon: (
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                            <polyline points="2 17 12 22 22 17"/>
                            <polyline points="2 12 12 17 22 12"/>
                        </svg>
                    ),
                    badge: prog.status,
                    badgeColor: prog.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700',
                    action: () => {
                        onNavigate('programs', prog.id);
                        onClose();
                    }
                });
            });
        } catch (e) {
            console.error('Error loading programs for command palette', e);
        }

        // 9. Implementing Partner NGOs Catalog
        try {
            const ngosCatalog = loadNgos();
            ngosCatalog.forEach(ngo => {
                items.push({
                    id: `ngo-${ngo.id}`,
                    title: `${ngo.name} (${ngo.code})`,
                    subtitle: `Contact: ${ngo.contactPerson} • Area: ${ngo.operatingArea} • Schemes: ${ngo.activeSchemesCount ?? ngo.assignedProjectIds?.length ?? 0}`,
                    category: 'NGOs & Partners',
                    icon: (
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                            <path d="M9 22v-4h6v4"/>
                            <path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/>
                        </svg>
                    ),
                    badge: ngo.status,
                    badgeColor: ngo.status === 'Active' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700',
                    action: () => {
                        onNavigate('ngos', ngo.id);
                        onClose();
                    }
                });
            });
        } catch (e) {
            console.error('Error loading NGOs for command palette', e);
        }

        // 10. Staff Directory Catalog
        try {
            const staffCatalog = loadStaff();
            staffCatalog.forEach(stf => {
                items.push({
                    id: `stf-${stf.id}`,
                    title: `${stf.fullName} - ${stf.jobTitle}`,
                    subtitle: `Code: ${stf.staffCode} • Program: ${stf.assignedProgramName || 'Bureau'} • Dept: ${stf.department || 'Water Development'} • Station: ${stf.dutyStation || 'Bureau HQ'}`,
                    category: 'Staff Directory',
                    icon: (
                        <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
                        </svg>
                    ),
                    badge: stf.status,
                    badgeColor: stf.status === 'Active' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800',
                    action: () => {
                        onNavigate('staff', stf.id);
                        onClose();
                    }
                });
            });
        } catch (e) {
            console.error('Error loading staff for command palette', e);
        }

        return items;
    }, [projects, contracts, procurements, weeklyPlans, inspections, onNavigate, onClose]);

    // Filter results based on query
    const filteredItems = useMemo(() => {
        if (!query.trim()) {
            // Default suggested items
            return allItems.filter(item => item.category === 'Quick Actions' || item.category === 'Modules').slice(0, 8);
        }

        const q = query.toLowerCase();
        return allItems.filter(item => 
            item.title.toLowerCase().includes(q) ||
            (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
            (item.badge && item.badge.toLowerCase().includes(q)) ||
            item.category.toLowerCase().includes(q)
        ).slice(0, 12);
    }, [allItems, query]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    filteredItems[selectedIndex].action();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredItems, selectedIndex, onClose]);

    // Scroll selected into view
    useEffect(() => {
        if (listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#041d38]/75 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-fade-in">
            {/* Click outside backdrop */}
            <div className="fixed inset-0" onClick={onClose} />

            {/* Modal Dialog */}
            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl shadow-cyan-950/40 border border-sky-200 overflow-hidden z-10 flex flex-col max-h-[75vh] animate-scale-in">
                {/* Search Bar Input */}
                <div className="p-4 border-b border-sky-100 flex items-center gap-3 bg-sky-50/50">
                    <svg className="w-5 h-5 text-cyan-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search projects, programs, NGOs, staff, contracts, or commands... (e.g. 'ONE WASH', 'WaterAid', 'Shashamane')"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none font-medium"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 rounded-lg text-slate-400 hover:text-cyan-700 hover:bg-sky-100 transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-mono font-bold text-cyan-700 bg-white border border-sky-200 rounded shadow-2xs">
                        ESC
                    </kbd>
                </div>

                {/* Results List */}
                <div ref={listRef} className="flex-1 overflow-y-auto p-2 divide-y divide-sky-50 space-y-1 custom-scrollbar">
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item, index) => (
                            <div
                                key={item.id}
                                onClick={item.action}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                    index === selectedIndex ? 'bg-cyan-50/90 text-cyan-950 border border-cyan-200 shadow-2xs' : 'hover:bg-sky-50/60 text-slate-700'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                                        index === selectedIndex ? 'bg-cyan-600 text-white shadow-xs' : 'bg-sky-100/70 text-cyan-700'
                                    }`}>
                                        {item.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold truncate">{item.title}</span>
                                            {item.badge && (
                                                <span className="text-[10px] font-semibold text-slate-500 flex-shrink-0">
                                                    · {item.badge}
                                                </span>
                                            )}
                                        </div>
                                        {item.subtitle && (
                                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 flex-shrink-0">
                                    {item.category}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center space-y-2">
                            <div className="p-3 bg-sky-50 rounded-full w-12 h-12 mx-auto flex items-center justify-center text-cyan-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-xs font-bold text-slate-700">No matching water projects or commands found</p>
                            <p className="text-[11px] text-slate-400">Try searching for a woreda name, project status, or module keyword.</p>
                        </div>
                    )}
                </div>

                {/* Footer Tips */}
                <div className="bg-sky-50/80 px-4 py-2.5 border-t border-sky-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white border border-sky-200 rounded shadow-2xs text-cyan-800">↑</kbd>
                            <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white border border-sky-200 rounded shadow-2xs text-cyan-800">↓</kbd>
                            <span>to navigate</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white border border-sky-200 rounded shadow-2xs text-cyan-800">↵</kbd>
                            <span>to select</span>
                        </span>
                    </div>
                    <span className="font-bold text-cyan-700">OWEB Smart Omnisearch</span>
                </div>
            </div>
        </div>
    );
};
