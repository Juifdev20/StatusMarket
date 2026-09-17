import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Store as StoreIcon, ShoppingBag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/authContext';
import { FavoriteButton } from '../../components/FavoriteButton';
import type { Favorite, Product, Store } from '../../types';

interface FavoriteRow extends Favorite {
  product?: (Product & { store?: { name: string; slug: string } | null }) | null;
  store?: Store | null;
}

export function FavoritesTab() {
  const { profile } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('favorites')
        .select('*, product:products(*, store:stores(name, slug)), store:stores(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (data) setFavorites(data as FavoriteRow[]);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Heart size={48} className="text-brume mb-4" />
        <p className="text-brume">Aucun favori pour le moment.</p>
        <Link to="/" className="btn-primary text-sm mt-4">Découvrir des boutiques</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-xl font-bold mb-4">Mes favoris</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {favorites.map((f) => {
          if (f.product) {
            const p = f.product;
            return (
              <Link key={f.id} to={`/boutique/${p.store?.slug}`} className="card overflow-hidden relative">
                <div className="aspect-square bg-sable-chaud dark:bg-encre-nuit/40 relative overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ShoppingBag size={28} className="text-brume/40" />
                    </div>
                  )}
                  <FavoriteButton productId={p.id} className="absolute top-1.5 right-1.5 !p-1.5" size={14} />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold line-clamp-2">{p.name}</h3>
                  <p className="mt-1 font-mono text-sm text-vert-marche">{p.price} {p.currency}</p>
                  <p className="text-xs text-brume truncate mt-1">{p.store?.name}</p>
                </div>
              </Link>
            );
          }
          if (f.store) {
            const s = f.store;
            return (
              <Link key={f.id} to={`/boutique/${s.slug}`} className="card p-4 flex flex-col items-center text-center relative">
                <FavoriteButton storeId={s.id} className="!absolute !top-2 !right-2 !p-1.5" size={14} />
                <div className="h-16 w-16 rounded-full bg-vert-marche/10 overflow-hidden mb-2 flex items-center justify-center">
                  {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-full w-full object-cover" /> : <StoreIcon size={24} className="text-vert-marche" />}
                </div>
                <p className="text-sm font-semibold truncate w-full">{s.name}</p>
              </Link>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
