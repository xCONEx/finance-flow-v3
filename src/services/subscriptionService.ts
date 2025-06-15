
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionData {
  plan: 'free' | 'basic' | 'premium' | 'enterprise' | 'enterprise-annual';
  status: 'active' | 'cancelled' | 'expired' | 'trialing';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  trial_end?: string;
  payment_provider?: 'cakto';
  external_subscription_id?: string;
  external_customer_id?: string;
  amount?: number;
  currency?: string;
}

export const subscriptionService = {
  // Buscar assinatura do usuário
  async getUserSubscription(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription, subscription_data')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar assinatura:', error);
      return null;
    }
  },

  // Atualizar assinatura do usuário
  async updateUserSubscription(userId: string, subscriptionData: Partial<SubscriptionData>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          subscription: subscriptionData.plan || 'free',
          subscription_data: subscriptionData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      return { data: null, error };
    }
  },

  // Verificar se usuário tem acesso a uma funcionalidade
  hasFeatureAccess(subscription: string, feature: string): boolean {
    const planFeatures = {
      free: ['basic_dashboard', 'limited_jobs'],
      basic: ['basic_dashboard', 'unlimited_jobs', 'basic_reports'],
      premium: ['basic_dashboard', 'unlimited_jobs', 'advanced_reports', 'team_collaboration'],
      enterprise: ['basic_dashboard', 'unlimited_jobs', 'advanced_reports', 'team_collaboration', 'api_access', 'priority_support'],
      'enterprise-annual': ['basic_dashboard', 'unlimited_jobs', 'advanced_reports', 'team_collaboration', 'api_access', 'priority_support']
    };

    const userPlanFeatures = planFeatures[subscription as keyof typeof planFeatures] || planFeatures.free;
    return userPlanFeatures.includes(feature);
  },

  // Obter limites do plano
  getPlanLimits(subscription: string) {
    const limits = {
      free: { jobs: 5, team_members: 1, storage_gb: 1 },
      basic: { jobs: -1, team_members: 3, storage_gb: 10 },
      premium: { jobs: -1, team_members: 10, storage_gb: 50 },
      enterprise: { jobs: -1, team_members: -1, storage_gb: 200 },
      'enterprise-annual': { jobs: -1, team_members: -1, storage_gb: 500 }
    };

    return limits[subscription as keyof typeof limits] || limits.free;
  },

  // Verificar se a assinatura está ativa
  isSubscriptionActive(subscriptionData: any): boolean {
    if (!subscriptionData) return false;
    
    const { status, current_period_end } = subscriptionData;
    
    if (status === 'active') {
      if (current_period_end) {
        return new Date(current_period_end) > new Date();
      }
      return true;
    }
    
    return false;
  }
};
