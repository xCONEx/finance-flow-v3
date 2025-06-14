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
import { firestoreService } from '../services/firestore';
import { formatCurrency } from '../utils/formatters';

const AdminPanel = () => {
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allUsers, analyticsData] = await Promise.all([
        firestoreService.getAllUsers(),
        firestoreService.getAnalyticsData()
      ]);
      setUsers(allUsers);
      setAnalytics(analyticsData);
    } catch (error) {
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
      await firestoreService.updateUserField(userId, field, value);
      setUsers(users.map(u => u.id === userId ? { ...u, [field]: value } : u));
      toast({ title: 'Sucesso', description: 'Atualizado com sucesso' });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  const handleBanUser = async (userId, banned) => {
    try {
      await firestoreService.banUser(userId, banned);
      setUsers(users.map(u => u.id === userId ? { ...u, banned } : u));
    } catch {
      toast({ title: 'Erro', description: 'Erro ao banir/desbanir', variant: 'destructive' });
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail) return;
    const user = users.find(u => u.email === newAdminEmail);
    if (!user) {
      toast({ title: 'Erro', description: 'Usuário não encontrado', variant: 'destructive' });
      return;
    }
    await handleUpdateUserField(user.id, 'userType', 'admin');
    setNewAdminEmail('');
    loadData();
  };

  const filteredUsers = users.filter(user => {
    const email = user?.email || '';
    const matchesSearch = email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = userTypeFilter === 'all' ? true : user.userType === userTypeFilter;
    return matchesSearch && matchesFilter;
  });

  const freeUsers = users.filter(u => !u.subscription || u.subscription === 'free').length;
  const premiumUsers = users.filter(u => u.subscription === 'premium').length;
  const enterpriseUsers = users.filter(u => u.subscription === 'enterprise').length;

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
            <p className="text-2xl font-bold">{formatCurrency(analytics?.overview?.totalRevenue || 0)}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-gray-600 mb-2" />
            <p className="text-2xl font-bold text-gray-700">{freeUsers}</p>
            <p className="text-sm text-gray-600">Usuários Free</p>
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
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="admins">Administradores</TabsTrigger>
          <TabsTrigger value="agencias">Agências</TabsTrigger>
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
                <p className="text-sm text-gray-600">UID: {user.uid}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant={user.banned ? "destructive" : "secondary"}>
                  {user.banned ? "Banido" : "Ativo"}
                </Badge>
                <Badge variant="outline">{user.subscription || 'free'}</Badge>
                <Badge variant="outline">{user.userType || 'individual'}</Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Select onValueChange={(value) => handleUpdateUserField(user.id, 'subscription', value)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Gratuito</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => handleUpdateUserField(user.id, 'userType', value)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Tipo" />
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
                {users.filter(u => u.userType === 'admin').map(admin => (
                  <div key={admin.id} className="flex justify-between items-center">
                    <span>{admin.email}</span>
                    <Badge>Admin</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS COMPLETO */}
        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Taxa de Conversão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      {analytics.userStats.conversionRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500">Free → Premium</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Aprovação de Jobs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">
                      {analytics.businessStats.jobApprovalRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500">Jobs aprovados</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Produtividade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-purple-600">
                      {analytics.productivity.taskCompletionRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Tarefas concluídas</p>
                  </CardContent>
                </Card>
              </div>

              {/* Distribuição de Usuários */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{analytics.userStats.userTypes.individual}</p>
                      <p className="text-sm text-gray-600">Individuais</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{analytics.userStats.userTypes.company_owner}</p>
                      <p className="text-sm text-gray-600">Donos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{analytics.userStats.userTypes.employee}</p>
                      <p className="text-sm text-gray-600">Colaboradores</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{analytics.userStats.userTypes.admin}</p>
                      <p className="text-sm text-gray-600">Admins</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas de Jobs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Estatísticas de Jobs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total de Jobs:</span>
                      <span className="font-bold">{analytics.businessStats.totalJobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jobs Aprovados:</span>
                      <span className="font-bold text-green-600">{analytics.businessStats.approvedJobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jobs Pendentes:</span>
                      <span className="font-bold text-orange-600">{analytics.businessStats.pendingJobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor Médio por Job:</span>
                      <span className="font-bold">{formatCurrency(analytics.businessStats.averageJobValue)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Atividade Recente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Novos Usuários (mês):</span>
                      <span className="font-bold text-blue-600">{analytics.recentActivity.newUsersThisMonth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Novas Empresas (mês):</span>
                      <span className="font-bold text-green-600">{analytics.recentActivity.newCompaniesThisMonth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Novos Jobs (mês):</span>
                      <span className="font-bold text-purple-600">{analytics.recentActivity.newJobsThisMonth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tasks/Usuário:</span>
                      <span className="font-bold">{analytics.productivity.averageTasksPerUser.toFixed(1)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
