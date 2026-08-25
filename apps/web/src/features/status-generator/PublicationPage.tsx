import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Store, Package, MessageCircle, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PWAInstallPrompt } from '../../components/PWAInstallPrompt';
import type { StatusPost, Store as StoreType, Product } from '../../types';

export function PublicationPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<StatusPost | null>(null);
  const [store, setStore] = useState<StoreType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: postData, error: postError } = await supabase
        .from('status_posts')
        .select('*')
        .eq('slug', slug)
        .single();

      if (postError || !postData) {
        setLoading(false);
        return;
      }

      const p = postData as StatusPost;
      setPost(p);

      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('id', p.store_id)
        .single();

      if (storeData) setStore(storeData as StoreType);

      if (p.product_ids && p.product_ids.length > 0) {
        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .in('id', p.product_ids)
          .eq('is_available', true);
        if (prodData) {
          const ordered = p.product_ids
            .map((id) => prodData.find((prod) => prod.id === id))
            .filter(Boolean) as Product[];
          setProducts(ordered);
        }
      }

      await supabase.from('status_posts').update({ views: (p.views || 0) + 1 }).eq('id', p.id);

      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sable-chaud dark:bg-encre-nuit">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" />
      </div>
    );
  }

  if (!post || !store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sable-chaud dark:bg-encre-nuit px-4 text-center">
        <Package size={48} className="text-brume mb-4" />
        <h1 className="font-serif text-xl font-bold mb-2">Publication introuvable</h1>
        <p className="text-sm text-brume mb-6">Cette publication n'existe plus ou a été supprimée.</p>
        <Link to="/" className="btn-primary">Retour à l'accueil</Link>
      </div>
    );
  }

  const handleWhatsAppOrder = (productName: string) => {
    if (!store.whatsapp_number) return;
    const msg = encodeURIComponent(`Bonjour, je suis intéressé(e) par "${productName}" vu sur StatusMarket.`);
    window.open(`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-sable-chaud dark:bg-encre-nuit">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <header className="flex items-center justify-between mb-6">
          <Link to={`/boutique/${store.slug}`} className="flex items-center gap-2">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-vert-marche/10">
                <Store size={20} className="text-vert-marche" />
              </div>
            )}
            <div>
              <p className="font-serif font-bold text-lg">{store.name}</p>
              <p className="text-xs text-brume">Voir la boutique complète</p>
            </div>
          </Link>
          <Link to={`/boutique/${store.slug}`} className="btn-outline text-xs">
            Boutique <ArrowRight size={14} />
          </Link>
        </header>

        {post.cover_image_url && (
          <div className="rounded-2xl overflow-hidden mb-6">
            <img src={post.cover_image_url} alt="Publication" className="w-full max-h-[300px] object-cover" />
          </div>
        )}

        {post.caption && (
          <div className="card p-4 mb-6">
            <p className="text-sm font-medium">{post.caption}</p>
          </div>
        )}

        <div className="mb-4">
          <h2 className="font-serif text-lg font-bold">
            {products.length} produit{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {products.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <div className="aspect-square bg-sable-chaud dark:bg-encre-nuit/40">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon size={28} className="text-brume" />
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <p className="text-sm font-medium line-clamp-2">{p.name}</p>
                {p.description && (
                  <p className="text-xs text-brume line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm font-bold text-vert-marche">{p.price} {p.currency}</p>
                  {p.stock !== undefined && p.stock > 0 && (
                    <span className="badge bg-vert-marche/10 text-vert-marche text-[10px]">Stock: {p.stock}</span>
                  )}
                </div>
                {store.whatsapp_number && (
                  <button
                    onClick={() => handleWhatsAppOrder(p.name)}
                    className="btn-cta w-full text-xs"
                  >
                    <MessageCircle size={14} /> Commander
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to={`/boutique/${store.slug}`} className="btn-outline">
            Voir toute la boutique <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-brume">
            Propulsé par <span className="font-serif font-bold text-vert-marche">StatusMarket</span> — Ta boutique, un seul lien.
          </p>
        </div>
      </div>

      <PWAInstallPrompt />
    </div>
  );
}
