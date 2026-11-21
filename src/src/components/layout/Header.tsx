import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Role } from '../../types/index.ts';
import { Button, Badge } from '../ui';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import crestImage from '../../assets/images/apex_academy_crest_1790666516021.jpg';
import {
  ChevronDown, ChevronLeft, LogOut, Menu, KeyRound
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

const roleBadgeVariants: Record<Role, 'brand' | 'success' | 'info' | 'warning' | 'muted'> = {
  admin:       'brand',
  teacher:     'success',
  student:     'info',
  registrar:   'warning',
  invigilator: 'muted',
};

const roleLabels: Record<Role, string> = {
  admin:       'Administrator',
  teacher:     'Teacher / Examiner',
  student:     'Student / Candidate',
  registrar:   'Academic Registrar',
  invigilator: 'Exam Invigilator',
};

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, sidebarCollapsed = false, onToggleSidebar }) => {
  const { currentUser, currentRole, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks: Array<{ id: string; label: string; roles: Role[] }> = [
    { id: 'dashboard', label: 'Dashboard',        roles: ['admin', 'teacher', 'registrar', 'invigilator'] },
    { id: 'exams',     label: 'Exams (OEMS)',      roles: ['admin', 'teacher'] },
    { id: 'marks',     label: 'Mark Entry',        roles: ['admin', 'teacher'] },
    { id: 'results',   label: 'Results',           roles: ['admin', 'teacher', 'registrar'] },
    { id: 'setup',     label: 'Setup & Policy',    roles: ['admin'] },
    { id: 'take-exam', label: 'Exam Sittings',     roles: ['student'] },
    { id: 'student-results', label: 'Report Card', roles: ['student'] },
  ];

  const visibleLinks = navLinks.filter(l => l.roles.includes(currentRole));

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ width: '100%', padding: '0 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

          {/* ── Sidebar Toggle ── */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#ede9fe',
                border: '1px solid #c4b5fd',
                color: '#4f46e5',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginRight: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ddd6fe';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ede9fe';
              }}
            >
              {sidebarCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}

          {/* ── Brand ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              flexShrink: 0,
            }}>
              <img
                src={crestImage}
                alt="Apex Academy Crest"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                Apex{' '}
                <span style={{ color: '#4f46e5' }}>IERMS</span>
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, marginTop: '2px', letterSpacing: '0.02em' }}>
                Integrated Examination &amp; Results System
              </span>
            </div>
          </div>

          {/* ── Nav Links ── */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {visibleLinks.map((link) => {
              const isActive = activeTab === link.id;
              const isNavigating = navigatingTo === link.id;

              return (
                <Button
                  key={link.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (link.id !== activeTab) {
                      setNavigatingTo(link.id);
                      setActiveTab(link.id);
                      setTimeout(() => setNavigatingTo(null), 400);
                    }
                  }}
                  disabled={isNavigating}
                  style={{
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#4338ca' : '#6b7280',
                    background: isActive ? '#ede9fe' : 'transparent',
                    borderColor: isActive ? '#c4b5fd' : 'transparent',
                    border: isActive ? '1px solid #c4b5fd' : '1px solid transparent',
                    opacity: isNavigating ? 0.6 : 1,
                    cursor: isNavigating ? 'wait' : 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = '#f8fafc';
                      (e.currentTarget as HTMLElement).style.color = '#0f172a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = '#6b7280';
                    }
                  }}
                >
                  {isNavigating && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.1), transparent)',
                      animation: 'shimmer 0.8s linear infinite',
                    }} />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>{link.label}</span>
                </Button>
              );
            })}
          </nav>

          {/* ── Right Zone ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

            {/* User Profile */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: '#ede9fe',
                  border: '1px solid #c4b5fd',
                  color: '#4c1d95',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#ddd6fe';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#ede9fe';
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '12px',
                }}>
                  {currentUser?.username?.substring(0, 2).toUpperCase() || 'US'}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.3 }}>
                  <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: 600 }}>
                    {currentUser?.full_name?.split(' ')[0] || currentUser?.username}
                  </div>
                  <div style={{ color: '#4f46e5', fontSize: '11px', textTransform: 'capitalize' }}>
                    {roleLabels[currentRole]}
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  style={{
                    transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    opacity: 0.6,
                    color: '#4c1d95',
                  }}
                />
              </button>

              {showUserMenu && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: '8px',
                    width: '260px',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    overflow: 'hidden',
                    zIndex: 100,
                    animation: 'fadeInUp 0.2s cubic-bezier(0.4,0,0.2,1) both',
                  }}
                >
                  {/* Current user header */}
                  <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '14px',
                      }}>
                        {currentUser?.username?.substring(0, 2).toUpperCase() || 'US'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {currentUser?.full_name || currentUser?.username}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          @{currentUser?.username || 'user'}
                        </div>
                        <Badge
                          variant={roleBadgeVariants[currentRole]}
                          style={{ marginTop: '6px', fontSize: '10px', padding: '2px 8px' }}
                        >
                          {roleLabels[currentRole]}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Log Out button */}
                  <div style={{ padding: '10px' }}>
                    <Button
                      variant="ghost"
                      fullWidth
                      onClick={() => { setShowUserMenu(false); logout(); }}
                      icon={<LogOut size={14} />}
                      style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
                    >
                      Log Out
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
