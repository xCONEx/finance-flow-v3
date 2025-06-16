import React, { useEffect, useState } from 'react';
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
  Ban,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise' | 'enterprise-annual';

interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  company?: string | null;
  subscription?: SubscriptionPlan | null;
  user_type?: string | null;
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
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Lista de admins autorizados - HARD CODED para garantir acesso
  const authorizedAdmins = ['yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'];
  
  // Verificar se o usuário atual é admin autorizado
  const isCurrentUserAdmin = user?.email && authorizedAdmins.includes(user.email);

  useEffect(() => {
    if (isCurrentUserAdmin) {
      loadData();
    }
  }, [isCurrentUserAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Admin carregando dados diretamente da tabela profiles...');
      console.log('👤 Usuário atual:', user?.email);
      
      // Tentar buscar profiles diretamente da tabela
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar profiles diretamente:', error);
        
        // Se falhar, tentar buscar pelo menos o próprio usuário
        if (user?.id) {
          const { data: ownProfile, error: ownError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!ownError && ownProfile) {
            setUsers([ownProfile]);
            console.log('✅ Carregado perfil próprio apenas');
          }
        }
        
        throw error;
      }

      console.log('✅ Dados carregados diretamente:', profilesData?.length || 0, 'usuários');
      const users = profilesData || [];
      setUsers(users);

      // Definir informações de debug
      setDebugInfo({
        userEmail: user?.email,
        userId: user?.id,
        isAuthorized: isCurrentUserAdmin,
        profilesCount: users.length,
        timestamp: new Date().toISOString(),
        method: 'Direct Table Access'
      });

      // Calcular analytics
      const totalUsers = users.length;
      const freeUsers = users.filter(u => !u.subscription || u.subscription === 'free').length;
      const premiumUsers = users.filter(u => u.subscription === 'premium').length;
      const basicUsers = users.filter(u => u.subscription === 'basic').length;
      const enterpriseUsers = users.filter(u => u.subscription === 'enterprise').length;
      const enterpriseAnnualUsers = users.filter(u => u.subscription === 'enterprise-annual').length;
      const bannedUsers = users.filter(u => u.banned).length;
      
      setAnalytics({
        overview: {
          totalUsers,
          totalAgencias: 0,
          totalRevenue: (basicUsers * 29) + (premiumUsers * 59.90) + (enterpriseUsers * 199) + (enterpriseAnnualUsers * 1990),
          activeUsers: totalUsers - bannedUsers
        },
        userStats: {
          freeUsers,
          premiumUsers,
          basicUsers,
          enterpriseUsers,
          enterpriseAnnualUsers,
          bannedUsers
        }
      });

      console.log('📊 Analytics calculados:', {
        totalUsers,
        freeUsers,
        premiumUsers,
        basicUsers,
        enterpriseUsers,
        enterpriseAnnualUsers,
        bannedUsers
      });

    } catch (error: any) {
      console.error('❌ Erro ao carregar dados:', error);
      setDebugInfo({
        userEmail: user?.email,
        userId: user?.id,
        error: error.message,
        timestamp: new Date().toISOString(),
        method: 'Failed Direct Access'
      });
      
      toast({
        title: 'Erro ao carregar dados',
        description: 'Tentando acesso direto à tabela profiles. Verifique as permissões.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserField = async (userId: string, field: string, value: any) => {
    try {
      console.log(`🔄 Atualizando ${field} para usuário ${userId}:`, value);
      
      const updateData = { [field]: value };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('❌ Erro ao atualizar via update direto:', error);
        throw error;
      }

      setUsers(users.map(u => u.id === userId ? { ...u, [field]: value } : u));
      toast({ 
        title: 'Sucesso', 
        description: `${field} atualizado com sucesso` 
      });
    } catch (error: any) {
      console.error('❌ Erro ao atualizar:', error);
      toast({ 
        title: 'Erro', 
        description: 'Erro ao atualizar campo', 
        variant: 'destructive' 
      });
    }
  };

  const handleUpdateSubscription = async (userId: string, newPlan: string) => {
    try {
      const validPlan = newPlan as SubscriptionPlan;
      
      const subscriptionData = {
        plan: validPlan,
        status: 'active' as const,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_provider: 'manual_admin',
        amount: validPlan === 'basic' ? 29 : validPlan === 'premium' ? 59.90 : validPlan === 'enterprise' ? 199 : validPlan === 'enterprise-annual' ? 1990 : 0,
        currency: 'BRL'
      };

      const updateData = {
        subscription: validPlan,
        subscription_data: subscriptionData
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { 
        ...u, 
        subscription: validPlan,
        subscription_data: subscriptionData
      } : u));
      
      toast({ 
        title: 'Sucesso', 
        description: `Plano atualizado para ${validPlan}` 
      });
      await loadData();
    } catch (error: any) {
      console.error('❌ Erro ao atualizar assinatura:', error);
      toast({ 
        title: 'Erro', 
        description: 'Erro ao atualizar plano', 
        variant: 'destructive' 
      });
    }
  };

  const handleBanUser = async (userId: string, banned: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ banned })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, banned } : u));
      toast({ 
        title: 'Sucesso', 
        description: banned ? 'Usuário banido' : 'Usuário desbanido' 
      });
      await loadData();
    } catch (error: any) {
      console.error('❌ Erro ao banir/desbanir:', error);
      toast({ 
        title: 'Erro', 
        description: 'Erro ao banir/desbanir usuário', 
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
    await loadData();
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
        <p className="text-xs text-gray-500 mt-2">Apenas emails autorizados podem acessar esta área.</p>
        <p className="text-xs text-blue-500 mt-2">Email atual: {user?.email}</p>
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

  const { freeUsers = 0, premiumUsers = 0, basicUsers = 0, enterpriseUsers = 0, enterpriseAnnualUsers = 0, bannedUsers = 0 } = analytics?.userStats || {};

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
          <Shield className="text-purple-600 h-6 w-6 md:h-8 md:w-8" />
          Painel Administrativo
        </h2>
        <p className="text-sm md:text-base text-gray-600">Gestão completa da plataforma</p>
        {user?.email === 'yuriadrskt@gmail.com' && (
          <p className="text-xs text-green-600 font-medium">👑 Acesso de Super Admin Ativo</p>
        )}
      </div>

      {/* Debug Info Card */}
      {debugInfo && (
        <Card className={debugInfo.error ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {debugInfo.error ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Status do Sistema - Acesso Direto
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Status do Sistema - Funcionando
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p><strong>Email:</strong> {debugInfo.userEmail}</p>
              <p><strong>User ID:</strong> {debugInfo.userId}</p>
              <p><strong>É Admin Autorizado:</strong> {debugInfo.isAuthorized ? 'Sim' : 'Não'}</p>
              <p><strong>Usuários Carregados:</strong> {debugInfo.profilesCount}</p>
              <p><strong>Método:</strong> <span className={debugInfo.error ? "text-red-600" : "text-green-600"}>{debugInfo.method}</span></p>
              {debugInfo.error && (
                <p><strong>Erro:</strong> <span className="text-red-600">{debugInfo.error}</span></p>
              )}
              <p><strong>Timestamp:</strong> {new Date(debugInfo.timestamp).toLocaleString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>
      )}

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
            <DollarSign className="h-6 w-6 md:h-8 md:w-8 mx-auto text-green-600 mb-2" />
            <p className="text-lg md:text-2xl font-bold">R$ {analytics?.overview?.totalRevenue || 0}</p>
            <p className="text-xs md:text-sm text-gray-600">Receita</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <Ban className="h-6 w-6 md:h-8 md:w-8 mx-auto text-red-600 mb-2" />
            <p className="text-lg md:text-2xl font-bold">{bannedUsers}</p>
            <p className="text-xs md:text-sm text-gray-600">Banidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Planos - Grid responsivo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
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

        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <Building2 className="h-6 w-6 md:h-8 md:w-8 mx-auto text-purple-600 mb-2" />
            <p className="text-lg md:text-2xl font-bold text-purple-700">{enterpriseAnnualUsers}</p>
            <p className="text-xs md:text-sm text-gray-600">Enterprise Anual</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-2 w-full">
          <TabsTrigger value="users" className="text-xs md:text-sm">Usuários</TabsTrigger>
          <TabsTrigger value="admins" className="text-xs md:text-sm">Administradores</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs md:text-sm">Analytics</TabsTrigger>
        </TabsList>

        {/* USERS */}
        <TabsContent value="users" className="space-y-4">
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

          {/* Tabela responsiva */}
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
                      <TableHead className="min-w-[200px]">Ações</TableHead>
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
                            onValueChange={(value) => handleUpdateSubscription(user.id, value)}
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
                            onValueChange={(value) => handleUpdateUserField(user.id, 'user_type', value)}
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
                          <div className="flex flex-col md:flex-row gap-1 md:gap-2">
                            <Button
                              variant={user.banned ? "outline" : "destructive"}
                              size="sm"
                              onClick={() => handleBanUser(user.id, !user.banned)}
                              className="text-xs"
                            >
                              {user.banned ? (
                                <>
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Desbanir
                                </>
                              ) : (
                                <>
                                  <Ban className="h-3 w-3 mr-1" />
                                  Banir
                                </>
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

        {/* ADMINS */}
        <TabsContent value="admins" className="space-y-4">
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

              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm md:text-base text-green-600">Super Admins Autorizados:</h4>
                {authorizedAdmins.map(email => (
                  <div key={email} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <span className="text-sm font-medium">{email}</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">Super Admin</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="space-y-4">
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
                    <span>Usuários Enterprise Anual:</span>
                    <span className="font-bold text-purple-600">{enterpriseAnnualUsers}</span>
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
                        ? ((premiumUsers + basicUsers + enterpriseUsers + enterpriseAnnualUsers) / analytics.overview.totalUsers * 100).toFixed(1)
                        : 0
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Receita Estimada:</span>
                    <span className="font-bold text-purple-600">
                      R$ {((basicUsers * 29) + (premiumUsers * 59.90) + (enterpriseUsers * 199) + (enterpriseAnnualUsers * 1990)).toLocaleString('pt-BR')}
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
