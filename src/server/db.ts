import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_YAOXjDG61TIf@ep-wispy-glade-b5dmmm4v-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('PostgreSQL query error:', { text, error: (err as Error).message });
    throw err;
  }
}

export async function initDatabase() {
  console.log('Connecting to Neon PostgreSQL and ensuring IERMS schema...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. School settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS school_settings (
        id SERIAL PRIMARY KEY,
        institution_name VARCHAR(255) NOT NULL DEFAULT 'Apex International Academy',
        logo_url TEXT,
        address TEXT DEFAULT '100 Academic Way, Innovation District',
        contact_email VARCHAR(255) DEFAULT 'admin@apex-academy.edu',
        contact_phone VARCHAR(50) DEFAULT '+1 (555) 234-5678',
        timezone VARCHAR(100) DEFAULT 'UTC',
        pass_percentage NUMERIC(5,2) DEFAULT 50.00,
        rounding_decimals INT DEFAULT 2,
        ranking_enabled BOOLEAN DEFAULT true,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Grading scales
    await client.query(`
      CREATE TABLE IF NOT EXISTS grading_scales (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        grade VARCHAR(10) NOT NULL,
        min_score NUMERIC(5,2) NOT NULL,
        max_score NUMERIC(5,2) NOT NULL,
        grade_point NUMERIC(4,2) NOT NULL,
        is_pass BOOLEAN DEFAULT true,
        remarks VARCHAR(100)
      );
    `);

    // 3. Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL, -- 'admin', 'teacher', 'student', 'registrar', 'invigilator'
        full_name VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Academic structure
    await client.query(`
      CREATE TABLE IF NOT EXISTS academic_years (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_current BOOLEAN DEFAULT false
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS terms (
        id SERIAL PRIMARY KEY,
        academic_year_id INT REFERENCES academic_years(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'open' -- 'open', 'closed', 'locked'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        grade_level INT,
        description TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        class_id INT REFERENCES classes(id) ON DELETE CASCADE,
        section_name VARCHAR(50) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        subject_code VARCHAR(50) UNIQUE NOT NULL,
        subject_name VARCHAR(255) NOT NULL,
        max_score NUMERIC(5,2) DEFAULT 100.00,
        pass_score NUMERIC(5,2) DEFAULT 50.00,
        status VARCHAR(20) DEFAULT 'active'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS class_subjects (
        id SERIAL PRIMARY KEY,
        class_id INT REFERENCES classes(id) ON DELETE CASCADE,
        section_id INT REFERENCES sections(id) ON DELETE CASCADE,
        subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
        academic_year_id INT REFERENCES academic_years(id) ON DELETE CASCADE,
        CONSTRAINT unique_class_subject_sec_yr UNIQUE (section_id, subject_id, academic_year_id)
      );
    `);

    // 5. People: Students, Teachers, Enrollments
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        admission_no VARCHAR(100) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        gender VARCHAR(20),
        date_of_birth DATE,
        guardian_name VARCHAR(255),
        guardian_phone VARCHAR(50),
        contact_email VARCHAR(255),
        class_id INT REFERENCES classes(id),
        section_id INT REFERENCES sections(id),
        status VARCHAR(20) DEFAULT 'active'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS student_accommodations (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES students(id) ON DELETE CASCADE,
        accommodation_type VARCHAR(100) NOT NULL,
        extra_time_minutes INT DEFAULT 0,
        notes TEXT,
        valid_until DATE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        employee_no VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        status VARCHAR(20) DEFAULT 'active'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES students(id) ON DELETE CASCADE,
        section_id INT REFERENCES sections(id) ON DELETE CASCADE,
        academic_year_id INT REFERENCES academic_years(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'active',
        CONSTRAINT unique_student_year_enrollment UNIQUE (student_id, academic_year_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS teacher_assignments (
        id SERIAL PRIMARY KEY,
        teacher_id INT REFERENCES teachers(id) ON DELETE CASCADE,
        class_subject_id INT REFERENCES class_subjects(id) ON DELETE CASCADE,
        term_id INT REFERENCES terms(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'lead_teacher'
      );
    `);

    // 6. Question Bank
    await client.query(`
      CREATE TABLE IF NOT EXISTS question_categories (
        id SERIAL PRIMARY KEY,
        subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
        topic VARCHAR(255) NOT NULL,
        tags TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
        category_id INT REFERENCES question_categories(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL, -- single_choice, multiple_select, true_false, short_answer, essay, matching
        prompt TEXT NOT NULL,
        marks NUMERIC(5,2) DEFAULT 1.00,
        difficulty VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard
        status VARCHAR(20) DEFAULT 'published',
        version INT DEFAULT 1,
        options JSONB, -- list of choices: [{id, text}]
        answer_keys JSONB, -- server-side only: {correctOptionIds, acceptedAnswers, rubric}
        rubric JSONB,
        explanation TEXT,
        created_by INT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Exam Management
    await client.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id SERIAL PRIMARY KEY,
        class_subject_id INT REFERENCES class_subjects(id) ON DELETE CASCADE,
        term_id INT REFERENCES terms(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        instructions TEXT,
        duration_minutes INT NOT NULL DEFAULT 60,
        start_at TIMESTAMP WITH TIME ZONE NOT NULL,
        end_at TIMESTAMP WITH TIME ZONE NOT NULL,
        attempt_limit INT NOT NULL DEFAULT 1,
        counted_attempt_rule VARCHAR(50) DEFAULT 'highest', -- highest, latest, average
        status VARCHAR(50) DEFAULT 'published', -- draft, pending_approval, approved, published, closed, results_released
        navigation_policy VARCHAR(50) DEFAULT 'free', -- free, locked
        show_feedback_policy VARCHAR(50) DEFAULT 'after_release', -- immediate, after_close, after_release
        access_code VARCHAR(50),
        randomize_questions BOOLEAN DEFAULT false,
        randomize_options BOOLEAN DEFAULT false,
        total_marks NUMERIC(5,2) DEFAULT 100.00,
        pass_threshold NUMERIC(5,2) DEFAULT 50.00,
        created_by INT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_questions (
        id SERIAL PRIMARY KEY,
        exam_id INT REFERENCES exams(id) ON DELETE CASCADE,
        question_id INT REFERENCES questions(id) ON DELETE CASCADE,
        marks NUMERIC(5,2) NOT NULL,
        sort_order INT DEFAULT 0,
        CONSTRAINT unique_exam_question UNIQUE (exam_id, question_id)
      );
    `);

    // 8. Exam Attempts and Candidate Delivery
    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_attempts (
        id SERIAL PRIMARY KEY,
        exam_id INT REFERENCES exams(id) ON DELETE CASCADE,
        student_id INT REFERENCES students(id) ON DELETE CASCADE,
        attempt_no INT NOT NULL DEFAULT 1,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deadline_at TIMESTAMP WITH TIME ZONE NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, submitted, auto_submitted, grading, finalized, absent, excused, invalidated
        raw_score NUMERIC(5,2),
        percentage NUMERIC(5,2),
        feedback TEXT,
        auto_graded BOOLEAN DEFAULT false,
        CONSTRAINT unique_student_exam_attempt UNIQUE (exam_id, student_id, attempt_no)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS student_answers (
        id SERIAL PRIMARY KEY,
        attempt_id INT REFERENCES exam_attempts(id) ON DELETE CASCADE,
        question_id INT REFERENCES questions(id) ON DELETE CASCADE,
        response_data JSONB,
        awarded_marks NUMERIC(5,2),
        grading_status VARCHAR(50) DEFAULT 'ungraded', -- ungraded, graded
        feedback TEXT,
        grader_id INT REFERENCES users(id),
        saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_attempt_question_answer UNIQUE (attempt_id, question_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_events (
        id SERIAL PRIMARY KEY,
        attempt_id INT REFERENCES exam_attempts(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL, -- start, save, reconnect, disconnect, blur, submit, staff_intervention
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_result_releases (
        id SERIAL PRIMARY KEY,
        exam_id INT REFERENCES exams(id) ON DELETE CASCADE,
        published_by INT REFERENCES users(id),
        published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'released'
      );
    `);

    // 9. Results, Assessments and Mark Entry
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        class_subject_id INT REFERENCES class_subjects(id) ON DELETE CASCADE,
        term_id INT REFERENCES terms(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL, -- Quiz 1, Mid-Term, Project, Final Exam
        max_score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
        weight NUMERIC(5,2) NOT NULL DEFAULT 25.00, -- e.g. 20%, 30%, 50%
        due_date DATE,
        source_type VARCHAR(50) DEFAULT 'manual', -- manual, online_exam
        exam_id INT REFERENCES exams(id) ON DELETE SET NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS marks (
        id SERIAL PRIMARY KEY,
        assessment_id INT REFERENCES assessments(id) ON DELETE CASCADE,
        student_id INT REFERENCES students(id) ON DELETE CASCADE,
        score NUMERIC(5,2),
        mark_status VARCHAR(50) DEFAULT 'scored', -- scored, absent, excused, exempt, incomplete, invalidated, pending_review
        teacher_id INT REFERENCES teachers(id) ON DELETE SET NULL,
        source VARCHAR(50) DEFAULT 'manual', -- manual, exam
        exam_attempt_id INT REFERENCES exam_attempts(id) ON DELETE SET NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_assessment_student UNIQUE (assessment_id, student_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS term_result_publications (
        id SERIAL PRIMARY KEY,
        term_id INT REFERENCES terms(id) ON DELETE CASCADE,
        section_id INT REFERENCES sections(id) ON DELETE CASCADE,
        published_by INT REFERENCES users(id),
        published_at TIMESTAMP WITH TIME ZONE,
        locked_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, under_review, approved, published, locked
        CONSTRAINT unique_term_section_pub UNIQUE (term_id, section_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS teacher_comments (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES students(id) ON DELETE CASCADE,
        term_id INT REFERENCES terms(id) ON DELETE CASCADE,
        teacher_id INT REFERENCES teachers(id) ON DELETE SET NULL,
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 10. Audit Logging
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(100),
        details JSONB,
        reason TEXT,
        ip_address VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('IERMS schema created / verified successfully.');

    // Seed initial data if tables are empty
    await seedInitialData(client);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function seedInitialData(client: pg.PoolClient) {
  const usersCheck = await client.query('SELECT COUNT(*) FROM users');
  if (parseInt(usersCheck.rows[0].count, 10) > 0) {
    console.log('Database already contains records. Skipping seed.');
    return;
  }

  console.log('Seeding initial comprehensive IERMS enterprise data...');

  // 1. Settings
  await client.query(`
    INSERT INTO school_settings (institution_name, address, contact_email, contact_phone, timezone, pass_percentage, rounding_decimals, ranking_enabled)
    VALUES ('Apex International Academy & Institute', '742 Evergreen Academic Blvd, Education District', 'registrar@apex-ier.edu', '+1 (555) 019-8234', 'America/New_York', 50.00, 2, true);
  `);

  // 2. Grading scale
  const gradingData = [
    { grade: 'A+', min: 90, max: 100, gpa: 4.00, pass: true, remarks: 'Outstanding' },
    { grade: 'A', min: 80, max: 89.99, gpa: 3.75, pass: true, remarks: 'Excellent' },
    { grade: 'B', min: 70, max: 79.99, gpa: 3.00, pass: true, remarks: 'Very Good' },
    { grade: 'C', min: 60, max: 69.99, gpa: 2.00, pass: true, remarks: 'Satisfactory' },
    { grade: 'D', min: 50, max: 59.99, gpa: 1.00, pass: true, remarks: 'Pass' },
    { grade: 'F', min: 0, max: 49.99, gpa: 0.00, pass: false, remarks: 'Fail' },
  ];
  for (const g of gradingData) {
    await client.query(
      `INSERT INTO grading_scales (name, grade, min_score, max_score, grade_point, is_pass, remarks) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['Standard Academic Scale', g.grade, g.min, g.max, g.gpa, g.pass, g.remarks]
    );
  }

  // 3. Users: Admin, Teachers, Registrar, Students
  const users = [
    { username: 'admin', email: 'admin@apex-ier.edu', role: 'admin', full_name: 'Dr. Arthur Sterling (Administrator)' },
    { username: 'teacher.miller', email: 'e.miller@apex-ier.edu', role: 'teacher', full_name: 'Prof. Eleanor Miller (Math & Science)' },
    { username: 'teacher.davis', email: 'm.davis@apex-ier.edu', role: 'teacher', full_name: 'Dr. Marcus Davis (Physics & CS)' },
    { username: 'registrar.hayes', email: 'c.hayes@apex-ier.edu', role: 'registrar', full_name: 'Clara Hayes (Academic Registrar)' },
    { username: 'invigilator.sam', email: 's.reyes@apex-ier.edu', role: 'invigilator', full_name: 'Samuel Reyes (Exam Proctor)' },
    { username: 'stu.kaleb', email: 'kaleb.t@apex-ier.edu', role: 'student', full_name: 'Kaleb Tadesse' },
    { username: 'stu.sophia', email: 'sophia.c@apex-ier.edu', role: 'student', full_name: 'Sophia Chen' },
    { username: 'stu.marcus', email: 'marcus.v@apex-ier.edu', role: 'student', full_name: 'Marcus Vance' },
    { username: 'stu.aaliyah', email: 'aaliyah.k@apex-ier.edu', role: 'student', full_name: 'Aaliyah Khan' },
  ];

  const userIds: Record<string, number> = {};
  for (const u of users) {
    const res = await client.query(
      `INSERT INTO users (username, email, password_hash, role, full_name) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [u.username, u.email, 'password123', u.role, u.full_name]
    );
    userIds[u.username] = res.rows[0].id;
  }

  // 4. Academic year and terms
  const yrRes = await client.query(
    `INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES ('2026-2027 Academic Year', '2026-09-01', '2027-06-30', true) RETURNING id`
  );
  const yrId = yrRes.rows[0].id;

  const t1Res = await client.query(
    `INSERT INTO terms (academic_year_id, name, start_date, end_date, status) VALUES ($1, 'Term 1 (Fall)', '2026-09-01', '2026-12-20', 'open') RETURNING id`,
    [yrId]
  );
  const term1Id = t1Res.rows[0].id;

  await client.query(
    `INSERT INTO terms (academic_year_id, name, start_date, end_date, status) VALUES ($1, 'Term 2 (Spring)', '2027-01-10', '2027-06-25', 'open')`,
    [yrId]
  );

  // 5. Classes and sections
  const cls10Res = await client.query(
    `INSERT INTO classes (name, grade_level, description) VALUES ('Grade 10', 10, 'Secondary Advanced Level') RETURNING id`
  );
  const class10Id = cls10Res.rows[0].id;

  const secARes = await client.query(
    `INSERT INTO sections (class_id, section_name) VALUES ($1, 'Section A') RETURNING id`,
    [class10Id]
  );
  const secAId = secARes.rows[0].id;

  const secBRes = await client.query(
    `INSERT INTO sections (class_id, section_name) VALUES ($1, 'Section B') RETURNING id`,
    [class10Id]
  );
  const secBId = secBRes.rows[0].id;

  // 6. Subjects
  const subMath = await client.query(
    `INSERT INTO subjects (subject_code, subject_name, max_score, pass_score) VALUES ('MATH-101', 'Advanced Mathematics', 100, 50) RETURNING id`
  );
  const subPhy = await client.query(
    `INSERT INTO subjects (subject_code, subject_name, max_score, pass_score) VALUES ('PHYS-101', 'General Physics & Mechanics', 100, 50) RETURNING id`
  );
  const subEng = await client.query(
    `INSERT INTO subjects (subject_code, subject_name, max_score, pass_score) VALUES ('ENG-101', 'Academic English & Literature', 100, 50) RETURNING id`
  );

  // Class subjects (Offerings)
  const csMathRes = await client.query(
    `INSERT INTO class_subjects (class_id, section_id, subject_id, academic_year_id) VALUES ($1, $2, $3, $4) RETURNING id`,
    [class10Id, secAId, subMath.rows[0].id, yrId]
  );
  const csMathId = csMathRes.rows[0].id;

  const csPhyRes = await client.query(
    `INSERT INTO class_subjects (class_id, section_id, subject_id, academic_year_id) VALUES ($1, $2, $3, $4) RETURNING id`,
    [class10Id, secAId, subPhy.rows[0].id, yrId]
  );
  const csPhyId = csPhyRes.rows[0].id;

  const csEngRes = await client.query(
    `INSERT INTO class_subjects (class_id, section_id, subject_id, academic_year_id) VALUES ($1, $2, $3, $4) RETURNING id`,
    [class10Id, secAId, subEng.rows[0].id, yrId]
  );
  const csEngId = csEngRes.rows[0].id;

  // 7. Teachers records & assignments
  const tMillerRes = await client.query(
    `INSERT INTO teachers (user_id, employee_no, name, email, phone) VALUES ($1, 'EMP-1001', 'Prof. Eleanor Miller', 'e.miller@apex-ier.edu', '+1-555-0101') RETURNING id`,
    [userIds['teacher.miller']]
  );
  const tMillerId = tMillerRes.rows[0].id;

  const tDavisRes = await client.query(
    `INSERT INTO teachers (user_id, employee_no, name, email, phone) VALUES ($1, 'EMP-1002', 'Dr. Marcus Davis', 'm.davis@apex-ier.edu', '+1-555-0102') RETURNING id`,
    [userIds['teacher.davis']]
  );
  const tDavisId = tDavisRes.rows[0].id;

  await client.query(
    `INSERT INTO teacher_assignments (teacher_id, class_subject_id, term_id, role) VALUES ($1, $2, $3, 'lead_teacher')`,
    [tMillerId, csMathId, term1Id]
  );
  await client.query(
    `INSERT INTO teacher_assignments (teacher_id, class_subject_id, term_id, role) VALUES ($1, $2, $3, 'lead_teacher')`,
    [tDavisId, csPhyId, term1Id]
  );

  // 8. Students records & enrollments
  const studentRows = [
    { u: 'stu.kaleb', adm: 'STU-2026-001', f: 'Kaleb', l: 'Tadesse', g: 'M', dob: '2010-04-12', parent: 'Dawit Tadesse', phone: '+1-555-7701' },
    { u: 'stu.sophia', adm: 'STU-2026-002', f: 'Sophia', l: 'Chen', g: 'F', dob: '2010-09-22', parent: 'Li Chen', phone: '+1-555-7702' },
    { u: 'stu.marcus', adm: 'STU-2026-003', f: 'Marcus', l: 'Vance', g: 'M', dob: '2010-01-15', parent: 'Elena Vance', phone: '+1-555-7703' },
    { u: 'stu.aaliyah', adm: 'STU-2026-004', f: 'Aaliyah', l: 'Khan', g: 'F', dob: '2010-11-03', parent: 'Tariq Khan', phone: '+1-555-7704' },
  ];

  const studentIds: Record<string, number> = {};
  for (const s of studentRows) {
    const sRes = await client.query(
      `INSERT INTO students (user_id, admission_no, first_name, last_name, gender, date_of_birth, guardian_name, guardian_phone, contact_email, class_id, section_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [userIds[s.u], s.adm, s.f, s.l, s.g, s.dob, s.parent, s.phone, `${s.f.toLowerCase()}@student.apex.edu`, class10Id, secAId]
    );
    studentIds[s.u] = sRes.rows[0].id;

    // Enroll in section A for current year
    await client.query(
      `INSERT INTO enrollments (student_id, section_id, academic_year_id, status) VALUES ($1, $2, $3, 'active')`,
      [studentIds[s.u], secAId, yrId]
    );
  }

  // Student accommodation for Marcus (REC-05)
  await client.query(
    `INSERT INTO student_accommodations (student_id, accommodation_type, extra_time_minutes, notes) VALUES ($1, 'extra_time', 15, 'Approved for 15 minutes extra time per medical accommodation policy')`,
    [studentIds['stu.marcus']]
  );

  // 9. Question Bank: Mathematics & Physics
  const qCatMath = await client.query(
    `INSERT INTO question_categories (subject_id, topic, tags) VALUES ($1, 'Calculus & Quadratics', 'algebra,functions,quadratics') RETURNING id`,
    [subMath.rows[0].id]
  );
  const qCatPhy = await client.query(
    `INSERT INTO question_categories (subject_id, topic, tags) VALUES ($1, 'Newtonian Kinematics', 'velocity,forces,vectors') RETURNING id`,
    [subPhy.rows[0].id]
  );

  // Questions for Math
  const q1 = await client.query(`
    INSERT INTO questions (subject_id, category_id, type, prompt, marks, difficulty, status, options, answer_keys, explanation, created_by)
    VALUES ($1, $2, 'single_choice', 'What are the roots of the quadratic equation x^2 - 5x + 6 = 0?', 5.0, 'medium', 'published',
      $3, $4, 'Factoring gives (x-2)(x-3) = 0, so x = 2 and x = 3.', $5) RETURNING id
  `, [
    subMath.rows[0].id,
    qCatMath.rows[0].id,
    JSON.stringify([
      { id: 'opt_1', text: 'x = 2 and x = 3' },
      { id: 'opt_2', text: 'x = -2 and x = -3' },
      { id: 'opt_3', text: 'x = 1 and x = 6' },
      { id: 'opt_4', text: 'x = -1 and x = -6' },
    ]),
    JSON.stringify({ correctOptionIds: ['opt_1'] }),
    userIds['teacher.miller']
  ]);

  const q2 = await client.query(`
    INSERT INTO questions (subject_id, category_id, type, prompt, marks, difficulty, status, options, answer_keys, explanation, created_by)
    VALUES ($1, $2, 'multiple_select', 'Which of the following functions are strictly increasing for all real numbers x > 0? (Select all that apply)', 5.0, 'medium', 'published',
      $3, $4, 'f(x)=e^x and f(x)=ln(x) are strictly increasing for positive x. cos(x) oscillates, and -x^2 is decreasing.', $5) RETURNING id
  `, [
    subMath.rows[0].id,
    qCatMath.rows[0].id,
    JSON.stringify([
      { id: 'opt_a', text: 'f(x) = e^x' },
      { id: 'opt_b', text: 'f(x) = ln(x)' },
      { id: 'opt_c', text: 'f(x) = cos(x)' },
      { id: 'opt_d', text: 'f(x) = -x^2' },
    ]),
    JSON.stringify({ correctOptionIds: ['opt_a', 'opt_b'], scoringPolicy: 'partial_credit' }),
    userIds['teacher.miller']
  ]);

  const q3 = await client.query(`
    INSERT INTO questions (subject_id, category_id, type, prompt, marks, difficulty, status, options, answer_keys, explanation, created_by)
    VALUES ($1, $2, 'true_false', 'The derivative of a constant function f(x) = c is always zero for all real numbers.', 4.0, 'easy', 'published',
      $3, $4, 'By definition of the limit, d/dx(c) = 0.', $5) RETURNING id
  `, [
    subMath.rows[0].id,
    qCatMath.rows[0].id,
    JSON.stringify([
      { id: 'opt_t', text: 'True' },
      { id: 'opt_f', text: 'False' },
    ]),
    JSON.stringify({ correctOptionIds: ['opt_t'] }),
    userIds['teacher.miller']
  ]);

  const q4 = await client.query(`
    INSERT INTO questions (subject_id, category_id, type, prompt, marks, difficulty, status, options, answer_keys, explanation, rubric, created_by)
    VALUES ($1, $2, 'essay', 'Prove by mathematical induction or direct algebra that the sum of the first n positive integers is n(n+1)/2. Show all proof steps clearly.', 10.0, 'hard', 'published',
      null,
      $3,
      'Base step n=1 verified. Inductive hypothesis k -> k+1 demonstrated with algebraic simplification.',
      $4,
      $5) RETURNING id
  `, [
    subMath.rows[0].id,
    qCatMath.rows[0].id,
    JSON.stringify({ manualReviewRequired: true }),
    JSON.stringify({
      criteria: [
        { criterion: 'Base case verification (n=1)', maxMarks: 2 },
        { criterion: 'Inductive hypothesis formulation', maxMarks: 3 },
        { criterion: 'Algebraic execution of k+1 step', maxMarks: 4 },
        { criterion: 'Conclusion and clarity of notation', maxMarks: 1 }
      ]
    }),
    userIds['teacher.miller']
  ]);

  // 10. Online Exam
  const examRes = await client.query(`
    INSERT INTO exams (
      class_subject_id, term_id, title, instructions, duration_minutes,
      start_at, end_at, attempt_limit, counted_attempt_rule, status,
      navigation_policy, show_feedback_policy, randomize_questions, randomize_options,
      total_marks, pass_threshold, created_by
    ) VALUES (
      $1, $2, 'Advanced Mathematics Mid-Term Examination',
      'Calculators permitted. All working must be shown for essay questions. Server time strictly enforced.',
      45,
      NOW() - INTERVAL '2 hours',
      NOW() + INTERVAL '24 hours',
      2, 'highest', 'published', 'free', 'after_release', false, false,
      24.00, 12.00, $3
    ) RETURNING id
  `, [csMathId, term1Id, userIds['teacher.miller']]);
  const examId = examRes.rows[0].id;

  // Add questions to exam
  await client.query(`INSERT INTO exam_questions (exam_id, question_id, marks, sort_order) VALUES ($1, $2, 5.0, 1)`, [examId, q1.rows[0].id]);
  await client.query(`INSERT INTO exam_questions (exam_id, question_id, marks, sort_order) VALUES ($1, $2, 5.0, 2)`, [examId, q2.rows[0].id]);
  await client.query(`INSERT INTO exam_questions (exam_id, question_id, marks, sort_order) VALUES ($1, $2, 4.0, 3)`, [examId, q3.rows[0].id]);
  await client.query(`INSERT INTO exam_questions (exam_id, question_id, marks, sort_order) VALUES ($1, $2, 10.0, 4)`, [examId, q4.rows[0].id]);

  // 11. Assessments in Results Module (SRMS)
  // Term 1 Math assessments:
  // - Continuous Assessment 1 (Quiz) (weight 20%, max 20) -> manual
  // - Mid-Term Exam (weight 30%, max 30) -> linked to online exam! (INT-01)
  // - Final Exam (weight 50%, max 50) -> manual
  const assmtQuiz = await client.query(`
    INSERT INTO assessments (class_subject_id, term_id, name, max_score, weight, due_date, source_type)
    VALUES ($1, $2, 'Continuous Assessment / Quizzes', 20.00, 20.00, '2026-10-15', 'manual') RETURNING id
  `, [csMathId, term1Id]);

  const assmtMidterm = await client.query(`
    INSERT INTO assessments (class_subject_id, term_id, name, max_score, weight, due_date, source_type, exam_id)
    VALUES ($1, $2, 'Mid-Term Examination (Online)', 30.00, 30.00, '2026-11-01', 'online_exam', $3) RETURNING id
  `, [csMathId, term1Id, examId]);

  const assmtFinal = await client.query(`
    INSERT INTO assessments (class_subject_id, term_id, name, max_score, weight, due_date, source_type)
    VALUES ($1, $2, 'Comprehensive Final Examination', 50.00, 50.00, '2026-12-15', 'manual') RETURNING id
  `, [csMathId, term1Id]);

  // Also create Physics assessments
  const assmtPhyMid = await client.query(`
    INSERT INTO assessments (class_subject_id, term_id, name, max_score, weight, due_date, source_type)
    VALUES ($1, $2, 'Mid-Term Physics Assessment', 40.00, 40.00, '2026-11-05', 'manual') RETURNING id
  `, [csPhyId, term1Id]);

  const assmtPhyFinal = await client.query(`
    INSERT INTO assessments (class_subject_id, term_id, name, max_score, weight, due_date, source_type)
    VALUES ($1, $2, 'Final Physics Practical & Theory', 60.00, 60.00, '2026-12-18', 'manual') RETURNING id
  `, [csPhyId, term1Id]);

  // Seed sample completed attempt for student Sophia Chen (stu.sophia)
  const attSophia = await client.query(`
    INSERT INTO exam_attempts (exam_id, student_id, attempt_no, started_at, deadline_at, submitted_at, status, raw_score, percentage, feedback, auto_graded)
    VALUES ($1, $2, 1, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '20 minutes', 'finalized', 22.00, 91.67, 'Superb proof execution and accurate algebra.', true) RETURNING id
  `, [examId, studentIds['stu.sophia']]);

  // Add answers for Sophia
  await client.query(`
    INSERT INTO student_answers (attempt_id, question_id, response_data, awarded_marks, grading_status, feedback, grader_id)
    VALUES ($1, $2, $3, 5.0, 'graded', 'Correct roots', $4)
  `, [attSophia.rows[0].id, q1.rows[0].id, JSON.stringify({ selectedOptionId: 'opt_1' }), userIds['teacher.miller']]);

  await client.query(`
    INSERT INTO student_answers (attempt_id, question_id, response_data, awarded_marks, grading_status, feedback, grader_id)
    VALUES ($1, $2, $3, 5.0, 'graded', 'Both functions correctly selected', $4)
  `, [attSophia.rows[0].id, q2.rows[0].id, JSON.stringify({ selectedOptionIds: ['opt_a', 'opt_b'] }), userIds['teacher.miller']]);

  await client.query(`
    INSERT INTO student_answers (attempt_id, question_id, response_data, awarded_marks, grading_status, feedback, grader_id)
    VALUES ($1, $2, $3, 4.0, 'graded', 'Correct', $4)
  `, [attSophia.rows[0].id, q3.rows[0].id, JSON.stringify({ selectedOptionId: 'opt_t' }), userIds['teacher.miller']]);

  await client.query(`
    INSERT INTO student_answers (attempt_id, question_id, response_data, awarded_marks, grading_status, feedback, grader_id)
    VALUES ($1, $2, $3, 8.0, 'graded', 'Well written inductive argument. Minor notation slip on line 4.', $4)
  `, [attSophia.rows[0].id, q4.rows[0].id, JSON.stringify({ text: 'Proof by mathematical induction: For n=1, LHS=1, RHS=1(2)/2=1. Assume true for k...' }), userIds['teacher.miller']]);

  // Seed sample marks for students
  // Sophia: Quiz (19/20), MidTerm (scaled 22/24 * 30 = 27.5/30), Final (46/50) -> Total = 92.5 (A+)
  await client.query(`
    INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source)
    VALUES ($1, $2, 19.00, 'scored', $3, 'manual')
  `, [assmtQuiz.rows[0].id, studentIds['stu.sophia'], tMillerId]);

  await client.query(`
    INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source, exam_attempt_id)
    VALUES ($1, $2, 27.50, 'scored', $3, 'exam', $4)
  `, [assmtMidterm.rows[0].id, studentIds['stu.sophia'], tMillerId, attSophia.rows[0].id]);

  await client.query(`
    INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source)
    VALUES ($1, $2, 46.00, 'scored', $3, 'manual')
  `, [assmtFinal.rows[0].id, studentIds['stu.sophia'], tMillerId]);

  // Sophia Physics
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 38.00, 'scored', $3, 'manual')`, [assmtPhyMid.rows[0].id, studentIds['stu.sophia'], tDavisId]);
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 54.00, 'scored', $3, 'manual')`, [assmtPhyFinal.rows[0].id, studentIds['stu.sophia'], tDavisId]);

  // Kaleb: Quiz (17/20), MidTerm (24.00/30), Final (42/50) -> Total = 83 (A)
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 17.00, 'scored', $3, 'manual')`, [assmtQuiz.rows[0].id, studentIds['stu.kaleb'], tMillerId]);
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 24.00, 'scored', $3, 'manual')`, [assmtMidterm.rows[0].id, studentIds['stu.kaleb'], tMillerId]);
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 42.00, 'scored', $3, 'manual')`, [assmtFinal.rows[0].id, studentIds['stu.kaleb'], tMillerId]);
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 32.00, 'scored', $3, 'manual')`, [assmtPhyMid.rows[0].id, studentIds['stu.kaleb'], tDavisId]);
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 48.00, 'scored', $3, 'manual')`, [assmtPhyFinal.rows[0].id, studentIds['stu.kaleb'], tDavisId]);

  // Marcus: Quiz (15/20), MidTerm (20/30), Final (35/50) -> Total = 70 (B)
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 15.00, 'scored', $3, 'manual')`, [assmtQuiz.rows[0].id, studentIds['stu.marcus'], tMillerId]);
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 20.00, 'scored', $3, 'manual')`, [assmtMidterm.rows[0].id, studentIds['stu.marcus'], tMillerId]);
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 35.00, 'scored', $3, 'manual')`, [assmtFinal.rows[0].id, studentIds['stu.marcus'], tMillerId]);
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 28.00, 'scored', $3, 'manual')`, [assmtPhyMid.rows[0].id, studentIds['stu.marcus'], tDavisId]);
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 40.00, 'scored', $3, 'manual')`, [assmtPhyFinal.rows[0].id, studentIds['stu.marcus'], tDavisId]);

  // Aaliyah: Quiz (18/20), MidTerm (26/30), Final (44/50) -> Total = 88 (A)
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 18.00, 'scored', $3, 'manual')`, [assmtQuiz.rows[0].id, studentIds['stu.aaliyah'], tMillerId]);
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 26.00, 'scored', $3, 'manual')`, [assmtMidterm.rows[0].id, studentIds['stu.aaliyah'], tMillerId]);
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 44.00, 'scored', $3, 'manual')`, [assmtFinal.rows[0].id, studentIds['stu.aaliyah'], tMillerId]);
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 35.00, 'scored', $3, 'manual')`, [assmtPhyMid.rows[0].id, studentIds['stu.aaliyah'], tDavisId]);
  await client.query(`INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source) VALUES ($1, $2, 50.00, 'scored', $3, 'manual')`, [assmtPhyFinal.rows[0].id, studentIds['stu.aaliyah'], tDavisId]);

  // Teacher remarks
  await client.query(`
    INSERT INTO teacher_comments (student_id, term_id, teacher_id, comment)
    VALUES ($1, $2, $3, 'Demonstrates exceptional analytical mastery and deep problem-solving skills.')
  `, [studentIds['stu.sophia'], term1Id, tMillerId]);

  // Initial publication record (published for Section A)
  await client.query(`
    INSERT INTO term_result_publications (term_id, section_id, published_by, published_at, status)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'published')
  `, [term1Id, secAId, userIds['admin']]);

  // Initial audit log
  await client.query(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
    VALUES ($1, 'SYSTEM_INIT', 'SYSTEM', '1', '{"version":"1.0","environment":"Neon PostgreSQL"}', 'Initial IERMS Enterprise Setup and Reference Data Seeding')
  `, [userIds['admin']]);

  console.log('IERMS enterprise database seeding completed successfully.');
}
