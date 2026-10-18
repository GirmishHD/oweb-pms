import React, { useMemo } from 'react';
import { INITIAL_REGIONS, INITIAL_CLUSTERS, INITIAL_WOREDAS, INITIAL_TOWNS, INITIAL_KEBELES } from '../../services/orgUnitService';
import { MapPin, Globe, Compass, CheckCircle2, AlertCircle, Layers, Building2 } from 'lucide-react';

export const CascadingLocationSelector = ({
    masterData,
    selectedRegion = '',
    selectedCluster = '',
    selectedWoreda = '',
    selectedKebele = '',
    selectedZone = '',
    onChange,
    disabled = false,
    required = true,
    compact = false,
    className = '',
    errors
}) => {
    // Master pools
    const regions = useMemo(() => {
        return (masterData?.regions?.length ? masterData.regions : INITIAL_REGIONS).filter(r => r.status === 'Active');
    }, [masterData?.regions]);

    const allClusters = useMemo(() => {
        return (masterData?.clusters?.length ? masterData.clusters : INITIAL_CLUSTERS).filter(c => c.status === 'Active');
    }, [masterData?.clusters]);

    const allWoredas = useMemo(() => {
        return (masterData?.woredas?.length ? masterData.woredas : INITIAL_WOREDAS).filter(w => w.status === 'Active');
    }, [masterData?.woredas]);

    const allTowns = useMemo(() => {
        return (masterData?.towns?.length ? masterData.towns : INITIAL_TOWNS).filter(t => t.status === 'Active');
    }, [masterData?.towns]);

    const allKebeles = useMemo(() => {
        return (masterData?.kebeles?.length ? masterData.kebeles : INITIAL_KEBELES).filter(k => k.status === 'Active');
    }, [masterData?.kebeles]);

    // Active Region
    const currentRegionObj = useMemo(() => {
        const target = selectedRegion || 'Oromia National Regional State';
        return regions.find(r => r.id === target ||
            r.code === target ||
            r.name.toLowerCase() === target.toLowerCase() ||
            (r.localName && r.localName.toLowerCase() === target.toLowerCase())) || regions[0];
    }, [regions, selectedRegion]);

    // Clusters under Region
    const availableClusters = useMemo(() => {
        return allClusters;
    }, [allClusters]);

    // Active Cluster: deduce from selectedCluster or legacy selectedZone
    const currentClusterObj = useMemo(() => {
        const target = selectedCluster || selectedZone;
        if (!target) return undefined;
        return availableClusters.find(c => c.id === target ||
            c.code === target ||
            c.name.toLowerCase() === target.toLowerCase() ||
            (c.localName && c.localName.toLowerCase() === target.toLowerCase()));
    }, [availableClusters, selectedCluster, selectedZone]);

    // Woredas and Towns combined under Cluster
    const availableUnits = useMemo(() => {
        if (!currentClusterObj) return [];
        const cid = currentClusterObj.id;
        const cname = currentClusterObj.name.toLowerCase();

        const wList = allWoredas.filter(w => w.clusterId === cid || w.parentId === cid || (w.clusterName && w.clusterName.toLowerCase() === cname));
        const tList = allTowns.filter(t => t.clusterId === cid || t.parentId === cid || (t.clusterName && t.clusterName.toLowerCase() === cname));
        return [...wList, ...tList];
    }, [allWoredas, allTowns, currentClusterObj]);

    // Active Woreda / Town
    const currentUnitObj = useMemo(() => {
        if (!selectedWoreda) return undefined;
        const needle = selectedWoreda.toLowerCase();
        return availableUnits.find(u => u.id === selectedWoreda ||
            u.code === selectedWoreda ||
            u.name.toLowerCase() === needle ||
            (u.localName && u.localName.toLowerCase() === needle) ||
            needle.includes(u.name.toLowerCase().replace(' woreda', '')));
    }, [availableUnits, selectedWoreda]);

    // Kebeles under chosen Woreda / Town
    const availableKebeles = useMemo(() => {
        if (!currentUnitObj) return [];
        const uid = currentUnitObj.id;
        const uname = currentUnitObj.name.toLowerCase();
        return allKebeles.filter(k => k.woredaId === uid || k.parentId === uid || (k.woredaName && k.woredaName.toLowerCase() === uname));
    }, [allKebeles, currentUnitObj]);

    // Handlers
    const handleRegionChange = (newRegionVal) => {
        const regObj = regions.find(r => r.id === newRegionVal || r.name === newRegionVal);
        const regName = regObj ? regObj.name : newRegionVal;
        const regId = regObj ? regObj.id : undefined;

        onChange({
            region: regName,
            regionId: regId,
            cluster: '',
            clusterId: undefined,
            woreda: '',
            woredaId: undefined,
            kebele: '',
            kebeleId: undefined,
            zone: ''
        });
    };

    const handleClusterChange = (newClusterVal) => {
        const clustObj = availableClusters.find(c => c.id === newClusterVal || c.name === newClusterVal);
        const clustName = clustObj ? clustObj.name : newClusterVal;
        const clustId = clustObj ? clustObj.id : undefined;

        onChange({
            region: currentRegionObj?.name || 'Oromia National Regional State',
            regionId: currentRegionObj?.id || 'reg-oromia',
            cluster: clustName,
            clusterId: clustId,
            woreda: '',
            woredaId: undefined,
            kebele: '',
            kebeleId: undefined,
            zone: clustName // maintain zone compatibility
        });
    };

    const handleUnitChange = (newUnitVal) => {
        const unitObj = availableUnits.find(u => u.id === newUnitVal || u.name === newUnitVal);
        const unitName = unitObj ? unitObj.name : newUnitVal;
        const unitId = unitObj ? unitObj.id : undefined;
        const formerZone = unitObj?.formerZone || currentClusterObj?.name || '';

        onChange({
            region: currentRegionObj?.name || 'Oromia National Regional State',
            regionId: currentRegionObj?.id || 'reg-oromia',
            cluster: currentClusterObj?.name || selectedCluster,
            clusterId: currentClusterObj?.id,
            woreda: unitName,
            woredaId: unitId,
            kebele: '',
            kebeleId: undefined,
            zone: formerZone || currentClusterObj?.name
        });
    };

    const handleKebeleChange = (newKebeleVal) => {
        const kebObj = availableKebeles.find(k => k.id === newKebeleVal || k.name === newKebeleVal);
        const kebName = kebObj ? kebObj.name : newKebeleVal;
        const kebId = kebObj ? kebObj.id : undefined;

        onChange({
            region: currentRegionObj?.name || 'Oromia National Regional State',
            regionId: currentRegionObj?.id || 'reg-oromia',
            cluster: currentClusterObj?.name || selectedCluster,
            clusterId: currentClusterObj?.id,
            woreda: currentUnitObj?.name || selectedWoreda,
            woredaId: currentUnitObj?.id,
            kebele: kebName,
            kebeleId: kebId,
            zone: currentUnitObj?.formerZone || currentClusterObj?.name || selectedZone
        });
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Visual Hierarchy Indicator */}
            {!compact && (
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50/70 border border-cyan-100 px-3 py-1.5 rounded-xl flex-wrap">
                    <Globe className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Administrative Hierarchy:</span>
                    <span className="font-mono text-cyan-950 font-black">Region</span>
                    <span className="text-cyan-400">&rarr;</span>
                    <span className="font-mono text-cyan-950 font-black">Cluster</span>
                    <span className="text-cyan-400">&rarr;</span>
                    <span className="font-mono text-cyan-950 font-black">Woreda / Town</span>
                    <span className="text-cyan-400">&rarr;</span>
                    <span className="font-mono text-cyan-950 font-black">Kebele</span>
                </div>
            )}

            <div className={`grid ${compact ? 'grid-cols-1 sm:grid-cols-4' : 'grid-cols-1 md:grid-cols-4'} gap-3`}>
                {/* 1. REGION SELECTOR */}
                <div className="space-y-1">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-cyan-700" />
                            1. Region {required && <span className="text-rose-500">*</span>}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">Naannoo</span>
                    </label>
                    <div className="relative">
                        <select
                            value={currentRegionObj?.id || selectedRegion}
                            onChange={(e) => handleRegionChange(e.target.value)}
                            disabled={disabled}
                            className={`w-full text-xs bg-slate-50 border rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all ${
                                errors?.region ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-cyan-300'}`}
                        >
                            {regions.map((reg) => (
                                <option key={reg.id} value={reg.id}>
                                    {reg.name} ({reg.localName || 'Oromia'})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 2. CLUSTER SELECTOR */}
                <div className="space-y-1">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-700" />
                            2. Cluster {required && <span className="text-rose-500">*</span>}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">Kilaastara</span>
                    </label>
                    <div className="relative">
                        <select
                            value={currentClusterObj?.id || selectedCluster}
                            onChange={(e) => handleClusterChange(e.target.value)}
                            disabled={disabled}
                            className={`w-full text-xs bg-slate-50 border rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all ${
                                errors?.cluster ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-cyan-300'}`}
                        >
                            <option value="">-- Select Cluster ({availableClusters.length}) --</option>
                            {availableClusters.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.localName})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 3. WOREDA / TOWN SELECTOR */}
                <div className="space-y-1">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5 text-cyan-700" />
                            3. Woreda / Town {required && <span className="text-rose-500">*</span>}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">Aanaa / Magaalaa</span>
                    </label>
                    <div className="relative">
                        <select
                            value={currentUnitObj?.id || selectedWoreda}
                            onChange={(e) => handleUnitChange(e.target.value)}
                            disabled={disabled || !currentClusterObj}
                            className={`w-full text-xs bg-slate-50 border rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all ${
                                errors?.woreda ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                            } ${disabled || !currentClusterObj ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'cursor-pointer hover:border-cyan-300'}`}
                        >
                            <option value="">
                                {!currentClusterObj
                                    ? '-- Choose Cluster First --'
                                    : `-- Select Woreda / Town (${availableUnits.length} in ${currentClusterObj.name}) --`}
                            </option>
                            {availableUnits.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name} {u.classification === 'City Administration' ? '[City Admin]' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 4. KEBELE SELECTOR */}
                <div className="space-y-1">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            4. Kebele {required && <span className="text-rose-500">*</span>}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">Ganda</span>
                    </label>
                    <div className="relative">
                        <select
                            value={selectedKebele}
                            onChange={(e) => handleKebeleChange(e.target.value)}
                            disabled={disabled || !currentUnitObj}
                            className={`w-full text-xs bg-slate-50 border rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all ${
                                errors?.kebele ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                            } ${disabled || !currentUnitObj ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'cursor-pointer hover:border-cyan-300'}`}
                        >
                            <option value="">
                                {!currentUnitObj
                                    ? '-- Select Woreda/Town First --'
                                    : availableKebeles.length === 0
                                        ? '-- No Kebeles Registered --'
                                        : `-- Select Kebele (${availableKebeles.length} available) --`}
                            </option>
                            {availableKebeles.map((keb) => (
                                <option key={keb.id} value={keb.name}>
                                    {keb.name} ({keb.localName || 'Ganda'})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Selected breadcrumb preview */}
            {selectedRegion && (selectedCluster || currentClusterObj) && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1 flex-wrap">
                    <span className="font-semibold text-slate-600">Administrative Unit:</span>
                    <span className="text-cyan-800 font-bold">{currentRegionObj?.name || selectedRegion}</span>
                    <span>&rsaquo;</span>
                    <span className="text-indigo-800 font-bold">{currentClusterObj?.name || selectedCluster}</span>
                    {selectedWoreda && (
                        <>
                            <span>&rsaquo;</span>
                            <span className="text-cyan-950 font-bold">
                                {currentUnitObj?.name || selectedWoreda}
                                {currentUnitObj?.classification === 'City Administration' && (
                                    <span className="ml-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                        City Admin
                                    </span>
                                )}
                            </span>
                        </>
                    )}
                    {selectedKebele && (
                        <>
                            <span>&rsaquo;</span>
                            <span className="text-emerald-700 font-extrabold">{selectedKebele}</span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
