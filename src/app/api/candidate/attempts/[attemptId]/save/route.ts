import { NextRequest, NextResponse } from 'next/server';
import { canAccessAttempt, requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { parsePositiveInt, sendError } from '@/lib/api-utils';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const auth = await requireRole(['student', 'admin'])(request);
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

    const body = await request.json().catch(() => ({}));
    const questionId = parsePositiveInt(body?.questionId);
    const responseData = body?.responseData;

    if (!questionId) {
      return NextResponse.json({ error: 'Valid question ID is required.' }, { status: 400 });
    }

    const attRes = await query('SELECT status, deadline_at FROM exam_attempts WHERE id = $1', [
      attemptId,
    ]);
    if (attRes.rows.length === 0) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }
    const attempt = attRes.rows[0];

    if (attempt.status !== 'in_progress') {
      return NextResponse.json(
        { error: `Cannot save: attempt is currently in '${attempt.status}' state` },
        { status: 400 }
      );
    }

    if (new Date() > new Date(attempt.deadline_at)) {
      await query(
        "UPDATE exam_attempts SET status = 'auto_submitted', submitted_at = CURRENT_TIMESTAMP WHERE id = $1",
        [attemptId]
      );
      return NextResponse.json(
        { error: 'Server deadline expired. Attempt auto-submitted.' },
        { status: 403 }
      );
    }

    await query(
      `INSERT INTO student_answers (attempt_id, question_id, response_data, saved_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (attempt_id, question_id)
       DO UPDATE SET response_data = EXCLUDED.response_data, saved_at = CURRENT_TIMESTAMP`,
      [attemptId, questionId, JSON.stringify(responseData ?? {})]
    );

    await query(
      `INSERT INTO exam_events (attempt_id, event_type, metadata)
       VALUES ($1, 'save', $2)`,
      [attemptId, JSON.stringify({ questionId, timestamp: new Date() })]
    );

    return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
  } catch (err) {
    return sendError(err);
  }
}
