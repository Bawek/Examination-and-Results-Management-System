import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { ExamDeliveryRoom } from './ExamDeliveryRoom.tsx';
import { ReportCardModal } from './ReportCardModal.tsx';
import { Clock, Play, FileText, CheckCircle2, Award, AlertCircle } from 'lucide-react';

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
    return <div className="p-8 text-center text-slate-500 font-mono text-xs">Loading candidate dashboard...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Student Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Candidate Examination Portal
            </h1>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              STU-2026-PORTAL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registered Student: <strong className="text-slate-800">{studentProfile?.first_name} {studentProfile?.last_name || 'Kaleb Tadesse'}</strong> · Grade 10 Section A
          </p>
        </div>

        <button
          onClick={() => setShowReportCard(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-sm transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>View Official Term Report Card (PUB-07)</span>
        </button>
      </div>

      {/* Available Examinations */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-600" />
          <span>Available Examinations & Sittings (DLV-01)</span>
        </h2>

        <div className="space-y-4">
          {exams.map((ex) => {
            const myAttempts = ex.my_attempts || [];
            const attemptsCount = parseInt(ex.my_attempt_count || '0', 10);
            const canTakeMore = attemptsCount < ex.attempt_limit;

            return (
              <div key={ex.id} className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{ex.title}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{ex.subject_name}</span>
                      <span>·</span>
                      <span>{ex.class_name} ({ex.section_name})</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{ex.duration_minutes} minutes</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{ex.total_marks} marks total</span>
                    </div>
                  </div>

                  {canTakeMore ? (
                    <button
                      onClick={() => handleStartExam(ex.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold shadow-sm transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Sitting #{attemptsCount + 1}</span>
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-slate-500 px-3 py-1.5 bg-slate-100 rounded">
                      Attempt Limit Reached ({attemptsCount}/{ex.attempt_limit})
                    </span>
                  )}
                </div>

                {ex.instructions && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                    <span className="font-semibold text-slate-700">Instructions: </span>
                    {ex.instructions}
                  </p>
                )}

                {/* Sittings History */}
                {myAttempts.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-semibold text-slate-700">Sitting History:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {myAttempts.map((att: any) => (
                        <div key={att.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
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
                                Feedback with held until release (DLV-09)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
