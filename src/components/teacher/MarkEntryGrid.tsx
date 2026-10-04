import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { ClassSubject, Term, Assessment, Student } from '../../types/index.ts';
import { Save, Send, Plus, Lock, Unlock, CheckCircle } from 'lucide-react';
import { Button, Select, Input, Modal, ModalFooter, StatusBadge } from '../ui';

export const MarkEntryGrid: React.FC = () => {
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedCsId, setSelectedCsId] = useState<number>(0);
  const [selectedTermId, setSelectedTermId] = useState<number>(0);

  const [gridData, setGridData] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [overrideFlags, setOverrideFlags] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [showAddAssmt, setShowAddAssmt] = useState(false);
  const [assmtName, setAssmtName] = useState('');
  const [assmtMax, setAssmtMax] = useState('20');
  const [assmtWeight, setAssmtWeight] = useState('20');
  const [assmtSource, setAssmtSource] = useState<'manual' | 'online_exam'>('manual');
  const [linkedExamId, setLinkedExamId] = useState<number | undefined>(undefined);
  const [availableExams, setAvailableExams] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([api.getClassSubjects(), api.getTerms(), api.getExams()])
      .then(([csList, tList, eList]) => {
        setClassSubjects(csList);
        setTerms(tList);
        setAvailableExams(eList);
        if (csList[0]) setSelectedCsId(csList[0].id);
        if (tList[0]) setSelectedTermId(tList[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadGrid = async (csId: number, tId: number) => {
    if (!csId || !tId) return;
    try {
      setLoading(true);
      const data = await api.getMarksGrid(csId, tId);
      setGridData(data);

      const initialScores: Record<string, string> = {};
      const initialStatuses: Record<string, string> = {};
      for (const a of data.assessments) {
        for (const s of data.students) {
          const key = `${a.id}_${s.id}`;
          const mark = data.marksMap[key];
          if (mark) {
            initialScores[key] = mark.score !== null ? mark.score.toString() : '';
            initialStatuses[key] = mark.mark_status || 'scored';
          } else {
            initialScores[key] = '';
            initialStatuses[key] = 'scored';
          }
        }
      }
      setScores(initialScores);
      setStatuses(initialStatuses);
      setOverrideFlags({});
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCsId && selectedTermId) loadGrid(selectedCsId, selectedTermId);
  }, [selectedCsId, selectedTermId]);

  const handleScoreChange = (assessmentId: number, studentId: number, value: string) => {
    setScores(prev => ({ ...prev, [`${assessmentId}_${studentId}`]: value }));
  };

  const handleStatusChange = (assessmentId: number, studentId: number, status: string) => {
    setStatuses(prev => ({ ...prev, [`${assessmentId}_${studentId}`]: status }));
  };

  const handleToggleOverride = (assessmentId: number, studentId: number) => {
    const key = `${assessmentId}_${studentId}`;
    setOverrideFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveMarks = async (submitForReview = false) => {
    if (!gridData) return;
    if (gridData.isLocked) {
      alert('This result period is LOCKED. No modifications can be made without an authorized reopening.');
      return;
    }
    try {
      setSaving(true);
      const entries = [];
      for (const a of gridData.assessments) {
        for (const s of gridData.students) {
          const key = `${a.id}_${s.id}`;
          const scoreVal = scores[key];
          const statusVal = statuses[key] || 'scored';
          const isOverride = !!overrideFlags[key];
          if (statusVal === 'scored' && scoreVal !== '') {
            const num = parseFloat(scoreVal);
            if (num < 0 || num > a.max_score) {
              alert(`Invalid score ${scoreVal} for student ${s.admission_no}. Max allowed is ${a.max_score}.`);
              setSaving(false);
              return;
            }
          }
          entries.push({
            assessmentId: a.id,
            studentId: s.id,
            score: statusVal === 'scored' && scoreVal !== '' ? parseFloat(scoreVal) : null,
            markStatus: statusVal,
            isOverride
          });
        }
      }
      const res = await api.saveMarks(entries, submitForReview);
      setMessage(submitForReview ? 'Marks successfully submitted for Registrar review (PUB-01).' : 'Draft marks saved successfully.');
      setTimeout(() => setMessage(''), 4000);
      loadGrid(selectedCsId, selectedTermId);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAssessment({
        class_subject_id: selectedCsId,
        term_id: selectedTermId,
        name: assmtName,
        max_score: parseFloat(assmtMax),
        weight: parseFloat(assmtWeight),
        source_type: assmtSource,
        exam_id: assmtSource === 'online_exam' ? linkedExamId : null
      });
      setShowAddAssmt(false);
      setAssmtName('');
      loadGrid(selectedCsId, selectedTermId);
    } catch (err: any) {
      alert(`Error creating assessment: ${err.message}`);
    }
  };

  if (loading && !gridData) {
    return <div className="p-8 text-center text-slate-500 font-mono text-xs">Loading marksheet roster...</div>;
  }

  const assessments: Assessment[] = gridData?.assessments || [];
  const students: Student[] = gridData?.students || [];
  const totalWeight = assessments.reduce((sum, a) => sum + parseFloat(a.weight.toString()), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Assessment Mark Entry Grid (MRK-01 to MRK-11)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Capture continuous assessment marks, view exam-transferred scores, validate score boundaries, and submit for review.
          </p>
        </div>
        {message && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Selectors Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-lg text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <Select
            label="Select Class-Subject Course"
            value={selectedCsId}
            onChange={(e) => setSelectedCsId(parseInt(e.target.value, 10))}
          >
            {classSubjects.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.subject_name} ({cs.class_name} · {cs.section_name})
              </option>
            ))}
          </Select>

          <Select
            label="Academic Term"
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(parseInt(e.target.value, 10))}
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>

          <div className="mt-4">
            <StatusBadge status={gridData?.publicationStatus || 'draft'} />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={13} />}
            disabled={gridData?.isLocked}
            onClick={() => setShowAddAssmt(true)}
          >
            Add Assessment
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={saving}
            icon={<Save size={13} />}
            disabled={gridData?.isLocked}
            onClick={() => handleSaveMarks(false)}
          >
            Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            icon={<Send size={13} />}
            disabled={gridData?.isLocked}
            onClick={() => handleSaveMarks(true)}
          >
            Submit for Review
          </Button>
        </div>
      </div>

      {/* Weight Sum Notification */}
      <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-md">
        <span className="text-slate-600">
          Configured Assessment Components: <strong className="text-slate-900 font-mono">{assessments.length}</strong>
        </span>
        <span className={`font-mono font-semibold ${totalWeight === 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
          Total Weights Sum: {totalWeight}% {totalWeight === 100 ? '✓ (Valid 100%)' : '(Weights must sum to 100% per ACD-08)'}
        </span>
      </div>

      {/* Mark Entry Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto shadow-xs">
        <table className="min-w-full text-xs text-left divide-y divide-slate-200">
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-700 font-semibold">
            <tr>
              <th className="py-3 px-3 w-16">Adm No</th>
              <th className="py-3 px-3 w-44">Student Name</th>
              {assessments.map((a) => (
                <th key={a.id} className="py-3 px-3 min-w-[200px] border-l border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{a.name}</span>
                    {a.source_type === 'online_exam' && (
                      <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Online Exam</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono font-normal mt-0.5">
                    Max: {a.max_score} · Weight: {a.weight}%
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/70">
                <td className="py-2.5 px-3 font-mono font-medium text-slate-800">{s.admission_no}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                  {s.first_name} {s.last_name}
                </td>
                {assessments.map((a) => {
                  const key = `${a.id}_${s.id}`;
                  const scoreVal = scores[key] || '';
                  const statusVal = statuses[key] || 'scored';
                  const existingMark = gridData?.marksMap[key];
                  const isExamSourced = existingMark?.source === 'exam';
                  const isOverridden = !!overrideFlags[key];
                  const isInputDisabled = gridData.isLocked || (isExamSourced && !isOverridden);

                  return (
                    <td key={a.id} className="py-2 px-3 border-l border-slate-100">
                      <div className="flex items-center gap-1.5">
                        {statusVal === 'scored' ? (
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={a.max_score}
                              disabled={isInputDisabled}
                              value={scoreVal}
                              onChange={(e) => handleScoreChange(a.id, s.id, e.target.value)}
                              style={{
                                width: '80px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                color: isInputDisabled ? '#94a3b8' : '#0f172a',
                                background: isInputDisabled ? '#f1f5f9' : '#fff',
                                outline: 'none',
                              }}
                            />
                            {isExamSourced && (
                              <button
                                type="button"
                                onClick={() => handleToggleOverride(a.id, s.id)}
                                title={isOverridden ? 'Authorized override active (INT-04)' : 'Exam-sourced mark locked. Click to enable authorized manual override.'}
                                className="ml-1 text-slate-500 hover:text-slate-800"
                              >
                                {isOverridden ? <Unlock className="w-3.5 h-3.5 text-amber-600" /> : <Lock className="w-3.5 h-3.5 text-blue-600" />}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="w-20 text-[11px] font-mono font-semibold uppercase px-2 py-1 rounded bg-slate-100 text-slate-600">
                            {statusVal}
                          </span>
                        )}
                        <select
                          disabled={gridData.isLocked}
                          value={statusVal}
                          onChange={(e) => handleStatusChange(a.id, s.id, e.target.value)}
                          className="text-[10px] border border-slate-200 rounded px-1 py-1 bg-white text-slate-700"
                        >
                          <option value="scored">Score</option>
                          <option value="absent">Absent</option>
                          <option value="excused">Excused</option>
                          <option value="exempt">Exempt</option>
                          <option value="incomplete">Incomplete</option>
                        </select>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Assessment Modal */}
      <Modal
        isOpen={showAddAssmt}
        onClose={() => setShowAddAssmt(false)}
        title="Configure Assessment Component"
        size="md"
      >
        <form onSubmit={handleCreateAssessment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Assessment Name"
            placeholder="e.g. Mid-Term Examination or Quiz 1"
            value={assmtName}
            onChange={(e) => setAssmtName(e.target.value)}
            fullWidth
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Max Score"
              type="number"
              value={assmtMax}
              onChange={(e) => setAssmtMax(e.target.value)}
              fullWidth
              required
            />
            <Input
              label="Weight (%)"
              type="number"
              value={assmtWeight}
              onChange={(e) => setAssmtWeight(e.target.value)}
              fullWidth
              required
            />
          </div>
          <Select
            label="Source Type (INT-01)"
            value={assmtSource}
            onChange={(e) => setAssmtSource(e.target.value as 'manual' | 'online_exam')}
            fullWidth
          >
            <option value="manual">Manual Entry by Instructor</option>
            <option value="online_exam">Synchronized from Online Exam (OEMS)</option>
          </Select>

          {assmtSource === 'online_exam' && (
            <Select
              label="Link to Published Exam"
              value={linkedExamId}
              onChange={(e) => setLinkedExamId(parseInt(e.target.value, 10))}
              fullWidth
            >
              <option value="">-- Select Exam --</option>
              {availableExams.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.title} ({ex.total_marks} marks)</option>
              ))}
            </Select>
          )}

          <ModalFooter>
            <Button variant="secondary" type="button" onClick={() => setShowAddAssmt(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Assessment</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};
