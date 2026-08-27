import { Router } from 'express';
import { z } from 'zod';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { asyncHandler } from '../../middlewares/asyncHandler';

const router = Router();

const AUTH_EMAIL_DOMAIN = 'statusmarket.app';

const resetPasswordSchema = z.object({
  username: z.string().min(1),
  phone: z.string().min(1),
  recoveryPin: z.string().min(4).max(6).regex(/^\d+$/, 'Code de récupération invalide.'),
  newPassword: z.string().min(6),
});

const recoverUsernameSchema = z.object({
  phone: z.string().min(1),
});

// POST /api/auth/reset-password
router.post('/reset-password', asyncHandler(async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Veuillez fournir un username, un téléphone et un nouveau mot de passe valide.' });
  }

  const { username, phone, recoveryPin, newPassword } = parsed.data;

  const supabase = getSupabaseAdmin();

  // Find profile by username, phone and recovery pin
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .eq('phone', phone)
    .eq('recovery_pin', recoveryPin)
    .maybeSingle();

  if (!profile) {
    return res.status(404).json({ error: 'Identifiants ou code de récupération incorrects.' });
  }

  // Update the user's password
  const { error } = await supabase.auth.admin.updateUserById(profile.id, {
    password: newPassword,
  });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });
}));

// POST /api/auth/recover-username
router.post('/recover-username', asyncHandler(async (req, res) => {
  const parsed = recoverUsernameSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Veuillez fournir un numéro de téléphone.' });
  }

  const { phone } = parsed.data;

  const supabase = getSupabaseAdmin();

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name')
    .eq('phone', phone)
    .maybeSingle();

  if (!profile || !profile.username) {
    return res.status(404).json({ error: 'Aucun compte trouvé avec ce numéro.' });
  }

  res.json({ success: true, username: profile.username, fullName: profile.full_name });
}));

export default router;
