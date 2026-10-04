import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Exam, ClassSubject, Term, Question } from '../../types/index.ts';
import { Plus, RefreshCw, Send } from 'lucide-react';
import { Button, Select, Input, Textarea, Modal, ModalFooter, StatusBadge } from '../ui';

export const ExamBuilder: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [classSubjectId, setClassSubjectId] = useState<number>(1);
  const [termId, setTermId] = useState<number>(1);
  const [duration, setDuration] = useState('45');
  const [attemptLimit, setAttemptLimit] = useState('2');
  const [countedRule, setCountedRule] = useState<'highest' | 'latest' | 'average'>('highest');
  const [navPolicy, setNavPolicy] = useState<'free' | 'locked'>('free');
  const [feedbackPolicy, setFeedbackPolicy] = useState<'immediate' | 'after_close' | 'after_release'>('after_release');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eList, csList, tList, qList] = await Promise.all([
        api.getExams(), api.getClassSubjects(), api.getTerms(), api.getQuestions()
      ]);
      setExams(eList);
      setClassSubjects(csList);
      setTerms(tList);
      setQuestions(qList);
      if (csList[0]) setClassSubjectId(csList[0].id);
      if (tList[0]) setTermId(tList[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestionIds.length === 0) {
      alert('Please select at least one question from the bank to include in the examination.');
      return;
    }
    try {
      const startAt = new Date();
      const endAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await api.createExam({
        class_subject_id: classSubjectId,
        term_id: termId,
        title,
        instructions,
        duration_minutes: parseInt(duration, 10),
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        attempt_limit: parseInt(attemptLimit, 10),
        counted_attempt_rule: countedRule,
        navigation_policy: navPolicy,
        show_feedback_policy: feedbackPolicy,
        question_ids: selectedQuestionIds
      });
      setShowCreateModal(false);
      setTitle(''); setInstructions(''); setSelectedQuestionIds([]);
      loadData();
    } catch (err: any) {
      alert(`Error creating exam: ${err.message}`);
    }
  };

  const handleReleaseExam = async (examId: number) => {
    if (!confirm('Are you sure you want to release exam feedback to candidates? (GRD-08, INT-05: This makes scores visible to candidates without publishing term report cards)')) return;
    try {
      await api.releaseExam(examId, true, 'Instructor approved exam result release');
      alert('Exam results and feedback successfully released to candidates.');
      loadData();
    } catch (err: any) {
      alert(`Release error: ${err.message}`);
    }
  };

  const handleSyncToMarks = async (examId: number) => {
    try {
      setSyncStatus(`Syncing exam #${examId} marks...`);
      const res = await api.syncExamToMarks(examId);
      setSyncStatus(res.message);
      setTimeout(() => setSyncStatus(''), 5000);
      loadData();
    } catch (err: any) {
      alert(`Sync error: ${err.message}`);
      setSyncStatus('');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-mono text-xs">Loading examinations...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Examinations &amp; Scheduling (EXM-01 to EXM-11)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build timed online examinations, set navigation policies, release candidate results, and sync scores into assessment marksheets.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowCreateModal(true)}>
          Build Examination
        </Button>
      </div>

      {syncStatus && (
        <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Exams Grid */}
      <div className="space-y-4">
        {exams.map((ex) => (
          <div key={ex.id} className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{ex.title}</h2>
                  <StatusBadge status={ex.status} />
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                  <span className="font-medium text-slate-700">{ex.subject_name}</span>
                  <span>·</span>
                  <span>{ex.class_name} ({ex.section_name})</span>
                  <span>·</span>
                  <span>{ex.term_name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {ex.status === 'published' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Send size={13} />}
                    onClick={() => handleReleaseExam(ex.id)}
                  >
                    Release Results
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RefreshCw size={13} />}
                  onClick={() => handleSyncToMarks(ex.id)}
                >
                  Sync to Marks
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px]">DURATION &amp; ATTEMPTS</span>
                <span className="font-semibold text-slate-800 font-mono tabular-nums">
                  {ex.duration_minutes} mins · max {ex.attempt_limit} sitting(s)
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px]">TOTAL MARKS</span>
                <span className="font-semibold text-slate-800 font-mono tabular-nums">
                  {parseFloat(ex.total_marks.toString()).toFixed(1)} marks ({ex.question_count || 0} questions)
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px]">COUNTED ATTEMPT RULE</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {ex.counted_attempt_rule} Score Counts (INT-03)
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px]">NAVIGATION &amp; FEEDBACK</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {ex.navigation_policy} nav · {ex.show_feedback_policy.replace('_', ' ')}
                </span>
              </div>
            </div>

            {ex.instructions && (
              <div className="text-xs text-slate-600 bg-slate-50/60 p-2.5 rounded border border-slate-200">
                <span className="font-semibold text-slate-700">Candidate Instructions: </span>
                {ex.instructions}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Build Exam Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Build & Schedule Examination"
        size="xl"
      >
        <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Select
              label="Class-Subject Offering (Course)"
              value={classSubjectId}
              onChange={(e) => setClassSubjectId(parseInt(e.target.value, 10))}
              fullWidth
            >
              {classSubjects.map(cs => (
                <option key={cs.id} value={cs.id}>
                  {cs.subject_name} ({cs.class_name} · {cs.section_name})
                </option>
              ))}
            </Select>
            <Select
              label="Academic Term"
              value={termId}
              onChange={(e) => setTermId(parseInt(e.target.value, 10))}
              fullWidth
            >
              {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>

          <Input
            label="Exam Title"
            type="text"
            placeholder="e.g. Mid-Term Physics & Mechanics Examination"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
          />

          <Textarea
            label="Instructions for Candidates"
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Allowed materials, formula sheets, conduct expectations..."
            fullWidth
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <Input
              label="Duration (Minutes)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              fullWidth
              required
            />
            <Input
              label="Attempt Limit"
              type="number"
              min="1"
              max="5"
              value={attemptLimit}
              onChange={(e) => setAttemptLimit(e.target.value)}
              fullWidth
            />
            <Select
              label="Counted Attempt (INT-03)"
              value={countedRule}
              onChange={(e) => setCountedRule(e.target.value as 'highest' | 'latest' | 'average')}
              fullWidth
            >
              <option value="highest">Highest Score</option>
              <option value="latest">Latest Sitting</option>
              <option value="average">Average of Sittings</option>
            </Select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Select
              label="Navigation Policy (EXM-03)"
              value={navPolicy}
              onChange={(e) => setNavPolicy(e.target.value as 'free' | 'locked')}
              fullWidth
            >
              <option value="free">Free Movement &amp; Question Review</option>
              <option value="locked">Linear / Lock Previous Answers</option>
            </Select>
            <Select
              label="Feedback Policy (EXM-04)"
              value={feedbackPolicy}
              onChange={(e) => setFeedbackPolicy(e.target.value as 'immediate' | 'after_close' | 'after_release')}
              fullWidth
            >
              <option value="after_release">Authorized Release Only</option>
              <option value="after_close">After Access Window Closes</option>
              <option value="immediate">Immediate Feedback on Submit</option>
            </Select>
          </div>

          {/* Select Questions from Bank */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                Select Questions from Bank ({selectedQuestionIds.length} chosen)
              </label>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Checked items will be added to the exam</span>
            </div>
            <div style={{ maxHeight: '192px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              {questions.map((q) => {
                const isChecked = selectedQuestionIds.includes(q.id);
                return (
                  <label
                    key={q.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 12px',
                      fontSize: '12px', cursor: 'pointer',
                      background: isChecked ? '#eef2ff' : 'transparent',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                        else setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== q.id));
                      }}
                      style={{ marginTop: '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{q.subject_name}</span>
                        <span style={{ fontFamily: 'monospace', color: '#6b7280' }}>{q.marks} marks</span>
                      </div>
                      <p style={{ fontSize: '11px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.prompt}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <ModalFooter>
            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Publish Examination</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};
