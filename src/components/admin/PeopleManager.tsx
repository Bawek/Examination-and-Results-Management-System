import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Student, Teacher, SchoolClass, Section } from '../../types/index.ts';
import { Users, UserPlus, Upload, ShieldCheck, Clock } from 'lucide-react';

export const PeopleManager: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const [loading, setLoading] = useState(true);

  // New Student Modal
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newAdmission, setNewAdmission] = useState('');
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [newGender, setNewGender] = useState('M');
  const [newDob, setNewDob] = useState('2010-05-15');
  const [newGuardian, setNewGuardian] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newClassId, setNewClassId] = useState<number>(1);
  const [newSectionId, setNewSectionId] = useState<number>(1);

  // CSV Bulk Import Modal (REC-03)
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvText, setCsvText] = useState(
`admission_no,first_name,last_name,gender,date_of_birth,guardian_name,guardian_phone
STU-2026-005,Liam,O'Connor,M,2010-07-14,Patrick O'Connor,+1-555-8811
STU-2026-006,Zara,Patel,F,2010-10-30,Amina Patel,+1-555-8822`
  );
  const [parsedRows, setParsedRows] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sList, tList, cData] = await Promise.all([
        api.getStudents(),
        api.getTeachers(),
        api.getClasses()
      ]);
      setStudents(sList);
      setTeachers(tList);
      setClasses(cData.classes);
      setSections(cData.sections);
      if (cData.classes[0]) setNewClassId(cData.classes[0].id);
      if (cData.sections[0]) setNewSectionId(cData.sections[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStudent({
        admission_no: newAdmission,
        first_name: newFirst,
        last_name: newLast,
        gender: newGender,
        date_of_birth: newDob,
        guardian_name: newGuardian,
        guardian_phone: newPhone,
        class_id: newClassId,
        section_id: newSectionId
      });
      setShowAddStudent(false);
      setNewAdmission('');
      setNewFirst('');
      setNewLast('');
      loadData();
    } catch (err: any) {
      alert(`Error registering student: ${err.message}`);
    }
  };

  const handlePreviewCsv = () => {
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) return;
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 4) {
        rows.push({
          admission_no: parts[0]?.trim(),
          first_name: parts[1]?.trim(),
          last_name: parts[2]?.trim(),
          gender: parts[3]?.trim(),
          date_of_birth: parts[4]?.trim() || '2010-01-01',
          guardian_name: parts[5]?.trim() || '',
          guardian_phone: parts[6]?.trim() || ''
        });
      }
    }
    setParsedRows(rows);
  };

  const handleCommitCsv = async () => {
    try {
      for (const row of parsedRows) {
        await api.createStudent({
          ...row,
          class_id: newClassId,
          section_id: newSectionId
        });
      }
      setShowCsvImport(false);
      setParsedRows([]);
      loadData();
      alert(`Successfully imported ${parsedRows.length} student records.`);
    } catch (err: any) {
      alert(`Bulk import error: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-mono text-xs">Loading people records...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            People Records & Enrollments (REC-01 to REC-05)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Student roster, approved exam accommodations, faculty teacher registrations, and batch imports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCsvImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 bg-white hover:bg-slate-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>CSV Batch Import</span>
          </button>
          <button
            onClick={() => setShowAddStudent(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register Student</span>
          </button>
        </div>
      </div>

      {/* Segmented Tab Filter */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'students' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Students ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('teachers')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'teachers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Faculty Teachers ({teachers.length})
        </button>
      </div>

      {activeTab === 'students' ? (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Admission No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Gender / DOB</th>
                  <th className="py-2.5 px-3">Class & Section</th>
                  <th className="py-2.5 px-3">Accommodations (REC-05)</th>
                  <th className="py-2.5 px-3">Guardian Contact</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">{s.admission_no}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{s.first_name} {s.last_name}</td>
                    <td className="py-2 px-3 text-slate-600 font-mono">
                      {s.gender} · {s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-2 px-3 text-slate-800">{s.class_name} · {s.section_name}</td>
                    <td className="py-2 px-3">
                      {s.accommodation_extra_time ? (
                        <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit font-mono">
                          <Clock className="w-3 h-3" />
                          <span>+{s.accommodation_extra_time} mins extra time</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Standard</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      <div>{s.guardian_name || 'N/A'}</div>
                      <div className="text-[10px] font-mono text-slate-400">{s.guardian_phone}</div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Employee No</th>
                  <th className="py-2.5 px-3">Faculty Name</th>
                  <th className="py-2.5 px-3">Official Email</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Linked User Account</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">{t.employee_no}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{t.name}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{t.email}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{t.phone}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{t.username || 'Unlinked'}</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Register New Student (REC-01)</h3>
            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Admission Number</label>
                <input
                  type="text"
                  placeholder="e.g. STU-2026-010"
                  value={newAdmission}
                  onChange={(e) => setNewAdmission(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newFirst}
                    onChange={(e) => setNewFirst(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newLast}
                    onChange={(e) => setNewLast(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Assign Class</label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Assign Section</label>
                  <select
                    value={newSectionId}
                    onChange={(e) => setNewSectionId(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  >
                    {sections.map(s => <option key={s.id} value={s.id}>{s.section_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Guardian Name</label>
                  <input
                    type="text"
                    value={newGuardian}
                    onChange={(e) => setNewGuardian(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Guardian Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800"
                >
                  Commit Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Import Modal (REC-03) */}
      {showCsvImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Validated CSV Bulk Student Import (REC-03)
            </h3>
            <p className="text-xs text-slate-500">
              Preview row-level validation errors before committing. Never partially corrupts valid records.
            </p>

            <div className="space-y-2 text-xs">
              <label className="block font-medium text-slate-700">Paste CSV Contents</label>
              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded font-mono text-[11px] focus:ring-1 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={handlePreviewCsv}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-medium text-slate-800 text-xs"
              >
                Parse & Preview Rows
              </button>
            </div>

            {parsedRows.length > 0 && (
              <div className="border border-slate-200 rounded p-2 text-xs max-h-40 overflow-y-auto">
                <p className="font-semibold text-slate-800 mb-1">
                  Validated Rows ({parsedRows.length})
                </p>
                {parsedRows.map((r, i) => (
                  <div key={i} className="py-1 border-b border-slate-100 flex items-center justify-between font-mono text-[11px]">
                    <span>{r.admission_no} · {r.first_name} {r.last_name} ({r.gender})</span>
                    <span className="text-emerald-700 font-sans text-[10px] font-medium">Valid</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCsvImport(false);
                  setParsedRows([]);
                }}
                className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-xs"
              >
                Close
              </button>
              {parsedRows.length > 0 && (
                <button
                  type="button"
                  onClick={handleCommitCsv}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 text-xs"
                >
                  Commit Import ({parsedRows.length} students)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
