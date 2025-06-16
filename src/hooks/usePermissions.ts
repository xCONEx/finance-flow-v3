
import { useMemo } from 'react';
import { useSubscriptionPermissions } from './useSubscriptionPermissions';

export type UserRole = 'admin' | 'owner' | 'editor' | 'viewer';

export const usePermissions = (userRole: UserRole) => {
  const { limits, isEnterprisePlan, isPremiumPlan, isBasicPlan } = useSubscriptionPermissions();
  
  const permissions = useMemo(() => {
    const canManageTeam = (userRole === 'admin' || userRole === 'owner') && (isPremiumPlan || isEnterprisePlan);
    const canEditProjects = userRole === 'admin' || userRole === 'owner' || userRole === 'editor';
    const canViewProjects = true; // Todos podem visualizar
    const canCreateAgency = userRole === 'admin' && isEnterprisePlan;
    const canDeleteAgency = (userRole === 'admin' || userRole === 'owner') && isEnterprisePlan;
    const canUploadFiles = userRole === 'admin' || userRole === 'owner' || userRole === 'editor';
    const canShareWithClients = userRole === 'admin' || userRole === 'owner' || userRole === 'editor';
    const canUseAdvancedFeatures = limits.canUseAdvancedReports;
    const canUseCollaborationFeatures = limits.canUseCollaboration && (userRole === 'admin' || userRole === 'owner' || userRole === 'editor');
    const canAccessAPI = limits.canUseAPI && (userRole === 'admin' || userRole === 'owner');
    const canUseCustomizations = limits.canUseCustomizations;
    const canUseBackupFeatures = limits.canUseBackup;
    const maxTeamSize = limits.maxTeamMembers;
    
    return {
      canManageTeam,
      canEditProjects,
      canViewProjects,
      canCreateAgency,
      canDeleteAgency,
      canUploadFiles,
      canShareWithClients,
      canUseAdvancedFeatures,
      canUseCollaborationFeatures,
      canAccessAPI,
      canUseCustomizations,
      canUseBackupFeatures,
      maxTeamSize,
      isAdmin: userRole === 'admin',
      isOwner: userRole === 'owner',
      isEditor: userRole === 'editor',
      isViewer: userRole === 'viewer'
    };
  }, [userRole, limits, isEnterprisePlan, isPremiumPlan, isBasicPlan]);

  return permissions;
};
