import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(['admin'])(request);
    if (auth instanceof NextResponse) return auth;

    const ping = await query(
      'SELECT NOW() as db_time, current_database() as db_name, version() as version'
    );
    return NextResponse.json({
      status: 'operational',
      database: 'PostgreSQL (Connected)',
      dbTime: ping.rows[0].db_time,
      dbName: ping.rows[0].db_name,
      engine: ping.rows[0].version,
    });
  } catch (err: any) {
    console.error('System health check failed:', err);
    return NextResponse.json(
      { status: 'degraded', error: 'Database connectivity check failed.' },
      { status: 500 }
    );
  }
}
