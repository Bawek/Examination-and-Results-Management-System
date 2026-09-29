import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  HelpCircle,
  Clock,
  Award,
  Grid,
  Send,
  Users,
  Layers,
  Settings,
  ShieldCheck,
  FileText,
  CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentRole } = useAuth();

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'questions', label: 'Question Bank (QBK)', icon: HelpCircle },
    { id: 'exams', label: 'Exams & Scheduling (EXM)', icon: Clock },
    { id: 'grading', label: 'Manual Grading Queue (GRD)', icon: Award },
    { id: 'marks', label: 'Mark Entry Grid (MRK)', icon: Grid },
    { id: 'results', label: 'Results & Publication (PUB)', icon: Send },
    { id: 'people', label: 'Students & Faculty (REC)', icon: Users },
    { id: 'academic', label: 'Academic Structure (ACD)', icon: Layers },
    { id: 'setup', label: 'Institution Policies (8.5)', icon: Settings },
    { id: 'audit', label: 'Audit Logs (ADM)', icon: ShieldCheck },
  ];

  const teacherNav = [
    { id: 'dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
    { id: 'questions', label: 'Question Bank', icon: HelpCircle },
    { id: 'exams', label: 'My Examinations', icon: Clock },
    { id: 'grading', label: 'Manual Grading Queue', icon: Award },
    { id: 'marks', label: 'Mark Entry Grid (SRMS)', icon: Grid },
    { id: 'results', label: 'Term Results & Reports', icon: Send },
  ];

  const studentNav = [
    { id: 'take-exam', label: 'Exam Sittings (DLV)', icon: Clock },
    { id: 'student-results', label: 'Academic Report Card', icon: FileText },
  ];

  const registrarNav = [
    { id: 'dashboard', label: 'Registrar Dashboard', icon: LayoutDashboard },
    { id: 'results', label: 'Review & Publication', icon: Send },
    { id: 'marks', label: 'Submitted Marksheets', icon: Grid },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
  ];

  let items = adminNav;
  if (currentRole === 'teacher') items = teacherNav;
  else if (currentRole === 'student') items = studentNav;
  else if (currentRole === 'registrar' || currentRole === 'invigilator') items = registrarNav;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shrink-0 hidden md:block">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          {currentRole} Navigation
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
