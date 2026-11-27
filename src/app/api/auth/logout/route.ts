import { NextRequest, NextResponse } from 'next/server';
import { clearSession, getSession, verifyCsrfAndOrigin, verifyOriginHeader } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    if (!verifyOriginHeader(request)) {
      return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    }

    const session = await getSession(request);
    if (session) {
      const csrfErr = verifyCsrfAndOrigin(request, session);
      if (csrfErr) return csrfErr;
    }

    const response = NextResponse.json({ success: true });
    await clearSession(response, request);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed.' }, { status: 500 });
  }
}
