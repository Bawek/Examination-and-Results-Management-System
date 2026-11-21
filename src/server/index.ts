import './env.ts';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool, initDatabase } from './db.ts';
import { router } from './routes.ts';
import { rateLimiter, csrfProtection } from './middleware.ts';

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET is missing or too short (min 32 chars). Run "npm run dev" (it generates one) or set it in .env.');
}

const PORT = Number(process.env.API_PORT) || 4000;
const PgStore = connectPgSimple(session);

async function main() {
  await initDatabase();

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // the only proxy in front of us is Next.js
  app.use(express.json({ limit: '1mb' }));

  app.use(
    session({
      name: 'ierms_sid',
      secret: sessionSecret as string,
      resave: false,
      saveUninitialized: false,
      rolling: true, // active exam-takers are not logged out mid-exam
      store: new PgStore({ pool, createTableIfMissing: true }),
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.COOKIE_SECURE === 'true', // set true when served over HTTPS
        maxAge: 8 * 60 * 60 * 1000,
      },
    })
  );

  app.use('/api', rateLimiter);
  app.use('/api', csrfProtection);
  app.use('/api', router);
  app.use('/api', (_req: Request, res: Response) => res.status(404).json({ error: 'Not found' }));

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  });

  // Bind to localhost only: the browser reaches the API through Next.js (/api proxy).
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`IERMS API listening on http://127.0.0.1:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start API server:', err);
  process.exit(1);
});
