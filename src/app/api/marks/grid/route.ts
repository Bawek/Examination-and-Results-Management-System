import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { parsePositiveInt, sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(['admin', 'teacher', 'registrar'])(request);
    if (auth instanceof NextResponse) return auth;

    const classSubjectId = parsePositiveInt(request.nextUrl.searchParams.get('classSubjectId'));
    const termId = parsePositiveInt(request.nextUrl.searchParams.get('termId'));

    if (!classSubjectId || !termId) {
      return NextResponse.json(
        { error: 'classSubjectId and termId are required' },
        { status: 400 }
      );
    }

    const csRes = await query(
      `SELECT cs.*, sub.subject_name, sub.subject_code, c.name as class_name, sec.section_name,
              sec.id as section_id
       FROM class_subjects cs
       JOIN subjects sub ON cs.subject_id = sub.id
       JOIN sections sec ON cs.section_id = sec.id
       JOIN classes c ON sec.class_id = c.id
       WHERE cs.id = $1`,
      [classSubjectId]
    );

    if (csRes.rows.length === 0) {
      return NextResponse.json({ error: 'Class subject not found' }, { status: 404 });
    }
    const classSubject = csRes.rows[0];

    const pubRes = await query(
      `SELECT status FROM term_result_publications WHERE term_id = $1 AND section_id = $2`,
      [termId, classSubject.section_id]
    );
    const publicationStatus = pubRes.rows[0]?.status || 'draft';

    const assmtsRes = await query(
      `SELECT * FROM assessments WHERE class_subject_id = $1 AND term_id = $2 ORDER BY id ASC`,
      [classSubjectId, termId]
    );

    const studentsRes = await query(
      `SELECT s.id, s.admission_no, s.first_name, s.last_name, s.gender
       FROM students s
       JOIN enrollments e ON s.id = e.student_id
       WHERE s.section_id = $1 AND e.status = 'active'
       ORDER BY s.admission_no ASC`,
      [classSubject.section_id]
    );

    const marksRes = await query(
      `SELECT m.* FROM marks m
       JOIN assessments a ON m.assessment_id = a.id
       WHERE a.class_subject_id = $1 AND a.term_id = $2`,
      [classSubjectId, termId]
    );

    const marksMap: Record<string, any> = {};
    for (const m of marksRes.rows) {
      marksMap[`${m.assessment_id}_${m.student_id}`] = m;
    }

    return NextResponse.json({
      classSubject,
      publicationStatus,
      isLocked: publicationStatus === 'locked',
      assessments: assmtsRes.rows,
      students: studentsRes.rows,
      marksMap,
    });
  } catch (err) {
    return sendError(err);
  }
}
