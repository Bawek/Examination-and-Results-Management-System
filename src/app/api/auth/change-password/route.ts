import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/session';
import { query } from '@/server/db';
import { sendError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;
    const body = await request.json().catch(() => ({}));
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required.' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const currentHash = user.password_hash || '';
    let passwordValid = false;
    if (currentHash.startsWith('$2')) {
      passwordValid = await bcrypt.compare(currentPassword, currentHash);
    } else {
      passwordValid = currentPassword === currentHash;
    }

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect.' },
        { status: 401 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, reason)
       VALUES ($1, 'PASSWORD_CHANGE', 'USER', $2, 'User changed their password')`,
      [user.id, user.id.toString()]
    );

    return NextResponse.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    return sendError(err);
  }
}
