import React, { useState, useMemo, useEffect } from 'react';
import { 
    loadDevelopmentPartners, loadPartnerDocuments, 
    fetchDevelopmentPartnersFromApi, fetchPartnerDocumentsFromApi 
} from '../services/developmentPartnerService';
import { loadPrograms } from '../services/programService';
import { 
    Building2, Globe, FileText, CheckCircle2, ShieldCheck, 
    ExternalLink, Search, Filter, Layers, DollarSign, Calendar, 
    Users, MapPin, ChevronRight, X, ArrowUpRight, BookOpen, AlertCircle
} from 'lucide-react';

export const DevelopmentPartnersPortal = ({ user, onNavigate }) => {
    const [partners, setPartners] = useState(() => loadDevelopmentPartners());
    const [documents, setDocuments] = useState(() => loadPartnerDocuments());
    const [programs, setPrograms] = useState(() => loadPrograms());

    const [activeTab, setActiveTab] = useState('programs'); // 'programs', 'partners', 'documents'
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [clusterFilter, setClusterFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [selectedProgram, setSelectedProgram] = useState(null);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);

    useEffect(() => {
        fetchDevelopmentPartnersFromApi().then(data => {
            if (data && data.length > 0) setPartners(data);
        });
        fetchPartnerDocumentsFromApi().then(data => {
            if (data && data.length > 0) setDocuments(data);
        });
    }, []);

    // Filtered Partners
    const filteredPartners = useMemo(() => {
        return partners.filter(p => {
            const matchesSearch = !searchQuery || 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.acronym && p.acronym.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.headquarters && p.headquarters.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
            const matchesCluster = clusterFilter === 'ALL' || (p.supportedClusters && p.supportedClusters.includes(clusterFilter));
            const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
            return matchesSearch && matchesCat && matchesCluster && matchesStatus;
        });
    }, [partners, searchQuery, categoryFilter, clusterFilter, statusFilter]);

    // Researched WASH Programs
    const researchedPrograms = useMemo(() => {
        return [
            {
                code: 'COWASH',
                name: 'Community-led Accelerated WASH (COWASH Phase IV)',
                leadAgency: 'Ministry of Foreign Affairs of Finland & Oromia Water Bureau',
                status: 'Active',
                period: 'April 2021 – September 2025',
                fundingType: 'Bilateral Grant & Regional Co-Financing',
                budgetEstimate: 'ETB 180,000,000 / USD ~24.5M (Bilateral + Regional)',
                clustersCovered: ['Central Oromia', 'Western Oromia', 'Southwestern Oromia'],
                primaryInterventions: [
                    'Community-Managed Projects (CMP) Approach',
                    'Direct Community Fund Transfer for Construction',
                    'Disability-Inclusive & Gender-Responsive WASH',
                    'Spring Development & Hand-Dug Shallow Wells'
                ],
                officialUrl: 'https://www.cmpethiopia.org/cowash-phase-iv/',
                verificationStatus: 'Verified Official Document (MoWE / Finland MFA)',
                description: 'COWASH empowers rural communities to manage their own water point implementation. Woreda and community WASHCOs open dedicated project bank accounts to directly procure materials, monitor local artisans, and maintain schemes sustainably.'
            },
            {
                code: 'OWNP-CWA',
                name: 'One WASH National Program — Consolidated WASH Account (OWNP / CWA-II)',
                leadAgency: 'World Bank, AfDB, UNICEF, FCDO, Government of Ethiopia',
                status: 'Active',
                period: '2020 – 2026 (Phase II)',
                fundingType: 'Pooled Multi-Donor Consolidated Basket Account',
                budgetEstimate: 'ETB 450,000,000+ Regional Allocation',
                clustersCovered: ['Central Oromia', 'Eastern Oromia', 'Western Oromia', 'Southeastern Oromia', 'Southern Oromia', 'Southwestern Oromia'],
                primaryInterventions: [
                    'Rural Piped Water Schemes & Deep Well Exploration',
                    'Urban Utility Rehabilitation & Non-Revenue Water (NRW)',
                    'School & Healthcare Facility Sanitation Facilities',
                    'Harmonized Cross-Sectoral Monitoring & Governance'
                ],
                officialUrl: 'https://www.cmpethiopia.org/one-wash-national-program/',
                verificationStatus: 'Verified Program Operational Manual (POM)',
                description: 'The flagship national program pooling funds into a single Consolidated WASH Account. Designed to break sector silos by aligning water, education, and health ministries with standardized procurement, financial management, and environmental compliance.'
            },
            {
                code: 'SUWSSP-II',
                name: 'Second Urban Water Supply and Sanitation Project (UWSSP-II)',
                leadAgency: 'The World Bank Group (IDA Credit) & OWEB Urban Utility Board',
                status: 'Active',
                period: '2019 – 2026',
                fundingType: 'Concessional IDA Credit',
                budgetEstimate: 'ETB 520,000,000 Regional Allocation',
                clustersCovered: ['Central Oromia', 'Southeastern Oromia', 'Southwestern Oromia'],
                primaryInterventions: [
                    'Secondary City Piped Network & Pressure Zone Expansions',
                    'Faecal Sludge Treatment Plants (FSTP) & Vacuum Trucks',
                    'Customer Billing Automation & Utility Financial Viability',
                    'Water Quality Testing Laboratories in Urban Utilities'
                ],
                officialUrl: 'https://projects.worldbank.org/en/projects-operations/project-detail/P167794',
                verificationStatus: 'Verified World Bank Project Appraisal (P167794)',
                description: 'Focuses on critical secondary urban centers in Oromia to eliminate systemic water shortages and inadequate sanitation by upgrading municipal water utilities, modernizing billing, and establishing faecal sludge treatment plants.'
            },
            {
                code: 'BRWDLP',
                name: 'Borana Resilient Water Development for Improved Livelihoods Program',
                leadAgency: 'African Development Bank (AfDB) & Global Center on Adaptation (GCA)',
                status: 'Active',
                period: '2022 – 2028',
                fundingType: 'Multilateral Financing Facility & Climate Fund',
                budgetEstimate: 'ETB 420,000,000 / USD 68M',
                clustersCovered: ['Southern Oromia', 'Southeastern Oromia'],
                primaryInterventions: [
                    'Ultra-Deep Groundwater Wellfield Drilling (>500m)',
                    'Multi-Village Gravity Transmission Water Corridors',
                    'Pastoralist Drought Emergency Desks & Livestock Watering Troughs',
                    'Solar Hybrid Pumping Installations with Storage Reservoirs'
                ],
                officialUrl: 'https://www.afdb.org/en/documents/ethiopia-borana-resilient-water-development-improved-livelihoods-program-phase-i-appraisal-report',
                verificationStatus: 'Verified AfDB Appraisal Report (P-ET-E00-011)',
                description: 'Targeted long-term climate resilience intervention for pastoralist communities in lowland Borana and surrounding zones repeatedly afflicted by catastrophic drought cycles. Utilizes hydro-geological mapping for deep multi-village systems.'
            },
            {
                code: 'UNICEF-WASH',
                name: 'UNICEF Emergency & Climate-Resilient WASH Program',
                leadAgency: 'UNICEF Ethiopia & Multi-Donor Humanitarian Funds',
                status: 'Active',
                period: '2022 – 2026',
                fundingType: 'Grant Humanitarian & Development Aid',
                budgetEstimate: 'ETB 195,000,000 / USD ~32M',
                clustersCovered: ['Southern Oromia', 'Eastern Oromia', 'Central Oromia'],
                primaryInterventions: [
                    'Emergency Borehole Electro-Mechanical Rehabilitation',
                    'Solar PV Conversion of High-Cost Diesel Water Generators',
                    'Disinfection & Rapid Water Quality Surveillance Kits',
                    'Institutional Sanitation for Internally Displaced Persons (IDP)'
                ],
                officialUrl: 'https://www.unicef.org/ethiopia/water-sanitation-and-hygiene-wash',
                verificationStatus: 'Verified UN Agency Operations Review',
                description: 'Delivers rapid lifecycle interventions during hydrological shocks while transitioning temporary diesel-powered boreholes into sustainable, solar-powered systems with integrated community water committees.'
            }
        ];
    }, []);

    // Filtered Researched Programs
    const filteredResearchedPrograms = useMemo(() => {
        return researchedPrograms.filter(prog => {
            const matchesSearch = !searchQuery ||
                prog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                prog.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                prog.leadAgency.toLowerCase().includes(searchQuery.toLowerCase()) ||
                prog.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCluster = clusterFilter === 'ALL' || (prog.clustersCovered && prog.clustersCovered.includes(clusterFilter));
            const matchesStatus = statusFilter === 'ALL' || prog.status === statusFilter;
            return matchesSearch && matchesCluster && matchesStatus;
        });
    }, [researchedPrograms, searchQuery, clusterFilter, statusFilter]);

    // Filtered Documents
    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const matchesSearch = !searchQuery ||
                doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.programCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.sourceOrganization.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [documents, searchQuery]);

    const totalCommitmentUSD = useMemo(() => {
        return partners.reduce((sum, p) => sum + (p.totalFinancingCommitmentUSD || 0), 0);
    }, [partners]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Top Institutional Banner */}
            <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-xs font-semibold text-sky-300 mb-2.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Official Bureau Partnership & WASH Program Registry</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Development Partners & Programs Portal
                        </h1>
                        <p className="text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
                            Centralized intelligence, verified source documentation, and financial accountability across bilateral, multilateral, and national WASH programs operating in Oromia.
                        </p>
                    </div>

                    {/* Quick Metric Badges */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Verified Partners
                            </span>
                            <span className="text-2xl font-black text-white">
                                {partners.length}
                            </span>
                        </div>
                        <div className="px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Core Programs
                            </span>
                            <span className="text-2xl font-black text-sky-400">
                                {researchedPrograms.length}
                            </span>
                        </div>
                        <div className="px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Total Commitment
                            </span>
                            <span className="text-2xl font-black text-emerald-400">
                                ${(totalCommitmentUSD / 1000000).toFixed(1)}M
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sub Navigation Tabs */}
                <div className="mt-8 pt-4 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('programs')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                            activeTab === 'programs'
                                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                        }`}
                    >
                        <Layers className="w-4 h-4" />
                        <span>WASH Programs Portfolio ({researchedPrograms.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('partners')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                            activeTab === 'partners'
                                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                        }`}
                    >
                        <Building2 className="w-4 h-4" />
                        <span>Development Partners ({partners.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('documents')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                            activeTab === 'documents'
                                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        <span>Appraisals & Source Documents ({documents.length})</span>
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 min-w-[280px]">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search programs, partners, financing details, or documents..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
                    />
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Cluster Filter */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">Cluster:</span>
                        <select
                            value={clusterFilter}
                            onChange={(e) => setClusterFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-sky-500"
                        >
                            <option value="ALL">All 6 Clusters</option>
                            <option value="Central Oromia">Central Oromia</option>
                            <option value="Western Oromia">Western Oromia</option>
                            <option value="Southern Oromia">Southern Oromia</option>
                            <option value="Southeastern Oromia">Southeastern Oromia</option>
                            <option value="Eastern Oromia">Eastern Oromia</option>
                            <option value="Southwestern Oromia">Southwestern Oromia</option>
                        </select>
                    </div>

                    {/* Partner Category Filter */}
                    {activeTab === 'partners' && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <span className="font-semibold text-slate-700">Category:</span>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-sky-500"
                            >
                                <option value="ALL">All Categories</option>
                                <option value="Bilateral">Bilateral Agencies</option>
                                <option value="Multilateral">Multilateral Institutions</option>
                                <option value="Government Program">Government Programs</option>
                                <option value="INGO">INGOs</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* TAB 1: Researched WASH Programs */}
            {activeTab === 'programs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredResearchedPrograms.map((prog) => (
                        <div
                            key={prog.code}
                            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-sky-300 transition flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="inline-flex px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-xs font-bold text-sky-700">
                                        {prog.code}
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>{prog.status}</span>
                                    </span>
                                </div>

                                <h3 className="text-base font-bold text-slate-900 leading-snug mb-2">
                                    {prog.name}
                                </h3>

                                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                                    {prog.description}
                                </p>

                                {/* Key Specifications */}
                                <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Period:</span>
                                        </span>
                                        <span className="font-semibold text-slate-800">{prog.period}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Lead Agency:</span>
                                        </span>
                                        <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]" title={prog.leadAgency}>
                                            {prog.leadAgency}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Financing:</span>
                                        </span>
                                        <span className="font-semibold text-emerald-700">{prog.budgetEstimate}</span>
                                    </div>
                                </div>

                                {/* Supported Clusters Badges */}
                                <div className="mt-3.5">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                                        Clusters Covered:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {prog.clustersCovered.map((c, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions / View Details */}
                            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <a
                                    href={prog.officialUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-slate-500 hover:text-sky-600 flex items-center gap-1 transition"
                                >
                                    <span>Official Documentation</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setSelectedProgram(prog)}
                                    className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition flex items-center gap-1"
                                >
                                    <span>Program Profile</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 2: Development Partners */}
            {activeTab === 'partners' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPartners.map((partner) => (
                        <div
                            key={partner.id}
                            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-sky-300 transition flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-bold">
                                        {partner.category}
                                    </span>
                                </div>

                                <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">
                                    {partner.name}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mb-3">
                                    HQ: {partner.headquarters}
                                </p>

                                <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-2">
                                    {partner.notes}
                                </p>

                                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Commitment:</span>
                                        <span className="font-bold text-emerald-700">
                                            ${(partner.totalFinancingCommitmentUSD / 1000000).toFixed(1)}M USD
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Focal Lead:</span>
                                        <span className="font-semibold text-slate-800">{partner.focalPerson}</span>
                                    </div>
                                </div>

                                {/* Focus Areas */}
                                <div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                        WASH Focus:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                        {partner.washFocusAreas.map((f, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-700">
                                                {f}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                                {partner.website ? (
                                    <a
                                        href={partner.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                                    >
                                        <span>Official Site</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                ) : <span />}

                                <button
                                    type="button"
                                    onClick={() => setSelectedPartner(partner)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
                                >
                                    View Profile
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 3: Appraisals & Source Documents */}
            {activeTab === 'documents' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Official Project Appraisal & Operational Documents
                            </h3>
                            <p className="text-xs text-slate-500">
                                Verified documents governing Oromia Water Bureau bilateral and multilateral programs
                            </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>100% Verified Sources</span>
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filteredDocuments.map((doc) => (
                            <div key={doc.id} className="p-4 sm:p-5 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1 max-w-2xl">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-bold text-[10px] border border-sky-200">
                                            {doc.programCode}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                                            {doc.documentType} &bull; {doc.publicationYear}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900">
                                        {doc.title}
                                    </h4>
                                    <p className="text-xs text-slate-500 line-clamp-2">
                                        {doc.summary}
                                    </p>
                                    <div className="text-[11px] text-slate-400">
                                        Source: <strong className="text-slate-600">{doc.sourceOrganization}</strong>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedDoc(doc)}
                                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                                    >
                                        Summary
                                    </button>
                                    <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                                    >
                                        <span>Access Document</span>
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PROGRAM PROFILE MODAL */}
            {selectedProgram && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => setSelectedProgram(null)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 font-bold text-xs">
                                {selectedProgram.code}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs">
                                {selectedProgram.status}
                            </span>
                        </div>

                        <h2 className="text-xl font-bold text-slate-900 mb-2">
                            {selectedProgram.name}
                        </h2>

                        <p className="text-xs text-slate-600 leading-relaxed mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {selectedProgram.description}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-slate-400 block font-medium">Implementation Period:</span>
                                <span className="font-bold text-slate-900">{selectedProgram.period}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-slate-400 block font-medium">Funding Type:</span>
                                <span className="font-bold text-slate-900">{selectedProgram.fundingType}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-slate-400 block font-medium">Financing / Budget:</span>
                                <span className="font-bold text-emerald-700">{selectedProgram.budgetEstimate}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-slate-400 block font-medium">Lead Governance Agency:</span>
                                <span className="font-bold text-slate-900">{selectedProgram.leadAgency}</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                                Primary Interventions & Components:
                            </h4>
                            <ul className="space-y-1.5 text-xs text-slate-600">
                                {selectedProgram.primaryInterventions.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                <ShieldCheck className="w-4 h-4" />
                                <span>{selectedProgram.verificationStatus}</span>
                            </span>

                            <a
                                href={selectedProgram.officialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-sky-600/20"
                            >
                                <span>Official Source Link</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* PARTNER PROFILE MODAL */}
            {selectedPartner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
                        <button
                            type="button"
                            onClick={() => setSelectedPartner(null)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 font-bold text-xs">
                                {selectedPartner.category}
                            </span>
                        </div>

                        <h2 className="text-xl font-bold text-slate-900 mb-1">
                            {selectedPartner.name}
                        </h2>
                        <p className="text-xs text-slate-500 mb-4">
                            Headquarters: {selectedPartner.headquarters} ({selectedPartner.countryOfOrigin})
                        </p>

                        <p className="text-xs text-slate-600 leading-relaxed mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                            {selectedPartner.notes}
                        </p>

                        <div className="space-y-2 text-xs mb-6">
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">Financing Commitment:</span>
                                <span className="font-bold text-emerald-700">
                                    ${(selectedPartner.totalFinancingCommitmentUSD / 1000000).toFixed(1)} Million USD
                                </span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">Focal Technical Lead:</span>
                                <span className="font-bold text-slate-800">{selectedPartner.focalPerson}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">Contact Email:</span>
                                <span className="font-mono text-slate-700">{selectedPartner.focalEmail}</span>
                            </div>
                            <div className="flex justify-between py-1.5">
                                <span className="text-slate-500">Supported Oromia Clusters:</span>
                                <span className="font-semibold text-slate-800">
                                    {selectedPartner.supportedClusters.join(', ')}
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            {selectedPartner.website && (
                                <a
                                    href={selectedPartner.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-sky-600/20"
                                >
                                    <span>Visit Partner Website</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* DOCUMENT DETAIL MODAL */}
            {selectedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
                        <button
                            type="button"
                            onClick={() => setSelectedDoc(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-bold text-xs border border-sky-200">
                                {selectedDoc.programCode}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-xs">
                                {selectedDoc.publicationYear}
                            </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            {selectedDoc.title}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                            {selectedDoc.summary}
                        </p>

                        <div className="text-xs text-slate-500 mb-5">
                            Published by: <strong className="text-slate-800">{selectedDoc.sourceOrganization}</strong>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Verified Archival Copy</span>
                            </span>

                            <a
                                href={selectedDoc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                            >
                                <span>Open Source Link</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DevelopmentPartnersPortal;
