import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const subjects = await query('SELECT * FROM subjects ORDER BY subject_name ASC');
    return NextResponse.json(subjects.rows);
  } catch (err) {
    return sendError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(['admin'])(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json().catch(() => ({}));
    const { subject_code, subject_name, max_score, pass_score } = body;

    if (!subject_code || !subject_name) {
      return NextResponse.json(
        { error: 'Subject code and subject name are required.' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO subjects (subject_code, subject_name, max_score, pass_score) VALUES ($1, $2, $3, $4) RETURNING *',
      [subject_code, subject_name, max_score || 100, pass_score || 50]
    );
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return sendError(err);
  }
}
