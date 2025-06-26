import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { subscriptionService } from '@/services/supabaseSubscriptionService';

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const { user, profile } = useSupabaseAuth();

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user?.id) {
        setSubscription('free');
        setLoading(false);
        return;
      }

      try {
        // First try to get from profile if available
        if (profile?.subscription) {
          setSubscription(profile.subscription);
          setLoading(false);
          return;
        }

        // Otherwise fetch from service
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
  }, [user, profile]);

  return { subscription, loading };
};
