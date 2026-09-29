import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Users, FileText, CheckCircle2, ShieldAlert, Clock, ArrowUpRight, GraduationCap } from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then((data) => setStats(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-sm">
        Loading system telemetry from Neon PostgreSQL...
      </div>
    );
  }

  const counts = stats?.counts || {
    students: 0,
    teachers: 0,
    exams: 0,
    activeExams: 0,
    pendingGrading: 0,
    publishedResults: 0,
    auditLogs: 0,
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            System Administration Overview
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Integrated Examination Management (OEMS) & Student Result Management (SRMS)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('exams')}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-sm"
          >
            Create Examination
          </button>
          <button
            onClick={() => onNavigate('results')}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
          >
            Review Term Results
          </button>
        </div>
      </div>

      {/* KPI Metric Cards (60-30-10 palette, tabular-nums) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {counts.students}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Grade 10 · Active enrollments
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Faculty Teachers</span>
            <GraduationCap className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {counts.teachers}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Assigned to class-subjects
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Exams (OEMS)</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {counts.activeExams} / {counts.exams}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">
            Server-time window open
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Grading Queue</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {counts.pendingGrading}
          </div>
          <div className="mt-1 text-[11px] text-amber-600 font-medium">
            Subjective essays awaiting review
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Exams & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Exams */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Recent Examinations & Sittings
              </h2>
              <p className="text-xs text-slate-500">
                Online exams created, scheduled, and released to candidates
              </p>
            </div>
            <button
              onClick={() => onNavigate('exams')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {stats?.recentExams?.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No examinations found.</p>
            ) : (
              stats?.recentExams?.map((ex: any) => (
                <div key={ex.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{ex.title}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{ex.subject_name}</span>
                      <span>·</span>
                      <span>{ex.class_name} ({ex.section_name})</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{ex.duration_minutes} mins</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{ex.total_marks} marks</span>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        ex.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : ex.status === 'results_released'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ex.status === 'results_released' ? 'Results Released' : ex.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Immutable Audit Trail */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Audit Trail (ADM-01)
              </h2>
              <p className="text-xs text-slate-500">
                Immutable security and governance log
              </p>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <span>Full Log</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 mt-3">
            {stats?.recentLogs?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No audit events recorded.</p>
            ) : (
              stats?.recentLogs?.map((log: any) => (
                <div key={log.id} className="text-xs border-b border-slate-50 pb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {log.reason || log.entity_type} · by {log.user_name || 'System'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
