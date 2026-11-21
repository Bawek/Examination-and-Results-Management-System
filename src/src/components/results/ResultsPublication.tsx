import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Term, SchoolClass, Section } from '../../types/index.ts';
import { ReportCardModal } from '../student/ReportCardModal.tsx';
import { Button, Select, Badge, StatusBadge, Modal, ModalFooter, Textarea } from '../ui/index.ts';
import { CheckCircle, Lock, Unlock, Send, FileText, Download, ShieldAlert } from 'lucide-react';

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

  // Suppress unused variable warnings for classes (kept for future use)
  void classes;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Results Engine &amp; Publication Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Server-side calculation of subject weights, GPAs, competition ranks, and multi-stage review &amp; publication workflow.
          </p>
        </div>

        <Button variant="secondary" icon={<Download size={13} />} onClick={exportCSV}>
          Export CSV
        </Button>
      </div>

      {/* Filter and Workflow Action Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Select
            label="Academic Term"
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(parseInt(e.target.value, 10))}
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>

          <Select
            label="Class Section"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(parseInt(e.target.value, 10))}
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.section_name}</option>
            ))}
          </Select>

          <div className="mt-5 flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Current Phase:</span>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Workflow Action Transitions */}
        <div className="flex flex-wrap items-center gap-2">
          {status === 'draft' && (
            <Button
              variant="secondary"
              icon={<Send size={13} />}
              loading={actionLoading}
              onClick={() => handleAction('submit_review')}
            >
              Submit for Review
            </Button>
          )}

          {(status === 'under_review' || currentRole === 'admin') && (
            <Button
              variant="secondary"
              icon={<CheckCircle size={13} />}
              loading={actionLoading}
              onClick={() => handleAction('approve')}
            >
              Approve Results
            </Button>
          )}

          {(status === 'approved' || (status === 'draft' && currentRole === 'admin')) && (
            <Button
              variant="primary"
              icon={<Send size={13} />}
              loading={actionLoading}
              onClick={() => handleAction('publish')}
            >
              Publish to Students
            </Button>
          )}

          {status === 'published' && (
            <>
              <Button
                variant="ghost"
                loading={actionLoading}
                onClick={() => handleAction('unpublish')}
              >
                Unpublish
              </Button>
              <Button
                variant="danger"
                icon={<Lock size={13} />}
                loading={actionLoading}
                onClick={() => handleAction('lock')}
              >
                Lock Term Results
              </Button>
            </>
          )}

          {status === 'locked' && (
            <Button
              variant="danger"
              icon={<Unlock size={13} />}
              onClick={() => setShowUnlockModal(true)}
            >
              Reopen Locked Results
            </Button>
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
                <td className="py-2.5 px-3">
                  <span className="font-mono font-bold text-indigo-600">#{s.rank}</span>
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
                  <Badge variant={s.passed ? 'success' : 'danger'}>
                    {s.passed ? 'PASSED' : 'FAILED'}
                  </Badge>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<FileText size={13} />}
                    onClick={() => setSelectedStudentId(s.studentId)}
                  >
                    Report Card
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Unlock / Reopen Modal (Mandatory documented reason per PUB-04) */}
      <Modal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        title="Reopen Locked Results"
        size="md"
      >
        <div className="flex items-center gap-2 mb-3 text-red-600">
          <ShieldAlert size={18} />
          <p className="text-sm text-slate-600">
            Mandatory audit reason required. Unlocking a finalized term requires Administrator authorization.
          </p>
        </div>
        <Textarea
          label="Official Justification / Reason"
          rows={3}
          value={unlockReason}
          onChange={(e) => setUnlockReason(e.target.value)}
          placeholder="e.g. Authorized correction of physics exam essay rubric following registrar committee review."
          fullWidth
        />
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowUnlockModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={actionLoading}
            disabled={!unlockReason.trim()}
            onClick={() => handleAction('reopen', unlockReason)}
          >
            Confirm Unlock
          </Button>
        </ModalFooter>
      </Modal>

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
