import React, { useState, useMemo } from 'react';
import { Role } from '../types';
import { calculateTotalMasterDataItems, INITIAL_MASTER_DATA, pushMasterDataToAllModules } from '../services/masterDataService';
import { CatalogItemsTable } from './masterdata/CatalogItemsTable';
import { OrganizationUnitsModule } from './masterdata/OrganizationUnitsModule';
import { SystemConfigSection } from './masterdata/SystemConfigSection';
import { WorkflowConfigSection } from './masterdata/WorkflowConfigSection';
import { ApprovalThresholdSection } from './masterdata/ApprovalThresholdSection';
import { AuditHistorySection } from './masterdata/AuditHistorySection';
import { ImportExportModal } from './masterdata/ImportExportModal';
import { Database, Settings, GitFork, Scale, MapPin, Layers, History, Radio, Plus, Upload, RotateCcw, ShieldCheck, AlertTriangle, FolderTree, CheckCheck } from 'lucide-react';
export const MasterDataModule = ({ masterData, onUpdateMasterData, onPushToAll, onResetToBaseline, currentUser, user, originalUser, projects = [], contracts = [], procurements = [], users = [] }) => {
    const effectiveUser = currentUser || user;
    const canEdit = effectiveUser?.role === Role.ADMIN || (originalUser && originalUser.role === Role.ADMIN);
    const [activeTab, setActiveTab] = useState('catalog');
    const [searchQuery, setSearchQuery] = useState('');
    // Modals state
    const [isPushModalOpen, setIsPushModalOpen] = useState(false);
    const [pushNotes, setPushNotes] = useState('');
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    // Geographic hierarchy states
    const [selectedZone, setSelectedZone] = useState(Object.keys(masterData.geographicHierarchy || {})[0] || '');
    const [newZoneName, setNewZoneName] = useState('');
    const [isAddingZone, setIsAddingZone] = useState(false);
    const [newWoredaName, setNewWoredaName] = useState('');
    // Project categories state
    const [selectedSector, setSelectedSector] = useState(Object.keys(masterData.projectCategories || {})[0] || '');
    const [newSectorName, setNewSectorName] = useState('');
    const [isAddingSector, setIsAddingSector] = useState(false);
    const [newSubtypeName, setNewSubtypeName] = useState('');
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };
    const totalRegisteredItems = useMemo(() => calculateTotalMasterDataItems(masterData), [masterData]);
    const totalZones = Object.keys(masterData.geographicHierarchy || {}).length;
    const totalWoredas = useMemo(() => {
        let count = 0;
        Object.values(masterData.geographicHierarchy || {}).forEach((arr) => {
            count += (arr || []).length;
        });
        return count;
    }, [masterData.geographicHierarchy]);
    // Log history change helper
    const recordHistory = (data, entityType, entityCode, entityName, action, summary, prev, next, reason) => {
        const newEntry = {
            id: `hist-${Date.now()}`,
            entityType,
            entityCode,
            entityName,
            action,
            changedBy: effectiveUser?.username || 'Administrator',
            timestamp: new Date().toISOString(),
            previousValue: prev,
            newValue: next,
            changeSummary: summary,
            reason
        };
        return {
            ...data,
            historyEntries: [newEntry, ...(data.historyEntries || [])],
            lastUpdated: new Date().toISOString()
        };
    };
    // 1. Catalog Item handlers
    const handleUpdateItem = (updatedItem) => {
        const currentItems = masterData.catalogItems || [];
        const updatedItems = currentItems.map(i => i.id === updatedItem.id ? updatedItem : i);
        const updatedData = recordHistory({ ...masterData, catalogItems: updatedItems }, 'ITEM', updatedItem.code, updatedItem.name, 'UPDATED', `${effectiveUser?.username || 'Administrator'} updated catalog item "${updatedItem.name}" (${updatedItem.code}).`);
        onUpdateMasterData(updatedData);
        showToast(`Catalog item "${updatedItem.name}" updated successfully.`);
    };
    const handleCreateItem = (newItem) => {
        const currentItems = masterData.catalogItems || [];
        const updatedItems = [...currentItems, newItem];
        const updatedData = recordHistory({ ...masterData, catalogItems: updatedItems }, 'ITEM', newItem.code, newItem.name, 'CREATED', `${effectiveUser?.username || 'Administrator'} registered new catalog item "${newItem.name}" (${newItem.code}) under ${newItem.categoryCode}.`);
        onUpdateMasterData(updatedData);
        showToast(`Catalog item "${newItem.name}" created successfully.`);
    };
    const handleDeleteItem = (itemId, categoryCode, itemCode) => {
        const currentItems = masterData.catalogItems || [];
        const itemToDelete = currentItems.find(i => i.id === itemId);
        const updatedItems = currentItems.filter(i => i.id !== itemId);
        const updatedData = recordHistory({ ...masterData, catalogItems: updatedItems }, 'ITEM', itemCode, itemToDelete?.name || itemCode, 'DELETED', `${effectiveUser?.username || 'Administrator'} permanently deleted catalog item "${itemToDelete?.name || itemCode}".`);
        onUpdateMasterData(updatedData);
        showToast(`Item "${itemToDelete?.name || itemCode}" deleted.`);
    };
    // 2. System Configuration handlers
    const handleUpdateConfig = (updatedCfg, reason) => {
        const currentConfigs = masterData.systemConfigurations || [];
        const prevCfg = currentConfigs.find(c => c.key === updatedCfg.key);
        const updatedConfigs = currentConfigs.map(c => c.key === updatedCfg.key ? updatedCfg : c);
        const updatedData = recordHistory({ ...masterData, systemConfigurations: updatedConfigs }, 'CONFIG', updatedCfg.key, updatedCfg.name, 'UPDATED', `${effectiveUser?.username || 'Administrator'} updated system parameter "${updatedCfg.name}" to "${updatedCfg.value}".`, prevCfg?.value, updatedCfg.value, reason);
        onUpdateMasterData(updatedData);
        showToast(`System parameter "${updatedCfg.name}" updated.`);
    };
    const handleResetAllConfigs = () => {
        const resetConfigs = (masterData.systemConfigurations || []).map(c => ({
            ...c,
            value: c.defaultValue,
            updatedBy: effectiveUser?.username || 'Administrator',
            updatedAt: new Date().toISOString()
        }));
        const updatedData = recordHistory({ ...masterData, systemConfigurations: resetConfigs }, 'CONFIG', 'ALL_CONFIGS', 'All System Parameters', 'RESET', `${effectiveUser?.username || 'Administrator'} reverted all system configuration values to factory defaults.`);
        onUpdateMasterData(updatedData);
        showToast('All system configurations reset to factory defaults.');
    };
    // 3. Workflow handlers
    const handleUpdateWorkflow = (wf) => {
        const currentWfs = masterData.workflowDefinitions || [];
        const updatedWfs = currentWfs.map(w => w.code === wf.code ? wf : w);
        const updatedData = recordHistory({ ...masterData, workflowDefinitions: updatedWfs }, 'WORKFLOW', wf.code, wf.name, 'UPDATED', `${effectiveUser?.username || 'Administrator'} updated workflow rule "${wf.name}".`);
        onUpdateMasterData(updatedData);
        showToast(`Workflow "${wf.name}" updated.`);
    };
    const handleUpdateWorkflowSteps = (workflowCode, newSteps) => {
        const otherSteps = (masterData.workflowSteps || []).filter(s => s.workflowCode !== workflowCode);
        const combined = [...otherSteps, ...newSteps];
        const wfName = (masterData.workflowDefinitions || []).find(w => w.code === workflowCode)?.name || workflowCode;
        const updatedData = recordHistory({ ...masterData, workflowSteps: combined }, 'WORKFLOW', workflowCode, wfName, 'UPDATED', `${effectiveUser?.username || 'Administrator'} modified approval sequence steps for "${wfName}" (${newSteps.length} stages).`);
        onUpdateMasterData(updatedData);
        showToast(`Workflow steps for "${wfName}" updated.`);
    };
    // 4. Approval Thresholds handlers
    const handleUpdateThresholds = (newThresholds) => {
        const updatedData = recordHistory({ ...masterData, approvalThresholds: newThresholds }, 'THRESHOLD', 'APPROVAL_TIERS', 'Approval Threshold Policy', 'UPDATED', `${effectiveUser?.username || 'Administrator'} updated statutory approval threshold tiers matrix.`);
        onUpdateMasterData(updatedData);
        showToast('Approval threshold tiers updated.');
    };
    // 5. Geographic Hierarchy Adders
    const handleAddZone = () => {
        const zName = newZoneName.trim();
        if (!zName)
            return;
        if (masterData.geographicHierarchy[zName]) {
            alert(`Zone "${zName}" is already registered.`);
            return;
        }
        const updatedHierarchy = {
            ...masterData.geographicHierarchy,
            [zName]: []
        };
        const updatedData = recordHistory({ ...masterData, geographicHierarchy: updatedHierarchy }, 'ITEM', `ZONE_${zName.toUpperCase().slice(0, 10)}`, zName, 'CREATED', `${effectiveUser?.username || 'Administrator'} registered administrative zone "${zName}".`);
        onUpdateMasterData(updatedData);
        setSelectedZone(zName);
        setNewZoneName('');
        setIsAddingZone(false);
        showToast(`Zone "${zName}" added.`);
    };
    const handleAddWoreda = () => {
        const wName = newWoredaName.trim();
        if (!wName || !selectedZone)
            return;
        const currentWoredas = masterData.geographicHierarchy[selectedZone] || [];
        if (currentWoredas.includes(wName)) {
            alert(`Woreda "${wName}" already exists in ${selectedZone}.`);
            return;
        }
        const updatedHierarchy = {
            ...masterData.geographicHierarchy,
            [selectedZone]: [...currentWoredas, wName]
        };
        const updatedData = recordHistory({ ...masterData, geographicHierarchy: updatedHierarchy }, 'ITEM', `WOR_${wName.toUpperCase().slice(0, 10)}`, wName, 'CREATED', `${effectiveUser?.username || 'Administrator'} added Woreda "${wName}" under ${selectedZone}.`);
        onUpdateMasterData(updatedData);
        setNewWoredaName('');
        showToast(`Woreda "${wName}" added to ${selectedZone}.`);
    };
    // 6. Broadcast Push to All Modules
    const handleConfirmPush = () => {
        const notes = pushNotes.trim() || 'Master data catalog and centralized system configurations updated and pushed to all active modules.';
        const synced = pushMasterDataToAllModules(masterData, effectiveUser?.username || 'Administrator');
        onPushToAll(synced);
        setIsPushModalOpen(false);
        setPushNotes('');
        showToast(`Master Data v${synced.version} broadcasted across all modules!`);
    };
    const handleConfirmReset = () => {
        if (onResetToBaseline) {
            onResetToBaseline();
        }
        else {
            onUpdateMasterData(INITIAL_MASTER_DATA);
        }
        setIsResetConfirmOpen(false);
        showToast('Master data catalog restored to regional baseline defaults.');
    };
    return (<div className="flex flex-col h-full bg-slate-100 p-6 overflow-y-auto text-slate-800 animate-fade-in relative">
      {/* Toast Notification */}
      {toastMessage && (<div className="fixed top-5 right-5 z-50 bg-emerald-950 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center gap-2.5 text-xs font-bold animate-fade-in">
          <CheckCheck className="w-4 h-4 text-emerald-300"/>
          <span>{toastMessage}</span>
        </div>)}

      {/* Global Brand Header & Synchronization Bar */}
      <div className="bg-gradient-to-r from-[#06203c] via-[#083359] to-[#041a30] rounded-3xl p-6 sm:p-7 text-white shadow-xl mb-6 border border-cyan-900/60 relative overflow-hidden">
        {/* Ambient Shimmer */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"/>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5"/>
                OWEB Central Architecture &bull; Single Source of Truth
              </span>
              <span className="text-xs bg-cyan-500/30 text-cyan-200 px-2.5 py-0.5 rounded-full border border-cyan-400/40 font-mono font-bold">
                v{masterData.version}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Master Data Catalog &amp; System Configuration
            </h1>
            <p className="text-sky-200/80 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Centralized repository for all reference data, classifications, administrative hierarchies, configurable system parameters, workflow pipelines, and approval threshold governance.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-sky-200/90 mt-3 pt-3 border-t border-cyan-900/60">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
                Status: <strong className="text-emerald-300">Live Synchronized</strong>
              </span>
              <span className="text-cyan-800">•</span>
              <span>Last Pushed: <strong>{new Date(masterData.lastPushedAt).toLocaleDateString()}</strong></span>
              <span className="text-cyan-800">•</span>
              <span>Pushed By: <strong className="text-white">{masterData.lastPushedBy}</strong></span>
              <span className="text-cyan-800">•</span>
              <span>Total Active Records: <strong className="text-white font-mono">{totalRegisteredItems}</strong></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={() => setIsImportModalOpen(true)} className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4 text-cyan-300"/>
              <span>Import / Export Center</span>
            </button>

            {canEdit && (<>
                <button onClick={() => setIsResetConfirmOpen(true)} className="px-3.5 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border border-rose-800/50 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5"/>
                  <span>Reset Baseline</span>
                </button>

                <button onClick={() => setIsPushModalOpen(true)} className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer">
                  <Radio className="w-4 h-4"/>
                  <span>Broadcast to Subsystems</span>
                </button>
              </>)}
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-6 pt-5 border-t border-cyan-900/60 overflow-x-auto relative z-10">
          {[
            { id: 'catalog', label: 'Master Data Catalog', icon: <Database className="w-4 h-4"/> },
            { id: 'orgUnits', label: `Organization Units (${(masterData.woredas || []).length} Woredas)`, icon: <FolderTree className="w-4 h-4"/> },
            { id: 'systemConfig', label: 'System Configuration', icon: <Settings className="w-4 h-4"/> },
            { id: 'workflows', label: 'Workflow Rules', icon: <GitFork className="w-4 h-4"/> },
            { id: 'thresholds', label: 'Approval Thresholds', icon: <Scale className="w-4 h-4"/> },
            { id: 'geography', label: `Zonal Registry (${totalZones})`, icon: <MapPin className="w-4 h-4"/> },
            { id: 'projectTaxonomy', label: 'Taxonomy & Technical', icon: <Layers className="w-4 h-4"/> },
            { id: 'auditLogs', label: `Audit Trail (${masterData.historyEntries?.length || 0})`, icon: <History className="w-4 h-4"/> },
            { id: 'pushLogs', label: `Push Logs (${masterData.pushLogs?.length || 0})`, icon: <Radio className="w-4 h-4"/> }
        ].map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-md font-extrabold'
                : 'bg-white/10 text-sky-200 hover:bg-white/20 hover:text-white'}`}>
              {tab.icon}
              {tab.label}
            </button>))}
        </div>
      </div>

      {/* TAB 1: MASTER DATA CATALOG ITEMS DIRECTORY */}
      {activeTab === 'catalog' && (<CatalogItemsTable masterData={masterData} onUpdateItem={handleUpdateItem} onCreateItem={handleCreateItem} onDeleteItem={handleDeleteItem} onOpenImport={() => setIsImportModalOpen(true)} onExport={() => setIsImportModalOpen(true)} currentUser={effectiveUser} canEdit={canEdit} projects={projects} contracts={contracts} procurements={procurements}/>)}

      {/* TAB 1.5: ORGANIZATION UNITS (REGION -> WOREDA -> KEBELE) */}
      {activeTab === 'orgUnits' && (<OrganizationUnitsModule masterData={masterData} onUpdateMasterData={onUpdateMasterData} canEdit={canEdit} currentUser={effectiveUser} projects={projects} contracts={contracts} users={users}/>)}

      {/* TAB 2: SYSTEM CONFIGURATION */}
      {activeTab === 'systemConfig' && (<SystemConfigSection configs={masterData.systemConfigurations || []} onUpdateConfig={handleUpdateConfig} onResetAllConfigs={handleResetAllConfigs} canEdit={canEdit} currentUser={effectiveUser}/>)}

      {/* TAB 3: WORKFLOW CONFIGURATION */}
      {activeTab === 'workflows' && (<WorkflowConfigSection workflows={masterData.workflowDefinitions || []} steps={masterData.workflowSteps || []} onUpdateWorkflow={handleUpdateWorkflow} onUpdateSteps={handleUpdateWorkflowSteps} canEdit={canEdit} currentUser={effectiveUser}/>)}

      {/* TAB 4: APPROVAL THRESHOLDS */}
      {activeTab === 'thresholds' && (<ApprovalThresholdSection thresholds={masterData.approvalThresholds || []} onUpdateThresholds={handleUpdateThresholds} canEdit={canEdit} currentUser={effectiveUser}/>)}

      {/* TAB 5: GEOGRAPHIC HIERARCHY */}
      {activeTab === 'geography' && (<div className="bg-white rounded-3xl border border-sky-100 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-600"/>
                Oromia Regional Geographic Tree (Region &rarr; Zones &rarr; Woredas)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hierarchical administrative structure linking capital water schemes to their exact woreda desk jurisdictions.
              </p>
            </div>

            {canEdit && (<button type="button" onClick={() => setIsAddingZone(true)} className="px-3.5 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                <Plus className="w-4 h-4"/>
                <span>Add Administrative Zone</span>
              </button>)}
          </div>

          {/* Add Zone Inline Box */}
          {isAddingZone && (<div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 flex items-center gap-3 animate-fade-in text-xs">
              <input type="text" value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} placeholder="Enter new zone title (e.g. East Bale)..." className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"/>
              <button onClick={handleAddZone} className="px-4 py-2 bg-cyan-700 text-white rounded-xl font-bold cursor-pointer hover:bg-cyan-800">
                Save Zone
              </button>
              <button onClick={() => setIsAddingZone(false)} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">
                Cancel
              </button>
            </div>)}

          {/* Zones & Woredas 2-Column Split */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Zones List */}
            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-1.5 max-h-[500px] overflow-y-auto custom-scrollbar">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 px-2 py-1">
                Zones ({totalZones})
              </h4>
              {Object.keys(masterData.geographicHierarchy || {}).map(z => (<button key={z} type="button" onClick={() => setSelectedZone(z)} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${selectedZone === z
                    ? 'bg-cyan-700 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-100'}`}>
                  <span>{z}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${selectedZone === z ? 'bg-cyan-800 text-cyan-100' : 'bg-slate-100 text-slate-500'}`}>
                    {(masterData.geographicHierarchy[z] || []).length} Woredas
                  </span>
                </button>))}
            </div>

            {/* Woredas Grid for Selected Zone */}
            <div className="md:col-span-2 border border-slate-200 rounded-2xl p-4 bg-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Woredas in <span className="text-cyan-800">{selectedZone}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {(masterData.geographicHierarchy[selectedZone] || []).length} registered districts
                  </p>
                </div>

                {canEdit && (<div className="flex items-center gap-2">
                    <input type="text" value={newWoredaName} onChange={(e) => setNewWoredaName(e.target.value)} placeholder="New Woreda name..." className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none"/>
                    <button type="button" onClick={handleAddWoreda} className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold cursor-pointer">
                      Add
                    </button>
                  </div>)}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto custom-scrollbar">
                {(masterData.geographicHierarchy[selectedZone] || []).map(w => (<div key={w} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between">
                    <span>{w}</span>
                    <span className="text-[10px] text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
                      Woreda
                    </span>
                  </div>))}
              </div>
            </div>
          </div>
        </div>)}

      {/* TAB 6: PROJECT TAXONOMY */}
      {activeTab === 'projectTaxonomy' && (<div className="bg-white rounded-3xl border border-sky-100 shadow-2xs p-6 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-600"/>
              Project Taxonomies &amp; Technical Classifications
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sectoral classifications, water sources, and water pumping technical configurations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Water Sources */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-xs text-slate-900">Hydrological Water Sources</h4>
              <div className="space-y-1.5">
                {(masterData.waterSources || []).map((ws, i) => (<div key={i} className="p-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800">
                    {ws}
                  </div>))}
              </div>
            </div>

            {/* Energy Sources */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-xs text-slate-900">Pumping &amp; Power Sources</h4>
              <div className="space-y-1.5">
                {(masterData.energySources || []).map((es, i) => (<div key={i} className="p-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800">
                    {es}
                  </div>))}
              </div>
            </div>

            {/* Intervention Types */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-xs text-slate-900">Intervention Typology</h4>
              <div className="space-y-1.5">
                {(masterData.interventionTypes || []).map((it, i) => (<div key={i} className="p-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800">
                    {it}
                  </div>))}
              </div>
            </div>
          </div>
        </div>)}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'auditLogs' && (<AuditHistorySection historyEntries={masterData.historyEntries || []}/>)}

      {/* TAB 8: PUSH LOGS */}
      {activeTab === 'pushLogs' && (<div className="bg-white rounded-3xl border border-sky-100 shadow-2xs p-6 space-y-5">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-600"/>
              Subsystem Broadcast Synchronization Logs
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical ledger of all master data push actions broadcasting parameter updates to Planning, Review, Procurement, and Contract modules.
            </p>
          </div>

          <div className="space-y-3">
            {(masterData.pushLogs || []).map((log) => (<div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-900 font-mono">
                      v{log.version}
                    </span>
                    <span className="font-bold text-slate-900">{log.changeSummary}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>Pushed by: <strong className="text-slate-700">{log.pushedBy}</strong></span>
                  <span>&bull;</span>
                  <span>Items Affected: <strong className="text-cyan-900">{log.totalItems}</strong></span>
                  <span>&bull;</span>
                  <span>Modules: {log.modulesAffected?.join(', ')}</span>
                </div>
              </div>))}
          </div>
        </div>)}

      {/* PUSH BROADCAST CONFIRMATION MODAL */}
      {isPushModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-cyan-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
                <Radio className="w-6 h-6"/>
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Broadcast Synchronization
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Push Master Data to All Modules
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action will increment the master data release version and propagate updated catalog items, system parameters, workflow rules, and approval thresholds across all active subsystems.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Release Change Notes <span className="text-slate-400 font-normal">(Mandatory)</span>
              </label>
              <textarea rows={3} required value={pushNotes} onChange={(e) => setPushNotes(e.target.value)} placeholder="Describe modifications included in this master data release..." className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"/>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsPushModalOpen(false)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmPush} className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-black shadow-md cursor-pointer">
                Confirm &amp; Broadcast
              </button>
            </div>
          </div>
        </div>)}

      {/* RESET TO BASELINE MODAL */}
      {isResetConfirmOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-rose-300 shadow-2xl w-full max-w-md p-6 space-y-4 text-slate-800">
            <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6"/>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Confirm Master Data Baseline Reset
              </h3>
              <p className="text-xs text-slate-600">
                This will reset all master reference catalogs, system configuration parameters, and approval rules back to official OWEB Regional Bureau factory baseline defaults.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button type="button" onClick={() => setIsResetConfirmOpen(false)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmReset} className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer">
                Confirm Reset Baseline
              </button>
            </div>
          </div>
        </div>)}

      {/* IMPORT / EXPORT MODAL */}
      {isImportModalOpen && (<ImportExportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} masterData={masterData} onImportComplete={(updated) => {
                onUpdateMasterData(updated);
                showToast('Master data import completed successfully.');
            }} currentUser={effectiveUser}/>)}
    </div>);
};
export default MasterDataModule;
