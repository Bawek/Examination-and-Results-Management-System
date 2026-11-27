import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { parsePositiveInt, sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(['student', 'admin'])(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;
    let studentId: number | null = null;

    if (user?.role === 'student') {
      const s = await query('SELECT id FROM students WHERE user_id = $1', [user.id]);
      if (s.rows[0]) studentId = s.rows[0].id;
    } else {
      const paramId = parsePositiveInt(request.nextUrl.searchParams.get('studentId'));
      studentId = paramId;
    }

    const examsRes = await query(
      `SELECT e.id, e.title, e.instructions, e.duration_minutes, e.start_at, e.end_at,
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
       ORDER BY e.start_at ASC`,
      [studentId || 0]
    );

    return NextResponse.json(examsRes.rows);
  } catch (err) {
    return sendError(err);
  }
}
