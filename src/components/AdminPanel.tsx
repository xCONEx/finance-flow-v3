
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
  Ban,
  UserCheck,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise' | 'enterprise-annual';
type UserType = 'individual' | 'company_owner' | 'employee' | 'admin';

interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  subscription?: SubscriptionPlan | null;
  user_type?: UserType | null;
  banned?: boolean | null;
}

const AdminPanel = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
      
      // Buscar profiles diretamente da tabela
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('id, email, name, subscription, user_type, banned')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar profiles:', error);
        throw error;
      }

      console.log('✅ Dados carregados:', profilesData?.length || 0, 'usuários');
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
        description: 'Erro ao acessar a tabela profiles. Verifique as permissões.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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
    } catch (error: any) {
      console.error('❌ Erro ao atualizar assinatura:', error);
      toast({ 
        title: 'Erro', 
        description: 'Erro ao atualizar plano', 
        variant: 'destructive' 
      });
    }
  };

  const handleUpdateUserType = async (userId: string, newType: string) => {
    try {
      const validUserType = newType as UserType;
      
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: validUserType })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, user_type: validUserType } : u));
      toast({ 
        title: 'Sucesso', 
        description: `Tipo de usuário atualizado para ${validUserType}` 
      });
    } catch (error: any) {
      console.error('❌ Erro ao atualizar tipo de usuário:', error);
      toast({ 
        title: 'Erro', 
        description: 'Erro ao atualizar tipo de usuário', 
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
    } catch (error: any) {
      console.error('❌ Erro ao banir/desbanir:', error);
      toast({ 
        title: 'Erro', 
        description: 'Erro ao banir/desbanir usuário', 
        variant: 'destructive' 
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const email = user?.email || '';
    const name = user?.name || '';
    return email.toLowerCase().includes(searchQuery.toLowerCase()) || 
           name.toLowerCase().includes(searchQuery.toLowerCase());
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

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
          <Shield className="text-purple-600 h-6 w-6 md:h-8 md:w-8" />
          Painel Administrativo
        </h2>
        <p className="text-sm md:text-base text-gray-600">Gestão de usuários</p>
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
                  Status do Sistema - Erro
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

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-sm text-gray-600">Total de Usuários</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold">{users.filter(u => !u.banned).length}</p>
            <p className="text-sm text-gray-600">Usuários Ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Ban className="h-8 w-8 mx-auto text-red-600 mb-2" />
            <p className="text-2xl font-bold">{users.filter(u => u.banned).length}</p>
            <p className="text-sm text-gray-600">Usuários Banidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtro de Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Buscar Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por email ou nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Usuário</TableHead>
                  <TableHead className="min-w-[120px]">Plano</TableHead>
                  <TableHead className="min-w-[150px]">Tipo de Usuário</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
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
                      <Select 
                        value={user.subscription || 'free'} 
                        onValueChange={(value) => handleUpdateSubscription(user.id, value)}
                      >
                        <SelectTrigger className="w-full min-w-[120px]">
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
                        onValueChange={(value) => handleUpdateUserType(user.id, value)}
                      >
                        <SelectTrigger className="w-full min-w-[150px]">
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
                      <Badge variant={user.banned ? "destructive" : "secondary"} className="text-xs">
                        {user.banned ? "Banido" : "Ativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
    </div>
  );
};

export default AdminPanel;
