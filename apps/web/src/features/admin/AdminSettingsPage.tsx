import { useEffect, useState } from 'react';
import { Settings, Save, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import type { PlatformSettings, TrialDurationUnit } from '../../types';

export function AdminSettingsPage() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [trialValue, setTrialValue] = useState(7);
  const [trialUnit, setTrialUnit] = useState<TrialDurationUnit>('days');
  const [alertDays, setAlertDays] = useState(3);
  const [aiDailyLimit, setAiDailyLimit] = useState(5);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAdminSettings();
        setSettings(data);
        setTrialValue(data.trial_duration_value);
        setTrialUnit(data.trial_duration_unit);
        setAlertDays(data.trial_alert_days);
        setAiDailyLimit(data.ai_daily_limit);
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
        trial_duration_value: trialValue,
        trial_duration_unit: trialUnit,
        trial_alert_days: alertDays,
        ai_daily_limit: aiDailyLimit,
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
        <h1 className="font-serif text-2xl font-bold">{t('adminNav.settings')}</h1>
        {saved && (
          <span className="badge bg-vert-marche/10 text-vert-marche flex items-center gap-1">
            <Check size={14} /> {t('adminSettings.saved')}
          </span>
        )}
      </div>

      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-brume/20">
          <Settings size={20} className="text-vert-marche" />
          <h2 className="font-semibold">{t('adminSettings.platformConfig')}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-brume">{t('adminSettings.trialDuration')}</label>
            <p className="text-xs text-brume mb-2">{t('adminSettings.trialDurationHint')}</p>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={trialValue}
                onChange={(e) => setTrialValue(Number(e.target.value))}
                className="input flex-1"
              />
              <select
                value={trialUnit}
                onChange={(e) => setTrialUnit(e.target.value as TrialDurationUnit)}
                className="input w-auto"
              >
                <option value="minutes">{t('adminSettings.units.minutes')}</option>
                <option value="hours">{t('adminSettings.units.hours')}</option>
                <option value="days">{t('adminSettings.units.days')}</option>
                <option value="years">{t('adminSettings.units.years')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-brume">{t('adminSettings.expiryAlert')}</label>
            <p className="text-xs text-brume mb-2">{t('adminSettings.expiryAlertHint')}</p>
            <input
              type="number"
              min={0}
              value={alertDays}
              onChange={(e) => setAlertDays(Number(e.target.value))}
              className="input"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-brume">{t('adminSettings.aiDailyLimit')}</label>
            <p className="text-xs text-brume mb-2">{t('adminSettings.aiDailyLimitHint')}</p>
            <input
              type="number"
              min={1}
              value={aiDailyLimit}
              onChange={(e) => setAiDailyLimit(Number(e.target.value))}
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
            <Save size={16} /> {t('common.save')}
          </button>
        </div>
      </div>

      {settings && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-brume mb-2">{t('adminSettings.systemInfo')}</h3>
          <div className="space-y-1 text-xs text-brume">
            <p>{t('adminSettings.lastUpdated')}: {new Date(settings.updated_at).toLocaleString(i18n.language.startsWith('en') ? 'en-US' : 'fr-FR')}</p>
            <p>{t('adminSellers.createdOn')}: {new Date(settings.created_at).toLocaleString(i18n.language.startsWith('en') ? 'en-US' : 'fr-FR')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
