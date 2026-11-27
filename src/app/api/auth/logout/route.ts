import { NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    await clearSession(response);
    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed.' },
      { status: 500 }
    );
  }
}
