import { MessageCircle } from 'lucide-react';
import { buildWhatsAppContactLink } from '../utils/whatsapp';

interface WhatsAppContactButtonProps {
  product: { id: string; name: string; price: number; discount_price?: number | null; currency: string };
  store: { whatsapp_number?: string | null };
  className?: string;
}

export function WhatsAppContactButton({ product, store, className = '' }: WhatsAppContactButtonProps) {
  const link = buildWhatsAppContactLink(product, store);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (link) window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!link}
      title={link ? 'Contacter le vendeur sur WhatsApp' : 'Numéro WhatsApp non renseigné'}
      className={`btn-cta text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 ${className}`}
    >
      <MessageCircle size={14} /> WhatsApp
    </button>
  );
}
