
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

interface AgencyContextType {
  // Estados
  agencies: Agency[];
  currentContext: 'individual' | Agency;
  loading: boolean;
  
  // Ações
  setCurrentContext: (context: 'individual' | Agency) => void;
  createAgency: (name: string, description?: string) => Promise<boolean>;
  inviteCollaborator: (agencyId: string, email: string) => Promise<boolean>;
  acceptInvitation: (invitationId: string) => Promise<boolean>;
  loadUserAgencies: () => Promise<void>;
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
  
  const { user, isAuthenticated } = useSupabaseAuth();
  const { toast } = useToast();

  // Carregar agências do usuário
  const loadUserAgencies = async () => {
    if (!user || !isAuthenticated) return;
    
    try {
      setLoading(true);
      // Usar any temporariamente até que os tipos RPC sejam gerados
      const { data, error } = await (supabase as any).rpc('get_user_agencies');
      
      if (error) {
        console.error('❌ Erro ao carregar agências:', error);
        return;
      }
      
      // Verificar se data não é null e é um array
      const agenciesData = data && Array.isArray(data) ? data : [];
      setAgencies(agenciesData);
      console.log('🏢 Agências carregadas:', agenciesData.length);
    } catch (error) {
      console.error('❌ Erro ao carregar agências:', error);
    } finally {
      setLoading(false);
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
      
      // Recarregar agências
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
      
      // Recarregar agências
      await loadUserAgencies();
      
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

  // Carregar agências quando usuario logar
  useEffect(() => {
    if (user && isAuthenticated) {
      loadUserAgencies();
    } else {
      setAgencies([]);
      setCurrentContext('individual');
    }
  }, [user, isAuthenticated]);

  const value = {
    agencies,
    currentContext,
    loading,
    setCurrentContext,
    createAgency,
    inviteCollaborator,
    acceptInvitation,
    loadUserAgencies
  };

  return (
    <AgencyContext.Provider value={value}>
      {children}
    </AgencyContext.Provider>
  );
};

export default AgencyProvider;
