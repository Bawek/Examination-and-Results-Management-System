import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Examination and Results Management System - API',
    version: '2.0.0',
    architecture: 'Fullstack Next.js',
    endpoints: {
      auth: {
        login: { method: 'POST', path: '/api/auth/login', description: 'User authentication' },
        logout: { method: 'POST', path: '/api/auth/logout', description: 'User logout' },
        me: { method: 'GET', path: '/api/auth/me', description: 'Get current user (requires auth)' },
      },
      dashboard: {
        stats: { method: 'GET', path: '/api/dashboard/stats', description: 'Dashboard statistics (admin/teacher)' },
      },
      settings: {
        get: { method: 'GET', path: '/api/settings', description: 'Get school settings' },
        update: { method: 'POST', path: '/api/settings', description: 'Update school settings (admin)' },
      },
      system: {
        health: { method: 'GET', path: '/api/health', description: 'Health check' },
        test: { method: 'GET', path: '/api/test', description: 'API test endpoint' },
      }
    },
    documentation: {
      guide: '/FULLSTACK_NEXTJS_GUIDE.md',
      migration: '/MIGRATION_NOTES.md',
    },
    status: 'operational',
  });
}
