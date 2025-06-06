
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
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { firestoreService } from '../services/firestore';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyOwnerEmail, setNewCompanyOwnerEmail] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Carregando dados do painel admin...');
      
      // Carregar usuários reais do Firebase
      const usersData = await firestoreService.getAllUsers();
      setUsers(usersData);
      
      // Carregar empresas reais do Firebase
      const companiesData = await firestoreService.getAllCompanies();
      setCompanies(companiesData);
      
      console.log('Dados carregados:', { users: usersData.length, companies: companiesData.length });
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

  const handleMakeCompanyOwner = async (userId, userEmail) => {
    try {
      console.log('Tornando usuário company_owner:', userId);
      await firestoreService.updateUserField(userId, 'userType', 'company_owner');
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, userType: 'company_owner' } : user
      ));
      
      toast({
        title: "Sucesso",
        description: "Usuário agora é proprietário de empresa"
      });
    } catch (error) {
      console.error('Erro ao alterar tipo de usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar tipo de usuário",
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
      
      // Encontrar o usuário pelo email
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
      
      // Atualizar tipo do usuário para company_owner
      await firestoreService.updateUserField(owner.id, 'userType', 'company_owner');
      await firestoreService.updateUserField(owner.id, 'companyId', companyId);
      
      setNewCompanyName('');
      setNewCompanyOwnerEmail('');
      await loadData(); // Recarregar dados
      
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
      
      // Encontrar usuário pelo email
      const user = users.find(u => u.email === newAdminEmail);
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado",
          variant: "destructive"
        });
        return;
      }
      
      // Atualizar tipo do usuário para admin
      await firestoreService.updateUserField(user.id, 'userType', 'admin');
      
      toast({
        title: "Sucesso",
        description: "Administrador adicionado com sucesso"
      });
      
      setNewAdminEmail('');
      await loadData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao adicionar admin:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar administrador",
        variant: "destructive"
      });
    }
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
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-sm text-gray-600">Usuários Total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold">{companies.length}</p>
            <p className="text-sm text-gray-600">Empresas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold">{users.filter(u => u.subscription === 'premium').length}</p>
            <p className="text-sm text-gray-600">Usuários Premium</p>
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
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMakeCompanyOwner(user.id, user.email)}
                      >
                        Fazer Owner
                      </Button>
                      
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
                  <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{company.name}</h4>
                      <p className="text-sm text-gray-600">Owner UID: {company.ownerUID}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{company.plan || 'premium'}</Badge>
                        <Badge variant="secondary">{company.colaboradores?.length || 0} membros</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
          <Card>
            <CardHeader>
              <CardTitle>Analytics da Plataforma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Analytics em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
