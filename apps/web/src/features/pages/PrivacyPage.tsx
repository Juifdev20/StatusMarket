import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

export function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-sable-chaud dark:bg-encre-nuit">
      <header className="border-b border-brume/10 bg-white dark:bg-encre-nuit/80">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-brume hover:text-vert-marche transition-colors"
          >
            <ArrowLeft size={16} /> Retour
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-vert-marche/10">
            <Shield size={28} className="text-vert-marche" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-encre-nuit dark:text-sable-chaud">Politique de confidentialité</h1>
          <p className="mt-2 text-brume">Dernière mise à jour : août 2026</p>
        </div>

        <div className="card p-6 space-y-6 text-sm text-brume leading-relaxed">
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-semibold text-encre-nuit dark:text-sable-chaud">
              <FileText size={18} className="text-vert-marche" />
              1. Données collectées
            </h2>
            <p>
              StatusMarket collecte les informations nécessaires au fonctionnement de la plateforme : nom, adresse e-mail, numéro WhatsApp, informations de boutique et produits. Nous ne collectons pas d'informations bancaires.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-encre-nuit dark:text-sable-chaud">2. Utilisation des données</h2>
            <p>
              Les données sont utilisées pour afficher les boutiques et produits, permettre les contacts entre acheteurs et vendeurs, et améliorer l'expérience utilisateur. Nous ne revendons ni ne partageons vos données personnelles à des tiers à des fins commerciales.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-encre-nuit dark:text-sable-chaud">3. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données contre l'accès non autorisé, la perte ou l'altération.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-encre-nuit dark:text-sable-chaud">4. Vos droits</h2>
            <p>
              Vous pouvez demander la modification ou la suppression de vos données en nous contactant à <a href="mailto:dieudonnemerci20@gmail.com" className="text-vert-marche hover:underline">dieudonnemerci20@gmail.com</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-encre-nuit dark:text-sable-chaud">5. Contact</h2>
            <p>
              Pour toute question relative à cette politique, contactez-nous à <a href="mailto:dieudonnemerci20@gmail.com" className="text-vert-marche hover:underline">dieudonnemerci20@gmail.com</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
