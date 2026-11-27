import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { query } from '@/server/db';
import { parsePositiveInt, sendError } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    const examId = parsePositiveInt(id);
    if (!examId) {
      return NextResponse.json({ error: 'Invalid exam ID.' }, { status: 400 });
    }

    const { user } = auth;
    const isStaff = user?.role === 'admin' || user?.role === 'teacher';

    const examRes = await query(
      `SELECT e.*, sub.subject_name, sub.subject_code, c.name as class_name, sec.section_name,
              t.name as term_name
       FROM exams e
       JOIN class_subjects cs ON e.class_subject_id = cs.id
       JOIN subjects sub ON cs.subject_id = sub.id
       JOIN sections sec ON cs.section_id = sec.id
       JOIN classes c ON sec.class_id = c.id
       JOIN terms t ON e.term_id = t.id
       WHERE e.id = $1`,
      [examId]
    );

    if (examRes.rows.length === 0) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Answer keys only visible to admin/teacher
    const selectQuestions = isStaff
      ? 'q.id, q.type, q.prompt, eq.marks, q.options, q.answer_keys, q.rubric, q.explanation, eq.sort_order'
      : 'q.id, q.type, q.prompt, eq.marks, q.options, eq.sort_order';

    const qRes = await query(
      `SELECT ${selectQuestions}
       FROM exam_questions eq
       JOIN questions q ON eq.question_id = q.id
       WHERE eq.exam_id = $1
       ORDER BY eq.sort_order ASC, q.id ASC`,
      [examId]
    );

    return NextResponse.json({
      exam: examRes.rows[0],
      questions: qRes.rows,
    });
  } catch (err) {
    return sendError(err);
  }
}
