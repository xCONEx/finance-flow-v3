
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
  UserPlus
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
  const [newCompanyDescription, setNewCompanyDescription] = useState('');
  const [selectedOwnerEmail, setSelectedOwnerEmail] = useState('');

  // Edit company dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editCompanyDescription, setEditCompanyDescription] = useState('');
  const [editOwnerEmail, setEditOwnerEmail] = useState('');

  // Invite collaborator dialog
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');

  // Load companies diretamente da tabela agencies
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

      // Buscar dados dos proprietários
      const ownerIds = agencies?.map(a => a.owner_uid) || [];
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
          description: '', // Não existe no schema atual
          owner_uid: agency.owner_uid,
          owner_email: owner?.email || 'Email não encontrado',
          owner_name: owner?.name || owner?.email || 'N/A',
          created_at: agency.created_at,
          collaborators_count: collabCount
        };
      }) || [];

      console.log('✅ Empresas carregadas:', companiesData.length);
      setCompanies(companiesData);
      
    } catch (error: any) {
      console.error('❌ Erro completo ao carregar empresas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar empresas.',
        variant: 'destructive'
      });
      setCompanies([]);
    }
  };

  // Load users diretamente da tabela profiles
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

  useEffect(() => {
    loadCompanies();
    loadUsers();
  }, []);

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

      // Atualizar tipo do usuário para company_owner
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ user_type: 'company_owner' })
        .eq('id', owner.id);

      if (updateError) {
        console.error('⚠️ Erro ao atualizar tipo do usuário:', updateError);
      }

      console.log('✅ Empresa criada:', data);

      toast({
        title: 'Sucesso',
        description: 'Empresa criada com sucesso'
      });

      setIsCreateDialogOpen(false);
      setNewCompanyName('');
      setNewCompanyDescription('');
      setSelectedOwnerEmail('');
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

      // Atualizar tipo do novo owner
      const { error: updateNewOwnerError } = await supabase
        .from('profiles')
        .update({ user_type: 'company_owner' })
        .eq('id', owner.id);

      if (updateNewOwnerError) {
        console.error('⚠️ Erro ao atualizar novo owner:', updateNewOwnerError);
      }

      // Se mudou o owner, verificar se o antigo ainda tem outras empresas
      if (editingCompany.owner_uid !== owner.id) {
        const { data: otherAgencies } = await supabase
          .from('agencies')
          .select('id')
          .eq('owner_uid', editingCompany.owner_uid);

        if (!otherAgencies || otherAgencies.length === 0) {
          const { error: updateOldOwnerError } = await supabase
            .from('profiles')
            .update({ user_type: 'individual' })
            .eq('id', editingCompany.owner_uid);

          if (updateOldOwnerError) {
            console.error('⚠️ Erro ao atualizar antigo owner:', updateOldOwnerError);
          }
        }
      }

      console.log('✅ Empresa atualizada');

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

      // Verificar se o owner ainda tem outras empresas
      if (agency?.owner_uid) {
        const { data: otherAgencies } = await supabase
          .from('agencies')
          .select('id')
          .eq('owner_uid', agency.owner_uid);

        if (!otherAgencies || otherAgencies.length === 0) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ user_type: 'individual' })
            .eq('id', agency.owner_uid);

          if (updateError) {
            console.error('⚠️ Erro ao atualizar tipo do usuário:', updateError);
          }
        }
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
      const { data: existing } = await supabase
        .from('agency_collaborators')
        .select('id')
        .eq('agency_id', selectedCompany.id)
        .eq('user_id', profiles.id)
        .single();

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

      // Adicionar como colaborador diretamente
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
        description: `Colaborador ${inviteEmail} adicionado com sucesso`
      });

      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setSelectedCompany(null);
      loadCompanies();
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
    setEditCompanyDescription(company.description || '');
    setEditOwnerEmail(company.owner_email);
    setIsEditDialogOpen(true);
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando empresas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Gestão de Empresas ({companies.length})
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
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <Input
              placeholder="Buscar empresas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Empresa
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateCompany}>
                      Criar Empresa
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Companies Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Empresa</TableHead>
                  <TableHead className="min-w-[200px]">Proprietário</TableHead>
                  <TableHead className="min-w-[100px]">Colaboradores</TableHead>
                  <TableHead className="min-w-[100px]">Criada em</TableHead>
                  <TableHead className="min-w-[200px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{company.name}</p>
                        <p className="text-xs text-gray-400">ID: {company.id.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{company.owner_email}</p>
                        {company.owner_name && company.owner_name !== 'N/A' && (
                          <p className="text-xs text-gray-600">{company.owner_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {company.collaborators_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {new Date(company.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col md:flex-row gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openInviteDialog(company)}
                          className="text-xs"
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Convidar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(company)}
                          className="text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCompany(company.id)}
                          className="text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
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

      {/* Edit Company Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditCompany}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Collaborator Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleInviteCollaborator}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Colaborador
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyManagement;
