import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Store, TrendingUp, CreditCard, Plus, ExternalLink, Share2, ShoppingBag, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/authContext';
import { StatusRing } from '../../components/StatusRing';
import type { Store as StoreType, Product, Subscription } from '../../types';

export function SellerDashboard() {
  const { profile } = useAuth();
  const [store, setStore] = useState<StoreType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [storeViews, setStoreViews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: stores } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', profile.id)
        .order('created_at', { ascending: false });
      if (stores && stores.length > 0) {
        const s = stores[0] as StoreType;
        setStore(s);
        const [prodRes, subRes, viewsRes] = await Promise.all([
          supabase.from('products').select('*').eq('store_id', s.id).order('created_at', { ascending: false }),
          supabase.from('subscriptions').select('*, plan:subscription_plans(*)').eq('seller_id', profile.id).order('created_at', { ascending: false }).limit(1),
          supabase.from('store_views').select('id', { count: 'exact' }).eq('store_id', s.id),
        ]);
        if (prodRes.data) setProducts(prodRes.data as Product[]);
        if (subRes.data && subRes.data.length > 0) setSubscription(subRes.data[0] as Subscription);
        if (viewsRes.count !== null && viewsRes.count !== undefined) setStoreViews(viewsRes.count);
      }
      setLoading(false);
    })();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Store size={48} className="text-brume mb-4" />
        <h2 className="font-serif text-xl font-bold mb-2">Créez votre boutique</h2>
        <p className="text-sm text-brume mb-6">Lancez votre boutique en ligne en quelques clics.</p>
        <Link to="/vendeur/boutique/nouvelle" className="btn-cta">
          <Plus size={18} /> Créer ma boutique
        </Link>
      </div>
    );
  }

  const trialProgress = subscription?.trial_ends_at
    ? Math.min(100, Math.max(0, ((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)) * 100))
    : 0;

  const daysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold lg:text-3xl">Bonjour, {profile?.full_name || 'Vendeur'}</h1>
          <p className="text-sm text-brume mt-0.5">Voici un aperçu de votre boutique</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/vendeur/statut" className="btn-cta">
            <Share2 size={16} /> Nouvelle publication
          </Link>
          <a
            href={`${window.location.origin}/boutique/${store.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline text-xs lg:text-sm"
          >
            <ExternalLink size={14} /> Voir ma boutique
          </a>
        </div>
      </div>

      {subscription?.status === 'TRIAL' && (
        <div className="card flex flex-col gap-4 p-4 border-corail-alerte/30 lg:flex-row lg:items-center">
          <StatusRing progress={trialProgress} size={56} color="#E2572B">
            <div className="flex h-full w-full items-center justify-center bg-corail-alerte/10 rounded-full">
              <span className="font-mono text-xs font-bold text-corail-alerte">{daysLeft}j</span>
            </div>
          </StatusRing>
          <div className="flex-1">
            <p className="text-sm font-semibold text-corail-alerte">Essai PRO en cours</p>
            <p className="text-xs text-brume">Plus que {daysLeft} jours d'essai. Passez à PRO pour continuer à profiter de toutes les fonctionnalités.</p>
          </div>
          <Link to="/vendeur/abonnement" className="btn-cta text-xs">Passer à PRO</Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-brume mb-2">
            <Package size={18} />
            <span className="text-xs font-medium">Produits</span>
          </div>
          <p className="font-mono text-2xl font-bold text-encre-nuit dark:text-sable-chaud">{products.length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-brume mb-2">
            <TrendingUp size={18} />
            <span className="text-xs font-medium">Vues boutique</span>
          </div>
          <p className="font-mono text-2xl font-bold text-encre-nuit dark:text-sable-chaud">{storeViews}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-brume mb-2">
            <Share2 size={18} />
            <span className="text-xs font-medium">Publications</span>
          </div>
          <p className="font-mono text-2xl font-bold text-encre-nuit dark:text-sable-chaud">—</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-brume mb-2">
            <ShoppingBag size={18} />
            <span className="text-xs font-medium">Commandes</span>
          </div>
          <p className="font-mono text-2xl font-bold text-encre-nuit dark:text-sable-chaud">—</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Produits récents</h2>
            <Link to="/vendeur/produits" className="text-xs text-vert-marche font-medium flex items-center gap-1">Voir tout <ArrowRight size={12} /></Link>
          </div>
          {products.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Package size={32} className="text-brume mb-3" />
              <p className="text-sm text-brume mb-4">Aucun produit pour le moment</p>
              <Link to="/vendeur/produits" className="btn-primary text-xs">
                <Plus size={14} /> Ajouter un produit
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {products.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-encre-nuit/5 dark:hover:bg-white/5 transition-colors">
                  <div className="h-14 w-14 shrink-0 rounded-lg bg-sable-chaud dark:bg-encre-nuit/40 overflow-hidden">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <Package size={20} className="m-4 text-brume" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="font-mono text-xs text-vert-marche">{p.price} {p.currency}</p>
                  </div>
                  <span className={`badge text-[10px] ${p.is_available ? 'bg-vert-marche/10 text-vert-marche' : 'bg-brume/20 text-brume'}`}>
                    {p.is_available ? 'Disponible' : 'Rupture'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={18} className="text-brume" />
              <h2 className="font-semibold">Abonnement</h2>
            </div>
            {subscription ? (
              <div>
                <span className={`badge ${subscription.status === 'TRIAL' ? 'bg-ambre-pagne/20 text-ambre-pagne' : subscription.status === 'ACTIVE' ? 'bg-vert-marche/10 text-vert-marche' : 'bg-brume/20 text-brume'}`}>
                  {subscription.plan?.name ?? '—'} · {subscription.status}
                </span>
                {subscription.expires_at && (
                  <p className="text-xs text-brume mt-2">Expire le {new Date(subscription.expires_at).toLocaleDateString('fr-FR')}</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-brume mb-3">Plan gratuit</p>
                <Link to="/vendeur/abonnement" className="btn-primary text-xs">Améliorer mon plan</Link>
              </div>
            )}
          </div>

          <div className="card p-4">
            <h2 className="font-semibold mb-3">Actions rapides</h2>
            <div className="grid gap-2">
              <Link to="/vendeur/produits" className="btn-outline text-xs justify-start">
                <Plus size={14} /> Ajouter un produit
              </Link>
              <Link to="/vendeur/statut" className="btn-outline text-xs justify-start">
                <Share2 size={14} /> Créer un statut
              </Link>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Découvrez ma boutique sur StatusMarket : ${window.location.origin}/boutique/${store.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-xs justify-start"
              >
                <ShoppingBag size={14} /> Partager sur WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
