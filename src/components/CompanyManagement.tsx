
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
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
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

  // Load companies
  const loadCompanies = async () => {
    try {
      setLoading(true);
      console.log('🏢 Carregando empresas...');
      
      const { data, error } = await (supabase as any).rpc('get_all_companies_for_admin');
      
      if (error) {
        console.error('❌ Erro ao carregar empresas:', error);
        throw error;
      }
      
      console.log('✅ Empresas carregadas:', data?.length || 0);
      setCompanies(data || []);
    } catch (error: any) {
      console.error('❌ Erro ao carregar empresas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar empresas: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  };

  // Load users
  const loadUsers = async () => {
    try {
      const { data, error } = await (supabase as any).rpc('get_all_profiles_for_admin');
      
      if (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        throw error;
      }
      
      setUsers(data || []);
    } catch (error: any) {
      console.error('❌ Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
    loadUsers();
  }, []);

  // Create company
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
      const { data, error } = await (supabase as any).rpc('admin_create_company', {
        company_name: newCompanyName.trim(),
        company_description: newCompanyDescription.trim() || null,
        owner_user_id: owner.id
      });

      if (error) {
        console.error('❌ Erro ao criar empresa:', error);
        throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Empresa criada com sucesso'
      });

      setIsCreateDialogOpen(false);
      setNewCompanyName('');
      setNewCompanyDescription('');
      setSelectedOwnerEmail('');
      loadCompanies();
    } catch (error: any) {
      console.error('❌ Erro ao criar empresa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar empresa: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  };

  // Edit company
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
      const { data, error } = await (supabase as any).rpc('admin_update_company', {
        company_id: editingCompany.id,
        new_name: editCompanyName.trim(),
        new_description: editCompanyDescription.trim() || null,
        new_owner_id: owner.id
      });

      if (error) {
        console.error('❌ Erro ao atualizar empresa:', error);
        throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Empresa atualizada com sucesso'
      });

      setIsEditDialogOpen(false);
      setEditingCompany(null);
      loadCompanies();
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
      const { data, error } = await (supabase as any).rpc('admin_delete_company', {
        company_id: companyId
      });

      if (error) {
        console.error('❌ Erro ao excluir empresa:', error);
        throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Empresa excluída com sucesso'
      });

      loadCompanies();
    } catch (error: any) {
      console.error('❌ Erro ao excluir empresa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir empresa: ' + (error?.message || 'Erro desconhecido'),
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
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gestão de Empresas
          </CardTitle>
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
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea
                      placeholder="Descrição da empresa (opcional)"
                      value={newCompanyDescription}
                      onChange={(e) => setNewCompanyDescription(e.target.value)}
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
                  <TableHead className="min-w-[150px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{company.name}</p>
                        {company.description && (
                          <p className="text-xs text-gray-600">{company.description}</p>
                        )}
                        <p className="text-xs text-gray-400">ID: {company.id.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{company.owner_email}</p>
                        {company.owner_name && (
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

          {filteredCompanies.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhuma empresa encontrada</p>
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
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Descrição da empresa (opcional)"
                value={editCompanyDescription}
                onChange={(e) => setEditCompanyDescription(e.target.value)}
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
    </div>
  );
};

export default CompanyManagement;
