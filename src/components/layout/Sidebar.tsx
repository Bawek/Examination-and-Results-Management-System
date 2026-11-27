import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Badge } from '../ui';
import {
  LayoutDashboard, HelpCircle, Clock, Award, Grid, Send,
  Users, Layers, Settings, ShieldCheck, FileText, ChevronRight,
  ChevronLeft, Menu, X
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
  badgeTooltip?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed = false, onToggleCollapse }) => {
  const { currentRole } = useAuth();
  const [hovered, setHovered] = useState<string | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const collapsed = isCollapsed !== undefined ? isCollapsed : localCollapsed;
  const handleToggle = onToggleCollapse || (() => setLocalCollapsed(!localCollapsed));

  const adminNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard',                icon: LayoutDashboard },
    { id: 'questions', label: 'Question Bank',            icon: HelpCircle,  badge: 'QBK', badgeTooltip: 'Question Bank' },
    { id: 'exams',     label: 'Exams & Scheduling',       icon: Clock,       badge: 'OEMS', badgeTooltip: 'Online Exam Management' },
    { id: 'grading',   label: 'Manual Grading Queue',     icon: Award,       badge: 'GRD', badgeTooltip: 'Grading' },
    { id: 'marks',     label: 'Mark Entry Grid',          icon: Grid,        badge: 'MRK', badgeTooltip: 'Marks' },
    { id: 'results',   label: 'Results & Publication',    icon: Send,        badge: 'PUB', badgeTooltip: 'Publication' },
    { id: 'people',    label: 'Students & Faculty',       icon: Users,       badge: 'REC', badgeTooltip: 'Records' },
    { id: 'academic',  label: 'Academic Structure',       icon: Layers,      badge: 'ACD', badgeTooltip: 'Academic' },
    { id: 'setup',     label: 'Institution Policies',     icon: Settings },
    { id: 'audit',     label: 'Audit Logs',               icon: ShieldCheck, badge: 'ADM', badgeTooltip: 'Admin' },
  ];

  const teacherNav: NavItem[] = [
    { id: 'dashboard', label: 'Faculty Dashboard',       icon: LayoutDashboard },
    { id: 'questions', label: 'Question Bank',           icon: HelpCircle },
    { id: 'exams',     label: 'My Examinations',         icon: Clock },
    { id: 'grading',   label: 'Manual Grading Queue',    icon: Award },
    { id: 'marks',     label: 'Mark Entry Grid',         icon: Grid,   badge: 'SRMS', badgeTooltip: 'Student Results Management' },
    { id: 'results',   label: 'Term Results & Reports',  icon: Send },
  ];

  const studentNav: NavItem[] = [
    { id: 'take-exam',       label: 'Exam Sittings',        icon: Clock,     badge: 'DLV', badgeTooltip: 'Exam Delivery' },
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

  const handleItemClick = (itemId: string) => {
    if (itemId !== activeTab) {
      setNavigatingTo(itemId);
      setActiveTab(itemId);
      setTimeout(() => setNavigatingTo(null), 400);
    }
    // Close mobile menu after selection
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Mobile menu button
  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Mobile Overlay */}
        {mobileOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside className={`
          lg:hidden fixed top-0 left-0 bottom-0 z-40 w-64 bg-white border-r border-slate-200
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col p-4 gap-0.5 overflow-y-auto
        `}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
            <div className="text-xs font-bold tracking-wider uppercase text-indigo-600 font-mono">
              {roleLabel} Menu
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded-md hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          </div>

          {/* Nav Items */}
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isHovered = hovered === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700 border-l-3 border-indigo-500' 
                    : isHovered 
                    ? 'bg-slate-50 text-slate-700' 
                    : 'text-slate-600'
                  }
                `}
                title={item.badgeTooltip}
              >
                <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.badge && (
                  <span className={`
                    text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold
                    ${isActive 
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Bottom branding */}
          <div className="mt-auto pt-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600 leading-relaxed font-mono">
              <div className="text-slate-700 font-semibold">IERMS v2.0</div>
              <div className="text-slate-500">Apex Academy · {new Date().getFullYear()}</div>
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside className={`
      hidden lg:flex flex-col gap-0.5 bg-white border-r border-slate-200 overflow-y-auto
      transition-all duration-300 ease-in-out
      ${collapsed ? 'w-16 px-2 py-4' : 'w-56 px-2.5 py-4'}
    `}>
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className={`
          w-full flex items-center gap-2 px-2 py-2 mb-2 rounded-lg
          bg-indigo-50 border border-indigo-100 text-indigo-600
          hover:bg-indigo-100 transition-all duration-200
          ${collapsed ? 'justify-center' : 'justify-between'}
        `}
      >
        {collapsed ? (
          <ChevronRight size={16} />
        ) : (
          <>
            <span className="text-[9px] font-bold tracking-widest uppercase font-mono">
              {roleLabel} Nav
            </span>
            <ChevronLeft size={16} />
          </>
        )}
      </button>

      {/* Nav Items */}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isHovered = hovered === item.id;

        return (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            onMouseEnter={() => setHovered(item.id)}
            onMouseLeave={() => setHovered(null)}
            disabled={navigatingTo === item.id}
            className={`
              w-full flex items-center gap-2.5 py-2.5 rounded-lg text-xs font-medium
              transition-all duration-200 relative
              ${collapsed ? 'px-2.5 justify-center' : 'px-2.5'}
              ${isActive 
                ? 'bg-indigo-50 text-indigo-700 border-l-3 border-indigo-500 font-semibold' 
                : isHovered 
                ? 'bg-slate-50 text-slate-700' 
                : 'text-slate-600 hover:bg-slate-50'
              }
              ${navigatingTo === item.id ? 'opacity-60 cursor-wait' : 'cursor-pointer'}
            `}
            title={collapsed ? item.label : item.badgeTooltip}
          >
            <Icon size={16} className={`
              flex-shrink-0
              ${isActive ? 'text-indigo-600' : isHovered ? 'text-slate-600' : 'text-slate-400'}
            `} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.badge && (
                  <span className={`
                    text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold
                    ${isActive 
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight size={12} className="text-indigo-600 opacity-70" />
                )}
              </>
            )}
          </button>
        );
      })}

      {/* Bottom branding */}
      {!collapsed && (
        <div className="mt-auto pt-4">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600 leading-relaxed font-mono">
            <div className="text-slate-700 font-semibold">IERMS v2.0</div>
            <div className="text-slate-500">Apex Academy · {new Date().getFullYear()}</div>
          </div>
        </div>
      )}
    </aside>
  );
};
