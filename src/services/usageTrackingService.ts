import { supabase } from '@/integrations/supabase/client';

export interface UsageRecord {
  id: string;
  user_id: string;
  usage_type: 'job' | 'project';
  count: number;
  reset_date: string;
  created_at: string;
  updated_at: string;
}

export const usageTrackingService = {
  async getUserUsage(userId: string, usageType: 'job' | 'project'): Promise<number> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const { data, error } = await supabase
        .from('user_usage_tracking')
        .select('count')
        .eq('user_id', userId)
        .eq('usage_type', usageType)
        .eq('reset_date', currentMonth)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data?.count || 0;
    } catch (error) {
      console.warn(`Erro ao buscar uso de ${usageType}:`, error);
      return 0;
    }
  },

  async incrementUsage(userId: string, usageType: 'job' | 'project'): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Primeiro, tenta buscar o registro existente
      const { data: existing, error: fetchError } = await supabase
        .from('user_usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('usage_type', usageType)
        .eq('reset_date', currentMonth)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        // Atualiza o contador existente
        const { error: updateError } = await supabase
          .from('user_usage_tracking')
          .update({ 
            count: existing.count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Cria um novo registro
        const { error: insertError } = await supabase
          .from('user_usage_tracking')
          .insert({
            user_id: userId,
            usage_type: usageType,
            count: 1,
            reset_date: currentMonth
          });

        if (insertError) throw insertError;
      }

      console.log(`✅ Incrementado uso de ${usageType} para usuário ${userId}`);
    } catch (error) {
      console.error(`❌ Erro ao incrementar uso de ${usageType}:`, error);
      throw error;
    }
  },

  async resetUsageForUser(userId: string): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const { error } = await supabase
        .from('user_usage_tracking')
        .update({ count: 0, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('reset_date', currentMonth);

      if (error) throw error;
      
      console.log(`✅ Reset de uso para usuário ${userId}`);
    } catch (error) {
      console.error('❌ Erro ao resetar uso:', error);
      throw error;
    }
  },

  async getAllUsageForUser(userId: string): Promise<{ jobs: number; projects: number }> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const { data, error } = await supabase
        .from('user_usage_tracking')
        .select('usage_type, count')
        .eq('user_id', userId)
        .eq('reset_date', currentMonth);

      if (error) throw error;

      const usage = { jobs: 0, projects: 0 };
      
      if (data) {
        data.forEach(record => {
          if (record.usage_type === 'job') {
            usage.jobs = record.count;
          } else if (record.usage_type === 'project') {
            usage.projects = record.count;
          }
        });
      }

      return usage;
    } catch (error) {
      console.warn('Erro ao buscar uso total:', error);
      return { jobs: 0, projects: 0 };
    }
  },

  async decrementUsage(userId: string, usageType: 'job' | 'project'): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Buscar o registro existente
      const { data: existing, error: fetchError } = await supabase
        .from('user_usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('usage_type', usageType)
        .eq('reset_date', currentMonth)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing && existing.count > 0) {
        // Decrementa o contador existente
        const { error: updateError } = await supabase
          .from('user_usage_tracking')
          .update({ 
            count: Math.max(0, existing.count - 1),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
        console.log(`✅ Decrementado uso de ${usageType} para usuário ${userId}`);
      } else {
        console.log(`⚠️ Nenhum registro de uso encontrado para decrementar ${usageType}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao decrementar uso de ${usageType}:`, error);
      throw error;
    }
  },

  async getCurrentUsage(userId: string): Promise<{ jobs: number; projects: number }> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const { data: usage, error } = await supabase
        .from('user_usage_tracking')
        .select('usage_type, count')
        .eq('user_id', userId)
        .eq('reset_date', currentMonth);

      if (error) throw error;

      const jobsCount = usage?.find(u => u.usage_type === 'job')?.count || 0;
      const projectsCount = usage?.find(u => u.usage_type === 'project')?.count || 0;

      return { jobs: jobsCount, projects: projectsCount };
    } catch (error) {
      console.error('❌ Erro ao buscar uso atual:', error);
      return { jobs: 0, projects: 0 };
    }
  }
};
