import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Store, TrendingUp, Image as ImageIcon, ArrowRight,
  Share2, ShoppingBag, Smartphone, Search, Sun, Moon, MapPin, Flame,
  Trophy, Sparkles, Tag, ChevronRight, X,
} from 'lucide-react';
import { useAuth, getHomeRoute } from '../auth/authContext';
import { supabase } from '../../lib/supabase';
import { CommentSection } from '../../components/CommentSection';
import type { Store as StoreType, Product, GlobalCategory } from '../../types';

const fallbackCategories = [
  { name: 'Mode', slug: 'mode', emoji: '👗' },
  { name: 'Téléphones', slug: 'telephones', emoji: '📱' },
  { name: 'Chaussures', slug: 'chaussures', emoji: '👟' },
  { name: 'Beauté', slug: 'beaute', emoji: '💄' },
  { name: 'Maison', slug: 'maison', emoji: '🏠' },
  { name: 'Restaurant', slug: 'restaurant', emoji: '🍔' },
  { name: 'Informatique', slug: 'informatique', emoji: '💻' },
  { name: 'Accessoires', slug: 'accessoires', emoji: '🎁' },
];

interface ProductWithStore extends Product {
  store?: { name: string; slug: string; logo_url: string | null; city: string | null } | null;
}

interface SearchResults {
  products: ProductWithStore[];
  stores: StoreType[];
  categories: GlobalCategory[];
}

