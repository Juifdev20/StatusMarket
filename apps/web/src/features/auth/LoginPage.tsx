import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './authContext';
import { supabase } from '../../lib/supabase';
import { StatusRing } from '../../components/StatusRing';
import { Store, MessageCircle, TrendingUp, Shield, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export function LoginPage() {
  const { t } = useTranslation();
  const { signIn, signUp, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [showRecoveryPin, setShowRecoveryPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateUsername = (value: string) => {
    const trimmed = value.trim().toLowerCase().replace(/\s+/g, '');
    if (trimmed.length < 4) return t('auth.errors.usernameTooShort');
    if (trimmed.length > 20) return t('auth.errors.usernameTooLong');
    if (!/^[a-z0-9]+$/.test(trimmed)) return t('auth.errors.usernameAlphanumeric');
    if (!/[a-z]/.test(trimmed)) return t('auth.errors.usernameNeedsLetter');
    if (!/[0-9]/.test(trimmed)) return t('auth.errors.usernameNeedsDigit');
    return null;
  };

  const usernameError = mode === 'register' && touched.username ? validateUsername(username) : null;
  const passwordMatchError = mode === 'register' && touched.confirmPassword && confirmPassword.length > 0 && password !== confirmPassword
    ? t('auth.errors.passwordMismatch')
    : null;
  const passwordsMatch = mode === 'register' && confirmPassword.length > 0 && password === confirmPassword;

  useEffect(() => {
    if (!profile) return;
    (async () => {
      if (profile.role === 'SELLER') {
        const { data } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', profile.id)
          .maybeSingle();
        if (!data) {
          navigate('/vendeur/boutique/nouvelle', { replace: true });
        } else {
          navigate('/vendeur', { replace: true });
        }
      } else if (profile.role === 'SUPER_ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    })();
  }, [profile, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setTouched({ username: true, confirmPassword: true });

    if (mode === 'register') {
      const usernameErr = validateUsername(username);
      if (usernameErr) {
        setError(usernameErr);
        return;
      }
    }

    setLoading(true);

    if (mode === 'login') {
      const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
      const { error: signInError } = await signIn(cleanUsername, password);
      if (signInError) {
        setError(signInError);
        setLoading(false);
      }
    } else {
      if (!fullName.trim()) {
        setError(t('auth.errors.fullNameRequired'));
        setLoading(false);
        return;
      }
      if (!phone.trim()) {
        setError(t('auth.errors.phoneRequired'));
        setLoading(false);
        return;
      }
      if (!recoveryPin.trim()) {
        setError(t('auth.errors.pinRequired'));
        setLoading(false);
        return;
      }
      if (!/^\d{4,6}$/.test(recoveryPin)) {
        setError(t('auth.errors.pinFormat'));
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError(t('auth.errors.passwordMismatchLong'));
        setLoading(false);
        return;
      }
      const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
      const { error: signUpError } = await signUp(cleanUsername, password, fullName, phone, recoveryPin);
      if (signUpError) {
        setError(signUpError);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-sable-chaud dark:bg-encre-nuit">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left side - marketing */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-vert-marche p-12 text-white">
          <div className="flex items-center gap-3">
            <StatusRing progress={75} size={48} color="#FFFFFF">
              <div className="flex h-full w-full items-center justify-center bg-white rounded-full">
                <Store size={22} className="text-vert-marche" />
              </div>
            </StatusRing>
            <span className="font-serif text-2xl font-bold">StatusMarket</span>
          </div>

          <div className="space-y-8">
            <h2 className="font-serif text-4xl font-bold leading-tight">
              {t('auth.marketing.headline1')} <br />{t('auth.marketing.headline2')}
            </h2>
            <p className="text-lg text-white/80 max-w-md">
              {t('auth.marketing.subtitle')}
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <MessageCircle size={20} />
                </div>
                <p className="font-medium">{t('auth.marketing.point1')}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <TrendingUp size={20} />
                </div>
                <p className="font-medium">{t('auth.marketing.point2')}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Shield size={20} />
                </div>
                <p className="font-medium">{t('auth.marketing.point3')}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/60">{t('footer.rights', { year: 2026 })}</p>
        </div>

        {/* Right side - form */}
        <div className="flex flex-1 flex-col items-center justify-center p-4 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
              <StatusRing progress={75} size={64} color="#158F73">
                <div className="flex h-full w-full items-center justify-center bg-vert-marche rounded-full">
                  <Store size={24} className="text-white" />
                </div>
              </StatusRing>
              <h1 className="font-serif text-2xl font-bold text-encre-nuit dark:text-sable-chaud">StatusMarket</h1>
              <p className="text-sm text-brume">{t('auth.tagline')}</p>
            </div>

            <div className="card p-6 lg:p-8">
              <h2 className="font-serif text-2xl font-bold text-encre-nuit dark:text-sable-chaud mb-2">
                {mode === 'login' ? t('auth.login') : t('auth.register')}
              </h2>
              <p className="text-sm text-brume mb-6">
                {mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
              </p>

              <div className="mb-6 flex gap-2 p-1 rounded-xl bg-encre-nuit/5 dark:bg-white/5">
                <button
                  onClick={() => { setMode('login'); setError(null); setTouched({}); }}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-white dark:bg-encre-nuit shadow-sm text-vert-marche' : 'text-brume'}`}
                >
                  {t('auth.login')}
                </button>
                <button
                  onClick={() => { setMode('register'); setError(null); setTouched({}); }}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-white dark:bg-encre-nuit shadow-sm text-vert-marche' : 'text-brume'}`}
                >
                  {t('auth.register')}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="label">{t('auth.fullName')}</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input"
                      placeholder="Jean Mukendi"
                    />
                  </div>
                )}
                {mode === 'register' && (
                  <div>
                    <label className="label">{t('auth.phone')}</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input"
                      placeholder="+243 828 497 218"
                    />
                  </div>
                )}
                {mode === 'register' && (
                  <div>
                    <label className="label">{t('auth.recoveryPin')}</label>
                    <div className="relative">
                      <input
                        type={showRecoveryPin ? 'text' : 'password'}
                        inputMode="numeric"
                        pattern="\d{4,6}"
                        required
                        minLength={4}
                        maxLength={6}
                        value={recoveryPin}
                        onChange={(e) => setRecoveryPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="input w-full pr-10"
                        placeholder={t('auth.recoveryPinPlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRecoveryPin((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-brume"
                      >
                        {showRecoveryPin ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-brume">{t('auth.recoveryPinHint')}</p>
                  </div>
                )}
                <div>
                  <label className="label">{t('auth.username')}</label>
                  <input
                    type="text"
                    required
                    minLength={4}
                    maxLength={20}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                    className={`input ${usernameError ? 'border-corail-alerte' : ''}`}
                    placeholder="jean2024"
                  />
                  {usernameError ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-corail-alerte">
                      <AlertCircle size={12} /> {usernameError}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-brume">{t('auth.usernameHint')}</p>
                  )}
                </div>
                <div>
                  <label className="label">{t('auth.password')}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input w-full pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brume hover:text-vert-marche"
                      aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {mode === 'register' && (
                  <div>
                    <label className="label">{t('auth.confirmPassword')}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                        className={`input w-full pr-10 ${passwordMatchError ? 'border-corail-alerte' : ''}`}
                        placeholder="••••••••"
                      />
                      {passwordsMatch && (
                        <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-vert-marche" />
                      )}
                    </div>
                    {passwordMatchError && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-corail-alerte">
                        <AlertCircle size={12} /> {passwordMatchError}
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-corail-alerte/10 p-3 text-sm text-corail-alerte">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? t('common.loading') : mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}
                </button>
              </form>

              <div className="mt-4 flex flex-col items-center gap-1 text-center">
                <Link to="/recuperation" className="text-xs text-brume hover:text-vert-marche transition-colors">
                  {t('auth.forgotPassword')}
                </Link>
                <Link to="/recuperation" className="text-xs text-brume hover:text-vert-marche transition-colors">
                  {t('auth.forgotUsername')}
                </Link>
              </div>

              <div className="mt-4 text-center">
                <Link to="/" className="text-sm text-brume hover:text-vert-marche transition-colors">
                  ← {t('auth.backToHome')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
