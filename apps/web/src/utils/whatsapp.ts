import { getSiteUrl } from './siteUrl';

interface ContactableProduct {
  id: string;
  name: string;
  price: number;
  discount_price?: number | null;
  currency: string;
}

interface ContactableStore {
  whatsapp_number?: string | null;
}

// Builds a wa.me link with a pre-filled, personalized message including the
// product's name, price, and a link to its OG page — WhatsApp cannot attach
// an image directly, but it auto-generates a photo preview from that link.
export function buildWhatsAppContactLink(product: ContactableProduct, store: ContactableStore): string | null {
  const number = store.whatsapp_number?.replace(/[^0-9]/g, '');
  if (!number) return null;

  const price = product.discount_price && product.discount_price < product.price ? product.discount_price : product.price;
  const productUrl = `${getSiteUrl()}/og/product/${product.id}`;
  const text = `Bonjour, je suis intéressé(e) par ce produit : ${product.name} (${price} ${product.currency}).\nEst-ce qu'on peut discuter ?\n${productUrl}`;

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
