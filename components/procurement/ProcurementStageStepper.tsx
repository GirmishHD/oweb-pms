import React from 'react';
import { Procurement, ProcurementStage } from '../../types';
import { PROCUREMENT_STAGES_FLOW } from '../../utils/procurementThresholds';
import { 
  FileText, 
  Megaphone, 
  FolderOpen, 
  Scale, 
  BellRing, 
  FileSignature, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface ProcurementStageStepperProps {
  currentStage: ProcurementStage;
  procurement?: Procurement;
  onStageSelect?: (stage: ProcurementStage) => void;
  isInteractive?: boolean;
}

const STAGE_ICONS: Record<string, React.ReactNode> = {
  'Preparation': <FileText className="w-4 h-4" />,
  'Advertisement / Invitation': <Megaphone className="w-4 h-4" />,
  'Bid Opening': <FolderOpen className="w-4 h-4" />,
  'Technical & Financial Evaluation': <Scale className="w-4 h-4" />,
  'Notification of Award & Standstill': <BellRing className="w-4 h-4" />,
  'Contract Signing': <FileSignature className="w-4 h-4" />,
  'Cancelled / Re-tendered': <XCircle className="w-4 h-4" />
};

export const ProcurementStageStepper: React.FC<ProcurementStageStepperProps> = ({
  currentStage,
  procurement,
  onStageSelect,
  isInteractive = false
}) => {
  const isCancelled = currentStage === 'Cancelled / Re-tendered';
  const currentStepIndex = PROCUREMENT_STAGES_FLOW.findIndex(s => s.stage === currentStage);

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-sky-100 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 text-cyan-700 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Procurement Lifecycle Tracker
            </h4>
            <p className="text-[11px] text-slate-500">
              Current Stage: <span className="font-bold text-cyan-700">{currentStage}</span>
            </p>
          </div>
        </div>

        {isCancelled && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Tender Cancelled / Re-tendered</span>
          </div>
        )}
      </div>

      {/* Stepper Progression Bar */}
      <div className="relative">
        {/* Connector Line */}
        <div className="hidden lg:block absolute top-5 left-8 right-8 h-1 bg-slate-100 -z-0">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-sky-600 transition-all duration-500"
            style={{
              width: `${isCancelled ? 100 : Math.max(0, (currentStepIndex / (PROCUREMENT_STAGES_FLOW.length - 1)) * 100)}%`
            }}
          />
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-2 relative z-10">
          {PROCUREMENT_STAGES_FLOW.map((step, idx) => {
            const isCompleted = !isCancelled && idx < currentStepIndex;
            const isCurrent = !isCancelled && idx === currentStepIndex;
            const isUpcoming = !isCancelled && idx > currentStepIndex;

            return (
              <button
                key={step.stage}
                type="button"
                disabled={!isInteractive}
                onClick={() => isInteractive && onStageSelect && onStageSelect(step.stage)}
                className={`flex flex-col items-center text-center p-2.5 rounded-xl transition-all ${
                  isInteractive ? 'cursor-pointer hover:bg-sky-50/80' : 'cursor-default'
                } ${isCurrent ? 'bg-cyan-50/80 ring-2 ring-cyan-500/40 shadow-xs' : ''}`}
              >
                {/* Step Circle */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all shadow-xs mb-2 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-gradient-to-tr from-cyan-600 to-sky-600 text-white ring-4 ring-cyan-100 shadow-cyan-500/30 animate-pulse'
                      : isCancelled
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-white border border-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    STAGE_ICONS[step.stage] || step.stepNumber
                  )}
                </div>

                {/* Step Label */}
                <span className={`text-[11px] font-bold leading-tight line-clamp-2 ${
                  isCurrent ? 'text-cyan-900' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>

                {/* Key Date Subtitle if available */}
                {procurement && (
                  <span className="text-[10px] text-slate-400 mt-1 truncate">
                    {idx === 0 && (procurement.bidIssuedDate || 'Planned')}
                    {idx === 1 && (procurement.publicationDate || procurement.biddingPeriodStart || 'Ad floating')}
                    {idx === 2 && (procurement.bidOpeningDate || procurement.biddingPeriodEnd || 'Public opening')}
                    {idx === 3 && (procurement.evaluationStatus || 'BEC Panel')}
                    {idx === 4 && (procurement.awardDate || 'Standstill')}
                    {idx === 5 && (procurement.contractSigningDate || 'Signing')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
