import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../features/auth/authContext';

interface FavoriteTarget {
  productId?: string;
  storeId?: string;
}

// Tracks/toggles favorite status for a single product or store target.
// For listing the user's full favorites (e.g. the "Mes favoris" tab), query
// the `favorites` table directly instead of this hook.
export function useFavorite({ productId, storeId }: FavoriteTarget) {
  const { profile } = useAuth();
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) {
      setFavoriteId(null);
      setLoading(false);
      return;
    }
    let query = supabase.from('favorites').select('id').eq('user_id', profile.id);
    query = productId ? query.eq('product_id', productId) : query.eq('store_id', storeId);
    const { data } = await query.maybeSingle();
    setFavoriteId(data?.id || null);
    setLoading(false);
  }, [profile, productId, storeId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async () => {
    if (!profile) return false;

    if (favoriteId) {
      await supabase.from('favorites').delete().eq('id', favoriteId);
      setFavoriteId(null);
      return false;
    }

    const { data } = await supabase
      .from('favorites')
      .insert({ user_id: profile.id, product_id: productId || null, store_id: storeId || null })
      .select('id')
      .single();
    setFavoriteId(data?.id || null);
    return true;
  };

  return { isFavorite: !!favoriteId, toggle, loading };
}
