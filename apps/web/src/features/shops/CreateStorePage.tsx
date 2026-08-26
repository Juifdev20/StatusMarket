import { useState, FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/authContext';
import { ArrowLeft, Store, Upload, X, ChevronDown, ChevronUp } from 'lucide-react';

export function CreateStorePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [quartier, setQuartier] = useState('');
  const [avenue, setAvenue] = useState('');
  const [numeroPorte, setNumeroPorte] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [mapLink, setMapLink] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [storeFrontUrl, setStoreFrontUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [storeFrontUploading, setStoreFrontUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const frontRef = useRef<HTMLInputElement>(null);

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

  const handleStoreFrontUpload = async (file: File) => {
    if (!profile) return;
    setStoreFrontUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `store-fronts/${profile.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('product-images').upload(fileName, file);
    if (upErr) {
      setError('Erreur lors du téléchargement de la photo de la devanture.');
    } else {
      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      setStoreFrontUrl(data.publicUrl);
    }
    setStoreFrontUploading(false);
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
        city: city.trim() || null,
        quartier: quartier.trim() || null,
        avenue: avenue.trim() || null,
        numero_porte: numeroPorte.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        map_link: mapLink.trim() || null,
        store_front_image_url: storeFrontUrl || null,
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
          <p className="text-sm text-brume">Quelques informations pour démarrer. Le reste se configurera plus tard.</p>
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
          <label className="label">Numéro WhatsApp *</label>
          <input
            type="text"
            required
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="input"
            placeholder="+243970000000"
          />
        </div>

        <div>
          <label className="label">Description <span className="text-brume font-normal">(optionnel)</span></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-[80px] resize-y"
            placeholder="Décrivez votre boutique en quelques mots..."
          />
        </div>

        <div>
          <label className="label">Logo <span className="text-brume font-normal">(optionnel)</span></label>
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

        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="flex w-full items-center justify-between rounded-xl bg-brume/5 px-4 py-3 text-sm font-medium text-brume hover:bg-brume/10 transition-colors"
        >
          <span>Plus d'options (adresse, localisation, photo)</span>
          {showOptional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showOptional && (
          <div className="space-y-4">
            <div className="card p-4 bg-brume/5">
              <h3 className="font-medium mb-3">Adresse</h3>
              <div className="space-y-3">
                <div>
                  <label className="label">Ville <span className="text-brume font-normal">(optionnel)</span></label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input"
                    placeholder="Beni, Butembo, Goma..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Quartier <span className="text-brume font-normal">(optionnel)</span></label>
                    <input
                      type="text"
                      value={quartier}
                      onChange={(e) => setQuartier(e.target.value)}
                      className="input"
                      placeholder="Ex: Mabanga"
                    />
                  </div>
                  <div>
                    <label className="label">Avenue <span className="text-brume font-normal">(optionnel)</span></label>
                    <input
                      type="text"
                      value={avenue}
                      onChange={(e) => setAvenue(e.target.value)}
                      className="input"
                      placeholder="Ex: Av. Independence"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Numéro de porte <span className="text-brume font-normal">(optionnel)</span></label>
                  <input
                    type="text"
                    value={numeroPorte}
                    onChange={(e) => setNumeroPorte(e.target.value)}
                    className="input"
                    placeholder="Ex: N°12"
                  />
                </div>
              </div>
            </div>

            <div className="card p-4 bg-brume/5">
              <h3 className="font-medium mb-3">Localisation GPS</h3>
              <div className="space-y-3">
                <div>
                  <label className="label">Lien Google Maps <span className="text-brume font-normal">(optionnel)</span></label>
                  <input
                    type="url"
                    value={mapLink}
                    onChange={(e) => setMapLink(e.target.value)}
                    className="input"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Latitude <span className="text-brume font-normal">(optionnel)</span></label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="input"
                      placeholder="0.0000000"
                    />
                  </div>
                  <div>
                    <label className="label">Longitude <span className="text-brume font-normal">(optionnel)</span></label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="input"
                      placeholder="0.0000000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="label">Photo de la devanture <span className="text-brume font-normal">(optionnel)</span></label>
              <div className="flex items-center gap-3">
                <input
                  ref={frontRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleStoreFrontUpload(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => frontRef.current?.click()}
                  disabled={storeFrontUploading}
                  className="btn-outline text-xs flex items-center gap-2"
                >
                  <Upload size={14} /> {storeFrontUploading ? 'Téléchargement...' : 'Photo de la devanture'}
                </button>
                {storeFrontUrl ? (
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-vert-marche">
                    <img src={storeFrontUrl} alt="Dev" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setStoreFrontUrl(null)}
                      className="absolute -right-1 -top-1 rounded-full bg-corail-alerte p-0.5 text-white"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-brume/10 text-brume text-xs text-center">
                    Aperçu
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
