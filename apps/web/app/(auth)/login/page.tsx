'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPass }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Invalid password');
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold">Verifica o teu email</h1>
          <p className="mt-4 text-gray-600">
            Enviámos um link de login para <strong>{email}</strong>
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Clica no link no email para entrar. Também podes usar o código de 6 dígitos abaixo.
          </p>
          <a href="/verify-otp" className="mt-4 inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Inserir código manualmente
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center">GiniManager</h1>
        <p className="mt-2 text-center text-gray-600">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@sier.pt"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {error && !showAdmin && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading && !showAdmin ? 'Sending...' : 'Send login code'}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-6">
          {!showAdmin ? (
            <button
              onClick={() => setShowAdmin(true)}
              className="w-full rounded-lg border-2 border-gray-800 bg-gray-900 px-4 py-3 text-white font-medium hover:bg-gray-800 transition-colors"
            >
              Admin Login
            </button>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div>
                <label htmlFor="admin-pass" className="block text-sm font-medium text-gray-700">
                  Admin Password
                </label>
                <input
                  id="admin-pass"
                  type="password"
                  required
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="Enter admin password"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-gray-500 focus:ring-gray-500"
                  autoFocus
                />
              </div>

              {error && showAdmin && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gray-900 px-4 py-3 text-white font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Logging in...' : 'Login as Admin'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
