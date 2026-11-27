import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(['admin', 'registrar', 'invigilator'])(request);
    if (auth instanceof NextResponse) return auth;

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const limitRaw = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isInteger(limitRaw) && limitRaw > 0 && limitRaw <= 200 ? limitRaw : 50;

    let sql = `
      SELECT a.*, u.username, u.full_name, u.role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (action) {
      params.push(`%${action}%`);
      sql += ` AND a.action ILIKE $${params.length}`;
    }
    if (entityType) {
      params.push(entityType);
      sql += ` AND a.entity_type = $${params.length}`;
    }
    params.push(limit);
    sql += ` ORDER BY a.created_at DESC LIMIT $${params.length}`;

    const logs = await query(sql, params);
    return NextResponse.json(logs.rows);
  } catch (err) {
    return sendError(err);
  }
}
