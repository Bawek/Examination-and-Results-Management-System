import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Button, Input, Badge } from '../ui';
import crestImage from '../../assets/images/apex_academy_crest_1790666516021.jpg';
import {
  Eye, EyeOff, Lock, User, ArrowRight, Database, AlertCircle
} from 'lucide-react';

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
        background: 'linear-gradient(135deg,#eef2ff,#f1f5f9)',
        overflow: 'hidden',
      }}
    >
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
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            padding: '40px 36px',
          }}
        >
          {/* Header Brand */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '18px',
                margin: '0 auto 16px',
                overflow: 'hidden',
                border: '2px solid #c7d2fe',
                boxShadow: '0 4px 12px rgba(99,102,241,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f3ff',
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
                color: '#0f172a',
                margin: '0 0 6px',
              }}
            >
              Apex International Academy
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 400 }}>
              Integrated Examination &amp; Results Management System
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                color: '#991b1b',
                fontSize: '13px',
                lineHeight: '1.5',
                marginBottom: '24px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, color: '#b91c1c' }} />
              <span style={{ flex: 1 }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
            />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label
                  htmlFor="login-password"
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#374151',
                    letterSpacing: '0.01em',
                    lineHeight: '1.5',
                  }}
                >
                  Password
                </label>
                <span style={{ fontSize: '12px', color: '#64748b', letterSpacing: '0.01em' }}>
                  Default: <code style={{ color: '#4338ca', background: '#ede9fe', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>password123</code>
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
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
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
              style={{ marginTop: '8px' }}
            >
              {isLoading ? 'Authenticating...' : 'Sign In to System'}
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: '1.5', letterSpacing: '0.01em' }}>
            Protected by role-based authorization &amp; bcrypt security · Apex IERMS v2.0
          </p>
        </div>
      </div>
    </div>
  );
};
