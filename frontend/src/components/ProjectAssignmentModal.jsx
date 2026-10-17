import React, { useState, useMemo } from 'react';
import { Role } from '../types';
import { ENGINEERING_TEAMS, ORGANIZATIONS } from '../constants';
import { loadNgos } from '../services/ngoService';
import { Users, UserCheck, ShieldCheck, X, Check, Briefcase, Layers } from 'lucide-react';
export const ProjectAssignmentModal = ({ project, users, onClose, onSaveAssignment, currentUser }) => {
    // Current assignments or defaults
    const [engineerId, setEngineerId] = useState(project.assignedEngineerId || '');
    const [supervisorId, setSupervisorId] = useState(project.assignedSupervisorId || '');
    const [teamLeaderId, setTeamLeaderId] = useState(project.assignedTeamLeaderId || '');
    const [assignedTeam, setAssignedTeam] = useState(project.assignedTeam || '');
    const [supportingStaffIds, setSupportingStaffIds] = useState(project.assignedSupportingStaffIds || []);
    const [partnerOrg, setPartnerOrg] = useState(project.partnerOrganization || '');
    const partnerOrgOptions = useMemo(() => {
        try {
            const activeNgos = loadNgos().filter(n => n.status === 'Active').map(n => n.name);
            return Array.from(new Set([...ORGANIZATIONS, ...activeNgos]));
        }
        catch {
            return ORGANIZATIONS;
        }
    }, []);
    // Filter eligible users for dropdowns
    const engineersList = users.filter(u => u.role === Role.ENGINEER ||
        u.role === Role.USER ||
        u.role === Role.ADMIN ||
        (u.secondaryRoles && u.secondaryRoles.includes(Role.ENGINEER)));
    const supervisorsList = users.filter(u => u.role === Role.SUPERVISOR ||
        u.role === Role.ADMIN ||
        u.role === Role.CONTRACT_MANAGER ||
        (u.secondaryRoles && u.secondaryRoles.includes(Role.SUPERVISOR)));
    const teamLeadersList = users.filter(u => u.role === Role.TEAM_LEADER ||
        u.role === Role.COORDINATOR ||
        u.role === Role.DIRECTOR ||
        u.role === Role.ADMIN ||
        u.role === Role.REVIEWER ||
        (u.secondaryRoles && u.secondaryRoles.includes(Role.TEAM_LEADER)));
    const handleToggleSupportingStaff = (userId) => {
        setSupportingStaffIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };
    const handleSave = (e) => {
        e.preventDefault();
        const selectedEng = users.find(u => u.id === engineerId || u.username === engineerId);
        const selectedSup = users.find(u => u.id === supervisorId || u.username === supervisorId);
        const selectedTL = users.find(u => u.id === teamLeaderId || u.username === teamLeaderId);
        const updatedProject = {
            ...project,
            assignedEngineerId: engineerId || undefined,
            assignedEngineerName: selectedEng ? (selectedEng.fullName || selectedEng.username) : undefined,
            assignedSupervisorId: supervisorId || undefined,
            assignedSupervisorName: selectedSup ? (selectedSup.fullName || selectedSup.username) : undefined,
            assignedTeamLeaderId: teamLeaderId || undefined,
            assignedTeam: assignedTeam || undefined,
            assignedSupportingStaffIds: supportingStaffIds.length > 0 ? supportingStaffIds : undefined,
            partnerOrganization: partnerOrg || undefined,
        };
        const notif = selectedEng
            ? `Assigned Lead Engineer "${selectedEng.fullName || selectedEng.username}" to "${project.name}". Access granted instantly.`
            : `Updated technical personnel assignments for "${project.name}".`;
        onSaveAssignment(updatedProject, notif);
        onClose();
    };
    return (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 my-8">
        <form onSubmit={handleSave}>
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
                <Users className="w-5 h-5"/>
              </span>
              <div>
                <h3 className="text-base font-bold">Assign Staff & Data Access Permissions</h3>
                <p className="text-xs text-slate-300">{project.name} ({project.id})</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              <X className="w-5 h-5"/>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Notice banner */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"/>
              <div>
                <strong className="font-bold">Dynamic RBAC Access Enforcement:</strong>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Assigning an Engineer or Supervisor grants them immediate operational access to view, update, file progress logs, and submit IPC payment verifications for this specific scheme. Removing an engineer instantly revokes their access.
                </p>
              </div>
            </div>

            {/* Lead Engineer Assignment */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600"/>
                Lead Project Engineer (Resident Engineer)
              </label>
              <select value={engineerId} onChange={e => setEngineerId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">-- No Engineer Assigned --</option>
                {engineersList.map(u => (<option key={u.id} value={u.id}>
                    {u.fullName || u.username} ({u.username}) • {u.department || 'Engineer'}
                  </option>))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                The lead engineer receives strict project-level read/write permissions for site execution and weekly planning.
              </p>
            </div>

            {/* Supervising Engineer Assignment */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-sky-600"/>
                Supervising Engineer (QA/QC Auditor)
              </label>
              <select value={supervisorId} onChange={e => setSupervisorId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">-- No Supervisor Assigned --</option>
                {supervisorsList.map(u => (<option key={u.id} value={u.id}>
                    {u.fullName || u.username} ({u.username}) • {u.department || 'Supervisor'}
                  </option>))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Authorized to verify milestones, sign off field quality inspection logbooks, and endorse contractor IPC claims.
              </p>
            </div>

            {/* Team Leader & Squad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-600"/>
                  Responsible Team Leader
                </label>
                <select value={teamLeaderId} onChange={e => setTeamLeaderId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">-- No Team Leader Assigned --</option>
                  {teamLeadersList.map(u => (<option key={u.id} value={u.id}>
                      {u.fullName || u.username} ({u.username})
                    </option>))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600"/>
                  Assigned Engineering Squad / Team
                </label>
                <select value={assignedTeam} onChange={e => setAssignedTeam(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">-- No Squad Designated --</option>
                  {ENGINEERING_TEAMS.map(team => (<option key={team} value={team}>{team}</option>))}
                </select>
              </div>
            </div>

            {/* Partner / NGO Organization */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Partner / Co-Financing Organization
              </label>
              <select value={partnerOrg} onChange={e => setPartnerOrg(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">-- None (Government Treasury) --</option>
                <optgroup label="Government & Multilateral Partners">
                  {ORGANIZATIONS.map(org => (<option key={org} value={org}>{org}</option>))}
                </optgroup>
                {partnerOrgOptions.some(o => !ORGANIZATIONS.includes(o)) && (<optgroup label="Registered NGO Implementing Partners">
                    {partnerOrgOptions.filter(o => !ORGANIZATIONS.includes(o)).map(ngo => (<option key={ngo} value={ngo}>{ngo}</option>))}
                  </optgroup>)}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Designates partner data scope visibility for donor representatives and accredited NGOs (e.g. UNICEF, World Bank, WaterAid, COWASH).
              </p>
            </div>

            {/* Supporting Staff Multi-select */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Additional Supporting Engineers & Field Staff ({supportingStaffIds.length} selected)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                {users.map(u => {
            const isChecked = supportingStaffIds.includes(u.id) || supportingStaffIds.includes(u.username);
            return (<label key={u.id} className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${isChecked ? 'bg-indigo-50 border-indigo-200 font-semibold text-indigo-900' : 'bg-white border-slate-200/80 text-slate-700'}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => handleToggleSupportingStaff(u.id)} className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"/>
                      <div className="min-w-0 truncate">
                        <span className="truncate block">{u.fullName || u.username}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">{u.role}</span>
                      </div>
                    </label>);
        })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer">
              <Check className="w-4 h-4"/>
              Save Assignments & Grant Access
            </button>
          </div>
        </form>
      </div>
    </div>);
};
