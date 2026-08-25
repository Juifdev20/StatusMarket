import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (deferredPrompt && !dismissed) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt, dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl bg-white dark:bg-encre-nuit border border-brume/30 shadow-lg p-4 md:bottom-6">
      <button
        onClick={() => { setShowPrompt(false); setDismissed(true); }}
        className="absolute right-3 top-3 text-brume hover:text-encre-nuit"
      >
        <X size={18} />
      </button>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-vert-marche/10">
          <Download size={20} className="text-vert-marche" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-encre-nuit dark:text-sable-chaud">Installer StatusMarket</h3>
          <p className="mt-1 text-xs text-brume">
            Accédez à votre boutique plus rapidement, même hors connexion.
          </p>
          <button onClick={handleInstall} className="btn-primary mt-3 w-full text-xs">
            Installer l'application
          </button>
        </div>
      </div>
    </div>
  );
}
