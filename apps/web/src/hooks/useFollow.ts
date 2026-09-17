import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../features/auth/authContext';

export function useFollow(storeId: string) {
  const { profile } = useAuth();
  const [followId, setFollowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) {
      setFollowId(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('store_follows')
      .select('id')
      .eq('user_id', profile.id)
      .eq('store_id', storeId)
      .maybeSingle();
    setFollowId(data?.id || null);
    setLoading(false);
  }, [profile, storeId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async () => {
    if (!profile) return false;

    if (followId) {
      await supabase.from('store_follows').delete().eq('id', followId);
      setFollowId(null);
      return false;
    }

    const { data } = await supabase
      .from('store_follows')
      .insert({ user_id: profile.id, store_id: storeId })
      .select('id')
      .single();
    setFollowId(data?.id || null);
    return true;
  };

  return { isFollowing: !!followId, toggle, loading };
}
