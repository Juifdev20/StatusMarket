import { useState } from 'react';
import { X, Share2, MessageCircle, Copy, Check, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, Store } from '../types';

const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin;
const OG_WORKER_URL = 'https://www.statusmarket.store';

interface ShareDialogProps {
  product: Product;
  store: Store;
  onClose: () => void;
  onPreviewImageChange?: (imageUrl: string | null) => void;
}

export function ShareDialog({ product, store, onClose, onPreviewImageChange }: ShareDialogProps) {
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(
    product.share_preview_image_url || product.image_url || null
  );
  const [savingImage, setSavingImage] = useState(false);

  const allImages: string[] = [
    ...(product.images?.length ? product.images : []),
    ...(product.image_url ? [product.image_url] : []),
  ].filter((v, i, self) => v && self.indexOf(v) === i);

  const ogUrl = `${OG_WORKER_URL}/og/product/${product.id}`;
  const displayPrice = product.discount_price && product.discount_price < product.price
    ? `${product.discount_price} ${product.currency}`
    : `${product.price} ${product.currency}`;

  const handleShareWhatsApp = () => {
    const text = message ? `${message}\n\n${ogUrl}` : ogUrl;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(ogUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSelectImage = async (img: string) => {
    setSelectedImage(img);
    setSavingImage(true);
    const fallback = img === product.image_url ? null : img;
    await supabase
      .from('products')
      .update({ share_preview_image_url: fallback })
      .eq('id', product.id);
    setSavingImage(false);
    onPreviewImageChange?.(fallback);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4" onClick={onClose}>
      <div className="card w-full max-w-md flex flex-col rounded-b-none md:rounded-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-brume/10 p-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold flex items-center gap-2">
            <Share2 size={18} /> Partager le produit
          </h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Image d'aperçu */}
          {allImages.length > 0 && (
            <div>
              <label className="label flex items-center gap-1">
                <ImageIcon size={14} /> Image d'aperçu
              </label>
              <p className="text-xs text-brume mb-2">Choisissez l'image affichée dans l'aperçu WhatsApp</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img) => (
                  <button
                    key={img}
                    onClick={() => handleSelectImage(img)}
                    className={`relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === img ? 'border-vert-marche ring-2 ring-vert-marche/30' : 'border-brume/20'}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    {selectedImage === img && (
                      <div className="absolute inset-0 bg-vert-marche/20 flex items-center justify-center">
                        <Check size={16} className="text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {savingImage && <p className="text-xs text-brume">Enregistrement...</p>}
            </div>
          )}

          {/* Aperçu WhatsApp */}
          <div>
            <label className="label">Aperçu du partage</label>
            <div className="rounded-xl border border-brume/20 overflow-hidden bg-white dark:bg-encre-nuit/60">
              <div className="aspect-[1.91:1] bg-sable-chaud dark:bg-encre-nuit/40 overflow-hidden">
                {selectedImage ? (
                  <img src={selectedImage} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-brume">
                    <ImageIcon size={32} />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold truncate">{product.name} — {store.name}</p>
                <p className="text-xs text-brume line-clamp-2 mt-0.5">
                  {product.description || `${product.name} disponible chez ${store.name}`} — {displayPrice}
                </p>
                <p className="text-[10px] text-brume mt-1">{SITE_URL.replace(/^https?:\/\//, '')}</p>
              </div>
            </div>
          </div>

          {/* Message personnalisé */}
          <div>
            <label className="label">Message WhatsApp (optionnel)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input min-h-[80px]"
              placeholder="🔥 Nouvelle arrivage !&#10;Découvrez ce produit sur ma boutique 👇"
            />
            <p className="text-xs text-brume mt-1">Votre message sera suivi du lien du produit.</p>
          </div>

          {/* Lien OG */}
          <div>
            <label className="label">Lien de partage</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={ogUrl}
                className="input flex-1 text-xs"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button onClick={handleCopyLink} className="btn-outline p-2 shrink-0" title="Copier le lien">
                {copied ? <Check size={16} className="text-vert-marche" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-brume/10 bg-inherit p-4 flex gap-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Fermer</button>
          <button type="button" onClick={handleShareWhatsApp} className="btn-cta flex-1 flex items-center justify-center gap-2">
            <MessageCircle size={18} /> Partager sur WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
