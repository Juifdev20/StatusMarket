import { Router } from 'express';
import { z } from 'zod';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { asyncHandler } from '../../middlewares/asyncHandler';

const router = Router();

const AUTH_EMAIL_DOMAIN = 'statusmarket.app';

const usernameRegex = /^[a-z0-9]+$/;

const signUpSchema = z.object({
  username: z.string().min(4).max(20).regex(usernameRegex, 'Lettres et chiffres uniquement'),
  password: z.string().min(6),
  fullName: z.string().min(1).max(100),
  phone: z.string().min(1).max(30),
  recoveryPin: z.string().min(4).max(6).regex(/^\d+$/, 'Chiffres uniquement'),
});

router.post('/signup', asyncHandler(async (req, res) => {
  const parsed = signUpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { username, password, fullName, phone, recoveryPin } = parsed.data;
  const email = `${username}@${AUTH_EMAIL_DOMAIN}`;

  const supabase = getSupabaseAdmin();

  // Check if username already exists in profiles
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris.' });
  }

  // Check if phone already exists
  const { data: existingPhone } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  if (existingPhone) {
    return res.status(409).json({ error: 'Ce numéro de téléphone est déjà utilisé par un autre compte.' });
  }

  // Create auth user with email_confirm: true — bypasses email confirmation entirely
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      full_name: fullName,
      role: 'SELLER',
    },
  });

  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  const userId = authData.user.id;

  // Create profile with username, phone, and fullName
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      username,
      email: null,
      full_name: fullName,
      phone,
      recovery_pin: recoveryPin,
      role: 'SELLER',
    });

  if (profileError) {
    // Best effort cleanup if profile creation fails
    await supabase.auth.admin.deleteUser(userId);
    return res.status(400).json({ error: profileError.message });
  }

  res.status(201).json({ success: true, userId });
}));

export default router;
