import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { syncExamToAssessment } from '@/server/services/examSync';
import { parsePositiveInt, sendError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(['admin', 'teacher'])(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;
    const body = await request.json().catch(() => ({}));
    const answerId = parsePositiveInt(body?.answerId);
    const awardedMarks = Number(body?.awardedMarks);
    const feedback = typeof body?.feedback === 'string' ? body.feedback : '';

    if (!answerId || Number.isNaN(awardedMarks) || awardedMarks < 0) {
      return NextResponse.json(
        { error: 'Valid answer ID and non-negative awarded marks are required.' },
        { status: 400 }
      );
    }

    const ansRes = await query(
      `SELECT sa.*, eq.marks as max_marks
       FROM student_answers sa
       JOIN exam_attempts ea ON sa.attempt_id = ea.id
       JOIN exam_questions eq ON eq.exam_id = ea.exam_id AND eq.question_id = sa.question_id
       WHERE sa.id = $1`,
      [answerId]
    );
    if (ansRes.rows.length === 0) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    }
    const answer = ansRes.rows[0];
    const maxMarks = parseFloat(answer.max_marks);
    if (awardedMarks > maxMarks) {
      return NextResponse.json(
        { error: `Awarded marks (${awardedMarks}) cannot exceed maximum (${maxMarks}).` },
        { status: 400 }
      );
    }

    await query(
      `UPDATE student_answers
       SET awarded_marks = $1, feedback = $2, grading_status = 'graded', grader_id = $3
       WHERE id = $4`,
      [awardedMarks, feedback, user?.id, answerId]
    );

    const allAnswersRes = await query(
      `SELECT awarded_marks, grading_status FROM student_answers WHERE attempt_id = $1`,
      [answer.attempt_id]
    );

    let sum = 0;
    let anyUngraded = false;
    for (const a of allAnswersRes.rows) {
      if (a.grading_status === 'ungraded') anyUngraded = true;
      if (a.awarded_marks !== null) sum += parseFloat(a.awarded_marks);
    }

    const attemptData = await query(
      `SELECT ea.*, e.total_marks FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.id WHERE ea.id = $1`,
      [answer.attempt_id]
    );
    const attempt = attemptData.rows[0];

    const examTotal = parseFloat(attempt.total_marks) || 100.0;
    const percentage = Math.round((sum / examTotal) * 100 * 100) / 100;
    const newStatus = anyUngraded ? 'grading' : 'finalized';

    await query(
      `UPDATE exam_attempts
       SET raw_score = $1, percentage = $2, status = $3
       WHERE id = $4`,
      [sum, percentage, newStatus, answer.attempt_id]
    );

    if (newStatus === 'finalized') {
      await syncExamToAssessment(attempt.exam_id, user?.id);
    }

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
       VALUES ($1, 'MANUAL_GRADE_ANSWER', 'STUDENT_ANSWER', $2, $3, 'Instructor evaluated subjective response')`,
      [user?.id, answerId.toString(), JSON.stringify({ awardedMarks, feedback })]
    );

    return NextResponse.json({
      success: true,
      attemptStatus: newStatus,
      totalScore: sum,
      percentage,
    });
  } catch (err) {
    return sendError(err);
  }
}
