import { useEffect, useState } from 'react';
import { Store, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { isSubscriptionActive } from '../../utils/subscriptionStatus';
import type { Store as StoreType, Subscription, SubscriptionPlan } from '../../types';

type AdminStore = StoreType & { subscription: Subscription | null };

export function AdminShopsPage() {
  const { t } = useTranslation();
  const [shops, setShops] = useState<AdminStore[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Record<string, string>>({});
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [shopsRes, plansRes] = await Promise.all([api.getAdminShops(), api.getPlans()]);
        setShops(shopsRes || []);
        setPlans((plansRes || []).filter((p: SubscriptionPlan) => p.is_active));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await api.updateShop(id, { is_active: !isActive });
      if (res) setShops((prev) => prev.map((s) => s.id === id ? { ...s, is_active: res.is_active } : s));
    } catch {
      // ignored
    }
  };

  const toggleSuspended = async (id: string, isSuspended: boolean) => {
    try {
      const res = await api.updateShop(id, { is_suspended: !isSuspended });
      if (res) setShops((prev) => prev.map((s) => s.id === id ? { ...s, is_suspended: res.is_suspended } : s));
    } catch {
      // ignored
    }
  };

  const activateSubscription = async (storeId: string) => {
    const planId = selectedPlan[storeId] || plans[0]?.id;
    if (!planId) return;
    setActivating(storeId);
    try {
      const sub = await api.activateStoreSubscription(storeId, planId);
      setShops((prev) => prev.map((s) => s.id === storeId ? { ...s, subscription: sub } : s));
    } catch {
      alert(t('adminShops.activateError'));
    } finally {
      setActivating(null);
    }
  };

  const filtered = shops.filter((s) =>
    (s.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (s.slug?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">{t('landing.shops')}</h1>
        <span className="badge bg-brume/20 text-brume">{t('adminShops.count', { count: shops.length })}</span>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brume" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('common.search') + '...'} className="input pl-10" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((shop) => {
          const subActive = isSubscriptionActive(shop.subscription);
          return (
            <div key={shop.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{shop.name}</p>
                  <p className="text-xs text-brume">/{shop.slug}</p>
                </div>
                <Store size={18} className="text-brume" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => toggleActive(shop.id, shop.is_active)} className={`badge ${shop.is_active ? 'bg-vert-marche/10 text-vert-marche' : 'bg-corail-alerte/10 text-corail-alerte'}`}>
                  {shop.is_active ? t('adminDashboard.active') : t('adminDashboard.inactive')}
                </button>
                <button onClick={() => toggleSuspended(shop.id, shop.is_suspended)} className={`badge ${shop.is_suspended ? 'bg-corail-alerte/10 text-corail-alerte' : 'bg-brume/20 text-brume'}`}>
                  {shop.is_suspended ? t('adminShops.suspended') : 'Ok'}
                </button>
                <span className={`badge ${subActive ? 'bg-vert-marche/10 text-vert-marche' : 'bg-ambre-pagne/10 text-ambre-pagne'}`}>
                  {shop.subscription ? `${shop.subscription.plan?.name ?? shop.subscription.status} · ${shop.subscription.status}` : t('adminShops.noSubscription')}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-brume/20 pt-3">
                <select
                  value={selectedPlan[shop.id] ?? plans[0]?.id ?? ''}
                  onChange={(e) => setSelectedPlan((prev) => ({ ...prev, [shop.id]: e.target.value }))}
                  className="input flex-1 py-1 text-xs"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => activateSubscription(shop.id)}
                  disabled={activating === shop.id}
                  className="btn-primary text-xs whitespace-nowrap disabled:opacity-50"
                >
                  {activating === shop.id ? t('common.loading') : t('adminShops.activateSubscription')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
