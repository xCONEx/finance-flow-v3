
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { subscriptionService } from '@/services/supabaseSubscriptionService';

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const { user, profile } = useSupabaseAuth();

  useEffect(() => {
    let mounted = true;
    
    const loadSubscription = async () => {
      if (!user?.id) {
        if (mounted) {
          setSubscription('free');
          setLoading(false);
        }
        return;
      }

      try {
        // Primeiro tentar usar dados do profile se disponível
        if (profile?.subscription) {
          console.log('✅ Usando subscription do profile:', profile.subscription);
          if (mounted) {
            setSubscription(profile.subscription);
            setLoading(false);
          }
          return;
        }

        // Caso contrário, buscar do service (apenas uma vez)
        console.log('🔄 Buscando subscription do service...');
        const data = await subscriptionService.getUserSubscription(user.id);
        
        if (mounted) {
          const userSubscription = data?.plan || 'free';
          console.log('✅ Subscription carregada:', userSubscription);
          setSubscription(userSubscription);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar assinatura:', error);
        if (mounted) {
          setSubscription('free');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSubscription();
    
    return () => {
      mounted = false;
    };
  }, [user?.id, profile?.subscription]); // Dependência específica no subscription do profile

  return { subscription, loading };
};
