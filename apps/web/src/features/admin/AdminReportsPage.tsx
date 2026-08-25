import { useEffect, useState } from 'react';
import { Flag, Search, Check, X } from 'lucide-react';
import { api } from '../../lib/api';
import type { Report } from '../../types';

const statusLabels: Record<string, string> = {
  OPEN: 'Ouvert',
  RESOLVED: 'Résolu',
  DISMISSED: 'Rejeté',
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-corail-alerte/10 text-corail-alerte',
  RESOLVED: 'bg-vert-marche/10 text-vert-marche',
  DISMISSED: 'bg-brume/20 text-brume',
};

export function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getAdminReports();
        setReports(res || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateStatus = async (id: string, status: 'RESOLVED' | 'DISMISSED') => {
    try {
      const res = await api.updateReport(id, { status });
      if (res) setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: res.status } : r));
    } catch {
      // ignored
    }
  };

  const filtered = reports.filter((r) =>
    (r.reason?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (r.target_type?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Signalements</h1>
        <span className="badge bg-brume/20 text-brume">{reports.length} signalement{reports.length > 1 ? 's' : ''}</span>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brume" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="input pl-10" />
      </div>

      <div className="space-y-3">
        {filtered.map((report) => (
          <div key={report.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge bg-brume/20 text-brume">{report.target_type}</span>
                  <span className={`badge ${statusColors[report.status]}`}>{statusLabels[report.status]}</span>
                  <span className="font-mono text-xs text-brume">{report.target_id.slice(0, 8)}</span>
                </div>
                <p className="mt-2 text-sm">{report.reason}</p>
                <p className="text-xs text-brume mt-1">{new Date(report.created_at).toLocaleString('fr-FR')}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => updateStatus(report.id, 'RESOLVED')} className="btn-ghost p-2 text-vert-marche" title="Résoudre">
                  <Check size={18} />
                </button>
                <button onClick={() => updateStatus(report.id, 'DISMISSED')} className="btn-ghost p-2 text-corail-alerte" title="Rejeter">
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center">
          <Flag size={48} className="text-brume mb-4" />
          <p className="text-brume">Aucun signalement.</p>
        </div>
      )}
    </div>
  );
}
