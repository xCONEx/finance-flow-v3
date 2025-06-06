
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Mail, 
  Plus, 
  UserCheck, 
  Building2,
  Crown,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';

const CompanyDashboard = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [pendingInvites, setPendingInvites] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const { user, agencyData } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    try {
      // Carregar dados da empresa
      console.log('Carregando dados da empresa...');
      
      // Mock data por enquanto
      setTeamMembers([
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@empresa.com',
          role: 'editor',
          joinedAt: '2024-01-15'
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria@empresa.com',
          role: 'viewer',
          joinedAt: '2024-02-01'
        }
      ]);

      setPendingInvites([
        {
          id: '1',
          email: 'novo@empresa.com',
          sentAt: '2024-06-05',
          status: 'pending'
        }
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail) {
      toast({
        title: "Erro",
        description: "Digite um email válido",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Enviando convite para:', inviteEmail);
      
      // Implementar lógica de envio de convite
      const newInvite = {
        id: `invite_${Date.now()}`,
        email: inviteEmail,
        sentAt: new Date().toISOString().split('T')[0],
        status: 'pending'
      };

      setPendingInvites([...pendingInvites, newInvite]);
      setInviteEmail('');

      toast({
        title: "Sucesso",
        description: "Convite enviado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar convite",
        variant: "destructive"
      });
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      console.log('Removendo membro:', memberId);
      
      setTeamMembers(teamMembers.filter(member => member.id !== memberId));
      
      toast({
        title: "Sucesso",
        description: "Membro removido da equipe"
      });
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover membro",
        variant: "destructive"
      });
    }
  };

  const isOwner = user?.userType === 'company_owner';

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Building2 className="text-purple-600" />
          Dashboard da Empresa
        </h2>
        <p className="text-gray-600">
          {agencyData?.name || 'Sua Empresa'} - Gestão de equipe e projetos
        </p>
      </div>

      {/* Estatísticas da Empresa */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold">{teamMembers.length}</p>
            <p className="text-sm text-gray-600">Membros da Equipe</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Mail className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <p className="text-2xl font-bold">{pendingInvites.length}</p>
            <p className="text-sm text-gray-600">Convites Pendentes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-sm font-medium">{isOwner ? 'Proprietário' : 'Membro'}</p>
            <p className="text-xs text-gray-600">Seu Papel</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="invites">Convites</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Membros da Equipe</CardTitle>
              {isOwner && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Convidar Membro
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Convidar Novo Membro</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Email do colaborador"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                      <Button onClick={handleSendInvite} className="w-full">
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Convite
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{member.name}</h4>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{member.role}</Badge>
                        <Badge variant="secondary">Desde {member.joinedAt}</Badge>
                      </div>
                    </div>
                    {isOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Convites Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingInvites.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhum convite pendente</p>
                  </div>
                ) : (
                  pendingInvites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{invite.email}</h4>
                        <p className="text-sm text-gray-600">Enviado em {invite.sentAt}</p>
                        <Badge variant="outline" className="mt-2">
                          {invite.status === 'pending' ? 'Aguardando' : invite.status}
                        </Badge>
                      </div>
                      {isOwner && (
                        <Button variant="outline" size="sm">
                          Reenviar
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyDashboard;
