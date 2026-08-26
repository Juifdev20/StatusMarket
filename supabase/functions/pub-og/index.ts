// supabase/functions/pub-og/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return new Response('Missing slug', { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response('Server misconfiguration', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: post, error: postError } = await supabase
    .from('status_posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (postError || !post) {
    return new Response('Publication introuvable', { status: 404 });
  }

  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('id', post.store_id)
    .single();
  const products = post.product_ids || [];
  const coverImage = post.cover_image_url || store?.logo_url || '';
  const shareMessage = post.share_message || post.caption || 'Découvrez mes produits sur StatusMarket !';
  const storeName = store?.name || 'StatusMarket';
  const siteUrl = Deno.env.get('SITE_URL') || 'https://statusmarket.store';
  const appUrl = `${siteUrl}/pub/${slug}`;
  const title = `${storeName} sur StatusMarket`;
  const description = shareMessage;

  const productList = products.length > 0
    ? `<p class="products-count">${products.length} produit${products.length > 1 ? 's' : ''} sélectionné${products.length > 1 ? 's' : ''}</p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(appUrl)}" />

  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(appUrl)}" />
  <meta property="og:image" content="${escapeHtml(coverImage)}" />
  <meta property="og:image:width" content="1080" />
  <meta property="og:image:height" content="1080" />
  <meta property="og:site_name" content="StatusMarket" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(coverImage)}" />

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #158F73; color: #1f2937; display: flex; justify-content: center; min-height: 100vh; }
    .card { background: white; width: 100%; max-width: 460px; padding: 24px; border-radius: 24px; margin: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
    img.cover { width: 100%; border-radius: 16px; object-fit: cover; max-height: 320px; margin-bottom: 20px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    .store { color: #158F73; font-weight: 600; margin-bottom: 12px; }
    p { line-height: 1.5; margin-bottom: 16px; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #158F73; color: white; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; width: 100%; text-align: center; }
    .hint { color: #6b7280; font-size: 12px; text-align: center; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    ${coverImage ? `<img class="cover" src="${escapeHtml(coverImage)}" alt="${escapeHtml(storeName)}" />` : ''}
    <h1>${escapeHtml(title)}</h1>
    <div class="store">${escapeHtml(storeName)}</div>
    <p>${escapeHtml(shareMessage)}</p>
    ${productList}
    <a class="btn" href="${escapeHtml(appUrl)}">Voir les produits</a>
    <p class="hint">Propulsé par StatusMarket — Ta boutique, un seul lien.</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...corsHeaders,
    },
  });
});
