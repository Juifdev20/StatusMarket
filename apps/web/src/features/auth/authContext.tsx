import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Profile, UserRole } from '../../types';

const AUTH_EMAIL_DOMAIN = 'statusmarket.app';

function toAuthEmail(username: string): string {
  const clean = username.trim().toLowerCase().replace(/\s+/g, '');
  if (clean.includes('@')) return clean;
  return `${clean}@${AUTH_EMAIL_DOMAIN}`;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signUp: (username: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
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
    const { error } = await supabase.auth.signInWithPassword({
      email: toAuthEmail(username),
      password,
    });
    return { error: error?.message ?? null };
  };

  const signUp = async (username: string, password: string, fullName?: string) => {
    const email = toAuthEmail(username);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username,
          role: 'SELLER',
        },
      },
    });
    if (signUpError) {
      return { error: signUpError.message };
    }
    // Auto-confirm trigger should already confirm the user; log them in immediately
    // to create the session and profile without waiting for confirmation email.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: signInError?.message ?? null };
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
