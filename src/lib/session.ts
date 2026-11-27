import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'ierms_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours

const globalForAuth = globalThis as unknown as {
  __iermsRuntimeSecret?: string;
  __iermsLoginAttempts?: Map<string, { count: number; lastAttempt: number }>;
  __iermsIpWindow?: Map<string, { count: number; windowStart: number }>;
};

function getSessionSecretString(): string {
  const envSecret = process.env.SESSION_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }
  if (!globalForAuth.__iermsRuntimeSecret) {
    globalForAuth.__iermsRuntimeSecret = crypto.randomBytes(32).toString('hex');
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[security] SESSION_SECRET is not set; using an ephemeral runtime secret. Sessions will reset on restart.'
      );
    }
  }
  return globalForAuth.__iermsRuntimeSecret;
}

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(getSessionSecretString());
}

export interface Session {
  userId: number;
  userRole: string;
  sid: string;
}

function isHttpsRequest(request?: NextRequest): boolean {
  if (process.env.COOKIE_SECURE === 'true') return true;
  if (!request) return process.env.NODE_ENV === 'production';
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0].trim().toLowerCase() === 'https';
  }
  return request.url.startsWith('https://');
}

function buildSessionCookieHeader(token: string, maxAge: number, https: boolean): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
  ];
  if (https) {
    parts.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }
  return parts.join('; ');
}

export async function getSession(request?: NextRequest): Promise<Session | null> {
  try {
    let token: string | undefined;
    if (request) {
      token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    }
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    }

    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== 'number' || typeof payload.userRole !== 'string') {
      return null;
    }
    return {
      userId: payload.userId,
      userRole: payload.userRole,
      sid: typeof payload.sid === 'string' ? payload.sid : String(payload.userId),
    };
  } catch {
    return null;
  }
}

export async function saveSession(
  response: NextResponse,
  sessionInput: { userId: number; userRole: string },
  request?: NextRequest
) {
  const session: Session = {
    userId: sessionInput.userId,
    userRole: sessionInput.userRole,
    sid: crypto.randomUUID(),
  };

  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecretKey());

  const https = isHttpsRequest(request);
  response.headers.append('Set-Cookie', buildSessionCookieHeader(token, SESSION_TTL_SECONDS, https));
  return response;
}

export async function clearSession(response: NextResponse, request?: NextRequest) {
  const https = isHttpsRequest(request);
  response.headers.append('Set-Cookie', buildSessionCookieHeader('', 0, https));
  return response;
}

export function getCsrfTokenForSession(session: Session): string {
  return crypto
    .createHmac('sha256', getSessionSecretString())
    .update(`csrf:${session.sid}:${session.userId}`)
    .digest('hex');
}

