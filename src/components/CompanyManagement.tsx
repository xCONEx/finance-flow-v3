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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  RefreshCw,
  Mail,
  UserPlus,
  UserMinus,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  name: string;
  description?: string;
  owner_uid: string;
  owner_email: string;
  owner_name?: string;
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
  
  // Create company dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [selectedOwnerEmail, setSelectedOwnerEmail] = useState('');

  // Edit company dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editOwnerEmail, setEditOwnerEmail] = useState('');

  // Collaborators dialog
  const [isCollaboratorsDialogOpen, setIsCollaboratorsDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);

  // Invite collaborator dialog
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // Load companies usando owner_uid corretamente
  const loadCompanies = async () => {
    try {
      setLoading(true);
      console.log('🏢 Carregando empresas...');
      
      const { data: agencies, error: agenciesError } = await supabase
        .from('agencies')
        .select(`
          id,
          name,
          owner_uid,
          status,
          created_at,
          updated_at
        `);

      if (agenciesError) {
        console.error('❌ Erro ao carregar empresas:', agenciesError);
        throw agenciesError;
      }

      console.log('🏢 Agências encontradas:', agencies?.length || 0);

      // Buscar dados dos proprietários
      const ownerIds = [...new Set(agencies?.map(a => a.owner_uid) || [])];
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

      // Combinar dados
      const companiesData = agencies?.map(agency => {
        const owner = profiles?.find(p => p.id === agency.owner_uid);
        const collabCount = collaborators?.filter(c => c.agency_id === agency.id).length || 0;

        return {
          id: agency.id,
          name: agency.name,
          description: '', // Campo vazio já que não existe
          owner_uid: agency.owner_uid,
          owner_email: owner?.email || 'Email não encontrado',
          owner_name: owner?.name || owner?.email || 'N/A',
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
    } finally {
      setLoading(false);
    }
  };

  // Load collaborators for a company - FIX the join syntax
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

  // Remove collaborator
  const handleRemoveCollaborator = async (collaboratorId: string, email: string) => {
    if (!confirm(`Tem certeza que deseja remover ${email} da empresa?`)) {
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

      // Recarregar colaboradores
      if (selectedCompany) {
        loadCollaborators(selectedCompany.id);
      }
      loadCompanies();
    } catch (error: any) {
      console.error('❌ Erro ao remover colaborador:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover colaborador: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  };

  // Create company diretamente na tabela
  const handleCreateCompany = async () => {
    if (!newCompanyName.trim() || !selectedOwnerEmail) {
      toast({
        title: 'Erro',
        description: 'Nome da empresa e email do proprietário são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    const owner = users.find(u => u.email === selectedOwnerEmail);
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
        name: newCompanyName, 
        owner: owner.id 
      });

      const { data, error } = await supabase
        .from('agencies')
        .insert({
          name: newCompanyName.trim(),
          owner_uid: owner.id,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar empresa:', error);
        throw error;
      }

      console.log('✅ Empresa criada (trigger vai sincronizar perfil):', data);

      toast({
        title: 'Sucesso',
        description: 'Empresa criada com sucesso'
      });

      setIsCreateDialogOpen(false);
      setNewCompanyName('');
      setSelectedOwnerEmail('');
      
      // Aguardar um pouco para o trigger executar
      setTimeout(() => {
        loadCompanies();
        loadUsers();
      }, 500);
    } catch (error: any) {
      console.error('❌ Erro ao criar empresa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar empresa: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  };

  // Edit company diretamente na tabela
  const handleEditCompany = async () => {
    if (!editingCompany || !editCompanyName.trim() || !editOwnerEmail) {
      toast({
        title: 'Erro',
        description: 'Nome da empresa e email do proprietário são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    const owner = users.find(u => u.email === editOwnerEmail);
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
          name: editCompanyName.trim(),
          owner_uid: owner.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCompany.id);

      if (error) {
        console.error('❌ Erro ao atualizar empresa:', error);
        throw error;
      }

      console.log('✅ Empresa atualizada (trigger vai sincronizar perfil)');

      toast({
        title: 'Sucesso',
        description: 'Empresa atualizada com sucesso'
      });

      setIsEditDialogOpen(false);
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

  // Delete company diretamente na tabela
  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      console.log('🗑️ Excluindo empresa:', companyId);

      // Buscar owner antes de deletar
      const { data: agency } = await supabase
        .from('agencies')
        .select('owner_uid')
        .eq('id', companyId)
        .single();

      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', companyId);

      if (error) {
        console.error('❌ Erro ao excluir empresa:', error);
        throw error;
      }

      console.log('✅ Empresa excluída (trigger vai sincronizar perfil)');

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

  // Invite collaborator usando apenas agency_collaborators
  const handleInviteCollaborator = async () => {
    if (!selectedCompany || !inviteEmail.trim()) {
      toast({
        title: 'Erro',
        description: 'Email do colaborador é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('👤 Buscando usuário por email:', inviteEmail);

      // Buscar usuário pelo email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', inviteEmail.trim())
        .single();

      if (profileError || !profiles) {
        toast({
          title: 'Erro',
          description: 'Usuário não encontrado com este email',
          variant: 'destructive'
        });
        return;
      }

      // Verificar se já é colaborador
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

      // Verificar se o usuário atual é admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Adicionar como colaborador diretamente - trigger vai sincronizar perfil
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

      console.log('✅ Colaborador adicionado (trigger vai sincronizar perfil)');

      toast({
        title: 'Sucesso',
        description: `Colaborador ${inviteEmail} adicionado com sucesso`
      });

      setIsInviteDialogOpen(false);
      setInviteEmail('');
      
      // Aguardar um pouco para o trigger executar
      setTimeout(() => {
        loadCompanies();
        if (isCollaboratorsDialogOpen) {
          loadCollaborators(selectedCompany.id);
        }
      }, 500);
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
    setEditCompanyName(company.name);
    setEditOwnerEmail(company.owner_email);
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
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="whitespace-nowrap">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nova Empresa</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-4">
                <DialogHeader>
                  <DialogTitle>Criar Nova Empresa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nome da Empresa</label>
                    <Input
                      placeholder="Digite o nome da empresa"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Proprietário</label>
                    <Select value={selectedOwnerEmail} onValueChange={setSelectedOwnerEmail}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o proprietário" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.email}>
                            {user.email} {user.name && `(${user.name})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col md:flex-row justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateCompany}>
                      Criar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Companies Table - Responsiva */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Empresa</TableHead>
                  <TableHead className="min-w-[180px] hidden md:table-cell">Proprietário</TableHead>
                  <TableHead className="min-w-[80px]">
                    <Users className="h-4 w-4 inline md:mr-1" />
                    <span className="hidden md:inline">Colaboradores</span>
                  </TableHead>
                  <TableHead className="min-w-[100px] hidden lg:table-cell">Criada</TableHead>
                  <TableHead className="min-w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{company.name}</p>
                        <p className="text-xs text-gray-400 md:hidden">{company.owner_email}</p>
                        <p className="text-xs text-gray-400">ID: {company.id.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        <p className="text-sm">{company.owner_email}</p>
                        {company.owner_name && company.owner_name !== 'N/A' && (
                          <p className="text-xs text-gray-600">{company.owner_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {company.collaborators_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <p className="text-sm">
                        {new Date(company.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCollaboratorsDialog(company)}
                          className="p-2"
                          title="Ver colaboradores"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openInviteDialog(company)}
                          className="p-2"
                          title="Convidar colaborador"
                        >
                          <UserPlus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(company)}
                          className="p-2"
                          title="Editar empresa"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCompany(company.id)}
                          className="p-2"
                          title="Excluir empresa"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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

      {/* Collaborators Dialog */}
      <Dialog open={isCollaboratorsDialogOpen} onOpenChange={setIsCollaboratorsDialogOpen}>
        <DialogContent className="max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Colaboradores - {selectedCompany?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Total: {collaborators.length} colaborador(es)
              </p>
              <Button
                size="sm"
                onClick={() => openInviteDialog(selectedCompany!)}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Adicionar</span>
              </Button>
            </div>
            
            {loadingCollaborators ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Carregando colaboradores...</p>
              </div>
            ) : collaborators.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead className="hidden sm:table-cell">Cargo</TableHead>
                      <TableHead className="hidden md:table-cell">Adicionado</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collaborators.map((collab) => (
                      <TableRow key={collab.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{collab.email}</p>
                            {collab.name && collab.name !== 'N/A' && (
                              <p className="text-xs text-gray-600">{collab.name}</p>
                            )}
                            <p className="text-xs text-gray-500 sm:hidden">{collab.role}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className="text-xs">
                            {collab.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="text-sm">
                            {new Date(collab.added_at).toLocaleDateString('pt-BR')}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveCollaborator(collab.id, collab.email)}
                            className="p-2"
                            title="Remover colaborador"
                          >
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Nenhum colaborador encontrado</p>
                <Button
                  className="mt-4"
                  onClick={() => openInviteDialog(selectedCompany!)}
                >
                  Adicionar primeiro colaborador
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Empresa</label>
              <Input
                placeholder="Digite o nome da empresa"
                value={editCompanyName}
                onChange={(e) => setEditCompanyName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Proprietário</label>
              <Select value={editOwnerEmail} onValueChange={setEditOwnerEmail}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o proprietário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.email} {user.name && `(${user.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col md:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditCompany}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Collaborator Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Convidar Colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Empresa:</p>
              <p className="font-medium">{selectedCompany?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Email do Colaborador</label>
              <Input
                type="email"
                placeholder="Digite o email do colaborador"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                O usuário deve estar cadastrado no sistema
              </p>
            </div>
            <div className="flex flex-col md:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleInviteCollaborator}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyManagement;
