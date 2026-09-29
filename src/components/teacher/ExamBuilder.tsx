import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Exam, ClassSubject, Term, Question } from '../../types/index.ts';
import { Plus, Clock, RefreshCw, Send, CheckCircle2, AlertCircle, FileCheck, Layers } from 'lucide-react';

export const ExamBuilder: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string>('');

  // New Exam Modal
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
        api.getExams(),
        api.getClassSubjects(),
        api.getTerms(),
        api.getQuestions()
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

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestionIds.length === 0) {
      alert('Please select at least one question from the bank to include in the examination.');
      return;
    }

    try {
      // Default dates: opens now, closes in 48 hours
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
      setTitle('');
      setInstructions('');
      setSelectedQuestionIds([]);
      loadData();
    } catch (err: any) {
      alert(`Error creating exam: ${err.message}`);
    }
  };

  const handleReleaseExam = async (examId: number) => {
    if (!confirm('Are you sure you want to release exam feedback to candidates? (GRD-08, INT-05: This makes scores visible to candidates without publishing term report cards)')) {
      return;
    }
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
            Examinations & Scheduling (EXM-01 to EXM-11)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build timed online examinations, set navigation policies, release candidate results, and sync scores into assessment marksheets.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Build Examination</span>
        </button>
      </div>

      {syncStatus && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md text-xs text-indigo-900 flex items-center gap-2">
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
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                      ex.status === 'results_released'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : ex.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {ex.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                  <span className="font-medium text-slate-700">{ex.subject_name}</span>
                  <span>·</span>
                  <span>{ex.class_name} ({ex.section_name})</span>
                  <span>·</span>
                  <span>{ex.term_name}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Release to candidates */}
                {ex.status === 'published' && (
                  <button
                    onClick={() => handleReleaseExam(ex.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-medium"
                    title="Release score & feedback to student candidates (GRD-08)"
                  >
                    <Send className="w-3 h-3" />
                    <span>Release Results</span>
                  </button>
                )}

                {/* Sync to continuous assessment marks */}
                <button
                  onClick={() => handleSyncToMarks(ex.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-medium"
                  title="Scale & Transfer scores to assessment marks (INT-01 to INT-07)"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync to Marks (SRMS)</span>
                </button>
              </div>
            </div>

            {/* Exam Parameters & Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px]">DURATION & ATTEMPTS</span>
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
                <span className="text-slate-400 block text-[10px]">NAVIGATION & FEEDBACK</span>
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
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl space-y-4 my-8">
            <h3 className="text-base font-bold text-slate-900">Build & Schedule Examination (EXM-01)</h3>
            <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Class-Subject Offering (Course)</label>
                  <select
                    value={classSubjectId}
                    onChange={(e) => setClassSubjectId(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  >
                    {classSubjects.map(cs => (
                      <option key={cs.id} value={cs.id}>
                        {cs.subject_name} ({cs.class_name} · {cs.section_name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Academic Term</label>
                  <select
                    value={termId}
                    onChange={(e) => setTermId(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  >
                    {terms.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Exam Title</label>
                <input
                  type="text"
                  placeholder="e.g. Mid-Term Physics & Mechanics Examination"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Instructions for Candidates</label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Allowed materials, formula sheets, conduct expectations..."
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Attempt Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={attemptLimit}
                    onChange={(e) => setAttemptLimit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Counted Attempt (INT-03)</label>
                  <select
                    value={countedRule}
                    onChange={(e) => setCountedRule(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  >
                    <option value="highest">Highest Score</option>
                    <option value="latest">Latest Sitting</option>
                    <option value="average">Average of Sittings</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Navigation Policy (EXM-03)</label>
                  <select
                    value={navPolicy}
                    onChange={(e) => setNavPolicy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  >
                    <option value="free">Free Movement & Question Review</option>
                    <option value="locked">Linear / Lock Previous Answers</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Feedback Policy (EXM-04)</label>
                  <select
                    value={feedbackPolicy}
                    onChange={(e) => setFeedbackPolicy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  >
                    <option value="after_release">Authorized Release Only</option>
                    <option value="after_close">After Access Window Closes</option>
                    <option value="immediate">Immediate Feedback on Submit</option>
                  </select>
                </div>
              </div>

              {/* Select Questions from Bank */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-900">
                    Select Questions from Bank ({selectedQuestionIds.length} chosen)
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Checked items will be added to the exam
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
                  {questions.map((q) => {
                    const isChecked = selectedQuestionIds.includes(q.id);
                    return (
                      <label
                        key={q.id}
                        className={`flex items-start gap-2.5 p-2 text-xs cursor-pointer hover:bg-slate-50 ${
                          isChecked ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                            else setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== q.id));
                          }}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900">{q.subject_name}</span>
                            <span className="font-mono text-slate-600">{q.marks} marks</span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-1">{q.prompt}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800"
                >
                  Publish Examination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
