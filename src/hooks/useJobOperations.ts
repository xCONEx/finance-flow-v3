import { useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export const useJobOperations = () => {
  const { addJob, updateJob } = useApp();
  const { toast } = useToast();

  const createJob = useCallback(async (jobData: any) => {
    console.log('🔄 Criando job:', jobData);

    try {
      await addJob(jobData);
      toast({
        title: "Job Criado",
        description: "O job foi criado com sucesso.",
      });
      console.log('✅ Job criado com sucesso');
      return true;
    } catch (error: any) {
      if (error.message && error.message.includes('Limite de jobs do plano atingido')) {
        toast({
          title: "Limite atingido",
          description: "Você atingiu o limite de jobs do seu plano.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao criar job. Tente novamente.",
          variant: "destructive",
        });
      }
      console.error('❌ Erro ao criar job:', error);
      return false;
    }
  }, [addJob, toast]);

  const approveJob = useCallback(async (jobId: string) => {
    console.log('🔄 Aprovando job:', jobId);

    try {
      await updateJob(jobId, { status: 'aprovado' });
      toast({
        title: "Sucesso",
        description: "Job aprovado com sucesso!",
      });
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao aprovar job. Tente novamente.",
        variant: "destructive",
      });
      console.error('❌ Erro ao aprovar job:', error);
      return false;
    }
  }, [updateJob, toast]);

  return {
    createJob,
    approveJob
  };
};
