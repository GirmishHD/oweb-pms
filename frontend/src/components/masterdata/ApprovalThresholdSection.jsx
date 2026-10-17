import React, { useState } from 'react';
import { formatCurrencyETB } from '../../utils/procurementThresholds';
import { Plus, Edit3, Trash2, CheckCircle2, FileText, X } from 'lucide-react';
export const ApprovalThresholdSection = ({ thresholds = [], onUpdateThresholds, canEdit, currentUser }) => {
    const [selectedCategory, setSelectedCategory] = useState('PAYMENT');
    const [editingThreshold, setEditingThreshold] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const categories = [
        { id: 'PAYMENT', label: 'Payment Approvals', desc: 'Financial disbursement ceilings by management tier' },
        { id: 'VARIATION', label: 'Contract Variations', desc: 'Scope, price escalation, and EOT variation authorization limits' },
        { id: 'CONTRACT', label: 'Contract Execution', desc: 'Statutory contract award and signing authorization bands' },
        { id: 'PROJECT_BUDGET', label: 'Scheme Budgets', desc: 'Capital allocation ceilings requiring board sanction' }
    ];
    const currentThresholds = thresholds
        .filter(t => t.category === selectedCategory)
        .sort((a, b) => a.approvalSequence - b.approvalSequence);
    const availableRoles = [
        'Supervisor',
        'Contract Manager',
        'Reviewer',
        'Directorate Director',
        'Finance Officer',
        'Administrator'
    ];
    const handleOpenCreate = () => {
        setEditingThreshold(null);
        setIsModalOpen(true);
    };
    const handleOpenEdit = (t) => {
        setEditingThreshold(t);
        setIsModalOpen(true);
    };
    const handleSaveThreshold = (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const title = form.elements.namedItem('title').value;
        const amountFromETB = Number(form.elements.namedItem('amountFromETB').value) || 0;
        const amountToETB = Number(form.elements.namedItem('amountToETB').value) || 0;
        const requiredRole = form.elements.namedItem('requiredRole').value;
        const approvalSequence = Number(form.elements.namedItem('approvalSequence').value) || 1;
        const docsRaw = form.elements.namedItem('mandatoryDocuments').value;
        const mandatoryDocuments = docsRaw.split(',').map(d => d.trim()).filter(Boolean);
        const notes = form.elements.namedItem('notes').value;
        if (editingThreshold) {
            const updatedList = thresholds.map(t => t.id === editingThreshold.id
                ? { ...t, title, amountFromETB, amountToETB, requiredRole, approvalSequence, mandatoryDocuments, notes }
                : t);
            onUpdateThresholds(updatedList);
        }
        else {
            const newT = {
                id: `ath-${Date.now()}`,
                category: selectedCategory,
                title,
                amountFromETB,
                amountToETB,
                requiredRole,
                approvalSequence,
                mandatoryDocuments,
                notes,
                isActive: true,
                updatedBy: currentUser?.username || 'Administrator',
                updatedAt: new Date().toISOString()
            };
            onUpdateThresholds([...thresholds, newT]);
        }
        setIsModalOpen(false);
        setEditingThreshold(null);
    };
    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this approval threshold rule?')) {
            onUpdateThresholds(thresholds.filter(t => t.id !== id));
        }
    };
    const handleToggleActive = (t) => {
        const updated = thresholds.map(item => item.id === t.id ? { ...item, isActive: !item.isActive } : item);
        onUpdateThresholds(updated);
    };
    return (<div className="space-y-6 animate-fade-in text-slate-800">
      {/* Category Tabs */}
      <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-2xs space-y-4">
        <div>
          <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">
            Fiscal &amp; Governance Governance Rules
          </span>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Configurable Approval Threshold Tiers
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Define statutory approval tiers, required roles, and mandatory documentary evidence without modifying application code.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {categories.map(c => (<button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${selectedCategory === c.id
                ? 'bg-cyan-50 border-cyan-400 text-cyan-900 ring-2 ring-cyan-500/20 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
              <h5 className="font-extrabold text-xs">{c.label}</h5>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{c.desc}</p>
            </button>))}
        </div>
      </div>

      {/* Thresholds Table Container */}
      <div className="bg-white rounded-3xl border border-sky-100 shadow-2xs overflow-hidden space-y-4 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900">
              {categories.find(c => c.id === selectedCategory)?.label} Threshold Matrix
            </h4>
            <p className="text-xs text-slate-500">
              Sequential authority progression for {selectedCategory.toLowerCase().replace('_', ' ')} decisions.
            </p>
          </div>

          {canEdit && (<button type="button" onClick={handleOpenCreate} className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4"/>
              <span>Add Threshold Tier</span>
            </button>)}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5 text-center w-12">Seq</th>
                <th className="p-3.5">Tier Title &amp; Scope</th>
                <th className="p-3.5">Amount Range (ETB)</th>
                <th className="p-3.5">Required Approver Role</th>
                <th className="p-3.5">Mandatory Verification Documents</th>
                <th className="p-3.5 text-center">Status</th>
                {canEdit && <th className="p-3.5 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentThresholds.map((t) => (<tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 text-center font-mono font-bold text-cyan-900">
                    #{t.approvalSequence}
                  </td>
                  <td className="p-3.5 max-w-xs">
                    <span className="font-bold text-slate-900 block">{t.title}</span>
                    {t.notes && <span className="text-[11px] text-slate-500 block mt-0.5">{t.notes}</span>}
                  </td>
                  <td className="p-3.5 font-mono">
                    <span className="font-bold text-cyan-950">
                      {formatCurrencyETB(t.amountFromETB)}
                    </span>
                    <span className="text-slate-400 mx-1.5">&rarr;</span>
                    <span className="font-bold text-cyan-950">
                      {t.amountToETB === 0 ? 'Above / Unlimited' : formatCurrencyETB(t.amountToETB)}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-cyan-100 text-cyan-900">
                      {t.requiredRole}
                    </span>
                  </td>
                  <td className="p-3.5 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {t.mandatoryDocuments.map((doc, dIdx) => (<span key={dIdx} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5 text-cyan-600"/>
                          {doc}
                        </span>))}
                    </div>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${t.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {canEdit && (<td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button type="button" onClick={() => handleOpenEdit(t)} className="p-1.5 text-slate-500 hover:text-cyan-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Edit Threshold Tier">
                          <Edit3 className="w-3.5 h-3.5"/>
                        </button>
                        <button type="button" onClick={() => handleToggleActive(t)} className="p-1.5 text-slate-500 hover:text-cyan-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Toggle Status">
                          <CheckCircle2 className="w-3.5 h-3.5"/>
                        </button>
                        <button type="button" onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Delete Threshold Rule">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      </div>
                    </td>)}
                </tr>))}

              {currentThresholds.length === 0 && (<tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No approval threshold tiers configured for {selectedCategory}.
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT THRESHOLD MODAL */}
      {isModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-sky-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">
                Approval Threshold Policy Rule
              </span>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <form onSubmit={handleSaveThreshold} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tier Title</label>
                <input type="text" name="title" required defaultValue={editingThreshold?.title || ''} placeholder="e.g. Tier 2: Intermediate Milestone Disbursements" className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount From (ETB)</label>
                  <input type="number" name="amountFromETB" required min={0} defaultValue={editingThreshold?.amountFromETB ?? 0} className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"/>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount To (ETB) <span className="text-[10px] text-slate-400">(0 = Unlimited)</span>
                  </label>
                  <input type="number" name="amountToETB" required min={0} defaultValue={editingThreshold?.amountToETB ?? 5000000} className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Authorizing Role</label>
                  <select name="requiredRole" defaultValue={editingThreshold?.requiredRole || availableRoles[0]} className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none">
                    {availableRoles.map(r => (<option key={r} value={r}>{r}</option>))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Approval Sequence</label>
                  <input type="number" name="approvalSequence" required min={1} defaultValue={editingThreshold?.approvalSequence || currentThresholds.length + 1} className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandatory Verification Documents <span className="text-slate-400 font-normal">(Comma-separated)</span>
                </label>
                <input type="text" name="mandatoryDocuments" defaultValue={editingThreshold?.mandatoryDocuments.join(', ') || 'Interim Payment Certificate, Site Inspection Sheet'} placeholder="e.g. IPC Form 3, Site Log, Laboratory Test" className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operational Policy Notes</label>
                <input type="text" name="notes" defaultValue={editingThreshold?.notes || ''} placeholder="e.g. Requires joint field inspection sign-off..." className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"/>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl font-black shadow-md cursor-pointer">
                  Save Threshold Rule
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
};
