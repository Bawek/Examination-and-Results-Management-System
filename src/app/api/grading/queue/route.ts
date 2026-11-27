import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(['admin', 'teacher'])(request);
    if (auth instanceof NextResponse) return auth;

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

    return NextResponse.json(queue.rows);
  } catch (err) {
    return sendError(err);
  }
}
