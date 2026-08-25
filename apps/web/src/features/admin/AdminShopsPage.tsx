import { useEffect, useState } from 'react';
import { Store, Search } from 'lucide-react';
import { api } from '../../lib/api';
import type { Store as StoreType } from '../../types';

export function AdminShopsPage() {
  const [shops, setShops] = useState<StoreType[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getAdminShops();
        setShops(res || []);
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
        <h1 className="font-serif text-2xl font-bold">Boutiques</h1>
        <span className="badge bg-brume/20 text-brume">{shops.length} boutique{shops.length > 1 ? 's' : ''}</span>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brume" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="input pl-10" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((shop) => (
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
                {shop.is_active ? 'Actif' : 'Inactif'}
              </button>
              <button onClick={() => toggleSuspended(shop.id, shop.is_suspended)} className={`badge ${shop.is_suspended ? 'bg-corail-alerte/10 text-corail-alerte' : 'bg-brume/20 text-brume'}`}>
                {shop.is_suspended ? 'Suspendu' : 'Ok'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
