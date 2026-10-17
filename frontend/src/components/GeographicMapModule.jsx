import React, { useState, useMemo } from 'react';
import { ProjectStatus } from '../types';
import { ZONES, ZONE_COORDINATES, PROGRAMS, PROGRAM_DEFINITIONS, ICONS, PROJECT_TYPES } from '../constants';
import { loadPrograms } from '../services/programService';
import { loadNgos } from '../services/ngoService';
// Bounding box for Oromia Regional State approximately
// Lat: ~3.5°N (South Borena) to ~10.5°N (North Shewa)
// Lng: ~34.0°E (West Wollega) to ~43.0°E (East Hararghe)
const MAP_BOUNDS = {
    minLat: 3.4,
    maxLat: 10.6,
    minLng: 34.0,
    maxLng: 43.2,
};
// Coordinate projection to SVG 1000x650 viewport
const projectToSvg = (lat, lng) => {
    const clampedLat = Math.max(MAP_BOUNDS.minLat, Math.min(MAP_BOUNDS.maxLat, lat));
    const clampedLng = Math.max(MAP_BOUNDS.minLng, Math.min(MAP_BOUNDS.maxLng, lng));
    const x = ((clampedLng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 920 + 40;
    // Invert Y because latitude goes North (up), but SVG Y goes down
    const y = ((MAP_BOUNDS.maxLat - clampedLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 540 + 50;
    return { x, y };
};
const SCHEME_ICONS = {
    'Water Supply': '💧',
    'Sanitation': '🚻',
    'Water Resources Management': '🌿',
};
const STATUS_COLOR_MAP = {
    [ProjectStatus.APPROVED]: { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-700', dot: '#10b981' },
    [ProjectStatus.COMPLETED]: { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-blue-700', dot: '#2563eb' },
    [ProjectStatus.UNDER_REVIEW]: { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-amber-700', dot: '#f59e0b' },
    [ProjectStatus.SUBMITTED]: { bg: 'bg-indigo-500', border: 'border-indigo-600', text: 'text-indigo-700', dot: '#6366f1' },
    [ProjectStatus.DRAFT]: { bg: 'bg-slate-400', border: 'border-slate-500', text: 'text-slate-600', dot: '#94a3b8' },
    [ProjectStatus.REJECTED]: { bg: 'bg-rose-500', border: 'border-rose-600', text: 'text-rose-700', dot: '#f43f5e' },
    [ProjectStatus.CANCELLED]: { bg: 'bg-slate-600', border: 'border-slate-700', text: 'text-slate-700', dot: '#475569' },
};
const GeographicMapModule = ({ projects, user, inspections = [], onSelectProject, onNavigate }) => {
    const [selectedProgram, setSelectedProgram] = useState(() => {
        return user.assignedProgram && user.assignedProgram !== 'All Programs (Bureau Level)' ? user.assignedProgram : '';
    });
    const [selectedZone, setSelectedZone] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedImplementingBody, setSelectedImplementingBody] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [mapLayer, setMapLayer] = useState('standard');
    const [selectedProject, setSelectedProject] = useState(null);
    const [hoveredZone, setHoveredZone] = useState(null);
    const registeredPrograms = useMemo(() => loadPrograms(), []);
    const registeredNgos = useMemo(() => loadNgos(), []);
    const allProgramOptions = useMemo(() => {
        const regNames = registeredPrograms.map(p => p.name);
        return Array.from(new Set([...regNames, ...PROGRAMS]));
    }, [registeredPrograms]);
    const allImplementingBodies = useMemo(() => {
        const bodies = new Set();
        projects.forEach(p => {
            if (p.implementingBody)
                bodies.add(p.implementingBody);
        });
        registeredNgos.forEach(n => {
            bodies.add(n.name);
            bodies.add(`NGO: ${n.name}`);
        });
        return Array.from(bodies).sort();
    }, [projects, registeredNgos]);
    // Map latest inspection per project
    const latestInspectionsByProject = useMemo(() => {
        const map = {};
        inspections.forEach(insp => {
            if (!map[insp.projectId] || new Date(insp.inspectionDate) > new Date(map[insp.projectId].inspectionDate)) {
                map[insp.projectId] = insp;
            }
        });
        return map;
    }, [inspections]);
    // Filter projects based on selections
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            if (selectedProgram && p.program !== selectedProgram)
                return false;
            if (selectedZone && p.zone !== selectedZone)
                return false;
            if (selectedStatus && p.status !== selectedStatus)
                return false;
            if (selectedType && p.projectType !== selectedType)
                return false;
            if (selectedImplementingBody && p.implementingBody !== selectedImplementingBody)
                return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = p.name.toLowerCase().includes(q);
                const matchWoreda = p.woreda.toLowerCase().includes(q);
                const matchKebele = (p.kebele || '').toLowerCase().includes(q);
                const matchZone = p.zone.toLowerCase().includes(q);
                if (!matchName && !matchWoreda && !matchKebele && !matchZone)
                    return false;
            }
            return true;
        });
    }, [projects, selectedProgram, selectedZone, selectedStatus, selectedType, selectedImplementingBody, searchQuery]);
    // Aggregate statistics
    const stats = useMemo(() => {
        const totalBudget = filteredProjects.reduce((acc, p) => acc + (p.estimatedBudget || 0), 0);
        const totalBeneficiaries = filteredProjects.reduce((acc, p) => acc + (p.populationCoverage || 0), 0);
        const activeCount = filteredProjects.filter(p => p.status === ProjectStatus.APPROVED || p.status === ProjectStatus.UNDER_REVIEW).length;
        const completedCount = filteredProjects.filter(p => p.status === ProjectStatus.COMPLETED).length;
        // Zone counts
        const zoneCounts = {};
        filteredProjects.forEach(p => {
            zoneCounts[p.zone] = (zoneCounts[p.zone] || 0) + 1;
        });
        return {
            totalCount: filteredProjects.length,
            totalBudget,
            totalBeneficiaries,
            activeCount,
            completedCount,
            zoneCounts
        };
    }, [filteredProjects]);
    const formatCurrency = (amount) => {
        if (amount >= 1_000_000_000)
            return `${(amount / 1_000_000_000).toFixed(2)}B ETB`;
        if (amount >= 1_000_000)
            return `${(amount / 1_000_000).toFixed(1)}M ETB`;
        return `${amount.toLocaleString()} ETB`;
    };
    const handleExportGeoJSON = () => {
        const features = filteredProjects.map(p => {
            let lat = p.gpsCoordinates?.lat;
            let lng = p.gpsCoordinates?.long;
            if (!lat || !lng || (lat === 0 && lng === 0)) {
                const fallback = ZONE_COORDINATES[p.zone];
                lat = fallback ? fallback.lat : 8.5;
                lng = fallback ? fallback.lng : 38.5;
            }
            const insp = latestInspectionsByProject[p.id];
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [lng, lat, p.elevation || 0]
                },
                properties: {
                    id: p.id,
                    name: p.name,
                    zone: p.zone,
                    woreda: p.woreda,
                    kebele: p.kebele || '',
                    program: p.program || '',
                    projectType: p.projectType,
                    projectSubType: p.projectSubType || '',
                    status: p.status,
                    estimatedBudgetETB: p.estimatedBudget || 0,
                    populationCoverage: p.populationCoverage || 0,
                    waterSource: p.sourceOfWater || '',
                    energySource: p.energySource || '',
                    waterQualityStatus: insp?.waterQualityTest?.complianceStatus || 'Not Tested',
                    openDefectsCount: (insp?.defects || []).filter(d => d.status === 'Open').length,
                    lastInspectionDate: insp?.inspectionDate || null
                }
            };
        });
        const geojson = {
            type: 'FeatureCollection',
            name: 'OWEB_Spatial_Water_Schemes',
            crs: {
                type: 'name',
                properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
            },
            features
        };
        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OWEB_Water_Schemes_${new Date().toISOString().split('T')[0]}.geojson`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    const handleExportCSV = () => {
        const headers = [
            'Project ID',
            'Project Name',
            'Zone',
            'Woreda',
            'Kebele',
            'Latitude',
            'Longitude',
            'Elevation (m)',
            'Program',
            'Classification',
            'Status',
            'Budget (ETB)',
            'Beneficiaries',
            'Water Source',
            'Energy Source',
            'Water Quality Lab Status',
            'Open Defects Count',
            'Last Inspection Date'
        ];
        const rows = filteredProjects.map(p => {
            let lat = p.gpsCoordinates?.lat || 0;
            let lng = p.gpsCoordinates?.long || 0;
            if (!lat && !lng) {
                const fallback = ZONE_COORDINATES[p.zone];
                lat = fallback ? fallback.lat : 0;
                lng = fallback ? fallback.lng : 0;
            }
            const insp = latestInspectionsByProject[p.id];
            return [
                `"${p.id}"`,
                `"${(p.name || '').replace(/"/g, '""')}"`,
                `"${p.zone || ''}"`,
                `"${p.woreda || ''}"`,
                `"${(p.kebele || '').replace(/"/g, '""')}"`,
                lat.toFixed(5),
                lng.toFixed(5),
                p.elevation || 0,
                `"${p.program || ''}"`,
                `"${p.projectType || ''}"`,
                `"${p.status}"`,
                p.estimatedBudget || 0,
                p.populationCoverage || 0,
                `"${p.sourceOfWater || ''}"`,
                `"${p.energySource || ''}"`,
                `"${insp?.waterQualityTest?.complianceStatus || 'Not Tested'}"`,
                (insp?.defects || []).filter(d => d.status === 'Open').length,
                `"${insp?.inspectionDate || ''}"`
            ].join(',');
        });
        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OWEB_Spatial_Water_Inventory_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    return (<div className="space-y-6 pb-12">
            {/* Header section */}
            <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-primary-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold tracking-wide uppercase mb-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                            <span>Oromia Regional GIS &amp; Asset Mapping Center</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            Water &amp; Sanitation Infrastructure Map
                        </h1>
                        <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                            Spatial visualization of all active schemes, borehole coordinates, regional water corridors, and beneficiary coverage across Oromia Regional State.
                        </p>
                    </div>

                    {/* Quick Metric Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
                            <p className="text-xs text-slate-300">Mapped Schemes</p>
                            <p className="text-xl font-bold text-white mt-0.5">{stats.totalCount}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
                            <p className="text-xs text-slate-300">Beneficiaries</p>
                            <p className="text-xl font-bold text-emerald-300 mt-0.5">{stats.totalBeneficiaries.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
                            <p className="text-xs text-slate-300">Total Portfolio</p>
                            <p className="text-xl font-bold text-sky-300 mt-0.5">{formatCurrency(stats.totalBudget)}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
                            <p className="text-xs text-slate-300">Active / Underway</p>
                            <p className="text-xl font-bold text-amber-300 mt-0.5">{stats.activeCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter and Control Bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                    {/* Search */}
                    <div className="lg:col-span-2 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            {ICONS.search}
                        </div>
                        <input type="text" placeholder="Search scheme name, woreda, kebele..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-800"/>
                        {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-semibold">
                                Clear
                            </button>)}
                    </div>

                    {/* Program Filter */}
                    <div>
                        <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800 font-medium">
                            <option value="">All Programs (Bureau Level)</option>
                            {allProgramOptions.map(prog => (<option key={prog} value={prog}>{prog}</option>))}
                        </select>
                    </div>

                    {/* Zone Filter */}
                    <div>
                        <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800">
                            <option value="">All 21 Oromia Zones</option>
                            {ZONES.map(z => (<option key={z} value={z}>{z} ({stats.zoneCounts[z] || 0})</option>))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800">
                            <option value="">All Lifecycle Statuses</option>
                            {Object.values(ProjectStatus).map(s => (<option key={s} value={s}>{s}</option>))}
                        </select>
                    </div>

                    {/* Implementing Body / NGO Partner Filter */}
                    <div>
                        <select value={selectedImplementingBody} onChange={(e) => setSelectedImplementingBody(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800">
                            <option value="">All Implementing Partners</option>
                            {allImplementingBodies.map(body => (<option key={body} value={body}>{body}</option>))}
                        </select>
                    </div>

                    {/* Project Sector Type */}
                    <div>
                        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800">
                            <option value="">All Sectors</option>
                            {Object.keys(PROJECT_TYPES).map(t => (<option key={t} value={t}>{t}</option>))}
                        </select>
                    </div>
                </div>

                {/* Layer Switcher & Reset */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-600">Visualization Layer:</span>
                        <div className="inline-flex rounded-lg bg-slate-100 p-1 flex-wrap gap-1">
                            <button onClick={() => setMapLayer('standard')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${mapLayer === 'standard' ? 'bg-white text-primary-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}>
                                Spatial Pins & Schemes
                            </button>
                            <button onClick={() => setMapLayer('qa-qc')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${mapLayer === 'qa-qc' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}>
                                <span>🛡️</span>
                                <span>QA/QC & Lab Tests</span>
                            </button>
                            <button onClick={() => setMapLayer('programs')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${mapLayer === 'programs' ? 'bg-white text-primary-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}>
                                Program Attribution
                            </button>
                            <button onClick={() => setMapLayer('heat')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${mapLayer === 'heat' ? 'bg-white text-primary-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}>
                                Beneficiary Density
                            </button>
                            <button onClick={() => setMapLayer('risk')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${mapLayer === 'risk' ? 'bg-white text-primary-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}>
                                Risk & Delay Flags
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Spatial Data Export Buttons */}
                        <div className="inline-flex items-center gap-1.5">
                            <button type="button" onClick={handleExportGeoJSON} title="Export standard GeoJSON for QGIS / ArcGIS mapping" className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer">
                                <span>🗺️</span>
                                <span>GeoJSON</span>
                            </button>
                            <button type="button" onClick={handleExportCSV} title="Export CSV spatial coordinates and telemetry" className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer">
                                <span>📊</span>
                                <span>Spatial CSV</span>
                            </button>
                        </div>

                        {(selectedProgram || selectedZone || selectedStatus || selectedType || selectedImplementingBody || searchQuery) && (<button onClick={() => {
                setSelectedProgram('');
                setSelectedZone('');
                setSelectedStatus('');
                setSelectedType('');
                setSelectedImplementingBody('');
                setSearchQuery('');
            }} className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-medium transition-colors cursor-pointer">
                                Reset Filters
                            </button>)}
                        <span className="text-xs text-slate-500 font-medium">
                            <span className="font-semibold text-slate-800">{filteredProjects.length}</span> / {projects.length} schemes
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Interactive Map & Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* SVG Vector Map Canvas (8 Columns) */}
                <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-4 relative overflow-hidden">
                    {/* Background Grid & Compass */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col items-center bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-lg p-2 text-slate-300">
                        <span className="text-xs font-black text-primary-400">N</span>
                        <div className="w-0.5 h-4 bg-primary-400 my-0.5"></div>
                        <span className="text-[10px] text-slate-400">GIS</span>
                    </div>

                    <div className="flex items-center justify-between mb-3 px-2">
                        <div className="flex items-center gap-3">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                                Regional Geospatial Canvas (Oromia)
                            </h2>
                        </div>
                        <div className="text-xs text-slate-400 hidden sm:block">
                            Click any marker to inspect technical parameters & field telemetry
                        </div>
                    </div>

                    {/* SVG Map Container */}
                    <div className="relative w-full aspect-[16/10] bg-slate-950/60 rounded-xl border border-slate-800/60 overflow-hidden flex items-center justify-center">
                        <svg viewBox="0 0 1000 650" className="w-full h-full select-none" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>
                            <defs>
                                <radialGradient id="regionGlow" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.15"/>
                                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0"/>
                                </radialGradient>
                                <pattern id="gisGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
                                </pattern>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                    <feMerge>
                                        <feMergeNode in="coloredBlur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Background Grid */}
                            <rect width="1000" height="650" fill="url(#gisGrid)"/>
                            <circle cx="500" cy="325" r="380" fill="url(#regionGlow)"/>

                            {/* Regional Corridors Vector Backing */}
                            <g className="corridors opacity-40">
                                {/* Approximate Schematic Regional Flow connecting Zones */}
                                <path d="M 120 280 Q 250 250 450 320 T 850 220" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4 4"/>
                                <path d="M 450 320 Q 520 450 480 580" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4 4"/>
                                <path d="M 450 320 Q 620 400 700 500" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4"/>
                            </g>

                            {/* Zonal Hub Labels & Territory Reference Rings */}
                            {Object.entries(ZONE_COORDINATES).map(([zoneName, coord]) => {
            const pos = projectToSvg(coord.lat, coord.lng);
            const count = stats.zoneCounts[zoneName] || 0;
            const isHovered = hoveredZone === zoneName;
            const isSelected = selectedZone === zoneName;
            return (<g key={zoneName} transform={`translate(${pos.x}, ${pos.y})`} className="cursor-pointer transition-all duration-300" onMouseEnter={() => setHoveredZone(zoneName)} onMouseLeave={() => setHoveredZone(null)} onClick={() => setSelectedZone(prev => prev === zoneName ? '' : zoneName)}>
                                        {/* Density radius circle in heat layer */}
                                        {mapLayer === 'heat' && count > 0 && (<circle r={Math.min(60, 16 + count * 14)} fill="#0284c7" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2"/>)}

                                        {/* Hub Center Marker */}
                                        <circle r={isSelected ? 10 : isHovered ? 8 : 6} fill={isSelected ? '#38bdf8' : isHovered ? '#0ea5e9' : '#334155'} stroke="#0f172a" strokeWidth="2"/>

                                        {/* Zone Name Label */}
                                        <text x="0" y="-12" textAnchor="middle" fill={isSelected ? '#38bdf8' : isHovered ? '#ffffff' : '#94a3b8'} fontSize={isSelected ? '12' : '10'} fontWeight={isSelected || isHovered ? 'bold' : 'normal'} className="pointer-events-none select-none drop-shadow">
                                            {zoneName}
                                        </text>

                                        {/* Scheme Count Badge */}
                                        {count > 0 && (<g transform="translate(10, 8)">
                                                <rect x="-8" y="-7" width="16" height="14" rx="4" fill="#0284c7"/>
                                                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" className="pointer-events-none">
                                                    {count}
                                                </text>
                                            </g>)}
                                    </g>);
        })}

                            {/* Project GPS Pins */}
                            {filteredProjects.map((project) => {
            // Default fallback to zone capital if project lat/long is 0
            let lat = project.gpsCoordinates?.lat;
            let lng = project.gpsCoordinates?.long;
            if (!lat || !lng || (lat === 0 && lng === 0)) {
                const fallback = ZONE_COORDINATES[project.zone];
                if (fallback) {
                    // Slight jitter based on project ID so multiple projects in same zone don't overlap completely
                    const hash = project.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    lat = fallback.lat + ((hash % 10) - 5) * 0.08;
                    lng = fallback.lng + (((hash * 7) % 10) - 5) * 0.08;
                }
                else {
                    lat = 8.5;
                    lng = 38.5;
                }
            }
            const pos = projectToSvg(lat, lng);
            const isSelected = selectedProject?.id === project.id;
            const statusUI = STATUS_COLOR_MAP[project.status] || STATUS_COLOR_MAP[ProjectStatus.DRAFT];
            const progDef = project.program ? PROGRAM_DEFINITIONS[project.program] : null;
            // Pin color determined by active layer
            const latestInsp = latestInspectionsByProject[project.id];
            const openDefectsCount = (latestInsp?.defects || []).filter(d => d.status === 'Open').length;
            let pinColor = statusUI.dot;
            if (mapLayer === 'programs' && progDef) {
                pinColor = progDef.color;
            }
            else if (mapLayer === 'risk') {
                if (project.environmentalRiskLevel === 'High')
                    pinColor = '#f43f5e';
                else if (project.environmentalRiskLevel === 'Medium')
                    pinColor = '#f59e0b';
                else
                    pinColor = '#10b981';
            }
            else if (mapLayer === 'qa-qc') {
                if (latestInsp) {
                    if (latestInsp.waterQualityTest?.complianceStatus === 'Compliant') {
                        pinColor = '#10b981'; // Emerald (Safe Potable)
                    }
                    else if (latestInsp.waterQualityTest?.complianceStatus === 'Non-Compliant') {
                        pinColor = '#f43f5e'; // Rose (Contaminated)
                    }
                    else if (latestInsp.waterQualityTest?.complianceStatus === 'Borderline') {
                        pinColor = '#f59e0b'; // Amber (Borderline)
                    }
                    else {
                        pinColor = '#0284c7'; // Sky (Inspected)
                    }
                }
                else {
                    pinColor = '#64748b'; // Slate (Pending QA/QC Inspection)
                }
            }
            return (<g key={project.id} transform={`translate(${pos.x}, ${pos.y})`} className="cursor-pointer group" onClick={() => {
                    setSelectedProject(project);
                    if (onSelectProject)
                        onSelectProject(project);
                }}>
                                        {/* Halo on select or hover */}
                                        {isSelected && (<circle r="18" fill={pinColor} fillOpacity="0.3" stroke={pinColor} strokeWidth="1.5" className="animate-pulse"/>)}

                                        {/* Warning Aura for schemes with open punch list defects in QA/QC layer */}
                                        {mapLayer === 'qa-qc' && openDefectsCount > 0 && !isSelected && (<circle r="13" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2"/>)}

                                        {/* Pin Marker */}
                                        <circle r={isSelected ? 8 : 6} fill={pinColor} stroke="#ffffff" strokeWidth={isSelected ? 2.5 : 1.5} filter="url(#glow)"/>

                                        {/* Sector Icon Mini Indicator */}
                                        <circle r="2.5" fill="#ffffff"/>

                                        {/* Interactive Hover Tooltip for Pin */}
                                        <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" transform="translate(0, -18)">
                                            <rect x="-80" y="-28" width="160" height="26" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1"/>
                                            <text x="0" y="-11" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="600">
                                                {project.name.length > 22 ? project.name.substring(0, 20) + '...' : project.name}
                                            </text>
                                        </g>
                                    </g>);
        })}
                        </svg>

                        {/* Map Footer Legend Overlay */}
                        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md rounded-xl p-2.5 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-4 flex-wrap">
                                <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Legend:</span>
                                {mapLayer === 'programs' ? (PROGRAMS.slice(0, 4).map(p => {
            const def = PROGRAM_DEFINITIONS[p];
            return (<div key={p} className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: def?.color || '#38bdf8' }}></span>
                                                <span className="text-slate-300 text-[11px]">{def?.code || p}</span>
                                            </div>);
        })) : mapLayer === 'qa-qc' ? (<>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                            <span className="text-slate-300 text-[11px]">Safe Potable Water (WHO)</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                            <span className="text-slate-300 text-[11px]">Borderline / Open Punch List</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                            <span className="text-slate-300 text-[11px]">Non-Compliant / Contaminated</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                                            <span className="text-slate-300 text-[11px]">Inspected Scheme</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                                            <span className="text-slate-300 text-[11px]">Pending QA/QC Inspection</span>
                                        </div>
                                    </>) : mapLayer === 'risk' ? (<>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                            <span className="text-slate-300 text-[11px]">Low Risk / On Track</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                            <span className="text-slate-300 text-[11px]">Medium Risk</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                            <span className="text-slate-300 text-[11px]">High Environmental / Scope Risk</span>
                                        </div>
                                    </>) : (<>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                            <span className="text-slate-300 text-[11px]">Approved / Executing</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                                            <span className="text-slate-300 text-[11px]">Completed & Commissioned</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                            <span className="text-slate-300 text-[11px]">Under Technical Review</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                                            <span className="text-slate-300 text-[11px]">Submitted</span>
                                        </div>
                                    </>)}
                            </div>

                            <div className="text-[11px] text-slate-400">
                                Projection: WGS84 Datum (EPSG:4326)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side Inspector & Details Panel (4 Columns) */}
                <div className="lg:col-span-4 space-y-4">
                    {selectedProject ? (<div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 mb-2">
                                        {selectedProject.program || 'ONE WASH (OWNP)'}
                                    </span>
                                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                                        {selectedProject.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Code: <span className="font-mono font-medium text-slate-700">{selectedProject.id}</span>
                                    </p>
                                </div>
                                <button onClick={() => setSelectedProject(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100" title="Close Inspector">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>

                            {/* Key Geo & Technical Specs */}
                            <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
                                <div className="space-y-1">
                                    <span className="text-slate-500">Zone & Woreda</span>
                                    <p className="font-semibold text-slate-800">{selectedProject.zone}, {selectedProject.woreda}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-slate-500">Kebele Location</span>
                                    <p className="font-semibold text-slate-800">{selectedProject.kebele || 'Center Kebele'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-slate-500">GPS Coordinates</span>
                                    <p className="font-mono font-medium text-slate-800">
                                        {selectedProject.gpsCoordinates?.lat.toFixed(4)}°N, {selectedProject.gpsCoordinates?.long.toFixed(4)}°E
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-slate-500">Elevation</span>
                                    <p className="font-semibold text-slate-800">{selectedProject.elevation || '1,750'} m a.s.l.</p>
                                </div>
                            </div>

                            {/* Project Parameters */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Beneficiary Target:</span>
                                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                        {selectedProject.populationCoverage?.toLocaleString() || 'N/A'} Persons
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Estimated Budget:</span>
                                    <span className="font-bold text-slate-900">
                                        {selectedProject.estimatedBudget?.toLocaleString()} ETB
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Scheme Classification:</span>
                                    <span className="font-medium text-slate-800">
                                        {SCHEME_ICONS[selectedProject.projectType] || '⚙️'} {selectedProject.projectSubType || selectedProject.projectType}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Pumping &amp; Water Source:</span>
                                    <span className="font-medium text-slate-800">
                                        {selectedProject.energySource || 'Gravity / Solar'} • {selectedProject.sourceOfWater || 'Borehole'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Implementing Agency:</span>
                                    <span className="font-medium text-slate-800">
                                        {selectedProject.implementingBody || 'OWEB Directorate'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Funding Window:</span>
                                    <span className="font-medium text-slate-800">
                                        {selectedProject.fundingSource || 'Consolidated WaSH Account'}
                                    </span>
                                </div>
                            </div>

                            {/* Field QA/QC & Water Testing Telemetry Card */}
                            {(() => {
                const insp = latestInspectionsByProject[selectedProject.id];
                return insp ? (<div className="p-3.5 bg-gradient-to-br from-sky-50/90 to-blue-50/70 rounded-xl border border-sky-200 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
                                                <span>🛡️</span>
                                                <span>QA/QC Field Telemetry</span>
                                            </span>
                                            <span className="text-[10px] font-bold text-sky-800 bg-white px-2 py-0.5 rounded-full border border-sky-200">
                                                {insp.inspectionDate}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-slate-500 text-[10px] uppercase font-semibold">Inspector</span>
                                                <p className="font-bold text-slate-800 truncate">{insp.inspectorName}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[10px] uppercase font-semibold">Stage</span>
                                                <p className="font-bold text-slate-800 truncate">{insp.visitStage}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[10px] uppercase font-semibold">Verified Progress</span>
                                                <p className="font-extrabold text-emerald-700">{insp.overallPhysicalProgressPct}%</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[10px] uppercase font-semibold">Workmanship</span>
                                                <p className="font-bold text-slate-800">{insp.workmanshipRating}</p>
                                            </div>
                                        </div>

                                        {insp.waterQualityTest && (<div className="pt-2 border-t border-sky-200/80">
                                                <div className="flex items-center justify-between mb-1.5 text-xs">
                                                    <span className="font-bold text-slate-700 flex items-center gap-1">
                                                        <span>💧</span>
                                                        <span>Water Quality Lab:</span>
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${insp.waterQualityTest.complianceStatus === 'Compliant'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : insp.waterQualityTest.complianceStatus === 'Borderline'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'}`}>
                                                        {insp.waterQualityTest.complianceStatus}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-4 gap-1.5 text-[11px] text-center bg-white/90 p-2 rounded-lg border border-sky-100 font-mono">
                                                    <div>
                                                        <span className="text-[9px] text-slate-400 block font-sans">pH</span>
                                                        <span className="font-bold text-slate-800">{insp.waterQualityTest.pH}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] text-slate-400 block font-sans">Turbidity</span>
                                                        <span className="font-bold text-slate-800">{insp.waterQualityTest.turbidityNTU} NTU</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] text-slate-400 block font-sans">Cl Residual</span>
                                                        <span className="font-bold text-slate-800">{insp.waterQualityTest.residualChlorineMgL} mg/L</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] text-slate-400 block font-sans">E. Coli</span>
                                                        <span className={`font-bold ${insp.waterQualityTest.eColiCountCfuPer100ml > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                            {insp.waterQualityTest.eColiCountCfuPer100ml}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>)}

                                        {insp.defects && insp.defects.length > 0 && (<div className="flex items-center justify-between text-xs pt-1">
                                                <span className="text-slate-600 font-semibold">Defect Punch List:</span>
                                                <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${insp.defects.filter(d => d.status === 'Open').length > 0
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                                                    {insp.defects.filter(d => d.status === 'Open').length} Open / {insp.defects.length} Total
                                                </span>
                                            </div>)}
                                    </div>) : (<div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                                        <span>No field QA/QC inspection logged yet</span>
                                        {onNavigate && (<button type="button" onClick={() => onNavigate('inspection', selectedProject.id)} className="text-primary-700 font-bold hover:underline cursor-pointer">
                                                + Log Inspection
                                            </button>)}
                                    </div>);
            })()}

                            {/* Action Buttons */}
                            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                                <button onClick={() => onNavigate && onNavigate('inspection', selectedProject.id)} className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2">
                                    <span>{ICONS.inspection}</span>
                                    <span>View QA/QC Site Inspections</span>
                                </button>
                                <button onClick={() => onNavigate && onNavigate('reporting', selectedProject.id)} className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <span>{ICONS.reporting}</span>
                                    <span>View Variance & Financial Analytics</span>
                                </button>
                            </div>
                        </div>) : (<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                            <div className="text-center py-4">
                                <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
                                    {ICONS.mapPin}
                                </div>
                                <h3 className="text-base font-bold text-slate-800">Select Any Scheme Marker</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                                    Click any pinpoint on the regional map or pick from the regional inventory list below to view telemetry and site metrics.
                                </p>
                            </div>

                            {/* Quick Regional Zone Summary List */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Top Regional Zonal Portfolios
                                </h4>
                                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                                    {ZONES.map(zone => {
                const count = stats.zoneCounts[zone] || 0;
                const zoneCoord = ZONE_COORDINATES[zone];
                return (<div key={zone} onClick={() => setSelectedZone(zone === selectedZone ? '' : zone)} className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${selectedZone === zone
                        ? 'bg-primary-50 border-primary-300 text-primary-900 font-semibold'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                                                <div>
                                                    <p className="font-medium text-slate-900">{zone}</p>
                                                    <p className="text-[11px] text-slate-500">{zoneCoord?.corridor || 'Oromia Regional State'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-bold">
                                                        {count} Schemes
                                                    </span>
                                                </div>
                                            </div>);
            })}
                                </div>
                            </div>
                        </div>)}

                    {/* Corridor Overview Box */}
                    <div className="bg-gradient-to-br from-slate-50 to-sky-50 rounded-2xl border border-sky-100 p-4">
                        <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span>💧</span>
                            <span>Major Oromia Water Basins & Corridors</span>
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Oromia encompasses key hydrogeological basins: <strong>Awash Basin</strong> (East Shewa), <strong>Rift Valley Lakes</strong> (West Arsi, Arsi), <strong>Abbay/Blue Nile Basin</strong> (North Shewa, West Shewa, Wollega), <strong>Genale-Dawa Basin</strong> (Bale, Guji, Borena), and <strong>Wabe Shebele Basin</strong> (Hararghe, Bale).
                        </p>
                    </div>
                </div>
            </div>
        </div>);
};
export default GeographicMapModule;
