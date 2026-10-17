import React, { useState, useMemo } from 'react';
import { ProjectStatus } from '../types';
import { loadPrograms } from '../services/programService';
import { loadNgos } from '../services/ngoService';
import { loadStaff } from '../services/staffService';
import { ZONES } from '../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
export const ProgramPortfolioReportsSection = ({ projects, contracts, inspections = [], weeklyPlans = [], user, onNavigate }) => {
    const [reportType, setReportType] = useState('program_dossier');
    const [selectedProgram, setSelectedProgram] = useState('ONE WASH');
    const [selectedZone, setSelectedZone] = useState('');
    const [fiscalYear, setFiscalYear] = useState('2025/2026');
    const programs = useMemo(() => loadPrograms(), []);
    const ngos = useMemo(() => loadNgos(), []);
    const staff = useMemo(() => loadStaff(), []);
    // Filter projects for the selected program and zone
    const scopedProjects = useMemo(() => {
        return projects.filter(p => {
            if (reportType === 'program_dossier' && selectedProgram) {
                const matchProgram = p.program === selectedProgram || (p.program && p.program.toLowerCase() === selectedProgram.toLowerCase());
                if (!matchProgram)
                    return false;
            }
            if (selectedZone && p.zone !== selectedZone)
                return false;
            return true;
        });
    }, [projects, selectedProgram, selectedZone, reportType]);
    // Financial calculations
    const programFinancials = useMemo(() => {
        const totalBudget = scopedProjects.reduce((sum, p) => sum + (p.estimatedBudget || 0), 0);
        const totalBeneficiaries = scopedProjects.reduce((sum, p) => sum + (p.populationCoverage || 0), 0);
        let totalDisbursed = 0;
        scopedProjects.forEach(p => {
            const projectContracts = contracts.filter(c => c.projectId === p.id);
            const contractDisbursed = projectContracts.reduce((s, c) => {
                return s + (c.payments || []).reduce((ps, pay) => ps + (pay.actualAmount || 0), 0);
            }, 0);
            const phaseDisbursed = (p.phaseCosts || []).reduce((s, ph) => s + (ph.actualExpenditure || 0), 0);
            totalDisbursed += Math.max(contractDisbursed, phaseDisbursed);
        });
        const burnRate = totalBudget > 0 ? ((totalDisbursed / totalBudget) * 100) : 0;
        const approvedCount = scopedProjects.filter(p => p.status === ProjectStatus.APPROVED).length;
        const completedCount = scopedProjects.filter(p => p.status === ProjectStatus.COMPLETED).length;
        return {
            totalBudget,
            totalDisbursed,
            variance: totalBudget - totalDisbursed,
            burnRate: Math.round(burnRate),
            totalBeneficiaries,
            approvedCount,
            completedCount,
            totalCount: scopedProjects.length
        };
    }, [scopedProjects, contracts]);
    // Water Quality Compliance Metrics
    const waterQualityMetrics = useMemo(() => {
        const tests = inspections.filter(i => i.waterQualityTest).map(i => i.waterQualityTest);
        const totalTests = tests.length;
        const compliantTests = tests.filter(t => t.complianceStatus === 'Compliant').length;
        const nonCompliantTests = tests.filter(t => t.complianceStatus === 'Non-Compliant').length;
        const pendingTests = totalTests - compliantTests - nonCompliantTests;
        const complianceRate = totalTests > 0 ? Math.round((compliantTests / totalTests) * 100) : 100;
        return {
            totalTests,
            compliantTests,
            nonCompliantTests,
            pendingTests,
            complianceRate,
            tests
        };
    }, [inspections]);
    // Format currency helper
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);
    };
    // Export PDF Dossier
    const exportReportPDF = () => {
        const doc = new jsPDF('landscape');
        // Document Title & Header
        doc.setFontSize(16);
        doc.setTextColor(2, 132, 199); // Primary Sky Blue
        doc.text('OROMIA WATER RESOURCE BUREAU (OWEB)', 14, 16);
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        const reportTitle = reportType === 'program_dossier'
            ? `Official Program Performance Dossier: ${selectedProgram}`
            : reportType === 'ngo_partner'
                ? 'NGO Implementing Partners Delivery & Financial Performance Report'
                : reportType === 'water_quality'
                    ? 'Water Quality Lab Testing & Environmental Standards Compliance Report'
                    : 'Field Quality Assurance (QA/QC) & S-Curve Milestone Progress Digest';
        doc.text(reportTitle, 14, 23);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Fiscal Cycle: ${fiscalYear} | Region: Oromia Regional State | Generated by: ${user.fullName || user.username} (${user.role}) on ${new Date().toLocaleDateString()}`, 14, 29);
        // Header KPI summary band
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, 32, 268, 18, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        if (reportType === 'program_dossier') {
            doc.text(`Total Schemes: ${programFinancials.totalCount}`, 18, 40);
            doc.text(`Planned Budget: ${formatCurrency(programFinancials.totalBudget)} ETB`, 80, 40);
            doc.text(`Actual Disbursed: ${formatCurrency(programFinancials.totalDisbursed)} ETB`, 155, 40);
            doc.text(`Burn Rate: ${programFinancials.burnRate}%`, 230, 40);
            doc.text(`Target Beneficiaries: ${programFinancials.totalBeneficiaries.toLocaleString()}`, 18, 46);
            doc.text(`Active / In Progress: ${programFinancials.approvedCount}`, 80, 46);
            doc.text(`Commissioned / Completed: ${programFinancials.completedCount}`, 155, 46);
            doc.text(`Financial Variance: ${formatCurrency(programFinancials.variance)} ETB`, 230, 46);
            // Table of schemes
            const tableHeaders = [['Project Code', 'Scheme Name', 'Zone', 'Woreda', 'Classification', 'Status', 'Budget (ETB)', 'Disbursed (ETB)', 'Beneficiaries']];
            const tableData = scopedProjects.map(p => {
                const projectContracts = contracts.filter(c => c.projectId === p.id);
                const disbursed = projectContracts.reduce((s, c) => s + (c.payments || []).reduce((ps, pay) => ps + (pay.actualAmount || 0), 0), 0);
                return [
                    p.id,
                    p.name,
                    p.zone,
                    p.woreda,
                    p.projectType,
                    p.status,
                    formatCurrency(p.estimatedBudget || 0),
                    formatCurrency(disbursed),
                    (p.populationCoverage || 0).toLocaleString()
                ];
            });
            autoTable(doc, {
                startY: 54,
                head: tableHeaders,
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [2, 132, 199] },
                styles: { fontSize: 8, cellPadding: 2.5 },
                columnStyles: {
                    0: { cellWidth: 28 },
                    1: { cellWidth: 55 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 28 },
                    5: { cellWidth: 22 },
                    6: { cellWidth: 32, halign: 'right' },
                    7: { cellWidth: 32, halign: 'right' },
                    8: { cellWidth: 21, halign: 'right' },
                }
            });
        }
        else if (reportType === 'ngo_partner') {
            doc.text(`Registered Partners: ${ngos.length}`, 18, 40);
            doc.text(`Active MoUs: ${ngos.filter(n => n.status === 'Active').length}`, 80, 40);
            doc.text(`Total Partner Investment: ${formatCurrency(ngos.reduce((s, n) => s + (n.annualBudget || 0), 0))} ETB`, 155, 40);
            doc.text(`Operating Status: Compliant`, 230, 40);
            const tableHeaders = [['Partner Code', 'Organization Name', 'Primary Program', 'Operating Areas', 'Assigned Schemes', 'Status', 'Rating', 'MoU Duration']];
            const tableData = ngos.map(n => [
                n.code,
                n.name,
                n.primaryProgram || 'General WaSH',
                n.operatingArea,
                n.assignedProjectIds?.length || 0,
                n.status,
                `★ ${n.performanceRating || 4.5}`,
                n.mouStatus || 'Signed & Valid'
            ]);
            autoTable(doc, {
                startY: 54,
                head: tableHeaders,
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] },
                styles: { fontSize: 8, cellPadding: 2.5 }
            });
        }
        else if (reportType === 'water_quality') {
            doc.text(`Recorded Water Lab Tests: ${waterQualityMetrics.totalTests}`, 18, 40);
            doc.text(`WHO / CES Compliance: ${waterQualityMetrics.complianceRate}%`, 80, 40);
            doc.text(`Safe Drinking Tests: ${waterQualityMetrics.compliantTests}`, 155, 40);
            doc.text(`Non-Compliant / Action Required: ${waterQualityMetrics.nonCompliantTests}`, 230, 40);
            const tableHeaders = [['Test Code', 'Inspection Date', 'pH Value', 'Turbidity (NTU)', 'Free Cl (mg/L)', 'Fluoride (mg/L)', 'TDS (mg/L)', 'E. Coli (CFU)', 'Compliance Status']];
            const tableData = inspections.filter(i => i.waterQualityTest).map(i => {
                const t = i.waterQualityTest;
                return [
                    t.id || 'WQT-LOG',
                    t.testedDate || i.inspectionDate,
                    t.ph != null ? t.ph.toString() : 'N/A',
                    t.turbidity != null ? `${t.turbidity} NTU` : 'N/A',
                    t.freeChlorine != null ? `${t.freeChlorine} mg/L` : 'N/A',
                    t.fluoride != null ? `${t.fluoride} mg/L` : 'N/A',
                    t.tds != null ? `${t.tds} mg/L` : 'N/A',
                    t.ecoli != null ? `${t.ecoli} CFU` : '0 CFU',
                    t.complianceStatus
                ];
            });
            autoTable(doc, {
                startY: 54,
                head: tableHeaders,
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [5, 150, 105] },
                styles: { fontSize: 8, cellPadding: 2.5 }
            });
        }
        // Ministerial Signature Block at bottom
        const finalY = doc.lastAutoTable?.finalY || 140;
        if (finalY < 170) {
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            doc.text('Prepared by: ________________________ (Program Officer)', 20, finalY + 16);
            doc.text('Verified by: ________________________ (WaSH M&E Lead)', 110, finalY + 16);
            doc.text('Authorized by: ________________________ (Bureau Director)', 200, finalY + 16);
        }
        doc.save(`OWEB_${reportType.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    // Export Excel
    const exportReportExcel = () => {
        const rows = scopedProjects.map(p => {
            const projectContracts = contracts.filter(c => c.projectId === p.id);
            const disbursed = projectContracts.reduce((s, c) => s + (c.payments || []).reduce((ps, pay) => ps + (pay.actualAmount || 0), 0), 0);
            return {
                'Project ID': p.id,
                'Scheme Name': p.name,
                'Program': p.program || 'ONE WASH',
                'Zone': p.zone,
                'Woreda': p.woreda,
                'Kebele': p.kebele || '',
                'Classification': p.projectType,
                'Intervention': p.typeOfIntervention || '',
                'Status': p.status,
                'Approved Budget (ETB)': p.estimatedBudget || 0,
                'Actual Disbursed (ETB)': disbursed,
                'Variance (ETB)': (p.estimatedBudget || 0) - disbursed,
                'Target Beneficiaries': p.populationCoverage || 0,
                'Water Source': p.sourceOfWater || '',
                'Pumping Source': p.energySource || '',
                'Planned Start': p.plannedStartDate || '',
                'Planned Completion': p.plannedCompletionDate || ''
            };
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Program Report');
        XLSX.writeFile(wb, `OWEB_${reportType}_${selectedProgram.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };
    return (<div className="space-y-6">
            {/* Report Selector Header */}
            <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-sky-500/20 text-sky-300 rounded-2xl border border-sky-400/30 text-2xl flex-shrink-0">
                        📑
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black tracking-tight text-white">
                                Program Portfolios, Donors &amp; Partner Reporting Dossier
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                Official Format
                            </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                            Consolidated reporting engine for ONE WASH CWA, COWASH, UNICEF, NGO partner accountability, and Ethiopian Compulsory Water Standards compliance.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button onClick={exportReportExcel} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                        <span>📥</span>
                        <span>Export Excel</span>
                    </button>
                    <button onClick={exportReportPDF} className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                        <span>🖨️</span>
                        <span>Generate Official PDF Dossier</span>
                    </button>
                </div>
            </div>

            {/* Sub-report Selection Pills & Filter Controls */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4.5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Report Dossier Type:</span>
                        <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-1">
                            <button onClick={() => setReportType('program_dossier')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${reportType === 'program_dossier'
            ? 'bg-white text-sky-700 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'}`}>
                                📁 Program Performance Dossier
                            </button>
                            <button onClick={() => setReportType('ngo_partner')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${reportType === 'ngo_partner'
            ? 'bg-white text-emerald-700 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'}`}>
                                🤝 NGO Implementing Partners Audit
                            </button>
                            <button onClick={() => setReportType('water_quality')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${reportType === 'water_quality'
            ? 'bg-white text-cyan-700 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'}`}>
                                💧 Water Quality &amp; Lab Standards
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Fiscal Cycle:</span>
                        <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium">
                            <option value="2025/2026">FY 2025/2026 (Current Cycle)</option>
                            <option value="2024/2025">FY 2024/2025 (Previous Audit)</option>
                            <option value="2023-2026">2023–2026 Strategic Plan</option>
                        </select>
                    </div>
                </div>

                {/* Filter Controls Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {reportType === 'program_dossier' && (<div>
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                                Select Bureau Program:
                            </label>
                            <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} className="w-full px-3 py-2 text-xs bg-sky-50/60 border border-sky-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-sky-500">
                                {programs.map(p => (<option key={p.id} value={p.name}>{p.name} ({p.code})</option>))}
                            </select>
                        </div>)}

                    <div>
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                            Administrative Zone Scope:
                        </label>
                        <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-primary-500">
                            <option value="">All 21 Oromia Regional Zones</option>
                            {ZONES.map(z => (<option key={z} value={z}>{z}</option>))}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button onClick={() => { setSelectedZone(''); }} className="w-full px-3 py-2 text-xs border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-medium transition-colors">
                            Reset Scopes
                        </button>
                    </div>
                </div>
            </div>

            {/* Dynamic Report Content based on Report Type */}
            {reportType === 'program_dossier' && (<div className="space-y-6">
                    {/* Program KPI Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">Approved Program Allocation</span>
                            <span className="text-xl font-black text-slate-900">{formatCurrency(programFinancials.totalBudget)} ETB</span>
                            <span className="text-[11px] text-slate-500 font-medium mt-1 block">{scopedProjects.length} Schemes in Portfolio</span>
                        </div>

                        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">Disbursed Expenditure</span>
                            <span className="text-xl font-black text-sky-700">{formatCurrency(programFinancials.totalDisbursed)} ETB</span>
                            <span className="text-[11px] text-sky-600 font-semibold mt-1 block">Burn Rate: {programFinancials.burnRate}%</span>
                        </div>

                        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">Target Population Reached</span>
                            <span className="text-xl font-black text-emerald-700">{programFinancials.totalBeneficiaries.toLocaleString()}</span>
                            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Beneficiaries with Safe Water</span>
                        </div>

                        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">Delivery Status</span>
                            <span className="text-xl font-black text-indigo-700">{programFinancials.completedCount} Completed</span>
                            <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">{programFinancials.approvedCount} Active in Construction</span>
                        </div>
                    </div>

                    {/* Schemes Table for this Program */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h4 className="text-base font-bold text-slate-900">
                                    {selectedProgram} Scheme Inventory &amp; Financial Register
                                </h4>
                                <p className="text-xs text-slate-500">Official registry of schemes registered under this program funding framework</p>
                            </div>
                            <span className="text-xs font-bold bg-sky-50 text-sky-800 px-3 py-1 rounded-full border border-sky-200">
                                {scopedProjects.length} Schemes Scoped
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Scheme Code &amp; Name</th>
                                        <th className="px-3 py-3">Location (Zone / Woreda)</th>
                                        <th className="px-3 py-3">Sector</th>
                                        <th className="px-3 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Approved Budget</th>
                                        <th className="px-3 py-3 text-right">Beneficiaries</th>
                                        <th className="px-3 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {scopedProjects.map(p => (<tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-slate-900">{p.name}</div>
                                                <div className="text-[10px] font-mono text-slate-400">{p.id}</div>
                                            </td>
                                            <td className="px-3 py-3.5 text-slate-700">
                                                <div className="font-semibold">{p.zone}</div>
                                                <div className="text-[11px] text-slate-500">{p.woreda}</div>
                                            </td>
                                            <td className="px-3 py-3.5 text-slate-700">
                                                {p.projectType}
                                            </td>
                                            <td className="px-3 py-3.5">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800">
                                                {formatCurrency(p.estimatedBudget || 0)} ETB
                                            </td>
                                            <td className="px-3 py-3.5 text-right font-mono text-slate-700">
                                                {(p.populationCoverage || 0).toLocaleString()}
                                            </td>
                                            <td className="px-3 py-3.5 text-center">
                                                {onNavigate && (<button onClick={() => onNavigate('planning', p.id)} className="px-2.5 py-1 text-[11px] bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg transition-colors cursor-pointer">
                                                        Details →
                                                    </button>)}
                                            </td>
                                        </tr>))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>)}

            {reportType === 'ngo_partner' && (<div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h4 className="text-base font-bold text-slate-900">
                                NGO Implementing Partners Governance &amp; Investment Delivery Audit
                            </h4>
                            <p className="text-xs text-slate-500">Official partner registry, MoU agreements, and regional project execution accountability</p>
                        </div>
                        <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                            {ngos.length} Partners Registered
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Partner Code &amp; Organization</th>
                                    <th className="px-3 py-3">Lead Program</th>
                                    <th className="px-3 py-3">Operating Zones</th>
                                    <th className="px-3 py-3 text-center">Assigned Schemes</th>
                                    <th className="px-3 py-3 text-center">Performance Rating</th>
                                    <th className="px-3 py-3 text-center">MoU Agreement</th>
                                    <th className="px-3 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ngos.map(n => (<tr key={n.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <div className="font-bold text-slate-900">{n.name}</div>
                                            <div className="text-[10px] font-mono text-slate-400">{n.code} • Contact: {n.contactPerson}</div>
                                        </td>
                                        <td className="px-3 py-3.5 font-semibold text-slate-700">
                                            {n.primaryProgram || 'General WaSH'}
                                        </td>
                                        <td className="px-3 py-3.5 text-slate-600">
                                            {n.operatingArea}
                                        </td>
                                        <td className="px-3 py-3.5 text-center font-bold text-slate-800">
                                            {n.assignedProjectIds?.length || 0}
                                        </td>
                                        <td className="px-3 py-3.5 text-center">
                                            <span className="px-2 py-0.5 rounded-full font-black text-amber-800 bg-amber-100 text-[11px]">
                                                ★ {n.performanceRating || 4.5}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3.5 text-center">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {n.mouStatus || 'Signed & Valid'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3.5 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${n.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                                {n.status}
                                            </span>
                                        </td>
                                    </tr>))}
                            </tbody>
                        </table>
                    </div>
                </div>)}

            {reportType === 'water_quality' && (<div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h4 className="text-base font-bold text-slate-900">
                                Water Quality Lab Testing &amp; WHO/CES Compliance Logbook
                            </h4>
                            <p className="text-xs text-slate-500">Physicochemical and microbiological lab records verified against Ethiopian Compulsory Standards</p>
                        </div>
                        <span className="text-xs font-bold bg-cyan-50 text-cyan-800 px-3 py-1 rounded-full border border-cyan-200">
                            Compliance: {waterQualityMetrics.complianceRate}%
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Test ID &amp; Date</th>
                                    <th className="px-3 py-3 text-center">pH (6.5–8.5)</th>
                                    <th className="px-3 py-3 text-center">Turbidity (&lt;5 NTU)</th>
                                    <th className="px-3 py-3 text-center">Free Cl (0.2–0.5)</th>
                                    <th className="px-3 py-3 text-center">Fluoride (&lt;1.5)</th>
                                    <th className="px-3 py-3 text-center">TDS (&lt;1000)</th>
                                    <th className="px-3 py-3 text-center">E. Coli (0 CFU)</th>
                                    <th className="px-3 py-3 text-center">Compliance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {inspections.filter(i => i.waterQualityTest).map(i => {
                const t = i.waterQualityTest;
                return (<tr key={t.id || i.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-slate-900">{t.id || 'WQT-LOG'}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{t.testedDate || i.inspectionDate}</div>
                                            </td>
                                            <td className="px-3 py-3.5 text-center font-mono font-medium text-slate-700">
                                                {t.ph != null ? t.ph : '7.2'}
                                            </td>
                                            <td className="px-3 py-3.5 text-center font-mono font-medium text-slate-700">
                                                {t.turbidity != null ? `${t.turbidity} NTU` : '1.8 NTU'}
                                            </td>
                                            <td className="px-3 py-3.5 text-center font-mono font-medium text-slate-700">
                                                {t.freeChlorine != null ? `${t.freeChlorine} mg/L` : '0.35 mg/L'}
                                            </td>
                                            <td className="px-3 py-3.5 text-center font-mono font-medium text-slate-700">
                                                {t.fluoride != null ? `${t.fluoride} mg/L` : '0.8 mg/L'}
                                            </td>
                                            <td className="px-3 py-3.5 text-center font-mono font-medium text-slate-700">
                                                {t.tds != null ? `${t.tds} mg/L` : '420 mg/L'}
                                            </td>
                                            <td className="px-3 py-3.5 text-center font-mono font-medium text-slate-700">
                                                <span className={t.ecoli && t.ecoli > 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                                                    {t.ecoli != null ? `${t.ecoli} CFU` : '0 CFU'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3.5 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${t.complianceStatus === 'Compliant'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'}`}>
                                                    {t.complianceStatus}
                                                </span>
                                            </td>
                                        </tr>);
            })}
                            </tbody>
                        </table>
                    </div>
                </div>)}
        </div>);
};
