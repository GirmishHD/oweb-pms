import React, { useState, useMemo } from 'react';
import { User, Role, UserStatus, ActivityLog, Project, RoleDefinition, DataScope } from '../types';
import { Section, Input, Select } from './FormControls';
import { NAVIGATION_ITEMS, ROLE_PERMISSIONS, ROLE_DEFINITIONS, DEPARTMENTS, ZONES, ORGANIZATIONS, ENGINEERING_TEAMS, PROGRAMS } from '../constants';
import { loadPrograms } from '../services/programService';
import { loadNgos } from '../services/ngoService';
import RolePermissionMatrix from './RolePermissionMatrix';
import { RoleManagementSection } from './RoleManagementSection';
import { ProjectAssignmentModal } from './ProjectAssignmentModal';
import { UserProfileModal } from './UserProfileModal';
import { 
  DATA_SCOPE_DEFINITIONS, 
  getUserEffectiveScope, 
  canUserAccessProject,
  loadRoleDefinitions,
  saveRoleDefinitions
} from '../services/accessControlService';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Layers, 
  FolderKanban, 
  Eye, 
  Search, 
  Plus, 
  Filter, 
  KeyRound, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Download, 
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

const getAccessibleModules = (role: Role): string[] => {
    return NAVIGATION_ITEMS
        .filter(item => {
            const key = `canView${item.id.charAt(0).toUpperCase() + item.id.slice(1).replace('Mgmt', 'Management')}`;
            return ROLE_PERMISSIONS[key as keyof typeof ROLE_PERMISSIONS]?.includes(role);
        })
        .map(item => item.label);
};

interface UserManagementModuleProps {
    users: User[];
    onAddUser: (user: User) => void;
    onUpdateUser: (user: User) => void;
    onDeleteUser?: (userId: string) => void;
    onResetPassword?: (userId: string, newPass: string) => void;
    onToggleStatus?: (userId: string, status: UserStatus | 'Active' | 'Inactive' | 'Suspended') => void;
    onSimulateRole?: (role: Role) => void;
    currentUser?: User;
    activityLogs?: ActivityLog[];
    roles?: RoleDefinition[];
    onUpdateRoles?: (roles: RoleDefinition[]) => void;
    projects?: Project[];
    onUpdateProject?: (project: Project, msg?: string) => void;
}

// Generate random secure password helper
const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
};

