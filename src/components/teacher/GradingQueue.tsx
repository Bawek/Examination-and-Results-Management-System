import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { CheckCircle2, ShieldAlert, Award, FileText, Send } from 'lucide-react';

export const GradingQueue: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [awardedMarks, setAwardedMarks] = useState<string>('0');
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const items = await api.getGradingQueue();
      setQueue(items);
      if (items.length > 0 && !selectedItem) {
        setSelectedItem(items[0]);
        setAwardedMarks((items[0].max_marks * 0.8).toFixed(1));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleSelect = (item: any) => {
    setSelectedItem(item);
    setAwardedMarks((item.max_marks * 0.8).toFixed(1));
    setFeedback('');
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const numMarks = parseFloat(awardedMarks);
    if (isNaN(numMarks) || numMarks < 0 || numMarks > selectedItem.max_marks) {
      alert(`Awarded marks must be between 0 and ${selectedItem.max_marks}`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.gradeItem(selectedItem.answer_id, numMarks, feedback);
      alert(`Grading recorded! Attempt status: ${res.attemptStatus}. Total score: ${res.totalScore} (${res.percentage}%)`);
      setSelectedItem(null);
      loadQueue();
    } catch (err: any) {
      alert(`Grading failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-mono text-xs">Loading grading queue...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Manual Grading Queue (GRD-02, GRD-03)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Evaluate candidate essays, proofs, and subjective answers against established rubrics before result release.
        </p>
      </div>

      {queue.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h2 className="text-base font-semibold text-slate-900">Grading Queue is Clean</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All submitted candidate responses have been scored. All objective items were auto-scored and manual items have been reviewed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue List */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-semibold text-slate-700">
              <span>Pending Responses ({queue.length})</span>
              <span className="text-[10px] text-amber-600 font-mono">Requires Review</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {queue.map((item) => {
                const isSelected = selectedItem?.answer_id === item.answer_id;
                return (
                  <button
                    key={item.answer_id}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left p-2.5 rounded transition-colors ${
                      isSelected ? 'bg-indigo-50/70 border border-indigo-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">
                        {item.first_name} {item.last_name}
                      </span>
                      <span className="font-mono text-slate-500">{item.admission_no}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate mt-0.5">
                      {item.exam_title}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span className="capitalize">{item.question_type.replace('_', ' ')}</span>
                      <span className="font-mono">{item.max_marks} marks max</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grading Evaluation Pane */}
          {selectedItem && (
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Candidate: {selectedItem.first_name} {selectedItem.last_name} ({selectedItem.admission_no})
                  </h2>
                  <p className="text-xs text-slate-500">{selectedItem.exam_title}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-900 font-mono tabular-nums">
                    Max Marks: {selectedItem.max_marks}
                  </span>
                </div>
              </div>

              {/* Question Prompt */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Question Prompt
                </span>
                <p className="text-xs font-medium text-slate-900 bg-slate-50 p-3 rounded border border-slate-200">
                  {selectedItem.prompt}
                </p>
              </div>

              {/* Student Written Response */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Candidate Submission Response
                </span>
                <div className="text-xs text-slate-800 bg-amber-50/30 p-3.5 rounded border border-amber-200/60 leading-relaxed font-mono whitespace-pre-wrap">
                  {selectedItem.response_data?.text || JSON.stringify(selectedItem.response_data, null, 2)}
                </div>
              </div>

              {/* Rubric Criteria if present */}
              {selectedItem.rubric?.criteria && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Grading Rubric Criteria (GRD-03)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedItem.rubric.criteria.map((c: any, i: number) => (
                      <div key={i} className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between">
                        <span className="text-slate-700">{c.criterion}</span>
                        <span className="font-mono font-semibold text-slate-900 ml-2 whitespace-nowrap">
                          {c.maxMarks} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Score Input & Feedback */}
              <form onSubmit={handleGradeSubmit} className="space-y-4 pt-3 border-t border-slate-100 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Awarded Marks (0 – {selectedItem.max_marks})
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={selectedItem.max_marks}
                      value={awardedMarks}
                      onChange={(e) => setAwardedMarks(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-sm font-bold text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Candidate Feedback Comment
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Accurate proof steps; notation clearly demonstrated."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Recording Grade...' : 'Record Grade & Update Score'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
