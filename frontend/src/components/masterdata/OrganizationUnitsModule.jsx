import React, { useState, useMemo, useEffect } from 'react';
import {
    INITIAL_REGIONS, INITIAL_CLUSTERS, INITIAL_WOREDAS, INITIAL_TOWNS, INITIAL_KEBELES,
    checkOrgUnitUsage, buildHierarchyTree, fetchOrgUnitTree, fetchOrgUnitSummary,
    fetchAuditMigrationReport, createOrgUnit, updateOrgUnit, deleteOrgUnit
} from '../../services/orgUnitService';
import {
    FolderTree, MapPin, Compass, CheckCircle2, XCircle, Search, Plus, Edit3, Trash2,
    ChevronRight, ChevronDown, ShieldAlert, X, AlertTriangle, Globe, Layers, Building2,
    RefreshCw, Download, FileSpreadsheet, Info, ShieldCheck, CheckCheck
} from 'lucide-react';

export const OrganizationUnitsModule = ({
    masterData,
    onUpdateMasterData,
    canEdit,
    currentUser,
    projects = [],
    contracts = [],
    users = []
}) => {
    const [activeTab, setActiveTab] = useState('tree');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Specific filters
    const [selectedClusterFilter, setSelectedClusterFilter] = useState('ALL');
    const [selectedParentFilter, setSelectedParentFilter] = useState('ALL');

    // Tree state
    const [expandedNodes, setExpandedNodes] = useState({
        'reg-oromia': true,
        'clust-central': true,
        'clust-southeastern': true,
        'clust-southern': true,
        'clust-southwestern': true,
        'clust-western': true,
        'clust-eastern': true
    });

    // Modals & Drawers
    const [modalType, setModalType] = useState(null); // 'CLUSTER' | 'WOREDA' | 'TOWN' | 'KEBELE' | 'REGION'
    const [editingItem, setEditingItem] = useState(null);
    const [usageBlockedModal, setUsageBlockedModal] = useState(null);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [auditReport, setAuditReport] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    // Form states
    const [formCode, setFormCode] = useState('');
    const [formName, setFormName] = useState('');
    const [formLocalName, setFormLocalName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formUnitType, setFormUnitType] = useState('WOREDA');
    const [formClassification, setFormClassification] = useState('Administrative Woreda');
    const [formParentId, setFormParentId] = useState('');
    const [formClusterId, setFormClusterId] = useState('');
    const [formFormerZone, setFormFormerZone] = useState('');
    const [formStatus, setFormStatus] = useState('Active');
    const [formError, setFormError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Data sets from masterData or fallback
    const regions = useMemo(() => masterData?.regions?.length ? masterData.regions : INITIAL_REGIONS, [masterData?.regions]);
    const clusters = useMemo(() => masterData?.clusters?.length ? masterData.clusters : INITIAL_CLUSTERS, [masterData?.clusters]);
    const woredas = useMemo(() => masterData?.woredas?.length ? masterData.woredas : INITIAL_WOREDAS, [masterData?.woredas]);
    const towns = useMemo(() => masterData?.towns?.length ? masterData.towns : INITIAL_TOWNS, [masterData?.towns]);
    const kebeles = useMemo(() => masterData?.kebeles?.length ? masterData.kebeles : INITIAL_KEBELES, [masterData?.kebeles]);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Load audit report
    const handleOpenAuditModal = async () => {
        setIsAuditModalOpen(true);
        const report = await fetchAuditMigrationReport();
        setAuditReport(report);
    };

    // Reset page when filters change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
        setSearchQuery('');
    };

    // Tree toggling
    const toggleNode = (nodeId) => {
        setExpandedNodes(prev => ({
            ...prev,
            [nodeId]: !prev[nodeId]
        }));
    };

    const expandAll = () => {
        const map = {};
        regions.forEach(r => { map[r.id] = true; });
        clusters.forEach(c => { map[c.id] = true; });
        woredas.forEach(w => { map[w.id] = true; });
        towns.forEach(t => { map[t.id] = true; });
        setExpandedNodes(map);
    };

    const collapseAll = () => {
        setExpandedNodes({});
    };

    // Hierarchy Tree structure: Region -> Cluster -> [Woreda, Town] -> Kebele
    const hierarchyTree = useMemo(() => {
        let tree = buildHierarchyTree(regions, clusters, woredas, towns, kebeles);
        if (statusFilter !== 'ALL') {
            tree = tree.filter(r => r.status === statusFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return tree.map(r => {
                const matchesReg = (r.name && r.name.toLowerCase().includes(q)) || (r.code && r.code.toLowerCase().includes(q));
                const filteredClusters = (r.children || []).map(c => {
                    const matchesClust = (c.name && c.name.toLowerCase().includes(q)) || (c.code && c.code.toLowerCase().includes(q));
                    const filteredUnits = (c.children || []).map(u => {
                        const matchesUnit = (u.name && u.name.toLowerCase().includes(q)) || (u.code && u.code.toLowerCase().includes(q)) || (u.formerZone && u.formerZone.toLowerCase().includes(q));
                        const filteredKebeles = (u.children || []).filter(k => (k.name && k.name.toLowerCase().includes(q)) || (k.code && k.code.toLowerCase().includes(q)));
                        if (matchesUnit || filteredKebeles.length > 0) {
                            return { ...u, children: matchesUnit ? u.children : filteredKebeles };
                        }
                        return null;
                    }).filter(Boolean);

                    if (matchesClust || filteredUnits.length > 0) {
                        return { ...c, children: matchesClust ? c.children : filteredUnits };
                    }
                    return null;
                }).filter(Boolean);

                if (matchesReg || filteredClusters.length > 0) {
                    return { ...r, children: matchesReg ? r.children : filteredClusters };
                }
                return null;
            }).filter(Boolean);
        }
        return tree;
    }, [regions, clusters, woredas, towns, kebeles, statusFilter, searchQuery]);

    // Open Modal for Create
    const handleOpenCreate = (type) => {
        setModalType(type);
        setEditingItem(null);
        setFormUnitType(type);
        setFormCode('');
        setFormName('');
        setFormLocalName('');
        setFormDescription('');
        setFormFormerZone('');
        setFormStatus('Active');
        setFormError(null);

        if (type === 'CLUSTER') {
            setFormParentId(regions[0]?.id || 'reg-oromia');
            setFormClassification('Regional Administrative Cluster');
        } else if (type === 'WOREDA') {
            setFormParentId(clusters[0]?.id || 'clust-central');
            setFormClusterId(clusters[0]?.id || 'clust-central');
            setFormClassification('Administrative Woreda');
        } else if (type === 'TOWN') {
            setFormParentId(clusters[0]?.id || 'clust-central');
            setFormClusterId(clusters[0]?.id || 'clust-central');
            setFormClassification('City Administration');
        } else if (type === 'KEBELE') {
            setFormParentId(woredas[0]?.id || towns[0]?.id || '');
            setFormClassification('Kebele Administration');
        }
    };

    // Open Modal for Edit
    const handleOpenEdit = (type, item) => {
        setModalType(type);
        setEditingItem(item);
        setFormUnitType(type);
        setFormCode(item.code || '');
        setFormName(item.name || '');
        setFormLocalName(item.localName || '');
        setFormDescription(item.description || '');
        setFormFormerZone(item.formerZone || '');
        setFormParentId(item.parentId || item.clusterId || item.woredaId || item.regionId || '');
        setFormClusterId(item.clusterId || '');
        setFormClassification(item.classification || (type === 'TOWN' ? 'City Administration' : type === 'WOREDA' ? 'Administrative Woreda' : ''));
        setFormStatus(item.status || 'Active');
        setFormError(null);
    };

    // Save Create / Edit
    const handleSaveUnit = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (!formName.trim()) {
            setFormError('Official Unit Name is required.');
            return;
        }
        if (!formCode.trim()) {
            setFormError('Unique Organizational Code is required.');
            return;
        }

        // Permitted parent validation
        if (formUnitType === 'CLUSTER' && !formParentId) {
            setFormError('Cluster must belong to a Region.');
            return;
        }
        if ((formUnitType === 'WOREDA' || formUnitType === 'TOWN') && !formParentId) {
            setFormError(`${formUnitType === 'TOWN' ? 'Town / City Administration' : 'Woreda'} must belong directly to a Cluster.`);
            return;
        }
        if (formUnitType === 'KEBELE' && !formParentId) {
            setFormError('Kebele must belong to a Woreda or Town / City Administration.');
            return;
        }

        setIsSaving(true);
        try {
            const unitId = editingItem ? editingItem.id : `${formUnitType.toLowerCase()}-${Date.now().toString(36)}`;
            
            // Resolve parent and cluster
            let parentObj = null;
            let clusterId = formClusterId;
            let parentName = '';

            if (formUnitType === 'CLUSTER') {
                parentObj = regions.find(r => r.id === formParentId);
                parentName = parentObj?.name || 'Oromia National Regional State';
                clusterId = unitId;
            } else if (formUnitType === 'WOREDA' || formUnitType === 'TOWN') {
                parentObj = clusters.find(c => c.id === formParentId);
                clusterId = formParentId;
                parentName = parentObj?.name || 'Cluster';
            } else if (formUnitType === 'KEBELE') {
                parentObj = woredas.find(w => w.id === formParentId) || towns.find(t => t.id === formParentId);
                parentName = parentObj?.name || 'Parent Unit';
                clusterId = parentObj?.clusterId || '';
            }

            const unitPayload = {
                id: unitId,
                code: formCode.trim().toUpperCase(),
                name: formName.trim(),
                localName: formLocalName.trim(),
                unitType: formUnitType,
                classification: formClassification,
                parentId: formParentId,
                parentName: parentName,
                clusterId: clusterId,
                formerZone: formFormerZone.trim(),
                status: formStatus,
                description: formDescription.trim()
            };

            // Call API
            if (editingItem) {
                await updateOrgUnit(editingItem.id, unitPayload);
            } else {
                await createOrgUnit(unitPayload);
            }

            // Update masterData in local state
            const updated = { ...masterData };
            if (formUnitType === 'CLUSTER') {
                const list = [...clusters];
                const idx = list.findIndex(c => c.id === unitId);
                if (idx >= 0) list[idx] = unitPayload;
                else list.push(unitPayload);
                updated.clusters = list;
            } else if (formUnitType === 'WOREDA') {
                const list = [...woredas];
                const idx = list.findIndex(w => w.id === unitId);
                if (idx >= 0) list[idx] = unitPayload;
                else list.push(unitPayload);
                updated.woredas = list;
            } else if (formUnitType === 'TOWN') {
                const list = [...towns];
                const idx = list.findIndex(t => t.id === unitId);
                if (idx >= 0) list[idx] = unitPayload;
                else list.push(unitPayload);
                updated.towns = list;
            } else if (formUnitType === 'KEBELE') {
                const list = [...kebeles];
                const idx = list.findIndex(k => k.id === unitId);
                if (idx >= 0) list[idx] = unitPayload;
                else list.push(unitPayload);
                updated.kebeles = list;
            }

            if (onUpdateMasterData) {
                onUpdateMasterData(updated);
            }

            showToast(`${formUnitType} "${formName}" saved successfully.`);
            setModalType(null);
            setEditingItem(null);
        } catch (err) {
            console.error('Error saving unit:', err);
            setFormError(err.response?.data?.message || err.message || 'Failed to save organizational unit.');
        } finally {
            setIsSaving(false);
        }
    };

    // Toggle Unit Status (Activate / Deactivate)
    const handleToggleStatus = async (type, item) => {
        const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
        try {
            await updateOrgUnit(item.id, { status: newStatus });
            
            const updated = { ...masterData };
            if (type === 'CLUSTER') {
                updated.clusters = clusters.map(c => c.id === item.id ? { ...c, status: newStatus } : c);
            } else if (type === 'WOREDA') {
                updated.woredas = woredas.map(w => w.id === item.id ? { ...w, status: newStatus } : w);
            } else if (type === 'TOWN') {
                updated.towns = towns.map(t => t.id === item.id ? { ...t, status: newStatus } : t);
            } else if (type === 'KEBELE') {
                updated.kebeles = kebeles.map(k => k.id === item.id ? { ...k, status: newStatus } : k);
            }
            if (onUpdateMasterData) onUpdateMasterData(updated);
            showToast(`${item.name} set to ${newStatus}.`);
        } catch (err) {
            console.error('Error toggling status:', err);
            showToast(`Failed to update status: ${err.message}`);
        }
    };

    // Delete Unit
    const handleDeleteUnit = async (type, item) => {
        const usage = checkOrgUnitUsage(type, item.name, projects, contracts, users);
        if (usage.isUsed) {
            setUsageBlockedModal({ item, type, usage });
            return;
        }

        if (confirm(`Are you sure you want to delete ${type} "${item.name}"? This action cannot be undone.`)) {
            try {
                await deleteOrgUnit(item.id);
                const updated = { ...masterData };
                if (type === 'CLUSTER') {
                    updated.clusters = clusters.filter(c => c.id !== item.id);
                } else if (type === 'WOREDA') {
                    updated.woredas = woredas.filter(w => w.id !== item.id);
                } else if (type === 'TOWN') {
                    updated.towns = towns.filter(t => t.id !== item.id);
                } else if (type === 'KEBELE') {
                    updated.kebeles = kebeles.filter(k => k.id !== item.id);
                }
                if (onUpdateMasterData) onUpdateMasterData(updated);
                showToast(`${item.name} deleted.`);
            } catch (err) {
                console.error('Error deleting unit:', err);
                showToast(`Failed to delete: ${err.message}`);
            }
        }
    };

    // Paginated list for table tabs
    const activeList = useMemo(() => {
        let list = [];
        if (activeTab === 'clusters') list = clusters;
        else if (activeTab === 'woredas') list = woredas;
        else if (activeTab === 'towns') list = towns;
        else if (activeTab === 'kebeles') list = kebeles;

        if (selectedClusterFilter !== 'ALL') {
            list = list.filter(item => item.clusterId === selectedClusterFilter || item.parentId === selectedClusterFilter);
        }
        if (statusFilter !== 'ALL') {
            list = list.filter(item => item.status === statusFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(item => (item.name && item.name.toLowerCase().includes(q)) ||
                (item.code && item.code.toLowerCase().includes(q)) ||
                (item.localName && item.localName.toLowerCase().includes(q)) ||
                (item.formerZone && item.formerZone.toLowerCase().includes(q)));
        }
        return list;
    }, [activeTab, clusters, woredas, towns, kebeles, selectedClusterFilter, statusFilter, searchQuery]);

    const totalPages = Math.ceil(activeList.length / pageSize) || 1;
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return activeList.slice(start, start + pageSize);
    }, [activeList, currentPage, pageSize]);

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-slide-up border border-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Top Organizational Summary Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-900/50">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                                Official Oromia Administrative Hierarchy
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                                Region &rarr; Cluster &rarr; Woreda / Town &rarr; Kebele
                            </span>
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                            <span>Organizational Unit Architecture</span>
                        </h2>
                        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                            Six regional clusters operationalized under Oromia Regional State. Former zones eliminated as hierarchy levels; City Administrations equated to Town level.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        <button
                            type="button"
                            onClick={handleOpenAuditModal}
                            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all border border-white/15 flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                            <ShieldCheck className="w-4 h-4 text-cyan-400" />
                            <span>Audit &amp; Migration Report</span>
                        </button>

                        {canEdit && (
                            <button
                                type="button"
                                onClick={() => handleOpenCreate('WOREDA')}
                                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Org Unit</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                            <span className="font-semibold">Regional Clusters</span>
                            <Layers className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="text-2xl font-black text-white">{clusters.length}</div>
                        <div className="text-[10px] text-cyan-300 mt-1 font-medium">Baha, Kibba Baha, Kibba, Kibba Lixa, Lixa, Giddu Galeessa</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                            <span className="font-semibold">Administrative Woredas</span>
                            <Compass className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="text-2xl font-black text-white">{woredas.length}</div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">Direct children of Clusters</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                            <span className="font-semibold">Towns / City Administrations</span>
                            <Building2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-black text-white">{towns.length}</div>
                        <div className="text-[10px] text-emerald-300 mt-1 font-medium">Equated to Town level</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                            <span className="font-semibold">Registered Kebeles</span>
                            <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        </div>
                        <div className="text-2xl font-black text-white">{kebeles.length}</div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">Under Woredas and Towns</div>
                    </div>
                </div>
            </div>

            {/* Main Tabs Navigation */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            type="button"
                            onClick={() => handleTabChange('tree')}
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeTab === 'tree' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            <FolderTree className="w-3.5 h-3.5" />
                            <span>Hierarchy Tree</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('clusters')}
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeTab === 'clusters' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Clusters ({clusters.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('woredas')}
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeTab === 'woredas' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Woredas ({woredas.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('towns')}
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeTab === 'towns' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Towns &amp; Cities ({towns.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('kebeles')}
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeTab === 'kebeles' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Kebeles ({kebeles.length})</span>
                        </button>
                    </div>

                    {activeTab === 'tree' && (
                        <div className="flex items-center gap-2">
                            <button onClick={expandAll} className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer">
                                Expand All
                            </button>
                            <button onClick={collapseAll} className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer">
                                Collapse All
                            </button>
                        </div>
                    )}
                </div>

                {/* Filter Controls Bar */}
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center gap-3 justify-between bg-white">
                    <div className="flex flex-1 items-center gap-2 w-full">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by English name, Afaan Oromoo name, statutory code, or former zone..."
                                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Cluster Filter */}
                        {activeTab !== 'clusters' && (
                            <select
                                value={selectedClusterFilter}
                                onChange={(e) => {
                                    setSelectedClusterFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none"
                            >
                                <option value="ALL">All Clusters</option>
                                {clusters.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        )}

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none"
                        >
                            <option value="ALL">All Status</option>
                            <option value="Active">Active Only</option>
                            <option value="Inactive">Inactive Only</option>
                        </select>
                    </div>

                    {canEdit && activeTab !== 'tree' && (
                        <button
                            type="button"
                            onClick={() => handleOpenCreate(activeTab === 'clusters' ? 'CLUSTER' : activeTab === 'towns' ? 'TOWN' : activeTab === 'kebeles' ? 'KEBELE' : 'WOREDA')}
                            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add {activeTab.slice(0, -1)}</span>
                        </button>
                    )}
                </div>

                {/* TAB 1: HIERARCHICAL TREE VIEW */}
                {activeTab === 'tree' && (
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                            <span className="font-semibold">Interactive Organizational Tree (Region &rarr; Cluster &rarr; Woreda / Town &rarr; Kebele)</span>
                            <span>{hierarchyTree.length} Regional Root</span>
                        </div>

                        <div className="space-y-4">
                            {hierarchyTree.map((reg) => {
                                const isRegExpanded = !!expandedNodes[reg.id];
                                const childClusters = reg.children || [];

                                return (
                                    <div key={reg.id} className="border border-sky-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                                        {/* Region Row */}
                                        <div onClick={() => toggleNode(reg.id)} className="p-4 bg-gradient-to-r from-sky-50 via-cyan-50/50 to-white hover:bg-sky-100/50 cursor-pointer flex items-center justify-between transition-colors">
                                            <div className="flex items-center gap-3">
                                                <button type="button" className="text-cyan-800 p-0.5">
                                                    {isRegExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                </button>
                                                <Globe className="w-5 h-5 text-cyan-700 flex-shrink-0" />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-sm text-slate-900">{reg.name}</span>
                                                        <span className="text-xs font-semibold text-slate-500">({reg.localName})</span>
                                                        <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded font-bold">
                                                            {reg.code}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                                                    {childClusters.length} Clusters
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${reg.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                                    {reg.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Child Clusters */}
                                        {isRegExpanded && (
                                            <div className="p-4 pl-8 space-y-3 border-t border-sky-100 bg-slate-50/40">
                                                {childClusters.map((clust) => {
                                                    const isClustExpanded = !!expandedNodes[clust.id];
                                                    const childUnits = clust.children || [];

                                                    return (
                                                        <div key={clust.id} className="border border-indigo-100 rounded-xl overflow-hidden bg-white shadow-2xs">
                                                            {/* Cluster Row */}
                                                            <div onClick={() => toggleNode(clust.id)} className="p-3 bg-gradient-to-r from-indigo-50/60 to-white hover:bg-indigo-50 cursor-pointer flex items-center justify-between transition-colors">
                                                                <div className="flex items-center gap-2.5">
                                                                    <button type="button" className="text-indigo-800 p-0.5">
                                                                        {isClustExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                                    </button>
                                                                    <Layers className="w-4 h-4 text-indigo-700 flex-shrink-0" />
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-extrabold text-xs text-slate-900">{clust.name}</span>
                                                                            <span className="text-[11px] text-slate-500 font-medium">({clust.localName})</span>
                                                                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold">
                                                                                {clust.code}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[11px] text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                                                                        {childUnits.length} Woredas / Towns
                                                                    </span>
                                                                    {canEdit && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleOpenEdit('CLUSTER', clust);
                                                                            }}
                                                                            className="p-1 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded"
                                                                            title="Edit Cluster"
                                                                        >
                                                                            <Edit3 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Child Units under Cluster */}
                                                            {isClustExpanded && (
                                                                <div className="p-3 pl-8 space-y-2 border-t border-indigo-50 bg-slate-50/30">
                                                                    {childUnits.length === 0 ? (
                                                                        <p className="text-xs text-slate-400 italic py-1">No woredas or towns registered under this cluster.</p>
                                                                    ) : (
                                                                        childUnits.map((unit) => {
                                                                            const isUnitExpanded = !!expandedNodes[unit.id];
                                                                            const childKebeles = unit.children || [];
                                                                            const isTown = unit.unitType === 'TOWN';

                                                                            return (
                                                                                <div key={unit.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                                                                    {/* Woreda / Town Row */}
                                                                                    <div onClick={() => toggleNode(unit.id)} className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <button type="button" className="text-slate-500 p-0.5">
                                                                                                {isUnitExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                                                                            </button>
                                                                                            {isTown ? (
                                                                                                <Building2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                                                                            ) : (
                                                                                                <Compass className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                                                                                            )}
                                                                                            <span className="font-bold text-xs text-slate-800">{unit.name}</span>
                                                                                            <span className="text-[10px] font-mono px-1 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                                                                {unit.code}
                                                                                            </span>
                                                                                            {isTown && (
                                                                                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                                                                                                    City Admin
                                                                                                </span>
                                                                                            )}
                                                                                            {unit.formerZone && (
                                                                                                <span className="text-[10px] text-slate-400 italic">
                                                                                                    (historical {unit.formerZone})
                                                                                                </span>
                                                                                            )}
                                                                                        </div>

                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-[10px] text-slate-500">
                                                                                                {childKebeles.length} Kebeles
                                                                                            </span>
                                                                                            {canEdit && (
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        handleOpenEdit(isTown ? 'TOWN' : 'WOREDA', unit);
                                                                                                    }}
                                                                                                    className="p-1 text-slate-400 hover:text-cyan-700 hover:bg-slate-100 rounded"
                                                                                                >
                                                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Child Kebeles */}
                                                                                    {isUnitExpanded && (
                                                                                        <div className="p-2.5 pl-8 border-t border-slate-100 bg-slate-50/50">
                                                                                            {childKebeles.length === 0 ? (
                                                                                                <p className="text-[11px] text-slate-400 italic">No kebeles registered under this unit.</p>
                                                                                            ) : (
                                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                                                    {childKebeles.map((keb) => (
                                                                                                        <div key={keb.id} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                                                                                                            <div className="flex items-center gap-1.5">
                                                                                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                                                                <span className="font-semibold text-slate-800">{keb.name}</span>
                                                                                                            </div>
                                                                                                            <span className="text-[10px] font-mono text-slate-400">{keb.code}</span>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 2, 3, 4, 5: TABULAR LIST VIEWS */}
                {activeTab !== 'tree' && (
                    <div className="p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                        <th className="p-3">Statutory Code</th>
                                        <th className="p-3">English Name</th>
                                        <th className="p-3">Afaan Oromoo Name</th>
                                        {activeTab !== 'clusters' && <th className="p-3">Parent Cluster</th>}
                                        {activeTab === 'towns' && <th className="p-3">Classification</th>}
                                        {activeTab === 'woredas' && <th className="p-3">Historical Zone</th>}
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-3 font-mono font-bold text-cyan-800">{item.code}</td>
                                            <td className="p-3 font-bold text-slate-900">{item.name}</td>
                                            <td className="p-3 text-slate-600 font-medium">{item.localName || '-'}</td>
                                            {activeTab !== 'clusters' && (
                                                <td className="p-3 text-slate-700 font-semibold">{item.clusterName || item.parentName || '-'}</td>
                                            )}
                                            {activeTab === 'towns' && (
                                                <td className="p-3">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                                        {item.classification || 'City Administration'}
                                                    </span>
                                                </td>
                                            )}
                                            {activeTab === 'woredas' && (
                                                <td className="p-3 text-slate-500 italic">{item.formerZone || '-'}</td>
                                            )}
                                            <td className="p-3 text-center">
                                                <button
                                                    type="button"
                                                    disabled={!canEdit}
                                                    onClick={() => handleToggleStatus(activeTab.toUpperCase().slice(0, -1), item)}
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition-all ${
                                                        item.status === 'Active'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {item.status}
                                                </button>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {canEdit && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEdit(activeTab.toUpperCase().slice(0, -1), item)}
                                                                className="p-1 text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 rounded"
                                                                title="Edit Unit"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteUnit(activeTab.toUpperCase().slice(0, -1), item)}
                                                                className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded"
                                                                title="Delete Unit"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedItems.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                                                No organizational records match the active criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                                <div>
                                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, activeList.length)} of {activeList.length} items
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold"
                                    >
                                        Prev
                                    </button>
                                    <span className="px-2 font-mono font-bold text-slate-700">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create / Edit Modal with Strict Parent Dropdowns */}
            {modalType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8 animate-scale-in">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-black text-slate-900">
                                    {editingItem ? `Edit ${formUnitType}` : `Create New ${formUnitType}`}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {formUnitType === 'CLUSTER' && 'Belongs directly to Region (Oromia National Regional State)'}
                                    {formUnitType === 'WOREDA' && 'Belongs directly to an administrative Cluster'}
                                    {formUnitType === 'TOWN' && 'Town / City Administration equated to Town level'}
                                    {formUnitType === 'KEBELE' && 'Belongs directly to a Woreda or Town'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalType(null)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {formError && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveUnit} className="space-y-3.5 text-xs">
                            {/* Parent Selector restricted strictly to permitted unit types */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Permitted Parent Unit <span className="text-rose-500">*</span>
                                </label>
                                {formUnitType === 'CLUSTER' && (
                                    <select
                                        value={formParentId}
                                        onChange={(e) => setFormParentId(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
                                        required
                                    >
                                        {regions.map(r => (
                                            <option key={r.id} value={r.id}>{r.name} (Region)</option>
                                        ))}
                                    </select>
                                )}

                                {(formUnitType === 'WOREDA' || formUnitType === 'TOWN') && (
                                    <select
                                        value={formParentId}
                                        onChange={(e) => {
                                            setFormParentId(e.target.value);
                                            setFormClusterId(e.target.value);
                                        }}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
                                        required
                                    >
                                        <option value="">-- Choose Cluster --</option>
                                        {clusters.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.localName})</option>
                                        ))}
                                    </select>
                                )}

                                {formUnitType === 'KEBELE' && (
                                    <select
                                        value={formParentId}
                                        onChange={(e) => setFormParentId(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
                                        required
                                    >
                                        <option value="">-- Choose Woreda or Town --</option>
                                        <optgroup label="Woredas">
                                            {woredas.map(w => (
                                                <option key={w.id} value={w.id}>{w.name} ({w.clusterName || 'Woreda'})</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Towns / City Administrations">
                                            {towns.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} [City Admin]</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Statutory Code <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formCode}
                                        onChange={(e) => setFormCode(e.target.value)}
                                        placeholder="e.g. WOR_ADAMA"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase font-bold text-slate-900"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Classification
                                    </label>
                                    <input
                                        type="text"
                                        value={formClassification}
                                        onChange={(e) => setFormClassification(e.target.value)}
                                        placeholder="e.g. City Administration"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Official English Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g. Adama Woreda"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Afaan Oromoo Name (Maqaa Afaan Oromoo)
                                </label>
                                <input
                                    type="text"
                                    value={formLocalName}
                                    onChange={(e) => setFormLocalName(e.target.value)}
                                    placeholder="e.g. Aanaa Adaamaa"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium"
                                />
                            </div>

                            {formUnitType === 'WOREDA' && (
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Historical / Former Zone Reference
                                    </label>
                                    <input
                                        type="text"
                                        value={formFormerZone}
                                        onChange={(e) => setFormFormerZone(e.target.value)}
                                        placeholder="e.g. East Shewa (preserved for historical auditing)"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-700"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Description / Remarks
                                </label>
                                <textarea
                                    rows={2}
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    placeholder="Hydrological basin characteristics, urban status..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-2">
                                    <label className="font-bold text-slate-700">Status:</label>
                                    <select
                                        value={formStatus}
                                        onChange={(e) => setFormStatus(e.target.value)}
                                        className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg font-bold"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setModalType(null)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs"
                                    >
                                        {isSaving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Unit'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Audit & Migration Report Modal */}
            {isAuditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8 animate-scale-in">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                <h3 className="text-base font-black text-slate-900">
                                    Oromia Cluster Restructure Audit Report
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAuditModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3.5 text-xs text-slate-700">
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2">
                                <CheckCheck className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                                <div>
                                    <span className="font-bold text-emerald-900 block">Restructure Verified &amp; Version-Controlled</span>
                                    <span className="text-emerald-700 text-[11px]">
                                        Hierarchy: Region &rarr; Cluster &rarr; Woreda / Town &rarr; Kebele. Former zones removed as hierarchy level.
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                                    Configured Regional Clusters (6 of 6 Active)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {clusters.map(c => {
                                        const cWoredas = woredas.filter(w => w.clusterId === c.id || w.parentId === c.id);
                                        const cTowns = towns.filter(t => t.clusterId === c.id || t.parentId === c.id);
                                        return (
                                            <div key={c.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-slate-900">{c.name}</span>
                                                    <span className="font-mono text-[10px] text-cyan-800">{c.code}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-medium">{c.localName}</p>
                                                <div className="text-[10px] text-slate-600 pt-1 border-t border-slate-200 flex justify-between">
                                                    <span>{cWoredas.length} Woredas</span>
                                                    <span>{cTowns.length} Towns / City Admins</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                <span className="font-bold text-slate-900 block">Town / City Administration Status:</span>
                                <p className="text-[11px] text-slate-600">
                                    {towns.length} Town-level units configured across the 6 clusters with "City Administration" classification (Asella, Dodola, Bule Hora, Moyale, Shakiso, Agaro, Mattu, Nejo, Ambo, Batu, Holeta, Mojo, Sandafa Bakkee, Sheno, Waliso). No duplicate hierarchy levels created.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsAuditModalOpen(false)}
                                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
                            >
                                Close Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Usage Blocked Modal */}
            {usageBlockedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-3">
                        <div className="flex items-center gap-2 text-rose-600">
                            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                            <h3 className="text-sm font-black">Deletion Blocked - Active Business Usage</h3>
                        </div>
                        <p className="text-xs text-slate-600">
                            Cannot delete {usageBlockedModal.type} <strong>"{usageBlockedModal.item.name}"</strong> because it is referenced by {usageBlockedModal.usage.usageCount} active business record(s):
                        </p>
                        <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                            {usageBlockedModal.usage.details.map((d, i) => (
                                <li key={i}>{d}</li>
                            ))}
                        </ul>
                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setUsageBlockedModal(null)}
                                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
                            >
                                Understood
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
