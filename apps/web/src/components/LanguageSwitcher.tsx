import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('en') ? 'en' : 'fr';

  const toggle = () => {
    i18n.changeLanguage(current === 'fr' ? 'en' : 'fr');
  };

  return (
    <button
      onClick={toggle}
      className="btn-ghost p-2 flex items-center gap-1 text-xs font-semibold"
      title={current === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      <Languages size={16} />
      {current.toUpperCase()}
    </button>
  );
}
