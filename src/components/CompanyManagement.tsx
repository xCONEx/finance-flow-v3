
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Plus, Edit, Trash2, UserPlus, Loader2 } from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import CompanyTable from './company/CompanyTable';
import CreateCompanyDialog from './company/CreateCompanyDialog';
import EditCompanyDialog from './company/EditCompanyDialog';
import InviteCollaboratorDialog from './company/InviteCollaboratorDialog';
import CollaboratorsDialog from './company/CollaboratorsDialog';

interface Company {
  id: string;
  name: string;
  owner_uid: string; // CORRIGIDO: usar owner_uid
  owner_email: string;
  owner_name?: string;
  status: string;
  created_at: string;
  collaborators_count: number;
}

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  user_type?: string;
}

interface Collaborator {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  role: string;
  added_at: string;
}

const CompanyManagement = () => {
  const { user, profile } = useSupabaseAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCollaboratorsDialog, setShowCollaboratorsDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const isAdmin = profile?.user_type === 'admin';

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      
      // Usar a função RPC que já existe
      const { data: companiesData, error: companiesError } = await supabase
        .rpc('get_all_companies_admin');

      if (companiesError) {
        console.error('Erro ao buscar empresas:', companiesError);
        toast({
          title: "Erro",
          description: "Erro ao carregar empresas.",
          variant: "destructive"
        });
        return;
      }

      console.log('Empresas carregadas:', companiesData);

      // Buscar informações dos proprietários
      if (companiesData && companiesData.length > 0) {
        const ownerIds = [...new Set(companiesData.map((c: any) => c.owner_uid).filter(Boolean))]; // CORRIGIDO: usar owner_uid

        if (ownerIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, name')
            .in('id', ownerIds);

          if (!profilesError && profilesData) {
            const profilesMap = profilesData.reduce((acc: any, profile: any) => {
              acc[profile.id] = profile;
              return acc;
            }, {});

            const enrichedCompanies = companiesData.map((company: any) => ({
              id: company.id,
              name: company.name,
              owner_uid: company.owner_uid, // CORRIGIDO: usar owner_uid
              owner_email: profilesMap[company.owner_uid]?.email || 'Email não encontrado', // CORRIGIDO: usar owner_uid
              owner_name: profilesMap[company.owner_uid]?.name || 'N/A', // CORRIGIDO: usar owner_uid
              status: company.status,
              created_at: company.created_at,
              collaborators_count: company.collaborators_count || 0
            }));

            setCompanies(enrichedCompanies);
          }
        }
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, user_type')
        .order('email');

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const fetchCollaborators = async (companyId: string) => {
    try {
      setLoadingCollaborators(true);
      
      const { data, error } = await supabase
        .rpc('get_company_collaborators_admin', { company_id: companyId });

      if (error) {
        console.error('Erro ao buscar colaboradores:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar colaboradores.",
          variant: "destructive"
        });
        return;
      }

      setCollaborators(data || []);
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
    } finally {
      setLoadingCollaborators(false);
    }
  };

  const handleCreateCompany = async (name: string, ownerEmail: string) => {
    try {
      const selectedUser = users.find(u => u.email === ownerEmail);
      if (!selectedUser) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado.",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('agencies')
        .insert({
          name,
          owner_uid: selectedUser.id, // CORRIGIDO: usar owner_uid
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar empresa:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar empresa.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Empresa criada com sucesso.",
      });

      fetchCompanies();
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar empresa.",
        variant: "destructive"
      });
    }
  };

  const handleEditCompany = async (name: string, ownerEmail: string) => {
    if (!selectedCompany) return;

    try {
      const selectedUser = users.find(u => u.email === ownerEmail);
      if (!selectedUser) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('agencies')
        .update({
          name,
          owner_uid: selectedUser.id // CORRIGIDO: usar owner_uid
        })
        .eq('id', selectedCompany.id);

      if (error) {
        console.error('Erro ao editar empresa:', error);
        toast({
          title: "Erro",
          description: "Erro ao editar empresa.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Empresa editada com sucesso.",
      });

      fetchCompanies();
    } catch (error) {
      console.error('Erro ao editar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao editar empresa.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', companyId);

      if (error) {
        console.error('Erro ao excluir empresa:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir empresa.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Empresa excluída com sucesso.",
      });

      fetchCompanies();
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir empresa.",
        variant: "destructive"
      });
    }
  };

  const handleInviteCollaborator = async (email: string) => {
    if (!selectedCompany) return;

    try {
      const { data, error } = await supabase
        .rpc('invite_collaborator_admin', {
          company_id: selectedCompany.id,
          collaborator_email: email
        });

      if (error) {
        console.error('Erro ao convidar colaborador:', error);
        toast({
          title: "Erro",
          description: "Erro ao convidar colaborador.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Colaborador convidado com sucesso.",
      });

      fetchCompanies();
      if (showCollaboratorsDialog) {
        fetchCollaborators(selectedCompany.id);
      }
    } catch (error) {
      console.error('Erro ao convidar colaborador:', error);
      toast({
        title: "Erro",
        description: "Erro ao convidar colaborador.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string, email: string) => {
    if (!confirm(`Tem certeza que deseja remover ${email} da empresa?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .rpc('remove_collaborator_admin', {
          collaborator_id: collaboratorId
        });

      if (error) {
        console.error('Erro ao remover colaborador:', error);
        toast({
          title: "Erro",
          description: "Erro ao remover colaborador.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Colaborador removido com sucesso.",
      });

      fetchCompanies();
      if (showCollaboratorsDialog && selectedCompany) {
        fetchCollaborators(selectedCompany.id);
      }
    } catch (error) {
      console.error('Erro ao remover colaborador:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover colaborador.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchCompanies();
      fetchUsers();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Acesso Restrito
              </h3>
              <p className="text-gray-500">
                Apenas administradores podem gerenciar empresas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="text-blue-600" />
            Gerenciamento de Empresas
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie empresas e colaboradores do sistema
          </p>
        </div>
        
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Carregando empresas...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <CompanyTable
          companies={companies}
          onEdit={(company) => {
            setSelectedCompany(company);
            setShowEditDialog(true);
          }}
          onDelete={handleDeleteCompany}
          onInviteCollaborator={(company) => {
            setSelectedCompany(company);
            setShowInviteDialog(true);
          }}
          onViewCollaborators={(company) => {
            setSelectedCompany(company);
            fetchCollaborators(company.id);
            setShowCollaboratorsDialog(true);
          }}
        />
      )}

      {/* Dialogs */}
      <CreateCompanyDialog
        isOpen={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        users={users}
        onCreateCompany={handleCreateCompany}
      />

      <EditCompanyDialog
        isOpen={showEditDialog}
        onOpenChange={setShowEditDialog}
        company={selectedCompany}
        users={users}
        onEditCompany={handleEditCompany}
      />

      <InviteCollaboratorDialog
        isOpen={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        company={selectedCompany}
        onInviteCollaborator={handleInviteCollaborator}
      />

      <CollaboratorsDialog
        isOpen={showCollaboratorsDialog}
        onOpenChange={setShowCollaboratorsDialog}
        company={selectedCompany}
        collaborators={collaborators}
        loadingCollaborators={loadingCollaborators}
        onRemoveCollaborator={handleRemoveCollaborator}
        onInviteCollaborator={(company) => {
          setSelectedCompany(company);
          setShowInviteDialog(true);
        }}
      />
    </div>
  );
};

export default CompanyManagement;
