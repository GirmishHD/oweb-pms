import React, { useState, useMemo } from 'react';
import { Role } from '../types';
import {
    getWaterSources, getEnergySources, getProjectTypes, getInterventionTypes,
    getFundingSources, getImplementingBodies, getProcurementMethods,
    getProcurementTypes, getDeliverableCategories, getAmendmentTypes,
    getDocumentCategories, getInspectionStages, getGeographicHierarchy,
    getZones, getWoredasForZone, addMasterDataItem, removeMasterDataItem,
    addWoredaToZone, addZone
} from '../services/masterDataLookups';
import { OrganizationUnitsModule } from './masterdata/OrganizationUnitsModule';
import {
    Database, Droplets, Zap, FolderKanban, RefreshCw, Landmark,
    Gavel, PackageCheck, FileEdit, Building2, ClipboardCheck,
    FileText, MapPin, Plus, Search, Trash2, CheckCircle2,
    ShieldCheck, Radio, AlertCircle, X, ArrowRight, ChevronRight,
    Tag, Download
} from 'lucide-react';

const CATEGORIES = [
    { id: 'waterSources', label: 'Water Sources', icon: Droplets, color: 'text-sky-600 bg-sky-50 border-sky-200', countKey: 'waterSources', description: 'Raw water extraction and hydrological intake classifications' },
    { id: 'energySources', label: 'Pumping & Energy', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200', countKey: 'energySources', description: 'Power systems driving electromechanical pumps (Solar, Grid, Hybrid)' },
    { id: 'projectCategories', label: 'Project Sectors', icon: FolderKanban, color: 'text-indigo-600 bg-indigo-50 border-indigo-200', countKey: 'projectCategories', description: 'Scheme program sectors and engineering classifications' },
    { id: 'interventionTypes', label: 'Intervention Types', icon: RefreshCw, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', countKey: 'interventionTypes', description: 'Project scope classification (New Construction, Rehabilitation, Expansion)' },
    { id: 'fundingSources', label: 'Funding Partners', icon: Landmark, color: 'text-purple-600 bg-purple-50 border-purple-200', countKey: 'fundingSources', description: 'Multilateral donors, sovereign treasury, and bilateral programs' },
    { id: 'procurementMethods', label: 'Procurement Methods', icon: Gavel, color: 'text-rose-600 bg-rose-50 border-rose-200', countKey: 'procurementMethods', description: 'Statutory public procurement tender mechanisms (NCB, ICB, RFQ)' },
    { id: 'deliverableCategories', label: 'Contract Deliverables', icon: PackageCheck, color: 'text-teal-600 bg-teal-50 border-teal-200', countKey: 'deliverableCategories', description: 'Major contractual milestones and work item categories' },
    { id: 'amendmentTypes', label: 'Variation & Amendments', icon: FileEdit, color: 'text-orange-600 bg-orange-50 border-orange-200', countKey: 'amendmentTypes', description: 'Contract amendment and variation order categories' },
    { id: 'implementingBodies', label: 'Implementing Agencies', icon: Building2, color: 'text-blue-600 bg-blue-50 border-blue-200', countKey: 'implementingBodies', description: 'Executing bureau directorates, zonal offices, utilities, and WASHCOs' },
    { id: 'inspectionStages', label: 'Inspection Stages', icon: ClipboardCheck, color: 'text-cyan-600 bg-cyan-50 border-cyan-200', countKey: 'inspectionStages', description: 'Field QA/QC supervision and construction lifecycle phases' },
    { id: 'documentCategories', label: 'Document Vault Categories', icon: FileText, color: 'text-slate-600 bg-slate-50 border-slate-200', countKey: 'documentCategories', description: 'Classification categories for drawings, deeds, and technical reports' },
    { id: 'geographicHierarchy', label: 'Clusters & Org Units', icon: MapPin, color: 'text-red-600 bg-red-50 border-red-200', countKey: 'geographicHierarchy', description: 'Region → Cluster → Woreda / Town → Kebele administrative organizational hierarchy' },
];

export const MasterDataModule = ({
    masterData,
    onUpdateMasterData,
    onPushToAll,
    currentUser,
    user,
    originalUser,
    projects = [],
    contracts = [],
    users = []
}) => {
    const effectiveUser = currentUser || user;
    const canEdit = effectiveUser?.role === Role.ADMIN || (originalUser && originalUser.role === Role.ADMIN);

    const [activeCategory, setActiveCategory] = useState('waterSources');
    const [searchQuery, setSearchQuery] = useState('');
    const [newItemName, setNewItemName] = useState('');
    const [toastMessage, setToastMessage] = useState(null);

    // Modal state for quick add
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalCategory, setModalCategory] = useState('waterSources');
    const [modalItemName, setModalItemName] = useState('');
    const [modalItemCode, setModalItemCode] = useState('');
    const [modalItemDesc, setModalItemDesc] = useState('');

    // Zonal hierarchy specific state
    const zones = useMemo(() => getZones(masterData), [masterData]);
    const [selectedZone, setSelectedZone] = useState(() => zones[0] || 'Arsi');
    const [newWoredaName, setNewWoredaName] = useState('');
    const [newZoneName, setNewZoneName] = useState('');
    const [isAddingZone, setIsAddingZone] = useState(false);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Current category items extraction
    const currentItems = useMemo(() => {
        switch (activeCategory) {
            case 'waterSources': return getWaterSources(masterData);
            case 'energySources': return getEnergySources(masterData);
            case 'projectCategories': return getProjectTypes(masterData);
            case 'interventionTypes': return getInterventionTypes(masterData);
            case 'fundingSources': return getFundingSources(masterData);
            case 'procurementMethods': return getProcurementMethods(masterData);
            case 'deliverableCategories': return getDeliverableCategories(masterData);
            case 'amendmentTypes': return getAmendmentTypes(masterData);
            case 'implementingBodies': return getImplementingBodies(masterData);
            case 'inspectionStages': return getInspectionStages(masterData);
            case 'documentCategories': return getDocumentCategories(masterData);
            case 'geographicHierarchy': return zones;
            default: return [];
        }
    }, [activeCategory, masterData, zones]);

    // Search filter
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return currentItems;
        const q = searchQuery.toLowerCase();
        return currentItems.filter(item => {
            const name = typeof item === 'object' ? item.name || '' : String(item);
            return name.toLowerCase().includes(q);
        });
    }, [currentItems, searchQuery]);

    // Fast inline add
    const handleQuickAdd = (e) => {
        e?.preventDefault();
        const cleanName = (newItemName || '').trim();
        if (!cleanName) return;

        if (activeCategory === 'geographicHierarchy') {
            const updated = addZone(masterData, cleanName);
            onUpdateMasterData(updated);
            setSelectedZone(cleanName);
            setNewItemName('');
            showToast(`Zone "${cleanName}" added to Master Data.`);
            return;
        }

        const updated = addMasterDataItem(masterData, activeCategory, cleanName);
        onUpdateMasterData(updated);
        setNewItemName('');
        showToast(`"${cleanName}" added to ${CATEGORIES.find(c => c.id === activeCategory)?.label}.`);
    };

    // Modal add with details
    const handleModalSubmit = (e) => {
        e.preventDefault();
        const cleanName = modalItemName.trim();
        if (!cleanName) return;

        const updated = addMasterDataItem(masterData, modalCategory, {
            name: cleanName,
            code: modalItemCode.trim() || undefined,
            description: modalItemDesc.trim() || undefined
        });

        onUpdateMasterData(updated);
        setIsAddModalOpen(false);
        setModalItemName('');
        setModalItemCode('');
        setModalItemDesc('');
        setActiveCategory(modalCategory);
        showToast(`"${cleanName}" successfully registered in Master Data.`);
    };

    // Delete item
    const handleDeleteItem = (itemName) => {
        if (!window.confirm(`Are you sure you want to remove "${itemName}" from Master Data?`)) {
            return;
        }
        const updated = removeMasterDataItem(masterData, activeCategory, itemName);
        onUpdateMasterData(updated);
        showToast(`"${itemName}" removed.`);
    };

    // Add Woreda to Zone
    const handleAddWoreda = (e) => {
        e?.preventDefault();
        const clean = (newWoredaName || '').trim();
        if (!clean || !selectedZone) return;

        const updated = addWoredaToZone(masterData, selectedZone, clean);
        onUpdateMasterData(updated);
        setNewWoredaName('');
        showToast(`Woreda "${clean}" added to ${selectedZone} Zone.`);
    };

    // Export Master Data as JSON
    const handleExport = () => {
        const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(masterData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", jsonStr);
        downloadAnchor.setAttribute("download", `OWEB_Master_Data_v${masterData.version || '2.0.0'}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast("Master Data exported successfully.");
    };

    // Total count calculation
    const totalCount = useMemo(() => {
        let sum = 0;
        sum += getWaterSources(masterData).length;
        sum += getEnergySources(masterData).length;
        sum += getProjectTypes(masterData).length;
        sum += getInterventionTypes(masterData).length;
        sum += getFundingSources(masterData).length;
        sum += getProcurementMethods(masterData).length;
        sum += getDeliverableCategories(masterData).length;
        sum += getAmendmentTypes(masterData).length;
        sum += getImplementingBodies(masterData).length;
        sum += getInspectionStages(masterData).length;
        sum += getDocumentCategories(masterData).length;
        return sum;
    }, [masterData]);

    const activeCatMeta = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];
    const ActiveIcon = activeCatMeta.icon;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Toast Feedback */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-cyan-500/40 flex items-center gap-3 animate-slide-up">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                OWEB Central Single Source of Truth
                            </span>
                            <span className="text-xs bg-cyan-500/30 text-cyan-200 px-2.5 py-0.5 rounded-full border border-cyan-400/40 font-mono font-bold">
                                v{masterData.version || '2.0.0'}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            <Database className="w-7 h-7 text-cyan-400" />
                            Master Data &amp; System Dropdown Registry
                        </h1>
                        <p className="text-sky-200/80 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                            Centralized authority controlling every dropdown in the system (Water Sources, Pumping &amp; Solar, Donors, Tenders, Contracts, Inspections, and Zonal Hierarchy). Any option added here instantly populates across Planning, Procurement, and Field supervision.
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-sky-200/90 mt-4 pt-3 border-t border-cyan-900/60 font-medium">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Status: <strong className="text-emerald-300">Live Active</strong>
                            </span>
                            <span className="text-cyan-800">•</span>
                            <span>Total Dropdown Options: <strong className="text-white font-mono">{totalCount}</strong></span>
                            <span className="text-cyan-800">•</span>
                            <span>Oromia Administrative Zones: <strong className="text-white font-mono">{zones.length}</strong></span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={handleExport}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <Download className="w-4 h-4 text-cyan-300" />
                            <span>Export Backup</span>
                        </button>

                        {canEdit && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalCategory(activeCategory);
                                        setIsAddModalOpen(true);
                                    }}
                                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>+ Add New Dropdown Item</span>
                                </button>

                                {onPushToAll && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onPushToAll(masterData);
                                            showToast("Master Data broadcasted and synchronized across all subsystems.");
                                        }}
                                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                                    >
                                        <Radio className="w-4 h-4" />
                                        <span>Broadcast Changes</span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Interactive Work Area: Left Categories List, Right Items Viewer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Category Selection Navigation (4 Cols) */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            System Dropdown Registries
                        </span>
                        <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                            {CATEGORIES.length}
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {CATEGORIES.map(cat => {
                            const Icon = cat.icon;
                            const isSelected = activeCategory === cat.id;
                            
                            // Calculate live count
                            let count = 0;
                            if (cat.id === 'waterSources') count = getWaterSources(masterData).length;
                            else if (cat.id === 'energySources') count = getEnergySources(masterData).length;
                            else if (cat.id === 'projectCategories') count = getProjectTypes(masterData).length;
                            else if (cat.id === 'interventionTypes') count = getInterventionTypes(masterData).length;
                            else if (cat.id === 'fundingSources') count = getFundingSources(masterData).length;
                            else if (cat.id === 'procurementMethods') count = getProcurementMethods(masterData).length;
                            else if (cat.id === 'deliverableCategories') count = getDeliverableCategories(masterData).length;
                            else if (cat.id === 'amendmentTypes') count = getAmendmentTypes(masterData).length;
                            else if (cat.id === 'implementingBodies') count = getImplementingBodies(masterData).length;
                            else if (cat.id === 'inspectionStages') count = getInspectionStages(masterData).length;
                            else if (cat.id === 'documentCategories') count = getDocumentCategories(masterData).length;
                            else if (cat.id === 'geographicHierarchy') count = zones.length;

                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveCategory(cat.id);
                                        setSearchQuery('');
                                    }}
                                    className={`w-full text-left p-3.5 transition-all flex items-center justify-between cursor-pointer ${
                                        isSelected
                                            ? 'bg-cyan-50/70 border-l-4 border-cyan-600 font-bold'
                                            : 'hover:bg-slate-50/80'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl border ${cat.color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className={`text-sm ${isSelected ? 'text-cyan-950 font-black' : 'text-slate-800 font-semibold'}`}>
                                                {cat.label}
                                            </div>
                                            <div className="text-[11px] text-slate-400 line-clamp-1 max-w-[200px]">
                                                {cat.description}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                                            isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {count}
                                        </span>
                                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-cyan-600' : 'text-slate-300'}`} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Content Panel (8 Cols) */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Category Detail Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-2xl border ${activeCatMeta.color}`}>
                                    <ActiveIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        {activeCatMeta.label}
                                        <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded-full">
                                            {filteredItems.length} options
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        {activeCatMeta.description}
                                    </p>
                                </div>
                            </div>

                            {/* Search Filter */}
                            <div className="relative min-w-[220px]">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    placeholder={`Filter ${activeCatMeta.label}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Special Case: Geographic Hierarchy (Region -> Cluster -> Woreda / Town -> Kebele) */}
                        {activeCategory === 'geographicHierarchy' ? (
                            <div className="mt-5">
                                <OrganizationUnitsModule
                                    masterData={masterData}
                                    onUpdateMasterData={onUpdateMasterData}
                                    canEdit={canEdit}
                                    currentUser={effectiveUser}
                                    projects={projects}
                                    contracts={contracts}
                                    users={users}
                                />
                            </div>
                        ) : (
                            /* Standard Dropdown Category Items List */
                            <div className="mt-5 space-y-4">
                                {/* Quick Add Bar */}
                                {canEdit && (
                                    <form onSubmit={handleQuickAdd} className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200/80">
                                        <div className="p-2 text-slate-400">
                                            <Plus className="w-4 h-4 text-cyan-600" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={`Quick add new ${activeCatMeta.label.slice(0, -1)} option...`}
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            className="flex-1 bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 outline-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newItemName.trim()}
                                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                        >
                                            <span>Add to Dropdown</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </form>
                                )}

                                {/* Items Grid / Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                                    {filteredItems.length === 0 ? (
                                        <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
                                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                            No options found matching "{searchQuery}".
                                        </div>
                                    ) : (
                                        filteredItems.map((item, idx) => {
                                            const itemName = typeof item === 'object' ? item.name : String(item);
                                            const itemCode = typeof item === 'object' ? item.code : undefined;
                                            const itemDesc = typeof item === 'object' ? item.description : undefined;

                                            return (
                                                <div
                                                    key={`${itemName}-${idx}`}
                                                    className="p-3 bg-white rounded-xl border border-slate-200/90 hover:border-cyan-300 hover:shadow-xs transition-all flex items-start justify-between gap-3 group"
                                                >
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                                        <div>
                                                            <div className="text-xs sm:text-sm font-bold text-slate-800">
                                                                {itemName}
                                                            </div>
                                                            {itemCode && (
                                                                <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100 inline-block mt-0.5">
                                                                    {itemCode}
                                                                </span>
                                                            )}
                                                            {itemDesc && (
                                                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                                                    {itemDesc}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {canEdit && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteItem(itemName)}
                                                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                                            title="Remove option"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Information Note */}
                    <div className="bg-sky-50/60 border border-sky-200/70 rounded-2xl p-4 text-xs text-sky-900 flex items-start gap-3">
                        <Tag className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <strong className="font-bold text-sky-950">Immediate Subsystem Availability:</strong>
                            <p className="text-sky-800 mt-0.5">
                                All entries created or edited in this Master Data Registry are automatically dispatched to the form dropdowns in Planning, Technical Review, Tenders, Contract Management, and Field Inspections. No application reloads or manual recompilations are necessary.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for detailed addition */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <form
                        onSubmit={handleModalSubmit}
                        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in"
                    >
                        <div className="p-6 bg-gradient-to-r from-slate-900 to-sky-950 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-cyan-400" />
                                    Add New Dropdown Option
                                </h3>
                                <p className="text-xs text-slate-300 mt-0.5">
                                    Register reference item for central bureau use
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Target Dropdown Category *
                                </label>
                                <select
                                    value={modalCategory}
                                    onChange={(e) => setModalCategory(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-semibold text-slate-800 outline-none focus:border-cyan-500"
                                >
                                    {CATEGORIES.filter(c => c.id !== 'geographicHierarchy').map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Option Name / Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Deep Aquifer Geothermal Well, Bilateral Donor X..."
                                    value={modalItemName}
                                    onChange={(e) => setModalItemName(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-cyan-500 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Code / Abbreviation (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. DAGW-01, DONOR_XYZ..."
                                    value={modalItemCode}
                                    onChange={(e) => setModalItemCode(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-cyan-500 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Description / Remarks (Optional)
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Technical specification or administrative notes..."
                                    value={modalItemDesc}
                                    onChange={(e) => setModalItemDesc(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!modalItemName.trim()}
                                className="px-5 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-md disabled:opacity-50"
                            >
                                Register &amp; Save
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default MasterDataModule;
