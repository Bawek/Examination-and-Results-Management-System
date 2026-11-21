import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Store failed login attempts by IP
const failedLoginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// ─────────────────────────────────────────────────────────────
// Rate Limiting Middleware (IAM-06)
// ─────────────────────────────────────────────────────────────
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Schools share one IP and exams autosave often; 100 would throttle a whole classroom.
  max: Number(process.env.RATE_LIMIT_MAX) || 3000, // per IP per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
});

// Stricter rate limit for login endpoint
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Coarse per-IP backstop (schools share one IP); per-account lockout below is stricter
  message: {
    error: 'Too many login attempts from this IP, please try again later.',
  },
  skipSuccessfulRequests: true, // Don't count successful logins
});

// ─────────────────────────────────────────────────────────────
// Login Attempt Tracking & Lockout (IAM-06)
// ─────────────────────────────────────────────────────────────
export function trackLoginAttempt(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  // Lock per IP + account so one bad actor can't lock out a whole school network
  const account = String(req.body?.username ?? '').trim().toLowerCase().slice(0, 100);
  const lockKey = `${ip}|${account}`;

  // Check if IP is currently locked out
  const attemptData = failedLoginAttempts.get(lockKey);
  if (attemptData && attemptData.count >= MAX_ATTEMPTS) {
    const timeSinceLastAttempt = Date.now() - attemptData.lastAttempt;
    if (timeSinceLastAttempt < LOCKOUT_DURATION) {
      const remainingTime = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 1000 / 60);
      return res.status(429).json({
        error: `Too many failed login attempts for this account. Please try again in ${remainingTime} minutes.`,
      });
    } else {
      // Lockout period expired, reset attempts
      failedLoginAttempts.delete(lockKey);
    }
  }

  // Store the original res.json to intercept responses
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    // If login failed, track the attempt
    if (res.statusCode === 401 && body?.error?.includes('Invalid username or password')) {
      const current = failedLoginAttempts.get(lockKey) || { count: 0, lastAttempt: 0 };
      failedLoginAttempts.set(lockKey, {
        count: current.count + 1,
        lastAttempt: Date.now(),
      });

      // If at max attempts, lock the account
      if (current.count + 1 >= MAX_ATTEMPTS) {
        // Log the lockout
        console.warn(`IP ${ip} locked out after ${MAX_ATTEMPTS} failed login attempts`);
      }
    } else if (res.statusCode === 200) {
      // Successful login, clear attempts
      failedLoginAttempts.delete(lockKey);
    }

    return originalJson(body);
  };

  next();
}

// ─────────────────────────────────────────────────────────────
// CSRF Protection Middleware
// Session-bound synchronizer token: one random token per session, sent by the
// client in the X-CSRF-Token header on every state-changing request.
// Requires express-session to be registered BEFORE this middleware.
// ─────────────────────────────────────────────────────────────
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getCsrfToken(req: Request): string {
  const session = req.session as any;
  if (!session) {
    throw new Error('express-session must be registered before CSRF protection.');
  }
  if (!session.csrfToken) session.csrfToken = generateCsrfToken();
  return session.csrfToken;
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  // originalUrl keeps the /api prefix even when this is mounted under app.use('/api', ...)
  const path = req.originalUrl.split('?')[0];
  if (path === '/api/auth/login') return next(); // no session exists yet

  const expected = (req.session as any)?.csrfToken;
  const provided = req.headers['x-csrf-token'];

  if (typeof expected !== 'string' || typeof provided !== 'string') {
    return res.status(403).json({ error: 'Missing CSRF token. Please refresh the page.' });
  }

  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ error: 'Invalid CSRF token. Please refresh the page.' });
  }

  next();
}
