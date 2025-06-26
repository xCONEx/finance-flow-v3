
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
    console.log('🔄 [CONTEXT] useKanbanContext - Recalculando contexto...', {
      currentContext: currentContext === 'individual' ? 'individual' : (currentContext && typeof currentContext === 'object' ? `agency:${currentContext.id}` : 'undefined'),
      profile: profile ? {
        user_type: profile.user_type,
        agency_id: profile.agency_id,
        role: profile.role
      } : null,
      user: user ? { id: user.id } : null
    });

    if (!user) {
      console.log('❌ [CONTEXT] Usuário não autenticado');
      setContextData({
        isAgencyMode: false,
        currentAgencyId: null,
        currentUserId: null,
        contextLabel: 'Individual'
      });
      return;
    }

    // Se o contexto é 'individual', sempre modo individual
    if (currentContext === 'individual') {
      console.log('👤 [CONTEXT] Modo Individual ativado');
      setContextData({
        isAgencyMode: false,
        currentAgencyId: null,
        currentUserId: user.id,
        contextLabel: 'Individual'
      });
      return;
    }

    // Se currentContext é um objeto (agência selecionada) - CORREÇÃO PRINCIPAL
    if (currentContext && typeof currentContext === 'object' && currentContext.id) {
      console.log('🏢 [CONTEXT] Modo Empresa ativado:', {
        agencyId: currentContext.id,
        agencyName: currentContext.name
      });
      setContextData({
        isAgencyMode: true,
        currentAgencyId: currentContext.id,
        currentUserId: user.id,
        contextLabel: currentContext.name
      });
      return;
    }

    // Fallback: modo individual se não conseguir determinar contexto
    console.log('⚠️ [CONTEXT] Fallback para modo individual - contexto não identificado:', currentContext);
    setContextData({
      isAgencyMode: false,
      currentAgencyId: null,
      currentUserId: user.id,
      contextLabel: 'Individual'
    });
  }, [currentContext, user, profile]);

  console.log('📋 [CONTEXT] Estado final do Kanban:', {
    isAgencyMode: contextData.isAgencyMode,
    currentAgencyId: contextData.currentAgencyId,
    contextLabel: contextData.contextLabel,
    rawCurrentContext: currentContext
  });

  return contextData;
};
