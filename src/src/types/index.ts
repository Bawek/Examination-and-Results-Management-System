export type Role = 'admin' | 'teacher' | 'student' | 'registrar' | 'invigilator';

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  full_name: string;
  status: string;
  last_login?: string;
}

export interface Student {
  id: number;
  user_id?: number;
  admission_no: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth?: string;
  guardian_name?: string;
  guardian_phone?: string;
  contact_email?: string;
  class_id: number;
  section_id: number;
  class_name?: string;
  section_name?: string;
  status: string;
  accommodation_extra_time?: number;
}

export interface Teacher {
  id: number;
  user_id?: number;
  username?: string;
  employee_no: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
}

export interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Term {
  id: number;
  academic_year_id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: 'open' | 'closed' | 'locked';
  academic_year_name?: string;
}

export interface SchoolClass {
  id: number;
  name: string;
  grade_level: number;
  description?: string;
}

export interface Section {
  id: number;
  class_id: number;
  section_name: string;
}

export interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
  max_score: number;
  pass_score: number;
  status: string;
}

export interface ClassSubject {
  id: number;
  class_id: number;
  section_id: number;
  subject_id: number;
  academic_year_id: number;
  class_name: string;
  section_name: string;
  subject_code: string;
  subject_name: string;
  max_score: number;
  pass_score: number;
  academic_year_name?: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: number;
  subject_id: number;
  subject_name?: string;
  category_id?: number;
  type: 'single_choice' | 'multiple_select' | 'true_false' | 'short_answer' | 'essay';
  prompt: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: string;
  version: number;
  options?: QuestionOption[];
  answer_keys?: any;
  rubric?: any;
  explanation?: string;
  created_at: string;
}

export interface Exam {
  id: number;
  class_subject_id: number;
  term_id: number;
  title: string;
  instructions?: string;
  duration_minutes: number;
  start_at: string;
  end_at: string;
  attempt_limit: number;
  counted_attempt_rule: 'highest' | 'latest' | 'average';
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'closed' | 'results_released';
  navigation_policy: 'free' | 'locked';
  show_feedback_policy: 'immediate' | 'after_close' | 'after_release';
  access_code?: string;
  randomize_questions?: boolean;
  randomize_options?: boolean;
  total_marks: number;
  pass_threshold: number;
  subject_name?: string;
  subject_code?: string;
  class_name?: string;
  section_name?: string;
  term_name?: string;
  author_name?: string;
  question_count?: number;
  attempt_count?: number;
  my_attempt_count?: number;
  my_attempts?: any[];
}

export interface ExamAttempt {
  id: number;
  exam_id: number;
  student_id: number;
  attempt_no: number;
  started_at: string;
  deadline_at: string;
  submitted_at?: string;
  status: 'in_progress' | 'submitted' | 'auto_submitted' | 'grading' | 'finalized' | 'absent' | 'excused' | 'invalidated';
  raw_score?: number;
  percentage?: number;
  feedback?: string;
  auto_graded?: boolean;
  exam_title?: string;
  instructions?: string;
  exam_total?: number;
  navigation_policy?: string;
  first_name?: string;
  last_name?: string;
  admission_no?: string;
}

export interface Assessment {
  id: number;
  class_subject_id: number;
  term_id: number;
  name: string;
  max_score: number;
  weight: number;
  due_date?: string;
  source_type: 'manual' | 'online_exam';
  exam_id?: number;
  subject_name?: string;
  subject_code?: string;
  exam_title?: string;
  exam_total_marks?: number;
}

export interface Mark {
  id: number;
  assessment_id: number;
  student_id: number;
  score: number | null;
  mark_status: 'scored' | 'absent' | 'excused' | 'exempt' | 'incomplete' | 'invalidated' | 'pending_review';
  teacher_id?: number;
  source: 'manual' | 'exam';
  exam_attempt_id?: number;
  updated_at: string;
}

export interface GradingScale {
  id: number;
  name: string;
  grade: string;
  min_score: number;
  max_score: number;
  grade_point: number;
  is_pass: boolean;
  remarks?: string;
}

export interface SchoolSettings {
  id: number;
  institution_name: string;
  logo_url?: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  timezone: string;
  pass_percentage: number;
  rounding_decimals: number;
  ranking_enabled: boolean;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  username?: string;
  full_name?: string;
  role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  reason?: string;
  ip_address?: string;
  created_at: string;
}
