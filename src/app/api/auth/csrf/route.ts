import { NextRequest, NextResponse } from 'next/server';
import { getCsrfTokenForSession, requireAuth } from '@/lib/session';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, { checkCsrf: false });
  if (auth instanceof NextResponse) {
    return auth;
  }

  return NextResponse.json({
    token: getCsrfTokenForSession(auth.session),
  });
}
