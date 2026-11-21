// Identity and role come ONLY from the server-side session cookie.
// (Previously this sent x-user-role / x-user-id from localStorage, which a user could edit.)
const getHeaders = (extra: Record<string, string> = {}) => ({
  'Content-Type': 'application/json',
  ...extra,
});

async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

// Session-bound CSRF token, fetched lazily and re-fetched after login/logout/expiry.
let csrfToken: string | null = null;
async function ensureCsrf(): Promise<string | null> {
  if (csrfToken) return csrfToken;
  try {
    const r = await fetch('/api/auth/csrf', { credentials: 'include' });
    if (r.ok) csrfToken = (await r.json()).token;
  } catch {
    /* network error: request will fail on its own */
  }
  return csrfToken;
}

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

async function req(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const needsCsrf = !SAFE_METHODS.includes(method) && url !== '/api/auth/login';

  const send = async () => {
    const extra = { ...((options.headers as Record<string, string>) || {}) };
    if (needsCsrf) {
      const token = await ensureCsrf();
      if (token) extra['X-CSRF-Token'] = token;
    }
    return fetch(url, { ...options, credentials: 'include', headers: getHeaders(extra) });
  };

  let res = await send();

  // Stale CSRF token (e.g. server restarted): refresh once and retry.
  if (res.status === 403 && needsCsrf) {
    const body = await res.clone().json().catch(() => ({}));
    if (typeof body.error === 'string' && body.error.includes('CSRF')) {
      csrfToken = null;
      res = await send();
    }
  }

  // New session after login, gone after logout.
  if (url === '/api/auth/login' || url === '/api/auth/logout') csrfToken = null;

  // Session expired mid-use: tell the app so it can return to the login screen.
  if (res.status === 401 && url !== '/api/auth/login' && url !== '/api/auth/me') {
    csrfToken = null;
    window.dispatchEvent(new Event('ierms:unauthorized'));
  }

  return handleResponse(res);
}

export const api = {
  // Auth & System
  login: (data: { username: string; password: string }) =>
    req('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () =>
    req('/api/auth/logout', { method: 'POST' }),
  getMe: () => req('/api/auth/me'),
  getUsersList: () => req('/api/auth/users-list'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    req('/api/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  getHealth: () => req('/api/system/health'),
  getDashboardStats: () => req('/api/dashboard/stats'),

  // Settings & Master data
  getSettings: () => req('/api/settings'),
  updateSettings: (data: any) =>
    req('/api/settings', { method: 'POST', body: JSON.stringify(data) }),

  getAcademicYears: () => req('/api/academic-years'),
  getTerms: () => req('/api/terms'),
  getClasses: () => req('/api/classes'),
  getSubjects: () => req('/api/subjects'),
  createSubject: (data: any) =>
    req('/api/subjects', { method: 'POST', body: JSON.stringify(data) }),
  getClassSubjects: () => req('/api/class-subjects'),

  // People
  getStudents: () => req('/api/students'),
  createStudent: (data: any) =>
    req('/api/students', { method: 'POST', body: JSON.stringify(data) }),
  getTeachers: () => req('/api/teachers'),

  // Question Bank
  getQuestions: () => req('/api/questions'),
  createQuestion: (data: any) =>
    req('/api/questions', { method: 'POST', body: JSON.stringify(data) }),

  // Exams
  getExams: () => req('/api/exams'),
  getExamDetail: (id: number | string) => req(`/api/exams/${id}`),
  createExam: (data: any) =>
    req('/api/exams', { method: 'POST', body: JSON.stringify(data) }),
  releaseExam: (id: number, forceOverride = false, reason = '') =>
    req(`/api/exams/${id}/release`, {
      method: 'POST',
      body: JSON.stringify({ forceOverride, reason })
    }),
  syncExamToMarks: (id: number) =>
    req(`/api/exams/${id}/sync-to-marks`, { method: 'POST' }),

  // Candidate Sitting
  getAvailableExams: (studentId?: number) => {
    const url = studentId ? `/api/candidate/available-exams?studentId=${studentId}` : '/api/candidate/available-exams';
    return req(url);
  },
  startAttempt: (examId: number, studentId?: number) =>
    req('/api/candidate/start-attempt', {
      method: 'POST',
      body: JSON.stringify({ examId, studentId })
    }),
  getAttempt: (attemptId: number | string) =>
    req(`/api/candidate/attempts/${attemptId}`),
  saveAttemptAnswer: (attemptId: number | string, questionId: number, responseData: any) =>
    req(`/api/candidate/attempts/${attemptId}/save`, {
      method: 'POST',
      body: JSON.stringify({ questionId, responseData })
    }),
  submitAttempt: (attemptId: number | string, reason = '') =>
    req(`/api/candidate/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  // Grading Queue
  getGradingQueue: () => req('/api/grading/queue'),
  gradeItem: (answerId: number, awardedMarks: number, feedback: string) =>
    req('/api/grading/grade-item', {
      method: 'POST',
      body: JSON.stringify({ answerId, awardedMarks, feedback })
    }),

  // Assessments & Marks
  getAssessments: (classSubjectId?: number, termId?: number) => {
    let url = '/api/assessments';
    const params = new URLSearchParams();
    if (classSubjectId) params.append('classSubjectId', classSubjectId.toString());
    if (termId) params.append('termId', termId.toString());
    if (params.toString()) url += `?${params.toString()}`;
    return req(url);
  },
  createAssessment: (data: any) =>
    req('/api/assessments', { method: 'POST', body: JSON.stringify(data) }),
  getMarksGrid: (classSubjectId: number, termId: number) =>
    req(`/api/marks/grid?classSubjectId=${classSubjectId}&termId=${termId}`),
  saveMarks: (entries: any[], submitForReview = false, reason = '') =>
    req('/api/marks/save', {
      method: 'POST',
      body: JSON.stringify({ entries, submitForReview, reason })
    }),

  // Results & Publication
  getSectionResults: (termId: number, sectionId: number) =>
    req(`/api/results/section-summary?termId=${termId}&sectionId=${sectionId}`),
  publicationAction: (termId: number, sectionId: number, action: string, reason = '') =>
    req('/api/results/publication-action', {
      method: 'POST',
      body: JSON.stringify({ termId, sectionId, action, reason })
    }),
  getReportCard: (studentId: number, termId: number) =>
    req(`/api/reports/report-card/${studentId}/${termId}`),

  // Audit Logs
  getAuditLogs: (action = '', entityType = '') => {
    let url = '/api/audit-logs?';
    if (action) url += `action=${encodeURIComponent(action)}&`;
    if (entityType) url += `entityType=${encodeURIComponent(entityType)}&`;
    return req(url);
  }
};
