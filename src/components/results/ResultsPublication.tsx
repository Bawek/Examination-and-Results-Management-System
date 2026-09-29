import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Term, SchoolClass, Section } from '../../types/index.ts';
import { ReportCardModal } from '../student/ReportCardModal.tsx';
import { CheckCircle, Lock, Unlock, Send, Printer, FileText, Download, ShieldAlert } from 'lucide-react';

export const ResultsPublication: React.FC = () => {
  const { currentRole } = useAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number>(1);
  const [selectedSectionId, setSelectedSectionId] = useState<number>(1);

  const [summaries, setSummaries] = useState<any[]>([]);
  const [publication, setPublication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Selected student for Report Card modal
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // Unlock reason prompt modal
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [tList, cData] = await Promise.all([
        api.getTerms(),
        api.getClasses()
      ]);
      setTerms(tList);
      setClasses(cData.classes);
      setSections(cData.sections);
      if (tList[0]) setSelectedTermId(tList[0].id);
      if (cData.sections[0]) setSelectedSectionId(cData.sections[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadSectionResults = async (termId: number, secId: number) => {
    if (!termId || !secId) return;
    try {
      setLoading(true);
      const res = await api.getSectionResults(termId, secId);
      setSummaries(res.summaries || []);
      setPublication(res.publication || { status: 'draft' });
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTermId && selectedSectionId) {
      loadSectionResults(selectedTermId, selectedSectionId);
    }
  }, [selectedTermId, selectedSectionId]);

  const handleAction = async (action: string, reason = '') => {
    try {
      setActionLoading(true);
      await api.publicationAction(selectedTermId, selectedSectionId, action, reason);
      await loadSectionResults(selectedTermId, selectedSectionId);
      setShowUnlockModal(false);
      setUnlockReason('');
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const status = publication?.status || 'draft';

  const exportCSV = () => {
    if (summaries.length === 0) return;
    let csv = 'Rank,Admission No,Student Name,Gender,Overall Total,Average (%),Grade,GPA,Status\n';
    summaries.forEach((s) => {
      csv += `${s.rank},${s.admissionNo},"${s.studentName}",${s.gender},${s.overallTotal},${s.overallAverage}%,${s.overallGrade},${s.overallGpa},${s.passed ? 'PASSED' : 'FAILED'}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Results_Term_${selectedTermId}_Section_${selectedSectionId}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Results Engine & Publication Governance (PUB-01 to PUB-07)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Server-side calculation of subject weights, GPAs, competition ranks, and multi-stage review & publication workflow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 bg-white hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Workflow Action Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Academic Term</label>
            <select
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(parseInt(e.target.value, 10))}
              className="px-2.5 py-1.5 border border-slate-300 rounded font-medium text-slate-900 bg-white"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Class Section</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(parseInt(e.target.value, 10))}
              className="px-2.5 py-1.5 border border-slate-300 rounded font-medium text-slate-900 bg-white"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.section_name}</option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">Current Phase:</span>
            <span
              className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide border ${
                status === 'locked'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : status === 'published'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : status === 'approved'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : status === 'under_review'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Workflow Action Transitions */}
        <div className="flex flex-wrap items-center gap-2">
          {status === 'draft' && (
            <button
              onClick={() => handleAction('submit_review')}
              disabled={actionLoading}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium"
            >
              Submit for Registrar Review
            </button>
          )}

          {(status === 'under_review' || currentRole === 'admin') && (
            <button
              onClick={() => handleAction('approve')}
              disabled={actionLoading}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
            >
              Approve Results
            </button>
          )}

          {(status === 'approved' || (status === 'draft' && currentRole === 'admin')) && (
            <button
              onClick={() => handleAction('publish')}
              disabled={actionLoading}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold shadow-sm"
            >
              Publish to Students (PUB-02)
            </button>
          )}

          {status === 'published' && (
            <>
              <button
                onClick={() => handleAction('unpublish')}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded font-medium"
              >
                Unpublish
              </button>
              <button
                onClick={() => handleAction('lock')}
                disabled={actionLoading}
                className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Term Results (PUB-04)</span>
              </button>
            </>
          )}

          {status === 'locked' && (
            <button
              onClick={() => setShowUnlockModal(true)}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Reopen Locked Results (Admin Override)</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto shadow-xs">
        <table className="min-w-full text-xs text-left divide-y divide-slate-200">
          <thead className="bg-slate-50 text-slate-700 font-semibold">
            <tr>
              <th className="py-3 px-3 w-16">Rank</th>
              <th className="py-3 px-3 w-28">Admission No</th>
              <th className="py-3 px-3 w-40">Student Name</th>
              <th className="py-3 px-3">Subject Breakdown</th>
              <th className="py-3 px-3 font-mono">Total Score</th>
              <th className="py-3 px-3 font-mono">Weighted Avg</th>
              <th className="py-3 px-3">Grade</th>
              <th className="py-3 px-3 font-mono">GPA</th>
              <th className="py-3 px-3">Outcome</th>
              <th className="py-3 px-3 text-right">Official Document</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {summaries.map((s) => (
              <tr key={s.studentId} className="hover:bg-slate-50/70">
                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                  #{s.rank}
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-600">{s.admissionNo}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                  {s.studentName}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex flex-wrap gap-1.5">
                    {s.subjects.map((sub: any) => (
                      <span
                        key={sub.subjectId}
                        className="text-[11px] font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-800"
                        title={`${sub.subjectName}: ${sub.subjectTotal}% (${sub.grade})`}
                      >
                        {sub.subjectCode}: {sub.subjectTotal}% ({sub.grade})
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 px-3 font-mono font-bold text-slate-900 tabular-nums">
                  {s.overallTotal}
                </td>
                <td className="py-2.5 px-3 font-mono font-bold text-slate-900 tabular-nums">
                  {s.overallAverage}%
                </td>
                <td className="py-2.5 px-3">
                  <span className="font-bold text-slate-900">{s.overallGrade}</span>
                </td>
                <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800">
                  {s.overallGpa.toFixed(2)}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      s.passed
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : 'text-rose-700 bg-rose-50 border border-rose-200'
                    }`}
                  >
                    {s.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => setSelectedStudentId(s.studentId)}
                    className="flex items-center gap-1 ml-auto text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Report Card</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Unlock / Reopen Modal (Mandatory documented reason per PUB-04) */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Reopen Locked Term Results (PUB-04)</h3>
            </div>
            <p className="text-xs text-slate-600">
              Per strict institutional governance, unlocking a finalized term requires Administrator authorization and a mandatory audit reason.
            </p>
            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-slate-700">Official Justification / Reason</label>
              <textarea
                rows={3}
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="e.g. Authorized correction of physics exam essay rubric following registrar committee review."
                className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-rose-500"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction('reopen', unlockReason)}
                disabled={!unlockReason.trim() || actionLoading}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold disabled:opacity-50"
              >
                Confirm Unlock & Log Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Card Modal */}
      {selectedStudentId && (
        <ReportCardModal
          studentId={selectedStudentId}
          termId={selectedTermId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  );
};
