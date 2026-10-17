import React, { useState, useMemo } from 'react';
import { RoleDefinition, DataScope, User } from '../types';
import { 
  GRANULAR_PERMISSIONS, 
  PERMISSION_MODULES, 
  DATA_SCOPE_DEFINITIONS,
  saveRoleDefinitions,
  DEFAULT_ROLE_DEFINITIONS
} from '../services/accessControlService';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Edit3, 
  Copy, 
  Trash2, 
  Check, 
  X, 
  Info, 
  Users, 
  Lock, 
  Layers, 
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface RoleManagementSectionProps {
  roles: RoleDefinition[];
  onUpdateRoles: (roles: RoleDefinition[]) => void;
  users: User[];
  currentUser?: User;
  onSelectRoleForSimulation?: (roleCode: string) => void;
}

export const RoleManagementSection: React.FC<RoleManagementSectionProps> = ({
  roles,
  onUpdateRoles,
  users,
  currentUser,
  onSelectRoleForSimulation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'System' | 'Custom'>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [viewingRoleDetails, setViewingRoleDetails] = useState<RoleDefinition | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleDefinition | null>(null);

  // Form states for Create/Edit
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    description: string;
    status: 'Active' | 'Inactive';
    defaultDataScope: DataScope;
    organizationScope: string;
    permissions: string[];
    color: string;
  }>({
    code: '',
    name: '',
    description: '',
    status: 'Active',
    defaultDataScope: 'ORGANIZATION',
    organizationScope: 'OWEB Head Office',
    permissions: [],
    color: '#3b82f6',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Module filter inside permissions editor
  const [permissionModuleSearch, setPermissionModuleSearch] = useState('');

  // Map users to roles
  const usersPerRole = useMemo(() => {
    const map = new Map<string, User[]>();
    roles.forEach(r => map.set(r.code, []));

    users.forEach(u => {
      // Primary role
      const primaryCode = `ROLE_${String(u.role).toUpperCase()}`;
      const foundRole = roles.find(r => r.code === primaryCode || r.name.toLowerCase() === String(u.role).toLowerCase() || r.code === String(u.role));
      if (foundRole) {
        const arr = map.get(foundRole.code) || [];
        arr.push(u);
        map.set(foundRole.code, arr);
      }

      // Secondary roles
      if (u.secondaryRoles) {
        u.secondaryRoles.forEach(sec => {
          const secCode = `ROLE_${String(sec).toUpperCase()}`;
          const foundSec = roles.find(r => r.code === secCode || r.name.toLowerCase() === String(sec).toLowerCase() || r.code === String(sec));
          if (foundSec) {
            const arr = map.get(foundSec.code) || [];
            if (!arr.some(item => item.id === u.id)) {
              arr.push(u);
              map.set(foundSec.code, arr);
            }
          }
        });
      }
    });

    return map;
  }, [roles, users]);

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        role.name.toLowerCase().includes(q) || 
        role.code.toLowerCase().includes(q) || 
        role.description.toLowerCase().includes(q);

      const matchesScope = scopeFilter === 'ALL' || role.defaultDataScope === scopeFilter;
      const matchesStatus = statusFilter === 'ALL' || role.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || 
        (typeFilter === 'System' && role.isSystem) || 
        (typeFilter === 'Custom' && !role.isSystem);

      return matchesSearch && matchesScope && matchesStatus && matchesType;
    });
  }, [roles, searchQuery, scopeFilter, statusFilter, typeFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setFormData({
      code: 'ROLE_',
      name: '',
      description: '',
      status: 'Active',
      defaultDataScope: 'ORGANIZATION',
      organizationScope: 'OWEB Head Office',
      permissions: ['projects.view', 'reports.view', 'documents.view'],
      color: '#6366f1',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (role: RoleDefinition) => {
    setEditingRole(role);
    setFormData({
      code: role.code,
      name: role.name,
      description: role.description,
      status: role.status,
      defaultDataScope: role.defaultDataScope,
      organizationScope: role.organizationScope || 'OWEB Directorate',
      permissions: [...role.permissions],
      color: role.color || '#6366f1',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Clone Role
  const handleCloneRole = (role: RoleDefinition) => {
    setEditingRole(null);
    setFormData({
      code: `${role.code}_COPY`.slice(0, 30),
      name: `${role.name} (Copy)`,
      description: `Custom derivative based on ${role.name}. ${role.description}`,
      status: 'Active',
      defaultDataScope: role.defaultDataScope,
      organizationScope: role.organizationScope || '',
      permissions: [...role.permissions],
      color: role.color || '#3b82f6',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Toggle Active/Inactive status
  const handleToggleStatus = (role: RoleDefinition) => {
    if (role.code === 'ROLE_ADMIN') {
      alert('The System Administrator role cannot be deactivated.');
      return;
    }

    const updated = roles.map(r => {
      if (r.id === role.id) {
        return {
          ...r,
          status: r.status === 'Active' ? 'Inactive' : 'Active',
          updatedAt: new Date().toISOString()
        } as RoleDefinition;
      }
      return r;
    });

    onUpdateRoles(updated);
    saveRoleDefinitions(updated);
  };

  // Save Modal (Create or Update)
  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Role Name is required.');
      return;
    }

    const sanitizedCode = formData.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!sanitizedCode.startsWith('ROLE_')) {
      setFormError('Role Code must start with ROLE_ (e.g. ROLE_WATER_ENGINEER).');
      return;
    }

    // Check duplicate code
    const isDuplicate = roles.some(r => r.code === sanitizedCode && r.id !== editingRole?.id);
    if (isDuplicate) {
      setFormError(`Role code "${sanitizedCode}" is already in use by another role.`);
      return;
    }

    if (formData.permissions.length === 0) {
      setFormError('Please select at least one granted permission for this role.');
      return;
    }

    let updatedList: RoleDefinition[];

    if (editingRole) {
      // Update existing
      updatedList = roles.map(r => {
        if (r.id === editingRole.id) {
          return {
            ...r,
            name: formData.name.trim(),
            description: formData.description.trim(),
            status: formData.status,
            defaultDataScope: formData.defaultDataScope,
            organizationScope: formData.organizationScope.trim(),
            permissions: formData.permissions,
            color: formData.color,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      });
    } else {
      // Create new
      const newRole: RoleDefinition = {
        id: `role-custom-${Date.now()}`,
        code: sanitizedCode,
        name: formData.name.trim(),
        description: formData.description.trim() || 'Custom organizational role.',
        status: formData.status,
        defaultDataScope: formData.defaultDataScope,
        organizationScope: formData.organizationScope.trim() || 'General Operations',
        permissions: formData.permissions,
        isSystem: false,
        createdBy: currentUser?.username || 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        color: formData.color,
      };
      updatedList = [...roles, newRole];
    }

    onUpdateRoles(updatedList);
    saveRoleDefinitions(updatedList);
    setIsModalOpen(false);
  };

  // Delete Custom Role
  const handleConfirmDelete = () => {
    if (!deletingRole) return;
    if (deletingRole.isSystem) {
      alert('System-defined core roles cannot be deleted.');
      setDeletingRole(null);
      return;
    }

    const assignedUsers = usersPerRole.get(deletingRole.code) || [];
    if (assignedUsers.length > 0) {
      alert(`Cannot delete this role because it is currently assigned to ${assignedUsers.length} user(s). Reassign them first.`);
      setDeletingRole(null);
      return;
    }

    const updated = roles.filter(r => r.id !== deletingRole.id);
    onUpdateRoles(updated);
    saveRoleDefinitions(updated);
    setDeletingRole(null);
  };

  // Toggle single permission in form
  const handleTogglePermission = (code: string) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(code);
      return {
        ...prev,
        permissions: exists 
          ? prev.permissions.filter(p => p !== code)
          : [...prev.permissions, code]
      };
    });
  };

  // Select / Deselect All for a module
  const handleToggleModulePermissions = (moduleId: string) => {
    const modulePermCodes = GRANULAR_PERMISSIONS.filter(p => p.module === moduleId).map(p => p.code);
    const allSelected = modulePermCodes.every(c => formData.permissions.includes(c));

    setFormData(prev => {
      if (allSelected) {
        return {
          ...prev,
          permissions: prev.permissions.filter(p => !modulePermCodes.includes(p))
        };
      } else {
        const set = new Set([...prev.permissions, ...modulePermCodes]);
        return {
          ...prev,
          permissions: Array.from(set)
        };
      }
    });
  };

  // Select All Everywhere
  const handleSelectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: GRANULAR_PERMISSIONS.map(p => p.code)
    }));
  };

  // Reset to Defaults
  const handleResetToDefaults = () => {
    if (confirm('Reset role definitions to factory default configuration? Any custom roles will be preserved.')) {
      const customOnes = roles.filter(r => !r.isSystem);
      const combined = [...DEFAULT_ROLE_DEFINITIONS, ...customOnes];
      onUpdateRoles(combined);
      saveRoleDefinitions(combined);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Governance Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl ring-1 ring-indigo-500/30">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Centralized Role & Data Scope Governance</h2>
                <p className="text-xs text-indigo-200 mt-0.5">
                  RBAC 3.0: Enterprise Role Definitions, Granular Permissions (Module.Action), and Project-Level Data Access Isolation
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Define operational roles with explicit functional privileges and data scopes. Changes apply instantly to API filtering, record authorization, and navigational capabilities across all OWEB departments.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-center px-2">
              <div className="text-xl font-extrabold text-white">{roles.length}</div>
              <div className="text-[10px] text-slate-400 font-medium">Defined Roles</div>
            </div>
            <div className="text-center px-2 border-l border-slate-700">
              <div className="text-xl font-extrabold text-emerald-400">{roles.filter(r => r.status === 'Active').length}</div>
              <div className="text-[10px] text-slate-400 font-medium">Active Policies</div>
            </div>
            <div className="text-center px-2 border-l border-slate-700">
              <div className="text-xl font-extrabold text-sky-400">{GRANULAR_PERMISSIONS.length}</div>
              <div className="text-[10px] text-slate-400 font-medium">Permissions</div>
            </div>
            <div className="text-center px-2 border-l border-slate-700">
              <div className="text-xl font-extrabold text-amber-400">{roles.filter(r => !r.isSystem).length}</div>
              <div className="text-[10px] text-slate-400 font-medium">Custom Roles</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Action Buttons */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search roles by name, code, description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Scope Filter */}
          <select
            value={scopeFilter}
            onChange={e => setScopeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Data Scopes</option>
            {Object.entries(DATA_SCOPE_DEFINITIONS).map(([scope, meta]) => (
              <option key={scope} value={scope}>{scope}: {meta.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active Roles</option>
            <option value="Inactive">Inactive Roles</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Role Types</option>
            <option value="System">System Built-in</option>
            <option value="Custom">Custom User-Defined</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Restore core default roles"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Custom Role
          </button>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map(role => {
          const scopeDef = DATA_SCOPE_DEFINITIONS[role.defaultDataScope] || DATA_SCOPE_DEFINITIONS.ORGANIZATION;
          const assignedUsers = usersPerRole.get(role.code) || [];
          const isActive = role.status === 'Active';

          return (
            <div 
              key={role.id}
              className={`bg-white rounded-xl border transition-all duration-200 shadow-xs flex flex-col justify-between overflow-hidden ${
                isActive ? 'border-slate-200 hover:border-indigo-300 hover:shadow-md' : 'border-slate-200 opacity-60 bg-slate-50/50'
              }`}
            >
              <div className="p-5 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: role.color || '#4f46e5' }}
                      />
                      <h3 className="font-bold text-slate-900 text-sm">{role.name}</h3>
                      {role.isSystem ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          System
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Custom
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 font-semibold block mt-0.5">
                      {role.code}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px]">
                  {role.description}
                </p>

                {/* Data Scope Tag */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                  <Layers className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Data Scope:</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${scopeDef.badgeClass}`}>
                        {role.defaultDataScope}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate" title={scopeDef.description}>
                      {scopeDef.label}
                    </p>
                  </div>
                </div>

                {/* Capabilities & Stats */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span><strong>{role.permissions.length}</strong> permissions</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 font-medium">
                    <Users className="w-3.5 h-3.5" />
                    <span><strong>{assignedUsers.length}</strong> user{assignedUsers.length === 1 ? '' : 's'}</span>
                  </div>
                </div>

                {/* Assigned Users Avatars Preview */}
                {assignedUsers.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto py-1">
                    {assignedUsers.slice(0, 4).map(u => (
                      <span 
                        key={u.id}
                        className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                        title={`${u.fullName || u.username} (${u.department || 'Staff'})`}
                      >
                        {u.username}
                      </span>
                    ))}
                    {assignedUsers.length > 4 && (
                      <span className="text-[10px] text-slate-400 font-bold">
                        +{assignedUsers.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setViewingRoleDetails(role)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  View Matrix & Permissions
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCloneRole(role)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    title="Clone / Duplicate this role"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(role)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                    title="Edit Role & Permissions"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(role)}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      isActive 
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={isActive ? "Deactivate Role" : "Activate Role"}
                  >
                    {isActive ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  {!role.isSystem && (
                    <button
                      type="button"
                      onClick={() => setDeletingRole(role)}
                      className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Delete Custom Role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRoles.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-700">No matching roles found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, data scope filter, or create a new custom role.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-indigo-700"
          >
            Create New Role
          </button>
        </div>
      )}

      {/* CREATE / EDIT ROLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 my-8">
            <form onSubmit={handleSaveRole}>
              {/* Modal Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold">
                      {editingRole ? `Configure Role: ${editingRole.name}` : 'Provision New System Role'}
                    </h3>
                    <p className="text-xs text-slate-300">
                      Specify identifier, descriptive bounds, default data scope, and granted permissions
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Primary Identifiers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Role Code (Identifier) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      disabled={editingRole?.isSystem}
                      placeholder="e.g. ROLE_SENIOR_HYDROGEOLOGIST"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Must start with ROLE_ and use uppercase letters/underscores.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Role Display Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Senior Hydrogeologist & Drilling Lead"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role Description & Operational Purpose
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe operational responsibilities, regulatory authority, and reporting hierarchy..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Scope & Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Default Data Scope <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.defaultDataScope}
                      onChange={e => setFormData({ ...formData, defaultDataScope: e.target.value as DataScope })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {Object.entries(DATA_SCOPE_DEFINITIONS).map(([scope, meta]) => (
                        <option key={scope} value={scope}>
                          {scope}: {meta.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {DATA_SCOPE_DEFINITIONS[formData.defaultDataScope]?.description}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Organization Scope / Directorate
                    </label>
                    <input
                      type="text"
                      value={formData.organizationScope}
                      onChange={e => setFormData({ ...formData, organizationScope: e.target.value })}
                      placeholder="e.g. Water Supply Directorate / PIU"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Policy Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                      disabled={editingRole?.code === 'ROLE_ADMIN'}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                    >
                      <option value="Active">Active (Permits Sign-In & Operations)</option>
                      <option value="Inactive">Inactive (Suspends Role Authorization)</option>
                    </select>
                  </div>
                </div>

                {/* Granular Permissions Section */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-indigo-600" />
                        Granular Module Permissions ({formData.permissions.length} of {GRANULAR_PERMISSIONS.length} selected)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Toggle specific functional actions granted to holders of this role
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllPermissions}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 cursor-pointer"
                      >
                        Grant All Permissions
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, permissions: [] })}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Modules Accordion / Cards */}
                  <div className="space-y-3 pt-2">
                    {PERMISSION_MODULES.map(module => {
                      const modulePerms = GRANULAR_PERMISSIONS.filter(p => p.module === module.id);
                      const selectedInModule = modulePerms.filter(p => formData.permissions.includes(p.code)).length;
                      const allSelectedInModule = selectedInModule === modulePerms.length;

                      return (
                        <div key={module.id} className="bg-slate-50/80 rounded-xl border border-slate-200/80 overflow-hidden">
                          {/* Module Header */}
                          <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200/80 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-800">{module.label}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                selectedInModule > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {selectedInModule} / {modulePerms.length}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleModulePermissions(module.id)}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                            >
                              {allSelectedInModule ? 'Deselect Module' : 'Select All In Module'}
                            </button>
                          </div>

                          {/* Module Permissions Checkbox Grid */}
                          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {modulePerms.map(perm => {
                              const isChecked = formData.permissions.includes(perm.code);
                              return (
                                <label
                                  key={perm.code}
                                  className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                    isChecked 
                                      ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-medium' 
                                      : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-100/50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleTogglePermission(perm.code)}
                                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <div className="min-w-0">
                                    <div className="font-semibold leading-tight">{perm.label}</div>
                                    <div className="font-mono text-[9px] text-slate-400 mt-0.5">{perm.code}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{perm.description}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  {editingRole ? 'Save Role Changes' : 'Create Role Definition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ROLE DETAILS MODAL */}
      {viewingRoleDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">{viewingRoleDetails.name}</h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    {viewingRoleDetails.code}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{viewingRoleDetails.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingRoleDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Data Scope</span>
                  <span className="font-bold text-slate-800">{viewingRoleDetails.defaultDataScope}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className="font-bold text-emerald-600">{viewingRoleDetails.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Granted Actions</span>
                  <span className="font-bold text-indigo-600">{viewingRoleDetails.permissions.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Type</span>
                  <span className="font-bold text-slate-700">{viewingRoleDetails.isSystem ? 'System Core' : 'Custom'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Active Granted Permissions ({viewingRoleDetails.permissions.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {viewingRoleDetails.permissions.map(code => {
                    const perm = GRANULAR_PERMISSIONS.find(p => p.code === code);
                    return (
                      <div key={code} className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-xs">
                        <div className="font-bold text-emerald-900">{perm?.label || code}</div>
                        <div className="font-mono text-[9px] text-emerald-700">{code}</div>
                        <div className="text-[10px] text-slate-600 mt-0.5">{perm?.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingRoleDetails(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingRole && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Delete Custom Role?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete custom role <strong>{deletingRole.name}</strong> ({deletingRole.code})? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRole(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
