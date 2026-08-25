import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, TrendingUp, Image, MessageCircle, ArrowRight, CheckCircle, Share2, ShoppingBag, Smartphone, Search, Sun, Moon } from 'lucide-react';
import { useAuth, getHomeRoute } from '../auth/authContext';
import { supabase } from '../../lib/supabase';
import type { Store as StoreType } from '../../types';

const features = [
  { icon: Store, title: 'Boutique en ligne', desc: 'Un lien unique pour toute votre boutique. Catalogue organisé, fiches produits, contact WhatsApp.' },
  { icon: Image, title: 'Générateur de statuts', desc: 'Créez des publications multi-produits avec photo de couverture et lien de partage.' },
  { icon: TrendingUp, title: 'Statistiques', desc: 'Suivez les vues de votre boutique, de vos publications et de vos produits en temps réel.' },
  { icon: Share2, title: 'Partage WhatsApp', desc: 'Partagez un lien avec image de couverture, comme YouTube ou TikTok.' },
  { icon: ShoppingBag, title: 'Ventes directes', desc: 'Vos clients commandent par WhatsApp en un clic depuis vos fiches produits.' },
  { icon: Smartphone, title: 'Mobile-first', desc: 'Gérez votre boutique depuis votre téléphone, partout en RDC et en Afrique.' },
];

const steps = [
  { number: '01', title: 'Créez votre boutique', desc: 'Inscrivez-vous en 2 minutes et personnalisez votre boutique.' },
  { number: '02', title: 'Ajoutez vos produits', desc: 'Photos, prix, descriptions — tout ce qu’il faut pour vendre.' },
  { number: '03', title: 'Publiez sur WhatsApp', desc: 'Sélectionnez plusieurs produits, choisissez une photo de couverture et partagez.' },
  { number: '04', title: 'Vendez et suivez', desc: 'Recevez les commandes par WhatsApp et suivez vos statistiques.' },
];

