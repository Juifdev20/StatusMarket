const CRAWLER_PATTERNS = [
  'whatsapp',
  'facebookexternalhit',
  'facebookcatalog',
  'twitterbot',
  'linkedinbot',
  'telegrambot',
  'googlebot',
  'bingbot',
  'slackbot',
  'discordbot',
  'applebot',
  'pinterest',
  'crawler',
  'bot',
  'spider',
  'preview',
  'fetch',
];

function isCrawler(userAgent) {
  const ua = (userAgent || '').toLowerCase();
  return CRAWLER_PATTERNS.some((p) => ua.includes(p));
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/og/')) {
      const userAgent = request.headers.get('User-Agent') || '';
      const apiUrl = `https://statusmarket-api.onrender.com${url.pathname}`;
      const apiResponse = await fetch(apiUrl, {
        headers: { 'User-Agent': userAgent || 'WhatsApp/2.0' },
      });

      const html = await apiResponse.text();

      // For real users (not crawlers), extract the redirect URL and do a 302
      if (!isCrawler(userAgent)) {
        const match = html.match(/window\.location\.href\s*=\s*("([^"]+)"|'([^']+)')/);
        if (match) {
          const redirectUrl = match[2] || match[3];
          return Response.redirect(redirectUrl, 302);
        }
      }

      // For crawlers, return the full HTML with OG tags
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    return fetch(request);
  },
};
