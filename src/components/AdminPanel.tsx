
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Building2, 
  Settings, 
  BarChart3, 
  UserPlus, 
  Shield, 
  Ban,
  Edit,
  Mail,
  Trash2,
  Plus,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  Activity,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { firestoreService } from '../services/firestore';
import { formatCurrency } from '../utils/formatters';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyOwnerEmail, setNewCompanyOwnerEmail] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [editingCompany, setEditingCompany] = useState(null);
  const [showCompanyMembers, setShowCompanyMembers] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Carregando dados do painel admin...');
      
      // Carregar todos os dados em paralelo
      const [usersData, companiesData, analyticsData] = await Promise.all([
        firestoreService.getAllUsers(),
        firestoreService.getAllCompanies(),
        firestoreService.getAnalyticsData()
      ]);
      
      setUsers(usersData);
      setCompanies(companiesData);
      setAnalytics(analyticsData);
      
      console.log('Dados carregados:', { 
        users: usersData.length, 
        companies: companiesData.length,
        analytics: !!analyticsData 
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do painel",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, banned) => {
    try {
      console.log(`${banned ? 'Banindo' : 'Desbanindo'} usuário:`, userId);
      await firestoreService.banUser(userId, banned);
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, banned } : user
      ));
      
      toast({
        title: "Sucesso",
        description: `Usuário ${banned ? 'banido' : 'desbanido'} com sucesso`
      });
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do usuário",
        variant: "destructive"
      });
    }
  };

  const handleUpdateUserType = async (userId, newUserType) => {
    try {
      console.log('Atualizando tipo de usuário:', userId, newUserType);
      await firestoreService.updateUserField(userId, 'userType', newUserType);
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, userType: newUserType } : user
      ));
      
      toast({
        title: "Sucesso",
        description: "Tipo de usuário atualizado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao atualizar tipo de usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar tipo de usuário",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSubscription = async (userId, newPlan) => {
    try {
      console.log('Atualizando plano do usuário:', userId, newPlan);
      await firestoreService.updateUserSubscription(userId, newPlan);
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, subscription: newPlan } : user
      ));
      
      toast({
        title: "Sucesso",
        description: "Plano atualizado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano",
        variant: "destructive"
      });
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName || !newCompanyOwnerEmail) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Criando empresa:', newCompanyName, newCompanyOwnerEmail);
      
      const owner = users.find(user => user.email === newCompanyOwnerEmail);
      if (!owner) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado",
          variant: "destructive"
        });
        return;
      }

      const companyData = {
        name: newCompanyName,
        ownerUID: owner.id,
        colaboradores: [{ uid: owner.id, email: owner.email, role: 'owner' }],
        equipments: [],
        expenses: [],
        jobs: [],
        createdAt: new Date().toISOString()
      };
      
      const companyId = await firestoreService.createCompany(companyData);
      
      await firestoreService.updateUserField(owner.id, 'userType', 'company_owner');
      await firestoreService.updateUserField(owner.id, 'companyId', companyId);
      
      setNewCompanyName('');
      setNewCompanyOwnerEmail('');
      await loadData();
      
      toast({
        title: "Sucesso",
        description: "Empresa criada com sucesso"
      });
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar empresa",
        variant: "destructive"
      });
    }
  };

  const handleEditCompany = async (companyId, newData) => {
    try {
      console.log('Editando empresa:', companyId, newData);
      await firestoreService.updateUserField(companyId, 'name', newData.name);
      
      setCompanies(companies.map(company => 
        company.id === companyId ? { ...company, ...newData } : company
      ));
      
      setEditingCompany(null);
      
      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso"
      });
    } catch (error) {
      console.error('Erro ao editar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao editar empresa",
        variant: "destructive"
      });
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail) {
      toast({
        title: "Erro",
        description: "Digite um email válido",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Adicionando administrador:', newAdminEmail);
      
      const user = users.find(u => u.email === newAdminEmail);
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado",
          variant: "destructive"
        });
        return;
      }
      
      await firestoreService.updateUserField(user.id, 'userType', 'admin');
      
      toast({
        title: "Sucesso",
        description: "Administrador adicionado com sucesso"
      });
      
      setNewAdminEmail('');
      await loadData();
    } catch (error) {
      console.error('Erro ao adicionar admin:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar administrador",
        variant: "destructive"
      });
    }
  };

  const toggleCompanyMembers = (companyId) => {
    setShowCompanyMembers(prev => ({
      ...prev,
      [companyId]: !prev[companyId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Shield className="text-purple-600" />
          Painel Administrativo
        </h2>
        <p className="text-gray-600">Gestão completa da plataforma FinanceFlow</p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <p className="text-2xl font-bold">{analytics?.overview?.totalCompanies || 0}</p>
            <p className="text-sm text-gray-600">Empresas</p>
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

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="companies">Empresas</TabsTrigger>
          <TabsTrigger value="admins">Administradores</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{user.email}</h4>
                      <p className="text-sm text-gray-600">UID: {user.uid}</p>
                      {user.personalInfo?.phone && (
                        <p className="text-sm text-gray-500">📞 {user.personalInfo.phone}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Badge variant={user.banned ? "destructive" : "secondary"}>
                          {user.banned ? "Banido" : "Ativo"}
                        </Badge>
                        <Badge variant="outline">{user.subscription || 'free'}</Badge>
                        <Badge variant="outline">{user.userType || 'individual'}</Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <Select onValueChange={(value) => handleUpdateSubscription(user.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Plano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Gratuito</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Empresarial</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select onValueChange={(value) => handleUpdateUserType(user.id, value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="company_owner">Company Owner</SelectItem>
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gestão de Empresas</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
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
                      <Label htmlFor="companyName">Nome da Empresa</Label>
                      <Input
                        id="companyName"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        placeholder="Digite o nome da empresa"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerEmail">Email do Proprietário</Label>
                      <Input
                        id="ownerEmail"
                        type="email"
                        value={newCompanyOwnerEmail}
                        onChange={(e) => setNewCompanyOwnerEmail(e.target.value)}
                        placeholder="Digite o email do proprietário"
                      />
                    </div>
                    <Button onClick={handleCreateCompany} className="w-full">
                      Criar Empresa
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {companies.map((company) => (
                  <div key={company.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-lg">{company.name}</h4>
                        <p className="text-sm text-gray-600">Owner UID: {company.ownerUID}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{company.plan || 'premium'}</Badge>
                          <Badge variant="secondary">{company.colaboradores?.length || 0} membros</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Empresa</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Nome da Empresa</Label>
                                <Input
                                  defaultValue={company.name}
                                  onChange={(e) => setEditingCompany({ ...company, name: e.target.value })}
                                />
                              </div>
                              <Button 
                                onClick={() => handleEditCompany(company.id, editingCompany)}
                                className="w-full"
                              >
                                Salvar Alterações
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleCompanyMembers(company.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {showCompanyMembers[company.id] && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <h5 className="font-medium mb-2">Membros da Equipe:</h5>
                        {company.colaboradores?.map((member, index) => (
                          <div key={index} className="flex justify-between items-center py-1">
                            <span className="text-sm">{member.email}</span>
                            <Badge variant="outline" size="sm">{member.role}</Badge>
                          </div>
                        )) || <p className="text-sm text-gray-500">Nenhum membro encontrado</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Email do novo administrador"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                  />
                  <Button onClick={handleAddAdmin}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Admin
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Administradores Atuais</h4>
                  <div className="space-y-2">
                    {users.filter(user => user.userType === 'admin').map(admin => (
                      <div key={admin.id} className="flex items-center justify-between">
                        <span>{admin.email}</span>
                        <Badge>Admin</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <>
              {/* KPIs Principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Taxa de Conversão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      {analytics.userStats.conversionRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500">Free para Premium</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Taxa de Aprovação de Jobs</CardTitle>
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
                    <p className="text-sm text-gray-500">Tarefas concluídas</p>
                  </CardContent>
                </Card>
              </div>

              {/* Estatísticas por Tipo de Usuário */}
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
                      <p className="text-sm text-gray-600">Donos de Empresa</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{analytics.userStats.userTypes.employee}</p>
                      <p className="text-sm text-gray-600">Colaboradores</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{analytics.userStats.userTypes.admin}</p>
                      <p className="text-sm text-gray-600">Administradores</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas de Negócio */}
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
                      <span>Taxa de Tarefas/Usuário:</span>
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
