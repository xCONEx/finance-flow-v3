
import { useState, useEffect } from 'react';
import { useAgency } from '@/contexts/AgencyContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface KanbanContextData {
  isAgencyMode: boolean;
  currentAgencyId: string | null;
  currentUserId: string | null;
  contextLabel: string;
}

export const useKanbanContext = (): KanbanContextData => {
  const { currentContext } = useAgency();
  const { user } = useSupabaseAuth();
  const [contextData, setContextData] = useState<KanbanContextData>({
    isAgencyMode: false,
    currentAgencyId: null,
    currentUserId: null,
    contextLabel: 'Individual'
  });

  useEffect(() => {
    if (currentContext === 'individual') {
      setContextData({
        isAgencyMode: false,
        currentAgencyId: null,
        currentUserId: user?.id || null,
        contextLabel: 'Individual'
      });
    } else if (currentContext !== 'individual') {
      setContextData({
        isAgencyMode: true,
        currentAgencyId: currentContext.id,
        currentUserId: user?.id || null,
        contextLabel: currentContext.name
      });
    }
  }, [currentContext, user]);

  return contextData;
};
