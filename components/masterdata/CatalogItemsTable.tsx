import React, { useState, useMemo } from 'react';
import { 
  MasterData, 
  MasterDataCategory, 
  MasterDataItem, 
  MasterDataDomain,
  User,
  Project,
  Contract,
  Procurement
} from '../../types';
import { checkMasterDataItemUsage } from '../../services/masterDataService';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Upload, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Layers, 
  ShieldAlert, 
  ArrowUpDown, 
  Check, 
  X, 
  ChevronRight,
  Database,
  Tag,
  AlertTriangle,
  Info
} from 'lucide-react';

interface CatalogItemsTableProps {
  masterData: MasterData;
  onUpdateItem: (item: MasterDataItem) => void;
  onCreateItem: (item: MasterDataItem) => void;
  onDeleteItem: (itemId: string, categoryCode: string, itemCode: string) => void;
  onOpenImport: () => void;
  onExport: () => void;
  currentUser?: User;
  canEdit: boolean;
  projects?: Project[];
  contracts?: Contract[];
  procurements?: Procurement[];
}

export const CatalogItemsTable: React.FC<CatalogItemsTableProps> = ({
  masterData,
  onUpdateItem,
  onCreateItem,
  onDeleteItem,
  onOpenImport,
  onExport,
  currentUser,
  canEdit,
  projects = [],
  contracts = [],
  procurements = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<MasterDataItem | null>(null);
  const [usageBlockedItem, setUsageBlockedItem] = useState<{ item: MasterDataItem; usage: any } | null>(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState<Partial<MasterDataItem>>({
    categoryCode: 'PROJECT_TYPE',
    code: '',
    name: '',
    description: '',
    shortName: '',
    parentId: '',
    parentCode: '',
    displayOrder: 1,
    isActive: true
  });

  const categories = useMemo(() => masterData.catalogCategories || [], [masterData.catalogCategories]);
  const allItems = useMemo(() => masterData.catalogItems || [], [masterData.catalogItems]);

  // Categories filtered by chosen domain
  const filteredCategories = useMemo(() => {
    if (selectedDomain === 'ALL') return categories;
    return categories.filter(c => c.domain === selectedDomain);
  }, [categories, selectedDomain]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Domain filter
      if (selectedDomain !== 'ALL') {
        const cat = categories.find(c => c.code === item.categoryCode);
        if (!cat || cat.domain !== selectedDomain) return false;
      }

      // Category filter
      if (selectedCategoryCode !== 'ALL' && item.categoryCode !== selectedCategoryCode) {
        return false;
      }

      // Status filter
      if (statusFilter === 'ACTIVE' && !item.isActive) return false;
      if (statusFilter === 'INACTIVE' && item.isActive) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesCat = item.categoryCode.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [allItems, categories, selectedDomain, selectedCategoryCode, statusFilter, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    const defaultCat = selectedCategoryCode !== 'ALL' ? selectedCategoryCode : (filteredCategories[0]?.code || 'PROJECT_TYPE');
    setFormData({
      categoryCode: defaultCat,
      code: '',
      name: '',
      description: '',
      shortName: '',
      parentId: '',
      parentCode: '',
      displayOrder: allItems.filter(i => i.categoryCode === defaultCat).length + 1,
      isActive: true
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: MasterDataItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsCreateModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.categoryCode) {
      alert('Please provide required code, name, and category.');
      return;
    }

    const cleanCode = formData.code.toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '_');
    const now = new Date().toISOString();
    const actor = currentUser?.username || 'Administrator';

    if (editingItem) {
      // Update
      const updated: MasterDataItem = {
        ...editingItem,
        ...formData,
        code: cleanCode,
        name: formData.name.trim(),
        description: formData.description || formData.name,
        updatedBy: actor,
        updatedAt: now
      } as MasterDataItem;
      onUpdateItem(updated);
    } else {
      // Check duplicate in same category
      const duplicate = allItems.find(i => i.categoryCode === formData.categoryCode && i.code === cleanCode);
      if (duplicate) {
        alert(`An item with code "${cleanCode}" already exists in category "${formData.categoryCode}".`);
        return;
      }

      const newItem: MasterDataItem = {
        id: `MDI-${formData.categoryCode}-${cleanCode}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        categoryCode: formData.categoryCode,
        code: cleanCode,
        name: formData.name.trim(),
        description: formData.description || formData.name,
        shortName: formData.shortName,
        parentId: formData.parentId || undefined,
        parentCode: formData.parentCode || undefined,
        displayOrder: Number(formData.displayOrder) || (allItems.length + 1),
        isActive: formData.isActive ?? true,
        createdBy: actor,
        createdAt: now,
        updatedBy: actor,
        updatedAt: now
      };
      onCreateItem(newItem);
    }

    setIsCreateModalOpen(false);
    setEditingItem(null);
  };

  // Delete with data protection check
  const handleDeleteCheck = (item: MasterDataItem) => {
    const usage = checkMasterDataItemUsage(item.id, item.code, item.categoryCode, projects, contracts, procurements);
    if (usage.isUsed) {
      setUsageBlockedItem({ item, usage });
      return;
    }

    if (confirm(`Are you sure you want to permanently delete reference item "${item.name}" (${item.code})?`)) {
      onDeleteItem(item.id, item.categoryCode, item.code);
    }
  };

  // Quick Toggle Active State
  const handleToggleActive = (item: MasterDataItem) => {
    const updated: MasterDataItem = {
      ...item,
      isActive: !item.isActive,
      updatedBy: currentUser?.username || 'Administrator',
      updatedAt: new Date().toISOString()
    };
    onUpdateItem(updated);
  };

  // Potential Parent Items for current Category
  const activeCategoryObj = categories.find(c => c.code === formData.categoryCode);
  const parentCategoryCode = activeCategoryObj?.parentCategoryCode;
  const potentialParentItems = useMemo(() => {
    if (!parentCategoryCode) return [];
    return allItems.filter(i => i.categoryCode === parentCategoryCode && i.isActive);
  }, [allItems, parentCategoryCode]);

  return (
    <div className="space-y-4 animate-fade-in text-slate-800">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white p-4 rounded-3xl border border-sky-100 shadow-2xs space-y-3">
        {/* Domain Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Domain:</span>
          {[
            { id: 'ALL', label: 'All Catalogs' },
            { id: 'PROJECT', label: 'Project' },
            { id: 'CONTRACT', label: 'Contract' },
            { id: 'PAYMENT', label: 'Payment' },
            { id: 'RISK', label: 'Risk' },
            { id: 'DOCUMENTS', label: 'Documents' },
            { id: 'ORGANIZATION', label: 'Organization' },
            { id: 'GEOGRAPHY', label: 'Geography' },
            { id: 'GENERAL', label: 'General' }
          ].map(d => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDomain(d.id);
                setSelectedCategoryCode('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedDomain === d.id
                  ? 'bg-cyan-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Search, Category Dropdown, and Action Buttons */}
        <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="flex flex-1 items-center gap-2 w-full">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference items by name, code, or description..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
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

            {/* Category Dropdown */}
            <select
              value={selectedCategoryCode}
              onChange={(e) => setSelectedCategoryCode(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none max-w-xs truncate"
            >
              <option value="ALL">All Categories ({filteredCategories.length})</option>
              {filteredCategories.map(cat => (
                <option key={cat.code} value={cat.code}>
                  {cat.name} ({allItems.filter(i => i.categoryCode === cat.code).length})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={onExport}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Export Catalog Records to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            {canEdit && (
              <>
                <button
                  onClick={onOpenImport}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Import Master Data from CSV or JSON"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Import</span>
                </button>

                <button
                  onClick={handleOpenCreate}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Catalog Item</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Catalog Items Table */}
      <div className="bg-white rounded-3xl border border-sky-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="p-3.5 w-12 text-center">#</th>
                <th className="p-3.5">Item Code</th>
                <th className="p-3.5">Name &amp; Description</th>
                <th className="p-3.5">Category &amp; Domain</th>
                <th className="p-3.5">Parent Reference</th>
                <th className="p-3.5 text-center">Order</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, idx) => {
                const cat = categories.find(c => c.code === item.categoryCode);
                const parentItem = item.parentCode ? allItems.find(p => p.code === item.parentCode) : undefined;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-cyan-900 bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-200">
                        {item.code}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <span className="font-bold text-slate-900 block truncate">{item.name}</span>
                      {item.description && item.description !== item.name && (
                        <span className="text-slate-500 text-[11px] block truncate mt-0.5">{item.description}</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-800 block text-[11px]">{cat?.name || item.categoryCode}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{cat?.domain || 'GENERAL'}</span>
                    </td>
                    <td className="p-3.5">
                      {item.parentCode ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono text-[10px] font-semibold flex items-center gap-1 w-max">
                          <Layers className="w-3 h-3 text-cyan-600" />
                          {parentItem?.name || item.parentCode}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[11px]">&mdash;</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-slate-600">
                      {item.displayOrder}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        item.isActive 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingItem(item)}
                          className="p-1.5 text-slate-500 hover:text-cyan-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-500 hover:text-cyan-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Item"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleActive(item)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                item.isActive 
                                  ? 'text-amber-600 hover:bg-amber-50' 
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={item.isActive ? 'Deactivate Item' : 'Activate Item'}
                            >
                              {item.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCheck(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No master data catalog items found</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Try refining your search terms or selecting a different category filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Stats */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing <strong>{filteredItems.length}</strong> of <strong>{allItems.length}</strong> total catalog items</span>
          <span>Active: <strong>{allItems.filter(i => i.isActive).length}</strong> &bull; Inactive: <strong>{allItems.filter(i => !i.isActive).length}</strong></span>
        </div>
      </div>

      {/* CREATE / EDIT ITEM MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-sky-200 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-[#06203c] via-[#083359] to-[#041a30] text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/20 text-cyan-300 rounded-2xl border border-cyan-400/30">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">
                    Catalog Governance
                  </span>
                  <h3 className="text-base font-black tracking-tight text-white">
                    {editingItem ? `Edit: ${editingItem.name}` : 'Create Master Reference Item'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingItem(null);
                }}
                className="p-2 text-sky-200 hover:text-white hover:bg-cyan-900/50 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveForm} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catalog Category <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={!!editingItem}
                  value={formData.categoryCode}
                  onChange={(e) => setFormData({ ...formData, categoryCode: e.target.value, parentCode: '' })}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none disabled:bg-slate-100"
                >
                  {categories.map(c => (
                    <option key={c.code} value={c.code}>[{c.domain}] {c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Item Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. PRJ_SOLAR_RURAL"
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Solar-Powered Rural Scheme"
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              {/* Hierarchical Parent Item Selection */}
              {parentCategoryCode && potentialParentItems.length > 0 && (
                <div className="p-3 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-1">
                  <label className="block text-xs font-bold text-cyan-950">
                    Parent {categories.find(c => c.code === parentCategoryCode)?.name || 'Reference'}
                  </label>
                  <select
                    value={formData.parentCode || ''}
                    onChange={(e) => setFormData({ ...formData, parentCode: e.target.value })}
                    className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none"
                  >
                    <option value="">-- No Parent (Root Item) --</option>
                    {potentialParentItems.map(p => (
                      <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Operational business definition and usage scope..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="itemActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="itemActiveToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Item is Active for System-wide Selection
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? 'Save Item Changes' : 'Create Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ITEM DETAILS MODAL */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-sky-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">Catalog Reference Details</span>
              <button onClick={() => setViewingItem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Code &amp; Name</span>
                <p className="text-base font-black text-slate-900">{viewingItem.name}</p>
                <p className="font-mono text-cyan-900 font-bold">{viewingItem.code}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Category Code</span>
                  <span className="font-bold text-slate-800">{viewingItem.categoryCode}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Status</span>
                  <span className={`font-bold ${viewingItem.isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {viewingItem.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block font-semibold mb-0.5">Description</span>
                <p className="p-2.5 bg-slate-50 rounded-xl text-slate-700 border border-slate-100 leading-relaxed">
                  {viewingItem.description || 'No description provided.'}
                </p>
              </div>

              {viewingItem.parentCode && (
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold mb-0.5">Parent Reference</span>
                  <span className="p-2 bg-sky-50 text-cyan-900 font-mono font-bold rounded-lg border border-sky-200 block text-center">
                    {viewingItem.parentCode}
                  </span>
                </div>
              )}

              <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 space-y-0.5">
                <p>Created by: {viewingItem.createdBy || 'System'} &bull; {new Date(viewingItem.createdAt).toLocaleDateString()}</p>
                <p>Last updated: {viewingItem.updatedBy || 'System'} &bull; {new Date(viewingItem.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>

            <button
              onClick={() => setViewingItem(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* DATA PROTECTION BLOCK MODAL (PREVENTS PHYSICAL DELETION OF IN-USE RECORDS) */}
      {usageBlockedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-amber-300 shadow-2xl w-full max-w-md p-6 space-y-4 text-slate-800">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Data Protection Integrity Rule
              </h3>
              <p className="text-xs text-slate-600">
                Reference item <strong className="text-slate-900">&quot;{usageBlockedItem.item.name}&quot;</strong> ({usageBlockedItem.item.code}) cannot be physically deleted because it is actively referenced by existing system records.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
              <span className="font-bold block uppercase tracking-wider text-[10px]">Detected In-Use References:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {usageBlockedItem.usage.usageLocations.map((loc: string, i: number) => (
                  <li key={i}>{loc}</li>
                ))}
              </ul>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              To preserve database foreign-key integrity and historical audit trails, please <strong>Deactivate</strong> this record instead. Inactive items will no longer be available for new selections while existing records remain intact.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUsageBlockedItem(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleToggleActive(usageBlockedItem.item);
                  setUsageBlockedItem(null);
                }}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Deactivate Item Instead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
