import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { query } from '@/server/db';
import { sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const terms = await query(`
      SELECT t.*, y.name as academic_year_name
      FROM terms t
      JOIN academic_years y ON t.academic_year_id = y.id
      ORDER BY t.start_date ASC
    `);
    return NextResponse.json(terms.rows);
  } catch (err) {
    return sendError(err);
  }
}