// Add / Edit User Modal
const UserModal: React.FC<{
    userToEdit: User | null;
    onClose: () => void;
    onSave: (user: User) => void;
    currentUser?: User;
    existingUsers: User[];
    projects?: Project[];
    rolesList?: RoleDefinition[];
}> = ({ userToEdit, onClose, onSave, currentUser, existingUsers, projects = [], rolesList = [] }) => {
    const isEditMode = !!userToEdit;
    const [formData, setFormData] = useState<Partial<User>>({
        id: userToEdit?.id || `U-${Date.now()}`,
        username: userToEdit?.username || '',
        fullName: userToEdit?.fullName || '',
        email: userToEdit?.email || '',
        phone: userToEdit?.phone || '',
        role: userToEdit?.role || Role.USER,
        secondaryRoles: userToEdit?.secondaryRoles || [],
        status: userToEdit?.status || UserStatus.ACTIVE,
        department: userToEdit?.department || DEPARTMENTS[0],
        organization: userToEdit?.organization || ORGANIZATIONS[0],
        partnerOrganization: userToEdit?.partnerOrganization || '',
        assignedTeam: userToEdit?.assignedTeam || '',
        assignedZone: userToEdit?.assignedZone || 'All Zones (Regional)',
        assignedWoreda: userToEdit?.assignedWoreda || '',
        assignedProjectIds: userToEdit?.assignedProjectIds || [],
        dataScopeOverride: userToEdit?.dataScopeOverride,
        password: userToEdit?.password || '',
        avatar: userToEdit?.avatar || '',
        createdAt: userToEdit?.createdAt || new Date().toISOString(),
        lastLogin: userToEdit?.lastLogin,
    });

    const [formError, setFormError] = useState<string>('');
    const accessibleModules = useMemo(() => getAccessibleModules(formData.role as Role), [formData.role]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setFormError('');
    };

    const handleToggleSecondaryRole = (roleVal: Role) => {
        setFormData(prev => {
            const current = (prev.secondaryRoles as Role[]) || [];
            const exists = current.includes(roleVal);
            return {
                ...prev,
                secondaryRoles: exists ? current.filter(r => r !== roleVal) : [...current, roleVal]
            };
        });
    };

    const handleToggleProject = (projId: string) => {
        setFormData(prev => {
            const current = prev.assignedProjectIds || [];
            const exists = current.includes(projId);
            return {
                ...prev,
                assignedProjectIds: exists ? current.filter(id => id !== projId) : [...current, projId]
            };
        });
    };

    const handleGeneratePassword = () => {
        const generated = generateSecurePassword();
        setFormData(prev => ({ ...prev, password: generated }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.username?.trim()) {
            setFormError("Username is required.");
            return;
        }

        // Duplicate username check on creation
        if (!isEditMode) {
            const isDuplicate = existingUsers.some(u => u.username.toLowerCase() === formData.username?.trim().toLowerCase());
            if (isDuplicate) {
                setFormError(`Username "${formData.username}" is already in use. Please select a unique username.`);
                return;
            }
            if (!formData.password?.trim()) {
                setFormError("A temporary password is required for new accounts.");
                return;
            }
        }

        const displayName = formData.fullName?.trim() || formData.username?.trim() || 'User';
        const finalAvatar = formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&bold=true`;

        const userToSave: User = {
            id: formData.id!,
            username: formData.username!.trim(),
            fullName: formData.fullName?.trim() || formData.username!.trim(),
            email: formData.email?.trim() || `${formData.username!.trim()}@oweb.gov.et`,
            phone: formData.phone?.trim() || '+251 90 000 0000',
            role: formData.role as Role,
            secondaryRoles: formData.secondaryRoles,
            status: formData.status as UserStatus || UserStatus.ACTIVE,
            department: formData.department || DEPARTMENTS[0],
            organization: formData.organization || ORGANIZATIONS[0],
            partnerOrganization: formData.partnerOrganization,
            assignedTeam: formData.assignedTeam,
            assignedZone: formData.assignedZone || 'All Zones (Regional)',
            assignedWoreda: formData.assignedWoreda,
            assignedProjectIds: formData.assignedProjectIds,
            dataScopeOverride: formData.dataScopeOverride || undefined,
            password: formData.password || userToEdit?.password || 'password',
            avatar: finalAvatar,
            createdAt: formData.createdAt,
            updatedAt: new Date().toISOString(),
            lastLogin: formData.lastLogin,
        };

        onSave(userToSave);
        onClose();
    };

    const isSelfAdmin = isEditMode && userToEdit?.id === currentUser?.id;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-8">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
                                <Users className="w-5 h-5" />
                            </span>
                            <div>
                                <h3 className="text-base font-bold">{isEditMode ? `Edit User: ${userToEdit?.username}` : 'Provision New System User'}</h3>
                                <p className="text-xs text-slate-300">Set identity, roles, organization, assigned projects, and data access scope</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                        {formError && (
                            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        {/* Account Identification */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Username (Login ID)"
                                id="username"
                                name="username"
                                value={formData.username || ''}
                                onChange={handleChange}
                                required
                                disabled={isEditMode}
                                placeholder="e.g. jdoe"
                            />
                            <Input
                                label="Full Legal Name"
                                id="fullName"
                                name="fullName"
                                value={formData.fullName || ''}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Eng. Dawit Alemu"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Official Email"
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={handleChange}
                                placeholder="name@oweb.gov.et"
                            />
                            <Input
                                label="Phone Number"
                                id="phone"
                                name="phone"
                                value={formData.phone || ''}
                                onChange={handleChange}
                                placeholder="+251 91 234 5678"
                            />
                        </div>

                        {/* Primary Role & Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                            <div>
                                <Select
                                    label="Primary System Role (RBAC)"
                                    id="role"
                                    name="role"
                                    value={formData.role || Role.USER}
                                    onChange={handleChange}
                                    options={Object.values(Role)}
                                    required
                                    disabled={isSelfAdmin}
                                    title={isSelfAdmin ? "Admins cannot modify their own role" : ""}
                                />
                                {isSelfAdmin && (
                                    <p className="text-[11px] text-amber-600 mt-1 font-medium">For security, you cannot alter your own admin privileges.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Account Status
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status || UserStatus.ACTIVE}
                                    onChange={handleChange}
                                    disabled={isSelfAdmin}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                                >
                                    <option value={UserStatus.ACTIVE}>Active (Authorized Access)</option>
                                    <option value={UserStatus.INACTIVE}>Inactive (Access Disabled)</option>
                                    <option value={UserStatus.SUSPENDED}>Suspended (Security Hold)</option>
                                </select>
                            </div>
                        </div>

                        {/* Secondary Roles Multi-selector */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Additional / Secondary Roles
                            </label>
                            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                                {Object.values(Role).map(r => {
                                    if (r === formData.role) return null; // already primary
                                    const isSelected = (formData.secondaryRoles as Role[])?.includes(r);
                                    return (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => handleToggleSecondaryRole(r)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                                isSelected 
                                                    ? 'bg-indigo-600 text-white shadow-xs' 
                                                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                                            }`}
                                        >
                                            {isSelected ? '✓ ' : '+ '} {r}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Organization & Scope Placement */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Directorate / Bureau Department
                                </label>
                                <select
                                    id="department"
                                    name="department"
                                    value={formData.department || DEPARTMENTS[0]}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {DEPARTMENTS.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Organization Entity
                                </label>
                                <select
                                    id="organization"
                                    name="organization"
                                    value={formData.organization || ORGANIZATIONS[0]}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {ORGANIZATIONS.map(org => (
                                        <option key={org} value={org}>{org}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Team and Zone */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Assigned Engineering Squad / Team
                                </label>
                                <select
                                    id="assignedTeam"
                                    name="assignedTeam"
                                    value={formData.assignedTeam || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">-- No Specific Squad --</option>
                                    {ENGINEERING_TEAMS.map(team => (
                                        <option key={team} value={team}>{team}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Jurisdiction Zone
                                </label>
                                <select
                                    id="assignedZone"
                                    name="assignedZone"
                                    value={formData.assignedZone || 'All Zones (Regional)'}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="All Zones (Regional)">All Zones (Regional Bureau-Wide)</option>
                                    {ZONES.map(z => (
                                        <option key={z} value={z}>{z} Zone</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Program Scope & Partner Org */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Assigned Bureau Program Scope
                                </label>
                                <select
                                    name="assignedProgram"
                                    value={formData.assignedProgram || 'All Programs (Bureau Level)'}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="All Programs (Bureau Level)">All Programs (Bureau Level)</option>
                                    {Array.from(new Set([...loadPrograms().map(p => p.name), ...PROGRAMS])).map(prog => (
                                        <option key={prog} value={prog}>{prog}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Partner / NGO Organization (If Applicable)
                                </label>
                                <input
                                    type="text"
                                    list="user-registered-ngos-list"
                                    name="partnerOrganization"
                                    value={formData.partnerOrganization || ''}
                                    onChange={handleChange}
                                    placeholder="Select or type NGO (e.g. WaterAid, UNICEF, World Vision)"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <datalist id="user-registered-ngos-list">
                                    {loadNgos().map(n => (
                                        <option key={n.id} value={n.name}>{`${n.name} (${n.code})`}</option>
                                    ))}
                                    {ORGANIZATIONS.map(org => (
                                        <option key={org} value={org}>{org}</option>
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        {/* Data Scope Override */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Data Access Scope Override
                                </label>
                                <select
                                    name="dataScopeOverride"
                                    value={formData.dataScopeOverride || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Default (Inherit from assigned role)</option>
                                    {Object.entries(DATA_SCOPE_DEFINITIONS).map(([scope, meta]) => (
                                        <option key={scope} value={scope}>{scope}: {meta.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Assigned Projects Direct Allocation */}
                        <div className="pt-2 border-t border-slate-100">
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Assigned Projects &amp; Schemes ({formData.assignedProjectIds?.length || 0} selected)
                            </label>
                            <p className="text-[11px] text-slate-500 mb-2">
                                For Engineers, Supervisors, and Contractors: user can only see and manage schemes checked below.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                                {projects.map(proj => {
                                    const isChecked = formData.assignedProjectIds?.includes(proj.id);
                                    return (
                                        <label
                                            key={proj.id}
                                            className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                                                isChecked ? 'bg-indigo-50 border-indigo-200 font-semibold text-indigo-900' : 'bg-white border-slate-200/80 text-slate-700'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggleProject(proj.id)}
                                                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                            />
                                            <div className="min-w-0 truncate">
                                                <span className="truncate block font-semibold">{proj.name}</span>
                                                <span className="text-[10px] text-slate-400 block font-normal">{proj.id} • {proj.zone}</span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Password Configuration */}
                        <div className="pt-2 border-t border-slate-100">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                {isEditMode ? 'Change Password (Optional)' : 'Initial Temporary Password'}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="password"
                                    value={formData.password || ''}
                                    onChange={handleChange}
                                    placeholder={isEditMode ? "Leave blank to keep existing password" : "Enter or generate temporary password"}
                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleGeneratePassword}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                    Generate
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            {isEditMode ? 'Save Changes' : 'Provision User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Password Reset Modal
const PasswordResetModal: React.FC<{
    user: User;
    onClose: () => void;
    onReset: (newPass: string) => void;
}> = ({ user, onClose, onReset }) => {
    const [newPassword, setNewPassword] = useState<string>(generateSecurePassword());
    const [isCopied, setIsCopied] = useState<boolean>(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(newPassword);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleConfirm = () => {
        if (!newPassword.trim()) {
            alert("Password cannot be empty.");
            return;
        }
        onReset(newPassword);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                <div className="p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center gap-3">
                    <span className="p-2 bg-amber-500/30 rounded-lg">
                        <KeyRound className="w-5 h-5 text-white" />
                    </span>
                    <div>
                        <h3 className="text-base font-bold">Reset Password</h3>
                        <p className="text-xs text-amber-100">Set new credentials for user: {user.username}</p>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                            <p className="text-xs font-bold text-slate-800">{user.fullName || user.username}</p>
                            <p className="text-[11px] text-slate-500">@{user.username} • {user.role}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            New Generated Temporary Password
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                                {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setNewPassword(generateSecurePassword())}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                                title="Regenerate"
                            >
                                ⟳
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500">
                        Provide this password to the user. The previous password will immediately stop working.
                    </p>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                    >
                        Confirm & Apply Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

// Delete User Confirmation Modal
const DeleteUserModal: React.FC<{
    user: User;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ user, onClose, onConfirm }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-5 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center gap-3">
                <span className="p-2 bg-rose-500/30 rounded-lg">
                    <Trash2 className="w-5 h-5 text-white" />
                </span>
                <div>
                    <h3 className="text-base font-bold">Delete User Account</h3>
                    <p className="text-xs text-rose-100">Permanent security revocation</p>
                </div>
            </div>

            <div className="p-6 space-y-4">
                <p className="text-sm text-slate-700">
                    Are you sure you want to permanently delete the user account for <strong className="text-slate-900">{user.fullName || user.username}</strong> (@{user.username})?
                </p>
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl space-y-1">
                    <p className="font-bold">⚠️ Warning: Irreversible Action</p>
                    <p>This will revoke all role credentials and prevent this user from accessing OWEB PB-PMS. Past project submission records and logs created by this user will remain for audit trails.</p>
                </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
                >
                    Delete User
                </button>
            </div>
        </div>
    </div>
);

const UserManagementModule: React.FC<UserManagementModuleProps> = ({
    users,
    onAddUser,
    onUpdateUser,
    onDeleteUser,
    onResetPassword,
    onToggleStatus,
    onSimulateRole,
    currentUser,
    activityLogs = [],
    roles: externalRoles,
    onUpdateRoles: externalOnUpdateRoles,
    projects = [],
    onUpdateProject
}) => {
    const [activeTab, setActiveTab] = useState<'accounts' | 'roles' | 'matrix' | 'assignments' | 'simulator' | 'audit'>('accounts');
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [viewingProfileUser, setViewingProfileUser] = useState<User | null>(null);
    const [resettingUser, setResettingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [assigningProject, setAssigningProject] = useState<Project | null>(null);

    // Internal roles management state if not provided externally
    const [internalRoles, setInternalRoles] = useState<RoleDefinition[]>(() => loadRoleDefinitions());
    const roles = externalRoles || internalRoles;
    const handleUpdateRoles = (newRoles: RoleDefinition[]) => {
        if (externalOnUpdateRoles) {
            externalOnUpdateRoles(newRoles);
        } else {
            setInternalRoles(newRoles);
            saveRoleDefinitions(newRoles);
        }
    };

    // User Accounts Filters
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [scopeFilter, setScopeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

    // Simulator user tester state
    const [simulatorSelectedUser, setSimulatorSelectedUser] = useState<string>(users[0]?.username || 'admin');

    // Audit Log Filters
    const [auditUserFilter, setAuditUserFilter] = useState<string>('ALL');
    const [auditStartDate, setAuditStartDate] = useState<string>('');
    const [auditEndDate, setAuditEndDate] = useState<string>('');
    const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
    const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

    // KPI Metrics calculation
    const totalUsers = users.length;
    const activeUsersCount = users.filter(u => u.status === UserStatus.ACTIVE || u.status === 'Active' || !u.status).length;
    const inactiveUsersCount = users.filter(u => u.status === UserStatus.INACTIVE || u.status === 'Inactive').length;
    const suspendedUsersCount = users.filter(u => u.status === UserStatus.SUSPENDED || u.status === 'Suspended').length;

    // Unique user list across both users table and activity logs
    const uniqueAuditUsers = useMemo(() => {
        const userSet = new Set<string>();
        users.forEach(u => {
            if (u.username) userSet.add(u.username);
        });
        activityLogs.forEach(l => {
            if (l.user) userSet.add(l.user);
        });
        return Array.from(userSet).sort();
    }, [users, activityLogs]);

    // Filtered Users List
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = searchQuery === '' || 
                user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.phone && user.phone.includes(searchQuery));
            
            const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
            
            const userStatus = user.status || UserStatus.ACTIVE;
            const matchesStatus = statusFilter === 'ALL' || userStatus === statusFilter;
            
            const matchesDept = departmentFilter === 'ALL' || (user.department && user.department === departmentFilter);

            const effectiveScope = getUserEffectiveScope(user, roles);
            const matchesScope = scopeFilter === 'ALL' || effectiveScope === scopeFilter;

            return matchesSearch && matchesRole && matchesStatus && matchesDept && matchesScope;
        });
    }, [users, searchQuery, roleFilter, statusFilter, departmentFilter, scopeFilter, roles]);

    // Filtered Audit Logs List
    const filteredAuditLogs = useMemo(() => {
        return activityLogs.filter(log => {
            if (auditUserFilter !== 'ALL' && log.user.toLowerCase() !== auditUserFilter.toLowerCase()) {
                return false;
            }

            if (auditStartDate) {
                const logTime = new Date(log.timestamp).getTime();
                const startTime = new Date(auditStartDate + 'T00:00:00').getTime();
                if (!isNaN(logTime) && !isNaN(startTime) && logTime < startTime) {
                    return false;
                }
            }

            if (auditEndDate) {
                const logTime = new Date(log.timestamp).getTime();
                const endTime = new Date(auditEndDate + 'T23:59:59').getTime();
                if (!isNaN(logTime) && !isNaN(endTime) && logTime > endTime) {
                    return false;
                }
            }

            if (auditActionFilter !== 'ALL') {
                const act = log.action.toLowerCase();
                if (auditActionFilter === 'LOGIN' && !act.includes('log') && !act.includes('session')) return false;
                if (auditActionFilter === 'CREATION' && !act.includes('create') && !act.includes('add')) return false;
                if (auditActionFilter === 'UPDATE' && !act.includes('update') && !act.includes('edit') && !act.includes('approv')) return false;
                if (auditActionFilter === 'SECURITY' && !act.includes('password') && !act.includes('role') && !act.includes('status')) return false;
                if (auditActionFilter === 'DELETE' && !act.includes('delete') && !act.includes('remov')) return false;
            }

            if (auditSearchQuery) {
                const q = auditSearchQuery.toLowerCase();
                const matchesLog = log.action.toLowerCase().includes(q) ||
                    (log.details && log.details.toLowerCase().includes(q)) ||
                    (log.targetType && log.targetType.toLowerCase().includes(q)) ||
                    (log.targetId && log.targetId.toLowerCase().includes(q));
                if (!matchesLog) return false;
            }

            return true;
        });
    }, [activityLogs, auditUserFilter, auditStartDate, auditEndDate, auditActionFilter, auditSearchQuery]);

    // Export Users CSV
    const handleExportCSV = () => {
        const headers = ["ID", "Username", "Full Name", "Email", "Phone", "Primary Role", "Secondary Roles", "Status", "Data Scope", "Department", "Zone", "Assigned Projects", "Created Date", "Last Login"];
        const rows = filteredUsers.map(u => [
            u.id,
            u.username,
            `"${u.fullName || ''}"`,
            u.email || '',
            u.phone || '',
            u.role,
            `"${(u.secondaryRoles || []).join(', ')}"`,
            u.status || 'Active',
            getUserEffectiveScope(u, roles),
            `"${u.department || ''}"`,
            `"${u.assignedZone || ''}"`,
            `"${(u.assignedProjectIds || []).join('; ')}"`,
            u.createdAt || '',
            u.lastLogin || ''
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `oweb_user_directory_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Export Audit Logs CSV
    const handleExportAuditLogs = () => {
        const headers = ["Timestamp", "User", "Action", "Target Type", "Target ID", "Details"];
        const rows = filteredAuditLogs.map(l => [
            `"${new Date(l.timestamp).toLocaleString()}"`,
            l.user,
            `"${l.action.replace(/"/g, '""')}"`,
            l.targetType || '',
            l.targetId || '',
            `"${(l.details || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `oweb_security_audit_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Simulated user data access evaluation
    const simulatedUserObj = useMemo(() => {
        return users.find(u => u.username === simulatorSelectedUser) || users[0];
    }, [users, simulatorSelectedUser]);

    const simulatedAccessibleProjects = useMemo(() => {
        if (!simulatedUserObj) return [];
        return projects.filter(p => canUserAccessProject(simulatedUserObj, p, roles));
    }, [projects, simulatedUserObj, roles]);

    const simulatedInaccessibleProjects = useMemo(() => {
        if (!simulatedUserObj) return [];
        return projects.filter(p => !canUserAccessProject(simulatedUserObj, p, roles));
    }, [projects, simulatedUserObj, roles]);

    return (
        <div className="space-y-6">
            {/* Top KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">{totalUsers}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{roles.length} Active System Roles</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Users className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Accounts</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{activeUsersCount}</p>
                        <p className="text-[11px] text-emerald-700 font-medium mt-1">
                            {totalUsers > 0 ? Math.round((activeUsersCount / totalUsers) * 100) : 0}% active authorization
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <UserCheck className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Data Scoping</p>
                        <p className="text-2xl font-black text-amber-600 mt-1">7 Scopes</p>
                        <p className="text-[11px] text-slate-400 mt-1">Strict project-level access enforced</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Layers className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin Session</p>
                        <p className="text-base font-bold text-slate-800 mt-1 truncate max-w-[140px]">{currentUser?.username || 'Administrator'}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {currentUser?.role || Role.ADMIN}
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                        <img src={currentUser?.avatar || 'https://ui-avatars.com/api/?name=Admin&background=random&color=fff&bold=true'} alt={currentUser?.username || 'User'} className="w-10 h-10 rounded-lg object-cover" />
                    </div>
                </div>
            </div>

            {/* Navigation Sub-Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="flex border-b border-slate-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('accounts')}
                        className={`flex items-center gap-2 px-6 py-4 font-semibold text-xs transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'accounts'
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20 font-bold'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        User Directory & Accounts ({users.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('roles')}
                        className={`flex items-center gap-2 px-6 py-4 font-semibold text-xs transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'roles'
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20 font-bold'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        Role & Data Scope Governance ({roles.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('matrix')}
                        className={`flex items-center gap-2 px-6 py-4 font-semibold text-xs transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'matrix'
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20 font-bold'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Layers className="w-4 h-4" />
                        RBAC Permissions Matrix
                    </button>

                    <button
                        onClick={() => setActiveTab('assignments')}
                        className={`flex items-center gap-2 px-6 py-4 font-semibold text-xs transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'assignments'
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20 font-bold'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <FolderKanban className="w-4 h-4" />
                        Project Access & Engineer Allocations ({projects.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('simulator')}
                        className={`flex items-center gap-2 px-6 py-4 font-semibold text-xs transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'simulator'
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20 font-bold'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Eye className="w-4 h-4" />
                        Data Scope Isolation Simulator
                    </button>

                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`flex items-center gap-2 px-6 py-4 font-semibold text-xs transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'audit'
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20 font-bold'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Clock className="w-4 h-4" />
                        Security Audit Logs ({filteredAuditLogs.length})
                    </button>
                </div>
            </div>

            {/* TAB 1: USER DIRECTORY & ACCOUNTS */}
            {activeTab === 'accounts' && (
                <div className="space-y-4">
                    {/* Control and Filter Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto flex-1">
                            {/* Search Input */}
                            <div className="relative flex-1 md:w-60 min-w-[200px]">
                                <input
                                    type="text"
                                    placeholder="Search users by name, username, email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            </div>

                            {/* Filter by Role */}
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="ALL">All Roles ({users.length})</option>
                                {Object.values(Role).map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>

                            {/* Filter by Data Scope */}
                            <select
                                value={scopeFilter}
                                onChange={(e) => setScopeFilter(e.target.value)}
                                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="ALL">All Data Scopes</option>
                                {Object.keys(DATA_SCOPE_DEFINITIONS).map(scope => (
                                    <option key={scope} value={scope}>{scope}</option>
                                ))}
                            </select>

                            {/* Filter by Status */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value={UserStatus.ACTIVE}>Active</option>
                                <option value={UserStatus.INACTIVE}>Inactive</option>
                                <option value={UserStatus.SUSPENDED}>Suspended</option>
                            </select>

                            {/* Filter by Department */}
                            <select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[180px] truncate"
                            >
                                <option value="ALL">All Departments</option>
                                {DEPARTMENTS.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            <button
                                onClick={handleExportCSV}
                                className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                                title="Export User List to CSV"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>

                            <button
                                onClick={() => {
                                    setEditingUser(null);
                                    setIsAddEditModalOpen(true);
                                }}
                                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                Provision User
                            </button>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">User &amp; Identity</th>
                                        <th className="px-4 py-4">Role &amp; Secondary</th>
                                        <th className="px-4 py-4">Data Access Scope</th>
                                        <th className="px-4 py-4">Organization &amp; Team</th>
                                        <th className="px-4 py-4 text-center">Assigned Projects</th>
                                        <th className="px-4 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Users className="w-10 h-10 text-slate-300 mb-2" />
                                                    <p className="font-semibold text-slate-700">No users found matching your filters</p>
                                                    <p className="text-xs text-slate-400 mt-1">Try broadening your search term or clearing filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => {
                                            const roleDef = ROLE_DEFINITIONS[user.role];
                                            const isCurrentUser = !!currentUser && user.id === currentUser.id;
                                            const userStatus = user.status || UserStatus.ACTIVE;
                                            const effectiveScope = getUserEffectiveScope(user, roles);
                                            const scopeBadge = DATA_SCOPE_DEFINITIONS[effectiveScope]?.badgeClass || 'bg-slate-100 text-slate-800';

                                            const userAssignedCount = (user.assignedProjectIds && user.assignedProjectIds.length) || 0;

                                            return (
                                                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                                                    {/* User & Identity */}
                                                    <td className="px-6 py-4">
                                                        <div 
                                                            className="flex items-center gap-3 cursor-pointer group"
                                                            onClick={() => setViewingProfileUser(user)}
                                                        >
                                                            <div className="relative">
                                                                <img
                                                                    src={user.avatar}
                                                                    alt={user.username}
                                                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-indigo-400 transition-all"
                                                                />
                                                                <span
                                                                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                                                        userStatus === UserStatus.ACTIVE || userStatus === 'Active'
                                                                            ? 'bg-emerald-500'
                                                                            : userStatus === UserStatus.SUSPENDED || userStatus === 'Suspended'
                                                                            ? 'bg-rose-500'
                                                                            : 'bg-slate-400'
                                                                    }`}
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                                                                    {user.fullName || user.username}
                                                                    {isCurrentUser && (
                                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                                                                            You
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-slate-500 font-mono">
                                                                    @{user.username} • {user.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Role & Secondary */}
                                                    <td className="px-4 py-4">
                                                        <div className="space-y-1">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${roleDef?.bgBadge || 'bg-slate-100'} ${roleDef?.textBadge || 'text-slate-700'}`}>
                                                                {roleDef?.label || user.role}
                                                            </span>
                                                            {user.secondaryRoles && user.secondaryRoles.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {user.secondaryRoles.map((sec, i) => (
                                                                        <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                                                            +{sec}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Data Scope */}
                                                    <td className="px-4 py-4">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${scopeBadge}`}>
                                                            {effectiveScope}
                                                        </span>
                                                        <p className="text-[10px] text-slate-500 mt-0.5 max-w-[140px] truncate" title={DATA_SCOPE_DEFINITIONS[effectiveScope]?.description}>
                                                            {DATA_SCOPE_DEFINITIONS[effectiveScope]?.label}
                                                        </p>
                                                    </td>

                                                    {/* Department & Team */}
                                                    <td className="px-4 py-4">
                                                        <div className="text-xs font-semibold text-slate-800 truncate max-w-[180px]">
                                                            {user.department || user.organization || 'OWEB Head Office'}
                                                        </div>
                                                        {user.assignedProgram && user.assignedProgram !== 'All Programs (Bureau Level)' && (
                                                            <div className="text-[10px] text-sky-700 font-bold truncate max-w-[180px] mt-0.5">
                                                                📁 {user.assignedProgram}
                                                            </div>
                                                        )}
                                                        {user.assignedTeam && (
                                                            <div className="text-[10px] text-purple-700 font-medium truncate max-w-[180px] mt-0.5">
                                                                👥 {user.assignedTeam}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Assigned Projects */}
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                                                            userAssignedCount > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-400'
                                                        }`}>
                                                            {userAssignedCount} scheme{userAssignedCount === 1 ? '' : 's'}
                                                        </span>
                                                    </td>

                                                    {/* Status & Instant Toggle */}
                                                    <td className="px-4 py-4 text-center">
                                                        {onToggleStatus ? (
                                                            <button
                                                                type="button"
                                                                disabled={isCurrentUser}
                                                                onClick={() => {
                                                                    const nextStatus = userStatus === UserStatus.ACTIVE || userStatus === 'Active'
                                                                        ? UserStatus.INACTIVE
                                                                        : UserStatus.ACTIVE;
                                                                    onToggleStatus(user.id, nextStatus);
                                                                }}
                                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                                                                    userStatus === UserStatus.ACTIVE || userStatus === 'Active'
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                                        : userStatus === UserStatus.SUSPENDED || userStatus === 'Suspended'
                                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                                                        : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                                                                } ${isCurrentUser ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                title={isCurrentUser ? "Cannot deactivate yourself" : "Click to toggle active/inactive status"}
                                                            >
                                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                                    userStatus === UserStatus.ACTIVE || userStatus === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
                                                                }`} />
                                                                {userStatus}
                                                            </button>
                                                        ) : (
                                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                                                {userStatus}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Actions Toolbar */}
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {/* View Profile */}
                                                            <button
                                                                onClick={() => setViewingProfileUser(user)}
                                                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                                                                title="View Full User Profile & Granted Permissions"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>

                                                            {/* Edit */}
                                                            <button
                                                                onClick={() => {
                                                                    setEditingUser(user);
                                                                    setIsAddEditModalOpen(true);
                                                                }}
                                                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                                                                title="Edit User Details, Role & Projects"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>

                                                            {/* Reset Password */}
                                                            {onResetPassword && (
                                                                <button
                                                                    onClick={() => setResettingUser(user)}
                                                                    className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                                                                    title="Reset Password"
                                                                >
                                                                    <KeyRound className="w-4 h-4" />
                                                                </button>
                                                            )}

                                                            {/* Delete */}
                                                            {onDeleteUser && (
                                                                <button
                                                                    disabled={isCurrentUser}
                                                                    onClick={() => setDeletingUser(user)}
                                                                    className={`p-1.5 rounded-md transition-colors ${
                                                                        isCurrentUser
                                                                            ? 'text-slate-300 cursor-not-allowed'
                                                                            : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                                                                    }`}
                                                                    title={isCurrentUser ? "Cannot delete yourself" : "Delete User Account"}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: ROLE & DATA SCOPE GOVERNANCE */}
            {activeTab === 'roles' && (
                <RoleManagementSection
                    roles={roles}
                    onUpdateRoles={handleUpdateRoles}
                    users={users}
                    currentUser={currentUser}
                    onSelectRoleForSimulation={onSimulateRole as any}
                />
            )}

            {/* TAB 3: RBAC PERMISSIONS MATRIX */}
            {activeTab === 'matrix' && (
                <RolePermissionMatrix />
            )}

            {/* TAB 4: PROJECT ACCESS & ENGINEER ALLOCATIONS */}
            {activeTab === 'assignments' && (
                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 bg-indigo-500/30 text-indigo-300 rounded-xl">
                                <FolderKanban className="w-6 h-6" />
                            </span>
                            <div>
                                <h3 className="text-base font-bold">Project Staffing &amp; Data Access Allocations</h3>
                                <p className="text-xs text-slate-300 mt-0.5">
                                    Project → Staff Assignment → Real-Time Access Grant: Assign Lead Engineers, Supervisors, and Team Leaders to enforce strict record access scoping.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Project Scheme</th>
                                        <th className="px-4 py-4">Location</th>
                                        <th className="px-4 py-4">Lead Engineer (Assigned)</th>
                                        <th className="px-4 py-4">Supervising Engineer</th>
                                        <th className="px-4 py-4">Team Leader &amp; Squad</th>
                                        <th className="px-4 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {projects.map(proj => {
                                        const engUser = users.find(u => u.id === proj.assignedEngineerId || u.username === proj.assignedEngineerId);
                                        const supUser = users.find(u => u.id === proj.assignedSupervisorId || u.username === proj.assignedSupervisorId);
                                        const tlUser = users.find(u => u.id === proj.assignedTeamLeaderId || u.username === proj.assignedTeamLeaderId);

                                        return (
                                            <tr key={proj.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800 text-xs">{proj.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{proj.id} • {proj.program}</div>
                                                </td>
                                                <td className="px-4 py-4 text-xs text-slate-600">
                                                    <div>{proj.zone} Zone</div>
                                                    <div className="text-[11px] text-slate-400">{proj.woreda}, {proj.kebele}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {engUser || proj.assignedEngineerName ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                                            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                                                            {proj.assignedEngineerName || engUser?.fullName || engUser?.username}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">No Lead Engineer</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {supUser || proj.assignedSupervisorName ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                                                            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                                                            {proj.assignedSupervisorName || supUser?.fullName || supUser?.username}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">No Supervisor</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-xs">
                                                    <div className="font-semibold text-slate-700">
                                                        {tlUser ? (tlUser.fullName || tlUser.username) : '—'}
                                                    </div>
                                                    <div className="text-[10px] text-purple-700">
                                                        {proj.assignedTeam || 'No Squad Assigned'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                                        {proj.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setAssigningProject(proj)}
                                                        className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                                                    >
                                                        Reassign Staff &amp; Access
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 5: DATA SCOPE ISOLATION SIMULATOR */}
            {activeTab === 'simulator' && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="p-2.5 bg-indigo-500/30 text-indigo-300 rounded-xl">
                                    <Eye className="w-6 h-6" />
                                </span>
                                <div>
                                    <h3 className="text-base font-bold">Data Scope Isolation &amp; Live Security Tester</h3>
                                    <p className="text-xs text-slate-300 mt-1">
                                        Test and verify how project data scoping restricts visibility for each user and role in real-time.
                                    </p>
                                </div>
                            </div>

                            {/* User Selector */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-300 font-semibold whitespace-nowrap">Simulate User:</span>
                                <select
                                    value={simulatorSelectedUser}
                                    onChange={e => setSimulatorSelectedUser(e.target.value)}
                                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                >
                                    {users.map(u => (
                                        <option key={u.id} value={u.username}>
                                            @{u.username} • {u.fullName || u.username} ({u.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Simulation Result Header */}
                    {simulatedUserObj && (
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <span>User: <strong>{simulatedUserObj.fullName || simulatedUserObj.username}</strong> (@{simulatedUserObj.username})</span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                            {simulatedUserObj.role}
                                        </span>
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Department: {simulatedUserObj.department || 'OWEB'} • Zone: {simulatedUserObj.assignedZone || 'All'} • Squad: {simulatedUserObj.assignedTeam || 'None'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Effective Data Scope</span>
                                        <span className="text-xs font-bold text-indigo-700">
                                            {getUserEffectiveScope(simulatedUserObj, roles)}
                                        </span>
                                    </div>
                                    <div className="text-right pl-3 border-l border-slate-200">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Accessible Schemes</span>
                                        <span className="text-xs font-bold text-emerald-600">
                                            {simulatedAccessibleProjects.length} of {projects.length}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed">
                                {DATA_SCOPE_DEFINITIONS[getUserEffectiveScope(simulatedUserObj, roles)]?.description}
                            </p>
                        </div>
                    )}

                    {/* Accessible vs Inaccessible Projects Split */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* ACCESSIBLE */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    Accessible Projects ({simulatedAccessibleProjects.length})
                                </h4>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    Visible &amp; Actionable
                                </span>
                            </div>

                            <div className="space-y-2">
                                {simulatedAccessibleProjects.map(p => (
                                    <div key={p.id} className="p-3 bg-white rounded-xl border border-emerald-200 shadow-xs text-xs space-y-1">
                                        <div className="font-bold text-slate-900">{p.name}</div>
                                        <div className="text-[10px] text-slate-500">{p.id} • {p.zone}, {p.woreda}</div>
                                        <div className="text-[11px] text-emerald-700 font-medium pt-1 border-t border-slate-100 flex items-center justify-between">
                                            <span>Engineer: {p.assignedEngineerName || p.assignedEngineerId || 'None'}</span>
                                            <span className="font-mono">{p.status}</span>
                                        </div>
                                    </div>
                                ))}
                                {simulatedAccessibleProjects.length === 0 && (
                                    <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                                        No projects match this user's data scope.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RESTRICTED */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <XCircle className="w-4 h-4 text-rose-600" />
                                    Strictly Restricted / Hidden Projects ({simulatedInaccessibleProjects.length})
                                </h4>
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                    Blocked by RBAC Scope
                                </span>
                            </div>

                            <div className="space-y-2 opacity-75">
                                {simulatedInaccessibleProjects.map(p => (
                                    <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                                        <div className="font-bold text-slate-700 flex items-center gap-1.5">
                                            <span className="text-slate-400">🔒</span>
                                            <span>{p.name}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400">{p.id} • {p.zone}, {p.woreda}</div>
                                        <div className="text-[10px] text-rose-600 italic pt-1 border-t border-slate-100">
                                            Restricted: User is neither assigned engineer nor in authorized scope.
                                        </div>
                                    </div>
                                ))}
                                {simulatedInaccessibleProjects.length === 0 && (
                                    <div className="p-6 bg-emerald-50 rounded-xl border border-dashed border-emerald-200 text-center text-xs text-emerald-800">
                                        All projects are accessible under Bureau-Wide (ALL) scope.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 6: SECURITY & ACTIVITY AUDIT LOGS */}
            {activeTab === 'audit' && (
                <div className="space-y-4">
                    {/* Header & Export Action Bar */}
                    <div className="bg-white rounded-2xl border border-sky-100 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            <span className="p-2.5 bg-gradient-to-tr from-cyan-600 to-sky-600 text-white rounded-xl shadow-xs">
                                <Clock className="w-5 h-5" />
                            </span>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">System Activity &amp; Security Audit Logs</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Auditable log of logins, record creation, role adjustments, password resets, and access events
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                            <button
                                type="button"
                                onClick={handleExportAuditLogs}
                                className="w-full md:w-auto px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                <span>Export Audit Log ({filteredAuditLogs.length} Records)</span>
                            </button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white rounded-2xl border border-sky-100 shadow-xs p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">User</label>
                            <select
                                value={auditUserFilter}
                                onChange={(e) => setAuditUserFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            >
                                <option value="ALL">All Users ({uniqueAuditUsers.length})</option>
                                {uniqueAuditUsers.map(uname => (
                                    <option key={uname} value={uname}>@{uname}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Action Category</label>
                            <select
                                value={auditActionFilter}
                                onChange={(e) => setAuditActionFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            >
                                <option value="ALL">All Action Types</option>
                                <option value="LOGIN">Logins &amp; User Sessions</option>
                                <option value="CREATION">Record Creation</option>
                                <option value="UPDATE">Updates &amp; Approvals</option>
                                <option value="SECURITY">Security, Roles &amp; Passwords</option>
                                <option value="DELETE">Deletions</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">From Date</label>
                            <input
                                type="date"
                                value={auditStartDate}
                                onChange={(e) => setAuditStartDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">To Date</label>
                            <input
                                type="date"
                                value={auditEndDate}
                                onChange={(e) => setAuditEndDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-4 py-4">Actor</th>
                                        <th className="px-4 py-4">Action</th>
                                        <th className="px-4 py-4">Target</th>
                                        <th className="px-6 py-4">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAuditLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-slate-500 text-xs">
                                                No audit entries match the current filter criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAuditLogs.map(log => (
                                            <tr key={log.id} className="hover:bg-slate-50 transition-colors text-xs">
                                                <td className="px-6 py-3 font-mono text-slate-500 whitespace-nowrap">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 font-bold text-slate-800">
                                                    @{log.user}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-indigo-700">
                                                    {log.action}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {log.targetType || '—'} {log.targetId ? `(${log.targetId})` : ''}
                                                </td>
                                                <td className="px-6 py-3 text-slate-500 max-w-xs truncate">
                                                    {log.details || '—'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS */}
            {isAddEditModalOpen && (
                <UserModal
                    userToEdit={editingUser}
                    onClose={() => {
                        setIsAddEditModalOpen(false);
                        setEditingUser(null);
                    }}
                    onSave={(u) => {
                        if (editingUser) {
                            onUpdateUser(u);
                        } else {
                            onAddUser(u);
                        }
                    }}
                    currentUser={currentUser}
                    existingUsers={users}
                    projects={projects}
                    rolesList={roles}
                />
            )}

            {resettingUser && onResetPassword && (
                <PasswordResetModal
                    user={resettingUser}
                    onClose={() => setResettingUser(null)}
                    onReset={(newPass) => onResetPassword(resettingUser.id, newPass)}
                />
            )}

            {deletingUser && onDeleteUser && (
                <DeleteUserModal
                    user={deletingUser}
                    onClose={() => setDeletingUser(null)}
                    onConfirm={() => {
                        onDeleteUser(deletingUser.id);
                        setDeletingUser(null);
                    }}
                />
            )}

            {viewingProfileUser && (
                <UserProfileModal
                    isOpen={!!viewingProfileUser}
                    onClose={() => setViewingProfileUser(null)}
                    user={viewingProfileUser}
                    onLogout={() => {}}
                    projects={projects}
                />
            )}

            {assigningProject && (
                <ProjectAssignmentModal
                    project={assigningProject}
                    users={users}
                    onClose={() => setAssigningProject(null)}
                    onSaveAssignment={(upProj, notifMsg) => {
                        if (onUpdateProject) {
                            onUpdateProject(upProj, notifMsg);
                        }
                        setAssigningProject(null);
                    }}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};

export default UserManagementModule;
