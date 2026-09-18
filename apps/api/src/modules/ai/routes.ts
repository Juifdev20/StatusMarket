import { Router } from 'express';
import { z } from 'zod';
import { generateFromImage } from '../../lib/gemini';
import { asyncHandler } from '../../middlewares/asyncHandler';

const router = Router();

const LANGUAGE_LABELS: Record<string, string> = {
  fr: 'français',
  en: 'anglais',
  ln: 'lingala',
  sw: 'swahili',
};
const languageSchema = z.enum(['fr', 'en', 'ln', 'sw']).default('fr');

const captionSchema = z.object({
  imageUrl: z.string().url(),
  productNames: z.array(z.string()).min(1),
  language: languageSchema,
  previousText: z.string().optional(),
});

const descriptionSchema = z.object({
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

router.post('/generate-caption', asyncHandler(async (req, res) => {
  const parsed = captionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'imageUrl et productNames (liste non vide) sont requis.' });
  }
  const { imageUrl, productNames, language, previousText } = parsed.data;
  const langLabel = LANGUAGE_LABELS[language];

  const prompt = `Rédige une légende courte et accrocheuse en ${langLabel} pour un statut WhatsApp qui vend ce(s) produit(s) : ${productNames.join(', ')}. Ton vendeur, chaleureux, avec 1-2 emojis, 2 phrases maximum.${variationInstruction(previousText)} Réponds uniquement avec la légende, en texte brut sans markdown (pas d'astérisques ni de gras), sans guillemets ni explication.`;

  try {
    const caption = await generateFromImage(imageUrl, prompt);
    res.json({ caption });
  } catch (err) {
    console.error('generate-caption failed:', err);
    res.status(500).json({ error: "Génération indisponible pour l'instant, réessayez ou écrivez votre propre texte." });
  }
}));

router.post('/generate-description', asyncHandler(async (req, res) => {
  const parsed = descriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'imageUrl et name sont requis.' });
  }
  const { imageUrl, name, price, currency, language, previousText } = parsed.data;
  const langLabel = LANGUAGE_LABELS[language];

  const priceInfo = price ? `, prix ${price} ${currency || ''}`.trim() : '';
  const prompt = `Rédige une description de vente courte (2-3 phrases) en ${langLabel} pour ce produit à partir de la photo : nom "${name}"${priceInfo}. Mets en avant ce qui se voit sur la photo.${variationInstruction(previousText)} Réponds uniquement avec la description, en texte brut sans markdown (pas d'astérisques ni de gras), sans guillemets ni explication.`;

  try {
    const description = await generateFromImage(imageUrl, prompt);
    res.json({ description });
  } catch (err) {
    console.error('generate-description failed:', err);
    res.status(500).json({ error: "Génération indisponible pour l'instant, réessayez ou écrivez votre propre texte." });
  }
}));

export default router;
