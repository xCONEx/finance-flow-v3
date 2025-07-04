import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export const useAdminRoles = () => {
  const { user } = useSupabaseAuth();
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('admin_roles')
        .select('role_type')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        setRoles([]);
      } else {
        setRoles(data?.map((r: any) => r.role_type) || []);
      }
      setLoading(false);
    };
    fetchRoles();
  }, [user]);

  return {
    roles,
    loading,
    isSuperAdmin: roles.includes('super_admin'),
    isAdmin: roles.includes('admin') || roles.includes('super_admin'),
    isModerator: roles.includes('moderator'),
  };
}; 