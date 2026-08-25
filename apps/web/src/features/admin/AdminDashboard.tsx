import { useEffect, useState } from 'react';
import { Users, Store, Package, CreditCard, Flag, Check, X } from 'lucide-react';
import { api } from '../../lib/api';
import type { Payment, SubscriptionPlan } from '../../types';

export function AdminDashboard() {
  const [stats, setStats] = useState({ sellers: 0, stores: 0, products: 0, pendingPayments: 0, activeTrials: 0, reports: 0 });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, paymentsRes, plansRes] = await Promise.all([
          api.getAdminStats(),
          api.getPayments(),
          api.getPlans(),
        ]);
        setStats({
          sellers: statsRes.sellers ?? 0,
          stores: statsRes.stores ?? 0,
          products: statsRes.products ?? 0,
          pendingPayments: statsRes.pending_payments ?? 0,
          activeTrials: statsRes.active_trials ?? 0,
          reports: 0,
        });
        setRecentPayments((paymentsRes || []).filter((p: Payment) => p.status === 'PENDING'));
        setPlans((plansRes || []).sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.sort_order - b.sort_order));
      } catch {
        // keep defaults on error
      }
      setLoading(false);
    })();
  }, []);

  const handlePayment = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.reviewPayment(id, { status });
      setRecentPayments((prev) => prev.filter((p) => p.id !== id));
      setStats((prev) => ({ ...prev, pendingPayments: prev.pendingPayments - 1 }));
    } catch {
      // ignored
    }
  };

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" /></div>;
  }

  const statCards = [
    { label: 'Vendeurs', value: stats.sellers, icon: Users, color: 'text-vert-marche' },
    { label: 'Boutiques', value: stats.stores, icon: Store, color: 'text-ambre-pagne' },
    { label: 'Produits', value: stats.products, icon: Package, color: 'text-vert-marche' },
    { label: 'Paiements en attente', value: stats.pendingPayments, icon: CreditCard, color: 'text-corail-alerte' },
    { label: 'Signalements', value: stats.reports, icon: Flag, color: 'text-corail-alerte' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">Tableau de bord</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-4">
              <div className={`mb-2 ${s.color}`}>
                <Icon size={20} />
              </div>
              <p className="font-mono text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-brume">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-4">Paiements en attente de validation</h2>
        {recentPayments.length === 0 ? (
          <p className="text-sm text-brume">Aucun paiement en attente.</p>
        ) : (
          <div className="space-y-3">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center gap-3 rounded-xl border border-brume/20 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{payment.seller?.full_name ?? payment.seller_id}</p>
                  <p className="font-mono text-xs text-vert-marche">{payment.amount} {payment.currency}</p>
                  <p className="text-xs text-brume">{payment.plan?.name ?? '—'} · {payment.reference ?? 'N/A'}</p>
                </div>
                {payment.proof_image_url && (
                  <a href={payment.proof_image_url} target="_blank" rel="noopener noreferrer" className="text-xs text-vert-marche underline">
                    Voir preuve
                  </a>
                )}
                <div className="flex gap-1">
                  <button onClick={() => handlePayment(payment.id, 'APPROVED')} className="btn-ghost p-2 text-vert-marche">
                    <Check size={18} />
                  </button>
                  <button onClick={() => handlePayment(payment.id, 'REJECTED')} className="btn-ghost p-2 text-corail-alerte">
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-4">Plans d'abonnement</h2>
        <div className="space-y-2">
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center justify-between rounded-xl p-3 bg-sable-chaud dark:bg-encre-nuit/40">
              <div>
                <p className="text-sm font-semibold">{plan.name}</p>
                <p className="text-xs text-brume">{plan.price_usd === 0 ? 'Gratuit' : `${plan.price_usd}$`} · {plan.duration_days} jours</p>
              </div>
              <span className={`badge ${plan.is_active ? 'bg-vert-marche/10 text-vert-marche' : 'bg-brume/20 text-brume'}`}>
                {plan.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
