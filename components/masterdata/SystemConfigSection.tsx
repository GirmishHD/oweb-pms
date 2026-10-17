import React, { useState } from 'react';
import { SystemConfigurationItem, User } from '../../types';
import { 
  Settings, 
  ShieldCheck, 
  RotateCcw, 
  Check, 
  X, 
  Edit3, 
  Lock, 
  HelpCircle, 
  AlertCircle,
  FileText,
  Sliders,
  BellRing,
  Globe,
  HardDrive
} from 'lucide-react';

interface SystemConfigSectionProps {
  configs: SystemConfigurationItem[];
  onUpdateConfig: (updatedConfig: SystemConfigurationItem, reason?: string) => void;
  onResetAllConfigs?: () => void;
  canEdit: boolean;
  currentUser?: User;
}

export const SystemConfigSection: React.FC<SystemConfigSectionProps> = ({
  configs = [],
  onUpdateConfig,
  onResetAllConfigs,
  canEdit,
  currentUser
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [editingConfig, setEditingConfig] = useState<SystemConfigurationItem | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [changeReason, setChangeReason] = useState<string>('');

  const categories = ['ALL', 'General', 'Localization', 'Files & Storage', 'Thresholds & Limits', 'Notifications', 'Governance & Retention'];

  const filteredConfigs = configs.filter(c => {
    if (selectedCategory === 'ALL') return true;
    return c.category === selectedCategory;
  });

  const handleStartEdit = (cfg: SystemConfigurationItem) => {
    setEditingConfig(cfg);
    setEditValue(cfg.value);
    setChangeReason('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;

    onUpdateConfig(
      {
        ...editingConfig,
        value: editValue,
        updatedBy: currentUser?.username || 'Administrator',
        updatedAt: new Date().toISOString()
      },
      changeReason || `Administrative update to ${editingConfig.name}`
    );

    setEditingConfig(null);
  };

  const handleResetSingle = (cfg: SystemConfigurationItem) => {
    if (confirm(`Reset "${cfg.name}" back to its factory default value ("${cfg.defaultValue}")?`)) {
      onUpdateConfig(
        {
          ...cfg,
          value: cfg.defaultValue,
          updatedBy: currentUser?.username || 'Administrator',
          updatedAt: new Date().toISOString()
        },
        `Reset to system default value: ${cfg.defaultValue}`
      );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Security Architecture Principle Banner */}
      <div className="bg-sky-50 border border-sky-200 p-4 rounded-3xl flex items-start gap-3.5 text-xs text-sky-950">
        <div className="p-2 bg-cyan-600 text-white rounded-xl flex-shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-extrabold uppercase tracking-wide text-cyan-950">
            Enterprise Security &amp; Secrets Isolation Boundary
          </h4>
          <p className="text-slate-600 leading-relaxed">
            Centralized System Configuration governs business-level defaults, organizational branding, operational thresholds, and localization parameters.
            <strong> Critical security secrets</strong> (Database Passwords, JWT Signing Keys, Encryption Keys, and API Credentials) remain strictly quarantined in encrypted environment variables and are never stored in master data tables.
          </p>
        </div>
      </div>

      {/* Category Filter Pills & Reset Action */}
      <div className="bg-white p-4 rounded-3xl border border-sky-100 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-700 text-white shadow-2xs font-extrabold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {canEdit && onResetAllConfigs && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset all system configuration values to baseline defaults?')) {
                onResetAllConfigs();
              }
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All to Defaults</span>
          </button>
        )}
      </div>

      {/* Config Cards Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredConfigs.map(cfg => {
          const isModified = cfg.value !== cfg.defaultValue;

          return (
            <div
              key={cfg.id}
              className={`bg-white p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-3 shadow-2xs ${
                isModified ? 'border-cyan-300 ring-1 ring-cyan-400/20' : 'border-sky-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-200">
                    {cfg.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">{cfg.key}</span>
                </div>

                <h4 className="text-sm font-extrabold text-slate-900">{cfg.name}</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{cfg.description}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Configured Value:</span>
                  {isModified && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
                      Customized
                    </span>
                  )}
                </div>
                <p className="text-sm font-black font-mono text-cyan-950 truncate">
                  {cfg.value}
                </p>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 flex justify-between">
                  <span>Factory Default: <strong className="font-mono text-slate-600">{cfg.defaultValue}</strong></span>
                  <span>Type: <strong className="uppercase">{cfg.dataType}</strong></span>
                </div>
              </div>

              {canEdit && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="text-[10px] text-slate-400">
                    Updated: {new Date(cfg.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isModified && (
                      <button
                        type="button"
                        onClick={() => handleResetSingle(cfg)}
                        className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-[11px] font-bold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Revert to factory default value"
                      >
                        Revert
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cfg)}
                      className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Configure</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* EDIT CONFIG MODAL */}
      {editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-sky-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-100 text-cyan-800 rounded-xl">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">
                    System Parameter Configuration
                  </span>
                  <h3 className="text-sm font-black text-slate-900">{editingConfig.name}</h3>
                </div>
              </div>
              <button onClick={() => setEditingConfig(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <p className="text-slate-500 text-[11px]">{editingConfig.description}</p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Parameter Value ({editingConfig.dataType})
                </label>

                {editingConfig.dataType === 'select' && editingConfig.options ? (
                  <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                  >
                    {editingConfig.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : editingConfig.dataType === 'boolean' ? (
                  <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                  >
                    <option value="true">True (Enabled)</option>
                    <option value="false">False (Disabled)</option>
                  </select>
                ) : editingConfig.dataType === 'number' ? (
                  <input
                    type="number"
                    required
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Audit Modification Reason <span className="text-slate-400 font-normal">(Mandatory)</span>
                </label>
                <input
                  type="text"
                  required
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="e.g. Approved directive by Bureau Head on 04 October 2026..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setEditingConfig(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl font-black shadow-md cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
