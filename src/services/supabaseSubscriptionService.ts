
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
      // Usar função RPC se disponível para evitar problemas de RLS
      const { data: currentUser, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser.user) {
        console.error('Erro de autenticação:', userError);
        return null;
      }

      // Se for o próprio usuário, pode usar consulta direta simples
      if (currentUser.user.id === userId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription, subscription_data')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Erro ao buscar assinatura:', error);
          return null;
        }

        // Safe type casting for subscription_data JSON
        const subscriptionData = data.subscription_data as any;

        return {
          plan: data.subscription || 'free',
          status: subscriptionData?.status || 'inactive',
          current_period_start: subscriptionData?.current_period_start,
          current_period_end: subscriptionData?.current_period_end,
          payment_provider: subscriptionData?.payment_provider,
          amount: subscriptionData?.amount,
          currency: subscriptionData?.currency || 'BRL'
        };
      }

      // Para outros usuários, retornar apenas plano free
      return {
        plan: 'free',
        status: 'inactive'
      };
    } catch (error) {
      console.error('Erro ao buscar assinatura:', error);
      return null;
    }
  },

  async updateSubscription(userId: string, subscriptionData: Partial<SubscriptionData>): Promise<boolean> {
    try {
      const { data: currentUser, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser.user) {
        console.error('Erro de autenticação:', userError);
        return false;
      }

      // Só permite atualização do próprio usuário ou se for admin
      const isOwnUser = currentUser.user.id === userId;
      const isAdmin = currentUser.user.email === 'yuriadrskt@gmail.com' || 
                     currentUser.user.email === 'adm.financeflow@gmail.com';

      if (!isOwnUser && !isAdmin) {
        console.error('Não autorizado a atualizar esta assinatura');
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription: subscriptionData.plan,
          subscription_data: subscriptionData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao atualizar assinatura:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      return false;
    }
  }
};
