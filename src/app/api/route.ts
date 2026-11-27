import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Examination and Results Management System - API',
    version: '2.0.0',
    architecture: 'Fullstack Next.js (App Router + PostgreSQL)',
    endpoints: {
      auth: {
        csrf: 'GET /api/auth/csrf',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
        usersList: 'GET /api/auth/users-list',
        changePassword: 'POST /api/auth/change-password',
      },
      academic: {
        academicYears: 'GET /api/academic-years',
        terms: 'GET /api/terms',
        classes: 'GET /api/classes',
        subjects: 'GET/POST /api/subjects',
        classSubjects: 'GET /api/class-subjects',
      },
      people: {
        students: 'GET/POST /api/students',
        teachers: 'GET /api/teachers',
      },
      oems: {
        questions: 'GET/POST /api/questions',
        exams: 'GET/POST /api/exams',
        examDetail: 'GET /api/exams/[id]',
        releaseExam: 'POST /api/exams/[id]/release',
        syncExamToMarks: 'POST /api/exams/[id]/sync-to-marks',
        availableExams: 'GET /api/candidate/available-exams',
        startAttempt: 'POST /api/candidate/start-attempt',
        attemptDetail: 'GET /api/candidate/attempts/[attemptId]',
        saveAnswer: 'POST /api/candidate/attempts/[attemptId]/save',
        submitAttempt: 'POST /api/candidate/attempts/[attemptId]/submit',
        gradingQueue: 'GET /api/grading/queue',
        gradeItem: 'POST /api/grading/grade-item',
      },
      srms: {
        assessments: 'GET/POST /api/assessments',
        marksGrid: 'GET /api/marks/grid',
        saveMarks: 'POST /api/marks/save',
        sectionSummary: 'GET /api/results/section-summary',
        publicationAction: 'POST /api/results/publication-action',
        reportCard: 'GET /api/reports/report-card/[studentId]/[termId]',
      },
      system: {
        dashboardStats: 'GET /api/dashboard/stats',
        settings: 'GET/POST /api/settings',
        auditLogs: 'GET /api/audit-logs',
        systemHealth: 'GET /api/system/health',
        health: 'GET /api/health',
      },
    },
    status: 'operational',
  });
}
