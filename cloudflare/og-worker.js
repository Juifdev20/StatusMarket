export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/og/')) {
      const apiUrl = `https://statusmarket-api.onrender.com${url.pathname}`;
      const apiResponse = await fetch(apiUrl, {
        headers: { 'User-Agent': request.headers.get('User-Agent') || 'WhatsApp/2.0' },
      });

      const html = await apiResponse.text();
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    return fetch(request);
  },
};
