import type { Subscription } from '../types';

export function isSubscriptionActive(sub: Subscription | null | undefined): boolean {
  if (!sub) return false;
  if (sub.status === 'ACTIVE') return !sub.expires_at || new Date(sub.expires_at) > new Date();
  if (sub.status === 'TRIAL') return !sub.trial_ends_at || new Date(sub.trial_ends_at) > new Date();
  return false;
}

// Stricter than isSubscriptionActive: a free trial does NOT count as a paid
// plan. AI generation is a paid-only perk, unlike other trial-included features.
export function hasPaidSubscription(sub: Subscription | null | undefined): boolean {
  if (!sub || sub.status !== 'ACTIVE') return false;
  return !sub.expires_at || new Date(sub.expires_at) > new Date();
}
