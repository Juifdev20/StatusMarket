import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, toAuthEmail } from '../auth/authContext';
import { supabase } from '../../lib/supabase';
import { LogOut, User, Eye, EyeOff } from 'lucide-react';
import type { Store } from '../../types';

export function AccountPage() {
  const { profile, session, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [store, setStore] = useState<Store | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [whatsappSaved, setWhatsappSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', profile.id)
        .maybeSingle();
      if (data) {
        setStore(data as Store);
        setWhatsappNumber(data.whatsapp_number ?? '');
      }
    })();
  }, [profile]);

  const handleWhatsappSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setWhatsappSaving(true);
    const { error } = await supabase
      .from('stores')
      .update({ whatsapp_number: whatsappNumber.trim() || null })
      .eq('id', store.id);
    if (!error) {
      setStore({ ...store, whatsapp_number: whatsappNumber.trim() || null });
      setWhatsappSaved(true);
      setTimeout(() => setWhatsappSaved(false), 3000);
    }
    setWhatsappSaving(false);
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (!profile?.username) {
      setPasswordError('Profil non trouvé.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit faire au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }

    setPasswordSaving(true);

    // Verify current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: toAuthEmail(profile.username),
      password: currentPassword,
    });

    if (signInError) {
      setPasswordError('Mot de passe actuel incorrect.');
      setPasswordSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setPasswordError(updateError.message);
    } else {
      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSaved(false), 3000);
    }

    setPasswordSaving(false);
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

      <form onSubmit={handlePasswordChange} className="card p-4 space-y-4">
        <h2 className="font-semibold">Modifier le mot de passe</h2>

        {passwordError && (
          <p className="text-sm text-corail-alerte">{passwordError}</p>
        )}
        {passwordSaved && (
          <p className="text-sm text-vert-marche">Mot de passe mis à jour avec succès.</p>
        )}

        <div>
          <label className="label">Mot de passe actuel</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input w-full pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brume"
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="label">Nouveau mot de passe</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input w-full pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brume"
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="label">Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input w-full"
            placeholder="••••••••"
          />
        </div>

        <button type="submit" disabled={passwordSaving} className="btn-primary w-full">
          {passwordSaving ? 'Modification...' : 'Changer le mot de passe'}
        </button>
      </form>

      {store && (
        <>
          <form onSubmit={handleWhatsappSave} className="card p-4 space-y-4">
            <h2 className="font-semibold">Numéro WhatsApp de la boutique</h2>
            <p className="text-sm text-brume">
              Ce numéro sera utilisé par les clients pour vous contacter sur WhatsApp.
            </p>
            <div>
              <label className="label">Numéro WhatsApp</label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="input"
                placeholder="+243 8XX XXX XXX"
              />
            </div>
            <button type="submit" disabled={whatsappSaving} className="btn-primary w-full">
              {whatsappSaving ? 'Enregistrement...' : 'Enregistrer le numéro'}
            </button>
            {whatsappSaved && (
              <p className="text-center text-sm text-vert-marche">Numéro WhatsApp mis à jour !</p>
            )}
          </form>

          <div className="card p-4 space-y-4">
            <h2 className="font-semibold">Ma boutique</h2>
            <div className="flex items-start gap-4">
              {store.store_front_image_url ? (
                <img
                  src={store.store_front_image_url}
                  alt="Photo de la devanture"
                  className="h-20 w-28 rounded-lg object-cover border border-brume/20"
                />
              ) : (
                <div className="h-20 w-28 rounded-lg bg-brume/10 flex items-center justify-center text-xs text-brume text-center">
                  Aucune photo
                </div>
              )}
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Nom :</span> {store.name}</p>
                {store.city && <p><span className="font-medium">Ville :</span> {store.city}</p>}
                {store.quartier && <p><span className="font-medium">Quartier :</span> {store.quartier}</p>}
                {store.avenue && <p><span className="font-medium">Avenue :</span> {store.avenue}</p>}
                {store.numero_porte && <p><span className="font-medium">N° :</span> {store.numero_porte}</p>}
                {store.map_link && (
                  <a
                    href={store.map_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-vert-marche underline text-xs break-all"
                  >
                    Voir sur Google Maps
                  </a>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <button onClick={handleSignOut} className="btn-danger w-full">
        <LogOut size={18} /> Se déconnecter
      </button>
    </div>
  );
}
