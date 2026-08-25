import { Router } from 'express';
import { z } from 'zod';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { authGuard, AuthedRequest } from '../../middlewares/auth';
import { asyncHandler } from '../../middlewares/asyncHandler';

const router = Router();

const createCategorySchema = z.object({
  store_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
});

router.use(authGuard);

router.get('/store/:storeId', asyncHandler(async (req: AuthedRequest, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('store_id', req.params.storeId)
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

router.post('/', asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const supabase = getSupabaseAdmin();
  const { data: store } = await supabase
    .from('stores')
    .select('owner_id')
    .eq('id', parsed.data.store_id)
    .single();
  if (!store) return res.status(404).json({ error: 'Store not found' });
  if (store.owner_id !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data, error } = await supabase
    .from('categories')
    .insert(parsed.data)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}));

router.patch('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const supabase = getSupabaseAdmin();
  const { data: cat } = await supabase
    .from('categories')
    .select('store_id')
    .eq('id', req.params.id)
    .single();
  if (!cat) return res.status(404).json({ error: 'Category not found' });

  const { data: store } = await supabase
    .from('stores')
    .select('owner_id')
    .eq('id', cat.store_id)
    .single();
  if (store?.owner_id !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data, error } = await supabase
    .from('categories')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}));

router.delete('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const supabase = getSupabaseAdmin();
  const { data: cat } = await supabase
    .from('categories')
    .select('store_id')
    .eq('id', req.params.id)
    .single();
  if (!cat) return res.status(404).json({ error: 'Category not found' });

  const { data: store } = await supabase
    .from('stores')
    .select('owner_id')
    .eq('id', cat.store_id)
    .single();
  if (store?.owner_id !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
}));

export default router;
