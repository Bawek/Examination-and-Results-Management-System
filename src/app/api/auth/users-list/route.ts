import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(['admin'])(request);
    if (auth instanceof NextResponse) return auth;

    const users = await query(
      'SELECT id, username, email, role, full_name, status, last_login FROM users ORDER BY id ASC'
    );
    return NextResponse.json(users.rows);
  } catch (err) {
    return sendError(err);
  }
}
