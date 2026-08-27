import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, Store, TrendingUp, CreditCard, Plus, ExternalLink, Share2, ShoppingBag, ArrowRight, Upload } from 'lucide-react';
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
  const [publicationsCount, setPublicationsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [storeFrontUploading, setStoreFrontUploading] = useState(false);
  const [storeFrontError, setStoreFrontError] = useState<string | null>(null);
  const [locationDraft, setLocationDraft] = useState({
    city: '',
    quartier: '',
    avenue: '',
    numero_porte: '',
    map_link: '',
    latitude: '',
    longitude: '',
  });
  const [savingLocation, setSavingLocation] = useState(false);
  const reminderSent = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const storeFrontRef = useRef<HTMLInputElement>(null);

  const loadStats = useCallback(async (storeId: string) => {
    const [prodRes, viewsRes, postsRes, ordersRes, subRes] = await Promise.all([
      supabase.from('products').select('*').eq('store_id', storeId).order('created_at', { ascending: false }),
      supabase.from('store_views').select('id', { count: 'exact' }).eq('store_id', storeId),
      supabase.from('status_posts').select('id', { count: 'exact' }).eq('store_id', storeId),
      supabase.from('orders').select('id', { count: 'exact' }).eq('store_id', storeId),
      supabase.from('subscriptions').select('*, plan:subscription_plans(*)').eq('seller_id', profile!.id).order('created_at', { ascending: false }).limit(1),
    ]);
    if (prodRes.data) setProducts(prodRes.data as Product[]);
    if (viewsRes.count !== null && viewsRes.count !== undefined) setStoreViews(viewsRes.count);
    if (postsRes.count !== null && postsRes.count !== undefined) setPublicationsCount(postsRes.count);
    if (ordersRes.count !== null && ordersRes.count !== undefined) setOrdersCount(ordersRes.count);
    if (subRes.data && subRes.data.length > 0) setSubscription(subRes.data[0] as Subscription);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setLoading(true);
      const { data: stores } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', profile.id)
        .order('created_at', { ascending: false });
      if (stores && stores.length > 0) {
        const s = stores[0] as StoreType;
        setStore(s);
        await loadStats(s.id);

        // Check if store setup reminder is needed (fire-and-forget, only once per mount)
        if (!reminderSent.current) {
          reminderSent.current = true;
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          fetch(`${API_URL}/api/notifications/check-store-setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: profile.id }),
          }).catch(() => {});
        }
      }
      setLoading(false);
    })();
  }, [profile, loadStats]);

  // Real-time updates for dashboard stats
  useEffect(() => {
    if (!store) return;
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'store_views', filter: `store_id=eq.${store.id}` }, () => loadStats(store.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `store_id=eq.${store.id}` }, () => loadStats(store.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'status_posts', filter: `store_id=eq.${store.id}` }, () => loadStats(store.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${store.id}` }, () => loadStats(store.id))
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [store, loadStats]);

  useEffect(() => {
    if (store) {
      setLogoUrl(store.logo_url || null);
      setLocationDraft({
        city: store.city || '',
        quartier: store.quartier || '',
        avenue: store.avenue || '',
        numero_porte: store.numero_porte || '',
        map_link: store.map_link || '',
        latitude: store.latitude?.toString() || '',
        longitude: store.longitude?.toString() || '',
      });
    }
  }, [store]);

  const handleLogoUpload = async (file: File) => {
    if (!profile || !store) return;
    setLogoUploading(true);
    setLogoError(null);
    const ext = file.name.split('.').pop();
    const fileName = `logos/${profile.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('product-images').upload(fileName, file);
    if (upErr) {
      setLogoError('Erreur lors du téléchargement du logo.');
    } else {
      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      const url = data.publicUrl;
      const { error: updateErr } = await supabase.from('stores').update({ logo_url: url }).eq('id', store.id);
      if (updateErr) {
        setLogoError('Erreur lors de la mise à jour du logo.');
      } else {
        setStore({ ...store, logo_url: url });
        setLogoUrl(url);
      }
    }
    setLogoUploading(false);
  };

  const handleStoreFrontUpload = async (file: File) => {
    if (!profile || !store) return;
    setStoreFrontUploading(true);
    setStoreFrontError(null);
    const ext = file.name.split('.').pop();
    const fileName = `store-fronts/${profile.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('product-images').upload(fileName, file);
    if (upErr) {
      setStoreFrontError('Erreur lors du téléchargement de la photo.');
    } else {
      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      const url = data.publicUrl;
      const { error: updateErr } = await supabase.from('stores').update({ store_front_image_url: url }).eq('id', store.id);
      if (updateErr) {
        setStoreFrontError('Erreur lors de la mise à jour de la photo.');
      } else {
        setStore({ ...store, store_front_image_url: url });
      }
    }
    setStoreFrontUploading(false);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setSavingLocation(true);
    const payload = {
      city: locationDraft.city.trim() || null,
      quartier: locationDraft.quartier.trim() || null,
      avenue: locationDraft.avenue.trim() || null,
      numero_porte: locationDraft.numero_porte.trim() || null,
      map_link: locationDraft.map_link.trim() || null,
      latitude: locationDraft.latitude ? parseFloat(locationDraft.latitude) : null,
      longitude: locationDraft.longitude ? parseFloat(locationDraft.longitude) : null,
    };
    const { error } = await supabase.from('stores').update(payload).eq('id', store.id);
    if (!error) setStore({ ...store, ...payload });
    setSavingLocation(false);
  };

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
          <p className="font-mono text-2xl font-bold text-encre-nuit dark:text-sable-chaud">{publicationsCount}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-brume mb-2">
            <ShoppingBag size={18} />
            <span className="text-xs font-medium">Commandes</span>
          </div>
          <p className="font-mono text-2xl font-bold text-encre-nuit dark:text-sable-chaud">{ordersCount}</p>
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
            <h2 className="font-semibold mb-3">Logo de la boutique</h2>
            <div className="flex items-start gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-full object-cover border-2 border-vert-marche/30" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-vert-marche text-white font-bold text-2xl">
                  {store.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={logoUploading}
                  className="btn-outline text-xs w-full flex items-center justify-center gap-2"
                >
                  <Upload size={14} /> {logoUploading ? 'Téléchargement...' : 'Changer le logo'}
                </button>
                {logoError && <p className="text-xs text-corail-alerte mt-2 break-words">{logoError}</p>}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveLocation} className="card p-4">
            <h2 className="font-semibold mb-3">Localisation</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Ville <span className="text-brume font-normal">(optionnel)</span></label>
                <input
                  type="text"
                  value={locationDraft.city}
                  onChange={(e) => setLocationDraft({ ...locationDraft, city: e.target.value })}
                  className="input"
                  placeholder="Beni, Butembo, Goma..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Quartier <span className="text-brume font-normal">(optionnel)</span></label>
                  <input
                    type="text"
                    value={locationDraft.quartier}
                    onChange={(e) => setLocationDraft({ ...locationDraft, quartier: e.target.value })}
                    className="input"
                    placeholder="Ex: Mabanga"
                  />
                </div>
                <div>
                  <label className="label">Avenue <span className="text-brume font-normal">(optionnel)</span></label>
                  <input
                    type="text"
                    value={locationDraft.avenue}
                    onChange={(e) => setLocationDraft({ ...locationDraft, avenue: e.target.value })}
                    className="input"
                    placeholder="Ex: Av. Independence"
                  />
                </div>
              </div>
              <div>
                <label className="label">Numéro de porte <span className="text-brume font-normal">(optionnel)</span></label>
                <input
                  type="text"
                  value={locationDraft.numero_porte}
                  onChange={(e) => setLocationDraft({ ...locationDraft, numero_porte: e.target.value })}
                  className="input"
                  placeholder="Ex: N°12"
                />
              </div>

              <div>
                <label className="label">Lien Google Maps <span className="text-brume font-normal">(optionnel)</span></label>
                <input
                  type="url"
                  value={locationDraft.map_link}
                  onChange={(e) => setLocationDraft({ ...locationDraft, map_link: e.target.value })}
                  className="input"
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Latitude <span className="text-brume font-normal">(optionnel)</span></label>
                  <input
                    type="number"
                    step="any"
                    value={locationDraft.latitude}
                    onChange={(e) => setLocationDraft({ ...locationDraft, latitude: e.target.value })}
                    className="input"
                    placeholder="0.0000000"
                  />
                </div>
                <div>
                  <label className="label">Longitude <span className="text-brume font-normal">(optionnel)</span></label>
                  <input
                    type="number"
                    step="any"
                    value={locationDraft.longitude}
                    onChange={(e) => setLocationDraft({ ...locationDraft, longitude: e.target.value })}
                    className="input"
                    placeholder="0.0000000"
                  />
                </div>
              </div>
              <div>
                <label className="label">Photo de la devanture <span className="text-brume font-normal">(optionnel)</span></label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => storeFrontRef.current?.click()}
                    disabled={storeFrontUploading}
                    className="btn-outline text-xs flex items-center gap-2"
                  >
                    <Upload size={14} /> {storeFrontUploading ? 'Téléchargement...' : 'Changer la photo'}
                  </button>
                  {store.store_front_image_url ? (
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-vert-marche">
                      <img src={store.store_front_image_url} alt="Dev" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-brume/10 text-brume text-xs text-center">
                      Aucune photo
                    </div>
                  )}
                </div>
                {storeFrontError && <p className="text-xs text-corail-alerte mt-1">{storeFrontError}</p>}
                <input
                    ref={storeFrontRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleStoreFrontUpload(file);
                    }}
                  />
              </div>
            </div>
            <button type="submit" disabled={savingLocation} className="btn-primary w-full mt-4">
              {savingLocation ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <p className="text-xs text-brume mt-2">Ces informations aident les clients à vous trouver sur la page d'accueil.</p>
          </form>

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
