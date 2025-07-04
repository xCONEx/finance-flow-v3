import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Plus, Loader2 } from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAdminRoles } from '@/hooks/useAdminRoles';

// Componentes
import CompanyTable from './company/CompanyTable';
import CreateCompanyDialog from './company/CreateCompanyDialog';
import EditCompanyDialog from './company/EditCompanyDialog';
import InviteCollaboratorDialog from './company/InviteCollaboratorDialog';
import CollaboratorsDialog from './company/CollaboratorsDialog';

// Tipagens
interface Company {
  id: string;
  name: string;
  owner_id: string;
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
  const { isAdmin, loading: loadingRoles } = useAdminRoles();

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

  // 🔍 Fetch Companies
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any).rpc('get_all_companies_admin');
      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar empresas",
        description: error.message || "Erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Fetch Users
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, user_type')
        .order('email');
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error(error);
    }
  };

  // 🔍 Fetch Collaborators
  const fetchCollaborators = async (companyId: string) => {
    try {
      setLoadingCollaborators(true);
      const { data, error } = await (supabase as any)
        .rpc('get_company_collaborators_admin', { company_id: companyId });
      if (error) throw error;
      setCollaborators(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar colaboradores",
        description: error.message || "Erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setLoadingCollaborators(false);
    }
  };

  // ➕ Create Company
  const handleCreateCompany = async (name: string, ownerEmail: string, cnpj: string, description: string) => {
    try {
      // Buscar usuário dono pelo email
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', ownerEmail)
        .single();

      if (userError || !user) throw new Error('Usuário proprietário não encontrado');

      // Criar empresa
      const { error: agencyError } = await supabase
        .from('agencies')
        .insert({
          name,
          owner_id: user.id,
          status: 'active',
          cnpj,
          description,
        });

      if (agencyError) throw agencyError;

      // Atualizar perfil do dono
      await supabase
        .from('profiles')
        .update({
          user_type: 'company_owner',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      toast({
        title: "Sucesso",
        description: "Empresa criada com sucesso.",
      });
      
      fetchCompanies();
    } catch (error: any) {
      toast({
        title: "Erro ao criar empresa",
        description: error.message || "Erro inesperado.",
        variant: "destructive"
      });
    }
  };

  // ✏️ Edit Company
  const handleEditCompany = async (
    id: string,
    name: string,
    ownerEmail: string,
    cnpj: string,
    description: string
  ) => {
    const owner = users.find(u => u.email === ownerEmail);
    if (!owner) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado.",
        variant: "destructive"
      });
      return;
    }
    try {
      const { error } = await supabase
        .from('agencies')
        .update({
          name,
          owner_id: owner.id,
          cnpj,
          description
        })
        .eq('id', id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso.",
      });
      await fetchCompanies();
      // Atualiza selectedCompany se o modal ainda estiver aberto
      setSelectedCompany(prev => {
        if (prev && prev.id === id) {
          const updated = companies.find(c => c.id === id);
          return updated ? { ...updated } : prev;
        }
        return prev;
      });
    } catch (error: any) {
      toast({
        title: "Erro ao editar empresa",
        description: error.message || "Erro inesperado.",
        variant: "destructive"
      });
    }
  };

  // 🗑️ Delete Company
  const handleDeleteCompany = async (companyId: string) => {
    const confirmDelete = confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.');
    if (!confirmDelete) return;
    
    try {
      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', companyId);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Empresa excluída com sucesso.",
      });
      fetchCompanies();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir empresa",
        description: error.message || "Erro inesperado.",
        variant: "destructive"
      });
    }
  };

  // 👥 Invite Collaborator
  const handleInviteCollaborator = async (email: string) => {
    if (!selectedCompany) return;
    try {
      const { error } = await (supabase as any)
        .rpc('invite_collaborator_admin', {
          company_id: selectedCompany.id,
          collaborator_email: email
        });
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Colaborador convidado com sucesso.",
      });
      fetchCompanies();
      if (showCollaboratorsDialog) fetchCollaborators(selectedCompany.id);
    } catch (error: any) {
      toast({
        title: "Erro ao convidar colaborador",
        description: error.message || "Erro inesperado.",
        variant: "destructive"
      });
    }
  };

  // 🗑️ Remove Collaborator
  const handleRemoveCollaborator = async (collaboratorId: string, email: string) => {
    const confirmRemove = confirm(`Tem certeza que deseja remover ${email} da empresa?`);
    if (!confirmRemove) return;
    try {
      const { error } = await (supabase as any)
        .rpc('remove_collaborator_admin', { collaborator_id: collaboratorId });
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Colaborador removido com sucesso.",
      });
      fetchCompanies();
      if (showCollaboratorsDialog && selectedCompany) {
        fetchCollaborators(selectedCompany.id);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao remover colaborador",
        description: error.message || "Erro inesperado.",
        variant: "destructive"
      });
    }
  };

  // 🚀 Load initial data
  useEffect(() => {
    if (isAdmin) {
      fetchCompanies();
      fetchUsers();
    }
  }, [isAdmin]);

  // Exibir loading enquanto verifica roles
  if (loadingRoles) {
    return <div>Carregando permissões...</div>;
  }

  // 🔒 Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              Acesso Restrito
            </h3>
            <p className="text-muted-foreground">
              Apenas administradores podem gerenciar empresas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Render
  return (
    <div className="space-y-6">
      {/* Header - Mobile First */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-foreground">
            <Building2 className="text-blue-600 h-6 w-6 sm:h-8 sm:w-8" />
            Gerenciamento de Empresas
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Gerencie empresas e colaboradores do sistema
          </p>
        </div>

        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-muted-foreground">Carregando empresas...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumo - Mobile First Grid */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {companies.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Empresas Cadastradas</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {companies.reduce((sum, c) => sum + (c.collaborators_count || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total de Colaboradores</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {companies.filter(c => c.status === 'active').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Empresas Ativas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <CompanyTable
            companies={companies}
            onEditCompany={(company) => {
              setSelectedCompany(company);
              setShowEditDialog(true);
            }}
            onDeleteCompany={handleDeleteCompany}
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
        </>
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
