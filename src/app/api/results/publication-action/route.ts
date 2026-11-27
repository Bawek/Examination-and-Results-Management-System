import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { parsePositiveInt, sendError } from '@/lib/api-utils';

const ALLOWED_ACTIONS = new Set([
  'submit_review',
  'approve',
  'publish',
  'lock',
  'unpublish',
  'reopen',
]);

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(['admin', 'teacher', 'registrar'])(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;
    const body = await request.json().catch(() => ({}));
    const termId = parsePositiveInt(body?.termId);
    const sectionId = parsePositiveInt(body?.sectionId);
    const action = typeof body?.action === 'string' ? body.action : '';
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';

    if (!termId || !sectionId || !ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json(
        { error: 'Valid termId, sectionId, and publication action are required.' },
        { status: 400 }
      );
    }

    const currentPub = await query(
      `SELECT * FROM term_result_publications WHERE term_id = $1 AND section_id = $2`,
      [termId, sectionId]
    );

    let newStatus = 'draft';
    let publishedAt: Date | null = null;
    let lockedAt: Date | null = null;

    if (action === 'submit_review') {
      newStatus = 'under_review';
    } else if (action === 'approve') {
      newStatus = 'approved';
    } else if (action === 'publish') {
      newStatus = 'published';
      publishedAt = new Date();
    } else if (action === 'lock') {
      newStatus = 'locked';
      lockedAt = new Date();
    } else if (action === 'unpublish') {
      newStatus = 'under_review';
    } else if (action === 'reopen') {
      if (user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only an authorized Administrator can reopen locked term results' },
          { status: 403 }
        );
      }
      if (!reason) {
        return NextResponse.json(
          { error: 'A documented reason is required to reopen locked results' },
          { status: 400 }
        );
      }
      newStatus = 'published';
    }

    await query(
      `INSERT INTO term_result_publications (term_id, section_id, published_by, published_at, locked_at, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (term_id, section_id)
       DO UPDATE SET
         status = EXCLUDED.status,
         published_by = EXCLUDED.published_by,
         published_at = COALESCE(EXCLUDED.published_at, term_result_publications.published_at),
         locked_at = COALESCE(EXCLUDED.locked_at, term_result_publications.locked_at)`,
      [termId, sectionId, user?.id, publishedAt, lockedAt, newStatus]
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
       VALUES ($1, $2, 'TERM_PUBLICATION', $3, $4, $5)`,
      [
        user?.id,
        `RESULTS_${action.toUpperCase()}`,
        `${termId}_${sectionId}`,
        JSON.stringify({
          termId,
          sectionId,
          previousStatus: currentPub.rows[0]?.status,
          newStatus,
        }),
        reason || `Term result status transition to ${newStatus}`,
      ]
    );

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    return sendError(err);
  }
}
