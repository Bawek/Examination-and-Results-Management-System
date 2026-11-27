import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Fullstack Next.js API is working!',
    timestamp: new Date().toISOString(),
    architecture: 'Fullstack Next.js (App Router + PostgreSQL)',
    health: 'GET /api/health',
  });
}
