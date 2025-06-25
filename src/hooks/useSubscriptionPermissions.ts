
import { useMemo, useState, useEffect } from 'react';
import { useSubscription } from './useSubscription';
import { useApp } from '@/contexts/AppContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { usageTrackingService } from '@/services/usageTrackingService';

export interface SubscriptionLimits {
  maxJobs: number;
  maxTeamMembers: number;
  maxProjects: number;
  maxStorage: number; // in MB
  canUseAdvancedReports: boolean;
  canUseCollaboration: boolean;
  canUseAPI: boolean;
  canUseCustomizations: boolean;
  canUseBackup: boolean;
  canUsePrioritySupport: boolean;
  canUse247Support: boolean;
  canUseTraining: boolean;
  canUseConsulting: boolean;
}

export const useSubscriptionPermissions = () => {
  const { subscription, loading } = useSubscription();
  const { jobs } = useApp();
  const { user } = useSupabaseAuth();
  const [currentUsage, setCurrentUsage] = useState({ jobsCount: 0, projectsCount: 0, teamMembersCount: 1 });
  const [usageLoading, setUsageLoading] = useState(true);

  const limits = useMemo<SubscriptionLimits>(() => {
    switch (subscription) {
      case 'basic':
        return {
          maxJobs: -1, // ilimitado
          maxTeamMembers: 1,
          maxProjects: -1,
          maxStorage: 5000, // 5GB
          canUseAdvancedReports: true,
          canUseCollaboration: false,
          canUseAPI: false,
          canUseCustomizations: false,
          canUseBackup: false,
          canUsePrioritySupport: true,
          canUse247Support: false,
          canUseTraining: false,
          canUseConsulting: false,
        };
      case 'premium':
        return {
          maxJobs: -1,
          maxTeamMembers: 10,
          maxProjects: -1,
          maxStorage: 50000, // 50GB
          canUseAdvancedReports: true,
          canUseCollaboration: true,
          canUseAPI: false,
          canUseCustomizations: true,
          canUseBackup: true,
          canUsePrioritySupport: true,
          canUse247Support: false,
          canUseTraining: false,
          canUseConsulting: false,
        };
      case 'enterprise':
      case 'enterprise-annual':
        return {
          maxJobs: -1,
          maxTeamMembers: -1, // ilimitado
          maxProjects: -1,
          maxStorage: -1, // ilimitado
          canUseAdvancedReports: true,
          canUseCollaboration: true,
          canUseAPI: true,
          canUseCustomizations: true,
          canUseBackup: true,
          canUsePrioritySupport: true,
          canUse247Support: true,
          canUseTraining: subscription === 'enterprise-annual',
          canUseConsulting: subscription === 'enterprise-annual',
        };
      default: // free
        return {
          maxJobs: 5,
          maxTeamMembers: 1,
          maxProjects: 3,
          maxStorage: 100, // 100MB
          canUseAdvancedReports: false,
          canUseCollaboration: false,
          canUseAPI: false,
          canUseCustomizations: false,
          canUseBackup: false,
          canUsePrioritySupport: false,
          canUse247Support: false,
          canUseTraining: false,
          canUseConsulting: false,
        };
    }
  }, [subscription]);

  // Buscar uso do banco de dados
  useEffect(() => {
    const loadUsage = async () => {
      if (!user?.id) {
        setUsageLoading(false);
        return;
      }

      try {
        const usage = await usageTrackingService.getAllUsageForUser(user.id);
        setCurrentUsage({
          jobsCount: usage.jobs,
          projectsCount: usage.projects,
          teamMembersCount: 1, // Por enquanto sempre 1
        });
        
        console.log('📊 Uso carregado do banco:', usage);
      } catch (error) {
        console.warn('Erro ao carregar uso do banco:', error);
        // Fallback para contagem local como backup
        const approvedJobs = jobs.filter(job => job.status === 'aprovado');
        setCurrentUsage({
          jobsCount: approvedJobs.length,
          projectsCount: jobs.length,
          teamMembersCount: 1,
        });
      } finally {
        setUsageLoading(false);
      }
    };

    loadUsage();
  }, [user?.id, jobs]);

  const canCreateJob = useMemo(() => {
    if (limits.maxJobs === -1) return true;
    return currentUsage.jobsCount < limits.maxJobs;
  }, [limits.maxJobs, currentUsage.jobsCount]);

  const canCreateProject = useMemo(() => {
    if (limits.maxProjects === -1) return true;
    return currentUsage.projectsCount < limits.maxProjects;
  }, [limits.maxProjects, currentUsage.projectsCount]);

  const getRemainingJobs = () => {
    if (limits.maxJobs === -1) return -1;
    return Math.max(0, limits.maxJobs - currentUsage.jobsCount);
  };

  const getRemainingProjects = () => {
    if (limits.maxProjects === -1) return -1;
    return Math.max(0, limits.maxProjects - currentUsage.projectsCount);
  };

  const getUsagePercentage = (current: number, max: number) => {
    if (max === -1) return 0;
    return Math.min(100, (current / max) * 100);
  };

  // Função para recarregar os dados de uso
  const refreshUsage = async () => {
    if (!user?.id) return;
    
    try {
      const usage = await usageTrackingService.getAllUsageForUser(user.id);
      setCurrentUsage({
        jobsCount: usage.jobs,
        projectsCount: usage.projects,
        teamMembersCount: 1,
      });
    } catch (error) {
      console.warn('Erro ao recarregar uso:', error);
    }
  };

  return {
    subscription,
    loading: loading || usageLoading,
    limits,
    currentUsage,
    canCreateJob,
    canCreateProject,
    getRemainingJobs,
    getRemainingProjects,
    getUsagePercentage,
    refreshUsage,
    isFreePlan: subscription === 'free',
    isBasicPlan: subscription === 'basic',
    isPremiumPlan: subscription === 'premium',
    isEnterprisePlan: subscription === 'enterprise' || subscription === 'enterprise-annual',
  };
};
