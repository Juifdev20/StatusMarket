import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, Store } from '../types';

export function useTrendingProducts(limit = 10) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: ranked } = await supabase.rpc('get_trending_products', {
        days_back: 7,
        limit_count: limit,
      });
      const ids = (ranked || []).map((r: { product_id: string }) => r.product_id);
      if (ids.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      const { data: rows } = await supabase
        .from('products')
        .select('*, store:stores(name, slug, logo_url, city)')
        .in('id', ids)
        .eq('is_available', true);
      const byId = new Map((rows || []).map((p) => [p.id, p as Product]));
      setProducts(ids.map((id: string) => byId.get(id)).filter(Boolean) as Product[]);
      setLoading(false);
    })();
  }, [limit]);

  return { products, loading };
}

export function useTrendingStores(limit = 10) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: ranked } = await supabase.rpc('get_trending_stores', {
        days_back: 7,
        limit_count: limit,
      });
      const ids = (ranked || []).map((r: { store_id: string }) => r.store_id);
      if (ids.length === 0) {
        setStores([]);
        setLoading(false);
        return;
      }
      const { data: rows } = await supabase
        .from('stores')
        .select('*')
        .in('id', ids)
        .eq('is_active', true)
        .eq('is_suspended', false);
      const byId = new Map((rows || []).map((s) => [s.id, s as Store]));
      setStores(ids.map((id: string) => byId.get(id)).filter(Boolean) as Store[]);
      setLoading(false);
    })();
  }, [limit]);

  return { stores, loading };
}
