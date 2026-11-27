import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.ts';
import { useAuth } from '../../auth/AuthContext.tsx';

interface VisitStats {
  date: string;
  total: number;
  unique: number;
  pages: { page: string; total: number; unique: number }[];
}

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<VisitStats | null>(null);

  useEffect(() => {
    api.get<VisitStats>('/visits/stats').then(setStats).catch(() => navigate('/login', { replace: true }));
  }, [navigate]);

  return (
    <main className="min-h-full p-8 text-text max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl text-gold">La Pecera</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted">Usuario: <b>{user}</b></span>
          <button onClick={() => logout().then(() => navigate('/login'))} className="underline cursor-pointer">
            Salir
          </button>
        </div>
      </header>
      {!stats ? (
        <p className="text-muted">Cargando…</p>
      ) : (
        <>
          <p className="text-muted mb-4">Visitas de hoy ({stats.date})</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="rounded border border-muted/30 p-4"><div className="text-4xl text-gold">{stats.total}</div>Totales</div>
            <div className="rounded border border-muted/30 p-4"><div className="text-4xl text-gold">{stats.unique}</div>Únicas</div>
          </div>
          <table className="w-full text-left">
            <thead className="text-muted"><tr><th>Página</th><th>Totales</th><th>Únicas</th></tr></thead>
            <tbody>
              {stats.pages.map((p) => (
                <tr key={p.page}><td>{p.page}</td><td>{p.total}</td><td>{p.unique}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
