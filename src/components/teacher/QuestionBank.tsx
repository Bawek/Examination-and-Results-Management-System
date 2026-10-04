import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Question, Subject } from '../../types/index.ts';
import { Plus, Filter } from 'lucide-react';
import { Button, Select, Badge, Modal, ModalFooter, Input, Textarea } from '../ui';

export const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [qSubjectId, setQSubjectId] = useState<number>(1);
  const [qType, setQType] = useState<Question['type']>('single_choice');
  const [qPrompt, setQPrompt] = useState('');
  const [qMarks, setQMarks] = useState('5.0');
  const [qDifficulty, setQDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [qExplanation, setQExplanation] = useState('');

  const [options, setOptions] = useState([
    { id: 'opt_1', text: '' },
    { id: 'opt_2', text: '' },
    { id: 'opt_3', text: '' },
    { id: 'opt_4', text: '' },
  ]);
  const [singleCorrectOpt, setSingleCorrectOpt] = useState('opt_1');
  const [multiCorrectOpts, setMultiCorrectOpts] = useState<string[]>(['opt_1']);
  const [scoringPolicy, setScoringPolicy] = useState<'all_or_nothing' | 'partial_credit'>('partial_credit');
  const [acceptedAnswersText, setAcceptedAnswersText] = useState('');
  const [rubricCriteria] = useState([
    { criterion: 'Theoretical understanding and principles', maxMarks: 3 },
    { criterion: 'Step-by-step execution & calculation', maxMarks: 4 },
    { criterion: 'Clarity of presentation & notation', maxMarks: 1 },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [qList, sList] = await Promise.all([api.getQuestions(), api.getSubjects()]);
      setQuestions(qList);
      setSubjects(sList);
      if (sList[0]) setQSubjectId(sList[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

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
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <Select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
            >
              <option value="all">All Subjects ({questions.length})</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subject_name}</option>
              ))}
            </Select>
          </div>

          <Button
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => setShowAddModal(true)}
          >
            Create Question
          </Button>
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{q.subject_name}</span>
                  <span>·</span>
                  <Badge variant="muted">{q.type.replace('_', ' ')}</Badge>
                  <span>·</span>
                  <Badge
                    variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'danger' : 'warning'}
                  >
                    {q.difficulty}
                  </Badge>
                  <span>·</span>
                  <span className="font-mono">v{q.version}</span>
                </div>
                <div className="font-mono tabular-nums font-semibold text-slate-900 text-sm">
                  {parseFloat(q.marks.toString()).toFixed(1)} marks
                </div>
              </div>

              <div className="text-sm font-medium text-slate-900 leading-relaxed">{q.prompt}</div>

              {Array.isArray(q.options) && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  {q.options.map((opt: any) => {
                    const isCorrect = q.answer_keys?.correctOptionIds?.includes(opt.id);
                    return (
                      <div key={opt.id} className={`p-2 rounded border flex items-center justify-between ${isCorrect ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                        <span>{opt.text}</span>
                        {isCorrect && <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider font-mono">Answer Key</span>}
                      </div>
                    );
                  })}
                </div>
              )}

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
                  <span className="font-medium text-slate-700">Explanation: </span>{q.explanation}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Question Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Question Bank Item"
        size="xl"
      >
        <form onSubmit={handleCreateQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <Select
              label="Subject"
              value={qSubjectId}
              onChange={(e) => setQSubjectId(parseInt(e.target.value, 10))}
              fullWidth
            >
              {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
            </Select>
            <Select
              label="Question Type"
              value={qType}
              onChange={(e) => setQType(e.target.value as Question['type'])}
              fullWidth
            >
              <option value="single_choice">Single Choice</option>
              <option value="multiple_select">Multiple Select (Partial Credit)</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short Answer</option>
              <option value="essay">Essay / Long Answer (Rubric)</option>
            </Select>
            <Input
              label="Marks Allotted"
              type="number"
              step="0.5"
              value={qMarks}
              onChange={(e) => setQMarks(e.target.value)}
              fullWidth
              required
            />
          </div>

          <Select
            label="Difficulty"
            value={qDifficulty}
            onChange={(e) => setQDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            fullWidth
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>

          <Textarea
            label="Question Prompt"
            rows={3}
            value={qPrompt}
            onChange={(e) => setQPrompt(e.target.value)}
            placeholder="Enter the complete question prompt..."
            fullWidth
            required
          />

          {/* Options for single_choice / multiple_select */}
          {(qType === 'single_choice' || qType === 'multiple_select') && (
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                  Answer Choices &amp; Protected Correct Key
                </label>
                {qType === 'multiple_select' && (
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Select all choices that are correct</span>
                )}
              </div>
              {options.map((opt, idx) => (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type={qType === 'single_choice' ? 'radio' : 'checkbox'}
                    name="correctChoice"
                    checked={qType === 'single_choice' ? singleCorrectOpt === opt.id : multiCorrectOpts.includes(opt.id)}
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
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none' }}
                    required
                  />
                </div>
              ))}
            </div>
          )}

          {qType === 'short_answer' && (
            <Input
              label="Accepted Answers (Comma separated exact matches)"
              type="text"
              placeholder="e.g. 42, forty-two, 42.0"
              value={acceptedAnswersText}
              onChange={(e) => setAcceptedAnswersText(e.target.value)}
              fullWidth
            />
          )}

          <Textarea
            label="Explanatory Feedback (Visible after release)"
            rows={2}
            value={qExplanation}
            onChange={(e) => setQExplanation(e.target.value)}
            placeholder="Solution steps or reference rationale..."
            fullWidth
          />

          <ModalFooter>
            <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save to Bank</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};
