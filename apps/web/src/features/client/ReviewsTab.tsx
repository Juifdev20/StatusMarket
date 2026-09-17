import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/authContext';
import { StarRating } from '../../components/StarRating';
import type { Review, Product, Store } from '../../types';

interface ReviewRow extends Review {
  product?: (Product & { store?: { slug: string } | null }) | null;
  store?: Store | null;
}

export function ReviewsTab() {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('reviews')
      .select('*, product:products(*, store:stores(slug)), store:stores(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) setReviews(data as ReviewRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [profile]);

  const handleDelete = async (id: string) => {
    await supabase.from('reviews').delete().eq('id', id);
    await load();
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Star size={48} className="text-brume mb-4" />
        <p className="text-brume">Vous n'avez laissé aucun avis pour le moment.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-xl font-bold mb-4">Mes avis</h1>
      <div className="space-y-3">
        {reviews.map((r) => {
          const link = r.product ? `/boutique/${r.product.store?.slug}` : r.store ? `/boutique/${r.store.slug}` : '#';
          const name = r.product?.name || r.store?.name || 'Produit/Boutique supprimé';
          return (
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link to={link} className="text-sm font-semibold hover:text-vert-marche">{name}</Link>
                  <StarRating value={r.rating} readOnly size={13} />
                </div>
                <button onClick={() => handleDelete(r.id)} className="text-xs text-corail-alerte">Supprimer</button>
              </div>
              {r.comment && <p className="text-sm text-brume mt-2">{r.comment}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
