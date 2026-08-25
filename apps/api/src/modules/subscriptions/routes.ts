import { Router } from 'express';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { authGuard, AuthedRequest } from '../../middlewares/auth';
import { asyncHandler } from '../../middlewares/asyncHandler';

const router = Router();

router.use(authGuard);

router.get('/my', asyncHandler(async (req: AuthedRequest, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plan:subscription_plans(*)')
    .eq('seller_id', req.user!.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

router.get('/plans', asyncHandler(async (_req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

export default router;
