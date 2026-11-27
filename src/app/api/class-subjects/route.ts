import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { query } from '@/server/db';
import { sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const cs = await query(`
      SELECT cs.id, cs.class_id, cs.section_id, cs.subject_id, cs.academic_year_id,
             c.name as class_name, sec.section_name, sub.subject_code, sub.subject_name,
             sub.max_score, sub.pass_score, y.name as academic_year_name
      FROM class_subjects cs
      JOIN classes c ON cs.class_id = c.id
      JOIN sections sec ON cs.section_id = sec.id
      JOIN subjects sub ON cs.subject_id = sub.id
      JOIN academic_years y ON cs.academic_year_id = y.id
      ORDER BY c.grade_level, sec.section_name, sub.subject_name
    `);
    return NextResponse.json(cs.rows);
  } catch (err) {
    return sendError(err);
  }
}
