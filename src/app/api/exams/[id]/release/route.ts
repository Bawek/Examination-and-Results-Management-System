import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { parsePositiveInt, sendError } from '@/lib/api-utils';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin', 'teacher'])(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;
    const { id } = await context.params;
    const examId = parsePositiveInt(id);
    if (!examId) {
      return NextResponse.json({ error: 'Invalid exam ID.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const forceOverride = Boolean(body?.forceOverride);
    const reason = typeof body?.reason === 'string' ? body.reason : '';

    // Verify all manual grading complete (GRD-06)
    const ungradedCheck = await query(
      `SELECT COUNT(*) FROM student_answers sa
       JOIN exam_attempts ea ON sa.attempt_id = ea.id
       WHERE ea.exam_id = $1 AND sa.grading_status = 'ungraded'`,
      [examId]
    );

    const ungradedCount = parseInt(ungradedCheck.rows[0].count, 10);
    if (ungradedCount > 0 && !forceOverride) {
      return NextResponse.json(
        {
          error: `Cannot release exam results: ${ungradedCount} subjective answers are still pending grading in the queue. Complete grading or provide authorized override.`,
        },
        { status: 400 }
      );
    }

    await query(`UPDATE exams SET status = 'results_released' WHERE id = $1`, [examId]);

    await query(
      `INSERT INTO exam_result_releases (exam_id, published_by, status)
       VALUES ($1, $2, 'released')`,
      [examId, user?.id]
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
       VALUES ($1, 'RELEASE_EXAM_RESULTS', 'EXAM', $2, $3, $4)`,
      [
        user?.id,
        examId.toString(),
        JSON.stringify({ ungradedCount }),
        reason || 'Candidate results authorized for viewing',
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Exam results released to candidates successfully',
    });
  } catch (err) {
    return sendError(err);
  }
}
