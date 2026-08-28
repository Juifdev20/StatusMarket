import { Router } from 'express';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { asyncHandler } from '../../middlewares/asyncHandler';

const router = Router();

const SITE_URL = process.env.SITE_URL || 'https://www.statusmarket.store';
const OG_WORKER_URL = process.env.OG_WORKER_URL || 'https://statusmarket-og.maestrodieudonne964.workers.dev';
const DEFAULT_OG_IMAGE = 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=630&fit=crop';

function ensureWww(url: string): string {
  return url.replace('https://statusmarket.store', 'https://www.statusmarket.store');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildOgHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
  redirectUrl: string;
  siteName?: string;
}): string {
  const { title, description, image, url, redirectUrl, siteName = 'StatusMarket' } = opts;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="product" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:site_name" content="${escapeHtml(siteName)}" />
  <meta property="og:locale" content="fr_FR" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />

  <!-- Redirect for human visitors -->
  <meta http-equiv="refresh" content="0; url=${escapeHtml(redirectUrl)}" />
  <link rel="canonical" href="${escapeHtml(url)}" />
</head>
<body>
  <p>Redirection vers <a href="${escapeHtml(redirectUrl)}">${escapeHtml(title)}</a>...</p>
  <script>window.location.href = ${JSON.stringify(redirectUrl)};</script>
</body>
</html>`;
}

// OG endpoint for products: /og/product/:id
router.get('/product/:id', asyncHandler(async (req, res) => {
  const supabase = getSupabaseAdmin();
  const { id } = req.params;

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      id, name, description, price, discount_price, currency,
      image_url, share_preview_image_url, images,
      store:stores ( id, name, slug, logo_url, description )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !product) {
    return res.status(404).send(buildOgHtml({
      title: 'Produit introuvable',
      description: 'Ce produit n\'existe plus ou a été supprimé.',
      image: DEFAULT_OG_IMAGE,
      url: `${SITE_URL}`,
      redirectUrl: ensureWww(`${SITE_URL}`),
    }));
  }

  const storeData = (product.store as any) || {};
  const storeName = storeData.name || 'Boutique';
  const storeSlug = storeData.slug || '';
  const displayPrice = product.discount_price && product.discount_price < product.price
    ? product.discount_price
    : product.price;
  const ogImage = product.share_preview_image_url || product.image_url || storeData.logo_url || DEFAULT_OG_IMAGE;
  const productUrl = ensureWww(`${SITE_URL}/boutique/${storeSlug}`);
  const shareUrl = `${OG_WORKER_URL}/og/product/${id}`;
  const title = `${product.name} — ${storeName}`;
  const description = product.description
    ? `${product.description} — ${displayPrice} ${product.currency}`
    : `${product.name} disponible chez ${storeName} — ${displayPrice} ${product.currency}`;

  res.set('Content-Type', 'text/html');
  res.send(buildOgHtml({ title, description, image: ogImage, url: shareUrl, redirectUrl: productUrl, siteName: storeName }));
}));

// OG endpoint for stores: /og/store/:slug
router.get('/store/:slug', asyncHandler(async (req, res) => {
  const supabase = getSupabaseAdmin();
  const { slug } = req.params;

  const { data: store, error } = await supabase
    .from('stores')
    .select('id, name, slug, description, logo_url, store_front_image_url, city, quartier')
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('is_suspended', false)
    .maybeSingle();

  if (error || !store) {
    return res.status(404).send(buildOgHtml({
      title: 'Boutique introuvable',
      description: 'Cette boutique n\'existe plus ou a été désactivée.',
      image: DEFAULT_OG_IMAGE,
      url: `${SITE_URL}`,
      redirectUrl: ensureWww(`${SITE_URL}`),
    }));
  }

  const ogImage = store.logo_url || store.store_front_image_url || DEFAULT_OG_IMAGE;
  const storeUrl = ensureWww(`${SITE_URL}/boutique/${store.slug}`);
  const shareUrl = `${OG_WORKER_URL}/og/store/${store.slug}`;
  const title = `${store.name} — StatusMarket`;
  const description = store.description
    ? store.description
    : `Découvrez ${store.name} sur StatusMarket${store.city ? ` à ${store.city}` : ''}.`;

  res.set('Content-Type', 'text/html');
  res.send(buildOgHtml({ title, description, image: ogImage, url: shareUrl, redirectUrl: storeUrl, siteName: store.name }));
}));

// OG endpoint for status publications: /og/pub/:slug
router.get('/pub/:slug', asyncHandler(async (req, res) => {
  const supabase = getSupabaseAdmin();
  const { slug } = req.params;

  const { data: post, error } = await supabase
    .from('status_posts')
    .select('id, caption, cover_image_url, share_message, store:stores ( id, name, slug, logo_url )')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !post) {
    return res.status(404).send(buildOgHtml({
      title: 'Publication introuvable',
      description: 'Cette publication n\'existe plus ou a été supprimée.',
      image: DEFAULT_OG_IMAGE,
      url: `${SITE_URL}`,
      redirectUrl: ensureWww(`${SITE_URL}`),
    }));
  }

  const storeData = (post.store as any) || {};
  const storeName = storeData.name || 'Boutique';
  const storeSlug = storeData.slug || '';
  const ogImage = post.cover_image_url || storeData.logo_url || DEFAULT_OG_IMAGE;
  const pubUrl = ensureWww(`${SITE_URL}/pub/${slug}`);
  const shareUrl = `${OG_WORKER_URL}/og/pub/${slug}`;
  const title = post.caption ? `${post.caption} — ${storeName}` : `${storeName} sur StatusMarket`;
  const description = post.share_message || `Découvrez ${storeName} sur StatusMarket.`;

  res.set('Content-Type', 'text/html');
  res.send(buildOgHtml({ title, description, image: ogImage, url: shareUrl, redirectUrl: pubUrl, siteName: storeName }));
}));

export default router;
