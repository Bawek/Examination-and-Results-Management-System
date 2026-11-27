import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { query } from '@/server/db';
import { calculateSectionResults } from '@/server/services/resultEngine';
import { parsePositiveInt, sendError } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ studentId: string; termId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;
    const { studentId: studentIdRaw, termId: termIdRaw } = await context.params;
    const studentId = parsePositiveInt(studentIdRaw);
    const termId = parsePositiveInt(termIdRaw);

    if (!studentId || !termId) {
      return NextResponse.json({ error: 'Invalid student or term ID.' }, { status: 400 });
    }

    // IDOR prevention: students can only view their own report card (IAM-08)
    if (user?.role === 'student') {
      const s = await query('SELECT id FROM students WHERE user_id = $1', [user.id]);
      if (!s.rows[0] || s.rows[0].id !== studentId) {
        return NextResponse.json(
          { error: 'Access denied: Cannot view another student academic records' },
          { status: 403 }
        );
      }
    } else if (!['admin', 'teacher', 'registrar'].includes(user?.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to view student report cards.' },
        { status: 403 }
      );
    }

    const sRes = await query('SELECT section_id FROM students WHERE id = $1', [studentId]);
    if (sRes.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    const sectionId = sRes.rows[0].section_id;

    // Publication gate (PUB-07)
    const pubRes = await query(
      `SELECT status FROM term_result_publications WHERE term_id = $1 AND section_id = $2`,
      [termId, sectionId]
    );
    const pubStatus = pubRes.rows[0]?.status;

    if (user?.role === 'student' && pubStatus !== 'published' && pubStatus !== 'locked') {
      return NextResponse.json(
        {
          error:
            'Term results for your section have not been published yet. Please contact the registrar.',
        },
        { status: 403 }
      );
    }

    const sectionSummaries = await calculateSectionResults(termId, sectionId);
    const studentSummary = sectionSummaries.find((s) => s.studentId === studentId);

    if (!studentSummary) {
      return NextResponse.json(
        { error: 'Student summary could not be calculated' },
        { status: 404 }
      );
    }

    const settingsRes = await query('SELECT * FROM school_settings LIMIT 1');
    const termRes = await query(
      `SELECT t.name as term_name, y.name as academic_year_name
       FROM terms t
       JOIN academic_years y ON t.academic_year_id = y.id
       WHERE t.id = $1`,
      [termId]
    );

    return NextResponse.json({
      school: settingsRes.rows[0] || {},
      academicPeriod: termRes.rows[0] || {},
      studentSummary,
      totalStudentsCount: sectionSummaries.length,
      isOfficialPublished: pubStatus === 'published' || pubStatus === 'locked',
    });
  } catch (err) {
    return sendError(err);
  }
}
