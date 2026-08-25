import { Router } from 'express';
import { z } from 'zod';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { authGuard, AuthedRequest } from '../../middlewares/auth';
import { asyncHandler } from '../../middlewares/asyncHandler';

const router = Router();

const submitPaymentSchema = z.object({
  plan_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  proof_image_url: z.string().url(),
  reference: z.string().min(1).max(200),
});

router.use(authGuard);

router.get('/my', asyncHandler(async (req: AuthedRequest, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('payments')
    .select('*, plan:subscription_plans(*)')
    .eq('seller_id', req.user!.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

router.post('/', asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = submitPaymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('payments')
    .insert({
      ...parsed.data,
      seller_id: req.user!.id,
      status: 'PENDING',
      mode: 'MANUAL',
    })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}));

export default router;
