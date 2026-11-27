import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { query } from '@/server/db';
import { sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const classes = await query('SELECT * FROM classes ORDER BY grade_level ASC');
    const sections = await query('SELECT * FROM sections ORDER BY section_name ASC');
    return NextResponse.json({ classes: classes.rows, sections: sections.rows });
  } catch (err) {
    return sendError(err);
  }
}
