import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Badge } from '../ui';
import {
  LayoutDashboard, HelpCircle, Clock, Award, Grid, Send,
  Users, Layers, Settings, ShieldCheck, FileText, ChevronRight,
  ChevronLeft, ChevronRight as ChevronRightIcon, Menu
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed = false, onToggleCollapse }) => {
  const { currentRole } = useAuth();
  const [hovered, setHovered] = useState<string | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [localCollapsed, setLocalCollapsed] = useState(false);

  const collapsed = isCollapsed !== undefined ? isCollapsed : localCollapsed;
  const handleToggle = onToggleCollapse || (() => setLocalCollapsed(!localCollapsed));

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
    { id: 'take-exam',       label: 'Exam Sittings',        icon: Clock,     badge: 'DLV' },
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
      width: collapsed ? '64px' : '220px',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: collapsed ? '16px 8px' : '16px 10px',
      gap: '2px',
      overflowY: 'auto',
      transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), padding 0.3s ease',
    }}>
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-end',
          padding: '8px',
          marginBottom: '8px',
          borderRadius: '8px',
          background: '#ede9fe',
          border: '1px solid #c4b5fd',
          color: '#4f46e5',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#ddd6fe';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#ede9fe';
        }}
      >
        {collapsed ? (
          <ChevronRightIcon size={16} />
        ) : (
          <>
            <span style={{
              flex: 1,
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#6366f1',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {roleLabel} Navigation
            </span>
            <ChevronLeft size={16} />
          </>
        )}
      </button>

      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isHovered = hovered === item.id;

        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.id !== activeTab) {
                setNavigatingTo(item.id);
                setActiveTab(item.id);
                setTimeout(() => setNavigatingTo(null), 400);
              }
            }}
            onMouseEnter={() => setHovered(item.id)}
            onMouseLeave={() => setHovered(null)}
            disabled={navigatingTo === item.id}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? '0' : '10px',
              padding: collapsed ? '10px' : '9px 10px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#4338ca' : isHovered ? '#374151' : '#6b7280',
              background: isActive
                ? '#ede9fe'
                : isHovered
                ? '#f8fafc'
                : 'transparent',
              border: isActive
                ? '1px solid transparent'
                : '1px solid transparent',
              borderLeft: isActive ? '3px solid #4f46e5' : '3px solid transparent',
              cursor: navigatingTo === item.id ? 'wait' : 'pointer',
              textAlign: 'left',
              transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
              position: 'relative',
              opacity: navigatingTo === item.id ? 0.6 : 1,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            title={collapsed ? item.label : undefined}
          >
            <Icon
              size={15}
              style={{
                color: isActive ? '#4f46e5' : isHovered ? '#374151' : '#9ca3af',
                flexShrink: 0,
                transition: 'color 0.18s ease',
              }}
            />
            {!collapsed && (
              <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
            )}
            {!collapsed && item.badge && (
              <Badge
                variant="muted"
                size="sm"
                style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  background: isActive ? '#ede9fe' : '#f1f5f9',
                  color: isActive ? '#4338ca' : '#64748b',
                  border: isActive ? '1px solid #c4b5fd' : '1px solid #e2e8f0',
                  fontFamily: 'monospace',
                }}
              >
                {item.badge}
              </Badge>
            )}
            {!collapsed && isActive && (
              <ChevronRight
                size={11}
                style={{
                  color: '#4f46e5',
                  flexShrink: 0,
                  opacity: 0.7,
                  transition: 'transform 0.2s ease',
                }}
              />
            )}
            {navigatingTo === item.id && (
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '10px',
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.08), transparent)',
                  animation: 'shimmer 0.8s linear infinite',
                }} />
              </div>
            )}
          </button>
        );
      })}

      {/* Bottom branding */}
      {!collapsed && (
        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <div style={{
            padding: '10px',
            borderRadius: '10px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: '10px',
            color: '#64748b',
            lineHeight: 1.6,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            <div style={{ color: '#475569', fontWeight: 600 }}>IERMS v2.0</div>
            <div style={{ color: '#94a3b8' }}>Apex Academy · {new Date().getFullYear()}</div>
          </div>
        </div>
      )}
    </aside>
  );
};
