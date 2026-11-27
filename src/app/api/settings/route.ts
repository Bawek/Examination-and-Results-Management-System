import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getSession } from '@/lib/session';
import { query } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated.' },
        { status: 401 }
      );
    }

    const sRes = await query('SELECT * FROM school_settings LIMIT 1');
    const scalesRes = await query('SELECT * FROM grading_scales ORDER BY min_score DESC');
    
    return NextResponse.json({
      settings: sRes.rows[0] || {},
      gradingScales: scalesRes.rows
    });
  } catch (error: any) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(['admin'])(request);
    
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { user } = auth;
    const body = await request.json();
    const { 
      institution_name, 
      address, 
      contact_email, 
      contact_phone, 
      timezone, 
      pass_percentage, 
      rounding_decimals, 
      ranking_enabled 
    } = body;

    await query(`
      UPDATE school_settings
      SET institution_name = $1, address = $2, contact_email = $3, contact_phone = $4,
          timezone = $5, pass_percentage = $6, rounding_decimals = $7, ranking_enabled = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `, [institution_name, address, contact_email, contact_phone, timezone, pass_percentage, rounding_decimals, ranking_enabled]);

    await query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
      VALUES ($1, 'UPDATE_SETTINGS', 'SCHOOL_SETTINGS', '1', $2, 'Updated school institutional settings and policies')
    `, [user?.id, JSON.stringify(body)]);

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
