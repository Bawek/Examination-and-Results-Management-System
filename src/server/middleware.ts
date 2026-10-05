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
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
});

// Stricter rate limit for login endpoint
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts from this IP, please try again later.',
  },
  skipSuccessfulRequests: true, // Don't count successful logins
});

// ─────────────────────────────────────────────────────────────
// Login Attempt Tracking & Lockout (IAM-06)
// ─────────────────────────────────────────────────────────────
export function trackLoginAttempt(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  // Check if IP is currently locked out
  const attemptData = failedLoginAttempts.get(ip);
  if (attemptData && attemptData.count >= MAX_ATTEMPTS) {
    const timeSinceLastAttempt = Date.now() - attemptData.lastAttempt;
    if (timeSinceLastAttempt < LOCKOUT_DURATION) {
      const remainingTime = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 1000 / 60);
      return res.status(429).json({
        error: `Account locked due to too many failed login attempts. Please try again in ${remainingTime} minutes.`,
      });
    } else {
      // Lockout period expired, reset attempts
      failedLoginAttempts.delete(ip);
    }
  }

  // Store the original res.json to intercept responses
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    // If login failed, track the attempt
    if (res.statusCode === 401 && body?.error?.includes('Invalid username or password')) {
      const current = failedLoginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
      failedLoginAttempts.set(ip, {
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
      failedLoginAttempts.delete(ip);
    }

    return originalJson(body);
  };

  next();
}

// ─────────────────────────────────────────────────────────────
// CSRF Protection Middleware
// ─────────────────────────────────────────────────────────────
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

export function generateCsrfToken(): string {
  return Buffer.from(Date.now().toString() + Math.random().toString()).toString('base64');
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET requests and safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Generate and send CSRF token for GET requests
    const token = generateCsrfToken();
    const sessionId = (req.session as any)?.id || req.ip;
    csrfTokens.set(sessionId, { token, expiresAt: Date.now() + TOKEN_EXPIRY });
    res.setHeader('X-CSRF-Token', token);
    return next();
  }

  // For state-changing requests, validate CSRF token
  const sessionId = (req.session as any)?.id || req.ip;
  const tokenData = csrfTokens.get(sessionId);
  const providedToken = req.headers['x-csrf-token'] as string || req.body.csrfToken;

  if (!tokenData || Date.now() > tokenData.expiresAt) {
    return res.status(403).json({ error: 'CSRF token expired or invalid. Please refresh the page.' });
  }

  if (!providedToken || providedToken !== tokenData.token) {
    return res.status(403).json({ error: 'Invalid CSRF token. Please refresh the page.' });
  }

  // Token is valid, consume it (one-time use)
  csrfTokens.delete(sessionId);
  next();
}

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (now > value.expiresAt) {
      csrfTokens.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes
