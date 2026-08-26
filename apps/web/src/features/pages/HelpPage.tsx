import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Search, ShoppingBag, CreditCard, MessageCircle, ShieldCheck } from 'lucide-react';

export function HelpPage() {
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
            <HelpCircle size={28} className="text-vert-marche" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-encre-nuit dark:text-sable-chaud">Centre d'aide</h1>
          <p className="mt-2 text-brume">Trouvez rapidement des réponses à vos questions.</p>
        </div>

        <div className="card p-6 space-y-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-encre-nuit dark:text-sable-chaud">
              <Search size={18} className="text-vert-marche" />
              <h2>Comment trouver un produit ?</h2>
            </div>
            <p className="text-brume text-sm leading-relaxed">
              Utilisez la barre de recherche en haut de la page d'accueil pour rechercher un produit, une boutique ou une catégorie. Vous pouvez aussi parcourir les catégories et les sections tendances.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-encre-nuit dark:text-sable-chaud">
              <ShoppingBag size={18} className="text-vert-marche" />
              <h2>Comment acheter ?</h2>
            </div>
            <p className="text-brume text-sm leading-relaxed">
              Cliquez sur un produit pour voir ses détails, ajoutez-le au panier si disponible, puis contactez le vendeur directement par WhatsApp pour finaliser la commande.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-encre-nuit dark:text-sable-chaud">
              <CreditCard size={18} className="text-vert-marche" />
              <h2>Comment payer ?</h2>
            </div>
            <p className="text-brume text-sm leading-relaxed">
              StatusMarket met en relation acheteurs et vendeurs. Le paiement se fait directement entre vous et le vendeur selon les modalités convenues (mobile money, espèces, virement, etc.).
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-encre-nuit dark:text-sable-chaud">
              <MessageCircle size={18} className="text-vert-marche" />
              <h2>Comment créer ma boutique ?</h2>
            </div>
            <p className="text-brume text-sm leading-relaxed">
              Cliquez sur <strong>Créer un compte</strong>, créez un compte vendeur, puis remplissez le formulaire de création de boutique. Vous pourrez ensuite ajouter vos produits et gérer vos commandes.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-encre-nuit dark:text-sable-chaud">
              <ShieldCheck size={18} className="text-vert-marche" />
              <h2>Signaler un problème</h2>
            </div>
            <p className="text-brume text-sm leading-relaxed">
              Si vous rencontrez un contenu inapproprié ou une arnaque, utilisez le bouton de signalement sur la page de la boutique ou du produit concerné.
            </p>
          </section>
        </div>

        <div className="mt-8 text-center text-sm text-brume">
          <p>Besoin de plus d'aide ? <a href="mailto:dieudonnemerci20@gmail.com" className="text-vert-marche hover:underline">Contactez-nous</a>.</p>
        </div>
      </main>
    </div>
  );
}
