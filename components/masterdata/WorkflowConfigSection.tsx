import React, { useState } from 'react';
import { WorkflowDefinition, WorkflowStep, User, Role } from '../../types';
import { 
  GitFork, 
  Plus, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  Clock, 
  Users, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface WorkflowConfigSectionProps {
  workflows: WorkflowDefinition[];
  steps: WorkflowStep[];
  onUpdateWorkflow: (workflow: WorkflowDefinition) => void;
  onUpdateSteps: (workflowCode: string, steps: WorkflowStep[]) => void;
  canEdit: boolean;
  currentUser?: User;
}

export const WorkflowConfigSection: React.FC<WorkflowConfigSectionProps> = ({
  workflows = [],
  steps = [],
  onUpdateWorkflow,
  onUpdateSteps,
  canEdit,
  currentUser
}) => {
  const [selectedWorkflowCode, setSelectedWorkflowCode] = useState<string>(workflows[0]?.code || 'WF_PROJECT_APPRAISAL');
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);

  const selectedWorkflow = workflows.find(w => w.code === selectedWorkflowCode) || workflows[0];
  const workflowSteps = steps
    .filter(s => s.workflowCode === selectedWorkflowCode)
    .sort((a, b) => a.sequence - b.sequence);

  const allAvailableRoles = [
    'Planning Officer / Field Engineer',
    'Reviewer',
    'Directorate Director',
    'Supervisor',
    'Contract Manager',
    'Finance Officer',
    'Procurement Specialist',
    'Administrator'
  ];

  const handleOpenAddStep = () => {
    setEditingStep(null);
    setIsStepModalOpen(true);
  };

  const handleOpenEditStep = (step: WorkflowStep) => {
    setEditingStep(step);
    setIsStepModalOpen(true);
  };

  const handleSaveStep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const stepName = (form.elements.namedItem('stepName') as HTMLInputElement).value;
    const role = (form.elements.namedItem('role') as HTMLSelectElement).value;
    const approvalType = (form.elements.namedItem('approvalType') as HTMLSelectElement).value as any;
    const slaDays = Number((form.elements.namedItem('slaDays') as HTMLInputElement).value) || 3;
    const actionLabel = (form.elements.namedItem('actionLabel') as HTMLInputElement).value;
    const isRequired = (form.elements.namedItem('isRequired') as HTMLInputElement).checked;

    if (editingStep) {
      const updatedList = workflowSteps.map(s => 
        s.id === editingStep.id 
          ? { ...s, stepName, role, approvalType, slaDays, actionLabel, isRequired }
          : s
      );
      onUpdateSteps(selectedWorkflowCode, updatedList);
    } else {
      const newStep: WorkflowStep = {
        id: `step-${Date.now()}`,
        workflowCode: selectedWorkflowCode,
        stepName,
        role,
        sequence: workflowSteps.length + 1,
        approvalType,
        slaDays,
        actionLabel: actionLabel || 'Endorse & Advance',
        isRequired,
        isActive: true
      };
      onUpdateSteps(selectedWorkflowCode, [...workflowSteps, newStep]);
    }

    setIsStepModalOpen(false);
    setEditingStep(null);
  };

  const handleMoveStep = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= workflowSteps.length) return;

    const reordered = [...workflowSteps];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Re-assign sequence numbers
    const finalSteps = reordered.map((s, idx) => ({ ...s, sequence: idx + 1 }));
    onUpdateSteps(selectedWorkflowCode, finalSteps);
  };

  const handleDeleteStep = (stepId: string) => {
    if (workflowSteps.length <= 1) {
      alert('A workflow must maintain at least one defined step.');
      return;
    }
    if (confirm('Are you sure you want to remove this workflow step?')) {
      const remaining = workflowSteps
        .filter(s => s.id !== stepId)
        .map((s, idx) => ({ ...s, sequence: idx + 1 }));
      onUpdateSteps(selectedWorkflowCode, remaining);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Workflows Selector Bar */}
      <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-2xs space-y-4">
        <div>
          <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">
            Business Process Orchestration
          </span>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Configurable Governance Workflows
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure multi-tier approval sequences, designated actor roles, SLA turnaround targets, and consensus models without code modifications.
          </p>
        </div>

        {/* Workflow Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {workflows.map(wf => (
            <button
              key={wf.code}
              onClick={() => setSelectedWorkflowCode(wf.code)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                selectedWorkflowCode === wf.code
                  ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md font-extrabold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>{wf.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Workflow Canvas */}
      {selectedWorkflow && (
        <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-2xs space-y-6">
          {/* Header & Meta */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 uppercase">
                  Module: {selectedWorkflow.module}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {selectedWorkflow.code} &bull; v{selectedWorkflow.version}
                </span>
              </div>
              <h4 className="text-base font-black text-slate-900">{selectedWorkflow.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{selectedWorkflow.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-600" />
                Target SLA: {workflowSteps.reduce((sum, s) => sum + s.slaDays, 0)} Working Days
              </span>

              {canEdit && (
                <button
                  type="button"
                  onClick={handleOpenAddStep}
                  className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Append Step</span>
                </button>
              )}
            </div>
          </div>

          {/* Visual Step Pipeline Flow */}
          <div className="space-y-4">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
              Sequenced Approval Pipeline ({workflowSteps.length} Stages)
            </h5>

            <div className="space-y-3">
              {workflowSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className="p-4 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-cyan-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-cyan-700 text-white font-mono font-black text-sm flex items-center justify-center flex-shrink-0 shadow-2xs">
                      {step.sequence}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h6 className="text-xs font-extrabold text-slate-900">{step.stepName}</h6>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800">
                          {step.approvalType}
                        </span>
                        {step.isRequired && (
                          <span className="text-[10px] text-rose-600 font-bold">Mandatory</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Users className="w-3.5 h-3.5 text-cyan-600" />
                          Role: {step.role}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          SLA: {step.slaDays} Days
                        </span>
                        <span>&bull;</span>
                        <span className="italic text-slate-600">Action: &quot;{step.actionLabel || 'Endorse'}&quot;</span>
                      </div>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1.5 self-end md:self-auto flex-shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveStep(idx, 'UP')}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={idx === workflowSteps.length - 1}
                        onClick={() => handleMoveStep(idx, 'DOWN')}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditStep(step)}
                        className="p-1.5 text-slate-500 hover:text-cyan-800 hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Step"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteStep(step.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove Step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT STEP MODAL */}
      {isStepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-sky-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">
                Workflow Step Configuration
              </span>
              <button onClick={() => setIsStepModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStep} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Step Name</label>
                <input
                  type="text"
                  name="stepName"
                  required
                  defaultValue={editingStep?.stepName || ''}
                  placeholder="e.g. Technical Feasibility Verification"
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Authorizing Actor Role</label>
                <select
                  name="role"
                  defaultValue={editingStep?.role || allAvailableRoles[0]}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                >
                  {allAvailableRoles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Approval Protocol</label>
                  <select
                    name="approvalType"
                    defaultValue={editingStep?.approvalType || 'Single Sign-off'}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                  >
                    <option value="Single Sign-off">Single Sign-off</option>
                    <option value="Consensus">Consensus (All)</option>
                    <option value="Majority">Majority Vote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Turnaround SLA (Days)</label>
                  <input
                    type="number"
                    name="slaDays"
                    min={1}
                    max={60}
                    defaultValue={editingStep?.slaDays || 3}
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">UI Button Action Label</label>
                <input
                  type="text"
                  name="actionLabel"
                  defaultValue={editingStep?.actionLabel || 'Endorse & Advance'}
                  placeholder="e.g. Issue Technical Approval"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isRequired"
                  name="isRequired"
                  defaultChecked={editingStep ? editingStep.isRequired : true}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="isRequired" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Mandatory Milestone Step (Cannot be skipped)
                </label>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsStepModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl font-black shadow-md cursor-pointer"
                >
                  Save Step
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
