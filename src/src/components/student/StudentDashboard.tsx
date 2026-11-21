import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { ExamDeliveryRoom } from './ExamDeliveryRoom.tsx';
import { ReportCardModal } from './ReportCardModal.tsx';
import { Button, Card, Badge } from '../ui/index.ts';
import { Clock, Play, FileText, CheckCircle2 } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { studentProfile } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active taking sitting
  const [activeAttemptId, setActiveAttemptId] = useState<number | null>(null);

  // Report Card modal
  const [showReportCard, setShowReportCard] = useState(false);

  const studentId = studentProfile?.id || 1;

  const loadExams = async () => {
    try {
      setLoading(true);
      const data = await api.getAvailableExams(studentId);
      setExams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [studentId]);

  const handleStartExam = async (examId: number) => {
    try {
      const res = await api.startAttempt(examId, studentId);
      if (res.extraMinutesGranted > 0) {
        alert(`Approved accommodation applied: +${res.extraMinutesGranted} minutes extra time!`);
      }
      setActiveAttemptId(res.attempt.id);
    } catch (err: any) {
      alert(`Could not start sitting: ${err.message}`);
    }
  };

  if (activeAttemptId) {
    return (
      <ExamDeliveryRoom
        attemptId={activeAttemptId}
        onExit={() => {
          setActiveAttemptId(null);
          loadExams();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="loader-ring" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Student Welcome Banner */}
      <Card padding="lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Candidate Examination Portal
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Registered Student:{' '}
              <strong className="text-slate-800">
                {studentProfile?.first_name} {studentProfile?.last_name || 'Kaleb Tadesse'}
              </strong>{' '}
              · Grade 10 Section A
            </p>
          </div>

          <Button
            variant="primary"
            icon={<FileText size={14} />}
            onClick={() => setShowReportCard(true)}
          >
            View Official Term Report Card
          </Button>
        </div>
      </Card>

      {/* Available Examinations */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-slate-600" />
          <span>Available Examinations &amp; Sittings</span>
        </h2>

        <div className="space-y-4">
          {exams.map((ex) => {
            const myAttempts = ex.my_attempts || [];
            const attemptsCount = parseInt(ex.my_attempt_count || '0', 10);
            const canTakeMore = attemptsCount < ex.attempt_limit;

            return (
              <Card key={ex.id} hoverable>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{ex.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <Badge variant="info">{ex.subject_name}</Badge>
                      <Badge variant="muted">{ex.duration_minutes} min</Badge>
                      <Badge variant="muted">{ex.total_marks} marks</Badge>
                    </div>
                  </div>

                  {canTakeMore ? (
                    <Button
                      variant="primary"
                      icon={<Play size={14} />}
                      onClick={() => handleStartExam(ex.id)}
                    >
                      Start Sitting #{attemptsCount + 1}
                    </Button>
                  ) : (
                    <Badge variant="muted">
                      Limit Reached ({attemptsCount}/{ex.attempt_limit})
                    </Badge>
                  )}
                </div>

                {ex.instructions && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 mt-3">
                    <span className="font-semibold text-slate-700">Instructions: </span>
                    {ex.instructions}
                  </p>
                )}

                {/* Sittings History */}
                {myAttempts.length > 0 && (
                  <div className="space-y-2 pt-3">
                    <span className="text-[11px] font-semibold text-slate-700">Sitting History:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {myAttempts.map((att: any) => (
                        <div
                          key={att.id}
                          className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-sm"
                        >
                          <div>
                            <span className="font-bold text-slate-900">Attempt #{att.attempt_no}</span>
                            <span className="text-[11px] text-slate-500 ml-2 capitalize font-mono">
                              ({att.status})
                            </span>
                          </div>
                          <div>
                            {ex.status === 'results_released' ? (
                              <span className="font-mono font-bold text-emerald-700 tabular-nums">
                                {att.raw_score !== null ? `${att.raw_score} marks` : 'Pending Score'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Feedback withheld until release
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Official Report Card Modal */}
      {showReportCard && (
        <ReportCardModal
          studentId={studentId}
          termId={1}
          onClose={() => setShowReportCard(false)}
        />
      )}
    </div>
  );
};
