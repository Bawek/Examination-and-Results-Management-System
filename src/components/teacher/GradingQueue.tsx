import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { CheckCircle2, Send } from 'lucide-react';
import { Card, CardTitle, Input, Button } from '../ui';

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

  useEffect(() => { loadQueue(); }, []);

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
        <Card>
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <CardTitle>Queue is Clean</CardTitle>
            <p className="text-sm text-slate-600 mt-2">
              All submitted candidate responses have been scored. All objective items were auto-scored and manual items have been reviewed.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue List */}
          <Card padding="sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-semibold text-slate-700 mb-2">
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
                    className={`w-full text-left p-2.5 rounded transition-colors ${isSelected ? 'bg-indigo-50/70 border border-indigo-200' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">{item.first_name} {item.last_name}</span>
                      <span className="font-mono text-slate-500">{item.admission_no}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate mt-0.5">{item.exam_title}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span className="capitalize">{item.question_type.replace('_', ' ')}</span>
                      <span className="font-mono">{item.max_marks} marks max</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Grading Evaluation Pane */}
          {selectedItem && (
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
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

              <div className="space-y-1 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Question Prompt</span>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-800">
                  {selectedItem.prompt}
                </p>
              </div>

              <div className="space-y-1 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Candidate Submission Response</span>
                <div className="bg-amber-50 p-3.5 rounded-lg border border-amber-200 text-sm font-mono leading-relaxed whitespace-pre-wrap text-slate-800">
                  {selectedItem.response_data?.text || JSON.stringify(selectedItem.response_data, null, 2)}
                </div>
              </div>

              {selectedItem.rubric?.criteria && (
                <div className="space-y-2 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Grading Rubric Criteria (GRD-03)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedItem.rubric.criteria.map((c: any, i: number) => (
                      <div key={i} className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between">
                        <span className="text-slate-700">{c.criterion}</span>
                        <span className="font-mono font-semibold text-slate-900 ml-2 whitespace-nowrap">{c.maxMarks} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleGradeSubmit} className="space-y-4 pt-3 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={`Awarded Marks (0 – ${selectedItem.max_marks})`}
                    type="number"
                    step="0.5"
                    min="0"
                    max={selectedItem.max_marks}
                    value={awardedMarks}
                    onChange={(e) => setAwardedMarks(e.target.value)}
                    fullWidth
                    required
                  />
                  <Input
                    label="Candidate Feedback Comment"
                    placeholder="e.g. Accurate proof steps; notation clearly demonstrated."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    fullWidth
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={submitting}
                    variant="primary"
                    icon={<Send size={14} />}
                  >
                    Record Grade
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
