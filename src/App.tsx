import React, { useState, useEffect } from 'react';
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

function MainContent() {
  const { currentRole, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  useEffect(() => {
    if (currentRole === 'student') {
      setActiveTab('take-exam');
    } else {
      setActiveTab('dashboard');
    }
  }, [currentRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-500">Connecting to Neon PostgreSQL Database...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard onNavigate={setActiveTab} />;
      case 'questions':
        return <QuestionBank />;
      case 'exams':
        return <ExamBuilder />;
      case 'grading':
        return <GradingQueue />;
      case 'marks':
        return <MarkEntryGrid />;
      case 'results':
        return <ResultsPublication />;
      case 'people':
        return <PeopleManager />;
      case 'academic':
        return <AcademicMaster />;
      case 'setup':
        return <InstitutionSetup />;
      case 'audit':
        return <AuditLogsViewer />;
      case 'take-exam':
        return <StudentDashboard />;
      case 'student-results':
        return <StudentDashboard />;
      default:
        return <AdminDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderContent()}
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
