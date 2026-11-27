import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(['admin', 'teacher'])(request);
    if (auth instanceof NextResponse) return auth;

    const teachers = await query(`
      SELECT t.*, u.username
      FROM teachers t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.employee_no ASC
    `);
    return NextResponse.json(teachers.rows);
  } catch (err) {
    return sendError(err);
  }
}
