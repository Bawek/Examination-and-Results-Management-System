import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Role } from '../../types/index.ts';
import { Button, Badge } from '../ui';
import crestImage from '../../assets/images/apex_academy_crest_1790666516021.jpg';
import {
  Database, UserCheck, ChevronDown, Check,
  Zap, BookOpen, BarChart3, Settings, ShieldAlert,
  LogOut, User as UserIcon
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
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

const roleIcons: Record<Role, React.ElementType> = {
  admin:       ShieldAlert,
  teacher:     BookOpen,
  student:     BarChart3,
  registrar:   Settings,
  invigilator: Zap,
};

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, currentRole, usersList, switchRole, logout } = useAuth();
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getHealth()
      .then((data) => setDbStatus(data.status === 'operational' ? 'connected' : 'error'))
      .catch(() => setDbStatus('error'));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
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
  const RoleIcon = roleIcons[currentRole];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(11,13,20,0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(99,102,241,0.12)',
        boxShadow: '0 1px 30px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ width: '100%', padding: '0 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

          {/* ── Brand ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid rgba(99,102,241,0.3)',
              boxShadow: '0 0 14px rgba(99,102,241,0.25)',
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
              <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', color: '#f1f5f9' }}>
                Apex{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #818cf8, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>IERMS</span>
              </span>
              <span style={{ fontSize: '10px', color: '#4b5563', fontWeight: 500, marginTop: '2px', letterSpacing: '0.02em' }}>
                Integrated Examination &amp; Results System
              </span>
            </div>
          </div>

          {/* ── Nav Links ── */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {visibleLinks.map((link) => (
              <Button
                key={link.id}
                variant={activeTab === link.id ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(link.id)}
                style={{
                  fontWeight: activeTab === link.id ? 600 : 500,
                  color: activeTab === link.id ? '#a5b4fc' : '#64748b',
                  background: activeTab === link.id ? 'rgba(99,102,241,0.12)' : 'transparent',
                  borderColor: activeTab === link.id ? 'rgba(99,102,241,0.25)' : 'transparent',
                }}
              >
                {link.label}
              </Button>
            ))}
          </nav>

          {/* ── Right Zone ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

            {/* DB Status Pill */}
            <Badge
              variant={dbStatus === 'connected' ? 'success' : 'warning'}
              dot
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                padding: '5px 10px',
                gap: '6px',
              }}
            >
              <Database size={12} style={{ color: 'inherit' }} />
              Neon DB
            </Badge>

            {/* Role Switcher & User Profile */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 12px',
                  borderRadius: '10px',
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  color: '#a5b4fc',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.18)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.25)';
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'rgba(99,102,241,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <RoleIcon size={13} style={{ color: '#c7d2fe' }} />
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ color: '#f1f5f9', fontSize: '12px', fontWeight: 600 }}>
                    {currentUser?.full_name?.split(' ')[0] || roleLabels[currentRole]}
                  </div>
                  <div style={{ color: '#818cf8', fontSize: '10px', textTransform: 'capitalize' }}>
                    {currentRole}
                  </div>
                </div>
                <ChevronDown
                  size={12}
                  style={{
                    transform: showRoleMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    opacity: 0.6,
                    marginLeft: '4px',
                  }}
                />
              </button>

              {showRoleMenu && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: '8px',
                    width: '290px',
                    background: 'rgba(17,24,39,0.98)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: '14px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.12)',
                    overflow: 'hidden',
                    zIndex: 100,
                    animation: 'fadeInUp 0.2s cubic-bezier(0.4,0,0.2,1) both',
                  }}
                >
                  {/* Current user header */}
                  <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(99,102,241,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '13px',
                      }}>
                        {currentUser?.username?.substring(0, 2).toUpperCase() || 'US'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {currentUser?.full_name || currentUser?.username}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
                          @{currentUser?.username || 'user'} · <span style={{ color: '#818cf8', fontWeight: 600 }}>{roleLabels[currentRole]}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '10px 16px 6px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', margin: 0 }}>
                      Switch Active Role View
                    </p>
                  </div>

                  {(['admin', 'teacher', 'student', 'registrar', 'invigilator'] as Role[]).map((r) => {
                    const matchedUser = usersList.find((u) => u.role === r);
                    const isActive = currentRole === r;
                    const Icon = roleIcons[r];
                    return (
                      <button
                        key={r}
                        onClick={() => { switchRole(r, matchedUser?.id); setShowRoleMenu(false); }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 16px',
                          background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s ease',
                          borderLeft: isActive ? '3px solid #818cf8' : '3px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '7px',
                            background: isActive ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Icon size={13} style={{ color: isActive ? '#a5b4fc' : '#64748b' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: isActive ? '#a5b4fc' : '#94a3b8' }}>
                              {roleLabels[r]}
                            </div>
                            {matchedUser && (
                              <div style={{ fontSize: '10px', color: '#4b5563', fontFamily: 'monospace', marginTop: '1px' }}>
                                {matchedUser.username}
                              </div>
                            )}
                          </div>
                        </div>
                        {isActive && <Check size={13} style={{ color: '#818cf8', flexShrink: 0 }} />}
                      </button>
                    );
                  })}

                  {/* Log Out button */}
                  <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={() => { setShowRoleMenu(false); logout(); }}
                      icon={<LogOut size={13} />}
                    >
                      Log Out System
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
