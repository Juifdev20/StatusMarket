import { useEffect, useState } from 'react';
import { Settings, Save, Check } from 'lucide-react';
import { api } from '../../lib/api';
import type { PlatformSettings } from '../../types';

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [trialDays, setTrialDays] = useState(7);
  const [alertDays, setAlertDays] = useState(3);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAdminSettings();
        setSettings(data);
        setTrialDays(data.trial_duration_days);
        setAlertDays(data.trial_alert_days);
      } catch {
        // keep defaults
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateAdminSettings({
        trial_duration_days: trialDays,
        trial_alert_days: alertDays,
      });
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignored
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Paramètres</h1>
        {saved && (
          <span className="badge bg-vert-marche/10 text-vert-marche flex items-center gap-1">
            <Check size={14} /> Enregistré
          </span>
        )}
      </div>

      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-brume/20">
          <Settings size={20} className="text-vert-marche" />
          <h2 className="font-semibold">Configuration de la plateforme</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-brume">Durée de l'essai (jours)</label>
            <p className="text-xs text-brume mb-2">Nombre de jours pour la période d'essai gratuite des nouveaux vendeurs.</p>
            <input
              type="number"
              min={1}
              value={trialDays}
              onChange={(e) => setTrialDays(Number(e.target.value))}
              className="input"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-brume">Alerte d'expiration (jours)</label>
            <p className="text-xs text-brume mb-2">Nombre de jours avant l'expiration de l'essai pour envoyer une alerte.</p>
            <input
              type="number"
              min={0}
              value={alertDays}
              onChange={(e) => setAlertDays(Number(e.target.value))}
              className="input"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={16} /> Enregistrer
          </button>
        </div>
      </div>

      {settings && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-brume mb-2">Informations système</h3>
          <div className="space-y-1 text-xs text-brume">
            <p>Dernière mise à jour: {new Date(settings.updated_at).toLocaleString('fr-FR')}</p>
            <p>Créé le: {new Date(settings.created_at).toLocaleString('fr-FR')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
