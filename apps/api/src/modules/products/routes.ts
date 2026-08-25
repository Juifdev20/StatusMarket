import { Router } from 'express';
import { z } from 'zod';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { authGuard, AuthedRequest } from '../../middlewares/auth';
import { asyncHandler } from '../../middlewares/asyncHandler';

const router = Router();

const createProductSchema = z.object({
  store_id: z.string().uuid(),
  category_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  price: z.number().positive(),
  currency: z.string().default('USD'),
  image_url: z.string().url().nullable().optional(),
  images: z.array(z.string().url()).default([]),
  is_available: z.boolean().default(true),
  stock: z.number().int().min(0).default(0),
});

const updateProductSchema = createProductSchema.partial();

router.use(authGuard);

async function verifyStoreOwnership(storeId: string, userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('stores').select('owner_id').eq('id', storeId).single();
  return data?.owner_id === userId;
}

router.get('/store/:storeId', asyncHandler(async (req: AuthedRequest, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('store_id', req.params.storeId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

router.post('/', asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const isOwner = await verifyStoreOwnership(parsed.data.store_id, req.user!.id);
  if (!isOwner && req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .insert(parsed.data)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}));

router.patch('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const supabase = getSupabaseAdmin();
  const { data: product } = await supabase
    .from('products')
    .select('store_id')
    .eq('id', req.params.id)
    .single();
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const isOwner = await verifyStoreOwnership(product.store_id, req.user!.id);
  if (!isOwner && req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data, error } = await supabase
    .from('products')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}));

router.delete('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const supabase = getSupabaseAdmin();
  const { data: product } = await supabase
    .from('products')
    .select('store_id')
    .eq('id', req.params.id)
    .single();
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const isOwner = await verifyStoreOwnership(product.store_id, req.user!.id);
  if (!isOwner && req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { error } = await supabase.from('products').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
}));

export default router;
