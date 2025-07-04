import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type PermissionLevel = 'none' | 'user' | 'admin' | 'super_admin';
export type ResourceType = 'profile' | 'agency' | 'financial' | 'admin' | 'webhook';

interface PermissionCheck {
  resource: ResourceType;
  action: 'read' | 'write' | 'delete' | 'admin';
  resourceId?: string;
}

interface AuthMiddlewareResult {
  isAuthenticated: boolean;
  hasPermission: boolean;
  permissionLevel: PermissionLevel;
  isLoading: boolean;
  error: string | null;
  checkPermission: (check: PermissionCheck) => Promise<boolean>;
}

export const useAuthMiddleware = (requiredPermission?: PermissionCheck): AuthMiddlewareResult => {
  const { user, profile, isAuthenticated, loading } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>('none');
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar nível de permissão do usuário
  const checkUserPermissionLevel = async (): Promise<PermissionLevel> => {
    if (!user) return 'none';

    try {
      // Verificar se é super admin usando a nova função
      const { data: isSuperAdmin } = await supabase.rpc('is_super_admin');
      if (isSuperAdmin) return 'super_admin' as PermissionLevel;

      // Verificar se é admin regular
      const { data: isAdmin } = await supabase.rpc('is_admin_user');
      if (isAdmin) return 'admin';

      // Verificar se é owner de agência
      if (profile?.user_type === 'company_owner') return 'admin';

      // Usuário normal
      return 'user';
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return 'none';
    }
  };

  // Verificar permissão específica
  const checkSpecificPermission = async (check: PermissionCheck): Promise<boolean> => {
    if (!user) return false;

    const userLevel = await checkUserPermissionLevel();

    // Super admin tem acesso total
    if (userLevel === 'super_admin') return true;

    // Admin tem acesso a recursos administrativos
    if (userLevel === 'admin' && check.resource === 'admin') return true;

    // Verificações específicas por recurso
    switch (check.resource) {
      case 'profile':
        // Usuários podem ler/escrever seus próprios perfis
        return check.resourceId === user.id || check.resourceId === undefined;

      case 'agency':
        if (check.action === 'read') {
          // Verificar se é owner ou colaborador da agência
          const { data: agencyAccess } = await supabase
            .from('agency_collaborators')
            .select('role')
            .eq('agency_id', check.resourceId)
            .eq('user_id', user.id)
            .single();
          
          return !!agencyAccess;
        }
        // Write/delete apenas para owners
        if (check.action === 'write' || check.action === 'delete') {
          const { data: agency } = await supabase
            .from('agencies')
            .select('owner_id')
            .eq('id', check.resourceId)
            .single();
          
          return agency?.owner_id === user.id;
        }
        break;

      case 'financial':
        // Usuários podem acessar seus próprios dados financeiros
        return check.resourceId === user.id || check.resourceId === undefined;

      case 'webhook':
        // Apenas super admins podem acessar webhooks
        return userLevel === 'super_admin';

      default:
        return false;
    }

    return false;
  };

  // Efeito para verificar permissões iniciais
  useEffect(() => {
    const initializePermissions = async () => {
      if (loading) return;

      try {
        setIsLoading(true);
        setError(null);

        const level = await checkUserPermissionLevel();
        setPermissionLevel(level);

        if (requiredPermission) {
          const hasAccess = await checkSpecificPermission(requiredPermission);
          setHasPermission(hasAccess);

          if (!hasAccess) {
            setError('Acesso negado: permissões insuficientes');
            toast({
              title: 'Acesso Negado',
              description: 'Você não tem permissão para acessar este recurso.',
              variant: 'destructive'
            });
          }
        } else {
          setHasPermission(true);
        }
      } catch (error) {
        console.error('Erro ao inicializar permissões:', error);
        setError('Erro ao verificar permissões');
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializePermissions();
  }, [user, profile, loading, requiredPermission, toast]);

  // Função para verificar permissão dinamicamente
  const checkPermission = async (check: PermissionCheck): Promise<boolean> => {
    try {
      return await checkSpecificPermission(check);
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  };

  return {
    isAuthenticated,
    hasPermission,
    permissionLevel,
    isLoading,
    error,
    checkPermission
  };
};

// Hook para verificar se usuário pode acessar recursos de agência
export const useAgencyPermission = (agencyId?: string) => {
  return useAuthMiddleware({
    resource: 'agency',
    action: 'read',
    resourceId: agencyId
  });
};

// Hook para verificar se usuário pode gerenciar recursos de agência
export const useAgencyAdminPermission = (agencyId?: string) => {
  return useAuthMiddleware({
    resource: 'agency',
    action: 'write',
    resourceId: agencyId
  });
};

// Hook para verificar se usuário é admin
export const useAdminPermission = () => {
  return useAuthMiddleware({
    resource: 'admin',
    action: 'admin'
  });
};

// Hook para verificar se usuário é super admin
export const useSuperAdminPermission = () => {
  const { user, profile } = useSupabaseAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await supabase.rpc('is_super_admin');
        setIsSuperAdmin(data || false);
      } catch (error) {
        console.error('Erro ao verificar super admin:', error);
        setIsSuperAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSuperAdmin();
  }, [user]);

  return { isSuperAdmin, isLoading };
}; 