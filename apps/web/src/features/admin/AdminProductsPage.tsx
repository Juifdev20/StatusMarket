import { useEffect, useState } from 'react';
import { Package, Search } from 'lucide-react';
import { api } from '../../lib/api';
import type { Product } from '../../types';

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getAdminProducts();
        setProducts(res || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleAvailability = async (id: string, isAvailable: boolean) => {
    try {
      const res = await api.updateAdminProduct(id, { is_available: !isAvailable });
      if (res) setProducts((prev) => prev.map((p) => p.id === id ? { ...p, is_available: res.is_available } : p));
    } catch {
      // ignored
    }
  };

  const filtered = products.filter((p) =>
    (p.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (p.store?.name?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Produits</h1>
        <span className="badge bg-brume/20 text-brume">{products.length} produit{products.length > 1 ? 's' : ''}</span>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brume" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="input pl-10" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <div key={product.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold truncate">{product.name}</p>
                <p className="text-xs text-brume">{product.store?.name || '—'}</p>
              </div>
              <Package size={18} className="text-brume" />
            </div>
            <p className="font-mono text-sm font-semibold text-vert-marche mt-1">{product.price} {product.currency}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => toggleAvailability(product.id, product.is_available)} className={`badge ${product.is_available ? 'bg-vert-marche/10 text-vert-marche' : 'bg-corail-alerte/10 text-corail-alerte'}`}>
                {product.is_available ? 'Disponible' : 'Indisponible'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
