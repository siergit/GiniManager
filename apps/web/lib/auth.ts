import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function requireAuth() {
  const cookieStore = await cookies();

  // Check admin session
  const adminSession = cookieStore.get('gini-admin-session');
  if (adminSession?.value === 'admin') return null;

  // Check OTP/PIN session
  const session = cookieStore.get('gini-session');
  if (session?.value) return null;

  // Check Supabase sessions
  const sbSession = cookieStore.get('sb-session-token');
  if (sbSession) return null;

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Alias for backward compatibility
export const requireAdmin = requireAuth;
