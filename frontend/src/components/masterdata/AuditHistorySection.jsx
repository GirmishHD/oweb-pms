import React, { useState } from 'react';
import { History, Search, UserCheck, ArrowRight, FileSpreadsheet } from 'lucide-react';
export const AuditHistorySection = ({ historyEntries = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [filterAction, setFilterAction] = useState('ALL');
    const filtered = historyEntries.filter(entry => {
        if (filterType !== 'ALL' && entry.entityType !== filterType)
            return false;
        if (filterAction !== 'ALL' && entry.action !== filterAction)
            return false;
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            return (entry.changeSummary.toLowerCase().includes(q) ||
                entry.entityCode.toLowerCase().includes(q) ||
                entry.entityName.toLowerCase().includes(q) ||
                entry.changedBy.toLowerCase().includes(q));
        }
        return true;
    });
    const handleExportAuditCSV = () => {
        if (historyEntries.length === 0)
            return;
        const headers = ['Timestamp', 'Actor', 'Entity Type', 'Entity Code', 'Entity Name', 'Action', 'Summary', 'Previous Value', 'New Value', 'Reason'];
        const rows = historyEntries.map(e => [
            `"${new Date(e.timestamp).toISOString()}"`,
            `"${e.changedBy}"`,
            `"${e.entityType}"`,
            `"${e.entityCode}"`,
            `"${e.entityName}"`,
            `"${e.action}"`,
            `"${e.changeSummary.replace(/"/g, '""')}"`,
            `"${(e.previousValue || '').replace(/"/g, '""')}"`,
            `"${(e.newValue || '').replace(/"/g, '""')}"`,
            `"${(e.reason || '').replace(/"/g, '""')}"`
        ]);
        const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encoded = encodeURI(csv);
        const link = document.createElement('a');
        link.setAttribute('href', encoded);
        link.setAttribute('download', `OWEB_Master_Data_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (<div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header and Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">
              Governance &amp; Traceability
            </span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Master Data Modification History &amp; Audit Trail
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable timestamped ledger recording all catalog additions, parameter adjustments, workflow alterations, and status toggles.
            </p>
          </div>

          <button onClick={handleExportAuditCSV} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start md:self-auto">
            <FileSpreadsheet className="w-4 h-4 text-cyan-700"/>
            <span>Export Audit Log</span>
          </button>
        </div>

        {/* Search & Selectors */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search audit trail by actor, summary, code..." className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"/>
          </div>

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none">
            <option value="ALL">All Entity Types</option>
            <option value="CATEGORY">Category</option>
            <option value="ITEM">Catalog Item</option>
            <option value="CONFIG">System Config</option>
            <option value="WORKFLOW">Workflow Rule</option>
            <option value="THRESHOLD">Approval Threshold</option>
          </select>

          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none">
            <option value="ALL">All Actions</option>
            <option value="CREATED">Created</option>
            <option value="UPDATED">Updated</option>
            <option value="ACTIVATED">Activated</option>
            <option value="DEACTIVATED">Deactivated</option>
            <option value="DELETED">Deleted</option>
            <option value="IMPORTED">Imported</option>
            <option value="RESET">Reset</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-sky-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Author / Actor</th>
                <th className="p-3.5">Target Scope</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Audit Narrative Description</th>
                <th className="p-3.5">Value Transition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((entry) => (<tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-600"/>
                      {entry.changedBy}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-800 block text-[11px]">{entry.entityName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">[{entry.entityType}] {entry.entityCode}</span>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${entry.action === 'CREATED' ? 'bg-emerald-100 text-emerald-800' :
                entry.action === 'DEACTIVATED' ? 'bg-amber-100 text-amber-800' :
                    entry.action === 'DELETED' ? 'bg-rose-100 text-rose-800' :
                        entry.action === 'IMPORTED' ? 'bg-purple-100 text-purple-800' :
                            'bg-cyan-100 text-cyan-800'}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="p-3.5 max-w-sm">
                    <p className="text-slate-800 font-medium leading-relaxed">{entry.changeSummary}</p>
                    {entry.reason && (<p className="text-[11px] text-slate-500 italic mt-0.5">Reason: &quot;{entry.reason}&quot;</p>)}
                  </td>
                  <td className="p-3.5 font-mono text-[11px] max-w-xs truncate">
                    {entry.previousValue && entry.newValue ? (<div className="flex items-center gap-1.5">
                        <span className="text-rose-600 line-through truncate max-w-[120px]">{entry.previousValue}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0"/>
                        <span className="text-emerald-700 font-bold truncate max-w-[120px]">{entry.newValue}</span>
                      </div>) : (<span className="text-slate-400">&mdash;</span>)}
                  </td>
                </tr>))}

              {filtered.length === 0 && (<tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <History className="w-10 h-10 text-slate-300 mx-auto mb-2"/>
                    <p className="font-bold text-slate-700">No modification events logged</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">All master data alterations will be automatically audited here.</p>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
};
