import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Question, Subject } from '../../types/index.ts';
import { Plus, HelpCircle, CheckCircle, Tag, Filter, FileText } from 'lucide-react';

export const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // New Question Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [qSubjectId, setQSubjectId] = useState<number>(1);
  const [qType, setQType] = useState<Question['type']>('single_choice');
  const [qPrompt, setQPrompt] = useState('');
  const [qMarks, setQMarks] = useState('5.0');
  const [qDifficulty, setQDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [qExplanation, setQExplanation] = useState('');

  // Options for single_choice / multiple_select
  const [options, setOptions] = useState([
    { id: 'opt_1', text: '' },
    { id: 'opt_2', text: '' },
    { id: 'opt_3', text: '' },
    { id: 'opt_4', text: '' },
  ]);
  const [singleCorrectOpt, setSingleCorrectOpt] = useState('opt_1');
  const [multiCorrectOpts, setMultiCorrectOpts] = useState<string[]>(['opt_1']);
  const [scoringPolicy, setScoringPolicy] = useState<'all_or_nothing' | 'partial_credit'>('partial_credit');

  // Short answer
  const [acceptedAnswersText, setAcceptedAnswersText] = useState('');

  // Essay Rubric criteria (QBK-06)
  const [rubricCriteria, setRubricCriteria] = useState([
    { criterion: 'Theoretical understanding and principles', maxMarks: 3 },
    { criterion: 'Step-by-step execution & calculation', maxMarks: 4 },
    { criterion: 'Clarity of presentation & notation', maxMarks: 1 },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [qList, sList] = await Promise.all([
        api.getQuestions(),
        api.getSubjects()
      ]);
      setQuestions(qList);
      setSubjects(sList);
      if (sList[0]) setQSubjectId(sList[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let answerKeys: any = {};
      let formattedOptions: any = null;
      let rubric: any = null;

      if (qType === 'single_choice' || qType === 'true_false') {
        formattedOptions = qType === 'true_false'
          ? [{ id: 'opt_t', text: 'True' }, { id: 'opt_f', text: 'False' }]
          : options.filter(o => o.text.trim() !== '');
        answerKeys = { correctOptionIds: [singleCorrectOpt] };
      } else if (qType === 'multiple_select') {
        formattedOptions = options.filter(o => o.text.trim() !== '');
        answerKeys = { correctOptionIds: multiCorrectOpts, scoringPolicy };
      } else if (qType === 'short_answer') {
        const answers = acceptedAnswersText.split(',').map(s => s.trim()).filter(Boolean);
        answerKeys = { acceptedAnswers: answers, manualReviewRequired: answers.length === 0 };
      } else if (qType === 'essay') {
        rubric = { criteria: rubricCriteria };
        answerKeys = { manualReviewRequired: true };
      }

      await api.createQuestion({
        subject_id: qSubjectId,
        type: qType,
        prompt: qPrompt,
        marks: parseFloat(qMarks),
        difficulty: qDifficulty,
        options: formattedOptions,
        answer_keys: answerKeys,
        rubric,
        explanation: qExplanation
      });

      setShowAddModal(false);
      setQPrompt('');
      setQExplanation('');
      loadData();
    } catch (err: any) {
      alert(`Error creating question: ${err.message}`);
    }
  };

  const filteredQuestions = selectedSubjectId === 'all'
    ? questions
    : questions.filter(q => q.subject_id === parseInt(selectedSubjectId, 10));

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-mono text-xs">Loading question bank...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Question Bank Repository (QBK-01 to QBK-11)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reusable, versioned question items with server-side protected answer keys and rubrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Subject Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none"
            >
              <option value="all">All Subjects ({questions.length})</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subject_name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Question</span>
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-lg text-xs text-slate-500">
            No questions found for the selected filter. Click "Create Question" to build your assessment bank.
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div key={q.id} className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{q.subject_name}</span>
                  <span>·</span>
                  <span className="capitalize text-slate-700">{q.type.replace('_', ' ')}</span>
                  <span>·</span>
                  <span className="capitalize">{q.difficulty} difficulty</span>
                  <span>·</span>
                  <span className="font-mono">v{q.version}</span>
                </div>
                <div className="font-mono tabular-nums font-semibold text-slate-900 text-sm">
                  {parseFloat(q.marks.toString()).toFixed(1)} marks
                </div>
              </div>

              <div className="text-sm font-medium text-slate-900 leading-relaxed">
                {q.prompt}
              </div>

              {/* Options display if applicable */}
              {Array.isArray(q.options) && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  {q.options.map((opt: any) => {
                    const isCorrect = q.answer_keys?.correctOptionIds?.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`p-2 rounded border flex items-center justify-between ${
                          isCorrect
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{opt.text}</span>
                        {isCorrect && (
                          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider font-mono">
                            Answer Key
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Essay Rubric display */}
              {q.rubric?.criteria && (
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1">
                  <div className="font-semibold text-slate-800">Scoring Rubric Criteria:</div>
                  {q.rubric.criteria.map((c: any, i: number) => (
                    <div key={i} className="flex justify-between text-[11px] text-slate-600">
                      <span>• {c.criterion}</span>
                      <span className="font-mono font-medium">{c.maxMarks} marks</span>
                    </div>
                  ))}
                </div>
              )}

              {q.explanation && (
                <div className="text-xs text-slate-500 bg-slate-50/50 p-2 rounded border border-dashed border-slate-200">
                  <span className="font-medium text-slate-700">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl space-y-4 my-8">
            <h3 className="text-base font-bold text-slate-900">Create Question Bank Item (QBK-01)</h3>
            <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Subject</label>
                  <select
                    value={qSubjectId}
                    onChange={(e) => setQSubjectId(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  >
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Question Type</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  >
                    <option value="single_choice">Single Choice</option>
                    <option value="multiple_select">Multiple Select (Partial Credit)</option>
                    <option value="true_false">True / False</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="essay">Essay / Long Answer (Rubric)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Marks Allotted</label>
                  <input
                    type="number"
                    step="0.5"
                    value={qMarks}
                    onChange={(e) => setQMarks(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Question Prompt</label>
                <textarea
                  rows={3}
                  value={qPrompt}
                  onChange={(e) => setQPrompt(e.target.value)}
                  placeholder="Enter the complete question prompt..."
                  className="w-full p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              {/* Options for single_choice / multiple_select */}
              {(qType === 'single_choice' || qType === 'multiple_select') && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-800">
                      Answer Choices & Protected Correct Key
                    </label>
                    {qType === 'multiple_select' && (
                      <span className="text-[10px] text-slate-500">
                        Select all choices that are correct
                      </span>
                    )}
                  </div>
                  {options.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type={qType === 'single_choice' ? 'radio' : 'checkbox'}
                        name="correctChoice"
                        checked={
                          qType === 'single_choice'
                            ? singleCorrectOpt === opt.id
                            : multiCorrectOpts.includes(opt.id)
                        }
                        onChange={(e) => {
                          if (qType === 'single_choice') {
                            setSingleCorrectOpt(opt.id);
                          } else {
                            if (e.target.checked) setMultiCorrectOpts([...multiCorrectOpts, opt.id]);
                            else setMultiCorrectOpts(multiCorrectOpts.filter(id => id !== opt.id));
                          }
                        }}
                      />
                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[idx].text = e.target.value;
                          setOptions(updated);
                        }}
                        className="flex-1 px-3 py-1.5 border border-slate-300 rounded"
                        required
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Short answer input */}
              {qType === 'short_answer' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Accepted Answers (Comma separated exact matches)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 42, forty-two, 42.0"
                    value={acceptedAnswersText}
                    onChange={(e) => setAcceptedAnswersText(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Explanatory Feedback (Visible after release)
                </label>
                <textarea
                  rows={2}
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Solution steps or reference rationale..."
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800"
                >
                  Save to Question Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
