import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Search, Store, ShoppingBag, MapPin, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Product, GlobalCategory } from '../../types';

interface ProductWithStore extends Product {
  store?: { name: string; slug: string; logo_url: string | null; city: string | null } | null;
  global_category?: GlobalCategory | null;
}

export function CategoryBrowsePage() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<GlobalCategory | null>(null);
  const [products, setProducts] = useState<ProductWithStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'price_low' | 'price_high' | 'promo'>('recent');
  const [cityFilter, setCityFilter] = useState('');
  const [cities, setCities] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);

    const { data: catData } = await supabase
      .from('global_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (!catData) {
      setLoading(false);
      return;
    }
    setCategory(catData as GlobalCategory);

    const { data: prodData } = await supabase
      .from('products')
      .select('*, store:stores(name, slug, logo_url, city), global_category:global_categories(*)')
      .eq('global_category_id', catData.id)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    const allProducts = (prodData || []) as ProductWithStore[];
    setProducts(allProducts);

    const uniqueCities = [...new Set(allProducts.map((p) => p.store?.city).filter(Boolean))] as string[];
    setCities(uniqueCities);

    setLoading(false);
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  let filtered = products;
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.store?.name?.toLowerCase().includes(q)
    );
  }
  if (cityFilter) {
    filtered = filtered.filter((p) => p.store?.city === cityFilter);
  }

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return (a.discount_price ?? a.price) - (b.discount_price ?? b.price);
      case 'price_high':
        return (b.discount_price ?? b.price) - (a.discount_price ?? a.price);
      case 'promo':
        return (b.discount_price ? 1 : 0) - (a.discount_price ? 1 : 0);
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <p className="text-brume mb-4">Catégorie introuvable.</p>
        <Link to="/" className="btn-primary text-sm">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sable-chaud dark:bg-encre-nuit pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-encre-nuit/80 border-b border-brume/30 sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link to="/" className="mb-3 flex items-center gap-1 text-sm text-brume hover:text-vert-marche">
            <ArrowLeft size={16} /> Accueil
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{category.icon}</span>
            <div>
              <h1 className="font-serif text-xl font-bold text-encre-nuit dark:text-sable-chaud">{category.name}</h1>
              <p className="text-xs text-brume">{sorted.length} produit{sorted.length > 1 ? 's' : ''} trouvé{sorted.length > 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brume" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrer dans cette catégorie..."
                className="input pl-9 py-2 text-sm"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-brume">
                  <X size={14} />
                </button>
              )}
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="input py-2 text-sm sm:w-44">
              <option value="recent">Plus récents</option>
              <option value="price_low">Prix croissant</option>
              <option value="price_high">Prix décroissant</option>
              <option value="promo">Promotions d'abord</option>
            </select>
            {cities.length > 0 && (
              <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="input py-2 text-sm sm:w-36">
                <option value="">Toutes villes</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag size={48} className="text-brume mb-4" />
            <p className="text-brume">Aucun produit dans cette catégorie pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sorted.map((p) => (
              <Link
                key={p.id}
                to={`/boutique/${p.store?.slug}`}
                className="card overflow-hidden transition hover:shadow-md"
              >
                <div className="aspect-square bg-sable-chaud dark:bg-encre-nuit/40 relative overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ShoppingBag size={28} className="text-brume/40" />
                    </div>
                  )}
                  {p.discount_price && p.discount_price < p.price && (
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-corail-alerte px-2 py-0.5 text-[10px] font-bold text-white">
                      -{Math.round((1 - p.discount_price / p.price) * 100)}%
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-encre-nuit dark:text-sable-chaud line-clamp-2">{p.name}</h3>
                  {p.discount_price && p.discount_price < p.price ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="font-mono text-sm font-semibold text-corail-alerte">{p.discount_price} {p.currency}</span>
                      <span className="font-mono text-[10px] text-brume line-through">{p.price}</span>
                    </div>
                  ) : (
                    <p className="mt-1 font-mono text-sm font-semibold text-vert-marche">{p.price} {p.currency}</p>
                  )}
                  <div className="mt-2 flex items-center gap-1.5">
                    {p.store?.logo_url ? (
                      <img src={p.store.logo_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                    ) : (
                      <Store size={12} className="text-brume" />
                    )}
                    <span className="text-xs text-brume truncate">{p.store?.name}</span>
                    {p.store?.city && (
                      <span className="text-[10px] text-brume flex items-center gap-0.5 shrink-0">
                        <MapPin size={8} /> {p.store.city}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