export function LandingPage() {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StoreType[]>([]);
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('stores').select('*').eq('is_active', true).eq('is_suspended', false);
      if (data) setResults(data as StoreType[]);
    })();
  }, []);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  const filtered = results.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.slug.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-sable-chaud dark:bg-encre-nuit">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-brume/30 bg-white/95 dark:bg-encre-nuit/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-vert-marche/10">
              <Store size={20} className="text-vert-marche" />
            </div>
            <span className="font-serif text-xl font-bold text-encre-nuit dark:text-sable-chaud">StatusMarket</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#fonctionnalites" className="text-sm text-brume hover:text-vert-marche transition-colors">Fonctionnalités</a>
            <a href="#comment-ca-marche" className="text-sm text-brume hover:text-vert-marche transition-colors">Comment ça marche</a>
          </nav>
          {profile ? (
            <Link to={getHomeRoute(profile.role)} className="btn-primary text-sm">
              Mon espace
            </Link>
          ) : (
            <Link to="/connexion" className="btn-primary text-sm">
              Connexion
            </Link>
          )}
          <button onClick={() => setDark((d) => !d)} className="btn-ghost p-2" title="Changer de thème">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main>
        <section className="pt-32 pb-16 lg:pt-40 lg:pb-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-vert-marche/10 px-3 py-1 text-xs font-medium text-vert-marche">
                  <MessageCircle size={12} /> Vendez sur WhatsApp
                </span>
                <h1 className="mt-6 font-serif text-4xl font-bold text-encre-nuit dark:text-sable-chaud lg:text-6xl leading-tight">
                  Ta boutique, <span className="text-vert-marche">un seul lien.</span>
                </h1>

                <div className="mt-6">
                  <label className="text-sm font-medium text-brume" htmlFor="shop-search">Rechercher une boutique</label>
                  <div className="relative mt-2">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-brume" />
                    <input
                      id="shop-search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Nom de la boutique..."
                      className="input pl-12 py-3 w-full"
                    />
                  </div>
                  {query && (
                    <div className="mt-3 rounded-2xl bg-white dark:bg-encre-nuit/80 border border-brume/20 p-2 shadow-sm max-h-60 overflow-y-auto">
                      {filtered.length === 0 ? (
                        <p className="p-3 text-sm text-brume">Aucune boutique trouvée.</p>
                      ) : (
                        filtered.map((s) => (
                          <Link
                            key={s.id}
                            to={`/boutique/${s.slug}`}
                            className="flex items-center gap-3 rounded-xl p-3 hover:bg-encre-nuit/5 dark:hover:bg-white/5"
                          >
                            <Store size={18} className="text-vert-marche" />
                            <div>
                              <p className="font-medium">{s.name}</p>
                              <p className="text-xs text-brume">/{s.slug}</p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <p className="mt-6 max-w-lg text-lg text-brume">
                  Transformez vos statuts WhatsApp en véritable canal de vente. Catalogue, produits, contact direct — le tout sur un lien unique à partager.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link to="/connexion" className="btn-cta">
                    Créer ma boutique
                  </Link>
                  <Link to="/boutique/demo" className="btn-outline">
                    Voir une démo
                  </Link>
                </div>
                <div className="mt-8 flex items-center gap-4 text-sm text-brume">
                  <span className="flex items-center gap-1"><CheckCircle size={14} className="text-vert-marche" /> Gratuit</span>
                  <span className="flex items-center gap-1"><CheckCircle size={14} className="text-vert-marche" /> Sans carte</span>
                  <span className="flex items-center gap-1"><CheckCircle size={14} className="text-vert-marche" /> 7j d'essai PRO</span>
                </div>
              </div>

              <div className="relative hidden lg:block">
                <div className="absolute -inset-4 rounded-3xl bg-vert-marche/10 blur-2xl" />
                <div className="relative rounded-2xl bg-white dark:bg-encre-nuit/80 p-6 shadow-xl border border-brume/10">
                  <div className="mb-4 flex items-center gap-3 border-b border-brume/20 pb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-vert-marche/10">
                      <Store size={22} className="text-vert-marche" />
                    </div>
                    <div>
                      <p className="font-serif font-bold">Ma Boutique</p>
                      <p className="text-xs text-brume">status.market/boutique/ma-boutique</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Pantalon homme', price: '20 000 CDF', img: '/products/p1.jpg' },
                      { name: 'Chemise slim', price: '15 000 CDF', img: '/products/p2.jpg' },
                      { name: 'Montre', price: '35 000 CDF', img: '/products/p3.jpg' },
                      { name: 'Chaussures', price: '50 000 CDF', img: '/products/p4.jpg' },
                    ].map((p, i) => (
                      <div key={i} className="rounded-xl bg-sable-chaud dark:bg-encre-nuit/50 p-3">
                        <div className="mb-2 aspect-square rounded-lg bg-brume/20" />
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="font-mono text-xs text-vert-marche">{p.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="fonctionnalites" className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <h2 className="font-serif text-3xl font-bold text-encre-nuit dark:text-sable-chaud lg:text-4xl">
                Tout pour vendre sur WhatsApp
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-brume">
                Une suite complète pensée pour les commerçants africains qui veulent vendre simplement et professionnellement.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="card p-6 transition hover:shadow-lg">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-vert-marche/10">
                      <Icon size={24} className="text-vert-marche" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-encre-nuit dark:text-sable-chaud">{feature.title}</h3>
                    <p className="mt-2 text-sm text-brume">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="comment-ca-marche" className="py-16 lg:py-24 bg-vert-marche/5">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <h2 className="font-serif text-3xl font-bold text-encre-nuit dark:text-sable-chaud lg:text-4xl">
                Comment ça marche
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-brume">
                De l’inscription à la première vente en quelques minutes.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <div key={step.number} className="relative card p-6">
                  <span className="font-mono text-3xl font-bold text-vert-marche/30">{step.number}</span>
                  <h3 className="mt-4 font-serif text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm text-brume">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="rounded-3xl bg-vert-marche p-8 text-center text-white lg:p-16">
              <h2 className="font-serif text-3xl font-bold lg:text-4xl">Prêt à vendre sur WhatsApp ?</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/80">
                Rejoignez les commerçants qui utilisent StatusMarket pour transformer leurs statuts en ventes.
              </p>
              <Link to="/connexion" className="btn-cta mt-8 inline-flex bg-white text-vert-marche hover:bg-white/90">
                Commencer maintenant <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-brume/30 bg-white dark:bg-encre-nuit/50 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Store size={20} className="text-vert-marche" />
            <span className="font-serif font-bold">StatusMarket</span>
          </div>
          <p className="text-sm text-brume">StatusMarket — Ta boutique, un seul lien.</p>
          <div className="flex gap-6 text-sm text-brume">
            <a href="#" className="hover:text-vert-marche">Aide</a>
            <a href="#" className="hover:text-vert-marche">Confidentialité</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
