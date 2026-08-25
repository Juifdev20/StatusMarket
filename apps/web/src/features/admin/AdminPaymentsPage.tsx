import { useEffect, useState } from 'react';
import { CreditCard, Check, X, Search, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import type { Payment } from '../../types';

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-ambre-pagne/10 text-ambre-pagne',
  APPROVED: 'bg-vert-marche/10 text-vert-marche',
  REJECTED: 'bg-corail-alerte/10 text-corail-alerte',
};

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getPayments(statusFilter || undefined);
        setPayments(data || []);
      } catch {
        // keep empty
      }
      setLoading(false);
    })();
  }, [statusFilter]);

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.reviewPayment(id, { status });
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // ignored
    }
  };

  const filtered = payments.filter((p) => {
    const q = filter.toLowerCase();
    const name = p.seller?.full_name ?? '';
    const ref = p.reference ?? '';
    return name.toLowerCase().includes(q) || ref.toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Paiements</h1>
        <span className="badge bg-brume/20 text-brume">{payments.length} paiement{payments.length > 1 ? 's' : ''}</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brume" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Rechercher par vendeur ou référence..."
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input sm:w-48"
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="APPROVED">Approuvés</option>
          <option value="REJECTED">Rejetés</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <CreditCard size={48} className="text-brume mb-4" />
          <p className="text-brume">Aucun paiement trouvé.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((payment) => (
            <div key={payment.id} className="card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{payment.seller?.full_name ?? payment.seller_id}</span>
                    <span className={`badge ${statusColors[payment.status]}`}>{statusLabels[payment.status]}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-brume">
                    <span className="font-mono text-vert-marche">{payment.amount} {payment.currency}</span>
                    <span>{payment.plan?.name ?? '—'}</span>
                    <span>Réf: {payment.reference ?? 'N/A'}</span>
                    <span>{new Date(payment.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {payment.rejection_reason && (
                    <p className="mt-1 text-xs text-corail-alerte">Motif: {payment.rejection_reason}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {payment.proof_image_url && (
                    <a
                      href={payment.proof_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost text-xs text-vert-marche flex items-center gap-1"
                    >
                      <ExternalLink size={14} /> Preuve
                    </a>
                  )}
                  {payment.status === 'PENDING' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleReview(payment.id, 'APPROVED')}
                        className="btn-ghost p-2 text-vert-marche"
                        title="Approuver"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => handleReview(payment.id, 'REJECTED')}
                        className="btn-ghost p-2 text-corail-alerte"
                        title="Rejeter"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
