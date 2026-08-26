import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Share2, Eye, Trash2, Plus, ExternalLink, Image as ImageIcon, Store as StoreIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/authContext';
import type { Store, StatusPost } from '../../types';

export function PublicationsPage() {
  const { profile } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [posts, setPosts] = useState<StatusPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: s, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', profile.id)
        .maybeSingle();
      if (error) {
        console.error('Error fetching store for publications:', error);
      } else if (s) {
        const storeData = s as Store;
        setStore(storeData);
        await loadPosts(storeData.id);
      }
      setLoading(false);
    })();
  }, [profile]);

  const loadPosts = async (storeId: string) => {
    const { data } = await supabase
      .from('status_posts')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (data) setPosts(data as StatusPost[]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette publication ?')) return;
    await supabase.from('status_posts').delete().eq('id', id);
    if (store) await loadPosts(store.id);
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/pub/${slug}`);
  };

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" /></div>;
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <StoreIcon size={48} className="text-brume mb-4" />
        <h2 className="font-serif text-xl font-bold mb-2">Aucune boutique</h2>
        <p className="text-sm text-brume mb-6">Créez d'abord votre boutique pour gérer vos publications.</p>
        <a href="/vendeur/boutique/nouvelle" className="btn-cta">
          <Plus size={18} /> Créer ma boutique
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Mes publications</h1>
        <Link to="/vendeur/statut" className="btn-primary text-xs">
          <Plus size={16} /> Nouvelle
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Share2 size={48} className="text-brume mb-4" />
          <p className="text-brume">Aucune publication. Créez votre première !</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div key={post.id} className="card overflow-hidden flex flex-col">
              <div className="aspect-video bg-sable-chaud dark:bg-encre-nuit/40 overflow-hidden">
                {post.cover_image_url ? (
                  <img src={post.cover_image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon size={32} className="text-brume" />
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-sm font-semibold line-clamp-2">{post.caption || 'Publication sans titre'}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-brume">
                  <span className="flex items-center gap-1"><Eye size={14} /> {post.views}</span>
                  <span>{new Date(post.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <a href={`/pub/${post.slug}`} target="_blank" rel="noopener noreferrer" className="btn-outline flex-1 text-xs">
                    <ExternalLink size={14} /> Voir
                  </a>
                  <button onClick={() => copyLink(post.slug)} className="btn-ghost p-2" title="Copier le lien">
                    <Share2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(post.id)} className="btn-ghost p-2 text-corail-alerte" title="Supprimer">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
