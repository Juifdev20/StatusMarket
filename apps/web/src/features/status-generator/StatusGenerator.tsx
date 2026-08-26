import { useEffect, useState } from 'react';
import { Share2, Check, Image as ImageIcon, Link as LinkIcon, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/authContext';
import type { Store, Product } from '../../types';

export function StatusGenerator() {
  const { profile, user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [shareMessage, setShareMessage] = useState('Découvrez mes produits sur StatusMarket !');
  const [publishing, setPublishing] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const ownerId = profile?.id || user?.id;
    if (!ownerId) return;
    setLoading(true);
    setFetchError(null);
    let isMounted = true;
    (async () => {
      try {
        const { data: s, error } = await supabase.from('stores').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (!isMounted) return;
        if (error) {
          console.error('Error fetching store:', error);
          setFetchError(error.message || 'Erreur de chargement de la boutique');
          return;
        }
        const myStore = s ? (s as Store) : null;
        setStore(myStore);
        if (myStore) {
          const { data: prods } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', myStore.id)
            .eq('is_available', true)
            .order('created_at', { ascending: false });
          if (isMounted && prods) setProducts(prods as Product[]);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setFetchError(err?.message || 'Erreur de chargement de la boutique');
        console.error('Error fetching store:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [profile?.id, user?.id, refresh]);

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (next.length === 0) {
        setCoverImage(null);
      } else if (next.length === 1) {
        // Auto-set cover to the single selected product's image
        const p = products.find((x) => x.id === next[0]);
        setCoverImage(p?.image_url || null);
      } else if (!prev.includes(id)) {
        // Selecting a new product: only auto-set if no cover yet
        if (!coverImage) {
          const p = products.find((x) => x.id === id);
          if (p?.image_url) setCoverImage(p.image_url);
        }
      } else if (coverImage) {
        // Deselecting: if the cover was from the deselected product, reset
        const removed = products.find((x) => x.id === id);
        if (removed?.image_url === coverImage) {
          const remaining = products.filter((x) => next.includes(x.id) && x.image_url);
          setCoverImage(remaining.length > 0 ? remaining[0].image_url! : null);
        }
      }
      return next;
    });
  };

  const coverCandidates = selectedProducts
    .filter((p) => p.image_url)
    .map((p) => ({ id: p.id, url: p.image_url! }));

  const handlePublish = async () => {
    if (!store || selectedIds.length === 0) return;
    setPublishing(true);

    const { data, error } = await supabase
      .from('status_posts')
      .insert({
        store_id: store.id,
        product_ids: selectedIds,
        cover_image_url: coverImage,
        caption: caption.trim() || null,
        share_message: shareMessage.trim() || null,
        store_link: `${window.location.origin}/boutique/${store.slug}`,
      })
      .select('slug')
      .single();

    if (error) {
      console.error('Publish error:', error.message);
      setPublishing(false);
      return;
    }

    setPublishedSlug(data.slug);
    setPublishing(false);
  };

  const shareUrl = publishedSlug ? `${window.location.origin}/pub/${publishedSlug}` : '';
  const whatsappShareUrl = publishedSlug
    ? `https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${shareUrl}`)}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center py-20 text-center px-4">
        <p className="text-corail-alerte mb-4 text-sm text-center">{fetchError}</p>
        <button onClick={() => setRefresh(r => r + 1)} className="btn-primary text-xs">Réessayer</button>
      </div>
    );
  }

  if (!store) {
    return <p className="text-center text-brume py-20">Créez d'abord votre boutique.</p>;
  }

  if (publishedSlug) {
    return (
      <div className="space-y-6">
        <div className="card p-6 text-center space-y-4">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-vert-marche/10">
            <Check size={32} className="text-vert-marche" />
          </div>
          <h2 className="font-serif text-xl font-bold">Publication créée !</h2>
          <p className="text-sm text-brume">
            Votre statut est prêt. Partagez ce lien sur WhatsApp — une photo de couverture accompagnera automatiquement le lien.
          </p>

          {coverImage && (
            <div className="mx-auto max-w-[200px] rounded-xl overflow-hidden border border-brume/20">
              <img src={coverImage} alt="Couverture" className="w-full object-cover" />
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl bg-encre-nuit/5 dark:bg-white/5 p-3">
            <LinkIcon size={16} className="text-brume shrink-0" />
            <input
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent text-sm outline-none truncate"
            />
            <button onClick={handleCopy} className="text-vert-marche hover:text-vert-marche/80">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta w-full"
          >
            <Share2 size={18} /> Partager sur WhatsApp
          </a>

          <button
            onClick={() => {
              setPublishedSlug(null);
              setSelectedIds([]);
              setCoverImage(null);
              setCaption('');
              setShareMessage('Découvrez mes produits sur StatusMarket !');
            }}
            className="btn-outline w-full"
          >
            Créer une nouvelle publication
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Créer une publication</h1>
        <p className="text-sm text-brume mt-1">
          Sélectionnez plusieurs produits, choisissez une photo de couverture, puis publiez. Le lien généré peut être partagé sur WhatsApp avec la photo.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="card p-6 text-center">
          <ImageIcon size={32} className="text-brume mx-auto mb-3" />
          <p className="text-sm text-brume mb-4">Aucun produit disponible. Ajoutez d'abord des produits à votre boutique.</p>
        </div>
      ) : (
        <>
          <div className="card p-4">
            <label className="label">1. Sélectionnez vos produits ({selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''})</label>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {products.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${
                      isSelected ? 'border-vert-marche ring-2 ring-vert-marche/20' : 'border-transparent'
                    }`}
                  >
                    <div className="aspect-square bg-sable-chaud dark:bg-encre-nuit/40">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon size={24} className="text-brume" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{p.name}</p>
                      <p className="font-mono text-xs text-vert-marche">{p.price} {p.currency}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-vert-marche">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {coverCandidates.length > 0 && (
            <div className="card p-4">
              <label className="label">2. Photo de couverture du statut</label>
              <p className="text-xs text-brume mb-3">Cette photo accompagnera le lien lorsque vous le partagerez sur WhatsApp.</p>
              <div className="grid grid-cols-3 gap-2">
                {coverCandidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCoverImage(c.url)}
                    className={`relative rounded-lg overflow-hidden border-2 ${
                      coverImage === c.url ? 'border-vert-marche ring-2 ring-vert-marche/20' : 'border-transparent'
                    }`}
                  >
                    <img src={c.url} alt="Cover" className="aspect-square w-full object-cover" />
                    {coverImage === c.url && (
                      <div className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-vert-marche">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card p-4">
            <label className="label">3. Légende (optionnel)</label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="input"
              placeholder="Promo du jour ! Nouveautés disponibles..."
            />
          </div>

          <div className="card p-4">
            <label className="label">4. Message de partage WhatsApp</label>
            <p className="text-xs text-brume mb-2">Ce message accompagnera le lien lorsque vous partagez sur WhatsApp.</p>
            <textarea
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              className="input min-h-[60px] resize-y"
              placeholder="Découvrez mes produits sur StatusMarket !"
            />
          </div>

          <div className="card p-4">
            <label className="label">Aperçu du partage</label>
            <div className="mt-2 rounded-xl overflow-hidden border border-brume/20">
              {coverImage ? (
                <img src={coverImage} alt="Aperçu couverture" className="w-full max-h-[200px] object-cover" />
              ) : (
                <div className="flex h-[120px] items-center justify-center bg-sable-chaud dark:bg-encre-nuit/40">
                  <ImageIcon size={28} className="text-brume" />
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-semibold truncate">{store.name}</p>
                <p className="text-xs text-brume truncate">
                  {caption || `${selectedIds.length} produit${selectedIds.length > 1 ? 's' : ''} disponible${selectedIds.length > 1 ? 's' : ''}`}
                </p>
                <p className="text-xs text-vert-marche mt-1 truncate">{window.location.origin}/pub/...</p>
              </div>
            </div>
          </div>

          <button
            onClick={handlePublish}
            disabled={publishing || selectedIds.length === 0}
            className="btn-cta w-full"
          >
            {publishing ? 'Publication...' : (
              <>
                <Share2 size={18} /> Mettre sur statut
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
