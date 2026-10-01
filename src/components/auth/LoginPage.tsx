import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Button, Input, Badge } from '../ui';
import crestImage from '../../assets/images/apex_academy_crest_1790666516021.jpg';
import {
  ShieldAlert, BookOpen, BarChart3, Settings,
  Eye, EyeOff, Lock, User, ArrowRight, CheckCircle2,
  Database, AlertCircle
} from 'lucide-react';

interface DemoAccount {
  role: string;
  roleLabel: string;
  username: string;
  name: string;
  icon: React.ElementType;
  badgeColor: string;
  badgeBorder: string;
  badgeBg: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'admin',
    roleLabel: 'Administrator',
    username: 'admin',
    name: 'Dr. Arthur Sterling',
    icon: ShieldAlert,
    badgeColor: '#818cf8',
    badgeBorder: 'rgba(99,102,241,0.3)',
    badgeBg: 'rgba(99,102,241,0.1)',
  },
  {
    role: 'teacher',
    roleLabel: 'Faculty / Examiner',
    username: 'teacher.miller',
    name: 'Prof. Eleanor Miller',
    icon: BookOpen,
    badgeColor: '#34d399',
    badgeBorder: 'rgba(16,185,129,0.3)',
    badgeBg: 'rgba(16,185,129,0.1)',
  },
  {
    role: 'student',
    roleLabel: 'Candidate / Student',
    username: 'stu.kaleb',
    name: 'Kaleb Tadesse',
    icon: BarChart3,
    badgeColor: '#38bdf8',
    badgeBorder: 'rgba(56,189,248,0.3)',
    badgeBg: 'rgba(56,189,248,0.1)',
  },
  {
    role: 'registrar',
    roleLabel: 'Registrar',
    username: 'registrar.hayes',
    name: 'Clara Hayes',
    icon: Settings,
    badgeColor: '#fbbf24',
    badgeBorder: 'rgba(251,191,36,0.3)',
    badgeBg: 'rgba(251,191,36,0.1)',
  },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      await login(username.trim(), password.trim());
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectDemoAccount = (acc: DemoAccount) => {
    setUsername(acc.username);
    setPassword('password123');
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        background: 'radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.18), transparent 70%), radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.12), transparent 60%), #07090e',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient grid glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 85%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          position: 'relative',
          zIndex: 1,
          animation: 'fade-scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Main Card */}
        <div
          style={{
            background: 'rgba(15, 18, 28, 0.85)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(99, 102, 241, 0.22)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 40px rgba(99, 102, 241, 0.1)',
            padding: '36px 32px',
          }}
        >
          {/* Header Brand */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '18px',
                margin: '0 auto 16px',
                overflow: 'hidden',
                border: '2px solid rgba(99, 102, 241, 0.4)',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0c0f18',
              }}
            >
              <img
                src={crestImage}
                alt="Apex Academy Crest"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <Badge
              variant="brand"
              dot
              style={{ marginBottom: '10px', fontSize: '11px', padding: '3px 10px' }}
            >
              <Database size={11} style={{ color: 'inherit' }} />
              Neon PostgreSQL · IERMS 2.0
            </Badge>

            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #ffffff 40%, #c7d2fe 80%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: '0 0 6px',
              }}
            >
              Apex International Academy
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 400 }}>
              Integrated Examination & Results Management System
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '12px',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, color: '#f87171' }} />
              <span style={{ flex: 1 }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Input
              id="login-username"
              label="Username or Email"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or stu.kaleb"
              autoComplete="username"
              required
              fullWidth
              icon={<User size={16} />}
              style={{ height: '44px', fontSize: '14px' }}
            />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label
                  htmlFor="login-password"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#94a3b8',
                    letterSpacing: '0.02em',
                  }}
                >
                  Password
                </label>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Default: <code style={{ color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '1px 5px', borderRadius: '4px' }}>password123</code>
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  fullWidth
                  icon={<Lock size={16} />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  style={{ height: '44px', fontSize: '14px' }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              id="login-submit-btn"
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              iconPosition="right"
              icon={<ArrowRight size={16} />}
              style={{ marginTop: '6px', height: '46px', fontSize: '14px' }}
            >
              {isLoading ? 'Authenticating...' : 'Sign In to System'}
            </Button>
          </form>

          {/* Quick Demo Switcher Chips */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#64748b',
                }}
              >
                1-Click Demo Accounts
              </span>
              <span style={{ fontSize: '11px', color: '#475569' }}>Select to fill</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
              }}
            >
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const isSelected = username === acc.username;

                return (
                  <Button
                    key={acc.username}
                    type="button"
                    variant={isSelected ? 'primary' : 'ghost'}
                    onClick={() => selectDemoAccount(acc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      background: isSelected ? acc.badgeBg : 'rgba(255,255,255,0.03)',
                      borderColor: isSelected ? acc.badgeBorder : 'rgba(255,255,255,0.06)',
                      color: isSelected ? acc.badgeColor : '#94a3b8',
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <Icon size={14} style={{ color: acc.badgeColor, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: isSelected ? '#ffffff' : '#cbd5e1',
                        }}
                      >
                        {acc.roleLabel}
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: isSelected ? acc.badgeColor : '#64748b',
                        }}
                      >
                        {acc.username}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={12} style={{ color: acc.badgeColor, flexShrink: 0 }} />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>
            Protected by role-based authorization & bcrypt security · Apex IERMS v2.0
          </p>
        </div>
      </div>
    </div>
  );
};
