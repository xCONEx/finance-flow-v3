
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
  const { user, profile } = useSupabaseAuth();
  const [contextData, setContextData] = useState<KanbanContextData>({
    isAgencyMode: false,
    currentAgencyId: null,
    currentUserId: null,
    contextLabel: 'Individual'
  });

  useEffect(() => {
    console.log('🔄 useKanbanContext - Recalculando contexto...', {
      currentContext,
      profile: profile ? {
        user_type: profile.user_type,
        agency_id: profile.agency_id,
        role: profile.role
      } : null,
      user: user ? { id: user.id } : null
    });

    if (!user) {
      console.log('❌ Usuário não autenticado');
      setContextData({
        isAgencyMode: false,
        currentAgencyId: null,
        currentUserId: null,
        contextLabel: 'Individual'
      });
      return;
    }

    // Verificar se o usuário tem uma agência associada
    const hasAgency = profile?.agency_id && (profile.user_type === 'company_owner' || profile.user_type === 'employee');
    
    if (currentContext === 'individual' || !hasAgency) {
      console.log('👤 Modo Individual ativado');
      setContextData({
        isAgencyMode: false,
        currentAgencyId: null,
        currentUserId: user.id,
        contextLabel: 'Individual'
      });
    } else if (currentContext !== 'individual' && typeof currentContext === 'object') {
      console.log('🏢 Modo Empresa ativado:', currentContext);
      setContextData({
        isAgencyMode: true,
        currentAgencyId: currentContext.id,
        currentUserId: user.id,
        contextLabel: currentContext.name
      });
    } else {
      // Fallback para modo individual
      console.log('⚠️ Fallback para modo individual');
      setContextData({
        isAgencyMode: false,
        currentAgencyId: null,
        currentUserId: user.id,
        contextLabel: 'Individual'
      });
    }
  }, [currentContext, user, profile]);

  console.log('📋 useKanbanContext - Estado atual:', contextData);

  return contextData;
};
