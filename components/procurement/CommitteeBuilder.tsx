import React from 'react';
import { EvaluationCommittee, EvaluationCommitteeMember } from '../../types';
import { COMMITTEE_ROLES, BID_EVALUATION_METHODS, DEFAULT_SAMPLE_COMMITTEE_MEMBERS } from '../../constants';

interface CommitteeBuilderProps {
  committee: EvaluationCommittee;
  onChange: (updated: EvaluationCommittee) => void;
}

export const CommitteeBuilder: React.FC<CommitteeBuilderProps> = ({ committee, onChange }) => {
  const handleFieldChange = (field: keyof EvaluationCommittee, value: any) => {
    onChange({
      ...committee,
      [field]: value
    });
  };

  const handleMemberChange = (index: number, field: keyof EvaluationCommitteeMember, value: any) => {
    const updatedMembers = [...committee.members];
    updatedMembers[index] = {
      ...updatedMembers[index],
      [field]: value
    };
    onChange({
      ...committee,
      members: updatedMembers
    });
  };

  const handleAddMember = () => {
    const newMember: EvaluationCommitteeMember = {
      id: `MEM-${Date.now()}`,
      fullName: '',
      role: 'Technical Evaluator',
      departmentOrAgency: 'Water Supply & Sanitation Directorate (OWEB)',
      specialization: '',
      phone: '',
      email: '',
      hasSignedDeclaration: true,
      declarationDate: new Date().toISOString().split('T')[0]
    };
    onChange({
      ...committee,
      members: [...committee.members, newMember]
    });
  };

  const handleRemoveMember = (index: number) => {
    onChange({
      ...committee,
      members: committee.members.filter((_, i) => i !== index)
    });
  };

  const handleLoadDefaults = () => {
    onChange({
      ...committee,
      members: DEFAULT_SAMPLE_COMMITTEE_MEMBERS.map(m => ({ ...m, id: `MEM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` }))
    });
  };

  const roleColors: Record<string, string> = {
    'Chairperson': 'bg-amber-100 text-amber-800 border-amber-300',
    'Secretary': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'Technical Evaluator': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Procurement Specialist': 'bg-sky-100 text-sky-800 border-sky-300',
    'Financial Analyst': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'Legal Advisor': 'bg-purple-100 text-purple-800 border-purple-300',
    'Observer': 'bg-slate-100 text-slate-800 border-slate-300'
  };

  return (
    <div className="space-y-6">
      {/* Committee Governance Header Info */}
      <div className="bg-gradient-to-br from-cyan-50/80 via-sky-50/50 to-blue-50/80 p-5 rounded-2xl border border-cyan-200/70 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-cyan-600 text-white rounded-lg shadow-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              Bid Evaluation Committee (BEC) Constitution &amp; Mandate
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              Officially constituted tender evaluation body responsible for compliance verification, scoring, and award endorsement.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLoadDefaults}
            className="px-3.5 py-1.5 bg-white hover:bg-cyan-50 text-cyan-800 border border-cyan-300 rounded-xl text-xs font-semibold shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Populate with certified OWEB committee members"
          >
            <svg className="w-3.5 h-3.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Pre-fill OWEB Certified BEC Roster
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Committee Formal Title</label>
            <input
              type="text"
              value={committee.committeeName}
              onChange={(e) => handleFieldChange('committeeName', e.target.value)}
              placeholder="e.g. OWEB Water Supply Tender Evaluation Committee"
              className="w-full px-3 py-2 text-xs bg-white border border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Letter / Delegation Ref #</label>
            <input
              type="text"
              value={committee.appointmentRefNumber || ''}
              onChange={(e) => handleFieldChange('appointmentRefNumber', e.target.value)}
              placeholder="e.g. OWEB/HR/BEC-412/2025"
              className="w-full px-3 py-2 text-xs bg-white border border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Committee Formation Date</label>
            <input
              type="date"
              value={committee.formationDate}
              onChange={(e) => handleFieldChange('formationDate', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-medium"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mt-4 pt-3 border-t border-cyan-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Evaluation Methodology</label>
            <select
              value={committee.evaluationMethod}
              onChange={(e) => handleFieldChange('evaluationMethod', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-medium"
            >
              {BID_EVALUATION_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Min Technical Pass Mark (%)</label>
            <input
              type="number"
              min="50"
              max="100"
              value={committee.minimumTechnicalQualifyingScore ?? 70}
              onChange={(e) => handleFieldChange('minimumTechnicalQualifyingScore', parseInt(e.target.value) || 70)}
              className="w-full px-3 py-2 text-xs bg-white border border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-bold text-cyan-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Evaluation Venue / Hall</label>
            <input
              type="text"
              value={committee.evaluationVenue || ''}
              onChange={(e) => handleFieldChange('evaluationVenue', e.target.value)}
              placeholder="e.g. OWEB Finfinnee Conf Room 3"
              className="w-full px-3 py-2 text-xs bg-white border border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Committee Status</label>
            <select
              value={committee.status}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-bold text-slate-800"
            >
              <option value="Committee Formed">Committee Formed</option>
              <option value="In Evaluation">In Evaluation</option>
              <option value="Recommendation Submitted">Recommendation Submitted</option>
              <option value="Endorsed & Approved">Endorsed &amp; Approved</option>
              <option value="Rejected for Re-tender">Rejected for Re-tender</option>
            </select>
          </div>
        </div>
      </div>

      {/* Committee Members List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h5 className="font-bold text-sm text-slate-900">Appointed Committee Members ({committee.members.length})</h5>
            <p className="text-xs text-slate-500">Every member must execute the Conflict of Interest &amp; Confidentiality Declaration.</p>
          </div>
          <button
            type="button"
            onClick={handleAddMember}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Add Member
          </button>
        </div>

        {committee.members.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <p className="text-xs text-slate-500">No committee members added yet. Click &quot;Add Member&quot; or &quot;Pre-fill OWEB Certified BEC Roster&quot; above.</p>
          </div>
        ) : (
          <div className="grid gap-3.5">
            {committee.members.map((member, index) => (
              <div
                key={member.id}
                className="bg-white p-4 rounded-2xl border border-sky-100 shadow-2xs hover:border-cyan-300 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleColors[member.role] || 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                      {member.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(index)}
                    className="text-xs text-rose-500 hover:text-rose-700 font-semibold px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Remove Member
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name &amp; Title</label>
                    <input
                      type="text"
                      value={member.fullName}
                      onChange={(e) => handleMemberChange(index, 'fullName', e.target.value)}
                      placeholder="e.g. Eng. Tadesse Bekele"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Committee Role</label>
                    <select
                      value={member.role}
                      onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 font-medium"
                    >
                      {COMMITTEE_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Directorate / Organization</label>
                    <input
                      type="text"
                      value={member.departmentOrAgency}
                      onChange={(e) => handleMemberChange(index, 'departmentOrAgency', e.target.value)}
                      placeholder="e.g. Study & Design Directorate"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Specialization / Expertise</label>
                    <input
                      type="text"
                      value={member.specialization || ''}
                      onChange={(e) => handleMemberChange(index, 'specialization', e.target.value)}
                      placeholder="e.g. Lead Hydraulic Engineer"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 items-center">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone / Official Contact</label>
                    <input
                      type="text"
                      value={member.phone || ''}
                      onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                      placeholder="+251 911 ..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Official Email</label>
                    <input
                      type="email"
                      value={member.email || ''}
                      onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                      placeholder="name@oweb.gov.et"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 text-slate-700"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-sky-50/70 p-2 rounded-xl border border-sky-200 w-full">
                      <input
                        type="checkbox"
                        checked={member.hasSignedDeclaration}
                        onChange={(e) => handleMemberChange(index, 'hasSignedDeclaration', e.target.checked)}
                        className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500"
                      />
                      <span className="text-[11px] font-bold text-slate-800 select-none">
                        Signed Code of Ethics &amp; Impartiality
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
