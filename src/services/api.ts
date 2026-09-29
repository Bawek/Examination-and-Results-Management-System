const getHeaders = () => {
  const activeRole = localStorage.getItem('ierms_active_role') || 'admin';
  const activeUserId = localStorage.getItem('ierms_active_user_id') || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-role': activeRole,
  };
  if (activeUserId) {
    headers['x-user-id'] = activeUserId;
  }
  return headers;
};

async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth & System
  getMe: () => fetch('/api/auth/me', { headers: getHeaders() }).then(handleResponse),
  getUsersList: () => fetch('/api/auth/users-list', { headers: getHeaders() }).then(handleResponse),
  getHealth: () => fetch('/api/system/health', { headers: getHeaders() }).then(handleResponse),
  getDashboardStats: () => fetch('/api/dashboard/stats', { headers: getHeaders() }).then(handleResponse),

  // Settings & Master data
  getSettings: () => fetch('/api/settings', { headers: getHeaders() }).then(handleResponse),
  updateSettings: (data: any) =>
    fetch('/api/settings', { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),

  getAcademicYears: () => fetch('/api/academic-years', { headers: getHeaders() }).then(handleResponse),
  getTerms: () => fetch('/api/terms', { headers: getHeaders() }).then(handleResponse),
  getClasses: () => fetch('/api/classes', { headers: getHeaders() }).then(handleResponse),
  getSubjects: () => fetch('/api/subjects', { headers: getHeaders() }).then(handleResponse),
  createSubject: (data: any) =>
    fetch('/api/subjects', { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  getClassSubjects: () => fetch('/api/class-subjects', { headers: getHeaders() }).then(handleResponse),

  // People
  getStudents: () => fetch('/api/students', { headers: getHeaders() }).then(handleResponse),
  createStudent: (data: any) =>
    fetch('/api/students', { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  getTeachers: () => fetch('/api/teachers', { headers: getHeaders() }).then(handleResponse),

  // Question Bank
  getQuestions: () => fetch('/api/questions', { headers: getHeaders() }).then(handleResponse),
  createQuestion: (data: any) =>
    fetch('/api/questions', { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),

  // Exams
  getExams: () => fetch('/api/exams', { headers: getHeaders() }).then(handleResponse),
  getExamDetail: (id: number | string) => fetch(`/api/exams/${id}`, { headers: getHeaders() }).then(handleResponse),
  createExam: (data: any) =>
    fetch('/api/exams', { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  releaseExam: (id: number, forceOverride = false, reason = '') =>
    fetch(`/api/exams/${id}/release`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ forceOverride, reason })
    }).then(handleResponse),
  syncExamToMarks: (id: number) =>
    fetch(`/api/exams/${id}/sync-to-marks`, { method: 'POST', headers: getHeaders() }).then(handleResponse),

  // Candidate Sitting
  getAvailableExams: (studentId?: number) => {
    const url = studentId ? `/api/candidate/available-exams?studentId=${studentId}` : '/api/candidate/available-exams';
    return fetch(url, { headers: getHeaders() }).then(handleResponse);
  },
  startAttempt: (examId: number, studentId?: number) =>
    fetch('/api/candidate/start-attempt', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ examId, studentId })
    }).then(handleResponse),
  getAttempt: (attemptId: number | string) =>
    fetch(`/api/candidate/attempts/${attemptId}`, { headers: getHeaders() }).then(handleResponse),
  saveAttemptAnswer: (attemptId: number | string, questionId: number, responseData: any) =>
    fetch(`/api/candidate/attempts/${attemptId}/save`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ questionId, responseData })
    }).then(handleResponse),
  submitAttempt: (attemptId: number | string, reason = '') =>
    fetch(`/api/candidate/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason })
    }).then(handleResponse),

  // Grading Queue
  getGradingQueue: () => fetch('/api/grading/queue', { headers: getHeaders() }).then(handleResponse),
  gradeItem: (answerId: number, awardedMarks: number, feedback: string) =>
    fetch('/api/grading/grade-item', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ answerId, awardedMarks, feedback })
    }).then(handleResponse),

  // Assessments & Marks
  getAssessments: (classSubjectId?: number, termId?: number) => {
    let url = '/api/assessments';
    const params = new URLSearchParams();
    if (classSubjectId) params.append('classSubjectId', classSubjectId.toString());
    if (termId) params.append('termId', termId.toString());
    if (params.toString()) url += `?${params.toString()}`;
    return fetch(url, { headers: getHeaders() }).then(handleResponse);
  },
  createAssessment: (data: any) =>
    fetch('/api/assessments', { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  getMarksGrid: (classSubjectId: number, termId: number) =>
    fetch(`/api/marks/grid?classSubjectId=${classSubjectId}&termId=${termId}`, { headers: getHeaders() }).then(handleResponse),
  saveMarks: (entries: any[], submitForReview = false, reason = '') =>
    fetch('/api/marks/save', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ entries, submitForReview, reason })
    }).then(handleResponse),

  // Results & Publication
  getSectionResults: (termId: number, sectionId: number) =>
    fetch(`/api/results/section-summary?termId=${termId}&sectionId=${sectionId}`, { headers: getHeaders() }).then(handleResponse),
  publicationAction: (termId: number, sectionId: number, action: string, reason = '') =>
    fetch('/api/results/publication-action', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ termId, sectionId, action, reason })
    }).then(handleResponse),
  getReportCard: (studentId: number, termId: number) =>
    fetch(`/api/reports/report-card/${studentId}/${termId}`, { headers: getHeaders() }).then(handleResponse),

  // Audit Logs
  getAuditLogs: (action = '', entityType = '') => {
    let url = '/api/audit-logs?';
    if (action) url += `action=${encodeURIComponent(action)}&`;
    if (entityType) url += `entityType=${encodeURIComponent(entityType)}&`;
    return fetch(url, { headers: getHeaders() }).then(handleResponse);
  }
};
