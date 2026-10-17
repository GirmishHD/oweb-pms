import React, { useState } from 'react';
import { validateMasterDataImport, executeMasterDataImport } from '../../services/masterDataService';
import { Upload, X, FileText, CheckCircle2, Check, FileSpreadsheet, FileCode } from 'lucide-react';
export const ImportExportModal = ({ isOpen, onClose, masterData, onImportComplete, currentUser }) => {
    const [activeTab, setActiveTab] = useState('import');
    const [importText, setImportText] = useState('');
    const [validationResult, setValidationResult] = useState(null);
    const [fileName, setFileName] = useState('');
    if (!isOpen)
        return null;
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result;
            setImportText(content);
            const res = validateMasterDataImport(content, masterData);
            setValidationResult(res);
        };
        reader.readAsText(file);
    };
    const handleValidateManual = () => {
        if (!importText.trim())
            return;
        const res = validateMasterDataImport(importText, masterData);
        setValidationResult(res);
    };
    const handleCommitImport = () => {
        if (!validationResult || validationResult.validCount === 0)
            return;
        const updated = executeMasterDataImport(masterData, validationResult.rows, currentUser?.username || 'Administrator');
        onImportComplete(updated);
        onClose();
    };
    const handleDownloadSampleCSV = () => {
        const sample = `categoryCode,code,name,description,parentCode,displayOrder,isActive
PROJECT_TYPE,PRJ_DESALINATION,Solar Desalination Facility,Advanced reverse-osmosis purification,,15,true
PROJECT_SUBTYPE,SUB_DESAL_RO,Modular Sea/Brackish RO,Deep groundwater mineral extraction,PRJ_DESALINATION,1,true
WATER_SOURCE,WS_DESAL_WELL,Brackish Deep Well,Geothermal/saline deep aquifer,,7,true
UNIT_OF_MEASURE,L_DAY,Liters per Day (l/d),Daily per capita consumption metric,,8,true`;
        const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'OWEB_Master_Data_Import_Template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const handleExportFullJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(masterData, null, 2));
        const link = document.createElement('a');
        link.href = dataStr;
        link.setAttribute('download', `OWEB_Master_Data_Full_Dossier_v${masterData.version}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const handleExportItemsCSV = () => {
        const items = masterData.catalogItems || [];
        const headers = ['CategoryCode', 'Code', 'Name', 'Description', 'ParentCode', 'DisplayOrder', 'IsActive'];
        const rows = items.map(i => [
            `"${i.categoryCode}"`,
            `"${i.code}"`,
            `"${i.name.replace(/"/g, '""')}"`,
            `"${(i.description || '').replace(/"/g, '""')}"`,
            `"${i.parentCode || ''}"`,
            i.displayOrder,
            i.isActive ? 'true' : 'false'
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encoded = encodeURI(csvContent);
        const link = document.createElement('a');
        link.href = encoded;
        link.setAttribute('download', `OWEB_Master_Catalog_Items_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-sky-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#06203c] via-[#083359] to-[#041a30] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-300 rounded-2xl border border-cyan-400/30">
              <Upload className="w-5 h-5"/>
            </div>
            <div>
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">
                Catalog Data Exchange &amp; ETL
              </span>
              <h3 className="text-base font-black tracking-tight text-white">
                Master Data Import &amp; Export Center
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-sky-200 hover:text-white hover:bg-cyan-900/50 rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2">
          <button type="button" onClick={() => setActiveTab('import')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'import' ? 'bg-cyan-700 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            Import with Validation Preview
          </button>
          <button type="button" onClick={() => setActiveTab('export')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'export' ? 'bg-cyan-700 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            Export Dossiers &amp; Templates
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 text-xs">
          {activeTab === 'import' ? (<div className="space-y-4">
              {/* File Upload Drop Zone */}
              <div className="p-5 border-2 border-dashed border-sky-200 rounded-3xl bg-sky-50/40 text-center space-y-2">
                <Upload className="w-8 h-8 text-cyan-600 mx-auto"/>
                <div>
                  <label htmlFor="csvUpload" className="font-bold text-cyan-900 hover:text-cyan-700 cursor-pointer underline">
                    Choose a CSV or JSON file to upload
                  </label>
                  <p className="text-[11px] text-slate-500">Supports standard master data columns with automatic validation</p>
                </div>
                <input type="file" id="csvUpload" accept=".csv,.json" onChange={handleFileUpload} className="hidden"/>
                {fileName && (<span className="inline-block px-3 py-1 bg-white border border-sky-200 rounded-full text-xs font-mono text-cyan-900 font-bold">
                    {fileName}
                  </span>)}
              </div>

              {/* Or Paste CSV/JSON Area */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Or Paste CSV / JSON Records Directly</label>
                  <button type="button" onClick={handleValidateManual} className="text-[11px] font-bold text-cyan-700 hover:text-cyan-900 cursor-pointer">
                    Run Pre-Flight Validation
                  </button>
                </div>
                <textarea rows={4} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="categoryCode,code,name,description,parentCode,displayOrder,isActive&#10;PROJECT_TYPE,SOLAR_PUMP,Solar PV Scheme,Deep solar extraction,,10,true" className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"/>
              </div>

              {/* Pre-flight Validation Results Box */}
              {validationResult && (<div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h5 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-cyan-600"/>
                      Pre-Flight Validation Assessment Summary
                    </h5>
                  </div>

                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">Records Found</span>
                      <span className="font-mono font-black text-slate-900 text-sm">{validationResult.totalRecords}</span>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 block font-bold">Valid &amp; Ready</span>
                      <span className="font-mono font-black text-emerald-900 text-sm">{validationResult.validCount}</span>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-[10px] text-amber-700 block font-bold">Duplicates</span>
                      <span className="font-mono font-black text-amber-900 text-sm">{validationResult.duplicateCount}</span>
                    </div>
                    <div className="p-2 bg-rose-50 rounded-xl border border-rose-200">
                      <span className="text-[10px] text-rose-700 block font-bold">Errors</span>
                      <span className="font-mono font-black text-rose-900 text-sm">{validationResult.errorCount}</span>
                    </div>
                  </div>

                  {/* Detailed Row-by-Row Review Table */}
                  <div className="max-h-48 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl bg-white">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[9px] border-b border-slate-200">
                        <tr>
                          <th className="p-2 text-center">Row</th>
                          <th className="p-2">Code</th>
                          <th className="p-2">Name</th>
                          <th className="p-2">Category</th>
                          <th className="p-2 text-center">Status</th>
                          <th className="p-2">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {validationResult.rows.map(r => (<tr key={r.rowNumber} className="hover:bg-slate-50">
                            <td className="p-2 text-center font-mono font-bold text-slate-400">{r.rowNumber}</td>
                            <td className="p-2 font-mono font-bold text-slate-800">{r.code}</td>
                            <td className="p-2 font-semibold text-slate-900">{r.name}</td>
                            <td className="p-2 text-slate-600">{r.categoryCode}</td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${r.status === 'VALID' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'}`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="p-2 text-slate-500 text-[10px]">
                              {r.errorDetails && r.errorDetails.length > 0 ? r.errorDetails.join(', ') : 'Ready for database persistence.'}
                            </td>
                          </tr>))}
                      </tbody>
                    </table>
                  </div>

                  {/* Commit Button */}
                  <div className="pt-2 flex justify-end">
                    <button type="button" disabled={validationResult.validCount === 0} onClick={handleCommitImport} className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40">
                      <Check className="w-4 h-4"/>
                      <span>Commit {validationResult.validCount} Valid Record(s) to Master Data</span>
                    </button>
                  </div>
                </div>)}
            </div>) : (<div className="space-y-4">
              <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-1">
                <h5 className="font-bold text-slate-900 text-xs">Full Master Data Catalog Export</h5>
                <p className="text-[11px] text-slate-500">
                  Export standard reference catalogs, active system parameters, and taxonomy trees in standard formats.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <button type="button" onClick={handleExportItemsCSV} className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 transition-all cursor-pointer shadow-2xs">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600"/>
                  <div>
                    <h6 className="font-bold text-slate-900 text-xs">Catalog Items (CSV)</h6>
                    <p className="text-[10px] text-slate-500 mt-0.5">Flattened spreadsheet containing all active &amp; inactive items.</p>
                  </div>
                </button>

                <button type="button" onClick={handleExportFullJSON} className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 transition-all cursor-pointer shadow-2xs">
                  <FileCode className="w-6 h-6 text-cyan-600"/>
                  <div>
                    <h6 className="font-bold text-slate-900 text-xs">Full Master Dossier (JSON)</h6>
                    <p className="text-[10px] text-slate-500 mt-0.5">Complete database payload with workflows and thresholds.</p>
                  </div>
                </button>

                <button type="button" onClick={handleDownloadSampleCSV} className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 transition-all cursor-pointer shadow-2xs">
                  <FileText className="w-6 h-6 text-sky-600"/>
                  <div>
                    <h6 className="font-bold text-slate-900 text-xs">Import Template (CSV)</h6>
                    <p className="text-[10px] text-slate-500 mt-0.5">Sample CSV with headers for bulk data entry.</p>
                  </div>
                </button>
              </div>
            </div>)}
        </div>
      </div>
    </div>);
};
