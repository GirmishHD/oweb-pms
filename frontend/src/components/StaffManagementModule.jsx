import React, { useState, useMemo } from 'react';
import { Role } from '../types';
import { loadStaff, saveStaff, validateStaffData, transferStaffProgram, toggleStaffStatus } from '../services/staffService';
import { loadPrograms } from '../services/programService';
import { loadNgos } from '../services/ngoService';
import { UserCheck, Plus, Search, Edit3, Download, AlertTriangle, ArrowRightLeft, ChevronRight, ShieldAlert, User as UserIcon } from 'lucide-react';
export const StaffManagementModule = ({ user, users = [], projects = [], onStaffChange, onNavigate, onSelectProject }) => {
    const [staffList, setStaffList] = useState(() => loadStaff());
    const programs = useMemo(() => loadPrograms(), []);
    const ngos = useMemo(() => loadNgos(), []);
    const [searchQuery, setSearchQuery] = useState('');
    const [programFilter, setProgramFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedStaff, setSelectedStaff] = useState(() => staffList[0] || null);
    // Add / Edit Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [modalForm, setModalForm] = useState({});
    const [formErrors, setFormErrors] = useState([]);
    // Transfer modal state
    const [transferringStaff, setTransferringStaff] = useState(null);
    const [targetProgramId, setTargetProgramId] = useState('');
    const [transferNotes, setTransferNotes] = useState('');
    // Status toggle modal state
    const [deactivatingStaff, setDeactivatingStaff] = useState(null);
    const [deactivationReason, setDeactivationReason] = useState('');
    // Permission check
    const canAdminister = user.role === Role.ADMIN || user.role === Role.DIRECTOR;
    // Filtered staff list
    const filteredStaff = useMemo(() => {
        return staffList.filter(s => {
            const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.staffCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.department.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
            const matchesProgram = programFilter === 'ALL' ||
                s.assignedProgramName === programFilter ||
                s.assignedProgramId === programFilter;
            return matchesSearch && matchesStatus && matchesProgram;
        });
    }, [staffList, searchQuery, statusFilter, programFilter]);
    // Projects assigned to the selected staff member
    const staffProjects = useMemo(() => {
        if (!selectedStaff)
            return [];
        const staffId = selectedStaff.id;
        const staffName = selectedStaff.fullName.toLowerCase();
        return projects.filter(p => {
            const isDirect = selectedStaff.assignedProjectIds?.includes(p.id);
            const isEng = (p.assignedEngineerName || '').toLowerCase() === staffName;
            const isSup = (p.assignedSupervisorName || '').toLowerCase() === staffName;
            return isDirect || isEng || isSup;
        });
    }, [selectedStaff, projects]);
    // Open Add modal
    const handleOpenAddModal = () => {
        setEditingStaff(null);
        setModalForm({
            id: `STF-${String(Date.now()).slice(-4)}`,
            staffCode: `STF-${String(Date.now()).slice(-4)}`,
            fullName: '',
            jobTitle: '',
            department: 'Study & Design Directorate',
            phone: '',
            email: '',
            assignedProgramId: programs[0]?.code || 'ONE-WASH',
            assignedProgramName: programs[0]?.name || 'ONE WASH',
            assignedProjectIds: [],
            supervisorName: 'Dr. Chaltu Desta',
            employmentStartDate: new Date().toISOString().split('T')[0],
            status: 'Active',
            transferHistory: []
        });
        setFormErrors([]);
        setIsModalOpen(true);
    };
    // Open Edit modal
    const handleOpenEditModal = (staff) => {
        setEditingStaff(staff);
        setModalForm({ ...staff });
        setFormErrors([]);
        setIsModalOpen(true);
    };
    // Save Staff profile
    const handleSaveStaff = (e) => {
        e.preventDefault();
        const validation = validateStaffData(modalForm, staffList, !!editingStaff);
        if (!validation.valid) {
            setFormErrors(validation.errors);
            return;
        }
        let updated;
        if (editingStaff) {
            updated = staffList.map(s => {
                if (s.id === editingStaff.id) {
                    return {
                        ...s,
                        ...modalForm,
                        updatedAt: new Date().toISOString()
                    };
                }
                return s;
            });
        }
        else {
            const newStaff = {
                ...modalForm,
                id: modalForm.id || `STF-${String(Date.now()).slice(-4)}`,
                status: 'Active',
                transferHistory: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            updated = [newStaff, ...staffList];
        }
        setStaffList(updated);
        saveStaff(updated);
        onStaffChange?.(updated);
        setIsModalOpen(false);
        if (editingStaff && selectedStaff?.id === editingStaff.id) {
            setSelectedStaff(updated.find(s => s.id === editingStaff.id) || null);
        }
    };
    // Execute staff transfer between programs
    const handleConfirmTransfer = (e) => {
        e.preventDefault();
        if (!transferringStaff || !targetProgramId)
            return;
        const targetProg = programs.find(p => p.code === targetProgramId || p.id === targetProgramId);
        const targetProgName = targetProg ? targetProg.name : targetProgramId;
        const updated = transferStaffProgram(transferringStaff.id, targetProgramId, targetProgName, user.username, transferNotes, staffList);
        setStaffList(updated);
        onStaffChange?.(updated);
        if (selectedStaff?.id === transferringStaff.id) {
            setSelectedStaff(updated.find(s => s.id === transferringStaff.id) || null);
        }
        setTransferringStaff(null);
    };
    // Execute status change
    const handleConfirmDeactivation = () => {
        if (!deactivatingStaff)
            return;
        const updated = toggleStaffStatus(deactivatingStaff.id, 'Inactive', deactivationReason, user.username, staffList);
        setStaffList(updated);
        onStaffChange?.(updated);
        if (selectedStaff?.id === deactivatingStaff.id) {
            setSelectedStaff(updated.find(s => s.id === deactivatingStaff.id) || null);
        }
        setDeactivatingStaff(null);
    };
    const handleReactivateStaff = (stf) => {
        const updated = toggleStaffStatus(stf.id, 'Active', '', user.username, staffList);
        setStaffList(updated);
        onStaffChange?.(updated);
        if (selectedStaff?.id === stf.id) {
            setSelectedStaff(updated.find(s => s.id === stf.id) || null);
        }
    };
    // Export CSV
    const handleExportCSV = () => {
        const headers = [
            'Staff ID',
            'Employee Code',
            'Full Name',
            'Job Title',
            'Department',
            'Assigned Program',
            'Assigned NGO Partner',
            'Status',
            'Supervisor',
            'Phone',
            'Email',
            'Assigned Projects Count',
            'Linked Login Account'
        ];
        const rows = staffList.map(s => {
            const linkedUser = users.find(u => u.id === s.linkedUserId || u.fullName === s.fullName);
            return [
                `"${s.id}"`,
                `"${s.staffCode}"`,
                `"${s.fullName.replace(/"/g, '""')}"`,
                `"${s.jobTitle.replace(/"/g, '""')}"`,
                `"${s.department.replace(/"/g, '""')}"`,
                `"${s.assignedProgramName}"`,
                `"${(s.assignedNgoName || 'Direct Bureau Staff').replace(/"/g, '""')}"`,
                `"${s.status}"`,
                `"${s.supervisorName}"`,
                `"${s.phone}"`,
                `"${s.email}"`,
                s.assignedProjectIds?.length || 0,
                `"${linkedUser ? linkedUser.username : 'No Login Account'}"`
            ].join(',');
        });
        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OWEB_Staff_Program_Roster_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    return (<div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase mb-3">
              <UserCheck className="w-3.5 h-3.5"/>
              Human Resources &amp; Program Classification Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Staff Management &amp; Program Allocation
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Centralized staff classification across ONE WASH, COWASH, UNICEF, Second Urban, and NGO partner teams. Differentiate staff profiles from system login accounts.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Total Staff</span>
              <span className="text-xl font-black text-white">{staffList.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Active Status</span>
              <span className="text-xl font-black text-emerald-400">
                {staffList.filter(s => s.status === 'Active').length}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-indigo-300 block">Programs Deployed</span>
              <span className="text-xl font-black text-indigo-300">{programs.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-cyan-300 block">Partner NGO Staff</span>
              <span className="text-xl font-black text-cyan-300">
                {staffList.filter(s => s.assignedNgoId).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input type="text" placeholder="Search staff by name, code, job title, or department..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"/>
          </div>
          <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-700">
            <option value="ALL">All Programs</option>
            {programs.map(p => (<option key={p.id} value={p.name}>{p.name}</option>))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-700">
            <option value="ALL">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors">
            <Download className="w-3.5 h-3.5"/>
            Export Staff Roster CSV
          </button>
          {canAdminister && (<button onClick={handleOpenAddModal} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors">
              <Plus className="w-4 h-4"/>
              Register Staff Member
            </button>)}
        </div>
      </div>

      {/* Main Split Layout: Staff Directory & Detailed Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Staff Cards */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Registered Staff Roster ({filteredStaff.length})
          </h2>

          <div className="space-y-2.5">
            {filteredStaff.map((stf) => {
            const isSelected = selectedStaff?.id === stf.id;
            const linkedUser = users.find(u => u.id === stf.linkedUserId || u.fullName === stf.fullName);
            return (<div key={stf.id} onClick={() => setSelectedStaff(stf)} className={`p-4 rounded-xl border transition-all cursor-pointer relative ${isSelected
                    ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono">
                          {stf.staffCode}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stf.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                          {stf.status}
                        </span>
                        {linkedUser && (<span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
                            🔑 Login Active
                          </span>)}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm truncate">{stf.fullName}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{stf.jobTitle} • {stf.department}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black text-indigo-600 block">
                        {stf.assignedProgramName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {stf.assignedNgoName ? 'NGO Seconded' : 'OWEB Direct'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[200px]">Supervisor: <strong className="text-slate-700">{stf.supervisorName}</strong></span>
                    <span className="font-medium text-indigo-600 flex items-center gap-1">
                      View profile <ChevronRight className="w-3 h-3"/>
                    </span>
                  </div>
                </div>);
        })}

            {filteredStaff.length === 0 && (<div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2"/>
                <p className="text-sm font-semibold">No staff records match filter.</p>
                <p className="text-xs text-slate-400 mt-1">Adjust search parameters or program filters.</p>
              </div>)}
          </div>
        </div>

        {/* Right Column: Detailed Staff Profile */}
        <div className="lg:col-span-7">
          {selectedStaff ? (<div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
              {/* Header */}
              <div className="p-6 bg-slate-50/80 border-b border-slate-200">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 font-mono">
                        {selectedStaff.staffCode}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {selectedStaff.department}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${selectedStaff.status === 'Active'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'}`}>
                        {selectedStaff.status === 'Active' ? 'Active Employee' : 'Inactive / Deactivated'}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedStaff.fullName}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedStaff.jobTitle} • Assigned to Program: <strong className="text-indigo-700">{selectedStaff.assignedProgramName}</strong>
                    </p>
                  </div>

                  {canAdminister && (<div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => {
                    setTransferringStaff(selectedStaff);
                    setTargetProgramId(programs[0]?.code || '');
                    setTransferNotes('');
                }} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-2xs transition-colors">
                        <ArrowRightLeft className="w-3.5 h-3.5"/>
                        Transfer Program
                      </button>
                      <button onClick={() => handleOpenEditModal(selectedStaff)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors">
                        <Edit3 className="w-3.5 h-3.5"/>
                        Edit
                      </button>
                      <button onClick={() => {
                    if (selectedStaff.status === 'Active') {
                        setDeactivatingStaff(selectedStaff);
                        setDeactivationReason('');
                    }
                    else {
                        handleReactivateStaff(selectedStaff);
                    }
                }} className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${selectedStaff.status === 'Active'
                    ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'}`}>
                        {selectedStaff.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>)}
                </div>

                {/* Deactivation Alert */}
                {selectedStaff.status === 'Inactive' && (<div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5"/>
                    <div>
                      <strong>Staff Member Deactivated:</strong> Prevented from receiving new project allocations or field signing tasks. Historical milestone records and reports remain intact.
                      {selectedStaff.deactivationReason && (<p className="mt-1 font-medium text-rose-900">Reason: {selectedStaff.deactivationReason}</p>)}
                    </div>
                  </div>)}
              </div>

              {/* Attributes Grid */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Phone Number</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">{selectedStaff.phone}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Email Address</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">{selectedStaff.email}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Supervisor</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">{selectedStaff.supervisorName}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Assigned Program</span>
                    <span className="text-xs font-bold text-indigo-700 block mt-0.5">{selectedStaff.assignedProgramName}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Partner NGO</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">
                      {selectedStaff.assignedNgoName || 'Direct Bureau Staff'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Employment Start</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedStaff.employmentStartDate}</span>
                  </div>
                </div>

                {/* Profile vs System User Account Distinction Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-cyan-600"/>
                    System Login Account Association
                  </h4>
                  {selectedStaff.linkedUserId ? (<div className="text-xs text-slate-600">
                      Linked to system login user ID <strong className="text-cyan-700">{selectedStaff.linkedUserId}</strong>.
                      This profile has active system login credentials with role-based permissions enforced by the PBAC security policy.
                    </div>) : (<div className="text-xs text-slate-600 flex items-center justify-between">
                      <span>This is an organizational staff profile without independent system login access.</span>
                      {onNavigate && (<button onClick={() => onNavigate('usermanagement')} className="text-[11px] font-bold text-cyan-600 hover:text-cyan-800 ml-2">
                          Provision Login in User Management →
                        </button>)}
                    </div>)}
                </div>

                {/* Assigned Projects */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Schemes &amp; Field Works Assigned ({staffProjects.length}):
                    </span>
                    {onNavigate && (<button onClick={() => onNavigate('planning')} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800">
                        Assign Projects →
                      </button>)}
                  </div>
                  {staffProjects.length > 0 ? (<div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {staffProjects.map(prj => (<div key={prj.id} onClick={() => onSelectProject && onSelectProject(prj)} className="p-2.5 rounded-lg border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-between text-xs cursor-pointer">
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-slate-800 block truncate">{prj.name}</span>
                            <span className="text-[10px] text-slate-400">{prj.id} • {prj.zone}, {prj.woreda}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex-shrink-0">
                            {prj.status}
                          </span>
                        </div>))}
                    </div>) : (<p className="text-xs text-slate-400 italic">No specific projects currently allocated to this staff profile.</p>)}
                </div>

                {/* Program Transfer History */}
                {selectedStaff.transferHistory && selectedStaff.transferHistory.length > 0 && (<div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400"/>
                      Program Transfer Audit History
                    </h4>
                    <div className="space-y-1.5">
                      {selectedStaff.transferHistory.map((tr, idx) => (<div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800">{tr.fromProgram}</span>
                            <span className="text-indigo-600 font-bold mx-1.5">→</span>
                            <span className="font-bold text-slate-800">{tr.toProgram}</span>
                            {tr.notes && <span className="text-slate-500 ml-2">({tr.notes})</span>}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(tr.date).toLocaleDateString()} by {tr.transferredBy}
                          </span>
                        </div>))}
                    </div>
                  </div>)}
              </div>
            </div>) : (<div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
              <p className="text-sm font-semibold text-slate-600">Select a staff member to view profile details</p>
              <p className="text-xs text-slate-400 mt-1">Audit program allocation, NGO affiliation, and project task assignments.</p>
            </div>)}
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingStaff ? 'Edit Staff Profile' : 'Register New Staff Member'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure employee details, assigned program, and implementing NGO association.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-4">
              {formErrors.length > 0 && (<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
                  {formErrors.map((err, i) => (<p key={i}>• {err}</p>))}
                </div>)}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input type="text" required value={modalForm.fullName || ''} onChange={(e) => setModalForm({ ...modalForm, fullName: e.target.value })} placeholder="e.g. Eng. Solomon Tadesse" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Staff Code / Employee ID *</label>
                  <input type="text" required value={modalForm.staffCode || ''} onChange={(e) => setModalForm({ ...modalForm, staffCode: e.target.value.toUpperCase() })} placeholder="e.g. STF-OW-01" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono uppercase"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Job Title *</label>
                  <input type="text" required value={modalForm.jobTitle || ''} onChange={(e) => setModalForm({ ...modalForm, jobTitle: e.target.value })} placeholder="e.g. Senior WaSH Project Engineer" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input type="text" value={modalForm.department || ''} onChange={(e) => setModalForm({ ...modalForm, department: e.target.value })} placeholder="e.g. Study & Design Directorate" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone *</label>
                  <input type="tel" required value={modalForm.phone || ''} onChange={(e) => setModalForm({ ...modalForm, phone: e.target.value })} placeholder="+251 911 ..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email *</label>
                  <input type="email" required value={modalForm.email || ''} onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })} placeholder="staff@oweb.gov.et" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Program *</label>
                  <select value={modalForm.assignedProgramId || ''} onChange={(e) => {
                const sel = programs.find(p => p.code === e.target.value || p.id === e.target.value);
                setModalForm({
                    ...modalForm,
                    assignedProgramId: e.target.value,
                    assignedProgramName: sel ? sel.name : e.target.value
                });
            }} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    {programs.map(p => (<option key={p.id} value={p.code}>{p.name} ({p.code})</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned NGO Partner (Optional)</label>
                  <select value={modalForm.assignedNgoId || ''} onChange={(e) => {
                const sel = ngos.find(n => n.id === e.target.value);
                setModalForm({
                    ...modalForm,
                    assignedNgoId: e.target.value || undefined,
                    assignedNgoName: sel ? sel.name : undefined
                });
            }} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="">Direct OWEB Bureau Staff (None)</option>
                    {ngos.map(n => (<option key={n.id} value={n.id}>{n.name} ({n.code})</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supervisor Name</label>
                  <input type="text" value={modalForm.supervisorName || ''} onChange={(e) => setModalForm({ ...modalForm, supervisorName: e.target.value })} placeholder="e.g. Dr. Chaltu Desta" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employment Date</label>
                  <input type="date" value={modalForm.employmentStartDate || ''} onChange={(e) => setModalForm({ ...modalForm, employmentStartDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"/>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">
                  {editingStaff ? 'Save Changes' : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Program Transfer Modal */}
      {transferringStaff && (<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <ArrowRightLeft className="w-6 h-6 flex-shrink-0"/>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Transfer Staff Program
                </h3>
                <p className="text-xs text-slate-500">
                  {transferringStaff.fullName} ({transferringStaff.staffCode})
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Program</label>
                <div className="px-3 py-2 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
                  {transferringStaff.assignedProgramName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Program *</label>
                <select required value={targetProgramId} onChange={(e) => setTargetProgramId(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium">
                  {programs.filter(p => p.code !== transferringStaff.assignedProgramId).map(p => (<option key={p.id} value={p.code}>{p.name} ({p.code})</option>))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Authorization Notes</label>
                <textarea rows={3} value={transferNotes} onChange={(e) => setTransferNotes(e.target.value)} placeholder="Reason for transfer, directorate approval reference..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"/>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setTransferringStaff(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">
                  Authorize Transfer
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Deactivation Modal */}
      {deactivatingStaff && (<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0"/>
              <h3 className="text-base font-bold text-slate-900">
                Deactivate Staff Profile: {deactivatingStaff.fullName}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deactivating will prevent new project and supervision assignments. Historical milestones, reports, and inspection signatures will be preserved in the permanent audit trail.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Deactivation *</label>
              <textarea rows={3} required value={deactivationReason} onChange={(e) => setDeactivationReason(e.target.value)} placeholder="End of contract, sabbatical, resignation, or disciplinary action..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"/>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setDeactivatingStaff(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmDeactivation} className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm">
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>)}
    </div>);
};
