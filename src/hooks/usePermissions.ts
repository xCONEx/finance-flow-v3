
import { useMemo } from 'react';

export type UserRole = 'admin' | 'owner' | 'editor' | 'viewer';

export const usePermissions = (userRole: UserRole) => {
  const permissions = useMemo(() => {
    const canManageTeam = userRole === 'admin' || userRole === 'owner';
    const canEditProjects = userRole === 'admin' || userRole === 'owner' || userRole === 'editor';
    const canViewProjects = true; // Todos podem visualizar
    const canCreateAgency = userRole === 'admin';
    const canDeleteAgency = userRole === 'admin' || userRole === 'owner';
    const canUploadFiles = userRole === 'admin' || userRole === 'owner' || userRole === 'editor';
    const canShareWithClients = userRole === 'admin' || userRole === 'owner' || userRole === 'editor';
    
    return {
      canManageTeam,
      canEditProjects,
      canViewProjects,
      canCreateAgency,
      canDeleteAgency,
      canUploadFiles,
      canShareWithClients,
      isAdmin: userRole === 'admin',
      isOwner: userRole === 'owner',
      isEditor: userRole === 'editor',
      isViewer: userRole === 'viewer'
    };
  }, [userRole]);

  return permissions;
};
