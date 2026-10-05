import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import session from 'express-session';
import { initDatabase } from './src/server/db.ts';
import { router as apiRouter } from './src/server/routes.ts';
import { rateLimiter, loginRateLimiter, trackLoginAttempt, csrfProtection } from './src/server/middleware.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Security middleware (IAM-06, CSRF)
  app.use(rateLimiter);
  app.use(csrfProtection);

  // Session middleware
  app.use(
    session({
      name: 'ierms_sid',
      secret: process.env.SESSION_SECRET || 'ierms-apex-super-secure-key-2026',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
      },
    })
  );

  // Initialize Neon PostgreSQL database connection & run schema
  try {
    await initDatabase();
  } catch (dbErr) {
    console.error('Failed to initialize database schema:', dbErr);
  }

  // Mount API router
  app.use('/api', apiRouter);

  if (!isProd) {
    // Vite dev server integration
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`IERMS Application Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
