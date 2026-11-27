import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/server/db';
import bcrypt from 'bcryptjs';
import {
  saveSession,
  checkLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
  verifyOriginHeader,
} from '@/lib/session';
import { sendError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    if (!verifyOriginHeader(request)) {
      return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const username = typeof body?.username === 'string' ? body.username : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!username.trim() || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const limitResponse = checkLoginRateLimit(request, username);
    if (limitResponse) {
      return limitResponse;
    }

    const normalized = username.trim().toLowerCase();
    const result = await query(
      "SELECT * FROM users WHERE (LOWER(username) = $1 OR LOWER(email) = $1) AND status = 'active' LIMIT 1",
      [normalized]
    );

    if (result.rows.length === 0) {
      recordLoginFailure(request, username);
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    let passwordValid = false;
    const hash: string = user.password_hash || '';
    if (hash.startsWith('$2')) {
      passwordValid = await bcrypt.compare(password, hash);
    } else {
      passwordValid = password === hash;
      if (passwordValid) {
        const newHash = await bcrypt.hash(password, 12);
        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
      }
    }

    if (!passwordValid) {
      recordLoginFailure(request, username);
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    recordLoginSuccess(request, username);

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, reason)
       VALUES ($1, 'USER_LOGIN', 'USER', $2, 'Successful session login')`,
      [user.id, user.id.toString()]
    );

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
    });

    await saveSession(response, { userId: user.id, userRole: user.role }, request);

    return response;
  } catch (error) {
    return sendError(error);
  }
}
