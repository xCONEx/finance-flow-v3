
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { subscriptionService } from '@/services/supabaseSubscriptionService';

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseAuth();

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const data = await subscriptionService.getUserSubscription(user.id);
        setSubscription(data?.plan || 'free');
      } catch (error) {
        console.error('Erro ao carregar assinatura:', error);
        setSubscription('free');
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [user]);

  return { subscription, loading };
};
