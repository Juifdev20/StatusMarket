import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Store as StoreIcon, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/authContext';
import { FollowButton } from '../../components/FollowButton';
import type { StoreFollow, Store } from '../../types';

interface FollowRow extends StoreFollow {
  store?: Store | null;
}

export function FollowedStoresTab() {
  const { profile } = useAuth();
  const [follows, setFollows] = useState<FollowRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('store_follows')
        .select('*, store:stores(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (data) setFollows(data as FollowRow[]);
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

  if (follows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users size={48} className="text-brume mb-4" />
        <p className="text-brume">Vous ne suivez aucune boutique pour le moment.</p>
        <Link to="/" className="btn-primary text-sm mt-4">Découvrir des boutiques</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-xl font-bold mb-4">Boutiques suivies</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {follows.filter((f) => f.store).map((f) => {
          const s = f.store!;
          return (
            <div key={f.id} className="card p-4 flex flex-col items-center text-center">
              <Link to={`/boutique/${s.slug}`} className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-vert-marche/10 overflow-hidden mb-2 flex items-center justify-center">
                  {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-full w-full object-cover" /> : <StoreIcon size={24} className="text-vert-marche" />}
                </div>
                <p className="text-sm font-semibold truncate w-full">{s.name}</p>
                {s.city && <p className="text-xs text-brume flex items-center gap-1 mt-1"><MapPin size={10} /> {s.city}</p>}
              </Link>
              <FollowButton storeId={s.id} className="mt-2 w-full justify-center" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
