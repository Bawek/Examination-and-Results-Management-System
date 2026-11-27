import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { syncExamToAssessment } from '@/server/services/examSync';
import { parsePositiveInt, sendError } from '@/lib/api-utils';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin', 'teacher'])(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    const examId = parsePositiveInt(id);
    if (!examId) {
      return NextResponse.json({ error: 'Invalid exam ID.' }, { status: 400 });
    }

    const result = await syncExamToAssessment(examId, auth.user?.id);
    return NextResponse.json(result);
  } catch (err) {
    return sendError(err);
  }
}
