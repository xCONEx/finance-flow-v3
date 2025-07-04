import React, { useEffect, useState, useCallback } from 'react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Shield,
  Users,
  Building2,
  DollarSign,
  Activity,
  CheckCircle,
  TrendingUp,
  UserPlus,
  Edit,
  Ban,
  UserCheck,
  Trash2,
  UserMinus,
  Download,
  User, Building, BarChart, ShieldCheck,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import CompanyManagement from './CompanyManagement';


type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise' | 'enterprise-annual';
type UserType = 'individual' | 'company_owner' | 'employee' | 'admin';

interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  subscription?: SubscriptionPlan | null;
  user_type?: UserType | null;
  banned?: boolean | null;
  created_at: string;
  updated_at?: string;
  subscription_data?: any;
}

const AdminPanel = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Verificar se o usuário atual é admin
  const isCurrentUserAdmin = user?.email === 'yuriadrskt@gmail.com' || user?.email === 'adm.financeflow@gmail.com';

  const loadData = useCallback(async () => {
    if (!isCurrentUserAdmin) return;
    
    try {
      setLoading(true);
      console.log('🔍 Carregando dados do admin via RPC...');
      
      // Usar a nova função RPC para buscar todos os usuários com type assertion
      const { data: profilesData, error } = await (supabase as any).rpc('get_all_profiles_for_admin');

      if (error) {
        console.error('❌ Erro ao buscar perfis via RPC:', error);
        throw error;
      }

      console.log('✅ Dados carregados via RPC:', profilesData?.length || 0, 'usuários');
      setUsers(profilesData || []);
      
      // Analytics - com verificações de null safety
      const profiles = profilesData || [];
      const { totalRevenue, planCounts } = calculateRevenue(profiles);
      const totalUsers = profiles.length;
      const bannedUsers = profiles.filter((u: any) => u.banned).length;
      
      setAnalytics({
        overview: {
          totalUsers,
          totalAgencias: 0,
          totalRevenue,
          activeUsers: totalUsers - bannedUsers
        },
        userStats: {
          freeUsers: planCounts.freeUsers,
          premiumUsers: planCounts.premiumUsers,
          basicUsers: planCounts.basicUsers,
          enterpriseUsers: planCounts.enterpriseUsers + planCounts.enterpriseAnnualUsers,
          bannedUsers
        }
      });
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados dos usuários: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [isCurrentUserAdmin, toast]);

  useEffect(() => {
    if (isCurrentUserAdmin) {
      loadData();
    }
  }, [loadData]);

  const calculateRevenue = (profiles: UserProfile[]) => {
    const planValues = {
      'free': 0,
      'basic': 29,
      'premium': 49,
      'enterprise': 99,
      'enterprise-annual': 1990
    };

    let totalRevenue = 0;
    const planCounts = {
      freeUsers: 0,
      basicUsers: 0,
      premiumUsers: 0,
      enterpriseUsers: 0,
      enterpriseAnnualUsers: 0
    };

    profiles.forEach(profile => {
      const plan = profile.subscription || 'free';
      totalRevenue += planValues[plan as keyof typeof planValues] || 0;
      
      switch (plan) {
        case 'free':
          planCounts.freeUsers++;
          break;
        case 'basic':
          planCounts.basicUsers++;
          break;
        case 'premium':
          planCounts.premiumUsers++;
          break;
        case 'enterprise':
          planCounts.enterpriseUsers++;
          break;
        case 'enterprise-annual':
          planCounts.enterpriseAnnualUsers++;
          break;
      }
    });

    return { totalRevenue, planCounts };
  };

  const exportToPDF = async (period: 'monthly' | 'quarterly' | 'annual') => {
    try {
      const { totalRevenue, planCounts } = calculateRevenue(users);
      const totalUsers = users.length;
      const bannedUsers = users.filter(u => u.banned).length;
      const activeUsers = totalUsers - bannedUsers;
      
      // Create PDF content
      const content = `
RELATÓRIO ANALÍTICO - ${period.toUpperCase()}
Data: ${new Date().toLocaleDateString('pt-BR')}

=== RESUMO GERAL ===
Total de Usuários: ${totalUsers}
Usuários Ativos: ${activeUsers}
Usuários Banidos: ${bannedUsers}
Receita Total: R$ ${totalRevenue.toLocaleString('pt-BR')}

=== DISTRIBUIÇÃO DE PLANOS ===
Usuários Free: ${planCounts.freeUsers} (R$ 0)
Usuários Basic: ${planCounts.basicUsers} (R$ ${(planCounts.basicUsers * 29).toLocaleString('pt-BR')})
Usuários Premium: ${planCounts.premiumUsers} (R$ ${(planCounts.premiumUsers * 49).toLocaleString('pt-BR')})
Usuários Enterprise: ${planCounts.enterpriseUsers} (R$ ${(planCounts.enterpriseUsers * 99).toLocaleString('pt-BR')})
Usuários Enterprise Anual: ${planCounts.enterpriseAnnualUsers} (R$ ${(planCounts.enterpriseAnnualUsers * 1990).toLocaleString('pt-BR')})

=== MÉTRICAS ===
Taxa de Conversão: ${totalUsers > 0 ? (((planCounts.basicUsers + planCounts.premiumUsers + planCounts.enterpriseUsers + planCounts.enterpriseAnnualUsers) / totalUsers) * 100).toFixed(1) : 0}%
Receita Média por Usuário: R$ ${totalUsers > 0 ? (totalRevenue / totalUsers).toFixed(2) : '0.00'}

Relatório gerado em: ${new Date().toLocaleString('pt-BR')}
      `;

      // Create and download the file
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Sucesso',
        description: `Relatório ${period} exportado com sucesso`
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao exportar relatório',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateUserField = async (userId: string, field: string, value: any) => {
    try {
      console.log(`🔄 Atualizando ${field} para usuário ${userId}:`, value);
      
      // Preparar parâmetros baseados no campo
      let updateParams: any = {
        target_user_id: userId
      };

      if (field === 'user_type') {
        updateParams.new_user_type = value;
      } else if (field === 'subscription') {
        updateParams.new_subscription = value;
      } else if (field === 'banned') {
        updateParams.new_banned = value;
      }

      // Usar a nova função RPC para atualizar com type assertion
      const { data, error } = await (supabase as any).rpc('admin_update_profile', updateParams);

      if (error) {
        console.error('❌ Erro ao atualizar via RPC:', error);
        throw error;
      }

      // Atualizar o estado local
      setUsers(users.map(u => u.id === userId ? { ...u, [field]: value } : u));
      toast({ 
        title: 'Sucesso', 
        description: `${field} atualizado com sucesso` 
      });
    } catch (error: any) {
      console.error('❌ Erro ao atualizar:', error);
      toast({ 
        title: 'Erro', 
        description: 'Erro ao atualizar campo: ' + (error?.message || 'Erro desconhecido'), 
        variant: 'destructive' 
      });
    }
  };

  const handleUpdateSubscription = async (userId: string, newPlan: SubscriptionPlan) => {
    try {
      const subscriptionData = {
        plan: newPlan,
        status: 'active' as const,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_provider: 'manual_admin',
        amount: newPlan === 'basic' ? 29 : newPlan === 'premium' ? 49 : newPlan === 'enterprise' ? 99 : newPlan === 'enterprise-annual' ? 1990 : 0,
        currency: 'BRL'
      };

      // Usar a nova função RPC para atualizar com type assertion
      const { data, error } = await (supabase as any).rpc('admin_update_profile', {
        target_user_id: userId,
        new_subscription: newPlan,
        new_subscription_data: subscriptionData
      });

      if (error) throw error;

      // Atualizar o estado local
      setUsers(users.map(u => u.id === userId ? { 
        ...u, 
        subscription: newPlan,
        subscription_data: subscriptionData
      } : u));
      
      toast({ 
        title: 'Sucesso', 
        description: `Plano atualizado para ${newPlan}` 
      });
      
      // Recarregar analytics
      const profiles = users.map(u => u.id === userId ? { ...u, subscription: newPlan } : u);
      const { totalRevenue, planCounts } = calculateRevenue(profiles);
      const totalUsers = profiles.length;
      const bannedUsers = profiles.filter((u: any) => u.banned).length;
      
      setAnalytics({
        overview: {
          totalUsers,
          totalAgencias: 0,
          totalRevenue,
          activeUsers: totalUsers - bannedUsers
        },
        userStats: {
          freeUsers: planCounts.freeUsers,
          premiumUsers: planCounts.premiumUsers,
          basicUsers: planCounts.basicUsers,
          enterpriseUsers: planCounts.enterpriseUsers + planCounts.enterpriseAnnualUsers,
          bannedUsers
        }
      });
    } catch (error: any) {
      console.error('❌ Erro ao atualizar assinatura:', error);
      toast({ 
        title: 'Erro', 
        description: 'Erro ao atualizar plano: ' + (error?.message || 'Erro desconhecido'), 
        variant: 'destructive' 
      });
    }
  };

  const handleBanUser = async (userId: string, banned: boolean) => {
    try {
      // Usar a nova função RPC para atualizar com type assertion
      const { data, error } = await (supabase as any).rpc('admin_update_profile', {
        target_user_id: userId,
        new_banned: banned
      });

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, banned } : u));
      toast({ 
        title: 'Sucesso', 
        description: banned ? 'Usuário banido' : 'Usuário desbanido' 
      });
    } catch (error: any) {
      console.error('❌ Erro ao banir/desbanir:', error);
      toast({ 
        title: 'Erro', 
        description: 'Erro ao banir/desbanir usuário: ' + (error?.message || 'Erro desconhecido'), 
        variant: 'destructive' 
      });
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail) return;
    const targetUser = users.find(u => u.email === newAdminEmail);
    if (!targetUser) {
      toast({ title: 'Erro', description: 'Usuário não encontrado', variant: 'destructive' });
      return;
    }
    await handleUpdateUserField(targetUser.id, 'user_type', 'admin');
    setNewAdminEmail('');
  };

  const filteredUsers = users.filter(user => {
    const email = user?.email || '';
    const name = user?.name || '';
    const matchesSearch = email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTypeFilter = userTypeFilter === 'all' ? true : user.user_type === userTypeFilter;
    const matchesSubscriptionFilter = subscriptionFilter === 'all' ? true : 
                                    (user.subscription || 'free') === subscriptionFilter;
    return matchesSearch && matchesTypeFilter && matchesSubscriptionFilter;
  });

  if (!isCurrentUserAdmin) {
    return (
      <div className="text-center p-4 md:p-8">
        <Shield className="h-12 w-12 md:h-16 md:w-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl md:text-2xl font-bold text-red-600">Acesso Negado</h2>
        <p className="text-sm md:text-base text-gray-600">Você não tem permissão para acessar este painel.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-4 md:p-8">
        <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-sm md:text-base text-gray-600">Carregando dados...</p>
      </div>
    );
  }

  const { freeUsers = 0, premiumUsers = 0, basicUsers = 0, enterpriseUsers = 0, bannedUsers = 0 } = analytics?.userStats || {};

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-4 ">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
          <Shield className="text-purple-600 h-6 w-6 md:h-8 md:w-8" />
          Painel Administrativo
        </h2>
        <p className="text-sm md:text-base text-gray-600">Gestão completa da plataforma</p>
      </div>

      {/* Analytics Cards - Responsivo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <Users className="h-6 w-6 md:h-8 md:w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-lg md:text-2xl font-bold">{analytics?.overview?.totalUsers || 0}</p>
            <p className="text-xs md:text-sm text-gray-600">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <Activity className="h-6 w-6 md:h-8 md:w-8 mx-auto text-green-600 mb-2" />
            <p className="text-lg md:text-2xl font-bold">{analytics?.overview?.activeUsers || 0}</p>
            <p className="text-xs md:text-sm text-gray-600">Ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <Ban className="h-6 w-6 md:h-8 md:w-8 mx-auto text-red-600 mb-2" />
            <p className="text-lg md:text-2xl font-bold">{bannedUsers}</p>
            <p className="text-xs md:text-sm text-gray-600">Banidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 mx-auto text-purple-600 mb-2" />
            <p className="text-lg md:text-2xl font-bold">{premiumUsers + basicUsers + enterpriseUsers}</p>
            <p className="text-xs md:text-sm text-gray-600">Pagantes</p>
          </CardContent>
        </Card>
      </div>

      {/* Planos - Grid responsivo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <Users className="h-6 w-6 md:h-8 md:w-8 mx-auto text-gray-600 mb-2" />
            <p className="text-lg md:text-2xl font-bold text-gray-700">{freeUsers}</p>
            <p className="text-xs md:text-sm text-gray-600">Free</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 mx-auto text-green-600 mb-2" />
            <p className="text-lg md:text-2xl font-bold text-green-700">{basicUsers}</p>
            <p className="text-xs md:text-sm text-gray-600">Basic</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-lg md:text-2xl font-bold text-blue-700">{premiumUsers}</p>
            <p className="text-xs md:text-sm text-gray-600">Premium</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <TrendingUp className="h-6 w-6 md:h-8 md:w-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-lg md:text-2xl font-bold text-yellow-700">{enterpriseUsers}</p>
            <p className="text-xs md:text-sm text-gray-600">Enterprise</p>
          </CardContent>
        </Card>
      </div>

<Tabs defaultValue="users" className="space-y-4">
  <TabsList className="grid grid-cols-4 gap-1 md:gap-2 w-full">
    <TabsTrigger value="users" className="flex flex-col items-center text-xs md:text-sm">
      <User className="w-6 h-6 md:hidden" />  {/* Ícone só no mobile */}
      <span className="hidden md:block">Usuários</span> {/* Texto só no desktop */}
    </TabsTrigger>

    <TabsTrigger value="companies" className="flex flex-col items-center text-xs md:text-sm">
      <Building className="w-6 h-6 md:hidden" />
      <span className="hidden md:block">Empresas</span>
    </TabsTrigger>

    <TabsTrigger value="admins" className="flex flex-col items-center text-xs md:text-sm">
      <ShieldCheck className="w-6 h-6 md:hidden" />
      <span className="hidden md:block">Administradores</span>
    </TabsTrigger>

    <TabsTrigger value="analytics" className="flex flex-col items-center text-xs md:text-sm">
      <BarChart className="w-6 h-6 md:hidden" />
      <span className="hidden md:block">Analytics</span>
    </TabsTrigger>
  </TabsList>


        {/* USERS */}
        <TabsContent value="users" className="space-y-4 pb-20 md:pb-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Filtro de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:gap-2">
                <Input
                  placeholder="Buscar por email ou nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-sm"
                />
                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="company_owner">Company Owner</SelectItem>
                    <SelectItem value="employee">Colaborador</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os planos</SelectItem>
                    <SelectItem value="free">Gratuito</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="enterprise-annual">Enterprise Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela responsiva com botões minimalistas */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Usuário</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Plano</TableHead>
                      <TableHead className="min-w-[120px]">Tipo</TableHead>
                      <TableHead className="min-w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{user.email}</p>
                            {user.name && (
                              <p className="text-xs text-gray-600">{user.name}</p>
                            )}
                            <p className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.banned ? "destructive" : "secondary"} className="text-xs">
                            {user.banned ? "Banido" : "Ativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={user.subscription || 'free'} 
                            onValueChange={(value: SubscriptionPlan) => handleUpdateSubscription(user.id, value)}
                          >
                            <SelectTrigger className="w-full min-w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Gratuito</SelectItem>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                              <SelectItem value="enterprise-annual">Enterprise Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={user.user_type || 'individual'} 
                            onValueChange={(value: UserType) => handleUpdateUserField(user.id, 'user_type', value)}
                          >
                            <SelectTrigger className="w-full min-w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="company_owner">Company Owner</SelectItem>
                              <SelectItem value="employee">Colaborador</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant={user.banned ? "outline" : "destructive"}
                              size="sm"
                              onClick={() => handleBanUser(user.id, !user.banned)}
                              className="p-2"
                              title={user.banned ? "Desbanir usuário" : "Banir usuário"}
                            >
                              {user.banned ? (
                                <UserCheck className="h-4 w-4" />
                              ) : (
                                <Ban className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum usuário encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPANIES */}
        <TabsContent value="companies" className="space-y-4 pb-20 md:pb-0">
          <CompanyManagement />
        </TabsContent>

        {/* ADMINS */}
        <TabsContent value="admins" className="space-y-4 pb-20 md:pb-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Gerenciar Administradores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  placeholder="Email do novo admin"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddAdmin} className="md:w-auto">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Admin
                </Button>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm md:text-base">Administradores Atuais:</h4>
                {users.filter(u => u.user_type === 'admin').map(admin => (
                  <div key={admin.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <span className="text-sm font-medium">{admin.email}</span>
                      {admin.name && (
                        <p className="text-xs text-gray-600">{admin.name}</p>
                      )}
                    </div>
                    <Badge>Admin</Badge>
                  </div>
                ))}
                {users.filter(u => u.user_type === 'admin').length === 0 && (
                  <p className="text-gray-500 text-sm">Nenhum administrador encontrado</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 pb-20 md:pb-0">
          {/* Export buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Exportar Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-2">
                <Button
                  onClick={() => exportToPDF('monthly')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Relatório Mensal</span>
                  <span className="sm:hidden">Mensal</span>
                </Button>
                <Button
                  onClick={() => exportToPDF('quarterly')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Relatório Trimestral</span>
                  <span className="sm:hidden">Trimestral</span>
                </Button>
                <Button
                  onClick={() => exportToPDF('annual')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Relatório Anual</span>
                  <span className="sm:hidden">Anual</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Distribuição de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Usuários Free:</span>
                    <span className="font-bold">{freeUsers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Usuários Basic:</span>
                    <span className="font-bold text-green-600">{basicUsers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Usuários Premium:</span>
                    <span className="font-bold text-blue-600">{premiumUsers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Usuários Enterprise:</span>
                    <span className="font-bold text-yellow-600">{enterpriseUsers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Usuários Banidos:</span>
                    <span className="font-bold text-red-600">{bannedUsers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Total de Usuários:</span>
                    <span className="font-bold">{analytics?.overview?.totalUsers || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Usuários Ativos:</span>
                    <span className="font-bold text-green-600">{analytics?.overview?.activeUsers || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxa de Conversão:</span>
                    <span className="font-bold text-blue-600">
                      {analytics?.overview?.totalUsers > 0 
                        ? ((premiumUsers + basicUsers + enterpriseUsers) / analytics.overview.totalUsers * 100).toFixed(1)
                        : 0
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Receita Estimada:</span>
                    <span className="font-bold text-purple-600">
                      R$ {(analytics?.overview?.totalRevenue || 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

};

export default AdminPanel;
