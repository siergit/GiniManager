import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.delete('gini-admin-session');
  response.cookies.delete('gini-session');
  response.cookies.delete('sb-session-token');
  return response;
}
