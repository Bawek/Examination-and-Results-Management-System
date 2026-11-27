import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/server/db';
import bcrypt from 'bcryptjs';
import { getSession, saveSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const result = await query(
      "SELECT * FROM users WHERE (username = $1 OR email = $1) AND status = 'active' LIMIT 1",
      [username.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Support both bcrypt hashes and legacy plain-text passwords
    let passwordValid = false;
    const hash: string = user.password_hash || '';
    if (hash.startsWith('$2')) {
      passwordValid = await bcrypt.compare(password, hash);
    } else {
      // Legacy plain-text comparison (dev seed data)
      passwordValid = (password === hash);
      if (passwordValid) {
        // Upgrade to bcrypt hash on first login
        const newHash = await bcrypt.hash(password, 12);
        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
      }
    }

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, reason)
       VALUES ($1, 'USER_LOGIN', 'USER', $2, 'Successful session login')`,
      [user.id, user.id.toString()]
    );

    // Create session
    const session = { userId: user.id, userRole: user.role };
    const response = NextResponse.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role, 
        full_name: user.full_name 
      },
      token: 'session-based-auth' // For compatibility with frontend
    });

    await saveSession(response, session);
    
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
