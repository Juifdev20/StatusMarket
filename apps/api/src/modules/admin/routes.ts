import { Router } from 'express';
import { z } from 'zod';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { authGuard, AuthedRequest, requireRole } from '../../middlewares/auth';
import { asyncHandler } from '../../middlewares/asyncHandler';

const router = Router();

router.use(authGuard, requireRole('SUPER_ADMIN'));

router.get('/dashboard', asyncHandler(async (_req, res) => {
  const supabase = getSupabaseAdmin();
  const [sellers, stores, products, payments, subscriptions] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'SELLER'),
    supabase.from('stores').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'TRIAL'),
  ]);
  res.json({
    sellers: sellers.count ?? 0,
    stores: stores.count ?? 0,
    products: products.count ?? 0,
    pending_payments: payments.count ?? 0,
    active_trials: subscriptions.count ?? 0,
  });
}));

router.get('/sellers', asyncHandler(async (_req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'SELLER')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

router.get('/stores', asyncHandler(async (_req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stores')
    .select('*, owner:profiles(*)')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

const toggleStoreSchema = z.object({
  is_active: z.boolean().optional(),
  is_suspended: z.boolean().optional(),
});

router.patch('/stores/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = toggleStoreSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stores')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}));

router.get('/payments', asyncHandler(async (req, res) => {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('payments')
    .select('*, seller:profiles(*), plan:subscription_plans(*)')
    .order('created_at', { ascending: false });
  if (req.query.status) {
    query = query.eq('status', req.query.status as string);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

const reviewPaymentSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejection_reason: z.string().optional(),
});

router.patch('/payments/:id/review', asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = reviewPaymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const supabase = getSupabaseAdmin();

  const { data: payment } = await supabase
    .from('payments')
    .select('*, plan:subscription_plans(*)')
    .eq('id', req.params.id)
    .single();
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  if (parsed.data.status === 'APPROVED') {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + payment.plan.duration_days * 24 * 60 * 60 * 1000);

    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        seller_id: payment.seller_id,
        plan_id: payment.plan_id,
        status: 'ACTIVE',
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();
    if (subError) return res.status(400).json({ error: subError.message });

    await supabase
      .from('payments')
      .update({
        status: 'APPROVED',
        subscription_id: sub.id,
        reviewed_by: req.user!.id,
        reviewed_at: now.toISOString(),
      })
      .eq('id', req.params.id);

    await supabase
      .from('profiles')
      .update({ role: 'SELLER' })
      .eq('id', payment.seller_id);

    res.json({ message: 'Payment approved, subscription activated', subscription: sub });
  } else {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'REJECTED',
        rejection_reason: parsed.data.rejection_reason || null,
        reviewed_by: req.user!.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  }
}));

router.get('/plans', asyncHandler(async (_req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

const updatePlanSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  price_usd: z.number().nonnegative().optional(),
  duration_days: z.number().int().positive().optional(),
  max_products: z.number().int().positive().nullable().optional(),
  max_stores: z.number().int().positive().optional(),
  features: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

router.patch('/plans/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = updatePlanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('subscription_plans')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}));

router.get('/settings', asyncHandler(async (_req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

const updateSettingsSchema = z.object({
  trial_duration_days: z.number().int().positive().optional(),
  trial_alert_days: z.number().int().nonnegative().optional(),
});

router.patch('/settings', asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = updateSettingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('platform_settings')
    .update(parsed.data)
    .eq('id', 1)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}));

router.get('/reports', asyncHandler(async (_req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

const updateReportSchema = z.object({
  status: z.enum(['OPEN', 'RESOLVED', 'DISMISSED']),
});

router.patch('/reports/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = updateReportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('reports')
    .update({ status: parsed.data.status })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}));

router.get('/products', asyncHandler(async (_req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('*, store:stores(name)')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

const updateProductSchema = z.object({
  is_available: z.boolean().optional(),
});

router.patch('/products/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}));

export default router;
