
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  checkUserUsageLimit, 
  incrementUserUsage, 
  resetUserUsageCounters,
  getUserUsageStats 
} from '@/services/usageTrackingService';

export const useUsageTracking = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const checkUsageLimit = async (usageType: 'jobs' | 'projects'): Promise<boolean> => {
    if (!user) return false;
    
    try {
      setLoading(true);
      const canUse = await checkUserUsageLimit(user.id, usageType);
      
      if (!canUse) {
        toast({
          title: "Limite atingido",
          description: `Você atingiu o limite mensal de ${usageType}. Faça upgrade do seu plano para continuar.`,
          variant: "destructive",
        });
      }
      
      return canUse;
    } catch (error) {
      console.error('Erro ao verificar limite de uso:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async (usageType: 'jobs' | 'projects'): Promise<void> => {
    if (!user) return;
    
    try {
      await incrementUserUsage(user.id, usageType);
    } catch (error) {
      console.error('Erro ao incrementar uso:', error);
    }
  };

  const incrementJobUsage = async (): Promise<void> => {
    await incrementUsage('jobs');
  };

  const incrementProjectUsage = async (): Promise<void> => {
    await incrementUsage('projects');
  };

  const resetUsageCounters = async (): Promise<void> => {
    if (!user) return;
    
    try {
      await resetUserUsageCounters(user.id);
      toast({
        title: "Sucesso",
        description: "Contadores de uso resetados com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao resetar contadores:', error);
      toast({
        title: "Erro",
        description: "Erro ao resetar contadores de uso.",
        variant: "destructive",
      });
    }
  };

  const getUsageStats = async () => {
    if (!user) return null;
    
    try {
      return await getUserUsageStats(user.id);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de uso:', error);
      return null;
    }
  };

  return {
    checkUsageLimit,
    incrementUsage,
    incrementJobUsage,
    incrementProjectUsage,
    resetUsageCounters,
    getUsageStats,
    loading
  };
};
