import { supabase } from '../lib/supabase';

const BUCKET = 'payment-proofs';

// proof_image_url historically stored a "public" storage URL, but the bucket
// is private (payment proofs are sensitive) — that URL 404s with "Bucket not
// found" since Supabase's public object endpoint only serves public buckets.
// This extracts the object path from either an old broken public URL or a
// bare path (new uploads store the bare path), then mints a fresh signed URL.
export function extractProofPath(stored: string): string {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const signedMarker = `/storage/v1/object/sign/${BUCKET}/`;
  if (stored.includes(marker)) return stored.split(marker)[1].split('?')[0];
  if (stored.includes(signedMarker)) return stored.split(signedMarker)[1].split('?')[0];
  return stored;
}

export async function getSignedProofUrl(stored: string): Promise<string | null> {
  const path = extractProofPath(stored);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}
