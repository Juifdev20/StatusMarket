import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fooagqmtocpndriqkorx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvb2FncW10b2NwbmRyaXFrb3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzY0NDE2MiwiZXhwIjoyMTAzMjIwMTYyfQ.0tTaWLeq6B3yIKYyzPWLmk7jOfWGLX34S6ABMSZF-Nk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const testUsers = [
  {
    email: 'vendeur@test.com',
    password: 'Test1234!',
    fullName: 'Vendeur Test',
    role: 'SELLER',
    phone: '+243970000001',
  },
  {
    email: 'admin@test.com',
    password: 'Admin1234!',
    fullName: 'Super Admin',
    role: 'SUPER_ADMIN',
    phone: '+243970000002',
  },
];

async function main() {
  for (const u of testUsers) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.fullName },
    });

    if (error) {
      if (error.message.includes('already been registered')) {
        console.log(`⚠ ${u.email} existe déjà — récupération de l'ID...`);
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingUser = listData?.users?.find((x) => x.email === u.email);
        if (existingUser) {
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: existingUser.id,
            full_name: u.fullName,
            role: u.role,
            phone: u.phone,
          });
          if (profileError) {
            console.error(`  ✗ Erreur profil: ${profileError.message}`);
          } else {
            console.log(`  ✓ Profil mis à jour: ${u.role}`);
          }
        } else {
          console.error(`  ✗ Utilisateur introuvable dans Auth`);
        }
      } else {
        console.error(`✗ Erreur pour ${u.email}:`, error.message);
      }
      continue;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: u.fullName,
        role: u.role,
        phone: u.phone,
      });

      if (profileError) {
        console.error(`✗ Erreur profil ${u.email}:`, profileError.message);
      } else {
        console.log(`✓ ${u.email} créé avec rôle ${u.role}`);
      }
    }
  }
  console.log('\n--- Comptes de test ---');
  console.log('Vendeur:    vendeur@test.com  / Test1234!');
  console.log('Super Admin: admin@test.com    / Admin1234!');
}

main().catch(console.error);
