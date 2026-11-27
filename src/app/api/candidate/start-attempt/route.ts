import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { parsePositiveInt, sendError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(['student', 'admin'])(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;
    const body = await request.json().catch(() => ({}));
    const examId = parsePositiveInt(body?.examId);

    if (!examId) {
      return NextResponse.json({ error: 'Valid exam ID is required.' }, { status: 400 });
    }

    let studentId = parsePositiveInt(body?.studentId);
    if (user?.role === 'student') {
      const s = await query('SELECT id FROM students WHERE user_id = $1', [user.id]);
      studentId = s.rows[0]?.id ?? null;
    }

    if (!studentId) {
      return NextResponse.json(
        { error: 'Valid student ID is required to start an attempt' },
        { status: 400 }
      );
    }

    const examRes = await query('SELECT * FROM exams WHERE id = $1', [examId]);
    if (examRes.rows.length === 0) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }
    const exam = examRes.rows[0];

    const now = new Date();
    if (new Date(exam.start_at) > now) {
      return NextResponse.json(
        { error: 'This examination access window has not opened yet' },
        { status: 400 }
      );
    }
    if (new Date(exam.end_at) < now) {
      return NextResponse.json(
        { error: 'This examination access window has already closed' },
        { status: 400 }
      );
    }

    const attemptsCountRes = await query(
      'SELECT COUNT(*) FROM exam_attempts WHERE exam_id = $1 AND student_id = $2',
      [examId, studentId]
    );
    const existingCount = parseInt(attemptsCountRes.rows[0].count, 10);
    if (existingCount >= exam.attempt_limit) {
      return NextResponse.json(
        { error: `Attempt limit of ${exam.attempt_limit} sitting(s) has been reached` },
        { status: 400 }
      );
    }

    const accRes = await query(
      "SELECT extra_time_minutes FROM student_accommodations WHERE student_id = $1 AND accommodation_type = 'extra_time'",
      [studentId]
    );
    const extraMinutes = accRes.rows[0] ? parseInt(accRes.rows[0].extra_time_minutes, 10) : 0;
    const totalDurationMinutes = exam.duration_minutes + extraMinutes;

    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + totalDurationMinutes * 60 * 1000);

    const newAttemptRes = await query(
      `INSERT INTO exam_attempts (exam_id, student_id, attempt_no, started_at, deadline_at, status)
       VALUES ($1, $2, $3, $4, $5, 'in_progress') RETURNING *`,
      [examId, studentId, existingCount + 1, startedAt, deadlineAt]
    );

    const attempt = newAttemptRes.rows[0];

    await query(
      `INSERT INTO exam_events (attempt_id, event_type, metadata)
       VALUES ($1, 'start', $2)`,
      [attempt.id, JSON.stringify({ startedAt, extraMinutes, duration: totalDurationMinutes })]
    );

    return NextResponse.json({
      attempt,
      totalDurationMinutes,
      extraMinutesGranted: extraMinutes,
    });
  } catch (err) {
    return sendError(err);
  }
}
