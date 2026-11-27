import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { query } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    
    if (auth instanceof NextResponse) {
      return auth; // Return error response
    }

    const { user } = auth;

    let extra: any = {};
    if (user.role === 'student') {
      const sRes = await query('SELECT * FROM students WHERE user_id = $1', [user.id]);
      extra.student = sRes.rows[0] || null;
    } else if (user.role === 'teacher') {
      const tRes = await query('SELECT * FROM teachers WHERE user_id = $1', [user.id]);
      extra.teacher = tRes.rows[0] || null;
    }

    const { password_hash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser, ...extra });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
