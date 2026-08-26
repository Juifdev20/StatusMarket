import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from './authContext';
import { supabase } from '../../lib/supabase';
import { StatusRing } from '../../components/StatusRing';
import { Store, MessageCircle, TrendingUp, Shield } from 'lucide-react';

export function LoginPage() {
  const { signIn, signUp, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateUsername = (value: string) => {
    const trimmed = value.trim().toLowerCase().replace(/\s+/g, '');
    if (trimmed.length < 4) return 'Le nom d\'utilisateur doit faire au moins 4 caractères.';
    if (trimmed.length > 20) return 'Le nom d\'utilisateur ne doit pas dépasser 20 caractères.';
    if (!/^[a-z0-9]+$/.test(trimmed)) return 'Lettres et chiffres uniquement.';
    if (!/[a-z]/.test(trimmed)) return 'Le nom d\'utilisateur doit contenir au moins une lettre.';
    if (!/[0-9]/.test(trimmed)) return 'Le nom d\'utilisateur doit contenir au moins un chiffre.';
    return null;
  };

  useEffect(() => {
    if (!profile) return;
    (async () => {
      if (profile.role === 'SELLER') {
        const { data } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', profile.id)
          .maybeSingle();
        if (!data) {
          navigate('/vendeur/boutique/nouvelle', { replace: true });
        } else {
          navigate('/vendeur', { replace: true });
        }
      } else if (profile.role === 'SUPER_ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    })();
  }, [profile, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      setLoading(false);
      return;
    }

    if (mode === 'login') {
      const { error: signInError } = await signIn(username, password);
      if (signInError) {
        setError(signInError);
        setLoading(false);
      }
    } else {
      const { error: signUpError } = await signUp(username, password, fullName);
      if (signUpError) {
        setError(signUpError);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-sable-chaud dark:bg-encre-nuit">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left side - marketing */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-vert-marche p-12 text-white">
          <div className="flex items-center gap-3">
            <StatusRing progress={75} size={48} color="#FFFFFF">
              <div className="flex h-full w-full items-center justify-center bg-white rounded-full">
                <Store size={22} className="text-vert-marche" />
              </div>
            </StatusRing>
            <span className="font-serif text-2xl font-bold">StatusMarket</span>
          </div>

          <div className="space-y-8">
            <h2 className="font-serif text-4xl font-bold leading-tight">
              Ta boutique, <br />un seul lien.
            </h2>
            <p className="text-lg text-white/80 max-w-md">
              Transformez vos statuts WhatsApp en véritable canal de vente. Catalogue, produits, contact direct — le tout sur un lien unique à partager.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <MessageCircle size={20} />
                </div>
                <p className="font-medium">Vendez directement sur WhatsApp</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <TrendingUp size={20} />
                </div>
                <p className="font-medium">Suivez vos statistiques en temps réel</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Shield size={20} />
                </div>
                <p className="font-medium">Paiements et abonnements sécurisés</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/60">© 2026 StatusMarket. Tous droits réservés.</p>
        </div>

        {/* Right side - form */}
        <div className="flex flex-1 flex-col items-center justify-center p-4 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
              <StatusRing progress={75} size={64} color="#158F73">
                <div className="flex h-full w-full items-center justify-center bg-vert-marche rounded-full">
                  <Store size={24} className="text-white" />
                </div>
              </StatusRing>
              <h1 className="font-serif text-2xl font-bold text-encre-nuit dark:text-sable-chaud">StatusMarket</h1>
              <p className="text-sm text-brume">Ta boutique, un seul lien.</p>
            </div>

            <div className="card p-6 lg:p-8">
              <h2 className="font-serif text-2xl font-bold text-encre-nuit dark:text-sable-chaud mb-2">
                {mode === 'login' ? 'Connexion' : 'Inscription'}
              </h2>
              <p className="text-sm text-brume mb-6">
                {mode === 'login' ? 'Connectez-vous à votre espace vendeur.' : 'Créez votre compte vendeur.'}
              </p>

              <div className="mb-6 flex gap-2 p-1 rounded-xl bg-encre-nuit/5 dark:bg-white/5">
                <button
                  onClick={() => setMode('login')}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-white dark:bg-encre-nuit shadow-sm text-vert-marche' : 'text-brume'}`}
                >
                  Connexion
                </button>
                <button
                  onClick={() => setMode('register')}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-white dark:bg-encre-nuit shadow-sm text-vert-marche' : 'text-brume'}`}
                >
                  Inscription
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="label">Nom complet</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input"
                      placeholder="Jean Mukendi"
                    />
                  </div>
                )}
                <div>
                  <label className="label">Nom d'utilisateur</label>
                  <input
                    type="text"
                    required
                    minLength={4}
                    maxLength={20}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className="input"
                    placeholder="jean2024"
                  />
                  <p className="mt-1 text-xs text-brume">Lettres + chiffres, minimum 4 caractères.</p>
                </div>
                <div>
                  <label className="label">Mot de passe</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="text-sm text-corail-alerte">{error}</p>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer un compte'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/" className="text-sm text-brume hover:text-vert-marche transition-colors">
                  ← Retour à l'accueil
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
