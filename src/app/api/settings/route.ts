import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const sRes = await query('SELECT * FROM school_settings LIMIT 1');
    const scalesRes = await query('SELECT * FROM grading_scales ORDER BY min_score DESC');

    return NextResponse.json({
      settings: sRes.rows[0] || {},
      gradingScales: scalesRes.rows,
    });
  } catch (error) {
    return sendError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(['admin'])(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;
    const body = await request.json().catch(() => ({}));
    const {
      institution_name,
      address,
      contact_email,
      contact_phone,
      timezone,
      pass_percentage,
      rounding_decimals,
      ranking_enabled,
    } = body;

    // Check if settings row exists, if not insert it
    const checkRes = await query('SELECT id FROM school_settings LIMIT 1');
    
    if (checkRes.rows.length === 0) {
      // Insert new settings row
      await query(
        `INSERT INTO school_settings (id, institution_name, address, contact_email, contact_phone, timezone, pass_percentage, rounding_decimals, ranking_enabled)
         VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          institution_name,
          address,
          contact_email,
          contact_phone,
          timezone,
          pass_percentage,
          rounding_decimals,
          ranking_enabled,
        ]
      );
    } else {
      // Update existing settings
      await query(
        `UPDATE school_settings
         SET institution_name = $1, address = $2, contact_email = $3, contact_phone = $4,
             timezone = $5, pass_percentage = $6, rounding_decimals = $7, ranking_enabled = $8,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $9`,
        [
          institution_name,
          address,
          contact_email,
          contact_phone,
          timezone,
          pass_percentage,
          rounding_decimals,
          ranking_enabled,
          checkRes.rows[0].id,
        ]
      );
    }

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
       VALUES ($1, 'UPDATE_SETTINGS', 'SCHOOL_SETTINGS', '1', $2, 'Updated school institutional settings and policies')`,
      [user?.id, JSON.stringify(body)]
    );

    // Return updated settings
    const updatedRes = await query('SELECT * FROM school_settings LIMIT 1');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Settings saved successfully',
      settings: updatedRes.rows[0]
    });
  } catch (error) {
    return sendError(error);
  }
}
