import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Grid, Flex } from '../ui';
import type { BadgeProps } from '../ui';
import {
  Users, FileText, CheckCircle2, ShieldAlert, Clock,
  ArrowUpRight, GraduationCap, TrendingUp, Activity,
  BookOpen, Award, BarChart3
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string;
  glowColor: string;
  trend?: string;
}

function StatCard({ label, value, sub, icon: Icon, color, glowColor, trend }: StatCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <Card
      hoverable
      glow={hovered}
      padding="md"
      style={{
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background gradient blob */}
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${glowColor}18, transparent 70%)`,
        pointerEvents: 'none',
        transition: 'opacity 0.3s ease',
        opacity: hovered ? 1 : 0.5,
      }} />

      <Flex align="flex-start" justify="space-between">
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#4b5563', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {label}
          </p>
          <p style={{
            fontSize: '30px',
            fontWeight: 800,
            color: '#f1f5f9',
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.1,
            marginTop: '8px',
            letterSpacing: '-0.03em',
          }}>
            {value}
          </p>
          <p style={{ fontSize: '11px', color: color, marginTop: '6px', fontWeight: 500 }}>
            {sub}
          </p>
          {trend && (
            <Flex gap={4} style={{ marginTop: '6px' }}>
              <TrendingUp size={11} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>{trend}</span>
            </Flex>
          )}
        </div>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: `${glowColor}18`,
          border: `1px solid ${glowColor}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={18} style={{ color: glowColor }} />
        </div>
      </Flex>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'rgba(17,24,39,0.6)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '14px',
      padding: '20px',
    }}>
      <div className="skeleton" style={{ width: '60%', height: '12px', marginBottom: '16px' }} />
      <div className="skeleton" style={{ width: '40%', height: '32px', marginBottom: '10px' }} />
      <div className="skeleton" style={{ width: '70%', height: '10px' }} />
    </div>
  );
}

function ExamRow({ ex }: { ex: any }) {
  const statusMap: Record<string, BadgeProps['variant']> = {
    published: 'success',
    results_released: 'info',
    closed: 'muted',
    draft: 'warning',
    approved: 'brand',
  };
  const statusVariant = statusMap[ex.status] || 'warning';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      transition: 'background 0.15s ease',
    }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ex.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#4b5563' }}>
          <span>{ex.subject_name}</span>
          <span style={{ color: '#1f2937' }}>·</span>
          <span>{ex.class_name} ({ex.section_name})</span>
          <span style={{ color: '#1f2937' }}>·</span>
          <span style={{ fontFamily: 'monospace' }}>{ex.duration_minutes}m / {ex.total_marks}pts</span>
        </div>
      </div>
      <Badge variant={statusVariant} style={{ marginLeft: '16px', flexShrink: 0 }}>
        {ex.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    </div>
  );
}

