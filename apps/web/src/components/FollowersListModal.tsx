import { useEffect, useState } from 'react';
import { X, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

interface Follower {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

interface FollowersListModalProps {
  storeId: string;
  onClose: () => void;
}

const PAGE_SIZE = 30;

export function FollowersListModal({ storeId, onClose }: FollowersListModalProps) {
  const { t } = useTranslation();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = async (offset: number) => {
    const { data } = await supabase
      .from('store_followers_public')
      .select('user_id, display_name, avatar_url')
      .eq('store_id', storeId)
      .range(offset, offset + PAGE_SIZE - 1);
    return data || [];
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchPage(0);
      setFollowers(data);
      setHasMore(data.length === PAGE_SIZE);
      setLoading(false);
    })();
  }, [storeId]);

  const loadMore = async () => {
    setLoadingMore(true);
    const data = await fetchPage(followers.length);
    setFollowers((prev) => [...prev, ...data]);
    setHasMore(data.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-0 sm:items-center sm:px-4" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full flex-col rounded-t-2xl bg-white dark:bg-encre-nuit sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brume/20 p-4">
          <h2 className="font-serif text-lg font-bold">{t('followers.title')}</h2>
          <button onClick={onClose} className="text-brume hover:text-encre-nuit dark:hover:text-sable-chaud">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" />
            </div>
          ) : followers.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center text-brume">
              <Users size={32} className="mb-2" />
              <p className="text-sm">{t('followers.empty')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-brume/10">
              {followers.map((f) => (
                <li key={f.user_id} className="flex items-center gap-3 p-2">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-sable-chaud dark:bg-encre-nuit/40">
                    {f.avatar_url ? (
                      <img src={f.avatar_url} alt={f.display_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-brume">
                        <Users size={16} />
                      </div>
                    )}
                  </div>
                  <span className="truncate text-sm font-medium">{f.display_name}</span>
                </li>
              ))}
            </ul>
          )}

          {hasMore && !loading && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="btn-ghost mt-2 w-full text-sm text-vert-marche"
            >
              {loadingMore ? t('common.loading') : t('followers.loadMore')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
