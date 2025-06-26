
import { useCallback } from 'react';
import { useUsageTracking } from './useUsageTracking';
import { useSubscriptionPermissions } from './useSubscriptionPermissions';
import { useToast } from '@/hooks/use-toast';

export const useProjectOperations = () => {
  const { incrementProjectUsage } = useUsageTracking();
  const { canCreateProject } = useSubscriptionPermissions();
  const { toast } = useToast();

  const createProject = useCallback(async (projectData: any, addProjectFunction: Function) => {
    if (!canCreateProject) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de projetos do seu plano.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Adicionar projeto
      addProjectFunction(projectData);
      
      // Incrementar uso
      await incrementProjectUsage();
      
      return true;
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar projeto. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  }, [canCreateProject, incrementProjectUsage, toast]);

  return {
    createProject
  };
};
