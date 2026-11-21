import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api.ts';
import { Button, Badge, Card } from '../ui/index.ts';
import { Clock, CheckCircle2, Flag, ArrowLeft, ArrowRight, Save, Send } from 'lucide-react';

interface ExamDeliveryRoomProps {
  attemptId: number;
  onExit: () => void;
}

export const ExamDeliveryRoom: React.FC<ExamDeliveryRoomProps> = ({ attemptId, onExit }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Candidate answers state: questionId -> responseData
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Server Authoritative Countdown Timer (DLV-04, 8.1)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<any | null>(null);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    api.getAttempt(attemptId)
      .then((res) => {
        setData(res);

        // Prepopulate existing saved answers
        const ansMap: Record<number, any> = {};
        if (res.savedAnswers) {
          res.savedAnswers.forEach((a: any) => {
            ansMap[a.question_id] = a.response_data;
          });
        }
        setAnswers(ansMap);

        // Calculate initial remaining seconds using server deadline
        const deadline = new Date(res.attempt.deadline_at).getTime();
        const serverNow = new Date(res.serverTime || Date.now()).getTime();
        const diffSecs = Math.max(0, Math.floor((deadline - serverNow) / 1000));
        setRemainingSeconds(diffSecs);

        // If already submitted
        if (res.attempt.status !== 'in_progress') {
          setSubmissionReceipt({
            status: res.attempt.status,
            rawScore: res.attempt.raw_score,
            percentage: res.attempt.percentage,
            message: 'This sitting has already been submitted and concluded.'
          });
        }
      })
      .catch((err) => alert(`Error loading exam attempt: ${err.message}`))
      .finally(() => setLoading(false));
  }, [attemptId]);

  // Countdown timer effect
  useEffect(() => {
    if (remainingSeconds <= 0 || submissionReceipt) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [remainingSeconds, submissionReceipt]);

  const handleAutoSubmit = async () => {
    try {
      setIsSubmitting(true);
      const res = await api.submitAttempt(attemptId, 'Server deadline expired (auto-submit)');
      setSubmissionReceipt(res);
    } catch (err: any) {
      console.error('Auto-submit failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerChange = async (questionId: number, responseData: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: responseData }));
    setSaveStatus('saving');

    try {
      await api.saveAttemptAnswer(attemptId, questionId, responseData);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you wish to submit your examination? Once submitted, you cannot change your responses.')) {
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await api.submitAttempt(attemptId, 'Candidate manual submission');
      setSubmissionReceipt(res);
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="loader-ring" />
      </div>
    );
  }

  // Submission Receipt Screen (DLV-09)
  if (submissionReceipt) {
    return (
      <Card padding="lg" style={{ maxWidth: '512px', margin: '3rem auto' }}>
        <div className="text-center space-y-5">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={24} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Examination Submitted</h1>
            <p className="text-xs text-slate-500 mt-1">
              Receipt ID:{' '}
              <span className="font-mono font-medium text-slate-700">
                ATT-{attemptId}-{Date.now().toString().slice(-6)}
              </span>
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold uppercase text-slate-800 font-mono">{submissionReceipt.status}</span>
            </div>
            {submissionReceipt.rawScore !== undefined && submissionReceipt.rawScore !== null && (
              <div className="flex justify-between">
                <span className="text-slate-500">Objective Score:</span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {submissionReceipt.rawScore} marks ({submissionReceipt.percentage}%)
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 text-slate-600 text-[11px]">
              {submissionReceipt.message}
            </div>
          </div>

          <Button variant="primary" onClick={onExit}>
            Return to Dashboard
          </Button>
        </div>
      </Card>
    );
  }

  const { attempt, questions } = data;
  const currentQ = questions[currentIndex];
  const currentResp = answers[currentQ.id] || {};

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isTimeCritical = remainingSeconds < 300; // less than 5 mins

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header: Title, Server-Time Clock, and Autosave Indicator */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-slate-900 text-sm font-semibold truncate max-w-md">{attempt.exam_title}</h1>
          <div className="text-slate-500 text-xs font-mono mt-0.5">
            Candidate: {attempt.first_name} {attempt.last_name} ({attempt.admission_no}) · Sitting #{attempt.attempt_no}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Autosave Indicator (DLV-06) */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <Save className="w-3.5 h-3.5" />
            {saveStatus === 'saved' && <Badge variant="success">Saved</Badge>}
            {saveStatus === 'saving' && <Badge variant="warning">Saving…</Badge>}
            {saveStatus === 'error' && <Badge variant="danger">Error</Badge>}
          </div>

          {/* Server Countdown Clock (DLV-04, 8.1) */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-mono font-bold text-sm border ${
              isTimeCritical
                ? 'bg-red-50 border-red-300 text-red-700 animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Question Area + Question Navigator */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Question Area */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 font-mono">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span>·</span>
              <span className="text-slate-500 font-mono tabular-nums">{currentQ.marks} marks</span>
            </div>

            <button
              onClick={() => setFlagged({ ...flagged, [currentQ.id]: !flagged[currentQ.id] })}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors ${
                flagged[currentQ.id]
                  ? 'bg-amber-100 text-amber-800 font-medium'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Flag className="w-3 h-3" />
              <span>{flagged[currentQ.id] ? 'Flagged for Review' : 'Flag Question'}</span>
            </button>
          </div>

          {/* Prompt */}
          <div className="text-sm font-semibold text-slate-900 leading-relaxed">
            {currentQ.prompt}
          </div>

          {/* Answer Form per Question Type */}
          <div className="pt-2">
            {/* Single Choice / True-False */}
            {(currentQ.type === 'single_choice' || currentQ.type === 'true_false') && (
              <div className="space-y-2.5">
                {currentQ.options?.map((opt: any) => {
                  const isChecked = currentResp.selectedOptionId === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-2 border-indigo-600 bg-indigo-50 text-indigo-900 font-medium'
                          : 'border border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q_${currentQ.id}`}
                        checked={isChecked}
                        onChange={() => handleAnswerChange(currentQ.id, { selectedOptionId: opt.id })}
                        className="text-indigo-600 focus:ring-indigo-600"
                      />
                      <span>{opt.text}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Multiple Select */}
            {currentQ.type === 'multiple_select' && (
              <div className="space-y-2.5">
                <p className="text-[11px] text-slate-500 mb-2">
                  Select all options that apply (partial credit awarded for valid selections).
                </p>
                {currentQ.options?.map((opt: any) => {
                  const selectedIds: string[] = currentResp.selectedOptionIds || [];
                  const isChecked = selectedIds.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-2 border-indigo-600 bg-indigo-50 text-indigo-900 font-medium'
                          : 'border border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...selectedIds, opt.id]
                            : selectedIds.filter((id: string) => id !== opt.id);
                          handleAnswerChange(currentQ.id, { selectedOptionIds: updated });
                        }}
                        className="text-indigo-600 focus:ring-indigo-600"
                      />
                      <span>{opt.text}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Short Answer — raw input to preserve layout */}
            {currentQ.type === 'short_answer' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Your Answer</label>
                <input
                  type="text"
                  value={currentResp.text || ''}
                  onChange={(e) => handleAnswerChange(currentQ.id, { text: e.target.value })}
                  placeholder="Type concise answer here..."
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            )}

            {/* Essay / Long Answer — raw textarea to preserve layout */}
            {currentQ.type === 'essay' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Written Response (Evaluated against instructor rubric)
                </label>
                <textarea
                  rows={6}
                  value={currentResp.text || ''}
                  onChange={(e) => handleAnswerChange(currentQ.id, { text: e.target.value })}
                  placeholder="Provide your complete reasoning, mathematical derivation, or essay response..."
                  className="w-full p-3 border border-slate-300 rounded text-xs leading-relaxed focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              icon={<ArrowLeft size={14} />}
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>

            {currentIndex < questions.length - 1 ? (
              <Button
                variant="primary"
                iconPosition="right"
                icon={<ArrowRight size={14} />}
                onClick={() => setCurrentIndex(currentIndex + 1)}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={<Send size={14} />}
                style={{ background: '#059669' }}
                onClick={handleSubmit}
                loading={isSubmitting}
              >
                Submit Final Exam
              </Button>
            )}
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <Card padding="sm">
          <div className="space-y-4">
            <div className="font-bold text-slate-900 pb-2 border-b border-slate-100 text-xs">
              Question Navigator
            </div>

            <div className="grid grid-cols-4 gap-2">
              {questions.map((q: any, idx: number) => {
                const isCurrent = idx === currentIndex;
                const hasAnswer = answers[q.id] && (
                  answers[q.id].selectedOptionId ||
                  (answers[q.id].selectedOptionIds && answers[q.id].selectedOptionIds.length > 0) ||
                  answers[q.id].text
                );
                const isFlag = flagged[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg font-mono font-bold text-xs flex items-center justify-center relative transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white border border-indigo-600'
                        : hasAnswer
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlag && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-300" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-white border border-slate-200" />
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Flagged for Review</span>
              </div>
            </div>

            {/* Final Submit Trigger */}
            <div className="pt-4">
              <Button variant="primary" fullWidth onClick={handleSubmit} loading={isSubmitting}>
                Finish &amp; Submit
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
