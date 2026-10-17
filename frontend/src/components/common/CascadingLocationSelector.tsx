import React, { useMemo } from 'react';
import { MasterData, Region, Woreda, Kebele } from '../../types';
import { INITIAL_REGIONS, INITIAL_WOREDAS, INITIAL_KEBELES } from '../../services/orgUnitService';
import { MapPin, Globe, Compass, CheckCircle2, AlertCircle } from 'lucide-react';

export interface LocationSelection {
  region: string;
  woreda: string;
  kebele: string;
  regionId?: string;
  woredaId?: string;
  kebeleId?: string;
  zone?: string;
}

interface CascadingLocationSelectorProps {
  masterData?: MasterData;
  selectedRegion?: string;
  selectedWoreda?: string;
  selectedKebele?: string;
  selectedZone?: string;
  onChange: (location: LocationSelection) => void;
  disabled?: boolean;
  required?: boolean;
  compact?: boolean;
  showZone?: boolean;
  className?: string;
  errors?: {
    region?: string;
    woreda?: string;
    kebele?: string;
  };
}

export const CascadingLocationSelector: React.FC<CascadingLocationSelectorProps> = ({
  masterData,
  selectedRegion = '',
  selectedWoreda = '',
  selectedKebele = '',
  selectedZone = '',
  onChange,
  disabled = false,
  required = true,
  compact = false,
  showZone = false,
  className = '',
  errors
}) => {
  // Master pools
  const regions: Region[] = useMemo(() => {
    return (masterData?.regions || INITIAL_REGIONS).filter(r => r.status === 'Active');
  }, [masterData?.regions]);

  const allWoredas: Woreda[] = useMemo(() => {
    return (masterData?.woredas || INITIAL_WOREDAS).filter(w => w.status === 'Active');
  }, [masterData?.woredas]);

  const allKebeles: Kebele[] = useMemo(() => {
    return (masterData?.kebeles || INITIAL_KEBELES).filter(k => k.status === 'Active');
  }, [masterData?.kebeles]);

  // Find currently active region entity
  const currentRegionObj = useMemo(() => {
    if (!selectedRegion) return undefined;
    return regions.find(r => 
      r.id === selectedRegion || 
      r.code === selectedRegion || 
      r.name.toLowerCase() === selectedRegion.toLowerCase() ||
      r.localName.toLowerCase() === selectedRegion.toLowerCase()
    );
  }, [regions, selectedRegion]);

  // Woredas filtered strictly by the chosen Region
  const availableWoredas = useMemo(() => {
    if (!currentRegionObj) {
      // Default to Oromia if region is not yet chosen or defaulted
      const oromiaReg = regions.find(r => r.code === 'REG_OROMIA') || regions[0];
      if (oromiaReg) {
        return allWoredas.filter(w => w.regionId === oromiaReg.id);
      }
      return [];
    }
    return allWoredas.filter(w => w.regionId === currentRegionObj.id);
  }, [allWoredas, currentRegionObj, regions]);

  // Find currently active woreda entity
  const currentWoredaObj = useMemo(() => {
    if (!selectedWoreda) return undefined;
    return availableWoredas.find(w => 
      w.id === selectedWoreda || 
      w.code === selectedWoreda || 
      w.name.toLowerCase() === selectedWoreda.toLowerCase() ||
      w.localName.toLowerCase() === selectedWoreda.toLowerCase() ||
      selectedWoreda.toLowerCase().includes(w.name.toLowerCase().replace(' woreda', ''))
    );
  }, [availableWoredas, selectedWoreda]);

  // Kebeles filtered strictly by the chosen Woreda
  const availableKebeles = useMemo(() => {
    if (!currentWoredaObj) return [];
    return allKebeles.filter(k => k.woredaId === currentWoredaObj.id);
  }, [allKebeles, currentWoredaObj]);

  // Handlers with strict cascading reset logic
  const handleRegionChange = (newRegionVal: string) => {
    const regObj = regions.find(r => r.id === newRegionVal || r.name === newRegionVal);
    const regName = regObj ? regObj.name : newRegionVal;
    const regId = regObj ? regObj.id : undefined;

    // Reset dependent child selections: woreda & kebele
    onChange({
      region: regName,
      regionId: regId,
      woreda: '',
      woredaId: undefined,
      kebele: '',
      kebeleId: undefined,
      zone: selectedZone
    });
  };

  const handleWoredaChange = (newWoredaVal: string) => {
    const worObj = availableWoredas.find(w => w.id === newWoredaVal || w.name === newWoredaVal);
    const worName = worObj ? worObj.name : newWoredaVal;
    const worId = worObj ? worObj.id : undefined;
    const regName = currentRegionObj?.name || selectedRegion || 'Oromia National Regional State';
    const regId = currentRegionObj?.id;

    // Reset dependent child selection: kebele
    onChange({
      region: regName,
      regionId: regId,
      woreda: worName,
      woredaId: worId,
      kebele: '',
      kebeleId: undefined,
      zone: selectedZone
    });
  };

  const handleKebeleChange = (newKebeleVal: string) => {
    const kebObj = availableKebeles.find(k => k.id === newKebeleVal || k.name === newKebeleVal);
    const kebName = kebObj ? kebObj.name : newKebeleVal;
    const kebId = kebObj ? kebObj.id : undefined;

    onChange({
      region: currentRegionObj?.name || selectedRegion,
      regionId: currentRegionObj?.id,
      woreda: currentWoredaObj?.name || selectedWoreda,
      woredaId: currentWoredaObj?.id,
      kebele: kebName,
      kebeleId: kebId,
      zone: selectedZone
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Visual Hierarchy Indicator */}
      {!compact && (
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50/70 border border-cyan-100 px-3 py-1.5 rounded-xl">
          <Globe className="w-3.5 h-3.5 text-cyan-600" />
          <span>Administrative Hierarchy:</span>
          <span className="font-mono text-cyan-950 font-black">Region</span>
          <span className="text-cyan-400">&rarr;</span>
          <span className="font-mono text-cyan-950 font-black">Woreda</span>
          <span className="text-cyan-400">&rarr;</span>
          <span className="font-mono text-cyan-950 font-black">Kebele</span>
        </div>
      )}

      <div className={`grid ${compact ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 md:grid-cols-3'} gap-3`}>
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
              <option value="">-- Select Region --</option>
              {regions.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name} ({reg.localName})
                </option>
              ))}
            </select>
          </div>
          {errors?.region && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3 h-3" />
              {errors.region}
            </p>
          )}
        </div>

        {/* 2. WOREDA SELECTOR */}
        <div className="space-y-1">
          <label className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-700" />
              2. Woreda / District {required && <span className="text-rose-500">*</span>}
            </span>
            <span className="text-[10px] font-medium text-slate-400">Aanaa</span>
          </label>
          <div className="relative">
            <select
              value={currentWoredaObj?.id || selectedWoreda}
              onChange={(e) => handleWoredaChange(e.target.value)}
              disabled={disabled || (!currentRegionObj && !selectedRegion)}
              className={`w-full text-xs bg-slate-50 border rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all ${
                errors?.woreda ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
              } ${disabled || (!currentRegionObj && !selectedRegion) ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'cursor-pointer hover:border-cyan-300'}`}
            >
              <option value="">
                {!currentRegionObj && !selectedRegion 
                  ? '-- Select Region First --' 
                  : `-- Select Woreda (${availableWoredas.length} in ${currentRegionObj?.name || 'Region'}) --`}
              </option>
              {availableWoredas.map((wor) => (
                <option key={wor.id} value={wor.id}>
                  {wor.name} ({wor.localName})
                </option>
              ))}
            </select>
          </div>
          {errors?.woreda && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3 h-3" />
              {errors.woreda}
            </p>
          )}
        </div>

        {/* 3. KEBELE SELECTOR */}
        <div className="space-y-1">
          <label className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-700" />
              3. Kebele / Community {required && <span className="text-rose-500">*</span>}
            </span>
            <span className="text-[10px] font-medium text-slate-400">Ganda</span>
          </label>
          <div className="relative">
            <select
              value={selectedKebele}
              onChange={(e) => handleKebeleChange(e.target.value)}
              disabled={disabled || !currentWoredaObj}
              className={`w-full text-xs bg-slate-50 border rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all ${
                errors?.kebele ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
              } ${disabled || !currentWoredaObj ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'cursor-pointer hover:border-cyan-300'}`}
            >
              <option value="">
                {!currentWoredaObj 
                  ? '-- Select Woreda First --' 
                  : availableKebeles.length === 0 
                  ? '-- No Kebeles Registered --' 
                  : `-- Select Kebele (${availableKebeles.length} available) --`}
              </option>
              {availableKebeles.map((keb) => (
                <option key={keb.id} value={keb.name}>
                  {keb.name} ({keb.localName})
                </option>
              ))}
            </select>
          </div>
          {errors?.kebele && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3 h-3" />
              {errors.kebele}
            </p>
          )}
        </div>
      </div>

      {/* Selected breadcrumb preview */}
      {selectedRegion && selectedWoreda && (
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
          <span className="font-semibold text-slate-600">Selected Jurisdiction:</span>
          <span className="text-cyan-800 font-bold">{currentRegionObj?.name || selectedRegion}</span>
          <span>&rsaquo;</span>
          <span className="text-cyan-900 font-bold">{currentWoredaObj?.name || selectedWoreda}</span>
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
