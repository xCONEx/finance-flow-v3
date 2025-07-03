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
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  Webhook,
  Play,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import CompanyManagement from './CompanyManagement';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
  
  // Webhook test states
  const [webhookTestOpen, setWebhookTestOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'cakto' | 'kiwify'>('cakto');
  const [selectedEvent, setSelectedEvent] = useState('payment.success');
  const [testEmail, setTestEmail] = useState('');
  const [testPlanId, setTestPlanId] = useState('yppzpjc');
  const [testAmount, setTestAmount] = useState('2990');
  const [webhookResponse, setWebhookResponse] = useState<any>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

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

      // Create blob and download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-admin-${period}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Relatório Exportado',
        description: `Relatório ${period} baixado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao exportar relatório.',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateUserField = async (userId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, [field]: value } : user
      ));

      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar usuário: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  };

  const handleUpdateSubscription = async (userId: string, newPlan: SubscriptionPlan) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription: newPlan, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, subscription: newPlan } : user
      ));

      toast({
        title: 'Sucesso',
        description: 'Plano atualizado com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao atualizar plano:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar plano: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  };

  const handleBanUser = async (userId: string, banned: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          banned, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, banned } : user
      ));

      toast({
        title: 'Sucesso',
        description: `Usuário ${banned ? 'banido' : 'desbanido'} com sucesso.`,
      });
    } catch (error: any) {
      console.error('Erro ao banir/desbanir usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status do usuário: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive'
      });
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um email válido.',
        variant: 'destructive'
      });
      return;
    }

    const targetUser = users.find(u => u.email === newAdminEmail);
    if (!targetUser) {
      toast({
        title: 'Erro',
        description: 'Usuário não encontrado.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await handleUpdateUserField(targetUser.id, 'user_type', 'admin');
      setNewAdminEmail('');
      toast({
        title: 'Sucesso',
        description: 'Administrador adicionado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao adicionar admin:', error);
    }
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

  // Webhook test functions
  const testWebhook = async () => {
    if (!testEmail.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um email válido para teste.',
        variant: 'destructive'
      });
      return;
    }

    setIsTestingWebhook(true);
    setWebhookResponse(null);

    try {
      // URLs corretas para Supabase Edge Functions
      const webhookUrl = selectedProvider === 'cakto' 
        ? 'https://elsilxqruurrbdebxndx.supabase.co/functions/v1/cakto-webhook'
        : 'https://elsilxqruurrbdebxndx.supabase.co/functions/v1/kiwify-webhook';

      const testPayload = {
        event: selectedEvent,
        data: {
          id: `test_${Date.now()}`,
          status: 'success',
          plan_id: testPlanId,
          customer_email: testEmail,
          amount: parseInt(testAmount),
          currency: 'BRL',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      console.log('🔗 Testando webhook:', webhookUrl);
      console.log('📦 Payload:', testPayload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-key': selectedProvider === 'cakto' 
            ? '27a5317b-248f-47e8-9c4b-70aff176e556'
            : 'v4x4jy8w3lf',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(testPayload)
      });

      console.log('📡 Response status:', response.status);
      
      let responseData;
      const responseText = await response.text();
      
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse da resposta:', responseText);
        responseData = { error: 'Resposta não é JSON válido', raw: responseText };
      }

      setWebhookResponse({
        status: response.status,
        data: responseData,
        payload: testPayload,
        url: webhookUrl
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: `Webhook ${selectedProvider} testado com sucesso!`,
        });
      } else {
        toast({
          title: 'Erro',
          description: `Erro no webhook: ${responseData.error || 'Erro desconhecido'}`,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('❌ Erro ao testar webhook:', error);
      setWebhookResponse({
        error: error.message,
        status: 'error'
      });
      toast({
        title: 'Erro',
        description: 'Erro ao testar webhook: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const getPlanMapping = (provider: 'cakto' | 'kiwify') => {
    if (provider === 'cakto') {
      return {
        'yppzpjc': 'Basic (R$ 29,90)',
        'kesq5cb': 'Premium (R$ 49,90)',
        '34p727v': 'Enterprise (R$ 99,90)',
        'uoxtt9o': 'Enterprise Anual (R$ 1.990,00)'
      };
    } else {
      return {
        'jtksckF': 'Basic (R$ 29,90)',
        'kTs280h': 'Premium (R$ 49,90)',
        'iuQVR8a': 'Enterprise (R$ 99,90)',
        'CjaLdBJ': 'Enterprise Anual (R$ 1.990,00)'
      };
    }
  };

  if (!isCurrentUserAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">Você não tem permissão para acessar este painel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { freeUsers = 0, premiumUsers = 0, basicUsers = 0, enterpriseUsers = 0, bannedUsers = 0 } = analytics?.userStats || {};

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2 text-foreground">
            <Shield className="text-purple-600 h-6 w-6 sm:h-8 sm:w-8" />
            Painel Administrativo
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gestão completa da plataforma</p>
        </div>

        {/* Analytics Cards - Mobile First Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                  <p className="text-2xl font-bold">{analytics?.overview?.totalUsers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                  <p className="text-2xl font-bold">{analytics?.overview?.activeUsers || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold">R$ {analytics?.overview?.totalRevenue || 0}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuários Banidos</p>
                  <p className="text-2xl font-bold">{analytics?.userStats?.bannedUsers || 0}</p>
                </div>
                <Ban className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <div className="relative">
            {/* Mobile: barra fixa para os botões de navegação */}
            <div className="sm:hidden fixed bottom-16 left-0 w-full z-30 bg-background border-t border-border shadow-md flex overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
              <TabsList className="flex w-full justify-between px-2 py-1 gap-1">
                <TabsTrigger value="users" className="flex flex-col items-center flex-1 min-w-[60px] py-2 px-1 text-xs">
                  <Users className="h-5 w-5 mb-1" />
                  Usuários
                </TabsTrigger>
                <TabsTrigger value="companies" className="flex flex-col items-center flex-1 min-w-[60px] py-2 px-1 text-xs">
                  <Building2 className="h-5 w-5 mb-1" />
                  Empresas
                </TabsTrigger>
                <TabsTrigger value="admins" className="flex flex-col items-center flex-1 min-w-[60px] py-2 px-1 text-xs">
                  <ShieldCheck className="h-5 w-5 mb-1" />
                  Admins
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex flex-col items-center flex-1 min-w-[60px] py-2 px-1 text-xs">
                  <BarChart className="h-5 w-5 mb-1" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="webhooks" className="flex flex-col items-center flex-1 min-w-[60px] py-2 px-1 text-xs">
                  <Webhook className="h-5 w-5 mb-1" />
                  Webhooks
                </TabsTrigger>
              </TabsList>
            </div>
            {/* Desktop: grid normal */}
            <div className="hidden sm:block">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Usuários</span>
                </TabsTrigger>
                <TabsTrigger value="companies" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Empresas</span>
                </TabsTrigger>
                <TabsTrigger value="admins" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Admins</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="webhooks" className="flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  <span className="hidden sm:inline">Webhooks</span>
                </TabsTrigger>
              </TabsList>
            </div>
            {/* Conteúdo das abas */}
            <div className="pt-4 sm:pt-0">
              {/* USERS TAB */}
              <TabsContent value="users" className="space-y-4">
                {/* Filtros - Mobile First */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Filtros
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Buscar por email ou nome..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo de usuário" />
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
                        <SelectTrigger>
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

                {/* Users List - Mobile First Cards */}
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-muted-foreground" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">{user.email}</p>
                                {user.name && (
                                  <p className="text-sm text-muted-foreground truncate">{user.name}</p>
                                )}
                                <p className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </div>

                          {/* Status and Actions */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <Badge variant={user.banned ? "destructive" : "secondary"} className="text-xs">
                              {user.banned ? "Banido" : "Ativo"}
                            </Badge>
                            
                            <div className="flex items-center gap-1">
                              <Select 
                                value={user.subscription || 'free'} 
                                onValueChange={(value: SubscriptionPlan) => handleUpdateSubscription(user.id, value)}
                              >
                                <SelectTrigger className="w-24 sm:w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="basic">Basic</SelectItem>
                                  <SelectItem value="premium">Premium</SelectItem>
                                  <SelectItem value="enterprise">Enterprise</SelectItem>
                                  <SelectItem value="enterprise-annual">Enterprise Anual</SelectItem>
                                </SelectContent>
                              </Select>

                              <Select 
                                value={user.user_type || 'individual'} 
                                onValueChange={(value: UserType) => handleUpdateUserField(user.id, 'user_type', value)}
                              >
                                <SelectTrigger className="w-24 sm:w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="individual">Individual</SelectItem>
                                  <SelectItem value="company_owner">Company Owner</SelectItem>
                                  <SelectItem value="employee">Colaborador</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleBanUser(user.id, !user.banned)}
                                    className="flex items-center gap-2"
                                  >
                                    {user.banned ? (
                                      <>
                                        <UserCheck className="h-4 w-4" />
                                        Desbanir
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="h-4 w-4" />
                                        Banir
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredUsers.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* COMPANIES TAB */}
              <TabsContent value="companies" className="space-y-4">
                <CompanyManagement />
              </TabsContent>

              {/* ADMINS TAB */}
              <TabsContent value="admins" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5" />
                      Gerenciar Administradores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        placeholder="Email do novo admin"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleAddAdmin} className="sm:w-auto">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Adicionar Admin
                      </Button>
                    </div>

                    <div className="border rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-base">Administradores Atuais:</h4>
                      {users.filter(u => u.user_type === 'admin').map(admin => (
                        <div key={admin.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b last:border-b-0 gap-2">
                          <div>
                            <span className="text-sm font-medium text-foreground">{admin.email}</span>
                            {admin.name && (
                              <p className="text-xs text-muted-foreground">{admin.name}</p>
                            )}
                          </div>
                          <Badge>Admin</Badge>
                        </div>
                      ))}
                      {users.filter(u => u.user_type === 'admin').length === 0 && (
                        <p className="text-muted-foreground text-sm">Nenhum administrador encontrado</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ANALYTICS TAB */}
              <TabsContent value="analytics" className="space-y-4">
                {/* Export buttons */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Exportar Relatórios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-2">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Distribuição de Usuários</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">Usuários Free:</span>
                          <span className="font-bold text-foreground">{freeUsers}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">Usuários Basic:</span>
                          <span className="font-bold text-green-600">{basicUsers}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">Usuários Premium:</span>
                          <span className="font-bold text-blue-600">{premiumUsers}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">Usuários Enterprise:</span>
                          <span className="font-bold text-yellow-600">{enterpriseUsers}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">Usuários Banidos:</span>
                          <span className="font-bold text-red-600">{bannedUsers}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações Gerais</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">Total de Usuários:</span>
                          <span className="font-bold text-foreground">{analytics?.overview?.totalUsers || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">Usuários Ativos:</span>
                          <span className="font-bold text-green-600">{analytics?.overview?.activeUsers || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">Taxa de Conversão:</span>
                          <span className="font-bold text-blue-600">
                            {analytics?.overview?.totalUsers > 0 
                              ? ((premiumUsers + basicUsers + enterpriseUsers) / analytics.overview.totalUsers * 100).toFixed(1)
                              : 0
                            }%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">Receita Estimada:</span>
                          <span className="font-bold text-purple-600">
                            R$ {(analytics?.overview?.totalRevenue || 0).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* WEBHOOKS TAB */}
              <TabsContent value="webhooks" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Webhook className="h-5 w-5" />
                      Teste de Webhooks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="provider">Provedor de Pagamento</Label>
                          <Select value={selectedProvider} onValueChange={(value: 'cakto' | 'kiwify') => setSelectedProvider(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cakto">Cakto</SelectItem>
                              <SelectItem value="kiwify">Kiwify</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="event">Tipo de Evento</Label>
                          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="payment.success">Pagamento Sucesso</SelectItem>
                              <SelectItem value="subscription.activated">Assinatura Ativada</SelectItem>
                              <SelectItem value="subscription.renewed">Assinatura Renovada</SelectItem>
                              <SelectItem value="payment.failed">Pagamento Falhou</SelectItem>
                              <SelectItem value="subscription.cancelled">Assinatura Cancelada</SelectItem>
                              <SelectItem value="subscription.expired">Assinatura Expirada</SelectItem>
                              <SelectItem value="subscription.trial_started">Trial Iniciado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="email">Email do Usuário</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="usuario@exemplo.com"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="plan">Plano</Label>
                          <Select value={testPlanId} onValueChange={setTestPlanId}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(getPlanMapping(selectedProvider)).map(([id, name]) => (
                                <SelectItem key={id} value={id}>{name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="amount">Valor (em centavos)</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="2990"
                            value={testAmount}
                            onChange={(e) => setTestAmount(e.target.value)}
                          />
                        </div>

                        <Button 
                          onClick={testWebhook} 
                          disabled={isTestingWebhook}
                          className="w-full"
                        >
                          {isTestingWebhook ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Testando...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Testar Webhook
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label>Resposta do Webhook</Label>
                          <div className="border rounded-md p-4 bg-muted/50 min-h-[200px] max-h-[400px] overflow-auto">
                            {webhookResponse ? (
                              <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(webhookResponse, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-muted-foreground text-sm">
                                Clique em "Testar Webhook" para ver a resposta...
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">URLs dos Webhooks:</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Cakto</Badge>
                              <code className="bg-muted px-2 py-1 rounded text-xs">
                                https://elsilxqruurrbdebxndx.supabase.co/functions/v1/cakto-webhook
                              </code>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Kiwify</Badge>
                              <code className="bg-muted px-2 py-1 rounded text-xs">
                                https://elsilxqruurrbdebxndx.supabase.co/functions/v1/kiwify-webhook
                              </code>
                            </div>
                          </div>
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            <strong>⚠️ Importante:</strong> Certifique-se de que as Edge Functions estão deployadas no Supabase:
                            <br />
                            <code className="bg-yellow-100 px-1 rounded">supabase functions deploy cakto-webhook</code>
                            <br />
                            <code className="bg-yellow-100 px-1 rounded">supabase functions deploy kiwify-webhook</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
