import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function PrivacyPage() {
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
            <Shield size={28} className="text-vert-marche" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-encre-nuit dark:text-sable-chaud">{t('privacy.title')}</h1>
          <p className="mt-2 text-brume">{t('privacy.lastUpdated')}</p>
        </div>

        <div className="card p-6 space-y-6 text-sm text-brume leading-relaxed">
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-semibold text-encre-nuit dark:text-sable-chaud">
              <FileText size={18} className="text-vert-marche" />
              {t('privacy.dataCollected.title')}
            </h2>
            <p>
              {t('privacy.dataCollected.body')}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-encre-nuit dark:text-sable-chaud">{t('privacy.dataUse.title')}</h2>
            <p>
              {t('privacy.dataUse.body')}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-encre-nuit dark:text-sable-chaud">{t('privacy.security.title')}</h2>
            <p>
              {t('privacy.security.body')}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-encre-nuit dark:text-sable-chaud">{t('privacy.rights.title')}</h2>
            <p>
              {t('privacy.rights.body')} <a href="mailto:dieudonnemerci20@gmail.com" className="text-vert-marche hover:underline">dieudonnemerci20@gmail.com</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-encre-nuit dark:text-sable-chaud">{t('privacy.contact.title')}</h2>
            <p>
              {t('privacy.contact.body')} <a href="mailto:dieudonnemerci20@gmail.com" className="text-vert-marche hover:underline">dieudonnemerci20@gmail.com</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
