import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Search, ShoppingBag, CreditCard, MessageCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function HelpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-sable-chaud dark:bg-encre-nuit">
      <header className="border-b border-brume/10 bg-white dark:bg-encre-nuit/80">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-brume hover:text-vert-marche transition-colors"
          >
            <ArrowLeft size={16} /> {t('common.back')}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-vert-marche/10">
            <HelpCircle size={28} className="text-vert-marche" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-encre-nuit dark:text-sable-chaud">{t('help.title')}</h1>
          <p className="mt-2 text-brume">{t('help.subtitle')}</p>
        </div>

        <div className="card p-6 space-y-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-encre-nuit dark:text-sable-chaud">
              <Search size={18} className="text-vert-marche" />
              <h2>{t('help.findProduct.q')}</h2>
            </div>
            <p className="text-brume text-sm leading-relaxed">
              {t('help.findProduct.a')}
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-encre-nuit dark:text-sable-chaud">
              <ShoppingBag size={18} className="text-vert-marche" />
              <h2>{t('help.howToBuy.q')}</h2>
            </div>
            <p className="text-brume text-sm leading-relaxed">
              {t('help.howToBuy.a')}
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-encre-nuit dark:text-sable-chaud">
              <CreditCard size={18} className="text-vert-marche" />
              <h2>{t('help.howToPay.q')}</h2>
            </div>
            <p className="text-brume text-sm leading-relaxed">
              {t('help.howToPay.a')}
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-encre-nuit dark:text-sable-chaud">
              <MessageCircle size={18} className="text-vert-marche" />
              <h2>{t('help.createShop.q')}</h2>
            </div>
            <p className="text-brume text-sm leading-relaxed">
              {t('help.createShop.aBefore')} <strong>{t('help.createShop.aBold')}</strong> {t('help.createShop.aAfter')}
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-encre-nuit dark:text-sable-chaud">
              <ShieldCheck size={18} className="text-vert-marche" />
              <h2>{t('help.report.q')}</h2>
            </div>
            <p className="text-brume text-sm leading-relaxed">
              {t('help.report.a')}
            </p>
          </section>
        </div>

        <div className="mt-8 text-center text-sm text-brume">
          <p>{t('help.needMore')} <a href="mailto:dieudonnemerci20@gmail.com" className="text-vert-marche hover:underline">{t('help.contactUs')}</a>.</p>
        </div>
      </main>
    </div>
  );
}
