import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Fullstack Next.js API is working!',
    timestamp: new Date().toISOString(),
    routes: {
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
      },
      dashboard: {
        stats: 'GET /api/dashboard/stats',
      },
      settings: 'GET/POST /api/settings',
      health: 'GET /api/health',
    }
  });
}
