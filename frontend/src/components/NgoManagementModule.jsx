import React, { useState, useMemo } from 'react';
import { Role } from '../types';
import { loadNgos, saveNgos, validateNgoData, deactivateNgo, reactivateNgo } from '../services/ngoService';
import { loadPrograms } from '../services/programService';
import { Building2, Plus, Search, Edit3, CheckCircle2, XCircle, MapPin, Download, AlertTriangle, FolderKanban, UserCheck, History, ShieldAlert, ChevronRight } from 'lucide-react';
export const NgoManagementModule = ({ user, projects = [], staff = [], onNgosChange, onNavigate, onSelectProject }) => {
    const [ngos, setNgos] = useState(() => loadNgos());
    const programs = useMemo(() => loadPrograms(), []);
    const [searchQuery, setSearchQuery] = useState('');
    const [programFilter, setProgramFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedNgo, setSelectedNgo] = useState(() => ngos[0] || null);
    // Add / Edit Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNgo, setEditingNgo] = useState(null);
    const [modalForm, setModalForm] = useState({});
    const [formErrors, setFormErrors] = useState([]);
    // Deactivation confirmation modal state
    const [deactivatingNgo, setDeactivatingNgo] = useState(null);
    const [deactivationReason, setDeactivationReason] = useState('');
    // Permission check
    const canAdminister = user.role === Role.ADMIN || user.role === Role.DIRECTOR;
    // Filtered NGOs
    const filteredNgos = useMemo(() => {
        return ngos.filter(n => {
            const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.operatingArea.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || n.status === statusFilter;
            const matchesProgram = programFilter === 'ALL' ||
                n.assignedProgramNames?.includes(programFilter) ||
                n.assignedProgramIds?.includes(programFilter);
            return matchesSearch && matchesStatus && matchesProgram;
        });
    }, [ngos, searchQuery, statusFilter, programFilter]);
    // Projects associated with the selected NGO
    const ngoProjects = useMemo(() => {
        if (!selectedNgo)
            return [];
        const nName = selectedNgo.name.toLowerCase();
        const nCode = selectedNgo.code.toLowerCase();
        return projects.filter(p => {
            const impl = (p.implementingBody || '').toLowerCase();
            const partner = (p.partnerOrganization || '').toLowerCase();
            const direct = selectedNgo.assignedProjectIds?.includes(p.id);
            return direct || impl.includes(nName) || impl.includes(nCode) || partner.includes(nName);
        });
    }, [selectedNgo, projects]);
    // Staff assigned to the selected NGO
    const ngoStaff = useMemo(() => {
        if (!selectedNgo)
            return [];
        return staff.filter(s => {
            return s.assignedNgoId === selectedNgo.id || s.assignedNgoName === selectedNgo.name;
        });
    }, [selectedNgo, staff]);
    // Open modal for new NGO
    const handleOpenAddModal = () => {
        setEditingNgo(null);
        setModalForm({
            id: `NGO-${String(Date.now()).slice(-4)}`,
            name: '',
            code: '',
            registrationNumber: '',
            contactPerson: '',
            phone: '',
            email: '',
            address: '',
            operatingArea: '',
            assignedProgramIds: [programs[0]?.code || 'ONE-WASH'],
            assignedProgramNames: [programs[0]?.name || 'ONE WASH'],
            assignedProjectIds: [],
            status: 'Active',
            createdBy: user.username
        });
        setFormErrors([]);
        setIsModalOpen(true);
    };
    // Open modal for editing NGO
    const handleOpenEditModal = (ngo) => {
        setEditingNgo(ngo);
        setModalForm({ ...ngo });
        setFormErrors([]);
        setIsModalOpen(true);
    };
    // Save NGO
    const handleSaveNgo = (e) => {
        e.preventDefault();
        const validation = validateNgoData(modalForm, ngos, !!editingNgo);
        if (!validation.valid) {
            setFormErrors(validation.errors);
            return;
        }
        let updated;
        if (editingNgo) {
            updated = ngos.map(n => {
                if (n.id === editingNgo.id) {
                    const historyEntry = {
                        action: 'Updated',
                        date: new Date().toISOString(),
                        performedBy: user.username,
                        details: 'Organization details updated by administrator'
                    };
                    return {
                        ...n,
                        ...modalForm,
                        history: [...(n.history || []), historyEntry],
                        updatedAt: new Date().toISOString()
                    };
                }
                return n;
            });
        }
        else {
            const historyEntry = {
                action: 'Registered',
                date: new Date().toISOString(),
                performedBy: user.username,
                details: 'Initial NGO registration & accreditation'
            };
            const newNgo = {
                ...modalForm,
                id: modalForm.id || `NGO-${String(Date.now()).slice(-4)}`,
                status: 'Active',
                history: [historyEntry],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user.username
            };
            updated = [newNgo, ...ngos];
        }
        setNgos(updated);
        saveNgos(updated);
        onNgosChange?.(updated);
        setIsModalOpen(false);
        if (editingNgo && selectedNgo?.id === editingNgo.id) {
            setSelectedNgo(updated.find(n => n.id === editingNgo.id) || null);
        }
    };
    // Deactivate NGO handler
    const handleConfirmDeactivation = () => {
        if (!deactivatingNgo)
            return;
        const updated = deactivateNgo(deactivatingNgo.id, deactivationReason, user.username, ngos);
        setNgos(updated);
        onNgosChange?.(updated);
        if (selectedNgo?.id === deactivatingNgo.id) {
            setSelectedNgo(updated.find(n => n.id === deactivatingNgo.id) || null);
        }
        setDeactivatingNgo(null);
    };
    // Reactivate NGO handler
    const handleReactivateNgo = (ngo) => {
        const updated = reactivateNgo(ngo.id, user.username, ngos);
        setNgos(updated);
        onNgosChange?.(updated);
        if (selectedNgo?.id === ngo.id) {
            setSelectedNgo(updated.find(n => n.id === ngo.id) || null);
        }
    };
    // Export NGO directory to CSV
    const handleExportCSV = () => {
        const headers = [
            'NGO ID',
            'Organization Name',
            'Code',
            'Registration Number',
            'Status',
            'Contact Person',
            'Phone',
            'Email',
            'Operating Area',
            'Assigned Programs',
            'Active Projects Count',
            'Assigned Staff Count',
            'Deactivation Reason'
        ];
        const rows = ngos.map(n => {
            const prjCount = projects.filter(p => (p.implementingBody || '').includes(n.name) || n.assignedProjectIds?.includes(p.id)).length;
            const stfCount = staff.filter(s => s.assignedNgoId === n.id).length;
            return [
                `"${n.id}"`,
                `"${n.name.replace(/"/g, '""')}"`,
                `"${n.code}"`,
                `"${n.registrationNumber}"`,
                `"${n.status}"`,
                `"${n.contactPerson.replace(/"/g, '""')}"`,
                `"${n.phone}"`,
                `"${n.email}"`,
                `"${n.operatingArea.replace(/"/g, '""')}"`,
                `"${(n.assignedProgramNames || []).join('; ')}"`,
                prjCount,
                stfCount,
                `"${(n.deactivationReason || '').replace(/"/g, '""')}"`
            ].join(',');
        });
        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OWEB_NGO_Partner_Registry_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    return (<div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold tracking-wide uppercase mb-3">
              <Building2 className="w-3.5 h-3.5"/>
              Implementing Partner Coordination Unit
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              NGO &amp; Implementing Partner Management
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Track accreditations, multi-program assignments, project delegations, field staffing, and partner performance across all Oromia administrative zones.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Total NGOs</span>
              <span className="text-xl font-black text-white">{ngos.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Active Status</span>
              <span className="text-xl font-black text-emerald-400">
                {ngos.filter(n => n.status === 'Active').length}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-amber-300 block">Inactive / Suspended</span>
              <span className="text-xl font-black text-amber-300">
                {ngos.filter(n => n.status === 'Inactive').length}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-teal-300 block">Total Delegated Schemes</span>
              <span className="text-xl font-black text-teal-300">{projects.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input type="text" placeholder="Search NGO by name, code, contact person, or operating zone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"/>
          </div>
          <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-700">
            <option value="ALL">All Programs</option>
            {programs.map(p => (<option key={p.id} value={p.name}>{p.name}</option>))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-700">
            <option value="ALL">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors">
            <Download className="w-3.5 h-3.5"/>
            Export Directory CSV
          </button>
          {canAdminister && (<button onClick={handleOpenAddModal} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors">
              <Plus className="w-4 h-4"/>
              Register NGO Partner
            </button>)}
        </div>
      </div>

      {/* Main Split Layout: NGO Directory & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: NGO Cards */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Registered Implementing Partners ({filteredNgos.length})
          </h2>

          <div className="space-y-2.5">
            {filteredNgos.map((ngo) => {
            const isSelected = selectedNgo?.id === ngo.id;
            const ngoSchemes = projects.filter(p => (p.implementingBody || '').includes(ngo.name) || ngo.assignedProjectIds?.includes(p.id));
            return (<div key={ngo.id} onClick={() => setSelectedNgo(ngo)} className={`p-4 rounded-xl border transition-all cursor-pointer relative ${isSelected
                    ? 'bg-white border-teal-500 shadow-md ring-2 ring-teal-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                          {ngo.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ngo.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                          {ngo.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm truncate">{ngo.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{ngo.operatingArea}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black text-slate-800 block">
                        {ngoSchemes.length} schemes
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {ngo.assignedProgramNames?.length || 1} programs
                      </span>
                    </div>
                  </div>

                  {/* Program Badges */}
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    {(ngo.assignedProgramNames || []).map((prog, idx) => (<span key={idx} className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                        {prog}
                      </span>))}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[200px]">Contact: <strong className="text-slate-700">{ngo.contactPerson}</strong></span>
                    <span className="font-medium text-teal-600 flex items-center gap-1">
                      View details <ChevronRight className="w-3 h-3"/>
                    </span>
                  </div>
                </div>);
        })}

            {filteredNgos.length === 0 && (<div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2"/>
                <p className="text-sm font-semibold">No NGO partners match current filters.</p>
                <p className="text-xs text-slate-400 mt-1">Adjust search keywords or program selections.</p>
              </div>)}
          </div>
        </div>

        {/* Right Column: NGO Dossier Details */}
        <div className="lg:col-span-7">
          {selectedNgo ? (<div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
              {/* Header */}
              <div className="p-6 bg-slate-50/80 border-b border-slate-200">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 font-mono">
                        {selectedNgo.code}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        REG: {selectedNgo.registrationNumber}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${selectedNgo.status === 'Active'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'}`}>
                        {selectedNgo.status === 'Active' ? 'Active Partner' : 'Inactive / Suspended'}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedNgo.name}</h2>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400"/>
                      {selectedNgo.address} • Operating: {selectedNgo.operatingArea}
                    </p>
                  </div>

                  {canAdminister && (<div className="flex items-center gap-2">
                      <button onClick={() => handleOpenEditModal(selectedNgo)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors">
                        <Edit3 className="w-3.5 h-3.5"/>
                        Edit NGO
                      </button>
                      <button onClick={() => {
                    if (selectedNgo.status === 'Active') {
                        setDeactivatingNgo(selectedNgo);
                        setDeactivationReason('');
                    }
                    else {
                        handleReactivateNgo(selectedNgo);
                    }
                }} className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${selectedNgo.status === 'Active'
                    ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'}`}>
                        {selectedNgo.status === 'Active' ? (<>
                            <XCircle className="w-3.5 h-3.5"/>
                            Deactivate
                          </>) : (<>
                            <CheckCircle2 className="w-3.5 h-3.5"/>
                            Reactivate
                          </>)}
                      </button>
                    </div>)}
                </div>

                {/* Deactivation Alert */}
                {selectedNgo.status === 'Inactive' && (<div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5"/>
                    <div>
                      <strong>Partner Deactivated:</strong> New project and staff assignments to this NGO are restricted by system policy. Historical records and financial milestones remain fully preserved.
                      {selectedNgo.deactivationReason && (<p className="mt-1 font-medium text-rose-900">Reason: {selectedNgo.deactivationReason}</p>)}
                    </div>
                  </div>)}
              </div>

              {/* Attributes Grid */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Contact Person</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">{selectedNgo.contactPerson}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Phone Number</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">{selectedNgo.phone}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Email Address</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">{selectedNgo.email}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Accreditation ID</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedNgo.registrationNumber}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Registered By</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedNgo.createdBy || 'admin'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Last Activity Log</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {selectedNgo.updatedAt ? new Date(selectedNgo.updatedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Assigned Program Portfolios */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Authorized Program Portfolios
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(selectedNgo.assignedProgramNames || []).map((prog, idx) => (<span key={idx} className="px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                        {prog}
                      </span>))}
                  </div>
                </div>

                {/* Delegated Projects & Staff */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <FolderKanban className="w-4 h-4 text-teal-600 mx-auto mb-1"/>
                      <span className="text-lg font-black text-slate-900 block">{ngoProjects.length}</span>
                      <span className="text-[11px] text-slate-500 font-medium">Delegated Schemes</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <UserCheck className="w-4 h-4 text-indigo-600 mx-auto mb-1"/>
                      <span className="text-lg font-black text-slate-900 block">{ngoStaff.length}</span>
                      <span className="text-[11px] text-slate-500 font-medium">Assigned Staff Profiles</span>
                    </div>
                  </div>

                  {/* Delegated Projects List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">Projects Implemented by {selectedNgo.name}:</span>
                      {onNavigate && (<button onClick={() => onNavigate('planning')} className="text-[11px] font-bold text-teal-600 hover:text-teal-800">
                          View in Planning →
                        </button>)}
                    </div>
                    {ngoProjects.length > 0 ? (<div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {ngoProjects.map(prj => (<div key={prj.id} onClick={() => onSelectProject && onSelectProject(prj)} className="p-2.5 rounded-lg border border-slate-100 hover:border-teal-300 hover:bg-teal-50/30 transition-all flex items-center justify-between text-xs cursor-pointer">
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-slate-800 block truncate">{prj.name}</span>
                              <span className="text-[10px] text-slate-400">{prj.id} • {prj.zone}, {prj.woreda}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex-shrink-0">
                              {prj.status}
                            </span>
                          </div>))}
                      </div>) : (<p className="text-xs text-slate-400 italic">No projects currently delegated to this partner.</p>)}
                  </div>

                  {/* Audit & Accreditation History */}
                  {selectedNgo.history && selectedNgo.history.length > 0 && (<div className="pt-2">
                      <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-slate-400"/>
                        Accreditation &amp; Activation History
                      </h4>
                      <div className="space-y-1.5">
                        {selectedNgo.history.map((hist, i) => (<div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-800">{hist.action}</span>
                              <span className="text-slate-500 ml-2">{hist.details}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(hist.date).toLocaleDateString()} by {hist.performedBy}
                            </span>
                          </div>))}
                      </div>
                    </div>)}
                </div>
              </div>
            </div>) : (<div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
              <p className="text-sm font-semibold text-slate-600">Select an NGO partner to view details</p>
              <p className="text-xs text-slate-400 mt-1">Audit accreditations, program coverage, and delegated WASH projects.</p>
            </div>)}
        </div>
      </div>

      {/* Add / Edit NGO Modal */}
      {isModalOpen && (<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingNgo ? 'Edit NGO Partner Profile' : 'Register Implementing Partner'}
                </h3>
                <p className="text-xs text-slate-500">
                  Accredit NGO and assign authorized bureau programs and operating corridors.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveNgo} className="p-6 space-y-4">
              {formErrors.length > 0 && (<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
                  {formErrors.map((err, i) => (<p key={i}>• {err}</p>))}
                </div>)}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Organization Name *</label>
                  <input type="text" required value={modalForm.name || ''} onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })} placeholder="e.g. WaterAid Ethiopia" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unique Organization Code *</label>
                  <input type="text" required value={modalForm.code || ''} onChange={(e) => setModalForm({ ...modalForm, code: e.target.value.toUpperCase() })} placeholder="e.g. NGO-WAE" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 uppercase font-mono"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Registration / CSO Number *</label>
                  <input type="text" required value={modalForm.registrationNumber || ''} onChange={(e) => setModalForm({ ...modalForm, registrationNumber: e.target.value })} placeholder="e.g. FDRE-CSO-1082" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person *</label>
                  <input type="text" required value={modalForm.contactPerson || ''} onChange={(e) => setModalForm({ ...modalForm, contactPerson: e.target.value })} placeholder="e.g. Ato Abebe Tadesse" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone *</label>
                  <input type="tel" required value={modalForm.phone || ''} onChange={(e) => setModalForm({ ...modalForm, phone: e.target.value })} placeholder="+251 911 ..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email *</label>
                  <input type="email" required value={modalForm.email || ''} onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })} placeholder="contact@wateraid.org" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Office Address &amp; Hub</label>
                <input type="text" value={modalForm.address || ''} onChange={(e) => setModalForm({ ...modalForm, address: e.target.value })} placeholder="e.g. Adama Regional Field Hub / Bole Subcity" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operating Area (Zones / Woredas)</label>
                <input type="text" value={modalForm.operatingArea || ''} onChange={(e) => setModalForm({ ...modalForm, operatingArea: e.target.value })} placeholder="e.g. East Shewa, Arsi, West Hararghe" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"/>
              </div>

              {/* Multi-Program Assignment Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Assigned Programs &amp; Initiatives *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {programs.map(prog => {
                const isChecked = (modalForm.assignedProgramNames || []).includes(prog.name);
                return (<label key={prog.id} className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-2 cursor-pointer transition-all ${isChecked
                        ? 'bg-teal-50 border-teal-400 text-teal-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <input type="checkbox" checked={isChecked} onChange={(e) => {
                        const current = modalForm.assignedProgramNames || [];
                        const currentIds = modalForm.assignedProgramIds || [];
                        if (e.target.checked) {
                            setModalForm({
                                ...modalForm,
                                assignedProgramNames: [...current, prog.name],
                                assignedProgramIds: [...currentIds, prog.code]
                            });
                        }
                        else {
                            setModalForm({
                                ...modalForm,
                                assignedProgramNames: current.filter(p => p !== prog.name),
                                assignedProgramIds: currentIds.filter(id => id !== prog.code)
                            });
                        }
                    }} className="rounded-sm text-teal-600 focus:ring-teal-500"/>
                        <span className="truncate">{prog.name}</span>
                      </label>);
            })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm">
                  {editingNgo ? 'Save Changes' : 'Register Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Deactivation Modal */}
      {deactivatingNgo && (<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0"/>
              <h3 className="text-base font-bold text-slate-900">
                Deactivate Partner: {deactivatingNgo.name}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When an NGO is deactivated, new project delegations and staff allocations are prevented by the access control engine. All historic projects, disbursements, and documents are retained.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Deactivation *</label>
              <textarea rows={3} required value={deactivationReason} onChange={(e) => setDeactivationReason(e.target.value)} placeholder="Specify audit findings, license expiry, or project completion..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"/>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setDeactivatingNgo(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
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
