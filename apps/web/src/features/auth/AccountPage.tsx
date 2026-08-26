import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import { supabase } from '../../lib/supabase';
import { LogOut, User } from 'lucide-react';

export function AccountPage() {
  const { profile, session, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('profiles').update({ full_name: fullName, phone, email }).eq('id', profile!.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">Mon compte</h1>

      <div className="card p-4 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-vert-marche/10">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
          ) : (
            <User size={28} className="text-vert-marche" />
          )}
        </div>
        <div>
          <p className="font-semibold">{profile?.full_name ?? 'Vendeur'}</p>
          <p className="text-sm text-brume">@{profile?.username ?? 'utilisateur'}</p>
          <p className="text-xs text-brume">{profile?.email ?? session?.user?.email ?? 'Aucun email renseigné'}</p>
          <span className="badge bg-vert-marche/10 text-vert-marche mt-1">{profile?.role}</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="card p-4 space-y-4">
        <div>
          <label className="label">Nom complet</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Téléphone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="+243..." />
        </div>
        <div>
          <label className="label">Email <span className="text-brume text-xs">(optionnel)</span></label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="vous@exemple.com" />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        {saved && <p className="text-center text-sm text-vert-marche">Profil mis à jour !</p>}
      </form>

      <button onClick={handleSignOut} className="btn-danger w-full">
        <LogOut size={18} /> Se déconnecter
      </button>
    </div>
  );
}
