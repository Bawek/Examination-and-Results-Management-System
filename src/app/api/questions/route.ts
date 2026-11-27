import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(['admin', 'teacher'])(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;
    const isStaff = user?.role === 'admin' || user?.role === 'teacher';

    // Anti-leakage: answer_keys only returned to authorized staff
    const selectFields = isStaff
      ? 'q.id, q.subject_id, q.category_id, q.type, q.prompt, q.marks, q.difficulty, q.status, q.version, q.options, q.answer_keys, q.rubric, q.explanation, q.created_at, sub.subject_name'
      : 'q.id, q.subject_id, q.category_id, q.type, q.prompt, q.marks, q.difficulty, q.status, q.version, q.options, q.created_at, sub.subject_name';

    const qRes = await query(`
      SELECT ${selectFields}
      FROM questions q
      JOIN subjects sub ON q.subject_id = sub.id
      ORDER BY q.id DESC
    `);

    return NextResponse.json(qRes.rows);
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
      subject_id,
      category_id,
      type,
      prompt,
      marks,
      difficulty,
      options,
      answer_keys,
      rubric,
      explanation,
    } = body;

    if (!subject_id || !type || !prompt) {
      return NextResponse.json(
        { error: 'Subject, question type, and prompt are required.' },
        { status: 400 }
      );
    }

    const resQ = await query(
      `INSERT INTO questions (subject_id, category_id, type, prompt, marks, difficulty, status, version, options, answer_keys, rubric, explanation, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'published', 1, $7, $8, $9, $10, $11) RETURNING *`,
      [
        subject_id,
        category_id || null,
        type,
        prompt,
        marks || 1.0,
        difficulty || 'medium',
        JSON.stringify(options || []),
        JSON.stringify(answer_keys || {}),
        JSON.stringify(rubric || {}),
        explanation || '',
        user?.id,
      ]
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
       VALUES ($1, 'CREATE_QUESTION', 'QUESTION', $2, $3, 'Created new question bank item')`,
      [user?.id, resQ.rows[0].id.toString(), JSON.stringify({ type, marks })]
    );

    return NextResponse.json(resQ.rows[0]);
  } catch (err) {
    return sendError(err);
  }
}
