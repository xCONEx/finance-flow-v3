
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Plus, 
  Trash2, 
  Mail, 
  Crown,
  Calculator,
  Package,
  Clock,
  TrendingUp,
  UserPlus,
  Settings
} from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useAgency } from '../contexts/AgencyContext';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Collaborator {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  role: string;
  joined_at: string;
  subscription?: string;
  subscription_given_by_agency?: boolean;
}

interface CompanyStats {
  totalCollaborators: number;
  activeProjects: number;
  monthlyRevenue: number;
  totalExpenses: number;
}

const CompanyDashboard = () => {
  const { user, profile } = useSupabaseAuth();
  const { currentContext, agencies } = useAgency();
  const { toast } = useToast();

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [stats, setStats] = useState<CompanyStats>({
    totalCollaborators: 0,
    activeProjects: 0,
    monthlyRevenue: 0,
    totalExpenses: 0
  });
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Verificar se é owner da empresa atual
  const currentAgency = currentContext !== 'individual' ? currentContext : null;
  const isOwner = currentAgency && agencies.find(a => a.id === currentAgency.id)?.is_owner;

  // Carregar dados da empresa
  const loadCompanyData = async () => {
    if (!currentAgency || !isOwner) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Carregar colaboradores
      const { data: collabData, error: collabError } = await (supabase as any)
        .rpc('get_company_collaborators_admin', { company_id: currentAgency.id });

      if (collabError) throw collabError;

      setCollaborators(collabData || []);

      // Carregar projetos ativos
      const { data: projectsData, error: projectsError } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('agency_id', currentAgency.id)
        .neq('status', 'entregue');

      if (projectsError) throw projectsError;

      // Carregar estatísticas
      setStats({
        totalCollaborators: collabData?.length || 0,
        activeProjects: projectsData?.length || 0,
        monthlyRevenue: 0, // Implementar depois
        totalExpenses: 0   // Implementar depois
      });

    } catch (error: any) {
      console.error('Erro ao carregar dados da empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da empresa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Convidar colaborador
  const handleInviteCollaborator = async () => {
    if (!currentAgency || !inviteEmail.trim()) return;

    try {
      setInviteLoading(true);

      const { error } = await (supabase as any)
        .rpc('invite_collaborator_admin', {
          company_id: currentAgency.id,
          collaborator_email: inviteEmail.trim()
        });

      if (error) throw error;

      // Dar o mesmo plano do owner para o colaborador
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription: profile?.subscription || 'free',
          subscription_given_by_agency: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', inviteEmail.trim());

      if (updateError) {
        console.warn('Aviso: Não foi possível atualizar o plano do colaborador:', updateError);
      }

      toast({
        title: "Sucesso",
        description: `Colaborador ${inviteEmail} convidado com sucesso!`
      });

      setInviteEmail('');
      setShowInviteDialog(false);
      loadCompanyData();

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao convidar colaborador",
        variant: "destructive"
      });
    } finally {
      setInviteLoading(false);
    }
  };

  // Remover colaborador
  const handleRemoveCollaborator = async (collaboratorId: string, email: string) => {
    const confirmRemove = confirm(`Tem certeza que deseja remover ${email} da empresa?`);
    if (!confirmRemove) return;

    try {
      const { error } = await (supabase as any)
        .rpc('remove_collaborator_admin', { collaborator_id: collaboratorId });

      if (error) throw error;

      // Remover plano se foi dado pela agência
      const collaborator = collaborators.find(c => c.id === collaboratorId);
      if (collaborator?.subscription_given_by_agency) {
        await supabase
          .from('profiles')
          .update({
            subscription: 'free',
            subscription_given_by_agency: false,
            updated_at: new Date().toISOString()
          })
          .eq('email', email);
      }

      toast({
        title: "Sucesso",
        description: `${email} foi removido da empresa`
      });

      loadCompanyData();

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover colaborador",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadCompanyData();
  }, [currentContext, isOwner]);

  // Se não é owner, mostrar acesso negado
  if (!isOwner || currentContext === 'individual') {
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
                Apenas proprietários de empresa podem acessar este painel.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>Carregando dados da empresa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="text-blue-600" />
            Dashboard da Empresa
          </h1>
          <p className="text-gray-600 mt-2">
            {currentAgency?.name} - Painel de Controle
          </p>
        </div>

        <Button
          onClick={() => setShowInviteDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar Colaborador
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCollaborators}</div>
            <p className="text-xs text-muted-foreground">
              Membros ativos da equipe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              Em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totais</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Custos operacionais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Colaboradores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Colaboradores da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {collaborators.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum colaborador cadastrado</p>
              <Button
                onClick={() => setShowInviteDialog(true)}
                className="mt-4"
                variant="outline"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar Primeiro Colaborador
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{collaborator.name || collaborator.email}</p>
                      <p className="text-sm text-gray-500">{collaborator.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{collaborator.role}</Badge>
                        {collaborator.subscription && (
                          <Badge variant="outline">
                            {collaborator.subscription}
                            {collaborator.subscription_given_by_agency && (
                              <Crown className="h-3 w-3 ml-1" />
                            )}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">
                      Desde {new Date(collaborator.joined_at).toLocaleDateString('pt-BR')}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveCollaborator(collaborator.id, collaborator.email)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Convite */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email do Colaborador</label>
              <Input
                type="email"
                placeholder="Digite o email do colaborador"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <Crown className="h-4 w-4 inline mr-1" />
                O colaborador receberá automaticamente o plano <strong>{profile?.subscription || 'free'}</strong> da empresa.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleInviteCollaborator}
                disabled={!inviteEmail.trim() || inviteLoading}
                className="flex-1"
              >
                {inviteLoading ? 'Convidando...' : 'Enviar Convite'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyDashboard;
