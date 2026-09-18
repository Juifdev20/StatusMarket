import { Link } from 'react-router-dom';
import { HelpCircle, Shield, Mail, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-sable-chaud dark:bg-encre-nuit border-t border-brume/10">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-brume">
            <Link to="/aide" className="flex items-center gap-1.5 hover:text-vert-marche transition-colors">
              <HelpCircle size={16} />
              {t('footer.help')}
            </Link>
            <Link to="/confidentialite" className="flex items-center gap-1.5 hover:text-vert-marche transition-colors">
              <Shield size={16} />
              {t('footer.privacy')}
            </Link>
            <a
              href="https://wa.me/243828497218"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-vert-marche transition-colors"
            >
              <MessageCircle size={16} />
              {t('common.whatsapp')}
            </a>
            <a
              href="mailto:dieudonnemerci20@gmail.com"
              className="flex items-center gap-1.5 hover:text-vert-marche transition-colors"
            >
              <Mail size={16} />
              {t('footer.email')}
            </a>
          </div>

          <div className="text-center text-sm text-brume">
            <p>{t('footer.rights', { year: 2026 })}</p>
            <p className="mt-1">{t('footer.designedBy')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
