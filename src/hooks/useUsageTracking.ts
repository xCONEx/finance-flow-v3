
import { useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { usageTrackingService } from '@/services/usageTrackingService';
import { useToast } from '@/hooks/use-toast';

export const useUsageTracking = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const incrementJobUsage = useCallback(async () => {
    if (!user?.id) {
      console.warn('Usuário não autenticado para incrementar uso de jobs');
      return;
    }

    try {
      await usageTrackingService.incrementUsage(user.id, 'job');
      console.log('✅ Uso de job incrementado no banco de dados');
    } catch (error) {
      console.error('❌ Erro ao incrementar uso de job:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar uso. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [user?.id, toast]);

  const incrementProjectUsage = useCallback(async () => {
    if (!user?.id) {
      console.warn('Usuário não autenticado para incrementar uso de projetos');
      return;
    }

    try {
      await usageTrackingService.incrementUsage(user.id, 'project');
      console.log('✅ Uso de projeto incrementado no banco de dados');
    } catch (error) {
      console.error('❌ Erro ao incrementar uso de projeto:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar uso. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [user?.id, toast]);

  const getCurrentUsage = useCallback(async () => {
    if (!user?.id) return { jobs: 0, projects: 0 };

    try {
      return await usageTrackingService.getAllUsageForUser(user.id);
    } catch (error) {
      console.error('❌ Erro ao buscar uso atual:', error);
      return { jobs: 0, projects: 0 };
    }
  }, [user?.id]);

  const resetUsageCounters = useCallback(async () => {
    if (!user?.id) {
      console.warn('Usuário não autenticado para resetar contadores');
      return;
    }

    try {
      await usageTrackingService.resetUsageForUser(user.id);
      toast({
        title: "Sucesso",
        description: "Contadores de uso resetados com sucesso!",
      });
    } catch (error) {
      console.error('❌ Erro ao resetar contadores:', error);
      toast({
        title: "Erro",
        description: "Erro ao resetar contadores. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [user?.id, toast]);

  return {
    incrementJobUsage,
    incrementProjectUsage,
    getCurrentUsage,
    resetUsageCounters
  };
};
