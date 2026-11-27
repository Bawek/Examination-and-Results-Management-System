import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { syncExamToAssessment } from '@/server/services/examSync';
import { parsePositiveInt, sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(['admin', 'teacher', 'registrar'])(request);
    if (auth instanceof NextResponse) return auth;

    const classSubjectId = parsePositiveInt(request.nextUrl.searchParams.get('classSubjectId'));
    const termId = parsePositiveInt(request.nextUrl.searchParams.get('termId'));

    let sql = `
      SELECT a.*, cs.subject_id, sub.subject_name, sub.subject_code,
             e.title as exam_title, e.total_marks as exam_total_marks
      FROM assessments a
      JOIN class_subjects cs ON a.class_subject_id = cs.id
      JOIN subjects sub ON cs.subject_id = sub.id
      LEFT JOIN exams e ON a.exam_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (classSubjectId) {
      params.push(classSubjectId);
      sql += ` AND a.class_subject_id = $${params.length}`;
    }
    if (termId) {
      params.push(termId);
      sql += ` AND a.term_id = $${params.length}`;
    }
    sql += ' ORDER BY a.id ASC';

    const assmts = await query(sql, params);
    return NextResponse.json(assmts.rows);
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
      name,
      max_score,
      weight,
      due_date,
      source_type,
      exam_id,
    } = body;

    if (!class_subject_id || !term_id || !name || weight === undefined) {
      return NextResponse.json(
        { error: 'Class subject, term, name, and weight are required.' },
        { status: 400 }
      );
    }

    // Closed period enforcement (ACD-10)
    const termRes = await query('SELECT status FROM terms WHERE id = $1', [term_id]);
    if (termRes.rows[0]?.status === 'closed' || termRes.rows[0]?.status === 'locked') {
      return NextResponse.json(
        { error: 'Cannot create assessments for closed or locked terms. Please contact administrator.' },
        { status: 403 }
      );
    }

    // Weight sum validation (ACD-08, RES-02)
    const existingWeightsRes = await query(
      `SELECT SUM(weight) as total_weight FROM assessments
       WHERE class_subject_id = $1 AND term_id = $2`,
      [class_subject_id, term_id]
    );

    const existingSum = parseFloat(existingWeightsRes.rows[0].total_weight || '0');
    const newWeight = parseFloat(weight);
    if (Number.isNaN(newWeight) || newWeight <= 0 || existingSum + newWeight > 100.0) {
      return NextResponse.json(
        {
          error: `Assessment weights must be positive and cannot exceed 100% (Current sum: ${existingSum}%, Added: ${newWeight}%)`,
        },
        { status: 400 }
      );
    }

    const aRes = await query(
      `INSERT INTO assessments (class_subject_id, term_id, name, max_score, weight, due_date, source_type, exam_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        class_subject_id,
        term_id,
        name,
        max_score || 100,
        newWeight,
        due_date || null,
        source_type || 'manual',
        exam_id || null,
      ]
    );

    if (source_type === 'online_exam' && exam_id) {
      await syncExamToAssessment(exam_id, user?.id);
    }

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
       VALUES ($1, 'CREATE_ASSESSMENT', 'ASSESSMENT', $2, $3, 'Configured assessment component')`,
      [user?.id, aRes.rows[0].id.toString(), JSON.stringify(body)]
    );

    return NextResponse.json(aRes.rows[0]);
  } catch (err) {
    return sendError(err);
  }
}
