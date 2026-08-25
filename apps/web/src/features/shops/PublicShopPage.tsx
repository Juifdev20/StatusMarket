import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Home, ShoppingCart, MessageCircle, ArrowLeft, Package, Plus, Flag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { StatusRing } from '../../components/StatusRing';
import { PWAInstallPrompt } from '../../components/PWAInstallPrompt';
import { ReportModal } from '../../components/ReportModal';
import type { Store, Product, Category } from '../../types';

export function PublicShopPage() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const raw = localStorage.getItem('cart');
      const parsed = raw ? JSON.parse(raw) : { items: [] };
      setCartCount((parsed.items || []).reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0));
    };
    updateCount();
    window.addEventListener('cart-updated', updateCount);
    return () => window.removeEventListener('cart-updated', updateCount);
  }, []);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: storeData, error: storeErr } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .eq('is_suspended', false)
        .single();
      if (storeErr || !storeData) {
        setError('Boutique introuvable ou désactivée.');
        setLoading(false);
        return;
      }
      setStore(storeData as Store);

      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*, category:categories(*)').eq('store_id', storeData.id).eq('is_available', true).order('created_at', { ascending: false }),
        supabase.from('categories').select('*').eq('store_id', storeData.id).order('name'),
      ]);

      if (prodRes.data) setProducts(prodRes.data as Product[]);
      if (catRes.data) setCategories(catRes.data as Category[]);
      setLoading(false);
    })();
  }, [slug]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesCategory = !activeCategory || p.category_id === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const whatsappLink = (product: Product) => {
    const number = store?.whatsapp_number?.replace(/[^0-9]/g, '') ?? '';
    const text = encodeURIComponent(`Bonjour, je suis intéressé(e) par: ${product.name} (${product.price} ${product.currency})`);
    return `https://wa.me/${number}?text=${text}`;
  };

  const addToCart = (product: Product) => {
    if (!store) return;
    const raw = localStorage.getItem('cart');
    const parsed = raw ? JSON.parse(raw) : { store: { id: store.id, whatsapp_number: store.whatsapp_number, slug: store.slug, name: store.name }, items: [] };
    if (parsed.store?.id !== store.id) {
      parsed.store = { id: store.id, whatsapp_number: store.whatsapp_number, slug: store.slug, name: store.name };
      parsed.items = [];
    }
    const existing = parsed.items.find((item: { product: Product }) => item.product.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      parsed.items.push({ product, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(parsed));
    window.dispatchEvent(new CustomEvent('cart-updated'));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-corail-alerte">{error ?? 'Erreur'}</p>
        <Link to="/" className="btn-outline">← Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sable-chaud dark:bg-encre-nuit pb-20">
      {/* Store header */}
      <div className="bg-white dark:bg-encre-nuit/80 border-b border-brume/30">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link to="/" className="mb-4 flex items-center gap-1 text-sm text-brume hover:text-vert-marche">
            <ArrowLeft size={16} /> StatusMarket
          </Link>
          <div className="flex items-center gap-4">
            <StatusRing progress={100} size={64} color="#158F73">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="h-full w-full rounded-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-vert-marche rounded-full text-white font-bold text-lg">
                  {store.name.charAt(0).toUpperCase()}
                </div>
              )}
            </StatusRing>
            <div>
              <h1 className="font-serif text-xl font-bold text-encre-nuit dark:text-sable-chaud">{store.name}</h1>
              {store.description && <p className="text-sm text-brume mt-0.5">{store.description}</p>}
            </div>
            <button
              onClick={() => setShowReport(true)}
              className="ml-auto flex items-center gap-1 rounded-full bg-corail-alerte/10 px-3 py-1 text-xs font-medium text-corail-alerte"
            >
              <Flag size={14} /> Signaler
            </button>
          </div>
        </div>
      </div>

      {/* Search + categories */}
      <div className="mx-auto max-w-4xl px-4 py-4">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brume" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`badge shrink-0 ${!activeCategory ? 'bg-vert-marche text-white' : 'bg-white dark:bg-encre-nuit/60 text-brume border border-brume/30'}`}
            >
              Tous
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`badge shrink-0 ${activeCategory === cat.id ? 'bg-vert-marche text-white' : 'bg-white dark:bg-encre-nuit/60 text-brume border border-brume/30'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products grid */}
      <div className="mx-auto max-w-4xl px-4">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package size={48} className="text-brume mb-4" />
            <p className="text-brume">Aucun produit disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {filteredProducts.map((product) => (
              <div key={product.id} className="card overflow-hidden">
                <div className="aspect-square bg-sable-chaud dark:bg-encre-nuit/40">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package size={32} className="text-brume" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-encre-nuit dark:text-sable-chaud line-clamp-2">{product.name}</h3>
                  <p className="mt-1 font-mono text-base font-semibold text-vert-marche">
                    {product.price} {product.currency}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <a
                      href={whatsappLink(product)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-cta flex-1 text-xs"
                    >
                      WhatsApp
                    </a>
                    <button onClick={() => addToCart(product)} className="btn-outline p-2" title="Ajouter au panier">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom nav for client */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-brume/30 bg-white dark:bg-encre-nuit">
        <div className="flex items-center justify-around py-2">
          <Link to={`/boutique/${store.slug}`} className="flex flex-col items-center gap-0.5 text-vert-marche">
            <Home size={20} />
            <span className="text-[10px] font-medium">Accueil</span>
          </Link>
          <button onClick={() => document.querySelector('input')?.focus()} className="flex flex-col items-center gap-0.5 text-brume">
            <Search size={20} />
            <span className="text-[10px] font-medium">Recherche</span>
          </button>
          <Link to="/panier" className="flex flex-col items-center gap-0.5 text-brume relative">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-corail-alerte text-[10px] text-white font-bold">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
            <span className="text-[10px] font-medium">Panier</span>
          </Link>
          <a
            href={`https://wa.me/${store.whatsapp_number?.replace(/[^0-9]/g, '') ?? ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-0.5 text-vert-marche"
          >
            <MessageCircle size={20} />
            <span className="text-[10px] font-medium">WhatsApp</span>
          </a>
        </div>
      </nav>

      {showReport && store && (
        <ReportModal targetType="STORE" targetId={store.id} onClose={() => setShowReport(false)} />
      )}

      <PWAInstallPrompt />
    </div>
  );
}
