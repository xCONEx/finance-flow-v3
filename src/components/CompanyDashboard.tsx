import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Building2,
  Crown,
  Trash2,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';

// Let's use a more flexible interface that matches the actual database
interface Agency {
  id: string;
  name: string;
  [key: string]: any; // Allow any other properties
}

interface Collaborator {
  id: string;
  user_id: string;
  agency_id: string;
  role: string;
  added_at: string;
  user_email?: string;
  user_name?: string;
}

const CompanyDashboard = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [userAgencies, setUserAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invite dialog
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // Carregar agências do usuário (onde ele é owner)
  const loadUserAgencies = async () => {
    if (!user) return;

    try {
      console.log('🏢 Carregando agências do usuário...');
      
      // First, let's try to get all columns to see what's available
      const { data, error } = await supabase
        .from('agencies')
        .select('*');

      if (error) {
        console.error('❌ Erro ao carregar agências:', error);
        throw error;
      }

      console.log('✅ Estrutura da tabela agencies:', data?.[0] || 'Nenhum dado encontrado');

      // Filter by user on the client side using the correct column name
      const userOwnedAgencies = data?.filter(agency => 
        agency.owner_uid === user.id
      ) || [];

      console.log('✅ Agências do usuário:', userOwnedAgencies.length);
      setUserAgencies(userOwnedAgencies);
      
      // Selecionar primeira agência automaticamente
      if (userOwnedAgencies.length > 0 && !selectedAgency) {
        setSelectedAgency(userOwnedAgencies[0]);
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao carregar agências:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar suas empresas',
        variant: 'destructive'
      });
    }
  };

  // Carregar colaboradores da agência selecionada
  const loadCollaborators = async (agencyId: string) => {
    try {
      console.log('👥 Carregando colaboradores da agência:', agencyId);
      
      const { data, error } = await supabase
        .from('agency_collaborators')
        .select(`
          id,
          user_id,
          agency_id,
          role,
          added_at
        `)
        .eq('agency_id', agencyId);

      if (error) {
        console.error('❌ Erro ao carregar colaboradores:', error);
        throw error;
      }

      // Buscar dados dos usuários colaboradores
      if (data && data.length > 0) {
        const userIds = data.map(c => c.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, name')
          .in('id', userIds);

        if (profilesError)  {
          console.error('❌ Erro ao carregar perfis:', profilesError);
        }

        const collaboratorsWithProfiles = data.map(collab => {
          const profile = profiles?.find(p => p.id === collab.user_id);
          return {
            ...collab,
            user_email: profile?.email || 'Email não encontrado',
            user_name: profile?.name || profile?.email || 'N/A'
          };
        });

        setCollaborators(collaboratorsWithProfiles);
      } else {
        setCollaborators([]);
      }

      console.log('✅ Colaboradores carregados:', data?.length || 0);
      
    } catch (error: any) {
      console.error('❌ Erro ao carregar colaboradores:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar colaboradores',
        variant: 'destructive'
      });
    }
  };

  // Convidar colaborador (simplificado - adiciona diretamente)
  const handleInviteCollaborator = async () => {
    if (!selectedAgency || !inviteEmail.trim()) {
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
        .eq('agency_id', selectedAgency.id)
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

      // Adicionar como colaborador
      const { error } = await supabase
        .from('agency_collaborators')
        .insert({
          agency_id: selectedAgency.id,
          user_id: profiles.id,
          role: 'editor',
          added_by: user?.id
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
      loadCollaborators(selectedAgency.id);
    } catch (error: any) {
      console.error('❌ Erro ao adicionar colaborador:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar colaborador: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  };

  // Remover colaborador
  const handleRemoveCollaborator = async (collaboratorId: string, collaboratorEmail: string) => {
    if (!confirm(`Tem certeza que deseja remover ${collaboratorEmail} da equipe?`)) {
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
        description: `${collaboratorEmail} foi removido da equipe`
      });

      if (selectedAgency) {
        loadCollaborators(selectedAgency.id);
      }
    } catch (error: any) {
      console.error('❌ Erro ao remover colaborador:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover colaborador',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadUserAgencies();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAgency) {
      loadCollaborators(selectedAgency.id);
    }
  }, [selectedAgency]);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto text-center py-8">
          <AlertTriangle className="h-16 w-16 mx-auto text-amber-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Acesso Restrito
          </h3>
          <p className="text-gray-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (userAgencies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Building2 className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Gestão de Equipe
                </h1>
                <p className="text-gray-600">Gerencie sua equipe e colaboradores</p>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma Empresa Encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Você não possui nenhuma empresa ainda. Entre em contato com o administrador para criar uma empresa.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Gestão de Equipe
              </h1>
              <p className="text-gray-600">Gerencie sua equipe e colaboradores</p>
            </div>
          </div>
        </div>

        {/* Seletor de Empresa */}
        {userAgencies.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Selecionar Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userAgencies.map((agency) => (
                  <Card 
                    key={agency.id} 
                    className={`cursor-pointer transition-all ${
                      selectedAgency?.id === agency.id 
                        ? 'ring-2 ring-purple-500 bg-purple-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedAgency(agency)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-full">
                          <Building2 className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{agency.name}</h3>
                          <p className="text-sm text-gray-600">
                            Criada em {new Date(agency.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedAgency && (
          <>
            {/* Empresa Selecionada */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-600" />
                    <span className="truncate">{selectedAgency.name}</span>
                  </CardTitle>
                  <Badge variant="secondary">Proprietário</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Colaboradores</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      {collaborators.length}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Status</span>
                    </div>
                    <p className="text-lg font-semibold text-green-600 mt-2 capitalize">
                      {selectedAgency.status}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gerenciar Colaboradores */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Colaboradores ({collaborators.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedAgency) {
                          loadCollaborators(selectedAgency.id);
                        }
                      }}
                      className="hidden sm:flex"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                    <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex items-center gap-2">
                          <div className="relative">
                            <User className="h-4 w-4" />
                            <Plus className="h-3 w-3 absolute -top-1 -right-1 bg-white rounded-full" />
                          </div>
                          <span className="hidden sm:inline">Adicionar</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="mx-4 max-w-md">
                        <DialogHeader>
                          <DialogTitle>Adicionar Colaborador</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">Empresa:</p>
                            <p className="font-medium truncate">{selectedAgency.name}</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Email do Colaborador</label>
                            <Input
                              type="email"
                              placeholder="Digite o email do colaborador"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500">
                              O usuário deve estar cadastrado no sistema
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} className="w-full sm:w-auto">
                              Cancelar
                            </Button>
                            <Button onClick={handleInviteCollaborator} className="w-full sm:w-auto">
                              <UserPlus className="h-4 w-4 mr-2" />
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {collaborators.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Nenhum colaborador encontrado</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Adicione pessoas para colaborar em sua empresa
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {collaborators.map((collaborator) => (
                      <div key={collaborator.id} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg bg-white">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2 bg-gray-100 rounded-full flex-shrink-0">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">
                              {collaborator.user_name}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {collaborator.user_email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {collaborator.role}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Desde {new Date(collaborator.added_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveCollaborator(collaborator.id, collaborator.user_email || '')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;
