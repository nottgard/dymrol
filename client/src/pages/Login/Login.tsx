import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client.ts';
import { useAuth } from '../../auth/AuthContext.tsx';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/la-pecera';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? 'Demasiados intentos. Inténtalo más tarde.'
          : 'Usuario o contraseña incorrectos',
      );
    } finally {
      setBusy(false);
    }
  }

  const input =
    'w-full rounded border border-muted/40 bg-black/30 px-3 py-2 text-text outline-none focus:border-gold';

  return (
    <main className="min-h-full flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-3xl text-gold text-center">Acceso</h1>
        <input className={input} placeholder="Usuario" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input className={input} type="password" placeholder="Contraseña" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p role="alert" className="text-ember text-sm text-center">{error}</p>}
        <button disabled={busy} className="rounded bg-gold px-3 py-2 font-bold text-bg disabled:opacity-60 cursor-pointer">
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
