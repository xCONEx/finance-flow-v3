
import { useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useUsageTracking } from './useUsageTracking';
import { useSubscriptionPermissions } from './useSubscriptionPermissions';
import { useToast } from '@/hooks/use-toast';

export const useJobOperations = () => {
  const { addJob, updateJob } = useApp();
  const { incrementJobUsage } = useUsageTracking();
  const { canCreateJob } = useSubscriptionPermissions();
  const { toast } = useToast();

  const createJob = useCallback(async (jobData: any) => {
    console.log('🔄 Criando job:', jobData);
    
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
      
      // Se o job for criado como aprovado, incrementar uso imediatamente
      if (jobData.status === 'aprovado') {
        console.log('🔄 Job criado como aprovado, incrementando uso...');
        await incrementJobUsage();
      }
      
      console.log('✅ Job criado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar job:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar job. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  }, [canCreateJob, addJob, incrementJobUsage, toast]);

  const approveJob = useCallback(async (jobId: string) => {
    console.log('🔄 Aprovando job:', jobId);
    
    try {
      // Atualizar status do job
      updateJob(jobId, { status: 'aprovado' });
      
      // Incrementar uso
      console.log('🔄 Job aprovado, incrementando uso...');
      await incrementJobUsage();
      
      console.log('✅ Job aprovado com sucesso');
      toast({
        title: "Sucesso",
        description: "Job aprovado com sucesso!",
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao aprovar job:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar job. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  }, [updateJob, incrementJobUsage, toast]);

  return {
    createJob,
    approveJob
  };
};
