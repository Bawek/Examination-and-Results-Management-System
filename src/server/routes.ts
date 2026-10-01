import { Router, Request, Response } from 'express';
import { query, pool } from './db.ts';
import { calculateSectionResults } from './services/resultEngine.ts';
import { syncExamToAssessment } from './services/examSync.ts';
import bcrypt from 'bcryptjs';

export const router = Router();

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}

// ─────────────────────────────────────────────────────────────
// Session-based getUser helper
// ─────────────────────────────────────────────────────────────
async function getUser(req: Request) {
  const sessionUserId = (req.session as any)?.userId;
  if (sessionUserId) {
    const res = await query('SELECT * FROM users WHERE id = $1 AND status = $2', [sessionUserId, 'active']);
    if (res.rows.length > 0) return res.rows[0];
  }
  return null;
}

// Require authenticated session middleware
function requireAuth(req: Request, res: Response, next: Function) {
  if (!(req.session as any)?.userId) {
    return res.status(401).json({ error: 'Not authenticated. Please log in.' });
  }
  next();
}

// ─────────────────────────────────────────────────────────────
// Auth Routes
// ─────────────────────────────────────────────────────────────

// POST /api/auth/login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const result = await query(
      "SELECT * FROM users WHERE (username = $1 OR email = $1) AND status = 'active' LIMIT 1",
      [username.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = result.rows[0];

    // Support both bcrypt hashes and legacy plain-text passwords
    let passwordValid = false;
    const hash: string = user.password_hash || '';
    if (hash.startsWith('$2')) {
      passwordValid = await bcrypt.compare(password, hash);
    } else {
      // Legacy plain-text comparison (dev seed data)
      passwordValid = (password === hash);
      if (passwordValid) {
        // Upgrade to bcrypt hash on first login
        const newHash = await bcrypt.hash(password, 12);
        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
      }
    }

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Save session
    (req.session as any).userId = user.id;
    (req.session as any).userRole = user.role;

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, reason)
       VALUES ($1, 'USER_LOGIN', 'USER', $2, 'Successful session login')`,
      [user.id, user.id.toString()]
    );

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/auth/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.clearCookie('ierms_sid');
    res.json({ success: true });
  });
});

// GET /api/auth/me  — requires session
router.get('/auth/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Session expired. Please log in.' });

    let extra: any = {};
    if (user.role === 'student') {
      const sRes = await query('SELECT * FROM students WHERE user_id = $1', [user.id]);
      extra.student = sRes.rows[0] || null;
    } else if (user.role === 'teacher') {
      const tRes = await query('SELECT * FROM teachers WHERE user_id = $1', [user.id]);
      extra.teacher = tRes.rows[0] || null;
    }

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, ...extra });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/users-list  — admin only, returns safe user list
router.get('/auth/users-list', requireAuth, async (req: Request, res: Response) => {
  try {
    const users = await query('SELECT id, username, email, role, full_name, status, last_login FROM users ORDER BY id ASC');
    res.json(users.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Dashboard Statistics
// -------------------------------------------------------------
router.get('/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);

    const [
      studentsCount,
      teachersCount,
      examsCount,
      activeExamsCount,
      pendingGradingCount,
      publicationsCount,
      auditLogsCount
    ] = await Promise.all([
      query("SELECT COUNT(*) FROM students WHERE status = 'active'"),
      query("SELECT COUNT(*) FROM teachers WHERE status = 'active'"),
      query('SELECT COUNT(*) FROM exams'),
      query("SELECT COUNT(*) FROM exams WHERE status = 'published' AND start_at <= NOW() AND end_at >= NOW()"),
      query("SELECT COUNT(*) FROM student_answers WHERE grading_status = 'ungraded'"),
      query("SELECT COUNT(*) FROM term_result_publications WHERE status = 'published'"),
      query('SELECT COUNT(*) FROM audit_logs')
    ]);

    const recentExams = await query(`
      SELECT e.id, e.title, e.duration_minutes, e.start_at, e.end_at, e.status, e.total_marks,
             sub.subject_name, c.name as class_name, sec.section_name
      FROM exams e
      JOIN class_subjects cs ON e.class_subject_id = cs.id
      JOIN subjects sub ON cs.subject_id = sub.id
      JOIN sections sec ON cs.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      ORDER BY e.created_at DESC LIMIT 5
    `);

    const recentLogs = await query(`
      SELECT a.id, a.action, a.entity_type, a.created_at, a.reason, u.full_name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC LIMIT 6
    `);

    res.json({
      counts: {
        students: parseInt(studentsCount.rows[0].count, 10),
        teachers: parseInt(teachersCount.rows[0].count, 10),
        exams: parseInt(examsCount.rows[0].count, 10),
        activeExams: parseInt(activeExamsCount.rows[0].count, 10),
        pendingGrading: parseInt(pendingGradingCount.rows[0].count, 10),
        publishedResults: parseInt(publicationsCount.rows[0].count, 10),
        auditLogs: parseInt(auditLogsCount.rows[0].count, 10)
      },
      recentExams: recentExams.rows,
      recentLogs: recentLogs.rows,
      currentUserRole: user?.role
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// School Settings & Policies
// -------------------------------------------------------------
router.get('/settings', async (_req: Request, res: Response) => {
  try {
    const sRes = await query('SELECT * FROM school_settings LIMIT 1');
    const scalesRes = await query('SELECT * FROM grading_scales ORDER BY min_score DESC');
    res.json({
      settings: sRes.rows[0] || {},
      gradingScales: scalesRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    const { institution_name, address, contact_email, contact_phone, timezone, pass_percentage, rounding_decimals, ranking_enabled } = req.body;

    await query(`
      UPDATE school_settings
      SET institution_name = $1, address = $2, contact_email = $3, contact_phone = $4,
          timezone = $5, pass_percentage = $6, rounding_decimals = $7, ranking_enabled = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `, [institution_name, address, contact_email, contact_phone, timezone, pass_percentage, rounding_decimals, ranking_enabled]);

    await query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
      VALUES ($1, 'UPDATE_SETTINGS', 'SCHOOL_SETTINGS', '1', $2, 'Updated school institutional settings and policies')
    `, [user?.id, JSON.stringify(req.body)]);

    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Academic Master Data
