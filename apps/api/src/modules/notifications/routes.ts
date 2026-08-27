import { Router } from 'express';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { asyncHandler } from '../../middlewares/asyncHandler';

const router = Router();

// Check if seller's store is incomplete and send a reminder if last reminder > 24h
router.post('/check-store-setup', asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const supabase = getSupabaseAdmin();

  // Get the seller's store
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle();

  if (!store) return res.json({ sent: false, reason: 'no_store' });

  // Check if store is complete
  const isComplete =
    store.logo_url !== null &&
    store.city !== null &&
    store.quartier !== null &&
    store.whatsapp_number !== null &&
    store.store_front_image_url !== null;

  if (isComplete) return res.json({ sent: false, reason: 'complete' });

  // Check if there's already a "finalize" notification in the last 48 hours
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: recentNotif } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .ilike('title', 'Finalisez la configuration%')
    .gte('created_at', fortyEightHoursAgo)
    .maybeSingle();

  if (recentNotif) return res.json({ sent: false, reason: 'recent_reminder_exists' });

  // Send reminder notification
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: 'Finalisez la configuration de votre boutique',
      body: "Votre boutique n'est pas encore complète. Ajoutez votre logo, adresse et informations pour attirer plus de clients.",
      link: '/vendeur',
    });

  if (error) return res.status(500).json({ error: error.message });

  res.json({ sent: true });
}));

export default router;
