
import { useMemo } from 'react';
import { useSubscription } from './useSubscription';
import { useApp } from '@/contexts/AppContext';

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
  const { jobs, monthlyCosts } = useApp();

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

  const currentUsage = useMemo(() => {
    const approvedJobs = jobs.filter(job => job.status === 'aprovado');
    return {
      jobsCount: approvedJobs.length,
      projectsCount: jobs.length,
      teamMembersCount: 1, // Por enquanto sempre 1, pode ser expandido
    };
  }, [jobs]);

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

  return {
    subscription,
    loading,
    limits,
    currentUsage,
    canCreateJob,
    canCreateProject,
    getRemainingJobs,
    getRemainingProjects,
    getUsagePercentage,
    isFreePlan: subscription === 'free',
    isBasicPlan: subscription === 'basic',
    isPremiumPlan: subscription === 'premium',
    isEnterprisePlan: subscription === 'enterprise' || subscription === 'enterprise-annual',
  };
};
