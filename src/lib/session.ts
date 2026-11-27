import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_SECRET = process.env.SESSION_SECRET || 'apex-ierms-super-secret-jwt-key-2024';
const secret = new TextEncoder().encode(SESSION_SECRET);

export interface Session {
  userId: number;
  userRole: string;
}

export async function getSession(request?: NextRequest): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ierms_session')?.value;
    
    if (!token) return null;

    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as Session;
  } catch (error) {
    return null;
  }
}

export async function saveSession(response: NextResponse, session: Session) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret);

  response.cookies.set('ierms_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60, // 8 hours
    path: '/',
  });

  return response;
}

export async function clearSession(response: NextResponse) {
  response.cookies.delete('ierms_session');
  return response;
}

export async function requireAuth(request: NextRequest) {
  const session = await getSession(request);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated. Please log in.' },
      { status: 401 }
    );
  }

  // Verify user is still active
  const { query } = await import('@/server/db');
  const result = await query(
    'SELECT * FROM users WHERE id = $1 AND status = $2',
    [session.userId, 'active']
  );

  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: 'Session expired or account deactivated.' },
      { status: 401 }
    );
  }

  return { session, user: result.rows[0] };
}

export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest) => {
    const auth = await requireAuth(request);
    
    if (auth instanceof NextResponse) {
      return auth; // Return error response
    }

    if (!allowedRoles.includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to perform this action.' },
        { status: 403 }
      );
    }

    return auth;
  };
}