// -------------------------------------------------------------
router.get('/academic-years', async (_req: Request, res: Response) => {
  try {
    const yrs = await query('SELECT * FROM academic_years ORDER BY start_date DESC');
    res.json(yrs.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/terms', async (_req: Request, res: Response) => {
  try {
    const terms = await query(`
      SELECT t.*, y.name as academic_year_name
      FROM terms t
      JOIN academic_years y ON t.academic_year_id = y.id
      ORDER BY t.start_date ASC
    `);
    res.json(terms.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/classes', async (_req: Request, res: Response) => {
  try {
    const classes = await query('SELECT * FROM classes ORDER BY grade_level ASC');
    const sections = await query('SELECT * FROM sections ORDER BY section_name ASC');
    res.json({ classes: classes.rows, sections: sections.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/subjects', async (_req: Request, res: Response) => {
  try {
    const subjects = await query('SELECT * FROM subjects ORDER BY subject_name ASC');
    res.json(subjects.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/subjects', async (req: Request, res: Response) => {
  try {
    const { subject_code, subject_name, max_score, pass_score } = req.body;
    const result = await query(
      'INSERT INTO subjects (subject_code, subject_name, max_score, pass_score) VALUES ($1, $2, $3, $4) RETURNING *',
      [subject_code, subject_name, max_score || 100, pass_score || 50]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/class-subjects', async (_req: Request, res: Response) => {
  try {
    const cs = await query(`
      SELECT cs.id, cs.class_id, cs.section_id, cs.subject_id, cs.academic_year_id,
             c.name as class_name, sec.section_name, sub.subject_code, sub.subject_name,
             sub.max_score, sub.pass_score, y.name as academic_year_name
      FROM class_subjects cs
      JOIN classes c ON cs.class_id = c.id
      JOIN sections sec ON cs.section_id = sec.id
      JOIN subjects sub ON cs.subject_id = sub.id
      JOIN academic_years y ON cs.academic_year_id = y.id
      ORDER BY c.grade_level, sec.section_name, sub.subject_name
    `);
    res.json(cs.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// People: Students & Teachers
// -------------------------------------------------------------
router.get('/students', async (_req: Request, res: Response) => {
  try {
    const students = await query(`
      SELECT s.*, c.name as class_name, sec.section_name, u.username,
             acc.extra_time_minutes as accommodation_extra_time
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN student_accommodations acc ON s.id = acc.student_id
      ORDER BY s.admission_no ASC
    `);
    res.json(students.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/students', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    const { admission_no, first_name, last_name, gender, date_of_birth, guardian_name, guardian_phone, contact_email, class_id, section_id } = req.body;

    const sRes = await query(`
      INSERT INTO students (admission_no, first_name, last_name, gender, date_of_birth, guardian_name, guardian_phone, contact_email, class_id, section_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
    `, [admission_no, first_name, last_name, gender, date_of_birth, guardian_name, guardian_phone, contact_email, class_id, section_id]);

    await query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
      VALUES ($1, 'CREATE_STUDENT', 'STUDENT', $2, $3, 'Registered new student')
    `, [user?.id, sRes.rows[0].id.toString(), JSON.stringify({ admission_no, name: `${first_name} ${last_name}` })]);

    res.json(sRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/teachers', async (_req: Request, res: Response) => {
  try {
    const teachers = await query(`
      SELECT t.*, u.username
      FROM teachers t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.employee_no ASC
    `);
    res.json(teachers.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Question Bank
// -------------------------------------------------------------
router.get('/questions', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    const isStudent = user?.role === 'student';

    // Anti-leakage: if student, do NOT include answer_keys! (QBK-10)
    const selectFields = isStudent
      ? 'q.id, q.subject_id, q.category_id, q.type, q.prompt, q.marks, q.difficulty, q.status, q.version, q.options, q.created_at, sub.subject_name'
      : 'q.id, q.subject_id, q.category_id, q.type, q.prompt, q.marks, q.difficulty, q.status, q.version, q.options, q.answer_keys, q.rubric, q.explanation, q.created_at, sub.subject_name';

    const qRes = await query(`
      SELECT ${selectFields}
      FROM questions q
      JOIN subjects sub ON q.subject_id = sub.id
      ORDER BY q.id DESC
    `);

    res.json(qRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/questions', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    const { subject_id, category_id, type, prompt, marks, difficulty, options, answer_keys, rubric, explanation } = req.body;

    const resQ = await query(`
      INSERT INTO questions (subject_id, category_id, type, prompt, marks, difficulty, status, version, options, answer_keys, rubric, explanation, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, 'published', 1, $7, $8, $9, $10, $11) RETURNING *
    `, [
      subject_id,
      category_id || null,
      type,
      prompt,
      marks || 1.0,
      difficulty || 'medium',
      JSON.stringify(options || []),
      JSON.stringify(answer_keys || {}),
      JSON.stringify(rubric || {}),
      explanation || '',
      user?.id
    ]);

    await query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
      VALUES ($1, 'CREATE_QUESTION', 'QUESTION', $2, $3, 'Created new question bank item')
    `, [user?.id, resQ.rows[0].id.toString(), JSON.stringify({ type, marks })]);

    res.json(resQ.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Exam Management (OEMS)
// -------------------------------------------------------------
router.get('/exams', async (_req: Request, res: Response) => {
  try {
    const exams = await query(`
      SELECT e.*, sub.subject_name, sub.subject_code, c.name as class_name, sec.section_name,
             t.name as term_name, u.full_name as author_name,
             (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = e.id) as question_count,
             (SELECT COUNT(*) FROM exam_attempts ea WHERE ea.exam_id = e.id) as attempt_count
      FROM exams e
      JOIN class_subjects cs ON e.class_subject_id = cs.id
      JOIN subjects sub ON cs.subject_id = sub.id
      JOIN sections sec ON cs.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      JOIN terms t ON e.term_id = t.id
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.start_at DESC
    `);
    res.json(exams.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/exams/:id', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    const isStudent = user?.role === 'student';

    const examRes = await query(`
      SELECT e.*, sub.subject_name, sub.subject_code, c.name as class_name, sec.section_name,
             t.name as term_name
      FROM exams e
      JOIN class_subjects cs ON e.class_subject_id = cs.id
      JOIN subjects sub ON cs.subject_id = sub.id
      JOIN sections sec ON cs.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      JOIN terms t ON e.term_id = t.id
      WHERE e.id = $1
    `, [req.params.id]);

    if (examRes.rows.length === 0) return res.status(404).json({ error: 'Exam not found' });

    // Questions in this exam
    const selectQuestions = isStudent
      ? 'q.id, q.type, q.prompt, eq.marks, q.options, eq.sort_order'
      : 'q.id, q.type, q.prompt, eq.marks, q.options, q.answer_keys, q.rubric, q.explanation, eq.sort_order';

    const qRes = await query(`
      SELECT ${selectQuestions}
      FROM exam_questions eq
      JOIN questions q ON eq.question_id = q.id
      WHERE eq.exam_id = $1
      ORDER BY eq.sort_order ASC, q.id ASC
    `, [req.params.id]);

    res.json({
      exam: examRes.rows[0],
      questions: qRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/exams', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    const {
      class_subject_id, term_id, title, instructions, duration_minutes,
      start_at, end_at, attempt_limit, counted_attempt_rule,
      navigation_policy, show_feedback_policy, question_ids
    } = req.body;

    const exRes = await query(`
      INSERT INTO exams (
        class_subject_id, term_id, title, instructions, duration_minutes,
        start_at, end_at, attempt_limit, counted_attempt_rule, status,
        navigation_policy, show_feedback_policy, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published', $10, $11, $12)
      RETURNING *
    `, [
      class_subject_id, term_id, title, instructions, duration_minutes || 60,
      start_at, end_at, attempt_limit || 1, counted_attempt_rule || 'highest',
      navigation_policy || 'free', show_feedback_policy || 'after_release',
      user?.id
    ]);

    const examId = exRes.rows[0].id;
    let totalMarks = 0;

    if (Array.isArray(question_ids)) {
      for (let i = 0; i < question_ids.length; i++) {
        const qId = question_ids[i];
        const qData = await query('SELECT marks FROM questions WHERE id = $1', [qId]);
        const qMarks = qData.rows[0] ? parseFloat(qData.rows[0].marks) : 5.0;
        totalMarks += qMarks;

        await query(
          'INSERT INTO exam_questions (exam_id, question_id, marks, sort_order) VALUES ($1, $2, $3, $4)',
          [examId, qId, qMarks, i + 1]
        );
      }
    }

    await query('UPDATE exams SET total_marks = $1 WHERE id = $2', [totalMarks, examId]);

    await query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
      VALUES ($1, 'CREATE_EXAM', 'EXAM', $2, $3, 'Created and published new examination')
    `, [user?.id, examId.toString(), JSON.stringify({ title, totalMarks, duration_minutes })]);

    res.json({ ...exRes.rows[0], total_marks: totalMarks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Release exam results to candidates (independent from term publication! INT-05)
router.post('/exams/:id/release', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    const examId = parseInt(req.params.id, 10);

    // Verify all manual grading complete (GRD-06)
    const ungradedCheck = await query(`
      SELECT COUNT(*) FROM student_answers sa
      JOIN exam_attempts ea ON sa.attempt_id = ea.id
      WHERE ea.exam_id = $1 AND sa.grading_status = 'ungraded'
    `, [examId]);

    const ungradedCount = parseInt(ungradedCheck.rows[0].count, 10);
    if (ungradedCount > 0 && !req.body.forceOverride) {
      return res.status(400).json({
        error: `Cannot release exam results: ${ungradedCount} subjective answers are still pending grading in the queue. Complete grading or provide authorized override.`
      });
    }

    await query(`
      UPDATE exams SET status = 'results_released' WHERE id = $1
    `, [examId]);

    await query(`
      INSERT INTO exam_result_releases (exam_id, published_by, status)
      VALUES ($1, $2, 'released')
    `, [examId, user?.id]);

    await query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
      VALUES ($1, 'RELEASE_EXAM_RESULTS', 'EXAM', $2, $3, $4)
    `, [user?.id, examId.toString(), JSON.stringify({ ungradedCount }), req.body.reason || 'Candidate results authorized for viewing']);

    res.json({ success: true, message: 'Exam results released to candidates successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Candidate Delivery (DLV-01 to DLV-11)
// -------------------------------------------------------------
router.get('/candidate/available-exams', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    // Find student record
    let studentId: number | null = null;
    if (user?.role === 'student') {
      const s = await query('SELECT id, section_id FROM students WHERE user_id = $1', [user.id]);
      if (s.rows[0]) studentId = s.rows[0].id;
    }
    // If testing as teacher/admin, allow picking any student or showing all active exams
    const queryStudentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : studentId;

    const examsRes = await query(`
      SELECT e.id, e.title, e.instructions, e.duration_minutes, e.start_at, e.end_at,
             e.total_marks, e.pass_threshold, e.attempt_limit, e.status,
             sub.subject_name, sub.subject_code, c.name as class_name, sec.section_name,
             (
               SELECT COUNT(*) FROM exam_attempts ea
               WHERE ea.exam_id = e.id AND ea.student_id = $1
             ) as my_attempt_count,
             (
               SELECT json_agg(json_build_object(
                 'id', ea2.id,
                 'attempt_no', ea2.attempt_no,
                 'status', ea2.status,
                 'raw_score', ea2.raw_score,
                 'submitted_at', ea2.submitted_at
               ))
               FROM exam_attempts ea2
               WHERE ea2.exam_id = e.id AND ea2.student_id = $1
             ) as my_attempts
      FROM exams e
      JOIN class_subjects cs ON e.class_subject_id = cs.id
      JOIN subjects sub ON cs.subject_id = sub.id
      JOIN sections sec ON cs.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      WHERE e.status IN ('published', 'results_released')
      ORDER BY e.start_at ASC
    `, [queryStudentId || 0]);

    res.json(examsRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/candidate/start-attempt', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    const { examId, studentId: requestedStudentId } = req.body;

    // Get student ID
    let studentId = requestedStudentId;
    if (user?.role === 'student') {
      const s = await query('SELECT id FROM students WHERE user_id = $1', [user.id]);
      if (s.rows[0]) studentId = s.rows[0].id;
    }

    if (!studentId) {
      return res.status(400).json({ error: 'Valid student ID is required to start an attempt' });
    }

    // 1. Verify exam existence & availability
    const examRes = await query('SELECT * FROM exams WHERE id = $1', [examId]);
    if (examRes.rows.length === 0) return res.status(404).json({ error: 'Exam not found' });
    const exam = examRes.rows[0];

    // Check window
    const now = new Date();
    if (new Date(exam.start_at) > now) {
      return res.status(400).json({ error: 'This examination access window has not opened yet' });
    }
    if (new Date(exam.end_at) < now) {
      return res.status(400).json({ error: 'This examination access window has already closed' });
    }

    // Check attempts limit (DLV-03)
    const attemptsCountRes = await query(
      'SELECT COUNT(*) FROM exam_attempts WHERE exam_id = $1 AND student_id = $2',
      [examId, studentId]
    );
    const existingCount = parseInt(attemptsCountRes.rows[0].count, 10);
    if (existingCount >= exam.attempt_limit) {
      return res.status(400).json({ error: `Attempt limit of ${exam.attempt_limit} sitting(s) has been reached` });
    }

    // Check accommodation (REC-05) - extra time
    const accRes = await query(
      "SELECT extra_time_minutes FROM student_accommodations WHERE student_id = $1 AND accommodation_type = 'extra_time'",
      [studentId]
    );
    const extraMinutes = accRes.rows[0] ? parseInt(accRes.rows[0].extra_time_minutes, 10) : 0;
    const totalDurationMinutes = exam.duration_minutes + extraMinutes;

    // Server authoritative deadline calculation! (DLV-07, 8.1)
    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + totalDurationMinutes * 60 * 1000);

    const newAttemptRes = await query(`
      INSERT INTO exam_attempts (exam_id, student_id, attempt_no, started_at, deadline_at, status)
      VALUES ($1, $2, $3, $4, $5, 'in_progress') RETURNING *
    `, [examId, studentId, existingCount + 1, startedAt, deadlineAt]);

    const attempt = newAttemptRes.rows[0];

    // Log attempt start event
    await query(`
      INSERT INTO exam_events (attempt_id, event_type, metadata)
      VALUES ($1, 'start', $2)
    `, [attempt.id, JSON.stringify({ startedAt, extraMinutes, duration: totalDurationMinutes })]);

    res.json({
      attempt,
      totalDurationMinutes,
      extraMinutesGranted: extraMinutes
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch active attempt details & questions (DLV-04)
router.get('/candidate/attempts/:attemptId', async (req: Request, res: Response) => {
  try {
    const attemptId = req.params.attemptId;
    const attRes = await query(`
      SELECT ea.*, e.title as exam_title, e.instructions, e.total_marks as exam_total,
             e.navigation_policy, s.first_name, s.last_name, s.admission_no
      FROM exam_attempts ea
      JOIN exams e ON ea.exam_id = e.id
      JOIN students s ON ea.student_id = s.id
      WHERE ea.id = $1
    `, [attemptId]);

    if (attRes.rows.length === 0) return res.status(404).json({ error: 'Attempt not found' });
    const attempt = attRes.rows[0];

    // Fetch questions WITHOUT answer keys (QBK-10: strictly withheld from student!)
    const questionsRes = await query(`
      SELECT q.id, q.type, q.prompt, eq.marks, q.options, eq.sort_order
      FROM exam_questions eq
      JOIN questions q ON eq.question_id = q.id
      WHERE eq.exam_id = $1
      ORDER BY eq.sort_order ASC
    `, [attempt.exam_id]);

    // Fetch saved answers
    const answersRes = await query(`
      SELECT question_id, response_data, saved_at
      FROM student_answers
      WHERE attempt_id = $1
    `, [attemptId]);

    res.json({
      attempt,
      serverTime: new Date().toISOString(),
      questions: questionsRes.rows,
      savedAnswers: answersRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Autosave candidate response (DLV-06)
router.post('/candidate/attempts/:attemptId/save', async (req: Request, res: Response) => {
  try {
    const attemptId = parseInt(req.params.attemptId, 10);
    const { questionId, responseData } = req.body;

    // Check that attempt is still in progress
    const attRes = await query('SELECT status, deadline_at FROM exam_attempts WHERE id = $1', [attemptId]);
    if (attRes.rows.length === 0) return res.status(404).json({ error: 'Attempt not found' });
    const attempt = attRes.rows[0];

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ error: `Cannot save: attempt is currently in '${attempt.status}' state` });
    }

    // Check if server deadline has passed
    if (new Date() > new Date(attempt.deadline_at)) {
      // Mark as auto-submitted
      await query("UPDATE exam_attempts SET status = 'auto_submitted', submitted_at = CURRENT_TIMESTAMP WHERE id = $1", [attemptId]);
      return res.status(403).json({ error: 'Server deadline expired. Attempt auto-submitted.' });
    }

    // Upsert student answer
    await query(`
      INSERT INTO student_answers (attempt_id, question_id, response_data, saved_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (attempt_id, question_id)
      DO UPDATE SET response_data = EXCLUDED.response_data, saved_at = CURRENT_TIMESTAMP
    `, [attemptId, questionId, JSON.stringify(responseData)]);

    // Log save event
    await query(`
      INSERT INTO exam_events (attempt_id, event_type, metadata)
      VALUES ($1, 'save', $2)
    `, [attemptId, JSON.stringify({ questionId, timestamp: new Date() })]);

    res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Submit candidate attempt & auto-score objective items (DLV-08, DLV-09, GRD-01)
router.post('/candidate/attempts/:attemptId/submit', async (req: Request, res: Response) => {
  try {
    const attemptId = parseInt(req.params.attemptId, 10);
    const { reason } = req.body;

    const attRes = await query(`
      SELECT ea.*, e.total_marks as exam_total_marks
      FROM exam_attempts ea
      JOIN exams e ON ea.exam_id = e.id
      WHERE ea.id = $1
    `, [attemptId]);

    if (attRes.rows.length === 0) return res.status(404).json({ error: 'Attempt not found' });
    const attempt = attRes.rows[0];

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ error: 'Attempt has already been submitted or finalized' });
    }

    // 1. Fetch questions with answer keys for server-side evaluation
    const questionsRes = await query(`
      SELECT q.id, q.type, eq.marks, q.answer_keys, q.rubric
      FROM exam_questions eq
      JOIN questions q ON eq.question_id = q.id
      WHERE eq.exam_id = $1
    `, [attempt.exam_id]);

    // 2. Fetch all student saved answers
    const answersRes = await query('SELECT * FROM student_answers WHERE attempt_id = $1', [attemptId]);
    const answersMap = new Map<number, any>();
    for (const a of answersRes.rows) {
      answersMap.set(a.question_id, a);
    }

    let totalRawScore = 0;
    let hasSubjective = false;

    for (const q of questionsRes.rows) {
      const studentAns = answersMap.get(q.id);
      const resp = studentAns?.response_data || {};
      const maxMarks = parseFloat(q.marks);
      const keys = q.answer_keys || {};

      let awarded = 0;
      let gradingStatus = 'graded';

      if (q.type === 'single_choice' || q.type === 'true_false') {
        const correct = keys.correctOptionIds?.[0];
        if (resp.selectedOptionId && resp.selectedOptionId === correct) {
          awarded = maxMarks;
        }
      } else if (q.type === 'multiple_select') {
        const correctList: string[] = keys.correctOptionIds || [];
        const selectedList: string[] = resp.selectedOptionIds || [];
        if (keys.scoringPolicy === 'all_or_nothing') {
          const match = correctList.length === selectedList.length &&
            correctList.every(id => selectedList.includes(id));
          if (match) awarded = maxMarks;
        } else {
          // Partial credit
          let correctSelected = 0;
          let incorrectSelected = 0;
          for (const s of selectedList) {
            if (correctList.includes(s)) correctSelected++;
            else incorrectSelected++;
          }
          const baseRatio = correctList.length > 0 ? (correctSelected / correctList.length) : 0;
          const penalty = correctList.length > 0 ? (incorrectSelected / correctList.length) * 0.5 : 0;
          awarded = Math.max(0, Math.round((baseRatio - penalty) * maxMarks * 100) / 100);
        }
      } else if (q.type === 'short_answer') {
        const accepted: string[] = (keys.acceptedAnswers || []).map((s: string) => s.trim().toLowerCase());
        const studentText = (resp.text || '').trim().toLowerCase();
        if (accepted.length > 0 && accepted.includes(studentText)) {
          awarded = maxMarks;
        } else if (keys.manualReviewRequired) {
          gradingStatus = 'ungraded';
          hasSubjective = true;
        }
      } else if (q.type === 'essay' || q.type === 'file_upload') {
        gradingStatus = 'ungraded';
        hasSubjective = true;
      }

      totalRawScore += awarded;

      // Update student answer
      if (studentAns) {
        await query(`
          UPDATE student_answers
          SET awarded_marks = $1, grading_status = $2
          WHERE id = $3
        `, [awarded, gradingStatus, studentAns.id]);
      } else {
        await query(`
          INSERT INTO student_answers (attempt_id, question_id, response_data, awarded_marks, grading_status)
          VALUES ($1, $2, '{}', $3, $4)
        `, [attemptId, q.id, awarded, gradingStatus]);
      }
    }

    const finalStatus = hasSubjective ? 'grading' : 'finalized';
    const examTotal = parseFloat(attempt.exam_total_marks) || 100.0;
    const percentage = Math.round((totalRawScore / examTotal) * 100 * 100) / 100;

    await query(`
      UPDATE exam_attempts
      SET status = $1, submitted_at = CURRENT_TIMESTAMP, raw_score = $2, percentage = $3, auto_graded = true
      WHERE id = $4
    `, [finalStatus, totalRawScore, percentage, attemptId]);

    // Log submit event
    await query(`
      INSERT INTO exam_events (attempt_id, event_type, metadata)
      VALUES ($1, 'submit', $2)
    `, [attemptId, JSON.stringify({ reason: reason || 'Candidate submission', totalRawScore, hasSubjective })]);

    // If fully finalized and auto-graded, automatically trigger exam-to-marks sync (INT-02)
    if (finalStatus === 'finalized') {
      await syncExamToAssessment(attempt.exam_id);
    }

    res.json({
      success: true,
      status: finalStatus,
      rawScore: totalRawScore,
      percentage,
      pendingManualGrading: hasSubjective,
      message: hasSubjective
        ? 'Objective items scored automatically. Essay/short answer items queued for instructor evaluation.'
        : 'Exam completed and evaluated successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Manual Grading Queue (GRD-01 to GRD-08)
// -------------------------------------------------------------
router.get('/grading/queue', async (_req: Request, res: Response) => {
  try {
    const queue = await query(`
      SELECT sa.id as answer_id, sa.attempt_id, sa.question_id, sa.response_data,
             sa.awarded_marks, sa.grading_status, sa.feedback,
             q.type as question_type, q.prompt, eq.marks as max_marks, q.rubric,
             e.id as exam_id, e.title as exam_title,
             s.admission_no, s.first_name, s.last_name
      FROM student_answers sa
      JOIN exam_attempts ea ON sa.attempt_id = ea.id
      JOIN exams e ON ea.exam_id = e.id
      JOIN exam_questions eq ON (eq.exam_id = e.id AND eq.question_id = sa.question_id)
      JOIN questions q ON sa.question_id = q.id
      JOIN students s ON ea.student_id = s.id
      WHERE sa.grading_status = 'ungraded'
      ORDER BY ea.submitted_at ASC
    `);

    res.json(queue.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/grading/grade-item', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    const { answerId, awardedMarks, feedback } = req.body;

    const ansRes = await query('SELECT * FROM student_answers WHERE id = $1', [answerId]);
    if (ansRes.rows.length === 0) return res.status(404).json({ error: 'Answer not found' });
    const answer = ansRes.rows[0];

    await query(`
      UPDATE student_answers
      SET awarded_marks = $1, feedback = $2, grading_status = 'graded', grader_id = $3
      WHERE id = $4
    `, [awardedMarks, feedback || '', user?.id, answerId]);

    // Recalculate attempt score
    const allAnswersRes = await query(`
      SELECT awarded_marks, grading_status FROM student_answers WHERE attempt_id = $1
    `, [answer.attempt_id]);

    let sum = 0;
    let anyUngraded = false;
    for (const a of allAnswersRes.rows) {
      if (a.grading_status === 'ungraded') anyUngraded = true;
      if (a.awarded_marks !== null) sum += parseFloat(a.awarded_marks);
    }

    const attemptData = await query(`
      SELECT ea.*, e.total_marks FROM exam_attempts ea
      JOIN exams e ON ea.exam_id = e.id WHERE ea.id = $1
    `, [answer.attempt_id]);
    const attempt = attemptData.rows[0];

    const examTotal = parseFloat(attempt.total_marks) || 100.0;
    const percentage = Math.round((sum / examTotal) * 100 * 100) / 100;
    const newStatus = anyUngraded ? 'grading' : 'finalized';

    await query(`
      UPDATE exam_attempts
      SET raw_score = $1, percentage = $2, status = $3
      WHERE id = $4
    `, [sum, percentage, newStatus, answer.attempt_id]);

    // If all items graded, sync to marks table (INT-02)
    if (newStatus === 'finalized') {
      await syncExamToAssessment(attempt.exam_id, user?.id);
    }

    await query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
      VALUES ($1, 'MANUAL_GRADE_ANSWER', 'STUDENT_ANSWER', $2, $3, 'Instructor evaluated subjective response')
    `, [user?.id, answerId.toString(), JSON.stringify({ awardedMarks, feedback })]);

    res.json({
      success: true,
      attemptStatus: newStatus,
      totalScore: sum,
      percentage
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Manual trigger for Exam-to-Marks synchronization (INT-01 to INT-07)
router.post('/exams/:id/sync-to-marks', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    const examId = parseInt(req.params.id, 10);
    const result = await syncExamToAssessment(examId, user?.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Assessments, Marks & Results Module (SRMS)
// -------------------------------------------------------------
router.get('/assessments', async (req: Request, res: Response) => {
  try {
    const { classSubjectId, termId } = req.query;
    let sql = `
      SELECT a.*, cs.subject_id, sub.subject_name, sub.subject_code,
             e.title as exam_title, e.total_marks as exam_total_marks
      FROM assessments a
      JOIN class_subjects cs ON a.class_subject_id = cs.id
      JOIN subjects sub ON cs.subject_id = sub.id
      LEFT JOIN exams e ON a.exam_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (classSubjectId) {
      params.push(classSubjectId);
      sql += ` AND a.class_subject_id = $${params.length}`;
    }
    if (termId) {
      params.push(termId);
      sql += ` AND a.term_id = $${params.length}`;
    }
    sql += ' ORDER BY a.id ASC';

    const assmts = await query(sql, params);
    res.json(assmts.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/assessments', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    const { class_subject_id, term_id, name, max_score, weight, due_date, source_type, exam_id } = req.body;

    // Weight sum validation (ACD-08, RES-02)
    const existingWeightsRes = await query(`
      SELECT SUM(weight) as total_weight FROM assessments
      WHERE class_subject_id = $1 AND term_id = $2
    `, [class_subject_id, term_id]);

    const existingSum = parseFloat(existingWeightsRes.rows[0].total_weight || '0');
    const newWeight = parseFloat(weight);
    if (existingSum + newWeight > 100.0) {
      return res.status(400).json({
        error: `Assessment weights would exceed 100% (Current sum: ${existingSum}%, Added: ${newWeight}%)`
      });
    }

    const aRes = await query(`
      INSERT INTO assessments (class_subject_id, term_id, name, max_score, weight, due_date, source_type, exam_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [class_subject_id, term_id, name, max_score || 100, newWeight, due_date || null, source_type || 'manual', exam_id || null]);

    // If source is online_exam and exam_id is given, trigger sync immediately if attempts exist
    if (source_type === 'online_exam' && exam_id) {
      await syncExamToAssessment(exam_id, user?.id);
    }

    await query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
      VALUES ($1, 'CREATE_ASSESSMENT', 'ASSESSMENT', $2, $3, 'Configured assessment component')
    `, [user?.id, aRes.rows[0].id.toString(), JSON.stringify(req.body)]);

    res.json(aRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark Entry Grid Data (MRK-02, MRK-03)
router.get('/marks/grid', async (req: Request, res: Response) => {
  try {
    const classSubjectId = parseInt(req.query.classSubjectId as string, 10);
    const termId = parseInt(req.query.termId as string, 10);

    if (!classSubjectId || !termId) {
      return res.status(400).json({ error: 'classSubjectId and termId are required' });
    }

    // Class subject info
    const csRes = await query(`
      SELECT cs.*, sub.subject_name, sub.subject_code, c.name as class_name, sec.section_name,
             sec.id as section_id
      FROM class_subjects cs
      JOIN subjects sub ON cs.subject_id = sub.id
      JOIN sections sec ON cs.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      WHERE cs.id = $1
    `, [classSubjectId]);

    if (csRes.rows.length === 0) return res.status(404).json({ error: 'Class subject not found' });
    const classSubject = csRes.rows[0];

    // Check term lock status (PUB-04)
    const pubRes = await query(`
      SELECT status FROM term_result_publications WHERE term_id = $1 AND section_id = $2
    `, [termId, classSubject.section_id]);
    const publicationStatus = pubRes.rows[0]?.status || 'draft';

    // Assessments
    const assmtsRes = await query(`
      SELECT * FROM assessments WHERE class_subject_id = $1 AND term_id = $2 ORDER BY id ASC
    `, [classSubjectId, termId]);

    // Active enrolled students
    const studentsRes = await query(`
      SELECT s.id, s.admission_no, s.first_name, s.last_name, s.gender
      FROM students s
      JOIN enrollments e ON s.id = e.student_id
      WHERE s.section_id = $1 AND e.status = 'active'
      ORDER BY s.admission_no ASC
    `, [classSubject.section_id]);

    // Marks recorded
    const marksRes = await query(`
      SELECT m.* FROM marks m
      JOIN assessments a ON m.assessment_id = a.id
      WHERE a.class_subject_id = $1 AND a.term_id = $2
    `, [classSubjectId, termId]);

    const marksMap: Record<string, any> = {};
    for (const m of marksRes.rows) {
      marksMap[`${m.assessment_id}_${m.student_id}`] = m;
    }

    res.json({
      classSubject,
      publicationStatus,
      isLocked: publicationStatus === 'locked',
      assessments: assmtsRes.rows,
      students: studentsRes.rows,
      marksMap
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save / Submit marks (MRK-04, MRK-05, MRK-10)
router.post('/marks/save', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    const { entries, submitForReview, reason } = req.body;
    // entries: Array<{ assessmentId, studentId, score, markStatus, isOverride }>

    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: 'Entries must be an array' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const item of entries) {
        const { assessmentId, studentId, score, markStatus } = item;

        // Verify score range
        if (score !== null && score !== undefined && score !== '') {
          const numScore = parseFloat(score);
          const aData = await client.query('SELECT max_score, source_type FROM assessments WHERE id = $1', [assessmentId]);
          const maxScore = parseFloat(aData.rows[0]?.max_score || 100);

          if (numScore < 0 || numScore > maxScore) {
            throw new Error(`Score ${numScore} out of range (0 - ${maxScore}) for student ID ${studentId}`);
          }

          // Check if exam sourced and protect from manual overwrite without override flag (INT-04)
          const existing = await client.query('SELECT source FROM marks WHERE assessment_id = $1 AND student_id = $2', [assessmentId, studentId]);
          if (existing.rows[0]?.source === 'exam' && !item.isOverride) {
            throw new Error(`Mark is sourced from online exam. Authorized override confirmation is required to overwrite.`);
          }

          await client.query(`
            INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source, updated_at)
            VALUES ($1, $2, $3, $4, $5, 'manual', CURRENT_TIMESTAMP)
            ON CONFLICT (assessment_id, student_id)
            DO UPDATE SET
              score = EXCLUDED.score,
              mark_status = EXCLUDED.mark_status,
              teacher_id = EXCLUDED.teacher_id,
              source = EXCLUDED.source,
              updated_at = CURRENT_TIMESTAMP
          `, [assessmentId, studentId, numScore, markStatus || 'scored', user?.id]);
        } else {
          // Special statuses without score (absent, excused, exempt, incomplete)
          await client.query(`
            INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source, updated_at)
            VALUES ($1, $2, NULL, $3, $4, 'manual', CURRENT_TIMESTAMP)
            ON CONFLICT (assessment_id, student_id)
            DO UPDATE SET
              score = NULL,
              mark_status = EXCLUDED.mark_status,
              teacher_id = EXCLUDED.teacher_id,
              updated_at = CURRENT_TIMESTAMP
          `, [assessmentId, studentId, markStatus || 'incomplete', user?.id]);
        }
      }

      await client.query('COMMIT');

      await query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
        VALUES ($1, $2, 'MARKS', 'BATCH', $3, $4)
      `, [
        user?.id,
        submitForReview ? 'SUBMIT_MARKS_REVIEW' : 'SAVE_MARKS_DRAFT',
        JSON.stringify({ count: entries.length, submitForReview }),
        reason || (submitForReview ? 'Teacher submitted marks for approval' : 'Draft marks saved')
      ]);

      res.json({ success: true, count: entries.length, submitted: !!submitForReview });
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Results Engine: Section Results Summary (RES-01 to RES-10)
router.get('/results/section-summary', async (req: Request, res: Response) => {
  try {
    const termId = parseInt(req.query.termId as string, 10);
    const sectionId = parseInt(req.query.sectionId as string, 10);

    if (!termId || !sectionId) {
      return res.status(400).json({ error: 'termId and sectionId are required' });
    }

    const summaries = await calculateSectionResults(termId, sectionId);

    // Publication record
    const pubRes = await query(`
      SELECT p.*, u.full_name as publisher_name
      FROM term_result_publications p
      LEFT JOIN users u ON p.published_by = u.id
      WHERE p.term_id = $1 AND p.section_id = $2
    `, [termId, sectionId]);

    const publication = pubRes.rows[0] || { status: 'draft' };

    res.json({
      summaries,
      publication
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Publication & Locking Workflow (PUB-01 to PUB-07)
router.post('/results/publication-action', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    const { termId, sectionId, action, reason } = req.body;
    // action: 'submit_review', 'approve', 'publish', 'lock', 'unpublish', 'reopen'

    const currentPub = await query(`
      SELECT * FROM term_result_publications WHERE term_id = $1 AND section_id = $2
    `, [termId, sectionId]);

    let newStatus = 'draft';
    let publishedAt: any = null;
    let lockedAt: any = null;

    if (action === 'submit_review') newStatus = 'under_review';
    else if (action === 'approve') newStatus = 'approved';
    else if (action === 'publish') {
      newStatus = 'published';
      publishedAt = new Date();
    } else if (action === 'lock') {
      newStatus = 'locked';
      lockedAt = new Date();
    } else if (action === 'unpublish') {
      newStatus = 'under_review';
    } else if (action === 'reopen') {
      // Locking can only be reopened by Admin with reason (PUB-04)
      if (user?.role !== 'admin') {
        return res.status(403).json({ error: 'Only an authorized Administrator can reopen locked term results' });
      }
      if (!reason) {
        return res.status(400).json({ error: 'A documented reason is required to reopen locked results' });
      }
      newStatus = 'published';
    }

    await query(`
      INSERT INTO term_result_publications (term_id, section_id, published_by, published_at, locked_at, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (term_id, section_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        published_by = EXCLUDED.published_by,
        published_at = COALESCE(EXCLUDED.published_at, term_result_publications.published_at),
        locked_at = COALESCE(EXCLUDED.locked_at, term_result_publications.locked_at)
    `, [termId, sectionId, user?.id, publishedAt, lockedAt, newStatus]);

    await query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
      VALUES ($1, $2, 'TERM_PUBLICATION', $3, $4, $5)
    `, [
      user?.id,
      `RESULTS_${action.toUpperCase()}`,
      `${termId}_${sectionId}`,
      JSON.stringify({ termId, sectionId, previousStatus: currentPub.rows[0]?.status, newStatus }),
      reason || `Term result status transition to ${newStatus}`
    ]);

    res.json({ success: true, status: newStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Student's Report Card View (RPT-03, PUB-07)
router.get('/reports/report-card/:studentId/:termId', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    const studentId = parseInt(req.params.studentId, 10);
    const termId = parseInt(req.params.termId, 10);

    // If student, ensure cannot view another student's report card (IAM-08, TC-04 IDOR prevention!)
    if (user?.role === 'student') {
      const s = await query('SELECT id FROM students WHERE user_id = $1', [user.id]);
      if (!s.rows[0] || s.rows[0].id !== studentId) {
        return res.status(403).json({ error: 'Access denied: Cannot view another student academic records' });
      }
    }

    const sRes = await query('SELECT section_id FROM students WHERE id = $1', [studentId]);
    if (sRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    const sectionId = sRes.rows[0].section_id;

    // Check publication status: student cannot view unpublished report cards! (PUB-07)
    const pubRes = await query(`
      SELECT status FROM term_result_publications WHERE term_id = $1 AND section_id = $2
    `, [termId, sectionId]);
    const pubStatus = pubRes.rows[0]?.status;

    if (user?.role === 'student' && pubStatus !== 'published' && pubStatus !== 'locked') {
      return res.status(403).json({
        error: 'Term results for your section have not been published yet. Please contact the registrar.'
      });
    }

    // Calculate section results to get rank and complete breakdown
    const sectionSummaries = await calculateSectionResults(termId, sectionId);
    const studentSummary = sectionSummaries.find(s => s.studentId === studentId);

    if (!studentSummary) {
      return res.status(404).json({ error: 'Student summary could not be calculated' });
    }

    // School settings
    const settingsRes = await query('SELECT * FROM school_settings LIMIT 1');
    const termRes = await query(`
      SELECT t.name as term_name, y.name as academic_year_name
      FROM terms t
      JOIN academic_years y ON t.academic_year_id = y.id
      WHERE t.id = $1
    `, [termId]);

    res.json({
      school: settingsRes.rows[0] || {},
      academicPeriod: termRes.rows[0] || {},
      studentSummary,
      totalStudentsCount: sectionSummaries.length,
      isOfficialPublished: pubStatus === 'published' || pubStatus === 'locked'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Audit Logs (ADM-01, ADM-02, ADM-05)
// -------------------------------------------------------------
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const { action, entityType, limit } = req.query;
    let sql = `
      SELECT a.*, u.username, u.full_name, u.role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (action) {
      params.push(`%${action}%`);
      sql += ` AND a.action ILIKE $${params.length}`;
    }
    if (entityType) {
      params.push(entityType);
      sql += ` AND a.entity_type = $${params.length}`;
    }
    sql += ` ORDER BY a.created_at DESC LIMIT ${parseInt(limit as string, 10) || 50}`;

    const logs = await query(sql, params);
    res.json(logs.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// System Health & Neon PostgreSQL Status
// -------------------------------------------------------------
router.get('/system/health', async (_req: Request, res: Response) => {
  try {
    const ping = await query('SELECT NOW() as db_time, current_database() as db_name, version() as version');
    res.json({
      status: 'operational',
      database: 'Neon PostgreSQL (Connected)',
      dbTime: ping.rows[0].db_time,
      dbName: ping.rows[0].db_name,
      engine: ping.rows[0].version
    });
  } catch (err: any) {
    res.status(500).json({ status: 'degraded', error: err.message });
  }
});
