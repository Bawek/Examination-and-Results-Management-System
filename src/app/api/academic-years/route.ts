import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { query } from '@/server/db';
import { sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const yrs = await query('SELECT * FROM academic_years ORDER BY start_date DESC');
    return NextResponse.json(yrs.rows);
  } catch (err) {
    return sendError(err);
  }
}
