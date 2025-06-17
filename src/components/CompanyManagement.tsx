
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
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Agency {
  id: string;
  name: string;
  owner_uid: string;
  owner_email: string;
  owner_name?: string;
  status?: string;
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
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create agency dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAgencyName, setNewAgencyName] = useState('');
  const [selectedOwnerEmail, setSelectedOwnerEmail] = useState('');

  // Edit agency dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [editAgencyName, setEditAgencyName] = useState('');
  const [editOwnerEmail, setEditOwnerEmail] = useState('');

  // Load agencies
  const loadAgencies = async () => {
    try {
      setLoading(true);
      console.log('🏢 Carregando agências...');
      
      // Buscar agências com informações dos owners
      const { data, error } = await supabase
        .from('agencies')
        .select(`
          id,
          name,
          owner_uid,
          status,
          created_at,
          profiles!agencies_owner_uid_fkey (
            email,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar agências:', error);
        throw error;
      }

      // Buscar contagem de colaboradores para cada agência
      const agenciesWithCollaborators = await Promise.all(
        (data || []).map(async (agency) => {
          const { count } = await supabase
            .from('agency_collaborators')
            .select('id', { count: 'exact' })
            .eq('agency_id', agency.id);

          return {
            id: agency.id,
            name: agency.name,
            owner_uid: agency.owner_uid,
            owner_email: agency.profiles?.email || 'N/A',
            owner_name: agency.profiles?.name || 'N/A',
            status: agency.status || 'active',
            created_at: agency.created_at,
            collaborators_count: count || 0
          };
        })
      );
      
      console.log('✅ Agências carregadas:', agenciesWithCollaborators.length);
      setAgencies(agenciesWithCollaborators);
      
    } catch (error: any) {
      console.error('❌ Erro completo ao carregar agências:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar agências. Verifique se você tem permissões de administrador.',
        variant: 'destructive'
      });
      setAgencies([]);
    }
  };

  // Load users
  const loadUsers = async () => {
    try {
      console.log('👥 Carregando usuários...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, user_type')
        .order('email');

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
    loadAgencies();
    loadUsers();
  }, []);

  // Create agency
  const handleCreateAgency = async () => {
    if (!newAgencyName.trim() || !selectedOwnerEmail) {
      toast({
        title: 'Erro',
        description: 'Nome da agência e email do proprietário são obrigatórios',
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
      console.log('🏗️ Criando agência:', { 
        name: newAgencyName, 
        owner: owner.id 
      });

      const { data, error } = await supabase
        .from('agencies')
        .insert({
          name: newAgencyName.trim(),
          owner_uid: owner.id,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar agência:', error);
        throw error;
      }

      console.log('✅ Agência criada:', data);

      toast({
        title: 'Sucesso',
        description: 'Agência criada com sucesso'
      });

      setIsCreateDialogOpen(false);
      setNewAgencyName('');
      setSelectedOwnerEmail('');
      loadAgencies();
    } catch (error: any) {
      console.error('❌ Erro ao criar agência:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar agência: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  };

  // Edit agency
  const handleEditAgency = async () => {
    if (!editingAgency || !editAgencyName.trim() || !editOwnerEmail) {
      toast({
        title: 'Erro',
        description: 'Nome da agência e email do proprietário são obrigatórios',
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
      console.log('✏️ Editando agência:', editingAgency.id);

      const { error } = await supabase
        .from('agencies')
        .update({
          name: editAgencyName.trim(),
          owner_uid: owner.id
        })
        .eq('id', editingAgency.id);

      if (error) {
        console.error('❌ Erro ao atualizar agência:', error);
        throw error;
      }

      console.log('✅ Agência atualizada');

      toast({
        title: 'Sucesso',
        description: 'Agência atualizada com sucesso'
      });

      setIsEditDialogOpen(false);
      setEditingAgency(null);
      loadAgencies();
    } catch (error: any) {
      console.error('❌ Erro ao atualizar agência:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar agência: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  };

  // Delete agency
  const handleDeleteAgency = async (agencyId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta agência? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      console.log('🗑️ Excluindo agência:', agencyId);

      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', agencyId);

      if (error) {
        console.error('❌ Erro ao excluir agência:', error);
        throw error;
      }

      console.log('✅ Agência excluída');

      toast({
        title: 'Sucesso',
        description: 'Agência excluída com sucesso'
      });

      loadAgencies();
    } catch (error: any) {
      console.error('❌ Erro ao excluir agência:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir agência: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (agency: Agency) => {
    setEditingAgency(agency);
    setEditAgencyName(agency.name);
    setEditOwnerEmail(agency.owner_email);
    setIsEditDialogOpen(true);
  };

  const filteredAgencies = agencies.filter(agency =>
    agency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agency.owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agency.owner_name && agency.owner_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando agências...</p>
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
              Gestão de Agências ({agencies.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadAgencies();
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
              placeholder="Buscar agências..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Agência
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Agência</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nome da Agência</label>
                    <Input
                      placeholder="Digite o nome da agência"
                      value={newAgencyName}
                      onChange={(e) => setNewAgencyName(e.target.value)}
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
                    <Button onClick={handleCreateAgency}>
                      Criar Agência
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Agencies Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Agência</TableHead>
                  <TableHead className="min-w-[200px]">Proprietário</TableHead>
                  <TableHead className="min-w-[100px]">Colaboradores</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[100px]">Criada em</TableHead>
                  <TableHead className="min-w-[150px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{agency.name}</p>
                        <p className="text-xs text-gray-400">ID: {agency.id.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{agency.owner_email}</p>
                        {agency.owner_name && agency.owner_name !== 'N/A' && (
                          <p className="text-xs text-gray-600">{agency.owner_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {agency.collaborators_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={agency.status === 'active' ? 'default' : 'secondary'}>
                        {agency.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {new Date(agency.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col md:flex-row gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(agency)}
                          className="text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAgency(agency.id)}
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

          {filteredAgencies.length === 0 && !loading && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {agencies.length === 0 ? 'Nenhuma agência encontrada' : 'Nenhuma agência corresponde à busca'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Agency Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Agência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Agência</label>
              <Input
                placeholder="Digite o nome da agência"
                value={editAgencyName}
                onChange={(e) => setEditAgencyName(e.target.value)}
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
              <Button onClick={handleEditAgency}>
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
