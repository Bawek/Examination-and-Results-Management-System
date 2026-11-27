import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { getClient, query } from '@/server/db';
import { HttpError, sendError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(['admin', 'teacher'])(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;
    const body = await request.json().catch(() => ({}));
    const { entries, submitForReview, reason } = body;

    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: 'Entries must be an array' }, { status: 400 });
    }

    // Closed / locked period enforcement
    if (entries.length > 0) {
      const firstAssessmentId = entries[0]?.assessmentId;
      const periodRes = await query(
        `SELECT t.status as term_status, p.status as pub_status
         FROM assessments a
         JOIN terms t ON a.term_id = t.id
         JOIN class_subjects cs ON a.class_subject_id = cs.id
         LEFT JOIN term_result_publications p ON p.term_id = t.id AND p.section_id = cs.section_id
         WHERE a.id = $1`,
        [firstAssessmentId]
      );

      const row = periodRes.rows[0];
      if (row?.term_status === 'closed' || row?.term_status === 'locked' || row?.pub_status === 'locked') {
        return NextResponse.json(
          {
            error: 'Cannot save marks for closed or locked terms. Please contact administrator.',
          },
          { status: 403 }
        );
      }
    }

    // Resolve teacher_id (marks.teacher_id references teachers.id, nullable for admin)
    const teacherRes = await query('SELECT id FROM teachers WHERE user_id = $1 LIMIT 1', [user?.id]);
    const teacherId: number | null = teacherRes.rows[0]?.id ?? null;

    const client = await getClient();
    try {
      await client.query('BEGIN');

      for (const item of entries) {
        const { assessmentId, studentId, score, markStatus } = item;

        if (score !== null && score !== undefined && score !== '') {
          const numScore = parseFloat(score);
          const aData = await client.query(
            'SELECT max_score, source_type FROM assessments WHERE id = $1',
            [assessmentId]
          );
          if (aData.rows.length === 0) {
            throw new HttpError(404, `Assessment ${assessmentId} not found.`);
          }
          const maxScore = parseFloat(aData.rows[0]?.max_score || 100);

          if (Number.isNaN(numScore) || numScore < 0 || numScore > maxScore) {
            throw new HttpError(
              400,
              `Score ${score} out of range (0 - ${maxScore}) for student ID ${studentId}`
            );
          }

          const existing = await client.query(
            'SELECT source, score FROM marks WHERE assessment_id = $1 AND student_id = $2',
            [assessmentId, studentId]
          );
          if (existing.rows[0]?.source === 'exam' && !item.isOverride) {
            await client.query('ROLLBACK');
            return NextResponse.json(
              {
                error:
                  'Mark is sourced from online exam. To overwrite, provide isOverride flag and reason for the change.',
                currentScore: existing.rows[0].score,
                requiresOverride: true,
              },
              { status: 403 }
            );
          }

          if (existing.rows[0]?.source === 'exam' && item.isOverride) {
            await client.query(
              `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
               VALUES ($1, 'MANUAL_OVERRIDE_EXAM_MARK', 'MARK', $2, $3, $4)`,
              [
                user?.id,
                `${assessmentId}_${studentId}`,
                JSON.stringify({
                  previousScore: existing.rows[0].score,
                  newScore: numScore,
                  studentId,
                  assessmentId,
                }),
                reason || 'Manual override of exam-sourced mark',
              ]
            );
          }

          await client.query(
            `INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source, updated_at)
             VALUES ($1, $2, $3, $4, $5, 'manual', CURRENT_TIMESTAMP)
             ON CONFLICT (assessment_id, student_id)
             DO UPDATE SET
               score = EXCLUDED.score,
               mark_status = EXCLUDED.mark_status,
               teacher_id = EXCLUDED.teacher_id,
               source = EXCLUDED.source,
               updated_at = CURRENT_TIMESTAMP`,
            [assessmentId, studentId, numScore, markStatus || 'scored', teacherId]
          );
        } else {
          await client.query(
            `INSERT INTO marks (assessment_id, student_id, score, mark_status, teacher_id, source, updated_at)
             VALUES ($1, $2, NULL, $3, $4, 'manual', CURRENT_TIMESTAMP)
             ON CONFLICT (assessment_id, student_id)
             DO UPDATE SET
               score = NULL,
               mark_status = EXCLUDED.mark_status,
               teacher_id = EXCLUDED.teacher_id,
               updated_at = CURRENT_TIMESTAMP`,
            [assessmentId, studentId, markStatus || 'incomplete', teacherId]
          );
        }
      }

      await client.query('COMMIT');

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
         VALUES ($1, $2, 'MARKS', 'BATCH', $3, $4)`,
        [
          user?.id,
          submitForReview ? 'SUBMIT_MARKS_REVIEW' : 'SAVE_MARKS_DRAFT',
          JSON.stringify({ count: entries.length, submitForReview }),
          reason ||
            (submitForReview ? 'Teacher submitted marks for approval' : 'Draft marks saved'),
        ]
      );

      return NextResponse.json({
        success: true,
        count: entries.length,
        submitted: !!submitForReview,
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    return sendError(err);
  }
}
