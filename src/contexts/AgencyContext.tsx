
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

interface Agency {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  user_role: string;
  is_owner: boolean;
}

interface PendingInvitation {
  id: string;
  agency_id: string;
  agency_name: string;
  agency_description?: string;
  invited_by_name: string;
  role: string;
  invited_at: string;
  expires_at: string;
}

interface AgencyContextType {
  // Estados
  agencies: Agency[];
  currentContext: 'individual' | Agency;
  loading: boolean;
  pendingInvitations: PendingInvitation[];
  
  // Ações
  setCurrentContext: (context: 'individual' | Agency) => void;
  createAgency: (name: string, description?: string) => Promise<boolean>;
  inviteCollaborator: (agencyId: string, email: string) => Promise<boolean>;
  acceptInvitation: (invitationId: string) => Promise<boolean>;
  rejectInvitation: (invitationId: string) => Promise<boolean>;
  loadUserAgencies: () => Promise<void>;
  loadPendingInvitations: () => Promise<void>;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export const useAgency = () => {
  const context = useContext(AgencyContext);
  if (!context) {
    throw new Error('useAgency must be used within an AgencyProvider');
  }
  return context;
};

export const AgencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [currentContext, setCurrentContext] = useState<'individual' | Agency>('individual');
  const [loading, setLoading] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  
  const { user, isAuthenticated } = useSupabaseAuth();
  const { toast } = useToast();

  // Carregar agências do usuário
  const loadUserAgencies = async () => {
    if (!user || !isAuthenticated) return;
    
    try {
      setLoading(true);
      const { data, error } = await (supabase as any).rpc('get_user_agencies');
      
      if (error) {
        console.error('❌ Erro ao carregar agências:', error);
        return;
      }
      
      const agenciesData = data && Array.isArray(data) ? data : [];
      setAgencies(agenciesData);
      console.log('🏢 Agências carregadas:', agenciesData.length);
    } catch (error) {
      console.error('❌ Erro ao carregar agências:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar convites pendentes - Só busca se o usuário tem email
  const loadPendingInvitations = async () => {
    if (!user || !isAuthenticated || !user.email) {
      console.log('📧 Não buscando convites: usuário sem email ou não autenticado');
      setPendingInvitations([]);
      return;
    }
    
    try {
      console.log('📧 Buscando convites para:', user.email);
      const { data, error } = await (supabase as any).rpc('get_pending_invitations');
      
      if (error) {
        console.error('❌ Erro ao carregar convites:', error);
        setPendingInvitations([]);
        return;
      }
      
      const invitationsData = data && Array.isArray(data) ? data : [];
      setPendingInvitations(invitationsData);
      console.log('📧 Convites pendentes encontrados:', invitationsData.length);
    } catch (error) {
      console.error('❌ Erro ao carregar convites:', error);
      setPendingInvitations([]);
    }
  };

  // Criar nova agência
  const createAgency = async (name: string, description?: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await (supabase as any).rpc('create_agency', {
        agency_name: name,
        agency_description: description || null
      });
      
      if (error) {
        console.error('❌ Erro ao criar agência:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar agência",
          variant: "destructive"
        });
        return false;
      }
      
      await loadUserAgencies();
      
      toast({
        title: "Agência Criada",
        description: `Agência "${name}" criada com sucesso`
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar agência:', error);
      return false;
    }
  };

  // Convidar colaborador
  const inviteCollaborator = async (agencyId: string, email: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await (supabase as any).rpc('invite_collaborator', {
        target_agency_id: agencyId,
        collaborator_email: email
      });
      
      if (error) {
        console.error('❌ Erro ao convidar colaborador:', error);
        toast({
          title: "Erro",
          description: "Erro ao enviar convite",
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Convite Enviado",
        description: `Convite enviado para ${email}`
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao convidar colaborador:', error);
      return false;
    }
  };

  // Aceitar convite
  const acceptInvitation = async (invitationId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await (supabase as any).rpc('accept_agency_invitation', {
        invitation_id: invitationId
      });
      
      if (error) {
        console.error('❌ Erro ao aceitar convite:', error);
        toast({
          title: "Erro",
          description: "Erro ao aceitar convite",
          variant: "destructive"
        });
        return false;
      }
      
      await loadUserAgencies();
      await loadPendingInvitations();
      
      toast({
        title: "Convite Aceito",
        description: "Você agora faz parte da agência!"
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao aceitar convite:', error);
      return false;
    }
  };

  // Rejeitar convite
  const rejectInvitation = async (invitationId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await (supabase as any).rpc('reject_agency_invitation', {
        invitation_id: invitationId
      });
      
      if (error) {
        console.error('❌ Erro ao rejeitar convite:', error);
        toast({
          title: "Erro",
          description: "Erro ao rejeitar convite",
          variant: "destructive"
        });
        return false;
      }
      
      await loadPendingInvitations();
      
      toast({
        title: "Convite Rejeitado",
        description: "Convite rejeitado com sucesso"
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao rejeitar convite:', error);
      return false;
    }
  };

  // Carregar dados quando usuario logar
  useEffect(() => {
    if (user && isAuthenticated) {
      loadUserAgencies();
      // Só busca convites se o usuário tem email
      if (user.email) {
        loadPendingInvitations();
      }
    } else {
      setAgencies([]);
      setPendingInvitations([]);
      setCurrentContext('individual');
    }
  }, [user, isAuthenticated]);

  const value = {
    agencies,
    currentContext,
    loading,
    pendingInvitations,
    setCurrentContext,
    createAgency,
    inviteCollaborator,
    acceptInvitation,
    rejectInvitation,
    loadUserAgencies,
    loadPendingInvitations
  };

  return (
    <AgencyContext.Provider value={value}>
      {children}
    </AgencyContext.Provider>
  );
};

export default AgencyProvider;
