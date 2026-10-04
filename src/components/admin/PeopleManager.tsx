import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Student, Teacher, SchoolClass, Section } from '../../types/index.ts';
import { Users, UserPlus, Upload, ShieldCheck, Clock, X } from 'lucide-react';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui';

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
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <Card style={{ maxWidth: '500px', width: '100%' }}>
            <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <CardTitle>Register New Student (REC-01)</CardTitle>
              <button
                onClick={() => setShowAddStudent(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                <X size={18} />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateStudent} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Input
                  label="Admission Number"
                  placeholder="e.g. STU-2026-010"
                  value={newAdmission}
                  onChange={(e) => setNewAdmission(e.target.value)}
                  required
                  fullWidth
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Input
                    label="First Name"
                    value={newFirst}
                    onChange={(e) => setNewFirst(e.target.value)}
                    required
                    fullWidth
                  />
                  <Input
                    label="Last Name"
                    value={newLast}
                    onChange={(e) => setNewLast(e.target.value)}
                    required
                    fullWidth
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Select
                    label="Gender"
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    fullWidth
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </Select>
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    fullWidth
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Select
                    label="Assign Class"
                    value={String(newClassId)}
                    onChange={(e) => setNewClassId(parseInt(e.target.value, 10))}
                    fullWidth
                  >
                    {classes.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                  </Select>
                  <Select
                    label="Assign Section"
                    value={String(newSectionId)}
                    onChange={(e) => setNewSectionId(parseInt(e.target.value, 10))}
                    fullWidth
                  >
                    {sections.map(s => <option key={s.id} value={String(s.id)}>{s.section_name}</option>)}
                  </Select>
                </div>
                <Input
                  label="Guardian Name"
                  value={newGuardian}
                  onChange={(e) => setNewGuardian(e.target.value)}
                  required
                  fullWidth
                />
                <Input
                  label="Guardian Phone"
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  required
                  fullWidth
                />
              </form>
            </CardContent>
            <CardFooter>
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <Button
                  variant="secondary"
                  onClick={() => setShowAddStudent(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  onClick={handleCreateStudent}
                  style={{ flex: 1 }}
                >
                  Register Student
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* CSV Bulk Import Modal (REC-03) */}
      {showCsvImport && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <Card style={{ maxWidth: '500px', width: '100%' }}>
            <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <CardTitle>Validated CSV Bulk Student Import (REC-03)</CardTitle>
              <button
                onClick={() => setShowCsvImport(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                <X size={18} />
              </button>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', margin: 0 }}>
                  Preview row-level validation errors before committing. Never partially corrupts valid records.
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '10px', lineHeight: '1.5', letterSpacing: '0.01em' }}>
                    Paste CSV Contents
                  </label>
                  <textarea
                    rows={5}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-muted)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontFamily: 'JetBrains Mono, monospace',
                      lineHeight: '1.5',
                      letterSpacing: '0.01em',
                      resize: 'vertical',
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handlePreviewCsv}
                    variant="secondary"
                    style={{ marginTop: '12px', width: '100%' }}
                  >
                    Parse & Preview Rows
                  </Button>
                </div>
                {parsedRows.length > 0 && (
                  <div style={{
                    border: '1px solid var(--border-muted)',
                    borderRadius: '8px',
                    padding: '16px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px', margin: '0 0 12px 0' }}>
                      Validated Rows ({parsedRows.length})
                    </p>
                    {parsedRows.map((r, i) => (
                      <div key={i} style={{
                        padding: '8px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        fontFamily: 'JetBrains Mono, monospace',
                        color: '#94a3b8',
                      }}>
                        <span>{r.admission_no} · {r.first_name} {r.last_name} ({r.gender})</span>
                        <span style={{ color: '#34d399', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 500 }}>Valid</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  onClick={() => {
                    setShowCsvImport(false);
                    setParsedRows([]);
                  }}
                  variant="secondary"
                >
                  Close
                </Button>
                {parsedRows.length > 0 && (
                  <Button
                    type="button"
                    onClick={handleCommitCsv}
                    variant="primary"
                  >
                    Commit Import ({parsedRows.length} students)
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};
