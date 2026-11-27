import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(['admin', 'teacher'])(request);
    
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { user } = auth;

    const [
      studentsCount,
      teachersCount,
      examsCount,
      activeExamsCount,
      pendingGradingCount,
      publicationsCount,
      auditLogsCount
    ] = await Promise.all([
      query("SELECT COUNT(*) FROM students WHERE status = 'active'"),
      query("SELECT COUNT(*) FROM teachers WHERE status = 'active'"),
      query('SELECT COUNT(*) FROM exams'),
      query("SELECT COUNT(*) FROM exams WHERE status = 'published' AND start_at <= NOW() AND end_at >= NOW()"),
      query("SELECT COUNT(*) FROM student_answers WHERE grading_status = 'ungraded'"),
      query("SELECT COUNT(*) FROM term_result_publications WHERE status = 'published'"),
      query('SELECT COUNT(*) FROM audit_logs')
    ]);

    const recentExams = await query(`
      SELECT e.id, e.title, e.duration_minutes, e.start_at, e.end_at, e.status, e.total_marks,
             sub.subject_name, c.name as class_name, sec.section_name
      FROM exams e
      JOIN class_subjects cs ON e.class_subject_id = cs.id
      JOIN subjects sub ON cs.subject_id = sub.id
      JOIN sections sec ON cs.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      ORDER BY e.created_at DESC LIMIT 5
    `);

    const recentLogs = await query(`
      SELECT a.id, a.action, a.entity_type, a.created_at, a.reason, u.full_name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC LIMIT 6
    `);

    return NextResponse.json({
      counts: {
        students: parseInt(studentsCount.rows[0].count, 10),
        teachers: parseInt(teachersCount.rows[0].count, 10),
        exams: parseInt(examsCount.rows[0].count, 10),
        activeExams: parseInt(activeExamsCount.rows[0].count, 10),
        pendingGrading: parseInt(pendingGradingCount.rows[0].count, 10),
        publishedResults: parseInt(publicationsCount.rows[0].count, 10),
        auditLogs: parseInt(auditLogsCount.rows[0].count, 10)
      },
      recentExams: recentExams.rows,
      recentLogs: recentLogs.rows,
      currentUserRole: user?.role
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