export function verifyOriginHeader(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Same-origin or non-browser client without Origin header
  try {
    const parsedOrigin = new URL(origin);
    const originHost = parsedOrigin.host.toLowerCase();
    const originHostname = parsedOrigin.hostname.toLowerCase();

    const forwardedHost = request.headers.get('x-forwarded-host');
    const hostHeader = request.headers.get('host');
    const candidateHosts = [forwardedHost, hostHeader]
      .filter(Boolean)
      .map((h) => h!.split(',')[0].trim().toLowerCase());

    if (process.env.APP_URL) {
      try {
        candidateHosts.push(new URL(process.env.APP_URL).host.toLowerCase());
      } catch {
        // ignore invalid APP_URL
      }
    }

    if (candidateHosts.length === 0 || candidateHosts.includes(originHost)) {
      return true;
    }

    // Allow AI Studio / Cloud Run preview proxy hostnames when proxy rewrites Host to localhost
    if (
      originHostname.endsWith('.run.app') ||
      originHostname.endsWith('.googleusercontent.com') ||
      originHostname === 'aistudio.google.com' ||
      originHostname.endsWith('.aistudio.google.com') ||
      originHostname === 'localhost' ||
      originHostname === '127.0.0.1'
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function verifyCsrfAndOrigin(request: NextRequest, session: Session): NextResponse | null {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) {
    return null;
  }

  if (!verifyOriginHeader(request)) {
    return NextResponse.json(
      { error: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  const provided = request.headers.get('x-csrf-token');
  const expected = getCsrfTokenForSession(session);

  if (typeof provided !== 'string' || !provided) {
    return NextResponse.json(
      { error: 'Missing CSRF token. Please refresh the page.' },
      { status: 403 }
    );
  }

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token. Please refresh the page.' },
      { status: 403 }
    );
  }

  return null;
}

export async function requireAuth(
  request: NextRequest,
  options: { checkCsrf?: boolean } = {}
) {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated. Please log in.' },
      { status: 401 }
    );
  }

  const shouldCheckCsrf = options.checkCsrf ?? true;
  if (shouldCheckCsrf) {
    const csrfErr = verifyCsrfAndOrigin(request, session);
    if (csrfErr) return csrfErr;
  }

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

export function requireRole(
  allowedRoles: string[],
  options: { checkCsrf?: boolean } = {}
) {
  return async (request: NextRequest) => {
    const auth = await requireAuth(request, options);

    if (auth instanceof NextResponse) {
      return auth;
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

export async function canAccessAttempt(user: any, attemptIdRaw: string): Promise<boolean> {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'teacher') return true;
  const attemptId = parseInt(attemptIdRaw, 10);
  if (Number.isNaN(attemptId) || attemptId <= 0) return false;
  const { query } = await import('@/server/db');
  const own = await query(
    `SELECT 1 FROM exam_attempts ea JOIN students s ON ea.student_id = s.id
     WHERE ea.id = $1 AND s.user_id = $2`,
    [attemptId, user.id]
  );
  return own.rows.length > 0;
}

// ─────────────────────────────────────────────────────────────
// Login Rate Limiting & Per-(IP, Account) Lockout (IAM-06)
// ─────────────────────────────────────────────────────────────
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const IP_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const IP_LOGIN_MAX = 30;

function getLoginMaps() {
  if (!globalForAuth.__iermsLoginAttempts) {
    globalForAuth.__iermsLoginAttempts = new Map();
  }
  if (!globalForAuth.__iermsIpWindow) {
    globalForAuth.__iermsIpWindow = new Map();
  }
  return {
    failedMap: globalForAuth.__iermsLoginAttempts,
    ipMap: globalForAuth.__iermsIpWindow,
  };
}

export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

export function checkLoginRateLimit(request: NextRequest, username: string): NextResponse | null {
  const { failedMap, ipMap } = getLoginMaps();
  const ip = getClientIp(request);
  const now = Date.now();

  // Coarse per-IP window check
  const ipState = ipMap.get(ip);
  if (!ipState || now - ipState.windowStart > IP_LOGIN_WINDOW_MS) {
    ipMap.set(ip, { count: 1, windowStart: now });
  } else {
    ipState.count += 1;
    if (ipState.count > IP_LOGIN_MAX) {
      return NextResponse.json(
        { error: 'Too many login attempts from this IP, please try again later.' },
        { status: 429 }
      );
    }
  }

  // Per-(IP, account) failed-attempt lockout
  const account = username.trim().toLowerCase().slice(0, 100);
  const lockKey = `${ip}|${account}`;
  const attemptData = failedMap.get(lockKey);
  if (attemptData && attemptData.count >= MAX_FAILED_ATTEMPTS) {
    const elapsed = now - attemptData.lastAttempt;
    if (elapsed < LOCKOUT_DURATION_MS) {
      const remainingMinutes = Math.ceil((LOCKOUT_DURATION_MS - elapsed) / 60000);
      return NextResponse.json(
        { error: `Too many failed login attempts for this account. Please try again in ${remainingMinutes} minutes.` },
        { status: 429 }
      );
    }
    failedMap.delete(lockKey);
  }

  return null;
}

export function recordLoginFailure(request: NextRequest, username: string) {
  const { failedMap } = getLoginMaps();
  const ip = getClientIp(request);
  const account = username.trim().toLowerCase().slice(0, 100);
  const lockKey = `${ip}|${account}`;
  const current = failedMap.get(lockKey) || { count: 0, lastAttempt: 0 };
  failedMap.set(lockKey, { count: current.count + 1, lastAttempt: Date.now() });
}

export function recordLoginSuccess(request: NextRequest, username: string) {
  const { failedMap } = getLoginMaps();
  const ip = getClientIp(request);
  const account = username.trim().toLowerCase().slice(0, 100);
  failedMap.delete(`${ip}|${account}`);
}
