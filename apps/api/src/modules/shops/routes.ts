import { Router } from 'express';
import { z } from 'zod';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { authGuard, AuthedRequest, requireRole } from '../../middlewares/auth';
import { asyncHandler } from '../../middlewares/asyncHandler';

const router = Router();

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createStoreSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(2).max(50).regex(slugRegex, 'Slug must be lowercase, alphanumeric, hyphen-separated'),
  logo_url: z.string().url().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  whatsapp_number: z.string().nullable().optional(),
});

const updateStoreSchema = createStoreSchema.partial();

router.use(authGuard);

router.get('/my', asyncHandler(async (req: AuthedRequest, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', req.user!.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

router.post('/', requireRole('SELLER', 'SUPER_ADMIN'), asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = createStoreSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stores')
    .insert({ ...parsed.data, owner_id: req.user!.id })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}));

router.get('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Store not found' });
  if (data.owner_id !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(data);
}));

router.patch('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = updateStoreSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const supabase = getSupabaseAdmin();
  const { data: store } = await supabase
    .from('stores')
    .select('owner_id')
    .eq('id', req.params.id)
    .single();
  if (!store) return res.status(404).json({ error: 'Store not found' });
  if (store.owner_id !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data, error } = await supabase
    .from('stores')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}));

router.delete('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const supabase = getSupabaseAdmin();
  const { data: store } = await supabase
    .from('stores')
    .select('owner_id')
    .eq('id', req.params.id)
    .single();
  if (!store) return res.status(404).json({ error: 'Store not found' });
  if (store.owner_id !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { error } = await supabase.from('stores').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
}));

export default router;
