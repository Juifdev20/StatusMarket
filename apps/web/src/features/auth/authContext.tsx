import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Profile, UserRole } from '../../types';

const AUTH_EMAIL_DOMAIN = 'statusmarket.app';

export function toAuthEmail(username: string): string {
  const clean = username.trim().toLowerCase().replace(/\s+/g, '');
  if (clean.includes('@')) return clean;
  return `${clean}@${AUTH_EMAIL_DOMAIN}`;
}

function translateAuthError(msg: string): string {
  if (!msg) return '';
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'Nom d\'utilisateur ou mot de passe incorrect.';
  if (lower.includes('invalid credentials')) return 'Nom d\'utilisateur ou mot de passe incorrect.';
  if (lower.includes('user already registered') || lower.includes('already been registered')) return 'Ce nom d\'utilisateur est déjà utilisé. Choisissez-en un autre.';
  if (lower.includes('already') && lower.includes('taken')) return 'Ce nom d\'utilisateur est déjà pris.';
  if (lower.includes('duplicate key')) return 'Ce nom d\'utilisateur est déjà pris. Choisissez-en un autre.';
  if (lower.includes('numéro de téléphone') && lower.includes('déjà utilisé')) return 'Ce numéro de téléphone est déjà utilisé par un autre compte.';
  if (lower.includes('email rate limit')) return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
  if (lower.includes('rate limit')) return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
  if (lower.includes('password') && lower.includes('short')) return 'Le mot de passe est trop court (minimum 6 caractères).';
  if (lower.includes('password') && lower.includes('weak')) return 'Le mot de passe est trop faible. Utilisez au moins 6 caractères.';
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) return 'Problème de connexion internet. Vérifiez votre réseau.';
  if (lower.includes('timeout')) return 'Le serveur met trop de temps à répondre. Réessayez.';
  if (lower.includes('overload')) return 'Le serveur est surchargé. Réessayez dans un instant.';
  if (lower.includes('user not found')) return 'Aucun compte trouvé avec ce nom d\'utilisateur.';
  if (lower.includes('not confirmed')) return 'Votre compte n\'est pas encore confirmé. Contactez le support.';
  if (lower.includes('jwt') || lower.includes('token')) return 'Session expirée. Reconnectez-vous.';
  return msg;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signUp: (username: string, password: string, fullName: string, phone: string, recoveryPin: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) {
      const profileData = data as Profile;
      const { data: userData } = await supabase.auth.getUser();
      const metadataRole = userData?.user?.user_metadata?.role;
      if (metadataRole === 'SELLER' && profileData.role === 'CLIENT') {
        await supabase.from('profiles').update({ role: 'SELLER' }).eq('id', userId);
        profileData.role = 'SELLER';
      }
      setProfile(profileData);
    } else if (error && error.code === 'PGRST116') {
      const { data: userData } = await supabase.auth.getUser();
      const meta = userData?.user?.user_metadata || {};
      const fullName = meta.full_name || '';
      const username = meta.username || '';
      const role = meta.role || 'SELLER';
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username,
          email: userData?.user?.email || null,
          full_name: fullName,
          role,
        })
        .select('*')
        .single();
      if (newProfile) setProfile(newProfile as Profile);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      await loadProfile(session.user.id);
    }
  }, [session, loadProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      if (session?.user?.id) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session);
      if (session?.user?.id) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = async (username: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: toAuthEmail(username),
        password,
      });
      if (error) {
        return { error: translateAuthError(error.message) };
      }
      return { error: null };
    } catch {
      return { error: 'Problème de connexion internet. Vérifiez votre réseau et réessayez.' };
    }
  };

  const signUp = async (username: string, password: string, fullName: string, phone: string, recoveryPin: string) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, fullName, phone, recoveryPin }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const rawMsg = typeof err.error === 'string' ? err.error : '';
        return { error: translateAuthError(rawMsg) || 'Une erreur est survenue lors de l\'inscription.' };
      }
    } catch {
      return { error: 'Problème de connexion internet. Vérifiez votre réseau et réessayez.' };
    }
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: toAuthEmail(username),
        password,
      });
      if (signInError) {
        return { error: translateAuthError(signInError.message) };
      }
      return { error: null };
    } catch {
      return { error: 'Inscription réussie mais connexion automatique impossible. Essayez de vous connecter manuellement.' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getHomeRoute(role: UserRole | undefined): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin';
    case 'SELLER':
      return '/vendeur';
    default:
      return '/';
  }
}
