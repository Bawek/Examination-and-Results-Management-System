import { NextRequest, NextResponse } from 'next/server';
import { canAccessAttempt, requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { syncExamToAssessment } from '@/server/services/examSync';
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
    const reason = typeof body?.reason === 'string' ? body.reason : '';

    const attRes = await query(
      `SELECT ea.*, e.total_marks as exam_total_marks
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.id
       WHERE ea.id = $1`,
      [attemptId]
    );

    if (attRes.rows.length === 0) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }
    const attempt = attRes.rows[0];

    if (attempt.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Attempt has already been submitted or finalized' },
        { status: 400 }
      );
    }

    const questionsRes = await query(
      `SELECT q.id, q.type, eq.marks, q.answer_keys, q.rubric
       FROM exam_questions eq
       JOIN questions q ON eq.question_id = q.id
       WHERE eq.exam_id = $1`,
      [attempt.exam_id]
    );

    const answersRes = await query('SELECT * FROM student_answers WHERE attempt_id = $1', [
      attemptId,
    ]);
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
          const match =
            correctList.length === selectedList.length &&
            correctList.every((id) => selectedList.includes(id));
          if (match) awarded = maxMarks;
        } else {
          let correctSelected = 0;
          let incorrectSelected = 0;
          for (const s of selectedList) {
            if (correctList.includes(s)) correctSelected++;
            else incorrectSelected++;
          }
          const baseRatio = correctList.length > 0 ? correctSelected / correctList.length : 0;
          const penalty =
            correctList.length > 0 ? (incorrectSelected / correctList.length) * 0.5 : 0;
          awarded = Math.max(0, Math.round((baseRatio - penalty) * maxMarks * 100) / 100);
        }
      } else if (q.type === 'short_answer') {
        const accepted: string[] = (keys.acceptedAnswers || []).map((s: string) =>
          s.trim().toLowerCase()
        );
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

      if (studentAns) {
        await query(
          `UPDATE student_answers
           SET awarded_marks = $1, grading_status = $2
           WHERE id = $3`,
          [awarded, gradingStatus, studentAns.id]
        );
      } else {
        await query(
          `INSERT INTO student_answers (attempt_id, question_id, response_data, awarded_marks, grading_status)
           VALUES ($1, $2, '{}', $3, $4)`,
          [attemptId, q.id, awarded, gradingStatus]
        );
      }
    }

    const finalStatus = hasSubjective ? 'grading' : 'finalized';
    const examTotal = parseFloat(attempt.exam_total_marks) || 100.0;
    const percentage = Math.round((totalRawScore / examTotal) * 100 * 100) / 100;

    await query(
      `UPDATE exam_attempts
       SET status = $1, submitted_at = CURRENT_TIMESTAMP, raw_score = $2, percentage = $3, auto_graded = true
       WHERE id = $4`,
      [finalStatus, totalRawScore, percentage, attemptId]
    );

    await query(
      `INSERT INTO exam_events (attempt_id, event_type, metadata)
       VALUES ($1, 'submit', $2)`,
      [
        attemptId,
        JSON.stringify({
          reason: reason || 'Candidate submission',
          totalRawScore,
          hasSubjective,
        }),
      ]
    );

    if (finalStatus === 'finalized') {
      await syncExamToAssessment(attempt.exam_id);
    }

    return NextResponse.json({
      success: true,
      status: finalStatus,
      rawScore: totalRawScore,
      percentage,
      pendingManualGrading: hasSubjective,
      message: hasSubjective
        ? 'Objective items scored automatically. Essay/short answer items queued for instructor evaluation.'
        : 'Exam completed and evaluated successfully.',
    });
  } catch (err) {
    return sendError(err);
  }
}
