// Ensures share/OG links always use the www subdomain: the GoDaddy apex
// domain forward only redirects the root path, not deep links like /og/*.
export function getSiteUrl(): string {
  const raw = import.meta.env.VITE_SITE_URL || window.location.origin;
  return raw.replace(/^https:\/\/(?!www\.)/, 'https://www.');
}