export function LandingPage() {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [trendingProducts, setTrendingProducts] = useState<ProductWithStore[]>([]);
  const [popularStores, setPopularStores] = useState<StoreType[]>([]);
  const [newProducts, setNewProducts] = useState<ProductWithStore[]>([]);
  const [promoProducts, setPromoProducts] = useState<ProductWithStore[]>([]);
  const [nearbyStores, setNearbyStores] = useState<StoreType[]>([]);
  const [globalCategories, setGlobalCategories] = useState<GlobalCategory[]>([]);
  const [allStores, setAllStores] = useState<StoreType[]>([]);
  const [storesPage, setStoresPage] = useState(0);
  const [productViews, setProductViews] = useState<Record<string, number>>({});
  const STORES_PER_PAGE = 10;
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  const loadDiscoveryData = useCallback(async () => {
    const [storesRes, productsRes, gcatRes] = await Promise.all([
      supabase.from('stores').select('*').eq('is_active', true).eq('is_suspended', false).order('created_at', { ascending: false }),
      supabase.from('products')
        .select('*, store:stores(name, slug, logo_url, city)')
        .eq('is_available', true)
        .order('created_at', { ascending: false }),
      supabase.from('global_categories').select('*').eq('is_active', true).order('sort_order'),
    ]);

    const stores = (storesRes.data || []) as StoreType[];
    const products = (productsRes.data || []) as ProductWithStore[];

    if (gcatRes.data && gcatRes.data.length > 0) {
      setGlobalCategories(gcatRes.data as GlobalCategory[]);
    }

    setAllStores(stores);
    setPopularStores(stores.slice(0, STORES_PER_PAGE));
    setNewProducts(products.slice(0, 10));
    setPromoProducts(products.filter((p) => p.discount_price && p.discount_price < p.price).slice(0, 10));

    const storesWithCity = stores.filter((s) => s.city);
    setNearbyStores(storesWithCity.slice(0, 6));

    const viewsRes = await supabase.from('store_views')
      .select('product_id')
      .not('product_id', 'is', null);
    const viewCounts: Record<string, number> = {};
    (viewsRes.data || []).forEach((v: any) => {
      const pid = v.product_id as string;
      if (pid) viewCounts[pid] = (viewCounts[pid] || 0) + 1;
    });
    setProductViews(viewCounts);
    const sorted = [...products].sort((a, b) => {
      const av = viewCounts[a.id] || 0;
      const bv = viewCounts[b.id] || 0;
      return bv - av;
    });
    setTrendingProducts(sorted.slice(0, 10));
  }, []);

  useEffect(() => {
    loadDiscoveryData();
  }, [loadDiscoveryData]);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }
    const [prodRes, storeRes, catRes] = await Promise.all([
      supabase.from('products')
        .select('*, store:stores(name, slug, logo_url, city)')
        .ilike('name', `%${q}%`)
        .eq('is_available', true)
        .limit(10),
      supabase.from('stores')
        .select('*')
        .eq('is_active', true)
        .eq('is_suspended', false)
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(10),
      supabase.from('global_categories')
        .select('*')
        .eq('is_active', true)
        .ilike('name', `%${q}%`)
        .limit(5),
    ]);
    setSearchResults({
      products: (prodRes.data || []) as ProductWithStore[],
      stores: (storeRes.data || []) as StoreType[],
      categories: (catRes.data || []) as GlobalCategory[],
    });
  }, []);

  return (
    <div className="min-h-screen bg-sable-chaud dark:bg-encre-nuit">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-brume/30 bg-white/95 dark:bg-encre-nuit/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-vert-marche/10">
              <Store size={18} className="text-vert-marche" />
            </div>
            <span className="font-serif text-lg font-bold text-encre-nuit dark:text-sable-chaud hidden sm:block">StatusMarket</span>
          </Link>

          <div className="flex-1 max-w-xl relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brume" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); handleSearch(e.target.value); }}
              placeholder="Rechercher boutiques, produits..."
              className="input pl-10 py-2.5 w-full text-sm"
            />
            {query && (
              <button onClick={() => { setQuery(''); setSearchResults(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-brume hover:text-encre-nuit">
                <X size={16} />
              </button>
            )}
            {searchResults && query && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white dark:bg-encre-nuit border border-brume/20 shadow-lg max-h-[70vh] overflow-y-auto z-50">
                {searchResults.products.length === 0 && searchResults.stores.length === 0 && searchResults.categories.length === 0 ? (
                  <p className="p-4 text-sm text-brume text-center">Aucun résultat pour "{query}"</p>
                ) : (
                  <div className="p-2 space-y-1">
                    {searchResults.products.length > 0 && (
                      <>
                        <p className="px-3 py-1 text-xs font-semibold text-brume uppercase">Produits</p>
                        {searchResults.products.map((p) => (
                          <Link key={p.id} to={`/boutique/${p.store?.slug}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-encre-nuit/5 dark:hover:bg-white/5">
                            <div className="h-10 w-10 shrink-0 rounded-lg bg-brume/20 overflow-hidden">
                              {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{p.name}</p>
                              <p className="text-xs text-vert-marche">{p.price} {p.currency}</p>
                            </div>
                            <span className="text-xs text-brume">{p.store?.name}</span>
                          </Link>
                        ))}
                      </>
                    )}
                    {searchResults.stores.length > 0 && (
                      <>
                        <p className="px-3 py-1 text-xs font-semibold text-brume uppercase mt-2">Boutiques</p>
                        {searchResults.stores.map((s) => (
                          <Link key={s.id} to={`/boutique/${s.slug}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-encre-nuit/5 dark:hover:bg-white/5">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-vert-marche/10 overflow-hidden">
                              {s.logo_url ? <img src={s.logo_url} alt="" className="h-full w-full object-cover" /> : <Store size={18} className="m-auto text-vert-marche" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{s.name}</p>
                              <p className="text-xs text-brume">{s.city || '—'}</p>
                            </div>
                          </Link>
                        ))}
                      </>
                    )}
                    {searchResults.categories.length > 0 && (
                      <>
                        <p className="px-3 py-1 text-xs font-semibold text-brume uppercase mt-2">Catégories</p>
                        {searchResults.categories.map((c) => (
                          <Link key={c.id} to={`/categorie/${c.slug}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-encre-nuit/5 dark:hover:bg-white/5">
                            <span className="text-lg">{c.icon}</span>
                            <p className="text-sm font-medium">{c.name}</p>
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {profile ? (
              <Link to={getHomeRoute(profile.role)} className="btn-primary text-sm">Mon espace</Link>
            ) : (
              <>
                <Link to="/connexion?mode=login" className="btn-ghost text-sm hidden sm:inline-flex">Connexion</Link>
                <Link to="/connexion?mode=register" className="btn-primary text-sm">Créer un compte</Link>
              </>
            )}
            <button onClick={() => setDark((d) => !d)} className="btn-ghost p-2" title="Thème">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-10">
        {/* Hero */}
        <section className="text-center py-8">
          <h1 className="font-serif text-3xl font-bold text-encre-nuit dark:text-sable-chaud sm:text-4xl lg:text-5xl leading-tight">
            Découvrez les boutiques <span className="text-vert-marche">près de vous</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-brume">
            Parcourez des centaines de produits, trouvez votre prochaine boutique préférée, et achetez directement via WhatsApp.
          </p>
          {!profile && (
            <Link to="/connexion" className="btn-cta mt-6 inline-flex">
              Créer ma boutique <ArrowRight size={18} />
            </Link>
          )}
        </section>

        {/* Catégories populaires */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold flex items-center gap-2">
              <Sparkles size={20} className="text-vert-marche" /> Explorer les catégories
            </h2>
            <Link to="/categories" className="text-xs font-medium text-vert-marche hover:underline flex items-center gap-1">
              Voir tout <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
            {(globalCategories.length > 0
              ? globalCategories.map((c) => ({ name: c.name, slug: c.slug, emoji: c.icon }))
              : fallbackCategories
            ).map((cat) => (
              <Link
                key={cat.slug}
                to={`/categorie/${cat.slug}`}
                className="card flex shrink-0 w-24 sm:w-28 flex-col items-center gap-1.5 p-3 transition hover:shadow-md hover:border-vert-marche/30 snap-start"
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-xs font-medium text-center leading-tight line-clamp-2">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Tendances */}
        {trendingProducts.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
              <Flame size={20} className="text-corail-alerte" /> Tendances
            </h2>
            <ProductCarousel products={trendingProducts} productViews={productViews} />
          </section>
        )}

        {/* Boutiques à découvrir */}
        {allStores.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
              <Store size={20} className="text-vert-marche" /> Boutiques à découvrir
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {popularStores.map((s) => (
                <Link key={s.id} to={`/boutique/${s.slug}`} className="card p-4 flex flex-col items-center text-center transition hover:shadow-md">
                  <div className="h-16 w-16 rounded-full bg-vert-marche/10 overflow-hidden mb-2 flex items-center justify-center">
                    {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-full w-full object-cover" /> : <Store size={24} className="text-vert-marche" />}
                  </div>
                  <p className="text-sm font-semibold truncate w-full">{s.name}</p>
                  {s.city && <p className="text-xs text-brume flex items-center gap-1 mt-1"><MapPin size={10} /> {s.city}</p>}
                  <span className="text-xs text-vert-marche mt-2 flex items-center gap-1">Voir <ChevronRight size={12} /></span>
                </Link>
              ))}
            </div>
            {allStores.length > STORES_PER_PAGE && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    const newPage = Math.max(0, storesPage - 1);
                    setStoresPage(newPage);
                    setPopularStores(allStores.slice(newPage * STORES_PER_PAGE, (newPage + 1) * STORES_PER_PAGE));
                  }}
                  disabled={storesPage === 0}
                  className="btn-outline text-xs"
                >
                  <ChevronRight size={14} className="rotate-180" /> Retour
                </button>
                <span className="text-xs text-brume">
                  Page {storesPage + 1} / {Math.ceil(allStores.length / STORES_PER_PAGE)}
                </span>
                <button
                  onClick={() => {
                    const maxPage = Math.ceil(allStores.length / STORES_PER_PAGE) - 1;
                    const newPage = Math.min(maxPage, storesPage + 1);
                    setStoresPage(newPage);
                    setPopularStores(allStores.slice(newPage * STORES_PER_PAGE, (newPage + 1) * STORES_PER_PAGE));
                  }}
                  disabled={storesPage >= Math.ceil(allStores.length / STORES_PER_PAGE) - 1}
                  className="btn-outline text-xs"
                >
                  Suivant <ChevronRight size={14} />
                </button>
              </div>
            )}
          </section>
        )}

        {/* Promotions */}
        {promoProducts.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
              <Tag size={20} className="text-corail-alerte" /> Offres du moment
            </h2>
            <ProductCarousel products={promoProducts} productViews={productViews} showDiscount />
          </section>
        )}

        {/* Produits populaires (top 3 + rest) */}
        {trendingProducts.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-vert-marche" /> Les plus populaires
            </h2>
            <div className="space-y-2">
              {trendingProducts.slice(0, 5).map((p, i) => (
                <Link key={p.id} to={`/boutique/${p.store?.slug}`} className="card flex items-center gap-3 p-3 transition hover:shadow-md">
                  <span className={`font-mono text-2xl font-bold ${i === 0 ? 'text-corail-alerte' : i === 1 ? 'text-vert-marche' : 'text-brume'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </span>
                  <div className="h-14 w-14 shrink-0 rounded-lg bg-brume/20 overflow-hidden">
                    {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <p className="font-mono text-xs text-vert-marche">{p.price} {p.currency}</p>
                    <p className="text-xs text-brume truncate">{p.store?.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Près de vous */}
        {nearbyStores.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-vert-marche" /> Près de vous
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {nearbyStores.map((s) => (
                <Link key={s.id} to={`/boutique/${s.slug}`} className="card p-4 flex items-center gap-3 transition hover:shadow-md">
                  <div className="h-12 w-12 rounded-full bg-vert-marche/10 overflow-hidden flex items-center justify-center shrink-0">
                    {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-full w-full object-cover" /> : <Store size={20} className="text-vert-marche" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.name}</p>
                    <p className="text-xs text-brume flex items-center gap-1"><MapPin size={10} /> {s.city}</p>
                  </div>
                  <ChevronRight size={18} className="text-brume shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Nouveautés */}
        {newProducts.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-vert-marche" /> Dernières nouveautés
            </h2>
            <ProductCarousel products={newProducts} productViews={productViews} />
          </section>
        )}

        {/* Features (kept from original) */}
        <section id="fonctionnalites" className="py-10">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-2xl font-bold text-encre-nuit dark:text-sable-chaud lg:text-3xl">
              Tout pour vendre sur WhatsApp
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-brume">
              Une suite complète pensée pour les commerçants africains qui veulent vendre simplement et professionnellement.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Store, title: 'Boutique en ligne', desc: 'Un lien unique pour toute votre boutique. Catalogue organisé, fiches produits, contact WhatsApp.' },
              { icon: ImageIcon, title: 'Générateur de statuts', desc: 'Créez des publications multi-produits avec photo de couverture et lien de partage.' },
              { icon: TrendingUp, title: 'Statistiques', desc: 'Suivez les vues de votre boutique, de vos publications et de vos produits en temps réel.' },
              { icon: Share2, title: 'Partage WhatsApp', desc: 'Partagez un lien avec image de couverture, comme YouTube ou TikTok.' },
              { icon: ShoppingBag, title: 'Ventes directes', desc: 'Vos clients commandent par WhatsApp en un clic depuis vos fiches produits.' },
              { icon: Smartphone, title: 'Mobile-first', desc: 'Gérez votre boutique depuis votre téléphone, partout en RDC et en Afrique.' },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card p-5 transition hover:shadow-lg">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-vert-marche/10">
                    <Icon size={20} className="text-vert-marche" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-encre-nuit dark:text-sable-chaud">{f.title}</h3>
                  <p className="mt-1 text-sm text-brume">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        {!profile && (
          <section className="py-10">
            <div className="rounded-3xl bg-vert-marche p-8 text-center text-white lg:p-12">
              <h2 className="font-serif text-2xl font-bold lg:text-3xl">Prêt à vendre sur WhatsApp ?</h2>
              <p className="mx-auto mt-3 max-w-xl text-white/80 text-sm">
                Rejoignez les commerçants qui utilisent StatusMarket pour transformer leurs statuts en ventes.
              </p>
              <Link to="/connexion" className="btn-cta mt-6 inline-flex bg-white text-vert-marche hover:bg-white/90">
                Commencer maintenant <ArrowRight size={18} />
              </Link>
            </div>
          </section>
        )}
      </main>

    </div>
  );
}

function ProductCarousel({ products, productViews, showDiscount }: { products: ProductWithStore[]; productViews: Record<string, number>; showDiscount?: boolean }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide items-start">
      {products.map((p) => (
        <div
          key={p.id}
          className="card shrink-0 w-44 sm:w-52 p-3 transition hover:shadow-md snap-start"
        >
          <Link to={`/boutique/${p.store?.slug}`} className="block">
            <div className="aspect-square rounded-lg bg-brume/20 overflow-hidden mb-2 relative">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ShoppingBag size={24} className="text-brume/40" />
                </div>
              )}
              {showDiscount && p.discount_price && (
                <span className="absolute top-1 left-1 rounded-full bg-corail-alerte px-2 py-0.5 text-[10px] font-bold text-white">
                  -{Math.round((1 - p.discount_price / p.price) * 100)}%
                </span>
              )}
            </div>
            <p className="text-sm font-semibold truncate hover:text-vert-marche">{p.name}</p>
            {showDiscount && p.discount_price ? (
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs text-corail-alerte">{p.discount_price} {p.currency}</span>
                <span className="font-mono text-[10px] text-brume line-through">{p.price}</span>
              </div>
            ) : (
              <p className="font-mono text-xs text-vert-marche">{p.price} {p.currency}</p>
            )}
            <p className="text-xs text-brume truncate mt-1">{p.store?.name}</p>
          </Link>

          <div className="mt-1 flex items-center gap-3 text-[10px] text-brume">
            <span className="flex items-center gap-0.5">
              <Search size={11} /> {productViews[p.id] || 0} vues
            </span>
            <Link to={`/boutique/${p.store?.slug}`} className="hover:text-vert-marche hover:underline">
              Voir boutique
            </Link>
          </div>

          <div className="mt-3">
            <CommentSection productId={p.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
