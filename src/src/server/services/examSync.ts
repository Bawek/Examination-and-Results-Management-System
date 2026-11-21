import { query } from '../db.ts';

export async function syncExamToAssessment(examId: number, actorUserId?: number) {
  // 1. Find assessments linked to this exam
  const assmtsRes = await query(`
    SELECT a.id, a.name, a.max_score, a.class_subject_id, a.term_id,
           e.total_marks, e.counted_attempt_rule, e.title as exam_title
    FROM assessments a
    JOIN exams e ON a.exam_id = e.id
    WHERE a.exam_id = $1
  `, [examId]);

  if (assmtsRes.rows.length === 0) {
    return { synced: 0, message: 'No linked assessments found for this exam' };
  }

  const assessment = assmtsRes.rows[0];
  const examTotal = parseFloat(assessment.total_marks) || 100.0;
  const assmtMax = parseFloat(assessment.max_score) || 100.0;
  const countedRule = assessment.counted_attempt_rule || 'highest';

  // 2. Fetch all completed/finalized attempts grouped by student
  const attemptsRes = await query(`
    SELECT id, student_id, attempt_no, raw_score, percentage, status
    FROM exam_attempts
    WHERE exam_id = $1 AND status IN ('finalized', 'submitted', 'auto_submitted', 'absent', 'excused', 'invalidated')
    ORDER BY student_id, attempt_no ASC
  `, [examId]);

  // Group by student
  const attemptsByStudent = new Map<number, any[]>();
  for (const row of attemptsRes.rows) {
    if (!attemptsByStudent.has(row.student_id)) {
      attemptsByStudent.set(row.student_id, []);
    }
    attemptsByStudent.get(row.student_id)!.push(row);
  }

  let count = 0;

  for (const [studentId, attempts] of attemptsByStudent.entries()) {
    let chosenAttempt: any = null;
    let computedScore: number | null = null;
    let markStatus = 'scored';

    // Find valid scored attempts
    const scoredAttempts = attempts.filter(a => a.raw_score !== null && a.status !== 'invalidated');

    if (scoredAttempts.length > 0) {
      if (countedRule === 'latest') {
        chosenAttempt = scoredAttempts[scoredAttempts.length - 1];
        computedScore = parseFloat(chosenAttempt.raw_score);
      } else if (countedRule === 'average') {
        chosenAttempt = scoredAttempts[scoredAttempts.length - 1]; // link to latest for reference
        const sum = scoredAttempts.reduce((acc, curr) => acc + parseFloat(curr.raw_score), 0);
        computedScore = sum / scoredAttempts.length;
      } else {
        // default: highest
        scoredAttempts.sort((a, b) => parseFloat(b.raw_score) - parseFloat(a.raw_score));
        chosenAttempt = scoredAttempts[0];
        computedScore = parseFloat(chosenAttempt.raw_score);
      }
    } else {
      // Check for non-scored special statuses
      const lastAtt = attempts[attempts.length - 1];
      chosenAttempt = lastAtt;
      if (lastAtt.status === 'absent') markStatus = 'absent';
      else if (lastAtt.status === 'excused') markStatus = 'excused';
      else if (lastAtt.status === 'invalidated') markStatus = 'invalidated';
      else markStatus = 'pending_review';
    }

    // Scale score to assessment max score: (score / examTotal) * assmtMax
    const scaledScore = computedScore !== null
      ? Math.round(((computedScore / examTotal) * assmtMax) * 100) / 100
      : null;

    // Upsert into marks table
    await query(`
      INSERT INTO marks (assessment_id, student_id, score, mark_status, source, exam_attempt_id, updated_at)
      VALUES ($1, $2, $3, $4, 'exam', $5, CURRENT_TIMESTAMP)
      ON CONFLICT (assessment_id, student_id)
      DO UPDATE SET
        score = EXCLUDED.score,
        mark_status = EXCLUDED.mark_status,
        source = 'exam',
        exam_attempt_id = EXCLUDED.exam_attempt_id,
        updated_at = CURRENT_TIMESTAMP
    `, [assessment.id, studentId, scaledScore, markStatus, chosenAttempt?.id || null]);

    count++;
  }

  // Audit log entry
  await query(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
    VALUES ($1, 'EXAM_TO_MARKS_SYNC', 'ASSESSMENT', $2, $3, 'Automated exam-to-marks synchronization per IERMS specification')
  `, [
    actorUserId || null,
    assessment.id.toString(),
    JSON.stringify({ examId, examTitle: assessment.exam_title, syncedCount: count, countedRule })
  ]);

  return { synced: count, message: `Successfully synchronized ${count} student marks from exam to assessment` };
}
