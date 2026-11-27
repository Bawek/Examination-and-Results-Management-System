import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { calculateSectionResults } from '@/server/services/resultEngine';
import { parsePositiveInt, sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(['admin', 'teacher', 'registrar'])(request);
    if (auth instanceof NextResponse) return auth;

    const termId = parsePositiveInt(request.nextUrl.searchParams.get('termId'));
    const sectionId = parsePositiveInt(request.nextUrl.searchParams.get('sectionId'));

    if (!termId || !sectionId) {
      return NextResponse.json(
        { error: 'termId and sectionId are required' },
        { status: 400 }
      );
    }

    const summaries = await calculateSectionResults(termId, sectionId);

    const pubRes = await query(
      `SELECT p.*, u.full_name as publisher_name
       FROM term_result_publications p
       LEFT JOIN users u ON p.published_by = u.id
       WHERE p.term_id = $1 AND p.section_id = $2`,
      [termId, sectionId]
    );

    const publication = pubRes.rows[0] || { status: 'draft' };

    return NextResponse.json({
      summaries,
      publication,
    });
  } catch (err) {
    return sendError(err);
  }
}
