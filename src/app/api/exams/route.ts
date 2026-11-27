import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(['admin', 'teacher', 'invigilator'])(request);
    if (auth instanceof NextResponse) return auth;

    const exams = await query(`
      SELECT e.*, sub.subject_name, sub.subject_code, c.name as class_name, sec.section_name,
             t.name as term_name, u.full_name as author_name,
             (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = e.id) as question_count,
             (SELECT COUNT(*) FROM exam_attempts ea WHERE ea.exam_id = e.id) as attempt_count
      FROM exams e
      JOIN class_subjects cs ON e.class_subject_id = cs.id
      JOIN subjects sub ON cs.subject_id = sub.id
      JOIN sections sec ON cs.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      JOIN terms t ON e.term_id = t.id
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.start_at DESC
    `);
    return NextResponse.json(exams.rows);
  } catch (err) {
    return sendError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(['admin', 'teacher'])(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;
    const body = await request.json().catch(() => ({}));
    const {
      class_subject_id,
      term_id,
      title,
      instructions,
      duration_minutes,
      start_at,
      end_at,
      attempt_limit,
      counted_attempt_rule,
      navigation_policy,
      show_feedback_policy,
      question_ids,
    } = body;

    if (!class_subject_id || !term_id || !title || !start_at || !end_at) {
      return NextResponse.json(
        { error: 'Class subject, term, title, start time, and end time are required.' },
        { status: 400 }
      );
    }

    // Answer key validation (QBK-09) - validate all questions have valid answer keys
    if (Array.isArray(question_ids) && question_ids.length > 0) {
      const questionsWithoutKeys: number[] = [];
      for (const qId of question_ids) {
        const qData = await query('SELECT type, answer_keys, rubric FROM questions WHERE id = $1', [qId]);
        const question = qData.rows[0];

        if (!question) {
          return NextResponse.json(
            { error: `Question with ID ${qId} not found` },
            { status: 404 }
          );
        }

        if (['single_choice', 'multiple_select', 'true_false'].includes(question.type)) {
          if (!question.answer_keys || Object.keys(question.answer_keys).length === 0) {
            questionsWithoutKeys.push(qId);
          }
        } else if (['essay', 'short_answer'].includes(question.type)) {
          if (!question.rubric || Object.keys(question.rubric).length === 0) {
            questionsWithoutKeys.push(qId);
          }
        }
      }

      if (questionsWithoutKeys.length > 0) {
        return NextResponse.json(
          {
            error: `Cannot publish exam: ${questionsWithoutKeys.length} question(s) missing answer keys or rubrics. Question IDs: ${questionsWithoutKeys.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    const exRes = await query(
      `INSERT INTO exams (
        class_subject_id, term_id, title, instructions, duration_minutes,
        start_at, end_at, attempt_limit, counted_attempt_rule, status,
        navigation_policy, show_feedback_policy, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published', $10, $11, $12)
      RETURNING *`,
      [
        class_subject_id,
        term_id,
        title,
        instructions || '',
        duration_minutes || 60,
        start_at,
        end_at,
        attempt_limit || 1,
        counted_attempt_rule || 'highest',
        navigation_policy || 'free',
        show_feedback_policy || 'after_release',
        user?.id,
      ]
    );

    const examId = exRes.rows[0].id;
    let totalMarks = 0;

    if (Array.isArray(question_ids)) {
      for (let i = 0; i < question_ids.length; i++) {
        const qId = question_ids[i];
        const qData = await query('SELECT marks FROM questions WHERE id = $1', [qId]);
        const qMarks = qData.rows[0] ? parseFloat(qData.rows[0].marks) : 5.0;
        totalMarks += qMarks;

        await query(
          'INSERT INTO exam_questions (exam_id, question_id, marks, sort_order) VALUES ($1, $2, $3, $4)',
          [examId, qId, qMarks, i + 1]
        );
      }
    }

    await query('UPDATE exams SET total_marks = $1 WHERE id = $2', [totalMarks, examId]);

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
       VALUES ($1, 'CREATE_EXAM', 'EXAM', $2, $3, 'Created and published new examination')`,
      [user?.id, examId.toString(), JSON.stringify({ title, totalMarks, duration_minutes })]
    );

    return NextResponse.json({ ...exRes.rows[0], total_marks: totalMarks });
  } catch (err) {
    return sendError(err);
  }
}
