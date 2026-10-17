import React, { useState } from 'react';
import { User, Role, Project, DataScope } from '../types';
import { ROLE_DEFINITIONS } from '../constants';
import { 
  getUserEffectiveScope, 
  getUserPermissions, 
  DATA_SCOPE_DEFINITIONS,
  PERMISSION_MODULES,
  GRANULAR_PERMISSIONS
} from '../services/accessControlService';
import { 
  ShieldCheck, 
  Lock, 
  FolderKanban, 
  Users, 
  MapPin, 
  Layers, 
  Building2, 
  CheckCircle2, 
  Calendar,
  X,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onLogout: () => void;
    onSimulateRole?: (role: Role) => void;
    originalUser?: User | null;
    projects?: Project[];
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
    isOpen,
    onClose,
    user,
    onLogout,
    onSimulateRole,
    originalUser,
    projects = []
}) => {
    const [showPermissions, setShowPermissions] = useState(false);
    const [expandedModule, setExpandedModule] = useState<string | null>(null);

    if (!isOpen) return null;

    const roleMeta = ROLE_DEFINITIONS[user.role];
    const isAdminOrSimulated = user.role === Role.ADMIN || (originalUser && originalUser.role === Role.ADMIN);
    const effectiveScope = getUserEffectiveScope(user);
    const scopeDef = DATA_SCOPE_DEFINITIONS[effectiveScope] || DATA_SCOPE_DEFINITIONS.ORGANIZATION;
    const permissions = getUserPermissions(user);

    // Assigned projects for this user
    const safeProjects = Array.isArray(projects) ? projects : [];
    const assignedProjects = safeProjects.filter(p => {
        const username = user.username?.toLowerCase();
        const userId = user.id?.toLowerCase();
        const isEng = (p.assignedEngineerId && (p.assignedEngineerId.toLowerCase() === userId || p.assignedEngineerId.toLowerCase() === username)) ||
            (p.assignedEngineerName && user.fullName && p.assignedEngineerName.toLowerCase() === user.fullName.toLowerCase());
        const isSup = (p.assignedSupervisorId && (p.assignedSupervisorId.toLowerCase() === userId || p.assignedSupervisorId.toLowerCase() === username)) ||
            (p.assignedSupervisorName && user.fullName && p.assignedSupervisorName.toLowerCase() === user.fullName.toLowerCase());
        const isTL = p.assignedTeamLeaderId && (p.assignedTeamLeaderId.toLowerCase() === userId || p.assignedTeamLeaderId.toLowerCase() === username);
        const inUserList = user.assignedProjectIds && user.assignedProjectIds.includes(p.id);
        const inSupporting = p.assignedSupportingStaffIds && (p.assignedSupportingStaffIds.includes(userId) || p.assignedSupportingStaffIds.includes(username));
        return isEng || isSup || isTL || inUserList || inSupporting;
    });

    return (
        <div className="fixed inset-0 z-50 bg-[#041d38]/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="fixed inset-0" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-cyan-950/40 border border-sky-200 w-full max-w-xl overflow-hidden z-10 animate-scale-in">
                {/* Oceanic Header Background */}
                <div className="bg-gradient-to-r from-[#06203c] via-[#072a4d] to-[#041a30] p-6 text-white relative border-b border-cyan-900/60">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-sky-300/70 hover:text-white rounded-full hover:bg-cyan-800/40 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-4">
                        <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=0284c7&color=fff&bold=true`}
                            alt={user.username}
                            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-cyan-400/30 shadow-md bg-[#072a4d]"
                        />
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-white truncate">{user.fullName || user.username}</h3>
                                <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span>{user.status || 'Active'}</span>
                                </span>
                            </div>
                            <p className="text-xs text-sky-200/90 font-mono mt-0.5">@{user.username} · {user.email || `${user.username}@oweb.gov.et`}</p>
                            
                            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs">
                                <span className="font-bold text-cyan-200">
                                    {roleMeta?.label || user.role}
                                </span>
                                {user.secondaryRoles && user.secondaryRoles.map((sec, i) => (
                                    <span key={i} className="text-sky-300/80">
                                        · +{sec}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Data Scope Banner */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5 text-cyan-700" />
                                Resolved Data Access Scope
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                                {effectiveScope}
                            </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">
                            {scopeDef.label}
                        </p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            {scopeDef.description}
                        </p>
                    </div>

                    {/* Organizational Placement */}
                    <div className="grid grid-cols-2 gap-3 text-xs bg-sky-50/50 p-3.5 rounded-2xl border border-sky-100">
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Directorate / Office</span>
                            <span className="font-semibold text-slate-800 truncate block mt-0.5">
                                {user.department || user.organization || 'OWEB Regional Office'}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Squad / Team</span>
                            <span className="font-semibold text-slate-800 truncate block mt-0.5">
                                {user.assignedTeam || 'Regional Pool'}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Geographic Jurisdiction</span>
                            <span className="font-semibold text-slate-800 truncate block mt-0.5">
                                {user.assignedZone || 'All Zones (Regional)'}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Program Focus</span>
                            <span className="font-semibold text-slate-800 truncate block mt-0.5">
                                {user.assignedProgram || 'Bureau-Wide Portfolio'}
                            </span>
                        </div>
                    </div>

                    {/* Assigned Projects Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
                                Assigned Schemes &amp; Projects ({assignedProjects.length})
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">Direct Site Authorization</span>
                        </div>

                        {assignedProjects.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {assignedProjects.map(p => (
                                    <div 
                                        key={p.id}
                                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors flex items-center justify-between text-xs"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <div className="font-bold text-slate-800 truncate">{p.name}</div>
                                            <div className="text-[10px] text-slate-400">{p.id} • {p.zone}, {p.woreda}</div>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 flex-shrink-0">
                                            {p.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                                No direct individual project assignments. Access derived from {effectiveScope} scope.
                            </div>
                        )}
                    </div>

                    {/* Permissions Accordion */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                        <button
                            type="button"
                            onClick={() => setShowPermissions(!showPermissions)}
                            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                Effective Granted Permissions ({permissions.size} Actions Active)
                            </span>
                            {showPermissions ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                        </button>

                        {showPermissions && (
                            <div className="p-3 max-h-48 overflow-y-auto space-y-2 border-t border-slate-200 text-xs">
                                {PERMISSION_MODULES.map(mod => {
                                    const modPerms = GRANULAR_PERMISSIONS.filter(p => p.module === mod.id && permissions.has(p.code));
                                    if (modPerms.length === 0) return null;

                                    return (
                                        <div key={mod.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                            <div className="font-bold text-slate-800 text-[11px] mb-1">{mod.label} ({modPerms.length})</div>
                                            <div className="flex flex-wrap gap-1">
                                                {modPerms.map(p => (
                                                    <span key={p.code} className="inline-flex items-center gap-1 text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">
                                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                                        {p.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Admin Role Simulation Quick Switcher */}
                    {isAdminOrSimulated && onSimulateRole && (
                        <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                    <Lock className="w-4 h-4 text-amber-600" />
                                    Switch Role Simulation View
                                </span>
                                <span className="text-[10px] font-bold text-amber-700 uppercase bg-amber-200/60 px-2 py-0.5 rounded-full">
                                    Admin Tool
                                </span>
                            </div>
                            <p className="text-[11px] text-amber-800">
                                Test system behavior and strict data isolation as any operational role:
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {[
                                    Role.ADMIN,
                                    Role.DIRECTOR,
                                    Role.COORDINATOR,
                                    Role.TEAM_LEADER,
                                    Role.ENGINEER,
                                    Role.SUPERVISOR,
                                    Role.CONTRACT_MANAGER,
                                    Role.REVIEWER,
                                    Role.AUDITOR
                                ].map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => {
                                            onSimulateRole(r);
                                            onClose();
                                        }}
                                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all text-left truncate cursor-pointer ${
                                            user.role === r
                                                ? 'bg-amber-600 text-white font-bold shadow-xs'
                                                : 'bg-white text-slate-700 hover:bg-amber-100/60 border border-amber-200/60'
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timestamps & Telemetry */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                            <span>Account Created:</span>
                            <span className="font-mono text-slate-700">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Initial Registry'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Last System Login:</span>
                            <span className="font-mono text-slate-700">
                                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Current Session'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => {
                            onClose();
                            onLogout();
                        }}
                        className="px-4 py-2 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out of PMS
                    </button>
                </div>
            </div>
        </div>
    );
};
