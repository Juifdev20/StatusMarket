import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useFollowerCount(storeId: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    supabase
      .from('store_follower_counts')
      .select('follower_count')
      .eq('store_id', storeId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setCount(data?.follower_count ?? 0);
      });

    const channel = supabase
      .channel(`follower-count-${storeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_follows', filter: `store_id=eq.${storeId}` }, () => {
        supabase
          .from('store_follower_counts')
          .select('follower_count')
          .eq('store_id', storeId)
          .maybeSingle()
          .then(({ data }) => {
            if (active) setCount(data?.follower_count ?? 0);
          });
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  return count;
}
