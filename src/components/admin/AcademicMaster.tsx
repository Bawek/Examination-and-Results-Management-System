import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { AcademicYear, Term, SchoolClass, Section, Subject, ClassSubject } from '../../types/index.ts';
import { Plus, BookOpen, Calendar, Layers } from 'lucide-react';

export const AcademicMaster: React.FC = () => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [loading, setLoading] = useState(true);

  // New subject form modal
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newMax, setNewMax] = useState('100');
  const [newPass, setNewPass] = useState('50');

  const loadData = async () => {
    try {
      setLoading(true);
      const [y, t, cData, s, cs] = await Promise.all([
        api.getAcademicYears(),
        api.getTerms(),
        api.getClasses(),
        api.getSubjects(),
        api.getClassSubjects()
      ]);
      setYears(y);
      setTerms(t);
      setClasses(cData.classes);
      setSections(cData.sections);
      setSubjects(s);
      setClassSubjects(cs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSubject({
        subject_code: newCode,
        subject_name: newName,
        max_score: parseFloat(newMax),
        pass_score: parseFloat(newPass)
      });
      setShowAddSubject(false);
      setNewCode('');
      setNewName('');
      loadData();
    } catch (err: any) {
      alert(`Error creating subject: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-mono text-xs">Loading academic structure...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Academic Architecture & Offerings (ACD-02 to ACD-07)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Academic years, terms, classes, sections, subjects catalogue and class-subject offerings ("courses" in OEMS).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Years & Terms */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Calendar className="w-4 h-4 text-slate-600" />
            <span>Academic Years & Terms (ACD-02)</span>
          </div>

          <div className="space-y-3">
            {years.map((y) => (
              <div key={y.id} className="p-3 bg-slate-50 rounded-md border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{y.name}</span>
                  {y.is_current && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded">
                      Current Year
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  {y.start_date} to {y.end_date}
                </div>

                {/* Terms within this year */}
                <div className="mt-2.5 space-y-1.5 pl-2 border-l-2 border-slate-300">
                  {terms.filter(t => t.academic_year_id === y.id).map(t => (
                    <div key={t.id} className="flex items-center justify-between text-xs py-1">
                      <span className="text-slate-700 font-medium">{t.name}</span>
                      <span className="text-[10px] text-slate-500 capitalize">{t.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Classes & Sections */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Layers className="w-4 h-4 text-slate-600" />
            <span>Classes & Stream Sections (ACD-03)</span>
          </div>

          <div className="space-y-3">
            {classes.map((cls) => {
              const clsSections = sections.filter(s => s.class_id === cls.id);
              return (
                <div key={cls.id} className="p-3 bg-slate-50 rounded-md border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{cls.name}</span>
                    <span className="text-[11px] text-slate-500">Grade Level: {cls.grade_level}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{cls.description}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] font-medium text-slate-600">Sections:</span>
                    {clsSections.map(sec => (
                      <span key={sec.id} className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                        {sec.section_name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subjects Catalogue */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <BookOpen className="w-4 h-4 text-slate-600" />
            <span>Subject Catalogue (ACD-04)</span>
          </div>
          <button
            onClick={() => setShowAddSubject(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Subject</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
              <tr>
                <th className="py-2.5 px-3">Subject Code</th>
                <th className="py-2.5 px-3">Subject Name</th>
                <th className="py-2.5 px-3">Max Score</th>
                <th className="py-2.5 px-3">Pass Threshold</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-mono font-medium text-slate-900">{sub.subject_code}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{sub.subject_name}</td>
                  <td className="py-2 px-3 font-mono tabular-nums text-slate-600">{sub.max_score}</td>
                  <td className="py-2 px-3 font-mono tabular-nums text-slate-600">{sub.pass_score}</td>
                  <td className="py-2 px-3">
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Class Subjects (Offerings / OEMS Courses) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Class-Subject Offerings (ACD-05, Reconciled "Course" Concept)
        </h2>
        <p className="text-xs text-slate-500">
          Represents a subject scheduled for a specific class section and academic year. Exams and mark entries link directly to these offerings.
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
              <tr>
                <th className="py-2.5 px-3">Offering ID</th>
                <th className="py-2.5 px-3">Class & Section</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Academic Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classSubjects.map((cs) => (
                <tr key={cs.id} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-mono text-slate-500">#{cs.id}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{cs.class_name} · {cs.section_name}</td>
                  <td className="py-2 px-3 font-medium text-slate-900">{cs.subject_name} ({cs.subject_code})</td>
                  <td className="py-2 px-3 text-slate-600">{cs.academic_year_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  placeholder="e.g. CHEM-101"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Subject Title</label>
                <input
                  type="text"
                  placeholder="e.g. Organic Chemistry"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Max Score</label>
                  <input
                    type="number"
                    value={newMax}
                    onChange={(e) => setNewMax(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Pass Score</label>
                  <input
                    type="number"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubject(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
