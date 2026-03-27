'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code' | 'admin'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminPass, setAdminPass] = useState('');

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar código');

      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Código inválido');

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
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
      setError(err instanceof Error ? err.message : 'Erro');
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

        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'A enviar...' : 'Enviar código'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Receberás um código de 8 dígitos no teu email
            </p>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-center">
              <p className="text-sm text-gray-600">Código enviado para</p>
              <p className="font-medium text-gray-900">{email}</p>
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">Código</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={8}
                required
                value={code}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setCode(v);
                }}
                placeholder="00000000"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:border-blue-500 focus:ring-blue-500"
                autoFocus
              />
              <div className="mt-2 flex justify-center gap-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={`h-2 w-2 rounded-full transition-colors ${i < code.length ? 'bg-blue-600' : 'bg-gray-200'}`} />
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || code.length !== 8}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'A verificar...' : 'Entrar'}
            </button>

            <div className="flex justify-between text-xs">
              <button type="button" onClick={() => { setStep('email'); setCode(''); setError(''); }} className="text-gray-500 hover:text-blue-600">
                ← Voltar
              </button>
              <button type="button" onClick={handleSendCode} className="text-blue-600 hover:underline">
                Reenviar código
              </button>
            </div>
          </form>
        )}

        {step === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <input
              type="password"
              required
              value={adminPass}
              onChange={e => setAdminPass(e.target.value)}
              placeholder="Password de administrador"
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
              autoFocus
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white disabled:opacity-50">
                {loading ? '...' : 'Entrar como Admin'}
              </button>
              <button type="button" onClick={() => { setStep('email'); setError(''); }} className="rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-500">
                ✕
              </button>
            </div>
          </form>
        )}

        {step !== 'admin' && (
          <div className="mt-4">
            <button
              onClick={() => { setStep('admin'); setError(''); }}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 transition-colors"
            >
              Administrador
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          O teu email deve estar registado pelo administrador.<br />
          Verifica a pasta de spam se não receberes o código.
        </p>
      </div>
    </main>
  );
}
