
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

// Cache para evitar múltiplas chamadas
const subscriptionCache = new Map<string, { data: SubscriptionData | null, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const subscriptionService = {
  async getUserSubscription(userId: string): Promise<SubscriptionData | null> {
    try {
      // Verificar cache primeiro
      const cached = subscriptionCache.get(userId);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log('📋 Usando subscription do cache');
        return cached.data;
      }

      console.log('🔍 Buscando assinatura para usuário:', userId);
      
      const { data: currentUser, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser.user) {
        console.error('❌ Erro de autenticação:', userError);
        const fallbackData = { plan: 'free' as const, status: 'inactive' as const };
        subscriptionCache.set(userId, { data: fallbackData, timestamp: Date.now() });
        return fallbackData;
      }

      const isOwnUser = currentUser.user.id === userId;
      const isSuperAdmin = currentUser.user.email === 'yuriadrskt@gmail.com' || 
                          currentUser.user.email === 'adm.financeflow@gmail.com';

      console.log('🔍 Verificações:', { isOwnUser, isSuperAdmin, userEmail: currentUser.user.email });

      // Usar a nova função RPC segura para buscar assinatura
      if (isOwnUser || isSuperAdmin) {
        try {
          console.log('🔑 Buscando assinatura via RPC...');
          const { data: subscriptionData, error: rpcError } = await (supabase as any).rpc('get_user_subscription', {
            target_user_id: userId
          });
          
          if (!rpcError && subscriptionData && Array.isArray(subscriptionData) && subscriptionData.length > 0) {
            const userSubscription = subscriptionData[0] as any;
            console.log('✅ Dados de assinatura encontrados via RPC:', userSubscription);
            const subscriptionDetails = userSubscription.subscription_data as any;

            const result = {
              plan: userSubscription.subscription || 'free',
              status: subscriptionDetails?.status || 'inactive',
              current_period_start: subscriptionDetails?.current_period_start,
              current_period_end: subscriptionDetails?.current_period_end,
              payment_provider: subscriptionDetails?.payment_provider,
              amount: subscriptionDetails?.amount,
              currency: subscriptionDetails?.currency || 'BRL'
            };

            // Armazenar no cache
            subscriptionCache.set(userId, { data: result, timestamp: Date.now() });
            return result;
          } else {
            console.log('⚠️ RPC não retornou dados:', rpcError);
          }
        } catch (rpcError) {
          console.error('❌ Erro na chamada RPC:', rpcError);
        }
      }

      // Se não é próprio usuário nem admin, retornar free
      if (!isOwnUser && !isSuperAdmin) {
        console.log('⚠️ Usuário não autorizado, retornando plano free');
        const fallbackData = { plan: 'free' as const, status: 'inactive' as const };
        subscriptionCache.set(userId, { data: fallbackData, timestamp: Date.now() });
        return fallbackData;
      }

      // Retorno padrão se tudo falhar
      console.log('⚠️ Retornando plano free como fallback');
      const fallbackData = { plan: 'free' as const, status: 'inactive' as const };
      subscriptionCache.set(userId, { data: fallbackData, timestamp: Date.now() });
      return fallbackData;

    } catch (error) {
      console.error('❌ Erro geral ao buscar assinatura:', error);
      const fallbackData = { plan: 'free' as const, status: 'inactive' as const };
      subscriptionCache.set(userId, { data: fallbackData, timestamp: Date.now() });
      return fallbackData;
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

      // Usar a nova função RPC para atualizar
      if (isSuperAdmin) {
        try {
          console.log('🔑 Atualizando assinatura como admin via RPC...');
          
          const { data, error: rpcError } = await (supabase as any).rpc('admin_update_profile', {
            target_user_id: userId,
            new_subscription: subscriptionData.plan,
            new_subscription_data: subscriptionData
          });

          if (!rpcError) {
            console.log('✅ Assinatura atualizada via RPC admin');
            // Limpar cache
            subscriptionCache.delete(userId);
            return true;
          } else {
            console.error('❌ Erro na atualização via RPC admin:', rpcError);
          }
        } catch (rpcError) {
          console.error('❌ Erro na atualização via RPC admin:', rpcError);
        }
      }

      // Fallback: atualização direta para próprio usuário
      if (isOwnUser) {
        try {
          console.log('🔄 Tentando atualização direta...');
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
            // Limpar cache
            subscriptionCache.delete(userId);
            return true;
          } else {
            console.error('❌ Erro na atualização direta:', error);
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
