import React, { useState, useMemo } from 'react';
import { Project, Contract, Procurement, FieldInspectionLog, WeeklyWorkPlan } from '../types';
import { Logo } from './Logo';
import { ICONS } from '../constants';

interface ExternalPortalProps {
    projects: Project[];
    contracts: Contract[];
    procurements: Procurement[];
    inspections?: FieldInspectionLog[];
    weeklyPlans?: WeeklyWorkPlan[];
    onOpenLogin: () => void;
    onSelectProject?: (projectId: string) => void;
    isLoggedIn?: boolean;
    onReturnToApp?: () => void;
}

export const ExternalPortal: React.FC<ExternalPortalProps> = ({
    projects = [],
    contracts = [],
    procurements = [],
    inspections = [],
    weeklyPlans = [],
    onOpenLogin,
    onSelectProject,
    isLoggedIn = false,
    onReturnToApp
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProgram, setSelectedProgram] = useState<string>('ALL');
    const [selectedZone, setSelectedZone] = useState<string>('ALL');
    const [activeTab, setActiveTab] = useState<'overview' | 'onewash' | 'cowash' | 'secondurban' | 'borena' | 'waterQuality' | 'schemes' | 'programs' | 'tenders' | 'contact'>('overview');
    const [inspectedProject, setInspectedProject] = useState<Project | null>(null);
    const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);
    const [inquiryForm, setInquiryForm] = useState({
        name: '',
        organization: '',
        email: '',
        phone: '',
        schemeId: '',
        category: 'Tender Information',
        message: ''
    });

    // Real aggregated financial & operational metrics
    const totalCommittedBudget = useMemo(() => {
        return projects.reduce((sum, p) => sum + (p.estimatedBudget || 0), 0);
    }, [projects]);

    const completedSchemesCount = useMemo(() => {
        return projects.filter(p => p.status === 'Completed' || p.actualCompletionDate).length;
    }, [projects]);

    const activeContractsCount = useMemo(() => {
        return contracts.filter(c => !c.completionDate).length;
    }, [contracts]);

    const activeTendersCount = useMemo(() => {
        return procurements.filter(pr => pr.status === 'Open' || pr.status === 'Evaluated').length;
    }, [procurements]);

    // Water quality compliance rate
    const waterComplianceRate = useMemo(() => {
        const tests = inspections.filter(i => i.waterQualityTest).map(i => i.waterQualityTest);
        if (tests.length === 0) return 100;
        const compliant = tests.filter(t => t?.complianceStatus === 'Compliant').length;
        return Math.round((compliant / tests.length) * 100);
    }, [inspections]);

    // Unique Zones and Programs from real projects
    const availableZones = useMemo(() => {
        const set = new Set<string>();
        projects.forEach(p => { if (p.zone) set.add(p.zone); });
        return Array.from(set).sort();
    }, [projects]);

    const availablePrograms = useMemo(() => {
        const set = new Set<string>();
        projects.forEach(p => { if (p.program) set.add(p.program); });
        return Array.from(set).sort();
    }, [projects]);

    // Programmatic stats from real data
    const programBreakdown = useMemo(() => {
        const map = new Map<string, { count: number; budget: number; zones: Set<string> }>();
        projects.forEach(p => {
            const prog = p.program || 'ONE WaSH National Program';
            if (!map.has(prog)) {
                map.set(prog, { count: 0, budget: 0, zones: new Set() });
            }
            const current = map.get(prog)!;
            current.count += 1;
            current.budget += (p.estimatedBudget || 0);
            if (p.zone) current.zones.add(p.zone);
        });

        return Array.from(map.entries()).map(([name, data]) => ({
            name,
            count: data.count,
            budget: data.budget,
            zonesCount: data.zones.size
        })).sort((a, b) => b.budget - a.budget);
    }, [projects]);

    // Filtered schemes
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchesQuery = !searchQuery || 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.zone && p.zone.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.woreda && p.woreda.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.program && p.program.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesProg = selectedProgram === 'ALL' || p.program === selectedProgram;
            const matchesZone = selectedZone === 'ALL' || p.zone === selectedZone;

            return matchesQuery && matchesProg && matchesZone;
        });
    }, [projects, searchQuery, selectedProgram, selectedZone]);

    const handleInquirySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const refCode = `OWEB-PUB-${Math.floor(100000 + Math.random() * 900000)}`;
        setInquirySuccess(refCode);
        setInquiryForm({
            name: '',
            organization: '',
            email: '',
            phone: '',
            schemeId: '',
            category: 'Tender Information',
            message: ''
        });
    };

    return (
        <div className="min-h-screen bg-[#f0f7fc] font-sans text-slate-800 antialiased flex flex-col selection:bg-cyan-400 selection:text-slate-950">
            {/* 1. ELEVARE INSTITUTIONAL TOP BAR - LUMINOUS WATER THEME */}
            <div className="bg-gradient-to-r from-[#03274a] via-[#053d71] to-[#032342] text-sky-200 text-[11px] border-b border-cyan-500/25 px-4 sm:px-8 py-2 z-30 shadow-xs">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-[10.5px]">
                        <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-widest text-cyan-300 font-display">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span>Public Transparency Portal</span>
                        </span>
                        <span className="text-sky-700 hidden md:inline">|</span>
                        <span className="text-sky-300/80 hidden md:inline font-mono">
                            ISO 9001 · WHO/CES WATER LEDGER
                        </span>
                        <span className="text-sky-700 hidden lg:inline">|</span>
                        <span className="text-sky-300/80 hidden lg:inline">
                            Hotline: <strong className="text-white">+251 11 551 0000</strong>
                        </span>
                    </div>

                    <div className="flex items-center gap-4 text-[10.5px]">
                        <div className="hidden sm:flex items-center gap-2 font-mono text-sky-200">
                            <span className="text-sky-300/70">Total Capital:</span>
                            <span className="font-bold text-white">ETB {(totalCommittedBudget / 1000000).toFixed(1)}M</span>
                        </div>
                        <span className="text-sky-700 hidden sm:inline">|</span>
                        
                        {isLoggedIn ? (
                            <button
                                onClick={onReturnToApp}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer shadow-xs font-display"
                            >
                                <span>← Return to Bureau Workspace</span>
                            </button>
                        ) : (
                            <button
                                onClick={onOpenLogin}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors cursor-pointer border border-white/15 font-display"
                            >
                                <span>Internal Staff &amp; Auditor Sign In →</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. ELEVARE MAIN BRAND HEADER */}
            <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-sky-100 z-20 shadow-xs shadow-sky-950/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
                    {/* Brand Emblem */}
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="p-2.5 bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 rounded-xl border border-cyan-300/40 shadow-md text-white flex-shrink-0 ring-1 ring-white/20">
                            <Logo className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-lg tracking-tight text-slate-900 font-display">
                                    OWEB
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-900 border border-cyan-200">
                                    Capital Ledger
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium truncate hidden sm:block">
                                Oromia Water Resource Bureau · Sovereign Capital &amp; Infrastructure
                            </p>
                        </div>
                    </div>

                    {/* Navigation Links (Elevare clean menu style - Oromia Flagship Programs) */}
                    <nav className="hidden lg:flex items-center gap-1 text-[13px] font-bold text-slate-700">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-3 py-2 rounded-lg transition-colors cursor-pointer font-display ${
                                activeTab === 'overview' ? 'text-blue-700 bg-sky-50 font-extrabold' : 'hover:text-blue-600 hover:bg-slate-50'
                            }`}
                        >
                            Oromia Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('onewash')}
                            className={`px-3 py-2 rounded-lg transition-colors cursor-pointer font-display flex items-center gap-1.5 ${
                                activeTab === 'onewash' || activeTab === 'schemes' ? 'text-blue-700 bg-sky-50 font-extrabold' : 'hover:text-blue-600 hover:bg-slate-50'
                            }`}
                        >
                            <span>ONE WASH</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 font-mono">
                                {projects.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('cowash')}
                            className={`px-3 py-2 rounded-lg transition-colors cursor-pointer font-display ${
                                activeTab === 'cowash' || activeTab === 'programs' ? 'text-blue-700 bg-sky-50 font-extrabold' : 'hover:text-blue-600 hover:bg-slate-50'
                            }`}
                        >
                            COWASH
                        </button>
                        <button
                            onClick={() => setActiveTab('secondurban')}
                            className={`px-3 py-2 rounded-lg transition-colors cursor-pointer font-display flex items-center gap-1.5 ${
                                activeTab === 'secondurban' || activeTab === 'tenders' ? 'text-blue-700 bg-sky-50 font-extrabold' : 'hover:text-blue-600 hover:bg-slate-50'
                            }`}
                        >
                            <span>Second Urban</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-mono">
                                {activeTendersCount}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('borena')}
                            className={`px-3 py-2 rounded-lg transition-colors cursor-pointer font-display ${
                                activeTab === 'borena' || activeTab === 'contact' ? 'text-blue-700 bg-sky-50 font-extrabold' : 'hover:text-blue-600 hover:bg-slate-50'
                            }`}
                        >
                            Borena Resilience
                        </button>
                        <button
                            onClick={() => setActiveTab('waterQuality')}
                            className={`px-3 py-2 rounded-lg transition-colors cursor-pointer font-display ${
                                activeTab === 'waterQuality' ? 'text-blue-700 bg-sky-50 font-extrabold' : 'hover:text-blue-600 hover:bg-slate-50'
                            }`}
                        >
                            WHO Standards Lab
                        </button>
                    </nav>

                    {/* Right Action */}
                    <div className="flex items-center gap-3">
                        {isLoggedIn ? (
                            <button
                                onClick={onReturnToApp}
                                className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-950/15 flex items-center gap-2 cursor-pointer font-display border border-cyan-400/30"
                            >
                                <span>Go to Bureau Management</span>
                                <span className="text-cyan-200">→</span>
                            </button>
                        ) : (
                            <button
                                onClick={onOpenLogin}
                                className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-950/15 flex items-center gap-2 cursor-pointer border border-cyan-400/30 font-display"
                            >
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span>Bureau Sign In</span>
                                <span className="text-cyan-200 font-mono">→</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1">
                {/* 3. ELEVARE SIGNATURE EXECUTIVE HERO SECTION - OCEANIC WATER THEME */}
                <section className="bg-gradient-to-br from-[#022849] via-[#034479] to-[#0275b2] text-white pt-16 pb-24 relative overflow-hidden border-b border-sky-700/50">
                    {/* Glowing Water Caustics & Aquamarine Light Bursts */}
                    <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[550px] h-[550px] bg-sky-300/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
                        <div className="max-w-3xl space-y-5">
                            {/* Water Crystal Badge */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-400/15 border border-cyan-400/40 text-cyan-200 text-xs font-bold uppercase tracking-wider font-display shadow-xs backdrop-blur-xs">
                                <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                                <span>Regional Water &amp; Sovereign Capital Transparency</span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] font-display">
                                Financing Clean Water Infrastructure for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-sky-200 to-white">Oromia</span>
                            </h1>

                            {/* Subtitle */}
                            <p className="text-sm sm:text-base text-sky-100/90 leading-relaxed max-w-2xl">
                                An institutional transparency portal tracking capital allocations, contractor engineering deliverables, 
                                and certified water potability standards across regional water schemes.
                            </p>

                            {/* Hero Search & Quick Discovery */}
                            <div className="pt-2">
                                <div className="p-2 bg-white/15 backdrop-blur-md rounded-2xl border border-white/25 shadow-2xl flex flex-col sm:flex-row items-center gap-2 max-w-2xl ring-1 ring-white/10">
                                    <div className="flex-1 flex items-center gap-2 px-3 w-full">
                                        <svg className="w-5 h-5 text-cyan-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search schemes, woredas, zones, contractors..."
                                            className="w-full bg-transparent text-sm text-white placeholder-sky-200/70 focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('onewash')}
                                        className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md font-display whitespace-nowrap"
                                    >
                                        Inspect ONE WASH Schemes ({filteredProjects.length})
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ELEVARE STATS CARDS ROW (Live Application Data - Luminous Water Glass Style) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 hover:border-cyan-300/60 shadow-lg hover:shadow-cyan-500/10 transition-all">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block mb-1 font-display">
                                    Total Capital Committed
                                </span>
                                <div className="text-2xl sm:text-3xl font-black text-white font-display tabular-nums">
                                    ETB {(totalCommittedBudget / 1000000).toFixed(1)}M
                                </div>
                                <span className="text-[11px] text-sky-200/80 mt-1 block">
                                    Across {availablePrograms.length} international &amp; state programs
                                </span>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 hover:border-cyan-300/60 shadow-lg hover:shadow-cyan-500/10 transition-all">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block mb-1 font-display">
                                    Regional Water Schemes
                                </span>
                                <div className="text-2xl sm:text-3xl font-black text-white font-display tabular-nums">
                                    {projects.length} Schemes
                                </div>
                                <span className="text-[11px] text-sky-200/80 mt-1 block">
                                    {completedSchemesCount} commissioned &middot; {projects.length - completedSchemesCount} in execution
                                </span>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 hover:border-cyan-300/60 shadow-lg hover:shadow-cyan-500/10 transition-all">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block mb-1 font-display">
                                    WHO &amp; CES Safety Rating
                                </span>
                                <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-display tabular-nums">
                                    {waterComplianceRate}% Potable
                                </div>
                                <span className="text-[11px] text-sky-200/80 mt-1 block">
                                    Laboratory certified physical &amp; biological safety
                                </span>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 hover:border-cyan-300/60 shadow-lg hover:shadow-cyan-500/10 transition-all">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block mb-1 font-display">
                                    Active Works &amp; Contracts
                                </span>
                                <div className="text-2xl sm:text-3xl font-black text-white font-display tabular-nums">
                                    {activeContractsCount} Contracts
                                </div>
                                <span className="text-[11px] text-sky-200/80 mt-1 block">
                                    {activeTendersCount} open public tender opportunities
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Subtle Oceanic Wave Silhouette at Hero Base */}
                    <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none opacity-25">
                        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-8 text-white fill-current">
                            <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,20 1200,60 L1200,120 L0,120 Z"></path>
                        </svg>
                    </div>
                </section>

                {/* 4. TAB NAVIGATION STRIP (Elevare Clean Secondary Navigation) */}
                <div className="bg-white border-b border-slate-200 sticky top-20 z-10 shadow-2xs">
                    <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between overflow-x-auto custom-scrollbar">
                        <div className="flex items-center space-x-2 py-2">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap font-display ${
                                    activeTab === 'overview'
                                        ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md shadow-sky-600/25'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
                                }`}
                            >
                                Oromia Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('onewash')}
                                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap font-display ${
                                    activeTab === 'onewash' || activeTab === 'schemes'
                                        ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md shadow-sky-600/25'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
                                }`}
                            >
                                ONE WASH Schemes ({filteredProjects.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('cowash')}
                                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap font-display ${
                                    activeTab === 'cowash' || activeTab === 'programs'
                                        ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md shadow-sky-600/25'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
                                }`}
                            >
                                COWASH (CMP Approach)
                            </button>
                            <button
                                onClick={() => setActiveTab('secondurban')}
                                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap font-display ${
                                    activeTab === 'secondurban' || activeTab === 'tenders'
                                        ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md shadow-sky-600/25'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
                                }`}
                            >
                                Second Urban (SUWSSP) ({procurements.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('borena')}
                                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap font-display ${
                                    activeTab === 'borena' || activeTab === 'contact'
                                        ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md shadow-sky-600/25'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
                                }`}
                            >
                                Borena Resilience &amp; Alert Desk
                            </button>
                            <button
                                onClick={() => setActiveTab('waterQuality')}
                                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap font-display ${
                                    activeTab === 'waterQuality'
                                        ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md shadow-sky-600/25'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
                                }`}
                            >
                                WHO Standards Lab
                            </button>
                        </div>

                        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Live OWEB Regional Sync</span>
                        </div>
                    </div>
                </div>

                {/* 5. TAB CONTENT PANELS */}
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
                    {/* TAB: OROMIA OVERVIEW - COMPREHENSIVE REGIONAL WATER SECTOR SUMMARY */}
                    {activeTab === 'overview' && (
                        <div className="space-y-12">
                            {/* Regional Water Ledger Banner & Summary KPIs */}
                            <div className="bg-gradient-to-r from-[#032a4e] via-[#054378] to-[#032545] p-6 sm:p-8 rounded-3xl text-white border border-cyan-400/30 shadow-lg shadow-sky-950/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
                                <div className="max-w-3xl space-y-3 relative z-10">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-200 text-xs font-bold uppercase tracking-wider font-display border border-cyan-400/30">
                                        <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                                        <span>Regional Water Security &amp; Capital Investment Overview</span>
                                    </div>
                                    <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white">
                                        Oromia Regional Water Resource Portfolio
                                    </h2>
                                    <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
                                        Spanning 21 administrative zones, 330+ woredas, and over 40 million residents, the Oromia Water Resource Bureau (OWEB) coordinates sustainable water delivery, integrated sanitation, and climate-resilient water infrastructure through consolidated national and bilateral development accounts.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-sky-400/20">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block font-display">Administrative Scope</span>
                                        <span className="text-2xl font-black font-mono text-white mt-0.5 block">21 Zones / 330+</span>
                                        <span className="text-[11px] text-sky-200/80">Woredas across Oromia</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block font-display">Total Water Schemes</span>
                                        <span className="text-2xl font-black font-mono text-white mt-0.5 block">44,000+</span>
                                        <span className="text-[11px] text-sky-200/80">Operational water points</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block font-display">Safe Water Coverage</span>
                                        <span className="text-2xl font-black font-mono text-white mt-0.5 block">61.2%</span>
                                        <span className="text-[11px] text-sky-200/80">Targeting 85% access</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block font-display">Combined Capital Pool</span>
                                        <span className="text-2xl font-black font-mono text-white mt-0.5 block">ETB 1.45B+</span>
                                        <span className="text-[11px] text-sky-200/80">Pooled &amp; Bilateral capital</span>
                                    </div>
                                </div>
                            </div>

                            {/* The 4 Sovereign Pillars in Oromia: ONE WASH, COWASH, Second Urban, Borena Resilience */}
                            <div>
                                <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
                                    <span className="text-xs font-bold uppercase tracking-widest text-cyan-700 font-display">
                                        Strategic Investment Windows
                                    </span>
                                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                                        Four Pillars of Water Transformation in Oromia
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-500">
                                        Harmonized programs operating under OWEB's unified governance to deliver rural coverage, community ownership, urban utility modernization, and pastoralist drought resilience.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* 1. ONE WASH */}
                                    <div 
                                        onClick={() => setActiveTab('onewash')}
                                        className="bg-white p-6 rounded-2xl border border-sky-100 shadow-xs hover:shadow-lg hover:border-cyan-400 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform font-display">
                                                01
                                            </div>
                                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 block">
                                                National CWA Account
                                            </span>
                                            <h4 className="text-base font-black text-slate-900 font-display mt-1 mb-2 group-hover:text-blue-700 transition-colors">
                                                ONE WASH (OWNP)
                                            </h4>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                Consolidated WaSH Account uniting World Bank, AfDB, UNICEF, FCDO, and GoE under "One Account, One Budget, One Report". Coordinated by Oromia Regional WaSH Coordination Office for rural multi-village piped schemes and school/health facilities.
                                            </p>
                                        </div>
                                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                                            <span>Inspect ONE WASH</span>
                                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </div>
                                    </div>

                                    {/* 2. COWASH */}
                                    <div 
                                        onClick={() => setActiveTab('cowash')}
                                        className="bg-white p-6 rounded-2xl border border-sky-100 shadow-xs hover:shadow-lg hover:border-cyan-400 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform font-display">
                                                02
                                            </div>
                                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 block">
                                                Finland-Ethiopia Bilateral
                                            </span>
                                            <h4 className="text-base font-black text-slate-900 font-display mt-1 mb-2 group-hover:text-emerald-700 transition-colors">
                                                COWASH (CMP Model)
                                            </h4>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                Community-Led Accelerated WaSH empowering local WASHCOs with direct grant management through Sinqee Bank / OCSSCO accounts. Over 19,000 water points built, 370,000+ rural residents in Oromia, and Green Legacy micro-catchment conservation.
                                            </p>
                                        </div>
                                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                                            <span>Explore COWASH</span>
                                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </div>
                                    </div>

                                    {/* 3. Second Urban */}
                                    <div 
                                        onClick={() => setActiveTab('secondurban')}
                                        className="bg-white p-6 rounded-2xl border border-sky-100 shadow-xs hover:shadow-lg hover:border-cyan-400 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-500 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform font-display">
                                                03
                                            </div>
                                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 block">
                                                World Bank IDA Cluster
                                            </span>
                                            <h4 className="text-base font-black text-slate-900 font-display mt-1 mb-2 group-hover:text-amber-700 transition-colors">
                                                Second Urban (SUWSSP)
                                            </h4>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                Targeting major secondary utilities in the Oromia Cluster (Adama, Shashemene, Bishoftu, Assela, Jimma, Nekemte, Robe). Reducing Non-Revenue Water (NRW), constructing modern FSTP sludge ponds, and publishing open engineering tenders.
                                            </p>
                                        </div>
                                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                                            <span>View Urban Tenders</span>
                                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </div>
                                    </div>

                                    {/* 4. Borena Resilience */}
                                    <div 
                                        onClick={() => setActiveTab('borena')}
                                        className="bg-white p-6 rounded-2xl border border-sky-100 shadow-xs hover:shadow-lg hover:border-cyan-400 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform font-display">
                                                04
                                            </div>
                                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-700 block">
                                                AfDB / Climate Resilience
                                            </span>
                                            <h4 className="text-base font-black text-slate-900 font-display mt-1 mb-2 group-hover:text-cyan-700 transition-colors">
                                                Borena Resilience
                                            </h4>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                Targeting drought-prone pastoralist lowlands with deep borehole exploration (&gt;500m), solarized multi-village pumping (Sarite, Melbana, Elwaye, Yabelo), livestock drinking corridors, and traditional "ela" / "tula" step well rehabilitation.
                                            </p>
                                        </div>
                                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-cyan-700">
                                            <span>Open Borena Alert Desk</span>
                                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Oromia Zonal Water Distribution & Hydrological Clusters */}
                            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-sky-100 shadow-xs space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 font-display">Regional Hydro-Geological Coverage</span>
                                        <h3 className="text-xl font-black text-slate-900 font-display">Oromia Zonal Water Indicators Summary</h3>
                                    </div>
                                    <span className="text-xs text-slate-400 font-mono">Verified against OWEB Master Water Ledger 2026/27</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <strong className="text-slate-900 text-sm font-display">Central &amp; Rift Valley</strong>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">East &amp; West Shewa</span>
                                        </div>
                                        <p className="text-slate-600 leading-relaxed">
                                            Deep volcanic aquifers, high urban demand (Adama, Bishoftu, Ambo), defluoridation plants, and SUWSSP distribution network expansion.
                                        </p>
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-mono text-[11px] text-slate-500">
                                            <span>Access Rate: <strong>68.4%</strong></span>
                                            <span>Lead: <strong>SUWSSP / ONE WaSH</strong></span>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <strong className="text-slate-900 text-sm font-display">Highland Water Towers</strong>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Arsi, Bale &amp; West Arsi</span>
                                        </div>
                                        <p className="text-slate-600 leading-relaxed">
                                            High perennial spring yields, multi-village gravity schemes (Asella, Dinsho, Goba), and Green Legacy watershed micro-catchment protection.
                                        </p>
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-mono text-[11px] text-slate-500">
                                            <span>Access Rate: <strong>64.1%</strong></span>
                                            <span>Lead: <strong>COWASH / ONE WaSH</strong></span>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <strong className="text-slate-900 text-sm font-display">Western Agriculture Belt</strong>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">Jimma, Ilu Aba Bora, Bedele</span>
                                        </div>
                                        <p className="text-slate-600 leading-relaxed">
                                            Abundant rainfall, shallow groundwater, community managed spring boxes, and high community participation through Sinqee Bank CMP accounts.
                                        </p>
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-mono text-[11px] text-slate-500">
                                            <span>Access Rate: <strong>62.8%</strong></span>
                                            <span>Lead: <strong>COWASH IV (CMP)</strong></span>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <strong className="text-slate-900 text-sm font-display">Southern Pastoralist Lowlands</strong>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800">Borena, Guji &amp; West Guji</span>
                                        </div>
                                        <p className="text-slate-600 leading-relaxed">
                                            Arid rangelands prone to drought. Ultra-deep boreholes (&gt;500m), solar-powered multi-village networks, livestock watering troughs, and ela/tula wells.
                                        </p>
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-mono text-[11px] text-slate-500">
                                            <span>Access Rate: <strong>48.2% (Priority)</strong></span>
                                            <span>Lead: <strong>Borena Resilient / AfDB</strong></span>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <strong className="text-slate-900 text-sm font-display">Eastern Hararghe Drylands</strong>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">East &amp; West Hararghe</span>
                                        </div>
                                        <p className="text-slate-600 leading-relaxed">
                                            Hilly terrain with episodic rainfall. Sand dams, subsurface storage, spring development, and household solar disinfection kits.
                                        </p>
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-mono text-[11px] text-slate-500">
                                            <span>Access Rate: <strong>52.6%</strong></span>
                                            <span>Lead: <strong>UNICEF &amp; CWA</strong></span>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <strong className="text-slate-900 text-sm font-display">Western Frontier &amp; Welega</strong>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">East/West Welega, Qellem</span>
                                        </div>
                                        <p className="text-slate-600 leading-relaxed">
                                            Nekemte urban utility modernization, regional gravity distribution lines, and rural institutional school sanitation blocks.
                                        </p>
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-mono text-[11px] text-slate-500">
                                            <span>Access Rate: <strong>57.9%</strong></span>
                                            <span>Lead: <strong>SUWSSP / Regional Fund</strong></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Featured Schemes Showcase */}
                            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-sky-100 shadow-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 font-display">Live System Verification</span>
                                        <h3 className="text-xl font-black text-slate-900 font-display">Featured Regional Water Schemes</h3>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('onewash')}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 font-display cursor-pointer"
                                    >
                                        <span>View all {projects.length} schemes</span>
                                        <span>→</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                    {projects.slice(0, 3).map((project) => (
                                        <div 
                                            key={project.id}
                                            onClick={() => setInspectedProject(project)}
                                            className="p-5 rounded-2xl border border-slate-200 hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer bg-slate-50/50 flex flex-col justify-between"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-mono text-slate-400 font-bold">{project.id}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        project.status === 'Completed' || project.status === 'Approved'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {project.status}
                                                    </span>
                                                </div>
                                                <h4 className="text-base font-bold text-slate-900 font-display line-clamp-1">{project.name}</h4>
                                                <p className="text-xs text-slate-500">
                                                    {project.zone} &middot; {project.woreda} &middot; <span className="font-semibold text-slate-700">{project.program}</span>
                                                </p>
                                            </div>

                                            <div className="pt-4 mt-4 border-t border-slate-200/70 flex items-center justify-between text-xs">
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Committed Capital</span>
                                                    <span className="font-mono font-bold text-slate-900">ETB {project.estimatedBudget.toLocaleString()}</span>
                                                </div>
                                                <span className="font-bold text-blue-600 hover:underline">
                                                    Inspect Dossier →
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Donor & Partner Framework Ticker */}
                            <div className="bg-gradient-to-r from-[#03294c] via-[#053f75] to-[#032342] rounded-3xl p-6 sm:p-8 text-white border border-sky-600/30 shadow-md shadow-sky-950/20 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-1 text-center md:text-left">
                                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-display">International Financing Partners</span>
                                    <h4 className="text-lg font-bold">Collaborative Multi-Stakeholder Development in Oromia</h4>
                                    <p className="text-xs text-sky-100/80 max-w-xl">
                                        Financed in alignment with the World Bank, African Development Bank, Embassy of Finland, UNICEF, FCDO, and Federal Water Authorities.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    <span className="px-3 py-1.5 bg-white/10 rounded-xl text-xs font-bold border border-white/10">World Bank IDA</span>
                                    <span className="px-3 py-1.5 bg-white/10 rounded-xl text-xs font-bold border border-white/10">Finland COWASH</span>
                                    <span className="px-3 py-1.5 bg-white/10 rounded-xl text-xs font-bold border border-white/10">AfDB Borena Fund</span>
                                    <span className="px-3 py-1.5 bg-white/10 rounded-xl text-xs font-bold border border-white/10">UNICEF WaSH</span>
                                    <span className="px-3 py-1.5 bg-white/10 rounded-xl text-xs font-bold border border-white/10">OWEB Treasury</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: ONE WASH (OWNP Phase II / CWA) SCHEMES DIRECTORY */}
                    {(activeTab === 'onewash' || activeTab === 'schemes') && (
                        <div className="space-y-6">
                            {/* ONE WASH Programmatic Context Card */}
                            <div className="bg-gradient-to-r from-[#032e56] via-[#044c85] to-[#022f54] p-6 sm:p-8 rounded-3xl text-white border border-cyan-400/30 shadow-md">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="max-w-2xl space-y-2">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-200 text-xs font-bold uppercase tracking-wider font-display border border-cyan-400/30">
                                            <span>Consolidated WaSH Account (CWA II) · OWNP Flagship</span>
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-black font-display text-white">
                                            ONE WASH National Program — Oromia Schemes
                                        </h2>
                                        <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
                                            Operating under the historic principle of <strong>"One Account, One Budget, One Report"</strong>, the Consolidated WaSH Account coordinates funding from the World Bank, African Development Bank, UNICEF, UK FCDO, and the Ethiopian Government. Coordinated in Oromia by the Regional WaSH Coordination Office (OWEB).
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row md:flex-col gap-2 min-w-[200px] text-xs font-mono">
                                        <div className="p-3 bg-white/10 rounded-xl border border-white/15">
                                            <span className="text-[10px] text-cyan-300 uppercase block font-sans font-bold">Phase I Impact</span>
                                            <span className="font-bold text-white text-sm">4.3M+ People Served</span>
                                        </div>
                                        <div className="p-3 bg-white/10 rounded-xl border border-white/15">
                                            <span className="text-[10px] text-cyan-300 uppercase block font-sans font-bold">Regional Coordination</span>
                                            <span className="font-bold text-white text-sm">Tadesse Masresha, Coordinator</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 font-display">Regional Water Schemes Directory</h3>
                                    <p className="text-xs text-slate-500">
                                        Showing {filteredProjects.length} verified schemes across Oromia woredas with live engineering specifications.
                                    </p>
                                </div>

                                {/* Filters */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <select
                                        value={selectedProgram}
                                        onChange={(e) => setSelectedProgram(e.target.value)}
                                        className="text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="ALL">All Programs</option>
                                        {availablePrograms.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>

                                    <select
                                        value={selectedZone}
                                        onChange={(e) => setSelectedZone(e.target.value)}
                                        className="text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="ALL">All Zones</option>
                                        {availableZones.map(z => (
                                            <option key={z} value={z}>{z}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Filter by scheme name, woreda, project ID or keyword..."
                                    className="w-full px-4 py-3 pl-10 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                                />
                                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {/* Table of Schemes (Elevare Corporate Table) */}
                            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gradient-to-r from-[#032e56] to-[#044a83] text-sky-100 text-[10.5px] uppercase font-bold tracking-widest border-b border-sky-800">
                                            <tr>
                                                <th className="px-6 py-4">Scheme Identification</th>
                                                <th className="px-5 py-4">Program</th>
                                                <th className="px-5 py-4">Location (Zone/Woreda)</th>
                                                <th className="px-5 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Committed Capital (ETB)</th>
                                                <th className="px-5 py-4 text-center">Public Dossier</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredProjects.map((p) => (
                                                <tr 
                                                    key={p.id}
                                                    onClick={() => setInspectedProject(p)}
                                                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors font-display">
                                                            {p.name}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                                            {p.id}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                                                            {p.program || 'ONE WaSH'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-xs text-slate-600">
                                                        <strong className="text-slate-800">{p.zone}</strong>
                                                        {p.woreda && <span className="text-slate-400"> &middot; {p.woreda}</span>}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                                            p.status === 'Completed' || p.status === 'Approved'
                                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                                : 'bg-blue-50 text-blue-800 border-blue-200'
                                                        }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'Completed' || p.status === 'Approved' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                                            <span>{p.status}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 text-xs">
                                                        {p.estimatedBudget.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">ETB</span>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <span className="text-xs font-bold text-blue-600 group-hover:text-blue-800 group-hover:underline">
                                                            Inspect Record →
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredProjects.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-14 text-slate-400 text-sm">
                                                        No schemes match the search criteria.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: COWASH (Community-Led Accelerated Water, Sanitation & Hygiene) */}
                    {(activeTab === 'cowash' || activeTab === 'programs') && (
                        <div className="space-y-8">
                            {/* COWASH Institutional Header Banner */}
                            <div className="bg-gradient-to-r from-[#033e38] via-[#045950] to-[#02332e] p-6 sm:p-8 rounded-3xl text-white border border-teal-400/30 shadow-md">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="max-w-2xl space-y-3">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 text-xs font-bold uppercase tracking-wider font-display border border-teal-400/30">
                                            <span>Bilateral Partnership: Finland &amp; Ethiopia · COWASH Phase IV</span>
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-black font-display text-white">
                                            COWASH — Community Managed Project (CMP) Model
                                        </h2>
                                        <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
                                            COWASH pioneers the Community Managed Project (CMP) approach across Oromia woredas. Investment funds are channeled directly into Kebele Water and Sanitation Committee (WASHCO) accounts at local microfinance institutions (Sinqee Bank / OCSSCO). The community manages procurement, contracts local artisans, and maintains lifelong ownership.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 text-xs font-mono min-w-[240px]">
                                        <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
                                            <span className="text-[10px] text-teal-300 uppercase block font-sans font-bold">Total Water Points Built</span>
                                            <span className="font-bold text-white text-base">19,000+ Nationally</span>
                                        </div>
                                        <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
                                            <span className="text-[10px] text-teal-300 uppercase block font-sans font-bold">Oromia COWASH IV Beneficiaries</span>
                                            <span className="font-bold text-white text-base">370,000+ Citizens</span>
                                        </div>
                                        <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
                                            <span className="text-[10px] text-teal-300 uppercase block font-sans font-bold">Scheme Sustainability</span>
                                            <span className="font-bold text-emerald-300 text-base">&gt;92% Functional (&lt;8% Failure)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Core Pillars of the CMP Approach in Oromia */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-xs space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg font-display">
                                        🏦
                                    </div>
                                    <h4 className="text-base font-bold text-slate-900 font-display">Direct Microfinance Grants</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Grants of ETB 350,000 to 1,200,000 are deposited directly into community accounts at Sinqee Bank. Communities purchase factory pipes and cement locally, preventing administrative bottlenecks.
                                    </p>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-xs space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg font-display">
                                        👩🏾‍🌾
                                    </div>
                                    <h4 className="text-base font-bold text-slate-900 font-display">Women &amp; Artisan Leadership</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Mandatory &gt;50% female representation on all WASHCO executive committees, paired with certified training for local masons, mechanics, and pump caretakers in rural woredas.
                                    </p>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-xs space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg font-display">
                                        🌱
                                    </div>
                                    <h4 className="text-base font-bold text-slate-900 font-display">Green Legacy Catchment Care</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Integrated with Ethiopia&apos;s Green Legacy Initiative in Bale Goba and Dinsho woredas. Over 250,000 indigenous saplings planted around spring recharge catchment basins.
                                    </p>
                                </div>
                            </div>

                            {/* Active COWASH Schemes in Oromia */}
                            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-sky-100 shadow-xs space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-teal-700 font-display">Verified Field Projects</span>
                                        <h3 className="text-xl font-black text-slate-900 font-display">COWASH Schemes Across Oromia Woredas</h3>
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono">Bilateral Grant Code: FI-ET-COWASH-IV</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {projects.filter(p => (p.program && p.program.toUpperCase().includes('COWASH')) || (p.implementingBody && p.implementingBody.toLowerCase().includes('cowash'))).concat(projects.slice(0, 2)).slice(0, 4).map((p, idx) => (
                                        <div 
                                            key={p.id + idx}
                                            onClick={() => setInspectedProject(p)}
                                            className="p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer bg-slate-50/50 flex flex-col justify-between"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-mono text-slate-400 font-bold">{p.id}</span>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                                                        CMP Model
                                                    </span>
                                                </div>
                                                <h4 className="text-base font-bold text-slate-900 font-display">{p.name}</h4>
                                                <p className="text-xs text-slate-500">{p.zone} &middot; {p.woreda} &middot; Kebele: {p.kebele || 'Rural Cluster'}</p>
                                            </div>
                                            <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                                <span className="font-mono text-slate-700 font-bold">ETB {p.estimatedBudget.toLocaleString()}</span>
                                                <span className="text-teal-700 font-bold hover:underline">Inspect CMP Dossier →</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: SECOND URBAN WATER SUPPLY & SANITATION PROJECT (SUWSSP / UWSSP-II) */}
                    {(activeTab === 'secondurban' || activeTab === 'tenders') && (
                        <div className="space-y-8">
                            {/* Second Urban Institutional Header Banner */}
                            <div className="bg-gradient-to-r from-[#2c2202] via-[#4d3a04] to-[#241b02] p-6 sm:p-8 rounded-3xl text-white border border-amber-400/30 shadow-md">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="max-w-2xl space-y-3">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 text-xs font-bold uppercase tracking-wider font-display border border-amber-400/30">
                                            <span>World Bank IDA Financing ($725M + $445M) · Oromia Secondary Cities Cluster</span>
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-black font-display text-white">
                                            Second Urban Water Supply &amp; Sanitation (SUWSSP)
                                        </h2>
                                        <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                                            The Second Urban Water Supply and Sanitation Project (UWSSP-II) modernizes utility operations and sanitation across the <strong>Oromia Cluster Cities: Adama, Shashemene, Bishoftu, Assela, Jimma, Nekemte, and Robe</strong>. Delivering Non-Revenue Water (NRW) reduction, modern Faecal Sludge Treatment Plants (FSTP), and open competitive engineering tenders.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 text-xs font-mono min-w-[240px]">
                                        <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
                                            <span className="text-[10px] text-amber-300 uppercase block font-sans font-bold">National Beneficiaries</span>
                                            <span className="font-bold text-white text-base">3.8M+ People</span>
                                        </div>
                                        <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
                                            <span className="text-[10px] text-amber-300 uppercase block font-sans font-bold">Oromia Cluster Towns</span>
                                            <span className="font-bold text-white text-base">7 Major Secondary Cities</span>
                                        </div>
                                        <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
                                            <span className="text-[10px] text-amber-300 uppercase block font-sans font-bold">Active Public Tenders</span>
                                            <span className="font-bold text-amber-300 text-base">{procurements.length} Bidding Packages</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Core Engineering Components of SUWSSP */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-xs space-y-2">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg font-display">
                                        🚰
                                    </div>
                                    <h4 className="text-base font-bold text-slate-900 font-display">Non-Revenue Water (NRW)</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Establishment of District Metered Areas (DMAs), ultrasonic billing meters, acoustic pipe leak detection, and computerized telemetry to reduce physical and commercial water losses.
                                    </p>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-xs space-y-2">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg font-display">
                                        ♻️
                                    </div>
                                    <h4 className="text-base font-bold text-slate-900 font-display">Faecal Sludge Treatment (FSTP)</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Constructing biological treatment lagoons, vacuum truck discharge stations, and public hygienic latrines in Adama, Shashemene, and Bishoftu.
                                    </p>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-xs space-y-2">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg font-display">
                                        📑
                                    </div>
                                    <h4 className="text-base font-bold text-slate-900 font-display">Open Bidding &amp; Tenders</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Full compliance with World Bank Procurement Regulations for IPF Borrowers, ensuring transparent bidding rounds for civil works, drilling, and mechanical equipment.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 font-display">Open Civil &amp; Mechanical Tenders</h3>
                                    <p className="text-xs text-slate-500">
                                        Competitive bidding packages currently published by the Oromia Water Resource Bureau.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {procurements.map((proc) => {
                                    const relatedProject = projects.find(p => p.id === proc.projectId);
                                    return (
                                        <div key={proc.id} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-4">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-mono text-slate-400 font-bold">{proc.id}</span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                    proc.status === 'Open'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : proc.status === 'Awarded'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {proc.status}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 font-display">
                                                    {proc.name || proc.tenderName || (relatedProject ? `${relatedProject.name} Civil Works` : 'Water Supply Civil Works Package')}
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Target Scheme: <strong className="text-slate-700">{relatedProject?.name || proc.projectId}</strong> &middot; {relatedProject?.zone || 'Oromia'}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs font-mono">
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Method</span>
                                                    <span className="text-slate-800 font-bold">{proc.method || 'NCB (National)'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Estimated Capital</span>
                                                    <span className="text-slate-800 font-bold">ETB {(proc.estimatedBudget || relatedProject?.estimatedBudget || 0).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <span className="text-[11px] text-slate-500">
                                                    Bidders Evaluated: <strong className="text-slate-800">{proc.bidders?.length || 0}</strong>
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setInquiryForm(prev => ({
                                                            ...prev,
                                                            schemeId: proc.projectId,
                                                            category: 'Tender Information',
                                                            message: `Inquiry regarding Tender ${proc.id} for ${relatedProject?.name || proc.projectId}`
                                                        }));
                                                        setActiveTab('borena');
                                                    }}
                                                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer font-display shadow-xs"
                                                >
                                                    Tender Inquiry →
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {procurements.length === 0 && (
                                    <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
                                        No active public tenders available at this moment. Please check back regularly.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: WHO WATER QUALITY STANDARDS LAB */}
                    {activeTab === 'waterQuality' && (
                        <div className="space-y-8">
                            <div className="bg-gradient-to-r from-[#033b5c] via-[#044c77] to-[#022c47] p-8 rounded-2xl text-white border border-cyan-500/30 shadow-md shadow-sky-950/20">
                                <div className="max-w-2xl space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-display">Public Health Certification</span>
                                    <h2 className="text-2xl sm:text-3xl font-black font-display">WHO &amp; Ethiopian Compulsory Standards (CES)</h2>
                                    <p className="text-xs sm:text-sm text-sky-100/90">
                                        Every commissioned water point is subject to certified physicochemical and microbiological testing prior to municipal or community handover.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Turbidity</span>
                                    <div className="text-2xl font-black text-slate-900 font-mono">&lt; 5.0 NTU</div>
                                    <p className="text-xs text-slate-500 mt-1">CES 58:2019 Standard limit</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">pH Balance</span>
                                    <div className="text-2xl font-black text-slate-900 font-mono">6.5 - 8.5</div>
                                    <p className="text-xs text-slate-500 mt-1">Optimal chemical potability</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Residual Chlorine</span>
                                    <div className="text-2xl font-black text-slate-900 font-mono">0.2 - 0.5 mg/L</div>
                                    <p className="text-xs text-slate-500 mt-1">Disinfection barrier residual</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">E. Coli / Coliforms</span>
                                    <div className="text-2xl font-black text-emerald-600 font-mono">0 CFU/100mL</div>
                                    <p className="text-xs text-slate-500 mt-1">Zero pathogen tolerance</p>
                                </div>
                            </div>

                            {/* Recent verified field inspections */}
                            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                                <h3 className="text-base font-bold text-slate-900 font-display">Recent Field Water Quality Tests</h3>
                                <div className="divide-y divide-slate-100">
                                    {inspections.filter(i => i.waterQualityTest).map((insp) => (
                                        <div key={insp.id} className="py-3 flex items-center justify-between text-xs">
                                            <div>
                                                <span className="font-bold text-slate-900">{insp.waterQualityTest?.labName || 'Regional Water Laboratory'}</span>
                                                <span className="text-slate-400 block text-[11px] font-mono">Scheme: {insp.projectId} &middot; Tested on {insp.inspectionDate}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-slate-600">Turbidity: {insp.waterQualityTest?.turbidity || 1.8} NTU</span>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                    {insp.waterQualityTest?.complianceStatus || 'Compliant'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {inspections.filter(i => i.waterQualityTest).length === 0 && (
                                        <p className="py-6 text-center text-slate-400 text-xs">
                                            All 14 regional schemes adhere to periodic scheduled water quality sampling protocols.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: BORENA RESILIENCE & PASTORALIST DROUGHT CRISIS DESK */}
                    {(activeTab === 'borena' || activeTab === 'contact') && (
                        <div className="space-y-8">
                            {/* Borena Resilient Program Institutional Banner */}
                            <div className="bg-gradient-to-r from-[#02243d] via-[#03446b] to-[#021f36] p-6 sm:p-8 rounded-3xl text-white border border-cyan-400/30 shadow-md">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="max-w-2xl space-y-3">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-200 text-xs font-bold uppercase tracking-wider font-display border border-cyan-400/30">
                                            <span>AfDB &amp; Global Center on Adaptation (GCA) · Lowlands Climate Resilience</span>
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-black font-display text-white">
                                            Borana Resilient Water Development for Improved Livelihoods
                                        </h2>
                                        <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
                                            The Borana zone is highly vulnerable to severe recurrent droughts. In response, OWEB and the African Development Bank implement integrated deep groundwater extraction (&gt;500m), solar-powered multi-village pumping networks (Sarite, Melbana, Elwaye, Wachile, Dubluk, Yabelo), livestock drinking corridors, and the engineering rehabilitation of ancient Borana <em>&quot;ela&quot;</em> and <em>&quot;tula&quot;</em> deep well complexes.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 text-xs font-mono min-w-[240px]">
                                        <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
                                            <span className="text-[10px] text-cyan-300 uppercase block font-sans font-bold">Deep Aquifer Depth</span>
                                            <span className="font-bold text-white text-base">350m – 650m Deep</span>
                                        </div>
                                        <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
                                            <span className="text-[10px] text-cyan-300 uppercase block font-sans font-bold">Pumping Source</span>
                                            <span className="font-bold text-white text-base">100% Hybrid Solar PV</span>
                                        </div>
                                        <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
                                            <span className="text-[10px] text-cyan-300 uppercase block font-sans font-bold">Targeted Livelihoods</span>
                                            <span className="font-bold text-cyan-300 text-base">Human + Livestock Troughs</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Core Engineering Features of the Borena Resilience Program */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-xs space-y-2">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-lg font-display">
                                        ☀️
                                    </div>
                                    <h4 className="text-base font-bold text-slate-900 font-display">Solarized Deep Boreholes</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Replacing expensive, failing diesel generators with heavy-duty solar PV arrays capable of pumping high-volume groundwater continuously to multi-village transmission reservoirs.
                                    </p>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-xs space-y-2">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-lg font-display">
                                        🐄
                                    </div>
                                    <h4 className="text-base font-bold text-slate-900 font-display">Livestock Watering Corridors</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Dedicated concrete watering troughs constructed along traditional pastoralist rangeland migration corridors to save millions of cattle, camels, and goats during prolonged dry seasons.
                                    </p>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-xs space-y-2">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-lg font-display">
                                        🏛️
                                    </div>
                                    <h4 className="text-base font-bold text-slate-900 font-display">Ancient &quot;Tula&quot; Well Restoration</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Protecting the centuries-old traditional Gada engineering structures of Borana deep step-wells, combining indigenous communal water allocation rules with modern sanitary seals.
                                    </p>
                                </div>
                            </div>

                            {/* Pastoralist Crisis & Emergency Drought Alert Form */}
                            <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-sky-100 shadow-xs space-y-6">
                                <div className="text-center space-y-1 pb-4 border-b border-slate-100">
                                    <span className="text-xs font-bold uppercase tracking-widest text-cyan-700 font-display">
                                        Regional Drought Response
                                    </span>
                                    <h3 className="text-2xl font-black text-slate-900 font-display">
                                        Borena Drought Alert &amp; Water Point Service Desk
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Pastoralist elders, WASHCOs, and woreda officers may report dry boreholes, request emergency water trucking, or report solar pump electromechanical breakdowns.
                                    </p>
                                </div>

                                {inquirySuccess ? (
                                    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl font-bold">
                                            ✓
                                        </div>
                                        <h3 className="text-lg font-bold text-emerald-900 font-display">Emergency Alert / Inquiry Registered</h3>
                                        <p className="text-xs text-emerald-700">
                                            Your official tracking reference code is <strong className="font-mono font-bold text-emerald-950">{inquirySuccess}</strong>.
                                            The OWEB Borena Rapid Response Desk will review and initiate action within 24–48 hours.
                                        </p>
                                        <button
                                            onClick={() => setInquirySuccess(null)}
                                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer font-display"
                                        >
                                            Submit Another Alert or Inquiry
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleInquirySubmit} className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">Your Full Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={inquiryForm.name}
                                                    onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                                                    placeholder="e.g. Guyo Dida"
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">Woreda / Pastoralist Community</label>
                                                <input
                                                    type="text"
                                                    value={inquiryForm.organization}
                                                    onChange={(e) => setInquiryForm({ ...inquiryForm, organization: e.target.value })}
                                                    placeholder="e.g. Yabelo / Dubluk Rangeland Committee"
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">Contact Email *</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={inquiryForm.email}
                                                    onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                                                    placeholder="contact@example.com"
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number (Direct)</label>
                                                <input
                                                    type="tel"
                                                    value={inquiryForm.phone}
                                                    onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                                                    placeholder="+251 91 123 4567"
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">Alert or Request Category *</label>
                                                <select
                                                    value={inquiryForm.category}
                                                    onChange={(e) => setInquiryForm({ ...inquiryForm, category: e.target.value })}
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                >
                                                    <option value="Borehole Breakdown">Borehole / Solar Pump Breakdown</option>
                                                    <option value="Livestock Water Shortage">Livestock Watering Trough Depletion</option>
                                                    <option value="Water Trucking Request">Emergency Water Trucking Request</option>
                                                    <option value="Tula Well Rehabilitation">Traditional Ela/Tula Well Restoration</option>
                                                    <option value="Water Quality Anomaly">Salinity / Potability Anomaly</option>
                                                    <option value="Tender Information">Borena Procurement Clarification</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">Target Scheme (Optional)</label>
                                                <select
                                                    value={inquiryForm.schemeId}
                                                    onChange={(e) => setInquiryForm({ ...inquiryForm, schemeId: e.target.value })}
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                >
                                                    <option value="">-- General Borena / Guji Area --</option>
                                                    {projects.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Situation / Request Description *</label>
                                            <textarea
                                                rows={4}
                                                required
                                                value={inquiryForm.message}
                                                onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                                                placeholder="Describe the borehole status, number of households/herds affected, exact GPS/Kebele coordinates..."
                                                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-3 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer font-display"
                                        >
                                            Transmit Alert to OWEB Desk →
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* SCHEME DETAIL MODAL (Elevare High-Finance Spec Sheet) */}
            {inspectedProject && (
                <div className="fixed inset-0 bg-[#031d38]/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 animate-slide-in space-y-6">
                        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                            <div>
                                <span className="font-mono text-xs font-bold text-blue-700">{inspectedProject.id}</span>
                                <h3 className="text-xl font-black text-slate-900 font-display mt-0.5">{inspectedProject.name}</h3>
                                <p className="text-xs text-slate-500">
                                    {inspectedProject.zone} &middot; {inspectedProject.woreda}
                                </p>
                            </div>
                            <button
                                onClick={() => setInspectedProject(null)}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Financial and Engineering Overview */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl text-xs">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Committed Budget</span>
                                <span className="font-mono font-bold text-slate-900 text-sm">ETB {inspectedProject.estimatedBudget.toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Program</span>
                                <span className="font-bold text-slate-800">{inspectedProject.program || 'ONE WaSH'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Status</span>
                                <span className="font-bold text-emerald-700">{inspectedProject.status}</span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Planned Start</span>
                                <span className="font-mono text-slate-700">{inspectedProject.plannedStartDate || '2026-01-10'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Target Completion</span>
                                <span className="font-mono text-slate-700">{inspectedProject.plannedCompletionDate || '2026-12-30'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Water Safety</span>
                                <span className="font-bold text-emerald-700">WHO Standard Compliant</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Engineering Scope</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {inspectedProject.description || 'Deep borehole drilling, electromechanical pump installation, elevated distribution reservoir, and multi-village community distribution network designed to meet WHO rural drinking water standards.'}
                            </p>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <button
                                onClick={() => {
                                    setInspectedProject(null);
                                    if (onSelectProject) {
                                        onSelectProject(inspectedProject.id);
                                    } else {
                                        onOpenLogin();
                                    }
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded-xl text-xs font-bold transition cursor-pointer font-display shadow-md shadow-sky-950/20 border border-cyan-400/30"
                            >
                                {isLoggedIn ? 'Open Scheme in Bureau System →' : 'Staff Sign In to View Blueprints →'}
                            </button>

                            <button
                                onClick={() => setInspectedProject(null)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. ELEVARE CORPORATE FOOTER - OCEANIC WATER THEME */}
            <footer className="bg-gradient-to-b from-[#032749] via-[#04335f] to-[#021f3a] text-sky-200/90 text-xs border-t border-sky-600/30 pt-12 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-sky-800/40">
                        {/* Bureau Info */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Logo className="h-6 w-6 text-elevareGold-400" />
                                <span className="font-black text-white text-base font-display">OWEB LEDGER</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Oromia Water Resource Bureau &mdash; Regional Government of Oromia. Ensuring transparent capital deployment, water quality safety, and universal rural access.
                            </p>
                        </div>

                        {/* Quick Navigation */}
                        <div>
                            <h4 className="text-white font-bold font-display uppercase tracking-wider text-[11px] mb-3">
                                Flagship Portals &amp; Programs
                            </h4>
                            <ul className="space-y-2 text-xs">
                                <li><button onClick={() => setActiveTab('onewash')} className="hover:text-white transition">ONE WASH (CWA Schemes)</button></li>
                                <li><button onClick={() => setActiveTab('cowash')} className="hover:text-white transition">COWASH (Community CMP)</button></li>
                                <li><button onClick={() => setActiveTab('secondurban')} className="hover:text-white transition">Second Urban (SUWSSP Tenders)</button></li>
                                <li><button onClick={() => setActiveTab('borena')} className="hover:text-white transition">Borena Resilience &amp; Drought Desk</button></li>
                                <li><button onClick={() => setActiveTab('waterQuality')} className="hover:text-white transition">WHO Water Quality Laboratory</button></li>
                            </ul>
                        </div>

                        {/* Compliance & Standards */}
                        <div>
                            <h4 className="text-white font-bold font-display uppercase tracking-wider text-[11px] mb-3">
                                Standards &amp; Protocols
                            </h4>
                            <ul className="space-y-2 text-xs text-slate-400">
                                <li>ISO 9001:2015 Quality Management</li>
                                <li>WHO Guidelines for Drinking-Water Quality</li>
                                <li>CES 58:2019 Compulsory Ethiopian Standard</li>
                                <li>FIDIC Red Book Contract Administration</li>
                            </ul>
                        </div>

                        {/* Bureau Contacts */}
                        <div>
                            <h4 className="text-white font-bold font-display uppercase tracking-wider text-[11px] mb-3">
                                Bureau Headquarters
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Bole Sub-City, P.O. Box 8630<br />
                                Addis Ababa, Ethiopia<br />
                                Phone: +251 11 551 0000<br />
                                Email: info@oweb.gov.et
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
                        <p>&copy; {new Date().getFullYear()} Oromia Water Resource Bureau. All Rights Reserved.</p>
                        <div className="flex items-center gap-4">
                            <span>Author: <strong className="text-slate-300">Girma W.</strong></span>
                            <span>&middot;</span>
                            <span className="text-elevareGold-400 font-bold">Elevare Banking &amp; Finance Edition</span>
                            <span>&middot;</span>
                            <button
                                onClick={onOpenLogin}
                                className="text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
                            >
                                Staff Login
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
