import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { AcademicYear, Term, SchoolClass, Section, Subject, ClassSubject } from '../../types/index.ts';
import { Plus, BookOpen, Calendar, Layers } from 'lucide-react';
import { Button, Input, Modal, ModalFooter } from '../ui';

export const AcademicMaster: React.FC = () => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'years' | 'classes' | 'subjects' | 'offerings'>('years');

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
    return (
      <div className="flex items-center justify-center py-16">
        <div className="loader-ring" />
      </div>
    );
  }

  const tabItems: { key: 'years' | 'classes' | 'subjects' | 'offerings'; label: string }[] = [
    { key: 'years', label: 'Academic Years' },
    { key: 'classes', label: 'Classes' },
    { key: 'subjects', label: 'Subjects' },
    { key: 'offerings', label: 'Offerings' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Academic Architecture &amp; Offerings (ACD-02 to ACD-07)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Academic years, terms, classes, sections, subjects catalogue and class-subject offerings ("courses" in OEMS).
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={
              activeTab === tab.key
                ? 'px-4 py-2 text-sm font-medium border-b-2 border-indigo-600 text-indigo-600 bg-white -mb-px'
                : 'px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 cursor-pointer'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Academic Years & Terms */}
      {activeTab === 'years' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Calendar className="w-4 h-4 text-slate-600" />
              <span>Academic Years &amp; Terms (ACD-02)</span>
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
        </div>
      )}

      {/* Classes & Sections */}
      {activeTab === 'classes' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Layers className="w-4 h-4 text-slate-600" />
            <span>Classes &amp; Stream Sections (ACD-03)</span>
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
      )}

      {/* Subjects Catalogue */}
      {activeTab === 'subjects' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span>Subject Catalogue (ACD-04)</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={13} />}
              onClick={() => setShowAddSubject(true)}
            >
              New Subject
            </Button>
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
      )}

      {/* Class Subjects (Offerings / OEMS Courses) */}
      {activeTab === 'offerings' && (
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
                  <th className="py-2.5 px-3">Class &amp; Section</th>
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
      )}

      {/* Add Subject Modal */}
      <Modal
        isOpen={showAddSubject}
        onClose={() => setShowAddSubject(false)}
        title="Add New Subject"
        size="sm"
      >
        <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Subject Code"
            placeholder="e.g. CHEM-101"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            fullWidth
            required
          />
          <Input
            label="Subject Title"
            placeholder="e.g. Organic Chemistry"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            fullWidth
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Max Score"
              type="number"
              value={newMax}
              onChange={(e) => setNewMax(e.target.value)}
              fullWidth
            />
            <Input
              label="Pass Score"
              type="number"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              fullWidth
            />
          </div>
          <ModalFooter>
            <Button variant="secondary" type="button" onClick={() => setShowAddSubject(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Subject</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};
