import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function requireAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('gini-admin-session');

  if (!session || session.value !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null; // authenticated
}
