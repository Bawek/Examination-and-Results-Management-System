import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Role } from '../../types/index.ts';
import crestImage from '../../assets/images/apex_academy_crest_1790666516021.jpg';
import { Database, ShieldCheck, UserCheck, ChevronDown, Check } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { currentRole, currentUser, usersList, switchRole } = useAuth();
  const [dbStatus, setDbStatus] = useState<string>('connecting');
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    api.getHealth()
      .then((data) => {
        if (data.status === 'operational') setDbStatus('connected');
        else setDbStatus('error');
      })
      .catch(() => setDbStatus('error'));
  }, []);

  const roleLabels: Record<Role, string> = {
    admin: 'Administrator',
    teacher: 'Teacher / Examiner',
    student: 'Student / Candidate',
    registrar: 'Academic Registrar',
    invigilator: 'Exam Invigilator'
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element Brand wordmark with crest */}
          <div className="flex items-center gap-3">
            <img
              src={crestImage}
              alt="Apex Academy Crest"
              className="w-9 h-9 object-contain rounded-md border border-slate-200"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Zero-broken-image policy: fallback SVG
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 leading-tight">
                Apex IERMS
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Integrated Examination & Results System
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (single line, clean typography) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`transition-colors pb-0.5 ${
                activeTab === 'dashboard'
                  ? 'text-slate-950 font-semibold border-b-2 border-slate-950'
                  : 'hover:text-slate-950'
              }`}
            >
              Dashboard
            </button>

            {(currentRole === 'admin' || currentRole === 'teacher') && (
              <>
                <button
                  onClick={() => setActiveTab('exams')}
                  className={`transition-colors pb-0.5 ${
                    activeTab === 'exams'
                      ? 'text-slate-950 font-semibold border-b-2 border-slate-950'
                      : 'hover:text-slate-950'
                  }`}
                >
                  Exams (OEMS)
                </button>
                <button
                  onClick={() => setActiveTab('marks')}
                  className={`transition-colors pb-0.5 ${
                    activeTab === 'marks'
                      ? 'text-slate-950 font-semibold border-b-2 border-slate-950'
                      : 'hover:text-slate-950'
                  }`}
                >
                  Mark Entry (SRMS)
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className={`transition-colors pb-0.5 ${
                    activeTab === 'results'
                      ? 'text-slate-950 font-semibold border-b-2 border-slate-950'
                      : 'hover:text-slate-950'
                  }`}
                >
                  Results & Publication
                </button>
              </>
            )}

            {currentRole === 'student' && (
              <>
                <button
                  onClick={() => setActiveTab('take-exam')}
                  className={`transition-colors pb-0.5 ${
                    activeTab === 'take-exam'
                      ? 'text-slate-950 font-semibold border-b-2 border-slate-950'
                      : 'hover:text-slate-950'
                  }`}
                >
                  Exam Sittings
                </button>
                <button
                  onClick={() => setActiveTab('student-results')}
                  className={`transition-colors pb-0.5 ${
                    activeTab === 'student-results'
                      ? 'text-slate-950 font-semibold border-b-2 border-slate-950'
                      : 'hover:text-slate-950'
                  }`}
                >
                  Report Card
                </button>
              </>
            )}

            {currentRole === 'admin' && (
              <button
                onClick={() => setActiveTab('setup')}
                className={`transition-colors pb-0.5 ${
                  activeTab === 'setup'
                    ? 'text-slate-950 font-semibold border-b-2 border-slate-950'
                    : 'hover:text-slate-950'
                }`}
              >
                Setup & Policy
              </button>
            )}
          </nav>

          {/* Zone 3: 1-2 Primary actions: DB Status & Role Switcher */}
          <div className="flex items-center gap-3">
            {/* Live Database status (tabular-nums) */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums px-2.5 py-1 rounded bg-slate-100/80 border border-slate-200">
              <Database className={`w-3.5 h-3.5 ${dbStatus === 'connected' ? 'text-emerald-600' : 'text-amber-500'}`} />
              <span>Neon Postgres</span>
              <span className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            </div>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors"
                aria-expanded={showRoleMenu}
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-semibold">{roleLabels[currentRole]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-900">Switch System Role</p>
                    <p className="text-[11px] text-slate-500">Test different views of the unified IERMS blueprint</p>
                  </div>
                  {(['admin', 'teacher', 'student', 'registrar', 'invigilator'] as Role[]).map((r) => {
                    const matchedUser = usersList.find((u) => u.role === r);
                    const isActive = currentRole === r;
                    return (
                      <button
                        key={r}
                        onClick={() => {
                          switchRole(r, matchedUser?.id);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          isActive ? 'bg-indigo-50/60 font-semibold text-indigo-950' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{roleLabels[r]}</span>
                            {isActive && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </div>
                          {matchedUser && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {matchedUser.full_name} ({matchedUser.username})
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
