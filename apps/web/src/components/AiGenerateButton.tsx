import { useState } from 'react';
import { Sparkles, Lock } from 'lucide-react';

export type AiLanguage = 'fr' | 'en' | 'ln' | 'sw';

const LANGUAGES: { code: AiLanguage; label: string }[] = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'Anglais' },
  { code: 'ln', label: 'Lingala' },
  { code: 'sw', label: 'Swahili' },
];

interface AiGenerateButtonProps {
  ready: boolean;
  hasResult: boolean;
  generating: boolean;
  onGenerate: (language: AiLanguage) => void;
  disabledTitle?: string;
  locked?: boolean;
  lockedReason?: string;
  onLockedClick?: () => void;
}

export function AiGenerateButton({ ready, hasResult, generating, onGenerate, disabledTitle, locked, lockedReason, onLockedClick }: AiGenerateButtonProps) {
  const [language, setLanguage] = useState<AiLanguage>('fr');

  if (locked) {
    return (
      <button
        type="button"
        onClick={onLockedClick}
        title={lockedReason}
        className="btn-outline text-xs flex items-center gap-1 py-1 px-2 border-ambre-pagne/50 text-ambre-pagne whitespace-nowrap"
      >
        <Lock size={12} /> Fonctionnalité PRO
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as AiLanguage)}
        className="input py-1 px-1.5 text-xs w-auto"
        title="Langue de génération"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onGenerate(language)}
        disabled={!ready || generating}
        className="btn-outline text-xs flex items-center gap-1 py-1 px-2 disabled:opacity-40 whitespace-nowrap"
        title={!ready ? disabledTitle : hasResult ? 'Générer une autre proposition' : 'Générer avec l\'IA'}
      >
        <Sparkles size={12} className={generating ? 'animate-pulse' : ''} />
        {generating ? 'Génération...' : hasResult ? 'Régénérer' : 'Générer pour moi'}
      </button>
    </div>
  );
}
