import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';
import { sendError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(['admin', 'teacher'])(request);
    if (auth instanceof NextResponse) return auth;

    const students = await query(`
      SELECT s.*, c.name as class_name, sec.section_name, u.username,
             acc.extra_time_minutes as accommodation_extra_time
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN student_accommodations acc ON s.id = acc.student_id
      ORDER BY s.admission_no ASC
    `);
    return NextResponse.json(students.rows);
  } catch (err) {
    return sendError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(['admin'])(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;
    const body = await request.json().catch(() => ({}));
    const {
      admission_no,
      first_name,
      last_name,
      gender,
      date_of_birth,
      guardian_name,
      guardian_phone,
      contact_email,
      class_id,
      section_id,
    } = body;

    if (!admission_no || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Admission number, first name, and last name are required.' },
        { status: 400 }
      );
    }

    const sRes = await query(
      `INSERT INTO students (admission_no, first_name, last_name, gender, date_of_birth, guardian_name, guardian_phone, contact_email, class_id, section_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        admission_no,
        first_name,
        last_name,
        gender || null,
        date_of_birth || null,
        guardian_name || null,
        guardian_phone || null,
        contact_email || null,
        class_id || null,
        section_id || null,
      ]
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, reason)
       VALUES ($1, 'CREATE_STUDENT', 'STUDENT', $2, $3, 'Registered new student')`,
      [user?.id, sRes.rows[0].id.toString(), JSON.stringify({ admission_no, name: `${first_name} ${last_name}` })]
    );

    return NextResponse.json(sRes.rows[0]);
  } catch (err) {
    return sendError(err);
  }
}
