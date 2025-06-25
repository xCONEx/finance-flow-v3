
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type Agency = Tables<'agencies'>;

interface SupabaseAuthContextType {
  user: User | null;
  profile: Profile | null;
  agency: Agency | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithBiometric: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        console.log('Profile will be created by trigger');
        return null;
      }

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  const fetchAgency = async (agencyId: string) => {
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', agencyId)
        .single();

      if (error) {
        console.error('Error fetching agency:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchAgency:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Buscar perfil do usuário usando setTimeout para evitar deadlock
          setTimeout(async () => {
            if (!mounted) return;
            
            const userProfile = await fetchProfile(session.user.id);
            if (mounted) {
              setProfile(userProfile);

              // Se o usuário tem agência, buscar dados da agência
              if (userProfile?.agency_id) {
                const userAgency = await fetchAgency(userProfile.agency_id);
                if (mounted) setAgency(userAgency);
              } else {
                setAgency(null);
              }
            }
          }, 0);
        } else {
          setProfile(null);
          setAgency(null);
        }

        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Buscar sessão existente
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(userProfile);
            
            if (userProfile?.agency_id) {
              const userAgency = await fetchAgency(userProfile.agency_id);
              if (mounted) setAgency(userAgency);
            }
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Salvar credenciais para Face ID se login for bem-sucedido
      if (!error) {
        localStorage.setItem('saved_email', email);
        localStorage.setItem('saved_password', password);
      }
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithBiometric = async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      
      if (!Capacitor.isNativePlatform()) {
        return { error: 'Biometric authentication is only available on mobile devices' };
      }

      // Verificar se há credenciais salvas
      const savedEmail = localStorage.getItem('saved_email');
      const savedPassword = localStorage.getItem('saved_password');
      
      if (!savedEmail || !savedPassword) {
        return { error: 'No saved credentials found. Please login with email/password first.' };
      }

      // Para web/PWA, podemos usar a Web Authentication API
      if ('credentials' in navigator && 'create' in navigator.credentials) {
        try {
          // Solicitar autenticação biométrica usando WebAuthn
          const credential = await navigator.credentials.get({
            publicKey: {
              challenge: new Uint8Array(32),
              allowCredentials: [],
              userVerification: 'required'
            }
          });

          if (credential) {
            // Se autenticação foi bem-sucedida, fazer login
            const { error } = await supabase.auth.signInWithPassword({
              email: savedEmail,
              password: savedPassword,
            });
            return { error };
          }
        } catch (webAuthnError) {
          // Fallback para login normal em caso de erro
          const { error } = await supabase.auth.signInWithPassword({
            email: savedEmail,
            password: savedPassword,
          });
          return { error };
        }
      }

      // Para plataformas móveis nativas, usar plugin nativo
      try {
        // Simular autenticação biométrica para desenvolvimento
        const confirmed = confirm('Use biometric authentication to login?');
        if (confirmed) {
          const { error } = await supabase.auth.signInWithPassword({
            email: savedEmail,
            password: savedPassword,
          });
          return { error };
        } else {
          return { error: 'Biometric authentication cancelled' };
        }
      } catch (error: any) {
        return { error: error.message || 'Biometric authentication failed' };
      }

    } catch (error: any) {
      return { error: error.message || 'Biometric authentication failed' };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Limpar credenciais salvas ao fazer logout
      localStorage.removeItem('saved_email');
      localStorage.removeItem('saved_password');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (!error && data) {
        setProfile(data);
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    profile,
    agency,
    session,
    isAuthenticated: !!user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithBiometric,
    signOut,
    resetPassword,
    updateProfile,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export default SupabaseAuthProvider;
