import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../features/auth/authContext';
import { StarRating } from './StarRating';
import type { Review } from '../types';

interface ReviewSectionProps {
  productId: string;
  storeOwnerId?: string;
}

export function ReviewSection({ productId, storeOwnerId }: ReviewSectionProps) {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (data) setReviews(data as Review[]);

    if (profile) {
      const mine = (data || []).find((r) => r.user_id === profile.id);
      if (mine) {
        setMyRating(mine.rating);
        setMyComment(mine.comment || '');
      }
    }
    setLoading(false);
  };

  const myExistingReview = profile ? reviews.find((r) => r.user_id === profile.id) : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || myRating === 0) return;
    setPosting(true);

    if (myExistingReview) {
      await supabase
        .from('reviews')
        .update({ rating: myRating, comment: myComment.trim() || null })
        .eq('id', myExistingReview.id);
    } else {
      await supabase.from('reviews').insert({
        user_id: profile.id,
        product_id: productId,
        rating: myRating,
        comment: myComment.trim() || null,
      });
    }
    await loadReviews();
    setPosting(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('reviews').delete().eq('id', id);
    setMyRating(0);
    setMyComment('');
    await loadReviews();
  };

  const canDelete = (review: Review) => review.user_id === profile?.id || storeOwnerId === profile?.id;

  const displayedReviews = showAll ? reviews : reviews.slice(0, 2);

  return (
    <div className="mt-3 border-t border-brume/20 pt-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Star size={14} className="text-brume" />
        <span className="text-xs font-medium text-brume">
          {reviews.length} avis
        </span>
      </div>

      {!loading && displayedReviews.length > 0 && (
        <div className="space-y-2 mb-3">
          {displayedReviews.map((r) => (
            <div key={r.id} className="flex gap-2 group">
              <div className="flex-1 min-w-0">
                <div className="rounded-xl bg-sable-chaud dark:bg-encre-nuit/40 px-3 py-2">
                  <StarRating value={r.rating} readOnly size={12} />
                  {r.comment && (
                    <p className="text-xs text-encre-nuit dark:text-sable-chaud mt-1 break-words leading-snug">
                      {r.comment}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 px-1">
                  <span className="text-[10px] text-brume">
                    {new Date(r.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                  {canDelete(r) && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-[10px] text-corail-alerte opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {reviews.length > 2 && !showAll && (
            <button onClick={() => setShowAll(true)} className="text-xs text-vert-marche hover:underline">
              Voir les {reviews.length - 2} autres avis
            </button>
          )}
        </div>
      )}

      {profile ? (
        <form onSubmit={handleSubmit} className="space-y-1.5">
          <StarRating value={myRating} onChange={setMyRating} size={18} />
          <div className="flex gap-1.5">
            <textarea
              value={myComment}
              onChange={(e) => setMyComment(e.target.value)}
              placeholder="Votre avis (optionnel)..."
              className="input flex-1 text-xs py-1.5 px-2 min-h-[2rem] max-h-[120px] resize-none w-full"
              rows={1}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={posting || myRating === 0}
              className="btn-cta text-xs px-3 shrink-0"
            >
              {myExistingReview ? 'Modifier' : 'Envoyer'}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-brume">Connectez-vous pour laisser un avis.</p>
      )}
    </div>
  );
}
