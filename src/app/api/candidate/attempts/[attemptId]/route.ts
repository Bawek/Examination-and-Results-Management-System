import { NextRequest, NextResponse } from 'next/server';
import { canAccessAttempt, requireAuth } from '@/lib/session';
import { query } from '@/server/db';
import { parsePositiveInt, sendError } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { attemptId: attemptIdRaw } = await context.params;
    const attemptId = parsePositiveInt(attemptIdRaw);
    if (!attemptId) {
      return NextResponse.json({ error: 'Invalid attempt ID.' }, { status: 400 });
    }

    if (!(await canAccessAttempt(auth.user, attemptIdRaw))) {
      return NextResponse.json(
        { error: 'Access denied: this attempt does not belong to you.' },
        { status: 403 }
      );
    }

    const attRes = await query(
      `SELECT ea.*, e.title as exam_title, e.instructions, e.total_marks as exam_total,
              e.navigation_policy, s.first_name, s.last_name, s.admission_no
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.id
       JOIN students s ON ea.student_id = s.id
       WHERE ea.id = $1`,
      [attemptId]
    );

    if (attRes.rows.length === 0) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }
    const attempt = attRes.rows[0];

    // Fetch questions WITHOUT answer keys (QBK-10)
    const questionsRes = await query(
      `SELECT q.id, q.type, q.prompt, eq.marks, q.options, eq.sort_order
       FROM exam_questions eq
       JOIN questions q ON eq.question_id = q.id
       WHERE eq.exam_id = $1
       ORDER BY eq.sort_order ASC`,
      [attempt.exam_id]
    );

    const answersRes = await query(
      `SELECT question_id, response_data, saved_at
       FROM student_answers
       WHERE attempt_id = $1`,
      [attemptId]
    );

    return NextResponse.json({
      attempt,
      serverTime: new Date().toISOString(),
      questions: questionsRes.rows,
      savedAnswers: answersRes.rows,
    });
  } catch (err) {
    return sendError(err);
  }
}
