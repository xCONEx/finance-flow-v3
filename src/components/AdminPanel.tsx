
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
  Shield,
  Users,
  Building2,
  DollarSign,
  Activity,
  CheckCircle,
  TrendingUp,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { subscriptionService } from '@/services/subscriptionService';

const AdminPanel = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Verificar se o usuário atual é admin
  const isCurrentUserAdmin = user?.email === 'yuriadrskt@gmail.com' || user?.email === 'adm.financeflow@gmail.com';

  useEffect(() => {
    if (isCurrentUserAdmin) {
      loadData();
    }
  }, [isCurrentUserAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os usuários
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(profilesData || []);
      
      // Analytics básicos
      const totalUsers = profilesData?.length || 0;
      const freeUsers = profilesData?.filter(u => !u.subscription || u.subscription === 'free').length || 0;
      const premiumUsers = profilesData?.filter(u => u.subscription === 'premium').length || 0;
      const basicUsers = profilesData?.filter(u => u.subscription === 'basic').length || 0;
      const enterpriseUsers = profilesData?.filter(u => u.subscription === 'enterprise' || u.subscription === 'enterprise-annual').length || 0;
      
      setAnalytics({
        overview: {
          totalUsers,
          totalAgencias: 0, // TODO: implementar quando necessário
          totalRevenue: 0, // TODO: implementar quando necessário
          activeUsers: totalUsers
        },
        userStats: {
          freeUsers,
          premiumUsers,
          basicUsers,
          enterpriseUsers
        }
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserField = async (userId, field, value) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, [field]: value } : u));
      toast({ 
        title: 'Sucesso', 
        description: `Campo ${field} atualizado com sucesso` 
      });
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast({ 
        title: 'Erro', 
        description: 'Erro ao atualizar campo', 
        variant: 'destructive' 
      });
    }
  };

  const handleUpdateSubscription = async (userId, newPlan) => {
    try {
      // Criar dados de assinatura para o novo plano
      const subscriptionData = {
        plan: newPlan,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        payment_provider: 'manual_admin',
        amount: newPlan === 'basic' ? 29 : newPlan === 'premium' ? 49 : newPlan === 'enterprise' ? 99 : 0,
        currency: 'BRL'
      };

      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription: newPlan,
          subscription_data: subscriptionData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { 
        ...u, 
        subscription: newPlan,
        subscription_data: subscriptionData
      } : u));
      
      toast({ 
        title: 'Sucesso', 
        description: `Plano atualizado para ${newPlan} manualmente` 
      });
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      toast({ 
        title: 'Erro', 
        description: 'Erro ao atualizar plano', 
        variant: 'destructive' 
      });
    }
  };

  const handleBanUser = async (userId, banned) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ banned, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, banned } : u));
      toast({ 
        title: 'Sucesso', 
        description: banned ? 'Usuário banido' : 'Usuário desbanido' 
      });
    } catch (error) {
      console.error('Erro ao banir/desbanir:', error);
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
    loadData();
  };

  const filteredUsers = users.filter(user => {
    const email = user?.email || '';
    const matchesSearch = email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = userTypeFilter === 'all' ? true : user.user_type === userTypeFilter;
    return matchesSearch && matchesFilter;
  });

  if (!isCurrentUserAdmin) {
    return (
      <div className="text-center p-8">
        <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-600">Acesso Negado</h2>
        <p className="text-gray-600">Você não tem permissão para acessar este painel.</p>
      </div>
    );
  }

  const freeUsers = analytics?.userStats?.freeUsers || 0;
  const premiumUsers = analytics?.userStats?.premiumUsers || 0;
  const basicUsers = analytics?.userStats?.basicUsers || 0;
  const enterpriseUsers = analytics?.userStats?.enterpriseUsers || 0;

  return (
    <div className="space-y-6 p-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Shield className="text-purple-600" />
          Painel Administrativo
        </h2>
        <p className="text-gray-600">Gestão completa da plataforma</p>
      </div>

      {/* Analytics do Topo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold">{analytics?.overview?.totalUsers || 0}</p>
            <p className="text-sm text-gray-600">Usuários Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold">{analytics?.overview?.totalAgencias || 0}</p>
            <p className="text-sm text-gray-600">Agências</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold">R$ 0,00</p>
            <p className="text-sm text-gray-600">Receita Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <p className="text-2xl font-bold">{analytics?.overview?.activeUsers || 0}</p>
            <p className="text-sm text-gray-600">Usuários Ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas por Plano */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-gray-600 mb-2" />
            <p className="text-2xl font-bold text-gray-700">{freeUsers}</p>
            <p className="text-sm text-gray-600">Usuários Free</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-700">{basicUsers}</p>
            <p className="text-sm text-gray-600">Usuários Basic</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-700">{premiumUsers}</p>
            <p className="text-sm text-gray-600">Usuários Premium</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-2xl font-bold text-yellow-700">{enterpriseUsers}</p>
            <p className="text-sm text-gray-600">Usuários Enterprise</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="admins">Administradores</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* USERS */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filtro de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  placeholder="Buscar por email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="company_owner">Company Owner</SelectItem>
                    <SelectItem value="employee">Colaborador</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-4 space-y-2">
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-gray-600">UID: {user.id}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant={user.banned ? "destructive" : "secondary"}>
                  {user.banned ? "Banido" : "Ativo"}
                </Badge>
                <Badge variant="outline">{user.subscription || 'free'}</Badge>
                <Badge variant="outline">{user.user_type || 'individual'}</Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Select onValueChange={(value) => handleUpdateSubscription(user.id, value)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder={`Plano: ${user.subscription || 'free'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Gratuito</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="enterprise-annual">Enterprise Anual</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => handleUpdateUserField(user.id, 'user_type', value)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder={`Tipo: ${user.user_type || 'individual'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="company_owner">Company Owner</SelectItem>
                    <SelectItem value="employee">Colaborador</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={user.banned ? "outline" : "destructive"}
                  size="sm"
                  onClick={() => handleBanUser(user.id, !user.banned)}
                >
                  {user.banned ? "Desbanir" : "Banir"}
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* ADMINS */}
        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Administradores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Email do novo admin"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
                <Button onClick={handleAddAdmin}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Admin
                </Button>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                {users.filter(u => u.user_type === 'admin').map(admin => (
                  <div key={admin.id} className="flex justify-between items-center">
                    <span>{admin.email}</span>
                    <Badge>Admin</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS SIMPLES */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Usuários Free:</span>
                    <span className="font-bold">{freeUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usuários Basic:</span>
                    <span className="font-bold text-green-600">{basicUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usuários Premium:</span>
                    <span className="font-bold text-blue-600">{premiumUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usuários Enterprise:</span>
                    <span className="font-bold text-yellow-600">{enterpriseUsers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total de Usuários:</span>
                    <span className="font-bold">{analytics?.overview?.totalUsers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usuários Ativos:</span>
                    <span className="font-bold text-green-600">{analytics?.overview?.activeUsers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Conversão:</span>
                    <span className="font-bold text-blue-600">
                      {analytics?.overview?.totalUsers > 0 
                        ? ((premiumUsers + basicUsers + enterpriseUsers) / analytics.overview.totalUsers * 100).toFixed(1)
                        : 0
                      }%
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
