import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Badge } from '../ui';
import {
  LayoutDashboard, HelpCircle, Clock, Award, Grid, Send,
  Users, Layers, Settings, ShieldCheck, FileText, ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentRole } = useAuth();
  const [hovered, setHovered] = useState<string | null>(null);

  const adminNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard',                icon: LayoutDashboard },
    { id: 'questions', label: 'Question Bank',            icon: HelpCircle,  badge: 'QBK' },
    { id: 'exams',     label: 'Exams & Scheduling',       icon: Clock,       badge: 'OEMS' },
    { id: 'grading',   label: 'Manual Grading Queue',     icon: Award,       badge: 'GRD' },
    { id: 'marks',     label: 'Mark Entry Grid',          icon: Grid,        badge: 'MRK' },
    { id: 'results',   label: 'Results & Publication',    icon: Send,        badge: 'PUB' },
    { id: 'people',    label: 'Students & Faculty',       icon: Users,       badge: 'REC' },
    { id: 'academic',  label: 'Academic Structure',       icon: Layers,      badge: 'ACD' },
    { id: 'setup',     label: 'Institution Policies',     icon: Settings },
    { id: 'audit',     label: 'Audit Logs',               icon: ShieldCheck, badge: 'ADM' },
  ];

  const teacherNav: NavItem[] = [
    { id: 'dashboard', label: 'Faculty Dashboard',       icon: LayoutDashboard },
    { id: 'questions', label: 'Question Bank',           icon: HelpCircle },
    { id: 'exams',     label: 'My Examinations',         icon: Clock },
    { id: 'grading',   label: 'Manual Grading Queue',    icon: Award },
    { id: 'marks',     label: 'Mark Entry Grid',         icon: Grid,   badge: 'SRMS' },
    { id: 'results',   label: 'Term Results & Reports',  icon: Send },
  ];

  const studentNav: NavItem[] = [
    { id: 'take-exam',       label: 'Exam Sittings',      icon: Clock,     badge: 'DLV' },
    { id: 'student-results', label: 'Academic Report Card', icon: FileText },
  ];

  const registrarNav: NavItem[] = [
    { id: 'dashboard', label: 'Registrar Dashboard',  icon: LayoutDashboard },
    { id: 'results',   label: 'Review & Publication', icon: Send },
    { id: 'marks',     label: 'Submitted Marksheets', icon: Grid },
    { id: 'audit',     label: 'Audit Trail',          icon: ShieldCheck },
  ];

  let items: NavItem[] = adminNav;
  if (currentRole === 'teacher') items = teacherNav;
  else if (currentRole === 'student') items = studentNav;
  else if (currentRole === 'registrar' || currentRole === 'invigilator') items = registrarNav;

  const roleLabel = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);

  return (
    <aside style={{
      width: '220px',
      background: 'rgba(11,13,20,0.7)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(99,102,241,0.1)',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 10px',
      gap: '2px',
      overflowY: 'auto',
    }}>
      {/* Role Label */}
      <div style={{
        padding: '4px 10px 10px',
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#374151',
        fontFamily: 'JetBrains Mono, monospace',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        marginBottom: '6px',
      }}>
        {roleLabel} Navigation
      </div>

      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isHovered = hovered === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            onMouseEnter={() => setHovered(item.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 10px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#a5b4fc' : isHovered ? '#94a3b8' : '#4b5563',
              background: isActive
                ? 'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(99,102,241,0.06))'
                : isHovered
                ? 'rgba(255,255,255,0.04)'
                : 'transparent',
              border: isActive
                ? '1px solid rgba(99,102,241,0.2)'
                : '1px solid transparent',
              borderLeft: isActive ? '2px solid #818cf8' : '2px solid transparent',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
              position: 'relative',
            }}
          >
            <Icon
              size={15}
              style={{
                color: isActive ? '#818cf8' : isHovered ? '#64748b' : '#374151',
                flexShrink: 0,
                transition: 'color 0.18s ease',
              }}
            />
            <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {item.label}
            </span>
            {item.badge && (
              <Badge
                variant="muted"
                size="sm"
                style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  background: isActive ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#a5b4fc' : '#374151',
                  fontFamily: 'monospace',
                }}
              >
                {item.badge}
              </Badge>
            )}
            {isActive && (
              <ChevronRight
                size={11}
                style={{ color: '#818cf8', flexShrink: 0, opacity: 0.7 }}
              />
            )}
          </button>
        );
      })}

      {/* Bottom spacer / branding */}
      <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
        <div style={{
          padding: '10px',
          borderRadius: '10px',
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.1)',
          fontSize: '10px',
          color: '#374151',
          lineHeight: 1.6,
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          <div style={{ color: '#4b5563', fontWeight: 600 }}>IERMS v2.0</div>
          <div style={{ color: '#374151' }}>Apex Academy · {new Date().getFullYear()}</div>
        </div>
      </div>
    </aside>
  );
};
