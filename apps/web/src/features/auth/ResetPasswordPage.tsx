import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, ArrowLeft, UserCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StatusRing } from '../../components/StatusRing';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'reset' | 'recover'>('reset');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recovered, setRecovered] = useState<{ username: string; fullName: string | null } | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError(t('resetPassword.errors.tooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, phone, recoveryPin, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('common.error'));
      } else {
        setSuccess(t('resetPassword.success'));
        setUsername('');
        setPhone('');
        setRecoveryPin('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setError(t('auth.errors.network'));
    }
    setLoading(false);
  };

  const handleRecover = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setRecovered(null);

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/recover-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('resetPassword.noAccountFound'));
      } else {
        setRecovered({ username: data.username, fullName: data.fullName });
      }
    } catch {
      setError(t('auth.errors.network'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-sable-chaud dark:bg-encre-nuit px-4 py-12 lg:py-20">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <StatusRing progress={0} size={80} color="#2D6A4F" />
          <h1 className="font-serif mt-6 text-2xl font-bold text-encre-nuit dark:text-sable-chaud">
            {mode === 'reset' ? t('resetPassword.title') : t('resetPassword.recoverTitle')}
          </h1>
          <p className="mt-2 text-sm text-brume">
            {mode === 'reset' ? t('resetPassword.resetHint') : t('resetPassword.recoverHint')}
          </p>
        </div>

        <div className="card p-6 lg:p-8">
          <div className="mb-6 flex gap-2 p-1 rounded-xl bg-encre-nuit/5 dark:bg-white/5">
            <button
              onClick={() => setMode('reset')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === 'reset' ? 'bg-white dark:bg-encre-nuit shadow-sm text-vert-marche' : 'text-brume'}`}
            >
              <KeyRound size={14} className="inline mr-1" /> {t('auth.password')}
            </button>
            <button
              onClick={() => setMode('recover')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === 'recover' ? 'bg-white dark:bg-encre-nuit shadow-sm text-vert-marche' : 'text-brume'}`}
            >
              <UserCircle size={14} className="inline mr-1" /> {t('auth.username')}
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-corail-alerte/10 p-3 text-sm text-corail-alerte">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-vert-marche/10 p-3 text-sm text-vert-marche">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {mode === 'reset' ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="label">{t('auth.username')}</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="input w-full"
                  placeholder="votreidentifiant"
                />
              </div>
              <div>
                <label className="label">{t('auth.phone')}</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input w-full"
                  placeholder="+243..."
                />
              </div>
              <div>
                <label className="label">{t('auth.recoveryPin')}</label>
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  minLength={4}
                  maxLength={6}
                  value={recoveryPin}
                  onChange={(e) => setRecoveryPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input w-full"
                  placeholder={t('auth.recoveryPinPlaceholder')}
                />
              </div>
              <div>
                <label className="label">{t('resetPassword.newPassword')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input w-full pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brume"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">{t('auth.confirmPassword')}</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input w-full"
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? t('resetPassword.processing') : t('resetPassword.title')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecover} className="space-y-4">
              <div>
                <label className="label">{t('auth.phone')}</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input w-full"
                  placeholder="+243..."
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? t('resetPassword.searching') : t('resetPassword.recoverTitle')}
              </button>
              {recovered && (
                <div className="rounded-lg bg-vert-marche/10 p-4 text-center">
                  <p className="text-sm text-brume">{t('auth.username')}</p>
                  <p className="mt-1 font-mono text-lg font-bold text-vert-marche">{recovered.username}</p>
                  {recovered.fullName && <p className="text-xs text-brume mt-1">{recovered.fullName}</p>}
                </div>
              )}
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/connexion" className="text-sm text-brume hover:text-vert-marche transition-colors inline-flex items-center gap-1">
              <ArrowLeft size={14} /> {t('resetPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
