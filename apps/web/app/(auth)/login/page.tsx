'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState('');

  async function handlePinLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login falhou');

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
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
        throw new Error(data.error || 'Password inválida');
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-blue-600">Gini</span>Manager
          </h1>
          <p className="mt-2 text-gray-500">Gestão Operacional de Equipas</p>
        </div>

        {/* PIN Login */}
        <form onSubmit={handlePinLogin} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nome@sier.pt"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700">PIN (8 dígitos)</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{8}"
              maxLength={8}
              required
              value={pin}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 8);
                setPin(v);
              }}
              placeholder="••••••••"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-xl tracking-[0.5em] font-mono focus:border-blue-500 focus:ring-blue-500"
            />
            <div className="mt-2 flex justify-center gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`h-2 w-2 rounded-full ${i < pin.length ? 'bg-blue-600' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>

          {error && !showAdmin && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || pin.length !== 8}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading && !showAdmin ? 'A entrar...' : 'Entrar'}
          </button>
        </form>

        {/* Admin Login */}
        <div className="mt-4">
          {!showAdmin ? (
            <button
              onClick={() => setShowAdmin(true)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Administrador
            </button>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <input
                type="password"
                required
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                placeholder="Password de administrador"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-500 focus:ring-gray-500"
                autoFocus
              />
              {error && showAdmin && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white disabled:opacity-50">
                  {loading ? '...' : 'Entrar como Admin'}
                </button>
                <button type="button" onClick={() => setShowAdmin(false)} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-500">
                  ✕
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          O PIN é fornecido pelo administrador.<br />
          Contacta o teu gestor se não tens PIN.
        </p>
      </div>
    </main>
  );
}
