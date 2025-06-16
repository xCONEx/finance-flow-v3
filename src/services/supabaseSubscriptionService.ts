
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionData {
  plan: 'free' | 'basic' | 'premium' | 'enterprise' | 'enterprise-annual';
  status: 'active' | 'inactive' | 'cancelled';
  current_period_start?: string;
  current_period_end?: string;
  payment_provider?: string;
  amount?: number;
  currency?: string;
}

export const subscriptionService = {
  async getUserSubscription(userId: string): Promise<SubscriptionData | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription, subscription_data')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        plan: data.subscription || 'free',
        status: data.subscription_data?.status || 'inactive',
        current_period_start: data.subscription_data?.current_period_start,
        current_period_end: data.subscription_data?.current_period_end,
        payment_provider: data.subscription_data?.payment_provider,
        amount: data.subscription_data?.amount,
        currency: data.subscription_data?.currency || 'BRL'
      };
    } catch (error) {
      console.error('Erro ao buscar assinatura:', error);
      return null;
    }
  },

  async updateSubscription(userId: string, subscriptionData: Partial<SubscriptionData>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription: subscriptionData.plan,
          subscription_data: subscriptionData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      return false;
    }
  }
};
