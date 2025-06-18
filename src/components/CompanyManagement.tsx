import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import CompanyTable from './company/CompanyTable';
import CreateCompanyDialog from './company/CreateCompanyDialog';
import EditCompanyDialog from './company/EditCompanyDialog';
import CollaboratorsDialog from './company/CollaboratorsDialog';
import InviteCollaboratorDialog from './company/InviteCollaboratorDialog';

interface Company {
  id: string;
  name: string;
  owner_id: string; // CORRIGIDO: usar owner_id
  owner_email: string;
  owner_name?: string;
  status: string;
  created_at: string;
  collaborators_count: number;
}

interface Collaborator {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  role: string;
  added_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  user_type?: string;
}

const CompanyManagement = () => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit company dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Collaborators dialog
  const [isCollaboratorsDialogOpen, setIsCollaboratorsDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);

  // Invite collaborator dialog
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // Load companies usando owner_id conforme schema correto
  const loadCompanies = async () => {
    try {
      setLoading(true);
      console.log('🏢 Carregando empresas...');
      
      // CORREÇÃO: Usar owner_id conforme schema atualizado
      const { data: agencies, error: agenciesError } = await supabase
        .from('agencies')
        .select(`
          id,
          name,
          owner_id,
          status,
          created_at,
          updated_at
        `);

      if (agenciesError) {
        console.error('❌ Erro ao carregar empresas:', agenciesError);
        throw agenciesError;
      }

      console.log('🏢 Agências encontradas:', agencies?.length || 0);

      // Buscar dados dos owners
      const ownerIds = [...new Set(agencies?.map(a => a.owner_id) || [])];
      console.log('👥 Buscando owners:', ownerIds.length);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('id', ownerIds);

      if (profilesError) {
        console.error('❌ Erro ao carregar perfis:', profilesError);
      }

      // Buscar contagem de colaboradores
      const { data: collaborators, error: collabError } = await supabase
        .from('agency_collaborators')
        .select('agency_id, id');

      if (collabError) {
        console.error('❌ Erro ao carregar colaboradores:', collabError);
      }

      // Processar dados das empresas
      const companiesData = agencies?.map(agency => {
        const owner = profiles?.find(p => p.id === agency.owner_id);
        const collabCount = collaborators?.filter(c => c.agency_id === agency.id).length || 0;

        return {
          id: agency.id,
          name: agency.name,
          owner_id: agency.owner_id, // CORRIGIDO: usar owner_id
          owner_email: owner?.email || 'Email não encontrado',
          owner_name: owner?.name || owner?.email || 'N/A',
          status: agency.status,
          created_at: agency.created_at,
          collaborators_count: collabCount
        };
      }) || [];

      console.log('✅ Empresas processadas:', companiesData.length);
      setCompanies(companiesData);
      
    } catch (error: any) {
      console.error('❌ Erro completo ao carregar empresas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar empresas: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // Load users
  const loadUsers = async () => {
    try {
      console.log('👥 Carregando usuários...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, user_type');

      if (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        throw error;
      }
      
      console.log('✅ Usuários carregados:', data?.length || 0);
      setUsers(data || []);
      
    } catch (error: any) {
      console.error('❌ Erro ao carregar usuários:', error);
      toast({
        title: 'Aviso',
        description: 'Não foi possível carregar a lista de usuários',
        variant: 'destructive'
      });
      setUsers([]);
    }
  };

  // Load collaborators for a company
  const loadCollaborators = async (companyId: string) => {
    try {
      setLoadingCollaborators(true);
      console.log('👥 Carregando colaboradores para empresa:', companyId);

      const { data: collaboratorsData, error } = await supabase
        .from('agency_collaborators')
        .select(`
          id,
          user_id,
          role,
          added_at,
          profiles!agency_collaborators_user_id_fkey (
            email,
            name
          )
        `)
        .eq('agency_id', companyId);

      if (error) {
        console.error('❌ Erro ao carregar colaboradores:', error);
        throw error;
      }

      const formattedCollaborators = collaboratorsData?.map(collab => ({
        id: collab.id,
        user_id: collab.user_id,
        email: collab.profiles?.email || 'Email não encontrado',
        name: collab.profiles?.name || collab.profiles?.email || 'N/A',
        role: collab.role || 'member',
        added_at: collab.added_at
      })) || [];

      console.log('✅ Colaboradores carregados:', formattedCollaborators.length);
      setCollaborators(formattedCollaborators);
    } catch (error: any) {
      console.error('❌ Erro ao carregar colaboradores:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar colaboradores',
        variant: 'destructive'
      });
      setCollaborators([]);
    } finally {
      setLoadingCollaborators(false);
    }
  };

  // Create company usando owner_id
  const handleCreateCompany = async (name: string, ownerEmail: string) => {
    if (!name.trim() || !ownerEmail) {
      toast({
        title: 'Erro',
        description: 'Nome da empresa e email do proprietário são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    const owner = users.find(u => u.email === ownerEmail);
    if (!owner) {
      toast({
        title: 'Erro',
        description: 'Usuário não encontrado',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('🏗️ Criando empresa:', { 
        name: name, 
        owner: owner.id 
      });

      const { data, error } = await supabase
        .from('agencies')
        .insert({
          name: name.trim(),
          owner_id: owner.id, // CORRIGIDO: usar owner_id
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar empresa:', error);
        throw error;
      }

      console.log('✅ Empresa criada:', data);

      toast({
        title: 'Sucesso',
        description: 'Empresa criada com sucesso'
      });

      loadCompanies();
      loadUsers();
    } catch (error: any) {
      console.error('❌ Erro ao criar empresa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar empresa: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  };

  // Edit company usando owner_id
  const handleEditCompany = async (name: string, ownerEmail: string) => {
    if (!editingCompany || !name.trim() || !ownerEmail) {
      toast({
        title: 'Erro',
        description: 'Nome da empresa e email do proprietário são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    const owner = users.find(u => u.email === ownerEmail);
    if (!owner) {
      toast({
        title: 'Erro',
        description: 'Usuário não encontrado',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('✏️ Editando empresa:', editingCompany.id);

      const { error } = await supabase
        .from('agencies')
        .update({
          name: name.trim(),
          owner_id: owner.id, // CORRIGIDO: usar owner_id
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCompany.id);

      if (error) {
        console.error('❌ Erro ao atualizar empresa:', error);
        throw error;
      }

      console.log('✅ Empresa atualizada');

      toast({
        title: 'Sucesso',
        description: 'Empresa atualizada com sucesso'
      });

      setEditingCompany(null);
      loadCompanies();
      loadUsers();
    } catch (error: any) {
      console.error('❌ Erro ao atualizar empresa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar empresa: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  };

  // Delete company
  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      console.log('🗑️ Excluindo empresa:', companyId);

      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', companyId);

      if (error) {
        console.error('❌ Erro ao excluir empresa:', error);
        throw error;
      }

      console.log('✅ Empresa excluída');

      toast({
        title: 'Sucesso',
        description: 'Empresa excluída com sucesso'
      });

      loadCompanies();
      loadUsers();
    } catch (error: any) {
      console.error('❌ Erro ao excluir empresa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir empresa: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  };

  // Remove collaborator
  const handleRemoveCollaborator = async (collaboratorId: string, email: string) => {
    if (!confirm(`Tem certeza que deseja remover o colaborador ${email}?`)) {
      return;
    }

    try {
      console.log('🗑️ Removendo colaborador:', collaboratorId);

      const { error } = await supabase
        .from('agency_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) {
        console.error('❌ Erro ao remover colaborador:', error);
        throw error;
      }

      console.log('✅ Colaborador removido');

      toast({
        title: 'Sucesso',
        description: `Colaborador ${email} removido com sucesso`
      });

      loadCompanies();
      if (isCollaboratorsDialogOpen && selectedCompany) {
        loadCollaborators(selectedCompany.id);
      }
    } catch (error: any) {
      console.error('❌ Erro ao remover colaborador:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover colaborador: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  };

  // Invite collaborator
  const handleInviteCollaborator = async (email: string) => {
    if (!selectedCompany || !email.trim()) {
      toast({
        title: 'Erro',
        description: 'Email do colaborador é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('👤 Buscando usuário por email:', email);

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email.trim())
        .single();

      if (profileError || !profiles) {
        toast({
          title: 'Erro',
          description: 'Usuário não encontrado com este email',
          variant: 'destructive'
        });
        return;
      }

      const { data: existing, error: existingError } = await supabase
        .from('agency_collaborators')
        .select('id')
        .eq('agency_id', selectedCompany.id)
        .eq('user_id', profiles.id)
        .maybeSingle();

      if (existingError) {
        console.error('❌ Erro ao verificar colaborador existente:', existingError);
        toast({
          title: 'Erro',
          description: 'Erro ao verificar se usuário já é colaborador',
          variant: 'destructive'
        });
        return;
      }

      if (existing) {
        toast({
          title: 'Erro',
          description: 'Este usuário já é um colaborador',
          variant: 'destructive'
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('agency_collaborators')
        .insert({
          agency_id: selectedCompany.id,
          user_id: profiles.id,
          role: 'editor',
          added_by: user.id
        });

      if (error) {
        console.error('❌ Erro ao adicionar colaborador:', error);
        throw error;
      }

      console.log('✅ Colaborador adicionado');

      toast({
        title: 'Sucesso',
        description: `Colaborador ${email} adicionado com sucesso`
      });

      loadCompanies();
      if (isCollaboratorsDialogOpen) {
        loadCollaborators(selectedCompany.id);
      }
    } catch (error: any) {
      console.error('❌ Erro ao adicionar colaborador:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar colaborador: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (company: Company) => {
    setEditingCompany(company);
    setIsEditDialogOpen(true);
  };

  const openCollaboratorsDialog = (company: Company) => {
    setSelectedCompany(company);
    setIsCollaboratorsDialogOpen(true);
    loadCollaborators(company.id);
  };

  const openInviteDialog = (company: Company) => {
    setSelectedCompany(company);
    setIsInviteDialogOpen(true);
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (company.owner_name && company.owner_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    loadCompanies();
    loadUsers();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando empresas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2 md:p-0">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <span className="hidden sm:inline">Gestão de Empresas</span>
              <span className="sm:hidden">Empresas</span>
              <Badge variant="secondary" className="text-xs">
                {companies.length}
              </Badge>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadCompanies();
                loadUsers();
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="Buscar empresas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <CreateCompanyDialog
              users={users}
              onCreateCompany={handleCreateCompany}
            />
          </div>

          <CompanyTable
            companies={filteredCompanies}
            onEditCompany={openEditDialog}
            onDeleteCompany={handleDeleteCompany}
            onViewCollaborators={openCollaboratorsDialog}
            onInviteCollaborator={openInviteDialog}
          />

          {filteredCompanies.length === 0 && !loading && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {companies.length === 0 ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa corresponde à busca'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <EditCompanyDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        company={editingCompany}
        users={users}
        onEditCompany={handleEditCompany}
      />

      <CollaboratorsDialog
        isOpen={isCollaboratorsDialogOpen}
        onOpenChange={setIsCollaboratorsDialogOpen}
        company={selectedCompany}
        collaborators={collaborators}
        loadingCollaborators={loadingCollaborators}
        onRemoveCollaborator={handleRemoveCollaborator}
        onInviteCollaborator={openInviteDialog}
      />

      <InviteCollaboratorDialog
        isOpen={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        company={selectedCompany}
        onInviteCollaborator={handleInviteCollaborator}
      />
    </div>
  );
};

export default CompanyManagement;
