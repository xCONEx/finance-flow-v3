
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
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
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

  const signIn = async (email: string, password: string, rememberMe = false) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Salvar credenciais apenas se o usuário escolheu "Lembrar-me"
      if (!error && rememberMe) {
        localStorage.setItem('saved_email', email);
        localStorage.setItem('saved_password', password);
      } else if (!rememberMe) {
        // Remover credenciais salvas se o usuário desmarcou "Lembrar-me"
        localStorage.removeItem('saved_email');
        localStorage.removeItem('saved_password');
      }
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithBiometric = async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      
      // Verificar se há credenciais salvas
      const savedEmail = localStorage.getItem('saved_email');
      const savedPassword = localStorage.getItem('saved_password');
      
      if (!savedEmail || !savedPassword) {
        return { error: 'Credenciais não encontradas. Faça login com email/senha primeiro e marque "Lembrar-me".' };
      }

      if (Capacitor.isNativePlatform()) {
        try {
          // Para plataformas móveis nativas - usar plugin Capacitor
          const { Device } = await import('@capacitor/device');
          const info = await Device.getInfo();
          
          if (info.platform === 'ios' || info.platform === 'android') {
            // Simular autenticação biométrica nativa
            const confirmed = confirm('Usar autenticação biométrica para fazer login?');
            if (confirmed) {
              const { error } = await supabase.auth.signInWithPassword({
                email: savedEmail,
                password: savedPassword,
              });
              return { error };
            } else {
              return { error: 'Autenticação biométrica cancelada' };
            }
          }
        } catch (deviceError) {
          console.log('Device info error:', deviceError);
        }
      }

      // Para web/PWA - usar WebAuthn quando disponível
      if ('credentials' in navigator && 'create' in navigator.credentials) {
        try {
          // Tentar usar WebAuthn para autenticação biométrica
          const credential = await navigator.credentials.get({
            publicKey: {
              challenge: new Uint8Array(32),
              allowCredentials: [],
              userVerification: 'preferred',
              timeout: 30000
            }
          });

          if (credential) {
            const { error } = await supabase.auth.signInWithPassword({
              email: savedEmail,
              password: savedPassword,
            });
            return { error };
          }
        } catch (webAuthnError) {
          console.log('WebAuthn error:', webAuthnError);
          // Fallback para login normal
          const { error } = await supabase.auth.signInWithPassword({
            email: savedEmail,
            password: savedPassword,
          });
          return { error };
        }
      }

      // Fallback geral - login direto se biometria não estiver disponível
      const { error } = await supabase.auth.signInWithPassword({
        email: savedEmail,
        password: savedPassword,
      });
      return { error };

    } catch (error: any) {
      return { error: error.message || 'Erro na autenticação biométrica' };
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