function AuditRow({ log }: { log: any }) {
  return (
    <div style={{
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', fontFamily: 'monospace' }}>
          {log.action}
        </span>
        <span style={{ fontSize: '10px', color: '#374151', fontFamily: 'monospace' }}>
          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p style={{ fontSize: '11px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {log.reason || log.entity_type} · by {log.user_name || 'System'}
      </p>
    </div>
  );
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then((data) => setStats(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const counts = stats?.counts || {
    students: 0, teachers: 0, exams: 0, activeExams: 0,
    pendingGrading: 0, publishedResults: 0, auditLogs: 0,
  };

  const statCards: StatCardProps[] = [
    {
      label: 'Enrolled Students',
      value: counts.students,
      sub: 'Active enrolments · Grade 10',
      icon: Users,
      color: '#38bdf8',
      glowColor: '#38bdf8',
      trend: '+3 this term',
    },
    {
      label: 'Faculty Teachers',
      value: counts.teachers,
      sub: 'Assigned to class-subjects',
      icon: GraduationCap,
      color: '#34d399',
      glowColor: '#10b981',
    },
    {
      label: 'Active Exams (OEMS)',
      value: `${counts.activeExams} / ${counts.exams}`,
      sub: 'Server-time window open',
      icon: Clock,
      color: '#34d399',
      glowColor: '#10b981',
    },
    {
      label: 'Pending Grading',
      value: counts.pendingGrading,
      sub: 'Subjective essays awaiting review',
      icon: ShieldAlert,
      color: '#fbbf24',
      glowColor: '#f59e0b',
    },
    {
      label: 'Published Results',
      value: counts.publishedResults ?? 0,
      sub: 'Term results released to students',
      icon: CheckCircle2,
      color: '#a5b4fc',
      glowColor: '#6366f1',
    },
    {
      label: 'Audit Events',
      value: counts.auditLogs ?? 0,
      sub: 'Immutable governance log entries',
      icon: Activity,
      color: '#f87171',
      glowColor: '#ef4444',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #f1f5f9, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            System Administration
          </h1>
          <p style={{ fontSize: '13px', color: '#374151', marginTop: '4px' }}>
            Integrated Examination Management (OEMS) &amp; Student Result Management (SRMS)
          </p>
        </div>
        <Flex gap={8}>
          <Button
            onClick={() => onNavigate('exams')}
            icon={<BookOpen size={13} />}
          >
            Create Examination
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigate('results')}
            icon={<Award size={13} />}
          >
            Review Term Results
          </Button>
        </Flex>
      </div>

      {/* ── KPI Stats Grid ── */}
      <Grid columns={3} gap={14} className="stagger animate-fade-in-up">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((card) => <StatCard key={card.label} {...card} />)
        }
      </Grid>

      {/* ── Main Content Grid ── */}
      <Grid columns="1fr 340px" gap={16}>

        {/* Recent Exams */}
        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Recent Examinations &amp; Sittings</CardTitle>
              <CardDescription>Online exams created, scheduled, and released to candidates</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('exams')}
              icon={<ArrowUpRight size={13} />}
              iconPosition="right"
            >
              View All
            </Button>
          </CardHeader>

          {loading ? (
            <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[1,2,3].map(i => (
                <div key={i}>
                  <div className="skeleton" style={{ width: '60%', height: '13px', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ width: '80%', height: '10px' }} />
                </div>
              ))}
            </div>
          ) : stats?.recentExams?.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <FileText size={32} style={{ color: '#1f2937', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '13px', color: '#374151' }}>No examinations found.</p>
              <p style={{ fontSize: '11px', color: '#1f2937', marginTop: '4px' }}>Create your first exam to get started.</p>
            </div>
          ) : (
            stats?.recentExams?.map((ex: any) => <ExamRow key={ex.id} ex={ex} />)
          )}
        </Card>

        {/* Audit Trail */}
        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Immutable security log (ADM-01)</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('audit')}
              icon={<ArrowUpRight size={13} />}
              iconPosition="right"
            >
              Full Log
            </Button>
          </CardHeader>

          {loading ? (
            <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1,2,3,4].map(i => (
                <div key={i}>
                  <div className="skeleton" style={{ width: '70%', height: '11px', marginBottom: '6px' }} />
                  <div className="skeleton" style={{ width: '90%', height: '9px' }} />
                </div>
              ))}
            </div>
          ) : stats?.recentLogs?.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#374151', textAlign: 'center', padding: '32px 0' }}>
              No audit events recorded.
            </p>
          ) : (
            stats?.recentLogs?.map((log: any) => <AuditRow key={log.id} log={log} />)
          )}
        </Card>
      </Grid>

      {/* ── Quick Action Links ── */}
      <Grid columns={4} gap={10}>
        {[
          { label: 'Question Bank', sub: 'Manage QBK',       tab: 'questions', icon: BarChart3,   color: '#6366f1' },
          { label: 'People Manager', sub: 'Students & Staff',tab: 'people',    icon: Users,       color: '#10b981' },
          { label: 'Academic Setup', sub: 'Classes & Terms', tab: 'academic',  icon: BookOpen,    color: '#f59e0b' },
          { label: 'Audit Viewer',   sub: 'Security Logs',   tab: 'audit',     icon: Activity,    color: '#ef4444' },
        ].map(({ label, sub, tab, icon: Icon, color }) => (
          <Button
            key={tab}
            variant="ghost"
            onClick={() => onNavigate(tab)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(17,24,39,0.6)',
              border: '1px solid rgba(255,255,255,0.05)',
              textAlign: 'left',
              justifyContent: 'flex-start',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'rgba(17,24,39,0.9)';
              el.style.borderColor = `${color}30`;
              el.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'rgba(17,24,39,0.6)';
              el.style.borderColor = 'rgba(255,255,255,0.05)';
              el.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '9px',
              background: `${color}18`, border: `1px solid ${color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>{label}</div>
              <div style={{ fontSize: '10px', color: '#374151', marginTop: '1px' }}>{sub}</div>
            </div>
          </Button>
        ))}
      </Grid>
    </div>
  );
};
