import React, { useState, useMemo } from 'react';
import { Role } from '../types';
import { loadPrograms, savePrograms, validateProgramData, getProgramColor } from '../services/programService';
import { Layers, Plus, Search, Edit3, CheckCircle2, XCircle, Users, Building2, Download, ChevronRight, AlertTriangle, FolderKanban, UserCheck } from 'lucide-react';
export const ProgramManagementModule = ({ user, projects = [], staff = [], ngos = [], users = [], onProgramsChange, onNavigate, onSelectProject }) => {
    const [programs, setPrograms] = useState(() => {
        const list = loadPrograms();
        const map = new Map();
        list.forEach(p => { if (p && p.id)
            map.set(p.id, p); });
        return Array.from(map.values());
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedProgram, setSelectedProgram] = useState(() => programs[0] || null);
    // Program modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState(null);
    const [modalForm, setModalForm] = useState({});
    const [formErrors, setFormErrors] = useState([]);
    // Deactivation confirmation modal
    const [deactivatingProgram, setDeactivatingProgram] = useState(null);
    const [deactivationReason, setDeactivationReason] = useState('');
    // Permission check: Admins and Program Admins
    const canAdminister = user.role === Role.ADMIN || user.role === Role.DIRECTOR;
    // Filtered program list
    const filteredPrograms = useMemo(() => {
        return programs.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.programManager.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.fundingSource.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [programs, searchQuery, statusFilter]);
    // Projects associated with the selected program
    const programProjects = useMemo(() => {
        if (!selectedProgram)
            return [];
        const pName = selectedProgram.name.toLowerCase();
        const pCode = selectedProgram.code.toLowerCase();
        return projects.filter(prj => {
            const prjProg = (prj.program || '').toLowerCase();
            return prjProg.includes(pName) || pName.includes(prjProg) || prjProg.includes(pCode);
        });
    }, [selectedProgram, projects]);
    // NGOs associated with the selected program
    const programNgos = useMemo(() => {
        if (!selectedProgram)
            return [];
        return ngos.filter(ngo => {
            return (ngo.assignedProgramIds?.includes(selectedProgram.id) ||
                ngo.assignedProgramIds?.includes(selectedProgram.code) ||
                ngo.assignedProgramNames?.includes(selectedProgram.name));
        });
    }, [selectedProgram, ngos]);
    // Staff associated with the selected program
    const programStaff = useMemo(() => {
        if (!selectedProgram)
            return [];
        return staff.filter(stf => {
            return (stf.assignedProgramId === selectedProgram.id ||
                stf.assignedProgramId === selectedProgram.code ||
                stf.assignedProgramName === selectedProgram.name);
        });
    }, [selectedProgram, staff]);
    // System users associated with the selected program
    const programUsers = useMemo(() => {
        if (!selectedProgram)
            return [];
        return users.filter(u => {
            return (u.assignedProgram === selectedProgram.name ||
                u.assignedPrograms?.includes(selectedProgram.name) ||
                u.assignedPrograms?.includes(selectedProgram.code));
        });
    }, [selectedProgram, users]);
    // Aggregate program statistics
    const totalAllocatedBudget = useMemo(() => {
        return programs.reduce((sum, p) => sum + (p.budgetETB || 0), 0);
    }, [programs]);
    const activeProgramsCount = useMemo(() => {
        return programs.filter(p => p.status === 'Active').length;
    }, [programs]);
    // Open modal for new program
    const handleOpenAddModal = () => {
        setEditingProgram(null);
        setModalForm({
            id: `PROG-${String(Date.now()).slice(-4)}`,
            name: '',
            code: '',
            description: '',
            programManager: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 365 * 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
            fundingSource: '',
            contactEmail: '',
            contactPhone: '',
            status: 'Active',
            focusArea: '',
            budgetETB: 100000000,
            targetBeneficiaries: 250000,
            components: ['Component 1: Infrastructure Development', 'Component 2: Capacity Building'],
            createdBy: user.username
        });
        setFormErrors([]);
        setIsModalOpen(true);
    };
    // Open modal for editing
    const handleOpenEditModal = (p) => {
        setEditingProgram(p);
        setModalForm({ ...p });
        setFormErrors([]);
        setIsModalOpen(true);
    };
    // Save new / edited program
    const handleSaveProgram = (e) => {
        e.preventDefault();
        const validation = validateProgramData(modalForm, programs, !!editingProgram);
        if (!validation.valid) {
            setFormErrors(validation.errors);
            return;
        }
        let updated;
        if (editingProgram) {
            updated = programs.map(p => {
                if (p.id === editingProgram.id) {
                    return {
                        ...p,
                        ...modalForm,
                        updatedAt: new Date().toISOString()
                    };
                }
                return p;
            });
        }
        else {
            const newProgram = {
                ...modalForm,
                id: modalForm.id || `PROG-${String(Date.now()).slice(-4)}`,
                status: 'Active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user.username
            };
            updated = [newProgram, ...programs];
        }
        setPrograms(updated);
        savePrograms(updated);
        onProgramsChange?.(updated);
        setIsModalOpen(false);
        if (editingProgram && selectedProgram?.id === editingProgram.id) {
            setSelectedProgram(updated.find(p => p.id === editingProgram.id) || null);
        }
    };
    // Toggle active / inactive status
    const handleToggleStatus = (p) => {
        if (p.status === 'Active') {
            setDeactivatingProgram(p);
            setDeactivationReason('');
        }
        else {
            // Reactivate directly
            const updated = programs.map(item => {
                if (item.id === p.id) {
                    return {
                        ...item,
                        status: 'Active',
                        deactivationReason: undefined,
                        deactivationDate: undefined,
                        updatedAt: new Date().toISOString()
                    };
                }
                return item;
            });
            setPrograms(updated);
            savePrograms(updated);
            onProgramsChange?.(updated);
            if (selectedProgram?.id === p.id) {
                setSelectedProgram(updated.find(item => item.id === p.id) || null);
            }
        }
    };
    // Confirm deactivation
    const handleConfirmDeactivation = () => {
        if (!deactivatingProgram)
            return;
        const updated = programs.map(item => {
            if (item.id === deactivatingProgram.id) {
                return {
                    ...item,
                    status: 'Inactive',
                    deactivationReason: deactivationReason || 'Administrative suspension',
                    deactivationDate: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }
            return item;
        });
        setPrograms(updated);
        savePrograms(updated);
        onProgramsChange?.(updated);
        if (selectedProgram?.id === deactivatingProgram.id) {
            setSelectedProgram(updated.find(item => item.id === deactivatingProgram.id) || null);
        }
        setDeactivatingProgram(null);
    };
    // CSV Export for Program Portfolio
    const handleExportProgramsCSV = () => {
        const headers = [
            'Program ID',
            'Program Name',
            'Unique Code',
            'Status',
            'Program Manager',
            'Funding Source',
            'Budget (ETB)',
            'Target Beneficiaries',
            'Active Schemes',
            'Assigned NGOs',
            'Assigned Staff',
            'Start Date',
            'End Date',
            'Contact Email'
        ];
        const rows = programs.map(p => {
            const pName = p.name.toLowerCase();
            const pCode = p.code.toLowerCase();
            const schemeCount = projects.filter(prj => {
                const prjProg = (prj.program || '').toLowerCase();
                return prjProg.includes(pName) || pName.includes(prjProg) || prjProg.includes(pCode);
            }).length;
            const ngoCount = ngos.filter(n => n.assignedProgramNames?.includes(p.name) || n.assignedProgramIds?.includes(p.code)).length;
            const staffCount = staff.filter(s => s.assignedProgramName === p.name || s.assignedProgramId === p.code).length;
            return [
                `"${p.id}"`,
                `"${p.name.replace(/"/g, '""')}"`,
                `"${p.code}"`,
                `"${p.status}"`,
                `"${p.programManager.replace(/"/g, '""')}"`,
                `"${p.fundingSource.replace(/"/g, '""')}"`,
                p.budgetETB || 0,
                p.targetBeneficiaries || 0,
                schemeCount,
                ngoCount,
                staffCount,
                `"${p.startDate}"`,
                `"${p.endDate}"`,
                `"${p.contactEmail}"`
            ].join(',');
        });
        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OWEB_Multi_Program_Registry_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    return (<div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-semibold tracking-wide uppercase mb-3">
              <Layers className="w-3.5 h-3.5"/>
              Multi-Program WASH Governance Architecture
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Program Management &amp; Portfolio Registry
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Centralized portfolio governance administering ONE WASH, COWASH, UNICEF, Second Urban, BIOGAS, Basket Fund, and specialized bilateral initiatives across Oromia.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Total Programs</span>
              <span className="text-xl font-black text-white">{programs.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Active Status</span>
              <span className="text-xl font-black text-emerald-400">{activeProgramsCount}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-cyan-300 block">Portfolio Budget</span>
              <span className="text-base font-black text-cyan-300">{(totalAllocatedBudget / 1_000_000).toFixed(0)}M ETB</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-amber-300 block">Active Schemes</span>
              <span className="text-xl font-black text-amber-300">{projects.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input type="text" placeholder="Search by name, code, manager, or funding..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"/>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 text-slate-700">
            <option value="ALL">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportProgramsCSV} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors">
            <Download className="w-3.5 h-3.5"/>
            Export Portfolio CSV
          </button>
          {canAdminister && (<button onClick={handleOpenAddModal} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm transition-colors">
              <Plus className="w-4 h-4"/>
              Register New Program
            </button>)}
        </div>
      </div>

      {/* Main Split Layout: Program Registry List & Comprehensive Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Program Registry Cards */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Controlled Program Registry ({filteredPrograms.length})
          </h2>

          <div className="space-y-2.5">
            {filteredPrograms.map((p) => {
            const styling = getProgramColor(p.name);
            const isSelected = selectedProgram?.id === p.id;
            const pSchemes = projects.filter(prj => {
                const prjProg = (prj.program || '').toLowerCase();
                return prjProg.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(prjProg);
            });
            return (<div key={p.id} onClick={() => setSelectedProgram(p)} className={`p-4 rounded-xl border transition-all cursor-pointer relative ${isSelected
                    ? 'bg-white border-cyan-500 shadow-md ring-2 ring-cyan-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${styling.bg} ${styling.text} ${styling.border}`}>
                          {p.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {p.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm truncate">{p.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{p.fundingSource}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black text-slate-800 block">
                        {p.budgetETB ? `${(p.budgetETB / 1_000_000).toFixed(0)}M ETB` : 'N/A'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {pSchemes.length} schemes
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[200px]">Manager: <strong className="text-slate-700">{p.programManager}</strong></span>
                    <span className="font-medium text-cyan-600 flex items-center gap-1">
                      View details <ChevronRight className="w-3 h-3"/>
                    </span>
                  </div>
                </div>);
        })}

            {filteredPrograms.length === 0 && (<div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2"/>
                <p className="text-sm font-semibold">No programs matched your filter criteria.</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting the search or status filters.</p>
              </div>)}
          </div>
        </div>

        {/* Right Column: Deep-Dive Program Administration Panel */}
        <div className="lg:col-span-7">
          {selectedProgram ? (<div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
              {/* Card Header with Styling */}
              <div className="p-6 bg-slate-50/80 border-b border-slate-200">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                        CODE: {selectedProgram.code}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${selectedProgram.status === 'Active'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'}`}>
                        {selectedProgram.status === 'Active' ? 'Active Program' : 'Inactive / Suspended'}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedProgram.name}</h2>
                    <p className="text-xs text-slate-500 mt-1">{selectedProgram.description}</p>
                  </div>

                  {canAdminister && (<div className="flex items-center gap-2">
                      <button onClick={() => handleOpenEditModal(selectedProgram)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors">
                        <Edit3 className="w-3.5 h-3.5"/>
                        Edit Details
                      </button>
                      <button onClick={() => handleToggleStatus(selectedProgram)} className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${selectedProgram.status === 'Active'
                    ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'}`}>
                        {selectedProgram.status === 'Active' ? (<>
                            <XCircle className="w-3.5 h-3.5"/>
                            Deactivate
                          </>) : (<>
                            <CheckCircle2 className="w-3.5 h-3.5"/>
                            Reactivate
                          </>)}
                      </button>
                    </div>)}
                </div>

                {/* Inactive notice if applicable */}
                {selectedProgram.status === 'Inactive' && selectedProgram.deactivationReason && (<div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5"/>
                    <div>
                      <strong>Deactivation Notice:</strong> {selectedProgram.deactivationReason}
                      {selectedProgram.deactivationDate && (<span className="block text-[11px] text-rose-600 mt-0.5">
                          Recorded on {new Date(selectedProgram.deactivationDate).toLocaleDateString()}
                        </span>)}
                    </div>
                  </div>)}
              </div>

              {/* Program Attributes Grid */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Program Manager</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">{selectedProgram.programManager}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Funding Partner</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">{selectedProgram.fundingSource}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Budget Allocation</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {selectedProgram.budgetETB ? `${selectedProgram.budgetETB.toLocaleString()} ETB` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Target Beneficiaries</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {selectedProgram.targetBeneficiaries ? `${selectedProgram.targetBeneficiaries.toLocaleString()} people` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Program Duration</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {selectedProgram.startDate} to {selectedProgram.endDate}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Contact Information</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">{selectedProgram.contactEmail}</span>
                  </div>
                </div>

                {/* Sub-components & Windows */}
                {selectedProgram.components && selectedProgram.components.length > 0 && (<div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Program Components &amp; Financing Windows
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedProgram.components.map((comp, idx) => (<div key={idx} className="p-2.5 rounded-lg bg-cyan-50/60 border border-cyan-100 text-xs text-cyan-900 font-medium flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                          {comp}
                        </div>))}
                    </div>
                  </div>)}

                {/* Associated Resources Tabs: Projects, NGOs, Staff, Users */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Isolated Program Resources ({selectedProgram.name})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <FolderKanban className="w-4 h-4 text-cyan-600 mx-auto mb-1"/>
                      <span className="text-lg font-black text-slate-900 block">{programProjects.length}</span>
                      <span className="text-[11px] text-slate-500 font-medium">Assigned Projects</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <Building2 className="w-4 h-4 text-emerald-600 mx-auto mb-1"/>
                      <span className="text-lg font-black text-slate-900 block">{programNgos.length}</span>
                      <span className="text-[11px] text-slate-500 font-medium">Partner NGOs</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <UserCheck className="w-4 h-4 text-indigo-600 mx-auto mb-1"/>
                      <span className="text-lg font-black text-slate-900 block">{programStaff.length}</span>
                      <span className="text-[11px] text-slate-500 font-medium">Assigned Staff</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <Users className="w-4 h-4 text-purple-600 mx-auto mb-1"/>
                      <span className="text-lg font-black text-slate-900 block">{programUsers.length}</span>
                      <span className="text-[11px] text-slate-500 font-medium">Authorized Users</span>
                    </div>
                  </div>

                  {/* Associated Projects Sample List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">Recent Program Projects:</span>
                      {onNavigate && (<button onClick={() => onNavigate('planning')} className="text-[11px] font-bold text-cyan-600 hover:text-cyan-800">
                          View in Planning →
                        </button>)}
                    </div>
                    {programProjects.length > 0 ? (<div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {programProjects.slice(0, 5).map(prj => (<div key={prj.id} onClick={() => onSelectProject && onSelectProject(prj)} className="p-2.5 rounded-lg border border-slate-100 hover:border-cyan-300 hover:bg-cyan-50/30 transition-all flex items-center justify-between text-xs cursor-pointer">
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-slate-800 block truncate">{prj.name}</span>
                              <span className="text-[10px] text-slate-400">{prj.id} • {prj.zone}, {prj.woreda}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex-shrink-0">
                              {prj.status}
                            </span>
                          </div>))}
                      </div>) : (<p className="text-xs text-slate-400 italic">No projects explicitly assigned to this program yet.</p>)}
                  </div>
                </div>
              </div>
            </div>) : (<div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
              <p className="text-sm font-semibold text-slate-600">Select a program to inspect portfolio details</p>
              <p className="text-xs text-slate-400 mt-1">Review active schemes, NGO partners, assigned staff, and program metrics.</p>
            </div>)}
        </div>
      </div>

      {/* Program Create / Edit Modal */}
      {isModalOpen && (<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingProgram ? 'Edit Program Configuration' : 'Register New WASH Program'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure program code, manager, duration, and funding windows.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="p-6 space-y-4">
              {formErrors.length > 0 && (<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
                  {formErrors.map((err, i) => (<p key={i}>• {err}</p>))}
                </div>)}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Program Name *</label>
                  <input type="text" required value={modalForm.name || ''} onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })} placeholder="e.g. ONE WASH" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unique Program Code *</label>
                  <input type="text" required value={modalForm.code || ''} onChange={(e) => setModalForm({ ...modalForm, code: e.target.value.toUpperCase() })} placeholder="e.g. ONE-WASH" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 uppercase font-mono"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Program Manager *</label>
                  <input type="text" required value={modalForm.programManager || ''} onChange={(e) => setModalForm({ ...modalForm, programManager: e.target.value })} placeholder="e.g. Eng. Solomon Tadesse" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Funding Source / Donors *</label>
                  <input type="text" required value={modalForm.fundingSource || ''} onChange={(e) => setModalForm({ ...modalForm, fundingSource: e.target.value })} placeholder="e.g. World Bank / UNICEF / AfDB" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date *</label>
                  <input type="date" required value={modalForm.startDate || ''} onChange={(e) => setModalForm({ ...modalForm, startDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date *</label>
                  <input type="date" required value={modalForm.endDate || ''} onChange={(e) => setModalForm({ ...modalForm, endDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Budget Allocation (ETB)</label>
                  <input type="number" value={modalForm.budgetETB || 0} onChange={(e) => setModalForm({ ...modalForm, budgetETB: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Beneficiaries</label>
                  <input type="number" value={modalForm.targetBeneficiaries || 0} onChange={(e) => setModalForm({ ...modalForm, targetBeneficiaries: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email</label>
                  <input type="email" value={modalForm.contactEmail || ''} onChange={(e) => setModalForm({ ...modalForm, contactEmail: e.target.value })} placeholder="program@oweb.gov.et" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input type="tel" value={modalForm.contactPhone || ''} onChange={(e) => setModalForm({ ...modalForm, contactPhone: e.target.value })} placeholder="+251 115 ..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description &amp; Strategic Objectives</label>
                <textarea rows={3} value={modalForm.description || ''} onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })} placeholder="Detail scope, intervention approach, and target communities..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"/>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm">
                  {editingProgram ? 'Save Changes' : 'Register Program'}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Program Deactivation Confirmation Modal */}
      {deactivatingProgram && (<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0"/>
              <h3 className="text-base font-bold text-slate-900">
                Deactivate Program: {deactivatingProgram.name}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deactivating will mark this program as inactive. Historical schemes, reports, and staff assignments will be preserved, but new projects cannot be formulated under this program until reactivated.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Deactivation *</label>
              <textarea rows={3} required value={deactivationReason} onChange={(e) => setDeactivationReason(e.target.value)} placeholder="State audit reason, funding completion, or phase conclusion..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"/>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setDeactivatingProgram(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
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
