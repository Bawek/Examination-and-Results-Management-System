import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/layout/Header.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { InstitutionSetup } from './components/admin/InstitutionSetup.tsx';
import { AcademicMaster } from './components/admin/AcademicMaster.tsx';
import { PeopleManager } from './components/admin/PeopleManager.tsx';
import { AuditLogsViewer } from './components/admin/AuditLogsViewer.tsx';
import { QuestionBank } from './components/teacher/QuestionBank.tsx';
import { ExamBuilder } from './components/teacher/ExamBuilder.tsx';
import { GradingQueue } from './components/teacher/GradingQueue.tsx';
import { MarkEntryGrid } from './components/teacher/MarkEntryGrid.tsx';
import { ResultsPublication } from './components/results/ResultsPublication.tsx';
import { StudentDashboard } from './components/student/StudentDashboard.tsx';
import { LoginPage } from './components/auth/LoginPage.tsx';

/* ─────────────────────────────────────────────
   Premium Loading Screen
───────────────────────────────────────────── */
function LoadingScreen() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDots(d => (d + 1) % 4), 350);
    return () => clearInterval(id);
  }, []);
  const dotStr = '.'.repeat(dots).padEnd(3, '\u00A0');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #eef2ff, #f1f5f9)',
      gap: '24px',
    }}>
      {/* Animated logo circle */}
      <div style={{ position: 'relative', width: '64px', height: '64px' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2px solid #c7d2fe',
          borderTopColor: '#4f46e5',
          animation: 'spin-smooth 0.85s linear infinite',
        }} />
        <div style={{
          position: 'absolute',
          inset: '10px',
          borderRadius: '50%',
          border: '2px solid #ddd6fe',
          borderBottomColor: '#7c3aed',
          animation: 'spin-smooth 1.2s linear infinite reverse',
        }} />
        <div style={{
          position: 'absolute',
          inset: '22px',
          borderRadius: '50%',
          background: 'rgba(99,102,241,0.15)',
        }} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#4f46e5',
          letterSpacing: '-0.02em',
        }}>
          Apex IERMS
        </h2>
        <p style={{
          fontSize: '12px',
          color: '#64748b',
          fontFamily: "'JetBrains Mono', monospace",
          marginTop: '6px',
          letterSpacing: '0.04em',
        }}>
          Connecting to Neon PostgreSQL{dotStr}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '200px',
        height: '2px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '100px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          borderRadius: '100px',
          background: 'linear-gradient(90deg, #6366f1, #a855f7)',
          animation: 'shimmer 1.8s linear infinite',
          backgroundSize: '400px 100%',
        }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Navigation Progress Line
───────────────────────────────────────────── */
interface NavigationProgressProps { isNavigating: boolean; }
function NavigationProgress({ isNavigating }: NavigationProgressProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      <div style={{
        height: '100%',
        width: isNavigating ? '100%' : '0%',
        background: 'linear-gradient(90deg, #6366f1, #a855f7, #6366f1)',
        backgroundSize: '200% 100%',
        transition: isNavigating ? 'width 0.4s ease-out' : 'width 0.2s ease-in',
        animation: isNavigating ? 'shimmer 1s linear infinite' : 'none',
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page Transition Wrapper with Line Animation
───────────────────────────────────────────── */
interface PageWrapperProps { children: React.ReactNode; tabKey: string; }
function PageWrapper({ children, tabKey }: PageWrapperProps) {
  const [visible, setVisible] = useState(false);
  const [lineVisible, setLineVisible] = useState(false);
  
  useEffect(() => {
    setVisible(false);
    setLineVisible(false);
    
    const id1 = requestAnimationFrame(() => {
      setLineVisible(true);
    });
    const id2 = requestAnimationFrame(() => {
      setTimeout(() => setVisible(true), 150);
    });
    
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, [tabKey]);

  return (
    <div
      key={tabKey}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.98)',
        transition: 'opacity 0.4s cubic-bezier(0.4,0,0.2,1), transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {/* Animated line at top */}
      <div style={{
        position: 'relative',
        marginBottom: '20px',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: lineVisible ? '100%' : '0%',
          height: '2px',
          background: 'linear-gradient(90deg, #6366f1, #a855f7)',
          borderRadius: '100px',
          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '0 0 12px rgba(99,102,241,0.4)',
        }} />
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Content
───────────────────────────────────────────── */
function MainContent() {
  const { currentUser, currentRole, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isNavigating, setIsNavigating] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent duplicate navigation with animation
  const handleNavigate = (tab: string) => {
    if (tab === activeTab) return; // Prevent navigation to same tab
    
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    
    setIsNavigating(true);
    setActiveTab(tab);
    
    navigationTimeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
    }, 400);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Enforce role-based access control on tabs
  useEffect(() => {
    if (!isAuthenticated) return;

    if (currentRole === 'student') {
      if (activeTab !== 'take-exam' && activeTab !== 'student-results') {
        setActiveTab('take-exam');
      }
    } else if (currentRole === 'teacher') {
      const allowed = ['dashboard', 'questions', 'exams', 'grading', 'marks', 'results'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    } else if (currentRole === 'registrar') {
      const allowed = ['dashboard', 'results', 'marks', 'audit'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    } else if (currentRole === 'invigilator') {
      const allowed = ['dashboard', 'exams', 'audit'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [currentRole, isAuthenticated]);

  if (isLoading) return <LoadingScreen />;

  // Display LoginPage if user is not authenticated
  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':       return <AdminDashboard onNavigate={handleNavigate} />;
      case 'questions':       return <QuestionBank />;
      case 'exams':           return <ExamBuilder />;
      case 'grading':         return <GradingQueue />;
      case 'marks':           return <MarkEntryGrid />;
      case 'results':         return <ResultsPublication />;
      case 'people':          return <PeopleManager />;
      case 'academic':        return <AcademicMaster />;
      case 'setup':           return <InstitutionSetup />;
      case 'audit':           return <AuditLogsViewer />;
      case 'take-exam':       return <StudentDashboard />;
      case 'student-results': return <StudentDashboard />;
      default:                return <AdminDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>
      <NavigationProgress isNavigating={isNavigating} />
      <Header 
        activeTab={activeTab} 
        setActiveTab={handleNavigate}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div style={{ flex: 1, display: 'flex', width: '100%', minHeight: 0, overflow: 'hidden' }}>
        {/* Full-height Sidebar */}
        <div style={{ display: 'flex', flexShrink: 0 }}>
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={handleNavigate}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>
        {/* Full-width Responsive Main Container */}
        <main style={{
          flex: 1,
          padding: '24px 32px',
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          minWidth: 0,
        }}>
          <PageWrapper tabKey={activeTab}>
            {renderContent()}
          </PageWrapper>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
