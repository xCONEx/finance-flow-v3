
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { subscriptionService, SubscriptionData } from '@/services/subscriptionService';

export const useSubscription = () => {
  const { user } = useSupabaseAuth();
  const [subscription, setSubscription] = useState<string>('free');
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscription();
    } else {
      setSubscription('free');
      setSubscriptionData(null);
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await subscriptionService.getUserSubscription(user.id);
      
      if (data) {
        setSubscription(data.subscription || 'free');
        setSubscriptionData(data.subscription_data || null);
      }
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasFeatureAccess = (feature: string): boolean => {
    return subscriptionService.hasFeatureAccess(subscription, feature);
  };

  const getPlanLimits = () => {
    return subscriptionService.getPlanLimits(subscription);
  };

  const isActive = (): boolean => {
    return subscriptionService.isSubscriptionActive(subscriptionData);
  };

  const updateSubscription = async (newSubscriptionData: Partial<SubscriptionData>) => {
    if (!user) return { error: 'Usuário não autenticado' };

    const result = await subscriptionService.updateUserSubscription(user.id, newSubscriptionData);
    
    if (!result.error) {
      await loadSubscription(); // Recarregar dados
    }
    
    return result;
  };

  return {
    subscription,
    subscriptionData,
    loading,
    hasFeatureAccess,
    getPlanLimits,
    isActive,
    updateSubscription,
    refreshSubscription: loadSubscription
  };
};
