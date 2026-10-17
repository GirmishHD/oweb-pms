import React, { useState, useMemo } from 'react';
import { MasterData, Region, Woreda, Kebele, Project, Contract, User, MasterDataHistoryEntry } from '../../types';
import { 
  INITIAL_REGIONS, 
  INITIAL_WOREDAS, 
  INITIAL_KEBELES, 
  checkOrgUnitUsage,
  buildHierarchyTree,
  OrgHierarchyNode
} from '../../services/orgUnitService';
import { 
  FolderTree, 
  MapPin, 
  Compass, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  ShieldAlert, 
  X, 
  Check, 
  Layers, 
  AlertTriangle, 
  Info,
  RotateCcw,
  Building2,
  Globe,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';

interface OrganizationUnitsModuleProps {
  masterData: MasterData;
  onUpdateMasterData: (updatedData: MasterData) => void;
  canEdit: boolean;
  currentUser?: User;
  projects?: Project[];
  contracts?: Contract[];
  users?: User[];
}

type OrgTab = 'tree' | 'regions' | 'woredas' | 'kebeles';

export const OrganizationUnitsModule: React.FC<OrganizationUnitsModuleProps> = ({
  masterData,
  onUpdateMasterData,
  canEdit,
  currentUser,
  projects = [],
  contracts = [],
  users = []
}) => {
  const [activeTab, setActiveTab] = useState<OrgTab>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  
  // Specific filters
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('ALL');
  const [selectedWoredaFilter, setSelectedWoredaFilter] = useState<string>('ALL');

  // Tree state
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'reg-oromia': true,
    'wor-adama': true,
    'wor-sebeta': true
  });

  // Modal states
  const [modalType, setModalType] = useState<'REGION' | 'WOREDA' | 'KEBELE' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [usageBlockedModal, setUsageBlockedModal] = useState<{
    unitType: 'REGION' | 'WOREDA' | 'KEBELE';
    name: string;
    usage: { isUsed: boolean; usageCount: number; details: string[] };
  } | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formLocalName, setFormLocalName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRegionId, setFormRegionId] = useState('');
  const [formWoredaId, setFormWoredaId] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formError, setFormError] = useState<string | null>(null);

  // Data sets from masterData or fallback
  const regions: Region[] = useMemo(() => masterData.regions || INITIAL_REGIONS, [masterData.regions]);
  const woredas: Woreda[] = useMemo(() => masterData.woredas || INITIAL_WOREDAS, [masterData.woredas]);
  const kebeles: Kebele[] = useMemo(() => masterData.kebeles || INITIAL_KEBELES, [masterData.kebeles]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Reset page when filters change
  const handleTabChange = (tab: OrgTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery('');
  };

  // Helper to record history
  const logAudit = (
    data: MasterData,
    entityType: 'REGION' | 'WOREDA' | 'KEBELE',
    code: string,
    name: string,
    action: 'CREATED' | 'UPDATED' | 'DEACTIVATED' | 'ACTIVATED' | 'DELETED',
    summary: string,
    prev?: string,
    next?: string
  ): MasterData => {
    const entry: MasterDataHistoryEntry = {
      id: `hist-org-${Date.now()}`,
      entityType: 'ITEM',
      entityCode: code,
      entityName: name,
      action: action as any,
      changedBy: currentUser?.username || 'Administrator',
      timestamp: new Date().toISOString(),
      previousValue: prev,
      newValue: next,
      changeSummary: summary
    };

    return {
      ...data,
      historyEntries: [entry, ...(data.historyEntries || [])],
      lastUpdated: new Date().toISOString()
    };
  };

  // Tree toggle
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const expandAll = () => {
    const map: Record<string, boolean> = {};
    regions.forEach(r => { map[r.id] = true; });
    woredas.forEach(w => { map[w.id] = true; });
    setExpandedNodes(map);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  // Hierarchy Tree structure
  const hierarchyTree = useMemo(() => {
    let tree = buildHierarchyTree(regions, woredas, kebeles);
    if (statusFilter !== 'ALL') {
      tree = tree.filter(r => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      // Filter tree where region, woreda, or kebele matches
      return tree.map(r => {
        const matchesReg = r.name.toLowerCase().includes(q) || r.localName.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
        const filteredWoredas = (r.children || []).map(w => {
          const matchesWor = w.name.toLowerCase().includes(q) || w.localName.toLowerCase().includes(q) || w.code.toLowerCase().includes(q);
          const filteredKebeles = (w.children || []).filter(k => 
            k.name.toLowerCase().includes(q) || k.localName.toLowerCase().includes(q) || k.code.toLowerCase().includes(q)
          );
          if (matchesWor || filteredKebeles.length > 0) {
            return { ...w, children: matchesWor ? w.children : filteredKebeles };
          }
          return null;
        }).filter(Boolean) as OrgHierarchyNode[];

        if (matchesReg || filteredWoredas.length > 0) {
          return { ...r, children: matchesReg ? r.children : filteredWoredas };
        }
        return null;
      }).filter(Boolean) as OrgHierarchyNode[];
    }
    return tree;
  }, [regions, woredas, kebeles, statusFilter, searchQuery]);

  // Filtered lists for table tabs
  const filteredRegions = useMemo(() => {
    return regions.filter(r => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.localName.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [regions, statusFilter, searchQuery]);

  const filteredWoredas = useMemo(() => {
    return woredas.filter(w => {
      if (selectedRegionFilter !== 'ALL' && w.regionId !== selectedRegionFilter) return false;
      if (statusFilter !== 'ALL' && w.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return w.name.toLowerCase().includes(q) || w.localName.toLowerCase().includes(q) || w.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [woredas, selectedRegionFilter, statusFilter, searchQuery]);

  const filteredKebeles = useMemo(() => {
    return kebeles.filter(k => {
      if (selectedRegionFilter !== 'ALL') {
        const parentWoreda = woredas.find(w => w.id === k.woredaId);
        if (parentWoreda?.regionId !== selectedRegionFilter) return false;
      }
      if (selectedWoredaFilter !== 'ALL' && k.woredaId !== selectedWoredaFilter) return false;
      if (statusFilter !== 'ALL' && k.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return k.name.toLowerCase().includes(q) || k.localName.toLowerCase().includes(q) || k.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [kebeles, woredas, selectedRegionFilter, selectedWoredaFilter, statusFilter, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = (type: 'REGION' | 'WOREDA' | 'KEBELE') => {
    setModalType(type);
    setEditingItem(null);
    setFormCode('');
    setFormName('');
    setFormLocalName('');
    setFormDescription('');
    setFormStatus('Active');
    setFormError(null);

    if (type === 'WOREDA') {
      setFormRegionId(selectedRegionFilter !== 'ALL' ? selectedRegionFilter : (regions[0]?.id || 'reg-oromia'));
    } else if (type === 'KEBELE') {
      const defaultWoreda = selectedWoredaFilter !== 'ALL' ? selectedWoredaFilter : (woredas[0]?.id || 'wor-adama');
      setFormWoredaId(defaultWoreda);
      const wObj = woredas.find(w => w.id === defaultWoreda);
      setFormRegionId(wObj?.regionId || regions[0]?.id || 'reg-oromia');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (type: 'REGION' | 'WOREDA' | 'KEBELE', item: any) => {
    setModalType(type);
    setEditingItem(item);
    setFormCode(item.code);
    setFormName(item.name);
    setFormLocalName(item.localName);
    setFormDescription(item.description || '');
    setFormStatus(item.status);
    setFormError(null);

    if (type === 'WOREDA') {
      setFormRegionId(item.regionId);
    } else if (type === 'KEBELE') {
      setFormWoredaId(item.woredaId);
      setFormRegionId(item.regionId || '');
    }
  };

  // Save Modal Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCode.trim() || !formName.trim() || !formLocalName.trim()) {
      setFormError('Code, English Name, and Afaan Oromoo Local Name are required.');
      return;
    }

    const cleanCode = formCode.toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '_');
    const now = new Date().toISOString();
    const actor = currentUser?.username || 'Administrator';

    if (modalType === 'REGION') {
      // Check duplicate code
      const duplicate = regions.find(r => r.code === cleanCode && (!editingItem || r.id !== editingItem.id));
      if (duplicate) {
        setFormError(`Region code "${cleanCode}" is already in use.`);
        return;
      }

      let updatedRegions: Region[];
      let updatedData: MasterData;

      if (editingItem) {
        updatedRegions = regions.map(r => r.id === editingItem.id ? {
          ...r,
          code: cleanCode,
          name: formName.trim(),
          localName: formLocalName.trim(),
          description: formDescription.trim(),
          status: formStatus,
          updatedAt: now
        } : r);
        updatedData = logAudit(
          { ...masterData, regions: updatedRegions },
          'REGION',
          cleanCode,
          formName,
          'UPDATED',
          `${actor} updated Region "${formName}" (${cleanCode}).`
        );
      } else {
        const newReg: Region = {
          id: `reg-${cleanCode.toLowerCase()}`,
          code: cleanCode,
          name: formName.trim(),
          localName: formLocalName.trim(),
          description: formDescription.trim(),
          status: formStatus,
          createdAt: now,
          updatedAt: now
        };
        updatedRegions = [...regions, newReg];
        updatedData = logAudit(
          { ...masterData, regions: updatedRegions },
          'REGION',
          cleanCode,
          formName,
          'CREATED',
          `${actor} registered new Region "${formName}" (${cleanCode}).`
        );
      }
      onUpdateMasterData(updatedData);
    } 
    else if (modalType === 'WOREDA') {
      if (!formRegionId) {
        setFormError('Please select a parent Region.');
        return;
      }
      const duplicate = woredas.find(w => w.regionId === formRegionId && w.code === cleanCode && (!editingItem || w.id !== editingItem.id));
      if (duplicate) {
        setFormError(`Woreda code "${cleanCode}" already exists within this region.`);
        return;
      }

      const parentRegion = regions.find(r => r.id === formRegionId);
      let updatedWoredas: Woreda[];
      let updatedData: MasterData;

      if (editingItem) {
        updatedWoredas = woredas.map(w => w.id === editingItem.id ? {
          ...w,
          code: cleanCode,
          name: formName.trim(),
          localName: formLocalName.trim(),
          regionId: formRegionId,
          regionName: parentRegion?.name,
          description: formDescription.trim(),
          status: formStatus,
          updatedAt: now
        } : w);
        updatedData = logAudit(
          { ...masterData, woredas: updatedWoredas },
          'WOREDA',
          cleanCode,
          formName,
          'UPDATED',
          `${actor} updated Woreda "${formName}" (${cleanCode}).`
        );
      } else {
        const newWor: Woreda = {
          id: `wor-${cleanCode.toLowerCase()}`,
          code: cleanCode,
          name: formName.trim(),
          localName: formLocalName.trim(),
          regionId: formRegionId,
          regionName: parentRegion?.name,
          description: formDescription.trim(),
          status: formStatus,
          createdAt: now,
          updatedAt: now
        };
        updatedWoredas = [...woredas, newWor];
        updatedData = logAudit(
          { ...masterData, woredas: updatedWoredas },
          'WOREDA',
          cleanCode,
          formName,
          'CREATED',
          `${actor} added Woreda "${formName}" (${cleanCode}) under ${parentRegion?.name}.`
        );
      }
      onUpdateMasterData(updatedData);
    } 
    else if (modalType === 'KEBELE') {
      if (!formWoredaId) {
        setFormError('Please select a parent Woreda.');
        return;
      }
      const duplicate = kebeles.find(k => k.woredaId === formWoredaId && k.code === cleanCode && (!editingItem || k.id !== editingItem.id));
      if (duplicate) {
        setFormError(`Kebele code "${cleanCode}" already exists within this woreda.`);
        return;
      }

      const parentWoreda = woredas.find(w => w.id === formWoredaId);
      let updatedKebeles: Kebele[];
      let updatedData: MasterData;

      if (editingItem) {
        updatedKebeles = kebeles.map(k => k.id === editingItem.id ? {
          ...k,
          code: cleanCode,
          name: formName.trim(),
          localName: formLocalName.trim(),
          woredaId: formWoredaId,
          woredaName: parentWoreda?.name,
          regionId: parentWoreda?.regionId,
          description: formDescription.trim(),
          status: formStatus,
          updatedAt: now
        } : k);
        updatedData = logAudit(
          { ...masterData, kebeles: updatedKebeles },
          'KEBELE',
          cleanCode,
          formName,
          'UPDATED',
          `${actor} updated Kebele "${formName}" (${cleanCode}).`
        );
      } else {
        const newKeb: Kebele = {
          id: `keb-${cleanCode.toLowerCase()}`,
          code: cleanCode,
          name: formName.trim(),
          localName: formLocalName.trim(),
          woredaId: formWoredaId,
          woredaName: parentWoreda?.name,
          regionId: parentWoreda?.regionId,
          description: formDescription.trim(),
          status: formStatus,
          createdAt: now,
          updatedAt: now
        };
        updatedKebeles = [...kebeles, newKeb];
        updatedData = logAudit(
          { ...masterData, kebeles: updatedKebeles },
          'KEBELE',
          cleanCode,
          formName,
          'CREATED',
          `${actor} added Kebele "${formName}" under ${parentWoreda?.name}.`
        );
      }
      onUpdateMasterData(updatedData);
    }

    setModalType(null);
    setEditingItem(null);
  };

  // Toggle Active/Inactive
  const handleToggleStatus = (type: 'REGION' | 'WOREDA' | 'KEBELE', item: any) => {
    const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    const actor = currentUser?.username || 'Administrator';
    const now = new Date().toISOString();

    let updatedData: MasterData;

    if (type === 'REGION') {
      const updated = regions.map(r => r.id === item.id ? { ...r, status: nextStatus, updatedAt: now } : r);
      updatedData = logAudit(
        { ...masterData, regions: updated },
        'REGION',
        item.code,
        item.name,
        nextStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED',
        `${actor} changed Region "${item.name}" status to ${nextStatus}.`
      );
    } else if (type === 'WOREDA') {
      const updated = woredas.map(w => w.id === item.id ? { ...w, status: nextStatus, updatedAt: now } : w);
      updatedData = logAudit(
        { ...masterData, woredas: updated },
        'WOREDA',
        item.code,
        item.name,
        nextStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED',
        `${actor} changed Woreda "${item.name}" status to ${nextStatus}.`
      );
    } else {
      const updated = kebeles.map(k => k.id === item.id ? { ...k, status: nextStatus, updatedAt: now } : k);
      updatedData = logAudit(
        { ...masterData, kebeles: updated },
        'KEBELE',
        item.code,
        item.name,
        nextStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED',
        `${actor} changed Kebele "${item.name}" status to ${nextStatus}.`
      );
    }

    onUpdateMasterData(updatedData);
  };

  // Safe delete with referential integrity check
  const handleDeleteAttempt = (type: 'REGION' | 'WOREDA' | 'KEBELE', item: any) => {
    // 1. Check child organizational unit relationships first
    if (type === 'REGION') {
      const childWoredas = woredas.filter(w => w.regionId === item.id);
      if (childWoredas.length > 0) {
        setUsageBlockedModal({
          unitType: 'REGION',
          name: item.name,
          usage: {
            isUsed: true,
            usageCount: childWoredas.length,
            details: [`${childWoredas.length} Woreda(s) currently registered under this Region (e.g. ${childWoredas.slice(0, 3).map(w => w.name).join(', ')})`]
          }
        });
        return;
      }
    } else if (type === 'WOREDA') {
      const childKebeles = kebeles.filter(k => k.woredaId === item.id);
      if (childKebeles.length > 0) {
        setUsageBlockedModal({
          unitType: 'WOREDA',
          name: item.name,
          usage: {
            isUsed: true,
            usageCount: childKebeles.length,
            details: [`${childKebeles.length} Kebele(s) currently registered under this Woreda`]
          }
        });
        return;
      }
    }

    // 2. Check business usage (Projects, Contracts, Users)
    const usage = checkOrgUnitUsage(type, item.name, projects, contracts, users);
    if (usage.isUsed) {
      setUsageBlockedModal({
        unitType: type,
        name: item.name,
        usage
      });
      return;
    }

    // 3. Confirm deletion
    if (confirm(`Are you sure you want to permanently delete ${type.toLowerCase()} "${item.name}" (${item.code})?`)) {
      const actor = currentUser?.username || 'Administrator';
      let updatedData: MasterData;

      if (type === 'REGION') {
        const updated = regions.filter(r => r.id !== item.id);
        updatedData = logAudit(
          { ...masterData, regions: updated },
          'REGION',
          item.code,
          item.name,
          'DELETED',
          `${actor} permanently deleted Region "${item.name}" (${item.code}).`
        );
      } else if (type === 'WOREDA') {
        const updated = woredas.filter(w => w.id !== item.id);
        updatedData = logAudit(
          { ...masterData, woredas: updated },
          'WOREDA',
          item.code,
          item.name,
          'DELETED',
          `${actor} permanently deleted Woreda "${item.name}" (${item.code}).`
        );
      } else {
        const updated = kebeles.filter(k => k.id !== item.id);
        updatedData = logAudit(
          { ...masterData, kebeles: updated },
          'KEBELE',
          item.code,
          item.name,
          'DELETED',
          `${actor} permanently deleted Kebele "${item.name}" (${item.code}).`
        );
      }

      onUpdateMasterData(updatedData);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Top Banner & Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Regions</span>
            <Globe className="w-4 h-4 text-cyan-700" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{regions.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{regions.filter(r => r.status === 'Active').length} Active Administrative States</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Woredas (Districts)</span>
            <Compass className="w-4 h-4 text-sky-700" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{woredas.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Centralized District Desks</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kebeles (Communities)</span>
            <MapPin className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{kebeles.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Grassroots Beneficiary Sites</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Scheme Sites</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-700" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{projects.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Linked to Central Hierarchy</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-sky-100 shadow-2xs overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => handleTabChange('tree')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'tree'
                  ? 'bg-cyan-800 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FolderTree className="w-4 h-4" />
              <span>Hierarchical Tree View</span>
            </button>

            <button
              onClick={() => handleTabChange('regions')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'regions'
                  ? 'bg-cyan-800 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Regions ({regions.length})</span>
            </button>

            <button
              onClick={() => handleTabChange('woredas')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'woredas'
                  ? 'bg-cyan-800 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Woredas ({woredas.length})</span>
            </button>

            <button
              onClick={() => handleTabChange('kebeles')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'kebeles'
                  ? 'bg-cyan-800 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Kebeles ({kebeles.length})</span>
            </button>
          </div>

          {/* Action button */}
          {canEdit && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              {activeTab === 'regions' && (
                <button
                  type="button"
                  onClick={() => handleOpenCreate('REGION')}
                  className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-500 hover:to-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Region</span>
                </button>
              )}
              {activeTab === 'woredas' && (
                <button
                  type="button"
                  onClick={() => handleOpenCreate('WOREDA')}
                  className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-500 hover:to-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Woreda</span>
                </button>
              )}
              {activeTab === 'kebeles' && (
                <button
                  type="button"
                  onClick={() => handleOpenCreate('KEBELE')}
                  className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-500 hover:to-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Kebele</span>
                </button>
              )}
              {activeTab === 'tree' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={expandAll}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAll}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    Collapse All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center gap-3 justify-between bg-white">
          <div className="flex flex-1 items-center gap-2 w-full">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search unit by English name, Afaan Oromoo name, or statutory code..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Region Filter (when in Woredas or Kebeles tab) */}
            {(activeTab === 'woredas' || activeTab === 'kebeles') && (
              <select
                value={selectedRegionFilter}
                onChange={(e) => {
                  setSelectedRegionFilter(e.target.value);
                  setSelectedWoredaFilter('ALL');
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none"
              >
                <option value="ALL">All Regions</option>
                {regions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            )}

            {/* Woreda Filter (when in Kebeles tab) */}
            {activeTab === 'kebeles' && (
              <select
                value={selectedWoredaFilter}
                onChange={(e) => setSelectedWoredaFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none"
              >
                <option value="ALL">All Woredas</option>
                {(selectedRegionFilter === 'ALL' ? woredas : woredas.filter(w => w.regionId === selectedRegionFilter)).map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* TAB CONTENT */}

        {/* 1. HIERARCHICAL TREE VIEW */}
        {activeTab === 'tree' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
              <span className="font-semibold">Interactive Administrative Organizational Tree</span>
              <span>Showing {hierarchyTree.length} Regional Roots</span>
            </div>

            <div className="space-y-3">
              {hierarchyTree.map((reg) => {
                const isRegExpanded = !!expandedNodes[reg.id];
                const childWoredas = reg.children || [];

                return (
                  <div key={reg.id} className="border border-sky-100 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    {/* Region Header */}
                    <div 
                      onClick={() => toggleNode(reg.id)}
                      className="p-3.5 bg-gradient-to-r from-sky-50/80 to-white hover:bg-sky-100/50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <button type="button" className="text-cyan-800 p-0.5">
                          {isRegExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <Globe className="w-4 h-4 text-cyan-700 flex-shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-900">{reg.name}</span>
                            <span className="text-[11px] font-medium text-slate-500">({reg.localName})</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded font-bold">
                              {reg.code}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {childWoredas.length} Woredas
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          reg.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {reg.status}
                        </span>
                      </div>
                    </div>

                    {/* Child Woredas */}
                    {isRegExpanded && (
                      <div className="p-3 pl-8 space-y-2 border-t border-sky-100/80 bg-slate-50/30">
                        {childWoredas.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-1">No woredas registered under this region.</p>
                        ) : (
                          childWoredas.map((wor) => {
                            const isWorExpanded = !!expandedNodes[wor.id];
                            const childKebeles = wor.children || [];

                            return (
                              <div key={wor.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                {/* Woreda Row */}
                                <div 
                                  onClick={() => toggleNode(wor.id)}
                                  className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <button type="button" className="text-slate-500 p-0.5">
                                      {isWorExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                    </button>
                                    <Compass className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                                    <span className="font-bold text-xs text-slate-800">{wor.name}</span>
                                    <span className="text-[11px] text-slate-400">({wor.localName})</span>
                                    <span className="text-[10px] font-mono text-slate-500">[{wor.code}]</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {childKebeles.length} Kebeles
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      wor.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      {wor.status}
                                    </span>
                                  </div>
                                </div>

                                {/* Child Kebeles */}
                                {isWorExpanded && (
                                  <div className="p-2.5 pl-9 border-t border-slate-100 bg-slate-50/50">
                                    {childKebeles.length === 0 ? (
                                      <p className="text-[11px] text-slate-400 italic">No kebeles registered under this woreda.</p>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {childKebeles.map((keb) => (
                                          <div 
                                            key={keb.id}
                                            className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                                          >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                              <div className="truncate">
                                                <p className="font-bold text-slate-800 text-[11px] truncate">{keb.name}</p>
                                                <p className="text-[10px] text-slate-400 truncate">{keb.localName}</p>
                                              </div>
                                            </div>
                                            <span className={`text-[9px] font-mono font-bold px-1 rounded ml-1 flex-shrink-0 ${
                                              keb.status === 'Active' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'
                                            }`}>
                                              {keb.code}
                                            </span>
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

              {hierarchyTree.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <FolderTree className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                  <p className="text-xs font-semibold">No administrative units match your search query.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. REGIONS DATA TABLE */}
        {activeTab === 'regions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase font-extrabold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Statutory Code</th>
                  <th className="p-3">Region Name (English)</th>
                  <th className="p-3">Local Name (Afaan Oromoo)</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-center">Woredas</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegions.map((reg) => {
                  const woredaCount = woredas.filter(w => w.regionId === reg.id).length;
                  return (
                    <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-cyan-900">{reg.code}</td>
                      <td className="p-3 font-bold text-slate-900">{reg.name}</td>
                      <td className="p-3 text-slate-600 font-medium">{reg.localName}</td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{reg.description || '—'}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700">{woredaCount}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          reg.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {canEdit ? (
                            <>
                              <button
                                onClick={() => handleOpenEdit('REGION', reg)}
                                className="p-1 hover:bg-slate-200 text-slate-600 rounded cursor-pointer"
                                title="Edit Region"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus('REGION', reg)}
                                className={`p-1 rounded cursor-pointer ${
                                  reg.status === 'Active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={reg.status === 'Active' ? 'Deactivate Region' : 'Activate Region'}
                              >
                                {reg.status === 'Active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleDeleteAttempt('REGION', reg)}
                                className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer"
                                title="Delete Region"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Read Only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredRegions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No regions match the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. WOREDAS DATA TABLE */}
        {activeTab === 'woredas' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase font-extrabold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Woreda Code</th>
                  <th className="p-3">Woreda Name (English)</th>
                  <th className="p-3">Local Name (Afaan Oromoo)</th>
                  <th className="p-3">Parent Region</th>
                  <th className="p-3 text-center">Kebeles</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWoredas.map((wor) => {
                  const kebeleCount = kebeles.filter(k => k.woredaId === wor.id).length;
                  const parentRegion = regions.find(r => r.id === wor.regionId);
                  return (
                    <tr key={wor.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-sky-900">{wor.code}</td>
                      <td className="p-3 font-bold text-slate-900">{wor.name}</td>
                      <td className="p-3 text-slate-600 font-medium">{wor.localName}</td>
                      <td className="p-3 text-slate-700 font-semibold">{parentRegion?.name || wor.regionName || 'Oromia'}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700">{kebeleCount}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          wor.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {wor.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {canEdit ? (
                            <>
                              <button
                                onClick={() => handleOpenEdit('WOREDA', wor)}
                                className="p-1 hover:bg-slate-200 text-slate-600 rounded cursor-pointer"
                                title="Edit Woreda"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus('WOREDA', wor)}
                                className={`p-1 rounded cursor-pointer ${
                                  wor.status === 'Active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={wor.status === 'Active' ? 'Deactivate Woreda' : 'Activate Woreda'}
                              >
                                {wor.status === 'Active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleDeleteAttempt('WOREDA', wor)}
                                className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer"
                                title="Delete Woreda"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Read Only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredWoredas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No woredas match the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. KEBELES DATA TABLE */}
        {activeTab === 'kebeles' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase font-extrabold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Kebele Code</th>
                  <th className="p-3">Kebele Name (English)</th>
                  <th className="p-3">Local Name (Afaan Oromoo)</th>
                  <th className="p-3">Parent Woreda</th>
                  <th className="p-3">Region</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKebeles.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((keb) => {
                  const parentWor = woredas.find(w => w.id === keb.woredaId);
                  const parentReg = regions.find(r => r.id === parentWor?.regionId);
                  return (
                    <tr key={keb.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-emerald-900">{keb.code}</td>
                      <td className="p-3 font-bold text-slate-900">{keb.name}</td>
                      <td className="p-3 text-slate-600 font-medium">{keb.localName}</td>
                      <td className="p-3 text-slate-700 font-semibold">{parentWor?.name || keb.woredaName || '—'}</td>
                      <td className="p-3 text-slate-500">{parentReg?.name || 'Oromia'}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          keb.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {keb.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {canEdit ? (
                            <>
                              <button
                                onClick={() => handleOpenEdit('KEBELE', keb)}
                                className="p-1 hover:bg-slate-200 text-slate-600 rounded cursor-pointer"
                                title="Edit Kebele"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus('KEBELE', keb)}
                                className={`p-1 rounded cursor-pointer ${
                                  keb.status === 'Active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={keb.status === 'Active' ? 'Deactivate Kebele' : 'Activate Kebele'}
                              >
                                {keb.status === 'Active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleDeleteAttempt('KEBELE', keb)}
                                className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer"
                                title="Delete Kebele"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Read Only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredKebeles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No kebeles match the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {filteredKebeles.length > pageSize && (
              <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredKebeles.length)} of {filteredKebeles.length} Kebeles
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-mono font-bold text-slate-800">
                    Page {currentPage} of {Math.ceil(filteredKebeles.length / pageSize)}
                  </span>
                  <button
                    disabled={currentPage >= Math.ceil(filteredKebeles.length / pageSize)}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-sky-100 shadow-2xl w-full max-w-lg p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-100 text-cyan-800 rounded-xl">
                  {modalType === 'REGION' ? <Globe className="w-5 h-5" /> : modalType === 'WOREDA' ? <Compass className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingItem ? `Edit ${modalType}` : `Create New ${modalType}`}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {modalType === 'REGION' ? 'Regional State administrative unit' : modalType === 'WOREDA' ? 'Woreda district subordinate to Region' : 'Kebele community unit subordinate to Woreda'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
              {/* Parent Region Select (for Woreda or Kebele) */}
              {modalType === 'WOREDA' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Parent Region <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formRegionId}
                    onChange={(e) => setFormRegionId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                  >
                    <option value="">-- Select Parent Region --</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.localName})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Parent Woreda Select (for Kebele) */}
              {modalType === 'KEBELE' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Parent Region <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formRegionId}
                      onChange={(e) => {
                        setFormRegionId(e.target.value);
                        setFormWoredaId('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                    >
                      <option value="">-- Filter by Region --</option>
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Parent Woreda <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formWoredaId}
                      onChange={(e) => setFormWoredaId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                    >
                      <option value="">-- Select Parent Woreda --</option>
                      {(formRegionId ? woredas.filter(w => w.regionId === formRegionId) : woredas).map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({w.localName})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Statutory Code */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Statutory Administrative Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={modalType === 'REGION' ? 'e.g. REG_OROMIA' : modalType === 'WOREDA' ? 'e.g. WOR_ADAMA' : 'e.g. KEB_ADM_01'}
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              {/* English Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Unit Name (English) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={modalType === 'REGION' ? 'e.g. Oromia National Regional State' : modalType === 'WOREDA' ? 'e.g. Adama Woreda' : 'e.g. Kebele 01 (Boku Shenen)'}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              {/* Afaan Oromoo Local Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Local / Afaan Oromoo Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={modalType === 'REGION' ? 'e.g. Mootummaa Naannoo Oromiyaa' : modalType === 'WOREDA' ? 'e.g. Aanaa Adaamaa' : 'e.g. Ganda 01 Boqqoo Shanan'}
                  value={formLocalName}
                  onChange={(e) => setFormLocalName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Geographic boundaries, watershed notes, or administrative specifications..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                >
                  <option value="Active">Active (Available for Projects and Contracts)</option>
                  <option value="Inactive">Inactive (Archived / Decommissioned)</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-500 hover:to-sky-600 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Create Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REFERENTIAL USAGE BLOCKED MODAL */}
      {usageBlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-slate-800">
            <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Destructive Deletion Prevented
              </h3>
              <p className="text-xs text-slate-600">
                Administrative Unit <strong>"{usageBlockedModal.name}"</strong> cannot be physically deleted because it is actively referenced by existing system records.
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Active References ({usageBlockedModal.usage.usageCount})</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                {usageBlockedModal.usage.details.map((det, idx) => (
                  <li key={idx}>{det}</li>
                ))}
              </ul>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed text-center">
              To retire this administrative unit without breaking historical audit trails or scheme linkages, please use <strong>Soft Deactivation</strong> to mark it as Inactive instead.
            </p>

            <button
              type="button"
              onClick={() => setUsageBlockedModal(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
