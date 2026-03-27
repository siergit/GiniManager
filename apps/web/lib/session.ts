import { cookies } from 'next/headers';

export interface SessionUser {
  userId: string;
  email: string;
  fullName: string;
  role: string;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();

  // Check PIN/OTP session
  const sessionCookie = cookieStore.get('gini-session');
  if (sessionCookie?.value) {
    try {
      const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
      return {
        userId: decoded.userId,
        email: decoded.email,
        fullName: decoded.fullName,
        role: decoded.role,
      };
    } catch {
      // Invalid session
    }
  }

  // Check admin session
  const adminCookie = cookieStore.get('gini-admin-session');
  if (adminCookie?.value === 'admin') {
    return {
      userId: '00000000-0000-0000-0000-000000000001',
      email: 'admin@sier.pt',
      fullName: 'Admin SIER',
      role: 'admin',
    };
  }

  return null;
}
