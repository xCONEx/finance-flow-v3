
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
      console.log('🔍 Buscando assinatura para usuário:', userId);
      
      const { data: currentUser, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser.user) {
        console.error('❌ Erro de autenticação:', userError);
        return {
          plan: 'free',
          status: 'inactive'
        };
      }

      // Se for o próprio usuário ou super admin, tentar buscar dados
      const isOwnUser = currentUser.user.id === userId;
      const isSuperAdmin = currentUser.user.email === 'yuriadrskt@gmail.com' || 
                          currentUser.user.email === 'adm.financeflow@gmail.com';

      if (!isOwnUser && !isSuperAdmin) {
        console.log('⚠️ Usuário não autorizado, retornando plano free');
        return {
          plan: 'free',
          status: 'inactive'
        };
      }

      // Usar RPC para buscar dados se for super admin
      if (isSuperAdmin) {
        try {
          const { data: profiles, error: rpcError } = await (supabase as any).rpc('get_all_profiles_for_admin');
          
          if (!rpcError && profiles) {
            const userProfile = profiles.find((p: any) => p.id === userId);
            if (userProfile) {
              console.log('✅ Dados encontrados via RPC:', userProfile.subscription);
              const subscriptionData = userProfile.subscription_data as any;

              return {
                plan: userProfile.subscription || 'free',
                status: subscriptionData?.status || 'inactive',
                current_period_start: subscriptionData?.current_period_start,
                current_period_end: subscriptionData?.current_period_end,
                payment_provider: subscriptionData?.payment_provider,
                amount: subscriptionData?.amount,
                currency: subscriptionData?.currency || 'BRL'
              };
            }
          }
        } catch (rpcError) {
          console.error('❌ Erro na chamada RPC:', rpcError);
        }
      }

      // Fallback: tentar busca direta (apenas para o próprio usuário)
      if (isOwnUser) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('subscription, subscription_data')
            .eq('id', userId)
            .single();

          if (!error && data) {
            console.log('✅ Dados encontrados via consulta direta:', data.subscription);
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
        } catch (directError) {
          console.error('❌ Erro na consulta direta:', directError);
        }
      }

      // Retorno padrão se tudo falhar
      console.log('⚠️ Retornando plano free como fallback');
      return {
        plan: 'free',
        status: 'inactive'
      };

    } catch (error) {
      console.error('❌ Erro geral ao buscar assinatura:', error);
      return {
        plan: 'free',
        status: 'inactive'
      };
    }
  },

  async updateSubscription(userId: string, subscriptionData: Partial<SubscriptionData>): Promise<boolean> {
    try {
      console.log('🔄 Atualizando assinatura para usuário:', userId, subscriptionData);
      
      const { data: currentUser, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser.user) {
        console.error('❌ Erro de autenticação:', userError);
        return false;
      }

      const isOwnUser = currentUser.user.id === userId;
      const isSuperAdmin = currentUser.user.email === 'yuriadrskt@gmail.com' || 
                          currentUser.user.email === 'adm.financeflow@gmail.com';

      if (!isOwnUser && !isSuperAdmin) {
        console.error('❌ Não autorizado a atualizar esta assinatura');
        return false;
      }

      // Se for super admin, usar RPC
      if (isSuperAdmin) {
        try {
          const updateData = {
            subscription: subscriptionData.plan,
            subscription_data: subscriptionData
          };

          const { error: rpcError } = await (supabase as any).rpc('admin_update_profile', {
            target_user_id: userId,
            update_data: updateData
          });

          if (!rpcError) {
            console.log('✅ Assinatura atualizada via RPC');
            return true;
          }
        } catch (rpcError) {
          console.error('❌ Erro na atualização via RPC:', rpcError);
        }
      }

      // Fallback: atualização direta (apenas para o próprio usuário)
      if (isOwnUser) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription: subscriptionData.plan,
              subscription_data: subscriptionData,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (!error) {
            console.log('✅ Assinatura atualizada via consulta direta');
            return true;
          }
        } catch (directError) {
          console.error('❌ Erro na atualização direta:', directError);
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Erro geral ao atualizar assinatura:', error);
      return false;
    }
  }
};
