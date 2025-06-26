
import { useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useUsageTracking } from './useUsageTracking';
import { useSubscriptionPermissions } from './useSubscriptionPermissions';
import { useToast } from '@/hooks/use-toast';

export const useJobOperations = () => {
  const { addJob } = useApp();
  const { incrementJobUsage } = useUsageTracking();
  const { canCreateJob } = useSubscriptionPermissions();
  const { toast } = useToast();

  const createJob = useCallback(async (jobData: any) => {
    if (!canCreateJob) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de jobs do seu plano.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Adicionar job
      addJob(jobData);
      
      // Se o job for aprovado, incrementar uso
      if (jobData.status === 'aprovado') {
        await incrementJobUsage();
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao criar job:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar job. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  }, [canCreateJob, addJob, incrementJobUsage, toast]);

  const approveJob = useCallback(async (jobId: string, updateJob: Function) => {
    try {
      // Atualizar status do job
      updateJob(jobId, { status: 'aprovado' });
      
      // Incrementar uso
      await incrementJobUsage();
      
      return true;
    } catch (error) {
      console.error('Erro ao aprovar job:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar job. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  }, [incrementJobUsage, toast]);

  return {
    createJob,
    approveJob
  };
};
