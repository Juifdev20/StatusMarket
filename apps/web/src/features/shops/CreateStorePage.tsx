import { useState, FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/authContext';
import { ArrowLeft, Store, Upload, X } from 'lucide-react';

export function CreateStorePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  const handleLogoUpload = async (file: File) => {
    if (!profile) return;
    setLogoUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `logos/${profile.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('product-images').upload(fileName, file);
    if (upErr) {
      setError('Erreur lors du téléchargement du logo.');
    } else {
      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      setLogoUrl(data.publicUrl);
    }
    setLogoUploading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!profile) return;

    if (!name.trim() || !slug.trim()) {
      setError('Le nom et le slug sont obligatoires.');
      return;
    }

    setLoading(true);

    const { data: existing } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      setError('Ce slug est déjà utilisé. Choisissez-en un autre.');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('stores')
      .insert({
        owner_id: profile.id,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        whatsapp_number: whatsapp.trim() || null,
        logo_url: logoUrl || null,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    const { data: planFree } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('code', 'FREE')
      .single();

    if (planFree) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);

      await supabase.from('subscriptions').insert({
        seller_id: profile.id,
        plan_id: planFree.id,
        status: 'TRIAL',
        trial_ends_at: trialEnd.toISOString(),
      });
    }

    navigate('/vendeur', { replace: true });
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-brume hover:text-vert-marche">
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-vert-marche/10">
          <Store size={24} className="text-vert-marche" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold">Créer ma boutique</h1>
          <p className="text-sm text-brume">Configurez votre boutique en ligne</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Nom de la boutique *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="input"
            placeholder="Ma Boutique"
          />
        </div>

        <div>
          <label className="label">Lien (slug) *</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-brume whitespace-nowrap">/boutique/</span>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(generateSlug(e.target.value))}
              className="input"
              placeholder="ma-boutique"
            />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-[80px] resize-y"
            placeholder="Décrivez votre boutique en quelques mots..."
          />
        </div>

        <div>
          <label className="label">Numéro WhatsApp</label>
          <input
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="input"
            placeholder="+243970000000"
          />
        </div>

        <div>
          <label className="label">Logo de l'entreprise</label>
          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={logoUploading}
              className="btn-outline text-xs flex items-center gap-2"
            >
              <Upload size={14} /> {logoUploading ? 'Téléchargement...' : 'Choisir un logo'}
            </button>
            {logoUrl ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-vert-marche">
                <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="absolute -right-1 -top-1 rounded-full bg-corail-alerte p-0.5 text-white"
                >
                  <X size={10} />
                </button>
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-vert-marche/10 text-vert-marche font-bold">
                {name ? name.trim()[0].toUpperCase() : '?'}
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-corail-alerte">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-cta w-full">
          {loading ? 'Création...' : 'Créer ma boutique'}
        </button>
      </form>
    </div>
  );
}
