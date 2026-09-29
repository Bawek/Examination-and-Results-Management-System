import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import crestImage from '../../assets/images/apex_academy_crest_1790666516021.jpg';
import { Printer, X, Award, CheckCircle2 } from 'lucide-react';

interface ReportCardModalProps {
  studentId: number;
  termId: number;
  onClose: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({ studentId, termId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getReportCard(studentId, termId)
      .then((res) => setData(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId, termId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg text-xs font-mono text-slate-600">
          Generating official academic report card...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg max-w-md w-full space-y-3 text-xs">
          <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
          <p className="text-slate-600">{error || 'Could not load report card.'}</p>
          <div className="flex justify-end pt-2">
            <button onClick={onClose} className="px-3 py-1.5 bg-slate-900 text-white rounded">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { school, academicPeriod, studentSummary, totalStudentsCount } = data;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full shadow-2xl my-8 overflow-hidden flex flex-col">
        {/* Modal Top Actions (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold">Official Student Academic Record</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Card Content */}
        <div className="p-8 space-y-6 text-slate-900 bg-white">
          {/* Institution Header */}
          <div className="text-center pb-5 border-b-2 border-slate-900">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img
                src={crestImage}
                alt="Institutional Crest"
                className="w-14 h-14 object-contain"
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-950 uppercase">
                  {school.institution_name}
                </h1>
                <p className="text-xs text-slate-600">{school.address}</p>
                <p className="text-[11px] font-mono text-slate-500">
                  {school.contact_email} · {school.contact_phone}
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 py-1 rounded">
              Official Term Assessment & Result Transcript (RPT-03)
            </div>
          </div>

          {/* Student & Academic Period Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px]">STUDENT NAME</span>
              <span className="font-bold text-slate-900">{studentSummary.studentName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ADMISSION NO</span>
              <span className="font-mono font-bold text-slate-900">{studentSummary.admissionNo}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">CLASS & SECTION</span>
              <span className="font-bold text-slate-900">{studentSummary.className} · {studentSummary.sectionName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ACADEMIC PERIOD</span>
              <span className="font-bold text-slate-900">{academicPeriod.term_name}</span>
            </div>
          </div>

          {/* Subject Scores Table */}
          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Assessments Breakdown</th>
                  <th className="py-2.5 px-3 font-mono text-right">Final Total</th>
                  <th className="py-2.5 px-3 text-center">Grade</th>
                  <th className="py-2.5 px-3 font-mono text-right">Points</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentSummary.subjects.map((sub: any) => (
                  <tr key={sub.subjectId} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {sub.subjectName} ({sub.subjectCode})
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {sub.assessments.map((a: any) => (
                          <span key={a.assessmentId} className="font-mono">
                            {a.assessmentName}: <strong className="text-slate-900">{a.score ?? 'N/A'}/{a.maxScore}</strong>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-right tabular-nums">
                      {sub.subjectTotal}%
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                      {sub.grade}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-slate-800 tabular-nums">
                      {sub.gradePoint.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-bold ${sub.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {sub.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Academic Standing & Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-900 text-white p-4 rounded">
            <div>
              <span className="text-slate-400 block text-[10px]">WEIGHTED AVERAGE</span>
              <span className="text-lg font-bold font-mono tabular-nums">{studentSummary.overallAverage}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">CUMULATIVE GPA</span>
              <span className="text-lg font-bold font-mono tabular-nums">{studentSummary.overallGpa.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">CLASS POSITION / RANK</span>
              <span className="text-lg font-bold font-mono tabular-nums">
                Rank #{studentSummary.rank} of {totalStudentsCount}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">TERM STANDING</span>
              <span className="text-lg font-bold text-emerald-400">
                {studentSummary.passed ? 'PROMOTED / PASS' : 'ACADEMIC REVIEW'}
              </span>
            </div>
          </div>

          {/* Remarks & Signatures */}
          <div className="space-y-4 pt-2">
            <div className="text-xs text-slate-800 bg-slate-50 p-3 rounded border border-slate-200">
              <span className="font-bold text-slate-900">Faculty Remarks: </span>
              {studentSummary.teacherComment || 'Demonstrates strong dedication and academic competence throughout the assessment term.'}
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs">
              <div className="border-t border-slate-400 pt-1 font-medium text-slate-700">
                Class Teacher
              </div>
              <div className="border-t border-slate-400 pt-1 font-medium text-slate-700">
                Academic Registrar
              </div>
              <div className="border-t border-slate-400 pt-1 font-medium text-slate-700">
                Institutional Stamp & Date
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
