import { Router } from 'express';
import { z } from 'zod';
import { generateFromImage } from '../../lib/gemini';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { authGuard, AuthedRequest } from '../../middlewares/auth';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';

const router = Router();

router.use(authGuard);

const LANGUAGE_LABELS: Record<string, string> = {
  fr: 'français',
  en: 'anglais',
  ln: 'lingala',
  sw: 'swahili',
};
const languageSchema = z.enum(['fr', 'en', 'ln', 'sw']).default('fr');

const captionSchema = z.object({
  storeId: z.string().uuid(),
  imageUrl: z.string().url(),
  productNames: z.array(z.string()).min(1),
  language: languageSchema,
  previousText: z.string().optional(),
});

const descriptionSchema = z.object({
  storeId: z.string().uuid(),
  imageUrl: z.string().url(),
  name: z.string().min(1),
  price: z.number().optional(),
  currency: z.string().optional(),
  language: languageSchema,
  previousText: z.string().optional(),
});

function variationInstruction(previousText?: string): string {
  if (!previousText) return '';
  return ` Voici une proposition précédente que le vendeur n'a pas aimée : "${previousText}". Propose une formulation clairement différente, avec un angle différent.`;
}

// Verifies the caller owns the store, that the store's subscription is a
// paid ACTIVE plan (never just TRIAL — AI generation is a paid perk), and
// that the seller hasn't hit their daily generation cap yet. Returns an
// error response object to send if blocked, or null if the call may proceed.
async function checkAiAccess(sellerId: string, storeId: string): Promise<{ status: number; body: object } | null> {
  const supabase = getSupabaseAdmin();

  const { data: store } = await supabase.from('stores').select('id, owner_id').eq('id', storeId).maybeSingle();
  if (!store || store.owner_id !== sellerId) {
    return { status: 403, body: { code: 'STORE_NOT_OWNED', error: "Cette boutique ne vous appartient pas." } };
  }

  const { data: hasPaidPlan } = await supabase.rpc('store_owner_has_paid_subscription', { p_store_id: storeId });
  if (!hasPaidPlan) {
    return {
      status: 403,
      body: {
        code: 'AI_REQUIRES_PAID_PLAN',
        error: "La génération par IA est réservée aux abonnements payants (PRO/BUSINESS). Passez à un abonnement payant pour l'activer.",
      },
    };
  }

  const { data: settings } = await supabase.from('platform_settings').select('ai_daily_limit').eq('id', 1).single();
  const limit = settings?.ai_daily_limit ?? 5;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('ai_generation_logs')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', sellerId)
    .gte('created_at', startOfDay.toISOString());

  if ((count ?? 0) >= limit) {
    return {
      status: 429,
      body: {
        code: 'AI_DAILY_LIMIT_REACHED',
        limit,
        error: `Vous avez atteint votre limite de ${limit} générations IA aujourd'hui. Réessayez demain.`,
      },
    };
  }

  return null;
}

async function logAiUsage(sellerId: string, storeId: string, kind: 'caption' | 'description') {
  const supabase = getSupabaseAdmin();
  await supabase.from('ai_generation_logs').insert({ seller_id: sellerId, store_id: storeId, kind });
}

router.post('/generate-caption', asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = captionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'storeId, imageUrl et productNames (liste non vide) sont requis.' });
  }
  const { storeId, imageUrl, productNames, language, previousText } = parsed.data;
  const sellerId = req.user!.id;

  const blocked = await checkAiAccess(sellerId, storeId);
  if (blocked) return res.status(blocked.status).json(blocked.body);

  const langLabel = LANGUAGE_LABELS[language];
  const prompt = `Rédige une légende courte et accrocheuse en ${langLabel} pour un statut WhatsApp qui vend ce(s) produit(s) : ${productNames.join(', ')}. Ton vendeur, chaleureux, avec 1-2 emojis, 2 phrases maximum.${variationInstruction(previousText)} Réponds uniquement avec la légende, en texte brut sans markdown (pas d'astérisques ni de gras), sans guillemets ni explication.`;

  try {
    const caption = await generateFromImage(imageUrl, prompt);
    await logAiUsage(sellerId, storeId, 'caption');
    res.json({ caption });
  } catch (err) {
    console.error('generate-caption failed:', err);
    res.status(500).json({ error: "Génération indisponible pour l'instant, réessayez ou écrivez votre propre texte." });
  }
}));

router.post('/generate-description', asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = descriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'storeId, imageUrl et name sont requis.' });
  }
  const { storeId, imageUrl, name, price, currency, language, previousText } = parsed.data;
  const sellerId = req.user!.id;

  const blocked = await checkAiAccess(sellerId, storeId);
  if (blocked) return res.status(blocked.status).json(blocked.body);

  const langLabel = LANGUAGE_LABELS[language];
  const priceInfo = price ? `, prix ${price} ${currency || ''}`.trim() : '';
  const prompt = `Rédige une description de vente courte (2-3 phrases) en ${langLabel} pour ce produit à partir de la photo : nom "${name}"${priceInfo}. Mets en avant ce qui se voit sur la photo.${variationInstruction(previousText)} Réponds uniquement avec la description, en texte brut sans markdown (pas d'astérisques ni de gras), sans guillemets ni explication.`;

  try {
    const description = await generateFromImage(imageUrl, prompt);
    await logAiUsage(sellerId, storeId, 'description');
    res.json({ description });
  } catch (err) {
    console.error('generate-description failed:', err);
    res.status(500).json({ error: "Génération indisponible pour l'instant, réessayez ou écrivez votre propre texte." });
  }
}));

export default router;
