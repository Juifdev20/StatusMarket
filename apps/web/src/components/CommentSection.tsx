import { useEffect, useState, useRef } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../features/auth/authContext';
import type { ProductComment } from '../types';

interface CommentSectionProps {
  productId: string;
  storeOwnerId?: string;
}

const MAX_PREVIEW_LENGTH = 100;

export function CommentSection({ productId, storeOwnerId }: CommentSectionProps) {
  const { profile } = useAuth();
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadComments();
  }, [productId]);

  const loadComments = async () => {
    const { data } = await supabase
      .from('product_comments')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (data) setComments(data as ProductComment[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);

    const name = profile?.full_name || authorName.trim() || 'Visiteur';

    let storeId: string | null = null;
    if (profile) {
      const { data: userStore } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', profile.id)
        .maybeSingle();
      if (userStore) storeId = userStore.id;
    }

    const { error } = await supabase.from('product_comments').insert({
      product_id: productId,
      profile_id: profile?.id || null,
      store_id: storeId,
      author_name: name,
      content: content.trim(),
    });

    if (!error) {
      setContent('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      await loadComments();
    }
    setPosting(false);
  };

  const handleDelete = async (commentId: string) => {
    await supabase.from('product_comments').delete().eq('id', commentId);
    await loadComments();
  };

  const canDelete = (comment: ProductComment) => {
    if (comment.profile_id === profile?.id) return true;
    if (storeOwnerId && profile?.id === storeOwnerId) return true;
    return false;
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const displayedComments = showAll ? comments : comments.slice(0, 2);

  const formatContent = (text: string, id: string) => {
    const isLong = text.length > MAX_PREVIEW_LENGTH;
    const isExpanded = expanded.has(id);
    const display = isExpanded || !isLong ? text : `${text.slice(0, MAX_PREVIEW_LENGTH)}...`;
    return { display, isLong };
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div className="mt-3 border-t border-brume/20 pt-3">
      <div className="flex items-center gap-1.5 mb-2">
        <MessageCircle size={14} className="text-brume" />
        <span className="text-xs font-medium text-brume">
          {comments.length} commentaire{comments.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Comment list */}
      {!loading && displayedComments.length > 0 && (
        <div className="space-y-2 mb-3">
          {displayedComments.map((c) => {
            const { display, isLong } = formatContent(c.content, c.id);
            return (
              <div key={c.id} className="flex gap-2 group">
                <div className="h-6 w-6 shrink-0 rounded-full bg-vert-marche/20 flex items-center justify-center text-[10px] font-bold text-vert-marche">
                  {c.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="rounded-xl bg-sable-chaud dark:bg-encre-nuit/40 px-3 py-2">
                    <p className="text-[11px] font-semibold text-encre-nuit dark:text-sable-chaud leading-tight">
                      {c.author_name}
                      {c.store_id && (
                        <span className="ml-1.5 badge bg-vert-marche/10 text-vert-marche text-[9px]">Boutique</span>
                      )}
                    </p>
                    <p className="text-xs text-encre-nuit dark:text-sable-chaud mt-0.5 break-words leading-snug">
                      {display}
                      {isLong && (
                        <button
                          onClick={() => toggleExpand(c.id)}
                          className="ml-1 text-vert-marche font-medium hover:underline"
                        >
                          {expanded.has(c.id) ? 'Voir moins' : 'Voir plus'}
                        </button>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 px-1">
                    <span className="text-[10px] text-brume">
                      {new Date(c.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {canDelete(c) && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-[10px] text-corail-alerte opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {comments.length > 2 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="text-xs text-vert-marche hover:underline"
            >
              Voir les {comments.length - 2} autres commentaires
            </button>
          )}
        </div>
      )}

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-start">
        <div className="h-6 w-6 mt-1 shrink-0 rounded-full bg-brume/20 flex items-center justify-center text-[10px] font-bold text-brume">
          {profile?.full_name?.charAt(0).toUpperCase() || 'V'}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {!profile && (
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Votre nom"
              className="input w-full text-xs h-7 py-1 px-2"
              maxLength={50}
            />
          )}
          <div className="flex gap-1.5">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                autoResize(e.target);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Écrivez un commentaire..."
              className="input flex-1 text-xs py-1.5 px-2 min-h-[2rem] max-h-[120px] resize-none overflow-y-auto w-full"
              rows={1}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={posting || !content.trim()}
              className="btn-cta p-1.5 h-8 w-8 shrink-0 flex items-center justify-center mt-auto"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
